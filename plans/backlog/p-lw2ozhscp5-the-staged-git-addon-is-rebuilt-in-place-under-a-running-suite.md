---
id: p-lw2ozhscp5
title: The staged git addon of the main checkout is rebuilt in place, so a source change during a full suite makes its tests fail with `git-addon-unavailable: digest mismatch` (tests; source: owner order via lead:SUPERVISOR, 2026-11-25)
status: proposed
priority: P2
area: tests
created: 2026-11-25
---

# Why

On 2026-11-25 a full `npm test` (18:45 to 18:56, release 33f462be) failed 232 tests instead of the 24 that fail on main, almost all with `fgos: "take" refused: the Git state of ... could not be read: git-addon-unavailable: digest mismatch`. The witness listed `fgos`, `fgos.node`, `manifest.json` and `source-digest` under `.fgos/runtime/git-addon/e9756c489113b5d0/` as modified at 18:48:19 to 18:49:05, in the middle of the run. The same suite run alone and without source changes in the window (18:56 to 19:08) failed the usual 24.

`scripts/lib/git-addon-stage.mjs` fingerprints every Cargo workspace member (`source-digest`) and rebuilds the staged addon when the digest is stale. The staging directory is per checkout, so every process that uses the main checkout shares it. A change to any workspace source while a suite runs (a land or a merge into the main checkout) changes the digest, the next process rebuilds the files in place, and a process that loaded the old bytes sees a mismatch.

# Done when

A full suite started on the main checkout is not broken by a source change made after it started: either the suite works from a copy of the staged addon it fingerprinted at the start, or the rebuild goes to a new directory and the old one stays until nothing uses it. One test covers the rule.

# Notes

Not proven which action rebuilt the addon at 18:48. Two candidates: a `cargo test --workspace` that ran at the same time, and the lands that moved main from `be883c57a` to `829bb5311` during the window. The mechanism (a stale digest rebuilds in place) is read from the script, not reproduced. Until this is fixed, run no full suite while leads land code into the main checkout.
