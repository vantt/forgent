---
id: p-yfpixqfmdq
title: Decide what `fgctl` does with a release that predates the `git-wal-v1` addon (Packaging, owner decision)
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-12
---

# Why

On 2026-11-12 the rollback rehearsal showed that `fgctl repair` and `fgctl init --override-pin` of the new `fgctl` refuse `v0.2.0-rc.5` with `git-addon-missing: linux-x64 requires components.nativeAddon with git-wal-v1`; the only way back to rc.5 is rc.5's own `fgctl` plus restoring the config files the upgrade moved. Options: (a) keep refusing and make the refusal name the next step (rc.5's `install.sh` with its tag, then the config restore in the owner guide); (b) allow the activation of an older release with an explicit flag; (c) leave it and document it. The refusal text lives in the distribution crate's activation gate, outside the close phase's files.

# Done when

Rolling a machine back to a Git-addon-less release has one documented, tested path, and the refusal says which.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
