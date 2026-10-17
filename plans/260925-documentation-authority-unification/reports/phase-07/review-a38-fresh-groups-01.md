# A38 fresh group derivation review (Phase 7 Step 1/2, items 1 and 2)

- Reviewer: reviewer:claude-session:a4954387@2026-10-17
- Author session: codex-session:fgos-run_unit-run-17922054c556f0@2026-10-17
- Review mode: ordinary
- Request commit: 573451ffe

## Method

1. Verified both digest commands: fresh inventory index passes (75 parts, all bytes and SHA-256 match; exit 0). The cross-area index was not in scope for this pass.
2. Loaded all 4,486 file rows (`blobSha`, `area`, `firstHeading`, `path`) from the 75 parts. I did not read the producer's group arrays.
3. Duplicate-content groups: rows grouped by `blobSha`, size > 1. Semantic groups: key `slug(area):slug(firstHeading or filename without extension)`, size > 1, using the production slug rule (lowercase, strip backtick/`*`/`_`/`~`, drop non-letter/digit/space/hyphen, whitespace to hyphen). The rule was read from `scripts/generate-doc-inventory.mjs` only to match the slug.
4. Native exclusions, taken from pinned evidence and not from the queue: (a) duplicate groups whose members are all evidence-payload mirrors (`isEvidenceMirrorPath`, `scripts/check-doc-inventory-gates.mjs`); (b) groups closed in `ledger/conflict-resolutions.json` (kind+key, same join as `openConflictGroups` in `scripts/check-doc-retirement.mjs`).
5. Frozen before opening `phase-06/step10-other-group-queue.json`. Scratch in `work-p7s1-groups/`: `derive.py` sha256 `6604bc5b...6226`, `derivation.json` sha256 `15f8d18f...99bc`, `open-groups.json` (the frozen result) sha256 `d4722365...ed86`. Frozen at 2026-10-17, before the queue was read.

## Derived counts

| Measure | Count |
|---|---|
| Rows | 4,486 |
| Duplicate-content groups (all) | 822 |
| of which all-mirror (native exclusion) | 814 (matches `step10-retirement-group-counts.json` `mirrors: 814`) |
| Non-mirror duplicate groups | 8 |
| Closed by `conflict-resolutions.json` (the 78-file history-spanning group, the 3-file svg group, two `docs/history` iron-law-evidence pairs) | 4 |
| **Open duplicate groups** | **4** |
| Semantic groups (all) | 219 |
| Closed by `conflict-resolutions.json` | 191 |
| **Open semantic groups** | **28** (27 pairs, 1 triple) |

Without the resolution join the non-mirror counts would be 8 and 81, so the exclusions do the work; the checker's own join reproduces the pinned 4 and 28 (`rehearsal-step-10.md`: "4 duplicate + 28 semantic groups").

## Groups

