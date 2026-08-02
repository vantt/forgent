#!/usr/bin/env node
// bin/fgos.mjs — the fgos CLI: the single door onto `.fgos/` (per D3/D5).
//
// Audience (per CONTEXT.md Terms, single-door): a consumer that cannot be
// assumed to be an agent — so every outcome is a categorized exit code
// (R4), and callers should branch on the code, never on the message text.
//
// Exit codes (R4): The canonical exit-code table lives in src/state/store.mjs's
// EXIT_CODES export (codes 2-5, 7-9; 0=ok, 1=unexpected) plus src/runner/loop.mjs's
// EXIT_BUSY (code 6, runner-only state).
//
// This file never writes to `.fgos/` itself — every mutation goes through
// src/state/store.mjs, the sole write door.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { initStore, addWork, moveWork, editWork, addDecision, addOutcome, addFriction, listWork, readyWork, isDepsAndLineageReady, graphMetrics, graphWhatIf, staleDoingAdvisory, footprintConflicts, readRawEvents, rebuild, putInAwaiting, answerAwaiting, setFocus, goalFocusShow, registerTool, removeTool, assertAcceptanceEvidence, StoreError, EXIT_CODES, categoryOf } from '../src/state/store.mjs';
import { probeTool, readLocalStatus, writeLocalStatus, resolvedStatus, normalizeCapability } from '../src/state/tool-registry.mjs';
import { repairTruncatedLastLine, EventLogError } from '../src/state/events.mjs';
import { deriveTitle, classify, generateId } from '../src/intake/classify.mjs';
import { wrapEnvelope } from '../src/state/envelope.mjs';
import { loadRunnerConfig, ensureRunnerConfigForDir } from '../src/runner/dispatch.mjs';
import { readGateBypassLevel } from '../src/state/gate-bypass.mjs';
import { resolveFgosDir, fgosDirFromRoot } from '../src/runner/paths.mjs';
import { resolveDiscovery } from '../src/intake/discovery.mjs';
import { resolveDecompose } from '../src/intake/decompose.mjs';
import { computeEntropy, computeCounts } from '../src/report/entropy.mjs';
import { buildEnduserIndex, QUADRANTS, QUADRANT_DIR_ALIASES, findSourceCaptureIds } from '../src/report/enduser-index.mjs';
import { rankCandidates } from '../src/evolve/candidates.mjs';
import { rankImpact } from '../src/state/impact.mjs';
import { RESOLVED_STATUSES } from '../src/state/frontier.mjs';
import { mergeReadiness } from '../src/state/graph-harness.mjs';
import { paginate } from '../src/state/cursor.mjs';
import { runGoalCheck } from '../src/runner/goal-check.mjs';
import { frozenJudgeHits } from '../src/runner/frozen-judge.mjs';
import { classifySource, reviewDiff, mergeRunnerItem, cleanupMergedBranch, changedFiles, isWorkingTreeClean as isMainTreeClean, isFgosOnlyStatusLine, buildOwnFileSet, detectTrunk, isMainWorktree } from '../src/runner/merge.mjs';
import { createGitHubPR, mergeGitHubPR, viewGitHubPRStatus } from '../src/runner/github-adapter.mjs';
import { classifyIronLaw } from '../src/evolve/iron-law.mjs';
import { driftStatus } from '../src/state/drift-status.mjs';
import { branchNameFor, branchExists, withMergeEphemeralWorktree, provisionDependencies } from '../src/runner/worktree.mjs';
import { claimWork, ClaimError } from '../src/runner/claim-port.mjs';
import { withLockRetry } from '../src/runner/lock-wait.mjs';
import {
  acquireMainCheckoutLock,
  releaseMainCheckoutLock,
  releaseMainCheckoutLockIfOwn,
  forceReclaimAmbiguousLock,
  inspectMainCheckoutLock,
  ACQUIRED,
  HELD,
  DEFAULT_TTL_MS,
  formatLockDurationMs,
} from '../src/runner/main-checkout-lock.mjs';
import { resolveWriterIdentity } from '../src/runner/session-identity.mjs';
import { createSession, endSession, listSessions, reclaimOrphanedSessions, SessionError } from '../src/runner/session.mjs';
import { resolveRoot } from '../src/runner/root-affinity.mjs';
import { visitCount } from '../src/runner/anti-loop.mjs';
import { DEFAULTS } from '../src/state/work.mjs';
import { getDomain, stageForStep } from '../src/state/workflow-stage-graphs.mjs';
import { writeCoexistenceManifest } from '../src/install/coexist.mjs';
import { MANIFEST_SCHEMA_VERSION, COMMAND_REGISTRY } from '../src/cli/command-registry.mjs';
import { recordInvocationFault } from '../src/cli/invocation-fault-log.mjs';
import { recordApprovePostSuccessFault } from '../src/cli/approve-fault-log.mjs';
import { computeAwaitingContext } from '../src/state/awaiting-context.mjs';
import { DOCTOR_CHECKS, integrationScriptPath, ensureSharedConfigDefaults, runFixes } from '../src/setup/checks.mjs';
import { sharedConfigFilePath, readSharedConfig } from '../src/config/shared-config-file.mjs';
import { assessCleanupReadiness } from '../src/state/cleanup-harness.mjs';
import { DEFAULT_CLEANUP_TTL_DAYS } from '../src/setup/registrations.mjs';
import { installGitHooks, uninstallGitHooks } from '../src/setup/git-hooks.mjs';
import { detectRcFiles, insertSourceLine, hasSourceLine } from '../src/setup/shell-rc.mjs';
import { formatCheck, bold } from '../src/setup/ansi.mjs';

// D5: `verify` is a required non-empty field on every work item, but a
// free-text submission has no verification plan yet — that is P15's job. The
// submit verb fills a fixed sentinel so validation passes; it is always
// overridable by a later edit.
const SUBMIT_VERIFY_SENTINEL = 'chưa xác định — P15 bổ sung';

// `overrideDir` (tsk-56t D1): an explicit, opt-in escape hatch alongside D5's
// strict cwd resolution, never a replacement for it — omitting `--dir`
// leaves every existing caller byte-identical to before this cell. A
// worktree-resident session (no `.fgos/` at its own cwd, per ADR0020) passes
// `--dir <mainRoot>` to reach the one real store explicitly, instead of the
// CLI silently git-resolving upward (which would reopen D5 for every caller,
// not just this one).
function dataDir(overrideDir) {
  if (overrideDir !== undefined) {
    if (typeof overrideDir !== 'string' || !overrideDir.trim()) {
      throw new StoreError('validation', '--dir requires a non-empty path value');
    }
    return fgosDirFromRoot(overrideDir);
  }
  // strict: true — this CLI's `.fgos/` always lives under the caller's own
  // cwd, never git-resolved upward (D5, matches the pull-door assumption
  // in gitAt's own comment below).
  return resolveFgosDir(process.cwd(), { strict: true });
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

// `return`'s per-item gate — scoped to `cwd`'s OWN subtree, never the whole
// real repo (`cwd` is the item's working directory, not necessarily the git
// top-level: STR60 dogfood-fixture has `.fgos` under `repo/dogfood-fixture/`,
// real top-level at `repo/`; an unrelated uncommitted file elsewhere in the
// repo must never block a return for THIS item). Delegates to merge.mjs's
// isWorkingTreeClean (imported above as isMainTreeClean) with `scope:
// 'subtree'` — the single shared implementation `approve`'s whole-repo gate
// also uses, so both gates share one prefix computation and one `.fgos/`
// exclusion rule instead of two.
function isWorkingTreeClean(cwd, ownFileSet = null) {
  return isMainTreeClean(cwd, ownFileSet, { scope: 'subtree' });
}

function commitsSince(cwd, from, to) {
  return parseInt(gitAt(cwd, ['rev-list', '--count', `${from}..${to}`]).trim(), 10) || 0;
}

// STR63: the file paths `return` actually changed between `from` and `to` —
// the input frozenJudgeHits checks against the item's declared `footprint`.
// A literal tree diff (not a merge-base range): `commitsSince` above walks
// `from..to` because it's counting commits, but a two-ref `git diff` already
// compares the two trees directly, so no `..`/`...` range syntax is needed.
function changedFilesSince(cwd, from, to) {
  return gitAt(cwd, ['diff', '--name-only', from, to])
    .split('\n')
    .filter((line) => line.trim() !== '');
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

// tsk-6c2 D3: retry-with-backoff on main-checkout-lock contention is
// default ON for take/pick/approve -- no flag needed. `--wait <ms>` tightens
// the wait budget (never extends past the lock's own remainingTtlMs,
// withLockRetry's job); bare `--wait` (no value) is a harmless no-op alias
// for the default. `--no-wait` is the opt-out, restoring today's exact
// immediate-fail-on-HELD behavior.
function parseWaitFlags(flags, verbName) {
  const noWait = Boolean(flags['no-wait']);
  let waitMs;
  if (flags.wait !== undefined && flags.wait !== true) {
    waitMs = Number(flags.wait);
    if (!Number.isFinite(waitMs) || waitMs <= 0) {
      throw new StoreError('validation', `${verbName} --wait must be a positive number of milliseconds (got "${flags.wait}").`);
    }
  }
  return { noWait, waitMs };
}

// Shared --timeout/--no-timeout resolution for return/approve/catchup
// (tsk-3vo D2/D3/D5): omitting both falls back to .fgos-runner.json's own
// timeoutMs -- the same value and the same runGoalCheck primitive the
// runner loop already uses at loop.mjs -- instead of silently running
// verify unbounded, which used to leave a hung verify command with no
// diagnosis and the main-checkout lock held until TTL expiry. --no-timeout
// is the only way left to opt into an actually-unbounded verify run.
function resolveVerifyTimeoutMs(verb, flags, repoRoot) {
  const timeoutFlag = optionalField(
    flags.timeout,
    `${verb} --timeout requires a numeric millisecond value (omit both --timeout and --no-timeout to use the configured default; pass --no-timeout for no limit)`,
  );
  const noTimeout = flags['no-timeout'] !== undefined;
  if (noTimeout && timeoutFlag !== undefined) {
    throw new StoreError('validation', `${verb}: --timeout and --no-timeout are mutually exclusive -- pass at most one.`);
  }
  if (noTimeout) {
    return undefined;
  }
  if (timeoutFlag !== undefined) {
    const timeoutMs = Number(timeoutFlag);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new StoreError('validation', `${verb} --timeout must be a positive number of milliseconds (got "${timeoutFlag}").`);
    }
    return timeoutMs;
  }
  return ensureRunnerConfigForDir(repoRoot).timeoutMs;
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

// Per str73-done-flip-cos-check D2: --acceptance carries a JSON-encoded array
// of {text, evidence} clauses (never parseListFlag's comma-separated shape —
// clause text may itself contain commas), threaded identically through
// add/submit/edit. Omitted entirely leaves the field undefined (present-or-
// absent optional additive, same as --footprint); a malformed value (not a
// string, or a string that fails JSON.parse) is refused here as a validation
// error rather than an uncaught crash — work.mjs's validateWork stays the
// single source for the {text, evidence} shape rule itself.
function parseAcceptanceFlag(value, message) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new StoreError('validation', message);
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new StoreError('validation', `${message} (invalid JSON: ${err.message})`);
  }
}

// Pagination opt-in (str46-io-contract D5/D35): `ready`/`triage`/`evolve`
// (bare)/`list` each accept --cursor/--limit. Reads both flags and validates
// --limit shape; the caller decides whether to actually paginate (see
// paginateVerbResult below) — this only parses.
function readPaginationFlags(flags, verbLabel) {
  const cursor = optionalField(flags.cursor, `${verbLabel} --cursor requires a non-empty cursor value`);
  const rawLimit = optionalField(flags.limit, `${verbLabel} --limit requires a positive integer value`);
  if (rawLimit === undefined) return { cursor, limit: undefined };
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new StoreError('validation', `${verbLabel} --limit requires a positive integer value`);
  }
  return { cursor, limit };
}

// Wraps `items` (an array of {id, ...} objects already in the verb's own
// order) through cursor.mjs's paginate() ONLY when the caller actually passed
// --cursor or --limit — omitting both returns `items` completely unchanged
// (per D35: the four paginated verbs' default output stays byte-identical to
// before this cell). `order` is this verb's own literal order tag (e.g.
// 'ready-v1'), named once at the call site.
function paginateVerbResult(items, flags, order, verbLabel) {
  const { cursor, limit } = readPaginationFlags(flags, verbLabel);
  if (cursor === undefined && limit === undefined) return items;
  return paginate(items, { cursor, limit, order });
}

// One structured entry per item, always naming both halves explicitly
// (`predicted`/`actual`) even when a half is still missing (null) — this is
// what makes the output real CoS evidence (per plan Approach S1) rather than
// a bare "has outcome" flag: a reader (agent or e2e assertion) sees the
// actual predicted/actual VALUES, not just their presence. `docType` is the
// optional Diataxis tag (CONTEXT D5/D6): surfaced the same way — present as
// its real value when the capture was tagged, `null` when untagged — so an
// untagged item's output shape stays byte-identical to pre-docType logs.
// `docPath` (CONTEXT D12/D15, bước-3) is the same additive idiom: the
// end-user doc path the capture's `docType` was written for, surfaced as its
// real value when supplied to `compound --doc-path` and `null` when omitted
// — a capture with no doc-path stays byte-identical to pre-docPath logs.
function collectOutcomeEntry(id, entry) {
  return {
    id,
    predicted: entry?.predicted ?? null,
    actual: entry?.actual ?? null,
    docType: entry?.docType ?? null,
    docPath: entry?.docPath ?? null,
  };
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
// S3-closeout, vision §8): per-kind/role counts over ALL matching records,
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
  const byKindRole = {};
  for (const r of records) {
    const key = `${r.kind}/${r.role ?? 'unknown'}`;
    byKindRole[key] = (byKindRole[key] ?? 0) + 1;
  }
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-SETTLEMENT_DISPLAY_CAP)
    .reverse();
  return { count: records.length, byKindRole, recent };
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
// tsk-4on D2: gates `return --no-new-commits-ok` (bin/fgos.mjs's `return`
// case) — refuses the flag whenever this item's outcome history has EVER
// recorded a `blocked` actual outcome, item-wide, not scoped to the
// current claim. `view.outcomes[id].actual` survives an intervening
// retake untouched (replay.mjs's fold only spreads whichever of
// `predicted`/`actual` a given `work.outcome` event's payload carries; a
// retake's claim-time event only ever carries `predicted`), so this keeps
// seeing a real past verify-fail even after a blocked-retake resets
// `branchHeadAtTake`/`headAtTake` to the retake-time tip — closing the
// exact loop the flag would otherwise open: retake a blocked item, invoke
// the flag with zero new commits, hope verify passes for unrelated
// reasons. The flag can only close out work that was never returned at
// all, never rescue a failed retry.
function assertNoPriorBlockedOutcome(view, id) {
  if (view.outcomes?.[id]?.actual?.outcome === 'blocked') {
    throw new StoreError(
      'validation',
      `return: "${id}" cannot use --no-new-commits-ok — this item was previously blocked by a failed verify; the flag only closes out work that was never returned, never rescues a failed retry. Commit new work and retry return normally.`,
    );
  }
}

