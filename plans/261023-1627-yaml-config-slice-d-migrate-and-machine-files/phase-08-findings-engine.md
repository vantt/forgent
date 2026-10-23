# Phase 08: The findings engine (every section 11 doctor row, and the fixes)

Depends on 04, 05, 06, 07. Suggested executor: sonnet; independent sonnet review before landing (severity table, per-source isolation, no value in any finding). Cap: `doctor.rs` 400 lines.

## Context

Spec section 11 lists the doctor rows; section 7 says `fgos config check` fails on `config-doc-drift` where doctor only warns; section 9 says no finding echoes a value. The crate has the pieces (snapshot judge, `docs::scan`, `files::check_mode`, `machine::modes`, `relocate::plan`, migration backups). This phase assembles them into one function, `check`, that the verb (phase 09) and the door (phase 11) both call, and one function `fix` for the repairs. The Node side (phase 12) is a thin registration over this contract; it holds no row logic.

## Files it may touch

`src/doctor.rs`, `contracts/doctor-rows.v1.json`, `contracts/fixtures/doctor.v1.json`, `tests/golden_doctor.rs`, `contracts/fixtures/no-echo.v1.json` (cases appended: findings and the fix report for a file holding a secret-like value), `contracts/fixtures/failure-matrix.v1.json` (no new ids; rows for the ones produced here).

## The contract file `doctor-rows.v1.json` (D19, one source for Rust and Node)

One entry per row: `id`, `description`, `doctor` severity (`fail | warn`), `check` severity (`config check`: `fail | warn`), `fix` (an id from the fix list or `null`), `needsAcknowledgement` (true for `config-redundant-value` when the value carries a note, YAML Document `comment-would-be-lost`). Rows: `config-parse`, `config-schema`, `config-legacy-shadowed`, `config-format-legacy-json` (doctor warn until Slice C), `config-doc-drift` (doctor warn, check fail, fix `refresh-docs`), `config-comment-missing-doc` (fix `render-docs`, the same operation), `config-comment-missing-why` (warn, no fix), `config-comment-migrated-why` (warn, no fix), `config-unknown-key` (warn), `config-redundant-value` (warn, fix `remove-redundant`), `config-key-in-wrong-file` (fail when the destination lacks the path or differs, warn when it holds an equal value; fix `copy-to-destination` for a global-file key whose destination lacks it, none otherwise; a key of that kind in a project file has no fix because the project file is untrusted, D14), `config-global-permissions` (fail, fix `chmod`), `config-secret-outside-private` (fail, fix `move-under-private`), `config-migrate-backup-stale` (warn, no fix), plus the machine-files row the Node `gateway-token-configured` maps onto: `config-machine-files` (fail when `private/` or the token file is missing or invalid, fix `create-machine-files`). Descriptions in English; the contract is read by Node (a JSON import) so the two sides cannot drift.

## Design (reuse first)

