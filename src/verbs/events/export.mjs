import fs from 'node:fs';
import path from 'node:path';
import { parseEventLines } from '../../state/event-log.mjs';
import { foldPortingEvents } from '../../state/porting-store.mjs';
import { isDeepStrictEqual } from 'node:util';
import { foldEvents } from '../../state/replay.mjs';
import { entityDifferences } from './parity.mjs';
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
  const differences = entityDifferences(legacyView, v4View);
  // The physical order of the frozen legacy layout and the v4 order both feed the consumer's own
  // porting reducer; unlike Work's multi-shard (ts, file, seq) ordering it reads log order.
  const logs = result.files.filter(p => p.startsWith('porting/') && p.endsWith('/events.jsonl'));
  const legacyPorting = logs.filter(p => p !== 'porting/events.jsonl').concat(logs.includes('porting/events.jsonl') ? ['porting/events.jsonl'] : [])
    .flatMap(file => parseEventLines(fs.readFileSync(path.join(out, file), 'utf8'), file));
  const left = foldPortingEvents(legacyPorting).porting;
  const right = foldPortingEvents(v4PortingOrder).porting;
  for (const id of new Set([...Object.keys(left), ...Object.keys(right)])) {
    if (!isDeepStrictEqual(left[id], right[id])) differences.push({ collection: 'porting', id, legacy: left[id] ?? null, v4: right[id] ?? null });
  }
  const parity = { equal: differences.length === 0, differences, deferred: result.deferred, missing: result.missing };
  fs.writeFileSync(path.join(out, 'parity-report.json'), `${JSON.stringify(parity, null, 2)}\n`, { flag: 'wx' });
  return { ...result, parity };
}
