# HARDEN T2 red-team (Git + terminal-control)

`git rev-parse --short HEAD`: **`8ec0212d3`**. 2026-10-23, Asia/Ho_Chi_Minh (the zone file `Asia/Saigon` is not installed; the clock is +07). Seat: red-team, different family from the three reports under attack.

Seats reviewed older tips (`correctness` `3bc2c1059`/`a7d508e8a`, `speed` `9d13d9f5f`, `simplicity` `2f3ad28af`/`3bc2c1059`). `git log 9d13d9f5f..HEAD -- packages/git packages/terminal-control src/git src/terminal-control src/runner/dispatch/worker-session-boot.mjs src/setup` is empty, so their `file:line` on those trees still names current source. One terminal-skill fix landed after the simplicity read (`80159fd23`); that is called out where it falsifies a claim.

**What I ran.** Read-only. No cargo, no `node --test`, no `npm test`, no git mutation, no doctor re-run. Re-read the three seat reports, the brief, the criteria severity table, and the cited production lines on this HEAD. Re-counted this checkout's WAL (`322` operation dirs, `12` compacted receipts). Re-counted the speed seat's own traces at `/home/vantt/projects/forgent-worktrees/t2-seat-speed-r2/trace-n1.log` and `trace-n3.log`, and re-read `bench-a.json` / `bench-y.json` / `bench-x.json`. A scratch `git init` to prove `remote get-url` on an scp-style URL was refused by the read-only filesystem; that half of RT01 stays inferred. `fgos identity --json </dev/null` was run once, to check the skill parser the later fix uses.

This is not an exhaustive line-by-line clearance of the 35 k-line Git crate. Findings below are the ones I opened.

---

## Missed findings

### RT01 — A normal SSH origin is classified Remote, then every sequence claim is refused

**A/F · High · Inferred** (control flow read; not executed). `packages/git/rust/src/sequence.rs:68-74`; scheme ladder `packages/git/rust/src/remote.rs:59-66`; caller `packages/identity/rust/src/mint.rs:166-177`.

`sequence_home` maps every successful `remote get-url origin` to `SequenceHome::Remote`. `transfer_url` then accepts only `/…`, `file://`, `https://`, and `ssh://`. GitHub's default SSH clone URL is `git@github.com:org/repo.git`. That string has no `://`, so `get-url` succeeds, home is Remote, and `sequence_tip` / `sequence_push` return `remote-protocol-not-supported`. There is no fall-back to the local counter, which is the opposite of CF07 and the worse one for this input: the clone has an origin, so mint must not allocate locally, and it also cannot reach the remote.

This checkout's origin is `https://github.com/vantt/forgent`, so it does not hit here. The door is `fgos identity mint`, which the id-minting instruction makes a main flow for `d-adr` and `decision-file`. None of the three seats named the scheme gap. Correctness read this file and stopped at "any error becomes Local", "any `!` is Stale", and "no local fsync".

**Fix shape:** teach the existing scheme ladder the scp form (`user@host:path` → `ssh`, userinfo still through `url_has_credentials_or_controls`), or refuse at `sequence_home` with a named cause before a claim is attempted. Do not add a third transport. Do not map this error to Local (that is CF07).

### RT02 — Compacting ConfigChange chains would destroy hook provenance

**B · Medium · Reproduced by reading.** `packages/git/rust/src/repository_config.rs:688-689`.

The comment is the protocol: "Config ownership chains stay retained." `hooks_provenance` walks non-compacted ConfigChange chains to decide who owns `core.hooksPath`. This checkout holds 2 such chains (4 records each). The speed seat counted them inside F-C1's "nothing ever removes them" and did not say the retention is required. A fix that compacts "every pin-released chain" deletes the provenance the doctor and the hooks remover read.

**Fix shape:** compact Worktree and Refs only. Leave ConfigChange on the retained path until a receipt field actually carries hook ownership. Not a new journal.

No other unread-tail defect rose to a cited finding. I did not finish `land.rs`, `restore.rs`, or `scoped_commit.rs`.

---

## Verdict on each High and reproduced Medium finding

### High

**CF01 — unavailable route unlinks a live herdr socket. Reproduced. High stands.**

