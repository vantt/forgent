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
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { initStore, addWork, moveWork, editWork, addDecision, addOutcome, addFriction, listWork, readyWork, graphMetrics, readRawEvents, rebuild, putInAwaiting, answerAwaiting, StoreError, EXIT_CODES, categoryOf } from '../src/state/store.mjs';
import { repairTruncatedLastLine } from '../src/state/events.mjs';
import { deriveTitle, classify, generateId } from '../src/intake/classify.mjs';
import { wrapEnvelope } from '../src/state/envelope.mjs';
import { loadRunnerConfig } from '../src/runner/dispatch.mjs';
import { resolveDiscovery } from '../src/intake/discovery.mjs';
import { resolveDecompose } from '../src/intake/decompose.mjs';
import { computeEntropy, computeCounts } from '../src/report/entropy.mjs';
import { rankCandidates } from '../src/evolve/candidates.mjs';
import { rankImpact } from '../src/state/impact.mjs';
import { runGoalCheck } from '../src/runner/goal-check.mjs';
import { classifySource, reviewDiff, mergeRunnerItem, cleanupMergedBranch, changedFiles, isWorkingTreeClean as isMainTreeClean, isFgosOnlyStatusLine, detectTrunk } from '../src/runner/merge.mjs';
import { createGitHubPR, mergeGitHubPR, viewGitHubPRStatus } from '../src/runner/github-adapter.mjs';
import { classifyIronLaw } from '../src/evolve/iron-law.mjs';
import { branchNameFor, branchExists, createWorktree, removeWorktree } from '../src/runner/worktree.mjs';
import { createSession, endSession, listSessions, SessionError } from '../src/runner/session.mjs';
import { resolveRoot } from '../src/runner/root-affinity.mjs';
import { visitCount } from '../src/runner/anti-loop.mjs';
import { DEFAULTS } from '../src/state/work.mjs';
import { getDomain, stageForStep } from '../src/state/domains.mjs';
import { writeCoexistenceManifest } from '../src/install/coexist.mjs';
import { SCHEMA_VERSION, COMMAND_REGISTRY } from '../src/cli/command-registry.mjs';

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

// `.fgos/` is excluded from this check the same way merge.mjs's own
// isWorkingTreeClean excludes it (isFgosOnlyStatusLine, shared rule): the
// store is a live, self-mutating write door — return's own headAtReturn
// event lands there as part of this very call — never a signal that the
// code tree itself is dirty.
function isWorkingTreeClean(cwd) {
  return gitAt(cwd, ['status', '--porcelain'])
    .split('\n')
    .filter((line) => line.trim() !== '')
    .every(isFgosOnlyStatusLine);
}

function commitsSince(cwd, from, to) {
  return parseInt(gitAt(cwd, ['rev-list', '--count', `${from}..${to}`]).trim(), 10) || 0;
}

// LOCAL copy of session.mjs's private realpathOr (session.mjs is never edited,
// nothing is exported from it for this). A bare fs.realpathSync would throw the
// moment any ONE registered session's worktree directory is gone from disk (a
// crashed session hand-cleaned instead of via `fgos session end`) — crashing
// approve for EVERY caller, including from the main checkout. The try/catch
// fallback to path.resolve keeps one stale registry entry from taking down the
// approval gate.
function realpathOr(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

// The gh binary the GitHub transport shells out to (github-adapter D2). Tests
// substitute a fake executable through FGOS_GH_COMMAND; production leaves it
// unset and the real `gh` on PATH is used.
function ghCommandOpts() {
  return { ghCommand: process.env.FGOS_GH_COMMAND || 'gh' };
}

// Push a runner item's branch to origin unless it already tracks an upstream.
// The upstream probe is a plain execFileSync + try/catch, NOT gitAt: gitAt
// rethrows every git failure as StoreError('validation', ...), the wrong
// semantic for an existence probe that is *expected* to fail on a
// never-pushed branch. Only the push itself is a real operation.
function ensureBranchPushed(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], { cwd: repoRoot, encoding: 'utf8', shell: false });
    return; // upstream already set — nothing to push
  } catch {
    // no upstream yet — the normal, expected first-review case; fall through
  }
  execFileSync('git', ['push', '-u', 'origin', branch], { cwd: repoRoot, encoding: 'utf8', shell: false });
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

// One structured entry per item, always naming both halves explicitly
// (`predicted`/`actual`) even when a half is still missing (null) — this is
// what makes the output real CoS evidence (per plan Approach S1) rather than
// a bare "has outcome" flag: a reader (agent or e2e assertion) sees the
// actual predicted/actual VALUES, not just their presence.
function collectOutcomeEntry(id, entry) {
  return { id, predicted: entry?.predicted ?? null, actual: entry?.actual ?? null };
}

// Friction report cap (per porting lesson predicted-actual-feedback-store:
// "gợi ý luôn CAP, không xả vô hạn") — counts are always full, the record
// list returned is only the newest few.
const FRICTION_DISPLAY_CAP = 5;

// Friction channel data (kênh 2 của capture 2 kênh — Phase 3 Slice 2):
// per-layer counts over ALL matching records, plus the newest records capped
// at FRICTION_DISPLAY_CAP. `frictions` is a lazy view key (replay.mjs) — a
// log with no work.friction events has no key and this returns null, keeping
// `check`'s data shape byte-identical to pre-friction logs.
function collectFrictionData(view, id) {
  const frictions = view.frictions ?? {};
  const records = (id ? [id] : Object.keys(frictions)).flatMap((itemId) =>
    (frictions[itemId] ?? []).map((r) => ({ ...r, id: r.id ?? itemId })),
  );
  if (records.length === 0) {
    return null;
  }
  const byLayer = {};
  for (const r of records) {
    byLayer[r.layer] = (byLayer[r.layer] ?? 0) + 1;
  }
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-FRICTION_DISPLAY_CAP)
    .reverse();
  return { count: records.length, byLayer, recent };
}

// `review`'s trace summary (pr-lifecycle-2 cell action: "kèm trace tóm tắt
// (outcome/friction)"): reuses the SAME two data sources `check` already
// returns — no new collector, no new data source — so a reviewer gets
// exactly the outcome/friction history `fgos check <id>` would show, folded
// into the review payload instead of requiring a second command.
function collectReviewTrace(view, id) {
  const outcomeEntry = view.outcomes?.[id] ?? null;
  return {
    outcome: outcomeEntry ? collectOutcomeEntry(id, outcomeEntry) : null,
    friction: collectFrictionData(view, id),
  };
}

// Settlement report cap — same "always CAP, never unbounded" rule as
// friction's cap above (porting lesson predicted-actual-feedback-store).
const SETTLEMENT_DISPLAY_CAP = 5;

// Settlement channel data (kênh 1 của capture 2 kênh — Phase 3
// S3-closeout, vision §8): per-kind/actor counts over ALL matching records,
// plus the newest records capped at SETTLEMENT_DISPLAY_CAP. `settlements` is
// a lazy view key (replay.mjs) — a log with no settling event has no key and
// this returns null, keeping `check`'s data shape byte-identical to
// pre-settlement logs.
function collectSettlementData(view, id) {
  const settlements = view.settlements ?? {};
  const records = (id ? [id] : Object.keys(settlements)).flatMap((itemId) =>
    (settlements[itemId] ?? []).map((r) => ({ ...r, id: itemId })),
  );
  if (records.length === 0) {
    return null;
  }
  const byKindActor = {};
  for (const r of records) {
    const key = `${r.kind}/${r.actor ?? 'unknown'}`;
    byKindActor[key] = (byKindActor[key] ?? 0) + 1;
  }
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-SETTLEMENT_DISPLAY_CAP)
    .reverse();
  return { count: records.length, byKindActor, recent };
}

