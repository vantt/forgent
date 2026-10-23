# Phase 07: Project migration (`fgos config migrate`, the crate side)

Depends on 06 (the extracted `produce` and `snapshot_with`). Suggested executor: sonnet; opus only after a failed sonnet attempt; independent sonnet review before landing (equivalence, tombstone, resume). Cap: `migrate.rs` 420 lines.

## Context

Spec section 13: back up `config.json`, convert to YAML with generated `@fgos:doc` lines and `@fgos:why [migrate] ... never recorded` on every value kept, drop values equal to the standard (list them; stop on global-file machine overrides without `--accept-machine-overrides`), prove effective-value equivalence through Canonical JSON, turn `$comment` into doc lines, keep unknown sections, replace the JSON with the tombstone text, back up under `.fgos/runtime/config-migrate/`. A mismatch aborts instead of repairing (G3). This repository's project file is the first real input: it holds `gateway` (port equal to the standard, `token: null`), the dead `lock.predecessorKillWaitMs` (removed by `a620881e7`) and `runner.$comment` (the tier ladder, landed by `37ab5c0fc`); it is 1,557 lines, `runner.capabilities` 42 entries.

## Files it may touch

`src/migrate.rs`, `contracts/migration.v1.json`, `contracts/comment-grammar.v1.json` (one line: `migrated-source-tag`), `tests/golden_migrate.rs`, `tests/migrate_files.rs`, `contracts/fixtures/migrate.v1.json`, `contracts/fixtures/real-project-config.copy.json` (a pinned copy of this repository's file with its sha256 and commit, like `authoring-source.config.json`), `contracts/failure-codes.v1.json` (append `config-migrate-equivalence-failed`, `config-migrate-machine-overrides-pending`, `config-migrate-source-invalid`) and failure-matrix rows, `test/config/tombstone-older-reader.test.mjs`.

## Design (reuse first; decisions D11-D17)

`migrate::project(ctx, roots, writer, opts{accept_machine_overrides, dry_run}, observe) -> Report`:

1. **Read.** `select_source` on `.fgos` (`files.rs:121`): must be `LegacyJson` (an exact tombstone is "already migrated", exit 0; `config.yaml` present and the JSON legacy is the resume case below). Parse as `strict-config`; any parse refusal aborts (`config-migrate-source-invalid`, file/line/column).
2. **Classify every leaf** (the JSON value walked to scalars, lists and empty containers; lists and scalars are leaves, maps descend):
   - retired path from `migration.v1.json` (first entry `lock.predecessorKillWaitMs`; a map left empty is pruned) -> `dropped_retired`;
   - `$comment` key -> `doc-converted` (D15: text equal to the render is dropped; other text is emitted as `#` notes above the parent key via `set_comment_block`, never an `@fgos:` line);
   - path on or above a `global-only` node (`scope::judge`): value equal to the standard or `null` -> `dropped_out_of_scope`; any other value aborts naming the path (D14);
   - key whose `x-fgos-file` is `accounts` or `token` -> abort `config-key-in-wrong-file`, naming the file it belongs in (D14);
   - value equal to the standard on that path -> `dropped_redundant` (this is `produce`'s own `redundant-noop` notice, not a second rule);
   - unknown section or key (no schema node) -> kept, `unknown_kept` (spec: "Unknown sections are kept").
3. **Machine overrides.** For each `dropped_redundant` path, if the real global layer (snapshot of the global file, same file both sides) holds a different value there, list it in `machine_overrides`; without `accept_machine_overrides` the run stops with `config-migrate-machine-overrides-pending` and the list (paths only). With the flag the equivalence check below must differ on exactly those paths and nowhere else.
4. **Produce.** Build one `Vec<Edit::Set>` for the kept leaves in file order and call the extracted `write::produce` with `base = None`: the same comment blocks as a door (`doc` then `why`), reason `[migrate] carried over from config.json, reason never recorded` (tag from the grammar contract, D12; the actor is the writer id). New file header comes from `header_lines`.
5. **Equivalence.** `snapshot_with(ctx, roots, "project", bytes)` for the new YAML and for the JSON after the exclusions of step 2 (re-serialized into the same source slot), both over the same global file; compare `fgos_canonical_json::canonical_json` of the two `Snapshot.value`; the set of differing leaf paths must equal `machine_overrides` (empty without the flag), else `config-migrate-equivalence-failed` listing the paths. The snapshot's own validation (scope, placement, schemas) runs inside, so an invalid project file aborts instead of being repaired.
6. **Write** (skipped by `dry_run`, which prints the same report): take `project-config` once (`LockScope`, Wait bound D13); backup of the JSON bytes to `.fgos/runtime/config-migrate/<rev16>-config.json` (`ensure_dir_beneath` 0700, `install_once_with_mode` 0600; an existing identical backup is fine, D16); `install_once_with_mode(".fgos", "config.yaml", bytes, 0o644)` (create-only; a racing creation is a conflict); re-open the JSON beneath and compare its revision with the one read in step 1 (second check, `config-write-conflict` on change); `replace_durably_with_mode(".fgos", "config.json", TOMBSTONE, existing_mode)`; release. Observer steps: `BackupWritten`, `YamlCreated`, `SecondCheck`, `TombstoneWritten`.
7. **Resume (D11).** `config.yaml` present and `config.json` legacy: recompute steps 1-5 against the existing YAML as the "new" side; if the equivalence check passes, write only the tombstone and report `resumed`; otherwise stay refused with `config-legacy-shadowed`.
8. **Report** (`MigrationReport`): counts and path lists for kept, dropped_redundant, dropped_retired, dropped_out_of_scope, doc_converted, unknown_kept, machine_overrides, the backup path, `resumed`, `dry_run`. Paths only; the no-echo suite covers it.

## Steps

1. Merge `origin/main`; `impact` on `produce`/`snapshot_with`; write `migration.v1.json` and the tag line.
2. Fixtures first (`migrate.v1.json`, about 34 cases, inline JSON before and expected YAML after): each classification above; `$comment` equal to render dropped and foreign text kept as a note; global-only value other than standard aborts; accounts key aborts; machine override without and with the flag (the check differs on exactly those paths); unknown section kept with its `why`; equivalence failure when a fixture's schema rejects a value (aborts, nothing written); empty maps and lists; `null` allowed by the map; ordering of leaves; idempotent re-run on a tombstone; two writers (second gets conflict); resume after a crash at `YamlCreated`; crash at `BackupWritten` leaves the JSON untouched.
3. The real-file rehearsal: the pinned copy of this repository's file; expected report pinned (counts, the `gateway`/`lock` drops, `runner.$comment` converted, no `machine_overrides` against an empty global); the migrated YAML passes the Slice B snapshot with no refusal; the YAML's line count is recorded (the standard carries the catalog, so the file shrinks from 1,557 lines to the project's own differences).
4. `tests/migrate_files.rs` (real fs temp project: backup is 0600 in a 0700 directory, tombstone exact text and mode kept, `config.yaml` 0644, symlinked `.fgos` refused, concurrent run).
5. `test/config/tombstone-older-reader.test.mjs` (about 30 lines): create a project whose `config.json` holds the tombstone text, run today's `readSharedConfig` and the runner config loader on it, assert both throw a parse error naming the file and that no `config.json` is rewritten and no `config.yaml` is created (acceptance 17; today's Node reader is the "older release").
6. clippy, fmt, source total (cap 420).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Classification, drops, notes, equivalence, overrides flag, report | `tests/golden_migrate.rs` over `migrate.v1.json` and the real-file copy |
| Backup, tombstone, modes, lock, crash and resume, concurrency | `tests/migrate_files.rs` |
| An older reader refuses the tombstone and writes nothing | `tombstone-older-reader.test.mjs` |

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The equivalence check passes a wrong YAML (it compares two values the same function produced) | M x H | the old side is the JSON itself after listed exclusions and the new side is parsed from the produced bytes; a golden case with a deliberately corrupted produced value must fail; the real-file copy is checked by hand once against the expected list |
| Another project's stale seed differs from the standard in many places | M x M | each difference is kept as a leaf with `[migrate]`; the report counts them; nothing is dropped except equal values |
| Tombstone lands while Node still reads JSON (this repository) | H x H | the crate never runs it by itself; G-D1 and phase 16 keep the live run for Slice C |
| Backup leaks a secret | L x M | the project file holds none by D14; the global backup is under `private/` at 0600 (phase 05) |
| Resume accepts a hand-edited YAML | L x M | it must pass the full equivalence check against the JSON |

## Rollback

Revert: new files, one tag line, appended ids. A project already migrated by a run is restored from its backup (the report prints the command: copy the backup over `.fgos/config.json`, delete `.fgos/config.yaml`); nothing in D runs it on a real project before phase 16.