`src/runner/dispatch/worker-session-boot.mjs:34-40,80-90`. `serverAnswers` returns false on every throw. `createTerminalControl` throws `TerminalControlError` for a missing host, a 60 s route timeout, a version mismatch, empty stdout, and non-JSON (`src/terminal-control/client.mjs:41-45,51-78`). The probe is a host-route probe, not a read of the socket. A live herdr server whose route fails is unlinked, then a new `herdr --session <name> server` is spawned (`:90`). The same false is returned when the route succeeds and `serverIncarnation` is null: the core stores `.ok()` (`packages/terminal-control/rust/src/core.rs:681`) and the contract allows null (`packages/terminal-control/contracts/terminal-control.port.v1.json:116`). I did not repeat the seat's injected run; the branch is the function. Live-service impact (old server still bound to the unlinked inode, new server on the path) remains inferred. Severity High is right: confined worker startup is a main flow, and the mis-classification is not a rare layout.

**F-C1 — Worktree and Refs chains are never compacted, and admission re-reads them. Reproduced. Severity should be Medium, not High.**

`finish_worktree` appends Outcome and calls `release_pin` (`packages/git/rust/src/worktree.rs:509-535`). `release_pin` appends `PinReleased` and returns (`refs.rs:336-396`). `change_ref` admits and does not compact (`refs.rs:697`). `wal.compact` is called from Publication, Land, and ScopedCommit/Sync only. `admission_with_land` calls `scan(100_000)` then `active(100_000)` (`refs.rs:126-130`). `scan` inspects every non-compacted chain (`wal.rs:2415-2420`); `active` calls `retained`, which inspects them again (`wal.rs:2351-2374`). Worktree add calls that admission (`worktree.rs:474`).

On-disk recount, this checkout, this read: **153 WorktreeCreate, 167 WorktreeRemove, 2 ConfigChange, 322 dirs**. The seat's 166/153 split is off by one; the total matches. 320 chains have 6 records, the 2 config chains have 4. Compacted ledger: 12 files, all `"v":2`. Their `inspectGit` 7.7 ms / 28.5 ms figures were not re-timed.

Criteria §2.2: High is a wrong result, a hang, or a broken main flow. This is measurable weight (their +22 ms at 120 chains, 28.5 ms per scan at 322). Medium. It becomes a refusal only at the 100_000 bound, which this history does not approach. Do not "fix" it by compacting ConfigChange (RT02).

**F-C2 — a worktree add is fsync-bound; containment is under OPC's 100 ms trigger. Numbers reproduced from their artifacts. Severity of the number is Medium.**

Their `bench-a.json`: port p50 **183.8 ms**, plain p50 **6.8 ms**, load 0.82, first port add 299 ms. `bench-y.json` p50 175.0 ms at load 3.25. `bench-x.json` p50 197.0 ms with 120 retained chains. Trace recount, not their prose: `trace-n1.log` 33 `fsync(`, 0 `fdatasync(`, 25 `bwrap` execs; `trace-n3.log` 83 `fsync(`, 0 `fdatasync(`, 63 `bwrap`. Marginal **(83−33)/2 = 25 fsync** and **(63−25)/2 = 19 bwrap** per add. Their "fsync/fdatasync" wording is loose; the count 25 is exact, and it is all `fsync`. Code on this HEAD still does the syncs they named: WAL file+dir per record (`wal.rs` install path they cited), `core.fsync=all` on both pin install and pin release (`refs.rs:375-376` and the install_pin twin), `sync_refs`, object fanout, worktrees dir (`worktree.rs:520`).

OPC trigger (≥ 100 ms containment per add) is not reached on their own arithmetic (19 × 1.6–2.9 ms). I did not re-run the wrapper microbench. The trigger conclusion stands as their measurement, not as a new one. Calling the 131 ms figure High mis-bins a speed fact. The fix is a spec question, correctly parked. Do not design a second containment domain.

### Reproduced Mediums

**F-C3 — three contained children for the floor key, plus a probe when the record is stale. Code reproduced. The millisecond range was not re-measured.**

