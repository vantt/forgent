# Phase 05: Moving account pools and the token out of the global JSON (two stages, destination first)

Depends on 04. Suggested executor: sonnet; opus only after a failed sonnet attempt; independent sonnet review before landing (crash windows and the JSON rewrite). Cap: `relocate.rs` 280 lines, `snapshot.rs` delta 30.

## Context

Spec section 13: the moves write and verify the destination first, then remove the key from the source; a crash between the two leaves the key in both, reported as `config-key-in-wrong-file`, and the destination wins. The moves land when no release on the machine still reads those keys from the global file, a fact about the machine. The plan's D9 splits the move into **stage 1 copy** (source kept; safe while older releases still read it) and **stage 2 remove** (needs the machine check). Slice B refuses a legacy-JSON write through the transaction (`current()`, `write.rs:101`) and refuses a wrong-file key in the global source (`scope.rs`), so two small things must exist: the JSON key remover (D10) and the snapshot's tolerance of a copy the destination already holds (D8).

## Files it may touch

`src/relocate.rs`, `src/snapshot.rs` (D8 only: in `load_sources`, a `config-key-in-wrong-file` refusal for a path the accounts layer or the token file already holds becomes a notice and the source copy is dropped from the merge), `tests/relocate.rs`, `contracts/fixtures/relocate.v1.json`, `contracts/fixtures/snapshot.v1.json` (three cases appended, with `tests/golden_snapshot.rs` unchanged), `contracts/failure-codes.v1.json` (append `config-machine-check-required`, `config-move-destination-differs`), the failure-matrix fixture rows for both.

## Design

- `plan(global_dir) -> MovePlan`: reads `~/.fgos/config.json` (legacy JSON, one open descriptor, revision), extracts `runner.llmAccounts` and every `runner.providers.<p>.accounts` (the paths come from the schema: all nodes with `x-fgos-file: accounts`, not a hard-coded list; the token path is the node with `x-fgos-file: token`), and the destination state. Output names pools, account counts and "token present"; no value.
- **Stage 1 `copy(ctx, roots, writer, observe)`**: (1) token: if `gateway-token` is absent, `token::ensure`-style create-only install of the source token (one line) under the `global-config` lock; if present and equal, nothing; if present and different, refuse `config-move-destination-differs` (names the file, never the value). (2) accounts: write `accounts.yaml` through the Slice B transaction (`commit_observed`, target `Accounts`, one `Set` per leaf path, reason `[migrate] carried over from ~/.fgos/config.json, reason never recorded`), which already creates the directory at 0700, the file at 0600, the comment blocks and the validation. An existing accounts file holding different data refuses `config-move-destination-differs`; equal data is a no-op. (3) verify: re-read the destination and compare Canonical JSON of the moved subtree with the source's. The source is not touched. The global JSON stays valid for older releases.
- **Stage 2 `finish(.., machine_checked: bool, ..)`**: refuse `config-machine-check-required` unless `machine_checked`; re-verify equality (stage 1's check again); back the global JSON up (`private/config-migrate/<rev16>-config.json`, create-only 0600, D16); remove the keys by a JSON rewrite: parse with `serde_json` (`preserve_order`), delete the paths (an object left empty by the removal stays), `to_string_pretty` plus a final newline, compare the revision of the open file once more, `replace_durably_with_mode(dir, "config.json", .., existing_mode)` under the `global-config` lock. Any inequality or revision change aborts with the file untouched.
- `relocate_observed(..., observe)`: the public observer parameter (pattern of `commit_observed`, `write.rs:141`), steps `DestinationWritten`, `DestinationVerified`, `SourceBackedUp`, `SourceRewritten`; an error from the observer aborts, which is how the crash windows are proven without a test switch.
- **D8 in the snapshot.** In `load_sources`, after `judge` on the global role, a refusal `config-key-in-wrong-file` whose path is held by the accounts source (or, for the token path, by an existing `gateway-token`) is turned into a notice `shadowed-by-destination`; the key is removed from the layer before the merge so the destination wins. The accounts-only read of phase 04 does not need it. Slice B's refusal cases (key with no destination) are unchanged and re-run.

## Steps

1. Merge `origin/main`; `impact` on `load_sources` and `build`.
2. Fixtures first (`relocate.v1.json`, about 24 cases): copy from a representative global JSON (formatted as `JSON.stringify(..., null, 2)`, with unrelated sections, a token, three pools); stage 2 byte-for-byte golden of the remaining JSON (every other byte unchanged, key order kept); stage 2 refuses without the flag; refuses when destination differs; refuses on revision change at the second check; crash windows through the observer (after `DestinationWritten`: key in both, snapshot passes with the notice, doctor-visible; after `SourceBackedUp` before rewrite: nothing changed; the JSON rewrite is atomic so there is no window "rewritten but not durable"); equal destination makes `copy` a no-op; token only; accounts only; empty `providers` entry left in place.
3. `tests/relocate.rs`: real fs, a child process holding `global-config` makes stage 2 return `lock-held`.
4. Snapshot cases appended to `snapshot.v1.json`: wrong-file key with an equal destination (passes, notice), with a different destination (the destination wins, as the spec says; the notice names the path only, never either value), with no destination (refused as before).
5. Run `cargo test -p fgos-config --jobs 4`, clippy, fmt. Report the lines (cap 280 + 30).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Two stages, destination first, crash windows, destination wins (acceptance 20), JSON bytes preserved, lock | `tests/relocate.rs` |
| The snapshot tolerates a held copy | `tests/golden_snapshot.rs` (the three new cases) |

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| JSON rewrite reformats a hand-edited global file | M x M | key order kept, golden on a representative file; if the file is not in the 2-space style the report says so before writing; backup first |
| A crash during stage 2 loses the file | L x H | one durable replace of the full bytes, backup already on disk, revision check, tested with the observer |
| The two stages are collapsed by a caller | L x H | `finish` takes the flag as a required parameter, never defaulted; the verb layer (phase 10) exposes it only as `--finish --machine-checked` |
| D8 hides a real wrong-file key | L x M | applies only when the destination holds the same path; notice is reported by doctor (phase 08) |

## Rollback

Revert the commit: `relocate.rs` and the three snapshot cases go; the one `snapshot.rs` rule goes with them (the old refusal returns). A machine that already ran stage 1 keeps both files, harmless.
