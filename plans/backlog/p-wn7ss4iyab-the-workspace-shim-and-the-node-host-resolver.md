---
id: p-wn7ss4iyab
title: The workspace shim and the Node host resolver still run whatever `releasePath` an `activation.json` names
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-09
---

# Why

The `fgos` launcher on PATH now runs only `<stateRoot>/releases/<artifactDigest>/bin/fgos` (2026-11-09), but the fgctl workspace shim (`packages/distribution/rust/src/shim.rs` `sh_body`, `cmd_body`) and `hostBinFromActivation` (`src/util/host-bin-path.mjs`) take `releasePath` from the file, which a cloned repository can commit. The host exports `FGOS_HOST_BIN` to its payload, so the Node resolver is reached only outside the host (tests, checkout runs, doctor rows, the mailbox timer); agent hooks call the workspace shim directly.

# Done when

Both readers resolve the release from `artifactDigest` in the machine store with the launcher's rule (strict digest, absolute state root), never from `releasePath`, and a committed activation naming a path inside the project is refused by both, each with one test

# Notes

Migrated from the legacy backlog table. Original status: proposed.
