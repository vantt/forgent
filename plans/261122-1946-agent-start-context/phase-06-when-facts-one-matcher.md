# Phase 6: The setup projection selects through `compose`; one matcher

ASC is the only selector (ASC-D8, ACE-D2): `fgos setup` and `npm run build:skills` write AGENTS.md's fgOS block by
calling `compose` with standing facts and the file delivery, and packaging-distribution only writes the returned
blocks. This phase removes the last selection outside ASC: the interim filter ACE phase 3 left in the projection
("render the rules that carry no `when:`").

What moved out of this phase, and why:
- Adding `when:` to unit frontmatter and the build test on its keys and values are ACE's (ACE-D5: ACE owns the key
  registry and refuses a bad rule when it is written). ACE phase 3 migrated the existing units; ACE phase 4 refuses an
  unknown key or value. The old `test/setup/instruction-when-facts.test.mjs` is not written.
- The Node composer that this phase used to replace (`src/setup/instruction-composition.mjs`) is deleted by ACE
  phase 3.
- The owner's 2026-11-22 scope note (plan.md owner question 1) is answered by ACE-D5 and ASC-D9: keys are ACE's,
  matching is ASC's.

## Inputs

- `src/setup/instruction-projections.mjs` after ACE phase 3 (its interim filter and the ledger entry with the set
  digest), and `src/setup/skill-wrappers.mjs` `renderSkillSurfaces` (the build entry; not edited here).
- The door `fgos internal start-context compose` from phase 3, and the standing facts it needs for a file delivery
  (`kind`, `cli`, `project`).

## Footprint

`src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`.

## Steps

1. Replace the interim filter: the projection builds a `StartRequest` with standing facts and delivery `agent-file`
   (or the file delivery the spec names for AGENTS.md), calls the compose door, and renders the returned blocks into
   the managed block. Keep the ledger entry, recording the rule set digest from the returned context.
2. The projection finds the host as ACE phase 3 set up (`FGOS_HOST_BIN` or the activated release) and fails with a
   named error when there is none.
3. Update `test/setup/instruction-projections.test.mjs`: it proves rendering, splicing and the ledger only; selection
   is proven by the composer's own tests (design principle 8). Name the retired cases and their new owner in the
   commit body.

## Verify

- `node scripts/run-tests.mjs test/setup` passes.
- `npm run build:skills` produces a byte-identical "fgOS Effective Instructions" block, compared with
  `git diff --exit-code AGENTS.md`.
- `rg -n "when" src/setup/instruction-projections.mjs` shows no filter on `when:`.

## Rollback

Revert the commit. ACE's interim filter comes back with it.
