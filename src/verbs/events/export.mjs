import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { listPorting } from '../../state/porting-store.mjs';
import { isDeepStrictEqual } from 'node:util';
import { foldEvents } from '../../state/replay.mjs';
import { eventsContext } from './context.mjs';

export function exportUseCase(ctx, options = {}) {
  if (typeof options.out !== 'string' || !options.out) throw new Error('events export requires --out <dir>');
  const format = options.format ?? 'jsonl';
  if (!['jsonl', 'legacy-layout'].includes(format)) throw new Error('events export format must be jsonl or legacy-layout');
  const { store, heldRanks, config } = eventsContext(ctx, options);
  const streams = options.stream ? [options.stream] : store.status(heldRanks, config.remote).streams
    .map(row => row.stream).filter(stream => format !== 'legacy-layout' || stream === 'project' || stream.startsWith('project:'));
  const since = typeof options.since === 'string' ? JSON.parse(options.since) : options.since ?? null;
  const out = path.resolve(ctx.cwd ?? ctx.repoRoot, options.out);
  const request = { streams, since, out };
  if (format === 'jsonl') return store.exportJsonl(request, heldRanks);
  const { legacyOrder, v4Order, v4PortingOrder, ...result } = store.exportLegacyLayout(request, heldRanks);
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
  // Use the production porting reader/reducer. It deliberately reads log order,
  // unlike Work's multi-shard (ts, file, seq) ordering.
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-porting-parity-'));
  try {
    fs.mkdirSync(path.join(scratch, 'porting'));
    fs.writeFileSync(path.join(scratch, 'porting/events.jsonl'), v4PortingOrder.map(e => JSON.stringify(e) + '\n').join(''));
    const left = listPorting(out).porting;
    const right = listPorting(scratch).porting;
    for (const id of new Set([...Object.keys(left), ...Object.keys(right)])) {
      if (!isDeepStrictEqual(left[id], right[id])) differences.push({ collection: 'porting', id, legacy: left[id] ?? null, v4: right[id] ?? null });
    }
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
  const parity = { equal: differences.length === 0, differences, deferred: result.deferred, missing: result.missing };
  fs.writeFileSync(path.join(out, 'parity-report.json'), `${JSON.stringify(parity, null, 2)}\n`, { flag: 'wx' });
  return { ...result, parity };
}
