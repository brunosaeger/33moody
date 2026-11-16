/**
 * Mede a frequência de chegada de mensagens (Hz) numa janela deslizante.
 * Diagnóstico clássico: "o LiDAR deveria estar a 10 Hz e está a 3".
 */
export class RateMeter {
  private readonly stamps: number[] = [];

  constructor(private readonly windowMs = 2000) {}

  /** Registra uma chegada (relógio local, ms). */
  tick(nowMs: number): void {
    this.stamps.push(nowMs);
    this.trim(nowMs);
  }

  /** Frequência atual em Hz (0 se não chegou nada na janela). */
  hz(nowMs: number): number {
    this.trim(nowMs);
    const n = this.stamps.length;
    if (n < 2) return 0;
    const first = this.stamps[0]!;
    const last = this.stamps[n - 1]!;
    return last > first ? ((n - 1) * 1000) / (last - first) : 0;
  }

  private trim(nowMs: number): void {
    const cutoff = nowMs - this.windowMs;
    while (this.stamps.length > 0 && this.stamps[0]! < cutoff) this.stamps.shift();
  }
}
