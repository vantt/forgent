# HARDEN T3 part 04b council: correctness seat (Event Store)

`git rev-parse --short HEAD`: `c7522c86d` when the seat started. The throwaway clone was taken later from the moving main, at `52149c6cd`. Machine fg-server2, 2026-10-25 00:18 to 00:40 (Asia/Saigon). Lens: correctness and stability.

**What I ran.** I read the code in scope. All runs happened in a throwaway clone under `/home/vantt/projects/forgent-worktrees/t3b-seat-correctness-clone/`, which is now deleted. No cargo or Node test run was needed: every High below was reproduced through the CLI. The real repository was not written: its `refs/fgos/*` are unchanged (`refs/fgos/legacy`, `refs/fgos/remotes/origin/legacy`, both at `7e456df67`).

## 0. Fresh-clone reproduction (WORK's requested order)

**Environment.** No `FGOS_*` variable was set: `FGOS_HOST_BIN` and `FGOS_STATE_ROOT` were unset, and the state root resolved to the machine default `~/.local/state/fgos`. That root is machine-wide by design and is shared with the real checkout; it supplied machine id `fg-server2-jdp2bv`. Each clone had its own `.git`, created fresh by `git clone`.

**Host.** `R=/home/vantt/.local/state/fgos/releases/sha256:874af08f…` is the release the real checkout activates. `$R/bin/fgos` is exactly what the project shim `.fgos/installation/bin/fgos` execs. umask was 002.

**Remote.** The origin was a throwaway bare clone, `remote.git` (`git clone --bare --no-local` of the real repository, plus `refs/fgos/legacy` fetched into it). No push could reach the real repository.

