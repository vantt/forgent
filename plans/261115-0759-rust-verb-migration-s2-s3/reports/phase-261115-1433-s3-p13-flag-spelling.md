# Phase 13 report: one spelling rule (`--flag=value` removed)

Branch `rust-verb-migration-program/s3-p13`, one commit on `f07daba5a` (s3-merge-main).

## What changed
- `routing.rs`: `Call` is the one reader (`sub_word`, `named_dir`, `arguments`, `without_sub`, `value`, `switch`, `flag_outside`); `named_dir(selector, args)`, `pre_door_named_dir`, `pre_door_unknown_flag_text` and the `=` cut are gone. `PRE_DOOR_NATIVE_VERBS` is now `LENIENT_ROOT_VERBS` (one use left: the doors' lenient root arm; exact-set test kept). Unknown-flag text is Node's grammar for every verb (hint included); a verb "has sub-verbs" when the annotation carries `subcommand_flags` (identity does).
- `cli_projector.rs`: config, identity, convention, version and observe projectors read `Call` only (no private parser).
- `mailbox_verbs.rs`: `project_mailbox_request` on `Call`; a switch that the parser handed the next token to stays on and the token is a word of the call (so `send --wake "body"`, the usage line's form, still works).
- `packages/observe/rust/src/flags.rs`: `Flags::parse` over `cli_args::parse_args` (same rule for `--json <word>`).
- `cli_args.rs`: `ParsedArgs.first_positional_at` (Rust-only extra; flags and positional rows of the vector file unchanged).
- `help.rs`: `--dir=` skip removed (`fgos --dir=/x --help` is an unknown option now).
- `scripts/fgos-shell-integration.sh`: `--dir=*` case removed; how-to line 185 rewritten.
- `doors` row `parse CLI arguments (twin)`: the three twin debt entries removed (cli_projector, mailbox_verbs, observe flags). Spec decision bullet in host-invocation-routing and the git spec name updated.

## Retired test -> owner now
| retired | owner now |
|---|---|
| cli_tests `a_near_miss_native_flag_is_refused_with_a_suggestion` (suggestion text gone) | routing.rs `config_refuses_an_unknown_flag_in_the_node_cli_text` |
| routing.rs `an_unknown_flag_is_named_with_a_near_miss...`, `a_flag_with_an_equals_value_is_judged_by_its_name...`, `the_valid_flags_of_a_verb_off_the_pre_door_list...` (pre-door half), `a_verb_off_the_pre_door_list_reads...`, `the_project_a_call_names_follows_the_reading_of_its_verb` | routing.rs `a_flag_with_an_equals_value_is_refused_whole...`, `a_dir_spelled_with_an_equals_sign_is_an_unknown_flag_for_every_verb` (one refusal per eight verbs), `a_call_reads_its_sub_command_and_flags_only_through_the_shared_parser`, `the_project_a_call_names_is_its_dir_flag...`, `a_call_hands_a_verb_its_words_flags_and_the_arguments_after_a_bare_separator` |
| test/rust-host/help-routes `-h --json --dir=<cwd>` row; fgos-shell-integration `--dir=` passthrough block | help.rs `help_words_may_follow_json_and_dir...` (refusal case); behaviour removed |
| metrics_cli/coverage.rs assertion `["--dir"]` is an error | invocation_doors `a_verb_off_the_pre_door_list_reads_its_dir...` (bare `--dir` refused by the root door) |
Rewritten in place (spelling only): cli_projector (4), observe flags/metrics_cli/eval_journal, run-result unit_summary, cli_tests (2).
New owners: cli_projector `a_flag_that_takes_no_value_refuses...`, mailbox_verbs `projection_tests` (3), cli_args first-positional test, flags.rs `=`/switch refusals.

## Gates (rebased on f07daba5a)
- fmt, clippy -D warnings (fgos, fgos-observe, fgos-host-runtime, fgos-run-result), `cargo test` of those four: green. `cargo test -p fgos --test cli_tests --test mailbox_routes`: green (mailbox_routes needed no change).
- node: parse-args-vectors, unknown-flag-rejection, subcommand-flag-drift (reader taught `value/switch/text/has/named("x")`), invocation-fault-log, architecture, git-mutation-census, fgos-shell-integration: green. help-routes (after a release workspace build): green.
- census regenerated; msvc and darwin `cargo check` (fgos, fgos-observe, fgos-host-runtime): clean.

## Proposed CHANGELOG line
`--flag=value` and `--dir=<path>` are no longer accepted by any verb; use `--flag value`. The refusal names the flag and says to write `--k <value>`. The eight older native verbs (config, convention, friction, gate-bypass, identity, mailbox, metrics, version) now print Node's unknown-flag text, so their "Did you mean --x?" hint is gone.

## Concerns
- "Did you mean" for near-miss flags is lost on the eight older verbs (exact Node bytes wins, per the brief).
- A switch followed by a word (`config set --global a v`) is refused `--global takes no value` (Node's rule); mailbox and Observe keep the word.
- Tests outside the file list were touched because they pinned the removed spelling: `packages/observe/rust/tests/eval_journal_test.rs`, `packages/run-result/rust/tests/unit_summary.rs`, `metrics_cli/*`.
