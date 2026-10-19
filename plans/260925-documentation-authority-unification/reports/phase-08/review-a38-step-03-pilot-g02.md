# Step 3 pilot semantic review: batch-040, docs/specs/reading-map.md

Reviewer scope: batch-040 record for `docs/specs/reading-map.md` (82 edges, `maps-j-08136..08217`). Source read in full at the author pin `ae141550c`, every line carrying an edge, 72 lines / 35,721 bytes, digest matches the record. Candidate targets read at the same pin:
- `docs/platform/packaging-distribution/spec.md` (heading outline plus the region around 3.3, 6, and the "Retained Distribution Source Detail" carriage at lines 459-784)
- `docs/platform/runner/spec.md` and `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
- `docs/platform/work-state/spec.md` and `docs/platform/work-state/contracts/cli-io-contract.md`
- `docs/platform/agent-confinement/spec.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/decision-citation-drift/spec.md` and `README.md`
- `docs/platform/domainization/architecture/domainization.md`
- `docs/platform/system-architecture/architecture/architecture-intent.md`
- `docs/architect/README.md`
- `docs/doc-registry.json` aliases, `plans/.../alias-table.json` (empty), `docs/transitional-switchboard.md`

## File verdict

- Path: `docs/specs/reading-map.md`
- Set: batch-040
- Digest: `c74cc8ddd669ce52a67f989db2aab55901f7b5befcdff2154ebce83f302f6756`
- Verdict: **rework**
- Edges reviewed: 82
- Counts by disposition: 24 patch, 2 phase9-row-flip (3 edges), 25 preserve, 30 parked.

Everything else I checked is sound:
- The single diff (hunks `-18,45` and `-65,8`) is pure path substitution with no backtick, prefix, slash or label loss.
- Patched targets exist at the pin: packaging-distribution, runner, work-state, claude-plugin, herdr-web-dashboard, agent-confinement, observe, and the `host-invocation-routing/` directory with its README.
- Both row flips are whole-block, Phase 9, and join their edges once (08142/08143).
- The 22 preserves of retained root paths (rule 3) and directories are right: the paths exist at the pin and the alias table is empty.
- Parked 08138, 08154, 08177, 08180, 08203, 08204 (P8-DOC-GAP-02), 08190 (workflow carry), 08185 (§13.1) and 08157 (glob scan scope, Step 5) are correctly parked.
- 08185 is verified: the live agent-confinement spec has no §13.1, only a 13.2 under "Current settled facts".

## Defects (findings)

Parked edges that the rules turn into patches. L12-26 class 1 says a locator maps to the exact candidate file that holds the content, and a parked edge that could have been a patch is rework.

| edgeId | Source line | Rule | Problem and required correction |
|---|---|---|---|
| maps-j-08158 | 25 | L12-26(1), Lead ruling that a "Carriage only / Canonical: No" header is candidate status | `spec: docs/specs/decision-citation-drift.md` is parked as "missing live non-carriage successor". `docs/platform/decision-citation-drift/spec.md` exists at the pin, with Provenance naming exactly this legacy file and a live "Spec: Decision Citation Drift Check" body. Patch to it. |
| maps-j-08165 | 29 | L12-26(1) names "§envelope" explicitly | Parked as "no proven live section". `docs/platform/work-state/contracts/cli-io-contract.md` has `## 3. Output Direction Unified Envelope` / `### Envelope Shape`. Patch the file, keeping `§envelope`; use the GitHub slug if an anchor is added. |
| maps-j-08166 | 30 | L12-26(1) | `§sổ verb` parked. cli-io-contract.md has `## 7. Machine-Readable Verb Registry`. Patch to cli-io-contract.md. |
| maps-j-08167 | 34 | L12-26(1) names RUL10/45/60 → work-state | `§RUL60 (hành vi)` parked. work-state/spec.md `## 11. Business Rules` carries RUL60 (line 1089), live. Patch to `docs/platform/work-state/spec.md`. |
| maps-j-08168 | 34 | L12-26(1), bare whole-file reference | `docs/specs/runner.md (lớp hướng dẫn)` has no locator. runner/spec.md Pointers (lines 198-199) hold the guidance-layer entry (P50). It sits in the same sentence as 08167, so it should be patched and joined to the same hunk. |
| maps-j-08207 | 57 | L12-26(1) | `§RUL45` parked. work-state/spec.md line 1077 holds RUL45, live. Patch. |
| maps-j-08181 | 38 | L12-26(1) names RUL53/93 → runner business-rules subcomponent | `runner.md §RUL53` parked. RUL53 is at line 90 of `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (`## Business Rules`, not carriage). Patch to that file. |
| maps-j-08182 | 38 | same | `runner.md §RUL93` parked. RUL93 is at line 187 of the same subcomponent. Patch to it. |
| maps-j-08183 | 38 | L12-26(1) | Trailing `spec: docs/specs/runner.md` after the config clause has no locator. It is a read-only citation and is parked only for generic "tree/schema" reasons. Patch to `docs/platform/runner/spec.md` like the bare runner pointers in lines 46-59. |
| maps-j-08189 | 41 | L12-26(1) | `spec: docs/specs/runner.md` follows "(RUL89 ...)". RUL89 is live in the same subcomponent (line 183). Patch (subcomponent for RUL-cited content, or runner/spec.md Pointers 173-174). Parking contradicts the neighbouring bare pointers, which are patched. |
| maps-j-08192 | 43 | L12-26(1) | Same pattern for RUL84 (subcomponent line 178). Patch. |
| maps-j-08210 | 64 | L12-26(1), 9 | The list "holder-lock/spec.md §14, §16–§18, docs/specs/runner.md" has no locator on runner.md. The holder-lock §14/§16-§18 exist live (lines 292, 318, 334). Patch runner.md to `docs/platform/runner/spec.md`. |
| maps-j-08171 | 36 | L12-26(2) | Parked as "no verified committed live target", which is false. `docs/reference/herdr-web-dashboard-layout.md` is absent at the pin, but `docs/doc-registry.json` aliases it to `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md`, which exists. Patch to the successor path (same line, same hunk as 08170), or park naming that successor and the name-drift question. |