function collectMissingOutcomeNag(view, id) {
  const outcomes = view.outcomes ?? {};
  const FINAL_STATUSES = new Set(['awaiting-approval', 'blocked', 'delivered', 'retrospective', 'cleanup', 'done']);
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
  const classified = classify(text);
  // Per str51-llm-assist-classify D2/D5: --tier/--kind/--risk are
  // independently overridable per-field; an omitted flag falls through to
  // classify(text)'s own mechanical default for exactly that field, so a
  // flagless call stays byte-identical to the pre-feature behavior.
  const tier = opts.tier ?? classified.tier;
  const kind = opts.kind ?? classified.kind;
  const risk = opts.risk ?? classified.risk;
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
    // Per D4 (str83-fgos-slash-commands): --deps threaded from opts the
    // same way --domain/--discovered-from already are, immediately below.
    // opts.deps defaults to [] (parseListFlag's own undefined-input
    // shape), so an omitted --deps flag stays byte-identical to the prior
    // hardcoded deps: [].
    deps: opts.deps ?? [],
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
    // Per str73-done-flip-cos-check D2: --acceptance threaded from opts the
    // same way --domain/--discovered-from are, immediately above.
    acceptance: opts.acceptance,
    // --docs-ref threaded from opts the same way, immediately above.
    docsRef: opts.docsRef,
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
      // D4 fail-safe, same discipline as the coexistence manifest above: a
      // missing git binary, a non-repo cwd, and a repo with zero commits all
      // land in the same catch — this is a plain non-fatal notice, not a
      // distinction worth making.
      let gitHeadless = false;
      try {
        execFileSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: path.dirname(dir), encoding: 'utf8', shell: false });
      } catch {
        gitHeadless = true;
      }
      return { dir, detectedHarnesses, ...(gitHeadless ? { gitHeadless: true } : {}) };
    }

    case 'add': {
      // --id is optional (was required): an explicit id is still honored
      // as-is (e.g. a deliberately chosen or parent-lineage child id like
      // "tsk-4vo-1"), but omitting it now reuses `submit`'s own generateId
      // (src/intake/classify.mjs) to derive a collision-free "tsk-<hash>"
      // id from --title, instead of forcing the caller to invent one by
      // hand. This closes the gap that let `add` accept an arbitrarily
      // long slugified-title id in the first place (docs/explanation/
      // long-work-item-ids-max-length-guard.md) — generateId is now the
      // path of least resistance, not a manually-typed guess.
      const idFlag = optionalField(positional[0] ?? flags.id, 'add --id requires a non-empty value; omit --id entirely to auto-generate one from --title.');
      const id = idFlag ?? generateId(
        requireField(flags.title, 'add requires --title (used to derive the id when --id is omitted, and always required as the item\'s own title regardless)'),
        Object.keys(listWork(dir).work),
      );
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
        // parent-flag-cli D1/D2: --parent is an optional scalar lineage flag,
        // same omitted-leaves-undefined shape as --discovered-from above
        // (whose own comment already calls out mirroring `parent`'s norm).
        // Existence of the referenced id is deliberately never enforced here
        // — work.mjs's shape validation (non-empty, non-self-referencing) is
        // the only guard, same as discoveredFrom.
        parent: optionalField(flags.parent, 'add --parent requires a non-empty id; omit --parent entirely to leave unset.'),
        // Per work-graph-intelligence S9: --footprint is an optional list of
        // the file paths this item is expected to touch (feeds the
        // footprint-intersection advisory). Set ONLY when the flag is present
        // so an omitted flag leaves footprint ABSENT (present-or-absent
        // optional additive), unlike deps/refs which default to []. An empty
        // `--footprint ''` parses to [] explicitly.
        footprint: flags.footprint === undefined ? undefined : parseListFlag(flags.footprint),
        // Per p50-workflow-induct D7: --docs-ref is an optional pointer to the
        // relative docs/history/<feature>/ path this item's own decision
        // artifacts (CONTEXT.md/plan.md) live at. Same omitted-leaves-undefined
        // shape as --discovered-from/--domain/--tier above; work.mjs's
        // validateWorkShape is the single source for the non-empty-string
        // shape check, mirroring `description`'s rule.
        docsRef: optionalField(flags['docs-ref'], 'add --docs-ref requires a non-empty path; omit it to leave unset.'),
        // Per str73-done-flip-cos-check D2: --acceptance is an optional
        // JSON-encoded array of {text, evidence} clauses — same omitted-
        // leaves-undefined shape as --footprint/--docs-ref above. work.mjs's
        // validateWorkShape is the single source for the {text, evidence}
        // shape rule; a malformed JSON value is rejected here, before that.
        acceptance: parseAcceptanceFlag(flags.acceptance, 'add --acceptance requires a JSON-encoded array of {text, evidence} clauses.'),
        // Per str67-goal-directed-planning D1: --goal-tier is optional, same
        // omitted-leaves-undefined shape as --tier/--domain/--discovered-from
        // above. A goal item is always created fresh with goalTier set at
        // add time (never retrofitted via edit). An out-of-domain value
        // (not mvp/milestone) passes through unrejected here — work.mjs's
        // validateWorkShape is the single source for the GOAL_TIERS domain
        // and rejects it as validation, so that rule is never duplicated
        // here (same discipline as --tier/TIERS and --domain/DOMAINS).
        goalTier: optionalField(flags['goal-tier'], "add --goal-tier requires a value ('mvp' or 'milestone'); omit --goal-tier entirely to leave unset."),
        // Per str67-goal-directed-planning D2: --targets is an optional list
        // of ids (existing or not-yet-created) this goal item considers
        // "part of" it. Same present-or-absent shape as --footprint above,
        // NOT the default-to-[] shape --deps/--refs use: set ONLY when the
        // flag is present so an omitted flag leaves targets ABSENT. An
        // empty `--targets ''` (or a bare `--targets` with no value)
        // parses to [] explicitly, same as --footprint.
        targets: flags.targets === undefined ? undefined : parseListFlag(flags.targets),
        // Per work-item-priority-matrix D2: --urgent is optional, human-
        // entered, same omitted-leaves-undefined shape as --tier/--domain
        // above. work.mjs's validateWorkShape is the single source for the
        // URGENCY_LEVELS domain and rejects an out-of-domain value.
        urgent: optionalField(flags.urgent, "add --urgent requires a value ('low'/'medium'/'high'/'critical'); omit --urgent entirely to leave unset."),
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
        // Per D4 (str83-fgos-slash-commands): same parseListFlag helper
        // `add`'s --deps already uses (above) — an omitted flag parses to
        // [], byte-identical to the prior hardcoded deps: []. Cycle/
        // existence validation happens at the same addWork write-gate
        // every other verb goes through; no new check here.
        deps: parseListFlag(flags.deps),
        // Per str73-done-flip-cos-check D2: same optional JSON-encoded
        // acceptance flag as `add`, threaded through submitWork's opts the
        // same way domain/discoveredFrom already are, immediately above.
        acceptance: parseAcceptanceFlag(flags.acceptance, 'submit --acceptance requires a JSON-encoded array of {text, evidence} clauses.'),
        // Per str51-llm-assist-classify D2: three new optional overrides for
        // classify(text)'s per-field output, same optionalField shape as
        // add's --tier above; each is independent (D5) and omitted leaves
        // this field undefined so submitWork falls through to classify().
        tier: optionalField(flags.tier, 'submit --tier requires a tier value (e.g. light/standard/heavy); omit --tier entirely to use classify()\'s derived value.'),
        kind: optionalField(flags.kind, 'submit --kind requires a kind value; omit --kind entirely to use classify()\'s derived value.'),
        risk: optionalField(flags.risk, 'submit --risk requires a risk value; omit --risk entirely to use classify()\'s derived value.'),
        // Same optional non-empty-path field `add` already exposes
        // (bin/fgos.mjs's `add` case) — submit previously had no way to set
        // this at all, so an item created through the public door could
        // never gain a docsRef except via a later `edit --docs-ref`.
        docsRef: optionalField(flags['docs-ref'], 'submit --docs-ref requires a non-empty path; omit --docs-ref entirely to leave unset.'),
      };
      return submitWork(dir, text, opts);
    }

    // The sync branch's entry point into context-discovery (tsk-2b0 D1: hard
    // split, no fallback — this verb only ever wraps `resolveDiscovery`/
    // `judgeDiscovery`, for an item at stage `clarify`). A live session runs
    // the SAME engine the async runner sweep calls (RUL19). A clear verdict
    // moves the item to `decompose` (carrying a real verify, D10); the
    // sibling `decompose` verb below is what carries it the rest of the way.
    // The runner config (executor + tier models) is loaded the same way
    // bin/fgos-runner.mjs loads it.
    case 'discover': {
      const id = requireField(positional[0] ?? flags.id, 'discover requires an id: fgos discover <id> [--config <path>]');
      const stage = listWork(dir).work[id]?.stage;
      if (stage !== 'clarify') {
        throw new StoreError('validation', `discover: work "${id}" is at stage "${stage}", not "clarify" -- use "fgos decompose ${id}" instead.`);
      }
      // An explicit --config path stays a loud, unmodified failure on ENOENT
      // (loadRunnerConfig); only the default, unflagged path bootstraps a
      // missing config (D1/D3, ensureRunnerConfigForDir — tsk-5vf D1/D2).
      const cfg = flags.config
        ? loadRunnerConfig(flags.config)
        : ensureRunnerConfigForDir(process.cwd());
      return resolveDiscovery(dir, id, cfg, 'session');
    }

    // The sync branch's entry point into chia-việc/split-work judgment
    // (tsk-2b0 D1: hard split, no fallback — this verb only ever wraps
    // `resolveDecompose`/`judgeDecompose`, for an item at stage
    // `decompose`). A live session runs the SAME engine the async runner
    // sweep calls (D3's sync/async parity: identical trace either way, only
    // the role differs). `resolveDecompose` either passes the item through
    // to `executing`, splits it into children, or parks it in
    // `awaiting-human` (D3).
    case 'decompose': {
      const id = requireField(positional[0] ?? flags.id, 'decompose requires an id: fgos decompose <id> [--config <path>]');
      const stage = listWork(dir).work[id]?.stage;
      if (stage !== 'decompose') {
        throw new StoreError('validation', `decompose: work "${id}" is at stage "${stage}", not "decompose" -- use "fgos discover ${id}" instead.`);
      }
      const cfg = flags.config
        ? loadRunnerConfig(flags.config)
        : ensureRunnerConfigForDir(process.cwd());
      return resolveDecompose(dir, id, cfg, 'session');
    }

    case 'move': {
      const id = requireField(positional[0] ?? flags.id, 'move requires an id: fgos move <id> --to <status> [--expect <status>]');
      const to = requireField(flags.to, 'move requires --to <status>');
      const expectedStatus = optionalField(flags.expect, 'move --expect requires a status value (omit --expect entirely to skip the CAS check)');
      // --reason only matters on the awaiting-approval -> todo rejection edge (per
      // D5) and the awaiting-approval -> blocked park edge (per pr-lifecycle D3);
      // fsm.mjs is the single place that enforces "required there, ignored
      // everywhere else" — this verb just forwards whatever the caller
      // supplied.
      const reason = optionalField(flags.reason, 'move --reason requires a non-empty reason value (omit --reason entirely when not rejecting a proposal)');
      const { event } = moveWork(dir, { id, to, expectedStatus, reason, role: 'human' });
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    // work-item-status-delivered-retrospective-cleanup D9: the mechanical
    // half of retrospective — a batch sweep, run once per invocation,
    // moving every `delivered` item to `retrospective` (marking it picked
    // up for the batch synthesis pass). Never runs inline in
    // return/approve, per the same D9 decision. The actual synthesis
    // (settlement/decision/enduser-docs, formerly `fgos-compounding`'s
    // stage-triggered job) is a session's own separate work while an item
    // sits at `retrospective`; this verb only performs the mechanical
    // claim-like transition, exactly once per swept item, never the
    // synthesis itself. Moving on to `cleanup` afterward is the plain
    // generic `fgos move <id> --to cleanup` — no dedicated verb needed,
    // since `cleanup`'s own harness (below) re-verifies real content
    // exists before it will ever reach `done`.
    case 'retrospective': {
      const view = listWork(dir);
      const swept = [];
      for (const item of Object.values(view.work)) {
        if (item.status !== 'delivered') continue;
        const { event } = moveWork(dir, { id: item.id, to: 'retrospective', expectedStatus: 'delivered', role: 'system' });
        swept.push({ id: item.id, seq: event.seq });
      }
      return { swept, count: swept.length };
    }

    // work-item-status-delivered-retrospective-cleanup D8: the dedicated
    // harness gating `cleanup -> done`, never folded into return/compound.
    // Checks (cleanup-harness.mjs's assessCleanupReadiness): (1) the
    // global TTL (D7) has elapsed since the item actually entered
    // `cleanup`; (2) retrospective produced real content; (3) — only for a
    // worktree-backed domain (D5) — the merge still resolves on main. All
    // ready: performs the actual branch/worktree cleanup (cleanupMergedBranch,
    // idempotent if a synchronous cleanup already ran elsewhere) and closes
    // to `done`. Any check failing: parks `cleanup -> blocked` with every
    // failing reason joined into one `reason` string (fsm.mjs requires
    // this edge to carry one, mirroring `awaiting-approval -> blocked`).
    case 'cleanup': {
      const id = requireField(positional[0] ?? flags.id, 'cleanup requires an id: fgos cleanup <id>');
      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `cleanup: work "${id}" not found.`);
      }
      if (item.status !== 'cleanup') {
        throw new StoreError('precondition', `cleanup: work "${id}" is "${item.status}", not "cleanup" — nothing to finish.`);
      }

      const domain = getDomain(item.domain);
      const rawEvents = readRawEvents(dir);
      const repoRoot = process.cwd();
      const sharedConfig = readSharedConfig(repoRoot);
      const ttlDays = sharedConfig?.cleanup?.ttlDays ?? DEFAULT_CLEANUP_TTL_DAYS;

      const assessment = assessCleanupReadiness({
        view,
        rawEvents,
        id,
        repoRoot,
        worktreeBacked: domain.worktreeBacked ?? false,
        ttlDays,
      });

      if (!assessment.ready) {
        const reason = assessment.reasons.join('; ');
        const { event } = moveWork(dir, { id, to: 'blocked', expectedStatus: 'cleanup', reason, role: 'system' });
        return { id, to: 'blocked', reason, seq: event.seq };
      }

      let cleanupWarnings = [];
      if (domain.worktreeBacked) {
        const branch = branchNameFor(id);
        if (branchExists(repoRoot, branch)) {
          const result = cleanupMergedBranch(repoRoot, branch);
          cleanupWarnings = result.warnings;
        }
      }
      const { event } = moveWork(dir, { id, to: 'done', expectedStatus: 'cleanup', role: 'human' });
      return { id, to: 'done', seq: event.seq, cleanupWarnings };
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
      for (const field of ['title', 'description', 'kind', 'risk', 'verify', 'tier', 'urgent']) {
        if (flags[field] !== undefined) {
          patch[field] = flags[field];
        }
      }
      for (const field of ['refs', 'deps', 'footprint']) {
        if (flags[field] !== undefined) {
          patch[field] = parseListFlag(flags[field]);
        }
      }
      // Per str73-done-flip-cos-check D2/D3: --acceptance always replaces the
      // whole array (latest-wins), same semantics as --refs/--deps above,
      // but JSON-encoded rather than comma-separated (clause text may
      // contain commas) — so it gets its own parse rather than reusing
      // parseListFlag.
      if (flags.acceptance !== undefined) {
        patch.acceptance = parseAcceptanceFlag(flags.acceptance, 'edit --acceptance requires a JSON-encoded array of {text, evidence} clauses.');
      }
      // --docs-ref: same optional non-empty-path field `add` already exposes
      // (bin/fgos.mjs's `add` case), now also patchable after creation --
      // an item created via `submit` without --docs-ref (or one whose
      // feature doc gets written/moved after the fact) previously had no way
      // to ever gain this link. Kebab-case flag name, camelCase field, so it
      // cannot join the simple same-name loop above.
      if (flags['docs-ref'] !== undefined) {
        patch.docsRef = optionalField(flags['docs-ref'], 'edit --docs-ref requires a non-empty path.');
      }
      // --merge-after (tsk-2u0, docs/history/tsk-3bn-merge-conductor-harness-v2/
      // D4/D5): same latest-wins comma-separated shape as --refs/--deps
      // above, kebab flag vs camelCase field so it cannot join that simple
      // same-name loop either (same reason --docs-ref needs its own
      // handling, right above). Existence/self-reference/cycle validation
      // all happen at the write door (work.mjs's validateWork, dep-graph.mjs's
      // assertNoUnifiedCycle) — this is pure flag plumbing, no new checks.
      if (flags['merge-after'] !== undefined) {
        patch.mergeAfter = parseListFlag(flags['merge-after']);
      }
      // parent-flag-cli D2: --parent "" CLEARS the field (un-parents the
      // item), matching --refs ''/--deps '' above — but `parent` is a scalar,
      // not a list, so the clear sentinel is `null` (the value work.mjs:255
      // already treats as absent), not `[]`. Cannot reuse optionalField
      // here (add's --parent does): optionalField's requireField rejects ''
      // outright, which is correct for add (nothing to clear at creation)
      // but wrong for edit's clear semantics. A bare --parent with no value
      // (flags.parent === true) is the same valueless-flag error priority/
      // intent guard against below, not a value to fold in.
      if (flags.parent !== undefined) {
        if (flags.parent === true) {
          throw new StoreError('validation', '--parent requires a value; use --parent "" to clear it.');
        }
        patch.parent = flags.parent === '' ? null : flags.parent;
      }
      // Priority/intent (per str7-str8-priority-intent D1/D3/D6): both are
      // numeric fields, unlike the string flags in the loop above, so each
      // gets its own coercion. parseArgs sets flags[field] = true (boolean)
      // when the flag is given with no following value — Number(true) === 1,
      // which would silently write priority:1/intent:1 for a bare
      // `--priority`/`--intent` with nothing after it. Guard against that
      // BEFORE coercing: a valueless flag is a validation error, never a
      // silent 1.
      if (flags.priority !== undefined) {
        if (flags.priority === true) {
          throw new StoreError('validation', '--priority requires a numeric value.');
        }
        const priority = Number(flags.priority);
        if (!Number.isInteger(priority)) {
          throw new StoreError(
            'validation',
            `--priority must be an integer, got: ${JSON.stringify(flags.priority)}`,
          );
        }
        patch.priority = priority;
      }
      if (flags.intent !== undefined) {
        if (flags.intent === true) {
          throw new StoreError('validation', '--intent requires a numeric value.');
        }
        const intent = Number(flags.intent);
        if (!Number.isInteger(intent)) {
          throw new StoreError(
            'validation',
            `--intent must be an integer, got: ${JSON.stringify(flags.intent)}`,
          );
        }
        patch.intent = intent;
      }
      // Impact/effort (per work-item-priority-matrix D3/D5): both computed,
      // non-negative NUMBERS (not integer-only like priority/intent, since
      // they can carry a fractional composite score) -- same valueless-flag
      // guard as priority/intent above.
      for (const field of ['impact', 'effort']) {
        if (flags[field] !== undefined) {
          if (flags[field] === true) {
            throw new StoreError('validation', `--${field} requires a numeric value.`);
          }
          const value = Number(flags[field]);
          if (!Number.isFinite(value) || value < 0) {
            throw new StoreError(
              'validation',
              `--${field} must be a non-negative number, got: ${JSON.stringify(flags[field])}`,
            );
          }
          patch[field] = value;
        }
      }
      if (Object.keys(patch).length === 0) {
        throw new StoreError(
          'validation',
          'edit requires at least one field to change: --title/--description/--kind/--risk/--verify/--tier/--refs/--deps/--footprint/--acceptance/--priority/--intent/--docs-ref/--parent/--urgent/--impact/--effort/--merge-after.',
        );
      }
      const { event } = editWork(dir, { id, patch, role: 'human' });
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
      // Parent-anchor snapshot (str61 D2/D3): looked up from the CURRENT
      // view before the park below, so a later `list` read can diff the
      // parent's state against what it was at ask-time. Only stamped when
      // the item actually has a `parent` that resolves right now — a
      // missing item, or a `parent` that doesn't resolve, leaves
      // parentSnapshotAtAsk undefined, the same "no baseline" case
      // computeAwaitingContext already tolerates.
      const askView = listWork(dir);
      const parentId = askView.work[id]?.parent;
      const parent = parentId ? askView.work[parentId] : undefined;
      const parentSnapshotAtAsk = parent ? { id: parent.id, title: parent.title, status: parent.status } : undefined;
      // statusAtAsk (claim-lock §5.1): the item's OWN status right now, before
      // the park below — `doing` when a pick claim is held, `todo` otherwise.
      // answerAwaiting reads this back later to resume to the same status
      // instead of always falling to `todo`.
      const statusAtAsk = askView.work[id]?.status;
      // rationale/alternatives/source (tsk-63c D1/D3): optional, same
      // guarded-passthrough shape as the rest of ask's fields — fold into
      // gates[id] alongside ask/parentSnapshotAtAsk/statusAtAsk.
      const rationale = optionalField(flags.rationale, 'ask --rationale requires a non-empty value (omit --rationale entirely to skip it)');
      const alternatives = optionalField(flags.alternatives, 'ask --alternatives requires a non-empty value (omit --alternatives entirely to skip it)');
      const source = optionalField(flags.source, 'ask --source requires a non-empty value (omit --source entirely to skip it)');
      const { event } = putInAwaiting(dir, { id, ask: text, expectedStatus, parentSnapshotAtAsk, statusAtAsk, rationale, alternatives, source });
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    // Records the answer and resumes the item (per D2/D5) — to `todo`, or to
    // `doing` when a pick claim was held at ask-time (claim-lock §5.1,
    // answerAwaiting's own `statusAtAsk` lookup decides which). Same
    // CAS/precondition contract as `move` — the FSM enforces both the
    // `awaiting-human -> *` exit edge and that `--text` is non-empty (per
    // D2's `answer` requirement on the exit edge).
    case 'answer': {
      const id = requireField(positional[0] ?? flags.id, 'answer requires an id: fgos answer <id> --text "..." [--expect <status>]');
      const text = requireField(flags.text, 'answer requires --text "..."');
      const expectedStatus = optionalField(flags.expect, 'answer --expect requires a status value (omit --expect entirely to skip the CAS check)');
      // rationale/alternatives/source (tsk-63c D1/D3): same optional
      // guarded-passthrough shape as `ask` above.
      const rationale = optionalField(flags.rationale, 'answer --rationale requires a non-empty value (omit --rationale entirely to skip it)');
      const alternatives = optionalField(flags.alternatives, 'answer --alternatives requires a non-empty value (omit --alternatives entirely to skip it)');
      const source = optionalField(flags.source, 'answer --source requires a non-empty value (omit --source entirely to skip it)');
      const { event } = answerAwaiting(dir, { id, answer: text, expectedStatus, role: 'human', rationale, alternatives, source });
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    case 'decision': {
      const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
      const rationale = requireField(flags.rationale, 'decision requires --rationale "..."');
      const alternatives = optionalField(flags.alternatives, 'decision --alternatives requires a non-empty value (omit --alternatives entirely to skip it)');
      const source = optionalField(flags.source, 'decision --source requires a non-empty value (omit --source entirely to skip it)');
      const id = optionalField(flags.id, 'decision --id requires a non-empty value (omit --id entirely to skip per-item scoping)');
      const { event } = addDecision(dir, { text, rationale, alternatives, source, id });
      return { seq: event.seq };
    }

    case 'list': {
      const rawView = listWork(dir);
      // Single-item lookup (tsk-42m D1/D2): `--id` bypasses the open-only
      // default and `--all` entirely -- naming a specific id already
      // commits to that item regardless of status, the same way every
      // other id-based verb (take/return/review/approve/reject/rollup/
      // compound/discover) resolves `work[id]` directly and throws the
      // same not-found shape on a miss.
      if (flags.id !== undefined) {
        const id = requireField(flags.id, 'list --id requires a non-empty work id');
        const item = rawView.work[id];
        if (!item) {
          throw new StoreError('validation', `list: work "${id}" not found.`);
        }
        const singleView = { ...rawView, work: { [id]: item } };
        if (item.status === 'awaiting-human') {
          const ctx = computeAwaitingContext(singleView, id);
          if (ctx) return { ...singleView, awaitingContext: { [id]: ctx } };
        }
        return singleView;
      }
      // Open-only default (tsk-5oa D1/D2; broadened by
      // wontfix-terminal-status-filter-consistency D2): `list` shows only
      // not-RESOLVED (`done`/`wontfix`) items unless `--all` is passed,
      // matching `triage`'s pre-existing open-only default. Only the `work`
      // map changes shape here — every other view key (decisions/gates/
      // settlements/etc.) is untouched either way.
      const showAll = Boolean(flags.all);
      const view = showAll
        ? rawView
        : { ...rawView, work: Object.fromEntries(Object.entries(rawView.work).filter(([, item]) => !RESOLVED_STATUSES.has(item.status))) };
      // Parent-anchored context (str61 D1/D2/D3): additive-only key,
      // computed fresh from `view` on every read (D1 — never a persisted
      // "session"), never touching store.listWork itself. Only
      // `awaiting-human` items ever produce an entry; a repo/scenario with
      // none of them sees `view` returned byte-identical, no
      // `awaitingContext` key at all.
      const awaitingContext = {};
      for (const item of Object.values(view.work)) {
        if (item.status !== 'awaiting-human') continue;
        const ctx = computeAwaitingContext(view, item.id);
        if (ctx) awaitingContext[item.id] = ctx;
      }
      const base = Object.keys(awaitingContext).length > 0 ? { ...view, awaitingContext } : view;
      // Pagination (D5/D35): only `work` (the biggest payload, per plan.md's
      // Discovery) ever changes shape, and only when --cursor/--limit was
      // actually passed — every other view key (decisions/gates/settlements/
      // etc.) is untouched. `view.work` is a map keyed by id, so it is
      // wrapped into `{id, item}` pairs before going through the same
      // generic `paginate()` every array-returning verb uses, then unwrapped
      // back into a plain id->item map for the page itself.
      const { cursor, limit } = readPaginationFlags(flags, 'list');
      if (cursor === undefined && limit === undefined) return base;
      const entries = Object.entries(view.work).map(([id, item]) => ({ id, item }));
      const { items: pagedEntries, nextCursor } = paginate(entries, { cursor, limit, order: 'list-work-v1' });
      const workPage = Object.fromEntries(pagedEntries.map(({ id, item }) => [id, item]));
      return { ...base, work: { items: workPage, nextCursor } };
    }

    // Request-class per D1 (same contract as `list`): a pure read — never
    // appends an event, never touches state.json. Unlike `list --id`,
    // which only scopes the `work` map and leaves every per-item log
    // global, `show` scopes ALL of them to this one id -- the true
    // full-detail view of a single task
    // (docs/history/fgos-show-scoped-detail/CONTEXT.md D1). Reuses
    // `check`'s own per-item collectors (collectOutcomeEntry/
    // collectFrictionData/collectSettlementData/collectLearningData,
    // lines 335-440) for outcome/friction/settlement/learning so the two
    // verbs render identical shapes for identical data, rather than
    // reimplementing the slice.
    case 'show': {
      const id = requireField(positional[0] ?? flags.id, 'show requires an id: fgos show <id>');
      const rawView = listWork(dir);
      const item = rawView.work[id];
      if (!item) {
        throw new StoreError('validation', `show: work "${id}" not found.`);
      }
      return {
        work: item,
        discovery: rawView.discovery?.[id] ?? [],
        decisions: rawView.decisionsById?.[id] ?? [],
        gates: rawView.gates?.[id] ?? null,
        outcome: collectOutcomeEntry(id, rawView.outcomes?.[id]),
        friction: collectFrictionData(rawView, id),
        settlement: collectSettlementData(rawView, id),
        learning: collectLearningData(rawView, id),
      };
    }

    // Request-class per D1: a pure read — never appends an event, never
    // touches state.json, never creates `.fgos/` if it's missing. Goes
    // through store.readyWork only; this file never imports frontier.mjs
    // directly (per this cell's key_links).
    case 'ready': {
      return paginateVerbResult(readyWork(dir), flags, 'ready-v1', 'ready');
    }

    // Request-class per D1 (same contract as `ready`/`list`): a pure read —
    // never appends an event, never touches state.json. work-graph-intelligence
    // S5: mechanical graph metrics (connected components = independent parallel
    // tracks) folded from the view. Reaches the Domain compute core through the
    // store facade only (graphMetrics), never importing it here — same rule the
    // `ready` verb follows for `frontier`.
    case 'graph': {
      // S7: an optional `--what-if <id>` narrows the read to a single item's
      // unblock impact ("complete X -> unblocks N"); no flag returns the full
      // metrics umbrella. Both are pure reads through the store facade.
      if (flags['what-if'] !== undefined) {
        const id = requireField(flags['what-if'], 'graph --what-if requires a non-empty work id');
        return graphWhatIf(dir, id);
      }
      return graphMetrics(dir);
    }

    // Request-class per D1 (same contract as `ready`/`list`/`graph`): a pure
    // read. work-graph-intelligence S8: the evidence-classifier advisory over
    // items stuck in `doing` — classifies stale-by-owner-type (human >> agent)
    // and SUGGESTS; it never moves or reclaims anything (the runner reap is the
    // only role, and it never reclaims a person's claim).
    // Request-class per D1: a pure read, never touches state.json. Reports
    // the configured gate-bypass level (docs/history/gate-bypass/CONTEXT.md
    // D1-D5) — no CLI setter, mirroring .fgos-runner.json's own
    // edit-the-file-by-hand pattern.
    case 'gate-bypass': {
      return { level: readGateBypassLevel(dir) };
    }

    case 'stale': {
      return staleDoingAdvisory(dir);
    }

    // Request-class per D1 (same contract as `ready`/`graph`/`stale`): a pure
    // read. work-graph-intelligence S9: the footprint-intersection advisory —
    // pairs of ready items whose declared file footprints overlap, so a
    // parallel dispatch would risk a file conflict. Suggests sequence/hoist/
    // re-slice; never mutates anything.
    case 'conflicts': {
      return footprintConflicts(dir);
    }

    // Request-class per D1 (same contract as `ready`/`triage`/`conflicts`): a
    // pure read. Merge-readiness ranking (docs/history/merge-standardization/
    // CONTEXT.md/plan.md): "list" surfaces which `proposed` items are
    // actually ready to merge right now (dependency-wait gate clear, no
    // footprint conflict), ordered by `rankImpact`, alongside which ones are
    // still waiting on an unmerged dep and which are footprint-conflicted.
    // Wraps `mergeReadiness` (`src/state/graph-harness.mjs`) — never
    // reimplements the ranking here.
    case 'merge': {
      const sub = requireField(positional[0], 'merge requires a sub-verb: fgos merge <list|next>');
      // driftStatus (tsk-2u0) is computed here, once, and handed into the
      // pure mergeReadiness as opts.drift — mergeReadiness itself never
      // shells git (stays pure), this verb wrapper does the one real,
      // read-only git read that populates blockedOnSync. Best-effort: a
      // repo-less/detached cwd still returns a usable ranking (driftStatus
      // just reports no roots), same "read never throws on a legacy
      // shape" posture `review`'s own diff already has.
      const mergeView = listWork(dir);
      const drift = driftStatus(process.cwd(), mergeView);
      if (sub === 'list') {
        return mergeReadiness(mergeView, { drift });
      }
      if (sub === 'next') {
        // Picks the single top-ranked ready item and merges it by recursing
        // into the SAME `approve` case below (never a parallel merge path,
        // D6, docs/history/merge-standardization/CONTEXT.md) — `runVerb` is
        // a pure dispatcher (no printing/exit-code side effects), so
        // calling it recursively is exactly as safe as any other verb call.
        // `flags` is forwarded as-is: this never injects
        // `acknowledge-iron-law` itself (D7) — the Iron Law gate (D16/D17)
        // exists specifically to require a human-verified failing-test-
        // first proof before a self-modifying diff lands, so an unattended
        // `merge next` run must never be able to silently satisfy that
        // proof on its own authority. If the top pick trips it, this
        // reports which item and why, merges nothing, and stops — it does
        // NOT fall through to the next-ranked item (that would silently
        // change merge order semantics `merge list` already promised).
        const { ready } = mergeReadiness(mergeView, { drift });
        if (ready.length === 0) {
          return { picked: null, reason: 'nothing ready to merge' };
        }
        const id = ready[0];
        try {
          const approveResult = await runVerb('approve', flags, [id], dir);
          return { picked: id, approve: approveResult };
        } catch (err) {
          if (err instanceof StoreError && err.message.includes('Iron Law')) {
            return { picked: id, blocked: 'iron-law', message: err.message };
          }
          throw err;
        }
      }
      throw new StoreError('validation', `merge: unknown sub-verb "${sub}" (known: list, next).`);
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

    // Read-by-tag end-user doc index (bước-3, CONTEXT.md D12/D13/D14): a
    // read-only doc-centric manifest generator, NOT a merged/consolidated
    // living doc (D10 — that "gộp sống" slice is deferred). Enumerates the
    // real end-user docs under docs/<quadrant>/ for each of the four
    // Diataxis quadrants (enduser-index.mjs's QUADRANTS) — a missing
    // quadrant dir (today, only docs/how-to/ exists) is skipped cleanly,
    // never a crash. All I/O (readdir, first-H1 extraction, folding the
    // event log, writing the manifest) lives here in the entry layer;
    // `buildEnduserIndex` itself stays a PURE transform (zero imports,
    // mirrors entropy.mjs) that only assembles the manifest rows and
    // resolves each doc's `sourceCaptureId` by matching `docPath` against
    // the rebuilt outcomes view (D13's fidelity/back-link guarantee).
    //
    // Uses `listWork(dir)` — NOT `rebuild(dir)` — to fold the outcomes view:
    // both replay the SAME event log through the SAME fold logic
    // (rebuildView), but `rebuild(dir)` additionally overwrites
    // `.fgos/state.json` as a side effect, which would contradict this
    // verb's own `access: 'read'` declaration and the generator's read-only
    // prohibition (must_haves). `listWork` is store.mjs's dedicated
    // read-only facade for exactly this "current view, rebuilt fresh from
    // the log" need, with no write.
    //
    // Idempotent by construction: every run re-enumerates the doc tree from
    // scratch and re-derives the manifest from the current event log, then
    // OVERWRITES enduser-docs-index.json whole — there is no accumulating
    // state for a re-run to duplicate (D12 validation constraint (d)).
    case 'docs-index': {
      // repoRoot must track `dir` (the --dir-aware, main-checkout-resolved
      // store path), never raw process.cwd(): a worktree session's cwd is
      // its own local checkout (ADR0020), and scanning/writing against cwd
      // instead of the real shared root silently targets the wrong docs/
      // tree entirely. `dir` is always exactly `<repoRoot>/.fgos`
      // (fgosDirFromRoot, src/runner/paths.mjs), so its parent recovers the
      // one true root regardless of where this command was invoked from.
      const repoRoot = path.dirname(dir);
      const docEntries = [];
      // Scans one on-disk dir for `.md` files and pushes each as a docEntry
      // tagged with `quadrant` — the quadrant this dir counts as, which for
      // an alias dir (D2) differs from the dir's own on-disk name. A missing
      // dir is skipped cleanly (ENOENT), never a crash: not every quadrant
      // dir, nor every alias dir, is guaranteed to exist yet.
      const scanDirAsQuadrant = (quadrantDir, quadrant) => {
        let dirEntries;
        try {
          dirEntries = fs.readdirSync(quadrantDir, { withFileTypes: true });
        } catch (err) {
          if (err.code === 'ENOENT') return; // dir absent — skip cleanly, never a crash
          throw err;
        }
        for (const dirEntry of dirEntries) {
          if (!dirEntry.isFile() || !dirEntry.name.endsWith('.md')) continue;
          const absPath = path.join(quadrantDir, dirEntry.name);
          const docPath = path.relative(repoRoot, absPath).split(path.sep).join('/');
          const content = fs.readFileSync(absPath, 'utf8');
          const h1 = content.match(/^#\s+(.+)$/m);
          docEntries.push({ quadrant, docPath, title: h1 ? h1[1].trim() : null });
        }
      };
      for (const quadrant of QUADRANTS) {
        scanDirAsQuadrant(path.join(repoRoot, 'docs', quadrant), quadrant);
        for (const alias of QUADRANT_DIR_ALIASES[quadrant] ?? []) {
          scanDirAsQuadrant(path.join(repoRoot, 'docs', alias), quadrant);
        }
      }
      // fs.readdirSync order is not guaranteed stable across worktree
      // checkouts of the same doc set — sort before building the manifest
      // so re-runs over unchanged docs produce byte-identical output (a
      // prerequisite for the write-only-if-changed guard below to ever
      // actually skip a write).
      docEntries.sort((a, b) => (a.quadrant === b.quadrant ? (a.docPath < b.docPath ? -1 : 1) : (a.quadrant < b.quadrant ? -1 : 1)));
      const manifestPath = path.join(repoRoot, 'docs', 'enduser-docs-index.json');
      let previousContent;
      try {
        previousContent = fs.readFileSync(manifestPath, 'utf8');
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      // tsk-f31: sourceCaptureId can be unresolvable this run not because
      // the doc genuinely lacks a capture, but because the store itself is
      // unreachable (a worktree's .fgos/ carries no events.jsonl -- ADR0020).
      // Detected on the log file itself, not the .fgos/ directory: the
      // directory can exist (e.g. holding only main-checkout.lock) while
      // events.jsonl is absent -- readEvents' own ENOENT check
      // (src/state/events.mjs) is the real signal listWork keys off, not a
      // directory-level proxy for it. When unreachable, preserve a docPath's
      // existing on-disk value instead of regressing it to null; a
      // genuinely reachable store is the only thing allowed to overwrite a
      // prior value with null.
      const storeReachable = fs.existsSync(path.join(dir, 'events.jsonl'));
      const previousById = new Map();
      if (previousContent) {
        for (const e of JSON.parse(previousContent)) previousById.set(e.docPath, e.sourceCaptureId);
      }
      const view = listWork(dir);
      const rawEntries = buildEnduserIndex(docEntries, view.outcomes ?? {});
      const entries = rawEntries.map((e) => {
        if (!storeReachable && e.sourceCaptureId === null && previousById.get(e.docPath)) {
          return { ...e, sourceCaptureId: previousById.get(e.docPath) };
        }
        return e;
      });
      const nextContent = `${JSON.stringify(entries, null, 2)}\n`;
      if (previousContent !== nextContent) {
        fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(manifestPath, nextContent, 'utf8');
      }
      return {
        path: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
        count: entries.length,
        entries,
      };
    }

    // Read-only doc↔capture linkage gather (Slice ① gộp-sống, CONTEXT.md
    // D13/D17): given a docPath, gathers EVERY compound-learn capture linked
    // to it — via the plural `findSourceCaptureIds` helper over the SAME
    // outcomes view `docs-index` folds — each rendered as the same
    // check-content shape `fgos check` already returns
    // (id/predicted/actual/docType/docPath), so a future export skill can
    // reconstruct a living doc from source with no loss of detail (D13).
    //
    // Uses `listWork(dir)` — NOT `rebuild(dir)` — for the exact same reason
    // `docs-index` above does: both replay the same event log through the
    // same fold, but `rebuild(dir)` additionally overwrites
    // `.fgos/state.json`, which would contradict this verb's own
    // `access: 'read'` declaration. Never calls `rebuild`/`writeView`.
    //
    // A docPath with zero linked captures is SUCCESS, not an error — an
    // as-yet-unlinked doc (or one with no captures recorded) is a
    // legitimate, common state; the caller still exits 0 with an empty list.
    case 'doc-sources': {
      const docPath = requireField(
        positional[0] ?? flags['doc-path'],
        'doc-sources requires a docPath: fgos doc-sources <docPath>',
      );
      const view = listWork(dir);
      const outcomes = view.outcomes ?? {};
      const ids = findSourceCaptureIds(outcomes, docPath);
      return {
        docPath,
        count: ids.length,
        captures: ids.map((id) => collectOutcomeEntry(id, outcomes[id])),
      };
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
      const role = optionalField(flags.role, 'take --role requires "human" or "session" (omit --role entirely to default to human)') ?? 'human';
      if (role !== 'human' && role !== 'session') {
        throw new StoreError('validation', `take --role must be "human" or "session" (got "${role}").`);
      }

      let id = explicitId;
      if (!id) {
        const [head] = readyWork(dir);
        if (!head) {
          throw new StoreError('validation', 'take: the frontier is empty — no item ready to take.');
        }
        id = head.id;
      } else {
        // Explicit `--id` (choke-point-take-vs-pick-claim-eligibility): only
        // deps-done + no-open-descendant gate this branch, not stage — a
        // clarify/decompose item is claimable here exactly like `pick`
        // already allows (status and stage are independent axes, fsm.mjs).
        // The no-`--id` branch above still only ever opens `readyWork`'s own
        // frontier head, so D1 (take mirrors the runner's own auto-dispatch
        // set) stays true for that path, unchanged.
        const item = listWork(dir).work[id];
        if (!item) {
          throw new StoreError('validation', `take: work "${id}" not found.`);
        }
        if (item.status === 'todo' && !isDepsAndLineageReady(dir, id)) {
          throw new StoreError(
            'validation',
            `take: "${id}" is todo but has an unmet dependency or an open decomposed child — take only opens work the runner could actually dispatch (D1).`,
          );
        }
      }

      // A `todo` item whose own `fgw/<id>` branch already stands is never an
      // honest main-checkout take (tsk-65n). `claimWork` with isolate:false
      // records `source: main` + `headAtTake` — so `return` would later
      // measure progress against the main checkout's HEAD, which the work
      // never advances, because the work is on the branch. The claim
      // succeeds and the lie only surfaces much later, as a `return` that
      // refuses for no visible reason. Refuse here instead, naming the door
      // that claims the branch.
      //
      // Deliberately at this verb layer and NOT inside `claimWork`: the
      // runner claims through that same function with isolate:false
      // (`loop.mjs`) and must keep being able to. `blocked` + branch-exists
      // is likewise untouched — that is the branch-take path (`isBranchTake`),
      // a main-checkout claim that already records branch source correctly.
      const claiming = listWork(dir).work[id];
      const claimingBranch = branchNameFor(id);
      if (claiming?.status === 'todo' && branchExists(process.cwd(), claimingBranch)) {
        throw new StoreError(
          'validation',
          `take: "${id}" already has its own branch ${claimingBranch}, so its work lives there, not on the main checkout — a take here would claim source:main and record a headAtTake that never advances, making a later "return" refuse. Use "fgos pick ${id}" to claim the branch and its worktree instead.`,
        );
      }

      // Delegate to claim-port.mjs — single choke-point for all claim flows
      // (tsk-53f D1). take uses isolate:false (no worktree creation).
      const { noWait, waitMs } = parseWaitFlags(flags, 'take');
      const doTake = () => claimWork(dir, {
        id,
        actor: role,
        isolate: false,
        repoRoot: process.cwd(),
      });
      try {
        return noWait ? doTake() : await withLockRetry(doTake, { waitMs });
      } catch (err) {
        if (err instanceof ClaimError) {
          throw new StoreError(err.category, `take: ${err.message}`);
        }
        throw err;
      }
    }

    // Cửa pull — pick (str83-fgos-slash-commands, D1/D3; guard loosened +
    // branch-reuse generalized + claimTrigger per claim-lock §3a/§3c/§7):
    // combines take's claim logic with worktree.mjs's createWorktree in one
    // call, so `/fgOS:pick` can claim AND stand up the item's isolated
    // `fgw/<id>` worktree/branch in a single verb. No-id still opens exactly
    // take's frontier head (D1 same-set rule, unchanged). An EXPLICIT `--id`,
    // though, needs only `status: 'todo'` — no frontier/stage membership
    // check — because clarify/decompose work now claims through this same
    // door too (status and stage are independent axes, fsm.mjs; the
    // frontier-membership guard removed below was a hard check at THIS verb
    // layer, never an FSM law). `role` is never a flag here (unlike take's
    // `--role`): per D3 the picking session IS the role, always
    // `'session'`, because it is the one that will drive and later complete
    // the item end to end.
    case 'pick': {
      const explicitId = optionalField(positional[0] ?? flags.id, 'pick --id requires a non-empty id value (omit --id entirely to pick the frontier head)');
      const claimTrigger = optionalField(flags.via, 'pick --via requires a non-empty value (omit --via entirely to skip stamping claimTrigger)');

      let id = explicitId;
      if (!id) {
        const [head] = readyWork(dir);
        if (!head) {
          throw new StoreError('validation', 'pick: the frontier is empty — no item ready to pick.');
        }
        id = head.id;
      } else if (!listWork(dir).work[id]) {
        throw new StoreError('validation', `pick: work "${id}" not found.`);
      }

      // Delegate to claim-port.mjs — single choke-point for all claim flows
      // (tsk-53f D1). Handles: main-checkout-lock, moveWork, addOutcome,
      // worktree creation with correct baseRef for leaf items. Branch-reuse
      // generalized to "does fgw/<id> already exist" alone (claim-lock §3c)
      // — claimWork computes branchAlreadyExists unconditionally (not gated
      // on status === 'blocked'), so a `todo` item whose branch already
      // stands (released back to `todo` at the clarify/decompose ->
      // executing boundary, claim-lock §3b) reattaches to that same branch
      // tip via createWorktree's reuse path instead of forking a new one.
      const { noWait, waitMs } = parseWaitFlags(flags, 'pick');
      // worktreeDir under .claude/worktrees/ (tsk-424 D1/D2): the harness's
      // own EnterWorktree tool only allows a second-or-later in-session
      // switch when the target sits there, e.g. a root item decomposing
      // into a child mid-session. os.tmpdir()/fgos-worktrees (createWorktree's
      // own default) fails that check past the first switch — pick is the
      // only caller that needs the harness-chainable location; runner/
      // merge-ephemeral callers are untouched.
      const doPick = () => claimWork(dir, {
        id,
        actor: 'session',
        isolate: true,
        claimTrigger,
        repoRoot: process.cwd(),
        worktreeDir: path.join(process.cwd(), '.claude', 'worktrees'),
      });
      try {
        return noWait ? doPick() : await withLockRetry(doPick, { waitMs });
      } catch (err) {
        if (err instanceof ClaimError) {
          throw new StoreError(err.category, `pick: ${err.message}`);
        }
        throw err;
      }
    }

    // Cửa pull — return (stage-decompose S2-pull D1/R13): KHÔNG tin lời
    // người trả — this verb runs the item's OWN verify itself (the same
    // goal-check helper the runner uses, per cell action (3)) and only its
    // exit status decides. Mirrors the runner's own proposed contract
    // exactly: working tree clean (work committed) + HEAD advanced past
    // headAtTake (real progress, not a no-op) are both required BEFORE verify
    // even runs; verify green -> doing->awaiting-approval (actual, no settlement —
    // settlement belongs to the ->done edge, D4); verify red ->
    // doing->blocked + friction (mirrors the runner's own park path).
    case 'return': {
      const id = requireField(positional[0] ?? flags.id, 'return requires an id: fgos return <id> [--timeout <ms>|--no-timeout] [--no-new-commits-ok]');
      const timeoutMs = resolveVerifyTimeoutMs('return', flags, process.cwd());
      // tsk-4on D1-D3: explicit escape hatch for work already fully done
      // BEFORE this claim (e.g. a parent whose children's merged content
      // already sits on its own branch from a prior session) — return's
      // default contract (prove new work since take) stays byte-identical
      // when this flag is absent.
      const noNewCommitsOk = flags['no-new-commits-ok'] === true;

      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `return: work "${id}" not found.`);
      }
      if (item.status !== 'doing') {
        throw new StoreError('validation', `return: work "${id}" is "${item.status}", not "doing" — nothing to return.`);
      }
      if (item.claimRole !== 'human' && item.claimRole !== 'session') {
        throw new StoreError(
          'validation',
          `return: work "${id}" was not taken through the pull door (claimed by "${item.claimRole ?? 'runner'}") — return only completes a take.`,
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
          if (!noNewCommitsOk) {
            throw new StoreError(
              'validation',
              `return: branch "${branch}" has not advanced past branchHeadAtTake for "${id}" (${item.branchHeadAtTake} -> ${branchHead}) — commit the work on the branch before returning, or pass --no-new-commits-ok if the work was already done before this claim.`,
            );
          }
          assertNoPriorBlockedOutcome(view, id);
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
          // tsk-5l2-1 finding (real, kept as evidence): tmpWorktree lives
          // under os.tmpdir(), outside the repo tree — Node's ESM loader
          // never consults NODE_PATH, so a bare-specifier import (e.g.
          // "yaml") can only resolve via a real node_modules directory
          // reachable by walking up from tmpWorktree itself. A symlink
          // pointed at the nearest real install was considered here too
          // (tsk-5l2-1) and rejected for the same reason tsk-2vd D2
          // already rejected it for createWorktree: it only reflects
          // whatever the symlink source already has installed, never the
          // checked-out branch's own declared dependencies — exactly the
          // scenario (a branch merging in a new dependency before that
          // merge lands on the source's own default branch) that exposed
          // this whole gap. provisionDependencies installs for THIS
          // worktree's own package.json instead.
          provisionDependencies(tmpWorktree);
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
          // STR63: advisory only (per cos) — a hit never blocks this return.
          const frozenJudge = frozenJudgeHits(changedFilesSince(repoRoot, item.branchHeadAtTake, branchHead), item.footprint);
          const { event } = moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'doing', branchHeadAtReturn: branchHead });
          addOutcome(dir, { id, actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: branchAheadCount } });
          return { id, from: 'doing', to: 'awaiting-approval', source: 'branch', branch, aheadCount: branchAheadCount, passed: true, seq: event.seq, output: check.output, frozenJudgeHits: frozenJudge };
        }

        moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: 'verify-fail', role: 'system' });
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
      // head is computed BEFORE the clean-tree check (tsk-598 D1/D2): the
      // check itself now needs the item's own committed-diff paths
      // (headAtTake..head) to build ownFileSet — a pure read, reordering it
      // earlier changes nothing else about this branch.
      const head = currentHead(cwd);
      const ownDiff = changedFilesSince(cwd, item.headAtTake, head);
      const ownFileSet = buildOwnFileSet(ownDiff, item.footprint);
      if (!isWorkingTreeClean(cwd, ownFileSet)) {
        throw new StoreError('validation', `return: working tree at "${cwd}" is not clean — commit the work for "${id}" before returning.`);
      }
      const aheadCount = commitsSince(cwd, item.headAtTake, head);
      if (aheadCount <= 0) {
        if (!noNewCommitsOk) {
          throw new StoreError(
            'validation',
            `return: HEAD has not advanced past headAtTake for "${id}" (${item.headAtTake} -> ${head}) — commit the work before returning, or pass --no-new-commits-ok if the work was already done before this claim.`,
          );
        }
        assertNoPriorBlockedOutcome(view, id);
      }

      const check = await runGoalCheck(item, cwd, timeoutMs);
      if (check.passed) {
        // STR63: advisory only (per cos) — a hit never blocks this return.
        const frozenJudge = frozenJudgeHits(ownDiff, item.footprint);
        const { event } = moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'doing', headAtReturn: head });
        addOutcome(dir, { id, actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount } });
        // tsk-45z D1/D2: this session's own commits (landed straight on the
        // main checkout, not a branch/worktree) may still hold
        // main-checkout.lock, refreshed by .githooks/pre-commit on each one
        // and never released until TTL expiry. This point — verify green,
        // item settling to `proposed` — is the state-machine's own signal
        // that this session is done with the checkout, so release early
        // instead of leaving the next writer to wait out the TTL.
        // Identity-checked (never a blind unlink, D2): only removes the
        // lock if it is still recorded under this session's own identity.
        releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
        return { id, from: 'doing', to: 'awaiting-approval', source: 'main', aheadCount, passed: true, seq: event.seq, output: check.output, frozenJudgeHits: frozenJudge };
      }

      moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: 'verify-fail', role: 'system' });
      addOutcome(dir, { id, actual: { outcome: 'blocked', passed: false, attempts: 1, errorClass: 'verify-miss', aheadCount } });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'verify-miss',
        layer: 'verification',
        attempts: 1,
        detail: `goal-check failed (exit ${check.status})`,
      });
      // Same early-release as the passing branch above (tsk-45z D1/D2) — a
      // failed verify still means this session is done touching the main
      // checkout; the item settling to `blocked` is just as much "done with
      // the checkout" as settling to `proposed`.
      releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
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
      if (item.status !== 'awaiting-approval') {
        throw new StoreError('precondition', `review: work "${id}" is "${item.status}", not "awaiting-approval" — nothing to review.`);
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

    // tsk-480: approve's own success paths (merge landed, or verify-only
    // passed) call `moveWork(...to:'delivered'...)` as their very last
    // step. That write can throw on `events.lock` contention even though
    // the precondition it's recording already succeeded permanently —
    // without a guard, the exception would propagate uncaught, and (per
    // `invocation-fault-log.mjs`'s own documented scope) a fault raised
    // this deep inside a verb's handler is deliberately never recorded by
    // that mechanism either, so nothing at all would be left to explain
    // why a real merge landed while the item stayed `awaiting-approval`
    // forever (CONTEXT.md D1). This wraps exactly that one call: on
    // success, returns the real event; on failure, records a diagnostic
    // through `approve-fault-log.mjs` (D2 — no shared lock with
    // `events.jsonl`) and returns `event: null` instead of throwing, so
    // every call site can still finish its own cleanup and return a
    // truthful envelope.
    function moveDeliveredOrRecordFault(dir, id, phase) {
      try {
        // Test-only failure seam (tsk-480 D3), same shape as
        // FGOS_GH_COMMAND (bin/fgos.mjs ghCommandOpts): an env var read
        // only here, scoped to the exact item id so it can never affect
        // any other item in the same process, inert unless a test
        // explicitly sets it. Production code never sets this variable.
        if (process.env.FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT === id) {
          throw new EventLogError('lock-timeout', `approve: simulated lock-timeout for "${id}" (FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT)`);
        }
        const { event } = moveWork(dir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human' });
        return { event, error: null, diagnosticLog: null };
      } catch (err) {
        // Only an EventLogError (the write itself failing — e.g.
        // 'lock-timeout', src/state/events.mjs) is the class of failure
        // this guard exists for. A StoreError from transitionWork's own
        // precondition/CAS check (e.g. a missing-evidence acceptance
        // clause) is a legitimate refusal that must keep propagating
        // exactly as before — swallowing it here would silently accept an
        // item transitionWork correctly refused.
        if (!(err instanceof EventLogError)) {
          throw err;
        }
        const diagnosticLog = recordApprovePostSuccessFault(dir, { id, phase, detail: err.message });
        process.stderr.write(
          `fgos: warning: "${id}" ${phase} succeeded but its status write failed (${err.message}); `
            + `item status remains "awaiting-approval" pending manual reconciliation; `
            + `diagnostic recorded to ${diagnosticLog ?? '(unrecorded — see this stderr line)'}.\n`,
        );
        return { event: null, error: err, diagnosticLog };
      }
    }

    // Cổng duyệt — approve (pr-lifecycle D3/D4): merges a runner item's
    // branch into main (spike-proven mechanics: --no-commit --no-ff, verify
    // on the staged tree, commit only on green — merge.mjs's mergeRunnerItem)
    // or, for a pull-door/legacy item (code already on main), re-runs the
    // item's OWN verify directly against the current tree. Every failure
    // path (conflict, red verify) parks the item at `blocked` with a reason
    // instead of leaving main mid-merge or the item silently in `proposed`
    // (D3's "merge sạch → done tự động; conflict/đỏ → hủy sạch + blocked").
    // `done`'s role is always "human" (D3: the person who ran approve is
    // the settlement, the merge itself is only the mechanical consequence).
    case 'approve': {
      const id = requireField(positional[0] ?? flags.id, 'approve requires an id: fgos approve <id> [--timeout <ms>|--no-timeout]');
      const timeoutMs = resolveVerifyTimeoutMs('approve', flags, process.cwd());
      const { noWait, waitMs } = parseWaitFlags(flags, 'approve');
      const runMerge = (mergeFn) => (noWait ? mergeFn() : withLockRetry(mergeFn, { waitMs }));

      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `approve: work "${id}" not found.`);
      }
      if (item.status !== 'awaiting-approval') {
        throw new StoreError('precondition', `approve: work "${id}" is "${item.status}", not "awaiting-approval" — nothing to approve.`);
      }

      const repoRoot = process.cwd();
      const source = classifySource(repoRoot, item);

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
      // main untouched. Runs BEFORE the --github branch too (approve-worktree-
      // guard-github-fix D1): a GitHub-side merge is server-side and never
      // touches the local tree, but the local checkout's own IDENTITY — is
      // this even the main worktree? — is a more fundamental precondition than
      // which transport approve uses, so it is checked first for every source.
      // Registry-based: an ad-hoc `git worktree add` never created through
      // `fgos session start` is invisible to this guard (CONTEXT.md Deferred
      // Ideas — ad-hoc unregistered worktree residual risk); the structural
      // check right below catches that case.
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

      // Structural guard (P44): the registry loop above only catches a
      // worktree registered via `fgos session start`. A plain `git worktree
      // add` run by hand is invisible to sessions.json, so it slipped through
      // untouched — same false-verification risk (merge lands on that
      // worktree's own checkout, or goal-check verifies its own possibly-stale
      // tree, while the item is reported "done"/"verified on main"), just
      // unregistered instead of registered. isMainWorktree reads git's own
      // common-dir structure, so it catches ANY linked worktree regardless of
      // how it was created. Also runs BEFORE the --github branch, same
      // rationale as the registry loop above (approve-worktree-guard-github-
      // fix D1).
      if (!isMainWorktree(repoRoot)) {
        throw new StoreError(
          'validation',
          `approve: refusing to run from "${repoRoot}" — this is a git worktree, not the repository's main working tree, whether or not it was created through "fgos session start". Run approve from the main checkout.`,
        );
      }

      // Close-out drift guard (tsk-62y, docs/history/
      // tsk-3bn-merge-conductor-harness-v2/): tsk-3bn's own origin incident
      // was closing a milestone (a `targets`-bearing item) while ONE of its
      // targets' resolved root branches had drifted ahead of main from a
      // later leaf merge — nothing warned or blocked it. `targets` is the
      // real, already-existing field a milestone uses ("a milestone's
      // targets are ordinary work ids", work.mjs). Only runs when `targets`
      // is a non-empty array — an ordinary (non-milestone) approve is
      // completely unaffected. Refuses BEFORE any git mutation, same
      // "acknowledge to override" shape as the Iron Law gate right below —
      // `--acknowledge-drift` is a deliberate human override, not a bypass
      // to route around silently.
      if (Array.isArray(item.targets) && item.targets.length > 0) {
        const drift = driftStatus(repoRoot, view);
        const driftedTargets = [];
        for (const targetId of item.targets) {
          if (!view.work[targetId]) continue;
          const targetRoot = resolveRoot(view, targetId);
          const status = drift[targetRoot];
          if (status?.needsSync) {
            driftedTargets.push({ targetId, root: targetRoot, ...status });
          }
        }
        if (driftedTargets.length > 0 && flags['acknowledge-drift'] !== true) {
          const summary = driftedTargets
            .map((d) => `${d.targetId} (root ${d.root}: ${d.branch} is ${d.aheadOfTarget} commit(s) ahead of ${d.target})`)
            .join(', ');
          throw new StoreError(
            'validation',
            `approve: "${id}" targets item(s) whose root branch has unsynced drift: ${summary}. `
              + `Run "fgos sync-root <root-id>" first, or re-run with --acknowledge-drift to close anyway.`,
          );
        }
      }

      // Iron Law gate (D16/D17), hoisted ahead of the --github branch —
      // review-20260718-self-improve-loop finding f01: this check previously
      // lived only inside the local-merge branch further below, so `approve
      // --github` could land the exact same self-modifying diff without ever
      // consulting it — a complete, structural bypass of the loop's own hard
      // gate, contradicting D16's "one common point for every runner-sourced
      // proposal, not just the local path". One check point now guards BOTH
      // merge transports identically, before either can run. changedFiles
      // diffs the item's own branch against its resolved root's branch (the
      // same D3 leaf-vs-root split already used for the human-viewable diff,
      // the GitHub PR base, the real merge target, and `catchup`'s target —
      // never blind trunk for a leaf) so the file set reflects the item's
      // own real diff, not every ancestor commit's files too
      // (tsk-4voj-iron-law-leaf-scope CONTEXT.md D1; previously a leaf
      // over-reported its file set, which is why this comment used to call
      // that the "fail-safe direction, accepted as-is" — superseded, see
      // CONTEXT.md D1). Refuses BEFORE any git mutation or GitHub call: the
      // item stays `proposed`, nothing is touched, neither transport is
      // reached. Hoisted alongside the Iron Law gate (tsk-598 D1/D2): the
      // local-merge branch's own clean-tree check, further below, reuses
      // this exact array as its ownFileSet source instead of recomputing
      // the same diff a second time.
      let runnerOwnDiff;
      if (source === 'runner') {
        const rootIdForIronLaw = resolveRoot(view, id);
        runnerOwnDiff = changedFiles(
          repoRoot,
          item,
          rootIdForIronLaw !== id ? { trunk: branchNameFor(rootIdForIronLaw) } : {},
        );
        const ironLaw = classifyIronLaw({ filesChanged: runnerOwnDiff, description: item.description });
        // review-20260718-self-improve-loop finding f02: only the bare flag
        // (parsed as boolean `true`, no following value) counts as
        // acknowledgment; any value form (e.g. a stray "false") fails closed.
        if (ironLaw.required && flags['acknowledge-iron-law'] !== true) {
          throw new StoreError(
            'validation',
            `approve: "${id}" trips the Iron Law — a failing test must precede this self-modifying diff before it can land. `
              + `Matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}]. `
              + `Re-run with --acknowledge-iron-law to confirm failing-test-first proof and proceed.`,
          );
        }
      }

      // GitHub transport (github-adapter D1/D3/D5): `approve <id> --github --pr
      // <n>` merges a prior `review --github` PR through GitHub instead of a
      // local git merge. Dispatched BEFORE the runner block's dirty-main-tree
      // gate: a GitHub-side merge never touches the local working tree, so
      // `isMainTreeClean` (which exists only because a LOCAL merge mutates
      // the tree) must not gate it. The Iron Law gate above DOES gate this
      // branch now (hoisted, f01). The source gate is checked BEFORE the
      // --pr presence check so a pull/legacy item always gets the
      // runner-sourced error, never a misleading "missing --pr" message for an
      // item that could never have a PR. Runs AFTER the worktree-identity
      // guards above (approve-worktree-guard-github-fix D1/D3): environment
      // validity (is this even a valid worktree to approve from) is checked
      // before business-logic validity (is this item's source compatible with
      // --github) — an accepted, documented precedence change for the narrow
      // combination of --github + a non-runner-sourced item + a linked
      // worktree, which now sees the worktree-identity refusal instead of this
      // block's own source-mismatch message.
      if (flags.github) {
        if (source !== 'runner') {
          throw new StoreError('validation', `approve --github: "${id}" is a ${source}-sourced item — GitHub approval requires a runner-sourced item with a live fgw/${id} branch (no branch exists to attach a PR to for pull/legacy items).`);
        }
        const prNumber = requireField(flags.pr, 'approve --github requires --pr <n> (the GitHub PR number from a prior review --github)');
        // Acceptance-evidence pre-flight (tsk-396 D2): checked BEFORE the
        // real GitHub-side merge, not caught after the fact inside
        // moveWork's own `to === 'delivered'` check — a GitHub merge can't
        // be `git merge --abort`ed the way a local one can, so this matters
        // even more here than on the local paths above.
        assertAcceptanceEvidence(id, item);
        const result = await mergeGitHubPR(repoRoot, prNumber, ghCommandOpts());
        if (result.outcome === 'merged') {
          // Accepted rough edge (this slice): unlike the local merged path, no
          // cleanupMergedBranch runs — the local fgw/<id> branch and its pushed
          // origin copy are both left in place after a server-side merge (no
          // local cleanup mechanism exists for a branch merged on GitHub).
          const { event } = moveWork(dir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human' });
          return { id, mode: 'github', to: 'delivered', prNumber, seq: event.seq };
        }
        // blocked — mirrors the local merge-conflict/verify-fail-post-merge
        // shape: park awaiting-approval -> blocked with the classifyGhFailure reason,
        // plus a friction record carrying the failure layer and gh's stderr.
        const reason = result.reason;
        const layer = { 'auth-failure': 'environment', 'rate-limited': 'environment', 'unreachable': 'environment', 'gh-invocation-failed': 'state' }[reason] || 'state';
        moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason, role: 'system' });
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

      if (source === 'runner') {
        // Iron Law check now runs earlier (hoisted above the --github branch,
        // f01) so it guards both merge transports identically — see that
        // block for the full rationale. This local-merge branch continues
        // directly with the dirty-tree check.
        const ownFileSet = buildOwnFileSet(runnerOwnDiff, item.footprint);
        if (!isMainTreeClean(repoRoot, ownFileSet)) {
          throw new StoreError('validation', `approve: working tree at "${repoRoot}" is not clean — commit or stash pending changes before approving "${id}".`);
        }

        // Acceptance-evidence pre-flight (tsk-396 D1): covers both merge
        // paths below (leaf->root and root->main share this one branch
        // point) — checked BEFORE mergeRunnerItem's real git merge, not
        // caught after the fact inside moveWork's own `to === 'delivered'`
        // check (store.mjs). A merge that's about to be refused here never
        // touches the target branch.
        assertAcceptanceEvidence(id, item);

        // D3 leaf-vs-root split: a leaf's resolved root is a DIFFERENT item
        // (resolveRoot walks item.parent up to the top); a root's resolved
        // root is itself.
        const rootId = resolveRoot(view, id);

        if (rootId !== id) {
          const rootBranch = branchNameFor(rootId);
          // Ephemeral worktree checked out on fgw/<rootId> (guaranteed to
          // exist by the time a leaf reaches "awaiting-approval" — dispatch-side
          // wiring, cell fan-out-parallel-9) — never the human's own main
          // checkout. ASSUMPTION (acknowledged, not fixed in this cell):
          // this races a concurrent approval of a sibling leaf of the same
          // root, or the runner's own dispatch of that root, since
          // createWorktree's branch-reuse path force-reclaims any existing
          // checkout of fgw/<rootId>; low-likelihood under single-operator
          // P6, D16's per-root merge-mutex lives in the runner's
          // write-queue, not this human-driven CLI verb.
          //
          // withMergeEphemeralWorktree's own finally (worktree.mjs) removes
          // the checkout on every exit path below (conflict, verify-fail,
          // merged) — per D4/D17 that never deletes the branch itself.
          // mergeRunnerItem's own conflict/verify-fail outcomes already
          // leave the ephemeral checkout clean via `git merge --abort`, so
          // no cleanupMergedBranch call is needed on those paths.
          return await withMergeEphemeralWorktree(repoRoot, rootId, async (ephemeral) => {
            // tsk-2eq: lockRoot pins the main-checkout lock to the real
            // repo root — ephemeral.path stays the git-op cwd (unchanged)
            // but is never the lock's own root, since it's a throwaway
            // worktree with no writable .fgos/ (ADR0020).
            const result = await runMerge(() => mergeRunnerItem(ephemeral.path, item, { timeoutMs, lockRoot: repoRoot }));

            if (result.outcome === 'conflict') {
              moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-conflict', role: 'system' });
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

            if (result.outcome === 'fgos-write-rejected') {
              moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'fgos-write-rejected', role: 'system' });
              addFriction(dir, {
                id,
                disposition: 'blocked',
                errorClass: 'fgos-write-blocked',
                layer: 'state',
                attempts: 1,
                detail: `${result.branch} staged a change under .fgos/ (${result.paths.join(', ')}); merge aborted, ${rootBranch} unchanged — ADR0020`,
              });
              return { id, mode: 'merge', to: 'blocked', reason: 'fgos-write-rejected', target: rootBranch, paths: result.paths };
            }

            if (result.outcome === 'verify-fail') {
              moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'verify-fail-post-merge', role: 'system' });
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
            // tsk-480: the merge above is already real and permanent —
            // cleanup must run either way, so it is no longer gated on the
            // status write succeeding (previously: an unguarded moveWork
            // throw here would skip cleanup too, leaking the leaf branch
            // on top of the unrecorded status).
            const moveResult = moveDeliveredOrRecordFault(dir, id, 'leaf-into-root merge');
            const cleanup = cleanupMergedBranch(ephemeral.path, result.branch);
            if (!moveResult.event) {
              return {
                id,
                mode: 'merge',
                to: 'awaiting-approval',
                deliveryUnrecorded: true,
                target: rootBranch,
                branch: result.branch,
                output: result.check.output,
                cleanupWarnings: cleanup.warnings,
                error: moveResult.error.message,
                diagnosticLog: moveResult.diagnosticLog,
              };
            }
            return {
              id,
              mode: 'merge',
              to: 'delivered',
              target: rootBranch,
              branch: result.branch,
              seq: moveResult.event.seq,
              output: result.check.output,
              cleanupWarnings: cleanup.warnings,
            };
          });
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

        const result = await runMerge(() => mergeRunnerItem(repoRoot, item, { timeoutMs }));

        if (result.outcome === 'conflict') {
          const reason = hadChildren ? 'integration-drift' : 'merge-conflict';
          const detail = hadChildren
            ? `cross-root integration drift at main@${currentHead(repoRoot)}; git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`
            : `git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`;
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason, role: 'system' });
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

        if (result.outcome === 'fgos-write-rejected') {
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'fgos-write-rejected', role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'fgos-write-blocked',
            layer: 'state',
            attempts: 1,
            detail: `${result.branch} staged a change under .fgos/ (${result.paths.join(', ')}); merge aborted, main unchanged — ADR0020`,
          });
          return { id, mode: 'merge', to: 'blocked', reason: 'fgos-write-rejected', target: 'main', paths: result.paths };
        }

        if (result.outcome === 'verify-fail') {
          const reason = hadChildren ? 'integration-drift' : 'verify-fail-post-merge';
          const detail = hadChildren
            ? `cross-root integration drift at main@${currentHead(repoRoot)}; goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`
            : `goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`;
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason, role: 'system' });
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

        // tsk-480: same cleanup-runs-either-way fix as the leaf-merge path
        // above — the merge into main is already real and permanent.
        const moveResult = moveDeliveredOrRecordFault(dir, id, 'root-into-main merge');
        const cleanup = cleanupMergedBranch(repoRoot, result.branch);
        if (!moveResult.event) {
          return {
            id,
            mode: 'merge',
            to: 'awaiting-approval',
            deliveryUnrecorded: true,
            target: 'main',
            branch: result.branch,
            output: result.check.output,
            cleanupWarnings: cleanup.warnings,
            error: moveResult.error.message,
            diagnosticLog: moveResult.diagnosticLog,
          };
        }
        return {
          id,
          mode: 'merge',
          to: 'delivered',
          target: 'main',
          branch: result.branch,
          seq: moveResult.event.seq,
          output: result.check.output,
          cleanupWarnings: cleanup.warnings,
        };
      }

      // pull-door or legacy proposal: code is already on main (D4) — no
      // merge step, just re-run the item's own verify against the current
      // tree, exactly the goal-check contract `return` already uses.
      const check = await runGoalCheck(item, repoRoot, timeoutMs);
      if (!check.passed) {
        moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'verify-fail', role: 'system' });
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
      // tsk-480: no real merge lands on this path (code is already on
      // main), so a moveWork failure here only desyncs status rather than
      // hiding a permanent mutation — still guarded for consistency with
      // the two merge paths above (CONTEXT.md D1: all three success
      // paths share the same silent-throw shape).
      const moveResult = moveDeliveredOrRecordFault(dir, id, 'pull-door verify-only');
      if (!moveResult.event) {
        return {
          id,
          mode: 'verify-only',
          to: 'awaiting-approval',
          deliveryUnrecorded: true,
          output: check.output,
          error: moveResult.error.message,
          diagnosticLog: moveResult.diagnosticLog,
        };
      }
      return { id, mode: 'verify-only', to: 'delivered', seq: moveResult.event.seq, output: check.output };
    }

    // sync-root (tsk-50i, docs/history/tsk-3bn-merge-conductor-harness-v2/):
    // merges fgw/<root-id>'s current tip into its real target — `main`, or
    // fgw/<parentId> for a nested root — WITHOUT touching the root item's
    // own status/stage (CONTEXT.md's locked contract: this replaces the
    // ad-hoc `git merge` tsk-3bn's own origin incident required by hand).
    // Reuses `mergeRunnerItem`'s exact lock/verify path (constraint #1,
    // fgos-validating's gate) — never a second bespoke merge mechanism.
    // Unlike `approve`'s root-into-main path, this never deletes fgw/<id>
    // afterward: the root stays open for further leaf merges.
    case 'sync-root': {
      const id = requireField(positional[0] ?? flags.id, 'sync-root requires a root-id: fgos sync-root <root-id>');
      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `sync-root: work "${id}" not found.`);
      }

      const repoRoot = process.cwd();
      if (!isMainWorktree(repoRoot)) {
        throw new StoreError(
          'validation',
          `sync-root: refusing to run from "${repoRoot}" — sync-root must land on the main checkout, which a linked worktree structurally is not.`,
        );
      }

      const branch = branchNameFor(id);
      if (!branchExists(repoRoot, branch)) {
        throw new StoreError('validation', `sync-root: branch "${branch}" does not exist — nothing to sync.`);
      }
      const targetBranch = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot);
      if (item.parent && !branchExists(repoRoot, targetBranch)) {
        throw new StoreError('validation', `sync-root: target branch "${targetBranch}" (from "${id}"'s parent "${item.parent}") does not exist.`);
      }

      // Iron Law gate — same evidence, same acknowledgment flag, same
      // "refuse before any git mutation" discipline `approve` already
      // applies to a runner-sourced item (source is 'runner' here by
      // construction: branchExists(branch) just confirmed it above).
      const runnerOwnDiff = changedFiles(repoRoot, item, item.parent ? { trunk: targetBranch } : {});
      const ironLaw = classifyIronLaw({ filesChanged: runnerOwnDiff, description: item.description });
      if (ironLaw.required && flags['acknowledge-iron-law'] !== true) {
        throw new StoreError(
          'validation',
          `sync-root: "${id}" trips the Iron Law — a failing test must precede this self-modifying diff before it can land. `
            + `Matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}]. `
            + `Re-run with --acknowledge-iron-law to confirm failing-test-first proof and proceed.`,
        );
      }

      const timeoutMs = resolveVerifyTimeoutMs('sync-root', flags, process.cwd());
      const { noWait, waitMs } = parseWaitFlags(flags, 'sync-root');
      const runMerge = (mergeFn) => (noWait ? mergeFn() : withLockRetry(mergeFn, { waitMs }));

      const runAndReport = async (mergeRoot, lockRoot) => {
        const result = await runMerge(() => mergeRunnerItem(mergeRoot, item, lockRoot ? { timeoutMs, lockRoot } : { timeoutMs }));

        if (result.outcome === 'conflict') {
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-conflict',
            layer: 'state',
            attempts: 1,
            detail: `sync-root: git merge --no-commit --no-ff ${branch} into ${targetBranch} conflicted; merge aborted, ${targetBranch} unchanged`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: 'merge-conflict', target: targetBranch, branch };
        }
        if (result.outcome === 'fgos-write-rejected') {
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'fgos-write-blocked',
            layer: 'state',
            attempts: 1,
            detail: `sync-root: ${branch} staged a change under .fgos/ (${result.paths.join(', ')}); merge aborted, ${targetBranch} unchanged — ADR0020`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: 'fgos-write-rejected', target: targetBranch, branch, paths: result.paths };
        }
        if (result.outcome === 'verify-fail') {
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'verify-miss',
            layer: 'verification',
            attempts: 1,
            detail: `sync-root: goal-check failed on staged merge of ${branch} into ${targetBranch} (exit ${result.check.status}); merge aborted, ${targetBranch} unchanged`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: 'verify-fail', target: targetBranch, branch, exitStatus: result.check.status, output: result.check.output };
        }

        // Success — status/stage of `id` is deliberately UNTOUCHED (the
        // locked contract). Only a real decision record marks this sync
        // happened, same append door `fgos decision` itself uses.
        const { event } = addDecision(dir, {
          text: `sync-root: merged ${branch} into ${targetBranch} at ${currentHead(mergeRoot)}`,
          rationale: `fgos sync-root ${id} — closes the drift window this item's own design exists to prevent`,
          id,
        });
        return { id, mode: 'sync-root', outcome: 'synced', target: targetBranch, branch, seq: event.seq, output: result.check.output };
      };

      if (item.parent) {
        return await withMergeEphemeralWorktree(repoRoot, item.parent, async (ephemeral) => runAndReport(ephemeral.path, repoRoot));
      }
      return await runAndReport(repoRoot);
    }

    // Cổng duyệt — reject (pr-lifecycle D4): awaiting-approval -> todo, reason
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
      if (item.status !== 'awaiting-approval') {
        throw new StoreError('precondition', `reject: work "${id}" is "${item.status}", not "awaiting-approval" — nothing to reject.`);
      }
      const { event } = moveWork(dir, { id, to: 'todo', expectedStatus: 'awaiting-approval', reason, role: 'human' });
      return { id, from: 'awaiting-approval', to: 'todo', reason, seq: event.seq };
    }

    // Catch-up-by-merge (D6/D7/D11, fan-out-parallel): the unified mechanism
    // that bounces a parked item — a root drift-parked at root->main (D7) or
    // a leaf conflict-parked at leaf->parent (D11), same git mechanics
    // either way per the real-conflict spike
    // (.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh) — by
    // merging the current TARGET (main for a root/standalone item, the
    // resolved parent's branch for a leaf) into the item's OWN branch,
    // re-verifying, and either landing the merge (blocked -> awaiting-approval, D18's
    // edge, mechanical/uncounted per D11) or aborting clean and leaving the
    // item blocked for a human. Deliberately does NOT call mergeRunnerItem
    // (merge.mjs) — that merges the item's branch INTO the caller's checkout,
    // the opposite direction catchup needs, and its source ref is hardcoded
    // to the item's own branch (main as a *source* cannot be expressed
    // through it) — so the git sequence is written inline here instead,
    // mirroring the spike's proven shape (merge --no-commit --no-ff ->
    // verify -> commit-or-abort, verify strictly before any commit).
    case 'catchup': {
      const id = requireField(positional[0] ?? flags.id, 'catchup requires an id: fgos catchup <id> [--timeout <ms>|--no-timeout]');
      const timeoutMs = resolveVerifyTimeoutMs('catchup', flags, process.cwd());

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
      // ephemeral). Removed on every exit path via withMergeEphemeralWorktree's
      // own finally (worktree.mjs).
      return await withMergeEphemeralWorktree(repoRoot, id, async (ephemeral) => {
        // The branch can already contain the target's tip (a person merged it
        // by hand, or a prior catch-up landed the merge and died later). The
        // merge below is then a genuine no-op that stages nothing, so the
        // `git commit` at the end of this function fails with "nothing to
        // commit" and the item is stuck blocked forever — no retry can change
        // the condition. Checked up front rather than inferred from that
        // commit failure: the failure wording is locale/git-version
        // dependent, `is-ancestor` is not. `HEAD` here is the item's own
        // branch (withMergeEphemeralWorktree checks it out).
        let alreadyCaughtUp = false;
        try {
          execFileSync('git', ['merge-base', '--is-ancestor', target, 'HEAD'], { cwd: ephemeral.path, encoding: 'utf8', shell: false });
          alreadyCaughtUp = true;
        } catch (ancestorErr) {
          // Exit 1 is the documented "not an ancestor" answer, not a failure;
          // anything else (a bad ref, a broken repo) is a real error.
          if (ancestorErr.status !== 1) {
            throw ancestorErr;
          }
        }

        if (alreadyCaughtUp) {
          // Nothing to merge or commit, but the status move still has to rest
          // on a freshly-executed check: "caught up" says nothing about
          // whether this item deserves to leave `blocked`.
          const caughtUpCheck = await runGoalCheck(item, ephemeral.path, timeoutMs);
          if (!caughtUpCheck.passed) {
            // No `git merge --abort` on this path — no merge was started, and
            // aborting without MERGE_HEAD fails outright.
            return { id, outcome: 'verify-fail', target, branch: ownBranch, exitStatus: caughtUpCheck.status, output: caughtUpCheck.output };
          }
          const { event } = moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'blocked', role: 'runner' });
          return {
            id,
            outcome: 'already-caught-up',
            from: 'blocked',
            to: 'awaiting-approval',
            target,
            branch: ownBranch,
            seq: event.seq,
            output: caughtUpCheck.output,
          };
        }

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
        const { event } = moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'blocked', role: 'runner' });
        return { id, outcome: 'merged', from: 'blocked', to: 'awaiting-approval', target, branch: ownBranch, seq: event.seq, output: check.output };
      });
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
        return paginateVerbResult(candidates, flags, 'evolve-v1', 'evolve');
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
      return paginateVerbResult(rankImpact(listWork(dir), { includeDone: Boolean(flags.all) }), flags, 'triage-v1', 'triage');
    }

    // Opt-in per-session git worktree lifecycle (fgos-multi-session-checkout
    // Epic 1, D6/D7): a first-class `session` verb family wiring session.mjs's
    // createSession/endSession/listSessions/reclaimOrphanedSessions. `start`
    // opens a detached-HEAD worktree on the current HEAD (zero new branches)
    // with a `.fgos` symlink back to the one shared store (D10) and prints
    // where to `cd`; `end` removes it, refusing a diverged (dangling-commit)
    // session without --force and naming the sha(s); `list` prints the
    // registry; `gc` (p-fgos-session-gc) sweeps entries whose worktree is gone
    // from git or whose one-shot `start` CLI pid has since exited, sparing any
    // that are diverged or have uncommitted work. session.mjs raises
    // SessionError for every lifecycle failure (unknown id, divergence
    // refusal, git failure) — surfaced here as `validation` (exit 4) so a bad
    // input is a clean categorized exit, never an uncaught crash. repoRoot is
    // the caller's cwd, the same root every other git-backed verb uses.
    case 'session': {
      const sub = requireField(positional[0], 'session requires a sub-verb: fgos session <start|end|list|gc> ...');
      const repoRoot = process.cwd();
      try {
        if (sub === 'start') {
          const itemId = optionalField(flags.item, 'session start --item requires a non-empty id value (omit --item entirely to start a session with no item bound)');
          const entry = createSession(repoRoot, { itemId });
          // Explicit projection, not a spread: decouples the public envelope
          // from session.mjs's internal registry-entry shape (mirrors every
          // other converted verb, e.g. move's {id,from,to,seq}).
          return {
            sessionId: entry.sessionId,
            worktreePath: entry.worktreePath,
            itemId: entry.itemId,
            startCommit: entry.startCommit,
            pid: entry.pid,
            startedAt: entry.startedAt,
          };
        }
        if (sub === 'end') {
          const sessionId = requireField(positional[1], 'session end requires a session id: fgos session end <session-id> [--force]');
          const entry = endSession(repoRoot, sessionId, { force: Boolean(flags.force) });
          return {
            sessionId: entry.sessionId,
            worktreePath: entry.worktreePath,
            itemId: entry.itemId,
            startCommit: entry.startCommit,
            pid: entry.pid,
            startedAt: entry.startedAt,
            forced: Boolean(flags.force),
          };
        }
        if (sub === 'list') {
          return listSessions(repoRoot);
        }
        if (sub === 'gc') {
          return reclaimOrphanedSessions(repoRoot);
        }
        throw new StoreError('validation', `unknown session sub-verb "${sub}". Usage: fgos session <start|end|list|gc> ...`);
      } catch (err) {
        if (err instanceof SessionError) {
          throw new StoreError('validation', err.message);
        }
        throw err;
      }
    }

    // Persisted-focus CLI surface (str67-goal-directed-planning D3/D4/D6/D7):
    // reads/writes go through the setFocus/goalFocusShow facades only, never
    // graph-metrics.mjs directly. Only `set`/`show` exist here — `clear`/
    // `list` are explicitly deferred (CONTEXT.md Deferred Ideas).
    case 'goal': {
      const sub = requireField(positional[0], 'goal requires a sub-verb: fgos goal <set|show> ...');
      if (sub === 'set') {
        const id = requireField(positional[1], 'goal set requires an id: fgos goal set <id>');
        const { view } = setFocus(dir, { id });
        // Explicit projection, not a spread: decouples the public envelope
        // from setFocus's internal {event, view} return shape.
        return { focus: view.focus };
      }
      if (sub === 'show') {
        return goalFocusShow(dir);
      }
      throw new StoreError('validation', `unknown goal sub-verb "${sub}". Usage: fgos goal <set|show> ...`);
    }

    // Two-way tool registry (tsk-1dj, ported from repository-harness's
    // tool-registry-capability per docs/distillery/deep-dives/
    // tool-registry.md): `register`/`remove` are TEAM decisions through the
    // shared event log (store.mjs's registerTool/removeTool, same
    // single-write-door discipline as every other mutating verb); `check`
    // writes ONLY the local, gitignored status overlay
    // (tool-registry.mjs's readLocalStatus/writeLocalStatus) — never an
    // event, per CONTEXT.md's pinned "registered vs present" term, and it
    // always succeeds even when every probed tool comes back missing
    // (absent capability is a fact to report, never a CLI error); `query`
    // merges the two (registry + local overlay) at read time.
    case 'tool': {
      const sub = requireField(positional[0], 'tool requires a sub-verb: fgos tool <register|check|query|remove> ...');
      if (sub === 'register') {
        const fields = {
          name: requireField(flags.name, 'tool register requires --name.'),
          kind: requireField(flags.kind, 'tool register requires --kind (cli/binary/mcp/skill/http).'),
          capability: requireField(flags.capability, 'tool register requires --capability.'),
          command: requireField(flags.command, 'tool register requires --command.'),
          scanTarget: optionalField(flags.scan, 'tool register --scan requires a non-empty path.'),
          responsibility: optionalField(flags.responsibility, 'tool register --responsibility requires a non-empty value.'),
          description: optionalField(flags.description, 'tool register --description requires a non-empty value.'),
        };
        const { view } = registerTool(dir, fields);
        return { name: fields.name, tool: view.tools[fields.name] };
      }
      if (sub === 'check') {
        const view = listWork(dir);
        const tools = view.tools ?? {};
        const name = optionalField(flags.name, 'tool check --name requires a non-empty value.');
        if (name !== undefined && !tools[name]) {
          throw new StoreError('validation', `tool "${name}" not found.`);
        }
        const targets = name !== undefined ? [name] : Object.keys(tools);
        const localStatus = readLocalStatus(dir);
        const repoRoot = path.dirname(dir);
        const results = {};
        for (const toolName of targets) {
          const status = await probeTool(tools[toolName], repoRoot);
          const checkedAt = new Date().toISOString();
          localStatus[toolName] = { status, checkedAt };
          results[toolName] = { status, checkedAt };
        }
        writeLocalStatus(dir, localStatus);
        return { checked: results };
      }
      if (sub === 'query') {
        const view = listWork(dir);
        const tools = view.tools ?? {};
        const localStatus = readLocalStatus(dir);
        const capabilityFlag = optionalField(flags.capability, 'tool query --capability requires a non-empty value.');
        const normalizedCapability = capabilityFlag !== undefined ? normalizeCapability(capabilityFlag) : undefined;
        const statusFlag = optionalField(flags.status, 'tool query --status requires a non-empty value.');
        const providers = Object.values(tools)
          .filter((tool) => normalizedCapability === undefined || tool.capability === normalizedCapability)
          .map((tool) => ({ ...tool, status: resolvedStatus(tool.name, localStatus) }))
          .filter((tool) => statusFlag === undefined || tool.status === statusFlag);
        return { providers };
      }
      if (sub === 'remove') {
        const name = requireField(positional[1] ?? flags.name, 'tool remove requires --name (or a positional name).');
        removeTool(dir, { name });
        return { name, removed: true };
      }
      throw new StoreError('validation', `unknown tool sub-verb "${sub}". Usage: fgos tool <register|check|query|remove> ...`);
    }

    // Do-and-announce shell-integration + config bootstrap (str87-fgos-setup-doctor
    // D6, retargeted per tsk-2ta D1 amended / tsk-5vf D2/D4): inserts the
    // shell-integration source line into every DETECTED rc file (bash/zsh,
    // D4) — never creates a new rc file (shell-rc.mjs's own refusal) — then
    // ensures the shared config file (`.fgos/config.json`) exists and has
    // every current default key from EVERY registered `registerConfigDefault`
    // entry, via `ensureSharedConfigDefaults` (the one write path allowed
    // here; `doctor`, unlike `setup`, never calls it). This is also the verb
    // that performs the actual move off the legacy `.fgos-runner.json`
    // (tsk-5vf D2) — `ensureSharedConfigDefaults` reads it as a fallback via
    // `readSharedConfig` and writes the assembled result to the NEW location,
    // never deleting the old file.
    case 'setup': {
      const repoRoot = process.cwd();
      const scriptPath = integrationScriptPath();
      const rcFiles = detectRcFiles(os.homedir());
      const rcFilesInserted = [];
      const rcFilesAlreadyConfigured = [];
      // A null scriptPath means this copy of fgos has no location stable enough
      // to name in a shell profile — it is not inside a git checkout, so it is
      // ephemeral by nature. Writing its path would leave a `source` line that
      // outlives the directory it points at and errors on every shell open.
      // Everything else setup does still runs; only the rc write is declined.
      const rcWriteDeclinedReason = scriptPath === null
        ? 'this copy of fgos is not inside a git checkout, so it has no stable path to source — source scripts/fgos-shell-integration.sh by hand from a permanent checkout'
        : null;
      if (scriptPath !== null) {
        for (const rcFile of rcFiles) {
          if (insertSourceLine(rcFile, scriptPath)) {
            rcFilesInserted.push(rcFile);
          } else {
            rcFilesAlreadyConfigured.push(rcFile);
          }
        }
      }
      const configPath = sharedConfigFilePath(repoRoot);
      const configExisted = fs.existsSync(configPath);
      const { addedKeys } = ensureSharedConfigDefaults(repoRoot);
      // str65-6/str88: wires core.hooksPath the same way `npm run setup:hooks`
      // does — a second, non-npm-lifecycle-dependent activation path for the
      // main-checkout lock hook, since pnpm 10+ blocks `prepare` for a
      // git-hosted dependency (str88) and nothing re-automated it since.
      // Idempotent, no-ops silently when repoRoot has no `.git` at all.
      // Fill-only like the two side effects above: a pre-existing custom
      // core.hooksPath is left untouched, never silently repointed.
      const { wired: hooksWired, skippedExisting: hooksSkippedExisting } = installGitHooks(repoRoot);
      return {
        rcFilesInserted,
        rcFilesAlreadyConfigured,
        ...(rcWriteDeclinedReason !== null && { rcWriteDeclinedReason }),
        configPath,
        configCreated: !configExisted,
        configAddedKeys: configExisted ? addedKeys : [],
        hooksWired,
        hooksSkippedExisting,
      };
    }

    // Reverses `setup`'s own wiring (tsk-4iv-1, docs/history/fgos-uninstall/
    // CONTEXT.md D2-D4). Requires `--yes` (D3): with no flag, refuses before
    // touching anything — destructive, unlike `setup`/`doctor`, which never
    // ask. Two side effects, both mirroring `setup`'s own fill-only rules in
    // the opposite direction:
    //   - git hooks (D2): `uninstallGitHooks` unwires `core.hooksPath` and
    //     deletes `.githooks/pre-commit` (+ the dir, if left empty) ONLY when
    //     hooksPath is still exactly `.githooks` — a custom value the caller
    //     repointed is left untouched, same as `installGitHooks` leaves one
    //     alone when installing.
    //   - shell-rc (D4): never edits an rc file — reuses `hasSourceLine`
    //     read-only, the same primitive `deadSourceLines`/`doctor` already
    //     use, to report which rc file(s) still carry the fgOS source line so
    //     the caller can remove it by hand (docs/history/
    //     shell-rc-dead-source-lines/CONTEXT.md D1: "deletion stays a human
    //     act" — this item does not carve out an exception to that).
    // Never touches `.fgos/` data or `.fgos/config.json` (pinned constraint,
    // CONTEXT.md) — structurally true: this case never imports or calls any
    // config-writing function (`ensureSharedConfigDefaults`/`writeSharedConfig`).
    //
    // Package removal (D1, tsk-4iv-2 SPIKE): opt-in via `--remove-package`,
    // additive on top of tsk-4iv-1's already-shipped, already-documented
    // default behavior (`--yes` alone stays wiring-only, byte-identical to
    // before this flag existed — preserves that contract rather than
    // silently widening it). Scoped narrowly per the spike's own locked
    // scope: npm global installs only, Linux/macOS only — shells out to
    // `npm uninstall -g forgent`, the officially-supported removal path,
    // rather than hand-rolling file deletion. Runs LAST, after the
    // confirmation gate and wiring reversal above, since removing the
    // package first would strand the process mid-run before it could
    // finish undoing its own wiring (plan.md's own ordering rationale).
    // Never throws on failure — a failed removal is exactly the outcome
    // this spike exists to measure, not a bug to crash on.
    case 'uninstall': {
      if (!flags.yes) {
        throw new StoreError(
          'validation',
          'fgos uninstall requires --yes to confirm — it unwires git hooks (core.hooksPath/.githooks) and reports (never deletes) the shell-rc source line. Rerun with --yes once ready.',
        );
      }
      const repoRoot = process.cwd();
      const scriptPath = integrationScriptPath();
      const shellRcSourceLinesFound = scriptPath === null
        ? []
        : detectRcFiles(os.homedir())
          .filter((rcFile) => hasSourceLine(rcFile, scriptPath))
          .map((rcFile) => ({ rcFile, sourceLine: `source "${scriptPath}"` }));
      const { unwired: hooksUnwired, skippedExisting: hooksSkippedExisting } = uninstallGitHooks(repoRoot);
      let packageRemoval = { attempted: false, outcome: null };
      if (flags['remove-package']) {
        try {
          const output = execFileSync('npm', ['uninstall', '-g', 'forgent'], { encoding: 'utf8' });
          packageRemoval = { attempted: true, outcome: 'removed', output };
        } catch (err) {
          packageRemoval = {
            attempted: true,
            outcome: 'failed',
            error: err.message,
            stderr: typeof err.stderr === 'string' ? err.stderr : (err.stderr?.toString() ?? null),
          };
        }
      }
      return {
        shellRcSourceLinesFound,
        packageRemoval,
        shellRcRemovalInstructions: shellRcSourceLinesFound.length > 0
          ? 'fgOS never edits your shell profile — remove the line(s) above by hand.'
          : null,
        hooksUnwired,
        hooksSkippedExisting,
      };
    }

    // Diagnostic by default (D2, docs/specs/distribution.md RUL9): runs every
    // DOCTOR_CHECKS entry against the current cwd, writing nothing — no rc
    // file insertion, no config write — unless `--fix` is given.
    //
    // `--fix` (docs/history/doctor-fix-gate-bypass/CONTEXT.md D2, deliberate
    // reversal of RUL9/RUL11 per distribution-vision.md §3): runs every
    // registered `fix` (`runFixes`, `src/setup/registrations.mjs`) BEFORE
    // re-running the checks, so the returned `checks` array reflects
    // post-fix state — the same "report what changed" shape
    // `ensureRunnerConfig`/`ensureSharedConfigDefaults` already use. Without
    // `--fix`, behavior is byte-identical to before this flag existed.
    case 'doctor': {
      const fixed = flags.fix ? runFixes(process.cwd()) : undefined;
      const checks = DOCTOR_CHECKS.map(({ id, description, check }) => {
        const { passed, message } = check(process.cwd());
        return { id, description, passed, message };
      });
      return fixed === undefined ? { checks } : { fixed, checks };
    }

    // Safely clears .fgos/main-checkout.lock (tsk-3h4). Never force-deletes:
    // reuses acquireMainCheckoutLock as-is for the ACQUIRED (free/stale,
    // reclaimed as a side effect of the acquire attempt then immediately
    // released -- this verb never wants to hold the lock, only clear it) and
    // HELD (genuinely live elsewhere, refuse) outcomes, and only reaches for
    // the new forceReclaimAmbiguousLock for the one status that primitive
    // deliberately never unlinks itself (AMBIGUOUS -- unparseable content,
    // D5 fail-closed).
    case 'unlock': {
      const lockResult = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS });
      if (lockResult.status === HELD) {
        const ttlPart = lockResult.remainingTtlMs != null
          ? `, expires in ${formatLockDurationMs(lockResult.remainingTtlMs)}`
          : ', no TTL window known';
        throw new StoreError(
          'lock-timeout',
          `unlock: main checkout lock is held by a live session (${lockResult.holderPid}, held ${formatLockDurationMs(lockResult.lockAgeMs)}${ttlPart}) -- refusing to clear it.`,
        );
      }
      if (lockResult.status === ACQUIRED) {
        releaseMainCheckoutLock(dir);
        return { cleared: true, reason: 'stale-or-free' };
      }
      // AMBIGUOUS
      const reclaim = forceReclaimAmbiguousLock(dir);
      return { cleared: reclaim.status === 'reclaimed', reason: reclaim.status };
    }

    case 'lock-status': {
      const status = inspectMainCheckoutLock(dir, { ttlMs: DEFAULT_TTL_MS });
      return {
        outcome: status.outcome,
        holderPid: status.holderPid ?? null,
        lockAgeMs: status.lockAgeMs ?? null,
        remainingTtlMs: status.remainingTtlMs ?? null,
        lockAge: status.lockAgeMs != null ? formatLockDurationMs(status.lockAgeMs) : null,
        remainingTtl: status.remainingTtlMs != null ? formatLockDurationMs(status.remainingTtlMs) : null,
      };
    }

    default:
      throw new StoreError('validation', `unknown verb "${verb ?? ''}". Usage: fgos <init|add|submit|discover|decompose|move|retrospective|cleanup|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status> ...`);
  }
}

