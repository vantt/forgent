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
import { fileURLToPath } from 'node:url';
import { initStore, addWork, moveWork, editWork, resolveParkReason, addDecision, addOutcome, addFriction, listWork, readyWork, isDepsAndLineageReady, graphMetrics, graphWhatIf, staleDoingAdvisory, stalePostDeliveryAdvisory, footprintConflicts, computedSchedule, readRawEvents, rebuild, putInAwaiting, answerAwaiting, setFocus, goalFocusShow, assertAcceptanceEvidence, assertPlanEvidence, assertValidDocType, recordGateApprove, recordCall, recordCallReturn, StoreError, EXIT_CODES, categoryOf, parseDecisionRelation, decisionTextLooksLikeSupersession } from '../src/state/store.mjs';
import { collectWideSourceFiles, findWideCitationFindings, isDLocalId } from '../scripts/check-decision-citation-drift.mjs';
import { computeDecisionIndex, generateDecisionIndex } from '../src/report/decision-index.mjs';
import { renderLockedDecisionsTable } from '../src/report/context-render.mjs';
import { runFourDoorChecks } from '../src/state/retrospective-doors.mjs';
import { findAuthoritativeMatch, findDuplicateAuthoritativeClaims } from '../src/report/authoritative-match.mjs';
import { parseFrontmatter } from '../src/report/frontmatter.mjs';
import { probeTool, readLocalStatus, writeLocalStatus, resolvedStatus, normalizeCapability, toolsFromExecutors } from '../src/state/tool-registry.mjs';
import { repairTruncatedLastLine, EventLogError } from '../src/state/events.mjs';
import { deriveTitle, classify, generateId } from '../src/intake/classify.mjs';
import { wrapEnvelope } from '../src/state/envelope.mjs';
import { loadRunnerConfig, ensureRunnerConfigForDir } from '../src/runner/dispatch.mjs';
import { readGateBypassLevel, canAutoApprove, canAutoApproveMergedGate } from '../src/state/gate-bypass.mjs';
import { checkDispatchAttestation } from '../src/runner/attestation-guard.mjs';

// tsk-1qi: this running copy's own package root -- the source
// `materializeSkillsIntoProject` copies `.agents/skills/*` FROM, when
// `fgos setup` runs in an external project whose own cwd has no
// `.agents/skills` of its own yet. Two levels up from this file
// (bin/fgos.mjs -> package root), the same "derive from the executing
// copy's own on-disk location" approach `integrationScriptPath()` already
// uses in src/setup/registrations.mjs.
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
import { resolveFgosDir, fgosDirFromRoot, resolveMainCheckoutRoot } from '../src/runner/paths.mjs';
import { resolveFgosFile, FGOS_FILE } from '../src/state/fgos-file-registry.mjs';
import { resolveCliVersionInfo } from '../src/cli/version.mjs';
import { resolveDiscovery, classificationPatchFromVerdict, assertCallerClassification, hasRealVerify } from '../src/intake/discovery.mjs';
import { resolvePlan, replaceLockedDecisionsSection, resolveContentRoot } from '../src/intake/plan.mjs';
import { computeEntropy, computeCounts, FINAL_STATUSES } from '../src/report/entropy.mjs';
import { findSourceCaptureIds } from '../src/report/enduser-index.mjs';
import { generateEnduserDocsIndex } from '../src/report/enduser-index-generate.mjs';
import { rankCandidates } from '../src/evolve/candidates.mjs';
import { rankImpact } from '../src/state/impact.mjs';
import { isResolvedStatus } from '../src/state/frontier.mjs';
import { paginate } from '../src/state/cursor.mjs';
import { runGoalCheck, detachedWorktreeFgosHint, runInvariantChecks, invariantFailureAsCheck } from '../src/runner/goal-check.mjs';
import { frozenJudgeHits, footprintDiffHits } from '../src/runner/frozen-judge.mjs';
import { normalizePath } from '../src/util/normalize-path.mjs';
import { collectOutcomeEntry, collectFrictionData } from '../src/report/item-trace.mjs';
import { cleanupMergedBranch, isWorkingTreeClean as isMainTreeClean, isFgosOnlyStatusLine, buildOwnFileSet } from '../src/runner/merge.mjs';
import { assertSafeMainCheckoutReset } from '../src/runner/main-checkout-reset-guard.mjs';
import { rejectUseCase } from '../src/verbs/merge/reject.mjs';
import { reviewUseCase } from '../src/verbs/merge/review.mjs';
import { syncRootUseCase } from '../src/verbs/merge/sync-root.mjs';
import { promoteToComponentUseCase } from '../src/verbs/merge/promote-to-component.mjs';
import { approveUseCase } from '../src/verbs/merge/approve.mjs';
import { mergeList, mergeNext } from '../src/verbs/merge/merge.mjs';
import { catchupUseCase } from '../src/verbs/merge/catchup.mjs';
import { unreleasedHasEntries } from '../src/setup/registrations.mjs';
import { branchNameFor, branchExists, provisionDependencies, resyncWorktree, detectTrunk, isMainWorktree, currentHead, realpathOrSelf as realpathOr } from '../src/runner/worktree.mjs';
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
import { resolveWriterIdentity } from '../src/util/session-identity.mjs';
import { createSession, endSession, listSessions, reclaimOrphanedSessions, SessionError } from '../src/runner/session.mjs';
import { visitCount } from '../src/runner/anti-loop.mjs';
import { DEFAULTS } from '../src/state/work.mjs';
import { getDomain, stageForStep, effectiveStage, discoverableStages, resolveDomainName } from '../src/state/workflow-stage-graphs.mjs';
import { writeCoexistenceManifest } from '../src/install/coexist.mjs';
import { MANIFEST_SCHEMA_VERSION, COMMAND_REGISTRY } from '../src/cli/command-registry.mjs';
import { recordInvocationFault, resolveFaultLogPath } from '../src/cli/invocation-fault-log.mjs';
import { computeAwaitingContext } from '../src/state/awaiting-context.mjs';
import { DOCTOR_CHECKS, integrationScriptPath, ensureSharedConfigDefaults, runFixes } from '../src/setup/checks.mjs';
import { sharedConfigFilePath, readSharedConfig, readSharedConfigOrEmpty, readInvariantCheckCommands } from '../src/config/shared-config-file.mjs';
import { countWorkerSlots, hasWorkerSlotRoom } from '../src/state/worker-slots.mjs';
import { assessCleanupReadiness, blockedItemsNowResolvable } from '../src/state/cleanup-harness.mjs';
import { DEFAULT_CLEANUP_TTL_DAYS, DEFAULT_CLEANUP_LEAF_TTL_DAYS } from '../src/setup/registrations.mjs';
import { installGitHooks, uninstallGitHooks } from '../src/setup/git-hooks.mjs';
import { installClaudeCodeHook } from '../src/setup/claude-code-hooks.mjs';
import { detectRcFiles, insertSourceLine, hasSourceLine } from '../src/setup/shell-rc.mjs';
import { materializeSkillsIntoProject } from '../src/setup/skill-wrappers.mjs';
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

// `currentHead`/`resolveRefSha` live in src/runner/worktree.mjs (tsk-49i
// D3) — the merge-cluster use cases need the identical reads, and a use
// case cannot import back up into this entry file.

// tsk-5dk: ancestry probe for `move --to delivered`'s refusal check below.
// Plain execFileSync + try/catch, not gitAt (gitAt always throws on any
// non-zero exit; here exit 1 is a legitimate "not an ancestor" answer, not
// an error) — same shape the upstream-branch probe a little below already
// uses for the same reason.
function isBranchReachableFromTrunk(cwd, branch, trunk) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', `refs/heads/${branch}`, trunk], { cwd, encoding: 'utf8', shell: false });
    return true;
  } catch (err) {
    if (err.status === 1) return false;
    throw new StoreError('validation', `git merge-base --is-ancestor "${branch}" "${trunk}" failed in "${cwd}": ${err.message}`);
  }
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

// tsk-4hl: an item's own docs/history/<id>/iron-law-evidence.md is a
// mandatory workflow artifact this repo's own convention writes for every
// Iron-Law-required item (docs/history/tsk-5t3-iron-law-evidence-contract/
// CONTEXT.md) -- an item's declared footprint almost never lists it
// (footprint names the CODE the item touches, not its own evidence doc),
// so footprintDiffHits would otherwise flag it on every single Iron-Law-
// gated item that declares a footprint at all: 100% guaranteed noise,
// found by independent review after tsk-2ig merged. Narrow and mechanical
// on purpose -- only this exact path, never a whole docs/history/<id>/
// exemption (CONTEXT.md/plan.md land on earlier decompose-stage commits,
// already baked into headAtTake/branchHeadAtTake by the time `return`'s
// own diff is computed, so they never actually appear here).
function excludeIronLawEvidence(files, id) {
  const evidencePath = `docs/history/${id}/iron-law-evidence.md`;
  return files.filter((f) => normalizePath(f) !== evidencePath);
}

// tsk-x5r: `.fgos/` is fgOS's own live event-sourced store, mutated by the
// very take/return/approve lifecycle operations this advisory guards --
// `isWorkingTreeClean` already exempts it for exactly this reason
// (`isFgosOnlyStatusLine`, src/runner/merge.mjs: "never signals an
// actually-dirty code tree"). `footprintDiffHits` missed the same
// exemption: on the main-source `return` path, a `.fgos/` change from ANY
// concurrent session's own take/return/approve landing on the shared main
// checkout during this item's own doing window shows up in `ownDiff` --
// this repo git-tracks `.fgos/` -- and got flagged on every footprint-
// declaring item that (correctly) never lists its own store's paths in
// its footprint (87 of 371 real items declare a footprint; only 7 list
// any `.fgos/` path). Found by independent review after tsk-4hl merged.
//
// tsk-5iv D2 (round-3 review, MEDIUM): the original exemption was a blanket
// `.fgos/**` match, which also swallowed hand-edited policy files
// (`.fgos/config.json`, `.fgos/gate-bypass.json`, `.fgos/coexistence.json`)
// that real items DO deliberately edit as their own work product (`git log
// -- .fgos/config.json` carries real feature commits) -- an item whose
// declared footprint excludes `.fgos/` but that quietly edits
// `gate-bypass.json` produced zero `footprintDiffHits`, the opposite of
// this advisory's purpose. Narrowed to only the append-only lifecycle
// streams the concurrent-session noise above actually comes from --
// `events.jsonl` (plus its own timestamped backups) and
// `entropy-history.jsonl` -- never a policy or generated file.
//
// Tầng A/T2 (TA-D2/TA-D11): the same append-only stream now also lands in
// per-writer files under `.fgos/events/<writer-id>-<openTs>.jsonl` instead
// of always landing in baseline-0 -- same noise, same reasoning, just a
// different physical path; a compacted baseline under `.fgos/events/`
// (`baseline-<ts>.jsonl`, T6) and its own manifest sidecar under
// `.fgos/events/archive/` are equally append-only lifecycle output, never
// an item's own declared footprint.
//
// tsk-3tp-1 (D2, sweep-into-merge-commit redesign): the truncation guard's
// own mark sidecar (`events-jsonl.truncation-guard.json`) and the warnings
// log it appends to (`main-checkout-guard-warnings.jsonl`) are the same
// kind of append-only, no-item-owns-it output -- a fallback checkpoint (or
// the merge-time sweep) can legitimately touch either one, never an item's
// own declared footprint. The wildcard extension on
// `events-jsonl.truncation-guard\..*` also subsumes tsk-vim's own narrower
// exact-`.json` fix (independently landed on main) -- one regex alternative
// covers both.
// `.fgos/logs/` (phase-01, plans/260825-0842-fgos-logs-dir-bucketing):
// entropy/changelog-nag/approve-fault/invocation-fault/guard-warnings all
// moved under this gitignored bucket -- kept here too since this regex is
// evaluated against whatever path list a caller hands it, not only
// `git diff --name-only` (which would never surface an ignored path).
const FGOS_NOISE_ONLY_PATHS = /^\.fgos\/(events\.jsonl(\.backup-.*)?|events\/.*\.jsonl|events\/archive\/.*|logs\/.*|entropy-history\.jsonl|events-jsonl\.truncation-guard\..*|main-checkout-guard-warnings\..*)$/;
function excludeFgosPaths(files) {
  return files.filter((f) => !FGOS_NOISE_ONLY_PATHS.test(normalizePath(f)));
}

// tsk-67o: research findings doc written by fgos-researching during
// discovery/planning/validating to docs/history/<feature>/RESEARCH.md -- an
// item's footprint-sync convention (verify-sync-and-gap.md) requires syncing
// plan.md into footprint, but never lists RESEARCH.md. footprintDiffHits would
// otherwise flag it on nearly every item that runs fgos-researching. Narrowed to
// this item's own item.docsRef directory when docsRef is set.
function excludeDocsRefResearch(files, item) {
  if (typeof item?.docsRef !== 'string' || !item.docsRef.trim()) return files;
  const researchPath = normalizePath(path.posix.join(item.docsRef.replace(/\/+$/, ''), 'RESEARCH.md'));
  return files.filter((f) => normalizePath(f) !== researchPath);
}

// `realpathOr` is worktree.mjs's `realpathOrSelf` (imported above, tsk-49i
// D3): a bare fs.realpathSync would throw the moment any ONE registered
// session's worktree directory is gone from disk (a crashed session
// hand-cleaned instead of via `fgos session end`) — crashing `return` for
// EVERY caller, including from the main checkout. The try/catch fallback to
// path.resolve keeps one stale registry entry from taking down the gate.

