---
id: p-xzc4voe4zh
title: "`test/runner/loop.test.mjs` runs 490 s of its 600 s file limit even alone (tests, priority medium)"
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-15
---

# Why

Under any load it times out (602 s on 2026-11-15, 268-604 s in older runs), so it fails full runs as a flake. Its five slowest cases take 15-30 s each. Also: the release suite relies on rustup installing the `rust-toolchain.toml` channel implicitly when the CI toolchain step is skipped on a release; rustup 1.29.1 warns that implicit installs are deprecated.

# Done when

loop.test.mjs is split or its slow cases are cut so a lone run takes well under half the limit, with no proof weakened; the CI release path installs its pinned toolchain explicitly without a cache, and release-packaging.test pins that.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
