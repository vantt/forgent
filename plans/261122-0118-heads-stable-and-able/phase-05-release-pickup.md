# Phase 5: A live head's requests run the active release

Capability: `code:implement`.

Closes `p-ycausep3zs`, taking the first option its done-when names: the request route resolves the active release on
each request. That reaches every live head on its next request without a restart, which a rotation-on-activation
cannot.

## Inputs

- `packages/run-supervisor/rust/src/head_request.rs`: `Config.host_bin` is fixed when the head launches. `run_verb`
  executes `<host_bin> internal head-request`, so every verb runs the release that was active at launch.
- `packages/run-supervisor/rust/src/supervise/terminal.rs:802` builds `HeadRequests::from_envelope`. The closure ports
  of `Config` (`holds_role`, `pending_rotation`, `bind_session`) are the pattern for an injected read.
- The activation record `.fgos/installation/activation.json` (`releasePath`) and the release `manifest.json`
  (`entries.fgos`). Their reader lives in `packages/distribution/rust/src` (`launcher.rs`, `shim.rs`): find the one read
  of activation to the host binary with `rg -n "activation.json" packages/distribution/rust/src`.
- Evidence: the lead of plan 261119-1142 ran release ae71ed18 after f2cbf36e (route fix 530050e8e) became active, and
  its `fgos run` tickets failed with exit 4. The secretary lineage ran 4f7ea1d8 for days.
- Design principle 2 (lower layers never know upper ones; a shared read moves down, never copied).

## Footprint

`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/src/supervise/terminal.rs`,
`packages/run-supervisor/rust/tests/head_request.rs`, `packages/run-supervisor/contracts/head-request.v1.json`,
`docs/platform/run-supervisor/spec.md`.

## Steps

1. Give `Config` one port, "the host binary for this request". The default keeps today's `host_bin`. A head launched
   from an activated release (its start host lies inside that project's activated release root) resolves the project's
   current activation on every request and runs that release's `fgos`. A dev host (`npm run fgos:dev`, or
   `FGOS_HOST_BIN` outside any release) keeps its start host.
2. Build the port where the socket config is built (`supervise/terminal.rs`), from the existing activation reader. If
   that reader sits above `fgos-run-supervisor`'s layer, move only its pure read (activation path to host binary) down
   to the lowest layer both need, in the same change. If that file is outside this footprint, stop and report the
   plan change to the lead; never add a second reader.
3. If activation is unreadable or names no host, run the start host and write one log line (`head-request <id>
   release-fallback: <why>`). The verb still answers.
4. The protocol stays `--protocol 1`. Note in `head-request.v1.json` (section `run`) that the route child is the
   active release's host.
5. Owning test in `packages/run-supervisor/rust/tests/head_request.rs`: two fake release roots, each with a host
   script that prints its release name. Activation names the first; one request runs it. Activation is flipped to the
   second; the next request runs the second, with no restart. A dev start host is never switched.
6. Docs: `docs/platform/run-supervisor/spec.md` records the rule as a settled fact.

## Verify

`cargo test -p fgos-run-supervisor --test head_request` passes.

## Rollback

Revert the phase commit. The port's default is today's fixed host.

## Owner answer `q-pn6ur6wrjf` (2026-11-22)

Move the pure read into `fgos-host-runtime`. Step 2 moves the activation-to-host-binary read from
`fgos_distribution::activated_host_bin` down to `packages/host-runtime/rust/src/activation.rs` (exported from its
`lib.rs`); `packages/distribution/rust/src/lib.rs` calls it instead of keeping its own copy, and
`fgos-run-supervisor` depends on `fgos-host-runtime` (`packages/run-supervisor/rust/Cargo.toml`, `Cargo.lock`,
`docs/architecture-manifest.json`). The supervisor widened the footprint by these paths in `9a30bd755`.
