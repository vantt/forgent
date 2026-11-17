# Phase 08 report: the agent-definition listing in Rust

## What changed
- `packages/execution/rust/src/agents.rs`: pure `list(tiers, shipped_core) -> Listing`. The host hands each tier's files as `(name, rel, bytes|unreadable)` in lookup order, plus the shipped core persona names when the project carries its own `core/agents/` folder (the masked source). Judges YAML via `fgos-yaml-doc` (Tool profile), shape problem (incl. the persona-model-taste refusal, message unchanged), render warnings (JS own-key order), description folding (JS whitespace set, JS number text), shadows, masked, duplicates, ignored `.yml`.
- `packages/execution/contracts/agents.v1.json`: 15 vectors (project files + install files in, listing out), recorded from Node.
- `scripts/agents-vectors.mjs` (record and `--check`, hermetic through `buildTestEnv`, reuses `serialize` and `adoptTestEnvironment` of `scripts/executor-model-vectors.mjs`, now exported) and `test/helpers/agents-vectors.helper.mjs` (evaluator shared by recorder and twin).
- `packages/execution/rust/tests/golden_agents.rs`: replays the vectors (plays the host sorting files into tiers). Unit tests in `agents.rs` for the unreadable file and float text (Node cannot reproduce an unreadable file portably).
- `test/runner/agent-listing.test.mjs`: reduced to the Node twin replay plus one test of the record script. Twin declared in `docs/architecture-manifest.json` (door row "agent definition tier directories", `retiredBy` S6a). Census regenerated, baseline rewritten, reading-map line.

## Retired tests -> owner now
| Retired case | Owner now |
|---|---|
| a well-formed definition has no render warnings | vector 1, `golden_agents.rs` |
| keys the renderer drops; block scalars read in full; parse failure has no warnings/description | vectors 2, 3 |
| listing reports tier, shadows, shape problems, ignored | vectors 3, 4 |
| project core hides installed core, project domains hides nothing | vector 7 |
| project without own domains hides nothing | vector 8 |

## Gates
- `cargo test -p fgos-execution --test golden_agents --lib`: pass; clippy `--all-targets -D warnings` clean; `cargo fmt` applied.
- `node scripts/run-tests.mjs test/runner/agent-listing.test.mjs`: 2 pass; `scripts/agents-vectors.mjs --check`: 15 match.
- `test/architecture.test.mjs`: 71 pass. Census regenerated with the scan.
- Not run: full `npm test`, `cargo test --workspace`, msvc/darwin `cargo check` (ask plan lead).

## Left / questions
- The host adapter that reads the directories (sorting by `localeCompare` in Node, bytewise in the replay) is not built; names in vectors are plain lowercase so both agree. Host phase must settle the sort.
- `list` takes a second argument (shipped core) beyond the phase's one-argument signature.

## Sort order
The order of directory entries (Node `localeCompare` vs Rust bytewise) is a decision for the phase that builds the host adapter (phase 10, recorded in its file). The vectors use plain lowercase names, so both agree.
- msvc and darwin `cargo check -p fgos-execution`: pass. `test/suite-baseline.json` is left to the regeneration at landing.
