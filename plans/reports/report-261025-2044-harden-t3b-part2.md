# HARDEN T3 part 04b, part 2: Event Store follow-up cleanups

Branch `harden/t3b-part2`, 17 commits on main `a512969c7`, tip `5f343c13f`. Merged as `f12c71e0b`. Reviews:
- `lead:ES` (`claude-ursc@fg-server2`): APPROVE on 2026-10-25 at 21:58, after one round of changes (R1–R3, N1).
- OPC: MERGE on the Git area (addon, `cli_tests.rs`, census).

The scope is the approved one: the [T3-04b arbitration](council-261025-0057-harden-t3b-arbitration.md) §4 item 2, and WORK's decision 2 there (the due sync moves to a detached child). Size: 46 files, about +400 / −500. Rust src net about −190.

## Changes per item

1. **`promote::abandon` deleted.** Nothing called it. The abandon-only behaviour is removed.
2. **The unpublished-summary chain is deleted:** `sync.rs`, the addon route, and the `native.mjs` wrapper. Nothing consumed it. `v_event` and `offline_sync` still own `unpublished_since`.
3. **Two setup fixes dropped: the machine-id fix and the refspec fix.**
   - Identity's mint (`identity-machine-id`) owns the machine id.
   - Git's `fixGitFetchMapping` (setup fix `git-publication-refspecs`) owns the fetch mappings.
   - `fgos init` and `events migrate` call those doors directly.
   - `events migrate` refuses with `event-store-fetch-mapping-refused` when Git refuses to install the mappings. The proof is in `migrate-cutover-grant.test.mjs`.
4. **Doctor rows, 10 → 8.**
   - `event-store-git-version` is judged by `git-component-compatible`, which reports a supported floor only when every probe passed.
   - `event-store-orphan-branches` is folded into `event-store-unsealed`.
   - `event-store-native-addon` stays. It is the only row that checks the facade exports, and the addon contract version is checked only in `git-component-compatible`.
5. **Node copies of Rust decisions removed.**
   - Ranks and depth are refused by the crate's `validate_seal_context`.
   - The remote name is refused by Git's mapping rule when the store opens (`invalid-fetch-mapping-remote`).
   - The platform refusal stays in `native.mjs`.
6. **Node vector re-proofs deleted.** `vectors.rs` owns `canonical-hash.v1.json` and `records.v1.json`. The first test of `canonical-vectors.test.mjs` stays as the door wiring proof.
7. **The due publish runs in a detached child.**
   - The end trigger starts one `fgos events sync --opportunistic` child through the existing `spawnDetachedCli` door and returns at once.
   - An opportunistic sync records its attempt as soon as it holds the seal lock, before any network work. So the commands that end while it runs start no second child. A bounded race remains between the spawn and the first child taking the lock.
   - Publication delay: at most the child's runtime, up to about 120 s on a slow remote. Events are durable locally first.
   - A child killed mid-network leaves the new attempt time with the previous outcome fields. The next due window retries.
   - Proofs, in `triggers.test.mjs`:
     - "the end trigger hands a due publish to a detached child, does not wait for it, and never publishes from a dispatched worker";
     - "end triggers that run while a publish child is in flight start no second child".
8. **Failure record.**
   - A failing end trigger records `event-store-end-trigger` in the invocation-fault log, and the command still exits 0.
   - A failing seal or publish child records `event-store-child` and exits non-zero.
   - A sync failure that the sync itself persisted in `sync.json` stays with doctor's `event-store-sync` row.
   - Proofs are two tests in `triggers.test.mjs`.

## Deviations from the approved shape (accepted by `lead:ES`)

- No sync child existed to reuse. The seal child's door and the existing `events sync` verb were reused, with the new flag `--opportunistic`.
- The trace goes through the existing invocation-fault log, not through Observe friction or the integrity row:
  - friction needs a work-item subject;
  - the integrity row has no persisted source for a trigger failure.
- Every commit carries a regenerated census digest, because the pre-commit hook requires it. Sites and classes are unchanged.

## Verification

- **Lead, ES and big lead, each at the tip:**
  - `cargo test -p fgos-event-store -p fgos-identity -p fgos-work-state`: 291 pass, 0 fail;
  - `fgos` `cli_tests`: 41 pass, 0 fail;
  - focused Node runs: 158 to 271 pass, 0 fail;
  - clippy `-D warnings`: clean, except the vendored `arraydeque`;
  - `cargo check --all-targets` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: clean. The big lead's run caught the identity symlink test, which is now gated by `3017325ed`;
  - census `--check`: 0.
- **Land gate on the merge:** the board line of the landing records the full `npm test` and `cargo test --workspace` results.

## Left for others

`p-duxnm52lzh` (ES backlog) covers two gaps:
- a seal child that cannot start leaves no record;
- the fault log has no throttle.

H33 with D4–D7, D13 and D14 waits for the fence release. HARDEN owns it under owner decision 43.
