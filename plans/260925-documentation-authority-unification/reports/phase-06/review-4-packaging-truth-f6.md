# Review 4: packaging truth sample and F6

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:8@2026-10-13
Review mode: ordinary
Request commit: 33d36aadd
Content commit: baef3a075

## Scope and method

Read-only review of the Packaging-distribution truth sample (A28 item 3) and of the dropped-010 proposal (F6), in worktree forgentX-phase00-documentation-authority-unification at HEAD 33d36aadd (content pin baef3a075 is an ancestor). Common rules, request, brief and owner answers A28, A31, A33, F6 were read first. Code was read in src/, bin/, packages/, apps/, scripts/, package.json, Cargo.toml and install.sh; the GitHub release was read with gh. No file in the worktree was changed.

## Part 1. Truth sample

### Draw reproduction

Reproducible. With extractMarkdownConservationUnits at baef3a075 over the non-history, non-report, non-decision files of docs/platform/packaging-distribution (667 non-heading units before scaffolding exclusions) and the recorded method (SHA256 of seed, NUL, path, NUL, anchor, NUL, unit digest; lowest 30), the first 34 ranks contain all 30 sampled units plus exactly four units that are metadata or scaffolding (spec.md unheaded-block-80, vision.md unheaded-block-1, spec.md unheaded-block-1, runtime-identity-and-activation.md unheaded-block-24: front-matter fences and Added in candidate notes). So the author's 629-unit population differs from mine only by scaffolding exclusions that do not touch the top 30. I could not rebuild the exact 629-unit list, so populationSha256 6da06c3a... is not recomputed; my closest filter gives 635 units (digest not equal). Sample digests all match unit text digests. The supplied draw is kept; no redraw seed is needed. Selection was made by the author (Lead asked Doer); I checked every assertion myself, which is what A28 needs from the reviewer.

Assertion handling: label lead-ins, questions, links and dated historical-map text carry 0 current assertions (units 3, 5, 8, 9, 10, 11, 12, 16, 21, 24, 30). Normative should/must sentences count as assertions and are checked against code where code exists.

### Result

Units with a false current assertion: 3 of 30 (units 2, 26, 28) = 10.0%. Assertions checked: 65, true 62, false 3. The A28 stop rule is more than 10%, so the stop condition is not reached and the answer is not STOP-FOR-OWNER, but there is no margin: one more false unit would cross it. Three corrections follow under A19 (units 2, 26, 28) and need re-review.

