# Phase 09 — Doctrine, docs, closeout

## Context

- Spec §12 "Đổi: doctrine driver (`coordination-driver.md`): phán route là của agent, cơ học và cưỡng chế là của harness"; §5.4 / R8 (doctrine must follow Shape C: workers never call a door naming their playbook case); RUL-WF-11.7 (conductor names the case on every dispatch, read-only included — a skill rule, not a guard); RUL-WF-20 (when to ask a person; batched decision questions); §8 row `operations` → `status`.
- Program board: COOK row — owner 10-18 22:20 deferred the `coordination-driver.md` rewrite to this spec; COOK P5 (`fgos-cook`) waits for it. This phase is that rewrite (not a separate follow-up), so mechanism and doctrine land together.
- Files: `core/skills/_shared/coordination-driver.md` (105 lines; Step 2 tells drivers to run `fgos workflow operations <workflowRunId>` — wrong verb for a run; Step 3 lets workers call the doors), consumers `core/skills/fgos-advise/SKILL.md` (+ any other `rg -l coordination-driver.md core`), renders via `npm run build:skills`; `core/skills/fgos-run/SKILL.md` (Mode B after 03); `docs/platform/component-boundary.md:70` ("thin driver `fgos-run` delegates directly to Workflow runner"); `docs/specs/workflow.md` front matter (`coverage: partial`), `docs/specs/runner.md` (0048/0049 pointer lines, D-ADR0070 record "implemented by"), `docs/specs/system-overview.md` (no `workflow` row yet, review N-e), `docs/specs/reading-map.md`, `docs/backlog.md`, `CHANGELOG.md`, program board row AGENT-WF.

## Requirements

1. Rewrite `coordination-driver.md` around the case: observe = `fgos workflow status <caseId>` (projection); choose = the agent picks activity + route (`should` / `may-instead` / `unlisted` with reason), the harness admits or refuses by name and a refusal is an answer, not an owner question; dispatch = one of the two doors **always with `--case`**, read-only included; parallel = disjoint reservations, no declaration; ask a person only per RUL-WF-20, batched in the decision-question template; close = `fgos workflow close`. Remove the `workflow operations` instruction. State Shape C: a worker inside a playbook Unit never calls a door naming that case; a confined worker never dispatches a writer (ask the conductor). State §1.3 honestly: in-session edits are outside the ledger; the approve door still guards landing.
2. Keep facade hook slots (`fgos-advise` and others keep working); rebuild skills; diff renders.
3. Docs: `workflow.md` coverage/status line names this plan as implemented (spec is not rewritten); `runner.md` D-ADR0070 gets "implemented by" with commit range; `system-overview.md` gains the `workflow` area row; `component-boundary.md:70` wording fixed (No component-boundary change otherwise — rows already match the spec); `reading-map.md` lists the new `src/workflow/*` files; `fgos decision-index` regenerated only if a spec history section changed.
4. Backlog rows (proposed): coding cutover (R2) incl. deleting the Work step FSM, `feature.yaml` lifecycle part and `workflow operations --step`; F13 physical rename; reopen watches from §14 that need measurement (refusal counts for `playbook-case-admits-via-proposer-only`, `nested-write-from-confined-worker`).
5. Program board: AGENT-WF row → landed with commit; COOK row: P5 unblocked.

## Files

- Modify the files listed in Context; regenerated `.agents/skills/**`, `plugins/fgOS/skills/**` (never hand-edited).

## Tests

- `test/docs/run-doors-doctrine.test.mjs` and any doctrine/skill render tests (`rg -l coordination-driver test/`); update assertions that pin the old Step 2/3 text.
- `npm run build:skills` clean diff check; full `npm test`.

## Risks / rollback

- Risk (M×M): another lane (COOK, DOC) edits the same doctrine/docs concurrently. Mitigation: board check before starting; DOC lane's doc-authority rules for `docs/` placement.
- Rollback: revert; mechanism phases do not depend on doctrine text.

## Done when

Doctrine teaches the case model with no reference to `workflow operations` on a run or to `--plan`; docs and board updated; full `npm test` green.
