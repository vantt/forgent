# Review 2 whole-area: moves, byte containment and link repoints
Reviewer: reviewer:claude-session:4df9e88c@2026-10-09
Review mode: ordinary
Author session: codex-session:1@2026-10-08
Request: reports/phase-06/review-request-2-whole-area.md (reviewed tree 2a5d186291aa43ab44ae4cae5642316afde4e355; classification pin 7880fbc74b07c3667ebaa61f2b0561b5d80471b5, content pin 9134ff4e531bb7e75b188ed272188f6efbfe430d, accounting pin 6df71985bf87b30a7a865e31f22c37ec22a8c8c8, owner decision A16 d23045c2de83e3508fda8fd2580b43ece2e1e046)
Reading method: diff-based reading of every row, full text for flagged rows; current-state text checked against current code; owner-approved 2026-10-08/09 (A5, A6, A11-A16).

## Result

- Byte containment: **74/74 contained** (68 area inputs at 7880fbc, three mutable inbound inputs at 7880fbc, three own-source legacy snapshots of docs/architect files at HEAD). For each I read the input bytes with git, hashed them (sha256 equals the claimed inputSha256 74/74, and the 68 area inputs also equal the classification-file sha256 and the git blob at d23045c2d), and searched the history carrier at HEAD for the complete byte string: found exactly once in each of the 74 carriers; the SVG is byte-identical (7,343 bytes). No source line starts with four or more tildes, so the `~~~~text` fence cannot close early (0 of 73 Markdown inputs). Every wrapper carries Document type History, "Historical snapshot; not current implementation or authority", "Canonical for: Historical evidence only; no current authority", the retirement commit 2180b4e72701bb090288af8fe8021008d9d42079 and docs/specs/runner.md (73/73).
- Split sections: the 15 mixed retained files and 5 clean retained files each have a complete literal snapshot; their retired sections therefore sit verbatim in history, but see review-2whole-files.md finding 5: eleven files had live sections cut as well.
- Moves: 48 retired files absent at HEAD (git cat-file: none present), all 20 retained files present at HEAD; 867 physical evidence payloads unchanged between 7880fbc and HEAD (git diff --name-status over docs/platform/agent-coordination/verification shows a single change: the removal of implementation-alignment.md, a moved class (i) file; the retained verification/README.md is unchanged; 868 tracked files = 867 payloads + README), legacy root docs/architect unchanged since the isolation base dbe5c4328, no change to scripts/, vocabulary, constitution or gate since d23045c2d (git diff --stat empty), and no file outside plans/, the area and docs/platform/intent-preservation-ledger.md changed since 7880fbc.
- Links: link scan over 97 portal/spec/history Markdown files outside fences: 0 broken; over 780 other Markdown files (docs/, core/, domains/, README, CHANGELOG, AGENTS.md; payloads and legacy root excluded): 79 broken links, none referencing the Agent Coordination area; anchor links in the 20 retained files, the two mutable inbound files and the shared ledger: 46/46 resolve (scripts/list-doc-anchors.mjs --check).
- Link plan (whole-area-link-plan.json, 404 entries): 27 "repoint current navigation" entries verified against HEAD (the old target string is gone from the source file and the history owner link exists, 27/27; the one string match is the unchanged tail of the new link); 243 historical-literal links and 134 immutable/frozen references keep their original bytes, with their historical resolution recorded and no runtime alias or deletion.
- Promoted-document edits (promoted-edits.md and post-review-edits.md): the only promoted file outside the area touched in this pass is docs/platform/intent-preservation-ledger.md (one table row, 1 insertion / 1 deletion: the Agent coordination row now links the retired-engine ledger snapshot at agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot and says it is not current runtime authority; the anchor resolves). It is logged in promoted-edits.md before the edit. The portal README diff is logged and its facts verified (see review-2whole-reworks.md). No area-status or authority flip, no main or legacy-root write, no gate change.
- The two immutable physical-payload references that still name old candidate locations (deferral-audit.md -> ../../intent-preservation-ledger.md and P08.1.md -> ../../contracts/coordination-session.md) keep their bytes; the historical owners named in the plan exist (history/retired-engine/files/intent-preservation-ledger.md and files/contracts/coordination-session.md). Accepted as recorded; the closing link pass must list them.

