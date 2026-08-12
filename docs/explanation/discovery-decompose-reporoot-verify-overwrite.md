# Why `fgos discover` could overwrite an already-locked `verify` command

`resolveDiscovery` (`src/intake/discovery.mjs`) and `resolveDecompose`
(`src/intake/plan.mjs`) both have a trust-signal shortcut: if the
item's `docsRef` already points at a committed, locked `CONTEXT.md`/
`plan.md`, skip the model judge entirely and advance the stage directly
(`readLockedContext`, `tsk-ozl` D1-D3). In the standard interactive
workflow, that shortcut never actually fired — for a structural reason,
not bad luck.

## The repoRoot bug

Both functions compute:

```js
const repoRoot = path.dirname(dir); // dir is always the main checkout's .fgos, per --dir/ADR0020
```

then call `readLockedContext(repoRoot, work.docsRef)` — a plain
`fs.readFileSync` against `path.join(repoRoot, docsRef)`. But
`fgos-coding-exploring`/`fgos-coding-planning` commit `CONTEXT.md`/`plan.md` to the
item's own `fgw/<id>` branch/worktree — never to main, which has no idea
those files exist until later merge. So `readLockedContext` always reads
from the wrong physical directory and always finds nothing, in exactly
the scenario (an interactive session already did the real reasoning) the
shortcut exists to serve.

> Confirmed live for `tsk-3sw`: after `fgos-coding-exploring` committed
> `CONTEXT.md` and got `contextApprove` approved, `fgos discover tsk-3sw`
> still spawned a full nested `judgeDiscovery` call instead of skipping,
> producing a wrong verify guess (a docs-grep check for what was really a
> code change) that had to be manually corrected.

`decompose.mjs` has the identical `repoRoot` bug, but its own
verify-handling is otherwise already correct (see below) — confirmed by
grepping `plan.md`/`CONTEXT.md` for the mode-skip markers and finding zero
matches, so `decompose.mjs`'s mode-skip branch could not have fired
either; it fell through to a real `judgeDecompose` call that happened to
coincidentally agree with the human-approved plan — luck, not a plumbing
guarantee.

## Why the existing test suite never caught it

`test/intake/discovery.test.mjs`'s `mkLockedContextFixture` builds its
`CONTEXT.md` fixture as `path.dirname(storeDir)`'s child — deliberately
constructing `repoRoot == content-root` by fixture design, with its own
comment stating this "exactly matches `readLockedContext`'s real
`path.join(repoRoot, docsRef)` resolution." The fixture validates the
function's internal logic in isolation; it never models the real
git-worktree topology (state root always main per ADR0020, content root
the item's own separate `fgw/<id>` checkout) that breaks it in
production.

## The second, compounding bug: unconditional verify overwrite

`resolveDiscovery` additionally writes `verdict.verify` — `judgeDiscovery`'s
own model guess — straight onto `work.verify` on every clear verdict, with
no check for whether the item already carries a real, locked `verify`
from a later stage (e.g. `fgos-coding-validating`'s `planApprove.verify` gate
record):

```js
moveStage(..., { verify: verdict.verify ?? FALLBACK_VERIFY, ... })
```

Concrete incident (`tsk-5e97`): `fgos-coding-validating` explicitly set
`item.verify` to a real, narrow, already-passing command (`node --test
test/intake/plan.test.mjs`) and locked it in `plan.md`'s
Proof-surface section. Only afterward did the session realize
`fgos-coding-exploring`'s own `CONTEXT.md` lock had never actually been released
through the `discover` verb (because of the repoRoot bug above), so it ran
`fgos discover tsk-5e97` — and that call's own `judgeDiscovery` verdict
carried a different, broader verify guess (`npm test`, the whole suite)
which `resolveDiscovery` wrote over the already-locked, already-correct
value with no warning. The first `fgos return` then re-ran that broad
`npm test` and failed on 2 pre-existing unrelated repo tests, moving the
item to `blocked` — a false-negative return failure caused entirely by
the overwrite, not by the item's actual implementation (64/64 on the
correct narrow command).

A third occurrence (`tsk-480`) was worse: `judgeDiscovery`'s verdict wrote
a long prose blob over an already-locked, real, passing command — not
even a runnable shell command. Caught only because `item.verify` is
`spawn()`'d raw (`src/runner/goal-check.mjs:23`) and the prose failed
outright.

`decompose.mjs` does **not** have this class of bug: it reads
`gates[id].planApprove.verify ?? work.verify` **once** (line 431) and
reuses that single value unconditionally at every `moveStage`-to-
`executing` call site, regardless of skip-vs-real-judge path —
`decompose.mjs` already does correctly what `discovery.mjs`'s fix needed
to match.

## Fix status

D1's `decompose.mjs` half is implemented (`tsk-1ni-1`): a new
`resolveContentRoot` helper tries `process.cwd()`, then `git worktree list`
for `fgw/<id>`, then falls back to the state root — resolving the real
content root instead of the buggy `path.dirname(dir)` derivation above.
Real commit (`5d9b50c`, `src/intake/plan.mjs`, +55/-1 lines):

> resolveContentRoot tries process.cwd(), then git worktree list for
> fgw/<id>, then falls back to stateRoot. Fixes readLockedContext's
> trust-signal check AND the scoutContext repoRoot feeding
> readScoutNotes/writeScoutNotes -- same variable, same bug, same fix.

