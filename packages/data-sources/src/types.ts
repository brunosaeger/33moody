/**
 * Contrato comum de TODAS as fontes de dados do 33moody.
 *
 * O viewer (viewport, janelas, gráficos) só conversa com esta interface.
 * Robô ao vivo (foxglove_bridge), replay (pacote do historian) e demo são
 * implementações diferentes do mesmo contrato. Trocar de fonte não mexe
 * na UI.
 */

export type Unsubscribe = () => void;

/** Um tópico ROS disponível na fonte. */
export interface TopicInfo {
  /** Nome completo, ex.: `/battery_state`. */
  name: string;
  /** Tipo da mensagem no formato ROS2, ex.: `sensor_msgs/msg/BatteryState`. */
  schemaName: string;
}

/** Uma mensagem recebida num tópico. */
export interface MessageEvent<T = unknown> {
  topic: string;
  schemaName: string;
  /**
   * Instante da mensagem em milissegundos desde a época Unix, no relógio
   * da TIMELINE.
   * - Fontes ao vivo: o instante em que a mensagem chegou ao navegador.
   *   NÃO usamos o `header.stamp`, porque o relógio do robô pode ser o da
   *   simulação (começa em 0) ou estar fora de sincronia com o computador.
   *   O stamp original continua dentro de `message.header`.
   * - Fontes gravadas (demo, MCAP, historian): o instante gravado.
   */
  timeMs: number;
  /** A mensagem decodificada, como objeto JS com os mesmos campos da msg ROS. */
  message: T;
}

export type MessageListener = (event: MessageEvent) => void;

/**
 * Estado da conexão de uma fonte, depois do `start()`.
 * - `connected`: recebendo dados normalmente.
 * - `closed`: a conexão caiu sozinha (robô desligou, rede caiu…).
 *   Não é emitido quando a própria UI chama `stop()`.
 */
export type SourceStatus = { state: 'connected' } | { state: 'closed'; reason: string };
export type StatusListener = (status: SourceStatus) => void;
export type TopicsListener = (topics: readonly TopicInfo[]) => void;

export interface DataSource {
  /** Identificador estável da fonte, ex.: `demo`, `ws://10.8.0.12:8765`. */
  readonly id: string;
  /** Nome legível para a UI, ex.: `Robô demo`. */
  readonly label: string;

  /** Inicia a fonte (abre a conexão, inicia o relógio…). */
  start(): Promise<void>;
  /** Para a fonte e libera os recursos. Os listeners deixam de ser chamados. */
  stop(): void;

  /**
   * Tópicos disponíveis no momento.
   * Deve devolver a MESMA referência de array enquanto a lista não mudar
   * (o React depende disso para não re-renderizar à toa).
   */
  topics(): readonly TopicInfo[];
  onTopicsChange(listener: TopicsListener): Unsubscribe;

  /** Passa a receber as mensagens de um tópico. */
  subscribe(topic: string, listener: MessageListener): Unsubscribe;

  /**
   * (Opcional) Avisa mudanças no estado da conexão. Fontes locais (demo)
   * nunca caem e não implementam.
   */
  onStatusChange?(listener: StatusListener): Unsubscribe;

  /**
   * REPLAY (opcional): a última mensagem do tópico publicada até `timeMs`,
   * ou undefined se não houver dado para aquele instante.
   * Fontes que não guardam histórico simplesmente não implementam.
   */
  messageAt?(topic: string, timeMs: number): MessageEvent | undefined;
}

/** A fonte sabe responder "qual era a mensagem no instante t"? */
export function supportsReplay(
  source: DataSource,
): source is DataSource & Required<Pick<DataSource, 'messageAt'>> {
  return typeof source.messageAt === 'function';
}
