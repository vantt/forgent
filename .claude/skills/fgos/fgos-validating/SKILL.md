---
name: fgos-validating
description: >-
  Prove a plan holds up against real evidence before an item is allowed onto
  the `executing` stage. Use once `fgos-planning` has written and approved
  `plan.md` and the item's `decompose` stage needs a feasibility check before
  the `decompose`→`executing` edge is picked. Examples: "is this plan
  actually feasible", "check this plan against the real repo before
  building", "does this hold up under proof, or is it just plausible".
---

# fgos-validating

Proves `docs/history/<feature>/plan.md` against repo reality before an item
is allowed to take the `decompose`→`executing` edge. This skill runs at the
tail of a claimed item's `decompose` stage, after `fgos-planning`'s shape is
written and approved. It is a judgment pass, not a rubber stamp: a plan that
merely sounds plausible is not evidence, and this skill never fabricates a
pass to keep the item moving.

## Hard rules

- Do not reopen or reinterpret a decision already locked in `CONTEXT.md` or a
  choice already settled in `plan.md`. Cite the D-ID or the plan section;
  never override either here.
- Do not accept plausibility language — "should work", "likely", "probably
  fine" — as evidence for any row of the feasibility matrix below. Every row
  needs a concrete artifact: a file actually read, a command actually run, an
  existing test result, or an official version/doc confirmation.
- Do not plan or re-design Execute or its verify. Per the locked decision
  that reuses the existing mechanical proof path — the check the engine runs
  before an item is allowed to settle, and the same re-check the pull door's
  hand-back runs before it trusts an item done — this skill's job ends at
  the edge choice; it never re-implements that proof path.
- Do not dispatch a second reader or a review pass over this plan. This
  slice's validating is one session's own judgment, straight through — the
  scaled-up ceremony of a multi-pass review is explicitly out of scope for
  this induction's first slice (cite D6); a later slice may widen it, not
  this one.
- Do not apply the `decompose`→`executing` edge yourself, and do not invent a
  new edge, stage, or field to record the verdict. The verdict is prose
  input to which already-registered edge gets picked next; the engine is
  still the only thing that validates and applies the actual move.
- End by presenting the gate below and handing off. A failed check returns
  the item to `fgos-planning` with the failing row named — it never
  continues past a failure by lowering the bar.

## Flow

1. **Bootstrap.** Read the item's `docsRef` to find `docs/history/<feature>/`,
   then read `CONTEXT.md` and `plan.md`. If `plan.md` does not exist yet, or
   its shape was never presented at `fgos-planning`'s own gate, stop here and
   hand the item back to `fgos-planning` — an unapproved shape is never
   validated.

2. **Reality gate.** Score each of these PASS or FAIL, each with a concrete
   citation (a file path, a command's real output, an existing test):
   - **Mode fit** — does the plan's chosen size (from `fgos-planning`'s flag
     count) actually match what the item needs, not over- or under-built?
   - **Repo fit** — does every file, function, and pattern the plan leans on
     actually exist, at the path and shape the plan claims?
   - **Assumptions** — is every assumption the plan depends on either proven
     by reading the real code, or flagged as unproven below?
   - **Smaller path** — is there an honestly smaller way to reach the same
     exit state that the plan overlooked?
   - **Proof surface** — does every piece in the plan already carry a real,
     runnable verify command (never a placeholder or a description standing
     in for one)?

   A FAIL on any dimension stops here: return the item to `fgos-planning`
   with the failing dimension and the reason, named plainly. Never continue
   past a FAIL by treating it as a minor note.

3. **Feasibility matrix.** For every assumption the plan's risk map flagged
   medium or higher, write a row: assumption | risk | proof required |
   evidence found | result. Accepted evidence is a file actually read, a
   command actually run with its real output, an existing test result, or an
   official version/doc confirmation — never "should work" or model
   knowledge alone. A row with no accepted evidence is an automatic **NOT
   READY**, regardless of how reasonable the assumption sounds.

4. **Decide**, using this vocabulary only:
   ```text
   READY
   READY WITH CONSTRAINTS
   NOT READY - RETURN TO PLANNING
   ```
   `READY` is a feasibility verdict, not the edge choice itself — the session
   still has to actually pick the edge next, and the engine still has to
   validate and apply it (Hard rules, above). A `NOT READY` verdict hands the
   item back to `fgos-planning` with the matrix attached; it is never
   softened into a pass because the item has already spent time here.

5. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path, this skill does not design
   or re-plan any of that; a `READY` verdict only says the plan is provably
   buildable, not that this skill has re-checked how it will be built.

## Gate

Before handing off, present the reality gate result and the feasibility
matrix in plain language — what was checked, what evidence backs it, what it
would cost to be wrong — with `plan.md` linked, then ask exactly: "Feasibility
validated. Approve moving to executing?" A `NOT READY` verdict skips this
question entirely; it returns to `fgos-planning` instead of asking anything.

The verdict reached here does not, by itself, move the item anywhere. It
only informs which of the item's own already-registered edges the session
picks next once work resumes — the engine is still the only thing that
validates and applies that move; this skill's decision is input to that
choice, never a substitute for it.

## Handoff

A `READY` or `READY WITH CONSTRAINTS` verdict, once approved at the gate,
means the item is provably ready for its `decompose`→`executing` edge —
loading `fgos-routing` next reads the item's stage and points at the right
place (or straight at the existing mechanical build/verify/return path, if
the edge already fired). A `NOT READY` verdict hands the item back to
`fgos-planning` instead, with the matrix attached, never onward.

## Red flags

- accepting plausibility language as a matrix row's evidence
- continuing past a reality-gate FAIL by calling it a minor note
- dispatching a second reader or a review pass over the plan — out of scope
  this slice (cite D6)
- re-planning or re-designing Execute's own verify instead of leaving it
  alone
- applying the `decompose`→`executing` edge directly instead of leaving it
  to the engine
- recording the verdict as a new field or stage instead of gate-question
  prose
- softening a NOT READY into a pass because the item already spent time here
- reopening a decision `CONTEXT.md` or `plan.md` already locked, instead of
  citing it

Violating the letter of the rules is violating the spirit of the rules.

Feasibility validated and the gate approved. Invoke `fgos-routing` to
re-read the item's stage, or hand off directly once the item's next edge is
already fixed.
