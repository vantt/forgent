#!/usr/bin/env node
// bin/fgos.mjs — the fgos CLI: the single door onto `.fgos/` (per D3/D5).
//
// Audience (per CONTEXT.md Terms, single-door): a consumer that cannot be
// assumed to be an agent — so every outcome is a categorized exit code
// (R4), and callers should branch on the code, never on the message text.
//
//   0 ok            — mutation applied / read succeeded
//   1 unexpected     — anything not covered below (a real bug)
//   2 precondition   — illegal FSM transition (fsm.mjs)
//   3 conflict       — CAS expected-status mismatch (fsm.mjs)
//   4 validation     — bad input / not-found (work.mjs, store.mjs)
//   5 corrupt-log    — the event log itself failed to parse (events.mjs)
//
// This file never writes to `.fgos/` itself — every mutation goes through
// src/state/store.mjs, the sole write door.

import path from 'node:path';
import { initStore, addWork, moveWork, addDecision, listWork, readyWork, rebuild, putInAwaiting, answerAwaiting, StoreError, EXIT_CODES, categoryOf } from '../src/state/store.mjs';
import { deriveTitle, classify, generateId } from '../src/intake/classify.mjs';
import { wrapEnvelope } from '../src/state/envelope.mjs';
import { loadRunnerConfig } from '../src/runner/dispatch.mjs';
import { resolveDiscovery } from '../src/intake/discovery.mjs';

// D5: `verify` is a required non-empty field on every work item, but a
// free-text submission has no verification plan yet — that is P15's job. The
// submit verb fills a fixed sentinel so validation passes; it is always
// overridable by a later edit.
const SUBMIT_VERIFY_SENTINEL = 'chưa xác định — P15 bổ sung';

function dataDir() {
  return path.join(process.cwd(), '.fgos');
}

// A bare `--flag` (no value) parses to boolean `true` (see parseArgs below);
// treat that the same as an empty string — both mean "no value was given"
// and must be refused as validation (exit 4), not passed downstream where a
// lower layer might misclassify it as a different exit category.
function requireField(value, message) {
  if (value === undefined || value === null || value === '' || value === true) {
    throw new StoreError('validation', message);
  }
  return value;
}

// Same rule as requireField but for a flag that is legitimately optional
// when omitted entirely — only a bare or empty value (given but malformed)
// is refused.
function optionalField(value, message) {
  if (value === undefined) return undefined;
  return requireField(value, message);
}

