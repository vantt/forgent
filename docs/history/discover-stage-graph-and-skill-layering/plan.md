# plan.md — tsk-lya: Chẻ picker + sửa prose launcher `discover`

Mode: **standard** (2 flags: public contracts — `discover-next`'s behavior
is consumed by `herdr-plugin`'s auto-launcher, `pick.rs:17,130`; existing
covered behavior — `test/state/discover-pool.test.mjs` already asserts
`pickNextDiscoverItem`'s current pooling shape, which this item narrows).
Fallback lane derivation used (tsk-da1): no `fgos-routing` Orient handoff
was in this session's context (dispatched via `/fgOS:pick` → driving loop,
not via `fgos-routing` directly), and no earlier `Mode:` line existed in
this file — applied `fgos-routing`'s own Mode-gate table directly
(`.claude/skills/fgos-routing/SKILL.md:32-66`) rather than re-deriving its
thresholds inline.

## Approach

D10 (`discover-next` delegates down) and D11 (new `plan-next`/`plan-loop`
pair) are mechanically coupled: `discover-next`'s self-computed-ceiling bug
and the planning pool "ăn ké" problem both trace to one shared pick
function (`pickNextDiscoverItem`, `src/state/discover-pool.mjs`) serving
two unrelated stage groups. Splitting that function is the prerequisite
both D10 and D11 build on — do it first. D8's four prose fixes live
entirely inside `discover/SKILL.md` and have no code dependency on the
pool split; they can land in the same commit set but do not gate or get
gated by it.