Wrong patch:

| edgeId | Source line | Rule | Problem and required correction |
|---|---|---|---|
| maps-j-08194 | 45 | L12-26(6): sentences about how the legacy tree is organised are parked | The bullet describes `docs/architect/host-invocation-routing/` as "5 tệp: host-invocation-provider-routing.md ... node-to-rust-component-migration.md ...". Retargeting only the label to `docs/platform/host-invocation-routing/` makes a false claim, since that directory has a different, larger file set. It is inconsistent with the analogous 08193 (agent-coordination tree), which is parked. Park it (or row-flip it) together with the tree description. |

Record text defects:

- **maps-j-08215** (preserve, line 69): `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` does not exist at the pin, and no file named f4-benchmark exists anywhere. Rule 3 (retained path that exists) cannot be the basis. The record must say the target is absent at the pin, no successor is found, and the reference joins the Phase 9 broken-link baseline (L12-26(2), 10). The disposition itself is acceptable.
- **maps-j-08186, 08188, 08193** (parked): the dependency string cites "P8-DOC-GAP-02 (enduser-docs and curated foundations)", which does not apply. Each should name its real smallest dependency:
  - 08186: no live architect-index successor under `docs/platform/system-architecture/`, where there is no README.
  - 08188: whether a whole-file candidate carrier is a valid exact target (see the gap below).
  - 08193: legacy-tree description, Phase 9 row decision.
- **maps-j-08190**: the dependency should name the workflow candidate carry (L12-27) explicitly instead of a generic "Lead Step 3 decision".

## Authoring-rule gaps needing Lead judgment

1. **Whole-file verbatim candidate carriers as patch targets.** `architecture-intent.md` ("Writer type: Agent carriage ... frozen-map candidate owner") is patched at 08187. `domainization.md` ("non-canonical candidate conservation carrier", original source follows) is parked at 08188. They are the same kind of target. Lead should rule once whether such files are valid exact targets. If yes, patch 08188 too. If no, 08187 should be parked, and the bullet should not end up half-patched, with README and domainization still pointing at the retiring `docs/architect/` tree.
2. **maps-j-08150 (`§Dev checkout shell helpers`) and maps-j-08152 (`§Setup, §Doctor`).** Their only heading holder in the candidate `packaging-distribution/spec.md` is the "Retained Distribution Source Detail" carriage, so parking is defensible. Live content exists in section 3.3 "Dev Checkout Channel", section 6 "Doctor, Fix, And Legacy Setup", and `contracts/setup-doctor-registry.md`. I need Lead to decide whether those count as the exact holder for these two locators. The records currently give only generic reasons.
3. **maps-j-08191** (`0048 §2 / 0049 §4 of runner.md`) is a decision-locator inside a statement about the workflow spec. Parking is plausible, but L12-26(1) would map it to `runner/decisions/h-aabefc85f0c9.md`. Confirm the heading anchors, or keep the park with a precise dependency.

## Counts

- batch-040 slice reviewed (this file only): 1 file reviewed, 1 rework, 82 edges.
- Edges needing correction: 14 dispositions (13 parked→patch, 1 patch→park) plus 5 record-text fixes (08215, 08186, 08188, 08193, 08190). Gaps 1-3 are listed separately above and are not counted.
- Not counted toward a set rate: the other 10 files of batch-040 belong to other reviewers.

Status: DONE_WITH_CONCERNS
Summary: docs/specs/reading-map.md gets a rework verdict. Thirteen parked edges have exact live candidate targets and should be patches, one retargeted bullet (08194) misdescribes the new tree, and several parked or preserved records carry inaccurate dependency or absence text. Three authoring-rule gaps are left for Lead.
