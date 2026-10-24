# WORK lead: gate fixes and repeat-read cost (wave 3)

Branch `work/es-cutover`, on top of `035bfcc7e`. Earlier waves: `phase-lead-261023-1112-work-event-store-batched-reads.md`, `phase-lead-261023-1216-work-event-store-verified-checkpoint.md`.

## Commits

| Commit | What |
|---|---|
| `d98f22de5` | Tasks 1-4: tests and test helpers only |
| `1e9c9f9d5` | Git area (own commit for OPC review): `packages/event-store/rust/src/read.rs`, tests, `packages/git/node-addon/src/event_store.rs`, census. `driver.rs` and everything else in `packages/git/rust` untouched |
| `0e3e7653f` | Node facade (`src/event-store/native.mjs`), facade test, event-store spec section, CHANGELOG |

Census regenerated with `--write-census`; `--check` shows only main's 5 `unresolved-binary` sites.

## Task 1: "config has one test door"

Cause: 12 raw `config.json` writes in branch tests. Fix: all go through `test/helpers/config-fixture.mjs` (`writeProjectConfig`, `writeRawProjectConfig` for deliberately invalid JSON, `projectConfigPath`); the helper already had every shape, nothing allow-listed. The linked-worktree and ceiling cases pass the repo root, not `.fgos`. Architecture file and the six touched files: 96 pass.

## Task 2: `test/identity/mint-door.test.mjs` `event-store-no-repository`

