# Plan: fgos return-close-pre-done-work (tsk-4on)

## Mode

**high-risk** (forced by a hard-gate flag, independent of count).

Flags counted (of: auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof around the area, multi-domain):

| Flag | Applies? | Why |
|---|---|---|
| audit/security (hard-gate) | **yes** | This change modifies the anti-cheat gate that protects `return`'s core contract — "prove real work happened between claim and return." Loosening it, even in a narrowly-gated way (D2), is exactly the class of change `claim-reclaim-branchhead-reset`'s own D2 revision treated as high-stakes. |
| public contracts | yes | `fgos return` is a documented CLI verb (`docs/specs/runner.md`, `docs/specs/work-state.md`) with real callers depending on its exact exit behavior — `fgos-coding-implement`, the runner's own return path, and scripted flows. A new flag/verb must not change existing `return`'s behavior for callers that don't opt in. |
| existing covered behavior | yes | `return`'s branch-source and main-source paths already carry substantial coverage (`test/cli/fgos.test.mjs`, `test/state/store.test.mjs`, `test/state/replay.test.mjs`, `test/e2e/pr-gate.test.mjs`). New logic must not regress any of it. |
| auth / authorization | no | No user-auth surface touched. |
| data model | no | No new field or event kind (per D1's own "no invented schema" framing) — reuses `outcomes[id].actual`, existing `status` transitions. |
| external systems | no | Pure local git + `.fgos/` store. |
| cross-platform | no | No platform-specific behavior. |
| weak proof around the area | no | The area is already well-tested; this is new logic needing new tests, not a fragile area getting touched blind. |
| multi-domain | no | Single `coding` domain, CLI/state-engine layer only. |

3 flags counted, one of them hard-gate → **high-risk**, per the mode
gate's own rule ("4+ flags, or any hard-gate flag ... → high-risk").
A `standard` mode would not honestly cover this: the whole point of the
item is loosening a gate that exists specifically to stop cheating the
state machine's outcome ledger — that calls for the fuller risk map and
proof-point discipline high-risk mode requires, not a lighter pass.

## Approach

Add a new, explicitly-invoked way to settle `doing -> awaiting-approval`
when there is no new commit to require, reusing `return`'s own
verify-then-transition machinery rather than building a parallel path.

**Rejected alternative**: broadening `claim-port.mjs`'s
`isClaimLockReclaim` check to auto-detect "branch already reflects done
work" — rejected per CONTEXT.md D1 (no single taggable release event for
tsk-4j9's shape; risks silently defeating the anti-cheat gate the same
way the sibling item's own D2 revision already ruled out for the
blocked-retake case).

**Shape** (implementation-level, still respecting D1-D3):

1. **CLI surface**: a flag on the existing `return` verb —
   `fgos return <id> --no-new-commits-ok` — rather than a wholly separate
   verb. Reasoning: it is still fundamentally `return`'s own job (verify
   the current state, transition on pass, park+friction on fail); a
   sibling verb would duplicate `return`'s ~80 lines of branch-source /
   main-source handling (`bin/fgos.mjs:1500-1620`) for no behavioral
   gain. The flag only changes ONE thing: it skips the
   `branchAheadCount <= 0` / `aheadCount <= 0` refusal (D1's "not
   `return`'s core semantics" is honored — default `return` behavior is
   byte-for-byte unchanged when the flag is absent).

