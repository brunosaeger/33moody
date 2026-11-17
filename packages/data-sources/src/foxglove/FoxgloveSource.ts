import {
  FoxgloveClient,
  type Channel,
  type ChannelId,
  type IWebSocket,
  type MessageData,
  type SubscriptionId,
} from '@foxglove/ws-protocol';
import { ListenerRegistry } from '../core/ListenerRegistry';
import type {
  DataSource,
  MessageEvent,
  MessageListener,
  StatusListener,
  TopicInfo,
  TopicsListener,
  Unsubscribe,
} from '../types';
import { createDecoder, type Decoder } from './channelDecoder';

/** Porta padrão do foxglove_bridge. */
export const DEFAULT_FOXGLOVE_URL = 'ws://localhost:8765';

/**
 * Subprotocolos oferecidos no handshake; o servidor escolhe um.
 * - `foxglove.sdk.v1`: foxglove_bridge 3.x (feito sobre o Foxglove SDK) só aceita este.
 * - `foxglove.websocket.v1`: bridges mais antigos.
 * As mensagens são as mesmas nos dois.
 */
const SUBPROTOCOLS = ['foxglove.sdk.v1', FoxgloveClient.SUPPORTED_SUBPROTOCOL];

/** Sem resposta do bridge em tanto tempo, a conexão é dada como falha. */
const CONNECT_TIMEOUT_MS = 5000;

interface ChannelEntry {
  channel: Channel;
  /** Criado só na primeira mensagem: tópico não assinado não custa nada. */
  decoder?: Decoder;
  /** Erro ao criar o decodificador ou ao decodificar (avisado uma vez só). */
  failed?: boolean;
}

/**
 * Robô AO VIVO via foxglove_bridge (WebSocket, protocolo Foxglove).
 *
 *   ROS 2 (DDS) ──▶ foxglove_bridge ──WebSocket──▶ FoxgloveSource ──▶ UI
 *
 * Como funciona:
 * 1. Ao conectar, o bridge manda `serverInfo` e depois ANUNCIA os canais
 *    (um por tópico), cada um com o tipo e o ESQUEMA da mensagem.
 * 2. A UI assina um tópico → pedimos ao bridge para assinar aquele canal.
 *    Vários componentes no mesmo tópico compartilham UMA assinatura.
 * 3. As mensagens chegam em binário (CDR, o formato nativo do ROS 2) e são
 *    decodificadas aqui com o esquema anunciado.
 *
 * Só ao vivo: não guarda histórico, então não implementa `messageAt`.
 */
export class FoxgloveSource implements DataSource {
  readonly id: string;
  readonly label: string;

  private readonly registry = new ListenerRegistry();
  private readonly statusListeners = new Set<StatusListener>();
  private client: FoxgloveClient | null = null;
  private stopped = false;

  private readonly channelsById = new Map<ChannelId, ChannelEntry>();
  private readonly channelByTopic = new Map<string, ChannelEntry>();
  /** Assinatura no bridge por tópico (uma só, compartilhada pelos listeners). */
  private readonly subscriptionByTopic = new Map<string, { id: SubscriptionId; channelId: ChannelId }>();
  private readonly topicBySubscription = new Map<SubscriptionId, string>();
  /**
   * Última mensagem de cada tópico assinado. Quem assina depois recebe a
   * última na hora, como num tópico "latched" (ex.: /map, que só é
   * publicado de vez em quando).
   */
  private readonly lastEvent = new Map<string, MessageEvent>();

  constructor(readonly url: string) {
    this.id = url;
    this.label = hostOf(url);
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.client?.close();
        this.client = null;
        reject(new Error(message));
      };

      let client: FoxgloveClient;
      try {
        const ws = new WebSocket(this.url, SUBPROTOCOLS);
        // O WebSocket do navegador cumpre o IWebSocket da lib; o cast só
        // contorna uma diferença de tipos de ArrayBuffer entre as versões do TS.
        client = new FoxgloveClient({ ws: ws as unknown as IWebSocket });
      } catch {
        fail(`Endereço inválido: ${this.url} (use o formato ws://host:porta)`);
        return;
      }
      this.client = client;
      timer = setTimeout(() => fail(`Sem resposta de ${this.url}. O foxglove_bridge está rodando?`), CONNECT_TIMEOUT_MS);

