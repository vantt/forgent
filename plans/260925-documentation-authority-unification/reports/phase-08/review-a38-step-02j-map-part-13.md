# review-a38-step-02j-map-part-13

Reviewer: reviewer:sonnet-session:af0af96320bac892e@2026-10-19
Commits: author `9650bdee6`, accounting `6235d0151` (worktree `/home/vantt/projects/forgentX-s8-review` verified detached at `6235d0151`)
Part: 13 (population seeded-semantic-edge-sample, 60 entries, source table `step-02j-census-maps-portals-prose.json`)
Governing rules: L12-26 classes 1-10, L12-7, L12-10, L12-19..L12-27, Lead ruling on generated doc-registry data.
Method: every row read in full (action, owner, anchor, patch, parkedReason, successorNote, flip, status) against the committed consumer passage; targets, anchors, successors and locator holders verified with git ls-files/grep at the pinned commit.


| # | edgeId | consumer:line | action | verdict | rationale |
|---:|---|---|---|---|---|
| 1 | maps-j-04909 | `...-before-attempting-a/merge-idempotent-on-already-merged-branch.md:38` | preserve | ok | ok. Retained `docs/backlog.md` (hand-maintained), pointer to a backlog row; preserve. |
| 2 | maps-j-04916 | `...0ms-timeout/why-ppidof-bounds-its-ps-call-with-a-200ms-timeout.md:63` | preserve-pending-target | ok | ok. docs/explanation file moved before cutover; successor `docs/knowledge/why-claimwork-s-cas-reread-...` exists and matches registry alias (name drift); non-executable note, parked-blocked. |
| 3 | maps-j-04923 | `...erialized-decompose-no-longer-locks-out-the-remaining-children.md:14` | preserve-pending-target | ok | ok. Moved explanation file; successor exists in docs/knowledge; non-executable note. |
| 4 | maps-j-04933 | `...n-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md:109` | preserve | ok | ok. `docs/history/**` exists at input commit; retained, preserved. |
| 5 | maps-j-04938 | `...why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md:20` | preserve | ok | ok. Same, retained docs/history file. |
| 6 | maps-j-04946 | `...sions-splits-engine-bookkeeping-from-design-de/decision-record.md:162` | phase9-row-flip | ok | ok. Generic `docs/specs/<area>.md` template sentence -> Phase 9 row flip (class 6). Note: sits in a decision-record copy; template-sentence rule applied as written. |
| 7 | maps-j-04951 | `...sions-splits-engine-bookkeeping-from-design-de/decision-record.md:235` | preserve | ok | ok. Recounts a past scan scope of a retained `docs/backlog.md`; preserve. |
| 8 | maps-j-04956 | `...sions-splits-engine-bookkeeping-from-design-de/decision-record.md:259` | phase9-row-flip | ok | ok. Generic template sentence, row flip (class 6); same note as maps-j-04946 (past-tense "folded into" could also read as class 5; either way no path patch). |
| 9 | maps-j-04966 | `...uscategory-only-for-the-fr/multi-domain-status-category-schema.md:145` | preserve-pending-target | ok | ok. `docs/decisions/0027-...md` deleted; successor note `work-state/decisions/retired-decision-history.md` verified to hold ADR 0027 (line 536+). Non-executable. |
| 10 | maps-j-04981 | `...ver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md:73` | preserve-pending-target | ok | ok. `docs/decisions/0000-index.md` retired; no unique committed successor (generated `docs/decisions/index.md` is a different artifact); parked without a loose match. |
| 11 | maps-j-04984 | `...ver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md:100` | preserve | ok | ok. Retained docs/history file. |
| 12 | maps-j-04989 | `...ace-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md:70` | cutover-patch-only | ok | ok. RUL40 verified at `runner/subcomponents/h-6979005beaf7/spec.md:72` under `## Business Rules` (anchor business-rules, line 25); matches L12-26 class 1 (RUL40 -> runner business-rules subcomponent). cutover-patch-only/proposed-only, proper form. |
| 13 | maps-j-04991 | `...ace-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md:123` | preserve-pending-target | ok | ok. Moved explanation file; successor verified (docs/knowledge/why-a-repo-that-only-installs-...); non-executable. |
| 14 | maps-j-04994 | `...e-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md:71` | preserve-pending-target | ok | ok. Moved explanation file; successor verified (interface-daemon doc); non-executable. |
| 15 | maps-j-05008 | `...proof-but-never-a/iron-law-evidence-contract-stays-human-gated.md:68` | preserve | ok | ok. `docs/history/<id>/...` placeholder topology of external projects (L12-10); preserve. |
| 16 | maps-j-05014 | `...vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md:9` | preserve | ok | ok. Retained docs/history file. |
| 17 | maps-j-05017 | `...vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md:66` | cutover-patch-only | rework | REWORK. Citation is "`docs/specs/runner.md`'s own `0031` section" (decision locator). Holder is `docs/platform/runner/decisions/h-36d872fbb0e5.md:993` (`### 0031 - Bo guard cam tu orchestrator...`); row maps to runner README (area default) as a navigation patch. Should be cutover-patch-only to h-36d872fbb0e5.md#<0031 heading slug> (or preserve if judged a historical pointer-maintenance recount). |
| 18 | maps-j-05022 | `...-needed-a/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md:80` | preserve | ok | ok. Quoted correction note naming a retained history file (class 5 historical); preserve. |
| 19 | maps-j-05024 | `...-needed-a/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md:97` | preserve-pending-target | ok | ok. docs/how-to file moved before cutover (absent at input commit); successor verified and equals doc-registry alias currentPath; non-executable. |
| 20 | maps-j-05036 | `...-decisions-heading-contract-between-plan-mjs-s/decision-record.md:132` | preserve | ok | ok. Wrapped token `docs/history/.../CONTEXT.md:164` joined correctly; retained file; preserve. |
| 21 | maps-j-05046 | `...p-s/why-the-stage-status-driving-split-decision-got-superseded.md:95` | preserve | ok | ok. Retained docs/history file. |
| 22 | maps-j-05053 | `...status-and-stage-separate/work-item-lifecycle-and-domain-model.md:114` | preserve | ok | ok. `**Source:**` provenance label on a deleted history target; no unique successor in tree; preserve. |
| 23 | maps-j-05061 | `...s-actors-handoffs/work-item-pipeline-stages-verbs-and-handoffs.md:17` | preserve | ok | ok. Retained docs/history file. |
| 24 | maps-j-05075 | `...-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md:26` | preserve-pending-target | rework | REWORK. `docs/decisions/0026:73-87` names decision 0026, whose retained body is `runner/decisions/h-36d872fbb0e5.md:583` (`### 0026 - Native-First Dispatch Doctrine: launcher/rootTask/capacity`). Park is right for the line range, but "No unique exact mapping / successor null" is wrong: a non-executable successor note to that decision section is findable (maps-j-04966 for decision 0027 got one). |
| 25 | maps-j-05080 | `...-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md:462` | preserve | ok | ok. Retained docs/history file. |
| 26 | maps-j-05088 | `docs/platform-foundations.md:21` | preserve | ok | ok. docs/distillery deep-dives exist and are retained (class 3); preserve. Carriage-region label on root platform-foundations.md is loose wording only. |
| 27 | maps-j-05090 | `docs/platform-foundations.md:37` | preserve | ok | ok. docs/distillery/sources retained; glob resolves to directory; preserve. |
| 28 | maps-j-05091 | `docs/platform-foundations.md:176` | preserve | ok | ok. Deleted `docs/history/phase-3-compound-learning/...` target; no successor in tree; dated evidence pointer; preserve. |
| 29 | maps-j-05097 | `docs/platform/README.md:34` | phase9-row-flip | ok | ok. Migration-state cell in platform README row; Phase 9 row flip, owner `docs/platform/platform-foundations.md` exists. |
| 30 | maps-j-05101 | `docs/platform/README.md:37` | phase9-row-flip | ok | ok. `docs/contracts/` stays valid -> status-only row flip. |
| 31 | maps-j-05110 | `docs/platform/README.md:50` | phase9-row-flip | ok | ok. Row flip to docs/platform/agent-coordination/; matches class 6. |
| 32 | maps-j-05122 | `docs/platform/agent-confinement/history/rollout-and-settled-facts.md:17` | preserve-pending-target | rework | REWORK. Related entry `docs/specs/confinement-authority.md` in a History carriage file maps to the consumer itself (`history/rollout-and-settled-facts.md`) and is parked as "root authority stays retained" (wrong: the file is under docs/specs/**, which retires). Whole-file default is `docs/platform/agent-confinement/README.md`; sibling Related rows maps-j-05118/05120/05126 are cutover-patch-only to that README. No self-patch needed: patch to README. |
| 33 | maps-j-05128 | `docs/platform/agent-confinement/spec.md:603` | preserve | ok | ok. Root authority `docs/routing-handoff-contract.md` retained in place (class 3); preserve. |
| 34 | maps-j-05133 | `docs/platform/agent-coordination/architecture/README.md:28` | phase9-row-flip | ok | ok. "promoted from" migration-state sentence -> row flip. |
| 35 | maps-j-05136 | `...latform/agent-coordination/architecture/dispatch-control-plane.md:97` | preserve | rework | REWORK. Live architecture sentence (present-state description of `dispatch execute` removal), not a completed action on the legacy file. "decision 0062 in `docs/specs/runner.md`" is a decision locator; holder is `runner/decisions/h-36d872fbb0e5.md:1716` (`### 0062 - Xoa cua tho...`). Row is preserved as historical-narrative with owner README; should be cutover-patch-only to h-36d872fbb0e5.md#<0062 slug>. |
| 36 | maps-j-05146 | `docs/platform/agent-coordination/architecture/runtime-model.md:17` | cutover-patch-only | ok | ok. Related list, whole-file ref without locator -> runner README, cutover-patch-only, form correct. |
| 37 | maps-j-05147 | `docs/platform/agent-coordination/architecture/runtime-model.md:74` | preserve | ok | ok. Already-new path link, preserved. |
| 38 | maps-j-05163 | `docs/platform/agent-coordination/decisions/README.md:17` | cutover-patch-only | ok | ok. Related list -> runner README, same as maps-j-05146. |
| 39 | maps-j-05171 | `.../documentation-migration/documentation-standardization-plan.md:42` | preserve | ok | ok. Header lineage in history carriage file; root authority retained; preserve. |
| 40 | maps-j-05176 | `.../documentation-migration/documentation-standardization-plan.md:233` | preserve | ok | ok. Plan evidence table in history carriage file; glob -> directory; preserve. |
| 41 | maps-j-05189 | `.../documentation-migration/documentation-standardization-plan.md:624` | preserve | ok | ok. "Proof root / Must preserve" column is provenance; preserve. |
| 42 | maps-j-05191 | `.../documentation-migration/documentation-standardization-plan.md:626` | preserve | ok | ok. Same provenance column. |
| 43 | maps-j-05192 | `.../documentation-migration/documentation-standardization-plan.md:627` | preserve | ok | ok. Same provenance column. |
| 44 | maps-j-05200 | `.../documentation-migration/documentation-standardization-plan.md:640` | preserve | ok | ok. Same provenance column. |
| 45 | maps-j-05212 | `.../documentation-migration/migration-status.md:30` | preserve | ok | ok. Link to already-new `verification/README.md` in a completed-phase history table; preserve. |
| 46 | maps-j-05213 | `.../documentation-migration/phase-7-completion.md:16` | preserve-pending-target | ok | ok. Related entry names legacy plan whose only candidate holder is History-typed carriage; patches never point into carriage -> park with non-executable note. |
| 47 | maps-j-05215 | `.../documentation-migration/proof-preservation.md:17` | cutover-patch-only | ok | ok. Related list, README default, cutover-patch-only. |
| 48 | maps-j-05219 | `.../documentation-migration/source-inventory.md:34` | preserve | ok | ok. Link to already-new verification index in completed-action prose; preserve. |
| 49 | maps-j-05233 | `.../documentation-migration/source-inventory.md:62` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 50 | maps-j-05241 | `.../documentation-migration/source-inventory.md:70` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 51 | maps-j-05255 | `.../documentation-migration/source-inventory.md:84` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 52 | maps-j-05263 | `.../documentation-migration/source-inventory.md:92` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 53 | maps-j-05268 | `.../documentation-migration/source-inventory.md:97` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 54 | maps-j-05287 | `.../documentation-migration/source-inventory.md:114` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 55 | maps-j-05289 | `.../documentation-migration/source-inventory.md:115` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 56 | maps-j-05302 | `.../documentation-migration/source-inventory.md:121` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 57 | maps-j-05307 | `.../documentation-migration/source-inventory.md:124` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 58 | maps-j-05309 | `.../documentation-migration/source-inventory.md:125` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 59 | maps-j-05317 | `.../documentation-migration/source-inventory.md:129` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |
| 60 | maps-j-05322 | `.../documentation-migration/source-inventory.md:131` | preserve | ok | ok. Source-locator column of the migration ledger (`source-inventory.md`, column 1) or its destination column; provenance preserved (L12-21/L12-25 class 4). Target exists. |

## Totals

- Entries: 60; ok 56; rework 4; needs-Lead-judgment 0.
- Rework rate: 4/60 = 6.7% (limit 3%): BREACH, expansion to all step-02j edges applies.

## Rework by defect class

1. Locator citation not mapped to the exact decision holder (L12-26 class 1 "decision N" not fully fixed; NEW sub-pattern: the parser captured the token, e.g. `loc: ['decision 0062']`, but the owner was still chosen as the area README or left unresolved, and one such row was misfiled as class 5 historical). Rows: maps-j-05017 (decision 0031), maps-j-05075 (decision 0026, successor note missing), maps-j-05136 (decision 0062). All three holders are in `docs/platform/runner/decisions/h-36d872fbb0e5.md` (lines 993, 583, 1716). Likely more rows citing "decision NNNN in docs/specs/runner.md" across the census share this.
2. Related-list entry in a History carriage file resolved to the consumer itself and parked (L12-26 class 8 not fully fixed): maps-j-05122. Correct is the area README default, matching siblings maps-j-05118/05120/05126. The "target is history/carriage" guard fires when the area's mapped destination for provenance is the History file itself; likely repeats for other area `history/*` files whose Related lists a retiring `docs/specs/<area>.md`.

Not rework (notes): maps-j-04946/04956 generic `docs/specs/<area>.md` sentences inside a frozen decision-record copy follow class 6 as written; Lead may prefer class 5 preserve (no path patch in either case).
