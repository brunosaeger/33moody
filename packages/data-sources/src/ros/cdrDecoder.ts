import { parse } from '@foxglove/rosmsg';
import { MessageReader } from '@foxglove/rosmsg2-serialization';

/** Transforma os bytes de uma mensagem no objeto JS com os campos da msg ROS 2. */
export type Decoder = (data: ArrayBufferView) => unknown;

/** O que é preciso saber de um tópico para decodificar suas mensagens. */
export interface TopicSchema {
  topic: string;
  /** Codificação das mensagens, ex.: `cdr`. */
  messageEncoding: string;
  /** Formato do esquema, ex.: `ros2msg`. */
  schemaEncoding: string;
  /** Texto do esquema (.msg, já com as dependências concatenadas). */
  schema: string;
}

/**
 * Cria o decodificador de um tópico a partir do ESQUEMA que vem junto com
 * os dados (anunciado pelo foxglove_bridge ou gravado no MCAP).
 * Assim o 33moody decodifica qualquer tipo de mensagem, inclusive as
 * customizadas do robô, sem tabela fixa no código.
 *
 * Suporta CDR com esquema `ros2msg` (o caso comum). Para outros formatos,
 * lança um erro dizendo qual combinação faltou suportar.
 */
export function createDecoder(info: TopicSchema): Decoder {
  if (info.messageEncoding !== 'cdr' || info.schemaEncoding !== 'ros2msg') {
    throw new Error(
      `Formato não suportado em ${info.topic}: encoding "${info.messageEncoding}", esquema "${info.schemaEncoding}"`,
    );
  }
  const reader = new MessageReader(parse(info.schema, { ros2: true }));
  return (data) => reader.readMessage(data);
}