`driver.rs:640-651` runs `git var GIT_CONFIG_SYSTEM` and `git var GIT_CONFIG_GLOBAL` before the `--show-origin` listing. That is two children, not three, in this function. The third is the listing itself, in `floor_key` as they said. I did not re-time 299 vs 184 ms. The "reproduced as a range" claim is their measurement; the child count is the part I confirmed. Medium stands for the wasted `git var` pair. Taking `PATH` out of the key is a behavior change (a different git earlier on `PATH` would reuse a stale floor). Do not do that inside a "fold" ; it belongs with the proposed additions.

**F-C4 — `list_refs` lists the whole namespace and filters in process. Code reproduced. The 886 census was not re-counted.**

`driver.rs:2294-2317` builds `for-each-ref --sort=refname` with no pattern, then drops non-matching names at `:2326`. Prefixes are accepted and ignored at the Git boundary. `WalReader::read_ref` is not this function: it already passes the name (`driver.rs:1889-1893`). Their "≈ 6 `for-each-ref` per add" was not re-traced by me; the marginal bwrap count of 19 is consistent with a chatty add. Medium stands. The delete of `WalReader::read_ref` does not fix this (see unsafe deletions).

**F-C6 — each Git doctor row calls `inspectGit` again. Code reproduced. 72.8 s not re-run.**

`checkGit` calls `native.inspectGit` for every non-worktree row (`src/setup/git-checks.mjs:38`), and `git-publication-refspecs` calls it a second time when `remote !== 'origin'` (`:54`). Eight loop rows plus land-recovery is the multiplication they describe. I did not open `doctor.json` for a new timing. Medium stands as a structural cost. The per-row duration field is an addition; do not smuggle it into the fix.

**F-D1 — "ports with no caller after WORK". Partly falsified.**

- `checkpointTrackedFiles`: still the only caller is `src/state/legacy-event-git-adapter.mjs:7`. WORK's `790616298` deletes that file and still contains `checkpoint_tracked_files` at `scoped_commit.rs:1710` on that branch. Dead only after that merge, and the function is not what that commit removes. Their "port is then dead" is true of the Node caller, false of the Rust function unless T2 deletes it in the same landing.
- `Policy::LocalMutation`: **false.** Callers on this HEAD are `remote.rs:493` and `sequence.rs:200`. Deleting it breaks sequence claims.
- `WalReader::read_ref`: **false as a duplicate.** It is the `RecoveryReader` Land, ScopedCommit, and Restore pass to `wal.compact` (`land.rs:1721`, `scoped_commit.rs:488`, `restore.rs:1227`). Publication has a separate `BoundReader`. Already patterned.
- `hooks_value` / `local_hooks_value`: two readers, confirmed (`repository_config.rs:607-620`). `hooks_value` calls `invoke(..., hardened: false)`. Folding them is a cleanup, not a dead-code delete; they answer different questions (included hooks vs local file only).
- `addWorktree` argv shim (`src/runner/repo-locks.mjs:96-125`): not re-read line by line. Not falsified, not cleared.
- `herdrSpawnAdapter`: refuses with a named error and is registered (`transport.mjs:676-707`). Not dead. See unsafe deletions.

**E-5 — six layout-cause ladders, and they disagree. Reproduced.**

Non-test sites at `driver.rs:860, 2151, 2202, 2430, 2450, 3414`. `:2151` has promisor then shallow, no alternates. `:2202` has promisor then alternates, no shallow. Medium stands. One function is a fold, not a new mechanism.

**E-10 — doctor anchor check runs `herdr pane get`. Reproduced.**

`src/setup/terminal-control-checks.mjs:30`. Bypass of the port. Medium stands.

**E-11 — doctor scrapes `herdr agent start --help` and `integration status`. Reproduced.**

`src/setup/registrations.mjs:4368-4396`. Direct spawn, help-text scrape. Medium stands as a bypass. The capabilities field that would replace it is an addition (they listed it). Until the owner picks that, the spawn stays and should be named, not deleted.

**E-12 — herdr socket layout in Node. Reproduced as a literal, not re-proved as "the driver only forwards".**

`src/runner/dispatch/confinement/resources.mjs:187-190` returns `~/.config/herdr` when `HERDR_SOCKET_PATH` is unset. `worker-session.mjs` was not re-read this round; the boot path uses `socketPathForSession` (`worker-session-boot.mjs:69`). The session-server spawn at `:90` is a start, not a pane op. Medium for the layout literal stands. Moving derivation into the driver is a relocation of one path, not a new server.

