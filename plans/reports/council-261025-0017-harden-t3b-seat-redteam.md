# HARDEN T3 part 04b council, red-team seat: Event Store

HEAD `52149c6cd` (main; docs-only commits on top of `c7522c86d`, no code change in scope). Seat: red-team (adversarial). Written 2026-10-25 00:20 to 00:45 (Asia/Saigon). Load average 5.3 to 10.8 (1 min) during the runs.

## What I ran

All runs were outside the real repository. I made no edit and no git mutation there, and ran no `fgos` verb.

- I made a throwaway clone at `/home/vantt/projects/forgent-worktrees/t3b-seat-redteam-clone`, a private ext4 Cargo target at `…/t3b-seat-redteam-target`, and `TMPDIR` at `…/t3b-seat-redteam-tmp`. All three are deleted at the end.
- In the clone only, I added one probe file, `packages/event-store/rust/tests/redteam_probe.rs`, built on the crate's own `sync_support` World (real bare remote, real clones).
- I ran it with `cargo test -p fgos-event-store --test redteam_probe -- --nocapture`. It holds 11 probes; the results are quoted per finding as P1 to P9.
- `cargo check -p fgos-event-store --all-targets --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`.
- `timeout 20 git ls-remote ssh://192.0.2.1/x.git`, and the same over https, from `/tmp`. These measure git against a blackholed remote.
- I ran no Node test, so every Node-side claim below rests on reading the code.

## Part A: target shape (red-team view)

- **Authority.** The store owns bytes, `seq`, framing, seal, ref publication, mirror authentication and order. It is not the authority for the Work gate (`withStateTx`), the cache view, or sync-due policy.
- **Store authority boundary.** Each foreign mirror is verified on its own *in the reader too*, not only in sync. Today one bad peer ref fails every read on every machine (RT1).
- **Store owns its first use.** On a missing open root, a read returns empty history. A write refuses with a named code and a next step (RT3).
- **Hot mutex.** The Event Store does not need `withStateTx`.
  - Its own exclusion is `event-append` (`locks.rs:319-350`, kernel lock, rank 70) together with the own-stream CAS in `append.rs:203-209` (`stale-cursor`).
  - Work needs the mutex for read-check-append and for staged effects plus the cache write (`consumer-event-gate.mjs:48-80`, spec §13).
  - The 20-session `hot-lock-timeout` belongs to that Work mutex. It is a polling `link()` lock, 10 ms poll and fixed 5 000 ms bound (`src/state/hot-lock.mjs:32-33`), with no FIFO.
  - It is held across the append's three fsyncs and a rewrite of the full 8.46 MB view (`consumer-event-gate.mjs:71,79`). Under contention, polling barging gives the tail the baseline saw: 4.2 s maximum at 15 sessions.
  - So this is a property of the Work gate, made worse by a dev build under strace. It is not a store limit and not a store bug. I did not rerun the benchmark (inferred).
- **Rust/Node boundary.** The platform decision, the rank-60 refusal and the sync-due rule live in Rust only. The Node facade becomes marshaling plus the consumer gate. Node budget: about −40 lines (RT14 twins); exports unchanged (`index.mjs` 14 names).
- **Doctor.** Keep the 10 rows and add none. Two rows change their body:
  - `event-store-integrity` also reports `sync.json` warnings (RT9);
  - `event-store-open-root` names the setup fix instead of a raw `ENOENT` (RT3).
- **Size.** My fixes are small changes inside existing functions: Rust about +60/−20, Node about −40, tests extended in the owning files. Layer net ≤ 0 holds if the other seats' deletions land.

## Part B: findings