Cause: the test (IDENT's, from main) called `addWork` on a bare temp directory. After the cutover Work lives in the Event Store, which needs a repository; the store is right to refuse. Verdict: **fixture was invalid for the post-cutover world, production unchanged.** Fix: the directory is created with `initializeWorkRepository`. Test passes.

## Task 3: run-tests one-door ERROR (`git -C .../fgos-cli-XXXX init -q -b main`, 272x)

Cause, reproduced: `test/scripts/test-select-mutate.test.mjs` runs related tests in a throwaway checkout of HEAD, as a nested `node --test`. In that nested process the spy sits inside the config guard (spy arrives through NODE_OPTIONS, guard through `--import`), so a raw `git` spawn from any test helper is attributed to the guard wrapper (`scripts/lib/test-git-config-guard.mjs:128`), i.e. to "product code". The branch's harness (`tmpCwd` -> `initializeWorkRepository`, `activateGitFixture`) spawns git raw; main's harness never created a repository there, so it never showed.
Fix: `test/helpers/work-store-release.mjs` (`initializeWorkRepository`, `freezeLegacyWorkFixture`) and `activateGitFixture` in `test/helpers/git-fixture.mjs` now go through `scripts/lib/sandbox-git.mjs`. Proof: before the commit the run of that file printed the ERROR; after it, `fr.sh test/scripts/test-select-mutate.test.mjs` is clean (29 pass); a probe with the inverted preload order records 0 spawns for the fixture and 1 for a raw control call.

## Task 4: reason markers

- `test/event-store/triggers.test.mjs:119` and `test/setup/yaml-parse-failures.test.mjs:142`: the behaviour cannot be proven below the CLI. The start/end triggers are called from the verb dispatcher in `bin/fgos.mjs`; the doctor loop that runs every row and survives a failing one belongs to the verb. One-line `// boundary:` reasons added.
- `test/cli/fgos-setup.test.mjs:145`: `init` is the unit under test (the repository must not be prepared by a fixture that already ran it), so an inline reason; `tmpCwd` cannot do the job. `:149` (a second `init` keeps what the first made) retired: owner is `test/setup/event-store-fixes.test.mjs` "all setup fixes are idempotent..." (the fixes are what `init` runs). The CLI wiring itself keeps its one proof, the first call.
- `node scripts/test-proof-inventory.mjs --cli-cost`: `cli-cost: fgos --help 211 ms, fgos list 228 ms (median of 5, load 7.5)`.

## Task 5: repeat read in one process

### What I found before building

A repeat read of a store whose tips did not change is already at the Git floor: **4 processes** = one ref listing + HEAD (3 processes, `resolve_head`, HARDEN's). Verified by strace: 1, 5, 11 reads of the fixture = 16, 32, 56 git execs (4 per read), unchanged by this work. The wall time of a repeat read was CPU: union, contiguity, ordering, legacy parse/digest, JSON marshalling of 33k legacy events and of `fullOrder`, parse of each legacy line. That is what is now cut. HEAD is still observed on every call because legacy files at HEAD are part of the answer.

### Design (reused: `CommitMemo`, `Cursor`, `unchanged(tip)`; new: `ReadMemo`)

- `ReadMemo` (per prepared store, owned by the addon `EventStore`, no global): the last complete answer plus the inputs it came from (every tip incl. mirrors, legacy refs, own local events, the legacy view of the current HEAD). A read observes **all** of them again on every call (one ref listing, own files, HEAD) and answers from the memo only if they are identical and the caller holds exactly the memo's history (same cursor, same events). No time or call-count rule. Anything else reads normally and replaces the memo; a deferred read is never memoized.
- Legacy view (parse, order, digest) cached per process by repository + HEAD commit + legacy refs + query through the existing `CommitMemo` (content-addressed, failures never kept).
- A caller that names the digest of the legacy history it holds (`legacyHeld`) is not sent it again; the Node facade keeps the raw records and still gives every read its own parsed events (a test proves independence).
- `fullOrder` and the unused parsed `event` per legacy record no longer cross the addon (nothing in `src/`, `bin/`, `test/` read them).

### Measurements (release host, in-process repeat `listWork`, medians of repeated reads; git execs exact, ms noisy)

| Fixture | git execs per repeat read, before / after | repeat read ms before / after |
|---|---|---|
| 200 items, 40 commits | 4 / 4 | about 20 / 19 (CPU user 6 -> 5 ms) |
| 400 sealed commits | 4 / 4 | about 33 / 27 (CPU user 18 -> 11 ms) |
| 90 legacy files (15 MB, 33k events) | 4 / 4 | about 640 / 190 |

`loop.test.mjs` single case (`announce line`, strace, driver git execs with `--no-replace-objects`): **387 before, 387 after** (all git execs 398 / 398; main 191). Reads there are 24 x 4 and the case has little history, so this change cannot move it; the remaining read cost is HEAD (72 of 387) and the seal ceremony (3 x 29). Single case without strace at load 1.4: 8.4 s (three runs).

Whole file solo (go given by coordinator): start 14:12:51 load 4.28, end 14:22:05 load 1.86 (1-minute figures), **554 s wall, 99/99 pass** (node duration 541 s; wave 2: 434 s, 435 s wall). Under the 600 s per-file limit, but only by 46 s. Every test is about 1.27x slower than in the wave 2 log, uniformly, with identical git counts, which points at machine load from other lanes rather than at this change; I did not get an A/B at equal load (it would need a second full build), so treat the 554 s as unproven either way and re-measure at quiet load before drawing a conclusion.

### Owning proofs (design principle 8)

- Added `packages/event-store/rust/tests/read_memo.rs` (6): unchanged inputs answered from the memo after exactly one ref listing with no commit read, equal to a full read; **two-process case** (another writer appends, seals and publishes between two reads of one process: the next read is not memoized, hands over exactly the 2 new events, equals a full read, and is itself remembered); changed own local file (added and lost) is seen; replaced ref history never served from the memo; a caller holding another history gets a full read with rebuild; legacy omitted only for a caller naming the held digest, and a HEAD that moves to other legacy files is observed. No existing test covered an in-process memo (`checkpoint.rs` covers the cross-process file; its callers only gained a `None`).
- Added to `test/event-store/facade.test.mjs`: legacy not resent, events independent per read, moved legacy sent in full.
- Retired: only the `fgos-setup` second `init` assertion (owner above). Nothing else removed or weakened.

### Verification

`cargo test --locked -p fgos-event-store` all green, clippy `-D warnings` on `fgos-event-store` and `fgos-node-addon` clean. Node focused runs through `fr.sh` (spy gate included): `architecture, identity, event-store, state, setup, git, config, scripts` 3010 pass 0 fail before the helper commit; `test/cli` 1020 pass; `parity, direct, verbs/merge/approve` 130 pass; final combined run after all commits (`architecture, identity, event-store, state, git, cli, config, setup`): 3509 pass, 0 fail, no one-door ERROR.

## Concerns

- `cargo build` of the dev host failed once in this worktree with errors in unrelated crates (stale artifacts: `cargo clean -p fgos-git -p fgos-identity` plus touching the workspace sources fixed it). Not caused by the diff; mentioned because a lane with a shared target may see it.
- `cargo fmt -p` reformats unrelated files of the node-addon; I used `rustfmt` on my own files only.
- GitNexus impact analysis was not run for the changed symbols (`read_from`, `read_with_view`, `read_checkpointed` gained a parameter; all callers in the workspace updated and compiled).
- Memory: the memo holds a second copy of the events and of the legacy list of the last read per store.

## Unresolved

- HEAD resolution per read (3 processes) is the biggest remaining per-read cost; HARDEN's phase 5.
- The whole-file wall time needs a quiet-load re-measure.