## Disagreements and unproven assertions

- None on containment. Open: the file classification (review-2whole-files.md) means some of these moves should be reversed or turned into splits; the byte proofs stay valid either way.

## Containment table (74)

| # | Input (source) | History carrier | sha256 of input bytes | Result |
|---|---|---|---|---|
| 1 | architecture/coordination-continuation-recovery.md | history/retired-engine/files/architecture/coordination-continuation-recovery.md | 3c116095c0f9fd25085add37f282ffd97063978d40db61bf46725e5885a5e24e | contained once |
| 2 | architecture/coordination-foundation-baseline.md | history/retired-engine/files/architecture/coordination-foundation-baseline.md | 2a7c083b0635c1a7679b9a5c3a3337e9c4b44cc3e3ae6ce5e5987ae9ca640b24 | contained once |
| 3 | architecture/dispatch-control-plane.md | history/retired-engine/files/architecture/dispatch-control-plane.md | 2f963016f1573db89f8b19cdea4c767a59238a12dc1a4b4bc620d8bd0089cd6f | contained once |
| 4 | architecture/evidence-and-results.md | history/retired-engine/files/architecture/evidence-and-results.md | 09d3074a859abf556cb7fee54034af799fcc938b9a3c844f18d7f796435ebd43 | contained once |
| 5 | architecture/executor-health-and-fallback.md | history/retired-engine/files/architecture/executor-health-and-fallback.md | 969ba5f64da76515a222214955eaac68d6fb40bd1e73ddd904be4815f43410fa | contained once |
| 6 | architecture/group-thinking-trigger-surface.md | history/retired-engine/files/architecture/group-thinking-trigger-surface.md | d869ea5af7be444e8a18d79f1836fb947426d38b75c86383c5c8e34dad13a5f8 | contained once |
| 7 | architecture/protocol-model.md | history/retired-engine/files/architecture/protocol-model.md | 412c6549eef2c2a3e2e8e3c86201cd814831e664fe01fe7254f416cf43bb1eae | contained once |
| 8 | architecture/README.md | history/retired-engine/files/architecture/README.md | 6ac092c31c002281cde491c707e20d29e722e3797c7aafbacd99d840308e961b | contained once |
| 9 | architecture/run-handle.md | history/retired-engine/files/architecture/run-handle.md | d6715088af75b954a9642034e607f04a9a0c4432723830fb50b2963d6e7f9a23 | contained once |
| 10 | architecture/runtime-model.md | history/retired-engine/files/architecture/runtime-model.md | fd162fbe58d911dff7c0a821bea4cfbee4e531f312d580e93db1119fee81ddc9 | contained once |
| 11 | architecture/runtime-recovery-design.md | history/retired-engine/files/architecture/runtime-recovery-design.md | b564291e08611ef3b017f03788f78ea05211ca619a524783a7a757c9e8595d6d | contained once |
| 12 | architecture/system-context.md | history/retired-engine/files/architecture/system-context.md | 3328892b0f4f35ab5ac2ccf184290693c6531ce25ab964a2f81a26388060e90a | contained once |
| 13 | architecture/visibility-and-herdr.md | history/retired-engine/files/architecture/visibility-and-herdr.md | cb491b29d61eb39a5a3e32d00078d2b5f0140717a7743f6dc1f62466f7d32f61 | contained once |
| 14 | architecture/work-integration.md | history/retired-engine/files/architecture/work-integration.md | 70378870d687f1b8e575f520deeb133d1eb81c867c7963d3ebed0eb691af515a | contained once |
| 15 | contracts/assignment-run-runresult.md | history/retired-engine/files/contracts/assignment-run-runresult.md | e25c355b00520577a9fb2262ecefdee906703024ec9d9af1eef184677d2c5c44 | contained once |
| 16 | contracts/coordination-session.md | history/retired-engine/files/contracts/coordination-session.md | 38bfc02b54d412ba0a412f778c147915fac6305dbfaac1e05ff8f363eff20601 | contained once |
| 17 | contracts/flow-definition.md | history/retired-engine/files/contracts/flow-definition.md | 54d5c541879c9c2d48b2125cd702f12d9831389f84009d332190bc86ef7e18c8 | contained once |
| 18 | contracts/README.md | history/retired-engine/files/contracts/README.md | 5fbb019e87a413ea2a85b1f07b9eaf297f723d71b5f6f2893b4e6f80d7ec09d6 | contained once |
| 19 | contracts/workflow-stage-operation.md | history/retired-engine/files/contracts/workflow-stage-operation.md | 980c6dce1a43aae09769995508966b8652079a97ed608fc519cade334b4de24d | contained once |
| 20 | decisions/ADR-001-work-lifecycle-authority.md | history/retired-engine/files/decisions/ADR-001-work-lifecycle-authority.md | 7e5e23e2afdf4b9f8380b8bebb2d7c65e344625993764dd79e6a8abe1cd7921a | contained once |
| 21 | decisions/ADR-002-stage-operation-compatibility.md | history/retired-engine/files/decisions/ADR-002-stage-operation-compatibility.md | b865cce18a8f7d167d3a9e1b855c274e05f16dbc11d7df8130494ab9bac811e0 | contained once |
| 22 | decisions/ADR-003-assignment-run-runresult-separation.md | history/retired-engine/files/decisions/ADR-003-assignment-run-runresult-separation.md | 4368136590c62d3888562191aa46fd999173a08aace9894ee7a192708db388bf | contained once |
| 23 | decisions/ADR-004-reserve-job.md | history/retired-engine/files/decisions/ADR-004-reserve-job.md | a60ce5298c77d43edee04c299a0a0eb71b3515833c743f937cba009ce421453a | contained once |
| 24 | decisions/ADR-005-herdr-visibility-only.md | history/retired-engine/files/decisions/ADR-005-herdr-visibility-only.md | 5fcce47bd72f70e053189a2fb58659000ce3ddd3e3d9b6651f793940d045430f | contained once |
| 25 | decisions/ADR-006-assignment-provenance-and-contract-snapshot.md | history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md | 685c84e23f4b080f880c0e53d08f11d7fdf3c40da0c97af3e433a0aa60868881 | contained once |
| 26 | decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md | history/retired-engine/files/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md | f0a2a38c872c18d9f1e86f11a0b0a0788b7108ef8a49e5a17e9b3e5076bcabe9 | contained once |
| 27 | decisions/ADR-008-coordination-session-and-mission-deferral.md | history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md | ec77c692f0fe9e73c4fb86d35de3f7567fdd5b0c7cdd20bf4ade373feb9621bf | contained once |
| 28 | decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | f17cb3fdcefa9b44dd3bd63fcf7dc7077cc74f42952fb12e49fff3101b964307 | contained once |
| 29 | decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | 362e65352d18c3f0e0d0eeeefc6051bd983b4e03c9985eefb2d5aa1d5c152f54 | contained once |
| 30 | decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md | history/retired-engine/files/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md | 18e4002d3b920fd09a28f22cd4cfec9f9531e56f0eae6ec5ff870cfcadb8fa59 | contained once |
| 31 | decisions/README.md | history/retired-engine/files/decisions/README.md | 56b43bba7aeeb2cf49bed25052064808b6f654ef521614446e630d2026eb9854 | contained once |
| 32 | intent-preservation-ledger.md | history/retired-engine/files/intent-preservation-ledger.md | 29ed3888ab8539f922a352d63bc4cbaf4050210455e1abb1d0dedc159a7fd681 | contained once |
| 33 | playbooks/architecture-advisory-artifact-templates.md | history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md | 0e959640b0f2ca28b7bf90d533567b2d6b09a9e557d25b4e50f726893fa22050 | contained once |
| 34 | playbooks/architecture-advisory-evaluation-rubric.md | history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md | f8608622222cf2444210aa51f6ca478d11a3e8b95f08ad185c16a45aa57ed264 | contained once |
| 35 | playbooks/architecture-advisory-role-doctrine.md | history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md | 610ffe2502a39b0f5aa3654239bb91f955b4e872daa58e54471b9cd97b682cf9 | contained once |
| 36 | playbooks/coordination-operating-harness.md | history/retired-engine/files/playbooks/coordination-operating-harness.md | dff5fbaeb0361da18dfa4485cb2721d4ecf6fb9090b5c71c4dca6cf198b90178 | contained once |
| 37 | playbooks/mvp6-dogfood-handoff.md | history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md | ce9a316aed566a1402b920541fedb34c06a382aa67681f4a5a3ac6f71d54c1ec | contained once |
| 38 | playbooks/prompts/architecture-advisory-coordinator.md | history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md | f9337117388f9a064b22ad405c1b3133331366c72165643624a88cc186a15d76 | contained once |
| 39 | playbooks/prompts/master-coordinator.md | history/retired-engine/files/playbooks/prompts/master-coordinator.md | aaf07417070112d6d6e5898381b9b7c012eefffb631cf44b2c10f67d4f3ad47c | contained once |
| 40 | playbooks/prompts/step-07-design-discussion-handoff.md | history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md | 0db2ff00a16d57e49ae5881e8844495cecc715bc127fbf2b8739ad58e7632085 | contained once |
| 41 | playbooks/README.md | history/retired-engine/files/playbooks/README.md | 895690fa0cc87de7e14becadf95b274d57f89186c116d6315e0964beb5caa337 | contained once |
| 42 | proposals/dag-request-scheduler.md | history/retired-engine/files/proposals/dag-request-scheduler.md | 49a95abb6178800148fe6a465c1e642bfd105a6b5c03ae6283052b037319b99e | contained once |
| 43 | proposals/dispatch-control-plane-redesign.md | history/retired-engine/files/proposals/dispatch-control-plane-redesign.md | 3ac2655fe07216ab4087fd1e80b7f7adafbb1cd1d929fbd0c6b0f2508dc9793c | contained once |
| 44 | proposals/README.md | history/retired-engine/files/proposals/README.md | 6aa7be3a449e9fc2812793629c0687960e569954317408f881e0d024289368ce | contained once |
| 45 | proposals/semantic-cli-surface.md | history/retired-engine/files/proposals/semantic-cli-surface.md | 3c29467db4973eb357442225fbcfc14a4aacd60660eeebfcd4041c64162e8bc9 | contained once |
| 46 | proposals/step-07-coordination-session-adhoc-task.md | history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md | dceae9599d635680848956835527382b82bd39ffba2fccf4369f0a016194acee | contained once |
| 47 | proposals/step-08-standalone-coordination-protocols.md | history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md | ad00271c276f81ce73a51c9229597cf4ef50962562231560506f296ee3fea2b5 | contained once |
| 48 | proposals/team-communication-protocol-v1.md | history/retired-engine/files/proposals/team-communication-protocol-v1.md | 6f9d87a2f4189617629be45686edcbbb794e74bf823d9a319645576c9b5cb357 | contained once |
| 49 | README.md | history/retired-engine/files/README.md | fc8c55194c9512f9a46728d9dfb0b1079529eb2adccb5b2af142b004d50eeff4 | contained once |
| 50 | roadmap/README.md | history/retired-engine/files/roadmap/README.md | e23effba87631a93ae85d7861bfea634e1f036472cff3a6dad385920a36b9e2d | contained once |
| 51 | roadmap/team-dispatch-v1/README.md | history/retired-engine/files/roadmap/team-dispatch-v1/README.md | 2e37db98aa30162e507166469a01780d7e4c58236de18f9654b5b11a97339518 | contained once |
| 52 | roadmap/team-dispatch-v1/step-00-overview.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-00-overview.md | fd4e0935684a5c4215574f6b8908cc8eb72b140777a41f40a7b3b20ab2ae14f3 | contained once |
| 53 | roadmap/team-dispatch-v1/step-01-rollout.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-01-rollout.md | 33c7c3d74ea55089c583194cdd549dcc0a8e5dacf355a4fae99fee130c316087 | contained once |
| 54 | roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md | 08fbdde579a7c179826183d8409fba50bef5cb68176a4a95fba5a050aa168009 | contained once |
| 55 | roadmap/team-dispatch-v1/step-03-assignment-runresult.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-03-assignment-runresult.md | cf9de163dc8d1d70eb61bd6c8e9b481e7e2e2f80e0292094187fac598caa8e8d | contained once |
| 56 | roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md | 550a1d7a9031fa3effbf2466cf934691410863744db2c82b8f8479b6be445009 | contained once |
| 57 | roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md | 7bdefd0cd2c3f213503925ffd346cdfea825d488e4636015e929157d275029f8 | contained once |
| 58 | roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md | c0bbece69bbb35da684164a9f460d2fa6005140b29c2d6f30fceba8c9f065045 | contained once |
| 59 | spec.md | history/retired-engine/files/spec.md | 9d7faa4227e606991b16f9a7cd1fdf094d06c2e7daf0c6969153ab823f28d177 | contained once |
| 60 | subcomponents/README.md | history/retired-engine/files/subcomponents/README.md | 51ef47d23b93a5086e7166d0f9cb1aa9890f328c72da686841beb1b77c2c6368 | contained once |
| 61 | verification/implementation-alignment.md | history/retired-engine/files/verification/implementation-alignment.md | 8d3358888aadd05dc759f677f0d5051f9698faeeca3ea85081785e65e59eade1 | contained once |
| 62 | verification/README.md | history/retired-engine/files/verification/README.md | e78bac480615f20e753369e8b8d624ff3a67a123d17e8a6c8c396a6fed201f40 | contained once |
| 63 | vision.md | history/retired-engine/files/vision.md | 88eb066b1cc3f59286bd62a9ba4cfea02536bef3fe4ddd9ddfe1ea6bafa1022a | contained once |
| 64 | vocabulary/canonical-concepts.md | history/retired-engine/files/vocabulary/canonical-concepts.md | fafc46fdb1d07dd3432fff2cab80ab916f0bd69cec2302c8710e17d7a1550e7c | contained once |
| 65 | vocabulary/concept-relationships.md | history/retired-engine/files/vocabulary/concept-relationships.md | 43dcd3a7cdda7e5713dc2d56765a3fb0ddb9effde8cba820a919a1c07acb8cf5 | contained once |
| 66 | vocabulary/deprecated-and-reserved.md | history/retired-engine/files/vocabulary/deprecated-and-reserved.md | 64772305e549d11f0a822655718281dd4b6f7c37abb6a549666a3a991c3a1d35 | contained once |
| 67 | vocabulary/README.md | history/retired-engine/files/vocabulary/README.md | 595ef132a7c493d37af7a5bf1d6a63beb80cb336eb513b177c37a5db0c02cbb2 | contained once |
| 68 | vocabulary/stage-operation-taskspec-skill-relationship.svg | history/retired-engine/files/vocabulary/stage-operation-taskspec-skill-relationship.svg | 436b430c4e9e380b2feb5f073ecad0cb1d6115399b98bd80db81455bfba35104 | byte-identical |
| 69 | history/documentation-migration/migration-status.md | history/retired-engine/inbound/agent-coordination/history/documentation-migration/migration-status.md | 893c98bcaa6b315f9d25f4fba48779891c4f06ba3e43ca8e867c8ebad8537d4c | contained once |
| 70 | history/implementation-records/orchestration-vocabulary-map-2026-08-27.md | history/retired-engine/inbound/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md | a5ae48dac78e2adb367559783ecdfb833189941a2876fa0394e8a6872194afbc | contained once |
| 71 | docs/platform/intent-preservation-ledger.md | history/retired-engine/inbound/intent-preservation-ledger.md | 31d64f0edb1876838f4cbe0050611967e4d854bc5b0904b21c3183ba5db79fba | contained once |
| 72 | legacy:README.md | history/retired-engine/legacy/README.md | 75303f27d6e8dfe8162e9ad37d331218a1c74438a400b4d93ddb03e5bb699c3c | contained once |
| 73 | legacy:architecture/system-context.md | history/retired-engine/legacy/architecture/system-context.md | db2d23502ec7ed084a106fa1e4cd4286cc5e3dce7aa51ee0afb330c66fe3e4dd | contained once |
| 74 | legacy:intent-preservation-ledger.md | history/retired-engine/legacy/intent-preservation-ledger.md | 1a0a6e7df11d09006c8679a467a85f0f8c0d8f0ad08bb11b3fbea6080b312db0 | contained once |