| ID | Axis | Sev | Repro | file:line | What goes wrong | Fix shape |
|---|---|---|---|---|---|---|
| RT1 | A, B | High | reproduced (P3, P4, P6) | `read.rs:262-265`, `read.rs:709-725`, `read.rs:668-676`; `walk.rs:45`, `walk.rs:184`; contrast `sync.rs:229-237` | Every mirror under `refs/fgos/remotes/*` is walked inside the read with `?`. One peer ref that is malformed fails **every Work read on every machine** that fetches it. The cases I reproduced: an invalid machine name (`refs/fgos/events/EVIL` gives `event-store-integrity: invalid machine in ref`); a valid name whose header names another machine (`event-store-ref-tampered`); a 33 MiB `events.jsonl` (`Git: blob-too-large`). Sync treats the same mirror as a warning and carries on (P3, P4, P6 sync: `Ok([warning])`), so sync and read disagree. The trigger is anyone with push access or a peer on a buggy release. Refs never rewind, so the wedge is permanent until someone deletes the ref on the remote | Apply spec §14 "each mirror is verified on its own" in `read_from`: a foreign mirror that fails is skipped and reported (in the read result and the status), as in sync. The own-machine mirror stays fatal. Owning proof: next to `reader_review_regressions.rs:233` |
| RT2 | A, F | High | reproduced (P9) | `identity.rs:249-255`; spec `docs/platform/event-store/spec.md` §5 ("Moving the clone moves the file, so the store keeps its id"), §8 layout, §14 machine-ref-shared advice | `mv ~/proj ~/proj2` (same filesystem, same inode) and the documented fix for `event-store-machine-ref-shared` (`git config fgos.machineId <other-id>`) both make `StoreIdentity::open` refuse with `event-store-store-moved … explicit move confirmation required`. No such confirmation door exists in code, spec or doctor. The addon read opens the identity first (`packages/git/node-addon/src/event_store.rs:478-483`), so every Work read and write of that clone fails. The spec's layout omits `commonDir` and `commonDirDevIno`, so spec and code disagree | (a) In `open`, accept a different path when `dev:ino` matches, and rewrite `store.json` under `event-append`. A copy has a new inode, so the guard against two clones sharing an origin stays. (b) Correct the spec §14 and doctor advice: change `fgos.machineId` only in a clone with no `store.json`. A re-key door is a proposed addition. Owning proof: `registry_identity_layout.rs:158-184` (it asserts the copy refusal; add the moved-path pass) |
| RT3 | A, F, G | High | reproduced (P1, P1b) | `receipt.rs:91` (`own_bounds` `read_dir` gives `io(NotFound)`), called unconditionally at `read.rs:702`; same pattern at `sync.rs:123`, `seal.rs:613` | This is the cause of the baseline's fresh-clone `event-store-io: NotFound`. A missing `.git/fgos/events` is treated as an I/O error, not as "no receipts". An empty directory reads fine (P1b: 2 events). It hits mission #1 directly: every project clone fails every read until someone creates the root. It also hits the Rust host's Work source (`packages/work-state/rust/src/event_reader.rs:47`, used by `work_source.rs:454`, `legacy_friction.rs:52`) | `own_bounds` (and the other `read_dir`s of the root) return empty on `NotFound`. A write already refuses by name, `event-store-lock-dir-invalid … run setup fix` (`locks.rs:422-427`). The doctor `event-store-open-root` body (`src/setup/event-store-checks.mjs:87`) names `fgos doctor --fix` instead of a raw ENOENT |
| RT4 | A, F | Medium | reproduced (P7, P8) | `read.rs:473-479` (checkpoint error then walk from zero); `read.rs:626-636`; `src/state/work-event-store.mjs:54-56` (ignores `read.checkpoint`, keeps a stale `retained` on failure) | A peer ref rewound by force-push, forge edit or a secret purge, followed by any plain `git fetch` (the configured `+` refspec, spec §14), gives two behaviours. (a) The CLI path continues from the checkpoint, fails `mirror-rewound`, silently walks from zero and **drops the peer's events from the Work view** (P8: 3 events, then 2, only `checkpoint.ignored` set, which nobody reads). (b) A long-lived runner or gateway keeps its retained cursor and fails every read with `event-store-mirror-rewound` until restart (P7). Sync keeps the old tip as a permanent warning (P7 sync). So the same input gives three answers | One rule in the reader: a rewound foreign mirror is the RT1 case (skip it, report it). The Node consumer surfaces `checkpoint.ignored` and `mirror-rewound` as a warning and drops `retained` on a failed read |
| RT5 | B, C, G | Medium | partly reproduced (git hang); trigger path inferred | `packages/git/rust/src/publication.rs:201,217` (`transport_timeout` 300 s); `remote.rs:24-38` (no `ConnectTimeout`); `src/event-store/maintenance.mjs:73-75`; `bin/fgos.mjs` lifecycle sets `STORE_MISSING_WARNING_VERBS` | A remote that drops packets (VPN down, captive portal) makes `git ls-remote` hang: still running after 20 s for both ssh and https. The opportunistic sync runs at the end of read verbs (`list`, `show`, …) once per 300 s. It can keep the process alive up to the TCP connect timeout, bounded only at 300 s per call, while holding `event-seal`, so every seal child gives up after 5 s and returns `busy`. This answers part of "read cost": sync on a read verb is the caller's choice (`bin/fgos.mjs` classifies `list`/`show` as store-opening; spec §16 sets the rule), not the store's | The opportunistic sync passes a short `with_transport_timeout` (the door exists, `publication.rs:226`). `transfer_argv` adds `-oConnectTimeout` and `http.lowSpeedLimit/Time`. A WORK review question: should read verbs carry the end-of-command sync at all? |
| RT6 | B | Medium | reproduced (P5, P5b) | `packages/git/rust/src/wal.rs:12` (`MAX_RECORD` 64 KiB); `publication.rs:1402-1447` (one intent lists every advertised `refs/fgos/events/*`) | With about 300 or more machine refs on the remote, every sync on every machine fails with `Git: wal-record-too-large`: 250 refs passed, 400 failed. Refs only accumulate. The spec has no retire verb, a reinstall mints a new id, and an ephemeral container or CI machine adds one each time. One push of junk refs also triggers it | Chunk the fetch mappings into several transfers under one seal scope, or record a digest of the targets instead of the list (Git's `PathSet::Digest` pattern, `wal.rs:107-121`). This is Git's code; hand it to the Git lane |
| RT7 | F, G | Medium | reproduced (compile and code) | `src/event-store/native.mjs:120-122`; `src/event-store/consumers.mjs:7-11`; addon `event_store.rs:20-26`; `identity.rs:52-57`; `wal.rs:1084-1088`; `CHANGELOG.md:33`; ES plan D15 | All Work verbs refuse on **macOS** as well as Windows after the cutover. CHANGELOG and D15 say "Windows" only. The baseline's "aarch64-apple-darwin clean" is compile-only: the lib refuses at runtime on non-Linux (`dev_ino`, WAL), so the whole test suite would fail on a Mac. The brief's framing ("which targets need `cfg(unix)`") is wrong; they need `cfg(target_os = "linux")`. The Rust host reader (`event_reader.rs`) is not platform-gated, so on Windows and macOS it fails with RT3's opaque `NotFound` instead of `unsupported-platform` | Correct CHANGELOG and D15 to name macOS. Put `#![cfg(target_os = "linux")]` on the 11 failing test targets and the helper modules (list below), and drop the scattered `cfg(unix)`. Fix the `export.rs:45` `mut`. Gate `event_reader::events` the same way |
| RT8 | A, B | Medium | inferred | addon `event_store.rs:62-64,251-267` (`write_refusal: OnceLock`); `native.mjs:157-173` (store cached per process) | Write admission is asked once per store per process and cached, the refusal included. A long-lived runner or gateway that first saw `event-store-refspec-missing` (fresh clone, legacy mirror not fetched yet) keeps refusing every write after `fgos events sync` fixes it. A cached "admitted" is never re-checked when the legacy mirror later differs from the pin (the H31-A path) | Cache only success, or key the cache on the listed legacy tips (already read in `write_readiness`, `legacy_import.rs:708`) |
| RT9 | F, G | Low | reproduced (P3, P4, P6, P7 put warnings in `sync.json`) | `src/setup/event-store-checks.mjs:112-121`; `diagnostics.rs:241,257` | Sync records `ref-tampered`, `mirror-rewound`, `blob-too-large` and legacy-mismatch warnings per mirror, but no doctor row reads `status.sync.warnings`. The rows stay green while a peer's history is refused | `event-store-integrity` also fails or warns on `status.sync.warnings` (no new row) |
| RT10 | F | Low | reproduced (P2) | `packages/git/rust/src/wal.rs:43,1077-1081` | A group-writable `.git/fgos`, for example after `mkdir -p .git/fgos/events/locks` under Ubuntu's umask 002, is refused as `repository-identity-changed`. That is almost certainly the baseline's unexplained write refusal (its clone was hand-made; the test fixtures chmod 0700 for exactly this, `tests/sync_support/mod.rs:81-83`). The setup fix creates 0700 (`event-store-fixes.mjs:9-16`) and is not affected | Name the cause: `git-wal-untrusted-mode <path>` or similar, plus the next step. Git's code |
| RT11 | A | Medium | inferred | `src/runner/loop.mjs:999-1013` (`executor.dispatch` carries `command`, `governance`); `store.mjs:1250-1270` (`work.attempt` actor, branch); spec §22 "Erasing a secret … needs a history rewrite" | Classes pushed to the remote, irreversibly, in `project` events: spawned command lines (can carry credential-bearing argv), governance blobs, writer and session ids, hostnames inside machine ids, free-text answers. The spec's only remedy, a history rewrite, is refused by the store itself: P7 and P8 give a permanent `mirror-rewound` and a refused own ref (`sync.rs:410-424`, `event-store-ref-moved`). No verb accepts a rewritten history. I checked no event value | Document the operational purge path, or accept that none exists. A redaction rule for `executor.dispatch.command` is a WORK question |
| RT12 | F | Low | inferred | `order.rs:14` (key `ts, origin, stream, seq`); spec §6 "`ts` … informational and a last tie-break only" against §12 | `ts` is the *first* key among ready concurrent nodes, and append never bounds it (`append.rs:178`). A machine whose clock runs behind wins every concurrent race (it applies first; the other side records the conflict). Spec §6 contradicts §12 | Correct §6. A skew bound at append is a proposed addition |
| RT13 | A | Low | inferred | `envelope.rs:111-115`, `append.rs:183-188`; spec §7 rule 3 | `seen` may name a `branch:*` or `local` position on a `project` event. Those never publish, so on other machines the event and its causal suffix stay deferred forever, and certification stops (`read.rs:744`). Today's consumers read only `project` or `project:porting`, so this is latent | In append, refuse non-`project`-scope keys in `seen` for a `project` stream |
| RT14 | E | Low | reproduced by reading | platform rule in 3 Node and Rust places (RT7); rank 60 in `native.mjs:130-135` and in Rust `locks.rs:444-457` via addon `context()`; `syncDue` in `maintenance.mjs:42-45` | Node still decides the platform, the seal context and sync-due, all of which Rust already decides or holds the facts for (`diagnostics.rs:85` returns `lastAttempt`) | Delete the Node copies; Rust `maintenance` answers `syncDue` |

### Answers to the brief's questions (red-team view)

- **Fresh clone.**
  - `NotFound` comes from RT3 (`receipt.rs:91`). It is a missing-root bug, not a setup gap.
  - `repository-identity-changed` comes from RT10, an artefact of the baseline's hand-made directories.
  - The store should read empty and refuse a write by name. The setup fix already exists.
- **Read cost.** The sync on a read verb is the caller's (and spec §16's) choice, not a store rule. The red-team risk is RT5 (unbounded wait), not the 2 s.
- **Write contention.** The timeout is the Work gate's polling fairness and the work done in-gate (see Part A), not the store.
- **Node twins.** See RT14.
- **Windows.** See RT7. 11 targets fail: `append_recovery`, `kill_append`, `offline_sync`, `reader_seal_stress`, `seal_cas_race`, `seal_publication`, `shared_machine_id`, `sync_review`, `three_clones`, `v_event`, and the lib test (`refs.rs:116,127`). Helpers `reader_support/mod.rs` and `sync_support/mod.rs` are the common cause. That matches the baseline. One lib warning at `export.rs:45`. The lib path differs on non-Linux: `locks.rs:117-125` says "run setup fix" on Windows, which no fix can satisfy, but the addon refuses first.
- **Seal child.**
  - It is bounded: 5 s lock wait (`locks.rs:383`), git calls with timeouts, no network.
  - It is detached by design, `setsid` with no IPC (`detached-child.mjs:22`), so it survives the parent and SIGHUP. That is intended, not an orphan bug.
  - Its output is discarded (no `logPath`, `bin/fgos.mjs` `handSealsToChild`). Failures show only as doctor `event-store-unsealed`.
  - Concurrent children serialize on `event-seal` and later ones exit `busy`.
  - While RT5's sync hangs, every child gives up.