// ─── --help / --help --json: machine-readable verb manifest (P37 deliverable
// b) — mirrors `.bee/bin/bee.mjs`'s publicManifestEntries/renderHelpText/
// handleHelp exactly. The manifest itself is NEVER wrapped in the fgos.v1
// envelope (wrapEnvelope) — this is CTR001's documented exception for the
// verb manifest: metadata about the CLI's own verb surface, not a verb's
// data payload, the same distinction bee.mjs draws for its own
// `--help --json`.

function publicManifestEntries() {
  return COMMAND_REGISTRY.map(({ name, invoke, description, parameters, examples, touchesState, externalEffect, paginated, deprecated }) => ({
    name,
    invoke,
    description,
    parameters,
    examples,
    touchesState,
    externalEffect,
    paginated,
    deprecated,
  }));
}

function renderHelpText(entries = publicManifestEntries()) {
  // Label for touchesState+externalEffect: 'read' (both false), 'write'
  // (touches only), 'external' (effect only), or 'write+external' (both true).
  const labelFor = (touchesState, externalEffect) => {
    if (touchesState && externalEffect) return 'write+external';
    if (touchesState) return 'write';
    if (externalEffect) return 'external';
    return 'read';
  };
  const lines = [`fgos — the fgOS work-item CLI (schema_version ${MANIFEST_SCHEMA_VERSION})`, ''];
  for (const entry of entries) {
    const label = labelFor(entry.touchesState, entry.externalEffect);
    lines.push(`${entry.invoke} [${label}]`);
    lines.push(`    ${entry.description}`);
    const required = entry.parameters?.required || [];
    const positional = entry.parameters?.positional || [];
    // A required param that can be supplied positionally (mixed) or ONLY
    // positionally (e.g. submit's text, session's sub) is never a real
    // `--flag` on the command line — printing it as `required: --name`
    // would be actively wrong for the positional-only case (STR77) and
    // misleading for the mixed case. Split required into the two shapes so
    // each renders in its own idiom; only the flag-only remainder still
    // gets the `--name` form.
    const positionalRequired = required.filter((r) => positional.includes(r));
    const flagRequired = required.filter((r) => !positional.includes(r));
    if (positionalRequired.length) lines.push(`    positional: ${positionalRequired.join(', ')}`);
    if (flagRequired.length) lines.push(`    required: ${flagRequired.map((r) => `--${r}`).join(', ')}`);
    if (entry.deprecated) {
      lines.push(`    DEPRECATED since ${entry.deprecated.since} — use "${entry.deprecated.use_instead}" instead.`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function handleHelp(json) {
  if (json) {
    const manifest = { schema_version: MANIFEST_SCHEMA_VERSION, commands: publicManifestEntries() };
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  } else {
    process.stdout.write(renderHelpText());
  }
}

// Per-verb `fgos <verb> --help` (STR79/D3): same "one door" idiom as the
// top-level `--help` special-case above, one level down — prints only that
// verb's own manifest entry (not the full command list) and returns true so
// the caller exits before runVerb ever dispatches (no side effects, e.g.
// `init --help` must never call initStore). Unknown verb -> false, so the
// normal dispatch path still produces its usual "unknown verb" error.
// Text-mode only (D3/CONTEXT out-of-scope note): the caller gates this on
// `!flags.json`, so `<verb> --help --json` is left to fall through unchanged.
// Same documented exception as the full manifest above, not a separate one —
// this reuses renderHelpText/publicManifestEntries scoped to one verb, so it
// is never wrapped in the fgos.v1 envelope for the same reason: metadata
// about the CLI's own verb surface, not a verb's data payload.
function handleVerbHelp(verb) {
  const entry = publicManifestEntries().find((e) => e.name === verb);
  if (!entry) return false;
  process.stdout.write(renderHelpText([entry]));
  return true;
}

// `--pretty` rendering (D7): ONLY for `setup`/`doctor`, and only when the
// flag is given — every other verb, and these two without `--pretty`, stay
// byte-identical to the wrapEnvelope + JSON path. `--pretty` itself IS
// CTR001's documented exception here: an explicit human-readable rendering
// opt-out via an explicit flag, not a verb's default payload.
function renderPretty(verb, data) {
  const lines = [];
  if (verb === 'doctor') {
    lines.push(bold('fgos doctor'));
    if (data.fixed) {
      for (const f of data.fixed) {
        lines.push(formatCheck(f.changed, `fix: ${f.id}`, f.message));
      }
    }
    for (const c of data.checks) {
      lines.push(formatCheck(c.passed, c.description, c.message));
    }
  } else if (verb === 'setup') {
    lines.push(bold('fgos setup'));
    for (const rc of data.rcFilesInserted) {
      lines.push(formatCheck(true, `inserted shell-integration source line`, rc));
    }
    for (const rc of data.rcFilesAlreadyConfigured) {
      lines.push(formatCheck(true, `already sourced`, rc));
    }
    if (data.rcWriteDeclinedReason) {
      lines.push(formatCheck(false, 'skipped shell-profile line', data.rcWriteDeclinedReason));
    }
    lines.push(
      formatCheck(
        true,
        data.configCreated
          ? 'created .fgos/config.json with current defaults'
          : data.configAddedKeys.length > 0
            ? `added missing config keys: ${data.configAddedKeys.join(', ')}`
            : 'config already up to date',
        data.configPath,
      ),
    );
    lines.push(
      formatCheck(
        data.hooksWired,
        data.hooksWired
          ? 'core.hooksPath wired to .githooks'
          : data.hooksSkippedExisting
            ? `core.hooksPath already set to "${data.hooksSkippedExisting}" — left untouched, main-checkout lock is NOT active`
            : 'core.hooksPath not wired (no .git checkout here)',
        'main-checkout lock hook',
      ),
    );
  }
  return `${lines.join('\n')}\n`;
}

// tsk-56t D2: the exact 8 read verbs the decision names — not every
// `requiresExistingStore: false` verb (that set also includes `session`/
// `setup`/`doctor`, which never touch `.fgos/` at all, and `init`, which
// gets its own opposite linked-worktree refusal above).
const STORE_MISSING_WARNING_VERBS = new Set(['list', 'ready', 'graph', 'stale', 'check', 'rollup', 'show', 'conflicts', 'triage']);

async function main() {
  const [, , verb, ...rest] = process.argv;

  if (verb === '--help') {
    handleHelp(rest.includes('--json'));
    process.exitCode = 0;
    return;
  }

  // tsk-5z0: which pre-handler fault the code is currently exposed to, so the
  // catch below can tell a malformed CALL apart from a verb's own refusal
  // without reading `err.message` (that would couple this to ~73 hand-written
  // strings and misclassify the moment one is reworded). Each assignment
  // names what the very next statement can throw; `null` means "past the
  // pre-handler region — whatever fails now is the verb answering correctly".
  // `parseArgs` sits inside the try for exactly this reason: outside it, an
  // arg-parse fault never reached this catch at all and could not be recorded.
  let faultClass = 'arg-parse';
  let dir;
  try {
    const { flags, positional } = parseArgs(rest);

    if (flags.help && !flags.json && handleVerbHelp(verb)) {
      process.exitCode = 0;
      return;
    }

    faultClass = 'dir-invalid';
    dir = dataDir(flags.dir);
    // tsk-4fu-2: a verb registered `requiresExistingStore: true`
    // (command-registry.mjs) reads/writes through this `dir` — refuse
    // before ever reaching its handler when `.fgos/` isn't there yet,
    // instead of letting `appendEventCore`'s own `mkdirSync` silently
    // create a fresh, empty one (the worktree phantom-store hazard this
    // item closes). `init` is deliberately never in that set — it is the
    // one legitimate door that creates `.fgos/` — but gets the opposite
    // check: refuse when `cwd` is a linked worktree, the one remaining
    // path that could recreate a live `.fgos/` there and defeat ADR0020.
    const entry = COMMAND_REGISTRY.find((e) => e.name === verb);
    faultClass = 'store-missing';
    if (entry?.requiresExistingStore && !fs.existsSync(dir)) {
      throw new StoreError(
        'validation',
        `.fgos/ not found at "${dir}" -- run "fgos init" here first, or check you are not inside a linked worktree (worktrees never carry .fgos/, per ADR0020: docs/decisions/0020-chan-fgos-khoi-worktree-worker.md).`,
      );
    }
    faultClass = 'init-in-worktree';
    if (verb === 'init' && !isMainWorktree(process.cwd())) {
      throw new StoreError(
        'validation',
        `"fgos init" refused inside a linked worktree ("${process.cwd()}") -- worktrees never carry .fgos/ by design (ADR0020); run "fgos init" from the main checkout instead.`,
      );
    }
    // tsk-56t D2: these 8 read verbs are `requiresExistingStore: false` by
    // design (a fresh non-worktree dir with no store yet is a legitimate
    // "not evaluated" case, not an error) — but that same tolerance means a
    // worktree-resident session that forgets `--dir` sees a silent, real-
    // looking empty view instead of a signal that the actual store lives
    // elsewhere. `ready`/`triage` can return a bare array when unpaginated
    // (paginateVerbResult), so this can never be a JSON `data` field without
    // changing that shape only in this one runtime case — a stderr line
    // keeps stdout's `data` shape byte-identical in every case, mirroring
    // this file's existing stdout=data/stderr=diagnostics split above.
    if (STORE_MISSING_WARNING_VERBS.has(verb) && !fs.existsSync(dir) && !isMainWorktree(process.cwd())) {
      process.stderr.write(
        `fgos: warning: .fgos/ not found at "${dir}" -- this view may be empty because the real store lives elsewhere (worktrees never carry .fgos/, per ADR0020); pass --dir <mainRoot> to read it.\n`,
      );
    }
    // Past this line the verb's own handler runs, and its refusals ("work X
    // not found", an Iron Law trip, a held lock) are correct answers rather
    // than misuse — so nothing there is recorded. The one exception is an
    // unknown verb: its error is thrown deep inside `runVerb`, where position
    // alone would file it as an ordinary refusal, but the registry lookup
    // above already answers it without new machinery. The error itself still
    // comes from `runVerb` unchanged.
    faultClass = entry ? null : 'unknown-verb';
    const data = await runVerb(verb, flags, positional, dir);
    if (flags.pretty && (verb === 'setup' || verb === 'doctor')) {
      process.stdout.write(renderPretty(verb, data));
    } else {
      process.stdout.write(`${JSON.stringify(wrapEnvelope(data), null, 2)}\n`);
    }
    process.exitCode = 0;
  } catch (err) {
    // tsk-5z0: record before reporting, and only say the record exists when
    // one actually landed — `recordInvocationFault` returns null when the
    // fault is a verb's own refusal, when there is no store to write to, or
    // when the write itself failed. It never throws, so the two statements
    // below stay exactly what they were.
    const recorded = recordInvocationFault({
      fgosDir: dir,
      cwd: process.cwd(),
      verb,
      faultClass,
      message: err.message,
      argv: process.argv.slice(2),
    });
    process.stderr.write(`fgos: ${err.message}\n`);
    if (recorded) {
      process.stderr.write(`fgos: invocation fault recorded to ${recorded}\n`);
    }
    process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1;
  }
}

main();