**E-17 — shipped `pane-owned.sh` still runs `herdr pane process-info`. Reproduced.**

`plugins/fgOS/skills/terminal/pane-owned.sh:21-25`. Still true after `80159fd23`. Medium stands. Deleting the script before `attach` checks ancestry re-opens the wrong-pane rename the script exists to stop. That move is their proposed addition 2; it is not a free delete.

**E-19 — six acceptances of `worktree:{root}` without custody. Count reproduced. "Written only by an unshipped build" is not a clearance.**

The six `format!("worktree:{}")` acceptances in `scoped_commit.rs` and `sync.rs` are real (`scoped_commit.rs:347,362,562,713,1248`, `sync.rs:677`). `restore.rs` not accepting that form was not re-checked. Separately, `wal.rs:346-355` **writes** `worktree:{path}` for WorktreeCreate/Remove/Move today. That is the live resource of the 320 worktree chains on this disk, not the 2026-10-19 scoped-commit form. This checkout has zero ScopedCommit or Sync chains. Medium for the duplication stands. Deletability does not (Q1).

**E-21 — repeated replay prologues. Not re-counted. Not falsified.**

I re-read the worktree-resource compares, which are part of the set. I did not re-count nine `CommitResult` literals or four authority gates. Leave the finding as their count; do not delete from it until a single owner is named per behavior (principle 8).

**E-22 — WAL reimplements canonical JSON and has no `fgos-canonical-json` dependency. Digest function not re-read. The dependency claim was not re-opened in Cargo.toml this round.**

I did not re-run their `rg`. Do not treat the "−500 to −800" attached to this row as measured. Folding onto the T0 leaf is the right shape if the bytes match; a digest change is a WAL-version event, not a cleanup. That risk is absent from their fix shape.

**F-1 — port contract drifted from the facade. Not fully re-audited. Direction stands.**

`src/git/index.mjs:12` exposes `fetchRefs` on a facade whose production callers I did not find. I did not diff all 16 Inspect names. Do not delete `ports.v1.json` until something reads it or the owner accepts an untested contract. Regenerating it is a contract change (L10), not a delete.

**F-5 — Publication turns every `WalError` into `recovery-required`. Reproduced.**

`publication.rs:27-30`: `werr` sets `ResultCode::RecoveryRequired` and stringifies the error. Refs maps WAL busy through `failure` (their cite; not re-opened). The two names for one failure are real. Medium stands. Fixing it is a contract change for every Publication caller; list it, do not fold it into a "simpler constructor" silently.

**F-6 — no cause catalogue. The absence is reproduced. The "≈ 500" count is theirs.**

`packages/git/contracts/` has `result-codes.v1.json` and no `causes.v1.json` that I opened. A generated cause enum is their proposed addition 4. Do not build it in the harden landing (RUL104).

**F-7 — Remote's credential check runs on an already-redacted URL. Reproduced by reading. Impact is fail-closed, not a leak. Medium stands. Correctness did not carry it.**

`Inspect::remote_url` returns `line(&redact(&out))` (`driver.rs:2512-2514`). `redact` replaces userinfo with `[redacted]` (`driver.rs:1763-1764`). `transfer_url` then runs `url_has_credentials_or_controls` on that string (`remote.rs:54-57`). `ssh://git:password@host` becomes `ssh://[redacted]@host`, the ssh-username exception at `remote.rs:630` accepts it, and git is invoked on the redacted URL. Publication reads the raw URL (`publication.rs:1418-1421`) and refuses. The inline test (`remote.rs:668-670`) feeds raw strings the Remote production path never sees. No credential is sent on the Remote path. The named refusal does not fire. Medium, not High.

**G-4 — skill imports `session-identity.mjs` from plain `node`. Falsified on this HEAD.**

Fixed by `80159fd23` (`plugins/fgOS/skills/terminal/terminal-port.sh:19-25` calls `fgos identity --json`). I ran that verb; the body is `{"data":{"id":"…","source":"env",…}}`, which is what the new parser reads. The seat's cite was true at `2f3ad28af` and is not a current defect. Residual, Low: the parser still swallows a bad answer (`catch {}`) and drops the label segment with no named error. Do not reopen G-4.

