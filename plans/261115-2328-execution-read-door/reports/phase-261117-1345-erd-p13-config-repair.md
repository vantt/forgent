# Phase 13 report: Config repair moves per-capability taste

Status: DONE (plan lead approved the doctor wiring as part of this phase)

## What changed

- `packages/config/contracts/doctor-rows.v1.json`: row `config-capability-taste-moved` (fail/fail, fix `move-capability-taste`), fix listed last in `fixes`.
- `packages/config/rust/src/doctor.rs`: `taste_plan` reads one file and plans the move leaf by leaf (target set already, equal, or different; two sources for one target). The row reports each retired entry at role/persona/seat depth (detail `moved`, `removed`, or `conflict <other path>`, never a value). With any conflict in the file no finding offers the fix.
- `packages/config/rust/src/repair.rs`: `move-capability-taste` through the write transaction. One commit sets the new `runner.roles` / `runner.personas` leaves and unsets the retired keys together (a capability row holding nothing else goes whole), so the file stays valid under a schema that no longer allows the old keys. A value whose reason differs from that commit's is written again under its own reason text. Seats are dropped and each path is reported. A conflict changes nothing. Idempotent; a confined session is refused by the existing rule.
- `packages/config/contracts/fixtures/doctor.v1.json`: shared `runner` schema (post-removal shape: capability rows reject the old keys) and 11 cases: single move, two agreeing, two disagreeing (file untouched), target different (untouched), target equal, seats removed and named, own reasons kept, global file, file with none, row/severity/no-value check, conflict row naming both paths with no fix.
- `packages/git/contracts/mutation-census.v1.json`: regenerated.

Reason lines: the reason text is kept; the `[actor]` becomes the writer running the fix (the write transaction owns actor).

## Retired test -> owner now

None retired.

## Gates run

- `cargo fmt --all --check`: ok
- `cargo clippy -p fgos-config --all-targets -- -D warnings`: ok
- `cargo test -p fgos-config`: all green (golden_doctor owns the new vectors)
- `cargo check -p fgos-config --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: ok
- Probe of this repo's `.fgos/config.yaml` (throwaway, not committed): `code:*` red-team and reviewer plan as moves, `marketing:*` red-team conflicts and names `runner.capabilities.code:*.roles.red-team.prefer`; no fix offered until the person decides. Matches the acceptance text, except the fix applies nothing and the row names the paths (no refusal code added).

## Doctor wiring (approved by the plan lead)

One row id and one fix id, owner Rust, no bridge row or `layers` touched: `apps/fgos/src/wiring/doctor/config.rs` (`ROW_IDS`, `FIX_IDS` with `config-move-capability-taste`), two entries in `packages/distribution/contracts/doctor-registry.v1.json`, measured counts in `wiring/doctor/mod.rs` (110 rows, 57 native, 28 fixes) and `test/setup/registrations.test.mjs` (57 rows, 23 fixes to Rust), and the row/fix lines in `docs/platform/config/spec.md`, `packaging-distribution/spec.md` and `contracts/setup-doctor-registry.md`.

Accepted differences from the phase text: a conflict applies nothing, offers no fix and the finding names both paths (no refusal code); a moved value keeps its reason text and its `[actor]` becomes the session running the fix.

Further gates: `cargo test -p fgos --bin fgos wiring::doctor` (107 ok), `cargo clippy -p fgos --all-targets -- -D warnings`, `cargo fmt --all --check`, Node (one file per run): checks-doctor-config, config-door, registrations, pre-commit-config-check, git-mutation-census, architecture, doc-health, check-decision-citation-drift all green; one-door scan 0 undeclared.

## Also noted

- This repo's schema has no `runner.roles` / `runner.personas` yet (they arrive with the seat-binding config shape phase), so the fix cannot write on a real config until that lands; the vectors use their own shared schema.
- `doctor` now fails on any project/global file still holding the keys, until the fix runs.
- CHANGELOG line proposal: "`fgos doctor --fix` moves per-capability role and persona taste into `runner.roles` and `runner.personas` and drops capability seats."

## Unresolved questions

None.
