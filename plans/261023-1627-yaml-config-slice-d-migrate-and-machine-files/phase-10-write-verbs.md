# Phase 10: Native verbs, write side (`set`, `unset`, `patch`, `migrate`, `refresh-docs`)

Depends on 09, 05, 06, 07 (and 03 for the class). Suggested executor: sonnet; independent sonnet review of the refusal order before landing (the same checklist as Slice B phase 10).

## Context

Spec section 6: three doors write config; `fgos config set|unset|patch|migrate|refresh-docs` is the third. Every one is a one-source transaction (Slice B `commit_observed`, phases 05-07 here), refused for a confined session. The reason is required for every write that changes a value (`config-comment-reason-required`).

## Files it may touch

`src/provider.rs` (the `config.write` operation, appended), `apps/fgos/src/cli_projector.rs` (appended), `apps/fgos/tests/cli_tests.rs` (config write cases), `src/inspect.rs` (report text for write results, small).

## Design (D18, D9, D17)

- `set <path> <value> --reason <text> [--global]`, `unset <path> --reason <text> [--global]`: path in YAML Document's text form; `<value>` parsed as a YAML scalar or flow value under `strict-config` (so `true`, `3`, `[a, b]`, `null` work, a string needing quotes is quoted by the caller); the target file comes from the schema node (`x-fgos-file: accounts` -> accounts file; `x-fgos-scope: global-only` -> global; otherwise project, `--global` selects the global file for a `both` key; a `project-only` key with `--global` is refused by name); the expected revision is read from the open file immediately before the commit (a conflict still returns `config-write-conflict`).
- `patch <file> --reason <text> [--global]`: the file is a YAML or JSON list of `{set: <path>, value: <any>}` / `{unset: <path>}`; all edits go to one source in one transaction; the file is parsed under `strict-config` with the 1 MiB bound.
- `migrate [--dry-run] [--accept-machine-overrides]` (project, phase 07) and `migrate --global [--finish --machine-checked] [--dry-run]` (the key move, phase 05; no whole-file conversion, D24; without `--global` the verb never touches the machine files). Output is the report (paths and counts, never values).
- `refresh-docs [--global]`: `Edit::Docs` over the chosen file(s); no reason; a second run prints "nothing to do".
- **Writer and class.** Writer = `fgos_identity::resolve_current` (the host's existing path for `fgos identity`), class = `session_class(env)`; the actor in the file is the writer id, never typed (spec section 7). A confined class returns `config-write-confined` before any file is opened (Slice B's own order). `--acknowledge-comment-loss` is the explicit flag for `unset` of a key carrying a note (spec section 7).
- Redundant `set` prints the Slice B notice `redundant-noop` and exits 0; a reason of one generic word is refused (Slice B grammar).

## Steps

1. Merge `origin/main`; board line if `cli_projector.rs` changed upstream since phase 09.
2. Projector unit tests (each verb/flag; `--finish` requires `--global`; `--machine-checked` requires `--finish`; `--accept-machine-overrides` only with `migrate` without `--global`).
3. Provider: map each verb onto the crate call and the exit code (0 success or no-op, non-zero on refusal with the id).
4. `cli_tests.rs`, one case per family against a temp project and temp `HOME` (the identity cases show the harness): `set` then `show` round trip with `@fgos:why [actor] reason` in the file; `unset` with and without the acknowledgement; `patch`; confined marker set in the environment refuses (if G-D2 = A; otherwise the case is not written); `migrate --dry-run` on a legacy JSON project then `migrate` then the tombstone text in `config.json`; `migrate --global` copy then `--finish` refused without `--machine-checked`; `refresh-docs` twice.
5. `cargo test -p fgos --jobs 4`; clippy; fmt; line counts against the caps.

## Owning proofs

Behaviours are owned by the crate phases (05, 06, 07 and Slice B's transaction); this phase adds the projector's unit tests and one wiring case per family. It adds no second copy of any crate case.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A verb bypasses the transaction (a direct write) | L x H | no provider code opens a config file for writing; review checklist; `rg "File::create|fs::write" packages/config/rust/src/provider.rs` is empty |
| Wrong target file picked silently | M x M | the target is printed in the result; `--global` on a `project-only` key refuses; one projector test per scope value |
| The class marker is treated as a boundary | L x H | review item; comment in `provider.rs` points at the threat model in phase 03 |

## Rollback

Revert: the write operation and its projector arms go; read verbs remain.
