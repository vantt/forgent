# H31-A: write admission takes HEAD and the legacy hint from one ref listing

`write_readiness` now lists `refs/fgos/legacy` and `refs/fgos/remotes/` once with `refs::list_with_head`. An attached HEAD within the listing answers from it; otherwise `resolve_head` is the fallback. `consumer_inventory` takes the listed entries, and the migrated branch filters the same entries, so its second `refs/fgos/` listing is gone. The listing runs against the authority checkout, so the listed HEAD always belongs to it and no same-checkout test is needed. Admit and read do not share a snapshot.

## Git children per admit (measured by `read_head_children.rs`, fixture non-migrated, includes 2 fact children: config + rev-parse)
| HEAD | before | after |
|---|---|---|
| attached | 6 (symbolic-ref, rev-parse bracket, for-each-ref, cat-file) | 4 (for-each-ref, cat-file) |
| detached | 6 | 6 (listing + bracket) |
| unborn | 5 | 6 |

Unborn is +1: the listing is spent before HEAD is known to be unborn. That is a fresh repository, once per prepared store. The migrated repo also drops its second listing (-1, not exercised by a fixture here).

## Changes
- `src/legacy_import.rs`, `tests/read_head_children.rs`: +3 admit tests (attached / detached / unborn), +~50 test lines. Rust src about +14 / -12.
- Spec: no line states admit's HEAD observation or child count; unchanged. No CHANGELOG (internal).
- Census `packages/git/contracts/mutation-census.v1.json` regenerated (digests only; undeclared count stays 5).

## Gates
- `cargo test -p fgos-event-store`: all pass (legacy_import / legacy_reader / head_in_listing / head_switch unchanged).
- clippy `--all-targets -D warnings`: clean.
- `aarch64-apple-darwin` check `--all-targets`: 0 warnings, 0 errors.
- `x86_64-pc-windows-msvc`: lib check has 1 warning, `export.rs:45` unused `mut` (existing, untouched). `--all-targets` fails in test files that use `std::os::unix` (existing, e.g. `append_recovery`, `sync_review`; not from this change; `read_head_children.rs` is `cfg(linux)`).

## Not done
Unborn +1 child (above). Facts and spawn items (C, B) are out of scope.
