# Phase 7a — Git: push from inside a Land session, and main-checkout catch-up

Phase 7 found two refusals in the Git crate that block the plan's landing order (push first, then publish, while
the Land session is alive; catch local main up to the remote tip when it is behind). The owner chose option A on
2026-11-18 (`reports/decision-261118-1431-p07-land-push-order.md`): add two narrow Git ports here, then re-run phase
7 unchanged. Rust. **Merge gate:** the Git reviewer lead:OPC (`claude-36tm`, reopened by the owner for this plan)
reviews the diff and the land gate before it lands.

## Inputs
Step 0 first: re-grep every item, and run `git log -S'admission_land'`, `-S'main-checkout-fast-forward-refused'` and
`-S'refs/fgos/'` on `packages/git/rust` to find why each refusal exists. A finding that the refusal guards a case this
phase would open stops the phase with `NEEDS_CONTEXT`.
- Admission: `packages/git/rust/src/refs.rs:81` `admission`, `:88` `admission_land`; Land calls at
  `packages/git/rust/src/land.rs:451,606`; push path `packages/git/rust/src/remote.rs:177` `push_refs` ->
  `transfer_refs` (admission per destination), `refs/fgos/` source refusal `remote.rs:120,215`.
- Land: `LandSession` `land.rs:104` (holds the slot while alive), candidate pin ref
  `refs/fgos/git-operations/<id>/candidate` `land.rs:733-735`, `publish_land` `land.rs:673` (how it moves the main
  checkout's trunk under worktree-admin 40 with read-back: the catch-up reuses that path).
- Main-checkout rule: `refs.rs:585` `fast_forward_checked_out`, refusal `refs.rs:648`; `docs/platform/git/spec.md:121`
  (Refs row) and `:160`.
- Phase 7's parked work on branch `sv/p07` (`packages/supervision/rust/src/land.rs`, `tests/land.rs`): the 11 tests that
  fail only on these two refusals are the acceptance for this phase once phase 7 re-runs.

## Footprint
`packages/git/rust/src/refs.rs`, `packages/git/rust/src/remote.rs`, `packages/git/rust/src/land.rs`, `packages/git/rust/src/incidents.rs` (so `fgos git recover` settles an interrupted catch-up; added 2026-11-18),
`packages/git/rust/tests/*land*`, `docs/platform/git/spec.md`.

## Steps
1. Push inside a Land: a method on `LandSession` (for example `push_candidate(remote_grant, destination)`). It pushes
   the session's own candidate commit to its own destination `refs/heads/<target>`, non-forced and atomic, through the
   existing Remote transfer and WAL kinds (`RemotePush` with targets). Admission exempts exactly this push from the
   session's own chain: same operation id and binding, same destination ref, and the source is the session's candidate
   pin. Any other push to that ref while the chain is active is still refused as today. A plain `push_refs` with a
   `refs/fgos/` source is still refused. Outcomes keep the Remote vocabulary (accepted, rejected because the remote
   moved, unknown with recovery evidence). A rejected push leaves the session droppable with nothing published.
2. Main-checkout catch-up: one port, for example `catch_up_main_checkout(target, expected_old, remote_tracking)`. It
   fast-forwards the main checkout's checked-out trunk to a fetched remote-tracking tip only when all of these hold:
   - the move is a pure fast-forward (`expected_old` is an ancestor of the new tip);
   - the checkout is clean on the paths the move changes (the same dirty rule `publish_land` uses);
   - no Land chain is active on the ref.
   It runs under worktree-admin 40 with membership revalidation, exact-old CAS and read-back, like `publish_land`, and
   updates the tree the same way. Anything else refuses with the existing codes or `main-checkout-catch-up-refused`
   plus a reason. `fast_forward_checked_out` keeps refusing the main checkout; this is a separate, named door.
3. Git spec: add both ports to the Refs/Land rows and the lock table, and add a decision-history entry (date, owner
   option A, why the main-checkout rule stays for every other path).
4. Tests in `packages/git/rust/tests/` (an existing land test file, or a new `*land*` file), one behaviour each:
   - a Land pushes its candidate while alive, then publishes, and remote and local main both equal the candidate;
   - another push to the same ref during the session is still refused;
   - a push with a `refs/fgos/` source outside a Land is still refused;
   - the remote moved: the push is rejected, nothing is published, and the session drops cleanly;
   - catch-up fast-forwards a clean, behind main checkout;
   - catch-up refuses each of these: a non-fast-forward move, a dirty overlapping path, an active Land chain, a stale
     `expected_old`.
   Use real repositories with a local bare remote, as the existing Remote and Land tests do.

## Verify
- `cargo test -j 4 -p fgos-git` (all tests), `cargo clippy -p fgos-git --all-targets -- -D warnings`, `cargo fmt --all
  --check`, and `cargo check -p fgos-git` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`.
- `node scripts/git-one-door-scan.mjs --root .` reports no undeclared site; regenerate the census if it moved.
- Re-run phase 7's tests on `sv/p07` rebased onto this phase: the 11 that failed now pass.
- lead:OPC has signed off on the diff and the land gate before land.

## Rollback
Revert the phase commit. Nothing outside the Git crate calls the new doors until phase 7 lands.