      client.on('serverInfo', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });
      client.on('close', () => {
        if (!settled) {
          fail(`Não foi possível conectar a ${this.url}. O foxglove_bridge está rodando?`);
        } else if (!this.stopped) {
          this.emitStatus({ state: 'closed', reason: `A conexão com ${this.label} caiu.` });
        }
      });
      client.on('advertise', (channels) => this.handleAdvertise(channels));
      client.on('unadvertise', (ids) => this.handleUnadvertise(ids));
      client.on('message', (event) => this.handleMessage(event));
    });
  }

  stop(): void {
    this.stopped = true;
    this.client?.close();
    this.client = null;
    this.registry.clear();
    this.statusListeners.clear();
    this.channelsById.clear();
    this.channelByTopic.clear();
    this.subscriptionByTopic.clear();
    this.topicBySubscription.clear();
    this.lastEvent.clear();
  }

  topics(): readonly TopicInfo[] {
    return this.registry.topics;
  }

  onTopicsChange(listener: TopicsListener): Unsubscribe {
    return this.registry.onTopicsChange(listener);
  }

  onStatusChange(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  subscribe(topic: string, listener: MessageListener): Unsubscribe {
    const unsubscribe = this.registry.subscribe(topic, listener);
    this.ensureSubscribed(topic);

    let active = true;
    const last = this.lastEvent.get(topic);
    if (last) queueMicrotask(() => active && listener(last));

    return () => {
      active = false;
      unsubscribe();
      if (!this.registry.hasSubscribers(topic)) this.releaseSubscription(topic);
    };
  }

  // --- assinaturas no bridge ---

  /** Assina no bridge se alguém quer o tópico e ele já foi anunciado. */
  private ensureSubscribed(topic: string): void {
    if (!this.client || this.subscriptionByTopic.has(topic)) return;
    const entry = this.channelByTopic.get(topic);
    // Ainda não anunciado: fica pendente e assina quando o canal aparecer.
    if (!entry) return;
    const id = this.client.subscribe(entry.channel.id);
    this.subscriptionByTopic.set(topic, { id, channelId: entry.channel.id });
    this.topicBySubscription.set(id, topic);
  }

  private releaseSubscription(topic: string): void {
    const sub = this.subscriptionByTopic.get(topic);
    if (sub) {
      this.client?.unsubscribe(sub.id);
      this.subscriptionByTopic.delete(topic);
      this.topicBySubscription.delete(sub.id);
    }
    this.lastEvent.delete(topic);
  }

  // --- eventos do bridge ---

  private handleAdvertise(channels: Channel[]): void {
    for (const channel of channels) {
      const entry: ChannelEntry = { channel };
      this.channelsById.set(channel.id, entry);
      this.channelByTopic.set(channel.topic, entry);
    }
    this.publishTopicList();
    for (const channel of channels) {
      if (this.registry.hasSubscribers(channel.topic)) this.ensureSubscribed(channel.topic);
    }
  }

  private handleUnadvertise(ids: ChannelId[]): void {
    for (const id of ids) {
      const entry = this.channelsById.get(id);
      if (!entry) continue;
      this.channelsById.delete(id);
      const { topic } = entry.channel;
      if (this.channelByTopic.get(topic) === entry) this.channelByTopic.delete(topic);
      // O bridge já descartou a assinatura desse canal.
      const sub = this.subscriptionByTopic.get(topic);
      if (sub?.channelId === id) {
        this.subscriptionByTopic.delete(topic);
        this.topicBySubscription.delete(sub.id);
      }
    }
    this.publishTopicList();
  }

  private handleMessage(event: MessageData): void {
    const topic = this.topicBySubscription.get(event.subscriptionId);
    const entry = topic === undefined ? undefined : this.channelByTopic.get(topic);
    if (topic === undefined || !entry || entry.failed) return;

    let message: unknown;
    try {
      entry.decoder ??= createDecoder(entry.channel);
      message = entry.decoder(event.data);
    } catch (err) {
      entry.failed = true;
      console.warn(`[33moody] não foi possível decodificar ${topic}:`, err);
      return;
    }

    const messageEvent: MessageEvent = {
      topic,
      schemaName: entry.channel.schemaName,
      // Relógio da timeline = chegada no navegador (ver MessageEvent.timeMs).
      timeMs: Date.now(),
      message,
    };
    this.lastEvent.set(topic, messageEvent);
    this.registry.emit(messageEvent);
  }

  private publishTopicList(): void {
    const topics = [...this.channelByTopic.values()]
      .map(({ channel }) => ({ name: channel.topic, schemaName: channel.schemaName }))
      .sort((a, b) => a.name.localeCompare(b.name));
    this.registry.setTopics(topics);
  }

  private emitStatus(status: Parameters<StatusListener>[0]): void {
    for (const l of this.statusListeners) l(status);
  }
}

/** `ws://10.8.0.12:8765/` → `10.8.0.12:8765`, para exibir na UI. */
function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}
