# Phase report: Config slice D, repairs split, machine repairs and coordinator fixes

Branch `cfg/slice-d`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-d`. Tests: `cargo test -p fgos-config` (all green), `cargo clippy -p fgos-config --all-targets -D warnings` clean, `cargo fmt --check` clean. durable-file untouched. No push, no merge.

## Commits (one per item; items 1 and 2 share one commit, see Deviations)

| Item | Commit | What |
|---|---|---|
| 5 tier cell | `3f26a47c3` | `runner.schema.yaml`: `$defs/tierEntry` (oneOf model id / `model@pool` / `{model, pool?, effort?}`, disjoint by pattern and type) and `$defs/tierCell` (oneOf entry or non-empty list, `x-fgos-merge: leaf`). Proof in `authoring_equivalence.rs`: a string at `claude.mini` in the global file over the standard's object gives the whole string; object, list and pooled string in the project over a global string give the whole cell; `[]`, `{pool}`, `""`, `7` are `config-schema`. Written first and failed with the merge type mismatch. |
| 3 cache key | `73436becb` | `snapshot::token_revision` (replaces `token_exists`) is part of the cache key. Failing-first test `a_change_to_the_token_file_alone_misses`. |
| 4 one lock helper | `1180b7a53` | `locks::hold(lock, fgos_dir, lock_root, wait)` is the only acquire; `write.rs`, `machine.rs` (`hold_global` deleted), `relocate.rs`, `migrate.rs` call it. |
| 1+2 split and repairs | `33c616d47` | `src/repair.rs` (new, `#[cfg(unix)] pub mod` in `lib.rs`), `doctor::check(ctx, roots, now)` observes the machine. |
| contract text | next commit | `doctor-rows.v1.json` `config-key-in-wrong-file` description names the legacy-JSON-only copy fix; this report. |

## Design notes

- `repair.rs`: `fix(ctx, req, writer, ids, acknowledge)` keeps its signature; roots, lock root and wait come from `req(Global)`. `refresh-docs`/`remove-redundant` as before; `chmod` -> `machine::fix_modes`; `create-machine-files` -> `token::ensure(.., token::generate)` (reports only when `Created`); `copy-to-destination` -> `relocate::plan` then `relocate::copy`, reporting only keys whose destination was `Missing` (so a second run applies nothing); `move-under-private` -> create-only install into `private/` (an equal copy there is fine, a different one is `config-move-destination-differs`), then unlink of the source only if its revision is unchanged, under `global-config`. Confined session: `config-write-confined`. Unknown ids stay in `skipped`.
- `MachineFacts` and `Destination` deleted (their only caller was the golden runner). `check` calls `machine::modes`, new `machine::unready` (`private-missing`, `token-missing`, `token-invalid <reason>`, `unreadable`) and new `relocate::classify` (the existing `plan` pipeline over any config file's JSON). `doctor::strays` is `pub(crate)` so the check and the repair share one scan.
- Fixture `doctor.v1.json`: the runner now lays out a healthy machine (0600 files, 0700 `private/`, a token) and a case opts out with `machine: "bare"` or states file modes with `modes`; repair cases gained `absent` and `modes` expectations. New cases: destination differs, YAML global with a pool (no fix), token missing, wide token, chmod, create-machine-files, copy, move-under-private (and refusal), confined refusal, unknown id.

## Sizes (lines, `wc -l`)

| Module | Lines | Cap / note |
|---|---|---|
| `doctor.rs` | 398 | cap 400 (was 509 with repairs) |
| `repair.rs` (new) | 233 | no cap; 108 of them are the old `fix` code moved, the rest is the four machine repairs |
| `machine.rs` | 274 | +11 (`unready`), -25 (`hold_global`) net vs the 263 reported |
| `locks.rs` | 47 | +30 (the one `hold`) |
| `relocate.rs` | 381 | +16 (`classify` split out of `plan`) |
| `write.rs` | 432 -> 410 | -22 |
| `cache.rs` | 51 | +4 |
| `snapshot.rs` | 439 | +0 net (`token_revision`) |

Slice total since `aeb11845d`: `git diff --stat aeb11845d HEAD -- 'packages/**/src/*.rs' 'src/**/*.mjs'` = 113 files, 7,109 insertions / 7,213 deletions (includes everything merged from origin/main, not the slice alone). The slice's own Rust: config crate `git diff --numstat aeb11845d HEAD -- packages/config/rust/src` = 2,104 added / 65 removed (was 1,937 before these items, +167). The earlier phase-08 measure of 2,181 added across the slice becomes about 2,348 now: below the 3,300 ceiling, 950 lines of room for phases 09-17. Tests added are in test files and fixtures, not counted.

## Deviations and findings

1. Items 1 and 2 are one commit: the moved code and the new repairs share the new file and the `check` signature change; splitting would have needed an intermediate state that does not compile.
2. The coordinator said the cache key misses the token file and the accounts file. The accounts file was already keyed (it is one of the hashed sources when the class is unconfined); only the token file was missing. No accounts change made.
3. `copy-to-destination` is now offered only for the legacy global JSON file (`relocate` reads only that file, and a copy of a YAML global key cannot be done by it). The previous code offered it for the YAML global and never for JSON, which was backwards. A hand-written YAML global holding a pool gets the row (fail when the destination lacks the key) and no repair; recorded in the contract row text and a fixture case.
4. On the tier cell: the schema keeps `properties` (and `items`) beside `oneOf` on the cell, because the path resolver walks `properties`/`items` only; without them `...nano.model` would be an unknown key. `additionalProperties: false` sits on `tierEntry` next to its `properties` (inside a oneOf branch it would reject every key). `tierCell` is used only by `modelPolicies`; no other cell of this shape exists in the schemas.
5. `config-machine-files` now fires on any machine with no token (the spec row), so a project-only machine reports a fail until `create-machine-files` runs; phase 12's registration should treat it as the spec says.

## Unresolved

- Whether a YAML global file holding a pool should get a copy repair (needs `relocate::copy` to read `config.yaml`; `finish` would still need a YAML key removal). Left out: it is new behaviour, not asked for.
