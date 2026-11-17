#!/usr/bin/env node
// Mede uma gravação MCAP por tópico: mensagens, bytes (sem compressão),
// taxa e projeção por hora. Instrumento do caderno de armazenamento
// (docs/CONTEXTO-armazenamento-de-dados.md).
//
// Uso (na raiz do monorepo):
//   node tools/mcap/bag-stats.mjs recordings/tb3-cru/tb3-cru_0.mcap [--top 20]

import { open } from 'node:fs/promises';
import { McapIndexedReader } from '@mcap/core';
import { decompress } from 'fzstd';

const [file, ...rest] = process.argv.slice(2);
if (!file) {
  console.error('uso: node tools/mcap/bag-stats.mjs <arquivo.mcap> [--top N]');
  process.exit(1);
}
const topIdx = rest.indexOf('--top');
const TOP = topIdx >= 0 ? Number(rest[topIdx + 1]) : 25;

const handle = await open(file, 'r');
const { size: fileSize } = await handle.stat();
const readable = {
  size: async () => BigInt(fileSize),
  read: async (offset, length) => {
    const buf = new Uint8Array(Number(length));
    await handle.read(buf, 0, buf.length, Number(offset));
    return buf;
  },
};
const reader = await McapIndexedReader.Initialize({
  readable,
  decompressHandlers: { zstd: (buf, size) => decompress(buf, new Uint8Array(Number(size))) },
});

const byChannel = new Map();
let first = Infinity;
let last = -Infinity;
for await (const msg of reader.readMessages()) {
  const s = byChannel.get(msg.channelId) ?? { count: 0, bytes: 0 };
  s.count++;
  s.bytes += msg.data.byteLength;
  byChannel.set(msg.channelId, s);
  const t = Number(msg.logTime) / 1e9;
  if (t < first) first = t;
  if (t > last) last = t;
}
await handle.close();

const duration = last - first;
const rows = [...byChannel].map(([id, s]) => {
  const ch = reader.channelsById.get(id);
  return { topic: ch.topic, type: reader.schemasById.get(ch.schemaId)?.name ?? '?', ...s };
});
rows.sort((a, b) => b.bytes - a.bytes);
const total = rows.reduce((acc, r) => acc + r.bytes, 0);

const mb = (b) => (b / 1024 ** 2).toFixed(2);
const perHour = (b) => ((b / duration) * 3600) / 1024 ** 2;
const compression = [...new Set([...reader.chunkIndexes].map((c) => c.compression || 'nenhuma'))].join(', ');

console.log(`arquivo: ${file}`);
console.log(`duração: ${duration.toFixed(1)} s | tópicos: ${rows.length} | compressão dos chunks: ${compression}`);
console.log(`no disco: ${mb(fileSize)} MB | mensagens sem compressão: ${mb(total)} MB (${perHour(total).toFixed(0)} MB/h)`);
console.log('');
console.log('tópico'.padEnd(46) + 'msgs'.padStart(8) + 'Hz'.padStart(8) + 'B/msg'.padStart(9) + 'MB/h'.padStart(9) + '   %');
for (const r of rows.slice(0, TOP)) {
  console.log(
    r.topic.padEnd(46) +
      String(r.count).padStart(8) +
      (r.count / duration).toFixed(1).padStart(8) +
      String(Math.round(r.bytes / r.count)).padStart(9) +
      perHour(r.bytes).toFixed(1).padStart(9) +
      ((100 * r.bytes) / total).toFixed(1).padStart(6),
  );
}
if (rows.length > TOP) console.log(`… mais ${rows.length - TOP} tópicos`);