// Learning report cap — same "always CAP, never unbounded" rule as
// friction/settlement's caps above (porting lesson predicted-actual-feedback-store).
const LEARNING_DISPLAY_CAP = 5;

// Câu-6 tự động data (per Phase 3 S3-closeout (c), six-questions L5): one
// record per item that has reached `done`, composed mechanically by
// store.mjs at close time (never here — this only reads and collects).
// `learnings` is a lazy view key (replay.mjs) — a log with no item ever
// closed has no key and this returns null, mirroring the friction/settlement
// data's own "absent data -> null" rule.
function collectLearningData(view, id) {
  const learnings = view.learnings ?? {};
  const records = (id ? [id] : Object.keys(learnings)).flatMap((itemId) =>
    (learnings[itemId] ?? []).map((r) => ({ ...r, id: itemId })),
  );
  if (records.length === 0) {
    return null;
  }
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-LEARNING_DISPLAY_CAP)
    .reverse();
  return { count: records.length, recent };
}

// Outcome-lifecycle nag data (per porting lesson porting-outcome-lifecycle:
// the check surface reminds records that reached an end state without their
// outcome). An item sitting in a final status should carry its actual half;
// listing the ones that don't keeps the predicted→actual loop honest.
function collectMissingOutcomeNag(view, id) {
  const outcomes = view.outcomes ?? {};
  const FINAL_STATUSES = new Set(['proposed', 'blocked', 'done']);
  const missing = Object.values(view.work ?? {})
    .filter((w) => (!id || w.id === id) && FINAL_STATUSES.has(w.status) && !outcomes[w.id]?.actual)
    .map((w) => w.id);
  if (missing.length === 0) {
    return null;
  }
  return { count: missing.length, ids: missing };
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
  // Walk backwards to the last COMPLETE (parseable) line. A crash or a partial
  // append can leave a torn final line; the last valid checkpoint is whatever
  // precedes it. One truncated line must never throw the whole `check` over —
  // the same "absent/corrupt data reads as the baseline, never a crash"
  // tolerance the missing-file branch above already gives.
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // torn/partial line — fall back to the previous one
    }
  }
  return null;
}

// Appends exactly one history line per `check` run — same
// append-then-nothing-else discipline as events.mjs's appendEvent, but this
// file (unlike events.jsonl/state.json) is new per this cell and never
// read by store.mjs/replay.mjs. Only ever called when collectEntropyData
// has already confirmed there is work-state data to report on (below) —
// so a `check` against an uninitialized dir never creates it.
function appendHistoryEntry(dir, entry) {
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(entropyHistoryPath(dir), `${JSON.stringify(entry)}\n`, 'utf8');
}

// Entropy-trend + seal-digest data (per this cell's action (2)/(3)):
// reported only when at least one work item exists — an empty view (no log
// at all) returns null, keeping `check`'s existing "no data at all" contract
// byte-identical (the same "absent data -> null" rule the friction/
// settlement data already follow), rather than writing a zero-score
// checkpoint into a directory that was never initialized. `compounded` always
// carries every channel's raw delta since the last checkpoint (never
// suppressed for a zero value) — the caller decides what is worth surfacing.
function collectEntropyData(view, dir) {
  if (Object.keys(view.work ?? {}).length === 0) {
    return null;
  }
  const { score, parts } = computeEntropy(view);
  const counts = computeCounts(view);
  const prev = readLastHistoryEntry(dir);
  appendHistoryEntry(dir, { ts: new Date().toISOString(), score, counts });

  const trend = prev ? { baseline: false, delta: score - prev.score } : { baseline: true, delta: null };
  const prevCounts = prev?.counts ?? { outcomes: 0, frictions: 0, settlements: 0 };
  const compounded = {
    outcomes: counts.outcomes - prevCounts.outcomes,
    frictions: counts.frictions - prevCounts.frictions,
    settlements: counts.settlements - prevCounts.settlements,
  };
  return { score, trend, parts: parts.filter((p) => p.count > 0), counts, compounded };
}

// Read-only data collector (per D1 request-class): folds `view.outcomes`
// (lazy key — absent on any log with no work.outcome events, per replay.mjs)
// plus the friction/settlement/learning/nag/entropy channels above into one
// predicted-vs-actual report. Never throws on missing data — an item with no
// outcome yet, or a log with no `outcomes` key at all, both return an empty
// outcomes list and the caller still exits 0 (this is a read, not a
// validation failure).
function collectCheckData(view, id, dir) {
  const outcomes = view.outcomes ?? {};
  const ids = id ? [id] : Object.keys(outcomes);
  return {
    outcomes: ids.map((itemId) => collectOutcomeEntry(itemId, outcomes[itemId])),
    friction: collectFrictionData(view, id),
    settlement: collectSettlementData(view, id),
    learning: collectLearningData(view, id),
    missingOutcomeNag: collectMissingOutcomeNag(view, id),
    // Entropy-trend + seal-digest: a whole-work-state summary, not scoped to
    // `id` like the fields above — it reports on the learning area as a
    // whole even when `check <id>` was called for one item.
    entropy: collectEntropyData(view, dir),
  };
}

// Rollup view (P24): direct children only (`w.parent === id`) — decompose
// (P16) is a single-level split, a root's own children never carry further
// `parent` chains of their own in current data, so walking deeper would add
// complexity with nothing real to show yet (YAGNI over frontier.mjs's
// multi-level `hasOpenDescendant` walk, which exists for a different job —
// gating the frontier, not reporting progress).
function collectRollupData(view, id) {
  const item = view.work?.[id];
  if (!item) {
    throw new StoreError('validation', `rollup: work "${id}" not found.`);
  }
  const children = Object.values(view.work).filter((w) => w.parent === id);
  const done = children.filter((w) => w.status === 'done').length;
  return {
    id,
    title: item.title,
    status: item.status,
    doneCount: done,
    totalCount: children.length,
    children: children.map((c) => ({ id: c.id, title: c.title, status: c.status })),
  };
}

