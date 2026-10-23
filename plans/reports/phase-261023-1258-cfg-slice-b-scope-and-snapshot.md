# Phase report: scope rules and snapshot (Config Slice B, phases 06 and 09)

Branch `cfg/slice-b`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-b`. Two commits: scope (`33dbcba37`) and snapshot (next on the branch). `origin/main` merged at start (one conflict, the board `log.md`, resolved by keeping both sides newest first) and at the end (clean).

## Gates

`free -g` first (20 GB available). `cargo test -p fgos-config --jobs 4` all green (scope 2 tests / 27 cases, snapshot 2 tests / 35 cases, cache 4 tests), clippy `--all-targets -D warnings` clean, `cargo fmt --check` clean. No `cargo test --workspace`, no `npm test`. Impact analysis inactive; callers checked with `rg`: `Schemas::resolve` (lint.rs, golden_schema.rs), `Standard::value_at` (lint.rs, golden_standard.rs), `ConfigRefusal` fields (grammar.rs builds it with `..`; the removed `schema_path` field had no reader). The crate has no consumer outside itself yet.

## Line counts against the caps (comments and blanks included)

| Module | Lines | Cap | Over |
|---|---|---|---|
| `scope.rs` | 102 | 150 | under by 48 |
| `snapshot.rs` | 445 | 250 | **+195** |
| `cache.rs` | 47 | 50 | under by 3 |
| `detect.rs` | 66 | 40 | **+26** |
| crate `src` total | **1,923** | 2,000 | 77 left |

Left to write: `write.rs` (cap 200) and `redact.rs` (cap 80), 280 lines against 77 left. The 2,000 ceiling will be passed by about 200 lines even if those two meet their caps. Supporting edits outside the caps: `schema.rs` +17 (`enter`, `locate`, `json_at`; `resolve` now 3 lines), `error.rs` +24 (see below), `standard.rs` -4.

Why `snapshot.rs` is 445: the spec behaviour listed in the phase is all there and none was trimmed. Roughly: public types with their doc lines 95, source reading beneath roots 50, trusted-root command substitution (`command_tops`, `put`, `trusted_project`) 65, provenance 25, per-source parse and judge 35, `build` (layers, detected, merge, origins, validation attributed to file/line/column, revisions) 130, rustfmt expansion of the rest. I stopped at green and did not move code into another module to meet the cap, since that would only hide lines. Options for the owner: raise the `snapshot.rs` cap to 450 and cut something else (the command substitution, 65 lines, is the one separable block and could live in its own module `trusted.rs`, still counted), or accept 2,200 for the crate. `detect.rs` is the trait (12 lines), `NoDetectors` (8) and the schema walk that lists `x-fgos-absent: detected` paths (40).

## What landed

**Scope (`src/scope.rs`, `contracts/fixtures/scope.v1.json`, `tests/golden_scope.rs`)**
- `judge(&Schemas, SourceKind::{Project, Global, Accounts}, &Value, Option<&Document>) -> Vec<ConfigRefusal>`; `Token` is a role name only (never parsed), so it is not a variant. Every present path is walked as `Segment`s (never dotted strings; `bin["a.b"]` fixture).
- Rules: file placement first (`config-key-in-wrong-file`, `belongs_in` accounts or token or config); `global-only` in project and `project-only` in global (`config-key-out-of-scope`, `belongs_in` the role `global` or `project`, never a path); ancestors: a project value at a strict ancestor of a `global-only` schema path (found through `properties`, `additionalProperties` and `items`, `$ref` followed, depth bound 12) is refused unless it is a mapping that deep-merges, so `null`, scalar, list and `replace` or `leaf` mappings are refused at the ancestor and a deep mapping is refused at the global-only descendant. A non-empty mapping with a scope refusal is refused on its entries so the line points at what the person wrote; `gateway: {}` and `gateway: null` are refused at `gateway`. Undescribed keys are kept.
- 27 fixture cases, each listing the refusals per source as [code, path, belongs_in, line, column]; plus a test that a refusal names the `global` role and contains no value and no `/`.
- One door: `Schemas::locate` (new, `schema.rs`) returns the node and its inherited annotations; `resolve` is now `locate` plus `Resolved::of`; `enter` follows a `$ref` chain and takes its annotations in. `detect.rs` and `scope.rs` use them.
- `ConfigRefusal` boxed once, as the coordinator note asked: new `Detail { keyword, schema_path, belongs_in, layers }` behind `detail: Option<Box<Detail>>` (the old unused `schema_path` field moved into it). Adding `belongs_in` had tripped `clippy::result_large_err`; no module carries an allow.

**Snapshot (`src/snapshot.rs`, `src/cache.rs`, `src/detect.rs`, `contracts/fixtures/snapshot.v1.json`, `tests/golden_snapshot.rs`, `tests/cache.rs`)**
- API: `snapshot(&Context, &SnapshotRequest) -> Result<Snapshot, SnapshotError>`; `Context { schemas, standard, digest, detectors }`; `SnapshotRequest { project_root, trusted_root, global_dir, class }`; `SessionClass { Confined, Unconfined }` lives in `snapshot.rs` (the write phase imports it); `SnapshotError { Refused(Vec<ConfigRefusal>), Io }`. `Snapshot { value, origins: Vec<Origin { path, provenance, described }>, revisions, accounts }`, `require_accounts()` refuses a confined snapshot with `config-accounts-unavailable-confined`.
- Sources opened once beneath their roots through phase 07 (`select_source`, `read_beneath`); the global directory is opened as its parent plus its name so a symlinked `~/.fgos` is refused. Document names carry the role (`project:config.yaml`, `global:config.yaml`, `accounts:accounts.yaml`, `project@trusted:config.yaml`). Parse and scope refusals of all sources are listed together and end the snapshot before merge (so no cascade of false schema errors); merge and validation run only on a clean set.
- Merge is `fgos_yaml_doc::merge` with rules from `schemas.resolve(path).merge`; no second merge. Standard layer from `Standard` (file, line, column kept); detected layer only for named `x-fgos-absent: detected` properties that no file and not the standard sets; accounts layer only when unconfined.
- Trusted root: for every topmost `command` path of the project value and of the trusted file (cut at the first list index so a list comes whole from one file), the project layer takes the trusted file's subtree or loses it. Provenance role `project@trusted`, with the trusted file's line and column. Equal roots: nothing replaced.
- Validation runs once on the merged value; each violation (undescribed paths excluded) is attributed to the deepest path some layer wrote, with that layer's file, line and column, keyword and schema path, never a value. A merge that cannot combine two layers is `config-schema` with keyword `merge-type-mismatch` and `detail.layers` naming the layers that hold the path (built from the paths, not parsed from the primitive's text).
- Cache: `snapshot_cached(&mut SnapshotCache, &Context, &SnapshotRequest) -> Result<&Snapshot, SnapshotError>`; `SnapshotCache.stats` (`hits`, `misses`) is the public counter. One open, read and hash per source per call; key is request, bundle digest and (size, sha256) per source; a snapshot with a detected value is stored unkeyed so it is never reused; refused reads are not cached.
- Tests: 35 golden cases (ladder per key, per-entry map merge, replace, null wins / absent falls through / null switches off a standard entry, list leaves, wrong type, deep type mismatch naming both layers, undescribed flagged, detected rules, global-only refusals, six trusted-root cases including deleted and added command keys, accounts layer, confined, missing files, malformed global with no value in the error, both files, tombstone, legacy JSON, `__proto__`, all errors listed, wildcard merge rules at three depths with a literal key) and a comment-only edit test (revision equals the sha256 of the bytes and changes, value does not). Cache: 4 tests on real files (reuse, same size and same mtime with different bytes misses, digest, class and root key, detected bypass, refused read not cached).

## Deviations and choices to review

1. `snapshot.rs` and `detect.rs` pass their caps (above); nothing was trimmed.
2. A project value on a descendant of a global-only section that the schema does not describe is kept (undescribed rule); phase 12 must describe `gateway.*`, `secrets.*` and `bin.*` fully, as its test already requires.
3. A list or a scalar the project writes over a map is not a merge mismatch: the primitive takes a non-mapping top layer whole (leaf) and the schema reports the wrong type at that path (fixture `a-list-over-a-map-is-a-type-error`). `merge-type-mismatch` appears only on `deep` paths; both are fixtures.
4. A command top found under a list is cut at the list, so the whole list comes from the trusted file (stricter than per element).
5. The accounts file is not judged for `project@trusted` and the trusted file is not judged at all (only its command subtrees are used); it is parsed, so a malformed trusted file fails the snapshot.
6. Failure-codes list unchanged (no new id). The per-source Windows case returns `config-platform-unsupported` through phase 07.

## Unresolved questions

1. Cap: raise `snapshot.rs` to about 450, or split `trusted.rs` out, or accept the crate near 2,200? `write.rs` and `redact.rs` are still to come.
2. `SessionClass` is defined in `snapshot.rs`; should it sit in a lower leaf (`files.rs`) before the write phase imports it?
