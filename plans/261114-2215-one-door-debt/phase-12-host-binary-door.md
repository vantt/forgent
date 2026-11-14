---
phase: 12
title: "Host shim path and host-route lookup live once in host-bin-path"
status: pending
effort: 1.5d
leak: "census rank 10 (shim path by hand, five route clients)"
startAfter: ["F0 wave A on main", "phase 06 on main (src/util/session-identity.mjs)"]
landAfter: []
---

# Phase 12: One host-binary door for Node

Rules: `phase-lead-rules.md`. pNN = `p12`; report slug `odd-p12-host-binary-door`; no Rust.
Facts: `phase-00-facts.md` "Leak 10".

## Outcome

`src/util/host-bin-path.mjs` (tier 0 leaf) is the one Node module that knows where the project shim lives and how a
missing or mismatched host is told to the caller. Hooks and timers ask it for the shim path; the five route clients keep their
own error classes and codes but share its lookup-and-refusal text and version check.

## Requirements

1. `host-bin-path.mjs` gains `projectShimPath(root)` (today's `getProjectShimPath`, `src/setup/agent-hooks.mjs:45-46`). Move
   `agent-hooks.mjs:46,476` (the mailbox shim walk-up keeps its owner/mode check, using the function for the path) and
   `src/setup/managed-timer.mjs:305` (keep its fallback to the resolved release path) onto it. `agent-hooks.mjs:546` builds the
   path inside a generated TypeScript template that runs in the agent process: leave it, allowed with that reason, and add one
   test that the template text contains exactly `projectShimPath`'s relative form.
2. Route clients: `src/holder-lock/driver.mjs:55-116`, `src/seat-binding/client.mjs:~60-117`, `src/terminal-control/client.mjs:33-80`,
   `src/run-supervisor/client.mjs:22-60`, `src/util/session-identity.mjs:~51-75`, beside `src/util/host-bin.mjs` `invokeHost`.
   Put the parts that are the same in all six into `host-bin-path.mjs` as at most two functions (the "no fgos host binary found
   (tried: ...)" refusal text from the resolver's tried list, and the host-version check of an answer); each client calls them
   and keeps its own spawn options, protocol parsing, error class and code. Do not merge the spawn calls (sync/async, stdin,
   timeouts differ on purpose). Layering: holder-lock (tier 1) may import only tier-0 leaves; `host-bin-path.mjs` is one.
   Every existing message string stays byte-identical unless the clients disagreed; then pick the resolver's wording and list
   each changed string in the report.
3. `doors` rows (new, `kind: door`), split by language if the twin rule demands it:
   - `{ job: "installation shim and activation record location (Node)", patterns: ["activation\\.json", "['\"]installation['\"],\\s*['\"]bin['\"]", "\\.fgos/installation/bin"], allowed: ["src/util/host-bin-path.mjs", {path:"src/setup/project-launcher.mjs", reason:"generated sh/bat launchers cannot import"}, {path:"src/setup/agent-hooks.mjs", reason:"generated extension template; path pinned by test"}, scripts tooling with reasons], debt: [{path:"src/setup/registrations.mjs", reason:"doctor rows read activation.json directly; moved after the capability plan rewrites the file"}, {path:"src/setup/bin-discovery.mjs", reason:"reads activation.json directly; moved after F0 rewrites the file"}], reason: "distribution writes the record, host-bin-path reads it" }`
   - the Rust half (`packages/distribution/rust/src/{init,lib,shim,uninstall,fgctl_refresh}.rs`, `apps/fgos/src/legacy_exec.rs`,
     `apps/fgctl/src/help.rs` as the check finds them) as its own row with reason "distribution writes and the host reads the record".
   - `{ job: "tell the caller the host binary is missing or mismatched", patterns: ["no fgos host binary found", "host-version-mismatch"], allowed: ["src/util/host-bin-path.mjs", ...only files that still must name the code to map it, each with reason] }`.
   `src/run-supervisor/payload-root.mjs` owns `FGOS_ACTIVE_MANIFEST_PATH` (its comment): no row change for it here.

## Files

- Modify: `src/util/host-bin-path.mjs`, `src/setup/agent-hooks.mjs` (path parts only), `src/setup/managed-timer.mjs` (:305 only;
  its temp name is phase 15's), `src/holder-lock/driver.mjs`, `src/seat-binding/client.mjs`, `src/terminal-control/client.mjs`,
  `src/run-supervisor/client.mjs`, `src/util/session-identity.mjs` (probe part only), `src/util/host-bin.mjs`,
  `docs/architecture-manifest.json` (rows).
- Tests: the owning proof of the two shared functions goes in the host-bin-path test (`rg -l "host-bin-path" test`); each client
  keeps one wiring case for its own error code (`test/holder-lock/driver-unavailable.test.mjs`, the seat-binding,
  terminal-control, run-supervisor client tests, `test/session-identity/*`); duplicate "missing host" message cases across those
  files retire to the host-bin-path test (named in the commit). `test/setup/agent-hooks.test.mjs`, `test/setup/managed-timer*.test.mjs`.
- Net size: src about -60, tests about -30.

## Gates

`node scripts/run-tests.mjs` on every test found by `rg -l "host-bin-path|host-bin.mjs|holder-lock/driver|seat-binding/client|terminal-control/client|run-supervisor/client|session-identity|agent-hooks|managed-timer" test`,
plus `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- A client's callers match an error message by text (M x M): keep strings; `rg` the old strings in `src` and `test` before changing any.
- Rollback: revert the phase.