// Shared body of the `submit` verb (P14) — extracted per self-improve-loop
// D15 so both `submit` and `evolve --submit <id>` construct the work item
// through the exact same sequence: deriveTitle -> classify -> generateId ->
// addWork -> wrapEnvelope. `opts.async`/`opts.domain` carry `submit`'s own
// --async|--unattended/--domain flag handling; `evolve --submit` calls this
// with the defaults (D15: no flag surface of its own, YAGNI).
function submitWork(dir, text, opts = {}) {
  const title = deriveTitle(text);
  const { tier, kind, risk } = classify(text);
  const id = generateId(title, Object.keys(listWork(dir).work));
  const work = {
    id,
    title,
    // Per P30 (discovery-context): the full submitted text, kept
    // alongside the derived/truncated `title` so context-discovery can
    // read the real ask instead of just the classified summary.
    description: text,
    kind,
    status: 'todo',
    deps: [],
    risk,
    refs: [],
    verify: SUBMIT_VERIFY_SENTINEL,
    tier,
    mode: opts.async ? 'async' : 'sync',
    // Per base-workflow-model D1-D4/S2: --domain is optional, same
    // omitted-leaves-undefined shape as `add`'s --domain above; omitting
    // it leaves work.domain undefined so store.mjs's addWork/
    // validateWorkShape apply DEFAULT_DOMAIN's lazy default.
    domain: opts.domain,
    // Per work-graph-intelligence S2b (producer A): --discovered-from
    // threaded from opts the same way --domain is, immediately above.
    discoveredFrom: opts.discoveredFrom,
    // Per D8: every item entering through the public door starts at its
    // domain's Clarify-mapped stage — context-discovery must pass before
    // it can be worked. Generalized from the hardcoded 'clarify' (D8) to
    // stay domain-aware (base-workflow-model D1-D4/S2): byte-identical
    // 'clarify' for the default/omitted (coding) case, since
    // stageForStep(DOMAINS.coding, 'Clarify') === 'clarify'. A domain with
    // no Clarify-mapped stage (e.g. 'synthetic') falls back to its own
    // first declared stage. `add` deliberately omits this (lazy default,
    // D8) — only `submit` needs an explicit entry stage.
    //
    // A no-op onUnrecognized here (review-20260717-self-improve-base-workflow
    // finding f3): an out-of-registry opts.domain is about to be rejected by
    // addWork's validateWork below with a clean WorkValidationError anyway —
    // getDomain's default console.warn fallback would fire a spurious
    // "folding to coding" diagnostic first, describing a fold that never
    // actually happens (the item is never persisted). `add`'s --domain
    // handling never calls getDomain at all for this reason; `submit` still
    // needs the eager stage lookup for a legal domain, so it silences the
    // fallback rather than skip it.
    stage: stageForStep(getDomain(opts.domain, { onUnrecognized: () => {} }), 'Clarify')
      ?? getDomain(opts.domain, { onUnrecognized: () => {} }).stages[0],
  };
  const { event } = addWork(dir, work);
  return event.payload;
}

// Composes the human-readable description `evolve --submit` hands to
// submitWork (self-improve-loop D15) from a ranked candidate object (the
// exact shape `candidates.mjs`'s rankCandidates returns — id/disposition/
// errorClass/layer/detail/attempts/score). Any field that is null/undefined
// is omitted rather than printing the literal string "undefined".
function describeCandidate(candidate) {
  const meta = [];
  if (candidate.disposition != null) meta.push(candidate.disposition);
  const bracket = [candidate.errorClass != null ? candidate.errorClass : null, candidate.layer != null ? `layer ${candidate.layer}` : null].filter(Boolean);
  if (bracket.length > 0) meta.push(`(${bracket.join(', ')})`);
  if (candidate.attempts != null) meta.push(`${candidate.attempts} attempt(s)`);

  let description = `Self-improve candidate ${candidate.id}`;
  description += meta.length > 0 ? `: ${meta.join(' ')}.` : '.';
  if (candidate.detail != null && candidate.detail !== '') {
    description += ` ${candidate.detail}`;
  }
  return description;
}

