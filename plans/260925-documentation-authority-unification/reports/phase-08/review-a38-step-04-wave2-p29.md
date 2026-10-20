# Review a38 Step 4 wave 2 part 29 (set step04-019)

Pin dc24ce645. Method: canonical.rs (261 lines) and manifest.rs (338 lines) read; init.rs (2185 lines) outline plus header and every docs/path match (the only `docs/` hit is line 5; other hits are bare filenames, contracts relative cites and a test sentinel). Legacy source sections and live contract read at the pin. No checker or script run.

## Files

### packages/distribution/rust/src/manifest.rs (set step04-019, patched stratum) - verdict REWORK
Slots reviewed 1 of 1.

OUTCOME defect, class6-l-000194 (line 4, `docs/architect/packaging-distribution/runtime-identity-and-activation.md` section 5), patch to `docs/platform/packaging-distribution/contracts/release-manifest.md`, anchor `5-digest-rule`:
- The reason says "Legacy section 5 now corresponds to live section 5 Digest Rule". That match is by number only. Legacy section 5 is "ReleaseManifest": minimum field set, the schema example, `components.legacyNode`, release tree canonicalization and file classes. Live section 5 "Digest Rule" is a single sentence about recomputing `artifactDigest` with SHA-256. The module is "Manifest types": serde structs plus `validate_legacy_node_invariant`, `validate_native_addon_invariant` and `validate_v1_invariants`; it computes no digest. The live holder of what the line cites (the frozen manifest shape and field optionality) is section 2 "Frozen Schema V1 Shape" (`2-frozen-schema-v1-shape`, which itself names `manifest.rs`) with section 3 field table and section 4 legacyNode invariant. The anchor is therefore wrong and the gloss false.
- Same-set inconsistency: sibling record class6-l-000192 (canonical.rs) cites the same legacy section 5 and is parked because the live Digest and Safety Rules are narrower than legacy section 5. Both cannot hold; the narrower live section 5 cannot be the exact successor of the whole legacy section 5 for this file either.
- Rendering when applied verbatim: the line becomes `//! and \`docs/platform/packaging-distribution/contracts/release-manifest.md#5-digest-rule\` section-5 mark`, that is the same file twice in two adjacent lines, and the trailing "section 5" label is now unexplained. No code behavior change (all `//!` header lines), so this is an anchor and description defect only.
- Correction: keep patch, change anchor to `2-frozen-schema-v1-shape` and fix the reason; and replace line 4 so it does not duplicate line 3, for example `//! (see "Frozen Schema V1 Shape" and the field table, release-manifest.md sections 2-3).` with the old trailing "section 5" dropped. Alternative: park like canonical.rs if the Lead wants the legacy section 5 content carried first. Anchor `5-releasemanifest` (the "Retained Runtime Identity And Activation Source Detail" copy at release-manifest.md line 180) is a third option, but that is a retained carriage and not live authority.

### packages/distribution/rust/src/canonical.rs (set step04-019, A51 unpatched stratum) - verdict ok
Slots reviewed 1 of 1: class6-l-000192 (line 3, section 5) parked, Phase 9 carry. The module enforces the canonicalization table (NFC, ordering, case collisions, absolute and traversal refusals), which at the pin is spelled out in legacy section 5 "Release Tree Canonicalization" and carried verbatim only inside the retained-detail region of release-manifest.md; live Digest/Safety Rules are narrower. Park is defensible. Lines 35 and 76 cite "section 5" and a bare filename `runtime-identity-and-activation.md` (not edges).

### packages/distribution/rust/src/init.rs (set step04-019, A51 unpatched stratum) - verdict ok
Slots reviewed 1 of 1: class6-l-000193 (line 5, sections 3, 6 and 14) parked, Phase 9 carry. Legacy 3 (Roots), 6 (WorkspaceActivationBinding) and 14 (Walking Skeleton) map to `repository-runtime-layout.md`, `activation-binding.md` and the retained detail of `architecture/runtime-identity-and-activation.md` (the live architecture file has a different section layout), so no single successor exists; parking the whole citation is correct. Line 4 `phase-12-...md` is a bare filename. No dead paths.

## Record-text notes (not rework)
- class6-l-000192 and class6-l-000193 reason text begins with a doubled "A51, L12-30/31/32/58/60:" prefix.
- class6-l-000194 reason also says "preserve the adjacent schema contract citation" while the replacement duplicates it (see above).

## Lead-judgment questions
- canonical.rs: since the retained detail in release-manifest.md reproduces the canonicalization table verbatim, could this patch to the retained "Release Tree Canonicalization" subsection instead of parking? The park is consistent with L12-30(3) (carriage is not a patch target), so I do not call it a defect.

## Counts
- step04-019 patched stratum: 1 reviewed, 1 rework (100%, over 3%, so every file in the set expands: 3 other files of the set, including preserve/parked, need full review).
- A51 unpatched stratum: 2 reviewed in this part, 0 rework.
- Slots reviewed: 3 (1 patch, 2 parked).

Status: DONE_WITH_CONCERNS
