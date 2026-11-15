# F0 phase 09: Node help retirement

Branch `rust-verb-migration-program/f0-p09`, based on `origin/rust-verb-migration-program/f0` (`958aae220`). Not landed.

## Done

- `bin/fgos.mjs`: deleted `renderParameterLines`, `renderFlagLines`, `renderGuide`, `renderHelpText`, `refuseHelp`, `printVerbHelp`, `handleHelp`, `handleVerbHelp`, the `formatDeprecation`, `publicManifest` and `MANIFEST_SCHEMA_VERSION` imports, and the help branches in `main()` and `handleHook` (the `hook` no-kind usage stays: it is not a help token). The second manifest formatter (`JSON.stringify(publicManifest()...)`) and the stale "mirrors bee.mjs" comment went with the block. In place: one forwarder. An exact `--help`/`-h` token anywhere (or as the verb) runs `runHostInherited` (`src/util/host-bin.mjs`, host from `resolveHostBin`), same argv, stdio inherited, exit code passed on; with no host it prints one stderr line (installed `fgos`, `npm run fgos:dev -- <verb> --help`) and exits 4. The setup verb's `deprecationMessage` is now built from the registry string directly (same bytes).
- Unknown-verb default arm (usage lists every verb in registry order) is untouched and does not use any deleted code. `fgos-post-merge-2.test.mjs` still owns it for Node; `help-routes.test.mjs` owns the host bytes (usage equals the manifest's verb names in order).
- Deleted `src/cli/deprecation.mjs` (and its `architecture-manifest.json` row, `ARM_STATIC_IMPORTS` entry), `test/cli/fgos-help.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs`, and their two `suite-baseline.json` rows.
- `doors`: `bin/fgos.mjs` left the "verb manifest projection" allowed list; new row "retired Node help renderer" (four names, allowed none).
- `scripts/test-proof-inventory.mjs` `cliCost` times help on `FGOS_HOST_BIN` itself (`hostBin` option; refuses without one).
- Harness: `generateCoverageFloorCases` no longer emits `coverage-help-*` (82 cases); `loadParityTable(name, dir)` takes a directory so `harness.test.mjs` proves the loader with a scratch table; `release-tree.test.mjs` runs the remaining floor cases.
- `apps/fgos/src/help.rs`: five unit tests added for cases Node tests covered and Rust lacked (below).
- New test helper `test/helpers/command-manifest.mjs` (reads the committed manifest file) for tests that check what the manifest says.

## Where the code differs from the phase text

- **The forwarder does NOT strip `FGOS_RUST_HOST_RECURSION_GUARD`.** Stripping it caused a real runaway: with the machine's installed (older) release, which forwards help to Node, a Node forwarder that strips the guard calls that host again, which starts Node again, without end (about 200 processes in 20 s, load 33; stopped with SIGTERM to the process group, nothing left). Keeping the guard makes the older host refuse the second hop. The new host answers help before it ever reads the guard, so nothing is lost; `help-routes.test.mjs` proves the new host answers with the guard set and that a stub host sees `guard=1`.
- `handleHook`: only the `kind === '--help' || '-h'` part of the branch is gone (unreachable once `main()` forwards); the no-kind usage stays.
- `coverage-help-*` floor cases are removed (phase table), so `release-tree` asserts every remaining floor case ran (`>= 10`).

## Test owners (every deleted or changed case)

| Old case | New owner |
|---|---|
| `fgos-help`: submit/discover/take help exits 0 with own block | `help.rs` `every_manifest_entry_renders_as_text_and_json_and_every_sub_verb_narrows`; through the binary `help-routes` per-selector case (every route selector, 3 forms) |
| `fgos-help`: init --help writes nothing | `help-routes` "help never runs the verb" (init forms, directory stays empty) |
| `fgos-help`: only that verb's block | `help.rs` `one_verbs_help_prints_only_that_verbs_block_and_narrowing_drops_the_other_sub_verbs` (new) |
| `fgos-help`: top-level lists every verb | `help.rs` `the_whole_list_names_every_live_verb_with_its_effect_label` (new) |
| `fgos-help`: guided verbs state sections/flags/examples/exit codes | `help.rs` `a_guided_verb_prints_its_sections_in_order...` (existing, order) and `a_guided_verb_names_every_flag_example_and_exit_code_of_its_entry` (new) |
| `fgos-help`: run exit codes cover every outcome | `fgos-manifest.test.mjs` "run lists the exit code of every execution outcome..." (registry data) |
| `fgos-help`: setup once under Compatibility | `help.rs` `every_deprecated_verb_prints_a_plain_notice_alone_and_setup_is_listed_under_compatibility` (new) + existing `top_level_text_lists_live_verbs...` |
| `verb-help-json`: every verb entry JSON | `help.rs` every-entry test; `help-routes` per-selector case |
| `verb-help-json`: `-h` = `--help`, `--help <verb>`, repeated tokens | `help.rs` `help_words_may_follow...`, `verb_help_reads_its_words...`; `help-routes` top-level case compares `-h` to `--help` |
| `verb-help-json`: five top-level refusal forms, unknown sub refusal | `help.rs` `top_level_refusals_name_the_request_and_the_usage`; `help-routes` refusal case (all five forms, `--help foo --json`, `-h --json --bogus`, `--help add submit`, unknown sub with known list) |
| `verb-help-json`: sub narrowing | `help.rs` every-entry test; `help-routes` sub cases |
| `verb-help-json`: sub enum matches subcommands; run/workflow door text | `fgos-manifest.test.mjs` (both moved, reading the manifest file / registry) |
| `verb-help-json`: help never runs the verb (write/spawn forms, help after value-taking flag) | `help-routes` "help never runs the verb" |
| `verb-help-json`: --dir through the shell function | `help-routes` "help accepts the --dir the shell function appends" |
| `verb-help-json`: exact help token as flag value | `help.rs` `verb_help_reads_its_words...`; `help-routes` per-selector case (`metrics coverage --by -h`, `version --x -h`, `add --title --help`) |
| `fgos-manifest`: `--help --json` parses to manifest matching registry; not wrapped | `command-routes.test.mjs` (file equals registry projection, keys exactly commands and schema_version, names equal registry) |
| `fgos-manifest`: `--help` prints every verb; deprecated renders; formatDeprecation; submit positional; move mixed | `help.rs` (new tests above; `deprecation_is_a_string_or_structured_metadata`; `the_shipped_manifest_renders_positional_only_and_mixed_arguments_in_their_own_idiom`) |
| `fgos-manifest`: setup deprecated text | registry half stays in `fgos-manifest.test.mjs`; text in `help.rs` |
| `help-routes`: byte-identical to Node payload | byte-identical to the generated manifest file |
| `help.cases.mjs` (496 byte cases) and `verb-parity` | `help.rs` + `help-routes`; the Node side no longer renders, so there is nothing to compare against |
| `refusal-unknown-verb` case | `help-routes` refusal case (exact usage line = manifest verb order); Node's own arm: `fgos-post-merge-2.test.mjs` |
| `coverage-help-*` | `help-routes` per-selector case |
| `claim-2` (3), `gateway`, `internal-routes` | read the manifest file through `test/helpers/command-manifest.mjs` |
| `dispatch-operability` (2 help parts), `run-verb` (2) | `help.rs` (dispatch positional and label; guided flags) and `fgos-manifest` (run flags); registry assertions stay |
| `loadParityTable("help")` self-test | same test with a scratch table directory |

## Gates

- `node scripts/run-tests.mjs` on: fgos-manifest, help-routes (7), harness, command-routes, claim-2, gateway, dispatch-operability, run-verb, internal-routes, test-proof-inventory, checks-doctor-config, architecture, doc-health, git-mutation-census, fgos-post-merge-2, release-tree, command-registry, subcommand-flag-drift, unknown-flag-rejection, fgos-tool, checks-setup-rc-line, shell-rc, fgos-shell-integration, host-bin: 502 pass, 0 fail, no ERROR lines (`/dev/shm/rvm-f0-p09-gate2.log`).
- `cargo fmt --all --check`, `cargo clippy -p fgos --all-targets -D warnings`, `cargo test -p fgos` (89 unit, 52 cli, 50 mailbox routes, others): green.
- `export-command-selectors.mjs --check` clean; one-door scan 0 undeclared, class counts equal to the base except `configured-binary` 90 to 92 (the host spawn in `host-bin.mjs` and the host timing in `test-proof-inventory.mjs`, both a configured host binary, not Git).
- Not run: full `npm test`, `cargo test --workspace`, msvc/darwin checks (Rust change is test-only in `help.rs`).
- A first gate run was killed by the tool timeout (SIGKILL, no worktree registrations left: `git worktree list` shows none prunable) while the guard-strip runaway above was live; both were cleaned, then the gate reran green.

Docs for phase 11: `docs/reading-map.md:144` and the verification docs naming the deleted `fgos-help.test.mjs` (`packaging-distribution/verification/install-and-release-proof.md:43`, `implementation-alignment.md:82`, `packaging-checklist.md:70`).

## Authority

- Verb manifest rendering is now held in one place (`help.rs` from the committed file). Still two copies of "the verbs of the surface" for the unknown-verb line (Node from the registry, host from the manifest), guarded by `help-routes`.
- `resolveHostBin` is the one Node host lookup; the forwarder lives beside it in `host-bin.mjs`.

## Lessons

- A forwarder between two doors needs a loop breaker that survives an older peer; the phase's "strip the guard" rule fork-bombed against the installed release. Keep the guard unless proven needless against every host that can be on the machine.
- A foreground gate longer than ten minutes is killed by the tool with SIGKILL; run long gates with run_in_background.
- The one-door scan resolves a spawn's binary only through a function in the same file or a static import; a spawn helper next to `resolveHostBin` classified cleanly, an inline dynamic import did not.

## Proposed [Unreleased] line

- `fgos --help` through the direct Node channel (`node bin/fgos.mjs`) now hands the call to the native host instead of rendering it; without a host it exits 4 with a pointer to the installed `fgos`.

Status: DONE_WITH_CONCERNS
Summary: Node help renderer and its tests are retired; the Node channel forwards help to the host, every deleted case has a named owner, gates green on the pushed head.
Concerns/Blockers: (1) the forwarder keeps the recursion guard instead of stripping it (phase text said strip): stripping fork-bombed against the older installed release; (2) `configured-binary` census class 90 to 92, 0 undeclared; (3) docs citing deleted tests left for phase 11; (4) full `npm test` and `cargo test --workspace` not run.