async function runVerb(verb, flags, positional, dir) {
  switch (verb) {
    case 'init': {
      initStore(dir);
      // D4: detection/manifest writing must never fail init — a permissions
      // quirk or unexpected error here still leaves `.fgos/` initialized.
      let detectedHarnesses = [];
      try {
        const manifest = writeCoexistenceManifest(path.dirname(dir), dir);
        detectedHarnesses = manifest.detected_harnesses;
      } catch {
        // Swallowed by design (D4 fail-safe) — see comment above.
      }
      return { dir, detectedHarnesses };
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
        // Per base-workflow-model D1-D4/S2: --domain is optional, same
        // omitted-leaves-undefined shape as --tier just above; omitting it
        // leaves work.domain undefined so store.mjs's addWork/validateWorkShape
        // apply DEFAULT_DOMAIN's lazy default. An out-of-registry value passes
        // through unrejected here — work.mjs's validateWorkShape is the single
        // source for the DOMAINS registry and rejects it as validation, so
        // that rule is never duplicated here (same discipline as --tier/TIERS).
        // No --stage flag: omitting stage already resolves per-domain via the
        // existing lazy default (item.stage ?? domain's Execute-mapped stage).
        domain: optionalField(flags.domain, 'add --domain requires a domain name (e.g. coding/synthetic); omit --domain entirely to use the default.'),
        // Per work-graph-intelligence S2b (producer A): --discovered-from is
        // an explicit, optional scalar provenance flag — same omitted-leaves-
        // undefined shape as --domain/--tier above. work.mjs's
        // validateWorkShape (mirroring its `parent` block) is the single
        // source for the non-empty/non-self-referencing rule; existence of
        // the referenced id is deliberately never enforced here (work-graph-
        // intelligence-6, mirrors `parent`'s norm).
        discoveredFrom: optionalField(flags['discovered-from'], 'add --discovered-from requires a non-empty id; omit it to leave unset.'),
      };
      const { event } = addWork(dir, work);
      return { id: event.payload.id, seq: event.seq };
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
      const opts = {
        async: Boolean(flags.async || flags.unattended),
        domain: optionalField(flags.domain, 'submit --domain requires a domain name (e.g. coding/synthetic); omit --domain entirely to use the default.'),
        // Per work-graph-intelligence S2b (producer A): two-hop like domain —
        // parsed here, threaded into submitWork's work object below.
        discoveredFrom: optionalField(flags['discovered-from'], 'submit --discovered-from requires a non-empty id; omit it to leave unset.'),
      };
      return submitWork(dir, text, opts);
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
      return result;
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
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    // Patches fields on an existing item (P23, D2-D5) — the "always
    // overridable" door `submit`'s mechanical classification leaves open.
    // Same D4 allowlist as store.mjs's editWork; a flag simply omitted
    // leaves that field untouched (never included in `patch`), while an
    // explicit `--refs ''`/`--deps ''` parses to `[]` and DOES clear the
    // field — parseListFlag already makes that distinction for `add`, reused
    // here unchanged.
    case 'edit': {
      const id = requireField(positional[0] ?? flags.id, 'edit requires an id: fgos edit <id> --<field> <value> [...]');
      const patch = {};
      for (const field of ['title', 'kind', 'risk', 'verify', 'tier']) {
        if (flags[field] !== undefined) {
          patch[field] = flags[field];
        }
      }
      for (const field of ['refs', 'deps']) {
        if (flags[field] !== undefined) {
          patch[field] = parseListFlag(flags[field]);
        }
      }
      if (Object.keys(patch).length === 0) {
        throw new StoreError(
          'validation',
          'edit requires at least one field to change: --title/--kind/--risk/--verify/--tier/--refs/--deps.',
        );
      }
      const { event } = editWork(dir, { id, patch, actor: 'human' });
      return { id, fields: Object.keys(patch), seq: event.seq };
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
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
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
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    case 'decision': {
      const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
      const { event } = addDecision(dir, { text });
      return { seq: event.seq };
    }

    case 'list': {
      return listWork(dir);
    }

    // Request-class per D1: a pure read — never appends an event, never
    // touches state.json, never creates `.fgos/` if it's missing. Goes
    // through store.readyWork only; this file never imports frontier.mjs
    // directly (per this cell's key_links).
    case 'ready': {
      return readyWork(dir);
    }

    // Request-class per D1 (same contract as `ready`/`list`): a pure read —
    // never appends an event, never touches state.json. work-graph-intelligence
    // S5: mechanical graph metrics (connected components = independent parallel
    // tracks) folded from the view. Reaches the Domain compute core through the
    // store facade only (graphMetrics), never importing it here — same rule the
    // `ready` verb follows for `frontier`.
    case 'graph': {
      return graphMetrics(dir);
    }

    case 'rebuild': {
      const view = rebuild(dir);
      return { workCount: Object.keys(view.work).length, decisionCount: view.decisions.length };
    }

    // Operator-invoked repair (per readEvents' fail-closed 'corrupt-log'
    // halt, events.mjs): scoped ONLY to the common crash-mid-append shape —
    // a truncated final line, every other line already parses. Any other
    // corruption shape still refuses (events.mjs's own guarantee, unchanged
    // here). Backs up the original log before truncating, then re-validates.
    case 'repair': {
      const logPath = path.join(dir, 'events.jsonl');
      const { backupPath, droppedLine, eventCount } = repairTruncatedLastLine(logPath);
      return { logPath, backupPath, eventCount, droppedLine };
    }

    // Request-class per D1 (same contract as `ready`/`list`): a pure read,
    // never appends an event, never mutates state.json. Reports the
    // predicted-vs-actual compound-learning signal (per Phase 3 plan
    // Approach S1) folded from `listWork(dir).outcomes` — no new store
    // export needed for reading, per this cell's action.
    case 'check': {
      const id = optionalField(positional[0] ?? flags.id, 'check --id requires a non-empty id value (omit --id entirely to check every item)');
      return collectCheckData(listWork(dir), id, dir);
    }

    // Rollup view theo bộ (P24, request-class per D1: a pure read — never
    // appends an event, never mutates state.json, same contract as
    // `check`/`ready`/`list`). Prints one root item (title/status) plus a
    // done/total count over its direct children (via `parent`, dựng từ P16
    // decompose) and each child's own status — the "việc tôi nộp tới đâu
    // rồi" answer without a human filtering `list` by hand.
    case 'rollup': {
      const id = requireField(positional[0] ?? flags.id, 'rollup requires an id: fgos rollup <id>');
      return collectRollupData(listWork(dir), id);
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

      // Branch take (human-rounds D2): a `blocked` item with a live
      // `fgw/<id>` branch (parked by the runner, or a rejected proposal) is
      // claimed via the existing blocked -> doing edge (fsm.mjs:69), CAS'd
      // against the item's real "blocked" status rather than the main-based
      // "todo" below. `branchHeadAtTake` — the BRANCH's own HEAD, not the
      // repo's — is the sole discriminator `return` uses later; it is never
      // mixed with the main-based `headAtTake`.
      const branch = branchNameFor(id);
      if (item.status === 'blocked' && branchExists(process.cwd(), branch)) {
        const branchHeadAtTake = gitAt(process.cwd(), ['rev-parse', branch]).trim();
        const { event } = moveWork(dir, { id, to: 'doing', expectedStatus: 'blocked', actor, branchHeadAtTake });
        addOutcome(dir, {
          id,
          predicted: { tier: item.tier ?? DEFAULTS.tier, deps: item.deps.length, priorVisits, actor, branchHeadAtTake },
        });
        return { id, from: 'blocked', to: 'doing', actor, seq: event.seq, source: 'branch', branch, branchHeadAtTake };
      }

      const headAtTake = currentHead(process.cwd());
      const { event } = moveWork(dir, { id, to: 'doing', expectedStatus: 'todo', actor, headAtTake });
      addOutcome(dir, {
        id,
        predicted: { tier: item.tier ?? DEFAULTS.tier, deps: item.deps.length, priorVisits, actor, headAtTake },
      });
      return { id, from: 'todo', to: 'doing', actor, seq: event.seq, source: 'main', headAtTake };
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

      // Branch-source discriminator (human-rounds D2/BINDING repair): checked
      // BEFORE every main-based guard below (headAtTake presence, clean-tree)
      // — a branch take never carries headAtTake, so testing that first
      // would wrongly reject a branch-source return as "no recorded
      // headAtTake". `branchHeadAtTake` is the ONLY signal that discriminates
      // a branch-source item; classifySource is never used here (per D2, it
      // is branch-existence-first and would misread a stale/sibling branch).
      const repoRoot = process.cwd();
      if (typeof item.branchHeadAtTake === 'string' && item.branchHeadAtTake) {
        const branch = branchNameFor(id);
        let branchHead;
        try {
          branchHead = gitAt(repoRoot, ['rev-parse', branch]).trim();
        } catch (err) {
          throw new StoreError('validation', `return: branch "${branch}" for "${id}" not found or unreadable: ${err.message}`);
        }
        const branchAheadCount = commitsSince(repoRoot, item.branchHeadAtTake, branchHead);
        if (branchAheadCount <= 0) {
          throw new StoreError(
            'validation',
            `return: branch "${branch}" has not advanced past branchHeadAtTake for "${id}" (${item.branchHeadAtTake} -> ${branchHead}) — commit the work on the branch before returning.`,
          );
        }

        // No cwd-clean requirement here (D2: "tree người là việc của
        // người") — the human's own working tree is never inspected or
        // touched. Verify runs in a DISPOSABLE, DETACHED worktree checked out
        // at the branch's own commit SHA — never `git worktree add <path>
        // <branch>` (that fails outright, and would collide, if the human
        // happens to be standing on `fgw/<id>` in their own tree right now)
        // and never `reclaimOrphanedCheckout` (that would force-remove a
        // checkout the human is actively using — the exact BLOCKER the
        // validating gate caught).
        const tmpWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-return-'));
        let check;
        try {
          gitAt(repoRoot, ['worktree', 'add', '--detach', tmpWorktree, branchHead]);
          check = await runGoalCheck(item, tmpWorktree, timeoutMs);
        } finally {
          try {
            execFileSync('git', ['worktree', 'remove', tmpWorktree, '--force'], { cwd: repoRoot, encoding: 'utf8', shell: false });
          } catch {
            // best-effort — mirrors worktree.mjs's own removeWorktree/prune
            // discipline; a cleanup failure must never mask the verify
            // result already computed above.
          }
        }

        if (check.passed) {
          const { event } = moveWork(dir, { id, to: 'proposed', expectedStatus: 'doing', branchHeadAtReturn: branchHead });
          addOutcome(dir, { id, actual: { outcome: 'proposed', passed: true, attempts: 1, errorClass: null, aheadCount: branchAheadCount } });
          return { id, from: 'doing', to: 'proposed', source: 'branch', branch, aheadCount: branchAheadCount, passed: true, seq: event.seq, output: check.output };
        }

        moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: 'verify-fail' });
        addOutcome(dir, { id, actual: { outcome: 'blocked', passed: false, attempts: 1, errorClass: 'verify-miss', aheadCount: branchAheadCount } });
        addFriction(dir, {
          id,
          disposition: 'blocked',
          errorClass: 'verify-miss',
          layer: 'verification',
          attempts: 1,
          detail: `goal-check failed on branch "${branch}" (exit ${check.status})`,
        });
        return { id, from: 'doing', to: 'blocked', source: 'branch', branch, aheadCount: branchAheadCount, passed: false, exitStatus: check.status, output: check.output };
      }

      if (typeof item.headAtTake !== 'string' || !item.headAtTake) {
        throw new StoreError('validation', `return: work "${id}" has no recorded headAtTake — cannot verify progress since take.`);
      }

      const cwd = repoRoot;
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

      const check = await runGoalCheck(item, cwd, timeoutMs);
      if (check.passed) {
        const { event } = moveWork(dir, { id, to: 'proposed', expectedStatus: 'doing', headAtReturn: head });
        addOutcome(dir, { id, actual: { outcome: 'proposed', passed: true, attempts: 1, errorClass: null, aheadCount } });
        return { id, from: 'doing', to: 'proposed', source: 'main', aheadCount, passed: true, seq: event.seq, output: check.output };
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
      return { id, from: 'doing', to: 'blocked', source: 'main', aheadCount, passed: false, exitStatus: check.status, output: check.output };
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

      // GitHub transport (github-adapter D1/D5): `review <id> --github` opens a
      // real GitHub PR for a runner-sourced item instead of printing the local
      // diff. Opt-in and additive — the flag's absence leaves the path below
      // byte-identical. Stays read-only on FSM state exactly like local review:
      // a gh failure is reported as plain output, never a moveWork/addFriction.
      if (flags.github) {
        const repoRoot = process.cwd();
        const source = classifySource(repoRoot, item);
        if (source !== 'runner') {
          throw new StoreError('validation', `review --github: "${id}" is a ${source}-sourced item — GitHub review requires a runner-sourced item with a live fgw/${id} branch (no branch exists to attach a PR to for pull/legacy items).`);
        }

        // GitHub-close detection (github-adapter D6/D4): `review <id> --github
        // --pr <n>` skips PR creation and reports an existing PR's live status
        // read-only. It classifies on `closed` (boolean) + `mergedAt` (null vs
        // timestamp) only — never on the `state` string, whose closed/merged
        // values S1's spike never observed. Like every review path it stays
        // read-only: no moveWork/addFriction under any outcome, because a
        // GitHub-side close is not itself an approval or reject action (D6);
        // only local `fgos reject` moves the item. pollTimeoutMs:0 is
        // load-bearing: this check reads only closed/mergedAt (unrelated to
        // GitHub's async `mergeable` computation), so it must resolve after a
        // single `gh pr view` instead of polling up to the default 10s while
        // `mergeable` may stay "UNKNOWN" forever on a closed PR.
        const prNumber = optionalField(flags.pr, 'review --github --pr requires a PR number: --pr <n>');
        if (prNumber !== undefined) {
          const result = await viewGitHubPRStatus(repoRoot, prNumber, { ...ghCommandOpts(), pollTimeoutMs: 0 });
          if (result.outcome === 'blocked') {
            return { id, mode: 'github-status', prNumber, outcome: 'check-failed', reason: result.reason, detail: result.detail };
          }
          if (!result.closed) {
            return { id, mode: 'github-status', prNumber, outcome: 'open' };
          }
          if (result.mergedAt) {
            return { id, mode: 'github-status', prNumber, outcome: 'merged', mergedAt: result.mergedAt };
          }
          return { id, mode: 'github-status', prNumber, outcome: 'closed-unmerged' };
        }

        const head = branchNameFor(id);
        const rootId = resolveRoot(view, id);
        // Leaf-vs-root base split mirrors approve/review's local path: a root
        // targets the repo trunk, a leaf targets its resolved root's branch.
        // Known limitation (accepted this slice): only the leaf's own branch is
        // pushed below — the root's branch is never pushed here, so a real
        // `gh pr create` for a leaf would fail with base absent on origin. The
        // fake-gh tests don't validate remote branch existence, so they pass;
        // the leaf/root GitHub push semantics need their own follow-up slice.
        const base = rootId !== id ? branchNameFor(rootId) : detectTrunk(repoRoot);
        ensureBranchPushed(repoRoot, head);
        const result = await createGitHubPR(
          repoRoot,
          { head, base, title: item.title, body: item.description || `Runner-proposed change (fgos work item ${id}).` },
          ghCommandOpts(),
        );
        if (result.outcome === 'created') {
          return { id, mode: 'github-create', outcome: 'created', prNumber: result.prNumber, head, base };
        }
        return { id, mode: 'github-create', outcome: 'failed', reason: result.reason, detail: result.detail };
      }

      // D3 leaf-vs-root split: a leaf (its resolved root is a different
      // item) diffs against its parent's integration branch instead of
      // main; a root (resolved root is itself) keeps the default
      // (main) trunk — byte-for-byte unchanged.
      const rootId = resolveRoot(view, id);
      const { source, diff, warnings } = rootId !== id
        ? reviewDiff(process.cwd(), item, { trunk: branchNameFor(rootId) })
        : reviewDiff(process.cwd(), item);
      return { id, mode: 'local', source, warnings, diff, trace: collectReviewTrace(view, id) };
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

      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `approve: work "${id}" not found.`);
      }
      if (item.status !== 'proposed') {
        throw new StoreError('precondition', `approve: work "${id}" is "${item.status}", not "proposed" — nothing to approve.`);
      }

      const repoRoot = process.cwd();
      const source = classifySource(repoRoot, item);

      // GitHub transport (github-adapter D1/D3/D5): `approve <id> --github --pr
      // <n>` merges a prior `review --github` PR through GitHub instead of a
      // local git merge. Dispatched BEFORE the runner block's Iron Law and
      // dirty-main-tree gates: a GitHub-side merge never touches the local
      // working tree, so `isMainTreeClean` (which exists only because a LOCAL
      // merge mutates the tree) must not gate it. The source gate is checked
      // BEFORE the --pr presence check so a pull/legacy item always gets the
      // runner-sourced error, never a misleading "missing --pr" message for an
      // item that could never have a PR.
      if (flags.github) {
        if (source !== 'runner') {
          throw new StoreError('validation', `approve --github: "${id}" is a ${source}-sourced item — GitHub approval requires a runner-sourced item with a live fgw/${id} branch (no branch exists to attach a PR to for pull/legacy items).`);
        }
        const prNumber = requireField(flags.pr, 'approve --github requires --pr <n> (the GitHub PR number from a prior review --github)');
        const result = await mergeGitHubPR(repoRoot, prNumber, ghCommandOpts());
        if (result.outcome === 'merged') {
          // Accepted rough edge (this slice): unlike the local merged path, no
          // cleanupMergedBranch runs — the local fgw/<id> branch and its pushed
          // origin copy are both left in place after a server-side merge (no
          // local cleanup mechanism exists for a branch merged on GitHub).
          const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'proposed', actor: 'human' });
          return { id, mode: 'github', to: 'done', prNumber, seq: event.seq };
        }
        // blocked — mirrors the local merge-conflict/verify-fail-post-merge
        // shape: park proposed -> blocked with the classifyGhFailure reason,
        // plus a friction record carrying the failure layer and gh's stderr.
        const reason = result.reason;
        const layer = { 'auth-failure': 'environment', 'rate-limited': 'environment', 'unreachable': 'environment', 'gh-invocation-failed': 'state' }[reason] || 'state';
        moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason });
        addFriction(dir, {
          id,
          disposition: 'blocked',
          errorClass: reason,
          layer,
          attempts: 1,
          detail: `gh pr merge #${prNumber} failed at step ${result.step}: ${result.detail}`,
        });
        return { id, mode: 'github', to: 'blocked', prNumber, reason, detail: result.detail };
      }

      // Multi-session guard (fgos-multi-session-checkout Epic 2): approve must
      // never run with cwd inside a registered session worktree. One refusal,
      // covering BOTH non-github source paths, each dangerous for its own reason:
      //   - runner: the merge below lands on the session's own detached HEAD,
      //     never main (spike-proven) — a silent "approved" item whose code
      //     never reaches main.
      //   - pull/legacy: runGoalCheck below verifies whatever cwd has checked
      //     out; a session worktree sits at its startCommit, which may predate
      //     later advances to main, so this would verify STALE code while the
      //     "verified on main" message claims otherwise, marking the item done
      //     regardless — a silent false verification.
      // Refuses BEFORE any git command or verify run: the item stays proposed,
      // main untouched. --github is exempt (handled above — it never touches the
      // local tree). Registry-based: an ad-hoc `git worktree add` never created
      // through `fgos session start` is invisible to this guard (CONTEXT.md
      // Deferred Ideas — ad-hoc unregistered worktree residual risk).
      const approveCwdReal = realpathOr(repoRoot);
      for (const session of listSessions(repoRoot)) {
        const wtReal = realpathOr(session.worktreePath);
        if (approveCwdReal === wtReal || approveCwdReal.startsWith(`${wtReal}${path.sep}`)) {
          throw new StoreError(
            'validation',
            `approve: refusing to run from inside session "${session.sessionId}" worktree at "${wtReal}" — approve must land on the main checkout, which a session worktree structurally is not. Run approve from the main checkout, or end the session first with "fgos session end ${session.sessionId}".`,
          );
        }
      }

      if (source === 'runner') {
        // Iron Law gate (D16/D17): a runner-sourced diff that touches a
        // self-modifying-capable module or trips a hard-gate keyword must not
        // land without the approver consciously acknowledging that a failing
        // test preceded the fix — fgOS cannot mechanically verify that
        // history, so the honest mechanism is a deliberate override gesture,
        // not a fabricated red/green check. One check point, inside the
        // runner block but before the leaf-vs-root split below, so it guards
        // both merge branches identically. changedFiles diffs the item's own
        // branch against the default trunk, so a leaf over-reports its file
        // set (superset of its real leaf-vs-root diff) — the fail-safe
        // direction, accepted as-is. Refuses BEFORE the dirty-tree check and
        // any git mutation: the item stays `proposed`, nothing is touched.
        const ironLaw = classifyIronLaw({ filesChanged: changedFiles(repoRoot, item), description: item.description });
        if (ironLaw.required && !flags['acknowledge-iron-law']) {
          throw new StoreError(
            'validation',
            `approve: "${id}" trips the Iron Law — a failing test must precede this self-modifying diff before it can land. `
              + `Matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}]. `
              + `Re-run with --acknowledge-iron-law to confirm failing-test-first proof and proceed.`,
          );
        }

        if (!isMainTreeClean(repoRoot)) {
          throw new StoreError('validation', `approve: working tree at "${repoRoot}" is not clean — commit or stash pending changes before approving "${id}".`);
        }

        // D3 leaf-vs-root split: a leaf's resolved root is a DIFFERENT item
        // (resolveRoot walks item.parent up to the top); a root's resolved
        // root is itself.
        const rootId = resolveRoot(view, id);

        if (rootId !== id) {
          const rootBranch = branchNameFor(rootId);
          // Ephemeral worktree checked out on fgw/<rootId> (guaranteed to
          // exist by the time a leaf reaches "proposed" — dispatch-side
          // wiring, cell fan-out-parallel-9) — never the human's own main
          // checkout. ASSUMPTION (acknowledged, not fixed in this cell):
          // this races a concurrent approval of a sibling leaf of the same
          // root, or the runner's own dispatch of that root, since
          // createWorktree's branch-reuse path force-reclaims any existing
          // checkout of fgw/<rootId>; low-likelihood under single-operator
          // P6, D16's per-root merge-mutex lives in the runner's
          // write-queue, not this human-driven CLI verb.
          const ephemeral = createWorktree(repoRoot, rootId, {});
          try {
            const result = await mergeRunnerItem(ephemeral.path, item, { timeoutMs });

            if (result.outcome === 'conflict') {
              moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason: 'merge-conflict' });
              addFriction(dir, {
                id,
                disposition: 'blocked',
                errorClass: 'merge-conflict',
                layer: 'state',
                attempts: 1,
                detail: `git merge --no-commit --no-ff ${result.branch} into ${rootBranch} conflicted; merge aborted, ${rootBranch} unchanged`,
              });
              return { id, mode: 'merge', to: 'blocked', reason: 'merge-conflict', target: rootBranch };
            }

            if (result.outcome === 'verify-fail') {
              moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason: 'verify-fail-post-merge' });
              addFriction(dir, {
                id,
                disposition: 'blocked',
                errorClass: 'verify-miss',
                layer: 'verification',
                attempts: 1,
                detail: `goal-check failed on staged merge into ${rootBranch} (exit ${result.check.status}); merge aborted, ${rootBranch} unchanged`,
              });
              return { id, mode: 'merge', to: 'blocked', reason: 'verify-fail-post-merge', target: rootBranch, exitStatus: result.check.status, output: result.check.output };
            }

            // Merged: land the leaf's work on its root's branch, THEN
            // delete the leaf's own branch — in that exact order.
            // cleanupMergedBranch must run from the ephemeral worktree
            // (checked out on rootBranch, where the leaf is actually
            // merged) — `git branch -d` only succeeds against the checkout
            // the branch is merged INTO; running it from repoRoot/main
            // would have git silently refuse the delete (swallowed as a
            // warning), leaking the leaf's branch forever.
            const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'proposed', actor: 'human' });
            const cleanup = cleanupMergedBranch(ephemeral.path, result.branch);
            return {
              id,
              mode: 'merge',
              to: 'done',
              target: rootBranch,
              branch: result.branch,
              seq: event.seq,
              output: result.check.output,
              cleanupWarnings: cleanup.warnings,
            };
          } finally {
            // Per D4/D17: only the branch is durable, the worktree is
            // always ephemeral — removeWorktree never deletes the branch,
            // only the checkout. Runs on every exit path (conflict,
            // verify-fail, merged) — mergeRunnerItem's own conflict/
            // verify-fail outcomes already leave the ephemeral checkout
            // clean via `git merge --abort`, so no cleanupMergedBranch call
            // is needed on those paths.
            removeWorktree(repoRoot, ephemeral.path, { force: true });
          }
        }

        // Root merge into main — unchanged except for D8: a root that
        // actually had children (was a decomposed root, per replay.mjs's
        // fold which never clears `parent` on a child that reached `done`)
        // gets the distinguishing reason `integration-drift` instead of the
        // existing reason strings on a conflict/verify-fail, plus a
        // `main@<sha>` ref in the friction detail. A standalone (no
        // children) root keeps today's exact reason strings and message —
        // zero behavior change for the common case.
        const hadChildren = Object.values(view.work).some((w) => w.parent === id);

        const result = await mergeRunnerItem(repoRoot, item, { timeoutMs });

        if (result.outcome === 'conflict') {
          const reason = hadChildren ? 'integration-drift' : 'merge-conflict';
          const detail = hadChildren
            ? `cross-root integration drift at main@${currentHead(repoRoot)}; git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`
            : `git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`;
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-conflict',
            layer: 'state',
            attempts: 1,
            detail,
          });
          return { id, mode: 'merge', to: 'blocked', reason, target: 'main' };
        }

        if (result.outcome === 'verify-fail') {
          const reason = hadChildren ? 'integration-drift' : 'verify-fail-post-merge';
          const detail = hadChildren
            ? `cross-root integration drift at main@${currentHead(repoRoot)}; goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`
            : `goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`;
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'proposed', reason });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'verify-miss',
            layer: 'verification',
            attempts: 1,
            detail,
          });
          return { id, mode: 'merge', to: 'blocked', reason, target: 'main', exitStatus: result.check.status, output: result.check.output };
        }

        const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'proposed', actor: 'human' });
        const cleanup = cleanupMergedBranch(repoRoot, result.branch);
        return {
          id,
          mode: 'merge',
          to: 'done',
          target: 'main',
          branch: result.branch,
          seq: event.seq,
          output: result.check.output,
          cleanupWarnings: cleanup.warnings,
        };
      }

      // pull-door or legacy proposal: code is already on main (D4) — no
      // merge step, just re-run the item's own verify against the current
      // tree, exactly the goal-check contract `return` already uses.
      const check = await runGoalCheck(item, repoRoot, timeoutMs);
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
        return { id, mode: 'verify-only', to: 'blocked', reason: 'verify-fail', exitStatus: check.status, output: check.output };
      }
      const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'proposed', actor: 'human' });
      return { id, mode: 'verify-only', to: 'done', seq: event.seq, output: check.output };
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
      return { id, from: 'proposed', to: 'todo', reason, seq: event.seq };
    }

    // Catch-up-by-merge (D6/D7/D11, fan-out-parallel): the unified mechanism
    // that bounces a parked item — a root drift-parked at root->main (D7) or
    // a leaf conflict-parked at leaf->parent (D11), same git mechanics
    // either way per the real-conflict spike
    // (.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh) — by
    // merging the current TARGET (main for a root/standalone item, the
    // resolved parent's branch for a leaf) into the item's OWN branch,
    // re-verifying, and either landing the merge (blocked -> proposed, D18's
    // edge, mechanical/uncounted per D11) or aborting clean and leaving the
    // item blocked for a human. Deliberately does NOT call mergeRunnerItem
    // (merge.mjs) — that merges the item's branch INTO the caller's checkout,
    // the opposite direction catchup needs, and its source ref is hardcoded
    // to the item's own branch (main as a *source* cannot be expressed
    // through it) — so the git sequence is written inline here instead,
    // mirroring the spike's proven shape (merge --no-commit --no-ff ->
    // verify -> commit-or-abort, verify strictly before any commit).
    case 'catchup': {
      const id = requireField(positional[0] ?? flags.id, 'catchup requires an id: fgos catchup <id> [--timeout <ms>]');
      const timeoutFlag = optionalField(flags.timeout, 'catchup --timeout requires a numeric millisecond value (omit --timeout entirely for no timeout)');
      let timeoutMs;
      if (timeoutFlag !== undefined) {
        timeoutMs = Number(timeoutFlag);
        if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
          throw new StoreError('validation', `catchup --timeout must be a positive number of milliseconds (got "${timeoutFlag}").`);
        }
      }

      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `catchup: work "${id}" not found.`);
      }
      if (item.status !== 'blocked') {
        throw new StoreError('precondition', `catchup: work "${id}" is "${item.status}", not "blocked" — nothing to catch up.`);
      }

      // Only a merge-related park is something this mechanism can address —
      // any other blocked reason (e.g. anti-loop-max-visits,
      // runner-crash-reclaim) needs a human's real take/return rework
      // instead, never an automated catch-up.
      const CATCHUP_REASONS = new Set(['merge-conflict', 'verify-fail-post-merge', 'integration-drift']);
      if (!CATCHUP_REASONS.has(item.reason)) {
        throw new StoreError(
          'validation',
          `catchup: work "${id}" is blocked for reason "${item.reason ?? '(none)'}" — catchup only resolves a merge-related park (merge-conflict/verify-fail-post-merge/integration-drift); use take/return for a manual rework instead.`,
        );
      }

      const repoRoot = process.cwd();
      const ownBranch = branchNameFor(id);
      // Guards against a human hand-forcing an inapplicable blocked state
      // (e.g. `fgos move <id> --to blocked --reason integration-drift` on a
      // branchless pull/legacy item) from silently creating a bogus branch
      // instead of failing loudly — checked before any git operation runs.
      if (!branchExists(repoRoot, ownBranch)) {
        throw new StoreError(
          'validation',
          `catchup: work "${id}" has no live branch "${ownBranch}" — this blocked state was not produced by a merge-related park; refusing rather than creating a bogus branch.`,
        );
      }

      // Leaf (resolved root is a DIFFERENT item) targets its parent's
      // integration branch; a root/standalone item (resolved root is
      // itself) targets main — the exact D3/D11 split `approve` already
      // uses (resolveRoot).
      const rootId = resolveRoot(view, id);
      const target = rootId !== id ? branchNameFor(rootId) : 'main';

      // Ephemeral worktree checked out on the item's OWN branch (confirmed
      // to exist above, so this always takes the branch-reuse path — no
      // baseRef needed, D17: only the branch is durable, every checkout is
      // ephemeral). Removed on every exit path via the finally block below.
      const ephemeral = createWorktree(repoRoot, id, {});
      try {
        let conflicted = false;
        try {
          execFileSync('git', ['merge', '--no-commit', '--no-ff', target], { cwd: ephemeral.path, encoding: 'utf8', shell: false });
        } catch {
          conflicted = true;
        }

        if (conflicted) {
          let conflictedFiles = '';
          try {
            conflictedFiles = execFileSync('git', ['diff', '--name-only', '--diff-filter=U'], { cwd: ephemeral.path, encoding: 'utf8', shell: false }).trim();
          } catch {
            // best-effort — the message below still reports the conflict
            // even if listing the conflicted files itself fails.
          }
          try {
            execFileSync('git', ['merge', '--abort'], { cwd: ephemeral.path, encoding: 'utf8', shell: false });
          } catch (abortErr) {
            // A genuinely unexpected git failure (not a conflict, not a red
            // verify) — a real bug, not a defined outcome; propagate as-is
            // so it surfaces as "unexpected" (exit 1), never masked as a
            // clean park.
            throw abortErr;
          }
          // No automated conflict RESOLUTION per this cell's prohibitions —
          // only detection + clean reporting; the item stays blocked
          // (unchanged) for a human to resolve manually via the existing
          // take/return branch flow.
          return {
            id,
            outcome: 'conflict',
            target,
            branch: ownBranch,
            conflictedFiles: conflictedFiles ? conflictedFiles.split('\n').filter(Boolean) : [],
          };
        }

        // Clean merge staged (not yet committed) — the item's OWN verify
        // runs on this staged tree BEFORE any commit, mirroring
        // mergeRunnerItem's own verify-before-commit discipline exactly.
        const check = await runGoalCheck(item, ephemeral.path, timeoutMs);
        if (!check.passed) {
          try {
            execFileSync('git', ['merge', '--abort'], { cwd: ephemeral.path, encoding: 'utf8', shell: false });
          } catch (abortErr) {
            throw abortErr;
          }
          return { id, outcome: 'verify-fail', target, branch: ownBranch, exitStatus: check.status, output: check.output };
        }

        execFileSync('git', ['commit', '-m', `catch-up: merge ${target} into ${ownBranch}`], { cwd: ephemeral.path, encoding: 'utf8', shell: false });
        // D18's edge: mechanical, uncounted reconcile-success — never
        // touches 'doing', so anti-loop's visitCount never sees it. No
        // reason/ask required on this edge (fsm.mjs).
        const { event } = moveWork(dir, { id, to: 'proposed', expectedStatus: 'blocked', actor: 'runner' });
        return { id, outcome: 'merged', from: 'blocked', to: 'proposed', target, branch: ownBranch, seq: event.seq, output: check.output };
      } finally {
        removeWorktree(repoRoot, ephemeral.path, { force: true });
      }
    }

    // Gate A — candidate ranking (self-improve-loop P13 Slice 1, D1/D3/D6):
    // two-shot, flag-driven, NEVER an interactive stdin loop (D11). `fgos
    // evolve` (no --pick) ranks every id with unsettled friction and prints
    // the full list; `fgos evolve --pick <id>` reprints that candidate's
    // full friction record. Request-class per D1 (same contract as
    // `ready`/`list`/`check`): reads the view via `listWork` ONLY — never
    // `rebuild`/`rebuild`-adjacent writers — so a run never appends an
    // event or touches state.json. Running with no `--pick` IS the "stop"
    // outcome (D6); there is no separate cancel input and no re-prompt on a
    // bad `--pick` id (D11) — an unmatched id is a clean validation error.
    case 'evolve': {
      const pickId = optionalField(flags.pick, 'evolve --pick requires a non-empty candidate id value (omit --pick entirely to list every candidate)');
      // Per D15: `--submit <id>` is the only mutating action across the
      // whole evolve/Gate A surface — `evolve` (no flag) and `evolve --pick`
      // above are unchanged from Slice 1.
      const submitId = optionalField(flags.submit, 'evolve --submit requires a non-empty candidate id value');
      const view = listWork(dir);
      const candidates = rankCandidates(view);
      if (submitId !== undefined) {
        const picked = candidates.find((c) => c.id === submitId);
        if (!picked) {
          throw new StoreError(
            'validation',
            `evolve --submit: "${submitId}" is not an open candidate — run "fgos evolve" to see the current ranked list.`,
          );
        }
        return submitWork(dir, describeCandidate(picked));
      }
      if (pickId === undefined) {
        return candidates;
      }
      const picked = candidates.find((c) => c.id === pickId);
      if (!picked) {
        throw new StoreError(
          'validation',
          `evolve --pick: "${pickId}" is not an open candidate — run "fgos evolve" to see the current ranked list.`,
        );
      }
      // Reuses the existing friction-record collector (collectFrictionData
      // above) rather than a new one — the picked candidate's "full record"
      // IS that id's friction data.
      return collectFrictionData(view, pickId);
    }

    // Backlog-triage impact ranking (P21) — separate from P14's intake-time
    // risk/lane classification: this ranks open work by blocking fan-out
    // (how many other open items it unblocks), not by how risky it is.
    case 'triage': {
      return rankImpact(listWork(dir));
    }

    // Opt-in per-session git worktree lifecycle (fgos-multi-session-checkout
    // Epic 1, D6/D7): a first-class `session` verb family wiring session.mjs's
    // createSession/endSession/listSessions. `start` opens a detached-HEAD
    // worktree on the current HEAD (zero new branches) with a `.fgos` symlink
    // back to the one shared store (D10) and prints where to `cd`; `end`
    // removes it, refusing a diverged (dangling-commit) session without
    // --force and naming the sha(s); `list` prints the registry. session.mjs
    // raises SessionError for every lifecycle failure (unknown id, divergence
    // refusal, git failure) — surfaced here as `validation` (exit 4) so a bad
    // input is a clean categorized exit, never an uncaught crash. repoRoot is
    // the caller's cwd, the same root every other git-backed verb uses.
    case 'session': {
      const sub = requireField(positional[0], 'session requires a sub-verb: fgos session <start|end|list> ...');
      const repoRoot = process.cwd();
      try {
        if (sub === 'start') {
          const itemId = optionalField(flags.item, 'session start --item requires a non-empty id value (omit --item entirely to start a session with no item bound)');
          const entry = createSession(repoRoot, { itemId });
          return { ...entry };
        }
        if (sub === 'end') {
          const sessionId = requireField(positional[1], 'session end requires a session id: fgos session end <session-id> [--force]');
          const entry = endSession(repoRoot, sessionId, { force: Boolean(flags.force) });
          return { ...entry, forced: Boolean(flags.force) };
        }
        if (sub === 'list') {
          return listSessions(repoRoot);
        }
        throw new StoreError('validation', `unknown session sub-verb "${sub}". Usage: fgos session <start|end|list> ...`);
      } catch (err) {
        if (err instanceof SessionError) {
          throw new StoreError('validation', err.message);
        }
        throw err;
      }
    }

    default:
      throw new StoreError('validation', `unknown verb "${verb ?? ''}". Usage: fgos <init|add|submit|discover|move|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|reject|catchup|evolve|triage|session> ...`);
  }
}

