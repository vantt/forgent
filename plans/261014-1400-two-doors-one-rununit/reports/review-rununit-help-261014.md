# Review — lane "help" (feat/rununit-help: 69d83fff1, b060f41b1)

Reviewer: independent code-reviewer (did not write this code). Scope: `git diff main...feat/rununit-help` (16 files, +1169/-238).

## Verification run

| Check | Result |
|---|---|
| `node --test` subcommand-flag-drift, fgos-verb-help-json, command-registry, fgos-manifest, fgos-help, rust-host/command-routes | 57/57 pass |
| `FGOS_HOST_BIN=~/.cache/fgos-lane-help-cargo/debug/fgos` help-routes, dispatch-operability, runner/dispatch-operability-production-door | 19/19 pass |
| `cargo test -p fgos-distribution`, `cargo test -p fgos --test cli_tests` (CARGO_TARGET_DIR=~/.cache/fgos-lane-help-cargo) | all pass |
| `test/rust-host/release-tree.test.mjs` R3 | **fails here, 3 cases** (`coverage-help--h`, `coverage-help---help`, `coverage-help-version`). Cause: `scripts/build-rust-distribution.mjs:250` stages the shared `target/release/fgos`, which was built from an older tree. The stderr reads `unknown verb "--help"`, and `version --help` ran the verb. That is the old host, not this branch. I did not rebuild it because target/ is shared. **This is not verified.** A full `npm test` passes only after a release build of this branch. |
| Manual probes through the real host (`scripts/run-rust-dev-host.mjs` + stub cargo) | see findings below |

## High

### H1. `fgos --help` exits 4 through the installed shell function, which breaks `fgos doctor`'s shell-integration probe
- `bin/fgos.mjs:4446-4453` (`handleHelp`) refuses every dash token except `--json/--help/-h`, and `--dir` is one of the refused tokens.
- `scripts/fgos-shell-integration.sh:59-124`: the `fgos` shell function is how users and agents invoke fgos. It appends `--dir "$root"` to **every** call that lacks `--dir`, in any git repo, so `fgos --help --json` becomes `fgos --help --json --dir /repo`.
- Reproduced through the real host: `fgos --help --json --dir /tmp` → `fgos: unknown option "--dir" for --help`, **exit 4**. The same happens without `--json`. On main, `handleHelp` ignored extra args, so this is a regression.
- Consequence 1: the lane's own goal fails. An agent that types `fgos --help --json` in a shell with fgos integration gets exit 4 and nothing on stdout.
- Consequence 2: `src/setup/shell-rc.mjs:113-127` (`probeShellIntegrationInvocation`) runs exactly `fgos --help` through the sourced shell function. `src/setup/registrations.mjs:409-420` then reports `sourced correctly, but "fgos --help" fails`. On every machine that activates this release, `fgos doctor` will report a healthy shell integration as broken. Tests miss this because they use `FGOS_SHELL_INTEGRATION_PROBE_SCRIPT` with a fixture script, and `fgos-verb-help-json.test.mjs:78` actually pins the refusal of any unknown option.
- Fix: before the unknown-option check in `handleHelp`, strip the global flags (`--dir <v>`, `--dir=<v>`), the same set the drift test calls GLOBAL. Add a test for `fgos --help --json --dir <x>` (Node and host), and ideally a probe test that runs the real `scripts/fgos-shell-integration.sh` against the dev host.

### H2. Native multi-sub-verb verbs (metrics, friction, convention) cannot be discovered through help, and lost their sub-verb list
- `apps/fgos/src/main.rs:154-163` now sends every native `--help` to Node. The deleted block (old `main.rs:188-195`) printed `Available subcommands: …` from `NATIVE_SUBCOMMANDS`. Before that, the native CLIs answered `--help` with `available_subcommands` (`packages/observe/rust/src/metrics_cli/mod.rs:64`, `friction_cli.rs:132`). Those arms can now only be reached through the positional `help`.
- The Node manifest entries `src/cli/command-registry.mjs:96,109,122` have `parameters: {properties: {}}` and no `subcommands`. `fgos friction --help` now prints only one description line, with no sub-verbs (record/resolve/list/show/rank/ping/migrate) and no flags. `fgos convention --help` does not list `name|path|check|classify` or flags such as `--slug`. AGENTS.md requires agents to use `fgos convention name|path --json` for every report and plan path, yet an agent with no `bin/` cannot learn its flags from help.
- This contradicts the lane's stated goal ("discover how to run anything using only `fgos <verb> --help --json`") and loses information compared with main.
- Fix: give metrics/friction/convention (and gate-bypass if it has sub-verbs) `subcommands` entries through `withSubcommands`, with each sub-verb's real flags. Add a parity test that their keys equal the Rust `AVAILABLE_SUBCOMMANDS` constants, for example by reading `fgos version`, or a small generated export, so the two lists cannot drift.

