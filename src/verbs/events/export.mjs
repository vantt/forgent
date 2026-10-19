import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { foldEvents } from '../../state/replay.mjs';
import { eventsContext } from './context.mjs';

export function exportUseCase(ctx, options = {}) {
  if (typeof options.out !== 'string' || !options.out) throw new Error('events export requires --out <dir>');
  const format = options.format ?? 'jsonl';
  if (!['jsonl', 'legacy-layout'].includes(format)) throw new Error('events export format must be jsonl or legacy-layout');
  const { store, heldRanks } = eventsContext(ctx, options);
  const status = store.status(heldRanks);
  const streams = options.stream ? [options.stream] : status.streams.map(row => row.stream);
  const since = typeof options.since === 'string' ? JSON.parse(options.since) : options.since ?? null;
  const out = path.resolve(ctx.cwd ?? ctx.repoRoot, options.out);
  const request = { streams, since, out };
  if (format === 'jsonl') return store.exportJsonl(request, heldRanks);
  const { legacyOrder, v4Order, ...result } = store.exportLegacyLayout(request, heldRanks);
  const legacyView = foldEvents(legacyOrder);
  const v4View = foldEvents(v4Order);
  const differences = [];
  for (const collection of new Set([...Object.keys(legacyView), ...Object.keys(v4View)])) {
    const left = legacyView[collection], right = v4View[collection];
    if (isDeepStrictEqual(left, right)) continue;
    if (left && right && !Array.isArray(left) && !Array.isArray(right) && typeof left === 'object' && typeof right === 'object') {
      for (const id of new Set([...Object.keys(left), ...Object.keys(right)])) if (!isDeepStrictEqual(left[id], right[id])) differences.push({ collection, id, legacy: left[id] ?? null, v4: right[id] ?? null });
    } else if (Array.isArray(left) && Array.isArray(right)) {
      for (let index = 0; index < Math.max(left.length, right.length); index++) {
        if (!isDeepStrictEqual(left[index], right[index])) differences.push({ collection, index, id: left[index]?.id ?? right[index]?.id ?? null, legacy: left[index] ?? null, v4: right[index] ?? null });
      }
    } else differences.push({ collection, legacy: left ?? null, v4: right ?? null });
  }
  const parity = { equal: differences.length === 0, differences, deferred: result.deferred, missing: result.missing };
  fs.writeFileSync(path.join(out, 'parity-report.json'), `${JSON.stringify(parity, null, 2)}\n`, { flag: 'wx' });
  return { ...result, parity };
}
