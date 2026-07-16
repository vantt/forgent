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

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { initStore, addWork, moveWork, addDecision, addOutcome, addFriction, listWork, readyWork, readRawEvents, rebuild, putInAwaiting, answerAwaiting, StoreError, EXIT_CODES, categoryOf } from '../src/state/store.mjs';
import { deriveTitle, classify, generateId } from '../src/intake/classify.mjs';
import { wrapEnvelope } from '../src/state/envelope.mjs';
import { loadRunnerConfig } from '../src/runner/dispatch.mjs';
import { resolveDiscovery } from '../src/intake/discovery.mjs';
import { resolveDecompose } from '../src/intake/decompose.mjs';
import { computeEntropy, computeCounts } from '../src/report/entropy.mjs';
import { runGoalCheck } from '../src/runner/goal-check.mjs';
import { classifySource, reviewDiff, mergeRunnerItem, cleanupMergedBranch, isWorkingTreeClean as isMainTreeClean } from '../src/runner/merge.mjs';
import { visitCount } from '../src/runner/anti-loop.mjs';
import { DEFAULTS } from '../src/state/work.mjs';

// D5: `verify` is a required non-empty field on every work item, but a
// free-text submission has no verification plan yet — that is P15's job. The
// submit verb fills a fixed sentinel so validation passes; it is always
// overridable by a later edit.
const SUBMIT_VERIFY_SENTINEL = 'chưa xác định — P15 bổ sung';

function dataDir() {
  return path.join(process.cwd(), '.fgos');
}

// Host-repo git helpers for the pull door (`take`/`return`, stage-decompose
// D1): both verbs operate directly on `cwd` — never a worktree, same
// assumption `dataDir()` above already makes (this CLI's `.fgos/` always
// lives under the caller's own cwd). A git failure here (not a repo, no
// commits yet) is reported as `validation` rather than escaping as an
// "unexpected" (exit 1) — every other error surface in this file already
// follows the R4 exit-code contract.
function gitAt(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', shell: false });
  } catch (err) {
    throw new StoreError('validation', `git ${args.join(' ')} failed in "${cwd}": ${err.message}`);
  }
}

function currentHead(cwd) {
  return gitAt(cwd, ['rev-parse', 'HEAD']).trim();
}

function isWorkingTreeClean(cwd) {
  return gitAt(cwd, ['status', '--porcelain']).trim() === '';
}

