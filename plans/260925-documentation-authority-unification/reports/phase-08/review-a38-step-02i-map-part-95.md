# Review a38 step-02i mapping part 95

- Reviewer: reviewer:sonnet-session:afcf261ef7906b5ec@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree /home/vantt/projects/forgentX-s8-review verified detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798)
- Part: 95 (population seeded-semantic-edge-sample; sourceTable step-02i-census-maps-portals-prose.json, 60 entries; every row read in committed consumer context, all fields)
- Totals: ok 55, rework 3, needs-Lead-judgment 2 (rework 5.0% of 60, above the 3% threshold)

| edge | consumer:line | role | action | verdict | rationale |
|---|---|---|---|---|---|
| maps-i-04101 | docs/platform/herdr-web-dashboard/spec.md:350 | reader | cutover-patch-only | needs-Lead-judgment | maps-i-04101: plain bullet describes content ('the lifecycle meaning behind every status, stage, question and answer'); mapped to work-state/README.md (Area portal) although work-state/spec.md (Spec, same Provenance) holds that content. Class decision for Lead: descriptive citation of a whole legacy spec to portal vs exact spec.md. |
| maps-i-04102 | docs/platform/holder-lock/spec.md:18 | reader | cutover-patch-only | ok | navigation/role read in context; patch 'docs/specs/distribution.md' -> 'docs/platform/packaging-distribution/README.md' relative form kept, label follows, target and anchor exist |
| maps-i-04105 | docs/platform/holder-lock/spec.md:391 | reader | cutover-patch-only | rework | [class A] Basename label `runner.md` kept while the destination becomes `../runner/README.md`; the label names a file that is no longer the target. Label must follow the destination (e.g. `[../runner/README.md](../runner/README.md)` or a non-path label). Same class table-wide: 16 rows with basename-only label and pathTextLabel=false, e.g. maps-i-00601, 00719, 00721..00723. |
| maps-i-04109 | docs/platform/host-invocation-routing/architecture/README.md:48 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04114 | docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:50 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04130 | docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:16 | reader | preserve | ok | self/own-source reference (Related/Provenance/source relationship); no patch into consumer itself |
| maps-i-04138 | docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:73 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04140 | docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:104 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04148 | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:47 | reader | preserve | ok | self/own-source reference (Related/Provenance/source relationship); no patch into consumer itself |
| maps-i-04155 | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:343 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04159 | docs/platform/host-invocation-routing/architecture/provider-routing.md:58 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04167 | docs/platform/host-invocation-routing/architecture/release-boundaries.md:64 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04175 | docs/platform/host-invocation-routing/contracts/component-protocol.md:44 | reader | cutover-patch-only | ok | navigation/role read in context; patch '-routing/external-provider-protocol.md#3-component-protocol)' -> 'itecture/external-provider-protocol.md#3-component-protocol)' relative form kept, label follows, target and anchor exist |
| maps-i-04176 | docs/platform/host-invocation-routing/contracts/component-protocol.md:57 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04187 | docs/platform/host-invocation-routing/contracts/external-provider-manifest.md:15 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04191 | docs/platform/host-invocation-routing/contracts/legacy-payload.md:60 | reader | cutover-patch-only | ok | navigation/role read in context; patch '/architect/host-invocation-routing/legacy-cli-transition.md)' -> 'cli-transition.md](../architecture/legacy-cli-transition.md)' relative form kept, label follows, target and anchor exist |
| maps-i-04193 | docs/platform/host-invocation-routing/contracts/operation-catalog.md:45 | reader | cutover-patch-only | ok | navigation/role read in context; patch 'host-invocation-routing/host-invocation-provider-routing.md)' -> '[../README.md](../README.md)' relative form kept, label follows, target and anchor exist |
| maps-i-04207 | docs/platform/host-invocation-routing/history/source-inventory.md:24 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04214 | docs/platform/host-invocation-routing/history/source-inventory.md:27 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04218 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:19 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04222 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:66 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04231 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:73 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04241 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:79 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04242 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:80 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04247 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:83 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04248 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:84 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04263 | docs/platform/host-invocation-routing/intent-preservation-ledger.md:96 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04270 | docs/platform/host-invocation-routing/roadmap.md:414 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04278 | docs/platform/host-invocation-routing/verification/compatibility-harness.md:52 | reader | cutover-patch-only | ok | navigation/role read in context; patch 'st-invocation-routing/rust-cli-and-proof-components-plan.md)' -> '[../README.md](../README.md)' relative form kept, label follows, target and anchor exist |
| maps-i-04284 | docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md:92 | reader | cutover-patch-only | ok | navigation/role read in context; patch 'st-invocation-routing/rust-cli-and-proof-components-plan.md)' -> '[../README.md](../README.md)' relative form kept, label follows, target and anchor exist |
| maps-i-04285 | docs/platform/host-invocation-routing/verification/r2-external-process-proof.md:15 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04286 | docs/platform/host-invocation-routing/verification/r2-external-process-proof.md:46 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04291 | docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md:15 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04293 | docs/platform/host-invocation-routing/verification/source-preservation-audit.md:16 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04294 | docs/platform/host-invocation-routing/verification/source-preservation-audit.md:39 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04295 | docs/platform/host-invocation-routing/verification/source-preservation-audit.md:40 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04298 | docs/platform/host-invocation-routing/verification/source-preservation-audit.md:40 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04304 | docs/platform/host-invocation-routing/verification/source-preservation-audit.md:42 | reader | preserve | ok | retained in-area or docs/history path; preserve correct |
| maps-i-04314 | docs/platform/host-invocation-routing/vision.md:65 | reader | cutover-patch-only | needs-Lead-judgment | maps-i-04314: 'Preserved from [external-provider-protocol.md](...)' in the Alignment column is origin wording (provenance) but classified navigation and patched to architecture/external-provider-protocol.md; the three siblings maps-i-04312/04313/04315 are the same. Lead to rule provenance-preserve vs navigation patch for the 'Preserved from' phrase. |
| maps-i-04321 | docs/platform/intent-preservation-ledger.md:74 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04323 | docs/platform/intent-preservation-ledger.md:83 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04324 | docs/platform/intent-preservation-ledger.md:92 | reader | preserve | ok | source-locator/provenance/closeout citation; preserve |
| maps-i-04327 | docs/platform/migration-authoring-rules.md:33 | reader | preserve-pending-target | ok | whole legacy-tree/glob/nonexistent-deliverable mention or carriage target; parked for Step 3 with no executable text |
| maps-i-04344 | docs/platform/observe/spec.md:9 | reader | preserve | ok | self/own-source reference (Related/Provenance/source relationship); no patch into consumer itself |
| maps-i-04352 | docs/platform/packaging-distribution/README.md:179 | reader | preserve | rework | [class B] Sentence 'docs/specs/distribution.md remains the legacy/generated-curated spec source' under 'The old sources are preserved during migration' is a migration-state sentence classified self-reference-preserved. It must be a Phase 9 row flip / Step 3 semantic park, like its sibling line 180 (maps-i-04353, parked) and the settled L12-25 README sentence. |
| maps-i-04353 | docs/platform/packaging-distribution/README.md:180 | reader | preserve-pending-target | ok | whole legacy-tree/glob/nonexistent-deliverable mention or carriage target; parked for Step 3 with no executable text |
| maps-i-04354 | docs/platform/packaging-distribution/README.md:181 | reader | preserve | rework | [class B] Line 181 'docs/architect/packaging-distribution/** now carries historical redirect/status notes; read it only as ...' is a whole-legacy-tree migration-state statement plus read instruction, classified provenance/preserve. Park for Step 3 (legacy-tree-semantic) like line 180; preserve silently leaves a false post-cutover sentence. |
| maps-i-04361 | docs/platform/packaging-distribution/architecture/future-constraints.md:11 | reader | preserve | ok | self/own-source reference (Related/Provenance/source relationship); no patch into consumer itself |
| maps-i-04364 | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md:14 | reader | cutover-patch-only | ok | navigation/role read in context; patch 'docs/architect/workspace-topology.md' -> 'tform/system-architecture/architecture/workspace-topology.md' relative form kept, label follows, target and anchor exist |
| maps-i-04386 | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md:192 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04389 | docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:151 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04404 | docs/platform/packaging-distribution/history/distribution-baseline.md:155 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04407 | docs/platform/packaging-distribution/history/distribution-baseline.md:158 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04409 | docs/platform/packaging-distribution/history/distribution-baseline.md:160 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04410 | docs/platform/packaging-distribution/history/distribution-baseline.md:161 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04421 | docs/platform/packaging-distribution/history/distribution-vision.md:38 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04427 | docs/platform/packaging-distribution/history/documentation-migration/migration-map.md:90 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04441 | docs/platform/packaging-distribution/history/documentation-migration/migration-map.md:131 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04445 | docs/platform/packaging-distribution/history/documentation-migration/migration-map.md:134 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |
| maps-i-04448 | docs/platform/packaging-distribution/history/documentation-migration/migration-map.md:165 | reader | preserve | ok | inside explicit retained/carriage region or pinned citation; no patch into carriage |

## Rework by defect class

- Class A (Basename path label not following destination): maps-i-04105
- Class B (Migration-state / whole-legacy-tree sentence classified preserve or self-reference): maps-i-04352, maps-i-04354

Rework is above 3%: the set expands to a full read per A50; this report covers only the 60 listed edges.
