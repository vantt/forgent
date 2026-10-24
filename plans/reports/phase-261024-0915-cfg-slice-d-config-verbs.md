# Phase report: native `fgos config` verbs (plan phases 09 and 10)

Branch cfg/slice-d-verbs (from cfg/slice-d 64b60a56f). Commits 5be65b72a (code, read tests, wiring) and 890c84526 (write wiring cases). Not pushed, not merged.

## Status: DONE_WITH_CONCERNS (cap overrun; owner decision needed before merge)

## Cap and ceiling (decision question)

- What is happening: Rust source delta by the plan formula is +1,024 lines (7,373 vs 6,349 before). `provider.rs` is 682 lines against its 340 cap (phases 09+10 share it). `inspect.rs` 130 of 170. apps/fgos (presenter 15, projector 164 incl. tests, main 11) 190 of 330. catalog 26.
- Cause: nine verbs with real behaviour (target-file choice, expected revision, patch file parsing, the three migrate shapes, refresh over several files, check facts, refusal shaping) in rustfmt style; the 1.8x estimate was about half of the real size. Nothing was trimmed from scope.
- Options: A) accept and raise the provider cap to about 700 and the ceiling by about 600 (after this the remaining headroom to 3,300 is about 95 lines, phases 11 and 14 need 170 by their caps); B) keep the ceiling and cut later phases; C) move patch/target/revision helpers into the crate proper (no net gain, only shifts lines).
- Recommendation: A.
- Scope of answer: merge of this branch and the caps of phases 11, 14.

## Done

- `fgos config show|explain|standard|check|set|unset|patch|migrate|refresh-docs`, native, `config.read` (show, explain, standard, check, `migrate --dry-run`) and `config.write` (rest) descriptors; route `config` (annotations plus regenerated `command-routes.json` via the script); registry entry (one description per verb, `nativeOnly`).
- Output: `fgos.v1` envelope like `identity`; refusal = `fgos_identity::Refusal` (reason = first failure id, detail = every refusal line, exit 65); `check` prints findings and exits 65 on any `fail` row (new `ConfigOutcome` arm in `cli_presenter.rs`, 15 lines).
- Roots: project = `--dir`/nearest `.fgos`, `trusted_root` = `trusted_main_root` via `GitDriver` (state root as driver dir, same as `fgos identity project`), global = `$HOME/.fgos`, class = `session_class(env)`, detectors none.
- Writes: only `write::commit`, `write::refresh`, `migrate::project`, `relocate::copy/finish`; `rg "File::create|fs::write"` on provider.rs is empty. Confined session refused with `config-write-confined` before any file is read (the crate refuses again). Target file by schema (`x-fgos-file`, then scope; `--global` on a project-only key refused `scope-project-only`; token key refused). `patch` items must share one file (`patch-spans-files`). `refresh-docs --global` covers global + accounts, skips legacy JSON files (listed). `migrate --global` without `--machine-checked` prints the machine check text. `migrate` on this repository's own file was NOT run (fixtures only).
- Never echoes a value: show goes through `render_for_display`, explain prints the standard value only for non-secret nodes, findings/refusals are value-free; a cli case asserts a sentinel is absent from check output.

## Tests

- `packages/config/rust/tests/inspect_verbs.rs` (new, 3): show provenance/subtree, explain node and undescribed, standard fragment (ancestors + doc lines, siblings removed, validates where scope allows).
- `cli_projector.rs` unit (2): read and write argument mapping, operation id (dry run reads), incompatible flags (`--finish` needs `--global`, `--machine-checked` needs `--finish`, `--accept-machine-overrides` not with `--global`).
- `apps/fgos/tests/cli_tests.rs` (8): one per family: show, explain+standard, check, set/unset/patch (+ `@fgos:why [writer] reason` in the file, ack for a noted key), confined refusal, migrate dry-run then real + tombstone, migrate --global copy then `--finish` refused then allowed, refresh-docs twice.
- `cargo test -p fgos -p fgos-config -p fgos-host-runtime --features fgos-config/host-provider --jobs 4`: green. clippy (same set, all targets, and fgos-config without the feature): clean. `node --test` on command-routes, subcommand-flag-drift, command-registry, help, manifest, unknown-flag: green; knowledge-deprecation and dead-vocabulary-guard fail identically on the base (not mine).
- Formatting: the three files I own are rustfmt-clean; `cli_projector.rs`, `main.rs`, `cli_tests.rs` were already not fmt-clean on the base, so my additions there are not reformatted (avoids a noisy diff).

## Files touched beyond the ownership rows (needed, flag for review)

- `apps/fgos/src/cli_presenter.rs` (+15): the `ConfigOutcome` arm.
- `test/cli/subcommand-flag-drift.test.mjs`: `config` added to the native-verb list and sources (the existing owner of registry-vs-Rust flag proof; it failed without it).
- `packages/config/rust/tests/inspect_verbs.rs` (new), `Cargo.lock` (fgos depends on fgos-config).
- CHANGELOG not touched: the plan gives it to the closeout phase only.

## Crate API gaps (nothing added in the crate)

- No public "revision of the file a write targets" helper (provider has a 17-line `revision()` beside `write::current` and doctor's private `yaml_file`).
- No public machine-files fact for `MachineFacts.machine_files`; derived from `token::read` error text.
- `comment-would-be-lost` surfaces as `config-parse (comment-would-be-lost)`; a hint to pass `--acknowledge-comment-loss` would be friendlier (crate Display).
- `provider.rs` is `cfg(unix)` because `write`, `relocate` are; apps/fgos no longer builds on Windows (out of frame in the plan).
- Pre-existing: `show` on this repository fails until migrated (expected, D19).

## Unresolved

- Cap decision above. Phases 09/10 are committed as one code commit because both share `provider.rs`.

Status: DONE_WITH_CONCERNS
