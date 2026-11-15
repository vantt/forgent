# Phase 05 report: config, identity and observe doctor rows in Rust

Branch `rust-verb-migration-program/s4-p05` from `8043a263f`. Status: DONE_WITH_CONCERNS.

## What changed
- Host adapters `apps/fgos/src/wiring/doctor/{config,identity,observe}.rs`; `mod.rs` gains one `GROUPS` table (rows, fixes, judge, fix per component) and `NativeOwner::row_ids()/fix_ids()` built from it. A later phase adds one `mod` line and one `Group` line.
- Registry `inRust`: 23 rows (15 config incl. `gateway-token-configured`, 6 identity, 2 observe) and 8 fixes (6 config, 2 identity). Split now 79 rows bridged-or-pending, 23 judged in Rust by this phase.
- Config: one `check` per call serves all 15 rows; finding mapping and fix mapping as Node had them (texts unchanged); a refused read fails every row with its reason.
- Identity: machine id, key, OpenSSH, project id, shared directory rows and the two mint fixes in process; `writer-identity-resolvable` judges the running host in process and asks the activation's binary only when it is another binary (bounded spawn of the native `identity` verb), so an older activated release still shows as a version mismatch.
- Observe: dir probe and a real friction read in process; nothing created.
- Node deleted: `src/setup/config-checks.mjs`, `identity-checks.mjs`, the observe/writer/identity bodies and registrations; two helpers the bridged `runner-patterns-config` and the provider inventory still read (`checkConfigOnce`, `isConfigDoorFailure`) now live in `registrations.mjs`. Node now registers 87 rows, 19 fixes.
- Doors: new row "retired Node config, identity and observe doctor rows" (13 names, no allowed file, seeded negative per name in `test/architecture.test.mjs`).

## New `pub` items in OPC-reviewed crates (flag)
- `fgos-config`: `provider::roots` (was private), `repair::fix_with_roots`. Twin left: the Node addon `packages/git/node-addon/src/config.rs` `fix_entry` still builds its own request closure (file not in my set; it can call `fix_with_roots`).
- `fgos-identity`: `machine::prepare_state_root`, `machine::mint_here`, `signing::{OpensshProbe, probe_openssh, judge_openssh}`.
- `fgos-observe`: `shard::probe_observe_dir`.
- `fgos-distribution` (not fgos-git): `activation_record_path` (the existing private path now has one name; the identity adapter uses it, no new door entry).
No new `pub` item in fgos-git, fgos-process; no crate edge added.

## Parity (host vs base release 118df7065, doctor table, 58 cases = 34 earlier + 24 new)
Green. New cases: broken config file, unknown key, secret outside `private` (+fix), loose global file (+fix), doc drift fix, redundant value fix, legacy global token kept by fix, no/invalid machine id (+fix), machine key (+fix never replaces), no `ssh`/`ssh-keygen` on PATH (+fix), old and unreadable OpenSSH banner, broken project id file, outside any repository, pending activation record, observe dir present, friction store symlinked, fresh repository writes nothing under `.fgos/observe`.
Runner changes: per-step `env` (PATH without tools), actions for those fixtures, minted machine id normalised, Node-child bound now `1 + bridged fix segments` read from the registry (was a fixed 2; every phase that ports fixes changes the segment count, so it follows the registry).
Accepted change: `doctor --dir <nonexistent>`: Node failed `identity-machine-id/-key/-project-id` with the spawn's `ENOENT`; the host judges the machine's identity without a child, so the machine rows answer what they judge. Parity ignores those three rows in that one case. Proposed doc line below.
Other message differences (not exercised by parity, accepted): the text of an I/O error inside `observe-dir-writable` and of a refused config read that is not a missing project root (Rust error text instead of Node's `ConfigDoorError` text).

## Retired test -> owner now
| retired | owner now |
|---|---|
| `test/setup/config-checks.test.mjs`: every contract row and fix registered, machine-files id kept | `config.rs` `the_adapter_has_exactly_the_rows_and_fixes_of_the_contract_...` and `doctor/mod.rs` registry-equals-adapters test |
| same: warn/fail mapping naming file, line, column, row | `config.rs` `a_warning_finding_passes_...` |
| same: no value in a row message | `config.rs` `no_row_message_carries_a_value_of_a_config_file` |
| same: one door call per doctor run | structure: `judge_rows` reads once per call (`rows_from` takes the one result); parity compares rows |
| same: token row/fix creating private dir and token, legacy token kept by the ordered fixes | parity `config-legacy-global-token-kept-by-fix`, `config-secret-outside-private-fixed`; crate golden tests own the engine |
| same: addon cannot load -> row fails naming fgctl | removed behaviour (no addon in the host) |
| `identity-checks.test.mjs`: machine id warn/mint/pass/not replaced; canonical state root; key row; ssh row; invalid id; project row; shared directory | `identity.rs` tests of the same names; `signing.rs`/`machine.rs` crate tests own OpenSSH verdicts and `prepare_state_root`/`mint_here`; project minting is the crate's `project` tests |
| `writer-identity-doctor-check.test.mjs` (both doors answer, older activation mismatch, no host) | `identity.rs` writer row tests (no activation, unusable activation, activation binary that does not answer); version-mismatch wording by `ask_host` (one wiring case with a real older release is parity-only on the activated fixture of 12) |
| `observe-doctor-checks.test.mjs` | `observe.rs` tests (fresh repository writes nothing, existing dir proven writable, symlinked store fails with cause); `shard.rs` probe test |
| registrations Data Dictionary #7/#7b expected set | now the registry's ids (the spec lists every row, not only Node's); `runner-patterns-config` legacy case no longer asserts the config row (crate owns it) |

## Gates
- fmt; clippy `-D warnings` on fgos, fgos-config, fgos-identity, fgos-observe, fgos-distribution (all targets): clean; msvc and darwin `cargo check` of fgos, fgos-identity, fgos-observe, fgos-distribution: no warning from my files.
- `cargo test --locked -p fgos --no-fail-fast`: all pass except (1) `cli_tests` `doctor_without_node_fails_each_bridged_row_naming_node_once_and_still_answers` (asserts every row fails "Node is not available"; split by owner is p06's fix, take it when it lands) and (2) `wiring::gateway_control` `a_build_that_succeeds_...` once with "Text file busy" (race writing a fake cargo script, unrelated, passed in isolation earlier in the suite).
- `cargo test` fgos-identity, fgos-observe, fgos-config, fgos-distribution: green.
- Node: architecture, registrations, doctor-bridge, config-door green; wider focused run of every test importing checks/registrations/harness/config-fixture: see the final lines of the status below.
- Census regenerated (0 undeclared). Routes unchanged (no verb added).
- Beyond my focused set the series gate should include: every `test/setup/*.test.mjs`, `test/cli/*`, `closing-block`, `fgctl-init*`, `doctor-fresh-run`, the doors rows in `architecture.test.mjs`, and the p06 `cli_tests` fix.

## Proposed `## [Unreleased]` line
`fgos doctor` judges its config, identity and observe rows inside the host; with `--dir` naming a directory that does not exist the machine identity rows now answer instead of failing on a start-up error.

## Concerns
1. `cli_tests` Node-missing case needs p06's split (above).
2. `packages/distribution/contracts/doctor-registry.v1.json` `inRust` and `doctor/mod.rs` `GROUPS` will conflict textually with 04, 06, 07; additive, resolve by keeping every id and group line.
3. Twin in the Node addon `fix_entry` (see flag).