// Minimal argv parser: `--flag value` or bare `--flag` (boolean), plus
// positional args. No dependency, no dashes-in-values ambiguity handling
// beyond what this CLI's own verbs need.
function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function parseListFlag(value) {
  if (value === undefined || value === true) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// One block per item, always naming both halves explicitly (`predicted:` /
// `actual:`) even when a half is still missing — this is what makes the
// output real CoS evidence (per plan Approach S1) rather than a bare
// "has outcome" flag: a reader (human or e2e assertion) sees the actual
// predicted/actual VALUES, not just the words.
function formatOutcomeBlock(id, entry) {
  const predictedLine = entry?.predicted
    ? `  predicted: ${JSON.stringify(entry.predicted)}`
    : '  predicted: chưa có dữ liệu';
  const actualLine = entry?.actual
    ? `  actual: ${JSON.stringify(entry.actual)}`
    : '  actual: chưa có dữ liệu';
  return `${id}\n${predictedLine}\n${actualLine}`;
}

// Read-only formatter (per D1 request-class): folds `view.outcomes` (lazy
// key — absent on any log with no work.outcome events, per replay.mjs) into
// a predicted-vs-actual report. Never throws on missing data — an item with
// no outcome yet, or a log with no `outcomes` key at all, both print
// "chưa có dữ liệu" and the caller still exits 0 (this is a read, not a
// validation failure).
function formatCheck(view, id) {
  const outcomes = view.outcomes ?? {};
  const ids = id ? [id] : Object.keys(outcomes);
  const sections = [];
  if (ids.length > 0) {
    sections.push(ids.map((itemId) => formatOutcomeBlock(itemId, outcomes[itemId])).join('\n\n'));
  }
  const friction = formatFrictionSection(view, id);
  if (friction) {
    sections.push(friction);
  }
  const settlement = formatSettlementSection(view, id);
  if (settlement) {
    sections.push(settlement);
  }
  const nag = formatMissingOutcomeNag(view, id);
  if (nag) {
    sections.push(nag);
  }
  if (sections.length === 0) {
    return 'chưa có dữ liệu';
  }
  return sections.join('\n\n');
}

// Friction report cap (per porting lesson predicted-actual-feedback-store:
// "gợi ý luôn CAP, không xả vô hạn") — counts are always full, the record
// list shown is only the newest few.
const FRICTION_DISPLAY_CAP = 5;

// Friction channel section (kênh 2 của capture 2 kênh — Phase 3 Slice 2):
// per-layer counts over ALL matching records, then the newest records capped
// at FRICTION_DISPLAY_CAP. `frictions` is a lazy view key (replay.mjs) — a
// log with no work.friction events has no key and this section disappears,
// keeping `check` output byte-identical to pre-friction logs.
function formatFrictionSection(view, id) {
  const frictions = view.frictions ?? {};
  const records = (id ? [id] : Object.keys(frictions)).flatMap((itemId) =>
    (frictions[itemId] ?? []).map((r) => ({ ...r, id: r.id ?? itemId })),
  );
  if (records.length === 0) {
    return '';
  }
  const byLayer = {};
  for (const r of records) {
    byLayer[r.layer] = (byLayer[r.layer] ?? 0) + 1;
  }
  const layerLine = Object.entries(byLayer)
    .map(([layer, n]) => `${layer} ${n}`)
    .join(' · ');
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-FRICTION_DISPLAY_CAP)
    .reverse()
    .map((r) =>
      `  - [${r.disposition}] ${r.id} ${r.errorClass}/${r.layer} (attempts ${r.attempts}): ${r.detail ?? ''}`.trimEnd(),
    );
  return `friction (${records.length}):\n  theo lớp: ${layerLine}\n${recent.join('\n')}`;
}

// Settlement report cap — same "always CAP, never unbounded" rule as
// friction's cap above (porting lesson predicted-actual-feedback-store).
const SETTLEMENT_DISPLAY_CAP = 5;

// Settlement channel section (kênh 1 của capture 2 kênh — Phase 3
// S3-closeout, vision §8): per-kind/actor counts over ALL matching records,
// then the newest records capped at SETTLEMENT_DISPLAY_CAP. `settlements` is
// a lazy view key (replay.mjs) — a log with no settling event has no key and
// this section disappears, keeping `check` output byte-identical to
// pre-settlement logs.
function formatSettlementSection(view, id) {
  const settlements = view.settlements ?? {};
  const records = (id ? [id] : Object.keys(settlements)).flatMap((itemId) =>
    (settlements[itemId] ?? []).map((r) => ({ ...r, id: itemId })),
  );
  if (records.length === 0) {
    return '';
  }
  const byKindActor = {};
  for (const r of records) {
    const key = `${r.kind}/${r.actor ?? 'unknown'}`;
    byKindActor[key] = (byKindActor[key] ?? 0) + 1;
  }
  const summaryLine = Object.entries(byKindActor)
    .map(([key, n]) => `${key} ${n}`)
    .join(' · ');
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-SETTLEMENT_DISPLAY_CAP)
    .reverse()
    .map((r) => `  - [${r.kind}] ${r.id} actor=${r.actor ?? 'unknown'}: ${r.detail ?? ''}`.trimEnd());
  return `settlement (${records.length}):\n  theo kind/actor: ${summaryLine}\n${recent.join('\n')}`;
}

// Outcome-lifecycle nag (per porting lesson porting-outcome-lifecycle: the
// check surface reminds records that reached an end state without their
// outcome). An item sitting in a final status should carry its actual half;
// listing the ones that don't keeps the predicted→actual loop honest.
function formatMissingOutcomeNag(view, id) {
  const outcomes = view.outcomes ?? {};
  const FINAL_STATUSES = new Set(['proposed', 'blocked', 'done']);
  const missing = Object.values(view.work ?? {})
    .filter((w) => (!id || w.id === id) && FINAL_STATUSES.has(w.status) && !outcomes[w.id]?.actual)
    .map((w) => w.id);
  if (missing.length === 0) {
    return '';
  }
  return `nhắc: ${missing.length} item ở trạng thái cuối chưa có nửa actual: ${missing.join(', ')}`;
}

