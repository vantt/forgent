# Step 3 wave 1 round 3 review: p02, docs/specs/reading-map.md

Pin `ae141550c`. Record `step-03-records/batch-040.jsonl:11`. I read the whole 72-line source at the pin and all 91 edges (82 inventory, 9 author-added). I extracted per-edge fields with Python, plus the diff, `legacyScan`, `authorAddedEdgeIds`, `unitDispositionReason` and the description-truth keys. I did not run any checker or probe. I cross-checked targets with `git ls-tree` and `git grep` at the pin.

## Verdict: ok (0 outcome defects)

- Path: `docs/specs/reading-map.md`. Set: batch-040.
- Edges reviewed: 91. Dispositions: 31 patch, 33 parked, 24 preserve, 3 phase9-row-flip.
- Diff: 25 changed lines, all `spec:` or head-path retargets. The L21, L25, L28-L30, L34, L38, L39, L41-L43, L46-L52, L55-L58, L64, L68 and L71 hunks match the 31 patch edges. The L45 host-invocation row has no hunk.

## Prior defect (x-p11)

- **maps-j-08195** (L45 `spec: docs/specs/distribution.md`) is fixed. It is now parked as description-rewrite in the same computed unit `item-L45` as the five-file list. That unit holds 08194 (directory) and the five added basename edges (L45C98, C230, C337, C403, C493). All seven are parked description-rewrite, with the same reason and category in both `blockedCategory` and `dependencyCategory`. The diff no longer touches L45.
- The reason's facts hold at the pin.
  - `legacy-cli-transition.md` and `external-provider-protocol.md` exist under `docs/platform/host-invocation-routing/architecture/`.
  - `provider-routing.md` and `node-to-rust-migration.md` exist there too.
  - There is no `rust-cli-and-proof-components-plan.md` in that tree.

## Check against the L12-35 rulings

- **(1) Computed units.** Every mixed unit carries a `unitDispositionReason` naming a distinct claim.
  - Retained-root preserves sit beside parks or patches in L23, L24, L25, L37 and L68. That is the retained-cell exception.
  - L39: 08184 patch (spec pointer) against 08185 park (§13.1 recipe, carriage only).
  - L42: 08190 workflow-carry park against 08191 decision-locator patch.
  - L25: 08157 Step 5 park against 08158 patch.
  - L15: 08142 and 08143 both flip.
  - L36: 08170 and 08171 both park.
  - L44: 08193, `README.md`, `contracts/` and the two contract basenames are all parked.
- **(2) Migration-state rows flip.**
  - 08136 (L3 opening quote block) flips.
  - 08142 and 08143 (L15 "legacy/generated-curated source during migration") flip.
  - I found no other migration-status sentence in the file. L16's "đã được promote/supersede từng phần" describes the retained vision doc and cites a live path, so preserve is right.
- **(6) Scan coverage.**
  - I ran an independent regex scan of full, partial, basename and directory forms over every line. Every legacy hit has an edge or is a suffix of a longer path.
  - `contracts/` (L44) is covered by an added edge, parked.
  - Retained hits are excluded correctly: bare `AGENTS.md`, `CLAUDE.md`, `README.md` (L21), `SKILL.md` and `plan.md`.
  - L37 `critical-patterns.md` has no path form and does not exist in the git tree. It is not an edge.
- **(7) Self-successor notes.** None. The only successor note is on 08155 (`docs/decisions/index.md`), to `docs/knowledge/decisions-index/decision-record.md`, which is a different path.
- **(8) Anchors and labels.**
  - 08150 (L22 `§Dev checkout shell helpers`) is parked on the stale label against the live `3.3 Dev Checkout Channel`. It is no longer patched.
  - The remaining patched `§` labels sit beside matching anchors:
    - `§envelope` with `#3-output-direction-unified-envelope` (08165)
    - `§sổ verb` with `#7-machine-readable-verb-registry` (08166)
    - `§RUL60`, `§RUL45` with `#11-business-rules` (08167, 08207)
    - `§RUL53`, `§RUL93` and similar with `#business-rules` in the h-6979005beaf7 subcomponent spec (08181, 08182, 08189, 08192)
- **Carriage and registry rules (3-5)** do not apply to this file, other than the carriage-only parks 08185 to 08188.

## Spot checks at the pin

- **Description-truth and park facts:**
  - 08149 (L21): `packaging-distribution/spec.md` lines 46 and 94 state that `fgos` and `fgos-runner` come from `package.json` and `bin/*.mjs` via the legacy channel. The row does not claim the channel is current.
  - 08158 (L25): `decision-citation-drift/spec.md` still scans `docs/backlog.md` and `docs/specs/*.md`, with default `docs/specs`. The Step 5 park on 08157 is separate.
  - 08209 (L59): `runner/spec.md` line 196 lists three `bin/fgos.mjs` call sites for `iron-law.mjs`, so the "no call site" gloss is false and the park stands.
- **Whole-file area pointers:** these are consistent under L12-30(7). I found no carry gap among the runner and work-state function names I sampled.
- **Parks that hold:**
  - 08215 (L69): `docs/history/phase-3-compound-learning` has no path in the pin tree.
  - 08186 to 08188: the candidates are carriage-only.
  - 08193 and the four added L44 edges: the row is historical and the successor note names the retired-engine path.
- **Preserves:** the retained paths exist at the pin.

## Outcome defects

None.

## Record-text notes (do not count as rework)

- 08173 (L37): the reason says `docs/user/tutorials/` is absent. That is a statement outside the edge's own passage, and it is true. It is optional.
- descriptionTruth entries on the runner patches reuse generic wording. The verdicts are right.
- 08195 `blockedReason` repeats "Description needs rewrite" twice. Cosmetic.

## Lead-judgment questions (carried over from x-p11, not defects)

1. 08140 (L13): root `docs/architecture-map.md` is preserved while its description reads "v0.2 … CTR001–CTR009". Both are stale beside the live map.
2. 08153 (L24): `docs/decisions/` is preserved while described as holding decision records with OKF headers, but the corpus is retired. Neither is covered by a ruling. Both look like cutover-packet description rewrites under L12-34(7). Please confirm that leaving them as preserve is the intended outcome.

## Set accounting (p02)

- batch-040 (this part): 1 file reviewed, 0 rework, 91 edges reviewed, 0 outcome defects.

Status: DONE
Summary: `docs/specs/reading-map.md` is ok. The earlier 08195 unit split is fixed and the whole L45 item is now parked as description-rewrite. I found no other outcome defect among the 91 edges, the diff or the scan.
