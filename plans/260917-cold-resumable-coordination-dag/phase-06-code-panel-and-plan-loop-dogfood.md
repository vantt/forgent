# Phase 06 - Code-Panel And Plan-Loop Dogfood

## Goal

Adopt the proven DAG request surface in planned-mode code-panel/plan-loop and
prove the user-visible performance and cold-resume promise through public CLI
doors.

## Scope

- Update plan-loop/code-panel request composition to declare the first-pass
  read-only dependency graph after the legacy sequential producer settles.
- Preserve legacy composition as fallback for legacy/non-DAG sessions.
- Make caveated reviewer/red-team outcomes force recheck-required; neither
  skill may accept, reject, or close a cell on a caveated verdict.
- Add documented resume behavior using `coordination chain` and `show` rather
  than transient labels/chat history.
- Run a real planned multi-cell code-panel track using the new DAG mode after
  its producing work is complete; measure overlap from persisted Run evidence.

## Verification

```sh
npm test -- test/verbs/coordination-launch-master-loop.test.mjs test/verbs/coordination-chain.test.mjs test/verbs/coordination-run-live-proof.test.mjs test/runner/flow-definition-standalone-master-coordination-loop.test.mjs
npm test
```

## Exit Criteria

- Live proof measures review/red-team overlap and preserves independent
  reviewer/red-team provenance.
- Kill/restart between producer and first-pass completion is reconstructed by a
  fresh `chain`/`show` process and resumes only legal nodes.
- Caveated results cannot close a cell without explicit recheck evidence.