`discovery.mjs`'s own D1 half (wiring the same helper into
`resolveDiscovery`) plus D2's verify-overwrite guard are separate sibling
items (`tsk-1ni-2`); the two test-fixture items (`tsk-1ni-3`,
`tsk-1ni-4`) update `decompose.test.mjs`/`discovery.test.mjs` to stop
constructing `repoRoot == content-root` by fixture design (the reason,
above, the bug went uncaught).

`discovery.mjs`'s own D1+D2 half is implemented (`tsk-1ni-2`, commit
`f3556bf`): `resolveDiscovery` now computes `repoRoot =
resolveContentRoot(stateRoot, id, work.docsRef)` instead of the bare
`path.dirname(dir)`, reused for both `readLockedContext`'s own read and
`judgeDiscovery`'s `scoutContext` (`readScoutNotes`/`writeScoutNotes` —
"same variable, same bug, same fix" as the commit message puts it). D2's
guard is a new `hasRealVerify(verify)` helper — true when `verify` is a
non-empty string that is neither `FALLBACK_VERIFY` nor the newly-exported
`RETIRED_P14_PLACEHOLDER` sentinel — applied at **both** the
skip-and-advance `moveStage` call (locked `CONTEXT.md` found) and the
real-judge clear-verdict `moveStage` call: whichever path fires,
`work.verify` wins over the fresh guess whenever it already counts as
real.

> commit message: "D1: wire resolveContentRoot (decompose.mjs) into
> resolveDiscovery's readLockedContext call and judgeDiscovery's
> scoutContext -- same fix shape as resolveDecompose. D2: never let
> judgeDiscovery's own verdict.verify overwrite an existing non-empty,
> non-placeholder work.verify -- applies to both the skip-and-advance
> path and the real-judge path, per plan.md."

The proof-surface items closed the "existing test suite never caught it"
gap named above. `tsk-1ni-3` (commit `39858ab`) added real
`decompose.test.mjs` coverage for `resolveContentRoot`'s three branches
against `resolveDecompose`: existing `mkPlanFixture` tests keep passing
unchanged (`stateRoot == content-root` by construction, exercising branch
3 — the fallback — incidentally), plus new tests using a real git
repo/worktree to exercise branch 1 (`process.cwd()`) and branch 2 (`git
worktree list` for `fgw/<id>`) explicitly, so the fixture no longer
coincidentally hides the bug the way `mkLockedContextFixture` did.

`tsk-1ni-4` (commit `adda649`) did the same for `discovery.test.mjs`:
two real-git end-to-end tests through `resolveDiscovery`'s skip path
(`process.cwd()` hit, and a real registered `fgw/<id>` worktree hit — the
crash-recovery case), since `resolveContentRoot`'s own internals were
already covered directly by `tsk-1ni-3`'s `decompose.test.mjs` tests; plus
D2 coverage — three tests for the new "already real" branch of the
verify-overwrite guard on both the skip-and-advance and real-judge paths,
and one confirming the placeholder-fills-in-guess direction stays
unchanged. All four sibling items (`tsk-1ni-1` through `tsk-1ni-4`) are
now closed — the D1/D2 fix and its proof surface are both real and
merged, not just planned.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix the repoRoot bug in **both** `resolveDiscovery` (discovery.mjs:518) and `resolveDecompose` (decompose.mjs:438) — not narrowed back to discovery.mjs only, since `tsk-3sw` independently confirmed the identical symptom on the decompose side. |
| D2 | In addition to D1, add a narrower guard in `resolveDiscovery` (discovery.mjs:577): never overwrite an existing non-empty/non-placeholder `work.verify` with `judgeDiscovery`'s own `verdict.verify` guess. Defense-in-depth on top of D1, not instead of it — even though D1 alone already stops the overwrite in every traced scenario via skip-and-advance, the D1 fix depends on the content actually being reachable; D2 protects the case where it still isn't for some other reason. |
| D3 | Scope stays at the repoRoot bug (D1) and the verify-overwrite guard (D2). The Native-First Dispatch Doctrine's (`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`) still-open "where does the native-vs-cli/spawn decision layer live" question is read for context only — this fix is necessary evidence toward that doctrine, not an attempt to resolve it. |

## Terms

- **repoRoot bug** — `repoRoot = path.dirname(dir)` deriving the content
  root for `readLockedContext` from the state-root `dir` (always main
  checkout per ADR0020), when the actual committed `CONTEXT.md`/`plan.md`
  live in the item's own separate `fgw/<id>` worktree.
- **content root** — the caller's live working directory (the worktree an
  interactive `fgos-coding-exploring`/`fgos-coding-planning` session is standing in),
  distinct from the state root (`dir`, always main).
- **verify-overwrite guard** (D2) — the check in `resolveDiscovery` that
  skips writing `verdict.verify` over an existing non-empty,
  non-placeholder `work.verify`.

## Related

- `docs/history/discovery-decompose-reporoot-verify-overwrite/CONTEXT.md`
  — full decision record and scout evidence.
- `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md`
  (`tsk-ozl`) — the trust-signal shortcut this fix makes actually reachable
  for the first time in the standard interactive workflow.
- `docs/explanation/fgos-discover-verify-path-drift.md` — a related but
  distinct `verify`-correctness issue (a wrong path guess for a
  never-locked value, not an overwrite of an already-locked one).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — cites this bug as live evidence for a separate, still-open doctrine
  question; explicitly out of scope here (D3).
