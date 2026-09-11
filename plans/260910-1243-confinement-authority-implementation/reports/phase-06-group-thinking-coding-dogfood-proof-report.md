# Phase 06 — Group-Thinking Coding Dogfood Proof: Evidence Report

Cell: `confinement-authority-implementation--p06`. Assignments: op_077 (doer),
op_078 (reviewer), op_079 (red-team), op_080 (fixer, this cell's fix round).

## Why this file exists

The doer (op_077, commit `a93539a9`) reported its R3/R5 evidence with
`evidenceRefs` pointing at `scratch/attestation-implement.json`,
`scratch/attestation-review.json`, `scratch/coordination-chain.json`,
`scratch/coordination-show.json`. None of those files were ever written to
disk (no `scratch/` directory exists in this worktree, the run dir, or the
outbox). The reviewer (op_078) confirmed the underlying claims were true
anyway — by finding the doer's real attestation records in the machine
attestation store and independently reproducing both R3 probes with an
active escape attempt — but flagged (M1) that the doer's own report cited
artifacts that don't exist.

This is a documentation/evidence-packaging gap, not a substantive
correctness bug: everything cited below was captured live, either by the
reviewer during independent verification or freshly by this fixer round.
Nothing here is fabricated or backfilled from prose.

## R3 — attestation evidence (real, captured)

Two pairs of real `confinement-attestation.v1` records exist in
`~/.local/state/fgos/attestations/`, inside the doer's run window
(21:49:17Z–21:59:32Z), all `outcome: "enforced"`, backend `bwrap /
local-bwrap-v1`, `mismatches: []`:

- `phase-06-evidence/attestation-workspace-write-disp_1789077389950_7ebc07f3.json`
  — `requested.policyId: workspace-write` (capability `code:implement`
  route), every `control:*` satisfied.
- `phase-06-evidence/attestation-host-write-denied-disp_1789077390167_aca3234d.json`
  — `requested.policyId: host-write-denied` (capability `code:review`
  route), every `control:*` satisfied.

These are the doer's own records, copied verbatim from the reviewer's
independently-reproduced copy (`outbox/doer-attestation-*.json` under
`asgn_lead_confinement_authority_implementation_op_078/runs/01/outbox/`),
which the reviewer confirmed byte-identical to the machine attestation
store.

The reviewer additionally reproduced both probes independently, with an
active escape attempt (in-workspace write, out-of-workspace sibling write,
`$HOME` write, literal `/home/vantt` write, `NoNewPrivs` read) against a
redirected attestation store (so the real machine store was untouched):

- `phase-06-evidence/reviewer-reproduction-attestation-implement.json` —
  `workspace-write` policy: workspace write ok, all three escape attempts
  denied, exit 0, only `ws/in-workspace.txt` left on host.
- `phase-06-evidence/reviewer-reproduction-attestation-review.json` —
  `host-write-denied` policy: workspace write also denied, all three escape
  attempts denied, exit 0, no host files written.

So `enforced` is backed by real kernel-level (bwrap) denial for both
required-policy routes, not just a label — confirmed twice, independently.

## R5 — coordination chain/show captures (real, live)

The doer's report described these captures in prose only. Captured live by
this fixer round instead (`fgos coordination chain
confinement-authority-implementation --json` /
`fgos coordination show confinement-authority-implementation--p06 --json`,
run 2026-09-10T22:38:27Z from the main checkout, read-only):

- `phase-06-evidence/coordination-chain.json` — full 21-cell track chain.
  `p06`'s own entry (search `"cellId": "p06"`) shows
  `assignmentRefs: [op_077, op_078, op_079, op_080]`,
  quorum `completed: [doer(op_077), red-team(op_079)]`, `late: [reviewer
  (op_078)]` (review landed after the chain snapshot's own generation delay,
  not a defect), `missing: [fixer]` (this cell's own op_080 round, in
  flight as this file is written).
- `phase-06-evidence/coordination-show-p06.json` — full cell detail:
  `status: active`, `phase: running`, definition
  `core.coordination-protocol.standalone-master-coordination-loop@1.0.0`,
  quorum required `[doer, reviewer, red-team, fixer]`, `completed:
  [doer(op_077), red-team(op_079)]` at capture time.

## Corrected evidence pointers

The doer's `agent-result.json` (op_077) and `agent-report.md` should be read
together with this file, not with the `scratch/*.json` paths it names —
those paths were never written. The real evidence is:

| Doer's claim | Real location |
|---|---|
| R3 attestation captures | `phase-06-evidence/attestation-{workspace-write,host-write-denied}-disp_*.json` (this dir) + independently reproduced in `phase-06-evidence/reviewer-reproduction-attestation-{implement,review}.json` |
| R5 chain/show captures | `phase-06-evidence/coordination-{chain,show-p06}.json` (this dir), captured live during this fix round |

## R6/other supporting evidence

- `phase-06-evidence/focused-suite-summary.txt` — the required focused
  suite at commit `a93539a9`: 1887 tests, 1884 pass, 2 fail (both the known
  pre-existing `dispatch-production-call-sites.test.mjs:427,:526` M-2
  failures, unrelated to this cell), 1 skipped.
- `.fgos/config.json` in the main checkout was verified (by the reviewer,
  op_078 §3) to be back to its genuine pre-run state after the doer's probe
  — untouched by this fixer round.

## Scope of this fixer round (op_080)

This round did not re-run R3/R5 live proof from scratch; it packaged the
real evidence that already existed (reviewer's independent reproduction,
this round's own fresh chain/show capture) into a location the plan's own
report convention (`plans/<slug>/reports/`) makes discoverable, replacing
the doer's dangling `scratch/*.json` references. This same commit also
carries the separate red-team M1 test-coverage fix (a v1-shaped
bypass-pairing test added to
`test/runner/dispatch-confinement-p05.test.mjs`); see that file and the
commit message for details.
