# Host Invocation native follow-up review: source decisions

Reviewer: reviewer:claude-session:a4954387@2026-10-13
Author session: codex-session:1@2026-10-11
Review mode: ordinary
Pack commit: 744fecf08

Scope: the 6 source rationale corrections, the 14 changed native units (seven headings, seven tables) across five files, and the follow-up pack in review-request-261013-1811-host-invocation-native-followup.md. Verdicts: 6 ok. Changed text: 14 ok. Rework: none. 

Method. I reused scripts/generate-doc-inventory.mjs extractMarkdownConservationUnits, the extractor the prior rework reports used, at commit 744fecf08 (docs unchanged from HEAD). All source and target unit digests in the pack match the recomputed textDigest values and the accounting JSON. All 28 before and current digests listed under Changed text recompute, and both file SHA256 values per file match. git diff 0c06e6e6b 744fecf08 touches docs only in the five listed files, seven changed lines, each reviewed below. Native fact check: packages/host-runtime/contracts/command-routes.json has 75 selectors and exactly five with route_kind native: convention (lines 101-104, convention.query), friction (201-204, observe.friction), gate-bypass (220-223, work.gate-bypass.show), metrics (346-349, observe.metrics), version (662-665, distribution.build.show). apps/fgos/src/cli_projector.rs projects the same five operations at lines 20, 27, 31, 56 and 81, and test/rust-host/command-routes.test.mjs asserts native route_kind for them. No dated-snapshot label was needed: every fix states the current five.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_d5dd5fbdb3483914743a14791a5f02a8 | ok | Rationale now names only release-boundaries#restored-class-definitions. Verified: the heading anchor exists there and the rust enum fence plus Built-In, External Process, External WebAssembly and native-dynamic-library paragraphs (blocks 12, 14-17) are verbatim in it; the enum-covers paragraph stays in the primary target; the same-process anchor no longer appears in rationale or remainder. Prior nit resolved. | 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe | e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0 |
| claim_98683c6667ec64317c110eb4fe42da11 | ok | Rationale now says heading and remaining text stay in place, the relocated body is verbatim at component-protocol#restored-both-adapters-delegate-a-complete-use-case, and the row does not claim all body wording remains in place. Verified: source paragraph 1 is in that anchor, paragraphs 2 and 3 are in the primary target. Prior nit resolved. | 1084930371798278160dcbcbd00f50c98b2ae0bbb835aa54e2185cf414701532 | 5f052dc9bcfe273204107b49849e79b3a8141978a4dae163b80ce1197be4dc52 |
| claim_b74991659ee3db4cb630f607d065ce52 | ok | Rationale now names component-protocol#restored-rust-host-first-cost as the relocated body and drops the all-wording-retained claim. Verified: the cost paragraph is verbatim in that anchor and the first paragraph stays in the primary target. Prior nit resolved. | 51b636bb97780e8be205e1fce45918f81b4e6e9b40b4a5bd008ce4a9d71cd965 | 7504e7fd27fa2de1f5b1e486ab3e7efff0e956e57f789c7363feeec37b581856 |
| claim_14f599ac6c6af84bcd15a503faaaea03 | ok | Rationale now names release-boundaries#restored-scope as the relocated body and drops the over-statement. Verified: the scope paragraph (This document discusses only migration options...) is verbatim in that anchor; the Status line stays in the primary target. Prior nit resolved. | 24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621 | 73142a367bf579e3afc2da330169ae1b04b7a9b758a33a9b8be857aca2e85373 |
| claim_aec6fb3d8eed3c772ec8bac9808009d3 | ok | Rationale now names component-protocol#restored-rejected-options-rationale. Verified: the Option A diagram fence and rationale paragraph are verbatim in that anchor; heading stays in place. Prior nit resolved. | 1b4f6a70d3530daab76986749e1284dac18236ec9de6faada23ff972e155e334 | 0ebcb1ec37ffe2db3ea182a170b3ae2810f710cda67beecf0045f491c2b08e73 |
| claim_4862726f445bfdcba1b58996cf47dfd8 | ok | Rationale now names component-protocol#restored-rejected-options-rationale. Verified: the Option C diagram fence and rationale paragraph are verbatim in that anchor; heading stays in place. Prior nit resolved. | a755bd8cd566ed1f0ada74dd6f1a63dc20a8648ba87e1b61510c9784dc216a01 | 2c60584c5c5e535249c603a1e98ede6c6497204f5e1880f44cf3a8fb0ad00a05 |

## Changed text

| Unit | Verdict | Note |
|---|---|---|
| intent-preservation-ledger.md heading 6. Open Items | ok | Heading text unchanged; unit digest moves only because the section payload changed. |
| intent-preservation-ledger.md Open Items table (unheaded-block-9) | ok | Native descriptors row now lists the five mappings under an Added in candidate label; the two-native wording is gone; the other six rows are byte-identical. Mapping set matches command-routes.json. |
| roadmap.md heading 1. Current Baseline | ok | Heading text unchanged; digest moves with the section payload. |
| roadmap.md Current Baseline table (unheaded-block-4) | ok | cli_projector row and R1 Rust CLI host row now state the five native selectors, both labelled Added in candidate; rest of table unchanged. Meaning kept: the two earlier selectors are still named. |
| roadmap.md heading 3.1 Status Tracker | ok | Heading text unchanged; digest moves with the section payload. |
| roadmap.md Status Tracker table (unheaded-block-10) | ok | R1 tracker row now states the five selectors, labelled; other rows unchanged. |
| spec.md heading 6. Unknowns | ok | Heading text unchanged; digest moves with the section payload. |
| spec.md Unknowns table (unheaded-block-11) | ok | Native descriptors row now carries the Added in candidate label the prior report requested; selector set is true. The removed second production native selector sentence was already gone before this pass; no new loss. |
| r1-rust-host-proof.md heading 2. Code-Verified Snapshot | ok | Heading text unchanged; digest moves with the section payload. |
| r1-rust-host-proof.md snapshot table (unheaded-block-4) | ok | Native selectors and Production native descriptors rows now list the five mappings (four beyond distribution.build.show), labelled. The route-matrix row already says five native. Dropped current partial and local native read proof qualifiers described the old two-selector state and are superseded by the labelled five-mapping statement. |
| source-preservation-audit.md heading 5. Remaining Unknowns | ok | Heading text unchanged; digest moves with the section payload. |
| source-preservation-audit.md Remaining Unknowns table (unheaded-block-11) | ok | Production native descriptors row replaces the second production native route wording with the five mappings, labelled; other columns and links unchanged. |
| source-preservation-audit.md heading 6. Code Scan Evidence | ok | Heading text unchanged; digest moves with the section payload. |
| source-preservation-audit.md Code Scan Evidence table (unheaded-block-12) | ok | Native production operations row now lists the five mappings, labelled; evidence links unchanged. Optional nit, not blocking: the link list still omits the observe and convention crates that implement metrics, friction and convention, although cli_projector.rs is linked. |

## Rework

None. Prior rework items: all five native-count blocks (ledger Open Items row; roadmap cli_projector and R1 tracker rows; spec Unknowns row with the Added in candidate label; r1-rust-host-proof two rows; source-preservation-audit two rows) now state the five selectors, and the six rationale nits are fixed.

Observations outside this pack, not blocking and not changed here: roadmap.md line 200 (Phase D done-when: a second production native route exists) is an acceptance criterion that remains true, and verification/r2-external-process-proof.md line 84 is a past-tense R2 merge record naming the 73-selector matrix; both read as dated history in context.