// ─── --help / --help --json: machine-readable verb manifest (P37 deliverable
// b) — mirrors `.bee/bin/bee.mjs`'s publicManifestEntries/renderHelpText/
// handleHelp exactly. The manifest itself is NEVER wrapped in the fgos.v1
// envelope (wrapEnvelope) — it is metadata about the CLI's own verb surface,
// not a verb's data payload, the same distinction bee.mjs draws for its own
// `--help --json`.

function publicManifestEntries() {
  return COMMAND_REGISTRY.map(({ name, invoke, description, parameters, examples, access, deprecated }) => ({
    name,
    invoke,
    description,
    parameters,
    examples,
    access,
    deprecated,
  }));
}

function renderHelpText() {
  const lines = [`fgos — the fgOS work-item CLI (schema_version ${SCHEMA_VERSION})`, ''];
  for (const entry of publicManifestEntries()) {
    lines.push(`${entry.invoke} [${entry.access}]`);
    lines.push(`    ${entry.description}`);
    const required = entry.parameters?.required || [];
    if (required.length) lines.push(`    required: ${required.map((r) => `--${r}`).join(', ')}`);
    if (entry.deprecated) {
      lines.push(`    DEPRECATED since ${entry.deprecated.since} — use "${entry.deprecated.use_instead}" instead.`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function handleHelp(json) {
  if (json) {
    const manifest = { schema_version: SCHEMA_VERSION, commands: publicManifestEntries() };
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  } else {
    process.stdout.write(renderHelpText());
  }
}

async function main() {
  const [, , verb, ...rest] = process.argv;

  if (verb === '--help') {
    handleHelp(rest.includes('--json'));
    process.exitCode = 0;
    return;
  }

  const { flags, positional } = parseArgs(rest);

  try {
    const data = await runVerb(verb, flags, positional, dataDir());
    process.stdout.write(`${JSON.stringify(wrapEnvelope(data), null, 2)}\n`);
    process.exitCode = 0;
  } catch (err) {
    process.stderr.write(`fgos: ${err.message}\n`);
    process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1;
  }
}

main();
