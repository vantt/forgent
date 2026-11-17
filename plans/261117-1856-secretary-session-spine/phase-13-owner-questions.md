# Phase 13: Owner-question reader over the three stage places

## Inputs (read first)
- SM-D9 (three stages, three places; known debt, do not consolidate the stores), SM-D7 (five-part batch).
- `QUESTIONS.md` format defined by phase 7 in `core/skills/fgos-shaping/SKILL.md`.
- Plan owner questions: `core/skills/_shared/plan-contract.md` §3 item 5 and `scripts/plan-contract-check.mjs` (how it
  finds sections; reuse its reader rather than parsing headings a second way).
- Workflow gates: `src/workflow/case-projection.mjs` (`gateOfStep` l.45, `gate.answer` l.116) and how `fgos workflow status`
  lists open gates (`rg -n "open gates|gateOfStep" src/workflow src/verbs`).
- Existing verbs: `fgos ask` (`src/cli/command-registry.mjs:770`); check first whether a read of open owner questions
  already exists and extend it (one door) before adding a verb.

## Files this phase may write
`src/portfolio/**` (new), `test/portfolio/**`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`,
`packages/host-runtime/contracts/command-routes.json`, `bin/fgos.mjs`, `test/cli/questions-verb.test.mjs`, `docs/architecture-manifest.json`.

## Steps
1. `src/portfolio/open-questions.mjs`: read-only; collect open questions from `docs/discussions/*/QUESTIONS.md`, plans
   whose status is `draft` with a non-empty owner-questions section, and open Workflow gates; each item `{topic, stage:
   discussion|plan|execution, ref, question, answerDoor}` where `answerDoor` is the command that answers it in its own stage.
2. Read verb (extend `fgos ask` with a list mode if it fits, else `fgos questions --open`): `--json` and a text batch in
   the five-part order, grouped by topic. Regenerate the command manifest and routes (`node scripts/export-command-selectors.mjs`).
3. Add `src/portfolio/` to the architecture manifest.
4. Owning test `test/portfolio/open-questions.test.mjs`: a fixture with one open question per stage yields one batch of
   three tagged by topic and stage; answered ones are absent; nothing is written. One CLI wiring proof.

## Verify
- `node --test test/portfolio/open-questions.test.mjs test/cli/questions-verb.test.mjs test/architecture.test.mjs`.
- The command-manifest freshness test passes (`rg -l "command-manifest" test`).

## Rollback
`git revert` the phase commit; regenerate manifest and routes.
