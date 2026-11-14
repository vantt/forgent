---
phase: 12
title: "The project shim path and the activation record are known once in Node"
status: pending
effort: 0.75d
leak: "census rank 10 (shim path by hand; activation record location)"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 12: Shim path and activation record through host-bin-path

<!-- Red team 2026-11-14: narrowed. The five route clients differ in protocol, version rule and error code
(session-identity.mjs:60, seat-binding/client.mjs:69-88, holder-lock/driver.mjs:99-114) and all already choose the binary through
resolveActiveHostBin: legitimate per-protocol adapters, no shared helper, no row. The template literal is generated from the door. -->

Rules: `phase-lead-rules.md`. pNN = `p12`; report slug `odd-p12-host-binary-door`; no Rust. Facts: `phase-00-facts.md` "Leak 10".

## Outcome

`src/util/host-bin-path.mjs` (tier 0 leaf) is the one Node module that knows where the project shim lives and where the
activation record is. Hooks, timers and the generated extension get the path from it. Doctor and bin-discovery readers stay as
two visible debt entries until phase 16.

## Requirements

1. `host-bin-path.mjs` gains `projectShimPath(root)` and the relative form it joins (one constant). Move
   `src/setup/agent-hooks.mjs:45-46` (`getProjectShimPath`), `:476` (the mailbox shim walk-up keeps its owner/mode check) and
   `src/setup/managed-timer.mjs:305` (keeps its fallback to the resolved release path) onto it.
2. `agent-hooks.mjs:546` builds the path inside a generated TypeScript template that runs in the agent process: interpolate the
   relative form from `host-bin-path.mjs` into the template text when it is generated, so `agent-hooks.mjs` holds no literal. Check
   the other matches in the file (`:119`, `:187`, `:690`) and move or explain each.
3. The route clients (`src/holder-lock/driver.mjs`, `src/seat-binding/client.mjs`, `src/terminal-control/client.mjs`,
   `src/run-supervisor/client.mjs`, `src/util/session-identity.mjs`): no change. Record in the report that they already share the
   chooser and differ in protocol on purpose (census rank 10 item closed as legitimate).
4. `doors` row (new, `kind: door`): `{ job: "installation shim and activation record location", patterns: ["activation\\.json", "['\"]installation['\"],\\s*['\"]bin['\"]", "\\.fgos/installation/bin"], allowed: [...], debt: [{path:"src/setup/registrations.mjs", reason:"doctor rows read activation.json directly; moved after the capability plan rewrites the file"}, {path:"src/setup/bin-discovery.mjs", reason:"reads activation.json directly; moved after F0 phase 06 rewrites the file"}], retiredBy: "S7: the Node reader retires with the Node payload; distribution keeps writing", reason: "distribution writes the record and the shim, the host reads them; in Node only host-bin-path knows where they are" }`.
   `allowed` as the check finds it: `src/util/host-bin-path.mjs`; the distribution files (`packages/distribution/rust/src/{init,lib,shim,uninstall,fgctl_refresh}.rs`),
   `apps/fgos/src/legacy_exec.rs`, `apps/fgctl/src/help.rs`, `src/setup/project-launcher.mjs` (generated sh/bat launchers),
   `bin/fgos.mjs` (read `:4168` and write the true reason, or move it if it builds the path), each `scripts/` and CI file with its
   reason. `agent-hooks.mjs` and `managed-timer.mjs` must not match. `FGOS_ACTIVE_MANIFEST_PATH` is owned by
   `src/run-supervisor/payload-root.mjs` (its comment): not part of this row.

## Files

- Modify: `src/util/host-bin-path.mjs`, `src/setup/agent-hooks.mjs` (path parts only), `src/setup/managed-timer.mjs` (:305 only),
  `bin/fgos.mjs` (only if `:4168` builds the path), `docs/architecture-manifest.json` (row).
- Tests: `projectShimPath` owned by the host-bin-path test (`rg -l "host-bin-path" test`); `test/setup/agent-hooks.test.mjs` asserts
  the generated template contains the door's relative form; `test/setup/managed-timer*.test.mjs` unchanged.
- Net size: src about -10.

## Gates

`node scripts/run-tests.mjs` on `rg -l "host-bin-path|agent-hooks|managed-timer|project-launcher" test`, `test/architecture.test.mjs`,
`test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- Generated extension text changes bytes (L x M): the test pins the path; re-run `fgos setup`-equivalent generation tests.
- Rollback: revert the phase (revert phase 16 and 15 first).
