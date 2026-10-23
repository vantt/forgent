# HEAD read inside the Event Store tip listing (p-txiatvrts4)

Branch `harden/head-in-tip-listing`, cut from `harden/t2-git-terminal-control` (db5f19193). Lands after T2.

## Git `%(HEAD)` evidence (git 2.53.0, the floor)
- Format `%(refname)|%(HEAD)|...` prints `*` on the one listed ref that HEAD names, a single space on every other row. Verified: attached (marks `refs/heads/a`), detached (no row marked), unborn symbolic HEAD (no row marked, exit 0), packed refs (marked), reftable repo (marked), linked worktree (marks that worktree's own HEAD, so the mark answers only for the listed checkout).
- A ref that is not listed is never marked: the branch must be among the patterns. HEAD is not a `refs/fgos/` ref, so the Event Store listing adds `refs/heads/`.
- HEAD is opened once per invocation, independent of ref count. strace (`openat`) of `for-each-ref` over 3 refs and over 50+ branches, loose and packed: `%(refname)` alone opens `HEAD` once (repository setup); adding `%(HEAD)` makes it 2 total, i.e. one extra read, constant. `--include-root-refs` was rejected: its `HEAD` row gets `%(symref)` by a second read of HEAD, so name and value are not one observation.
- Not needed: `%(objecttype)` (an odb read per row). Git keeps `refs/heads/` to commits, so only a direct `refs/heads/*` row counts; anything else leaves `head: None` and the caller keeps `resolve_head`.

## Change
- `RefPage.head: Option<RefName>` (additive): the returned entry marked by `%(HEAD)`; format gained one field (`fields.len() == 4`). `list_refs` signature unchanged, so no caller moves.
- Event Store: `refs::list_with_head` (page loop shared with `refs::list`, which now calls it); `list_with_head` appends `refs/heads/` to the tip prefixes (branch rows are dropped from the tips) and `read::tips` returns the HEAD fact; `read_legacy` uses it when `authority.git_dir() == repo.git_dir()`, else `resolve_head(authority)`. HEAD marked differently on two pages (moved between pages) or with a different value is no observation. Bounded to 1024 rows per child with a stop at the first page that reaches the branches (see measurement).
- Other `resolve_head` callers (legacy_import admission, doctor `legacy_layout`, fence `pinned_legacy`) are not tip reads: they list a different prefix set or none, so there is no paired listing to move them to. Not touched. Candidate follow-up (not done): `write_readiness` calls `resolve_head` twice (itself and `consumer_inventory`).
- `read_paths_at` untouched.

## Coherence argument (not an atomic snapshot)
The listing child reads HEAD once at its start and compares each row's name with that one result; the branch row is read during iteration. The marked name therefore comes from one HEAD read; its commit is that ref's own listed value, taken from the same row, so a pair of branch A's name and branch B's commit cannot be formed. Same freshness as `resolve_head`: the pair is always coherent (name and its own value), though not one atomic snapshot of HEAD and the branch. A switch before the listing gives the new branch with its own commit; after, the old pair; never a mix. Pages: each page is its own child, so one mark per page is internally exact, and two different marks across pages are dropped.

## Children per Event Store read (attached HEAD, empty store, one commit; children against the repo's git dir)
- Before: `for-each-ref, symbolic-ref, rev-parse, cat-file x8` = 11.
- After: `for-each-ref, cat-file x8` = 9. HEAD cost 2 -> 0 children. Detached and unborn: unchanged (`symbolic-ref` + `rev-parse` still run; unborn also its `for-each-ref`).

## Proofs
- `packages/event-store/rust/src/refs.rs` `tests`: a page forced to 3 rows keeps the event refs complete and reports a HEAD past the page as unobserved, a HEAD inside it as observed.
- `packages/git/rust/tests/head_in_listing.rs` (own binary, logging+injecting git wrapper): attached -> exactly `["for-each-ref"]` and `head == refs/heads/a` with its listed value, agreeing with `resolve_head`; HEAD switched to `b` right before the listing runs -> (`refs/heads/b`, b's commit), never (b, a's commit); detached, unborn, branch not in the prefixes -> `head: None`.
- `packages/event-store/rust/tests/read_head_children.rs`: attached read has 1 `for-each-ref` and 0 `symbolic-ref`/`rev-parse`; detached and unborn reads still run both HEAD children. The attached test fails on the pre-change source (left 2, right 0, checked by stashing the source).
- `head_switch.rs` remains the owning proof for `resolve_head`'s bracket.

## Results
- `cargo test --no-fail-fast -p fgos-git`: all targets ok (unit 73 passed; head_in_listing 3 passed; head_switch 1 passed; no FAILED).
- `cargo test --no-fail-fast -p fgos-event-store -p fgos-identity`: all targets ok, no FAILED (new read_head_children 3 passed).
- `cargo clippy -p fgos-git -p fgos-event-store -p fgos-identity --all-targets -- -D warnings`: clean (one `arraydeque` dependency warning, not ours).
- Node one-file command on `test/event-store/*.test.mjs test/git/*.test.mjs`: `tests 253, pass 252, fail 0, skipped 1`.
- `cargo check -p fgos-git -p fgos-event-store --target aarch64-apple-darwin`: FAILS before reaching our crates: `packages/durable-file/rust/src/beneath.rs:7` `unresolved import rustix::fs::ResolveFlags` (Linux-only item; introduced by 8debed9c6, identical on `main`; file untouched here). Our changes use no OS-specific API. Needs an owner: durable-file lane.

## Δ lines (code commit e649b1e6a)
read.rs +20/-6, refs.rs +33/-2, driver.rs +12/-6, lib.rs +4, spec.md +3 (spec sentence + decision line); tests +261 (head_in_listing.rs 150, read_head_children.rs 111).

## Git-area SHAs for OPC
- e649b1e6a perf(git): read HEAD inside the Event Store tip listing (code, spec, proofs)
- report commit and census commit follow on the branch (see `git log harden/head-in-tip-listing`).

## Unresolved
- macOS check blocked by the durable-file `ResolveFlags` import (not ours).
- A repo with more than 4096 branches adds one listing child per extra page (still one child fewer than before up to ~8k refs).

## Branch-heavy measurement (coordinator item 1)
Release build, `Event Store read` p50 over 100 reads of an empty store, scratch repo with 5001 loose local branches (HEAD on `main`, sorts past the first page), `/proc/loadavg` 1-minute figure beside each run (the machine was loaded by other agents, so only same-moment pairs mean anything).
- Unguarded (first version: `refs/heads/` listed in pages of 4096, 2 children): before 31-33 ms, after 90-96 ms at loadavg 26-33 (about 3x slower); at loadavg 7-10, before 30 ms, after 39-43 ms. The listing lost.
- Guard added: `list_with_head` lists at most 1024 rows per child and stops at the first page that reaches the branches (event refs sort first and are then complete); a HEAD branch past that page is `None` and the read keeps `resolve_head`. A HEAD marked inside the page is still used, since the pair is coherent. The 1024 is a constant, tested through the existing `page_size` parameter of the internal pager (`refs::tests`), no test-only production branch.
- With the guard: 5001 branches, before 31.2 / 30.8 / 30.3 ms vs guard 36.4 / 37.7 / 36.3 ms (loadavg 9-11) - a bounded loss of about 6 ms (one wasted 1024-row child) only in repositories with more than 1024 branches whose HEAD branch sorts past the page. Small repo (9 branches): before 31.0 / 29.9 / 30.0 / 30.7 / 30.2 ms vs guard 24.7 / 25.3 / 24.6 / 25.3 / 24.6 ms (loadavg 8-15), about 5 ms (17%) faster.
- Not measured: packed refs at 5000 branches (a packed listing child costs about 5 ms instead of 17 ms, so the loss there is smaller).
