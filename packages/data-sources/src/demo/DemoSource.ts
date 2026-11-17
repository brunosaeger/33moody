import { ListenerRegistry } from '../core/ListenerRegistry';
import type {
  DataSource,
  MessageEvent,
  MessageListener,
  TopicInfo,
  TopicsListener,
  Unsubscribe,
} from '../types';
import { agitate } from './agitation';
import { demoStateAt } from './demoRobot';
import { hashString, randomNoise, scaledNoise, seededNoise } from './noise';
import { demoTopics, type DemoTopic } from './topics';

/** Frequência do relógio interno. Os tópicos publicam em múltiplos dela. */
const TICK_MS = 10;

/** Intensidade do ruído: baixa ao vivo (robô "em regime"), alta no replay (demonstração). */
const LIVE_NOISE_SCALE = 0.5;
const REPLAY_NOISE_SCALE = 4;

/**
 * Robô sintético que publica tópicos com formato ROS2 real
 * (bateria, odometria, cmd_vel, IMU, LiDAR).
 *
 * - AO VIVO: publica pelo relógio do navegador, com variação pequena.
 * - REPLAY (`messageAt`): reconstrói a mensagem de qualquer instante passado,
 *   com "agitação" artificial para a variação ficar visível ao arrastar o
 *   cursor. É determinístico: o mesmo instante sempre dá a mesma mensagem.
 */
export class DemoSource implements DataSource {
  readonly id = 'demo';
  readonly label = 'Robô demo';

  private readonly registry = new ListenerRegistry();
  private readonly topicList: readonly TopicInfo[];
  private readonly byName: ReadonlyMap<string, DemoTopic>;
  private readonly liveNoise = scaledNoise(randomNoise, LIVE_NOISE_SCALE);
  private timer: ReturnType<typeof setInterval> | undefined;
  /** Instante de referência (t = 0) da trajetória do robô. */
  private readonly epochMs = Date.now();
  /** Próximo instante (epoch ms) em que cada tópico deve publicar. */
  private readonly nextPublish = new Map<DemoTopic, number>();

  constructor(private readonly topicDefs: readonly DemoTopic[] = demoTopics) {
    this.topicList = topicDefs.map(({ name, schemaName }) => ({ name, schemaName }));
    this.byName = new Map(topicDefs.map((d) => [d.name, d]));
  }

  async start(): Promise<void> {
    if (this.timer) return;
    const now = Date.now();
    for (const def of this.topicDefs) this.nextPublish.set(def, now);
    this.registry.setTopics(this.topicList);
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.nextPublish.clear();
    this.registry.clear();
  }

  topics(): readonly TopicInfo[] {
    return this.registry.topics;
  }

  onTopicsChange(listener: TopicsListener): Unsubscribe {
    return this.registry.onTopicsChange(listener);
  }

  subscribe(topic: string, listener: MessageListener): Unsubscribe {
    const unsubscribe = this.registry.subscribe(topic, listener);
    // Latched: entrega a mensagem atual logo após assinar (fora da pilha atual).
    const def = this.byName.get(topic);
    if (def?.latched && this.timer) {
      queueMicrotask(() => {
        const now = Date.now();
        const state = demoStateAt((now - this.epochMs) / 1000);
        listener({ topic, schemaName: def.schemaName, timeMs: now, message: def.build(state, now, this.liveNoise) });
      });
    }
    return unsubscribe;
  }

  messageAt(topic: string, timeMs: number): MessageEvent | undefined {
    const def = this.byName.get(topic);
    if (!def || timeMs > Date.now()) return undefined; // futuro não tem dado

    // Instante da última publicação até timeMs (respeita a frequência do tópico).
    const period = 1000 / def.rateHz;
    const stamp = Math.floor(timeMs / period) * period;

    const t = (stamp - this.epochMs) / 1000;
    const state = agitate(demoStateAt(t), t);
    const noise = scaledNoise(seededNoise(hashString(topic) ^ Math.floor(stamp)), REPLAY_NOISE_SCALE);

    return { topic, schemaName: def.schemaName, timeMs: stamp, message: def.build(state, stamp, noise) };
  }

  neighborMessageTime(topic: string, timeMs: number, direction: 1 | -1): number | undefined {
    const def = this.byName.get(topic);
    if (!def) return undefined;
    // O demo publica em instantes múltiplos do período (ver messageAt).
    const period = 1000 / def.rateHz;
    const t = (Math.floor(timeMs / period) + direction) * period;
    return t > Date.now() ? undefined : t;
  }

  private tick(): void {
    const now = Date.now();
    const state = demoStateAt((now - this.epochMs) / 1000);

    for (const def of this.topicDefs) {
      const due = this.nextPublish.get(def) ?? now;
      if (now < due) continue;
      const period = 1000 / def.rateHz;
      // Se atrasou mais de um período (aba em segundo plano desacelera o
      // setInterval), realinha em vez de publicar uma rajada para "compensar".
      const next = due + period;
      this.nextPublish.set(def, next < now ? now + period : next);
      // Sem assinantes, nem monta a mensagem (o scan tem 360 raycasts).
      if (!this.registry.hasSubscribers(def.name)) continue;
      this.registry.emit({
        topic: def.name,
        schemaName: def.schemaName,
        timeMs: now,
        message: def.build(state, now, this.liveNoise),
      });
    }
  }
}
