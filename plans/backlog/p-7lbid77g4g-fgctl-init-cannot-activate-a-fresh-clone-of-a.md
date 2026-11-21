---
id: p-7lbid77g4g
title: "`fgctl init` cannot activate a fresh clone of a repository that already uses fgOS"
status: proposed
priority: P2
area: distribution
created: 2026-10-25
---

# Why

In a fresh `git clone` of this repo (fg-server2, 2026-10-25, release `874af08f`), `fgctl init` fails with `git-addon-missing`, and with `pin-mismatch` when given `--from <staged release>`; `fgos setup` then refuses with `git-fence-missing` until the activation tombstone `fgctl init` would write exists. A new machine or teammate joining a project hits this before the Event Store is reached. Found by the HARDEN T3-04b correctness seat (report, arbitration §3). Checked 2026-11-09: `fgctl init --override-pin <reason>` (`492d4ee59`) closes only the `pin-mismatch` half, and only when the pinned-away release is already staged on the machine; a plain init of a pin whose tag is not staged downloads that tag (spec "The pin records the tag"). Left open: `git-addon-missing` has no recovery (no override can activate a release without `git-wal-v1` in `components.nativeAddon`, `packages/distribution/rust/src/verify.rs`), and no test drives clone → init → setup (`test/rust-host/fgctl-init.test.mjs` never runs `fgos setup`).

# Done when

A fresh clone of a project that uses fgOS activates with `fgctl init` (with and without `--from`) and `fgos setup` passes with no hand-made files; one owning test drives clone → init → setup; any refusal names its next step

# Notes

Migrated from the legacy backlog table. Original status: proposed.
