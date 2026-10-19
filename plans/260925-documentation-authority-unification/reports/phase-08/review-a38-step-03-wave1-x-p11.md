# Step 3 wave 1 expansion review: p11, docs/specs/reading-map.md

Pin `ae141550c`; worktree HEAD `836cc0fe1`. Record `step-03-records/batch-040.jsonl:11`, line sha256 `143bf413...437b8`. Author-diff text sha256 `225e4c54...5334`. I read the whole 72-line source, every edge, every searchWitness group, the descriptionTruth, anchors and relativeResolution entries, and the diff. I also read the cited targets at the pin. I did not run the checker or probes.

## Verdict: rework (1 outcome defect, edge maps-j-08195)

- Path: `docs/specs/reading-map.md`. Set: batch-040. Stratum: patched.
- Edges reviewed: 90 (82 inventory edges plus 8 author-added). Dispositions: 33 patch, 30 parked, 24 preserve, 3 phase9-row-flip.
- Diff check: I re-applied the 33 patch edges (27 source lines) to the pinned source. The changed lines equal the record diff exactly.
- Earlier defects: pilot r4-g02 (ok) left one open concern, the 08192 description comparison. L12-33 closed it, and a descriptionTruth entry now exists. The wave-1 reviews p01-p03 and u01-u04 list no defect for this file.

### Outcome defects

1. **maps-j-08195** (L45, `spec: docs/specs/distribution.md`, patch to `docs/platform/packaging-distribution/spec.md`, Phase 9). It breaks the same-row rule in L12-32(3), reinforced by L12-34(3). The same bullet carries a description-rewrite park on the directory edge 08194 and on the five author-added basename edges (L45C98, C230, C337, C403, C493). The park reason is that the "5 tệp" list does not match the candidate layout, and says "rewrite the entire list at Phase 9 before a path-only retarget". In L35 and L36 the other citations in a description-rewrite row wait together ("Same-row citations must wait together"). The patch rewrites a span inside a row that Phase 9 must rewrite whole.
   - Correction: park 08195 as description-rewrite with the same row reason, and dependencyCategory and blockedCategory description-rewrite. It then needs a searchWitness or the same row witness. Drop the patch hunk on L45 from the diff.
   - Its descriptionTruth entry compares "5 tệp" against packaging-distribution/spec.md and says "matches". That is the wrong target for the list. The list belongs to the host-invocation-routing tree, where the comparison is a mismatch. The entry must be rewritten with the park.

No other outcome defects. Per-edge findings:

- Patch dispositions (33): every target exists at the pin and the diff is exact.
  - Anchors (checked against headings):
    - `33-dev-checkout-channel` (08150) matches `## 3.3 Dev Checkout Channel`.
    - RUL53, RUL93, RUL84 and RUL89 sit in `## Business Rules` of `runner/subcomponents/h-6979005beaf7/spec.md` (08181, 08182, 08189, 08192).
    - RUL45 and RUL60 sit in `## 11. Business Rules` of work-state/spec.md (08167, 08207).
    - `#3-output-direction-unified-envelope` and `#7-machine-readable-verb-registry` hold the envelope and verb-registry claims (08165, 08166).
    - The `lịch-sử-quyết-định-retired…` H2 is the nearest common parent of ### 0048 and ### 0049 (08191).
  - Bare "spec: docs/specs/runner.md" and similar pointers go whole-file under L12-30(7). That is correct, as the pilot closed for 08192.
- Row-flip dispositions (08136, 08142, 08143): correct. 08136 is the opening migration-status quote block. 08142 and 08143 share one unit and one reason.
- Preserve dispositions (24): all paths exist at the pin.
  - `docs/tutorials/` has a tracked `.gitkeep`.
  - `docs/decisions/index.md` has a successor note to `docs/knowledge/decisions-index/decision-record.md`, which exists and does not match the edge path.
  - The root architecture-map preserves (08140, 08160) follow L12-34(7).
  - `docs/reference/herdr-web-dashboard-layout.md` has a registry alias, but its same-row park (08171) is correct.
  - The other docs/how-to and docs/reference paths have no alias.