// The gh binary the GitHub transport shells out to (github-adapter D2). Tests
// substitute a fake executable through FGOS_GH_COMMAND; production leaves it
// unset and the real `gh` on PATH is used.
function ghCommandOpts() {
  return { ghCommand: process.env.FGOS_GH_COMMAND || 'gh' };
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
// default ON for take/pick/approve -- no flag needed. Bare `--wait` (no
// value) is a harmless no-op alias for the default. `--no-wait` is the
// opt-out, restoring today's exact immediate-fail-on-HELD behavior.
//
// tsk-2rf D2/D3: an *explicit* `--wait <ms>` is now the true wall-clock
// ceiling for the retry (`withLockRetry`, `src/runner/lock-wait.mjs`) --
// no longer capped by the lock's own remainingTtlMs -- so a caller who
// knows the holder is a legitimate long-running session can outlast it.
// MAX_WAIT_MS bounds that ceiling: a mistyped value must not hang a CLI
// call near-indefinitely against a holder that never actually releases.
const MAX_WAIT_MS = 15 * 60 * 1000; // 900000ms, tsk-2rf D3

function parseWaitFlags(flags, verbName) {
  const noWait = Boolean(flags['no-wait']);
  let waitMs;
  if (flags.wait !== undefined && flags.wait !== true) {
    waitMs = Number(flags.wait);
    if (!Number.isFinite(waitMs) || waitMs <= 0) {
      throw new StoreError('validation', `${verbName} --wait must be a positive number of milliseconds (got "${flags.wait}").`);
    }
    if (waitMs > MAX_WAIT_MS) {
      throw new StoreError('validation', `${verbName} --wait must be at most ${MAX_WAIT_MS}ms (15 min) (got "${flags.wait}").`);
    }
  }
  return { noWait, waitMs };
}

// Shared --timeout/--no-timeout resolution for return/approve/sync-root/
// catchup (tsk-3vo D2/D3/D5): omitting both falls back to the runner
// config's own timeoutMs -- the same value and the same runGoalCheck
// primitive the runner loop already uses at loop.mjs -- instead of
// silently running verify unbounded, which used to leave a hung verify
// command with no diagnosis and the main-checkout lock held until TTL
// expiry. --no-timeout is the only way left to opt into an actually-
// unbounded verify run. Every call site passes `path.dirname(dir)`, not
// `process.cwd()` (tsk-5hv, found by fgos-coding-implement): same
// worktree-blindness fix as `discover`/`decompose` above -- `dir` already
// reflects `--dir` when a skill passes it explicitly, `process.cwd()`
// never does.
// The ONE place the merge cluster's shared flags become a structured
// options object (tsk-49i D3). `merge next` forwards this whole object down
// to `approve`/`sync-root` unchanged rather than re-reading `flags` at each
// hop: the old code passed the raw `flags` bag through a recursive
// `runVerb('approve', flags, ...)` call, and re-enumerating options at each
// new call site is exactly where one gets silently dropped and an
// unattended run quietly changes behavior.
//
// `verb` names the calling verb because two of the parsers below put it in
// their own refusal messages — forwarding from `merge next` therefore
// builds the target verb's options with THAT verb's name, matching what the
// recursive `runVerb` call produced before.
// `resolveTimeoutMs` and `resolveWaitFlags` are thunks, not resolved
// values, and that is load-bearing. Both of the parsers behind them can
// refuse, and `resolveVerifyTimeoutMs` additionally falls through to
// `ensureRunnerConfigForDir`, which WRITES a default runner config (and
// warns on stderr) when none exists yet. Resolving either while building
// the options would move that refusal — and that write — ahead of every
// guard the use case runs:
//
//   - `sync-root` used to parse both only AFTER its item/worktree/branch/
//     Iron-Law guards, so a refusal there named the real problem and
//     touched nothing.
//   - `merge next` used to reach either one ONLY by actually recursing into
//     `approve`/`sync-root`, so an idle `{picked: null}` turn parsed no
//     flags and wrote nothing. Parsing eagerly turned a stale `--wait` on
//     an idle turn into exit 4, breaking the pool-empty shape merge-loop
//     reads (tsk-2fx); the same eagerness did it for `--timeout` first
//     (tsk-55f).
//
// Each use case calls these at exactly the point its old case block called
// `parseWaitFlags`/`resolveVerifyTimeoutMs`.
function parseMergeClusterOptions(verb, flags, dir, extra = {}) {
  return {
    resolveTimeoutMs: () => resolveVerifyTimeoutMs(verb, flags, path.dirname(dir)),
    resolveWaitFlags: () => parseWaitFlags(flags, verb),
    acknowledgeIronLaw: flags['acknowledge-iron-law'] === true,
    acknowledgeDrift: flags['acknowledge-drift'] === true,
    github: Boolean(flags.github),
    prNumber: flags.pr,
    // Test-only failure seam (tsk-480 D3), same shape as FGOS_GH_COMMAND:
    // an env var read only in the adapter, scoped to an exact item id so it
    // can never affect any other item in the same process, inert unless a
    // test explicitly sets it. Production code never sets this variable.
    testForceLockTimeoutId: process.env.FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT ?? null,
    ...ghCommandOpts(),
    ...extra,
  };
}

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

// tsk-27y D1/D2: `--verdict` on `discover` lets a live session that already
// reasoned about clarity (fgos-coding-exploring) pass its own verdict directly,
// skipping resolveDiscovery's judgeDiscovery subprocess call for this one
// invocation. Omitting `--verdict` entirely leaves `callerVerdict`
// undefined -- byte-identical to before this item. `--verify`/`--question`
// are REQUIRED (not falling back to judgeDiscovery's own
// FALLBACK_VERIFY/DEFAULT_UNCLEAR_QUESTION silent defaults) -- an explicit
// caller-supplied protocol should never silently substitute a placeholder
// for what the caller was supposed to already know.
function parseDiscoverCallerVerdict(flags) {
  if (flags.verdict === undefined) return undefined;
  if (flags.verdict === 'clear') {
    const verdict = { clear: true, verify: requireField(flags.verify, 'discover --verdict clear requires --verify "<cmd>"') };
    // tsk-5cf D1b: --force only ever means something on the clear branch --
    // a caller-supplied verdict of "unclear" never reaches the second-pass
    // verify judge at all (resolveDiscovery only calls it when
    // verdict.clear is true), so --force is silently a no-op there rather
    // than an error -- matches this parser's own "never guess, never
    // silently misapply" stance for every other flag here by simply not
    // reading it on that branch.
    if (flags.force) verdict.force = true;
    // D12: tier/kind/risk are decided AT discovery, on evidence — the
    // headless worker already reports them in its `fgos-verdict` block, and
    // these three flags are the interactive path's half of that same data
    // contract, so a live session no longer has to remember a separate
    // `fgos edit` call to record what it just judged. Read only on the clear
    // branch, the same way `--force` is: a classification judged against
    // evidence that turned out insufficient must never ride an unclear
    // verdict, and simply not reading the flags there is what enforces it —
    // the same guard the headless path runs
    // (`classificationPatchFromVerdict`) then re-checks the resolved outcome
    // before anything is written. Each key is present only when the caller
    // actually passed it, so a call that omits all three produces the exact
    // same verdict shape as before these flags existed.
    const tier = optionalField(flags.tier, "discover --tier requires a value ('light'/'standard'/'heavy'); omit --tier entirely to leave the item's tier unchanged.");
    const kind = optionalField(flags.kind, "discover --kind requires a value from the domain's own kind vocabulary; omit --kind entirely to leave the item's kind unchanged.");
    const risk = optionalField(flags.risk, "discover --risk requires a value ('light'/'standard'/'heavy'); omit --risk entirely to leave the item's risk unchanged.");
    if (tier !== undefined) verdict.tier = tier;
    if (kind !== undefined) verdict.kind = kind;
    if (risk !== undefined) verdict.risk = risk;
    return verdict;
  }
  if (flags.verdict === 'unclear') {
    return { clear: false, question: requireField(flags.question, 'discover --verdict unclear requires --question "<text>"') };
  }
  throw new StoreError('validation', `discover --verdict must be "clear" or "unclear" (got "${flags.verdict}").`);
}

// tsk-27y D1/D2: `--verdict` on `plan` (renamed from `decompose`, tsk-403
// D11 — the VALUES `pass-through`/`need-human`/`decompose` stay unchanged,
// only the verb name changes), same shape one stage over -- lets a live
// session that already reasoned about split-work (fgos-coding-planning)
// pass its own verdict directly, skipping resolvePlan's retired subprocess
// judge for this one invocation. Omitting `--verdict` entirely leaves
// `callerVerdict` undefined -- byte-identical to before this item.
// `--children` reuses parseAcceptanceFlag (same JSON-encoded-array shape
// `submit --acceptance` already established) -- each element matches the
// same child shape (title/verify required; kind/risk/refs/footprint/deps
// optional) the retired judge used to produce, validated downstream by the
// same `normalizeChild` a model-produced verdict goes through
// (`resolveCallerPlanVerdict`, plan.mjs).
function parsePlanCallerVerdict(flags) {
  if (flags.verdict === undefined) return undefined;
  if (flags.verdict === 'pass-through') {
    return { verdict: 'pass-through', reason: optionalField(flags.reason, 'plan --verdict pass-through --reason requires a non-empty value when passed') };
  }
  if (flags.verdict === 'need-human') {
    return { verdict: 'need-human', reason: requireField(flags.reason, 'plan --verdict need-human requires --reason "<text>"') };
  }
  if (flags.verdict === 'decompose') {
    const childrenMessage =
      'plan --verdict decompose requires --children, a JSON-encoded array of child objects ({title, verify, kind?, risk?, refs?, footprint?, deps?})';
    const children = parseAcceptanceFlag(flags.children, childrenMessage);
    if (children === undefined) {
      throw new StoreError('validation', childrenMessage);
    }
    const verdict = {
      verdict: 'decompose',
      reason: requireField(flags.reason, 'plan --verdict decompose requires --reason "<text>"'),
      children,
    };
    // tsk-25g D2: mirrors discover's --force (tsk-5cf D1b) -- only ever
    // means something on the per-child second-pass verify dispute path
    // (resolvePlan's disputedChild branch), silently a no-op on
    // pass-through/need-human the same way discover's --force is a
    // no-op on the unclear branch.
    if (flags.force) verdict.force = true;
    return verdict;
  }
  throw new StoreError('validation', `plan --verdict must be "pass-through", "need-human", or "decompose" (got "${flags.verdict}").`);
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
// tsk-4zj D1/D4: additive-only projection — never mutates `item`, never
// touches `stage` itself (stays absent when never explicitly set, per the
// D8 lazy-default contract `test/state/frontier.test.mjs:205`/
// `test/state/backward-compat.test.mjs:277` lock at the storage layer).
// Read-verb print sites spread this onto whatever they already return so a
// reader can tell "explicitly at this stage" from "defaulted here" instead
// of seeing an absent field with no explanation either way.
function withStageEffective(item) {
  return { ...item, stageEffective: effectiveStage(item, getDomain(item.domain)) };
}

function paginateVerbResult(items, flags, order, verbLabel) {
  const { cursor, limit } = readPaginationFlags(flags, verbLabel);
  if (cursor === undefined && limit === undefined) return items;
  return paginate(items, { cursor, limit, order });
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
  // FINAL_STATUSES: shared with entropy.mjs (decision record 0027's audit
  // §2 flagged this file's copy and entropy.mjs's copy as drifted-apart
  // duplicates — see entropy.mjs's own doc comment on the export for the
  // reconciled reasoning). Imported, not redeclared, so the two files can
  // never drift apart again.
  const missing = Object.values(view.work ?? {})
    .filter((w) => (!id || w.id === id) && FINAL_STATUSES.has(w.status) && !outcomes[w.id]?.actual)
    .map((w) => w.id);
  if (missing.length === 0) {
    return null;
  }
  return { count: missing.length, ids: missing };
}

// tsk-3ip (docs/history/automated-changelog-compound-learn/DISCUSSION.md
// §6.1/§6.4): observe/remind only, never blocks merge (R2, tsk-28x §6.4).
// `unreleasedHasEntries` (registrations.mjs) is the same structural read
// the `changelog-unreleased-stale` doctor check uses, so both surfaces
// agree on what "has an entry" means.
function changelogNagHistoryPath(dir) {
  return resolveFgosFile(dir, FGOS_FILE.CHANGELOG_NAG_HISTORY);
}

// Appends one snapshot per `check` run — same append-only, never-read-back
// discipline `appendHistoryEntry` (entropy, below) already uses. This file
// is the item's own required "bộ đếm": raw {ts, hasEntries, deliveredCount}
// data points that, read back across N real runs spread over N real
// merges, are what let a person later derive the three numbers the item's
// description says are currently guesses. This function only records the
// data point — it never computes a rate itself ("đếm, đừng mắng").
function appendChangelogNagHistoryEntry(dir, entry) {
  const logPath = changelogNagHistoryPath(dir);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

function collectChangelogNag(view, dir) {
  const root = path.dirname(dir);
  const changelogPath = path.join(root, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    return { fileExists: false };
  }
  const content = fs.readFileSync(changelogPath, 'utf8');
  const hasEntries = unreleasedHasEntries(content);
  const deliveredCount = Object.values(view.work ?? {}).filter((w) => w.status === 'delivered').length;
  appendChangelogNagHistoryEntry(dir, { ts: new Date().toISOString(), hasEntries, deliveredCount });
  return { fileExists: true, hasEntries, deliveredCount };
}

// Entropy-trend history path (per this cell's action (2) / must_haves: MUST
// live in the SAME data dir as the store's own events.jsonl — never
// hardcoded to `repo/.fgos`). `dir` here is always the caller's resolved
// data dir (dataDir() below, or a test's own tmp dir), the exact same value
// every other verb in this file already threads through to store.mjs.
function entropyHistoryPath(dir) {
  return resolveFgosFile(dir, FGOS_FILE.ENTROPY_HISTORY);
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
  const logPath = entropyHistoryPath(dir);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
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
    // Changelog observe/remind nag (tsk-3ip): a whole-work-state summary,
    // not scoped to `id`, same as `entropy` below.
    changelogNag: collectChangelogNag(view, dir),
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
function childrenOf(view, id) {
  return Object.values(view.work).filter((w) => w.parent === id);
}

// The second membership edge a rollup has to read (tsk-1ug): `targets`
// (str67-goal-directed-planning D2, src/state/work.mjs:567-588) is the set
// of items a goalTier milestone/MVP considers part of it. Unlike `parent`
// it never goes through `resolveRoot`, so each target keeps its own root
// and merges independently onto main -- a genuinely DIFFERENT relationship
// from a decomposed root's children, not a second way of spelling the same
// one, which is why the two stay separate arrays with separate counts
// rather than being folded into one (execution-fanout CONTEXT.md D4; the
// same split `edit --verify-from-children`/`--verify-from-targets` already
// keeps below).
//
// A target id with no matching work item is reported as a row with null
// `title`/`status` rather than dropped: `targets` deliberately skips
// validateDeps (work.mjs:571-575), so a typo'd id is reachable, and
// silently dropping it would let a milestone read as complete when one of
// its targets does not exist at all. Such a row counts toward
// `targetTotalCount` and never toward `targetDoneCount`.
//
// Single level, same as `childrenOf` above: a target that is itself a
// milestone is reported as one row, never recursed into.
// `graph-metrics.mjs`'s `targetsClosure` already exists for the transitive
// job (a different one -- scoping a goal, not reporting progress).
function targetsOf(view, item) {
  const ids = Array.isArray(item.targets) ? item.targets : [];
  return ids.map((targetId) => {
    const target = view.work?.[targetId];
    return {
      id: targetId,
      title: target?.title ?? null,
      status: target?.status ?? null,
    };
  });
}

function collectRollupData(view, id) {
  const item = view.work?.[id];
  if (!item) {
    throw new StoreError('validation', `rollup: work "${id}" not found.`);
  }
  const children = childrenOf(view, id);
  const done = children.filter((w) => w.status === 'done').length;
  const targets = targetsOf(view, item);
  return {
    id,
    title: item.title,
    status: item.status,
    stageEffective: effectiveStage(item, getDomain(item.domain)),
    // Children-only, unchanged by tsk-1ug: every already-published
    // consumer of these two fields keeps reading exactly the number it
    // read before. A milestone's own progress lives in the `target*` pair
    // below instead of changing what these two mean.
    doneCount: done,
    totalCount: children.length,
    children: children.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      stageEffective: effectiveStage(c, getDomain(c.domain)),
    })),
    targetDoneCount: targets.filter((t) => t.status === 'done').length,
    targetTotalCount: targets.length,
    targets,
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
    // Per work-item-backlog-status D2: the default stays 'todo' for both
    // `submit` and `add` -- `opts.backlog` is the opt-in escape hatch that
    // marks an item as a not-yet-committed idea from the moment of
    // creation, instead of requiring submit-then-move. Same independent
    // optional-flag shape as `opts.async` below; an omitted --backlog flag
    // leaves this byte-identical to the prior hardcoded 'todo'. `add`
    // deliberately gains no such flag (D2, explicit human answer) -- it is
    // for already-planned work.
    status: opts.backlog ? 'backlog' : 'todo',
    // Per D4 (str83-fgos-slash-commands): --deps threaded from opts the
    // same way --domain/--discovered-from already are, immediately below.
    // opts.deps defaults to [] (parseListFlag's own undefined-input
    // shape), so an omitted --deps flag stays byte-identical to the prior
    // hardcoded deps: [].
    deps: opts.deps ?? [],
    risk,
    // Per tsk-5fs D1: refs now threads from opts the same way deps does,
    // immediately above (opts.refs defaults to [] via parseListFlag's own
    // undefined-input shape, so an omitted --refs flag stays byte-identical
    // to the prior hardcoded refs: []).
    refs: opts.refs ?? [],
    // tsk-5gu: opts.verify is the new optional --verify override (same
    // opts.X ?? default shape as every other field-parity flag below) --
    // omitted leaves this at the existing sentinel, unchanged.
    verify: opts.verify ?? SUBMIT_VERIFY_SENTINEL,
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
    // Per tsk-5fs D1: same field-parity flags `add`'s own work object
    // already carries — present-or-absent shape (never default-to-[]),
    // matching `add`'s own footprint/goalTier/targets precedent exactly.
    parent: opts.parent,
    footprint: opts.footprint,
    goalTier: opts.goalTier,
    targets: opts.targets,
    urgent: opts.urgent,
    // Per D8: every item entering through the public door starts at its
    // domain's Clarify-mapped stage — context-discovery must pass before
    // it can be worked. Generalized from the hardcoded 'clarify' (D8) to
    // stay domain-aware (base-workflow-model D1-D4/S2). tsk-qod D1/D2:
    // coding no longer maps a Clarify stage at all (clarify is retired
    // entirely, moved to a pre-item-creation Init helper), so
    // stageForStep(DOMAINS.coding, 'Clarify') is now undefined and this
    // falls straight through to `.stages[0]` — 'discovery', the domain's
    // own entry point. A domain with no Clarify-mapped stage (e.g.
    // 'synthetic', or 'coding' as of tsk-qod) falls back to its own first
    // declared stage. `add` deliberately omits this (lazy default,
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
    case 'version': {
      return resolveCliVersionInfo();
    }

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
        // tsk-535 D1: REQUIRED at this CLI handler layer only -- never
        // added to work.mjs's validateWorkShape, since two other
        // legitimate addWork callers (loop.mjs's discovered-work, and
        // this same file's promote-to-component fresh-root creation)
        // deliberately omit description by design and would break under a
        // schema-wide requirement (plan.md's own rejected-alternative).
        description: requireField(flags.description, 'add requires --description (the item\'s own full-text intake description)'),
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
        domain: optionalField(flags.domain, 'add --domain requires a domain name (e.g. coding/synthetic); omit --domain entirely to use the default.'),
        // Per D1/D2 (docs/history/add-stage-default-gap/CONTEXT.md): add now
        // stamps an entry stage the same way submit always has (line ~822
        // above) instead of leaving stage undefined -- explicit --stage
        // overrides; omitting it defaults to the domain's Clarify-mapped
        // stage, which for coding (tsk-qod D1/D2: Clarify retired entirely)
        // falls straight through to `.stages[0]` — 'discovery'. Same
        // silenced onUnrecognized as submit's own call: an
        // out-of-registry --domain is about to be rejected by addWork's
        // validateWork below anyway, so this must not fire a spurious
        // "folding to coding" warning first. An out-of-enum --stage value
        // is rejected downstream by store.mjs's validateWorkShape (the
        // single source for the STAGES domain), same "don't duplicate the
        // validation source" discipline --domain/--tier already follow.
        stage: optionalField(flags.stage, 'add --stage requires a stage value (e.g. discovery/decompose/executing); omit --stage entirely to use the default.')
          ?? stageForStep(getDomain(flags.domain, { onUnrecognized: () => {} }), 'Clarify')
          ?? getDomain(flags.domain, { onUnrecognized: () => {} }).stages[0],
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
        // Per decision record 0027 D6 (docs/history/phase-2-status-category-
        // schema/DISCUSSION.md §task-domain-fields): --domain-fields is an
        // optional JSON-encoded object ({ [domainName]: {...} }) — same
        // omitted-leaves-undefined shape as --acceptance above, reusing
        // parseAcceptanceFlag's generic "parse JSON or reject" behavior
        // (it never actually assumed an array — only the caller's own
        // message text names one). work.mjs's validateWorkShape/
        // validateDomainFields are the single source for the shape/
        // fieldSchema rules; a malformed JSON value is rejected here first.
        domainFields: parseAcceptanceFlag(flags['domain-fields'], 'add --domain-fields requires a JSON-encoded object ({ [domainName]: {...} }).'),
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
        // Per work-item-backlog-status D2: same independent boolean-flag
        // shape as --async above -- creates the item directly at
        // status: 'backlog' instead of the default 'todo'.
        backlog: Boolean(flags.backlog),
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
        // tsk-5gu: same optionalField shape as --tier/--kind/--risk above --
        // a submitter who already knows the real verify command (stated in
        // free text) previously had no way to attach it at submit time,
        // unlike `add` (which requires --verify outright). Omitted leaves
        // this undefined so submitWork falls through to its existing
        // SUBMIT_VERIFY_SENTINEL default, byte-identical to before.
        verify: optionalField(flags.verify, 'submit --verify requires a non-empty command; omit --verify entirely to use the sentinel until context-discovery designs one.'),
        // Same optional non-empty-path field `add` already exposes
        // (bin/fgos.mjs's `add` case) — submit previously had no way to set
        // this at all, so an item created through the public door could
        // never gain a docsRef except via a later `edit --docs-ref`.
        docsRef: optionalField(flags['docs-ref'], 'submit --docs-ref requires a non-empty path; omit --docs-ref entirely to leave unset.'),
        // Per tsk-5fs D1: submit gains the same field-parity flags `add`
        // already exposes (bin/fgos.mjs's `add` case) — same shapes, same
        // validation delegated to work.mjs's validateWorkShape, no rule
        // duplicated here.
        refs: parseListFlag(flags.refs),
        parent: optionalField(flags.parent, 'submit --parent requires a non-empty id; omit --parent entirely to leave unset.'),
        footprint: flags.footprint === undefined ? undefined : parseListFlag(flags.footprint),
        goalTier: optionalField(flags['goal-tier'], "submit --goal-tier requires a value ('mvp' or 'milestone'); omit --goal-tier entirely to leave unset."),
        targets: flags.targets === undefined ? undefined : parseListFlag(flags.targets),
        urgent: optionalField(flags.urgent, "submit --urgent requires a value ('low'/'medium'/'high'/'critical'); omit --urgent entirely to leave unset."),
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
      const work = listWork(dir).work[id];
      const stage = work?.stage;
      // tsk-4b2 D3/D6: domain-aware -- a domain that registers discovery/
      // exploring (today: coding) can call `discover` from any of its own
      // three stages; a domain that never registered them (triage/
      // synthetic) keeps the original single-stage precondition unchanged.
      const discoverDomain = getDomain(work?.domain, { onUnrecognized: () => {} });
      const validStages = discoverableStages(discoverDomain);
      if (!validStages.includes(stage)) {
        // tsk-1l9: only point at `plan` when `plan` would actually take the
        // item. Suggesting it unconditionally made the two gates refer the
        // reader to each other in a closed loop for any stage NEITHER verb
        // serves -- which is exactly what the three items stranded at retired
        // `clarify` hit, leaving them with no verb-shaped way out at all.
        const planStage = stageForStep(discoverDomain, 'Divide');
        const planTakesIt = stage === planStage
          || (stage === 'decompose' && discoverDomain.stages?.includes('decompose'));
        throw new StoreError(
          'validation',
          `discover: work "${id}" is at stage "${stage}", not ${validStages.map((s) => `"${s}"`).join('/')}`
            + (planTakesIt
              ? ` -- use "fgos plan ${id}" instead.`
              : ` -- and "fgos plan" does not serve that stage either. No stage verb does:`
                + ` "${stage}" is not registered by domain "${resolveDomainName(work?.domain, { onUnrecognized: () => {} })}"`
                + ` (${JSON.stringify(discoverDomain.stages)}). Run "fgos doctor" and read the`
                + ' work-stage-vocabulary check.'),
        );
      }
      // An explicit --config path stays a loud, unmodified failure on ENOENT
      // (loadRunnerConfig); only the default, unflagged path bootstraps a
      // missing config (D1/D3, ensureRunnerConfigForDir — tsk-5vf D1/D2).
      // `path.dirname(dir)`, not `process.cwd()` (tsk-5hv, found by
      // fgos-coding-implement): `dir` already reflects `--dir` when given
      // (every skill's own hard rule: resolve the main checkout and pass
      // it explicitly) or `process.cwd()` when omitted (dataDir()'s own
      // documented cwd-strict contract) -- reusing it here instead of a
      // bare `process.cwd()` is what keeps this call correct for a
      // worktree-resident session, since `.fgos/config.json` is
      // unconditionally wiped from every freshly-created worktree
      // (ADR0020) and a bare cwd would silently resolve to nothing there.
      const cfg = flags.config
        ? loadRunnerConfig(flags.config)
        : ensureRunnerConfigForDir(path.dirname(dir));
      const callerVerdict = parseDiscoverCallerVerdict(flags);
      // D12: refuse an out-of-vocabulary --tier/--kind/--risk BEFORE
      // resolveDiscovery writes anything — the same validation editWork
      // applies below, run early so a typo can never leave the item with its
      // stage advanced and its classification rejected.
      assertCallerClassification(work, callerVerdict);
      const result = resolveDiscovery(dir, id, cfg, 'session', callerVerdict);
      // The interactive half of D12's classification contract, applied
      // through the SAME guard the headless sweep uses (loop.mjs re-exports
      // it from discovery.mjs) rather than a second copy: only a resolved
      // `clear` outcome carrying a clear caller verdict ever produces a
      // patch, so an unclear verdict or a parked verify dispute applies
      // nothing. A call that passed no classification flags leaves the patch
      // empty, editWork is never called, and the returned payload keeps its
      // exact pre-existing shape.
      const classificationPatch = classificationPatchFromVerdict(result.outcome, callerVerdict);
      if (Object.keys(classificationPatch).length === 0) return result;
      editWork(dir, { id, patch: classificationPatch, role: 'session' });
      return { ...result, classification: classificationPatch };
    }

    // The sync branch's entry point into chia-việc/split-work judgment
    // (tsk-2b0 D1: hard split, no fallback — this verb only ever wraps
    // `resolvePlan` (renamed from `resolveDecompose`, tsk-403 D11 —
    // `judgeDecompose` is long retired, no subprocess judge left to wrap),
    // for an item at stage `planning` (or the legacy `decompose` alias,
    // D18). A live session runs the SAME engine the async runner sweep
    // calls (D3's sync/async parity: identical trace either way, only the
    // role differs). `resolvePlan` either passes the item through to
    // `executing`, splits it into children, or parks it in
    // `awaiting-human` (D3).
    case 'plan': {
      const id = requireField(positional[0] ?? flags.id, 'plan requires an id: fgos plan <id> [--config <path>]');
      const work = listWork(dir).work[id];
      const stage = work?.stage;
      const domain = getDomain(work?.domain, { onUnrecognized: () => {} });
      const planningStage = stageForStep(domain, 'Divide');
      // tsk-403 D18: `decompose` is coding's own drain-only legacy alias
      // for this same step -- still legal for an item that reached it
      // before the rename (kept legal in this domain's own `stages`/
      // `transitions`), even though `stageForStep` no longer resolves a
      // NEW item there. Only activates when a domain actually declares
      // both names distinctly (today: only `coding`) -- a domain that
      // never had this rename (e.g. the `decompose`-native fixture
      // domains) has `planningStage === 'decompose'` already, so this
      // stays a no-op for them.
      const legacyPlanStage = domain.stages?.includes('decompose') && planningStage !== 'decompose' ? 'decompose' : undefined;
      if (stage !== planningStage && stage !== legacyPlanStage) {
        // tsk-1l9: mirror of the discover gate above -- only refer the reader
        // to `discover` when `discover` would actually accept the item, so
        // the two gates can never form a closed loop around a stage neither
        // of them serves.
        const discoverTakesIt = discoverableStages(domain).includes(stage);
        throw new StoreError(
          'validation',
          `plan: work "${id}" is at stage "${stage}", not "${planningStage}"${legacyPlanStage ? ` (or legacy "${legacyPlanStage}")` : ''}`
            + (discoverTakesIt
              ? ` -- use "fgos discover ${id}" instead.`
              : ` -- and "fgos discover" does not serve that stage either. No stage verb does:`
                + ` "${stage}" is not registered by domain "${resolveDomainName(work?.domain, { onUnrecognized: () => {} })}"`
                + ` (${JSON.stringify(domain.stages)}). Run "fgos doctor" and read the`
                + ' work-stage-vocabulary check.'),
        );
      }
      // path.dirname(dir), not process.cwd() -- see the discover case above
      // for why (tsk-5hv, found by fgos-coding-implement).
      const cfg = flags.config
        ? loadRunnerConfig(flags.config)
        : ensureRunnerConfigForDir(path.dirname(dir));
      const callerVerdict = parsePlanCallerVerdict(flags);
      return resolvePlan(dir, id, cfg, 'session', callerVerdict);
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
      // tsk-2lc: transitionWork (status-fsm.mjs) requires a non-empty
      // `answer` for ANY exit from awaiting-human, regardless of `to` --
      // this verb never forwarded one, so the awaiting-human -> wontfix
      // edge (tsk-2ub) was unreachable through `move` even though the FSM
      // table already carries it: `fgos answer` is the only other door out
      // of awaiting-human, and it only ever resumes to todo/doing, never
      // wontfix. Optional here exactly like `reason` above -- ignored by
      // transitionWork for every edge that doesn't require it.
      const answer = optionalField(flags.answer, 'move --answer requires a non-empty value (omit --answer entirely when not resuming/closing an item out of awaiting-human)');
      // tsk-5dk: a hand-typed move to delivered writes no merge evidence
      // (mergedSha/mergedInto only ever come from approve's real merge
      // paths, src/state/store.mjs) — refuse when fgw/<id> is a live
      // branch not yet reachable from trunk, so this door can't silently
      // mark real, unmerged work "delivered". --override-reason keeps a
      // real escape hatch, but only when it actually carries a reason,
      // and only after that reason lands in the decision log first.
      if (to === 'delivered') {
        const repoRoot = process.cwd();
        const branch = branchNameFor(id);
        if (branchExists(repoRoot, branch)) {
          const trunk = detectTrunk(repoRoot);
          if (!isBranchReachableFromTrunk(repoRoot, branch, trunk)) {
            const overrideReason = optionalField(flags['override-reason'], 'move --to delivered --override-reason requires a non-empty reason value (omit --override-reason entirely when the branch is already reachable, or use "fgos approve" to merge for real)');
            if (!overrideReason) {
              throw new StoreError(
                'validation',
                `move: "${id}" has a live "${branch}" branch not yet reachable from "${trunk}" — moving it to "delivered" here would record no merge evidence (mergedSha/mergedInto). `
                  + `Use "fgos approve ${id}" to merge for real, or pass --override-reason "<why>" to force this move anyway (recorded to the decision log).`,
              );
            }
            addDecision(dir, {
              id,
              text: `move --to delivered override for "${id}": "${branch}" not reachable from "${trunk}"`,
              rationale: overrideReason,
              kind: 'engine',
            });
          }
        }
      }
      // tsk-280: `return` (bin/fgos.mjs's own `case 'return'`) is the one
      // door built to prove real progress before `doing -> awaiting-
      // approval` — branch-advanced (or an explicit `--no-new-commits-ok`,
      // tsk-4on), a clean working tree, and the item's own `verify`
      // command actually passing. `move` had zero precondition for this
      // exact edge, so it silently bypassed every one of those guarantees.
      // Mirrors the `--to delivered` guard immediately above: refuse by
      // default, require an explicit non-empty `--skip-return-guard`
      // reason (never `--override-reason` — that flag's own error message
      // is scoped specifically to the missing-merge-evidence case above,
      // a different guarantee than "no proof of real progress"), logged
      // to the decision log before proceeding.
      if (to === 'awaiting-approval') {
        const view = listWork(dir);
        const item = view.work[id];
        if (item?.status === 'doing') {
          const skipReason = optionalField(flags['skip-return-guard'], 'move --to awaiting-approval --skip-return-guard requires a non-empty reason value (omit --skip-return-guard entirely when the item is not "doing", or use "fgos return" to prove real progress for real)');
          if (!skipReason) {
            throw new StoreError(
              'validation',
              `move: "${id}" is "doing" — moving it to "awaiting-approval" here would record no proof of real progress (no branch-advance check, no clean-tree check, no verify run). `
                + `Use "fgos return ${id}" to prove it for real (pass --no-new-commits-ok if the work was already done before this claim), or pass --skip-return-guard "<why>" to force this move anyway (recorded to the decision log).`,
            );
          }
          addDecision(dir, {
            id,
            text: `move --to awaiting-approval skip-return-guard override for "${id}": status was "doing"`,
            rationale: skipReason,
            kind: 'engine',
          });
        }
      }
      const { event } = moveWork(dir, { id, to, expectedStatus, reason, answer, role: 'human' });
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    // work-item-status-delivered-retrospective-cleanup D9: the mechanical
    // half of retrospective — a batch sweep, run once per invocation,
    // moving every `delivered` item to `retrospective` (marking it picked
    // up for the batch synthesis pass). Never runs inline in
    // return/approve, per the same D9 decision. The actual synthesis
    // (settlement/decision/enduser-docs, formerly `fgos-coding-compounding`'s
    // stage-triggered job) is a session's own separate work while an item
    // sits at `retrospective`; this verb only performs the mechanical
    // claim-like transition, exactly once per swept item, never the
    // synthesis itself. Moving on to `cleanup` afterward is the plain
    // generic `fgos move <id> --to cleanup` — no dedicated verb needed,
    // since `cleanup`'s own harness (below) re-verifies real content
    // exists before it will ever reach `done`.
    case 'retrospective': {
      const view = listWork(dir);
      const repoRoot = path.dirname(dir);
      const swept = [];
      for (const item of Object.values(view.work)) {
        if (item.status !== 'delivered') continue;
        const { event } = moveWork(dir, { id: item.id, to: 'retrospective', expectedStatus: 'delivered', role: 'system' });
        const sweptEntry = { id: item.id, seq: event.seq };
        // tsk-1lv-5 D7/D9/D11: 4-door check runs INSIDE this existing batch
        // sweep, for every item regardless of risk tier -- advisory only,
        // never a reason to hold this item out of retrospective (this
        // verb's own transition above already succeeded; see
        // retrospective-doors.mjs's own header for why this stays
        // non-blocking). One friction event per non-empty door, so a
        // finding is queryable (`fgos check <id>`) without spamming one
        // event per individual finding.
        const doors = runFourDoorChecks(item, view, repoRoot);
        const doorFindings = {};
        for (const [doorName, findings] of Object.entries(doors)) {
          if (findings.length === 0) continue;
          doorFindings[doorName] = findings.length;
          addFriction(dir, {
            id: item.id,
            disposition: 'advisory',
            errorClass: `retrospective-door-${doorName}`,
            layer: 'docs',
            detail: findings.map((f) => f.message).join('\n'),
          });
        }
        if (Object.keys(doorFindings).length > 0) sweptEntry.doorFindings = doorFindings;
        swept.push(sweptEntry);
      }
      return { swept, count: swept.length };
    }

    // work-item-status-delivered-retrospective-cleanup D8, tsk-4jf
    // restore-to-decision: the dedicated harness gating `cleanup -> done`,
    // never folded into return/compound. Checks (cleanup-harness.mjs's
    // assessCleanupReadiness): the global TTL (D7) is a park PRECONDITION,
    // never itself a `blocked` reason — only the two real D8 gate checks
    // (retrospective produced real content; for a worktree-backed domain
    // (D5), the merge still resolves on main) can park `cleanup ->
    // blocked`. `failed` non-empty: parks `cleanup -> blocked` with every
    // failing D8 reason joined into one `reason` string (fsm.mjs requires
    // this edge to carry one, mirroring `awaiting-approval -> blocked`) —
    // TTL's own detail is included too when it's ALSO not-elapsed, so a
    // reader still sees the full picture. `failed` empty but
    // `notReadyYet` non-empty: a no-op — TTL alone is never a park
    // reason, so the item stays at `cleanup` with no `moveWork` call, no
    // new event. All ready: performs the actual branch/worktree cleanup
    // (cleanupMergedBranch, idempotent if a synchronous cleanup already
    // ran elsewhere) and closes to `done`.
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
      // tsk-59x D1: a leaf gets this shorter/zero TTL instead of ttlDays --
      // resolved per-item inside assessCleanupReadiness (resolveTtlDaysForItem).
      const leafTtlDays = sharedConfig?.cleanup?.leafTtlDays ?? DEFAULT_CLEANUP_LEAF_TTL_DAYS;

      const assessment = assessCleanupReadiness({
        view,
        rawEvents,
        id,
        repoRoot,
        worktreeBacked: domain.worktreeBacked ?? false,
        ttlDays,
        leafTtlDays,
      });

      if (assessment.failed.length > 0) {
        const reason = [...assessment.notReadyYet, ...assessment.failed].join('; ');
        const { event } = moveWork(dir, { id, to: 'blocked', expectedStatus: 'cleanup', reason, role: 'system' });
        releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
        return { id, to: 'blocked', reason, seq: event.seq };
      }

      if (assessment.notReadyYet.length > 0) {
        return { id, to: 'cleanup', noop: true, reasons: assessment.notReadyYet };
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
      releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
      return { id, to: 'done', seq: event.seq, cleanupWarnings };
    }

    // Restored (tsk-3o3, git-recovered from fcfbae5/tsk-1zi which removed
    // it along with the retired `compound-learn` stage): the producer
    // surface `fgos-coding-compounding` uses to store its Diataxis classification
    // on a `retrospective`-status item's outcome. Unlike the removed
    // version, this never moves stage — there is no `compound-learn` stage
    // left to move into (D11); the only precondition is the item actually
    // sitting at status `retrospective`, the status-based trigger that
    // superseded the retired stage move (tsk-1zi).
    //
    // `--doc-type <quadrant>` is pre-validated via store.mjs's exported
    // `assertValidDocType` (the single `DIATAXIS_DOC_TYPES` set, not
    // re-implemented here) BEFORE any write — a non-quadrant value is
    // rejected with zero events. Omitted entirely, `compound` writes
    // nothing and returns a `docType: null` no-op (there is no stage move
    // left for a bare call to perform).
    //
    // `--doc-path <path>` is an additive linkage field alongside
    // `--doc-type`: it records which real end-user doc the tagged capture
    // belongs to, so a later read-side index can back-link a doc to its
    // source capture with no loss of detail. Only meaningful alongside
    // `--doc-type` — same optional-shape idiom, only a bare/empty value is
    // refused.
    case 'compound': {
      const id = requireField(positional[0] ?? flags.id, 'compound requires an id: fgos compound <id>');
      const item = listWork(dir).work[id];
      if (!item) {
        throw new StoreError('validation', `compound: work "${id}" not found.`);
      }
      if (item.status !== 'retrospective') {
        throw new StoreError('validation', `compound: work "${id}" is "${item.status}", not "retrospective" — nothing to tag.`);
      }
      const docType = optionalField(flags['doc-type'], 'compound --doc-type requires a non-empty value: tutorial | how-to | reference | explanation.');
      if (docType !== undefined) {
        assertValidDocType({ docType });
      }
      const docPath = optionalField(flags['doc-path'], 'compound --doc-path requires a non-empty value.');
      if (docType === undefined) {
        return { id, docType: null, docPath: null, status: item.status };
      }
      // retrospective-doc-write-path D3: a tag is only ever recorded for a
      // document already COMMITTED at the main checkout's HEAD — never one
      // merely present on disk (untracked or staged-only). `dir` is always
      // `<repoRoot>/.fgos` (fgosDirFromRoot), so its parent recovers the
      // real root regardless of whether this session's cwd is a linked
      // worktree. `git cat-file -e HEAD:<path>` succeeds only when the path
      // resolves inside the HEAD commit's own tree — an untracked or
      // staged-only file has no entry there and correctly fails this,
      // unlike a plain `fs.existsSync` which cannot tell the two apart.
      // This is the invariant D3 makes impossible to violate rather than
      // detected later: the exact gap that let 34 documents go missing
      // while their tags still claimed they existed.
      if (docPath !== undefined) {
        const repoRoot = path.dirname(dir);
        try {
          execFileSync('git', ['cat-file', '-e', `HEAD:${docPath}`], { cwd: repoRoot, encoding: 'utf8', shell: false, stdio: ['ignore', 'ignore', 'pipe'] });
        } catch {
          throw new StoreError('validation', `compound: --doc-path "${docPath}" is not committed at the main checkout's HEAD ("${repoRoot}") — write and commit the document there before tagging it.`);
        }
      }
      const { event } = addOutcome(dir, { id, docType, ...(docPath !== undefined ? { docPath } : {}) });
      releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
      return { id, docType, docPath: docPath ?? null, status: item.status, seq: event.seq };
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
      for (const field of ['title', 'description', 'kind', 'risk', 'verify', 'tier', 'urgent', 'action']) {
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
      // --domain-fields (decision record 0027 D6): same latest-wins
      // whole-object-overwrite semantics as --acceptance/--refs above (never
      // a deep merge of nested keys — same convention refs/deps/acceptance
      // already use), JSON-encoded like --acceptance since a domain's own
      // field values are arbitrary, not comma-safe.
      if (flags['domain-fields'] !== undefined) {
        patch.domainFields = parseAcceptanceFlag(flags['domain-fields'], 'edit --domain-fields requires a JSON-encoded object ({ [domainName]: {...} }).');
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
      // --goal-tier (tsk-5fs D2): goalTier was excluded from EDITABLE_FIELDS
      // entirely -- an item created without it (e.g. via `submit`, which had
      // no --goal-tier flag either) could never become a goal later. Same
      // kebab-case/camelCase mismatch as --docs-ref above, so it needs its
      // own one-off block rather than joining the simple same-name loop.
      // work.mjs's validateWorkShape is the single source for the
      // GOAL_TIERS domain check -- editWork's own validateWork call already
      // re-validates the merged candidate, so no new guard is needed here.
      if (flags['goal-tier'] !== undefined) {
        patch.goalTier = optionalField(flags['goal-tier'], "edit --goal-tier requires a value ('mvp' or 'milestone').");
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
      // --superseded-by / --duplicates (tsk-2ie, docs/history/
      // tsk-2ie-duplicate-superseded-guard/ D1): same plumbing-only shape as
      // --merge-after/--parent above, no new checks here -- existence/
      // self-reference validation happens at the write door
      // (work.mjs's validateSupersededBy/validateDuplicates via validateWork).
      // --superseded-by is a scalar (mirrors --parent's clear-with-empty-
      // string semantics, D3's directed-singular shape); --duplicates is a
      // comma-separated list (mirrors --merge-after's array shape).
      if (flags['superseded-by'] !== undefined) {
        if (flags['superseded-by'] === true) {
          throw new StoreError('validation', '--superseded-by requires a value; use --superseded-by "" to clear it.');
        }
        patch.supersededBy = flags['superseded-by'] === '' ? null : flags['superseded-by'];
      }
      if (flags.duplicates !== undefined) {
        patch.duplicates = parseListFlag(flags.duplicates);
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
      // --verify-from-children / --verify-from-targets (tsk-580 D1-D3,
      // docs/history/tsk-580/CONTEXT.md): auto-generate the item's own
      // `verify` as a resolved-status check against its direct children
      // (decomposed root, `parent`-tree, same enumeration as
      // `collectRollupData` above) or its `targets` (goalTier
      // milestone/MVP) -- replaces hand-writing the jq command the two
      // close-out how-to docs used to require by hand, and both traps
      // those docs document (missing --dir, and a resolver that returns
      // the wrong root -- see below).
      if (flags['verify-from-children'] === true || flags['verify-from-targets'] === true) {
        if (flags['verify-from-children'] === true && flags['verify-from-targets'] === true) {
          throw new StoreError('validation', 'edit: --verify-from-children and --verify-from-targets are mutually exclusive -- pick one.');
        }
        const fromChildren = flags['verify-from-children'] === true;
        const view = listWork(dir);
        const item = view.work[id];
        if (!item) {
          throw new StoreError('validation', `edit: work "${id}" not found.`);
        }
        const ids = fromChildren
          ? Object.values(view.work).filter((w) => w.parent === id).map((w) => w.id)
          : (Array.isArray(item.targets) ? item.targets : []);
        if (ids.length === 0) {
          const flagName = fromChildren ? '--verify-from-children' : '--verify-from-targets';
          const emptyReason = fromChildren ? `no item has parent === "${id}"` : `"${id}" has no targets`;
          throw new StoreError(
            'validation',
            `edit ${flagName}: ${emptyReason} -- refusing to write a verify that would vacuously pass (jq's "all()" on an empty list is always true).`,
          );
        }
        // Main-checkout root, NOT resolveRepoRoot (src/runner/paths.mjs) --
        // that resolver shells `git rev-parse --show-toplevel`, which
        // returns the WORKTREE's own root when called from inside one,
        // never the main checkout where `.fgos/` actually lives (ADR0020).
        // Same git-common-dir + dirname pattern as
        // src/cli/invocation-fault-log.mjs / src/runner/merge.mjs /
        // src/setup/registrations.mjs already use for exactly this reason.
        let repoRoot;
        try {
          const gitCommonDir = execFileSync(
            'git',
            ['rev-parse', '--path-format=absolute', '--git-common-dir'],
            { cwd: process.cwd(), encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'ignore'] },
          ).trim();
          repoRoot = path.dirname(gitCommonDir);
        } catch (err) {
          throw new StoreError('validation', `edit --verify-from-${fromChildren ? 'children' : 'targets'}: could not resolve the repo root via git (${err.message}).`);
        }
        const idList = ids.map((childId) => JSON.stringify(childId)).join(',');
        // tsk-1ia: `all(["delivered",...] | index(.) != null)` is broken --
        // the `.` inside `index(.)` rebinds to the literal array itself
        // (the `|` right before it), never to the per-element status
        // `all()` is iterating, so this always evaluates true regardless of
        // the real statuses (confirmed: `echo '["todo","doing"]' | jq
        // 'all(["delivered","retrospective","cleanup","done"] | index(.)
        // != null)'` -> true). Binding the element to a named variable
        // first (`. as $s`) before piping into the literal array avoids
        // the rebind -- the same pattern tsk-2jc's own real, hand-authored
        // verify already used (`.data.work[id].status as $s | [...] |
        // index($s) != null`).
        patch.verify =
          `node ${repoRoot}/bin/fgos.mjs list --json --all --dir ${repoRoot} | ` +
          `jq -e '.data.work as $w | [${idList}] | map($w[.].status) | ` +
          `all(. as $s | ["delivered","retrospective","cleanup","done"] | index($s) != null)' > /dev/null`;
      }
      if (Object.keys(patch).length === 0) {
        throw new StoreError(
          'validation',
          'edit requires at least one field to change: --title/--description/--kind/--risk/--verify/--tier/--refs/--deps/--footprint/--acceptance/--priority/--intent/--docs-ref/--parent/--urgent/--impact/--effort/--merge-after/--superseded-by/--duplicates/--domain-fields/--verify-from-children/--verify-from-targets.',
        );
      }
      // tsk-34o: mirrors `take --role`'s own pattern (see the `case 'take'`
      // block below) -- optional, defaults to 'human' so every existing
      // caller is unaffected, lets a caller that knows it is not a human
      // (a session/sub-agent write) say so honestly instead of every write
      // through this verb being indistinguishable provenance.
      const role = optionalField(flags.role, 'edit --role requires "human" or "session" (omit --role entirely to default to human)') ?? 'human';
      if (role !== 'human' && role !== 'session') {
        throw new StoreError('validation', `edit --role must be "human" or "session" (got "${role}").`);
      }
      const { event } = editWork(dir, { id, patch, role });
      if (patch.priority !== undefined) {
        // tsk-sq9: mark this priority as human-set so plan.mjs's resolvePlan
        // refined pass (~line 639) knows to skip its own auto-recompute
        // instead of silently overwriting it.
        addDecision(dir, {
          id,
          text: `priority set to ${patch.priority} via edit --priority`,
          source: 'edit',
          kind: 'priority-override',
          rationale: "tsk-sq9: mark this as a human override so plan.mjs's refined pass does not silently overwrite it",
        });
      }
      return { id, fields: Object.keys(patch), seq: event.seq };
    }

    case 'resolve-park-reason': {
      const id = requireField(positional[0] ?? flags.id, 'resolve-park-reason requires an id: fgos resolve-park-reason <id> --note "..."');
      const note = requireField(flags.note, 'resolve-park-reason requires --note "..."');
      const role = optionalField(flags.role, 'resolve-park-reason --role requires "human" or "session" (omit --role entirely to default to human)') ?? 'human';
      const event = resolveParkReason(dir, { id, note, role });
      return { id, type: event.type, seq: event.seq };
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

    // Multi-role team harness (tsk-2t9c D1/D4/D5/D8/D9): a role/holder call
    // — guarded by the item's own domain roleGraph. Which event kind
    // actually gets written (a full `work.handoff`, holder changes; or a
    // compact `work.call-summary`, holder untouched) is decided by the
    // matched edge's own `mode`, never a caller flag — see recordCall's
    // own doc comment (store.mjs). A refused call throws StoreError with
    // both the refusal reason and the legal edges named in the message
    // (chặn và dạy tại chỗ).
    case 'handoff': {
      const id = requireField(positional[0] ?? flags.id, 'handoff requires an id: fgos handoff <id> --to <role> --reason <advise|assist|review|consult> [--note ...] [--outcome ...] [--open-sync-depth <n>]');
      const toRole = requireField(flags.to, 'handoff requires --to <role>');
      const reason = requireField(flags.reason, 'handoff requires --reason <advise|assist|review|consult>');
      const note = optionalField(flags.note, 'handoff --note requires a non-empty value (omit --note entirely to skip it)');
      const outcome = optionalField(flags.outcome, 'handoff --outcome requires a non-empty value (omit --outcome entirely to skip it)');
      // D28: only a caller already inside its own nested sync-consult work
      // knows this depth -- recordCall's own doc comment explains why it can
      // never be derived from replay. Omitted (every existing caller) means
      // 0, byte-identical to before this flag existed.
      const openSyncDepthRaw = optionalField(flags['open-sync-depth'], 'handoff --open-sync-depth requires a non-negative integer');
      if (openSyncDepthRaw !== undefined && (!/^\d+$/.test(openSyncDepthRaw))) {
        throw new StoreError('validation', `handoff --open-sync-depth must be a non-negative integer, got "${openSyncDepthRaw}".`);
      }
      const openSyncDepth = openSyncDepthRaw === undefined ? undefined : Number(openSyncDepthRaw);
      const { event } = recordCall(dir, { id, toRole, reason, note, outcome, ...(openSyncDepth === undefined ? {} : { openSyncDepth }) });
      return { id, type: event.type, seq: event.seq };
    }

    // Closes the most recently opened async call on the item's own
    // call-thread, sending the ball back to whoever opened it (D4: "call =
    // round-trip"). Deliberately not gated by roleGraph edge-legality —
    // see recordCallReturn's own doc comment for why a return needs no
    // fresh legality check.
    case 'handoff-return': {
      const id = requireField(positional[0] ?? flags.id, 'handoff-return requires an id: fgos handoff-return <id> [--note ...]');
      const note = optionalField(flags.note, 'handoff-return --note requires a non-empty value (omit --note entirely to skip it)');
      const { event } = recordCallReturn(dir, { id, note });
      return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
    }

    case 'decision': {
      const text = requireField(flags.text, 'decision requires --text "..."');
      const rationale = requireField(flags.rationale, 'decision requires --rationale "..."');
      const alternatives = optionalField(flags.alternatives, 'decision --alternatives requires a non-empty value (omit --alternatives entirely to skip it)');
      const source = optionalField(flags.source, 'decision --source requires a non-empty value (omit --source entirely to skip it)');
      const id = optionalField(flags.id, 'decision --id requires a non-empty value (omit --id entirely to skip per-item scoping)');
      // tsk-1lv-2 D4: a platform/repo-wide decision (no --id) carries
      // --scope <area-slug> (e.g. "repo" for the whole codebase, or an
      // area name matching docs/specs/<area>.md) so `fgos decision-index`
      // can project it into docs/decisions/index.md. Purely optional and
      // additive -- an item-scoped decision (--id set) has no use for it,
      // and omitting it entirely is unaffected (same posture as
      // --alternatives/--source above).
      const scope = optionalField(flags.scope, 'decision --scope requires a non-empty value (omit --scope entirely for an item-scoped or unscoped decision)');
      // tsk-5dn: this CLI verb never exposed `kind` before, so every write
      // through it defaulted to addDecision's own `'design'` default --
      // including a session's own audit line for an auto-approved gate
      // (fgos-coding-validating's Step 2), which the retrospective gate
      // (checkRetrospectiveContent, src/state/cleanup-harness.mjs) then read
      // as a human reflecting on the work. Same posture as --source/--scope
      // above (optional free text, no enum -- store.mjs's own doc comment
      // on addDecision already established this for the field itself; only
      // the CLI-surface plumbing was missing). Internal engine bookkeeping
      // (`resolveDiscovery`/`resolvePlan`, `move`'s two override branches,
      // the Iron Law warn-skip record, `sync-root`/`promote-to-component`)
      // still calls `addDecision` directly with a hardcoded `kind: 'engine'`
      // and is unaffected by this flag.
      const kind = optionalField(flags.kind, 'decision --kind requires a non-empty value (omit --kind entirely to default to "design")');
      // tsk-1lv-1 D2/D8: every CLI-surface decision write declares its
      // relation to prior decisions explicitly -- no default, no
      // inference (STR72's own root cause: a supersession narrated only
      // in prose that the machine never sees). Engine bookkeeping
      // (`kind:'engine'`, resolveDiscovery/resolvePlan) writes through
      // `addDecision` directly, not this CLI case, so it is unaffected
      // (CONTEXT.md D4: "không đổi").
      const relationRaw = requireField(flags.relation, 'decision requires --relation none|supersedes:<id>|touches:<id>');
      const relation = parseDecisionRelation(relationRaw);
      if (relation.kind !== 'supersedes' && decisionTextLooksLikeSupersession(text)) {
        throw new StoreError(
          'validation',
          'decision text reads like a supersession ("supersedes/replaces/overrides/no longer applies/instead of the previous") but --relation supersedes:<id> was not declared -- declare the relation explicitly (or rephrase the text if it is not actually a supersession).',
        );
      }
      const { event } = addDecision(dir, { text, rationale, alternatives, source, id, scope, kind, relation: relation.kind === 'none' ? 'none' : `${relation.kind}:${relation.id}` });
      const result = { seq: event.seq, relation: relation.kind === 'none' ? 'none' : `${relation.kind}:${relation.id}` };
      // Write-time citation sweep (D2 "sweep tươi tại write-time, không
      // cache"): only `supersedes` has a real dangling-citation shape (a
      // line citing the OLD id without acknowledging the new one) -- a
      // `touches:<id>` write references `id` without replacing anything,
      // so there is nothing for this sweep to flag as stale (round 3's
      // "chạy CÙNG sweep này ở thời điểm log thường" is about the same
      // machinery being exercised at every write, not a claim that
      // `touches` produces findings). Non-blocking either way -- a
      // dangling hit is surfaced, not refused; task 5's 4-door
      // (retrospective-time) is the close-time gate, this is only the
      // write-time signal (D7: "fgos approve KHÔNG bị gate ở đây").
      if (relation.kind === 'supersedes') {
        const repoRoot = path.dirname(dir);
        const sourceFiles = collectWideSourceFiles(repoRoot);
        // tsk-1lv (review-fix round, F3): a platform/--scope decision (no
        // --id) has no item id to use as the "acknowledges the new
        // decision" label -- falling back to `relation.id` here (the OLD
        // id being superseded) made supersedingLabel === targetId, which
        // made findWideCitationFindings's own
        // `line.includes(supersedingLabel)` suppression guard match every
        // single citation of the old id (the line already had to contain
        // targetId to be a candidate at all), silently zeroing every
        // finding for every one of tsk-1lv-4's 34 --scope writes with zero
        // test coverage of this path. `null` here means "no acknowledgment
        // label available" -- every citation of the old id is surfaced,
        // never auto-suppressed, which is the correct behavior when there
        // is nothing a citing line could plausibly reference to prove it
        // already accounts for the supersession.
        const supersedingLabel = id ?? null;
        let homeFile;
        if (isDLocalId(relation.id)) {
          const item = id ? listWork(dir).work[id] : null;
          const docsRefRaw = typeof item?.docsRef === 'string' && item.docsRef.trim() ? item.docsRef.trim() : (id ? `docs/history/${id}` : null);
          if (docsRefRaw) {
            homeFile = path.posix.join(docsRefRaw.replace(/\/+$/, ''), 'CONTEXT.md');
          }
        }
        const findings = findWideCitationFindings(sourceFiles, relation.id, supersedingLabel, homeFile);
        if (findings.length) {
          result.danglingCitations = findings.map((f) => f.message);
        }
      }
      return result;
    }

    // tsk-1lv-2 D4: docs/decisions/index.md is a projection of
    // state.decisions' scope-carrying records -- generated, never
    // hand-edited (bee's own standing exemption for this exact path,
    // mirrors `fgos docs-index`'s own generate+drift shape for
    // docs/enduser-docs-index.json). `--check` never writes: it reports
    // whether the on-disk file matches what a fresh regenerate would
    // produce, refusing (validation) when it does not -- the drift-mode
    // half of the verify draft this task's own DISCUSSION.md names.
    case 'decision-index': {
      const repoRoot = path.dirname(dir);
      if (flags.check) {
        const { indexPath, changed } = computeDecisionIndex(repoRoot, dir);
        if (changed) {
          throw new StoreError(
            'validation',
            `${path.relative(repoRoot, indexPath)} is stale (regenerating would change its content) -- run "fgos decision-index" (no --check) to refresh it.`,
          );
        }
        return { path: path.relative(repoRoot, indexPath).split(path.sep).join('/'), changed: false };
      }
      const { path: indexRelPath, changed } = generateDecisionIndex(repoRoot, dir);
      return { path: indexRelPath, changed };
    }

    // tsk-1lv-3 D3: CONTEXT.md's "## Locked decisions" table becomes a
    // RENDER from state.decisions, closing the gap tsk-1ud left (bee-
    // context-locking's own stance: "it renders; it does not decide").
    // `fgos decision --id <item-id>` (tsk-63c) is already the real write
    // door; this verb only replaces the existing table's text with a fresh
    // render, in place -- it never creates CONTEXT.md itself (the
    // exploring/planning/shaping skill still writes the skeleton: feature
    // boundary, pinned terms, outstanding questions), and never touches
    // any other section.
    case 'context-render': {
      const id = requireField(positional[0] ?? flags.id, 'context-render requires an id: fgos context-render <id>');
      const view = listWork(dir);
      const item = view.work[id];
      if (!item) {
        throw new StoreError('validation', `work "${id}" not found.`);
      }
      // tsk-1lv review-fix F5: was `path.dirname(dir)` (the state root,
      // always the main checkout per ADR0020) -- but fgos-coding-exploring/
      // -planning/-shaping commit CONTEXT.md to the item's OWN fgw/<id>
      // branch/worktree, which never carries `.fgos/` (ADR0020), so a
      // caller inside that worktree passing `--dir <mainRoot>` had this
      // verb look for CONTEXT.md in the wrong tree entirely (misleading
      // "create the CONTEXT.md skeleton first" on an item that already has
      // one, or worse, silently writing a stale copy in the main checkout
      // that never reaches the branch). `resolveContentRoot` (tsk-1ni D1,
      // `src/intake/plan.mjs`) is the existing, tested helper for exactly
      // this problem -- reuse it instead of reimplementing a narrower,
      // wrong version of the same resolution.
      const docsRefRaw = typeof item.docsRef === 'string' && item.docsRef.trim() ? item.docsRef.trim() : `docs/history/${id}`;
      const repoRoot = resolveContentRoot(path.dirname(dir), id, docsRefRaw);
      const contextRelPath = path.posix.join(docsRefRaw.replace(/\/+$/, ''), 'CONTEXT.md');
      const contextPath = path.join(repoRoot, contextRelPath);
      if (!fs.existsSync(contextPath)) {
        throw new StoreError(
          'validation',
          `${contextRelPath} does not exist -- create the CONTEXT.md skeleton first (fgos-coding-exploring/-planning/-shaping own that; this verb only replaces its existing "## Locked decisions" table).`,
        );
      }
      const decisions = (view.decisions ?? []).filter((d) => d.id === id);
      const table = renderLockedDecisionsTable(decisions);
      const before = fs.readFileSync(contextPath, 'utf8');
      // tsk-1lv review-fix F6 (fixed again after round-2 review found a
      // real regression, B2): a render with zero rows (no state.decisions
      // logged yet for this id) always used to overwrite whatever the
      // section already held -- including a hand-typed table from a
      // pre-tsk-1lv-3 item that never ran `fgos decision --id`. Refuse
      // instead of silently blanking real rows a person can only recover
      // from git: an empty render is never a legitimate downgrade of an
      // existing table with content.
      //
      // The first attempt at this guard used `.split('\n').slice(2)` to
      // skip past the table header + separator row, assuming they always
      // sit right after the heading -- but the actual leading content is
      // 1-2 blank lines (heading, then a blank line, then the table),
      // so `slice(2)` dropped the blank lines instead and left the
      // header row (`| D-ID | Quyết định |`) itself counted as "a row",
      // making a fresh render of THIS VERB'S OWN empty-table output
      // (header + separator, no data) refuse on its own second run --
      // non-idempotent, contradicting fgos-coding-exploring/SKILL.md's own
      // documented "idempotent, a no-op re-run reports changed: false".
      // Reproduced directly, not assumed. Fixed by anchoring on the real
      // separator row (`|---|...`) and counting only lines after it --
      // that is the one structural marker a markdown table always has,
      // regardless of how many blank lines precede it.
      const existingSection = /##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i.exec(before);
      let existingHasRows = false;
      if (existingSection) {
        const sectionLines = existingSection[1].split('\n');
        const sepIdx = sectionLines.findIndex((l) => /^\s*\|[-:\s|]+\|\s*$/.test(l));
        if (sepIdx !== -1) {
          existingHasRows = sectionLines.slice(sepIdx + 1).some((l) => /^\s*\|.+\|.*\|\s*$/.test(l));
        }
      }
      if (decisions.filter((d) => d.kind !== 'engine').length === 0 && existingHasRows) {
        throw new StoreError(
          'validation',
          `${contextRelPath}: refusing to render an empty table over an existing "## Locked decisions" section that already has rows -- no state.decisions record exists yet for "${id}" (run "fgos decision --id ${id} ..." for each row first, or this table was hand-typed before tsk-1lv-3 and needs manual reconciliation).`,
        );
      }
      let after;
      try {
        after = replaceLockedDecisionsSection(before, table);
      } catch (err) {
        throw new StoreError('validation', `${contextRelPath}: ${err.message}`);
      }
      const changed = before !== after;
      if (changed) {
        fs.writeFileSync(contextPath, after, 'utf8');
      }
      return {
        path: contextRelPath,
        changed,
        rowCount: decisions.filter((d) => d.kind !== 'engine').length,
      };
    }

    case 'gate-approve': {
      const id = requireField(positional[0] ?? flags.id, 'gate-approve requires an id: fgos gate-approve <id> --gate <name> --actor <human|bypass> --verify "..."');
      const gate = requireField(flags.gate, 'gate-approve requires --gate <contextApprove|validateApprove>');
      // "planApprove" retired (coding-planning-validating-gate-redesign
      // D9-D11): fgos-coding-planning no longer owns a gate, so no live
      // skill writes this value. recordGateApprove/GATE_APPROVE_GATES
      // (src/state/store.mjs) deliberately still ACCEPT it at the storage
      // layer -- test/intake/plan.test.mjs uses recordGateApprove as a
      // fixture helper to simulate pre-redesign items that already carry
      // a historical planApprove record, and replay.mjs's own fold is
      // unconditionally generic (no gate-name check at all), so neither
      // needs or wants this restriction. This CLI verb is the actual
      // user-facing surface a confused live session would hit, so the
      // refusal belongs here, not in the storage layer (tsk-4vz).
      if (gate === 'planApprove') {
        throw new StoreError(
          'validation',
          'gate-approve: "planApprove" is retired (coding-planning-validating-gate-redesign D9-D11) -- fgos-coding-planning no longer owns a gate. Use "validateApprove" for the single merged gate (fgos-coding-validating), or "contextApprove" for fgos-coding-exploring\'s gate. Records already carrying a historical "planApprove" value still replay correctly; this only blocks creating a NEW one.',
        );
      }
      const actor = requireField(flags.actor, 'gate-approve requires --actor <human|bypass>');
      const verify = requireField(flags.verify, 'gate-approve requires --verify "..."');
      const { event } = recordGateApprove(dir, { id, gate, actor, verify });
      return { id, gate, actor, seq: event.seq };
    }

    case 'list': {
      // External consumer note (decision record 0027's audit §5, tsk-38t-4):
      // `herdr-plugin/src/fgos.rs` (a separate Rust crate outside this Node
      // project's own build/test surface — its own Cargo.toml, not an npm
      // workspace member) parses THIS verb's `--all --json` stdout and
      // filters on literal `item.status == "doing" || item.status ==
      // "awaiting-approval"` to build its "in-process" pane. It reads
      // `status` directly, not `statusCategory` — today harmless (`coding`
      // is the only domain that ever writes those two literal strings), but
      // a future domain that relabels its own doing/awaiting-approval-
      // equivalent statuses would silently break this Rust consumer unless
      // it is updated separately (it cannot be fixed from this file; a JSON
      // shape change here is a public contract this external process reads).
      // Left untouched by tsk-38t-4 on purpose — Rust code outside this
      // repo's own Node test/build surface is out of that item's scope.
      const rawView = listWork(dir);
      // tsk-483: generalizes tsk-2u9's own single-id `scopedById` (below,
      // inside the `--id` branch, left untouched -- already correct) to a
      // SET of ids, for the default/paginated multi-item paths further
      // down. Same shapes tsk-2u9 already proved safe: id-keyed dicts
      // filtered to `{[id]: v[id]}` per matching id; the flat `decisions`
      // array filtered by `d.id` membership; `tools`/`work`/
      // `awaitingContext` untouched (not id-keyed, or already correctly
      // scoped by the caller before this runs).
      const scopedByIds = (section, idSet) =>
        section ? Object.fromEntries(Object.entries(section).filter(([id]) => idSet.has(id))) : {};
      const scopeSideLogsTo = (view, idSet) => ({
        ...view,
        decisions: (view.decisions ?? []).filter((d) => idSet.has(d.id)),
        discovery: scopedByIds(view.discovery, idSet),
        gates: scopedByIds(view.gates, idSet),
        settlements: scopedByIds(view.settlements, idSet),
        outcomes: scopedByIds(view.outcomes, idSet),
        frictions: scopedByIds(view.frictions, idSet),
        learnings: scopedByIds(view.learnings, idSet),
        decisionsById: scopedByIds(view.decisionsById, idSet),
      });
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
        if (flags.fields !== undefined) {
          const ALLOWED_ID_FIELDS = new Set([
            'stage', 'status', 'holder', 'title', 'docsRef',
            'verify', 'parent', 'id', 'domain', 'kind', 'risk', 'tier',
          ]);
          const fieldList = parseListFlag(flags.fields);
          if (fieldList.length === 0) {
            throw new StoreError('validation', 'list --fields requires a non-empty comma-separated list of field names.');
          }
          for (const f of fieldList) {
            if (!ALLOWED_ID_FIELDS.has(f)) {
              throw new StoreError('validation', `list --fields: unknown field "${f}". Allowed fields: ${Array.from(ALLOWED_ID_FIELDS).join(', ')}.`);
            }
          }
          const fullItem = withStageEffective(item);
          const filteredItem = {};
          for (const f of fieldList) {
            if (fullItem[f] !== undefined) {
              filteredItem[f] = fullItem[f];
            }
          }
          const {
            decisions, discovery, gates, settlements, outcomes,
            frictions, learnings, decisionsById, callThreads,
            ...restView
          } = rawView;
          const singleView = {
            ...restView,
            work: { [id]: filteredItem },
          };
          if (item.status === 'awaiting-human') {
            const ctx = computeAwaitingContext(singleView, id);
            if (ctx) return { ...singleView, awaitingContext: { [id]: ctx } };
          }
          return singleView;
        }
        // tsk-2u9 D1/D2: scope every OTHER id-keyed view section to this
        // item too, not just `work` -- `rawView` otherwise leaks the
        // entire backlog's decisions/discovery/gates/settlements/outcomes/
        // frictions/learnings/decisionsById through a single-item request
        // (confirmed live: 2.2MB for one item). `decisions` is a flat
        // append-only array (some entries carry no `id` at all -- a
        // global decision, correctly excluded here) rather than a dict,
        // so it gets its own filter instead of the `{[id]: v[id]}` shape
        // the rest share. `tools` is deliberately left untouched -- it is
        // keyed by tool NAME (e.g. "gitnexus"), never by work item id.
        const scopedById = (section) => (section?.[id] !== undefined ? { [id]: section[id] } : {});
        const singleView = {
          ...rawView,
          work: { [id]: withStageEffective(item) },
          decisions: (rawView.decisions ?? []).filter((d) => d.id === id),
          discovery: scopedById(rawView.discovery),
          gates: scopedById(rawView.gates),
          settlements: scopedById(rawView.settlements),
          outcomes: scopedById(rawView.outcomes),
          frictions: scopedById(rawView.frictions),
          learnings: scopedById(rawView.learnings),
          decisionsById: scopedById(rawView.decisionsById),
          callThreads: scopedById(rawView.callThreads),
        };
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
      // tsk-4zj D3: stageEffective is applied to every item in `view.work`
      // up front, both branches -- additive-only, so it never disturbs
      // herdr-plugin's `--all` byte-identical contract (tsk-4fg D1 below);
      // the childProgress spread further down preserves it automatically.
      const filteredWork = showAll
        ? rawView.work
        : Object.fromEntries(Object.entries(rawView.work).filter(([, item]) => !isResolvedStatus(item)));
      const view = {
        ...rawView,
        work: Object.fromEntries(Object.entries(filteredWork).map(([id, item]) => [id, withStageEffective(item)])),
      };
      // Child-view gate (tsk-4fg D1/D2): DEFAULT view only -- `--all`
      // stays byte-identical/raw (D1), preserving herdr-plugin's own
      // `list --all --json` contract (bin/fgos.mjs comment above, `case
      // 'list'`). A row is dropped from the default view only when its
      // `parent` is itself present in this SAME filtered set -- a child
      // whose parent already got filtered out (resolved/hidden) falls
      // back to a normal top-level row instead of vanishing with no
      // parent left to carry its progress (D2; proven live against
      // tsk-19y's still-open children). An `awaiting-human` child is
      // never dropped either, regardless of parent visibility, so a
      // parked question can never be silently hidden by this filter --
      // the parent-anchored `awaitingContext` loop just below this block
      // depends on `view.work` still carrying every `awaiting-human` row.
      // Every dropped child's parent gets a `childProgress` badge instead,
      // reusing `childrenOf`/the same `doneCount` rule `collectRollupData`
      // already uses -- computed from ALL of that parent's children in
      // `rawView`, not just the ones still visible after filtering, so a
      // parent with e.g. 3 already-`done` (hidden) children and 3 still-
      // open ones reports an honest `3/6`, not `0/3`.
      if (!showAll) {
        const isHideableChild = (item) =>
          item.parent !== undefined && item.parent !== null && item.parent in view.work && item.status !== 'awaiting-human';
        view.work = Object.fromEntries(
          Object.entries(view.work)
            .filter(([, item]) => !isHideableChild(item))
            .map(([id, item]) => {
              const children = childrenOf(rawView, id);
              if (children.length === 0) return [id, item];
              const done = children.filter((w) => w.status === 'done').length;
              return [id, { ...item, childProgress: { done, total: children.length } }];
            }),
        );
      }
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
      // Pagination (D5/D35, reopened by tsk-483 -- see docs/history/
      // tsk-483-list-side-log-pagination-scoping/CONTEXT.md D1): `work`
      // still drives the actual page slice, but every other view key
      // (decisions/gates/settlements/etc.) now scopes to the SAME ids
      // being returned, everywhere except the one protected combination
      // below. `view.work` is a map keyed by id, so it is wrapped into
      // `{id, item}` pairs before going through the same generic
      // `paginate()` every array-returning verb uses, then unwrapped back
      // into a plain id->item map for the page itself.
      const { cursor, limit } = readPaginationFlags(flags, 'list');
      if (cursor === undefined && limit === undefined) {
        // tsk-483 D2: the ONE combination that must stay byte-identical --
        // `herdr-plugin/src/fgos.rs` (confirmed directly, not by comment:
        // exactly 3 call sites, every one `["list", "--all", "--json"]`
        // verbatim, never combined with pagination flags, never reading
        // any of the scoped-away fields) parses exactly this shape.
        if (showAll) return base;
        return scopeSideLogsTo(base, new Set(Object.keys(base.work)));
      }
      const entries = Object.entries(view.work).map(([id, item]) => ({ id, item }));
      const { items: pagedEntries, nextCursor } = paginate(entries, { cursor, limit, order: 'list-work-v1' });
      const workPage = Object.fromEntries(pagedEntries.map(({ id, item }) => [id, item]));
      const scoped = scopeSideLogsTo(base, new Set(pagedEntries.map(({ id }) => id)));
      return { ...scoped, work: { items: workPage, nextCursor } };
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
        work: withStageEffective(item),
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
    // `--step` (tsk-4so, docs/history/execution-fanout/CONTEXT-tsk-4so.md):
    // which domain step's frontier to read (`Clarify`/`Divide`/`Execute`);
    // omitted, readyWork's own default (`Execute`) applies, byte-identical
    // to every pre-existing caller.
    case 'ready': {
      return paginateVerbResult(readyWork(dir, flags.step ? { step: flags.step } : undefined).map(withStageEffective), flags, 'ready-v1', 'ready');
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
    // D1-D5) — no CLI setter, mirroring .fgos/config.json's own
    // edit-the-file-by-hand pattern.
    case 'gate-bypass': {
      return { level: readGateBypassLevel(dir) };
    }

    // tsk-65q: read-only wrapper around canAutoApprove/canAutoApproveMergedGate
    // (src/state/gate-bypass.mjs) so the two skill-embedded Gate-section
    // checks (fgos-coding-exploring/fgos-coding-validating) can resolve this
    // computation through the CLI's own static imports -- which already
    // resolve correctly under any install shape (global, dev-checkout, npx)
    // because Node resolves them against bin/fgos.mjs's own file location,
    // never the caller's cwd or repo root. The ad hoc cwd-relative resolver
    // those two skill files used to embed inline had no such guarantee, and
    // crashed unconditionally on a pure global npm install of fgOS onto a
    // different project (docs/history/tsk-65q-gate-bypass-global-install-
    // resolution/RESEARCH.md).
    case 'gate-check': {
      const id = requireField(positional[0] ?? flags.id, 'gate-check requires an id: fgos gate-check <id> --gate <contextApprove|validateApprove> ...');
      const gate = requireField(flags.gate, 'gate-check requires --gate <contextApprove|validateApprove>');
      const item = listWork(dir).work[id];
      if (!item) {
        throw new StoreError('validation', `gate-check: no work item "${id}"`);
      }
      const level = readGateBypassLevel(dir);
      if (gate === 'contextApprove') {
        const artifactPath = requireField(flags.artifact, 'gate-check --gate contextApprove requires --artifact <path>');
        const artifactText = fs.readFileSync(artifactPath, 'utf8');
        return { canAutoApprove: canAutoApprove(item, artifactText, level) };
      }
      if (gate === 'validateApprove') {
        const planPath = requireField(flags.plan, 'gate-check --gate validateApprove requires --plan <path>');
        const planText = fs.readFileSync(planPath, 'utf8');
        const childSpecs = flags.children !== undefined ? JSON.parse(flags.children) : [];
        const cost = requireField(flags.cost, 'gate-check --gate validateApprove requires --cost <REVERSIBLE|EXPENSIVE>');
        return { canAutoApprove: canAutoApproveMergedGate(item, planText, childSpecs, cost, level) };
      }
      throw new StoreError('validation', `gate-check: --gate must be "contextApprove" or "validateApprove", got "${gate}"`);
    }

    case 'stale': {
      // tsk-1bl (CONTEXT.md D4/D7): `postDelivery` is additive alongside the
      // existing `stale`/`thresholds` fields `staleDoingAdvisory` already
      // returns — same one-verb surface, no new CLI command, per this
      // item's own scope note. ttlDays resolution mirrors `case 'cleanup'`
      // above exactly (shared-config value, never guessed).
      const doing = staleDoingAdvisory(dir);
      const repoRoot = process.cwd();
      const sharedConfig = readSharedConfig(repoRoot);
      const ttlDays = sharedConfig?.cleanup?.ttlDays ?? DEFAULT_CLEANUP_TTL_DAYS;
      const postDelivery = stalePostDeliveryAdvisory(dir, { ttlDays });
      return { ...doing, postDelivery };
    }

    // Request-class per D1 (same contract as `ready`/`graph`/`stale`): a pure
    // read. work-graph-intelligence S9: the footprint-intersection advisory —
    // pairs of ready items whose declared file footprints overlap, so a
    // parallel dispatch would risk a file conflict. Suggests sequence/hoist/
    // re-slice; never mutates anything.
    // Read-only worker-slot ledger: how many work items are running and
    // whether the execution lane has room. This verb IS the port — decision
    // 0014 makes the CLI the door, and herdr-plugin (Rust) and fgos-fanout
    // (a prose skill) have no other way to ask the engine before they stand a
    // worker up. Pure read: worker-slots.mjs never touches fs, and the
    // ceiling comes from the same config resolution claimWork's own gate uses.
    case 'slots': {
      const slotsView = listWork(dir);
      const ceiling = readSharedConfigOrEmpty(path.dirname(dir))?.workerSlots?.ceiling;
      const counts = countWorkerSlots(slotsView);
      const room = hasWorkerSlotRoom(slotsView, { ceiling });
      return {
        execution: {
          ...counts.execution,
          ceiling: room.ceiling,
          free: room.free,
          hasRoom: room.allowed,
          reason: room.reason,
        },
        admin: counts.admin,
      };
    }

    // D10: give a driver's closing report a landing place on the item, so a
    // result is read with `fgos show <id>` instead of by watching a terminal
    // pane nobody can afford to guard. Deliberately no new event type and no
    // new field -- this writes through addDecision, which `show` already
    // surfaces per item, and `source: 'driver-report'` is what tells a
    // consumer these apart from real design decisions.
    case 'report': {
      const id = requireField(positional[0] ?? flags.id, 'report requires an id: fgos report <id> --text "..."');
      const text = requireField(flags.text, 'report requires --text "..."');
      const stopReason = optionalField(flags['stop-reason'], 'report --stop-reason requires a non-empty value (omit --stop-reason entirely to skip it)');
      // addDecision requires a non-empty rationale, so a report that carries
      // no stop reason still has to say why it exists rather than pass "".
      const rationale = stopReason
        ? `driver stop reason: ${stopReason}`
        : 'closing report recorded on the item so results are read via `fgos show`, not a guarded terminal pane';
      const { event } = addDecision(dir, { id, text, rationale, source: 'driver-report', kind: 'engine' });
      return { id, stopReason: stopReason ?? null, seq: event.seq };
    }

    case 'conflicts': {
      // tsk-4zj D7: footprintConflicts' candidate set now spans multiple
      // stages (tsk-4so's frontierAcrossSteps), so stageEffective is real
      // information here, not a constant -- wrapped in a side-map (same
      // pattern as graph's/merge's stageByItem) rather than adding fields
      // to each {a,b,shared,suggestions} pair, which would break the same
      // exact-shape tests either way.
      const conflicts = footprintConflicts(dir);
      const conflictsView = listWork(dir);
      const ids = new Set();
      for (const { a, b } of conflicts) {
        ids.add(a);
        ids.add(b);
      }
      const stageByItem = Object.fromEntries(
        [...ids].map((id) => [id, effectiveStage(conflictsView.work[id], getDomain(conflictsView.work[id].domain))]),
      );
      return { conflicts, stageByItem };
    }

    // tsk-1wdf: the machine-readable read surface D6 (tsk-5z0) left as
    // follow-on work -- `recordInvocationFault` writes .fgos/invocation-
    // faults.jsonl, this reads it back. `resolveFaultLogPath` already
    // falls back to the main checkout's own store when `dir` doesn't exist
    // (D5 -- the exact worktree-safety fallback this verb needs too), so
    // this is deliberately absent from STORE_MISSING_WARNING_VERBS below:
    // unlike `list`/`stale`, a worktree session with no --dir still reads
    // the real log correctly here, so warning about "may be empty" would
    // be actively misleading (same reasoning as docs-index's exclusion).
    case 'faults': {
      // Validated before the (possibly early, no-log) return below, so a
      // malformed --limit is refused the same way regardless of whether
      // any fault has ever been recorded yet.
      const rawLimit = optionalField(flags.limit, 'faults --limit requires a positive integer value');
      let limit;
      if (rawLimit !== undefined) {
        limit = Number(rawLimit);
        if (!Number.isInteger(limit) || limit <= 0) {
          throw new StoreError('validation', 'faults --limit requires a positive integer value');
        }
      }
      const logPath = resolveFaultLogPath(dir, process.cwd());
      if (!logPath || !fs.existsSync(logPath)) {
        return { path: logPath, count: 0, records: [] };
      }
      const records = fs
        .readFileSync(logPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const mostRecent = limit === undefined ? records : records.slice(-limit);
      return { path: logPath, count: records.length, records: mostRecent };
    }

    // Read-only, report-only (tsk-597z): re-runs checkMergeStillResolves
    // LIVE against every current status:blocked item -- the same live
    // re-check `catchup`'s own eligibility gate already trusts over the
    // stored `reason` text (see the comment on that gate above) -- and
    // reports which ones would now pass their own park-causing ancestry
    // check. Never transitions anything; a person (or `fgos catchup <id>`)
    // still does the acting.
    case 'recheck-blocked': {
      const recheckView = listWork(dir);
      const repoRoot = path.dirname(dir);
      return blockedItemsNowResolvable({ view: recheckView, repoRoot });
    }

    // Read-only (tsk-3c7): which frontier items can dispatch in parallel
    // right now, packed into waves by declared-footprint conflict, plus a
    // dep-graph cycle check over the whole work map. Wraps `computedSchedule`
    // (src/state/store.mjs) — never reimplements the layering/cycle logic
    // here.
    case 'schedule': {
      // Optional --candidates <id1,id2,...> flag scopes schedule to specified items
      const candidateIds = flags.candidates ? String(flags.candidates).split(',').map((s) => s.trim()).filter(Boolean) : undefined;
      return computedSchedule(dir, candidateIds);
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
      if (sub === 'list') {
        return mergeList({ dir, cwd: process.cwd() });
      }
      if (sub === 'next') {
        // Same `--trust-dir` resolution `approve`/`sync-root` apply to
        // themselves — `merge next` used to reach them by re-dispatching
        // through runVerb with the raw flags, which re-derived exactly
        // this value on the way in.
        const mergeRepoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();
        // Both option blocks are built here, once, and forwarded whole:
        // that is the whole point of parseMergeClusterOptions (tsk-49i
        // D3). Building them only on this branch keeps `merge list` free
        // of the timeout/wait parsing it never did before.
        return await mergeNext(
          { dir, cwd: process.cwd(), repoRoot: mergeRepoRoot },
          {
            acknowledgeIronLaw: flags['acknowledge-iron-law'] === true,
            approveOptions: parseMergeClusterOptions('approve', flags, dir),
            syncRootOptions: parseMergeClusterOptions('sync-root', flags, dir),
          },
        );
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
    // quadrant dir is skipped cleanly, never a crash. All I/O (readdir,
    // first-H1 extraction, folding the event log, writing the manifest)
    // lives in enduser-index-generate.mjs's `generateEnduserDocsIndex`
    // (tsk-1m0: extracted from this case so the enduser-docs-index-stale
    // doctor check/fix can share the identical generation path, never a
    // duplicate); `buildEnduserIndex` itself stays a PURE transform (zero
    // imports, mirrors entropy.mjs) that only assembles the manifest rows
    // and resolves each doc's `sourceCaptureId` by matching `docPath`
    // against the rebuilt outcomes view (D13's fidelity/back-link
    // guarantee).
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
      //
      // The actual enumeration/fold/write logic lives in
      // enduser-index-generate.mjs (tsk-1m0) — the one generation path this
      // verb shares with the enduser-docs-index-stale doctor check/fix
      // (src/setup/registrations.mjs), so neither duplicates the other.
      const repoRoot = path.dirname(dir);
      const { path: manifestRelPath, count, entries } = generateEnduserDocsIndex(repoRoot, dir);
      return { path: manifestRelPath, count, entries };
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

    // tsk-1lv review-fix F11: fgos-coding-compounding's own D8
    // tìm-trước-khi-tạo doctrine (SKILL.md step 3) described calling
    // `findAuthoritativeMatch` directly as a raw Node import -- no CLI
    // verb backed it, so it had zero real callers anywhere in the repo
    // (confirmed by grep before this fix), and the doctrine's own worked
    // example was unfollowable without hand-writing throwaway Node code
    // each time. This verb IS the real, discoverable surface for both
    // halves the module already exports: the doctrine's own find-before-
    // create lookup (default mode), and D8's "harness backstop" duplicate-
    // claim scan (`--check-duplicates`) -- read-only either way, never a
    // live gate, matching CONTEXT.md D8's own "never a gate sống" line.
    case 'authoritative-match': {
      const quadrantDir = requireField(
        flags.quadrant,
        'authoritative-match requires --quadrant <docs/quadrant-dir>',
      );
      const repoRoot = path.dirname(dir);
      const absQuadrantDir = path.join(repoRoot, quadrantDir);
      const candidates = [];
      let entries = [];
      // tsk-1lv round-2 review, M1: a bad/typo'd --quadrant used to
      // degrade silently to candidateCount:0, match:null -- exit 0,
      // indistinguishable from "scanned real docs, none claim this
      // topic." For a find-before-create doctrine whose entire job is
      // preventing duplicate authoritative docs, that reads as "create a
      // new doc" on a path typo instead of "this call was wrong."
      // `quadrantExists` lets a caller (the compounding skill's own
      // doctrine step) tell the two apart.
      let quadrantExists = true;
      try {
        entries = fs.readdirSync(absQuadrantDir, { withFileTypes: true });
      } catch {
        entries = [];
        quadrantExists = false;
      }
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        const relPath = path.posix.join(quadrantDir, entry.name);
        const content = fs.readFileSync(path.join(absQuadrantDir, entry.name), 'utf8');
        const { meta } = parseFrontmatter(content);
        candidates.push({ path: relPath, authoritativeFor: meta.authoritative_for });
      }
      if (flags['check-duplicates'] !== undefined) {
        const duplicates = findDuplicateAuthoritativeClaims(candidates);
        return {
          quadrant: quadrantDir,
          quadrantExists,
          candidateCount: candidates.length,
          duplicateGroups: duplicates.map((group) => group.map((c) => c.path)),
        };
      }
      const topic = requireField(
        flags.topic,
        'authoritative-match requires --topic "<subject text>" (or pass --check-duplicates to scan for duplicate claims instead)',
      );
      const match = findAuthoritativeMatch(topic, candidates);
      return {
        quadrant: quadrantDir,
        quadrantExists,
        topic,
        candidateCount: candidates.length,
        match: match ? match.path : null,
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
      // repoRoot from --dir, never raw process.cwd() (tsk-k8u D2): a
      // caller running this from inside a linked worktree (e.g. a session
      // mid-clarify/decompose, per claim-lock §3b) always passes --dir at
      // the stable main checkout — deriving repoRoot from it keeps every
      // git op in this handler targeting that stable root instead of the
      // caller's own possibly-transient cwd. Byte-identical to before when
      // --dir is omitted (dataDir() resolves dir from process.cwd() too in
      // that case).
      const repoRoot = path.dirname(dir);

      const claiming = listWork(dir).work[id];
      const claimingBranch = branchNameFor(id);
      if (claiming?.status === 'todo' && branchExists(repoRoot, claimingBranch)) {
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
        repoRoot,
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
      // repoRoot from --dir, never raw process.cwd() (tsk-k8u D1/D2): a
      // claim-release + re-pick run from inside the very worktree being
      // torn down (e.g. the claim-lock §3b reattach above) must never
      // target git operations at that doomed cwd — deriving repoRoot from
      // --dir keeps them at the stable main checkout instead. Same
      // no-op-when---dir-is-omitted behavior as take's own fix above.
      const repoRoot = path.dirname(dir);
      // worktreeDir under repoRoot's .claude/worktrees/ (tsk-424 D1/D2,
      // tsk-k8u D2: derived from the same fixed repoRoot, not
      // process.cwd(), for the same reason): the harness's own
      // EnterWorktree tool only allows a second-or-later in-session switch
      // when the target sits there, e.g. a root item decomposing into a
      // child mid-session. os.tmpdir()/fgos-worktrees (createWorktree's own
      // default) fails that check past the first switch — pick is the only
      // caller that needs the harness-chainable location; runner/
      // merge-ephemeral callers are untouched.
      const doPick = () => claimWork(dir, {
        id,
        actor: 'session',
        isolate: true,
        claimTrigger,
        repoRoot,
        worktreeDir: path.join(repoRoot, '.claude', 'worktrees'),
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
      const timeoutMs = resolveVerifyTimeoutMs('return', flags, path.dirname(dir));
      // tsk-4on D1-D3: explicit escape hatch for work already fully done
      // BEFORE this claim (e.g. a parent whose children's merged content
      // already sits on its own branch from a prior session) — return's
      // default contract (prove new work since take) stays byte-identical
      // when this flag is absent.
      const noNewCommitsOk = flags['no-new-commits-ok'] === true;
      // tsk-516 (CONTEXT.md D3/D6): read once, used by BOTH return paths
      // below (branch-source and main-source). Resolved from the project
      // root the store itself sits under — the same `path.dirname(dir)`
      // the verify timeout right above already resolves its config from,
      // never `process.cwd()`: a session returning from inside a worktree
      // would otherwise read that branch's own possibly-stale copy of
      // config.json instead of the project's real one.
      const invariantCheckCommands = readInvariantCheckCommands(path.dirname(dir));

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
      // tsk-1zo: a verify never upgraded from its discovery/submit-stage
      // placeholder sentinel shells out as literal text (runGoalCheck ->
      // runCommand) and fails with a cryptic raw shell error ("<first
      // word>: not found", exit 127) instead of a clean refusal. Checked
      // once here, before the branch/main-source split below, so both
      // paths — which both call runGoalCheck further down — are covered by
      // the same guard `resolveDiscovery` already uses at discovery-stage
      // transitions (src/intake/discovery.mjs's hasRealVerify).
      if (!hasRealVerify(item.verify)) {
        throw new StoreError(
          'validation',
          `return: work "${id}" still carries a placeholder verify ("${item.verify}") — set a real command first: fgos edit "${id}" --verify "<command>".`,
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
        const attestation = checkDispatchAttestation(dir, repoRoot, id, branch);
        if (!attestation.ok) {
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: attestation.reason, role: item.claimRole ?? 'session' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: attestation.reason,
            layer: 'attestation',
            attempts: 1,
            detail: attestation.detail,
          });
          throw new StoreError('validation', `return: work "${id}" halted due to attestation mismatch: ${attestation.detail}`);
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

        const workerVerifiedSha = flags['worker-verified-sha'];
        const isWorkerVerified = typeof workerVerifiedSha === 'string' && workerVerifiedSha && workerVerifiedSha === branchHead;

        let check;
        if (isWorkerVerified) {
          check = {
            passed: true,
            status: 0,
            timedOut: false,
            skipped: true,
            output: `verify skipped: branch tip ${branchHead} was already verified green by worker`,
          };
        } else {
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
          try {
            gitAt(repoRoot, ['worktree', 'add', '--detach', tmpWorktree, branchHead]);
            // `.fgos/` strip (ADR0020, tsk-26r): since `.fgos/` is
            // git-tracked in this repo, the `worktree add` above just
            // checked out a snapshot of it frozen at branchHead — stale the
            // moment main gets another event, and (per createWorktree's own
            // finishWorktreeSetup, src/runner/worktree.mjs) something this
            // disposable verify worktree has no legitimate reason to read or
            // write anyway. Strip it the same way createWorktree does, right
            // after checkout and before verify runs, so this ephemeral
            // worktree's tree looks like every other worker worktree instead
            // of tripping fgos-return.test.mjs's main-checkout-cleanliness /
            // `.fgos`-dirty-tree exemption checks on a checked-out copy
            // nothing here ever needed.
            try {
              fs.rmSync(path.join(tmpWorktree, '.fgos'), { recursive: true, force: true });
            } catch (err) {
              throw new StoreError('validation', `return: removing checked-out .fgos in ephemeral verify worktree "${tmpWorktree}" failed: ${err.message}`);
            }
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
            // tsk-516 (CONTEXT.md D3/D4): the repo-invariant checks run in the
            // SAME disposable worktree, while it still exists — the `finally`
            // below removes it. Only after the item's own verify is green:
            // a red verify already blocks, and reporting the invariant result
            // on top of it would just be noise about a tree already refused.
            if (check.passed) {
              const invariant = await runInvariantChecks(invariantCheckCommands, tmpWorktree, timeoutMs);
              if (!invariant.passed) check = invariantFailureAsCheck(invariant);
            }
          } finally {
            try {
              execFileSync('git', ['worktree', 'remove', tmpWorktree, '--force'], { cwd: repoRoot, encoding: 'utf8', shell: false });
            } catch {
              // best-effort — mirrors worktree.mjs's own removeWorktree/prune
              // discipline; a cleanup failure must never mask the verify
              // result already computed above.
            }
          }
        }

        if (check.passed) {
          // STR63: advisory only (per cos) — a hit never blocks this return.
          const changed = changedFilesSince(repoRoot, item.branchHeadAtTake, branchHead);
          const frozenJudge = frozenJudgeHits(changed, item.footprint);
          // tsk-4hl: same advisory stance, broadened diff (D5's
          // absent-footprint exemption still applies inside footprintDiffHits
          // itself) — excludeIronLawEvidence strips this item's own mandatory
          // evidence doc before checking, see that helper's own comment.
          const footprintDiff = footprintDiffHits(excludeDocsRefResearch(excludeFgosPaths(excludeIronLawEvidence(changed, id)), item), item.footprint);
          const { event } = moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'doing', branchHeadAtReturn: branchHead });
          addOutcome(dir, { id, actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: branchAheadCount } });
          return { id, from: 'doing', to: 'awaiting-approval', source: 'branch', branch, aheadCount: branchAheadCount, passed: true, seq: event.seq, output: check.output, frozenJudgeHits: frozenJudge, footprintDiffHits: footprintDiff };
        }

        // tsk-53o: a timeout is not proof the item's verify failed (the
        // machine may simply have been under load) — never let it park as
        // an indistinguishable 'verify-fail'/'verify-miss', and never state
        // "(exit null)" as if that were a real exit code.
        moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: check.timedOut ? 'verify-timeout' : 'verify-fail', role: 'system' });
        addOutcome(dir, { id, actual: { outcome: 'blocked', passed: false, attempts: 1, errorClass: check.timedOut ? 'verify-timeout' : 'verify-miss', aheadCount: branchAheadCount } });
        {
          const detail = check.timedOut
            ? `goal-check on branch "${branch}" timed out after ${timeoutMs}ms — not a verify failure, rerun return`
            : `goal-check failed on branch "${branch}" (exit ${check.status})`;
          // tsk-4o9: advisory only, never a gate -- a timeout is not proof
          // of a real verify failure (per the tsk-53o comment above), so it
          // gets no hint either.
          const hint = check.timedOut ? null : detachedWorktreeFgosHint(check.output);
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: check.timedOut ? 'verify-timeout' : 'verify-miss',
            layer: 'verification',
            attempts: 1,
            detail: hint ? `${detail}\n${hint}` : detail,
          });
        }
        return { id, from: 'doing', to: 'blocked', source: 'branch', branch, aheadCount: branchAheadCount, passed: false, timedOut: check.timedOut, exitStatus: check.status, output: check.output };
      }

      // tsk-ikd (P44): the branch-source path above already returned before
      // reaching here, so every path below is main-source -- it reads
      // `currentHead(repoRoot)`, runs the clean-tree check, verify, and
      // records `headAtReturn` all against whatever `repoRoot` happens to
      // be. `approve` (:3355), `sync-root` (:4043), and
      // `promote-to-component` (:4258) all refuse from a linked worktree for
      // exactly this hazard class -- verifying/recording a stale or
      // divergent tree while claiming it verified on main -- but this path
      // had no such guard. Without it: an item claimed via `take`
      // (main-source) returned from inside a leftover, UNREGISTERED `fgw/*`
      // claim worktree instead of main (e.g. left over from a DIFFERENT
      // item entirely) would pass the progress gate and verify against THAT
      // worktree's own tree, then record `headAtReturn` as a sha that was
      // never on main -- `approve`'s later verify-only mode re-verifies on
      // main and finds it green (main's own HEAD, untouched), and the item
      // goes `delivered` with its real content never actually on main.
      // Surfaces only much later, misdiagnosed as a force-push/history-
      // rewrite loss when cleanup's ancestry check fails.
      //
      // A REGISTERED session worktree (`fgos session start`) is deliberately
      // EXEMPT -- unlike `approve`, which refuses ANY worktree including a
      // registered session (docs/specs/runner.md: "a session worktree is
      // structurally the wrong place for a merge-into-main to happen"),
      // `return`'s own progress check (aheadCount + verify) is spike-proven
      // correct from inside a session worktree and is documented there as
      // deliberately unchanged: a session worktree's `.fgos` is a symlink to
      // the real shared store (never copied), so state writes land
      // correctly, and `session end` (session.mjs's own divergence guard)
      // already refuses to silently discard a dangling commit -- that is
      // the layer responsible for making sure returned work actually reaches
      // main, not this one. Only an UNREGISTERED worktree (an ad-hoc `git
      // worktree add`, or -- the actual failure scenario here -- a
      // different item's own leftover `fgw/<id>` claim checkout) is refused.
      // The branch-source path above needs no such guard at all (its own
      // comment, D2: "tree người là việc của người" -- it never touches
      // `repoRoot`'s working tree, verify runs in a disposable detached
      // worktree).
      const returnCwdReal = realpathOr(repoRoot);
      const insideRegisteredSession = listSessions(repoRoot).some((session) => {
        const wtReal = realpathOr(session.worktreePath);
        return returnCwdReal === wtReal || returnCwdReal.startsWith(`${wtReal}${path.sep}`);
      });
      if (!insideRegisteredSession && !isMainWorktree(repoRoot)) {
        // tsk-2t9c D18: found via a real end-to-end run -- an item claimed
        // through `fgos take` (never `fgos pick`, which DOES stand up a
        // registered `fgw/<id>` worktree) into an ad-hoc worktree hits
        // this refusal with no skill's own prose warning it could happen,
        // and the fix (`fgos session start`) is easy to miss inside a
        // longer explanatory sentence. Naming the exact command on its
        // own line is the same "chặn và dạy tại chỗ" discipline
        // `handoff`'s own refusal already applies (list the legal edges,
        // don't just say "refused"). `session start` resolves its own
        // repoRoot from `process.cwd()`, never `--dir` (unlike every
        // other verb here) -- run it from THIS SAME worktree, not with a
        // `--dir` flag pointed at it.
        throw new StoreError(
          'validation',
          `return: refusing to run from "${repoRoot}" — this is a git worktree (not the main checkout, and not a registered "fgos session start" worktree). Run return from the main checkout, or register this worktree first, from right here: fgos session start --item "${id}"`,
        );
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

      let check = await runGoalCheck(item, cwd, timeoutMs);
      // tsk-516 (CONTEXT.md D3/D4): same gate as the branch path above, on
      // the main checkout's own tree. Only after the item's own verify is
      // green — a red verify already blocks on its own.
      if (check.passed) {
        const invariant = await runInvariantChecks(invariantCheckCommands, cwd, timeoutMs);
        if (!invariant.passed) check = invariantFailureAsCheck(invariant);
      }
      if (check.passed) {
        // STR63: advisory only (per cos) — a hit never blocks this return.
        const frozenJudge = frozenJudgeHits(ownDiff, item.footprint);
        // tsk-4hl: see excludeIronLawEvidence's own comment above.
        const footprintDiff = footprintDiffHits(excludeDocsRefResearch(excludeFgosPaths(excludeIronLawEvidence(ownDiff, id)), item), item.footprint);
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
        return { id, from: 'doing', to: 'awaiting-approval', source: 'main', aheadCount, passed: true, seq: event.seq, output: check.output, frozenJudgeHits: frozenJudge, footprintDiffHits: footprintDiff };
      }

      // tsk-53o: same timeout/fail distinction as the branch-source path
      // above — a timeout is not proof the item's verify failed.
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'doing', reason: check.timedOut ? 'verify-timeout' : 'verify-fail', role: 'system' });
      addOutcome(dir, { id, actual: { outcome: 'blocked', passed: false, attempts: 1, errorClass: check.timedOut ? 'verify-timeout' : 'verify-miss', aheadCount } });
      {
        const detail = check.timedOut
          ? `goal-check timed out after ${timeoutMs}ms — not a verify failure, rerun return`
          : `goal-check failed (exit ${check.status})`;
        // tsk-4o9: advisory only, never a gate -- same timeout exclusion as
        // the branch-source path above (tsk-53o: a timeout is not proof of
        // a real verify failure).
        const hint = check.timedOut ? null : detachedWorktreeFgosHint(check.output);
        addFriction(dir, {
          id,
          disposition: 'blocked',
          errorClass: check.timedOut ? 'verify-timeout' : 'verify-miss',
          layer: 'verification',
          attempts: 1,
          detail: hint ? `${detail}\n${hint}` : detail,
        });
      }
      // Same early-release as the passing branch above (tsk-45z D1/D2) — a
      // failed verify still means this session is done touching the main
      // checkout; the item settling to `blocked` is just as much "done with
      // the checkout" as settling to `proposed`.
      releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id);
      return { id, from: 'doing', to: 'blocked', source: 'main', aheadCount, passed: false, timedOut: check.timedOut, exitStatus: check.status, output: check.output };
    }

    // Cổng duyệt PR nội bộ (pr-lifecycle D1/D4): a proposed item's diff,
    // shown from whichever source classifySource resolves (runner branch,
    // pull-door head range, or legacy degrade — merge.mjs). A pure read —
    // never appends an event, never mutates state.json, same D1 request-class
    // as `ready`/`list`/`check`.
    case 'review': {
      const id = requireField(positional[0] ?? flags.id, 'review requires an id: fgos review <id>');
      // `--pr` is forwarded RAW and validated inside the use case, at the
      // point the old case block validated it: after the found/status
      // guards, inside the `--github` branch. Checking it here instead
      // would let a bare `--pr` outrank a nonexistent id in the refusal,
      // and would turn a stray `--pr` without `--github` — ignored before —
      // into a new validation error. `approve` already keeps its own `--pr`
      // check inside its use case for the same reason.
      return await reviewUseCase(
        { dir, cwd: process.cwd() },
        { id, github: Boolean(flags.github), prNumber: flags.pr, ...ghCommandOpts() },
      );
    }

    case 'approve': {
      const id = requireField(positional[0] ?? flags.id, 'approve requires an id: fgos approve <id> [--timeout <ms>|--no-timeout]');
      // repoRoot: process.cwd() by default -- the use case's guards then
      // refuse outright when cwd is any linked/session/ad-hoc worktree,
      // catching a merge that would otherwise land on that worktree's own
      // (possibly stale) checkout or a goal-check that verifies stale code
      // while claiming "verified on main" (the P44/review-260718 incident
      // history this file's own comments already document). --trust-dir
      // (tsk-4uj) opts into deriving repoRoot from --dir instead, the same
      // substitution tsk-k8u/tsk-5vl already proved for take/pick/catchup
      // -- but gated behind this explicit flag, never the unconditional
      // default, given approve's own incident history: the caller must say
      // it knows --dir is trustworthy rather than getting the relaxed
      // behavior silently. Byte-identical to today when the flag is
      // omitted.
      const repoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();
      return await approveUseCase(
        { dir, repoRoot },
        parseMergeClusterOptions('approve', flags, dir, { id }),
      );
    }

    // sync-root (tsk-50i, docs/history/tsk-3bn-merge-conductor-harness-v2/):
    // merges fgw/<root-id>'s current tip into its real target — `main`, or
    // fgw/<parentId> for a nested root — WITHOUT touching the root item's
    // own status/stage (CONTEXT.md's locked contract: this replaces the
    // ad-hoc `git merge` tsk-3bn's own origin incident required by hand).
    // Reuses `mergeRunnerItem`'s exact lock/verify path (constraint #1,
    // fgos-coding-validating's gate) — never a second bespoke merge mechanism.
    // Unlike `approve`'s root-into-main path, this never deletes fgw/<id>
    // afterward: the root stays open for further leaf merges.
    case 'sync-root': {
      const id = requireField(positional[0] ?? flags.id, 'sync-root requires a root-id: fgos sync-root <root-id>');
      // repoRoot: process.cwd() by default -- the use case's isMainWorktree
      // guard then refuses outright when cwd is any linked worktree,
      // catching a merge that would otherwise land on that worktree's own
      // (possibly stale) checkout. --trust-dir (tsk-4uj) opts into deriving
      // repoRoot from --dir instead, the same substitution tsk-k8u/tsk-5vl
      // already proved for take/pick/catchup -- but gated behind this
      // explicit flag here, never the unconditional default: unlike
      // catchup, sync-root's guard is deliberate (mirrors approve's own
      // discipline), so the caller must say it knows --dir is trustworthy
      // rather than getting the relaxed behavior silently. Byte-identical
      // to today when the flag is omitted.
      const repoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();
      return await syncRootUseCase({ dir, repoRoot }, parseMergeClusterOptions('sync-root', flags, dir, { id }));
    }

    // tsk-3gx-3: Layer 2 action — takes N flat sibling item ids (D2: caller's
    // own explicit list, this verb only light-validates, never infers
    // grouping), resolves/creates the shared root (D1), retargets each
    // member via tsk-3gx-2's engine (gated per member by tsk-3gx-1's
    // read-only preflight), and ONLY when a member's own real git merge
    // truly succeeds does it set that member's `parent` — never on say-so,
    // matching the item's own framing ("CHỈ khi git thành công thật mới set
    // field parent"). Records one real decision summarizing every member's
    // outcome.
    case 'promote-to-component': {
      const ids = parseListFlag(flags.ids ?? positional.join(','));
      if (!Array.isArray(ids) || ids.length < 2) {
        throw new StoreError('validation', 'promote-to-component requires --ids (or positional args) listing at least 2 member item ids.');
      }
      // repoRoot: process.cwd() by default -- the use case's isMainWorktree
      // guard then refuses outright when cwd is any linked worktree,
      // catching a batch promotion that would otherwise merge member
      // branches against that worktree's own (possibly stale) checkout.
      // --trust-dir (tsk-2bg) opts into deriving repoRoot from --dir
      // instead, the same substitution tsk-4uj already shipped for
      // sync-root/approve (CONTEXT.md D5/D6) -- gated behind this explicit
      // flag here, never the unconditional default: same posture as
      // sync-root (merges land on a runner-owned integration branch, never
      // main directly), so the caller must say it knows --dir is
      // trustworthy rather than getting the relaxed behavior silently.
      // Byte-identical to today when the flag is omitted. retargetMember's
      // own isMainWorktree check (promote-engine.mjs) inherits this
      // relaxation for free -- it receives this same repoRoot value
      // unchanged, never re-derives it.
      const repoRoot = flags['trust-dir'] === true ? path.dirname(dir) : process.cwd();
      // Raw Number(), deliberately NOT resolveVerifyTimeoutMs: this verb
      // has never read the runner config's verify timeout, and keeping it
      // that way is the only way this stays a pure move.
      const timeoutMs = flags.timeout !== undefined ? Number(flags.timeout) : undefined;
      return await promoteToComponentUseCase(
        { dir, repoRoot },
        { ids, rootId: flags['root-id'], rootTitle: flags['root-title'], timeoutMs },
      );
    }

    // Cổng duyệt — reject (pr-lifecycle D4): awaiting-approval -> todo, reason
    // mandatory (fsm.mjs already enforces this edge). NEVER runs a single git
    // command — the code (if any landed on main via a pull-door item) is
    // history, not something this verb rewrites; a human who wants it gone
    // commits their own revert and still rejects (D4's "không auto-revert").
    case 'reject': {
      const id = requireField(positional[0] ?? flags.id, 'reject requires an id: fgos reject <id> --reason "..."');
      const reason = requireField(flags.reason, 'reject requires --reason "..."');
      return rejectUseCase({ dir }, { id, reason });
    }

    case 'catchup': {
      const id = requireField(positional[0] ?? flags.id, 'catchup requires an id: fgos catchup <id> [--timeout <ms>|--no-timeout]');
      const timeoutMs = resolveVerifyTimeoutMs('catchup', flags, path.dirname(dir));
      // repoRoot from --dir, never raw process.cwd() (tsk-5vl, same class
      // as tsk-k8u's take/pick fix): a caller running catchup from inside
      // the item's own linked worktree (e.g. a session that just hit
      // verify-fail-post-merge and is still sitting inside its own picked
      // worktree) always passes --dir at the stable main checkout —
      // deriving repoRoot from it keeps withMergeEphemeralWorktree's own
      // `git branch -f` (src/runner/worktree.mjs) targeting that stable
      // root instead of the worktree currently checked out on the same
      // branch it is about to force-update, which git refuses ("Cannot
      // force update the current branch"). Byte-identical to today when
      // --dir is omitted (dataDir() resolves dir from process.cwd() too
      // in that case). This verb has no `--trust-dir` gate, unlike
      // approve/sync-root/promote-to-component — a real per-verb
      // difference the adapter owns.
      return await catchupUseCase({ dir, repoRoot: path.dirname(dir) }, { id, timeoutMs });
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

    // Tool registry (tsk-1dj, ported from repository-harness's
    // tool-registry-capability per docs/distillery/deep-dives/
    // tool-registry.md; tsk-in1-1 D1: `register`/`remove` retired — a tool
    // provider is now declared directly in `runner.executors.<id>`
    // (`.fgos/config.json`), config-edited like every other executor, never
    // through the event log): `check` writes ONLY the local, gitignored
    // status overlay (tool-registry.mjs's readLocalStatus/writeLocalStatus)
    // — never an event, per CONTEXT.md's pinned "registered vs present"
    // term, and it always succeeds even when every probed tool comes back
    // missing (absent capability is a fact to report, never a CLI error);
    // `query` merges the two (config-declared tools + local overlay) at
    // read time.
    case 'tool': {
      const sub = requireField(positional[0], 'tool requires a sub-verb: fgos tool <check|query> ...');
      const repoRoot = path.dirname(dir);
      const cfg = flags.config ? loadRunnerConfig(flags.config) : ensureRunnerConfigForDir(repoRoot);
      const tools = toolsFromExecutors(cfg.executors);
      if (sub === 'check') {
        const name = optionalField(flags.name, 'tool check --name requires a non-empty value.');
        if (name !== undefined && !tools[name]) {
          throw new StoreError('validation', `tool "${name}" not found.`);
        }
        const targets = name !== undefined ? [name] : Object.keys(tools);
        const localStatus = readLocalStatus(dir);
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
      throw new StoreError('validation', `unknown tool sub-verb "${sub}". Usage: fgos tool <check|query> ...`);
    }

    // Do-and-announce shell-integration + config bootstrap (str87-fgos-setup-doctor
    // D6, retargeted per tsk-2ta D1 amended / tsk-5vf D2/D4): inserts the
    // shell-integration source line into every DETECTED rc file (bash/zsh,
    // D4) — never creates a new rc file (shell-rc.mjs's own refusal) — then
    // ensures the shared config file (`.fgos/config.json`) exists and has
    // every current default key from EVERY registered `registerConfigDefault`
    // entry, via `ensureSharedConfigDefaults` (the one write path allowed
    // here; `doctor`, unlike `setup`, never calls it). tsk-1ri: also ensures
    // the GLOBAL config file (`~/.fgos/config.json`) the same way —
    // `ensureSharedConfigDefaults` is already generic over its `dir`
    // argument (`sharedConfigFilePath(os.homedir())` resolves to the exact
    // same path `src/config/global-config.mjs`'s `defaultGlobalConfigPath()`
    // uses), so this reuses it as-is rather than adding a parallel
    // global-specific writer.
    case 'setup': {
      // tsk-2xj: same --dir resolution as `doctor`/`uninstall` below and
      // `resync-worktree` (:4939) — setup's writes are unconditional (tsk-5hi),
      // so run from a linked worktree this used to materialize .fgos/config.json
      // INSIDE the worktree (ADR0020 violation), not just report wrong.
      const repoRoot = flags.dir !== undefined ? path.dirname(dir) : (resolveMainCheckoutRoot(process.cwd()) ?? process.cwd());
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
      const globalConfigPath = sharedConfigFilePath(os.homedir());
      const globalConfigExisted = fs.existsSync(globalConfigPath);
      const { addedKeys: globalAddedKeys } = ensureSharedConfigDefaults(os.homedir());
      // str65-6/str88: wires core.hooksPath the same way `npm run setup:hooks`
      // does — a second, non-npm-lifecycle-dependent activation path for the
      // main-checkout lock hook, since pnpm 10+ blocks `prepare` for a
      // git-hosted dependency (str88) and nothing re-automated it since.
      // Idempotent, no-ops silently when repoRoot has no `.git` at all.
      // Fill-only like the two side effects above: a pre-existing custom
      // core.hooksPath is left untouched, never silently repointed.
      const { wired: hooksWired, skippedExisting: hooksSkippedExisting } = installGitHooks(repoRoot);
      // tsk-60f D1/D5: wires the PreToolUse dispatch-decide enforcement hook
      // into .claude/settings.json the same fill-only way — a pre-existing
      // hooks.SessionStart entry (or any other settings.json content) is
      // left untouched; a malformed settings.json is left alone entirely.
      const { wired: dispatchDecideHookWired, skippedExisting: dispatchDecideHookSkippedExisting } = installClaudeCodeHook(repoRoot);
      // tsk-5hi: setup now also runs every registered fix — the same
      // runFixes() `doctor --fix` already calls (RUL9/RUL11) — instead of
      // leaving a person to separately discover and run `doctor --fix` to
      // reach the state a plain `setup` should already leave a project in.
      // Unconditional, no confirmation, per RUL10's existing act-then-report
      // contract for this verb; every registered fix is already required
      // idempotent/fail-soft, so running the full list here is safe.
      const fixed = runFixes(repoRoot);
      // tsk-1qi D5/D7: materializes `.agents/skills` (canonical source) +
      // generated `.claude/skills` thin wrappers into repoRoot -- copying
      // from THIS running copy's own package root when repoRoot is a
      // different (external) project, or just regenerating wrappers
      // in-place for forgentX's own dev-checkout self-hosting run (see
      // materializeSkillsIntoProject's own self-hosting no-copy branch).
      const { copied: skillsSourceCopied, wrappersWritten: skillWrappersGenerated } = materializeSkillsIntoProject(PACKAGE_ROOT, repoRoot);
      return {
        rcFilesInserted,
        rcFilesAlreadyConfigured,
        ...(rcWriteDeclinedReason !== null && { rcWriteDeclinedReason }),
        configPath,
        configCreated: !configExisted,
        configAddedKeys: configExisted ? addedKeys : [],
        globalConfigPath,
        globalConfigCreated: !globalConfigExisted,
        globalConfigAddedKeys: globalConfigExisted ? globalAddedKeys : [],
        hooksWired,
        hooksSkippedExisting,
        dispatchDecideHookWired,
        dispatchDecideHookSkippedExisting,
        fixed,
        skillsSourceCopied,
        skillWrappersGenerated: skillWrappersGenerated.length,
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
      // tsk-2xj: same --dir resolution as `doctor`/`setup` above.
      const repoRoot = flags.dir !== undefined ? path.dirname(dir) : (resolveMainCheckoutRoot(process.cwd()) ?? process.cwd());
      const scriptPath = integrationScriptPath();
      const shellRcSourceLinesFound = scriptPath === null
        ? []
        : detectRcFiles(os.homedir())
          .filter((rcFile) => hasSourceLine(rcFile, scriptPath))
          .map((rcFile) => ({ rcFile, sourceLine: `source "${scriptPath}"` }));
      const { unwired: hooksUnwired, skippedExisting: hooksSkippedExisting } = uninstallGitHooks(repoRoot);
      let packageRemoval = { attempted: false, outcome: null };
      if (flags['remove-package']) {
        // tsk-652: `npm uninstall -g forgent` exits 0 and reports nothing
        // wrong even when this copy was never npm-installed at all (a
        // pnpm/yarn global install lives in a different store npm never
        // touches) -- confirm npm's own global node_modules actually has
        // this package BEFORE claiming success, the same "detected
        // manager" scope tsk-4iv-2's own SPIKE locked (npm-only), never
        // widened here to actually support pnpm/yarn removal.
        let npmRootG = null;
        try {
          npmRootG = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
        } catch {
          npmRootG = null;
        }
        const npmInstalled = npmRootG !== null && npmRootG !== '' && fs.existsSync(path.join(npmRootG, 'forgent'));
        if (!npmInstalled) {
          packageRemoval = {
            attempted: false,
            outcome: 'skipped',
            reason: npmRootG
              ? `this copy of fgOS is not visible under npm's own global node_modules (${npmRootG}) -- --remove-package only supports npm global installs (tsk-4iv-2); if installed via pnpm/yarn, remove it with that tool's own global uninstall command instead`
              : 'npm root -g did not resolve (npm not on PATH?) -- --remove-package only supports npm global installs (tsk-4iv-2), and could not confirm this is one',
          };
        } else {
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
      // tsk-2xj: resolve the real main checkout the same way `resync-worktree`
      // (:4939) already does — an explicit --dir always wins, otherwise
      // self-detect via resolveMainCheckoutRoot so this reports/fixes the
      // shared store even when run from a linked worktree (ADR0020: a
      // worktree never carries its own .fgos/, so process.cwd() there was
      // silently checking/writing the wrong tree).
      const repoRoot = flags.dir !== undefined ? path.dirname(dir) : (resolveMainCheckoutRoot(process.cwd()) ?? process.cwd());
      const fixed = flags.fix ? runFixes(repoRoot) : undefined;
      const checks = DOCTOR_CHECKS.map(({ id, description, check }) => {
        const { passed, message } = check(repoRoot);
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
        // tsk-24t: main-checkout-lock.mjs's own tryAcquireOnce only probes
        // liveness (isPidAlive) for a NUMERIC holder identity -- a string
        // identity (the shape .githooks/pre-commit writes per commit) is
        // judged purely by TTL freshness, by design (D5 fail-closed,
        // undecidable without a liveness window). Claiming "live session"
        // for that branch is a fabrication; say what is actually known.
        const holderDescription = typeof lockResult.holderPid === 'number'
          ? `a live session (${lockResult.holderPid}`
          : `an identity whose liveness cannot be determined (${JSON.stringify(lockResult.holderPid)}`;
        throw new StoreError(
          'lock-timeout',
          `unlock: main checkout lock is held by ${holderDescription}, held ${formatLockDurationMs(lockResult.lockAgeMs)}${ttlPart}) -- refusing to clear it.`,
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

    // tsk-1d7 (docs/history/stale-worktree-index-guard/CONTEXT.md D3): the
    // repair verb `.githooks/pre-commit`'s own stale-index guard (D2)
    // prints as its refuse-message command. Run FROM INSIDE the stale
    // worktree (the same place the hook just refused a commit) — `--path`
    // exists only so a test/caller can point this at a worktree other than
    // its own cwd. `resyncWorktree`'s own `repoRoot` param must be the MAIN
    // checkout, never the worktree itself, since branch refs and
    // `--git-common-dir` must resolve against the shared repo (tsk-jgs:
    // `dir` alone is NOT that root here -- `dir` is `dataDir(flags.dir)`,
    // which for the bare/default invocation this case exists to support is
    // cwd-strict, never git-resolved, per `dataDir`'s own doc comment
    // above -- so it silently resolves to `<worktreePath>/.fgos`, a path
    // that never exists on disk for a linked worktree, ADR0020). When
    // `--dir` is given explicitly, `path.dirname(dir)` recovers the
    // caller-supplied root correctly, same as every other verb here; when
    // it is omitted, resolve the real main checkout the same way
    // `dispatch.mjs`/`registrations.mjs` already do for exactly this
    // worktree-or-main-checkout ambiguity: `resolveMainCheckoutRoot`
    // (`src/runner/paths.mjs`), which shells `git --git-common-dir` from
    // the worktree itself.
    case 'resync-worktree': {
      const worktreePath = flags.path ? path.resolve(flags.path) : process.cwd();
      const branch = flags.branch ?? gitAt(worktreePath, ['symbolic-ref', '--short', 'HEAD']).trim();
      const repoRoot = flags.dir !== undefined ? path.dirname(dir) : (resolveMainCheckoutRoot(worktreePath) ?? path.dirname(dir));
      return resyncWorktree(repoRoot, worktreePath, branch);
    }

    // tsk-3au: the safe path for a destructive `git reset --hard` on the
    // main checkout — refuses when the whole-repo tree is dirty (reusing
    // `isMainTreeClean`, the same whole-repo check `approve` already uses,
    // never a fresh git-status reimplementation) unless the caller passes
    // `--confirm` after seeing the full status this case prints into the
    // error. `repoRoot` is derived from `dir` (never `process.cwd()`) so
    // this verb behaves identically whether invoked from the main checkout
    // or, per this item's own theme, from a worktree's cwd with `--dir`.
    //
    // tsk-5iv D1 (round-3 review, HIGH): `repoRoot = path.dirname(dir)` and
    // `dir` defaults to `dataDir(undefined)` -- cwd-strict, never
    // git-resolved (paths.mjs's own `strict: true` contract). Called with
    // no `--dir` from inside a linked worktree, `repoRoot` silently
    // resolves to the WORKTREE, not the main checkout, while this verb's
    // own error text below still prints "main checkout, whole repo" and
    // (with --confirm) runs `git reset --hard` against that wrong tree --
    // the exact destructive-reset-on-the-wrong-tree failure mode AGENTS.md
    // tells every session to use THIS verb instead of raw `git reset
    // --hard` to avoid. Refuse outright rather than silently proceed,
    // matching the same `isMainWorktree` guard other verbs in this file
    // already use (e.g. the `init`/`approve --github` cases above).
    case 'main-checkout-reset': {
      const sha = requireField(flags.sha, 'main-checkout-reset requires --sha <sha>: fgos main-checkout-reset --sha <sha> [--confirm]');
      const repoRoot = path.dirname(dir);
      if (flags.dir === undefined && !isMainWorktree(repoRoot)) {
        throw new StoreError(
          'validation',
          'main-checkout-reset: refusing to run without --dir <mainRoot> -- cwd is a linked worktree, and without --dir this verb would silently ' +
            'target it (git reset --hard) instead of the main checkout. Pass --dir <mainRoot> explicitly, e.g. ' +
            '`fgos main-checkout-reset --sha <sha> --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"`.',
        );
      }
      const confirmed = Boolean(flags.confirm);
      const dirty = !isMainTreeClean(repoRoot);
      try {
        assertSafeMainCheckoutReset({ dirty, confirmed });
      } catch (err) {
        const statusOutput = gitAt(repoRoot, ['status', '--porcelain']).trim();
        throw new StoreError(
          'validation',
          `main-checkout-reset: ${err.message}\n\nFull git status (main checkout, whole repo):\n${statusOutput || '(empty)'}`,
        );
      }
      gitAt(repoRoot, ['reset', '--hard', sha]);
      return { sha, wasDirty: dirty, confirmed };
    }

    default:
      throw new StoreError('validation', `unknown verb "${verb ?? ''}". Usage: fgos <version|init|add|submit|discover|plan|move|retrospective|cleanup|compound|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status|main-checkout-reset> ...`);
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
        lines.push(formatCheck(true, `fix: ${f.id}`, f.message));
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
    if (typeof data.skillWrappersGenerated === 'number') {
      lines.push(
        formatCheck(
          true,
          data.skillsSourceCopied
            ? `copied .agents/skills and generated ${data.skillWrappersGenerated} .claude/skills wrapper(s)`
            : `regenerated ${data.skillWrappersGenerated} .claude/skills wrapper(s)`,
          '.agents/skills is the canonical source',
        ),
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

// tsk-56t D2: the read verbs the decision names — not every
// `requiresExistingStore: false` verb (that set also includes `session`/
// `setup`/`doctor`, which never touch `.fgos/` at all, and `init`, which
// gets its own opposite linked-worktree refusal above). `schedule` added
// by tsk-3u2 (post-tsk-3c7 independent review): it reads the exact same
// store state `conflicts` does, but was missing here — from a linked
// worktree with no `.fgos/`, it silently returned `{waves:[],cycles:[]}`
// (indistinguishable from "graph clean") instead of this warning.
//
// `gate-bypass`/`doc-sources`/`lock-status` added by tsk-3g5 (post-tsk-3u2
// independent review, same audit gap this set has already been widened
// twice for): all three are `requiresExistingStore: false` and share the
// identical bug class. `gate-bypass` is the sharpest instance —
// unwarned, it reports a CONFIDENTLY WRONG safety-policy level from a
// worktree (verified: `"off"` from a `.fgos/`-less worktree vs the real
// main checkout's `"standard"`) rather than an honestly-empty result, the
// opposite direction of "looks safer than reality" a caller checking
// bypass posture needs to be warned about. `doc-sources` silently returns
// `count: 0` (indistinguishable from "no captures exist"); `lock-status`
// is structurally forced to report the lock as `free` with no store to
// read a real lock state from.
// `evolve` added by tsk-5iv D3 (round-3 review, MEDIUM): same bug class
// again -- `requiresExistingStore: false`, silently returns `[]` (an
// empty-store `rankCandidates` result) from a `.fgos/`-less worktree
// instead of its real candidate list. This is the fourth time this set
// has been widened for the identical gap (tsk-3u2, tsk-3g5, now this).
//
// `docs-index` was investigated for the same fix (CONTEXT.md D3 originally
// named it too) and found NOT to belong here: verified by reading its own
// handler (the `docs-index` case above) -- its `docPath`/`title` entries
// come from a real `fs.readdirSync` scan of `docs/` under `repoRoot`
// (`path.dirname(dir)`), which is correct and complete regardless of
// whether `.fgos/` exists, and its `sourceCaptureId` bookkeeping already
// has its own dedicated degrade-safe guard (`storeReachable`, tsk-f31,
// just above: preserves a doc's prior `sourceCaptureId` instead of
// regressing it to null when the store is unreachable). Adding this
// verb's generic "this view may be empty" warning would be actively
// MISLEADING here -- its view is never empty or wrong from a worktree --
// so it stays out, correcting CONTEXT.md D3's original premise for this
// one verb with real evidence found during implementation.
//
// `main-checkout-reset` is deliberately NOT added here either: it is
// destructive, not merely read-stale, and tsk-5iv D1 above gives it its
// own hard refusal instead of a soft warning.
const STORE_MISSING_WARNING_VERBS = new Set([
  'list', 'ready', 'graph', 'stale', 'check', 'rollup', 'show', 'conflicts', 'triage', 'schedule',
  'gate-bypass', 'doc-sources', 'lock-status', 'evolve', 'recheck-blocked',
]);

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
    // tsk-56t D2: these read verbs are `requiresExistingStore: false` by
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