**Order** (per `CONTEXT.md`'s locked decisions, D1/D8/D10/D11):

1. Split the pool: extract a `planning`/`decompose`-only pick function
   (mirrors `compareDecomposeOrder`, already isolated in
   `discover-pool.mjs:53-61`) into its own module; narrow
   `discover-pool.mjs`'s own `CANDIDATE_STAGES` to clarify-shaped stages
   only (`clarify`/`discovery`/`exploring`) — this is the one change that
   touches already-tested code, so it goes first where a regression is
   cheapest to catch.
2. Rewrite `discover-next/SKILL.md`: drop the self-claim + self-dispatch +
   self-computed-ceiling step; after picking, delegate to `/fgOS:discover
   <id>` and relay whatever it reports (D10).
3. Author `plan-next/SKILL.md` + `plan-loop/SKILL.md`, mirroring the
   `discover-next`/`discover-loop` template pair (closest analog: also a
   claim-then-delegate-to-a-launcher shape, unlike `cleanup-next`'s
   single mechanical verb call) — wired to the new pool function from
   step 1, delegating to `/fgOS:plan <id>` (D11).
4. Fix the four `discover/SKILL.md` prose defects (D8) — independent of
   steps 1-3, can land in the same change set without ordering constraints
   on the others.

`fgos graph --json`'s `criticalPath`/`topUnblock` were not consulted for
step ordering — this is a single, unsplit item (see "Decide the split"
below), so there is no sibling-item ordering question for that tool to
inform; the ordering above is intra-item sequencing only.

**Impact-analysis gate** (`CLAUDE.md`): `fgos tool query --capability
impact-analysis --status present` → provider `gitnexus`, `status:
"present"`, but a `PostToolUse` hook this session already flagged the
index **stale** (`last indexed: 4ce7a96`) — **degraded**, per `CLAUDE.md`'s
own three-way framing: run the check anyway, mark the evidence weak, name
the gap plainly. `impact({target: "pickNextDiscoverItem", direction:
"upstream"})` → `impactedCount: 0`, `risk: LOW`, `epistemic: "exact"` — no
traced caller beyond the function's own file. This is expected, not a
false-safe zero: `discover-next/SKILL.md` invokes it through an inline
`node -e "..."` script (a bash-embedded dynamic import), which a
static call-graph does not trace as a symbol edge — cross-checked via `rg
-l "pickNextDiscoverItem" .` (three pool test files, one skill file, the
module itself), matching the same set GitNexus found nothing beyond. The
staleness means this 0-count is not proof nothing else calls it, only
that nothing traceable does as of the last index — `fgos-validating`
should re-run `impact` after `gitnexus analyze` refreshes, or accept the
`rg` cross-check as the real evidence per `CLAUDE.md`'s own suspicious-
zero-result guidance.

## Risk map

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| `discover-pool.mjs` narrowing (removing `decompose`/`planning` from `CANDIDATE_STAGES`) | Medium — `test/state/discover-pool.test.mjs` currently asserts decompose-pool behavior in the same function; narrowing without updating those assertions in lockstep breaks a currently-green suite | `npm test` green after the split; `discover-pool.test.mjs`'s decompose-pool assertions moved to the new pool-test file, not silently deleted |
| New `plan-pool.mjs` pick function | Low — new code, no existing behavior to regress; logic is a direct extraction of `compareDecomposeOrder`, already proven in production pooling | New `test/state/plan-pool.test.mjs` covering pool-empty, priority-ascending order, and the `decompose`/`planning` dual-stage candidacy (D18's drain-only alias) |
| `discover-next/SKILL.md` rewrite | Low — prose only, no runtime compilation; correctness is exactly what the item's own verify checks | Item's own verify: `grep -q "fgOS:discover" plugins/fgOS/skills/discover-next/SKILL.md` |
| New `plan-next`/`plan-loop` skill pair | Low — new files, mirrors 3 existing templates read in full during exploring | Item's own verify: `test -d plugins/fgOS/skills/plan-next` |
| `discover/SKILL.md` prose fixes | Low — the four defects are independently confirmed against live `nextDiscoveryEdge`/`skillMap` behavior (`CONTEXT.md`'s scout evidence, verified live this session) | Item's own verify: `! grep -q "Socratic reasoning" plugins/fgOS/skills/discover/SKILL.md` |

## Files touched

- `src/state/discover-pool.mjs` — narrow to clarify-shaped stages only
- `src/state/plan-pool.mjs` — new, `planning`/`decompose` pool picker
- `test/state/discover-pool.test.mjs` — update for the narrowed pool
- `test/state/plan-pool.test.mjs` — new
- `plugins/fgOS/skills/discover-next/SKILL.md` — delegate down (D10)
- `plugins/fgOS/skills/plan-next/SKILL.md` — new
- `plugins/fgOS/skills/plan-loop/SKILL.md` — new
- `plugins/fgOS/skills/discover/SKILL.md` — four prose fixes (D8)

## Decide the split

No split. This is one coherent piece: the item's own attached verify is a
single conjunctive command (`npm test && ... && ... && !...`) that only
passes once every file above lands together — splitting into separate
items would break that atomicity and force artificial intermediate verify
commands the design never called for. `fgos graph --what-if` was not run
for this reason: there are no candidate sibling pieces to compare.

## Concrete cases worth proving

- **Pool empty.** `plan-next` on an empty `planning`/`decompose` pool
  reports "pool empty — nothing to plan" cleanly, mirroring
  `discover-next`'s own step 3.
- **Existing behavior not regressed.** After narrowing, `discover-next`
  still correctly picks and delegates a `clarify`/`discovery`/`exploring`-
  stage item — its now-sole remaining job — proven by the updated
  `discover-pool.test.mjs` suite passing green.
- **`lock-timeout` relay parity.** `plan-next`/`plan-loop` carry the same
  `stop-reason: lock-timeout` relay discipline every existing next/loop
  pair already has (D11 means parity with the other four pairs, not a
  lesser copy).
- **D18's drain-only invariant stays mechanical, not violated by this
  item's own tooling.** `plan-pool.mjs`'s candidate-stage set keeps both
  `decompose` (legacy alias) and `planning` (current) as pool candidates —
  same as today's `discover-pool.mjs` — since `plan-next`/`plan-loop` only
  ever pick and delegate to `/fgOS:plan <id>`; they never move `stage`
  themselves, so they cannot be the thing that routes a new item onto the
  legacy alias (that already happens one layer down, in the engine verb,
  outside this item's footprint).

## Assumptions (unproven, pinned per fgos-planning's own rule)

- New pool module is named `plan-pool.mjs`, mirroring the
  `cleanup-pool.mjs`/`retro-pool.mjs` one-module-per-pair convention,
  rather than appended to the existing `discover-pool.mjs`. Naming is an
  implementation detail `CONTEXT.md` correctly left open (its own
  "Still open" note) — not a product decision requiring a hand-back to
  `fgos-exploring`.
- `plan-next`/`plan-loop` are built from the `discover-next`/`discover-
  loop` template pair, not `cleanup-next`/`cleanup-loop` — the closer
  shape match (claim-then-delegate-to-a-launcher vs. a single mechanical
  verb call).

## Outstanding questions

None