- `check(ctx, roots, class, today: impl Fn(&Path) -> Option<SystemTime> /* mtime of a backup, via std */) -> Vec<Finding>`; `Finding { row, severity (per consumer), file, line, column, path, fix: Option<FixId>, detail: keyword|None }`. **Per source** (D20): project, global, accounts, token, private directory, backup directories, `~/.fgos` direct children are each evaluated on their own, so a broken project file does not hide global findings.
- Row sources: parse and `strict-config` refusals -> `config-parse`; both formats present -> `config-legacy-shadowed` (existing `select_source` refusal); legacy JSON source -> `config-format-legacy-json`; per-file scope and placement refusals and the merged-value validation (`snapshot::build`, over the sources that parsed) -> `config-schema` (findings keep the refusal's own id as `detail`: `config-key-out-of-scope`, schema keyword); `docs::scan` per YAML file -> the two doc rows; leaves without a `why` in a YAML file -> `config-comment-missing-why`; a `why` reason starting with the migrate tag -> `config-comment-migrated-why`; paths with no schema node (`Origin.described == false`, `snapshot.rs:56`) -> `config-unknown-key`; a leaf equal to the standard -> `config-redundant-value`; accounts or token keys in a config file -> `config-key-in-wrong-file` (state from `relocate::plan`: destination equal, absent, or different); `machine::modes` -> `config-global-permissions`; regular files directly under `~/.fgos` (not directories, size <= the strict-config bound) that hold an account pool or a token (parsed as JSON or YAML, best effort, never printed) -> `config-secret-outside-private`; backups under the two `config-migrate` directories older than 30 days by mtime -> `config-migrate-backup-stale`; token and `private/` -> `config-machine-files`.
- `fix(ctx, roots, writer, ids) -> FixReport`: `refresh-docs` (phase 06 `Edit::Docs`, one transaction per file), `remove-redundant` (`Edit::Unset`, acknowledged when the finding says a note would be lost, reason generated: `[doctor:fix] equal to the standard`), `chmod` (`machine::fix_modes`), `move-under-private` (create-only install into `private/`, then unlink the source; destination first), `create-machine-files` (`machine::token::ensure`), `copy-to-destination` (phase 05 stage 1 only; it never removes a source key, because a key held in both files with equal values looks the same after an interrupted move and after a finished stage 1, so removal always needs `fgos config migrate --global --finish --machine-checked`; the row's text says so). Each fix returns what it changed by path and file, never a value.
- Confined sessions: `check` runs; the accounts findings say `unavailable-confined`; `fix` refuses with `config-write-confined`.

## Steps

1. Merge `origin/main`. Write `doctor-rows.v1.json` first, then fixtures (`doctor.v1.json`, about 40 cases, inline files): one case per row with a firing and a non-firing file; severity per consumer; per-source isolation (broken project, healthy global: global rows still report); legacy JSON project reports only the legacy row plus parse and schema rows, no doc rows; a stage-1 copy (and an interrupted move, which looks the same) reports the wrong-file row as warn with no fix and the text names the finishing verb; a global-file key with no destination offers `copy-to-destination`; a project-file key has no fix; stray backup file with an account pool detected; a `config.json.bak-*` with only unrelated content ignored; modes 0644 on each of the four paths; stale backup by mtime (set with the standard library in the test); `fix` for each id idempotent (second run changes nothing); `remove-redundant` with a note needs the acknowledgement; no-echo: findings and fix reports for a file holding a password-looking value contain none of its bytes.
2. Implement `check` row by row, then `fix`. Keep each row a small function over the existing helpers; if a row needs a new parser, stop: the helper belongs in the owning module.
3. **Sweep before the rows are registered (phase 12 depends on this output):** run `check` read-only over the config files the phase 00 sweep listed (this repository, forgentX, mdview, mcp-skill-hub, and the owner's global file); record per file the failing rows by id and path (no values). Any `config-schema` failure on a real project that the schema owner has not accepted is reported to the owner as a decision question (options: loosen the schema, fix the file, or make the row a warning for legacy JSON) before phase 12 registers fail-severity rows.
4. `tests/golden_doctor.rs`, clippy, fmt, source total (cap 400).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Each row's firing rule, severity per consumer, fix idempotence, per-source isolation, no echo | `tests/golden_doctor.rs` over `doctor.v1.json` |

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Rows fail on every legacy project the day they register | M x M | the sweep above; legacy rows warn (D19); the owner decides any failing real file before registration |
| A fix deletes content | L x H | every fix is a transaction or create-only install with revision compare; remove fixes need the acknowledgement for notes; stage-2 removal only in the equal, marked case |
| The `~/.fgos` scan reads a large or hostile file | L x M | regular files only, size bound, parsed under the strict-config limits, results are paths |
| Severity drift between Rust and Node | L x M | Node reads the contract; phase 12's test asserts the mapping, not the logic |

## Rollback

Revert: new files only; nothing registers the rows until phase 12.