| Claim | Verdict | Note | Unit digest | Assertions true/false |
|---|---|---|---|---|
| truth-sample-01 spec.md#unheaded-block-44 | ok | AGENTS.md portable projection is real (PORTABLE_AGENTS_DESTINATION src/setup/instruction-projections.mjs:19, ledger entry :263); only skill wrappers and a Gemini extension are host-specific, no CLAUDE.md or GEMINI.md context projection exists, so the should-sentence is consistent | ab6f59a399bcc3e0973366bfcb52f6fbf4906d35cd95be996bd630f8cac4ee14 | 2/0 |
| truth-sample-02 contracts/skill-package-distribution.md#unheaded-block-11 | rework | Row 4 overstated: doctor check plugin-dev-skills-packaged (src/setup/registrations.mjs:3251-3276) tests presence only and its own comment says so; stale/byte-identity lives only in test/skills/fgos-mirror.test.mjs and no registerFix exists for it; fix by saying doctor detects missing files and the test detects drift, or add the fix. Rows 1-3 and 5 verified (assembleSkills skill-wrappers.mjs:1119, generateAllSkillWrappers :164, mirrorDevSkillsIntoPlugin :245, generateGeminiSkillPackage :944 called only from tests so partial is honest) | 6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b | 4/1 |
| truth-sample-03 code-panel-rollout-plan.md#unheaded-block-58 | ok | Two review questions, no behavior asserted; the presupposed commands exist (apps/fgctl/src/main.rs:128 init, bin/fgos.mjs doctor --fix) | 117363655206262f311d1576d4ca93f6a91adf02dfb6f4237447afd31a78f723 | 0/0 |
| truth-sample-04 contracts/repository-runtime-layout.md#unheaded-block-18 | ok | Example record: seven camelCase fields and the four history statuses match InstallTransactionRecord (packages/distribution/rust/src/init.rs:128-137, built at :1121-1145); timestamps and ids are illustrative dated values, not assertions | d5254551e36825082ed4f57c656f0a5b100999e5ddd72d527c1186d2f0fa9162 | 8/0 |
| truth-sample-05 spec.md#unheaded-block-17 | ok | Bare lead-in label; scripts/fgos-shell-integration.sh exists but the claim sits in the following code unit | 7b947a76cec219e5010de59f1adbed679d654248fa52932833fb80be325661da | 0/0 |
| truth-sample-06 contracts/projection-ledger.md#unheaded-block-19 | ok | Ledger entries carry an ownership field (src/setup/instruction-projections.mjs:263); code only ever emits managed-block, the other three classes in the table unit are not emitted by any code, so the follow-on unit needs a check at promotion | 46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c | 1/0 |
| truth-sample-07 spec.md#unheaded-block-9 | ok | Precedence --from > FGCTL_FROM > FGCTL_VERSION > pin > latest (packages/distribution/rust/src/fetch.rs:141-160), system curl and SHA256SUMS refusal (fetch.rs:5-6, 65-67), non-pre-release latest (fetch.rs:289), fgctl init wiring apps/fgctl/src/main.rs:149-151, install.sh:71-137 same defaults | 6471d511f68c7a56550873cf7418f082d15bcfe040150e807f9ac6f3edcfef50 | 6/0 |
| truth-sample-08 contracts/activation-binding.md#unheaded-block-21 | ok | Bare label; the status list it introduces is a separate unit (init.rs uses ready-degraded, complete, quarantined, ready-published at 598,619,802,1126) | dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5 | 0/0 |
| truth-sample-09 spec.md#unheaded-block-55 | ok | Sentence from a dated historical discussion map (2026-09-04), describes the old map document not current behavior | e3b0d1af248f4abb69cb8ec6c67d70d375955fc9eaed87c6dd8410d74a47b02b | 0/0 |
| truth-sample-10 spec.md#unheaded-block-78 | ok | Only a link; target docs/architect/workspace-topology.md exists in the worktree; inside a dated historical map | cd74dfc705f04854cfa17eebf4d9491c6d8006a272e739e8463415183d6a81f5 | 1/0 |
| truth-sample-11 verification/install-and-release-proof.md#unheaded-block-14 | ok | Four process rules for reviewers, no code behavior; verification/implementation-alignment.md exists | 380d5cb658fe03b6cf908339c07a1e1c2134d7690c364550c9e6dc6c00c4572e | 0/0 |
| truth-sample-12 contracts/skill-package-distribution.md#unheaded-block-15 | ok | Bare lead-in label, no assertion in the unit | 4dc182ca9a9502d457d9d5ba8c1e9dffe52c1459a5bc22c81eaf0474a7bdc4a1 | 0/0 |
| truth-sample-13 contracts/release-manifest.md#unheaded-block-7 | ok | ReleaseManifest::validate_legacy_node_invariant packages/distribution/rust/src/manifest.rs:47-75 rejects empty, absolute and parent-traversing root/entry, empty digest, entry repeating root; legacyNode field is non-optional (manifest.rs:139); host resolves via manifest (apps/fgos/src/legacy_exec.rs:150, packages/distribution/rust/src/verify.rs:189). Digest is only checked for empty, harmless nuance | 5b12fd1fa4f3ab432b19f5620fb11972fb1dc19c6b38564a9f4d7297dff5d7ad | 4/0 |
| truth-sample-14 spec.md#unheaded-block-94 | ok | doctor --fix exists and runs every registered fix (runFixes src/setup/registrations.mjs:212-217, --fix in bin/fgos.mjs:3966). The none-coverage claim is a spec status statement; the next paragraph of the same section lists an unbuilt RUL13 item, an internal tension to note, not a code-truth falsehood | f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31 | 2/0 |
| truth-sample-15 contracts/distribution-pin.md#unheaded-block-12 | ok | Pin as desired policy not proof; V1 location .fgos/distribution.json is written by init.rs publish_and_tail (:1115) and the file is tracked in git | 90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d | 3/0 |
| truth-sample-16 code-panel-rollout-plan.md#unheaded-block-42 | ok | Two review questions, nothing asserted | bf6ae9f9db8e66a0cbd8eed7305cd926966ac1d85a66518c85fec47c66a44d4a | 0/0 |
| truth-sample-17 verification/install-and-release-proof.md#unheaded-block-9 | ok | gh release view v0.1.0: published 2026-09-18T07:07:51Z with fgctl and fgos tarballs, SHA256SUMS and install.sh assets; stable promotion still unrecorded (latest tags are 0.2.0 rc) | 5436a95c42be8bcb624f6f896d0230c3a36200060b23ce19ae75449784271aa8 | 2/0 |
| truth-sample-18 architecture/fgctl-and-local-fgos.md#unheaded-block-13 | ok | fgctl is a Rust binary (apps/fgctl) in the same Cargo workspace as apps/fgos (Cargo.toml members); the word future is stale because the Rust host exists now, wording only, source design preserved | 3200e28a2754c7a271be1f3adbb4bcf4f944782148fd8a0584b5dcb3770fab1c | 3/0 |
| truth-sample-19 contracts/instruction-composition-and-projection.md#unheaded-block-20 | ok | No priority number exists in composition; ordering is kind, scope, specificity, authority, path, id (src/setup/instruction-composition.mjs:179-188), so priority is never the authority source; code names the tiebreaker specificity not priority | c99db16e39712efdf185387e263b3788b872ef103a20b040490efc493a70e899 | 2/0 |
| truth-sample-20 contracts/release-manifest.md#unheaded-block-3 | ok | RELEASE_MANIFEST_SCHEMA_VERSION_V1 = 1 and ReleaseManifest in packages/distribution/rust/src/manifest.rs:17,25; v1 enforced at validate_v1_invariants :78-80 | 6d77abaee74b79997b3f25983575ebb2e534e8d9831385dd46ed9150a7b61d98 | 2/0 |
| truth-sample-21 spec.md#unheaded-block-21 | ok | Bare lead-in label, no assertion in the unit | 3087a6ad3be768852a17337632e9d4a5bb80d9fd6e788cf759831f3aca4a6252 | 0/0 |
| truth-sample-22 contracts/release-manifest.md#unheaded-block-14 | ok | fileDigest sha256 of bytes and artifactDigest sha256 of canonical JSON without artifactDigest (scripts/build-rust-distribution.mjs:40-44,72-76,409; Rust recompute_artifact_digest verify.rs:82) | 3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a | 2/0 |
| truth-sample-23 architecture/fgctl-and-local-fgos.md#unheaded-block-3 | ok | fgctl init/upgrade/verify select and stage releases (apps/fgctl/src/main.rs:128-175) while apps/fgos execs the legacy Node payload for workflow verbs (apps/fgos/src/legacy_exec.rs:150) | d6e2e95a2ce5436d92323744e02fb85a42731e6a43e027e0b8a4ce55d777a045 | 2/0 |
| truth-sample-24 spec.md#unheaded-block-53 | ok | Dated header of a historical map (Status Historical, Date 2026-09-04); history and purpose text, not current behavior | afa4c17c539557aef31c16b3a5ed32351c0b90839d0e1ccff797fd3ea1e66104 | 0/0 |
| truth-sample-25 architecture/future-constraints.md#unheaded-block-7 | ok | Normative; runtime resolves through FGOS_ACTIVE_RELEASE_PATH or its own install location and manifest, never PATH (apps/fgos/src/legacy_exec.rs:55-100) | 093dfd342ad7acdf730df29f9c3c7e72e57ba7c85e52eaa31c6f66fadc0fa0ab | 1/0 |
| truth-sample-26 contracts/activation-binding.md#unheaded-block-27 | rework | Says a candidate may run preflight and write staging records in a bootstrap context; code says opposite: preflight is static and never executes candidate code and no host ever honored the env-var bootstrap context (packages/distribution/rust/src/init.rs:431-446, env vars FGOS_BOOTSTRAP_CANDIDATE appear nowhere in src). Must-not clause is true (candidate never runs before publish). Fix: state static preflight and drop the bootstrap-context permission, or mark it dated design | ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0 | 1/1 |
| truth-sample-27 spec.md#unheaded-block-49 | ok | Both pointers resolve: verification/implementation-alignment.md and verification/install-and-release-proof.md exist | 1e6300b4a03d7d2581eb49a4c32ea8dc8ffb59fb28c697e65527bb6453980c05 | 2/0 |
| truth-sample-28 verification/install-and-release-proof.md#unheaded-block-17 | rework | Posture facts verified (preview release v0.1.0 published 2026-09-18, 30 days gives 2026-10-18, shim execs Rust host, no fallback on Rust failure in shim.rs/apps/fgos). The rule that any escape-hatch invocation must emit a warning, log entry or proof marker is not met: direct npm bin/node bin/fgos.mjs prints nothing (no deprecation or marker anywhere in bin/fgos.mjs; the invocation record is opt-in via FGOS_INVOCATION_RECORD_PATH and only for Rust-host legacy-cli routes). The doc and implementation-alignment row call it implemented; either implement a marker or state it as an open requirement | 6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed | 9/1 |
| truth-sample-29 contracts/distribution-pin.md#unheaded-block-10 | ok | All five rows verified: TrackedDistributionPin and DistributionPin alias init.rs:43-49, pinSnapshot init.rs:109 and :1062-1089, goldens and schema_golden.rs exist, Item 2 and Item 5 tests at test/rust-host/fgctl-init.test.mjs:463,609; docs/architect path still exists (will move at cutover) | 5e8cd6969cc76c9fa07e3861b5b1bf5f9d6083a33d1f5cb970349a76844dacab | 5/0 |
| truth-sample-30 architecture/runtime-identity-and-activation.md#unheaded-block-53 | ok | Status note about candidate carriage and a tracker pointer, no current behavior; author draw kept it though similar scaffolding was excluded elsewhere, a replacement would be implementation-alignment unit 8 (process rule, true), no effect on result | 0a68b45b9aad074b7be63e3f7d810b871adee57edd805f6ea71849d1534f09f4 | 0/0 |

