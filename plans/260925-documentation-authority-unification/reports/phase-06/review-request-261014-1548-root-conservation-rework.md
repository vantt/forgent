# Independent review request: bounded root conservation rework

Author session: codex-session:18@2026-10-14
Content commit: 7833bb4c11125394ea5482fdc781ccd1cf8e4e1d
State: ready-for-review; no Step 5 closure

Review exactly seven pending rows, correcting the seven reworks from the conservation reports at 563247893. Full source/target texts, full digests, source-to-target diffs and before/current decisions are in [review-pack-261014-1548-root-conservation-rework.md](review-pack-261014-1548-root-conservation-rework.md); SHA256 `f8a3c99a1a7bcd9a7a9abc64a4f349bca9c46981ad777eb8fadeff482edc8c78`. Sidecar: `review-pack-261014-1548-root-conservation-rework.md.json`. Four governance rows, one Pilot B io-contract row, two SC-1 gap predecessor rows; original authorship retained, no approval carries. Rationale-only rows retain text/digests. README now resolves to docs/README.md, with nine adjusted link spellings across governance.md; Migration Rule and Related Files rationale no longer mentions an absent component-boundary path. The deferral rewrite and 9881f8622 example-only deltas are fully disclosed.

One native table gap and one stable heading digest change are direct mechanical consequences of the two Related Files row corrections, shown in the pack; review them with those rows. The old table ID stays an explicit unverified gap, with the real native successor shown; no extra source decision or guessed identity is authored. These are accounting, not truth receipts.

The approve --github qualifier is left absent: src/verbs/merge/approve.mjs:337-355 explicitly forbids that transport for trunk merges, so the old mode assertion is not restored. The registry comment alone is not sufficient evidence. No SC-1 target text change.

Use ordinary Claim | Verdict | Note | Source digest | Target digest rows; notes must be your own and full shown digests must bind. The independent review report must be committed before applying approvals. The separate truth report (5/30 false) and its sample are untouched, pending owner instruction. Do not promote, push, merge main, start Step 6 or edit any protected tool/baseline.
