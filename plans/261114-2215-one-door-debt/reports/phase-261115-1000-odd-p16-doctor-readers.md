# Phase 16 report: doctor and setup readers through their doors

Branch `one-door-debt/p16`, cut from origin/main 8d6a07c4c. No Rust.

## Changes

- `registrations.mjs` persona walk: `allAgentYamlFiles` is now `scanAgentTiers` entries in the door's order, one per name (first tier wins, as `listAgents`); `readAgentSkills` reads those entries. The project's own `domains/`, the legacy `agents/` directory and `.yml` files are no longer read. A name defined twice inside one tier is still reported by `checkAgentTypeNamesUnique`. Tier labels in that check's messages come from the scan; the check description no longer spells the directory names.
- `registrations.mjs` global directory: `checkRunnerPatternsConfig` uses `globalFgosDir()`.
- Activation: the doctor path literals now come from `host-bin-path.mjs` (`activationFilePath`, `ACTIVATION_RELATIVE`, both new, additive); reads were already through `readActivationFile` / `resolveActiveHostBin`. `bin-discovery.mjs` had no remaining read (only a comment), no edit.
- `runner-config-conversion.mjs`: `retiredJsonAdvice(parsed)` takes the parsed document only; the raw file read is deleted. The doctor row gets the document from `readProjectConfigSource` (facade) for the finding's scope: project = cwd, global = parent of `globalFgosDir()`; a source that is not legacy JSON is reported as unreadable, as the old read error was.
- `docs/architecture-manifest.json`: removed the three `registrations.mjs` debt entries (global directory row, activation row, agent tier row). Final debt of the agent tier row is `[]`.
- `FGOS_ACTIVE_MANIFEST_PATH` in `registrations.mjs`: doctor reads an explicit override for its own checkout diagnosis and passes it as scoped env; the host's payload lookup (`payload-root.mjs`) is a different job (host binary to manifest). Left as is.
- Test: `registrations.test.mjs` gains one case (tier order, shadowing, project `domains/` not read). No test asserted the old read or last-wins, so none retired.

## Doctor effect

`fgos doctor --json` through `fgos:dev` before (origin/main) and after: 110 rows, identical ids and statuses. Changes only for a project with its own `domains/` agents, a legacy `agents/` dir or `.yml` agent files, or a cross-tier same-name definition (now first-tier-wins instead of last-wins).

## Gates

Green: 48 test files matching `setup/registrations|bin-discovery|checks-doctor|runner-config-conversion|host-bin-path`, `agent-definitions`, `architecture`, `doc-health`, `git-mutation-census`, `mailbox-behaviour-v7n`, `envelope-contract`, `fgos-manifest`; `check-decision-citation-drift`; `git-one-door-scan` (0 undeclared; census regenerated). One failure outside the gate: `test/rust-host/release-targets.test.mjs` needs a release build of the addon (matched only by the `host-bin-path` grep); not run green here.

## Needs the big lead

- `host-bin-path.mjs` is outside the phase's file list; the two exports were needed for requirement 3 (no activation literal left in the doctor).
- CHANGELOG `## [Unreleased]` line proposal: "doctor reads agent definitions in the same tier order as persona lookup; a project's own `domains/` agents are no longer counted".

## Lessons

- A debt row that names a whole file hides string literals in messages and descriptions too; the tier labels must come from the door.
- A door that exposes a reader but no path forces callers to rebuild the path; export the path with the reader.
- zsh does not word-split `$VAR`; build test file lists as arrays or the runner silently runs only a subset.

## Authority

Persona tier order: `src/runner/agent-definitions.mjs`. Activation record path: `src/util/host-bin-path.mjs`. Global directory: `src/config/facade.mjs`.