## Medium

### M1. The host and Node disagree on what counts as a help request (native verbs)
- Rust `main.rs:158` treats any token equal to `--help`/`-h` after the selector as help. Node `bin/fgos.mjs:4909` uses `parseArgs`, where `--flag -h` makes `-h` that flag's value.
- Reproduced: `fgos metrics coverage --by -h` → the host forwards to Node, Node does not see help and hits `nativeOnly` at `bin/fgos.mjs:4925`: `"metrics" chỉ có ở Rust host`, exit 4. `fgos version --x -h` and `fgos gate-bypass show --id -h` run the **Node** implementation instead of the native one, a silent parity divergence.
- This only matters when a flag value is literally `-h`/`--help`, which is rare. The behaviour is still unspecified, and the host and Node disagree on it.
- Fix (either): (a) when the host forwards for help, pass an explicit marker, such as an env var `FGOS_HELP_REQUEST=1` or a normalised leading `--help`, and have Node honour it before `parseArgs`; or (b) make Node apply the same raw-token rule for non-legacy routes, as it already does for `hook` at `bin/fgos.mjs:4880`.

### M2. Spec, decision record and CHANGELOG were not updated for a user-visible contract change
- `docs/specs/work-state.md:650-651` still says `schema_version` is `'2.0'`. `:1204` (RUL55) says `fgos <verb> --help --json` "không đổi", which this lane changes deliberately: it was a fall-through that ran the verb, and it is now the unwrapped entry.
- `CHANGELOG.md [Unreleased]` has no entry. AGENTS.md's install/setup/doctor gate requires one for a user-visible change. A manifest major bump plus `--help`/`-h` becoming host routes qualifies.
- The bump to 3.0 itself is justified: the verb-level `parameters.properties` of 8 verbs lost their flags, so a consumer reading them would see a breaking shape change. I grepped src/, apps/ (including fgos-gateway), core/skills, plugins and .agents and found no code consumer of verb-level `parameters.properties` or of `schema_version` beyond the tests. `src/cli/version.mjs` reads names only. Rust `resolve_verbs` filters the dash selectors.
- Fix: update work-state.md (the manifest section plus RUL55: per-verb `--json`, `subcommands`, the 3.0 rationale), record the decision in the area spec's decision history, and add a CHANGELOG line.

### M3. The drift scanner is weaker than its header suggests in two places
`test/cli/subcommand-flag-drift.test.mjs`:
- Shared-region reads only need to appear in *some* sub-verb's schema (`:227`), and a declared flag counts as "read" if the shared region reads it. Example: `retiredDispatchDoorMessage` (`bin/fgos.mjs:957`) reads `flags.assignment/cwd/for` only for the removed `execute` door, and these pass because `inspect`/`decide` happen to declare them. Adding `--foreground` to `workflow status`'s schema would also pass, because start/answer/resume read it in the shared prelude. The scanner cannot catch a schema that lists a flag under the wrong sub-verb whenever that flag is read in shared code.
- It only checks registry ⊇ handler sub-verbs (`:183`), not the reverse. A registry sub-verb with no handler branch and no flags passes silently.
- Not covered: nested modes (`reconcile plan|apply|provider-capacity …` are all lumped into one schema), `required` and `type` correctness, and object-literal hand-offs such as `fn({ ...flags })`. The `handoffs` scan stops at an unmatched `{`. No such call exists today; I grepped.
- Fix (cheap): for the shared region, require a shared read to appear in every sub-verb that can actually reach it, or at least list shared reads explicitly per verb in a small allowlist so a reviewer sees them. Add the reverse check that every registry sub-verb has a region, a DELEGATE, FALLTHROUGH or SINGLE.

