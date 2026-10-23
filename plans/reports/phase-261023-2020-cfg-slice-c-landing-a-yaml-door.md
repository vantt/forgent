# Landing A: the native YAML door (phases 00 to 04)

Branch `cfg/slice-c-a`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-c-a`, base `aeb11845d` (origin/main, unchanged at the end). Not pushed, not merged.

## Commits

1. `63044decd` addon `yaml` namespace + `marshal.rs` (phase 01)
2. `21c45f9f7` `parseYaml` over the addon, door helper, Node wiring proof (phase 02)
3. `c38a2f686` js-yaml deleted, guard, deny bans, scripts staging (phase 03)
4. docs commits (phase 04): RUL108, spec status, backlog, CHANGELOG, board; then the citation-gloss fix

## Phase 00 facts (YAML part)

- Impact analysis: inactive (not queried; `rg` cross-checks used).
- Importers of `src/util/yaml.mjs` (unchanged): `src/workflow/{loader,units-source}.mjs`, `src/report/capability-plan-lint.mjs`, `src/runner/execution/run.mjs`, `src/runner/agent-definitions.mjs`, `src/runner/dispatch/assignment.mjs`, `src/setup/{instruction-registry,workflow-definition-files}.mjs`, `scripts/{project-agents,build-domain-registry}.mjs`, `scripts/lib/git-spawn-match.mjs`, plus the test fixture `test/holder-lock/fixtures/extract-v1.mjs`. `.mark`/`.reason` readers: only the old `yaml.mjs`.
- Prior art: `8ef1baf1c` introduced the door and vendored js-yaml (RUL101); premise (parser present in a bare checkout) is what the addon door replaces on purpose (YAML spec section 10).
- Scripts that parse YAML outside a release: `build-domain-registry`, `project-agents` (both failed bare, verified); `git-spawn-match` runs inside the test launcher env, and the one-door scan already needs the git addon. Highest decision id in use was RUL107; RUL108 taken (Slice D must take RUL109 if it needs one).
- Focused Node run that stages the addon: `node .fgos/runtime/tmp/with-env.mjs --test <files>` (scratch wrapper calling `buildTestEnv` from `scripts/run-tests.mjs`; not committed). A bare `node --test` cannot load the addon.
- Parity (old vs new door, canonical JSON, 1414 tracked yaml files and markdown frontmatter blocks): 1396 equal, 18 rejected by both, 0 different.

## What changed

- Addon: `yaml.rs` (70 lines, cap 70), `marshal.rs` (66, cap 80), `lib.rs` +2 module lines +`"yaml": 1`, `Cargo.toml` dep. Rust added 136 + 2 (ceiling 700). Test file `packages/git/node-addon/tests/yaml_parts.rs` (35). `guarded` reuses `fgos_yaml_doc::guard` (its silent hook), so no second catch_unwind. JSON text is written by hand in document order (a serde_json map would sort keys); non-finite floats listed in `special`.
- Node: `yaml.mjs` (`YamlParseError`, `describeYamlError` prints `<rule words> (line L, column C)`), `door.mjs` (`fromDoorJson`, marker, `nativeDoor` reuses an addon already loaded by a descriptor), `git-addon-stage.mjs` (`ensureAddonForScript`), two scripts call it, `git-spawn-match.mjs` rethrows non-parse errors instead of treating a missing addon as "not standalone".
- Deleted: `src/util/third-party/js-yaml.mjs` (3614 lines), its manifest row, the hash test, `yaml-test-mapping.v1.json` and its shape test (owning fixtures named in the commit and in the test header).
- Guards: architecture YAML guard scans the door too and requires `../native/door.mjs`; `cargo-deny` bans serde_yaml, serde_yml, serde_yaml_ng, yaml-rust, yaml-rust2, unsafe-libyaml (`bans ok`); `api_seal` checks the addon manifest does not abort on panic.
- Docs: RUL108 (rule line, decision entry, RUL101 entry marked superseded, text kept), YAML spec status/history, component-boundary, reading-map, backlog (p-8d04c7f1 closed, p-99951b9e progress), CHANGELOG line, board row and log line.

## Counts

- Node `src bin scripts` (vendored file excluded): +60 / -49, net +11 for this landing (the slice-wide -400 target depends on landing C). Vendored 3614 counted apart. Tests: +65 / -155 lines.

## Verification (all run one at a time, jobs 4, no `npm test`, no workspace cargo test)

- `cargo test -p fgos-yaml-doc -p fgos-node-addon --jobs 4`: pass; clippy `-D warnings` on the addon (all targets): clean; `cargo deny ... check bans`: ok.
- Node files through the staged env: `test/util/yaml.test.mjs` (4), `test/git/native-load.test.mjs`, `test/architecture.test.mjs` (31), `test/rust-host/release-tree.test.mjs` (after a release build), `test/runner/dispatch-reconciliation-import-graph.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs`, 19 importer test files (357 tests), 13 door/spy/script test files (175), 11 doc-touching files (352): all pass except the two below.
- Failing, not caused by this change: `test/setup/skill-wrappers`-family drift tests ("assembleSkills output matches the committed .agents/skills", "projection tests for Codex/OpenAI and Claude surfaces") fail on a file-set difference for `instruction-audit/`; no YAML involved.

## Findings and deviations

- The suite preloads the git spawn spy into every child; the spy imports `git-spawn-match` -> `yaml.mjs` -> `door.mjs`, so the reconcile import-graph probe stopped seeing door modules (already preloaded). The probe now runs its child with `NODE_OPTIONS` empty.
- `release-tree` builder child reads the checkout with a descriptor-loaded addon; `nativeDoor()` now returns the addon already loaded in the process.
- Files touched outside the phase ownership lists, each needed: `test/git/native-load.test.mjs` (versions marker), `test/setup/yaml-parse-failures.test.mjs` (self-referencing document now reports `node limit`), `test/runner/dispatch-reconciliation-import-graph.test.mjs`, `scripts/lib/git-addon-stage.mjs`, `packages/yaml-doc/rust/tests/api_seal.rs`.
- Not built: the `nullPrototype` option of `fromDoorJson` and `Failure.rule` (no caller until the config namespace; add in that change).
- `packages/git/contracts/mutation-census.v1.json` is rewritten by the release-tree test run; it was already stale on main, I restored it and left it alone (it still names the deleted file until the next release build regenerates it).
- `scripts/project-agents.mjs` has no `--check`; running it rewrote `.claude/agents/*` (pre-existing drift), reverted.
- Plan phase files were not edited (no status cells touched).

## Unresolved

- `npm test` full suite not run (instructed not to); owner or the landing run should do it once cfg-slice-d's build is done.
- Landing needs a merge of `cfg/slice-c-a` into main by the lead; board row says "waits for merge".

Status: DONE_WITH_CONCERNS
