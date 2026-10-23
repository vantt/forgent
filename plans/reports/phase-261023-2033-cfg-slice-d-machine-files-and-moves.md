# Config Slice D, machine files and key moves (work complete, held back on the module caps)

Worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-d`. Finished and verified work sits on branch **`cfg/slice-d-machine-moves-pending`** (commit `0f343fdc5`, parent `1598a2d15`, one commit, not on `cfg/slice-d`). It was held back because three module caps are passed (plan: "a phase that would pass its cap stops and reports instead of landing"). Nothing pushed or merged. Only this report is committed on `cfg/slice-d`.

## Decision question (module caps)

**What is happening.** Both phases are implemented, tested and clean (clippy `-D warnings`, fmt, `cargo test -p fgos-config` 25 binaries green, durable-file green), but the code is bigger than the caps.

| Module | Cap | Actual | Over |
|---|---|---|---|
| `machine.rs` (04) | 190 | 263 | +73 |
| `relocate.rs` (05) | 280 | 365 | +85 |
| `snapshot.rs` delta (04 helper extraction + 05 rule) | 30 | +68 net (about +51 for the held-copy rule, +17 for one shared `accounts_source`/`split_global`) | +38 |

Counted set 4,506 -> 5,200 (+694). The slice ceiling is 2,900; this pair adds +694 against caps that sum to 500 (190 + 280 + 30): +194 over the three caps, which eats about two thirds of the 290-line slack between the cap sum (2,610) and the ceiling (2,900) before phases 06-14 start.

**Cause.** The base estimate (100 and 150 lines x 1.8) left out parts the plan itself requires: the token reader with its four refusal reasons, the `Secret` type, the global-config lock helper (the same 18 lines `write.rs` has inline), the descriptor-based mode sweep for four paths, the accounts-only read, and in 05 the plan/copy/verify/finish/backup/identity-recheck pipeline plus the JSON key remover. I measured by compacting (dropped a separate `Ensured` enum, merged `ensure` and `install`, shared the lock helper): 293 -> 263 for `machine.rs`; no further cut keeps requested behaviour. rustfmt at width 100 accounts for about 40 lines of the overage.

**Options.**
1. Raise the three caps to the measured numbers (machine 265, relocate 365, snapshot +70) and keep the 2,900 ceiling. Cost: slack left for phases 06-14 drops from 290 to about 96 lines; if they run at the same 1.4x, the ceiling is reached around phase 10. Gain: land now, zero rework.
2. Raise these caps and also raise the ceiling by 150 (3,050). Cost: one more budget line in the approved frame; gain: later phases keep their slack.
3. Cut behaviour to fit (drop `modes`/`fix_modes`, or the confinement of `accounts::read`, or the `plan` read). Cost: the plan asked for each; doctor (08) and verbs (10) need them, so they come back later as rework and the cap just moves. Not recommended.
4. Move the lock helper and the JSON key remover into shared leaf modules (`locks.rs`, `schema.rs`) so the caps count them there: about -40 lines in 04/05 but +40 elsewhere; no real saving, only touches files other phases own.

**Recommendation.** Option 2: the numbers are real, behaviour is fully proven, and cutting only defers the lines to phases 08 and 10. Fold the `write.rs` lock duplicate into the shared helper after phase 06 lands (about -18 lines) to win some back.

**Scope of the answer.** A yes authorizes merging `cfg/slice-d-machine-moves-pending` into `cfg/slice-d` (disjoint from the report commit; `git merge cfg/slice-d-machine-moves-pending`) and the new caps/ceiling for phases 04 and 05 only. It does not change the caps of any other phase and does not authorize landing on main.

## What was built (all in the pending commit)

**04 machine files** (`src/machine.rs`, `tests/machine_files.rs` over `machine-files.v1.json`, 28 cases)
- `ensure_private_dir` (0700 when created, an existing mode kept and reported, symlinked `~/.fgos` or `private` refused `config-path-symlink`).
- `token::read` (`Ok(None)` when absent; symlink or non-regular, mode wider than 0600, anything but one line of printable ASCII without space, 1..512 chars: `config-token-invalid` with reason `symlink|mode|shape`, never a byte), `Secret` (no `Display`, `Debug` redacted), `token::ensure` (create-only, 0600 at creation, global-config lock, directory identity recheck, never rotates), `token::generate` (32 bytes of `/dev/urandom` as hex; non-Unix: `config-platform-unsupported`).
- `accounts::read`: `build` over the accounts source alone, merged over the standard and validated; works beside broken project/global files; confined session: `unavailable-confined` without opening the file; missing file: `present: false`; one case compares the subtree to a full snapshot's.
- `modes` / `fix_modes`: the four paths of spec section 9 (global config.yaml/json, `private`, accounts, token), each opened no-follow, chmod through the descriptor.
- `config-token-invalid` appended to `failure-codes.v1.json`.

**05 key moves** (`src/relocate.rs`, `tests/relocate.rs` over `relocate.v1.json`, 26 cases; 3 cases appended to `snapshot.v1.json`)
- `plan` (names, entry counts, destination state; no value), `copy` (stage 1: token create-only, accounts through `commit_observed` with the `[migrate]` reason per leaf, destination re-read and compared in Canonical JSON; source untouched; destination differing refuses before any write), `finish` (stage 2: refuses without `machine_checked`, re-verifies, backs up create-only 0600 in `private/config-migrate/<rev16>-config.json`, rewrites with `to_string_pretty` plus newline under the lock after a revision and directory-identity recheck; reports `reformatted`). Both take the observer as a parameter (`DestinationWritten`, `DestinationVerified`, `SourceBackedUp`, `SourceRewritten`); crash windows are proven with it, no test switch.
- Snapshot rule: a global-file key whose path the accounts file or token file holds, or that holds nothing (null, `{}`, `[]`), is dropped before judging and merging; `Snapshot.notices` carries `shadowed-by-destination` with the path. No destination and a real value: refused as before (case re-run).
- `config-machine-check-required`, `config-move-destination-differs` appended to `failure-codes.v1.json`.

**Durable File** (`packages/durable-file/rust`): `Dir::mode`, `Dir::set_mode`, `OpenedFile::set_mode`, `open_dir_beneath` (no-create, no-follow) plus one test; needed so a mode is never changed by path.

## Deviations from the phase text (each small, all decided in favour of the plan's intent)

1. **Files outside the ownership rows**: `packages/config/rust/Cargo.toml` (`serde_json` `preserve_order` moved into `[dependencies]`; needed because the golden proved `Map::remove` reorders keys and `shift_remove` exists only with the feature, so the "key order kept" rule cannot rest on dev-dependency unification); `packages/durable-file/rust` (above); `tests/common/machine_fs.rs` (new shared test helper so the lock-holding child and the file layout exist once for both runners). `snapshot.rs` also gained `split_global`/`accounts_source` (shared by the accounts-only read and `read_sources`) and `token_exists`.
2. **API shapes**: `token::read` returns `Result<Option<Secret>, SnapshotError>` (the plan said `Secret`/`ConfigRefusal`; absent must be distinguishable and an I/O error has no refusal id). `token::ensure(global_dir, lock_root, wait, text_closure)` plus `token::generate()` replace `ensure(random: FnOnce() -> [u8; 32])`; it returns Durable File's `Installed` instead of a new enum. `accounts::read(ctx, req)` takes the class from `req`. `finish` takes no writer (it writes no YAML). `copy`/`finish` take the observer directly instead of a `*_observed` twin.
3. **No-echo fixture**: `no-echo.v1.json` was not appended. Its runner (`golden_no_echo.rs`, not owned) has no kind that can reach a token error; the token no-echo sentinels live in `machine-files.v1.json` and `relocate.v1.json` cases and `check_refusal` asserts them for every refusal. Failure-matrix coverage comes from the fixture `expect.code`s, so no matrix row was needed.
4. **Fixtures README** rows for the two new files were not added (not owned; one table row each, for the docs phase).
5. **D8 extension**: a key holding nothing is treated as held. Without it the accounts commit's own validation would refuse a copy whenever the global file still carries a null token or an empty pool.

## Verification

- `cargo test -p fgos-config --jobs 4`: 25 test binaries, all ok (new: `machine_files` 28 cases, `relocate` 26 cases, 3 snapshot cases through the unchanged `golden_snapshot`; `failure_matrix` and `fixture_shape` pass with the three new ids). `cargo test -p fgos-durable-file`: ok.
- `cargo clippy -p fgos-config -p fgos-durable-file --all-targets -- -D warnings` and `-p fgos-config --features host-provider`: clean. `cargo fmt --check`: clean.
- Mutation spot checks: changing an expected backup count, an expected stage result and an expected after-fix finding list each failed the named case.
- The relocate golden caught a real defect during the work: removing a key with `Map::remove` reordered the remaining keys; fixed with `shift_remove` (the byte-for-byte case now owns it).
- Fixture homes only (`std::env::temp_dir()`), never the real `~/.fgos`. No `npm test`, no `cargo test --workspace`. Impact analysis inactive; callers of the touched snapshot symbols were checked with `rg` (`load_sources`/`build` have no other caller; the one `Snapshot {` constructor is `build`).

## Concerns for later phases

- **Cache key** (`cache.rs`): the token file is not one of the hashed sources, so a cached success can outlive a token file that appears or disappears (the held-copy rule reads it). Fix is one more hashed source in the cache key; it belongs to whoever owns `cache.rs` before Slice C relies on the cache.
- **Confined sessions between stage 1 and stage 2**: a confined snapshot cannot read the accounts or token file, so it still refuses the global file's keys until stage 2 removes them (same as today's behaviour for any key without a visible destination). Not triggered yet (no Node reader uses this snapshot); Slice C should decide whether a confined read drops those keys with a notice.
- `hold_global`/`conflict` in `machine.rs` duplicate the lock block inline in `write.rs`; fold `write.rs` onto `hold_global` after phase 06.
- The reason text `[migrate] carried over from ~/.fgos/config.json, reason never recorded` is a constant in `relocate.rs` until phase 07 puts the `[migrate]` tag in `comment-grammar.v1.json`; `config-comment-migrated-why` then keys on it.
- `finish` returns `reformatted` after the write (the backup exists); the verb layer (phase 10) should dry-run through `plan` and tell the owner before `--finish` if the file is not two-space.
- Non-Unix builds: `machine.rs` and `relocate.rs` gate their file code with `cfg(unix)` (relocate whole-module, as `write.rs`); not compiled on a non-Unix target here.

Status: NEEDS_CONTEXT (cap decision above; the code itself is complete and green)
