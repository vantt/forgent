// replay.mjs — fold the event log into the current state view (per D3: the
// view is always rebuildable from the log, never the truth itself).
//
// PURE: no fs import for writing, no Date.now() anywhere in the fold logic —
// every timestamp in the resulting view comes from the event's own `ts`
// field. `rebuildView` reads the log through `readEvents` (events.mjs), the
// one read path shared with the rest of the state layer; it does not write.
//
// Deterministic: folding the same ordered event array (or rebuilding from
// the same log) twice always yields deep-equal views.

import { readEvents } from './events.mjs';
import { DEFAULTS } from './work.mjs';

/**
 * Fold an ordered array of events (as returned by `readEvents`) into a state
 * view: `{ work: { [id]: workItem }, decisions: [...] }`. Unknown event
 * types are ignored rather than rejected, so the log can grow new event
 * types over time without breaking replay of older logs.
 *
 * Backward-compat (per D7b): a pre-Phase-2 `work.add` payload carries no
 * `tier` at all (absence of the field, same signal `v` uses — see
 * work.mjs's SCHEMA_VERSION doc). Folding applies `DEFAULTS` from work.mjs
 * — the single declared source — for any field missing on the payload, so
 * old and new logs (and a log mixing old events followed by new ones) all
 * fold into a view shaped the same way. This module declares no default of
 * its own.
 */
export function foldEvents(events) {
  const view = { work: {}, decisions: [] };
  for (const event of events) {
    applyEvent(view, event);
  }
  return view;
}

function applyEvent(view, event) {
  switch (event.type) {
    case 'work.add': {
      const item = event.payload;
      if (item && typeof item === 'object' && typeof item.id === 'string') {
        view.work[item.id] = { ...DEFAULTS, ...item };
      }
      break;
    }
    case 'work.move': {
      const { id, to } = event.payload ?? {};
      const item = view.work[id];
      if (item) {
        item.status = to;
      }
      break;
    }
    case 'decision': {
      view.decisions.push({ ...event.payload, ts: event.ts });
      break;
    }
    case 'work.outcome': {
      // Additive event type (per D7 schema evolution / plan Approach S1):
      // predicted (written at claim) and actual (written at close) are TWO
      // separate work.outcome events sharing the same `id` — this MERGES by
      // id rather than replacing, so a later actual-only payload folds
      // alongside an earlier predicted-only payload instead of erasing it.
      // `outcomes` is a LAZY key: never present on `view` until at least one
      // work.outcome event folds (see foldEvents' initializer above) — this
      // keeps replay of any log with no work.outcome events shaped exactly
      // as before this event type existed (backward-compat.test).
      const { id } = event.payload ?? {};
      if (typeof id === 'string') {
        if (!view.outcomes) {
          view.outcomes = {};
        }
        view.outcomes[id] = { ...view.outcomes[id], ...event.payload };
      }
      break;
    }
    default:
      // Forward-compatible: an event type this view does not (yet) know how
      // to fold is skipped, not an error — readEvents already guarantees
      // every line parsed as valid JSON.
      break;
  }
}

/**
 * Read every event from `logPath` (via `readEvents`) and fold it into a
 * fresh state view. This is the `fgos rebuild` primitive: rebuilding twice
 * from the same log must produce deep-equal views (D3 determinism).
 */
export function rebuildView(logPath) {
  const events = readEvents(logPath);
  return foldEvents(events);
}
