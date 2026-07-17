// github-adapter.mjs — the GitHub transport for the local approval gate
// (github-adapter D1-D4). Wraps three `gh` CLI calls — create, status, merge —
// behind an outcome family mirroring mergeRunnerItem's, so a later E3 wiring
// slice can dispatch a runner-sourced item's diff-review + merge to GitHub
// without forking the internal gate's FSM/failure contract (pr-lifecycle D1/D3).
//
// SCOPE (D4): this module is transport only. It never runs or references local
// verify/goal-check — merge/verify EXECUTION stays on the local checkout — so a
// `verify-fail` outcome is out of scope here; it is produced downstream by E3's
// wiring, not by this module. It also never imports merge.mjs or fgos.mjs, and
// never touches state. Pushing the branch to origin is the caller's job (S1):
// createGitHubPR only creates a PR against an already-pushed head.
//
// CREDENTIALS (D2): auth is delegated entirely to the `gh` CLI's own store
// (`gh auth login`). This module stores no token and never reads, prints, or
// logs one — only gh's own stderr (which names failures like "HTTP 401: Bad
// credentials", never the token itself) is surfaced as a failure detail.
//
// FAILURE CONTRACT (D3): every `gh` CLI/API failure at any of the three wrapped
// calls resolves a `blocked` outcome carrying a reason from classifyGhFailure —
// it never throws for a defined gh-side failure (mirroring mergeRunnerItem's
// never-throw-for-a-defined-outcome convention). A throw is reserved for a
// caller programming error (missing required args). There is deliberately no
// distinct merge-failure subclass in this slice: S1 never observed a real
// conflicting PR, so which mergeable/mergeStateStatus value signals a conflict
// is unproven, and guessing one would silently fork D3 on an assumption. Any
// merge-time failure (including a real conflict) folds into `blocked`+reason
// like any other gh failure; a distinct outcome for it waits on real evidence.
//
// RETURN SHAPE: every exported call resolves `{outcome, step, ...}` where step
// is exactly 'create' | 'status' | 'merge' naming which wrapped gh call it came
// from — so a cold caller never has to guess which field to read.

import { execFileSync } from 'node:child_process';

/** Run the `gh` binary (injectable via `opts.ghCommand` so tests can substitute
 * a fake executable) directly as a binary — argv array, `shell:false`, never a
 * shell string. Mirrors merge.mjs's private `git(repoRoot, args)` helper.
 * Throws execFileSync's error on a non-zero exit (callers classify it). */