| Group | Members | Verdict | Note |
|---|---|---|---|
| dup 2ff043edb | `docs/architecture-manifest.json`; `docs/platform/contracts/architecture-manifest.json` | ok | Members equal queue; queue keys it as blob e6d9582dd (stale, see comparison). Rows must key on paths/current blob. |
| dup 11684583c | `docs/contracts/fgos-gateway-api-v1.yaml`; `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | ok | Blob key matches queue. |
| dup c51d82267 | `docs/platform/ui-spec/architecture/spec.config.yaml`; `docs/ui-spec/spec.config.yaml` | ok | Blob key matches queue. |
| dup 2f163ff60 | `docs/platform/ui-spec/history/schema/surface-contract.schema.json`; `docs/ui-spec/schema/surface-contract.schema.json` | ok | Blob key matches queue. |
| sem `agent-confinement:spec-agent-confinement-authority` | `platform/agent-confinement/spec.md`; `specs/confinement-authority.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `claude-plugin-surface:spec-fgos-plugin-claude-code-slash-command-surface` | `platform/claude-plugin/spec.md`; `specs/fgos-plugin.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `decision-citation-drift:spec-decision-citation-drift-check` | `platform/decision-citation-drift/spec.md`; `specs/decision-citation-drift.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `distillery-reference-learning:distillery-porting-lifecycle` | `platform/distillery/spec.md`; `specs/distillery.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `documentation-system:transitional-documentation-authority-switchboard` | `platform/documentation/switchboard.md`; `transitional-switchboard.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `herdr-gateway-and-web-dashboard:spec-herdr-web-dashboard-browser-surface-for-fgos-work` | `platform/herdr-web-dashboard/spec.md`; `specs/herdr-web-dashboard.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `observe-metrics-and-friction:observe-component-specification` | `platform/observe/spec.md`; `specs/observe.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `packaging-distribution:runtime-identity-and-activation` | `architect/packaging-distribution/runtime-identity-and-activation.md`; `platform/packaging-distribution/architecture/runtime-identity-and-activation.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `platform-documentation-unmapped-candidate:historical-file-prior-navigation-before-whole-file-historical-relocation` | `platform/agent-coordination/history/retired-engine/inbound/agent-coordination/history/documentation-migration/migration-status.md`; `platform/agent-coordination/history/retired-engine/inbound/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md`; `platform/agent-coordination/history/retired-engine/inbound/intent-preservation-ledger.md` | ok | Intra-platform history triple (3 retired-engine inbound files, full-read per Step 2). Members equal queue. |
| sem `runner-dispatch-merge-lifecycle:spec-runner-vòng-tự-hành` | `platform/runner/spec.md`; `specs/runner.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `skills-and-domainization:fgos-domainization-architecture` | `architect/domainization/README.md`; `platform/domainization/architecture/domainization.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `system-overview:spec-system-overview` | `platform/system-overview/spec.md`; `specs/system-overview.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:c01-item-card-status-pill-quick-actions` | `platform/ui-spec/architecture/components/C01-item-card.md`; `ui-spec/components/C01-item-card.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:domain-rules` | `platform/ui-spec/contracts/20-domain-rules.md`; `ui-spec/20-domain-rules.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:f01-answer-a-parked-question-end-to-end` | `platform/ui-spec/operations/F01-answer-a-parked-question.md`; `ui-spec/flows/F01-answer-a-parked-question.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:f02-approve-a-merge-end-to-end` | `platform/ui-spec/operations/F02-approve-a-merge.md`; `ui-spec/flows/F02-approve-a-merge.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:herdr-web-dashboard-ui-spec-overview` | `platform/ui-spec/spec.md`; `ui-spec/00-overview.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:m01-answer-a-parked-question` | `platform/ui-spec/architecture/modals/M01-answer-question.md`; `ui-spec/modals/M01-answer-question.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:m02-approve-a-merge` | `platform/ui-spec/architecture/modals/M02-approve-merge.md`; `ui-spec/modals/M02-approve-merge.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:m03-add-or-edit-a-work-item` | `platform/ui-spec/architecture/modals/M03-add-edit-item.md`; `ui-spec/modals/M03-add-edit-item.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:s01-sign-in` | `platform/ui-spec/architecture/screens/S01-sign-in.md`; `ui-spec/screens/S01-sign-in.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:s02-taskboard` | `platform/ui-spec/architecture/screens/S02-taskboard.md`; `ui-spec/screens/S02-taskboard.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:s03-task-detail` | `platform/ui-spec/architecture/screens/S03-task-detail.md`; `ui-spec/screens/S03-task-detail.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:s04-questions-needing-answer` | `platform/ui-spec/architecture/screens/S04-questions-needing-answer.md`; `ui-spec/screens/S04-questions-needing-answer.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:specconfig` | `platform/ui-spec/architecture/spec.config.yaml`; `ui-spec/spec.config.yaml` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:states-and-errors` | `platform/ui-spec/contracts/30-states-and-errors.md`; `ui-spec/30-states-and-errors.md` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:surface-contractschema` | `platform/ui-spec/history/schema/surface-contract.schema.json`; `ui-spec/schema/surface-contract.schema.json` | ok | Pair: candidate vs own legacy. Members equal queue. |
| sem `ui-specification:system-events` | `platform/ui-spec/contracts/15-system-events.md`; `ui-spec/15-system-events.md` | ok | Pair: candidate vs own legacy. Members equal queue. |

## Comparison with the Phase 6 queue (done after the freeze)

Queue: 32 groups (4 duplicate, 28 semantic). Derived: 4 duplicate, 28 semantic.

- Added (derived, not in queue): 1 by key, `duplicate 2ff043edb...` (`docs/architecture-manifest.json` + `docs/platform/contracts/architecture-manifest.json`). It is the same group as the queue's `duplicate e6d9582dd...` (identical two paths); see member drift.
- Missing (in queue, not derived): 1 by key, the queue's `e6d9582dd...`, same group as above.
- Member drift: 0 path-set drift in any of the 32 groups. All 28 semantic keys and member sets are exactly equal; 3 of 4 duplicate keys and member sets are exactly equal.
- Key drift (not path drift): the manifest pair has blob `2ff043edb...` at B0 and at the Phase 6 pin `2a028cdc9`. The queue records `e6d9582dd...`, which was the blob at queue commit `19ca8de23`; the content then changed (`ae8c6691` at `980cb2931`, `e6d9582d` at `19ca8de23`, `2ff043ed` by the pin). Both files changed together, so the group is the same and still open (no `conflict-resolutions.json` entry under either blob).

Equality is therefore demonstrated for all 28 semantic and 3 duplicate groups, and for the 4th duplicate by member set, with one stale blob key in the queue.

## Notes

- The queue's `e6d9582dd` is a stale identifier. Any downstream row (Step 2 or Step 6 projection/copy group) that keys the manifest pair on that blob must be re-keyed to `2ff043edb` or key on the two paths. The queue file was not edited.
- 27 of the 218 semantic entries in `conflict-resolutions.json` have no matching group in the B0 derivation (stale keys); harmless to the join, and I did not rule on whether they should be pruned.
- The 4 duplicate groups are the Step 6 projection/copy groups per the plan routing; the 28 semantic groups go to Step 2 (27 candidate-versus-own-legacy pairs plus the one intra-platform history triple, matching the plan's description).
- Verdicts are on group membership and scope only. I did not review dispositions or target owners (outside items 1 and 2). Items 3 and 4 (cross-area rows) were not done here.

## Unresolved

- Whether the producer should refresh the queue's manifest blob id to `2ff043edb` or leave the queue as a dated record. This is the producer's decision, since the request forbids baseline edits.

Status: DONE
Summary: Fresh derivation gives 4 open duplicate and 28 open semantic groups, matching the Phase 6 queue exactly on every member set. One duplicate group (architecture-manifest pair) carries a stale blob key in the queue.
Concerns: Stale blob key `e6d9582dd` in the queue; rows keyed on it would not join.