- Parked dispositions (30, including 8 author-added), each checked against the target state:
  - 08169, 08170, 08171, 08209 are confirmed against the targets.
    - claude-plugin lines 55, 168 and 180: check is not shipped, and there are more than 12 verbs.
    - herdr spec: port 4170.
    - runner/spec.md line 196 lists iron-law call sites.
  - 08185 holds: confinement §13.1 exists only in `agent-confinement/history/rollout-and-settled-facts.md` (line 51), which is carriage.
  - 08186, 08187, 08188 hold: the candidates are carriage-only (`architect-readme.md`; `architecture-intent.md` is "Agent carriage"; `domainization.md` is "Source snapshot retained").
  - 08190 is workflow-carry, per L12-30(9).
  - 08215 holds: `docs/history/phase-3-compound-learning/` has no git history at all.
  - The 8 author-added L44 and L45 basename edges are correct under L12-34(5). The check that `rust-cli-and-proof-components-plan.md` is absent from the candidate tree and that the two renames exist holds against the pin tree listing.
  - GAP-02 notes (08138, 08154, 08177, 08180, 08203, 08204) follow L12-30(2) and L12-32(6).
  - 08157 is the Step 5 scan-scope park (L12-30(8)). 08158 is a distinct pointer, and its target spec (lines 39, 59) still states the same scan scope, so the description stays true.
- Unit and same-row consistency otherwise holds.
  - L15 is uniform row-flip.
  - L35, L36, L40 and L44 park uniformly.
  - L39 (08184 label versus 08185 §13.1 locator), L42 (08190 workflow versus 08191 runner decision) and L25 (08157 versus 08158) are distinct claims with distinct reasons.
- Missed references: none that are outcome-relevant. I scanned the whole source for full and partial legacy forms, bare basenames and tree-relative paths. Every hit is joined to an edge or is a retained or live path. The retained or live ones are `docs/platform/*`, `docs/transitional-switchboard.md`, `docs/enduser-docs-index.json`, root `README.md`, `AGENTS.md`/`CLAUDE.md`, `plans/...` and code files.

## Record-text notes (do not count as rework)

- maps-j-08173 (L37): the reason says "Correct the stale absence description in the whole migration status unit at cutover". L37 contains no absence description of docs/tutorials. That sentence looks copied from another file. The factual part (`.gitkeep` only, `docs/user/tutorials/` absent) is true.
- descriptionTruth notes on 08149, 08150, 08165, 08166, 08195 and the runner patches reuse boilerplate that cites unrelated sections, for example RUL102 and the "native default versus npm channel" text on the dev-helper or CLI-contract edges. The verdicts are right for those edges. The prose does not describe the compared passage.
- 08150: the diff keeps the visible label `§Dev checkout shell helpers` next to the new anchor `#33-dev-checkout-channel`. The target heading is "3.3 Dev Checkout Channel". `checks.anchors.locatorCorrespondence` records this. The pilot accepted the same sentence in system-overview, so it is only a note.
- The anchors checks reuse "no heading citation asserted" for bare pointers, and that is correct.
- L44 `contracts/` is a tree-relative directory reference that resolves from the retiring agent-coordination tree. It has no edge. The whole row is parked anyway, so there is no outcome effect. L12-34(5) speaks of files.

## Lead-judgment questions

1. 08152 (L23 "legacy spec: docs/specs/distribution.md §Setup, §Doctor") is a description-rewrite park. 08142 and 08143 (L15 "legacy/generated-curated source during migration") are phase9-row-flip. Both are migration-status glosses on the same target file. I judged the split acceptable. The L15 sentence is a conflict-resolution rule (row-flip with replacement text). L23 is a locator label that a live §6 holder could answer (L12-30(6)). Confirm it, or ask for one disposition for all three.
2. Stale descriptions on preserved retained paths:
   - 08140: root architecture-map is described as "v0.2 … CTR001–CTR009", but at the pin it is v0.6.
   - 08153: `docs/decisions/` is described as holding decision records with OKF headers, but the corpus is retired and only `index.md` remains.
   - No rule requires parking a preserve for a stale description. These look like A45 cutover-packet description rewrites (L12-34(7)). Say whether they should be recorded now.
3. Bare decision ids and prose locators (ADR0010, ADR0009, "decision 0014", 0026→0029, D-ADR0070, "spec Work-State RUL10") carry no path token and are not edges. This is consistent with L12-32(6), so I raise no defect. L36 (decision 0014) and L29 (RUL10) are the two where a reader could expect a note.
4. 08136's reason says to retain the `docs/transitional-switchboard.md` route in the replaced block. The phase-09 plan I read does not say that the switchboard survives cutover. This is only a Phase 9 replacement-text assumption.

## Set accounting (p11)

- batch-040 (patched), this part: reviewed 1 file / rework 1 file (1 outcome edge: maps-j-08195).
- Pilot r4 had this file ok; the new rework is from the same-row rule applied to the added L45 basename parks. This was the 3% set threshold file, so the batch-040 totals need the Lead's other parts.

Status: DONE
Summary: docs/specs/reading-map.md is rework on one edge, maps-j-08195. The L45 distribution.md pointer is patched while the rest of that row is a description-rewrite park. The other 89 edges, the exact diff, targets, anchors and the added-edge parks are correct.
