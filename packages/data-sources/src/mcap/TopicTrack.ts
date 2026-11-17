import type { Decoder } from '../ros/cdrDecoder';

/** Quantas mensagens decodificadas cada tópico mantém em cache. */
const DECODED_CACHE_SIZE = 2048;

/**
 * Todas as mensagens gravadas de UM tópico, em ordem de tempo.
 *
 * Guarda só os BYTES (como vieram do arquivo) e decodifica sob demanda:
 * decodificar tudo de uma vez custaria memória e tempo à toa, porque no
 * replay só se olha a vizinhança do cursor. As últimas decodificações
 * ficam em cache, já que o cursor anda pouco de um quadro para o outro.
 */
export class TopicTrack {
  /** Instante de gravação (logTime) de cada mensagem, em ms Unix. */
  private readonly times: number[] = [];
  private readonly data: Uint8Array[] = [];
  private readonly cache = new Map<number, unknown>();
  /** Total de bytes gravados (para estatística de armazenamento). */
  bytes = 0;

  constructor(
    readonly topic: string,
    readonly schemaName: string,
    private readonly decoder: Decoder | null,
  ) {}

  get count(): number {
    return this.times.length;
  }

  /** Acrescenta uma mensagem. Chamadas devem vir em ordem de tempo. */
  push(timeMs: number, bytes: Uint8Array): void {
    this.times.push(timeMs);
    this.data.push(bytes);
    this.bytes += bytes.byteLength;
  }

  timeAt(index: number): number {
    return this.times[index]!;
  }

  /** Índice da última mensagem com tempo <= t, ou -1 (busca binária). */
  lastIndexAtOrBefore(t: number): number {
    let lo = 0;
    let hi = this.times.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.times[mid]! <= t) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  }

  /** Mensagem decodificada do índice (undefined se o tópico não é decodificável). */
  decode(index: number): unknown {
    if (!this.decoder) return undefined;
    const hit = this.cache.get(index);
    if (hit !== undefined) return hit;
    const message = this.decoder(this.data[index]!);
    if (this.cache.size >= DECODED_CACHE_SIZE) {
      // Descarta a entrada mais antiga (Map mantém a ordem de inserção).
      this.cache.delete(this.cache.keys().next().value!);
    }
    this.cache.set(index, message);
    return message;
  }
}