## Part 2. F6, dropped-010

### Verified facts

- package.json:9-12 maps bin.fgos to bin/fgos.mjs and bin.fgos-runner to bin/fgos-runner.mjs. bin/fgos.mjs:4-10 is the legacy-node ownership header and says global npm bin.fgos and node bin/fgos.mjs remain compatibility channels. Both match the proposal.
- 4db6ee7e5 (2026-09-10) introduced the obligation in docs/architect/host-invocation-routing/legacy-cli-transition.md (the same file also says the Rust host resolves the payload never as an alternate package-manager bin entry). The register says introducedBy UNPROVEN; this proves it.
- c831811fa (2026-09-10, same day) added the bin/fgos.mjs header and the AGENTS.md section Legacy-Node CLI Ownership Boundary, both stating npm bin.fgos remain compatibility channels. The implementation therefore contradicted the design clause on the day it was written; it did not remove the mapping.
- git log search (-S and -G on bin.fgos, bin.fgos-runner, npm bin; --grep on npm, compat, legacy, escape hatch, installed default) finds no commit that retires or executes the removal. The proposal is right that no explicit retirement commit exists.
- Digests check: proposal source text digest equals 6f959e90...; target unit anchor proposed-disposition recomputes to b1ec345e... ; release-boundaries.md file digest equals ca26b29d...; the FLAGGED retention anchor passes list-doc-anchors --check; its Checked status text at release-boundaries.md:150 matches the register entry.