### Part A target shapes

**Git, correctness.** One Rust authority, thin facade, no second recovery engine: supported. "Move Land wait to an async native binding": the Node loop is deciding logic (`src/git/land.mjs:9-18`), and the comment there is why a sync native wait is wrong. That shape matches the owner decision that T0–T4 leave no deciding logic in Node. Simplicity's "keep" does not. The async binding must be the existing Land port, not a new waiter. Doctor 10→6: see disagreements. "250 lines now, 225 after": I did not re-`wc` the facade. Do not spend a landing on the 25-line budget.

**Git, speed.** Compact on `finish_worktree` / `change_ref`: supported, with RT02 excluded. Patterned `read_ref` for `list_refs`: supported, and it is not the deletion of `WalReader`. One `RepoHandle` cache per process: that is a new cache. It is in the target shape, not in proposed additions. RUL104 says it waits for the owner. Containment stays: supported by F-C2. fsync pin rule parked as a spec question: supported.

**Git, simplicity.** Authority sentence matches the spec. Doctor 10→4 over-merges (below). Rust −600 to −1 100 counts folds nobody has proved byte-identical, plus deletes Q1–Q4 have not cleared. Reject that number as a target. Node ≤ 230 after deleting `native-lock.mjs` is plausible and small.

**Terminal-control, all three.** One core, one herdr driver, Node keeps the per-group queue: supported, and it matches spec §10 as simplicity states. "Every pane access through the port" is the right end state and is not true today (E-10, E-17). The server start at `worker-session-boot.mjs:90` is the one legitimate raw spawn; all three say so; the evidence agrees. Correctness's "Node must not turn an unavailable port into dead-server authority" is CF01 and should lead the terminal shape. Speed's "cache capabilities by incarnation" is a cache; list it, do not hide it in the shape. Simplicity's "driver derives the socket" is a relocation of one literal, acceptable if the driver is the only writer of that literal afterwards (L10).

