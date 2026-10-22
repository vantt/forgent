# Seat trim: convention rule evaluation behind the native door

Status: BLOCKED at the pre-check; no source changed.

## Pre-check findings

1. Addon availability. `nativeDoor()` (src/native/door.mjs) throws `git-addon-not-shipped` / `git-addon-unavailable` and has no fallback;
   `canonicalJson` is only called on state-write paths, which AGENTS.md already confines to an activated project or `FGOS_HOST_BIN`.
   The callers of the two convention modules are read paths:
   - `src/workflow/loader.mjs` (`definitionNameOf`): every workflow load, e.g. workflow list / validate / start, core/workflows/*.yaml.
   - `src/runner/dispatch/config.mjs` (`isSeatId`, `definitionFileName`): every `loadRunnerConfig` of a config that names `seats` or `personas`
     (the shipped workflows and the model-pool config do).
   - `src/runner/agent-definitions.mjs`, `execution/{run,handoff-refs,seat-resolver}.mjs`.
   The global-npm `fgos` and `node bin/fgos.mjs` compatibility channels, run outside an activated project and without `FGOS_HOST_BIN`, have
   no release and no `native-addon.json` (package.json `files` ships none), so `nativeDoor()` throws there. Today these reads work there.
   After the change they would fail with `git-addon-not-shipped`. Also `personaNameProblem` in config.mjs catches every error from
   `definitionFileName`, so an addon failure would be misreported as "invalid persona name" unless it rethrows non-TypeErrors.
2. Prior art: seatIdProblem came with d9b7026d5 (seat identity), definition names split out in 1416998f3. The JS-reads-contract design was chosen
   to avoid an exec per id check; no earlier native attempt exists.
3. Import guard: both modules are layer `domain`; `src/native/door.mjs` is `infra`, and domain may not import infra. They would move to `infra`
   in docs/architecture-manifest.json (no importer in kernel/domain imports them today to be re-checked after the move).

## Design fork (needs the SEAT lead)

A. Accept: rule evaluation requires the addon; read verbs on a compat channel outside an activated project fail with a named error.
   Matches "one authority, no JS fallback", costs the compat-channel read paths.
B. Keep the JS evaluation (this item is dropped); the Rust crate stays the owner of golden vectors, Node keeps the existing loops.
C. Make the compat channel ship the addon (out of scope here; a distribution change).

Recommendation: A only if the owner confirms compat-channel reads outside an activated project are not a supported surface; otherwise B.

## If A is chosen (plan, ready to execute)

- node-addon: new `src/convention.rs` with `convention.seatIdProblem(value) -> Option<String>`, `convention.reservedSeatIds() -> Vec<String>`,
  `convention.definitionNameOf(rule, file)`, `convention.definitionFileName(rule, name)` over `fgos_convention::packaged_rules()`; add the
  `fgos-convention` dependency; extend the `versions()` ABI marker check.
- seat-id.mjs / definition-names.mjs become thin wrappers over `nativeDoor().convention` (error messages kept); config.mjs `personaNameProblem` rethrows non-TypeErrors.
- Retire the Node golden loops in test/convention/{seat-id,definition-files}.test.mjs; owner is the Rust crate's golden tests.
- package.json `files` entry for convention.rules.v1.json becomes unneeded (outside my file list).
