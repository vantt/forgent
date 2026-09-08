# Wave 1 integration fix: `--cwd` semantics, `test/cli/coordination.test.mjs`

Track: `group-thinking-plan-loop`. Worktree branch:
`worktree-agent-aab985cbc0a843340` (fast-forwarded onto `group-thinking-plan-loop`
@ `c2ac5b6a` before starting — see "Pre-existing environment issue" below).

## What was wrong

P01.1 (mutation-unlock kernel cell, merged) fixed a real R8 bug in
`src/runner/coordination/store.mjs`'s `resolveCoordinationPaths`:
`fgosDir` now derives from `resolveCoordinationPaths`'s resolved `root`
(`opts.repoRoot` when present, else a `cwd`-based fallback), never from raw
`cwd` unconditionally. Before the fix, `fgosDir = fgosDirFromRoot(cwd)` ran
**unconditionally**, ignoring `opts.repoRoot` even when the caller passed it
explicitly.

P02.1 (chain verb + `--cwd` flag, merged) wrote its own CLI tests
(`test/cli/coordination.test.mjs`, "R7: `--cwd <path>`" section) against a
worktree state that still had the R8 bug. Those tests asserted the
opposite of what's now true: that `fgos coordination run/show --cwd
<worktree>` causes session state to land under the **worktree's** own
`.fgos/`. Traced the real code (`bin/fgos.mjs`'s `coordination` case,
lines ~3117-3191): `repoRootForCoordination` is computed independently of
`--cwd` (`flags.dir !== undefined ? path.dirname(dir) : process.cwd()`),
and `repoRoot: repoRootForCoordination` is **always** passed explicitly to
`runCoordinationUseCase`/`showCoordinationUseCase`/`chainCoordinationUseCase`.
Since `resolveCoordinationPaths` now honors `opts.repoRoot` unconditionally,
`--cwd` has zero effect on session/Assignment storage location — it only
ever threads into `ctx.cwd`.

Confirmed with `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
test/cli/coordination.test.mjs` before any edit: exactly the 2 documented
failures (lines ~454, ~481), 37/39 pass otherwise.

## Pre-existing environment issue found and resolved first

This worktree's branch (`worktree-agent-aab985cbc0a843340`) was, at
session start, **behind** `group-thinking-plan-loop`'s current tip: HEAD
was `aedfe0a3` (an ancestor of `group-thinking-plan-loop`'s `c2ac5b6a`,
zero divergent commits of its own), so `store.mjs` still had the R8 bug
present, contradicting the task's own premise ("already has BOTH cells
P01.1 and P02.1 merged in"). Fast-forwarded with `git merge --ff-only
group-thinking-plan-loop` (safe — pure ancestor relationship, confirmed via
`git merge-base`, no commits lost) before starting real work. Verified R8
fix present afterward (`store.mjs:66-74`, `fgosDir = fgosDirFromRoot(root)`).

## Changes made

### `test/cli/coordination.test.mjs`

- Removed the unused `openSession` import (only used by the now-rewritten
  `show --cwd` test).
- Added `initGitCwdWithWorktree` to the harness import list (already
  exported by `test/cli/helpers/fgos-cli-harness.mjs`, a real `git init` +
  real `git worktree add` fixture builder — reused rather than
  reinvented).
- Added `writeCwdMarkerExecutorConfig(repoRootDir, assignmentsRoot)`: a
  fake-executor variant that writes a marker file into its own
  `process.cwd()` before settling the assignment. `assignmentsRoot` is an
  explicit parameter (never derived from the worker's own
  `process.cwd()`), mirroring
  `test/runner/coordination-mutation-unlock.test.mjs`'s own `fakeExecutor`
  — because `.fgos/assignments/` always lives under `repoRoot` (R8),
  which genuinely diverges from the worker's own cwd exactly in the
  `--cwd` case these tests exercise.
- Rewrote the first R7 test ("run --cwd") to assert two things, both real
  filesystem facts:
  1. Session storage is governed by `repoRoot`, never relocated by
     `--cwd` — `session.json` lands under the repo root's `.fgos/`, never
     under the `--cwd` worktree's.
  2. `ctx.cwd` genuinely threads to the dispatched worker's own
     subprocess cwd — proven by the marker file landing under the
     `--cwd` worktree when `--cwd` is given, and under the repo root when
     `--cwd` is omitted (two separate dispatches, same repoRoot, only
     `--cwd` differs).
  Deliberately does **not** assert `run`'s own success/`closed` status: the
  marker write is a real, uncommitted change inside a real git worktree, so
  R1's own pre-existing read-only-contract enforcement
  (`classifyRunEvidence`, `assignment-runner.mjs`: a read-only-declared
  Assignment that mutates repo state fails closed) correctly grades the
  dispatch as failed. That's expected, working-as-designed behavior,
  unrelated to what the test proves — not worked around by asserting a
  fake "verified" grading.
- Rewrote the second R7 test ("show --cwd") per option (a) from the task:
  proved `show` reads **identically** regardless of `--cwd`, since
  `showCoordinationUseCase` passes `ctx.repoRoot` straight to
  `readManifest`/`readSessionEvents`/etc — `ctx.cwd` is used ONLY for
  `loadCoordinationProtocol` (declared-protocol `pendingDriverAuthorizations`
  rendering), wrapped in try/catch that degrades to `null` rather than
  failing `show` outright. Verified this by reading `show.mjs` directly
  (`src/verbs/coordination/show.mjs:159-312`). The rewritten test opens
  one session at the repo root, then calls `show` three ways (`--cwd`
  omitted, `--cwd <real linked worktree>`, `--cwd <unrelated dir>`) and
  asserts identical success/`coordinationId` every time.
- Left the third test ("`--cwd` OMITTED behaves byte-identically to
  today") untouched after review — it never passes `--cwd`, so `cwd`
  serves as both `repoRoot` and `ctx.cwd`; its own claim was and remains
  accurate.

### Deviation from the task's literal R3-mutation-gate instruction (disclosed, not silent)

The task asked me to prove `ctx.cwd` reaches the dispatched worker via
R3's own mutation-gate refusal ("dispatch a MUTATING step... confirm R3's
own refusal behavior differs"). While implementing this I discovered
`src/verbs/coordination/run.mjs` (the CLI's own use-case module) **never
forwards a request step's `mutation` field to `dispatchDeclaredOperation`
at all** — `grep -n "mutation" src/verbs/coordination/run.mjs` finds zero
matches. This is a real, already-documented, pre-existing gap (found
independently by P01.1's own trace at 4+ separate points, e.g.
`P01.1.md:1344`: "`step.mutation` is never read or forwarded"). The
mutation-unlock feature (R1-R3, `assertMutatingDispatchAllowed`) is
engine-level-only today — reachable only via direct JS calls to
`dispatchDeclaredOperation` (exactly how
`coordination-mutation-unlock.test.mjs` exercises it), never through
`fgos coordination run --file <request>`.

Given this, a CLI-subprocess-level test that dispatches a
`mutation: "mutating"` step can never reach R3 at all — `mutation`
silently defaults to `'read-only'` internally, making R3 a structural
no-op regardless of `--cwd`. Writing a test around this would either be
misleading (asserting "R3 didn't refuse" for the wrong reason) or require
extending `run.mjs` to thread `step.mutation` through — a real feature
change to kernel-adjacent coordination code, well outside this fix's file
ownership and authorized scope (`run.mjs` is not in my task's authorized
file list, and such a change needs its own review/red-team cycle per this
repo's own governance for `src/runner/coordination/**`).

Per the task's own standard for the `show` test ("if you find a real
reason... investigate and report your finding rather than asserting
either way blind"), I applied the same standard here: substituted a
different, but equally real and CLI-reachable, proof that `ctx.cwd`
threads through — the dispatched worker's own subprocess cwd (verified by
reading `assignment-runner.mjs:673-919`: `executeAssignment` computes
`const cwd = opts.cwd ?? process.cwd()` and passes it straight to
`executeExecutorCli(executorId, { cwd, repoRoot: root, ... })`, so the
worker subprocess's own `process.cwd()` really is `ctx.cwd`). This is
documented explicitly in the test file's own R7 section header comment
(`test/cli/coordination.test.mjs:502-523`) so a future reader understands
why the test doesn't use `mutation: "mutating"`.

**This is a genuine, real, currently-open follow-up gap worth surfacing
separately**: `fgos coordination run --file <request>` cannot dispatch a
mutating declared-protocol step at all today, even though the schema
(`src/verbs/coordination/schema.mjs`) accepts `mutation: "mutating"` on a
request file's `operation` step and silently drops it. Not fixed here
(out of this fix's scope) — flagging for the Coordinator's own backlog
judgment.

### `src/verbs/coordination/chain.mjs`

Corrected a comment on `renderCell` (line ~78) that attributed
broken/corrupt/unreadable-session fault isolation specifically to "a
genuinely diverged `--cwd`" — now explains that R8 means `--cwd` alone can
no longer diverge storage/read location the way the comment used to
assume, and that fault isolation matters for ANY read failure, not
specifically `--cwd`.

### `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P02.1.md`

Added two `**[CORRECTED post-merge, Wave 1 integration fix]**` annotations
(matching the established correction style already used in `P01.1.md`'s
own Fix Round 4 entry — a marked addition, never a silent rewrite of the
historical record):

1. After the "R7 Gap's basic shape" Confirmed-safe bullet: notes the
   "orphaned `dispatch.claim`"/"session becomes unreadable" claims were
   true only against P02.1's own pre-merge worktree state.
2. After the "R7 partial" Gap paragraph: notes the "session/claim files
   land under the worktree" claim is now known-false, explains why
   (R8), and points at the current corrected tests. Explicitly does NOT
   claim to have re-verified whether `assignment-runner.mjs`'s own
   separate `opts.repoRoot`-vs-`opts.cwd` RUN-ARTIFACT split (a distinct,
   still-possibly-real bug named in that same Gap) still reproduces today
   — out of this fix's scope, left as an open question for whoever
   revisits that Gap.

### Files checked, found already correct (no edit)

- `bin/fgos.mjs`'s `coordination` case (lines ~3117-3191): its own
  `--cwd`/`--dir` comment already correctly distinguishes `ctx.cwd` from
  `repoRootForCoordination` — grepped for the wrong framing, found none.
- `docs/how-to/run-a-coordination-session.md`: grepped for `--cwd` —
  zero matches (the doc doesn't mention the flag at all; P02.1.md's own
  Red-Team already noted this as a separate, unrelated LOW documentation
  gap). Left untouched per the task's explicit instruction.

## Verification

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs'
'test/runner/dispatch-*.test.mjs' 'test/runner/assignment-dispatch.test.mjs'
'test/architecture.test.mjs' 'test/cli/coordination.test.mjs'`:

- 717/718 pass. The 1 failure is `test/runner/coordination-static.test.mjs:61`
  — the pre-existing, documented false positive (`FORBIDDEN_IMPORT_SUBSTRINGS`
  matching the literal substring "worktree" against this dispatch
  infrastructure's own `.claude/worktrees/agent-<id>` checkout path).
  Confirmed this is the SAME baseline item (not a new regression) by
  re-running `test/runner/coordination-static.test.mjs` standalone — same
  exact failure list, already recorded in `index.md`'s own "Known
  non-blocking environment finding."
- `test/cli/coordination.test.mjs` alone: 39/39 pass.

Did not touch anything under `src/runner/dispatch/**`, so the
`dispatch.mjs decide --for smoke --needs-soul --has-live-task-access`
re-check named in the task was not required and not run.

## Files modified

- `test/cli/coordination.test.mjs` (two R7 tests rewritten, one helper
  added, one unused import removed, section-header comment added)
- `src/verbs/coordination/chain.mjs` (one comment corrected)
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P02.1.md`
  (two correction annotations added)
