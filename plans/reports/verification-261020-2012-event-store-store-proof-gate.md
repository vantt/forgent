# Event Store proof gate, store part (phase 10)

Branch `es/p10-store-proofs` from origin/main `ca3b2c5e0`; unit run `unit-run-1792501956959-8a9c8098/producer/1` round 1 (called "this run" below). Host fg-server2: i7-13700, Linux 7.0.0-38, git 2.53.0, Node 24.22.0. Only the store is in scope: no Work consumer is wired, nothing was staged or committed, the program board was not edited. Report path from `fgos convention path --kind report --type verification --slug event-store-store-proof-gate`.

Filesystems: the Rust fixtures (`std::env::temp_dir`) and Node fixtures (`process-tmp-root`) live on `/tmp`, which is tmpfs on this host. They prove behaviour under process crash, not durability. The cross-filesystem topology case uses `/tmp` and `/dev/shm`, two separate tmpfs mounts. Durability evidence comes from the host latency run (ext4) and, once the owner runs it, the power-loss script (ext4).

## Matrix (spec §23.2)

STORE means proved now on main's code. WORK means the item needs the Work consumer and moves to the WORK lane. OWNER means the item waits on an owner action.

| # | Item | Lane | Owning proof | Last green run | FS |
|---|---|---|---|---|---|
| 1 | Kill matrix | STORE | `kill_append.rs` (9: every append/ack boundary, write, truncation recovery, rotation, stale hint, 8 processes, seven seal boundaries, shared ref); `seal_publication.rs` `all_seal_boundaries_recover…`; `append_recovery.rs` (18) | this run | tmpfs |
| 2 | Reader vs seal, ≥10,000 interleavings, C1/C2/C4 | STORE | `reader_seal_stress.rs` `ten_thousand_seeded_interleavings_and_wal_growth` (ignored in the normal gate, run explicitly); C1 `kill_append.rs` rotation; C2 `framing_prefixes.rs`; C4 `walk_certified.rs`, `reader_review_regressions.rs` | this run, see §WAL | tmpfs |
| 3 | V-AUTH-01 (`moveWork` race, last slot) | WORK | needs `moveWork` on the store under the `state` gate (phase 09) | — | — |
| 4 | V-SEQ-01 | STORE part | `order_kahn.rs` (clock rollback, equal ts, all permutations ≤7, C5, C6, incremental = full); `cursor_incremental.rs` (C5 ref deferral, C6 mirror, seal/restart, lost history → rebuild) | this run | tmpfs |
| 4 | …rebuild racing gated appends (N1), cross-machine CAS conflict record | WORK | `event-store-rebuild-busy` is only reserved in `result-codes.v1.json`; the rebuild install and the conflict record belong to the consumer | — | — |
| 5 | Three machines on a local bare remote | STORE | `three_clones.rs`, `shared_machine_id.rs`, `offline_sync.rs`, `sync_review.rs`; facade `facade.test.mjs` sync | this run | tmpfs |
| 5 | Owner's real forge | OWNER (Q3) | `scripts/event-store/forge-probe.sh <forge-url>`; trial run against a local bare remote: PASS (ref pushed, fresh clone read the event, mirror tip = remote tip) | not run on the forge | — |
| 6 | Legacy parity: decoder and fixtures | STORE | `legacy_import.rs`, `legacy_reader.rs`, `legacy-order-parity.test.mjs`, `export-legacy-parity.test.mjs` | this run | tmpfs |
| 6 | Pre-cutover Work view byte for byte on real workspaces | WORK | parity rehearsal needs phase 09's `migrate` on the consumer | — | — |
| 7 | Rollback export and legacy-fold parity | STORE | `rollback-export.test.mjs`, `export-legacy-parity.test.mjs` | this run; the 5 migrate tests that need the host PID namespace were last green in [gate-261019-2107-es-p08-host-gate](gate-261019-2107-es-p08-host-gate.md) (fg-server2) | tmpfs |
| 8 | (a) store increment in the gate | STORE | `scripts/event-store/v-spawn-bench.mjs --store-increment --strace`; `no-spawn-in-gate.test.mjs` | host PASS 2026-10-20 14:46: p95 43.5 ms at 20 sessions, 0 spawns ([report](phase-lead-261020-1420-es-store-read-latency.md#host-acceptance-coordinator-2026-10-20-1446)); no-spawn test this run | ext4 / tmpfs |
| 8 | (b) CLI end to end | WORK | needs the consumer on the claim, move and settle paths | — | — |
| 9 | Addon from a staged release with the Event Store exports; doctor vector | STORE | staged-release probe this run (below); `test/setup/event-store-checks.test.mjs` (addon present passes, missing addon fails); `test/distribution/native-addon.test.mjs` | this run | tmpfs |
| 9 | npm channel, activation refusal (M10), windows-x64 build, doctor registration | WORK / Git | M10 is Git phase 05 req 7a and the release that carries ES 09; windows-x64 is Git D11/07; check registration happens at cutover | — | — |
| 10 | Power loss on ext4 | OWNER (Q4) | `scripts/event-store/power-loss.sh` (not run) | — | ext4 |
| 11 | V-DOOR-01 | STORE part | `door-fixtures.test.mjs` (scanner), `door.test.mjs` (dormant census, shrink-only) | this run | — |
| 11 | Zero legacy findings across the repository | WORK / Git 07 | the census lists Work and Git callers that only the cutover removes | — | — |
| 12 | Topologies | STORE | `test/event-store/topologies.test.mjs` (new) | this run, 6/6 | tmpfs ×2 |
| 13 | Setup/doctor vectors | STORE part | `test/setup/event-store-checks.test.mjs`, fixes in `src/setup/event-store-fixes.mjs` | this run | tmpfs |
| 13 | Registered rows, full `npm test` on the candidate | WORK | check bodies are dormant; registration is phase 09 | — | — |

Commands (this run):

```sh
cargo test --locked -p fgos-event-store                       # 149 passed, 0 failed, 1 ignored (the qualification below)
cargo clippy --locked -p fgos-event-store -p fgos-git -p fgos-node-addon --all-targets -- -D warnings   # clean
cargo test --release --locked -p fgos-event-store --test reader_seal_stress -- --ignored --nocapture ten_thousand_seeded_interleavings_and_wal_growth
node --test test/event-store/*.test.mjs test/setup/event-store-checks.test.mjs test/distribution/native-addon.test.mjs test/githooks/event-layout.test.mjs
#   106 tests: 101 pass, 0 fail, 5 skipped (migrate tests that need the host PID namespace)
node --test test/runner/dead-vocabulary-guard.test.mjs test/architecture.test.mjs   # 40/40
git diff --check                                                                     # clean
```

No full `npm test` ran (sandbox). Logs are under `.fgos/runtime/tmp/es-p10/` in the worktree.

## Item 12: topologies

`topologies.test.mjs` drives the facade (`eventStoreFacts`, `prepareStore`, and `openStore` over Git's resolver). On each topology that resolves, it appends, seals and reads back.

| Topology | Result |
|---|---|
| Plain repository | resolves `<.git>/fgos/events`, full round trip |
| Linked worktree on another filesystem (`/tmp` and `/dev/shm`, different `st_dev`) | same open root, same origin, contiguous `seq` from both checkouts |
| Bare repository with a worktree | resolves when the bare repository is the trusted main; the worktree as its own trusted main is refused with `untrusted-worktree` |
| Submodule with its own `.git` directory | its own store, separate origin from the superproject |
| `--separate-git-dir`; absorbed submodule (`.git` file) | **refused** with `trusted-main-gitfile-unsupported` before any store exists |
| Git floor | the floor and its probes come from `git-floor.v1.json` (2.53.0, four probes), and doctor passes. In a child process with a git that reports 2.30.0, `prepareStore` refuses with `git-floor-unsupported`, doctor fails, and no `store.json` is written |

Proofs owned elsewhere and not repeated here (principle 8):

- Layout grammar, and the common directory of a linked worktree on the same filesystem: `registry_identity_layout.rs` `layouts_and_linked_worktrees_share_common_root`, and `facade.test.mjs`.
- Refusal of a non-git directory: `facade.test.mjs` (`event-store-no-repository`) and `event-store-checks.test.mjs` (open-root).
- Trust of a worker gitfile, and the separate-git-dir refusal at the port: Git `inspect.rs`.
- The floor record and its probes: Git `driver.rs` `floor_and_all_repository_backends` and `floor_record_is_reused_only_for_the_same_key…`.

**Finding.** Spec §8 said `--separate-git-dir` resolves (experiment 1). The implementation refuses it, and also refuses absorbed submodules, which are git's default for `submodule add` of a URL. The refusal fails closed and is Git's rule (Git spec §3, §17). I recorded it in §8 as the measured result rather than changing the support claim on my own. Decision for the owner:

- **What is happening:** two of the topologies in §8 are refused.
- **Cause:** Git's resolver does not trust a gitfile main checkout.
- **Options and cost:**
  - (a) Accept the narrower support matrix and mark the two topologies unsupported in §8 and §22. Costs nothing.
  - (b) Ask the Git lane to support a gitfile trusted main. This is Git work on the trust model.
- **Recommendation:** (a) now, and (b) only if a workspace on the Q2 list uses either layout. On this machine the forgent and mdview checkouts are plain repositories. mcp-skill-hub is not checked out here, so it was not checked.
- **Scope:** topology support only.

## Item 9: staged release (store side)

I staged a release the same way `test/distribution/native-addon.test.mjs` does, then imported the facade from the staged `libexec/legacy-node` and loaded the addon through `hostBin`:

- target `linux-x64`, napi 8, versions `{addon, git, eventStore: 0.2.0, contracts.eventStore: 4}`;
- `eventStoreAddonAvailable` is true and `branchKey('feature/x')` returns `feature-x`;
- `event-store-native-addon` passes: "Event Store facade exports present".

The owning staging test only asserts `versions().napi`. The one-line extension that makes this a permanent proof is listed under needsWrites: also assert `eventStoreAddonAvailable({hostBin})` from the staged loader in `test/distribution/native-addon.test.mjs`. That file is outside this write scope.

## Item 10: power loss (not run)

`scripts/event-store/power-loss.sh` with `power-loss-driver.mjs`. Each run does the following:

1. Builds a fresh ext4 on dm-flakey, over a loop image that sits on a real ext4 disk.
2. As the invoking user, appends 1–3 event batches through the facade and seals every 7 appends. After each append returns, it writes an acknowledgement line to a log on the image disk and fsyncs it.
3. Cuts power:
   - SIGSTOP the writer;
   - switch the table to `drop_writes` (`dmsetup suspend --nolockfs`);
   - SIGKILL the writer;
   - unmount, so unflushed data is lost.
4. Restores the table and remounts, which replays the journal.
5. Verifies:
   - every acknowledged hash is present;
   - no duplicates and no `seq` gaps;
   - the next append takes max `seq` + 1;
   - a seal succeeds;
   - `status.integrityErrors` is empty.

A SIGKILL-only smoke test of the driver on ext4 (no power cut) gave 126 acknowledged, 126 present, next `seq` 127. Owner command:

```sh
node scripts/git-addon.mjs                                          # as yourself, once
sudo env "PATH=$PATH" scripts/event-store/power-loss.sh --runs 20   # results: .fgos/runtime/tmp/es-power-loss/power-loss.jsonl
```

## Item 6a: WAL bound (M8)

Git's compaction is present: terminal PublicationCas chains are compacted to one ledger line each in `fgos/git/compacted`, and pins are released (Git phase 01 req 12a; `wal.rs` `compacted`). Phase 04's measurement (the 10,000-schedule qualification) ran again on main's code in this run, in release mode on tmpfs:

- **10,000 distinct schedules passed**: 8 shards × 1,250, 1,358 s.
- Per shard (about 2,500 seals): **0 operation directories, 0 pins, 0 unresolved WAL entries**. 2,517–2,521 compacted receipts, 812,909–814,187 ledger bytes, a maximum receipt of 323 bytes (the bound is 512), and 2,520–2,524 inodes in 3 directories.

The active WAL drains to zero. What remains is the retained id ledger, which grows linearly at one receipt of at most 512 bytes per publication, as Git §10 signs it. That is bounded per seal, not constant, which is what M8 accepted. **M8: green.** This is process-crash evidence and makes no claim about power loss. Log: `.fgos/runtime/tmp/es-p10/wal-10k.log`.

## Item 9 (plan req 9): V-EVENT handoff to the Git 08 lead

The phase 05 V-EVENT green run is **`unit-run-1792335330301-2d5438cb/producer/1`**, suite `v_event` (four tests), from [phase-lead-261018-2155-es-p05-u1-sharing-sync](phase-lead-261018-2155-es-p05-u1-sharing-sync.md). The same four tests are green again on main's code in this run (`v_event.rs`: 4 passed). Recording it on the board is left to the coordinator (outside this write scope).

## Docs (req 8 store parts, 8a)

`docs/platform/event-store/spec.md`:

- Implementation status line: dormant, store proven, consumer pending in the WORK lane.
- §5: clarification row for `project:<name>` (D9).
- §8: measured topology result.
- §10 step 2.3: points to Git's Publication port; Git fsyncs directories itself.
- §21 `event-store-git-version`: points to `git-floor.v1.json` through `gitFloorVerdict`.
- §15 and §19: citations moved to current lines. `events.lock` is already the `state` hot mutex.
- A dated history section. No protocol change.

Also updated:

- `docs/platform/component-boundary.md`: new Event Store row.
- `docs/specs/reading-map.md`: Event Store paths.

`docs/specs/work-state.md` and `distillery.md` were not touched (WORK).

## Deferred to the WORK lane

| Item | Reason |
|---|---|
| Req 0, part (b) end to end | needs the consumer on claim, move and settle |
| Req 3, real forge | owner authorization (Q3); the command is above and was not run |
| Req 6, parity rehearsal | needs phase 09's `migrate` on the consumer |
| Req 7, retired families against freeze 234 | the mechanisms disappear only at cutover |
| Items 3, 4 (N1, conflict record), 8(b), 11 (whole repository), 13 (registration, full suite) | consumer-owned |
| Item 9: npm channel, M10 activation refusal, windows-x64 | release and Git lanes |
| `docs/specs/work-state.md`, `distillery.md`, CHANGELOG | Work cutover documents |

## Go / no-go: "store layer accepted"

**GO, with one owner decision and one owner run still open.**

These items are green on main's code and owned by tests: 1, 2, 4 (store part), 5 (local bare remote), 6 and 7 (store part), 8(a), 9 (store part), 11 (store part), 12, 13 (store part), and 6a.

Open, and none of them blocks acceptance of the store as a dormant foundation:

- **Item 10 (power loss):** the owner runs the script with sudo (Q4). Until then the store's durability claim is process-crash only, which is what Git's receipts already advertise.
- **Item 5, real forge (Q3):** the owner runs `forge-probe.sh`.
- **Item 12 finding:** `--separate-git-dir` and absorbed submodules are refused. Decision above; the recommendation is to narrow §8 and §22.

Everything listed as WORK gates phase 11 (cutover), not this acceptance.

Status: DONE_WITH_CONCERNS
Summary: Store part of the phase 10 gate is green on main's code: a new topology test (6/6), 10,000-schedule WAL qualification (M8 bounded), Rust 149/0, focused Node 101/0/5 host-only skips, staged release addon carries the Event Store exports. Spec, component boundary and reading map are updated; WORK items are deferred with reasons.
Concerns/Blockers: Owner runs still open: power-loss.sh (Q4) and forge-probe.sh (Q3). Owner decision: --separate-git-dir and absorbed submodules are refused (`trusted-main-gitfile-unsupported`), contrary to spec §8. needsWrites: one assertion in test/distribution/native-addon.test.mjs. The V-EVENT run id still has to go on the board (coordinator).
