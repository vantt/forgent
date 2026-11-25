# Phase 5: Gather every fgOS rule to one owner

ACE-D4: the 14 conflicts and drift are fixed when ACE gathers the rules, each rule moving to one owner, and the
gathering is not done until all 14 are resolved. This phase owns every move of rule text out of AGENTS.md and out of
the duplicate copies (plan.md, "Who moves which text"). It starts after phase 4 (so each new unit passes the
write-time check) and after the plans listed for phase 5 in plan.md "Waits on other plans". It does not wait for
ASC: the ritual and `FIRST_STEPS` live in code outside the P2 corpus, and ASC phase 5 moves them later, through the
write-time check.

## Context

- The [P2 report](../reports/research-261125-1601-fgos-rule-duplicates-and-conflicts.md): 31 clusters with a
  suggested owner each, 14 conflicts C1-C14 with their lines. Re-read every cited line on this phase's base first;
  line numbers drift.
- AGENTS.md's hand-written fgOS sections (everything outside the projection block and the AgentKit, GitNexus and
  MDView blocks).
- The anchor tests: `test/docs/rul11-anchor-phrase.test.mjs`, `test/docs/rul104-anchor-phrase.test.mjs`,
  `test/docs/agents-doctrine-anchors.test.mjs`, `test/docs/run-doors-doctrine.test.mjs`.
- Owner question 3 (scope of "every rule") decides whether single-location skill rules move too. This file assumes
  the recommended answer: rules stated in more than one place, and every hand-written AGENTS.md rule, move to units;
  a rule stated in exactly one skill stays in that skill, which is its one owner.

## Requirements

- Each moved rule gets one owner unit in the root of its owning component or domain, with no `when:` restriction, so
  the rendered AGENTS.md keeps carrying every rule that was there. L8 scoping is ASC phase 9's.
- Every other copy becomes a pointer to the unit id (one line), not a paraphrase.
- Each conflict C1-C14 is resolved by choosing one statement, recorded in the commit body as "C<n>: kept <rule>,
  because <evidence>". Where the choice changes behaviour an owner already decided, or the evidence does not settle
  it, it becomes an owner question in the five-part form and the phase parks only that conflict.
- Text not involved in a conflict moves without rewording.

## Files

See the phase table in `plan.md`, row 5.

## Steps

1. Build the move table in `plans/261125-1631-agent-context-engine/reports/gather-table.md`: for every cluster and
   every AGENTS.md rule section, its owner unit id and path, and each copy with its replacement pointer.
2. Resolve C1-C14 in the owner units. The six Medium or above first (C1 to C6), since they sit in dispatch doctrine
   that agents act on.
3. Write the units, convert copies to pointers in `core/skills/**`, `core/agents/**`, `core/prompt-templates/**` and
   `domains/coding/skills/**`, and cut the moved sections from AGENTS.md.
4. Point each anchor test at the unit that now holds its phrase. Do not weaken any.
5. Run `npm run build:skills` to regenerate the skill surfaces and the projection block, and
   `fgos internal context-engine compile`.

## Validation

- `fgos internal context-engine check` passes on all units (no refusal, no near-duplicate above the threshold).
- Every rule id in the move table is in `rules.json`, and its text is in the rendered AGENTS.md.
- `node scripts/run-tests.mjs test/docs test/setup` passes.
- The P2 method, rerun on this tree by an independent agent with the same corpus definition, finds no duplicate
  cluster outside pointers and none of C1-C14. Its report goes to `plans/261125-1631-agent-context-engine/reports/`.

## Risk

High in breadth: many skills change at once. Mitigations: the move table, pointer-only edits outside conflicts, the
regenerated surfaces, and the independent rerun. Concurrent plans edit single lines of the same skills; rebase over
them and recheck the table.

## Rollback

Revert the phase's commits. The copies and conflicts return; units added here go away.
