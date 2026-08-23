# CONTEXT — clarify/decompose engines read locked artifacts from the wrong root, and discovery's own verify field has no overwrite guard

Item: tsk-1ni

## Feature boundary

Fixes two related, independently-confirmed bugs in the `clarify`/`decompose`
engines (`src/intake/discovery.mjs`, `src/intake/plan.mjs`):

1. Both `resolveDiscovery` and `resolveDecompose` compute `repoRoot =
   path.dirname(dir)` (the main checkout, per `--dir`/ADR0020) and pass it to
   `readLockedContext` to look for the item's committed `CONTEXT.md`/
   `plan.md`. But `fgos-coding-exploring`/`fgos-coding-planning` commit those files to the
   item's own `fgw/<id>` branch/worktree, never to main — so
   `readLockedContext`'s plain `fs.readFileSync` against
   `path.join(repoRoot, docsRef)` always misses them in the exact scenario
   (an interactive session already did the real reasoning) the trust-signal
   shortcut exists to serve. Both call sites need the real content root
   (the caller's live working directory) threaded in separately from `dir`
   (which must keep resolving state from main, per ADR0020).
2. `resolveDiscovery` additionally overwrites `work.verify` unconditionally
   with `judgeDiscovery`'s own model-guessed `verdict.verify` on every clear
   verdict (`discovery.mjs:577`, `verify: verdict.verify ?? FALLBACK_VERIFY`)
   — with no check for whether the item already carries a real, locked
   `verify` from a later stage (e.g. `fgos-coding-validating`'s `planApprove.verify`
   gate record). `decompose.mjs` already avoids this class of bug: it reads
   `gates[id].planApprove.verify ?? work.verify` ONCE (line 431) and reuses
   that single value at every `moveStage`-to-`executing` call site,
   regardless of skip-vs-real-judge path.

Both bugs are fixed together in this item — D1/D2 below.

## Problem (confirmed by reading the code, live on this branch)

- `discovery.mjs:518-519` — `resolveDiscovery`: `repoRoot =
  path.dirname(dir)`, then `readLockedContext(repoRoot, work.docsRef)`.
  Confirmed still present.
- `discovery.mjs:577` — unconditional `verify: verdict.verify ??
  FALLBACK_VERIFY` on the clear-verdict `moveStage` call. Confirmed still
  present; no check against an existing `work.verify`.
- `decompose.mjs:438-439` — `resolveDecompose`: identical `repoRoot =
  path.dirname(dir)` / `readLockedContext` pattern. Confirmed still present.
- `decompose.mjs:431` — `planApproveVerify = view.gates?.[id]?.planApprove
  ?.verify ?? work.verify`, computed once, reused unconditionally at every
  `moveStage`-to-`executing` site (confirmed lines 433, 467; description
  also names 549, 597). Confirmed: `decompose.mjs` does NOT have discovery's
  own overwrite-class bug — only the shared repoRoot bug.

## Scout evidence

- `src/intake/discovery.mjs:511-542` (`resolveDiscovery`) — trust-signal
  skip-and-advance block (tsk-ozl D1-D3): reads `lockedContext` via the
  broken `repoRoot`, so it can never fire in the standard interactive
  workflow (content always lives in the item's own worktree, never main).
- `src/intake/discovery.mjs:545-580` — the real `judgeDiscovery` call path:
  on a clear verdict, `moveStage(..., verify: verdict.verify ??
  FALLBACK_VERIFY, ...)` with no comparison against the item's current
  `work.verify`.
- `src/intake/plan.mjs:420-470` (`resolveDecompose`) — same repoRoot
  bug; `planApproveVerify` read once at line 431 and passed unconditionally
  into every `moveStage`-to-`executing` call, confirming decompose.mjs's own
  verify-handling is already correct and out of this item's fix scope.
- `test/intake/discovery.test.mjs`'s `mkLockedContextFixture` — builds its
  `CONTEXT.md` fixture as `path.dirname(storeDir)`'s child, deliberately
  constructing `repoRoot == content-root` by fixture design (its own
  comment states this matches `readLockedContext`'s real resolution) — this
  is why 2366 passing tests never caught the repoRoot bug: the fixture
  never models real git-worktree topology (state root always main per
  ADR0020, content root the item's own separate `fgw/<id>` checkout).
- Live-reproduced twice (tsk-5e97, tsk-3sw), per item description: in both
  cases a committed CONTEXT.md existed but the trust signal never fired
  because of the repoRoot bug, so `judgeDiscovery` ran for real and (in
  tsk-5e97's case) its guessed `verify` overwrote an already-correct,
  already-locked value, causing a false-negative `fgos return` failure on 2
  unrelated pre-existing test failures.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md:196`
  — cites this item's repoRoot bug as live evidence for a separate,
  still-open doctrine question (rule 2 enforcement, native-vs-cli dispatch
  layer). Read for context; that doctrine question is explicitly NOT in
  this item's scope (see Locked decisions, D3).
- `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md`
  (tsk-ozl, already merged) — the trust-signal shortcut this item's D1 fix
  makes actually reachable for the first time in the standard interactive
  workflow.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix the repoRoot bug in BOTH `resolveDiscovery` (discovery.mjs:518) and `resolveDecompose` (decompose.mjs:438) — matches the item's own footprint (both files already listed). Not narrowed back to discovery.mjs only: tsk-3sw independently confirmed the identical symptom on the decompose side. |
| D2 | In addition to D1, add a narrower guard in `resolveDiscovery` (discovery.mjs:577): never overwrite an existing non-empty/non-placeholder `work.verify` with `judgeDiscovery`'s own `verdict.verify` guess. Defense-in-depth on top of D1, not instead of it — user explicit: do the best fix, don't skip it for implementation cost, even though D1 alone already stops the overwrite in every traced scenario via skip-and-advance. |
| D3 | This item stays scoped to the repoRoot bug (D1) and the verify-overwrite guard (D2). It does not take on the Native-First Dispatch Doctrine's (0026) still-open "where does the native-vs-cli/spawn decision layer live" question — 0026 is read for context only; this item's fix is necessary evidence toward that doctrine, not an attempt to resolve it. |

## Pinned terms

- **"repoRoot bug"** — `repoRoot = path.dirname(dir)` deriving the content
  root for `readLockedContext` from the state-root `dir` (always main
  checkout per ADR0020), when the actual committed `CONTEXT.md`/`plan.md`
  live in the item's own separate `fgw/<id>` worktree.
- **"content root"** — the caller's live working directory (the worktree an
  interactive `fgos-coding-exploring`/`fgos-coding-planning` session is standing in),
  distinct from the state root (`dir`, always main).
- **"verify-overwrite guard"** (D2) — the new check in `resolveDiscovery`
  that skips writing `verdict.verify` over an existing non-empty,
  non-placeholder `work.verify`.

## Deferred to planning (implementer's job, not locked here)

- Exact shape of the new content-root parameter threaded through
  `resolveDiscovery`/`resolveDecompose`/`readLockedContext` (e.g. an
  explicit `contentRoot` argument vs. deriving it from `process.cwd()` at
  the call site vs. another mechanism) — this item's description names this
  as "likely an explicit separate parameter" but leaves the exact shape to
  planning.
- What counts as "placeholder" for D2's guard — the item's current `verify`
  value is `"chưa xác định — P15 bổ sung"` (the retired P14/P15 placeholder
  string); planning defines the exact placeholder-detection check (e.g.
  reuse of an existing `FALLBACK_VERIFY`/placeholder constant vs. a fresh
  one).
- Test fixture redesign for both files: the existing
  `mkLockedContextFixture` pattern (repoRoot == content-root) must not be
  the only test evidence going forward — planning decides whether this
  needs a new fixture helper or per-test path separation.
- Whether/how the runner's RUL19 sweep (role `runner`) needs separate
  content-root resolution logic vs. the sync `fgos discover`/`fgos
  decompose` verbs (role `session`) — both callers share the same
  `resolveDiscovery`/`resolveDecompose` functions today; planning decides
  whether the content-root source differs by caller.

## Outstanding questions

None — D1-D3 locked with the user in this session.

## Canonical references

- `src/intake/discovery.mjs` — `resolveDiscovery`, engine being fixed (D1,
  D2).
- `src/intake/plan.mjs` — `resolveDecompose`, `readLockedContext`
  (shared helper), engine being fixed (D1 only — verify-handling already
  correct there).
- `docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md`
  (tsk-ozl) — the trust-signal shortcut this item's D1 fix makes reachable.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — cites this item as live evidence; explicitly out of scope (D3).
- `test/intake/discovery.test.mjs` — `mkLockedContextFixture`, the fixture
  whose repoRoot==content-root construction masked D1's bug.
