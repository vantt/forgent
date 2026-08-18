# plan.md — tsk-4n8: decompose-atomicity bug

Mode: **standard** (fgos-routing Mode gate, direct-entry fallback: no
`fgos-coding-exploring` ran — discovery verdict was `clear`, so no CONTEXT.md
exists for this feature. Flags counted: existing covered behavior [yes —
88 tests in `test/intake/plan.test.mjs` exercise `resolvePlan`], public
contract [yes — the `fgos plan --verdict decompose` CLI/engine contract
changes shape]. 2 flags -> standard, no hard-gate flag applies (not auth,
not data-loss, not audit/security, not an external provider, not removing
a validation — this REPLACES one flawed validation with a correct one).)

No split: this is one honest piece of work (pass-through). No child specs
below.

## Grounding

All findings below are from `RESEARCH.md` (discovery stage, round 1) and
this planning session's own direct reads — every claim cites `file:line`.

## Approach

**Root cause (confirmed, `RESEARCH.md` round 1, finding 3):**
`resolvePlan`'s `hasChildren` check (`src/intake/plan.mjs:530`) is
`Object.values(view.work).some((item) => item.parent === id)` — a pure
existence check. When true, `src/intake/plan.mjs:581-584` unconditionally
moves the parent to `executing` and returns `already-decomposed`, before
`childIds` (line 833) or the footprint gate (line 847) are ever reached.
This conflates two different situations the current code cannot tell
apart:

1. **Crash re-entrancy** (the check's actual documented intent, lines
   524-529): a retry after a crash between the `addWork` loop finishing
   (line 886-912) and `moveStage` running (line 915) — the exact same
   verdict, children already fully written, just needs the stage move
   applied.
