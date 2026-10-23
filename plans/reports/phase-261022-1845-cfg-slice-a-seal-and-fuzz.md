# Slice A: public API seal and fuzz targets

Branch `cfg/slice-a-crate`, worktree `forgent-worktrees/cfg-slice-a-crate`. Commits: seal `8e6c2fdc6`, fuzz (next commit on the branch). Not pushed, not merged.

## Result

- `cargo test -p fgos-yaml-doc --jobs 4`: green (api_seal 9, fixture shape 7, golden runners, third-party integrity). `cargo clippy -p fgos-yaml-doc --all-targets -- -D warnings` and `cargo fmt` clean. `cargo test --workspace` and `npm test` not run, as instructed. Impact analysis: inactive.
- Fuzz: three targets, 10 minutes each, no crash, hang or OOM, nothing in the vendored parser. The owner's parser sign-off stands.

## Phase 07: seal

Coordinator decisions applied:
1. One acknowledgement: `set` and `insert` take `CommentLoss` like `remove`. Without it they refuse `comment-would-be-lost` (a flow collection or subtree rewrite that drops a note). Fixtures: two new acknowledged variants of the existing set refusals, two new insert cases (refused, acknowledged); the golden runner passes `acknowledge` to all three ops. Spec sections 5 and 11 and the decision history updated. Other consumers (host-runtime, observe, gateway) only call `parse`; none changed.
2. `set_inline_comment(path, Option<&str>)`: `None` removes. Empty string is refused with a new rule id `inline-comment-empty` (the existing rules had no fit: `inline-comment-multiline` means a line break). The sanitizer still maps "" to a bare `#` for block/inline text at its own level (fixtures unchanged); only the edit refuses it. The old fixture that used `""` to remove now uses `null` (renamed `comment-inline-none-removes`).
3. Panic hook: the first guard installs one process-wide hook, once; it is silent while the panicking thread is inside a guard (thread-local depth) and delegates every other panic to the hook that was there before. Why: the default hook prints the panic message to stderr, and a failed string slice quotes the input text. Alternatives rejected: swapping the hook per call (races between threads, process-global) and leaving the default (can leak). Cost, documented in the crate docs and spec section 10: a host that installs its own hook after the first call replaces ours. Proven by a child-process test (stderr has no guarded message, still has an unguarded panic).

Rest of the phase:
- Every fallible public entry now goes through `guard`: added to `merge`, `prescan::check`, `parse_path`, `sanitize`, `sanitize_inline`, `to_json` (edits and `parse` already had it). Infallible public functions (accessors, `span_of`, value/profile/refusal builders, `format_path`) are marked Total in the table after reading them.
- `Document` no longer derives `Debug` (it printed the whole source text); manual impl shows file, profile, size, revision.
- `forbid(unsafe_code)` was in place; no `panic = "abort"` in any manifest (test checks the root, gateway and crate manifests).
- Audit of unwrap/expect/indexing/arithmetic hits: the input-dependent ones were already checked forms; the remaining ones got one-line "cannot fail because" comments (chain tail in edit.rs, line index, node push, expansion alias). The `expect`s on embedded contract JSON stay: build-time constants checked by the fixture-shape test.
- Error text: refusals carry rule, file, path, position and fixed limit wording only (read every `with_detail`). Marker test (`SECRET-VALUE-7731`) runs every parse and edit fixture input in four marked variants plus 18 hand-made hostile documents through parse and the ops, asserts no marker in Display/Debug and no `yaml-internal-error` anywhere.
- `tests/api_seal.rs`: guard tests moved here from `guard.rs` (single owner); the public-function table is compared with a scan of the source and fails on an added `pub fn` without a row; adversarial corpus: about 3 500 mutated fixture inputs (truncate every 7th byte, flip every 13th, repeat a line 1 000 times, 40 flow brackets) through every public entry under both profiles, asserting no panic, no caught panic, bounded time, and that an accepted edit leaves a parseable document. Runs in about 5 s. Seeds over 64 KiB (byte-bound probes) are skipped; a first run without the cap fed a 1 GB fixture and took a minute.
- `tests/common/mod.rs`: `apply_op` moved from `golden_edit.rs` so both runners share it; `contracts_dir` finds the directory from the crate or the fuzz crate.
- New rule id `inline-comment-empty` (rule list now 32): `model.rs`, `refusal-rules.v1.json`; the fixture-shape test keeps them equal.

## Phase 09: fuzz

- Installed locally (dev tools, not registered with setup/doctor): `rustup toolchain install nightly --profile minimal` (rustc 1.101.0-nightly 2026-10-21), `cargo install --locked cargo-fuzz` (0.13.2).
- `packages/yaml-doc/rust/fuzz/`: own `[workspace]`, `[patch.crates-io]` to the vendored parser and arraydeque (the root patch does not reach it), targets `parse`, `edit_reparse`, `merge`, `src/bin/seed.rs` (corpus from the golden fixtures, up to 64 KiB; 8 KiB for edit seeds), `README.md`, `.gitignore` (corpus, artifacts, coverage, target, logs), `Cargo.lock`. `cargo metadata` at the root still shows 24 members.
- Targets assert: parse: no caught panic, named rule, unedited bytes equal input; edit_reparse: no caught panic, refused edit leaves bytes unchanged, accepted edit re-parses to the same value and `set` and `insert` landed, comment edits do not change meaning; merge: no caught panic, every origin names a layer holding the path, every leaf has an origin.
- Runs (each `-max_total_time=600 -rss_limit_mb=2048 -timeout=10 -jobs=1`, exit 0, no artifacts):

| Target | Executions | Coverage points | Features | Peak RSS |
|---|---|---|---|---|
| parse | 2 425 511 | 5 363 | 25 375 | 854 MB |
| edit_reparse | 3 648 236 | 7 475 | 34 932 | 873 MB |
| merge | 9 684 017 | 686 | 3 610 | 568 MB |

- Two target defects found and fixed in the fuzz crate (not crate or parser findings): `edit_reparse` compared values with `==` and tripped on `.nan` (NaN != NaN; reproducer passes after a NaN-aware compare, the first 10-minute run was repeated in full); `merge` assumed a taken-whole sequence has one origin, but the crate (and the fixtures) record one per leaf inside it. No fixture was added because no crate code changed.
- `upgrade-record.md` section 12 fuzz line filled; the sign-off line untouched.

## Deviations and notes

- The fuzz crate uses its own byte grammars (no `arbitrary`): the seeds are then exact encodings of fixture cases; merge seeds map fixture strings onto a four-key alphabet, so they only approximate the fixtures.
- Fuzz did not run under a sanitizer other than libFuzzer's default (ASan on); a stack overflow would show as a crash and none occurred.
- Plan phase status and program board were not touched.

## Unresolved questions

- `inline-comment-empty` is a new rule id: accepted by the coordinator, or should an empty text map onto an existing rule?
- CI build step for the fuzz crate (idea in the phase risk table) is not added; owner's choice.
