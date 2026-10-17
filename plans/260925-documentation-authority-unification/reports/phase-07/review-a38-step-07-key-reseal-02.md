# A38 key re-seal review 02: Step 7 reader key (commit 5d19b4940)

Reviewer: reviewer:sonnet-session:af694ae076618d5e6@2026-10-17
Author session: `codex-session:fgos-run_unit-run-17922255a98df5@2026-10-17` (Step 7 Doer, as named in review-request-a38-step-07-key-01.md) plus Lead rework (L11-19, L11-20)
Review mode: ordinary
Reviewed commit: 5d19b4940 (read-only worktree /home/vantt/projects/forgentX-s8-review, detached)
Verdict: ACCEPT. Sealed.

## 1. Required fixes from review-a38-step-07-key-reseal-01.md

| Fix | Result | Evidence |
|---|---|---|
| README event-store row | ok | docs/platform/README.md:55 now "Signed durability design (D-ADR0055, 2026-10-17); implementation not started, acceptance under the proof gates; navigation does not implement it"; same two links (#26-decision-record, #23-proof-gates). Matches event-store/spec.md:5-9. |
| Foundations L3 supersession note | ok | docs/platform/platform-foundations.md:185 vs legacy docs/platform-foundations.md:101: `diff` shows the paragraph identical except the link `platform/event-store/spec.md` -> `event-store/spec.md`. Original L3 clauses 1-4 and the review threshold text (lines 164-190) unchanged; L3 index row annotated (line 50). |
| component-boundary deferral | ok (advisory) | L11-20 (owner-answers.md:429-445) keeps the main-authored holder-lock row (component-boundary.md:84, "until the event store decision") and routes wording reconciliation to P7-DOC-GAP-03 at Step 9 (owner-answers.md:503). No key answer (A1-A7, B1-B7, C1-C7) cites component-boundary.md for this, so no key answer is made wrong. Advisory: "until the event store decision" is now stale because the decision is signed; Step 9 should say "until implementation". |
| post-review-edits.md | ok | Two rows added (foundations L3, README row); SHA-256 values in the rows equal the actual hashes below (e050932d..., bcaf7a43...). |
| Key B2, B4, B5, B6, B7 | ok | see table |

## 2. Anchor checks

`env -u CLAUDE_CODE_SESSION_ID node scripts/list-doc-anchors.mjs --check <ref>` on all 42 distinct docs/platform path#anchor refs (union of step-07-reader-key.md citations and docs/platform/README.md path#anchor links): every one exit 0, 0 failures.

## 3. Cited-text re-read and drift

- `git diff e9c1996a3 5d19b4940 -- docs/platform` touches README, component-boundary, event-store/spec, holder-lock/spec, foundations, and repository-runtime-layout (not one of the eight, not cited). governance.md, architecture-map.md and process/spec.md are unchanged. Since 5d6e6c727 (already reviewed in report 01), only README (row 55) and foundations (L3 row and note) changed in docs/platform.
- step-07-reader-brief.md: byte-identical to e9c1996a3 (`git diff --quiet` exit 0). Eight-file whole-run list at brief lines 16-30; README links all eight directly, so the budget holds. Key union table row 8 updated to "signed decision and acceptance gates".
- Answers other than B2, B4-B7 cite text unchanged since the previous review; A1-A7, B1, B3, C1-C7 stand as ok per report 01 (holder-lock and process cited sections unchanged by 5d19b4940).

| Answer | Verdict | Evidence |
|---|---|---|
| A1 | ok | README area registry; holder-lock/spec.md sec 2; unchanged since report 01 |
| A2 | ok | holder-lock/spec.md sec 2, 3 (no takeover from live holder) |
| A3 | ok | holder-lock/spec.md sec 3, 8, 21 (anchor #21-related-files valid) |
| A4 | ok | holder-lock/spec.md sec 4; process/spec.md unchanged |
| A5 | ok | holder-lock/spec.md sec 13, 20 |
| A6 | ok | holder-lock/spec.md sec 20; governance.md unchanged |
| A7 | ok | holder-lock/spec.md sec 3; governance, process unchanged |
| B1 | ok | event-store/spec.md:105 (sec 3); holder-lock/spec.md sec 9 |
| B2 | ok | event-store/spec.md:5-15 (signed D-ADR0055, implementation not started, supersedes L3 clauses 1 and 4), :716 ("L3 clauses 2 and 3 ... stand", every view a rebuildable cache); gate in sec 23 |
| B3 | ok | event-store/spec.md:120-147 (event-seal 58 under state 60 throws lock-order-violation; event-append 70 allowed under state), sec 3, 6, 7, 17 |
| B4 | ok | event-store/spec.md:120-147 (sec 4), :610-700 (23.2 unmet), :689 (sec 24); foundations L3 note at :185 beside unchanged original text; "superseding decision recorded beside original, never in-place" is supported |
| B5 | ok | event-store/spec.md:663 (sec 23.2 "Before acceptance of the implementation": kill matrix, reader stress, Work gate races, multi-clone, legacy/rollback, setup/doctor, tests), :614 (23.1 "done"), :689 (sec 24) |
| B6 | ok | event-store/spec.md:714-716 (signed D-ADR0055); foundations sec 2 authority; governance sec 4, 11. No legacy owner introduced |
| B7 | ok | event-store/spec.md:716 (clauses 2 and 3 stand), sec 7 (:182), sec 26; foundations L3; governance sec 5, 11 |
| C1-C7 | ok | cite only files unchanged since e9c1996a3 (governance, architecture-map, process, foundations outside L3); no cited text changed |

## 4. Advisory

- CTR005: either wording accepted (earlier advisory, unchanged).
- component-boundary.md:84 stale "until the event store decision": route to Step 9 / P7-DOC-GAP-03 (already recorded).

## 5. Seal

sealedAt: 2026-10-17T11:55:30Z
keyPath: plans/260925-documentation-authority-unification/reports/phase-07/step-07-reader-key.md
keySha256: 1568f570026679c959cbc9f42af8e2d0542ee8d5ee9022ac78ad7b10c94a4056
commit: 5d19b4940
reviewer: reviewer:sonnet-session:af694ae076618d5e6@2026-10-17

Key candidate file SHA-256 (docs/platform/, at 5d19b4940):
- README.md bcaf7a435c3e777c5785f4ef417d0c39d61f8818fbf4c340b8eb717b3c203bf0
- platform-foundations.md e050932d75f4a51211f4f163d2999e08a53abd2b944f1742573025cfcc93a89d
- governance.md 0e7d820925c594df12b2895a18158fdb91a2e2c5cf257f5d61463b3e9f7af536
- architecture-map.md 62a92dc3cf248e02ffc6be3d341858b3351f2cc3b3c2e90fbc1b6add9099a165
- component-boundary.md 281aad15e83629d542a9a07b8b68dd09f0fa4eeb12bcf10e3e61b9722a0aeef8
- holder-lock/spec.md 86471bd4c4f88595133209bd9e70e9a7f9db28dbe527b748a080563475194e04
- process/spec.md dbca061feff054beb0141739936b2e91a127805b80afdf040ba8ec2bd983c28e
- event-store/spec.md 66a50ad64c1dff4284eed9f0e8c4338ddc1dee38a3623199c2014b77dc24726d

Status: DONE
Summary: Sealed. keySha256 1568f570026679c959cbc9f42af8e2d0542ee8d5ee9022ac78ad7b10c94a4056 at 5d19b4940. No rework; one advisory for Step 9 (component-boundary.md:84 "until the event store decision" now stale).