**Layer size.** Use a ceiling, not the three ranges. Safe deletes I could see (group hint, anchor spawn once a port answer exists, dead `TERMINAL_CONTROL_OPS` if their no-importer claim holds, the two always-pass doctor rows' separate registration) are tens of lines, not hundreds of Rust. Net ≤ 0 holds only if the async Land binding and any capability field are paid for by a named delete in the same change. Simplicity's −1 000 Rust is not evidence.

---

## Disagreements and verdicts

| Topic | Seats | Verdict |
|---|---|---|
| Doctor rows | Correctness 10→6. Simplicity 10→4, terminal 3→2. Speed keep 10, share the call. | Current registration is **10 Git rows**: 8 in the loop at `registrations.mjs:6354`, land at `:6367`, one-door at `:6372`. Four Git fixes at `:6389-6392`. Correctness's count is right. `git-trust-topology` always passes (`git-checks.mjs:47`). `git-durability-capability` always passes (`:60`). Fold those two messages into `git-component-compatible`. Do not fold `git-native-locks` (`:52`, fail, "never removed") or `git-worktree-recovery` (`:35`, advisory vs fail) into the journal row: different remedies, and a journal `--fix` must not grow a lock unlink. Do not fold `git-publication-refspecs` away from its registered fix. Speed's shared `inspectGit` (F-C6) is the change that pays; the 4-row merge does not. Terminal: keep 3 rows until CF02 is fixed. Deleting `terminal-dir` (E-15) is plausible because `store.rs` creates the dir, and I did not re-read that function this round; do not delete the fix in the same change as a doctor rewrite. |
| Land wait | Correctness: async Rust. Simplicity: keep the Node spacer. | Correctness, with simplicity's constraint. `land.mjs:9-12` is the evidence a sync wait deadlocks the holder. Owner decision says the decision leaves Node. One async attempt loop on the existing port. Not a new policy. |
| `gitPortOptions` | Speed: resolve once in Rust. Simplicity: keep the adapter. | Keep the trust check. Do not add a process-lifetime `RepoHandle` cache in this landing. Reusing an already-built inspect port is a caller fold, not a cache, and is the only part of F-C5 that is not an addition. |
| Raw herdr | All three: anchor `pane get` is a bypass; server start is legitimate. Speed/simplicity disagree on whether `herdr-executor-kinds` can move now. | Anchor pane: bypass, move behind the port. Server start: legitimate, name it, fix CF01 in that function. Help/status scrape: bypass of the binary, but the replacement field does not exist. Keep until the owner picks the addition. `pane-owned.sh:21`: bypass, simplicity only; do not delete first. `herdr-round.mjs` as a port client: not re-audited; their R-3 cite stands unattacked. |
| F-C1 severity | Speed: High. Criteria: measurable slowness is Medium. | Medium. Behavior reproduced. |
| F-C2 severity | Speed: High for the number, Medium for the fix. | Medium for both. Trigger not reached. |
| Net size | −170 Node / +100 Rust vs −150..−300 Node / −100..−250 Rust vs −600..−1 100 Rust. | Correctness's ceiling is the only one that does not spend unsafe deletes. Plan to ≤ 0. Do not schedule simplicity's Rust cut. |
| Test retirement | Correctness: do not delete Node Git tests that own a behavior. Simplicity: retire a long list, several marked INFERRED. Speed: retire `herdr_driver_live.rs` and tighten one bar. | Correctness. A test simplicity marked INFERRED is not cleared for deletion. `herdr_driver_live.rs` is outside the gate and is the only live-server witness I was shown; do not retire it in the same change as a driver edit. Tightening the poll bar (`p95 < 1000 ms`) is a test change, not a delete, and their 8.7 ms figure was not re-measured. |
| F-7 | Simplicity handed it to correctness. Correctness did not list it. | Real, Medium, fail-closed. Put it on the correctness list. Not a reason to add a second URL reader. |
| Checkpoint / `legacyEvents` | All three: WORK owns the delete. | Agree. Collision: `790616298` edits `grant.rs`, `scoped_commit.rs`, `lib.rs`, addon `scoped_commit.rs`, contracts, and deletes `src/state/legacy-event-git-adapter.mjs`. Any T2 edit in those regions must say so. The branch does not remove `checkpoint_tracked_files`. |
| Group hint | Correctness and simplicity: delete. Speed did not list it. | Safe. `Store::read_hint` is called from `store_publish.rs:63` only. Writer at `core.rs:230-236` has no production reader. Delete writer, reader, schema, and that test together. |
| `native-lock` Node door | Simplicity: delete. Correctness: keep the Rust inspection. | Both, split. No production caller of `createGitNativeLockRepair` in `src` beyond the export at `src/git/index.mjs:33`. Rust inspection stays. Deleting the Node class is safe if the Rust tests remain the owner. |

---

## Unsafe deletions or hidden additions

### Unsafe or not-yet-safe deletes

| Proposal | Why it is not safe |
|---|---|
| `Policy::LocalMutation` (speed delete list) | Live callers `remote.rs:493` and `sequence.rs:200`. Sequence landed while they were reading; the "single fetch caller" claim is stale. |
| `WalReader::read_ref` (`driver.rs:1859-1914`) | Recovery reader for Land, ScopedCommit, Restore compaction. Not a duplicate of `PublicationPort::read_ref`. Already passes a pattern. Deleting it removes the owner of compaction's ref observation. |
| `herdrSpawnAdapter` (`transport.mjs:676-707`) | Registered adapter. Its only behavior is the named refusal `herdr-spawn-supervised-only`. That refusal is the contract for a direct call. An "unknown transport" path does not say "use executeAssignment". T5, not a T2 delete. |
| v1 compact-receipt branch (`wal.rs:2106-2140`) | Drain for a ledger version. This checkout's 12 receipts are all `v:2`. Other machines were not read. Owner decision 1: drains live one release. |
| Six `worktree:{root}` acceptances (Q1) | No ScopedCommit chain on this checkout. Not a three-machine census. `wal.rs:346-355` is a live writer of a different `worktree:{path}` form; a sweep that deletes "the worktree: form" deletes current Worktree admission. |
| `checkpointTrackedFiles` before WORK merges | Caller `legacy-event-git-adapter.mjs:7` is live on main. WORK's branch deletes the caller and keeps the function. |
| ConfigChange compaction, if F-C1 is implemented as "every pin-released chain" | Breaks `hooks_provenance` (`repository_config.rs:688-714`). |
| `pane-owned.sh` before `attach` grows an ancestry check | The script is the only check that `HERDR_PANE_ID` is this process's pane (`pane-owned.sh:11-14`). |
| Simplicity's INFERRED test retirements (`land-vs-manual-commit` `:209`, `repo-locks-multiprocess` `:61`/`:75`, e2e hook overlaps) | Not proved to have another owner. Principle 8. |
| `ports.v1.json` delete (D7) | Drift (F-1) is not the same as "no reader, so delete". An unread contract that still names the ports is the spec's machine twin until regenerated in the same change. |
| `ResultCode` variants with no constructor (E-7) | I did not re-run the `rg`. If true, deleting them is safe only together with the contract rows, and only if no serialized receipt on disk uses those strings. Not checked on disk. |
| `herdr_driver_live.rs` | Only live-server witness named. Not in the gate is not "no behavior". |

### Hidden additions (in a target shape, not in "proposed additions")

- Speed Part A Git item 2, a per-process `RepoHandle` with cached formats. New cache. Park it.
- Speed Part A Git item 3's "take `PATH` out of the floor key". Behavior change, not a fold. Park it with F-C3.
- Speed Part A terminal item 1, capability/endpoint cache in the allocation store. New cache. They also listed a capability field as addition 3; the cache is the one that slipped.
- Correctness's async Land binding is disclosed. It is still new wait code. Allowed only as the move of `land.mjs:13-18`, paid for by deleting that loop in the same change.
- Simplicity's `causes.v1.json`, `anchorPane`/`agentKinds` fields, and attach ancestry check are listed. Keep them listed. Do not implement them as part of "making the port answer".
- A per-row doctor duration (speed addition 2) and a retained-chain doctor warning (addition 4) are additions. The warning is the cheap way to see the next unbounded kind; still the owner's pick.

No seat proposed a second containment domain, a sequence WAL, or a terminal sweeper. That restraint holds.

WORK collision to state on any patch that touches `grant.rs`, `scoped_commit.rs`, `lib.rs`, addon `scoped_commit.rs`, or `legacy-event-git-adapter.mjs`: branch `work/es-cutover` at `790616298` already edits those. It does not edit `sequence.rs`, `worktree.rs`, `refs.rs`, or terminal-control.

---

## Owner questions Q1–Q4

**Q1. Legacy `worktree:{root}` acceptances. Recommend (b): keep for one release.**

What is happening: six port sites accept a resource set the current scoped-commit writer does not emit (`worktree:{checkout}` without `:custody:`). Cause: compatibility kept at `869e789d7`, as the seat said; I did not re-open that commit. Options: (a) delete after a census; (b) keep one release, matching owner decision 1. Recommendation: **(b)**. This checkout has no ScopedCommit or Sync chain, so (a) is not contradicted here, and it is also not proved. `pendingCount 0` does not read retained or compacted resource sets. A yes on (a) must name the six port acceptances only. It must not authorize deleting `wal.rs:346-355`, which is the live Worktree resource form (320 chains on this disk use that family). Scope: the six acceptances and the serde default fields, after a census, in one change.

**Q2. v1 compact-receipt branch. Recommend (b) for this landing; (a) only after the census is actually run.**

What is happening: `wal.rs:2106-2133` accepts ledger `v == 1` with empty expected/next. Cause: old experimental entries, as they said. This checkout: 12 compacted files, every one `"v":2`, zero `"v":1`. Options: (a) delete if no machine has v1; (b) keep. Recommendation: **(b) until someone runs the census**. The seat's (a) is the right end state and its condition is unmet. Deleting a drain in the same week as "drains live one release" needs the census in the commit message. Scope: the branch and the two tests they named, not WAL record `"version":1` (that field is on live operation records; I saw it on `00000000.json`).

**Q3. `abandonedBeforeAttempt` and `configApproved`. Recommend (a), with the cause string held stable.**

What is happening: spec §2 lists both in the same "Results distinguish" sentence as the ResultCode names (`docs/platform/git/spec.md:105`). `result-codes.v1.json` has `superseded` and not these two. Code stores them as `Outcome` variants (`wal.rs:211,216`). Publication surfaces abandonment as `ResultCode::Refused` plus cause `abandoned-before-attempt` (`publication.rs:644-651`). Config approval returns `Ok(receipt)` (`repository_config.rs:270,379`). Tests assert the cause (`recovery_matrix.rs:422`, as they cited; I confirmed the publication mapping, not that test line). Options: (a) spec says they are outcome kinds; (b) add ResultCode variants. Recommendation: **(a)**. No caller I saw switches on a ResultCode of those names; they switch on the cause or on `Ok`. (b) adds enum variants nobody reads. The spec sentence must say the stable machine names are the cause `abandoned-before-attempt` and a successful config receipt, not new codes. Do not delete the Outcome variants; §10 rules 4b and 4c are the protocol.

**Q4. Typed surface with no caller. Recommend (a) for the Node arms only, and not for anything Recovery or WORK still calls.**

What is happening: `Remote.fetchRefs` / `inspectRemote` appear in the facade method lists (`src/git/remote.mjs:12`, `src/git/index.mjs:12`) and I found no production call. `recover_config_change` is live from Recovery (simplicity's cite `recovery.rs:194`; not re-opened). WORK's branch diff does not add a `fetchRefs` caller. Options: (a) delete the uncalled Node arms; (b) name a caller and keep. Recommendation: **(a) for the Node-reachable arms with no caller** (`fetchRefs`, `inspectRemote`, the facade `recover` name if Recovery does not use that facade, `sessionId` on the Node create request if no caller sets it). I independently confirmed the first two have no `src` caller outside the facade lists. I did not re-prove `sessionId` or the worktree addon arms. Do not delete the Rust functions Recovery or Land call. Do not delete `checkpointTrackedFiles` under this question; that is WORK's, and the branch still has the function.

---

## Rejected attacks

- **"CF01 is only a test-injection artifact."** Rejected. The catch-all is the production function. The client throws named errors for host and timeout failures a live herdr server does not cause.
- **"F-C1 does not walk terminal chains twice."** Rejected. `active` calls `retained`, which inspects every non-compacted chain, then filters to `outcome().is_none()`.
- **"F-C2's 25 syncs are strace inflation."** Rejected for the count. Marginal fsync from their n1/n3 traces is 25, and those lines are `fsync(`, not ptrace-synthetic. I did not re-prove the 5.25 ms unit cost.
- **"Containment is why the add costs ~184 ms, so OPC's trigger is met."** Rejected. 19 bwrap children cannot be 100 ms at their own 1.6–2.9 ms wrapper figure. fsync is the larger term.
- **"G-4 is still open."** Rejected on this HEAD. Fixed at `80159fd23`.
- **"The six `worktree:` acceptances are the live Worktree writer."** Rejected. The live writer is `wal.rs:346-355`. The six are scoped-commit/sync compatibility.
- **"Publication and Remote share one URL read, so F-7 cannot be one-sided."** Rejected. Publication uses `self.call` (`publication.rs:1418`). Remote uses `Inspect::remote_url` (`remote.rs:54`).
- **"Deleting `WalReader::read_ref` is how F-C4 gets cheaper."** Rejected. F-C4 is `list_refs` at `driver.rs:2311`. `WalReader::read_ref` already passes the ref name.
- **"Sequence's scp-style failure is CF07."** Rejected. CF07 is `Err(_) => Local`. This path is `Ok(url) => Remote`, then a scheme refusal. Merging them would allocate locally on a repository that has an origin.
- **"herdr-round still spawns herdr."** Not established. I did not re-read the file. Their cite stands.
- **"An empty foreground list cannot authorize a close."** Not attacked. `foreground_is_owned` uses `Iterator::all` (`core.rs:776`), which is true for an empty list. That is CF03, inferred, and I am not promoting it; I also cannot reject it.

---

```text
Status: DONE_WITH_CONCERNS
Summary: CF01 is a real High; F-C1 and F-C2 are real and should be Medium; the speed delete list is unsafe for LocalMutation and WalReader; G-4 is already fixed; sequence claims break on a normal SSH origin (RT01, High, inferred); Q1 and Q2 should keep the drain for one release.
Concerns/Blockers: RT01 was not executed (read-only filesystem refused a scratch repo). I did not re-time doctor or re-read land.rs/restore.rs/scoped_commit.rs in full. Main gained 80159fd23 after the simplicity seat wrote.
```
