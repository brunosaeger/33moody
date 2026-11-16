import type { MessageEvent, MessageListener, TopicInfo, TopicsListener, Unsubscribe } from '../types';

/**
 * Parte comum a toda fonte de dados: guardar quem assina cada tópico,
 * avisar mudanças na lista de tópicos e entregar mensagens.
 * As implementações de DataSource usam isto por composição.
 */
export class ListenerRegistry {
  private readonly byTopic = new Map<string, Set<MessageListener>>();
  private readonly topicsListeners = new Set<TopicsListener>();
  private currentTopics: readonly TopicInfo[] = [];

  // --- lista de tópicos ---

  get topics(): readonly TopicInfo[] {
    return this.currentTopics;
  }

  setTopics(topics: readonly TopicInfo[]): void {
    this.currentTopics = topics;
    for (const l of this.topicsListeners) l(topics);
  }

  onTopicsChange(listener: TopicsListener): Unsubscribe {
    this.topicsListeners.add(listener);
    return () => this.topicsListeners.delete(listener);
  }

  // --- mensagens ---

  subscribe(topic: string, listener: MessageListener): Unsubscribe {
    let set = this.byTopic.get(topic);
    if (!set) {
      set = new Set();
      this.byTopic.set(topic, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.byTopic.delete(topic);
    };
  }

  /** Há alguém assinando? Permite não gerar ou decodificar mensagem à toa. */
  hasSubscribers(topic: string): boolean {
    return this.byTopic.has(topic);
  }

  emit(event: MessageEvent): void {
    const set = this.byTopic.get(event.topic);
    if (!set) return;
    for (const l of set) l(event);
  }

  clear(): void {
    this.byTopic.clear();
    this.topicsListeners.clear();
    this.currentTopics = [];
  }
}
