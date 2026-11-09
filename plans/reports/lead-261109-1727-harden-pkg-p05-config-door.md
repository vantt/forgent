# HARDEN packaging P05: config door ergonomics

Landed on main: `31734bc61..a89c1a83d` (branch `harden/pkg-p05-config-door`).

## What changed
- `fgos config set` / `patch` refuse every key that no section schema and no runtime key describes: `config-key-unknown`, nearest keys by edit distance (`did-you-mean=`), all unknown keys at once, joined with the reason refusal when the reason is also bad. `unset` stays allowed. Check lives in `write::refuse_unknown_keys`, called by the provider's write verbs only; relocate, repair and migrate still move unknown keys of an older file (a legacy global file with an unknown account key would otherwise stop migrating).
- Reason error: provider hint `add --reason "<why>"` through the existing HINTS table.
- `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` have no section schema (the runtime reads them with a default). New `packages/config/contracts/runtime-keys.v1.json` lists them: write verbs accept them, `config check` no longer reports them unknown (this also removes a false warning), `config explain` answers `described: true, runtimeKey: true` with description, default and owner. Typos explain with `didYouMean`.
- Free-form keys: schema `additionalProperties` maps stay open (resolve succeeds), so no opt-out flag was added.
- Proofs: `write_cases` (fixture cases replace the old case that wrote an undescribed key, whose behaviour was removed), `explain_answers_a_runtime_key_and_names_the_nearest_keys_of_a_typo`, doctor fixture `runtime-key-is-not-unknown`, one CLI wiring assertion, existing patch test now uses the real key `cleanup.ttlDays`.
- Docs: config spec failure table row and a decision-history entry; CHANGELOG line; census regenerated (no new site).

## Gate
Config crate tests, cli config tests, arch, doc-health, citation drift, focused Node config/doctor tests green; clippy `-D warnings` and fmt clean; msvc and aarch64-apple-darwin `cargo check` clean; full `npm test`: 8585 pass, 1 fail = known V7n addendum, no ERROR lines (log `/dev/shm/pkg-p05-full2-164302.log`).

## Not done
- Combined reasons are not merged with scope refusals of known keys (reason plus unknown keys only).
- `config edit` stays in Owner ideas.

## Lessons
- `nohup ... &` inside a background task did not stop when the task shell exited and I started a second full run; two of my runs queued behind each other. Start the full suite once, in the foreground-background facility, and track its pid.
- The full-suite queue waited about 40 minutes behind other leads; focused gates first, full run once at the end, saved a rerun.
- A test that writes a made-up key (`cleanup.enabled`, `login`) hid that the door accepted anything; tightening a door breaks fixtures with invented keys, so grep fixtures for the written keys before the change.
- Census conflicts on rebase: take either side, then `--write-census`; never hand-merge.