function runVerb(verb, flags, positional, dir) {
  switch (verb) {
    case 'init': {
      initStore(dir);
      return `Initialized ${dir}`;
    }

    case 'add': {
      const id = requireField(positional[0] ?? flags.id, 'add requires an id: fgos add <id> --title ... --kind ... --risk ... --verify ...');
      const work = {
        id,
        title: flags.title,
        kind: flags.kind,
        status: 'todo',
        deps: parseListFlag(flags.deps),
        risk: flags.risk,
        refs: parseListFlag(flags.refs),
        verify: flags.verify,
        learn: typeof flags.learn === 'string' ? flags.learn : undefined,
        // Per D6: --tier is optional; a bare/empty flag is refused the same
        // as any other malformed value (requireField's rule), while simply
        // omitting --tier leaves this undefined so store.mjs's addWork
        // applies work.mjs's declared DEFAULTS.tier. An out-of-domain value
        // (e.g. --tier extreme) passes through unrejected here — work.mjs's
        // validateWorkShape is the single source for the TIERS domain and
        // rejects it as validation, so that rule is never duplicated here.
        tier: optionalField(flags.tier, 'add --tier requires a tier value (e.g. light/standard/heavy); omit --tier entirely to use the default.'),
      };
      const { event } = addWork(dir, work);
      return `Added ${event.payload.id} (event #${event.seq})`;
    }

    // Intake verb (P14, D1-D6): takes a single free-text blob, derives its
    // title, mechanically classifies tier/kind/risk, auto-generates a
    // collision-free id, and persists through the SAME addWork door as `add`
    // (C2 — no second write door). Runs parallel to `add`, never replaces it.
    // Output is wrapped in the fgos.v1 envelope (C1). Per D6, `mode` records
    // whether the submitter stayed to collaborate (`sync`, default) or left
    // (`async`/`--unattended`); P14 only writes the field, nothing branches
    // on it here.
    case 'submit': {
      const text = requireField(positional[0], 'submit requires a free-text description: fgos submit "<description>" [--async|--unattended]');
      const title = deriveTitle(text);
      const { tier, kind, risk } = classify(text);
      const id = generateId(title, Object.keys(listWork(dir).work));
      const work = {
        id,
        title,
        kind,
        status: 'todo',
        deps: [],
        risk,
        refs: [],
        verify: SUBMIT_VERIFY_SENTINEL,
        tier,
        mode: flags.async || flags.unattended ? 'async' : 'sync',
        // Per D8: every item entering through the public door starts in stage
        // `clarify` — context-discovery must pass before it can be worked.
        // `add` deliberately omits this (lazy default `executing`, D8).
        stage: 'clarify',
      };
      const { event } = addWork(dir, work);
      return JSON.stringify(wrapEnvelope(event.payload), null, 2);
    }

    // The sync branch's entry point into context-discovery (per D5): a live
    // session runs the same `resolveDiscovery` the async runner sweep calls
    // (D13) — one shared engine, two call sites. A clear verdict moves the
    // item to `executing` (carrying a real verify, D10); an unclear verdict
    // parks it in `awaiting-human`. The runner config (executor + tier
    // models) is loaded the same way bin/fgos-runner.mjs loads it.
    case 'discover': {
      const id = requireField(positional[0] ?? flags.id, 'discover requires an id: fgos discover <id> [--config <path>]');
      const configPath = flags.config ?? path.join(process.cwd(), '.fgos-runner.json');
      const cfg = loadRunnerConfig(configPath);
      const result = resolveDiscovery(dir, id, cfg, 'session');
      return JSON.stringify(wrapEnvelope(result), null, 2);
    }

    case 'move': {
      const id = requireField(positional[0] ?? flags.id, 'move requires an id: fgos move <id> --to <status> [--expect <status>]');
      const to = requireField(flags.to, 'move requires --to <status>');
      const expectedStatus = optionalField(flags.expect, 'move --expect requires a status value (omit --expect entirely to skip the CAS check)');
      // --reason only matters on the proposed -> todo rejection edge (per
      // D5); fsm.mjs is the single place that enforces "required there,
      // ignored everywhere else" — this verb just forwards whatever the
      // caller supplied.
      const reason = optionalField(flags.reason, 'move --reason requires a non-empty reason value (omit --reason entirely when not rejecting a proposal)');
      const { event } = moveWork(dir, { id, to, expectedStatus, reason, actor: 'human' });
      return `Moved ${id}: ${event.payload.from} -> ${event.payload.to} (event #${event.seq})`;
    }

    // Parks the item into `awaiting-human`, carrying the question it is
    // waiting on (per D2/D5). Same CAS/precondition contract as `move` — the
    // FSM enforces both the `todo|doing -> awaiting-human` edge and that
    // `--text` is non-empty (per D2's `ask` requirement on the entry edge).
    case 'ask': {
      const id = requireField(positional[0] ?? flags.id, 'ask requires an id: fgos ask <id> --text "..." [--expect <status>]');
      const text = requireField(flags.text, 'ask requires --text "..."');
      const expectedStatus = optionalField(flags.expect, 'ask --expect requires a status value (omit --expect entirely to skip the CAS check)');
      const { event } = putInAwaiting(dir, { id, ask: text, expectedStatus });
      return `Parked ${id}: ${event.payload.from} -> ${event.payload.to} (event #${event.seq})`;
    }

    // Records the answer and resumes the item to `todo` (per D2/D5). Same
    // CAS/precondition contract as `move` — the FSM enforces both the
    // `awaiting-human -> todo` edge and that `--text` is non-empty (per D2's
    // `answer` requirement on the exit edge).
    case 'answer': {
      const id = requireField(positional[0] ?? flags.id, 'answer requires an id: fgos answer <id> --text "..." [--expect <status>]');
      const text = requireField(flags.text, 'answer requires --text "..."');
      const expectedStatus = optionalField(flags.expect, 'answer --expect requires a status value (omit --expect entirely to skip the CAS check)');
      const { event } = answerAwaiting(dir, { id, answer: text, expectedStatus, actor: 'human' });
      return `Answered ${id}: ${event.payload.from} -> ${event.payload.to} (event #${event.seq})`;
    }

    case 'decision': {
      const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
      const { event } = addDecision(dir, { text });
      return `Logged decision (event #${event.seq})`;
    }

    case 'list': {
      return JSON.stringify(listWork(dir), null, 2);
    }

    // Request-class per D1: a pure read — never appends an event, never
    // touches state.json, never creates `.fgos/` if it's missing. Goes
    // through store.readyWork only; this file never imports frontier.mjs
    // directly (per this cell's key_links).
    case 'ready': {
      return JSON.stringify(readyWork(dir), null, 2);
    }

    case 'rebuild': {
      const view = rebuild(dir);
      return `Rebuilt view: ${Object.keys(view.work).length} work item(s), ${view.decisions.length} decision(s).`;
    }

    // Request-class per D1 (same contract as `ready`/`list`): a pure read,
    // never appends an event, never mutates state.json. Reports the
    // predicted-vs-actual compound-learning signal (per Phase 3 plan
    // Approach S1) folded from `listWork(dir).outcomes` — no new store
    // export needed for reading, per this cell's action.
    case 'check': {
      const id = optionalField(positional[0] ?? flags.id, 'check --id requires a non-empty id value (omit --id entirely to check every item)');
      return formatCheck(listWork(dir), id);
    }

    default:
      throw new StoreError('validation', `unknown verb "${verb ?? ''}". Usage: fgos <init|add|submit|discover|move|ask|answer|decision|list|ready|rebuild|check> ...`);
  }
}

function main() {
  const [, , verb, ...rest] = process.argv;
  const { flags, positional } = parseArgs(rest);

  try {
    const output = runVerb(verb, flags, positional, dataDir());
    console.log(output);
    process.exitCode = 0;
  } catch (err) {
    process.stderr.write(`fgos: ${err.message}\n`);
    process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1;
  }
}

main();