function gh(repoRoot, args, opts = {}) {
  const command = opts.ghCommand || 'gh';
  return execFileSync(command, args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ghErrorDetail(err) {
  const stderr = err && err.stderr != null ? String(err.stderr) : '';
  return (stderr || (err && err.message) || '').trim();
}

function blockedFrom(step, prNumber, err) {
  return {
    outcome: 'blocked',
    step,
    prNumber,
    reason: classifyGhFailure({ status: err && err.status, stderr: err && err.stderr }),
    detail: ghErrorDetail(err),
  };
}

/**
 * Map a failed `gh` invocation to a D3 reason string. Pure — no subprocess, so
 * it is directly unit-testable. Classification is driven by stderr text, NOT by
 * exit code: S1 proved a present-but-invalid token surfaces as exit code 1 with
 * `HTTP 401: Bad credentials`, not the docs' exit-4 "authentication required"
 * convention — so exit 4 is never assumed to be the only auth-failure signal.
 */
export function classifyGhFailure({ status, stderr } = {}) {
  const text = stderr == null ? '' : String(stderr);
  if (text.includes('HTTP 401') || text.includes('Bad credentials')) {
    return 'auth-failure';
  }
  if (/rate limit/i.test(text)) {
    return 'rate-limited';
  }
  if (/could not resolve host|no such host|network is unreachable|connection refused|dial tcp|i\/o timeout|timed out|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/i.test(text)) {
    return 'unreachable';
  }
  return 'gh-invocation-failed';
}

/**
 * Create a GitHub PR for an ALREADY-PUSHED head branch. Does not push the
 * branch itself (S1: pushing to origin stays the caller's responsibility).
 * Resolves `{outcome:'created', step:'create', prNumber}` on success, parsing
 * the PR number from gh's printed `https://.../pull/<n>` URL (S1 ANSWER1: the
 * only output to parse). Any gh failure resolves `{outcome:'blocked',
 * step:'create', prNumber:null, reason, detail}`.
 */
export async function createGitHubPR(repoRoot, { head, base, title, body = '' } = {}, opts = {}) {
  if (!head || !base || !title) {
    throw new TypeError('createGitHubPR requires head, base, and title');
  }
  let stdout;
  try {
    stdout = gh(repoRoot, ['pr', 'create', '-H', head, '-B', base, '--title', title, '--body', body], opts);
  } catch (err) {
    return blockedFrom('create', null, err);
  }
  const match = String(stdout).match(/\/pull\/(\d+)/);
  if (!match) {
    return {
      outcome: 'blocked',
      step: 'create',
      prNumber: null,
      reason: 'gh-invocation-failed',
      detail: `could not parse a PR number from gh output: ${String(stdout).trim()}`,
    };
  }
  return { outcome: 'created', step: 'create', prNumber: Number(match[1]) };
}

/**
 * Read a PR's merge status, polling while `mergeable === "UNKNOWN"` (S1
 * ANSWER2: GitHub computes mergeability asynchronously, so an immediate read
 * can transiently read UNKNOWN). Bounded by `opts.pollTimeoutMs` with
 * `opts.pollIntervalMs` between reads — never a single unconditional read, and
 * never an unbounded hang: once the budget is exhausted it resolves the
 * last-seen value. Resolves `{outcome:'viewed', step:'status', prNumber,
 * ...settledJsonFields}`; a gh failure resolves `{outcome:'blocked',
 * step:'status', prNumber, reason, detail}`.
 */
export async function viewGitHubPRStatus(repoRoot, prNumber, opts = {}) {
  if (prNumber == null || prNumber === '') {
    throw new TypeError('viewGitHubPRStatus requires a prNumber');
  }
  const pollIntervalMs = opts.pollIntervalMs ?? 1000;
  const pollTimeoutMs = opts.pollTimeoutMs ?? 10000;
  const deadline = Date.now() + pollTimeoutMs;
  let lastFields = null;

  for (;;) {
    let stdout;
    try {
      stdout = gh(
        repoRoot,
        ['pr', 'view', String(prNumber), '--json', 'state,mergeable,mergeStateStatus,mergedAt,closed,closedAt'],
        opts,
      );
    } catch (err) {
      return blockedFrom('status', prNumber, err);
    }
    try {
      lastFields = JSON.parse(stdout);
    } catch {
      return {
        outcome: 'blocked',
        step: 'status',
        prNumber,
        reason: 'gh-invocation-failed',
        detail: `unparseable gh --json output: ${String(stdout).trim()}`,
      };
    }
    if (lastFields.mergeable !== 'UNKNOWN' || Date.now() >= deadline) {
      return { outcome: 'viewed', step: 'status', prNumber, ...lastFields };
    }
    await sleep(pollIntervalMs);
  }
}

/**
 * Merge a PR via `gh pr merge <n> --merge`. Lets GitHub settle mergeability
 * first by calling viewGitHubPRStatus (forwarding the same opts, so an internal
 * call never hits the real gh when the caller supplied a fake) — but does NOT
 * read the settled mergeable value to branch on it: conflict detection is out
 * of scope for this slice. Resolves `{outcome:'merged', step:'merge',
 * prNumber}` on a clean merge. Any gh failure resolves `{outcome:'blocked',
 * step, prNumber, reason, detail}` — step is 'status' when the internal status
 * read failed, 'merge' when the merge call itself failed.
 */
export async function mergeGitHubPR(repoRoot, prNumber, opts = {}) {
  if (prNumber == null || prNumber === '') {
    throw new TypeError('mergeGitHubPR requires a prNumber');
  }
  const status = await viewGitHubPRStatus(repoRoot, prNumber, opts);
  if (status.outcome === 'blocked') {
    return status;
  }
  try {
    gh(repoRoot, ['pr', 'merge', String(prNumber), '--merge'], opts);
  } catch (err) {
    return blockedFrom('merge', prNumber, err);
  }
  return { outcome: 'merged', step: 'merge', prNumber };
}
