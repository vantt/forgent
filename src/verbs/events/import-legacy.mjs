import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { withMainState } from '../../state/runtime-coordination.mjs';
import { prepareWorkStore, readWorkState } from '../../state/work-event-store.mjs';

const refusal = (message) => Object.assign(new Error(message), { code: 'validation', category: 'validation' });
const TYPES = new Set(JSON.parse(fs.readFileSync(new URL('../../../packages/work-state/contracts/event-streams.v1.json', import.meta.url))).types.map(t => t.type));

/** The identity of a historical line: its own hash when it carries one, else its parsed form. */
const lineKey = (event) => (typeof event.h === 'string' ? `h:${event.h}` : `e:${JSON.stringify(event)}`);

/**
 * Which parsed lines of a legacy file to replay against the imported `history` (`{ events, view }`): a line already
 * there (same hash, or the same event when it has none) and a `work.add` of an existing item are skipped by reason.
 */
export function planLegacyImport(entries, history) {
  const known = new Set(history.events.map(lineKey));
  const items = new Set(Object.keys(history.view.work ?? {}));
  const skipped = [];
  const kept = [];
  for (const entry of entries) {
    if (known.has(lineKey(entry.event))) skipped.push({ line: entry.line, type: entry.event.type, reason: 'already-in-history' });
    else if (entry.event.type === 'work.add' && items.has(entry.event.payload.id)) skipped.push({ line: entry.line, type: entry.event.type, reason: 'item-exists' });
    else {
      kept.push(entry);
      if (entry.event.type === 'work.add') items.add(entry.event.payload.id);
    }
  }
  return { kept, skipped };
}

/**
 * Replay one legacy event file that never reached a commit (a shard left untracked when the clone cut over) into
 * the Work stream through the ordinary Work write door, in one transaction, keeping each event's type, payload and
 * original time. A line already in the imported history, and a `work.add` of an item that already exists, is skipped
 * and named; anything else the fold or the store refuses fails the whole file. A receipt beside the file
 * (`<file>.imported.json`) records the result, and a file with a receipt is refused. `check` reports without writing.
 */
export function importLegacyUseCase(ctx, { file, check = false } = {}) {
  if (typeof file !== 'string' || !file) throw refusal('events import-legacy requires --file <legacy event file>');
  const source = path.resolve(ctx.cwd, file);
  const receipt = `${source}.imported.json`;
  if (fs.existsSync(receipt)) throw refusal(`${source} was already imported (${receipt})`);
  const bytes = fs.readFileSync(source);
  const lines = bytes.toString('utf8').split('\n').filter(line => line.trim());
  const events = lines.map((line, index) => {
    let event;
    try { event = JSON.parse(line); } catch { throw refusal(`${source}:${index + 1} is not JSON`); }
    if (!event || typeof event !== 'object' || typeof event.type !== 'string' || typeof event.ts !== 'string'
      || !event.payload || typeof event.payload !== 'object') throw refusal(`${source}:${index + 1} is not a legacy event`);
    // The Work door keeps an imported time only when it is an exact ISO time, so --check refuses the same lines.
    if (Number.isNaN(Date.parse(event.ts)) || new Date(event.ts).toISOString() !== event.ts) throw refusal(`${source}:${index + 1} has ts ${event.ts}, which is not an exact ISO time`);
    if (!TYPES.has(event.type)) throw refusal(`${source}:${index + 1} has type ${event.type}, which the Work stream does not register`);
    return { line: index + 1, event };
  });
  const fgosDir = path.join(ctx.trustedMain, '.fgos');
  const { store } = prepareWorkStore(fgosDir, fgosDir);
  const history = readWorkState(store, { rebuild: true });
  const { kept, skipped } = planLegacyImport(events, history);
  const result = { file: source, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), lines: events.length, imported: kept.length, skipped };
  if (check || kept.length === 0) return { ...result, check: !!check };
  withMainState(fgosDir, tx => {
    for (const { event } of kept) tx.append({ type: event.type, payload: event.payload, ts: event.ts });
  });
  fs.writeFileSync(receipt, `${JSON.stringify({ ...result, importedAt: new Date().toISOString() }, null, 2)}\n`, { flag: 'wx' });
  return result;
}