## Low

- **L1** `bin/fgos.mjs:2312-2321`: `workflow` still accepts `fgos workflow <step>` and `fgos workflow --step x` with no sub-verb, but the verb-level schema marks `sub` required with a 5-value enum. `fgos workflow planning --help` is refused with exit 4 (`unknown workflow sub-verb "planning"`), even though `fgos workflow planning` runs. Either retire the bare-step alias or note it in the `operations` sub-verb description.
- **L2** `fgos dispatch execute --help` now gets the generic `unknown dispatch sub-verb "execute"` instead of the redirect from `retiredDispatchDoorMessage` to `fgos run`. That is the message an agent probing an old door most needs. Consider routing retired sub-verbs through that message in `printVerbHelp`.
- **L3** `parseArgs` lets `--json` swallow the next word: `fgos dispatch --json decide --help` returns the whole dispatch entry, not the narrowed one. It is harmless, but an agent wanting a narrowed entry should be told to put `<sub>` first. A one-line note in the `invoke` or help usage would do.
- **L4** Schema type inconsistency: `merge next --timeout` is `number`, while `dispatch watch --interval/--ticks` are `string`, though all are numeric. This matters for tool-schema-driven agents that build typed calls.
- **L5** If the legacy-node payload is missing or broken, native-verb `--help` now fails where it used to work natively. This is acceptable given the manifest ownership, but `doctor` should be the place that catches a broken payload. It already checks the activation.

## Changed old-test expectations: are they justified?

- `dispatch-operability.test.mjs`: the verb-level positional is now `sub` only and `run-id` moved to the sub-verbs. Justified by the schema split. The `invoke` change from `[runId]` to `[args]` is accurate.
- `fgos-manifest.test.mjs` key set adds `subcommands` when present. Justified.
- `dispatch-operability-production-door.test.mjs` reads `subcommands.reconcile…action`. Justified; the wording assertion is unchanged.
- `release-tree.test.mjs` drops the `semantic-json` override for `coverage-help-version`. Justified, because `version --help` is now a deterministic manifest entry and not a timestamped envelope. It needs a fresh release build (see the verification table).
- `command-routes.test.mjs`, `cli_tests.rs` and `distribution lib.rs` count dash selectors separately and assert that only `HELP_SELECTORS` are dash routes. Justified, and R3 (`fgos --made-up version` → exit 4) still holds; I verified it through the host.

## Sub-verb schemas compared with the handlers (by hand)

I checked merge, dispatch (all 7, including decide and probe-account against `src/runner/dispatch/cli.mjs:1151-1200`), session, gateway, goal, tool, agents and workflow against `runVerb`. Flags, positionals and required fields match the handlers. Two flags are listed under `merge next` and are passed on to approve: `--github` and `--pr`. `mergeNext` hands `approveOptions` whole to `approveUseCase` (`src/verbs/merge/merge.mjs:122,177`), so the flags are real, although `--pr` applies to whichever item gets picked. The workflow descriptions for the run door and the workflow door state both doors correctly (requirement 4 is met).

## Positive observations (for risk calibration)
- R3 fail-closed is preserved. Help selectors come from the registry through `HELP_SELECTORS`, and the generator refuses a collision with a verb name.
- Help now runs before `dataDir`/store gates, so `<verb> --help --json` no longer falls through and runs the verb. On main it did, which was a real side-effect bug.

Status: DONE_WITH_CONCERNS
Summary: The core design works (help routes, per-verb JSON help, schemas match the handlers). Two regressions block landing: `fgos --help` exits 4 when the shell function appends `--dir`, which also turns the shell-integration check in `fgos doctor` red, and native metrics/friction/convention lost all sub-verb and flag discoverability.
Concerns/Blockers: H1 and H2 should be fixed before activation. release-tree R3 could not be verified here because the shared target/release binary is stale, so the Lead must confirm it against a release build of this branch. The spec and CHANGELOG are not updated (M2).