### Evidence the proposal omits

- Coordinator note 2026-09-15, updated after v0.1.0 (docs/platform/packaging-distribution/code-panel-rollout-plan.md:72), installed-default-and-fallback posture in verification/install-and-release-proof.md (unit 28 above), host-invocation spec.md:75 and release-boundaries.md:35: Rust host is the default installed runtime for the preview, the Node fallback is deprecated and supported for 30 calendar days, earliest removal 2026-10-18. That is an explicit dated decision about exactly this channel, and it is dated four days from today (2026-10-14).
- README.md:102-105 keeps npm install -g github:vantt/forgent#v0.1.0 as a documented compatibility channel.
- So the trigger (Rust host becomes installed default) fired at the preview on 2026-09-18 and was deliberately overridden by a dated window, not forgotten.

### Verdict on the proposal

Agree with the direction (retire only the automatic installed-default removal trigger, keep the compatibility mapping), with three amendments. The decision is the owner's; this is advice.

1. Name a successor instead of a bare retirement. The trigger is superseded by the 2026-09-15 coordinator decision (30-day window, earliest removal 2026-10-18). Cite code-panel-rollout-plan.md:72 and the release-boundaries.md:35 row as the successor; the proposal cites only two commits and code.
2. Do not let retirement erase the end-of-window obligation. The proposal says it does not decide when the npm channel ends, which is right, but the disposition text should say the removal or redirect of bin.fgos is still owed after the window and is owned by the release-owner decision; otherwise A33/F6 closes an obligation whose real end is two decisions away. Restore (remove or redirect bin.fgos now) is not viable: it would contradict AGENTS.md, README.md:102 and the window.
3. Fix the rationale wording. It says no intentional retirement is inferred from absence and then proposes retirement. The evidence shows intentional coexistence (c831811fa same-day header, the coordinator note), so say superseded by decision, not retired by absence. Keep the FLAGGED verbatim retention unchanged until the owner accepts, as the proposal already states.

No rework is needed on the pack mechanics; the proposal stays pending.

## Unresolved questions

- Unit 28: does the owner want a real deprecation marker on direct npm invocation before 2026-10-18, or should the doc state it as an open requirement?
- The exact 629-unit population list was not recoverable, so its digest is unverified (selection of the 30 is unaffected).

Status: DONE_WITH_CONCERNS
