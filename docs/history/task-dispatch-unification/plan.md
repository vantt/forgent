# plan.md — tsk-1qn (review tsk-5tm's shipped dispatch unification, fix in-branch if a real bug surfaces)

Mode: **standard**

Lane decided via `fgos-routing`'s Mode-gate (this session is the first to
decide a lane for tsk-1qn — no prior Orient/exploring hand-off existed;
`fgos-coding-planning`'s own "Direct-entry fallback" applies). Flag count: **2**
of the ten flags apply —

- **existing covered behavior** — `src/runner/dispatch.mjs` ships with a
  775-line test file (`test/runner/dispatch.test.mjs`) already asserting the
  D1-D12 shape; any fix must not regress it.
- **public/internal contract** — `dispatch.mjs`'s exported decision
  functions are consumed by `fgos-fanout`, `fgos-researching`, and
  `scripts/project-agents.mjs` (per `RESEARCH.md` round 1's file list); a
  wrong fix here has blast radius beyond this one file.

2 flags → **standard** (not tiny/small: this is not "a couple of files, one
direct task"; not high-risk: no hard-gate flag — no auth, no data loss, no
audit/security, no external-provider change, no validation removed).

## 1. Boundary

Reuses `tsk-5tm`'s own feature folder (`docs/history/task-dispatch-
unification/`, `docsRef` set on this item — tsk-1qn has no exploring pass
of its own; discovery verdict `clear` skipped straight to planning, per
`CONTEXT.md`'s already-locked D1-D12 acting as the trust signal). This
item's job: verify the code that actually shipped in `mergedSha
e774207b20729a197c55b4aa51532ca77502790f` (tsk-5tm parent + its 6 children,
all `retrospective`) against every one of `CONTEXT.md`'s D1-D12, one at a
time, and — only if a real divergence (a bug) is found — fix it directly on
this item's own branch (`fgw/tsk-1qn`), never open a second item for the
fix. If nothing diverges, the item still returns clean (no code diff),
reporting "reviewed, D1-D12 confirmed shipped as designed, no bug found".

Not in scope: re-opening any of D1-D12 itself (a locked decision, cite the
D-ID, never reinterpret it here — `CONTEXT.md` already governs that);
`childwork`/exec-packet B2 (`CONTEXT.md` §1 already excludes it from the
parent feature, inherited here).

## 2. Approach

**Files in scope** (from `RESEARCH.md` round 1's `git diff --stat` against
the merge commit's two parents — the exact set `fgw/tsk-5tm` touched):

- `src/runner/dispatch.mjs` (primary — D1/D2/D3/D5/D6/D9/D10/D11 all land here)
- `test/runner/dispatch.test.mjs` (D1/D5/D6/D9/D11 coverage)
- `scripts/project-agents.mjs` + `test/scripts/project-agents.test.mjs` (D9's modelPolicies consumer)
- `.agents/skills/_shared/capacity-dispatch-fallback.md` (+ its generated
  `plugins/fgOS/skills/_shared/` mirror) — D12's shared prose helper
- `.agents/skills/fgos-fanout/SKILL.md` (+ mirror) — D4's dispatch-decision consult
- `.agents/skills/fgos-researching/SKILL.md` (+ mirror) — D6's gather-retired consequence
- `docs/specs/runner.md` — spec text for the above

**Method:** read `CONTEXT.md`'s D1-D12 table one row at a time, jump to the
cited evidence line (`dispatch.mjs:NNN` etc. — line numbers will have moved
since `CONTEXT.md` was written pre-implementation, so locate by symbol name,
not by the stale line number) and confirm the shipped code actually does
what the decision says. Cross-check against `test/runner/dispatch.test.mjs`
to see whether a test exists asserting that decision's behavior (a D-ID with
no covering test is itself a finding worth flagging, even if the code looks
right). `npm test` already confirmed green in `RESEARCH.md` round 1 (3333/
3338 pass, 0 fail) — that is the regression floor, not proof any individual
D-ID is correctly implemented; a bug could still pass all existing tests if
the existing tests don't cover the divergent behavior.

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `dispatch.mjs` core decision functions (`resolveExecutorConfig`, `decideCapacityCli`/`decideCapacityDispatchMechanism`, `capacityIdForWork`, `modelForTier`) | standard — wide internal blast radius (fanout/researching/project-agents all call in) | `impact({target, direction:"upstream"})` per AGENTS.md's GitNexus gate BEFORE editing any one of these symbols (only if a bug is actually found there); full `npm test` after any edit |
| `.agents/skills/**/SKILL.md` prose (D12/D4/D6 mirrors) | light — prose only, no runtime execution path | grep the plugin-mirror pair stays byte-identical post-edit (these are generated mirrors, per `.claude/skills/*` thin-wrapper convention seen throughout this session) |
| `.fgos/config.json` capacity registry shape (D11) | standard if touched — malformed config would break every dispatch call at runtime | `test/runner/dispatch.test.mjs`'s own config-shape assertions, already exercised by `npm test` |

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`, run fresh this session):
GitNexus registered and `status: "present"` — but a post-commit hook this
same session flagged the index itself stale (`last indexed: 7bb3231`, a
commit from well before `tsk-5tm` even merged). Per `CLAUDE.md`'s gate,
`present` only means installed, never fresh — this is **degraded**, not
full: `impact()` may still be run before touching any `dispatch.mjs`
symbol, but its blast-radius answer is weak evidence until reindexed, and a
zero-result/"not found" answer from it must be cross-checked with a plain
grep/rg before being trusted (the gate's own unconditional clause). Naming
this gap plainly rather than silently treating "present" as "full".

`fgos graph tsk-1qn --json`: `topUnblock` was skipped (no dependent items —
this is a leaf review item with no children to unblock), `criticalPath`
computed but uninformative for a single, unsplit piece. No ordering
decision needed beyond "read D1 through D12 in table order," which the
Approach above already does.

## 3. Shape

One honest piece — no split (see §4). Cases worth checking per D-ID during
the review pass:

- **D1 (retire `needs`)** — confirm no live code path still gates on
  `capacities.<id>.needs`; confirm no fixture/doc still documents it as live.
- **D5 (self-execute)** — confirm an `execute`/`dispatch` subcommand exists
  and that the adapter-resolvable case actually self-executes rather than
  always hand-back (the exact bug shape D5's own rationale describes Flow A
  as having before this item).
- **D6 (gather removed)** — confirm zero references to the `gather`
  capacity remain in `.fgos/config.json`, `dispatch.mjs`, and
  `fgos-researching`'s own SKILL.md (the file `RESEARCH.md` shows was
  touched for exactly this).
- **D9 (provider-keyed modelPolicies)** — confirm `modelForTier` (or its
  replacement) resolves per-provider, not a single flat Claude-only map;
  confirm `rigorOverrides` axis exists.
- **D11 (registry shape, `capacities` key unchanged)** — confirm the
  top-level JSON key is still literally `capacities`, not renamed to
  `executors` (would collide with `cfg.executors`'s pre-existing
  tier-keyed meaning, the exact regression D11 exists to prevent).
- **D2/D3/D4/D7/D8/D10/D12** — lower-risk (naming/vocab/deferred-doc/prose
  decisions) — confirm by direct read, no deep behavioral case needed.

## 4. Split decision

No split. This is one honest piece of work: a targeted review against an
already-locked, already-implemented D1-D12 table, with a conditional fix
scoped to the same files that table already names. Splitting a review-plus-
maybe-fix into multiple items would only recreate the footprint-conflict
problem `tsk-5tm`'s own decompose already hit and closed (15/15 pairwise
`dispatch.mjs` collisions, full-pairwise-chain dependency fix) — for a much
smaller piece of work than tsk-5tm's own 6-way split. Proceeds as itself.

## 5. Verify

`npm test` — already confirmed real and runnable (`RESEARCH.md` round 1:
3338 tests, 3333 pass, 0 fail, 5 skipped). Same command `tsk-5tm` itself
used. No narrower verify needed: any fix to `dispatch.mjs` must not regress
the full suite, and the suite already covers most of D1-D12's shipped
behavior.

## Outstanding questions

None
