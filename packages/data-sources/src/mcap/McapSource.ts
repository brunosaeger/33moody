import { McapIndexedReader } from '@mcap/core';
import type { IReadable } from '@mcap/core';
import { decompress as zstdDecompress } from 'fzstd';
import { ListenerRegistry } from '../core/ListenerRegistry';
import { createDecoder, type Decoder } from '../ros/cdrDecoder';
import type {
  DataSource,
  MessageEvent,
  MessageListener,
  TimeSpan,
  TopicInfo,
  TopicsListener,
  Unsubscribe,
} from '../types';
import { TopicTrack } from './TopicTrack';

/** Acima disso o arquivo inteiro na memória do navegador fica arriscado. */
const MAX_FILE_BYTES = 1.5 * 1024 ** 3;

/** IReadable do @mcap/core sobre um arquivo já carregado na memória. */
function memoryReadable(bytes: Uint8Array): IReadable {
  return {
    size: async () => BigInt(bytes.byteLength),
    read: async (offset, size) => bytes.subarray(Number(offset), Number(offset + size)),
  };
}

/** O rosbag2 comprime os chunks do MCAP com zstd (perfis `zstd_fast`/`zstd_small`). */
const DECOMPRESS_HANDLERS = {
  zstd: (buffer: Uint8Array, decompressedSize: bigint) =>
    zstdDecompress(buffer, new Uint8Array(Number(decompressedSize))),
};

/** ns (bigint, como no MCAP) → ms Unix. */
const nsToMs = (ns: bigint) => Number(ns) / 1e6;

/** Estatística de um tópico gravado (alimenta o caderno de armazenamento). */
export interface TrackStats {
  topic: string;
  schemaName: string;
  messages: number;
  bytes: number;
}

/**
 * REPLAY de uma gravação MCAP (o formato do `ros2 bag record -s mcap`).
 *
 *   arquivo .mcap ──▶ McapSource ──▶ timeline (replay) ──▶ UI
 *
 * Como funciona:
 * 1. Lê o arquivo para a memória e percorre as mensagens em ordem de tempo,
 *    separando por tópico só os BYTES (`TopicTrack`).
 * 2. `messageAt(tópico, t)` acha a última mensagem até t por busca binária
 *    e decodifica só ela (com cache).
 * 3. O eixo do tempo é o `logTime` do MCAP: o relógio de PAREDE de quando
 *    a mensagem foi gravada. O `header.stamp` (que pode ser tempo de
 *    simulação) continua dentro da mensagem, para o TF e os sensores.
 *
 * Não tem "ao vivo": `subscribe` aceita listeners, mas nunca emite.
 */
export class McapSource implements DataSource {
  readonly id: string;
  readonly label: string;

  private readonly registry = new ListenerRegistry();
  private readonly tracks = new Map<string, TopicTrack>();
  private span: TimeSpan = { startMs: 0, endMs: 0 };

  constructor(private readonly file: Blob & { name?: string }) {
    this.label = file.name ?? 'gravação.mcap';
    this.id = `mcap:${this.label}`;
  }

  async start(): Promise<void> {
    if (this.file.size > MAX_FILE_BYTES) {
      throw new Error(`Arquivo grande demais para abrir no navegador (${formatBytes(this.file.size)}).`);
    }
    const bytes = new Uint8Array(await this.file.arrayBuffer());

    let reader: McapIndexedReader;
    try {
      reader = await McapIndexedReader.Initialize({ readable: memoryReadable(bytes), decompressHandlers: DECOMPRESS_HANDLERS });
    } catch (err) {
      throw new Error(`Não foi possível ler ${this.label} como MCAP: ${err instanceof Error ? err.message : err}`);
    }

    // Uma trilha por canal. Tópicos com formato não suportado aparecem na
    // lista, mas sem conteúdo decodificado (avisado uma vez no console).
    const trackByChannel = new Map<number, TopicTrack>();
    for (const channel of reader.channelsById.values()) {
      const schema = reader.schemasById.get(channel.schemaId);
      let decoder: Decoder | null = null;
      try {
        decoder = createDecoder({
          topic: channel.topic,
          messageEncoding: channel.messageEncoding,
          schemaEncoding: schema?.encoding ?? '',
          schema: schema ? new TextDecoder().decode(schema.data) : '',
        });
      } catch (err) {
        console.warn(`[33moody] ${channel.topic} não será decodificado:`, err);
      }
      const track = this.tracks.get(channel.topic) ?? new TopicTrack(channel.topic, schema?.name ?? '?', decoder);
      this.tracks.set(channel.topic, track);
      trackByChannel.set(channel.id, track);
    }

    let first = Infinity;
    let last = -Infinity;
    for await (const msg of reader.readMessages()) {
      const t = nsToMs(msg.logTime);
      trackByChannel.get(msg.channelId)?.push(t, msg.data);
      if (t < first) first = t;
      if (t > last) last = t;
    }
    if (!Number.isFinite(first)) throw new Error(`${this.label} não tem mensagens.`);
    this.span = { startMs: first, endMs: last };

    const topics: TopicInfo[] = [...this.tracks.values()]
      .map((t) => ({ name: t.topic, schemaName: t.schemaName }))
      .sort((a, b) => a.name.localeCompare(b.name));
    this.registry.setTopics(topics);
  }

  stop(): void {
    this.registry.clear();
    this.tracks.clear();
  }

  topics(): readonly TopicInfo[] {
    return this.registry.topics;
  }

  onTopicsChange(listener: TopicsListener): Unsubscribe {
    return this.registry.onTopicsChange(listener);
  }

  /** Gravação não tem "ao vivo": aceita o listener, mas nada chega por aqui. */
  subscribe(topic: string, listener: MessageListener): Unsubscribe {
    return this.registry.subscribe(topic, listener);
  }

  recordedRange(): TimeSpan {
    return this.span;
  }

  messageAt(topic: string, timeMs: number): MessageEvent | undefined {
    const track = this.tracks.get(topic);
    if (!track) return undefined;
    const i = track.lastIndexAtOrBefore(timeMs);
    return i < 0 ? undefined : this.eventAt(track, i);
  }

  messagesInRange(topic: string, startMs: number, endMs: number): MessageEvent[] {
    const track = this.tracks.get(topic);
    if (!track) return [];
    const out: MessageEvent[] = [];
    // Primeiro índice com tempo >= startMs.
    let i = track.lastIndexAtOrBefore(startMs);
    if (i < 0 || track.timeAt(i) < startMs) i++;
    for (; i < track.count && track.timeAt(i) <= endMs; i++) {
      const event = this.eventAt(track, i);
      if (event) out.push(event);
    }
    return out;
  }

  /** Mensagens e bytes por tópico, do maior para o menor. */
  stats(): TrackStats[] {
    return [...this.tracks.values()]
      .map((t) => ({ topic: t.topic, schemaName: t.schemaName, messages: t.count, bytes: t.bytes }))
      .sort((a, b) => b.bytes - a.bytes);
  }

  private eventAt(track: TopicTrack, index: number): MessageEvent | undefined {
    const message = track.decode(index);
    if (message === undefined) return undefined;
    return { topic: track.topic, schemaName: track.schemaName, timeMs: track.timeAt(index), message };
  }
}

function formatBytes(n: number): string {
  return n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : `${(n / 1024 ** 2).toFixed(0)} MB`;
}
