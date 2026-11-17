import { parse } from '@foxglove/rosmsg';
import { MessageReader } from '@foxglove/rosmsg2-serialization';
import type { Channel } from '@foxglove/ws-protocol';

/** Transforma os bytes de uma mensagem no objeto JS com os campos da msg ROS 2. */
export type Decoder = (data: ArrayBufferView) => unknown;

/**
 * Cria o decodificador de um canal a partir do ESQUEMA que o foxglove_bridge
 * anuncia (o texto do .msg, já com as dependências concatenadas).
 * Assim o 33moody decodifica qualquer tipo de mensagem, inclusive as
 * customizadas do robô, sem tabela fixa no código.
 *
 * Suporta CDR com esquema `ros2msg` (o caso comum). Para outros formatos,
 * devolve um erro explicando qual encoding faltou suportar.
 */
export function createDecoder(channel: Channel): Decoder {
  const schemaEncoding = channel.schemaEncoding ?? 'ros2msg';
  if (channel.encoding !== 'cdr' || schemaEncoding !== 'ros2msg') {
    throw new Error(
      `Formato não suportado em ${channel.topic}: encoding "${channel.encoding}", esquema "${schemaEncoding}"`,
    );
  }
  const reader = new MessageReader(parse(channel.schema, { ros2: true }));
  return (data) => reader.readMessage(data);
}