- **kill -9.** The append, rotate, publish and receipt crash points are covered by `fsio::Point` injection and `kill_append.rs`. The Git WAL makes fetch and push recoverable (`publication.rs:1451-1497`, `recover_publications`). I found no new crash gap.

## Tables

**Migration (receiving layer)**

| What | From | To |
|---|---|---|
| platform refusal | `native.mjs:120-122`, `consumers.mjs:7-11` | addon `available()` only |
| rank-60 or seal-context refusal | `native.mjs:130-135` | Rust `validate_seal_context` (already called) |
| sync-due rule | `maintenance.mjs:42-45` | Rust `diagnostics::maintenance` answer |

**Delete list:** the three Node twins above (about −40 lines). Nothing else from my lens. `events migrate` must stay while user projects on other installs are unmigrated (mission #1).

**Doctor:** the same 10 rows. Body changes in `event-store-integrity` (RT9) and `event-store-open-root` (RT3).

**Tests (extend the owning file; no new file)**

| Behaviour | Owning file |
|---|---|
| a bad foreign mirror is skipped and reported, and the own mirror is fatal (RT1, RT4) | `tests/reader_review_regressions.rs` |
| read on a missing open root is empty (RT3) | `tests/reader_review_regressions.rs` |
| a moved path with the same `dev:ino` opens, and a copy refuses (RT2) | `tests/registry_identity_layout.rs:158` |
| fetch past 400 refs (RT6) | Git's publication tests |
| refuse `seen` naming a branch or local stream (RT13) | `tests/v_event.rs` |
| the `#![cfg(target_os="linux")]` gate on the 11 targets (RT7) | — |

## Proposed additions (RUL104: only if the owner picks them)

1. **A re-key/move door for `store.json`** (`fgos events adopt-store`, or a setup fix).
   - Problem: RT2 case (b) and cross-filesystem moves.
   - Evidence: P9.
   - Benefit: the machine-ref-shared advice becomes safe.
2. **A payload or segment size bound at append or seal**, so that no sealed segment can exceed the reader's 32 MiB per-blob cap (`driver.rs:2689`).
   - Problem: a single oversize segment wedges every reader permanently (P6 shape, self-inflicted).
3. **A `ts` skew bound at append.**
   - Problem: RT12.
4. **A purge procedure for leaked secrets** that the reader and sync can accept.
   - Problem: RT11.

## Rejected hypotheses

- **Locale-dependent `No such remote` match** (`legacy_import.rs:761-763`): rejected, because the driver forces `LC_ALL=C` (`driver.rs:1132-1133`).
- **Credentials in the remote URL leaking into `sync.json` errors:** rejected, because a URL that carries credentials is refused (`remote.rs:56`).
- **Fetch writing the own ref or branch/local refs:** rejected. Only `events/*` and `legacy` are advertised and mapped into mirrors (`publication.rs:1405-1427`).
- **Unbounded per-process memo growth:** rejected, `CommitMemo` clears at its limit (`commit_memo.rs:45`).
- **`realDirectory` refusing symlinked ancestors:** rejected, because the open root is canonical (`layout.rs:63`).
- **OOM from a huge blob:** rejected. It is capped at 32 MiB per blob and 64 MiB of output (`driver.rs:2618,2689`), so it fails by name (RT1 instead).

Status: DONE_WITH_CONCERNS
Summary: The red-team review reproduced 9 store issues with a throwaway crate probe. One peer ref can wedge every machine's reads (RT1). Moving a clone, or following the documented machine-id fix, bricks the store (RT2). The fresh-clone `NotFound` is `own_bounds` treating a missing root as an I/O error (RT3). The baseline's `repository-identity-changed` is a group-writable directory it made by hand (RT10). macOS refuses Work too, so the tests need `cfg(target_os="linux")`, not `cfg(unix)` (RT7).
Concerns/Blockers: RT5, RT8, RT11 and the hot-mutex analysis are inferred from code, and I did not rerun the 20-session benchmark. RT6 and RT10 are Git code; RT1, RT2 and RT4 change store semantics and need WORK review.
