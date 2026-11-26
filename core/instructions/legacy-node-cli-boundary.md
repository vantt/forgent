---
id: legacy-node-cli-boundary
kind: boundary
owner: core
scope: repo
mode: append
specificity: 10
title: Legacy-Node CLI Ownership Boundary
description: Rust fgos is the standard door; bin/fgos.mjs is the legacy-node payload exec-ed by the host, and working-tree code runs through npm run fgos:dev
lifecycle: live
valid_from: 2026-11-26
---

# Legacy-Node CLI Ownership Boundary

Rust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the
`legacy-node` payload entry, staged whole under a release's
`components.legacyNode.root` and exec'd by the Rust host at
`components.legacyNode.entry` — never relocated or renamed in the source tree.
The host resolves it only through those manifest fields, never PATH, cwd or
hardcoded locations outside the manifest. Global npm `bin.fgos` and
`node bin/fgos.mjs` call this entry directly but are unsupported for the
process, lock and identity verbs: the in-process door loads only the addon of
the activated release whose payload is running, so from a checkout those verbs
refuse by name (`process-door-not-shipped`, `lock-driver-unavailable` with
reason `addon-not-shipped`, `host-missing`). Run working-tree code through
`npm run fgos:dev -- <verb>` instead. Help is served by the host only: the
payload renders none, and an exact `--help` or `-h` token reaching it is
forwarded to the host (exit 4 with a pointer when no host is found). Every state write resolves the writer
identity through the Rust host (`docs/platform/identity/spec.md`), so these
channels write only inside an activated project or with `FGOS_HOST_BIN` set to
a host binary. The git hook is a cold client of the activated host and is
unaffected.

Plain `fgos` runs the activated release recorded in
`.fgos/installation/activation.json`, not newly edited `bin/` or `src/` bytes.
Use `npm run fgos:dev -- <verb> [args]` to run working-tree code through the Rust
host. It preserves caller cwd via `INIT_CWD`, honors `CARGO_TARGET_DIR`, and
materializes confined per-invocation artifacts under `.fgos/runtime/dev-host/`,
removing only its own directory after the child exits unless a process (such
as a detached run supervisor) still runs from it; a later invocation prunes
such directories once nothing runs from them. Serialize invocations
across worktrees only where their Cargo target is actually shared.

`fgos doctor` check `active-release-matches-checkout` compares the owned source
checkout's working-tree Node payload with its activation; it does not certify
Rust freshness. Dependencies do not count as drift, but symlink/unsafe manifest
entries still fail. It skips activation owned by main from a linked worktree
and the same-checkout dev manifest. To update plain `fgos`, build/stage/activate
the intended tree, then verify doctor through the installed shim. Old-release
`fgos setup` can overwrite generated render headers until that release is
restaged; activation never refreshes itself merely because source was edited.