## Repointed navigation (27 entries)

| Source file | Old target | History owner |
|---|---|---|
| architecture/dispatch-control-plane.md | ../contracts/flow-definition.md | history/retired-engine/files/contracts/flow-definition.md |
| architecture/dispatch-control-plane.md | ../contracts/flow-definition.md#policypatch | history/retired-engine/files/contracts/flow-definition.md |
| architecture/dispatch-control-plane.md | docs/platform/agent-coordination/contracts/flow-definition.md | history/retired-engine/files/contracts/flow-definition.md |
| architecture/dispatch-control-plane.md | ../contracts/workflow-stage-operation.md | history/retired-engine/files/contracts/workflow-stage-operation.md |
| architecture/dispatch-control-plane.md | ../decisions/ADR-008-coordination-session-and-mission-deferral.md | history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md |
| architecture/dispatch-control-plane.md | ../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md |
| architecture/dispatch-control-plane.md | ../proposals/dispatch-control-plane-redesign.md | history/retired-engine/files/proposals/dispatch-control-plane-redesign.md |
| architecture/runtime-model.md | ../contracts/coordination-session.md | history/retired-engine/files/contracts/coordination-session.md |
| architecture/runtime-model.md | docs/platform/agent-coordination/contracts/coordination-session.md | history/retired-engine/files/contracts/coordination-session.md |
| architecture/runtime-model.md | ../contracts/flow-definition.md | history/retired-engine/files/contracts/flow-definition.md |
| architecture/runtime-model.md | ../decisions/ADR-008-coordination-session-and-mission-deferral.md | history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md |
| architecture/runtime-model.md | docs/platform/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md | history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md |
| architecture/runtime-model.md | ../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md | history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md |
| architecture/runtime-recovery-design.md | coordination-continuation-recovery.md | history/retired-engine/files/architecture/coordination-continuation-recovery.md |
| architecture/work-integration.md | ../decisions/ADR-010-interactive-headless-parity-and-work-isolation.md | history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md |
| architecture/work-integration.md | ../proposals/step-07-coordination-session-adhoc-task.md | history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md |
| architecture/work-integration.md | docs/platform/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md | history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md |
| architecture/work-integration.md | ../vision.md | history/retired-engine/files/vision.md |
| architecture/work-integration.md | docs/platform/agent-coordination/vision.md | history/retired-engine/files/vision.md |
| contracts/assignment-run-runresult.md | ../architecture/coordination-continuation-recovery.md | history/retired-engine/files/architecture/coordination-continuation-recovery.md |
| contracts/assignment-run-runresult.md | docs/platform/agent-coordination/architecture/coordination-continuation-recovery.md | history/retired-engine/files/architecture/coordination-continuation-recovery.md |
| contracts/assignment-run-runresult.md | ../decisions/ADR-006-assignment-provenance-and-contract-snapshot.md | history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md |
| contracts/assignment-run-runresult.md | docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md | history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md |
| contracts/assignment-run-runresult.md | ../roadmap/team-dispatch-v1/step-03-assignment-runresult.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-03-assignment-runresult.md |
| contracts/assignment-run-runresult.md | ../roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md | history/retired-engine/files/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md |
| playbooks/prompts/architecture-advisory-coordinator.md | docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md | history/retired-engine/files/playbooks/prompts/master-coordinator.md |
| playbooks/prompts/architecture-advisory-coordinator.md | master-coordinator.md | history/retired-engine/files/playbooks/prompts/master-coordinator.md |