function commitsSince(cwd, from, to) {
  return parseInt(gitAt(cwd, ['rev-list', '--count', `${from}..${to}`]).trim(), 10) || 0;
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
function formatCheck(view, id, dir) {
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
  const learning = formatLearningSection(view, id);
  if (learning) {
    sections.push(learning);
  }
  const nag = formatMissingOutcomeNag(view, id);
  if (nag) {
    sections.push(nag);
  }
  // Entropy-trend + seal-digest (per Phase 3 S3-closeout, plan Slice 3 (b)):
  // a whole-work-state summary, not scoped to `id` like the sections above —
  // it reports on the learning area as a whole even when `check <id>` was
  // called for one item.
  const entropy = formatEntropySection(view, dir);
  if (entropy) {
    sections.push(entropy);
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

// `review`'s trace summary (pr-lifecycle-2 cell action: "kèm trace tóm tắt
// (outcome/friction)"): reuses the SAME two sections `check` already prints
// — no new formatter, no new data source — so a reviewer sees exactly the
// outcome/friction history `fgos check <id>` would show, folded into the
// review output instead of requiring a second command.
function formatReviewTrace(view, id) {
  const sections = [];
  const outcomeEntry = view.outcomes?.[id];
  if (outcomeEntry) {
    sections.push(formatOutcomeBlock(id, outcomeEntry));
  }
  const friction = formatFrictionSection(view, id);
  if (friction) {
    sections.push(friction);
  }
  return sections.join('\n\n');
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

// Learning report cap — same "always CAP, never unbounded" rule as
// friction/settlement's caps above (porting lesson predicted-actual-feedback-store).
const LEARNING_DISPLAY_CAP = 5;

// Câu-6 tự động section (per Phase 3 S3-closeout (c), six-questions L5): one
// record per item that has reached `done`, composed mechanically by
// store.mjs at close time (never here — this only reads and formats).
// `learnings` is a lazy view key (replay.mjs) — a log with no item ever
// closed has no key and this section disappears, keeping `check` output
// byte-identical to pre-câu-6 logs, mirroring the friction/settlement
// sections' own "absent data -> no section" rule.
function formatLearningSection(view, id) {
  const learnings = view.learnings ?? {};
  const records = (id ? [id] : Object.keys(learnings)).flatMap((itemId) =>
    (learnings[itemId] ?? []).map((r) => ({ ...r, id: itemId })),
  );
  if (records.length === 0) {
    return '';
  }
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-LEARNING_DISPLAY_CAP)
    .reverse()
    .map((r) => {
      const outcomeStr = r.outcome
        ? `disposition=${r.outcome.disposition ?? 'n/a'} attempts=${r.outcome.attempts ?? 'n/a'} errorClass=${r.outcome.errorClass ?? 'n/a'}`
        : 'chưa có outcome';
      const frictionEntries = Object.entries(r.frictions ?? {});
      const frictionStr = frictionEntries.length ? frictionEntries.map(([k, n]) => `${k} ${n}`).join(' · ') : 'không';
      const settlementEntries = Object.entries(r.settlements ?? {});
      const settlementStr = settlementEntries.length
        ? settlementEntries.map(([k, n]) => `${k} ${n}`).join(' · ')
        : 'không';
      return `  - ${r.id}: ${outcomeStr}; friction: ${frictionStr}; settlement: ${settlementStr}`;
    });
  return `learning (${records.length}):\n${recent.join('\n')}`;
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

// Entropy-trend history path (per this cell's action (2) / must_haves: MUST
// live in the SAME data dir as the store's own events.jsonl — never
// hardcoded to `repo/.fgos`). `dir` here is always the caller's resolved
// data dir (dataDir() below, or a test's own tmp dir), the exact same value
// every other verb in this file already threads through to store.mjs.
function entropyHistoryPath(dir) {
  return path.join(dir, 'entropy-history.jsonl');
}

// Reads only the LAST line of the trend history (the one prior checkpoint
// entropy/seal-digest compare against) — never the whole file, and never
// throws on a missing file/dir (mirrors readEvents' missing-log contract in
// events.mjs): no history yet reads as `null`, the "baseline" case.
function readLastHistoryEntry(dir) {
  let raw;
  try {
    raw = fs.readFileSync(entropyHistoryPath(dir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  const lines = raw.split('\n').filter(Boolean);
  if (lines.length === 0) return null;
  return JSON.parse(lines[lines.length - 1]);
}

// Appends exactly one history line per `check` run — same
// append-then-nothing-else discipline as events.mjs's appendEvent, but this
// file (unlike events.jsonl/state.json) is new per this cell and never
// read by store.mjs/replay.mjs. Only ever called when formatEntropySection
// has already confirmed there is work-state data to report on (below) —
// so a `check` against an uninitialized dir never creates it.
function appendHistoryEntry(dir, entry) {
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(entropyHistoryPath(dir), `${JSON.stringify(entry)}\n`, 'utf8');
}

function signed(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// Builds one "<delta> <label>" seal-digest clause, but ONLY when that
// channel actually has something to say — either a nonzero count right now
// or a nonzero delta since the last checkpoint. This mirrors the
// friction/settlement sections' own "absent data -> no section" rule one
// level down (per clause instead of per section): `check`'s existing
// contract on a clean log asserts the literal words "friction"/"settlement"
// never appear when there is no such data at all (see the friction/
// settlement section tests above), and a bare "+0 friction" clause would
// violate that even though the NUMBER is accurate. Silence, not a zero, is
// what "nothing happened on this channel" looks like here.
function formatSealDigestClause(label, count, delta) {
  if (count === 0 && delta === 0) {
    return null;
  }
  return `${signed(delta)} ${label}`;
}

// Entropy-trend + seal-digest section (per this cell's action (2)/(3)):
// reported only when at least one work item exists — an empty view (no log
// at all) must keep `check`'s existing "chưa có dữ liệu" / never-initializes
// contract byte-identical (the same "absent data -> no section" rule the
// friction/settlement sections already follow), rather than writing a
// zero-score checkpoint into a directory that was never initialized.
function formatEntropySection(view, dir) {
  if (Object.keys(view.work ?? {}).length === 0) {
    return '';
  }
  const { score, parts } = computeEntropy(view);
  const counts = computeCounts(view);
  const prev = readLastHistoryEntry(dir);
  appendHistoryEntry(dir, { ts: new Date().toISOString(), score, counts });

  const trendLine = prev
    ? `entropy: ${score} (${signed(score - prev.score)} so lần trước)`
    : `entropy: ${score} (baseline)`;
  const partsLines = parts
    .filter((p) => p.count > 0)
    .map((p) => `  - ${p.label}: ${p.count} × ${p.weight} = ${p.points}`);
  const prevCounts = prev?.counts ?? { outcomes: 0, frictions: 0, settlements: 0 };
  const sealClauses = [
    formatSealDigestClause('outcome', counts.outcomes, counts.outcomes - prevCounts.outcomes),
    formatSealDigestClause('friction', counts.frictions, counts.frictions - prevCounts.frictions),
    formatSealDigestClause('settlement', counts.settlements, counts.settlements - prevCounts.settlements),
  ].filter(Boolean);
  const sealLine = sealClauses.length > 0 ? `compounded: ${sealClauses.join(' /')}` : null;

  return [trendLine, ...partsLines, sealLine].filter(Boolean).join('\n');
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

    // The sync branch's entry point into context-discovery/chia-việc (per
    // D5/stage-decompose D3): a live session runs the SAME engine the async
    // runner sweep calls for whichever stage the item is currently sitting
    // at — `resolveDiscovery` for `clarify`, `resolveDecompose` for
    // `decompose` (D3's sync/async parity: identical trace either way, only
    // the actor differs). A clear discovery verdict moves the item to
    // `decompose` (carrying a real verify, D10); chia-việc then either
    // passes it through to `executing`, splits it into children, or parks it
    // in `awaiting-human` (D3). The runner config (executor + tier models)
    // is loaded the same way bin/fgos-runner.mjs loads it.
    case 'discover': {
      const id = requireField(positional[0] ?? flags.id, 'discover requires an id: fgos discover <id> [--config <path>]');
      const configPath = flags.config ?? path.join(process.cwd(), '.fgos-runner.json');
      const cfg = loadRunnerConfig(configPath);
      const stage = listWork(dir).work[id]?.stage;
      const result = stage === 'decompose'
        ? resolveDecompose(dir, id, cfg, 'session')
        : resolveDiscovery(dir, id, cfg, 'session');
      return JSON.stringify(wrapEnvelope(result), null, 2);
    }

    case 'move': {
      const id = requireField(positional[0] ?? flags.id, 'move requires an id: fgos move <id> --to <status> [--expect <status>]');
      const to = requireField(flags.to, 'move requires --to <status>');
      const expectedStatus = optionalField(flags.expect, 'move --expect requires a status value (omit --expect entirely to skip the CAS check)');
      // --reason only matters on the proposed -> todo rejection edge (per
      // D5) and the proposed -> blocked park edge (per pr-lifecycle D3);
      // fsm.mjs is the single place that enforces "required there, ignored
      // everywhere else" — this verb just forwards whatever the caller
      // supplied.
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
      return formatCheck(listWork(dir), id, dir);
    }

    // Cửa pull — take (stage-decompose S2-pull D1): a tác nhân ngoài runner
    // (human by default, session for a live agent) claims exactly one item.
    // No `--id` → the frontier head (readyWork — the EXACT set the runner
    // would dispatch, D1: "cửa pull không mở tập riêng"). An explicit `--id`
    // still must be in the frontier while it is genuinely `todo` (same-set
    // rule); an id that is already claimed/blocked/etc. falls straight
    // through to moveWork's own CAS below, which reports the real conflict
    // (exit 3) rather than a duplicated custom message. `headAtTake` (the
    // host repo's own current HEAD) rides the claim additively so `return`
    // can later measure real progress against it.
    case 'take': {
      const explicitId = optionalField(positional[0] ?? flags.id, 'take --id requires a non-empty id value (omit --id entirely to take the frontier head)');
      const actor = optionalField(flags.actor, 'take --actor requires "human" or "session" (omit --actor entirely to default to human)') ?? 'human';
      if (actor !== 'human' && actor !== 'session') {
        throw new StoreError('validation', `take --actor must be "human" or "session" (got "${actor}").`);
      }

      let id = explicitId;
      if (!id) {
        const [head] = readyWork(dir);
        if (!head) {
          throw new StoreError('validation', 'take: the frontier is empty — no item ready to take.');
        }
        id = head.id;
      } else {
        const item = listWork(dir).work[id];
        if (!item) {
          throw new StoreError('validation', `take: work "${id}" not found.`);
        }
        if (item.status === 'todo' && !readyWork(dir).some((w) => w.id === id)) {
          throw new StoreError(
            'validation',
            `take: "${id}" is todo but not in the frontier yet (stage/deps/lineage) — take only opens the same set the runner would dispatch (D1).`,
          );
        }
      }

      const item = listWork(dir).work[id];
      // Predicted half written right after the claim, mirroring the
      // runner's own claim (D1's "đối xứng claim runner") — priorVisits is
      // read BEFORE this claim's own work.move so it never counts itself.
      const priorVisits = visitCount(readRawEvents(dir), id);
      const headAtTake = currentHead(process.cwd());

      const { event } = moveWork(dir, { id, to: 'doing', expectedStatus: 'todo', actor, headAtTake });
      addOutcome(dir, {
        id,
        predicted: { tier: item.tier ?? DEFAULTS.tier, deps: item.deps.length, priorVisits, actor, headAtTake },
      });
      return `Took ${id}: todo -> doing (actor=${actor}, headAtTake=${headAtTake}) (event #${event.seq})`;
    }

    // Cửa pull — return (stage-decompose S2-pull D1/R13): KHÔNG tin lời
    // người trả — this verb runs the item's OWN verify itself (the same
    // goal-check helper the runner uses, per cell action (3)) and only its
    // exit status decides. Mirrors the runner's own proposed contract
    // exactly: working tree clean (work committed) + HEAD advanced past
    // headAtTake (real progress, not a no-op) are both required BEFORE verify
    // even runs; verify green -> doing->proposed (actual, no settlement —
    // settlement belongs to the ->done edge, D4); verify red ->
    // doing->blocked + friction (mirrors the runner's own park path).
    case 'return': {
      const id = requireField(positional[0] ?? flags.id, 'return requires an id: fgos return <id> [--timeout <ms>]');
      const timeoutFlag = optionalField(flags.timeout, 'return --timeout requires a numeric millisecond value (omit --timeout entirely for no timeout)');
      let timeoutMs;
      if (timeoutFlag !== undefined) {
        timeoutMs = Number(timeoutFlag);
        if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
          throw new StoreError('validation', `return --timeout must be a positive number of milliseconds (got "${timeoutFlag}").`);
        }
      }

      const item = listWork(dir).work[id];
      if (!item) {
        throw new StoreError('validation', `return: work "${id}" not found.`);
      }
      if (item.status !== 'doing') {
        throw new StoreError('validation', `return: work "${id}" is "${item.status}", not "doing" — nothing to return.`);
      }
      if (item.claimActor !== 'human' && item.claimActor !== 'session') {
        throw new StoreError(
          'validation',
          `return: work "${id}" was not taken through the pull door (claimed by "${item.claimActor ?? 'runner'}") — return only completes a take.`,
        );
      }
      if (typeof item.headAtTake !== 'string' || !item.headAtTake) {
        throw new StoreError('validation', `return: work "${id}" has no recorded headAtTake — cannot verify progress since take.`);
      }

      const cwd = process.cwd();
      if (!isWorkingTreeClean(cwd)) {
        throw new StoreError('validation', `return: working tree at "${cwd}" is not clean — commit the work for "${id}" before returning.`);
      }
      const head = currentHead(cwd);
      const aheadCount = commitsSince(cwd, item.headAtTake, head);
      if (aheadCount <= 0) {
        throw new StoreError(
          'validation',
          `return: HEAD has not advanced past headAtTake for "${id}" (${item.headAtTake} -> ${head}) — commit the work before returning.`,
        );
      }

      const check = runGoalCheck(item, cwd, timeoutMs);
      if (check.passed) {
        const { event } = moveWork(dir, { id, to: 'proposed', expectedStatus: 'doing', headAtReturn: head });
        addOutcome(dir, { id, actual: { outcome: 'proposed', passed: true, attempts: 1, errorClass: null, aheadCount } });
        return `Returned ${id}: doing -> proposed (verify passed, ${aheadCount} commit(s)) (event #${event.seq})\n${check.output}`;
      }

      moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: 'verify-fail' });
      addOutcome(dir, { id, actual: { outcome: 'blocked', passed: false, attempts: 1, errorClass: 'verify-miss', aheadCount } });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'verify-miss',
        layer: 'verification',
        attempts: 1,
        detail: `goal-check failed (exit ${check.status})`,
      });
      return `Returned ${id}: doing -> blocked (verify failed, exit ${check.status})\n${check.output}`;
    }

    // Cổng duyệt PR nội bộ (pr-lifecycle D1/D4): a proposed item's diff,
    // shown from whichever source classifySource resolves (runner branch,
    // pull-door head range, or legacy degrade — merge.mjs). A pure read —
    // never appends an event, never mutates state.json, same D1 request-class
    // as `ready`/`list`/`check`.
    case 'review': {
      const id = requireField(positional[0] ?? flags.id, 'review requires an id: fgos review <id>');
      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `review: work "${id}" not found.`);
      }
      if (item.status !== 'proposed') {
        throw new StoreError('precondition', `review: work "${id}" is "${item.status}", not "proposed" — nothing to review.`);
      }

      const { source, diff, warnings } = reviewDiff(process.cwd(), item);
      const lines = [`${id} — source: ${source}`];
      for (const warning of warnings) {
        lines.push(`warning: ${warning}`);
      }
      if (diff !== null) {
        lines.push('', diff.trim() === '' ? '(no changes)' : diff);
      }
      const trace = formatReviewTrace(view, id);
      if (trace) {
        lines.push('', trace);
      }
      return lines.join('\n');
    }

    // Cổng duyệt — approve (pr-lifecycle D3/D4): merges a runner item's
    // branch into main (spike-proven mechanics: --no-commit --no-ff, verify
    // on the staged tree, commit only on green — merge.mjs's mergeRunnerItem)
    // or, for a pull-door/legacy item (code already on main), re-runs the
    // item's OWN verify directly against the current tree. Every failure
    // path (conflict, red verify) parks the item at `blocked` with a reason
    // instead of leaving main mid-merge or the item silently in `proposed`
    // (D3's "merge sạch → done tự động; conflict/đỏ → hủy sạch + blocked").
    // `done`'s actor is always "human" (D3: the person who ran approve is
    // the settlement, the merge itself is only the mechanical consequence).
    case 'approve': {
      const id = requireField(positional[0] ?? flags.id, 'approve requires an id: fgos approve <id> [--timeout <ms>]');
      const timeoutFlag = optionalField(flags.timeout, 'approve --timeout requires a numeric millisecond value (omit --timeout entirely for no timeout)');
      let timeoutMs;
      if (timeoutFlag !== undefined) {
        timeoutMs = Number(timeoutFlag);
        if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
          throw new StoreError('validation', `approve --timeout must be a positive number of milliseconds (got "${timeoutFlag}").`);
        }
      }

      const item = listWork(dir).work[id];
      if (!item) {
        throw new StoreError('validation', `approve: work "${id}" not found.`);
      }
      if (item.status !== 'proposed') {
        throw new StoreError('precondition', `approve: work "${id}" is "${item.status}", not "proposed" — nothing to approve.`);
      }

      const repoRoot = process.cwd();
      const source = classifySource(repoRoot, item);

      if (source === 'runner') {
        if (!isMainTreeClean(repoRoot)) {
          throw new StoreError('validation', `approve: working tree at "${repoRoot}" is not clean — commit or stash pending changes before approving "${id}".`);
        }

        const result = mergeRunnerItem(repoRoot, item, { timeoutMs });

        if (result.outcome === 'conflict') {
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason: 'merge-conflict' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-conflict',
            layer: 'state',
            attempts: 1,
            detail: `git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`,
          });
          return `Approved ${id}: merge conflicted — proposed -> blocked (reason merge-conflict), main left unchanged`;
        }

        if (result.outcome === 'verify-fail') {
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason: 'verify-fail-post-merge' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'verify-miss',
            layer: 'verification',
            attempts: 1,
            detail: `goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`,
          });
          return `Approved ${id}: verify failed on staged merge (exit ${result.check.status}) — proposed -> blocked (reason verify-fail-post-merge), main left unchanged\n${result.check.output}`;
        }

        const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'proposed', actor: 'human' });
        const cleanup = cleanupMergedBranch(repoRoot, result.branch);
        const cleanupNote = cleanup.warnings.length ? `\ncleanup warning(s): ${cleanup.warnings.join('; ')}` : '';
        return `Approved ${id}: merged ${result.branch} -> main, verified, proposed -> done (event #${event.seq})${cleanupNote}\n${result.check.output}`;
      }

      // pull-door or legacy proposal: code is already on main (D4) — no
      // merge step, just re-run the item's own verify against the current
      // tree, exactly the goal-check contract `return` already uses.
      const check = runGoalCheck(item, repoRoot, timeoutMs);
      if (!check.passed) {
        moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason: 'verify-fail' });
        addFriction(dir, {
          id,
          disposition: 'blocked',
          errorClass: 'verify-miss',
          layer: 'verification',
          attempts: 1,
          detail: `goal-check failed on main (exit ${check.status})`,
        });
        return `Approved ${id}: verify failed on main (exit ${check.status}) — proposed -> blocked (reason verify-fail)\n${check.output}`;
      }
      const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'proposed', actor: 'human' });
      return `Approved ${id}: verified on main, proposed -> done (event #${event.seq})\n${check.output}`;
    }

    // Cổng duyệt — reject (pr-lifecycle D4): proposed -> todo, reason
    // mandatory (fsm.mjs already enforces this edge). NEVER runs a single git
    // command — the code (if any landed on main via a pull-door item) is
    // history, not something this verb rewrites; a human who wants it gone
    // commits their own revert and still rejects (D4's "không auto-revert").
    case 'reject': {
      const id = requireField(positional[0] ?? flags.id, 'reject requires an id: fgos reject <id> --reason "..."');
      const reason = requireField(flags.reason, 'reject requires --reason "..."');
      const item = listWork(dir).work[id];
      if (!item) {
        throw new StoreError('validation', `reject: work "${id}" not found.`);
      }
      if (item.status !== 'proposed') {
        throw new StoreError('precondition', `reject: work "${id}" is "${item.status}", not "proposed" — nothing to reject.`);
      }
      const { event } = moveWork(dir, { id, to: 'todo', expectedStatus: 'proposed', reason, actor: 'human' });
      return `Rejected ${id}: proposed -> todo (reason: ${reason}) (event #${event.seq}) — no revert, main unchanged`;
    }

    default:
      throw new StoreError('validation', `unknown verb "${verb ?? ''}". Usage: fgos <init|add|submit|discover|move|ask|answer|decision|list|ready|rebuild|check|take|return|review|approve|reject> ...`);
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
