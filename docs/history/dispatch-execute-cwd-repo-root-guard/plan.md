# dispatch-execute-cwd-repo-root-guard — plan.md

Mode: high-risk (4 flags: touches a public contract — `dispatch.mjs
execute`/`decide`'s CLI flags are documented and relied on by `AGENTS.md`'s
Dispatch section and every coding-domain skill via
`../_shared/executor-dispatch-fallback.md`; touches external-system
dispatch — the module that talks to out-of-process executors (agy, claude,
codex); touches existing covered behavior — `test/runner/dispatch.test.mjs`
already has ~2600 lines of coverage on `execute`/`decide`/`spawnWorker`
that must stay green; weak proof around the area — two real production
incidents (this item, tsk-22bm) already happened here with root cause
only partially confirmed).

`fgos graph --json`: tsk-322 has no `deps`, is not on the reported
`criticalPath` (`{"depth":10,"path":["tsk-4vo","tsk-3t9",...]}`, tsk-322
absent), and nothing in `topUnblock` names it — a leaf bug-fix item with
no downstream items waiting on it. This lowers blast-radius urgency but
does not lower the CODE-touch risk (a widely-called shared CLI surface),
which is what actually drove the `high-risk` count above.

## Approach

RESEARCH.md Round 1 already reproduced and narrowed the real mechanism:

1. **Confirmed by a live synthetic repro** (throwaway script, not kept):
   `dispatch.mjs execute`'s own `cwd` resolution (`src/runner/dispatch/
   cli.mjs:826-834`, `executeExecutorCli`'s `cwd = process.cwd()` default
   at `cli.mjs:335`) already correctly defaults to the CALLING PROCESS's
   real `process.cwd()`, unaffected by `--repo-root` — no code-level bug
   found in the cwd-vs-repoRoot plumbing itself.
2. **The real incidents' actual cause is upstream** of this file (the
   calling session's own process cwd was apparently already wrong by the
   time the real `execute` call ran) — out of this repo's control, not
   fixable in `src/`.
3. **The fixable gap**: nothing in `dispatch.mjs`'s own CLI code notices
   or warns when `--repo-root` is given without `--cwd`/`--dir` — exactly
   the shape every real incident shared. Add a guard: when `--repo-root`
   is passed to `execute`/`decide` and `--cwd`/`--dir` is NOT, compare
   `process.cwd()` (resolved to its own main-checkout root via the same
   `resolveMainCheckoutRoot` helper `cli.mjs:366` already uses) against
   the passed `--repo-root`. If they resolve to the SAME real path,
   proceed unchanged (the common, safe case — e.g. running from the main
   checkout itself with an explicit, redundant `--repo-root`). If they
   differ, or `process.cwd()` cannot be resolved to a main-checkout root
   at all (a strong signal `process.cwd()` is itself a linked worktree),
   **refuse** with a clear, actionable error naming both paths and
   instructing the caller to pass `--cwd` explicitly — mirroring this
   repo's existing fail-closed convention for exactly this class of
   footgun (`main-checkout-reset`'s own `--confirm`-gated refusal shape).

Files touched: `src/runner/dispatch/cli.mjs` (the guard, in both
`execute` and `decide`'s CLI branches — cli.mjs:826-834 and 856-863
share the identical `--cwd`/`--dir`/`--repo-root` flag shape) and
`test/runner/dispatch.test.mjs` (new tests).

Risk map: high — this is a widely-called shared CLI surface with a large
existing test suite. Proof point required before this plan is trusted:
run the FULL existing `dispatch.test.mjs` suite (not just new tests)
after the change, unmodified assertions, to confirm no existing caller
that legitimately passes only `--repo-root` (e.g. running from the main
checkout itself) gets a new false-positive refusal — `fgos-coding-
validating`'s own feasibility matrix carries this as its one row.

Alternatives rejected: (a) making `--cwd` unconditionally required
whenever `--repo-root` is passed, even when they'd resolve to the same
path — rejected as needlessly stricter than the actual risk (the risk is
DIVERGENCE, not the mere presence of `--repo-root` alone), and would
break any existing caller passing `--repo-root` alone from the main
checkout; (b) silently defaulting `cwd` to `repoRoot` instead of
`process.cwd()` when only `--repo-root` is given — rejected, this
inverts today's already-correct default (confirmed by RESEARCH.md's
repro) and would silently reintroduce a DIFFERENT wrong-cwd class for a
caller that intentionally relies on the `process.cwd()` default with no
flags at all.

## Shape

1. In `src/runner/dispatch/cli.mjs`, factor a small shared helper (used by
   both the `execute` and `decide` CLI branches) that, given
   `{cwdFlag, dirFlag, repoRootFlag}`, throws a `RunnerConfigError` (the
   same error class this file already throws for other usage errors, e.g.
   `cli.mjs:357`) with a message naming both the resolved
   `process.cwd()`-as-main-checkout-root value (or "not a main checkout"
   when unresolvable) and the passed `--repo-root` value, when they
   diverge and no explicit `--cwd`/`--dir` was given.
2. Wire the helper into both the `execute` branch (`cli.mjs:826-834`) and
   the `decide` branch (`cli.mjs:856-863`), before their existing
   `executeExecutorCli`/`decideExecutorCli` calls.
3. Add tests to `test/runner/dispatch.test.mjs`: (a) `--repo-root` alone,
   `process.cwd()` resolves to a DIFFERENT main checkout — refuses with a
   clear error, no worker spawned; (b) `--repo-root` alone,
   `process.cwd()` resolves to the SAME path — unchanged, worker spawns
   normally; (c) both `--cwd` and `--repo-root` given (any values) —
   unchanged, no guard fires; (d) neither given — unchanged, existing
   default-`process.cwd()` behavior untouched. Reuse this file's own
   `mkTempGitRepo`/fake-executor helper patterns already used by the
   neighboring `execute` CLI tests (~line 2476).
4. Run the FULL `test/runner/dispatch.test.mjs` suite (the proof point
   from the risk map above), not just the four new cases, before
   considering this done.

## Outstanding questions

None.