2. **A stray/partial child** (the reported bug): one child exists for a
   reason unrelated to a completed decompose (e.g. a prior decompose call
   whose `--children` array only had 1-2 entries and has since been
   superseded, or a human's manual `fgos add --parent` used as a
   workaround) — here, `hasChildren` incorrectly treats the root as
   "fully decomposed" and permanently refuses every subsequent
   `--verdict decompose` call, with no supported path to add the still-
   missing children (the item's own title/description).

**The footprint-overlap-before-commit part of the title does NOT
reproduce on current HEAD** (`RESEARCH.md` finding 1): `footprintOverlapAmong`
(line 847) already gates with an early `return` strictly BEFORE the
`addWork` loop (line 886) — there is exactly one `addWork` call site for
decompose children (line 887), so within a single `resolvePlan` call,
children are written all-or-nothing. No fix needed there; scope is (2)
above.

**Fix — replace the existence check with a completion check keyed to a
durable "this call's own addWork loop actually finished" signal, and
reconcile with any already-existing children instead of refusing
outright:**

1. Replace `hasChildren` with `priorDecomposeCompleted`: does
   `view.decisionsById[id]` already contain a decision with
   `source === 'resolvePlan'` and `text` starting with
   `'decompose verdict: decompose'` (the exact string `logDecomposeVerdict`
   already writes at line 914, BEFORE `moveStage` at line 915 — so a
   crash-recovery retry still sees it and still short-circuits to
   `moveStage`, preserving case (1) above byte-for-byte). Same
   `view.decisionsById?.[id] ?? []` read pattern this file already uses
   at line 686 for `priorityOverridden` — no new field, no new event kind.
2. When `priorDecomposeCompleted` is false but some children already
   exist for `id` (case 2 above), reconcile by exact-trimmed-title match
   against `verdict.children`: a verdict child whose title matches an
   existing `parent === id` item is treated as already-materialized (its
   real id is reused, `addWork` is NOT called again for it — avoids the
   `addWork` "already exists" throw the current positional `${work.id}-
   <n>` scheme would otherwise hit on any resubmission that includes an
   already-existing child's spec). A verdict child with no match is new;
   its id is assigned by continuing the positional sequence PAST the
   highest existing sibling suffix (never blindly `${work.id}-${index+1}`
   from 0, which would collide once any sibling already exists).
3. The footprint-conflict check (`footprintOverlapAmong`, line 847) is
   widened to run over the FULL set — existing children's real,
   already-stored footprint plus the new candidates' proposed footprint —
   not just `verdict.children` in isolation, so a newly proposed child
   that collides with an already-materialized sibling is still caught
   before writing (today it would only catch collisions among the
   children present in the CURRENT submission).
4. `logDecomposeVerdict(dir, id, 'decompose', ...)` (line 914) only fires
   once every verdict child is confirmed materialized (existing-reused or
   freshly written) — this is what makes it the correct completion signal
   for step 1's check on the NEXT call.

**Deliberately out of scope:** `footprintOverlapAmong` does not consider
`deps` at all (confirmed: `footprintCandidates`, line 846, only carries
`{id, footprint}`) — the incident's own evidence records that adding a
`deps` edge to work around a footprint conflict did not satisfy the
check, matching the "sequence" resolution option
(`FOOTPRINT_CONFLICT_SUGGESTIONS`, `src/state/graph-metrics.mjs:583`)
being unimplemented for this call site. This is real, but it is NOT what
blocked the incident's actual recovery — the incident's own account says
recovery came from re-slicing footprints (which already works with the
existing check), and every subsequent resubmission was then rejected
solely by the `hasChildren` bug above, not by the footprint check itself.
Touching `footprintOverlapAmong` risks the OTHER two callers that share it
(`footprintOverlap`'s frontier-only parallel-dispatch advisory, and
`graph-harness.mjs`'s merge-readiness ranking) for a benefit this item's
own evidence does not require. Left as a candidate follow-up item, not
bundled here (YAGNI).

## Validating-stage finding (feasibility matrix evidence)

`test/intake/plan.test.mjs:161-210` — two existing tests
(`'resolvePlan completes an interrupted decompose...'` and
`'...also releases a held claim...'`) construct their fixture by calling
`addWork` directly with `parent: 'item-x'` on an `'orphan-child-*'` id —
**no decompose decision is ever logged for it** — then assert `resolvePlan`
still returns `already-decomposed`. This is the OLD `hasChildren`
semantics pinned as "correct": an orphan child, indistinguishable from
this item's own reported failure mode, is currently treated as proof of
full decomposition. These two tests must be UPDATED (not merely kept
passing) as part of implementation: their fixtures need an explicit
`addDecision(storeDir, { id: 'item-x', text: 'decompose verdict: decompose
(1 children)', source: 'resolvePlan', kind: 'engine' })` call (mirroring
the exact string `logDecomposeVerdict` writes, `plan.mjs:145`) to
correctly model the crash-window case they claim to test — `addDecision`
is already imported in the test file (`test/intake/plan.test.mjs:9`). New
tests are added alongside for the now-distinguished "stray child, no
decompose decision" case, proving the fixed behavior instead of the old
bug.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `resolvePlan`'s completion check (item 1 above) | medium — changes a core engine invariant used by both the `session` (`bin/fgos.mjs:1465`) and `runner` (`src/runner/loop.mjs:1297`) callers; two existing tests currently assert the OLD semantics (see finding above) and must be updated, not just kept green | Updated tests: crash-recovery re-entrancy (decision logged) still short-circuits to `moveStage` without re-running `addWork`; a NEW test proves an orphan/stray child with no decompose decision no longer permanently blocks decompose |
| Reconciliation by title (item 2) | medium — new logic, no precedent elsewhere in the file | New test: a resubmission that includes an already-existing child (by title) does not re-`addWork` it and does not throw "already exists" |
| Widened footprint check (item 3) | low — same `footprintOverlapAmong` call, wider candidate list | New test: a new child colliding with an EXISTING sibling's footprint still parks `need-human` |
| Existing 88 tests in `test/intake/plan.test.mjs` | regression risk if any assume `hasChildren`'s old existence-only semantics | Full suite run (`node --test test/intake/plan.test.mjs`) before and after |

**Impact-analysis posture:** `degraded` — GitNexus is `present` on this
machine but has no index registered for this worktree's path
(`/home/vantt/projects/forgentX/.claude/worktrees/tsk-4n8-9BrTgD`); the
nearest sibling index (`/home/vantt/projects/forgentX`) is 117 commits
behind. Cross-checked manually instead: `grep -rn "resolvePlan"
src/ bin/` finds exactly two real callers —
`bin/fgos.mjs:1465` (`role: 'session'`, the `fgos plan` CLI command) and
`src/runner/loop.mjs:1297` (`role: 'runner'`, the runner sweep) — both
consume only `resolvePlan`'s returned `{outcome, id, childIds?}` shape,
which this fix does not change. GitNexus's own auto-context on a later
Bash call (attached opportunistically by the harness, not a fresh query
against this worktree) independently listed the same two callers
(`plan.test.mjs`, `runOnce`), corroborating the manual grep. Blast radius:
contained to `src/intake/plan.mjs` plus its own test file.

## Order

Single file (`src/intake/plan.mjs`), single logical unit — no
multi-piece ordering question (`fgos graph --what-if` not applicable, no
split).

## Outstanding questions

None
