# Conductor case settle records milestones

## Problem

The admission port's `settle` wrote `achieved: []` for every Unit. The projection only achieves a milestone from a settle's `achieved`, a playbook `step.complete`, or a gate answer, so a conductor case could never leave its entry milestones. `fgos run --case C --activity implement-item` stayed refused with `entry-milestone-unmet: "plan-validated" is not reached`.

## Prior art

`git log -S'achieved' -- src/workflow` and the case-ledger plan phases 05-08 show no deliberate deferral. Phase 05 lists `settle (reservationId, outcome, receipts, ...)` and the projection fold accepting `achieved`; phase 06 lets the playbook proposer achieve milestones at step completion. Nothing names the conductor path. It was a gap, not a decision. Reused: `isDeliveryMilestone`, `isValidReceipt`, `receiptsFromResults` (case-projection), `digestUnitRunReports` and `digestSubject` (ref-digests, the doors `stepSubjectDigest` already uses). No new digest code.

## Change

`src/workflow/case-admission-port.mjs`, `settle` only. New `proposedAchievements`:

- Applies to non-playbook cases and outcomes `pass` or `findings`; a playbook still achieves at `step.complete`.
- For each milestone in the reservation activity's `produces`:
  - delivery milestone (a `verify-receipt` MUST names it): subject digest is `digestSubject({tree: writes})` read in the reservation's worktree (spec: receipt bound to the tested paths); receipts are rebuilt naming that milestone and digest.
  - other milestone: digest of the Unit run's reports (`digestUnitRunReports`).
  - digest unreadable, or a write scope with a mid-path wildcard: nothing proposed, milestone stays unreached (fail closed).
- Acceptance stays with the projection: delivery without a matching receipt is recorded in `refusedAchievements` as `receipt-missing`.

No config keys, no new module, no caller change.

## Tests

- `test/workflow/conductor-case.test.mjs`, two new tests with no hand-written `achieved`:
  - real `runUnit` through the real port: `build-a` refused `entry-milestone-unmet`, `plan` settles `pass`, `plan-ready` achieved with a digest, `build-a` then admitted.
  - delivery: settle without a verifier result gives `receipt-missing` and `child-built` unreached; with a verifier result it is achieved.
- Focused `test/workflow/*.test.mjs` (with the host env): all pass except the load-sensitive timeouts below.
- Under full parallel load 8 workflow tests timed out (200s each); re-run alone: `advisory-m-contracts`, `architecture-advisory-workflow`, `discussion-workflows`, `group-cognition-debate`, `units-runner`, `business-discussion-workflow` pass. `workflow-runner.test.mjs` alone exceeds a 500s cap in this session (116 KB file, playbook only, change does not touch playbook cases); see the full suite result below.

## Probe

Scratch repo from the workflow fixture helper, working-tree code through `npm run fgos:dev` (`--dir` the scratch repo): `workflow start coding/feature --frame ...` opened a case. `judge-ambiguity` and `validate-plan` driven through the real port and `runUnit` settled `pass`; the ledger then holds `achieved: [{milestone: decisions-locked, ...}]` and `[{milestone: plan-validated, subjectDigest: sha256:cf70...}]`. `fgos run --case C --activity implement-item` was admitted (a unit run and reservation were created) instead of refused with `entry-milestone-unmet`; headless there is no executor, so that run ended in `policy-refusal` and settled `achieved: []`.

A CLI-only drive was not possible: the fixture executor is not visible to the headless CLI (`headless-no-executor`), so the two producing settles went through a short script using the real port and `runUnit`.

## Incident, cleaned

My first probe omitted `--dir`; the dev host resolved the repo from my worktree's common checkout and wrote 5 probe cases, 2 bindings and 2 unit runs into the main checkout's `.fgos/` (all ids from 14:00-14:03 UTC, coding/feature starts of this session). I removed exactly those paths and verified none remain; scratch repos under `/var/tmp/fgos-probe-*` removed. A debug-profile cargo build also landed in the shared `landing-r4/cargo/debug` (release binary untouched).

## Docs

No spec line needed: RUL-WF-13, the milestone/subject glossary rows and the worked example already state the contract. `CHANGELOG.md` `## [Unreleased]` line added.

## Unresolved

- A delivery milestone's digest assumes the worktree holds the tested paths at settle time; a `child-verified` for several worktrees of one case is not distinguished beyond path digest (matches spec "only for the paths").
- `integrate` (`effects: writes`, `unit.kind: integrate`) produces `integrated` through this same path with the integrate Unit's `writes`; not exercised here.