| # | cwd | Command | Result |
|---|---|---|---|
| 1 | `…/clone` | `git clone -q remote.git work` | ok. `.git` mode 775, no `.git/fgos`, no `refs/fgos/*`; fetch refspec is heads only; the tracked fence `.fgos/events` is present |
| 1a | `work` | `fgctl init </dev/null` | **fails** with `git-addon-missing: … linux-x64 requires components.nativeAddon with git-wal-v1` (the project pin `sha256:df7a1a04…`). With `--from $R` it fails with `pin-mismatch`. It leaves `.fgos/locks/activation.lock` as a plain file (Distribution's layer, outside this seat; see Gaps) |
| 2 | `work` | `$R/bin/fgos setup </dev/null` | **fails** with `recovery-required / git-fence-missing`, because `activation.lock` is not a tombstone (`packages/git/rust/src/wal.rs:1190-1199`). I replaced it with the tombstone that `fgctl init` writes on success (`packages/distribution/rust/src/init.rs:240-255`); after that, setup exits 0 in 2.9 s (load 4.1). It creates `.git/fgos{,/events,/events/locks,/git,…}`, all mode 700, installs both fetch mappings, and fetches `refs/fgos/remotes/origin/legacy`. It does **not** set `fgos.machineId` |
| 3 | `work` | `$R/bin/fgos list </dev/null` | **ok**, 1.43 s at load 3.5 |
| 4 | `work` | `$R/bin/fgos edit tsk-5ui --priority 10001 </dev/null` | **ok**, `seq 1`, 1.27 s. Within 5 s the detached `events seal` child had sealed it: `refs/fgos/events/fg-server2-jdp2bv` was created and no active file remained |

**Answer to WORK's point 1.** Once `fgos setup` has run, reads work. Before setup, the read failure is only the missing named refusal; the cause is in the code (finding C1).

- Second fresh clone `work2`, without setup: `fgos list` answers `event-store-io: NotFound: No such file or directory (os error 2)`.
- After only `mkdir -m700 -p .git/fgos/events`, the same read answers the named `event-store-refspec-missing: tracked legacy fence requires fetching legacy ref`.

**Answer to WORK's point 2.** `repository-identity-changed` is caused by the **mode** of `.git/fgos`. The two causes WORK asked about are ruled out.

- *The WAL directory was copied:* ruled out. Both clones are fresh `git clone`s, with no `.git/fgos` before the first fgos call.
- *The host ran against a store or state root of the real checkout:* ruled out. The state root is the machine-wide one in both the passing and the failing run, and the WAL lives in each clone's own common dir. The experiment below flips the result by changing only one mode bit set.

The experiment, in `work2`:
- `rm -rf .git/fgos; mkdir -p .git/fgos/events/locks` makes the directories 775 under umask 002. Add the tombstone, then run `fgos setup`. Setup **fails** with `{"code":"refused","cause":"repository-identity-changed",…}`, and `list` and `edit` then refuse with `event-store-refspec-missing`.
- `chmod 700 .git/fgos`, then `fgos setup` gives exit 0, and `fgos edit tsk-5ui --priority 10002` gives exit 0.

So the baseline's write failure came from directories that were created by hand with umask 002. The Git WAL refuses a group-writable `.git/fgos` (`wal.rs:1076-1081`, where non-common directories must have `mode & 0o022 == 0`) and names the refusal `Untrusted` → `"repository-identity-changed"` (`wal.rs:43`). In the order WORK named, the write works.

## Part A: target shape (correctness view)

- **Authority.** Durability, sequence and dedupe of events; sealing to per-machine refs; sharing; reading the union. Unchanged from the spec, §3.
- **Contract and ports.**
  - Unchanged: `append`, `readInGate`, `read`, `seal`, `sync`, `status`, `maintenance`, `export`, `legacy*`.
  - Correctness requirement: every reader-side path treats an absent open root as "no local store yet" (empty receipts, empty streams), exactly as `diagnostics::streams` and `open_read::read_own` already do. An I/O refusal names its path.
- **Rust/Node boundary.** Node keeps:
  - marshaling;
  - the CLI lifecycle placement (which command hands what to the detached child);
  - the consumer gate.

  Every deciding rule moves to Rust or is deleted (table §4): the rank guards, the sync-due rule, the doctor thresholds, the refspec overlap rule and the damaged-history code list. Node budget after that: facade at most about 330 lines and 8 exports (today 417 lines).
- **The state hot mutex.** The Event Store itself does **not** need `withStateTx`.
  - Evidence: append serializes on its own `event-append` lock, and it refuses a moved own stream with `stale-cursor` (`append.rs:203-209`). Rotation and seal take their own locks (`rotate.rs:46`, `locks.rs:372`).
  - Work still needs it, for read-check-append of business preconditions plus ordered staged effects and the cache write (`src/state/consumer-event-gate.mjs:47-80`). It stays with the state store, as the brief says.
- **Doctor rows.** Keep all 10. The only change: `event-store-open-root` and `event-store-lock-dirs` (fix) also verify that the parents `.git/fgos` and `.git/fgos/events` are not group- or other-writable (C2). This is no new row.
- **Size.** The net correctness changes are about -10 Rust (one `streams` twin deleted, `own_bounds` made tolerant) and about -60 Node (twins in §4).

## Part B: findings

| Id | Axis | Sev | Repro | file:line | What goes wrong | Fix shape |
|---|---|---|---|---|---|---|
| C1 | A correctness / mission #1 | High | **reproduced** (`work2`, step "list before setup") | `packages/event-store/rust/src/receipt.rs:178` (`read_dir(&layout.root).map_err(io)?`), reached from `read.rs:702` (and `read.rs:569`); the message comes from `errors.rs:297-301`, which drops the path | Every read in a fresh clone, before `.git/fgos/events` exists, fails with the opaque `event-store-io: NotFound`. Its twins already treat absence as empty (`diagnostics.rs:12-15`, `open_read.rs:356-360`, `identity.rs:72-75`, `sync.rs:107-118`) | `own_bounds` returns empty on `NotFound`, the same rule as `diagnostics::streams`. The read then reaches the named `event-store-refspec-missing` (reproduced), whose detail should say "run fgos setup". `errors::io` callers on a path attach the path |
| C2 | A / B naming | Medium | **reproduced** (chmod experiment) | Git: `packages/git/rust/src/wal.rs:43`, `:1076-1081`; ES setup fix: `src/setup/event-store-fixes.mjs:28-35` (checks and chmods only `locks`); `realDirectory` `:9-16` creates missing parents 0700 but never checks the mode of existing ones | A group-writable `.git/fgos` (any `mkdir -p` under umask 002, a common Ubuntu default) makes every Git WAL door refuse, including `fgos setup` itself. The refusal is misnamed "repository-identity-changed", so the next step is impossible to guess. No production path that creates a 775 `.git/fgos` was found: the Node fix uses 0700, and the WAL `DirBuilder` uses 0700 (`wal.rs` child creation) | Git (cross-layer note): give `Untrusted` from a mode or owner check its own cause and path (`git-wal-untrusted-directory: <path> mode 775`). ES: `fixEventStoreLockDirs` also verifies `.git/fgos` and `.git/fgos/events` (mode 0700, owner) and the open-root doctor row reports it |
| C3 | A stability | Medium | inferred | `packages/git/node-addon/src/event_store.rs:251-266` (`write_refusal: OnceLock`, `write_readiness(...).err()` stored for the lifetime of the store); `src/event-store/native.mjs:47-63` (the `prepared` map caches the store per process forever) | Any admission error is memoized as a permanent write refusal for that process, transient ones included (`git-timeout`, `git-wal-unreadable` while a WAL record is mid-install, `remote_url` failure). A long-lived runner or gateway then refuses every Work write until restart. A pass is also memoized forever, so a later fence or HEAD change is never re-asked in that process | Memoize only a pass, plus the refusals `write_readiness` itself raises for repository state (`event-store-migration-required`, `event-store-refspec-missing`); never memoize a `git_error` or I/O. Or key the memo on the HEAD and refs the admission observed |
| C4 | C cost / stability | Medium | reproduced by baseline (2.97 s against 0.84 s), code read | `bin/fgos.mjs:5297-5300` (end trigger for every `opensEventStore` verb, including `STORE_MISSING_WARNING_VERBS` `list`/`show`, `:4804-4807`, `:4826-4832`); `src/event-store/maintenance.mjs:41-43`; `sync.rs:272-284,365-368,448-460` (`event-seal` held across up to two fetches and a push); the Git transport bound is 120 s (`packages/git/rust/src/remote.rs:90`, `driver.rs:578`) | The sync on a read is the **caller's choice** (CLI end trigger, spec §21 note at line 1171), not a store rule. The user's prompt waits for it. With a hanging network, `event-seal` is held for up to about 3×120 s. Meanwhile every seal child times out after 5 s and returns `busy`, and the gate's seq-recovery path (`consumer-event-gate.mjs:89-93`, a waiting seal) fails with `event-store-lock-timeout` | Move the due sync onto the existing detached door: `handSealsToChild` already spawns `fgos events …` after the answer is printed. Spawn `events sync --opportunistic` there instead of running it inline. Semantics belong to WORK, so this is a proposal |
| C5 | B error path reports success | Medium | inferred (code), partly observed | `bin/fgos.mjs:5299` (the return `{error}` of `maintainEventStore` is ignored); `bin/fgos.mjs:4821-4824` (`spawnDetachedCli` without `logPath`, and its `{pid:null,error}` ignored); `src/verbs/events/seal.mjs:27-29` (`busy` after the wait gives exit 0); `consumer-event-gate.mjs:83-86` | A failing end-trigger seal or sync, a refused spawn, and a seal child that errors or gives up all leave no trace. The only signal is doctor `event-store-unsealed` after 600 s (warn) or 3 600 s (fail). Lifecycle events (`sealOnWrite`) can then stay unsealed until the next command | Print the trigger's `error` to stderr once, in the existing pattern of the Land warning at `bin/fgos.mjs:5302`. Give the seal child a `logPath` under `.fgos/runtime/` that the existing spawn door already supports (`detached-child.mjs:275-278`) |
| C6 | F contention | Medium | reproduced (no failure) plus a calculation | `src/state/hot-lock.mjs:198-212` (link record, 10 ms poll, fixed 5 000 ms deadline, no FIFO) | The 20-session `hot-lock-timeout` is neither a lock held across a network or Git call nor a store limit. The gate holds `state` across readInGate, 3 append fsyncs and the cache write (baseline: increment p50 about 28 ms, dev profile). The poll lock is **unfair**: with N contenders a waiter wins a release with probability about 1/(N-1). At N=20 and a tx of about 50 ms, P(one wait > 5 s) is about (18/19)^100, roughly 0.5 %, so over 200 mutations a timeout is likely. Release build, 20 parallel `fgos edit` on one item in the clone: 20/20 ok, 8.45 s wall at load 8.6→11.1, receipts contiguous, 0 integrity errors, no child left | Not the store's code. The state store owns the mutex (outside scope). Record it as a structural limit: the bound is fairness, not throughput |
| C7 | A, DRY | Low | inferred | `sync.rs:121-135` (`streams`, which fails on `NotFound`), a twin of `diagnostics.rs:11-30` | `fgos events sync` before any setup or append fails with an opaque `NotFound`, the same way as C1 | Delete `sync::streams` and call `diagnostics::streams` |
| C8 | E robustness | Low | **reproduced** (modes observed) | `append.rs:142` (`create_dir_all`), `:253-256` (`OpenOptions` default mode); `layout.rs:112` | Locks must be 0700 (`locks.rs:411-430`), but the open log is created at umask modes: `project/` 775 and `active.jsonl` 664 were seen in the clone. Under umask 002, a member of the user's group can rewrite unsealed events and recompute the batch `sha256`. The threat model is single-user machines, hence Low | Create the stream directories 0700 and the files 0600 through the same door `prepare_stream`, matching the locks rule |
| C9 | B error masking | Low | inferred | `consumer-event-gate.mjs:89-93`; `seal.rs:84-118` | The seq-recovery retry calls a **waiting** `store.seal`; if it fails, its error replaces the original `event-store-seq-recovery-conflict`. In `seal_checkpointed`, a failing `Receipt::read` or `segments` while writing `integrity.json` replaces the original `ref-moved` or `seal-mismatch` code | Keep the original code and attach the secondary failure in the detail, as `sync.rs:597-604` already does |
| C10 | A durability semantics | Low | inferred | `append.rs:269-283` | When `fsync` fails after a complete write, the caller gets an error, yet the batch, marker included, may be durable and will be folded later. A user retry then writes the intent twice (with a different `seq` and `h`) | On a post-write failure, truncate to the pre-append length before releasing `event-append` (`recover` already owns truncation, `append.rs:119-128`); if truncation fails, report "may be durable" |
| C11 | D Windows | Low | inferred | `locks.rs:415-423` (non-unix gives `EventStoreLockDirInvalid` "run setup fix") | On Windows the lib refuses as a misnamed "run setup fix" that no fix can satisfy. It stays latent because the addon (`event_store.rs:20-25`) and Node (`native.mjs:10-12`) refuse first with `event-store-unsupported-platform`. `identity.rs:52-58` refuses by name. No lib path silently differs | Return `EventStoreUnsupportedPlatform` there. Gate the 11 test targets with `cfg(unix)` (list in the baseline §5) |

**The detached seal child: bounded, and can it be orphaned?**

- It is bounded. The lock waits are 5 s each (`locks.rs:310,383-388`), the local Git children have 30 s timeouts (`driver.rs:315` and siblings), and there is no network. It runs no triggers (`bin/fgos.mjs:4829-4830`).
- It is detached by design (`setsid`, `unref`). An orphaned child cannot hold a lock past death, because holder-lock reclaims dead holders.
- Observed: after 20 parallel edits, every child had exited within about 8 s and everything was sealed.
- The real gap is observability (C5), not orphaning.

## Tables

### Migration

| Item | From | To (receiving layer) |
|---|---|---|
| Rank or `seal-under-state` guards | `src/event-store/native.mjs:13-26` | already enforced in Rust (`locks.rs:322-332,447-461`, addon `context()`); delete the Node copy and keep only the `hotLockDepth()` value passed in |
| Sync-due rule | `src/event-store/maintenance.mjs:10-13` | Rust `diagnostics::maintenance` returns `syncDue`, mirroring `seal_if_due` |
| Unsealed thresholds (3 600 s, 2× interval) | `src/setup/event-store-checks.mjs:73-74` | Rust status verdict (ES) |
| Refspec overlap | `src/setup/event-store-checks.mjs:15-24` | Rust `refspec.rs` (ES) |
| Damaged-history code set | `src/state/work-event-store.mjs:16` | an error category from the generated result-code registry (ES contracts) |

### Delete list

| Path | Lines | Why |
|---|---|---|
| `sync.rs:121-135` `streams` | about -15 | twin of `diagnostics::streams` (C7) |
| `native.mjs` `ranksOf`/`outsideGate` rank checks | about -12 | Rust owns them |
| `maintenance.mjs` `syncDue` | about -6 | moves to Rust |
| `event-store-checks.mjs` `overlaps` and the threshold arithmetic | about -15 | moves to Rust |
| `work-event-store.mjs:16` `DAMAGED_HISTORY` | about -8 | replaced by the registry category |

### Doctor

| Row | Keep | Change |
|---|---|---|
| all 10 rows | yes | `event-store-open-root` also checks that `.git/fgos` and `.git/fgos/events` are not group- or other-writable (C2), and reports an absent root as "run fgos setup" instead of an exception |
| fix `event-store-lock-dirs` | yes | also repairs the parents' modes (C2) |

### Tests (one owning proof each)

| Behaviour | Owner |
|---|---|
| A read of a clone with no open root answers like an empty store, then refuses with `event-store-refspec-missing` | extend `tests/reader_review_regressions.rs` (next to `tracked_fence_without_fetched_legacy_is_refspec_missing`, which today runs with the root present) |
| `own_bounds` and `diagnostics::streams` agree on an absent root | the same suite; no new file |
| An admission refusal from a transient Git error is not memoized | addon test next to `test/event-store/door.test.mjs` |
| A group-writable `.git/fgos` is reported by the open-root row and repaired by the fix | extend `test/setup/event-store-checks.test.mjs` and `event-store-fixes.test.mjs` |
| H31-A (mirror differs from the pin is refused) | still open for WORK; the code exists at `legacy_import.rs:734-753` |

## Proposed additions (RUL104: owner chooses)

1. **The CLI read verbs stop running sync inline (C4).** Problem: `list` costs 2.97 s once per 300 s and can block for minutes offline. Evidence: baseline §2; `sync.rs`; `remote.rs:90`. Benefit: a read never pays for the network. It reuses the existing detached door, so no new mechanism is added; WORK decides.
2. **`fgos setup` sets a per-clone `fgos.machineId`** when the machine id is already the published ref of another clone. Evidence: two clones on one machine share `refs/fgos/events/fg-server2-jdp2bv`; sync warns `event-store-machine-ref-shared` and converges (reproduced). Benefit: one warning class fewer. This is a behaviour change, so it is WORK's call.

## Rejected hypotheses

- **Lost, duplicated or reordered events under 20 concurrent writers:** rejected. Reproduced in the clone: 20/20 succeeded, the receipt stays contiguous (`lastSeq 42`, one certified tip), there are 0 integrity errors and 0 deferred events.
- **Two clones sharing one machine id diverge:** rejected. Reproduced: `work` and `work2` both wrote, synced in the order work→work2→work, and both read priority 10002; doctor warns `machine-ref-shared`.
- **A seal deletes a segment before its receipt is durable:** rejected. It writes the receipt durably (`seal.rs:355-372`), then removes the segment and fsyncs the directory (`:388-391`); a crash in between is recovered by `find_segment` (`:242-258`).
- **Rotation or append is missing a directory fsync:** rejected. See `rotate.rs:71-76`, `append.rs:141-150,279-281`, and identity init `identity.rs:155-161`.
- **The seal child can be orphaned while holding locks:** rejected (see above).
- **The fresh-clone write failure comes from a copied WAL or the real checkout's state root:** rejected (§0, chmod experiment).
- **The `hot-lock-timeout` is a lock held across Git or the network:** rejected. Spawns in the gate are 0 (baseline), and admission runs before the gate (`consumer-event-gate.mjs:38`); the remaining cause is fairness (C6).

## Gaps

- `fgctl init` fails in a fresh clone of this repository: the pinned release lacks `nativeAddon`, and `--from` gives `pin-mismatch`. This is the first wall for mission #1, but it belongs to Distribution, not this seat; reported only.
- C3, C5 and C10 are inferred from code, not reproduced.
- The 20-session benchmark was not rerun. The CLI-level parallel run is a different shape, staggered by process start.
- **Side effects outside the clone:** runs used the machine-wide state root (session or process records may have been written there), and the machine id was only read. All clone directories are deleted.

Status: DONE_WITH_CONCERNS
Summary: The fresh-clone read failure is `receipt::own_bounds` treating an absent open root as an I/O error (reproduced; one-line fix shape). The `repository-identity-changed` write refusal is the Git WAL rejecting a group-writable `.git/fgos` (reproduced by flipping one chmod), and in WORK's order (setup, list, edit) everything works. Plus three Medium stability findings: a sticky admission refusal, sync on read verbs holding `event-seal` across the network, and silent trigger and seal-child failures.
Concerns/Blockers: `fgctl init` fails in a fresh clone (Distribution). To reach `fgos setup` I wrote the activation tombstone by hand, as `fgctl init` would on success.