2. **D2 gate — "first-ever return attempt" detection**: read via
   `outcomes[id]` (already loaded by `return`'s existing call path) —
   refuse the flag if any prior entry has
   `actual.outcome === 'blocked'` anywhere in the item's outcome history
   (not scoped to the current claim occurrence). Reasoning: the
   `branchAheadCount <= 0` refusal itself never reaches `moveWork`/
   `addOutcome` today (it throws before running verify at all — no
   `blocked` outcome is ever recorded from THAT refusal) — so the only
   way an item's history can carry a `blocked` outcome is a genuine
   past verify-fail (`bin/fgos.mjs:1548-1549` / equivalent in the
   headAtTake branch). Scoping to "ever, not just this claim" closes the
   exact loop D2 exists to close: retake a blocked item (which already
   resets `branchHeadAtTake` to the retake-time tip via `isBranchTake`),
   then immediately invoke the flag hoping verify passes for unrelated
   reasons — refused, because the item's outcome history still shows the
   earlier `blocked` entry. This resolves CONTEXT.md's own "deferred to
   planning" question on D2's scoping.

3. **Both claim shapes (D3)**: apply the same flag/gate symmetrically to
   the branch-source block (`bin/fgos.mjs:1500-1559`, guards
   `branchAheadCount`) and the main-source block
   (`bin/fgos.mjs:1561-1620`, guards `aheadCount`) — skip only the
   advance-check in each, leave the rest of each block (clean-tree check
   for main-source, goal-check run, `addOutcome`/`moveWork`/friction
   calls) untouched.

4. **Outcome recording**: on pass, `addOutcome`'s existing `actual`
   payload gains nothing new structurally — `aheadCount: 0` is already a
   representable value in the existing shape (`aheadCount` is already an
   int field on both branches today); no schema change. This alone is
   enough to distinguish "closed via the flag" from a normal return in
   any downstream `check`/compound-learn read, so no separate marker
   field is needed (YAGNI).

## Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| Skipping the advance-check | High — this is the exact anti-cheat gate `claim-reclaim-branchhead-reset` protects | Prove: flag on a genuinely-fresh (never-blocked) item with zero new commits and a passing verify succeeds and records `actual` with `aheadCount: 0`; flag on a never-blocked item with a FAILING verify still parks `blocked` + friction (flag never bypasses verify itself, only the advance-check) |
| D2 gate (prior-blocked detection) | High — this is the only thing stopping the flag from becoming a blanket cheat path | Prove: item with any prior `outcomes[id].actual.outcome === 'blocked'` entry refuses the flag with a clear error, even after a blocked-retake resets `branchHeadAtTake` |
| Symmetry across branch-source / main-source | Medium — two separate code blocks, easy to fix one and miss the other | Prove: both a `pick`-claimed item and a plain-`take`-claimed item exercise the flag successfully in tests |
| Default `return` behavior unchanged | Medium — regression risk for every existing `return` caller | Prove: full existing `return` test suite (`test/cli/fgos.test.mjs`, `test/state/store.test.mjs`, `test/state/replay.test.mjs`, `test/e2e/pr-gate.test.mjs`) stays green with the flag absent from every existing call site |
| `collectMissingOutcomeNag` symptom actually resolved | Low — mostly a verification of intent | Prove: an item closed via the flag no longer appears in `missingOutcomeNag`'s output |

## Files likely touched

- `bin/fgos.mjs` — `return` case (`~1474-1620`): add flag parsing, thread
  through both branch-source and main-source blocks, add D2's
  prior-blocked check.
- `test/cli/fgos.test.mjs` — new test cases per the risk map's proof
  points; extend, don't replace, existing `return` coverage.
- `docs/specs/runner.md` — `return`'s contract section gains a line
  documenting the new flag (deferred doc update from CONTEXT.md,
  resolved here: yes, needed, since this is a public CLI contract
  change per the mode-gate table above).
- `docs/history/return-close-pre-done-work/CONTEXT.md`,
  `plan.md` — already written; no further changes expected unless
  `fgos-coding-validating` surfaces a gap.

No split: this is one cohesive piece of work — one flag, one gate
condition, applied to two already-parallel code blocks under one
`return` case. Splitting into "branch-source" and "main-source" child
items would fragment a single, small, symmetric change with no
independent value on its own (per YAGNI) — confirmed against `fgos
graph --json`: tsk-4on sits off the repo's current critical path
(`tsk-4vo -> ... -> tsk-19y-1`, depth 10), so there is no unblocking
value gained by splitting it into smaller pieces either.

## Cases to prove (high-risk depth)

- Boundary: flag invoked with zero commits since take, verify passing —
  succeeds.
- Boundary: flag invoked with commits since take (aheadCount > 0) —
  behaves identically to `return` without the flag (flag is a no-op when
  the normal check would already pass).
- Existing-behavior regression: `return` without the flag, on every
  existing test scenario, is byte-for-byte unchanged.
- Cheat path: item previously parked `blocked` by a real verify-fail,
  now retaken (branchHeadAtTake reset via `isBranchTake`), flag invoked
  with zero new commits — refused, citing the prior `blocked` outcome.
- Partial failure: flag invoked, verify FAILS — parks `blocked` +
  friction exactly like normal `return`'s fail path (flag never
  suppresses verify itself).
- Symmetry: same four cases above repeated for a main-source (`take`,
  non-isolated) claim, not just branch-source (`pick`).
