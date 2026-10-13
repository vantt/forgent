# Host Invocation native follow-up review: successor bindings

Reviewer: reviewer:claude-session:a4954387@2026-10-13
Author session: codex-session:3@2026-10-13
Review mode: ordinary
Pack commit: 744fecf08

Scope: the 5 successor bindings whose targets changed in the follow-up pack in review-request-261013-1811-host-invocation-native-followup.md. Verdicts: 5 ok. Rework: none. 

Method. I reused scripts/generate-doc-inventory.mjs extractMarkdownConservationUnits, the extractor the prior rework reports used, at commit 744fecf08 (docs unchanged from HEAD). All source and target unit digests in the pack match the recomputed textDigest values and the accounting JSON. All 28 before and current digests listed under Changed text recompute, and both file SHA256 values per file match. git diff 0c06e6e6b 744fecf08 touches docs only in the five listed files, seven changed lines, each reviewed below. Native fact check: packages/host-runtime/contracts/command-routes.json has 75 selectors and exactly five with route_kind native: convention (lines 101-104, convention.query), friction (201-204, observe.friction), gate-bypass (220-223, work.gate-bypass.show), metrics (346-349, observe.metrics), version (662-665, distribution.build.show). apps/fgos/src/cli_projector.rs projects the same five operations at lines 20, 27, 31, 56 and 81, and test/rust-host/command-routes.test.mjs asserts native route_kind for them. No dated-snapshot label was needed: every fix states the current five. For each successor the source unit at its sourceCommit and the target unit at 744fecf08 were recomputed; shownSourceText and shownTargetText equal the file lines and their SHA256 equal shownSourceDigest and shownTargetDigest; the shown blocks appear verbatim in the request. Changed-text verdicts are in review-3-followup-source.md.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_b6387d30d960295b4b435073f651049f | ok | Ledger Open Items table, whole unit shown. Only the native descriptors row changed from second production native route to the five mappings (Added in candidate); remaining rows identical; mappings match command-routes.json. Source at 13322f8a6 and target at 744fecf08 recomputed; shown texts equal the file lines; no approval added. | 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2 | 0503621d0d5eee0f4c29ea520e3f0fb2224516a3a1dedc36dde16658525d453d |
| claim_ce29f4c2f27a7a5d9e5266aa311e2774 | ok | Roadmap Current Baseline table, whole unit. cli_projector and R1 Rust CLI host rows now state the five selectors with labels; other rows identical. Source at 13322f8a6 and target at 744fecf08 recomputed; shown texts equal the file lines; no approval added. | 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b | 1895bfcae8fb393d6b008fcec3e368c42f7ea6e24bac176ea8374ebfaa80d0dc |
| claim_65a7aae7b5028b9cda27951a0b7b6ac4 | ok | Roadmap Status Tracker table, whole unit. R1 tracker row restated as five selectors with label; other rows identical. Source at 13322f8a6 and target at 744fecf08 recomputed; shown texts equal the file lines; no approval added. | 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4 | 761661fa605597de44123a7c6ea679369c80196c46704ecf18aaa6529a530086 |
| claim_2549fb95501e270298d3272b058e7887 | ok | Spec Unknowns table, whole unit. Native descriptors row now carries the Added in candidate label requested earlier; other rows identical; selector set true. Source at 13322f8a6 and target at 744fecf08 recomputed; shown texts equal the file lines; no approval added. | 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e | 8325e1fcad29a45d6a9f39f8f4bb409e47285e51a2f7ea1d4198207872742fed |
| claim_51d3818de63d806db2841b0504336134 | ok | R1 proof snapshot table, whole unit. Native selectors and Production native descriptors rows now list the five mappings (four beyond distribution.build.show); labelled; other rows identical. Source at 13322f8a6 and target at 744fecf08 recomputed; shown texts equal the file lines; no approval added. | 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619 | 87dd11731527c21af8a18a47e4d23c8a179b625b03a29f9d1ec8100f18369b80 |

## Rework

None.
