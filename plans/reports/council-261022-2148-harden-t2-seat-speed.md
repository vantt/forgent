# HARDEN T2 council — seat "speed and weight" (axes C, D)

- Brief: `plans/reports/council-261022-2148-harden-t2-council-brief.md`
- HEAD when written: `9d13d9f5f` (the brief named `2f3ad28af`; between the two no cited file changed except `src/setup/registrations.mjs` (+8/−8, anchors re-read on `9d13d9f5f`), `packages/git/rust/src/remote.rs`, `packages/git/rust/src/lib.rs`, the addon's `lib.rs`/`session_identity.rs`/`event_store.rs` and the new `sequence.rs`; every `file:line` below was re-anchored on `9d13d9f5f`).
- Lens: Axis C speed (children per Git call, contained-child cost, N-API cost, doctor-row cost, terminal-control's host/herdr cost); Axis D weight (dead paths, duplicate drivers, unused ports, Node herdr code outside the port, net size). R2 measured here.
- Method: read-only on the repo; measurements through the **active release** `sha256:a424fc0f…` (host `bin/fgos`, payload `libexec/legacy-node`, addon `libexec/native/fgos.node`) with `FGOS_HOST_BIN` set to that host and a private 0700 `FGOS_STATE_ROOT`; scratch on ext4 (`/dev/nvme0n1p2`) under `/home/vantt/projects/forgent-worktrees/t2-seat-speed-r2/`; every timing has its `/proc/loadavg` beside it and every fsync-bound figure a paired plain-fsync probe in the same directory. Harness files: `add-bench.mjs` (production door `addWorktreeSync` interleaved with plain `git worktree add -b`), `mkrepo.sh` (same bytes as `test/helpers/git-fixture.mjs`), `fsync-probe.py`, `scan-bench.mjs` (read-only `inspectGit`), `trace-parse.py`. Measured only after the coordinator's "measure now" (TEST's gate finished, load 0.46 → 0.8 at the first run; later runs shared the machine with another seat's `fgos run`, load 2–3.4, noted per run).

## Part A — target shape

### Git

One Rust crate (`fgos-git`) behind one addon, typed ports, one private hardened driver, one WAL. That shape is right and is kept. What the measurements say it must become, in speed/weight terms:

1. **A terminal chain is compacted by the door that ends it.** Today only Publication and ScopedCommit compact (`publication.rs:264-309`, `scoped_commit.rs:353-456`); Worktree and Refs chains are retained forever (`worktree.rs:509-535`, `refs.rs:336-396`: `release_pin` appends `PinReleased` and never calls `wal.compact`). The shape: `finish_worktree`/`change_ref` end with the same `compact` call the other kinds use, keeping the `RECENT_TERMINAL` tail the spec already names for Publication. Cost today: every admission re-reads and SHA-256-validates every retained chain twice (measured §R2.5), and this checkout carries 322 retained chains / 1 928 records / 2.2 MB, oldest 2026-10-19.
2. **Per-process Git facts are read once per process, not once per port.** `GitInspect::call` re-resolves the repository per call (addon `git/inspect.rs`), `gitPortOptions(...,{mutation:true})` builds a throw-away `GitInspect` and runs `resolveRepo()` for every mutation port (`src/git/inspect.mjs:27-37`), a checkout handle never reuses formats (`driver.rs:369`), and the floor key costs three contained children per process before any work (`driver.rs:640-651,1331-1377`). The shape: one `RepoHandle` per process per repository, formats cached on it; the floor key derived from file identities (it already hashes `config --list` output; the two `git var` children can be replaced by the same `--show-origin` listing, which already names the system and global files).
3. **Ref reads are patterned.** `list_refs` (`driver.rs:2294-2377`) runs `for-each-ref --sort=refname` over the whole namespace for every `resolve_ref`/`direct` (`refs.rs:290-396` calls it four times per pin install+release; `publication.rs:1211-1257` already passes a name pattern). The shape: one `read_ref(name)` with the pattern argument, used by refs, worktree and land; `WalReader::read_ref` (`driver.rs:1859-1914`, 3 children) and `PublicationPort::read_ref` are the duplicate to fold.
4. **One `fsync` discipline, counted.** A worktree add costs 25 `fsync`/`fdatasync` (≈ 131 ms of its ≈ 184 ms, §R2.3): six WAL records each with file+dir sync (`wal.rs:1411-1438`), the pin's `update-ref` under `core.fsync=all` twice plus `sync_refs` up the directory chain twice (`refs.rs:241-273,290-396`), fanout/objects syncs (`objects.rs`), the worktrees dir. The spec's rule (one record = file + dir + parent) is kept; the shape change is to stop paying it for a *pin on a Worktree chain* whose target is a brand-new registration, and to batch the `sync_refs` chain once per operation instead of per ref write. That is a spec question (§10 rule set) for the owner, not a seat decision — listed under proposed additions, not findings.
5. **Containment stays as OPC designed it.** R2 does not reach OPC's trigger (§R2.4): per add, the bwrap wrapper costs 30–65 ms of ≈ 184 ms; fsync costs twice that. Phase B (anchor pid-1 domain) stays deferred. The containment-side improvement that does pay is fewer contained children per operation (shape items 2 and 3), which also shrinks the exposure the OPC conformance suite guards.
6. **Weight.** Net ≤ 0 is reachable without touching behaviour: the duplicate ref readers (3), the two config readers `hooks_value`/`local_hooks_value` (`repository_config.rs`), the `Policy::LocalMutation` variant used by one fetch `update-ref`, `addWorktree`/`addWorktreeSync`'s argv-translation compatibility layer (`src/runner/repo-locks.mjs:96-125`) once the two callers pass a request, and `checkpointTrackedFiles` + `legacyEvents` (WORK-owned, `scoped_commit.rs:1760-1813`, addon `git/scoped_commit.rs:76-89`, `src/git/scoped-commit.mjs`) when `work/es-cutover` lands.

### Terminal-control

One Rust core behind `fgos internal terminal-control <op>`, one herdr driver, one Node client. Shape to reach:

1. **One host process per op is acceptable at today's cost** (8.7 ms p50 per op incl. two herdr children, §C-T1). The waste is per-process re-probing, not the process: every op runs `herdr --version` and `herdr pane layout --help` (`driver/herdr.rs:368-398`) and `status server --json` when it needs the endpoint (`:335-355`). The shape: the capability report and endpoint are facts of (herdr binary identity, server incarnation) and belong in the allocation record the store already publishes (`store.rs`), re-probed only when the incarnation changes — the core already reads the incarnation per op (`core.rs:147-151`).
2. **Every pane access goes through the port.** Three Node sites still call herdr directly: `src/setup/terminal-control-checks.mjs:30` (`herdr pane get` for the anchor pane), `src/setup/registrations.mjs:4389-4420` (`defaultHerdrRun`: `agent start --help`, `integration status` for `herdr-executor-kinds`), and `src/runner/dispatch/worker-session-boot.mjs:90` (`herdr --session <name> server`, a server start, not a pane op). The first belongs in `inspect`; the second is a capability question the `capabilities` op can answer; the third is the one legitimate raw spawn and should be named so in the spec.
3. **No sleeps in the driver.** `exec` polls `try_wait` every 1 ms (`driver/herdr.rs:260-270`) and closes fds 3..1024 in `pre_exec`; the holder-lock port already has the pidfd wait the brief's T1 landed. The shape: `wait` on the child with a deadline (pidfd poll on Linux), `CLOEXEC` at spawn instead of the close loop.
4. **Weight.** The Node side is already thin (383 lines, pure modules). Candidates: the `herdrSpawnAdapter` stub in `src/runner/dispatch/transport.mjs` that only refuses; `herdr_driver_live.rs` (one test needing a live server, never run in the gate); the `terminal-control-checks` anchor-pane path once `inspect` serves it.

## Part B — findings

Severity per the method doc: an inferred finding caps at Medium. "Reproduced" means measured or counted on this machine through the active release.

### C — speed

**F-C1 — WAL retention is unbounded for Worktree and Refs chains, and every admission pays for all of it.** High. Reproduced.
- Where: `worktree.rs:509-535` (`finish_worktree`: sync, `Outcome` append, `release_pin`, no compact); `refs.rs:336-396` (`release_pin`), `refs.rs:601-962` (`change_ref`, same); admission `refs.rs:120-184` (`wal.scan(100_000)` + `wal.active(100_000)`); `wal.rs:2381-2475` (`scan`: `has_intent` + `inspect` per operation, `inspect` :1439-1473 reads and digests every record). Contrast `publication.rs:264-309` and `scoped_commit.rs:353-456`, which compact beyond `RECENT_TERMINAL`.
- What goes wrong: this checkout holds 322 retained chains (153 WorktreeCreate, 166 WorktreeRemove, 2 ConfigChange, all `pin-released`), 1 928 records, 2.2 MB, oldest 2026-10-19; nothing ever removes them. Measured: a read-only `inspectGit` scan is 7.7 ms at 10 chains and 28.5 ms at 322 (§R2.5); per add the WAL is walked twice (81 record reads over three adds in a fresh repo = 15 own + 12 per prior chain, i.e. 6 records × 2 passes); end to end an add is +22 ms at 120 retained chains with one worktree (197 vs 175 ms, same load). Doctor's `git-operation-journal`, `git-worktree-recovery` and `git-land-recovery` rows each scan again.
- Fix shape: compact terminal Worktree and Refs chains where their pin is released, with the same `compact` and recent-tail rule Publication uses. No new mechanism; retires nothing in tests (the compaction proofs in `wal.rs` and `publication.rs` already own the behaviour; `worktree.rs` tests gain one case: a finished create is compacted).

**F-C2 — A worktree add is fsync-bound, not containment-bound.** High for the number, Medium for the fix (spec question). Reproduced.
- Where: `wal.rs:1006-1052,1411-1438` (file + dir sync per record, parent for record 0); `refs.rs:290-335` (`install_pin`: `update-ref` with `core.fsync=all`, `sync_refs`, fanout + objects sync), `refs.rs:336-396` (`release_pin`: same chain again), `refs.rs:241-273` (`sync_refs` fsyncs every directory from the ref's parent to the common dir); `worktree.rs:509-535` (worktrees dir sync).
- What goes wrong: 25 `fsync`/`fdatasync` per add (strace marginal n=3 − n=1), 5.25 ms each on this NVMe (probe p50 5.22–5.28 ms, p95 5.36–5.50 ms, 100 syncs, same directory, load 0.97–2.36) = ≈ 131 ms of a 184 ms add (71 %). Plain `git worktree add -b` is 6–7 ms. A pin on a WorktreeCreate chain protects a commit the registration itself keeps reachable the moment `worktree add` returns; its two `core.fsync=all` ref writes and two `sync_refs` chains are the largest single avoidable block (≈ 8–10 syncs).
- Fix shape: owner decision on spec §10 (pin before target CAS is a rule for Publication/Land; for Worktree kinds the target is a new registration, not a moved ref). Options: (a) keep the pin, drop `core.fsync=all` on its `update-ref` and sync the ref chain once per operation; (b) no pin for WorktreeCreate whose `next` equals the registration's HEAD. Either is spec text first, code second.

**F-C3 — Every process pays a Git floor key of three contained children (plus a 14-invocation probe when the record is stale) before any Git work.** Medium. Reproduced as a range.
- Where: `driver.rs:244-287` (`GitDriver::new` runs `containment::select` per driver construction; the bwrap probe is one `/bin/true` child per process, `containment/linux.rs:51-79`), `driver.rs:640-651` (`config_paths`: `git var GIT_CONFIG_SYSTEM`, `git var GIT_CONFIG_GLOBAL`), `driver.rs:1331-1377` (`floor_key` also runs `config --null --show-origin --list`; key includes `PATH` and `HOME`), `driver.rs:1378-1429` (`probe_floor`).
- What goes wrong: in every run the first add costs more than the rest: 299 vs 184 ms (fresh state root, probe recorded), 234/228/285 vs 216/215/200 ms (record present: +18 to +85 ms). Under strace the n=1 run shows 25 bwrap children of which 6 are process setup (`/bin/true`, `var` ×2, `config --list`, formats, `symbolic-ref`). Every `fgos` CLI verb is a new process, so this is paid per verb; doctor pays it once per addon load but its 586 host children each pay their own (§C-D2).
- Fix shape: derive the config identities from the `--show-origin` listing already captured (it names the files); keep the probe record; take `PATH` out of the key in favour of the git binary's resolved path + identity, which `floor_key` already records (`floor_key_names_the_git_binary_and_config_identities`).

**F-C4 — `list_refs` lists the whole ref namespace for every single-ref read; a worktree add does it ≈ 6 times.** Medium. Reproduced by census.
- Where: `driver.rs:2294-2377` (`for-each-ref --sort=refname --format=…` with no pattern), callers `refs.rs:290-335,336-396` (`direct` twice in `install_pin`, twice in `release_pin`), `worktree.rs:608-813` (`resolve_ref` ×2), `driver.rs:2086-2158` (`resolve_head` = `symbolic-ref`, `rev-parse`, `symbolic-ref` = 3 children), `driver.rs:1859-1914` (`WalReader::read_ref`, 3 children; `publication.rs:1211-1257` is the patterned duplicate).
- What goes wrong: per add the contained census is 6 `for-each-ref`, 4 `symbolic-ref`, 2–3 `rev-parse --show-object-format`, 2 `rev-parse --verify`, 1 each of `worktree list`, `cat-file -t`, `ls-files`, 2–3 `config --list` = 19 contained + 3 borrowed children. In this checkout (≈ 1 300 refs incl. 322 pin namespaces) each listing is a full sort. In one `fgos doctor --json` run the state rows issued **886** unpatterned `for-each-ref` listings against this repository in the first 35 s (strace, program and verb census), all through the port's `resolve_ref`.
- Fix shape: `read_ref(name)` passes `name` as the pattern (as `publication.rs:1211` does); `resolve_head` becomes one `rev-parse --symbolic-full-name HEAD` + one `rev-parse --verify`. Children per add drop from 19 to ≈ 12; doctor's 886 listings become 886 single-ref reads.

**F-C5 — Repository facts are re-derived per port and per call.** Low. Reproduced (census) / inferred (cost share).
- Where: `src/git/inspect.mjs:27-37` (`gitPortOptions` builds a `GitInspect` and runs `resolveRepo()` for every mutation port — `src/runner/repo-locks.mjs:82-94` does it for every `createWorktreeCheckoutSync`), addon `git/inspect.rs` (`GitInspect::call` re-resolves the repo per call), `driver.rs:364-388` (checkout handle never reuses formats, :369), `worktree.rs:537-550` (`create_worktree` → `checkout_repository` = fresh `config --list` + formats child), worker `resolve_repo` after `worktree add` (new git dir → `config --list` + formats again).
- What goes wrong: 2–3 `config --null --show-origin --list` and 2–3 `rev-parse --show-object-format` per add are the same answer read three times. Per call cost is a contained child (≈ 3–4 ms incl. wrapper), so ≈ 15–20 ms per add; across doctor's 142 rows it is hundreds of children (§C-D2).
- Fix shape: one `RepoHandle` per process per `(common_dir, checkout)` with formats and config stamp on it (the stamp check at `driver.rs:686-729` already exists and makes reuse safe); `gitPortOptions` takes an existing inspect port instead of constructing one.

**F-C6 — Doctor's Git rows and the rows that borrow the Git port multiply all of the above.** Medium. Reproduced.
- Where: `src/setup/git-checks.mjs:27-66` (`checkGit` calls `native.inspectGit` per row: 8 rows = up to 8 floor reads + 8 WAL scans + 8 `list_refs` over `refs/fgos/remotes/`; `git-publication-refspecs` :54 may call it twice), `:154-168` (`checkLandRetainedCandidates` → `recovery.rs:102-150` `list_retained_land`: full scan + per terminal chain `inspect` before the `Land` filter), addon `git.rs:195-282` (`inspect_git`), addon `git/worktree.rs:161-198` (`inspect_worktree_orphans` + `wal.active`; `worktree.rs:1160-1230` runs `worktree_handle` (3-child `resolve_head`) + `worktree_clean` per registration, 15 here).
- What goes wrong: one `fgos doctor --json` on this checkout = **72.8 s** un-straced (123 s under strace), 2 267 bwrap + 2 274 git children, 586 host children, 52 herdr children (strace census, load 1.0–1.7). The ten `git-*` rows (positions 130–139 of 142) account for ≈ 370 contained children in their ≈ 20 s window (`cat-file` 182, `rev-parse` 117, `symbolic-ref` 24, `ls-files` 26, `config` 9, `for-each-ref` 7). The rest of the Git-child cost is other areas calling the port: 886 unpatterned listings (state rows, F-C4) and 570 `cat-file -t <HEAD>` + `cat-file --batch` pairs issued during the 558 `internal seat-binding bind` host children (T5's area; the per-child cost is this area's F-C3 + F-C5). Doctor's JSON carries no per-row timing, so row attribution is by trace time window and registration order, not by a row clock.
- Fix shape: `checkGit` computes `inspectGit` once per doctor run and the eight rows read fields of it (one `context` already wraps the call at `:20-26`); `list_retained_land` filters on the scan entry's kind before `inspect`; a per-row duration in doctor JSON (it is a `{id, description, passed, message}` row today) so the next measurement does not need strace — that last one is an addition and is listed under proposed additions.

**F-C7 — Terminal-control: per-op host cost is small; per-op re-probing is the waste.** Low. Reproduced.
- Where: `driver/herdr.rs:368-398` (`probe`: `herdr --version`, `herdr pane layout --help` per process), `:335-355` (`endpoint`: `status server --json` per process), `:260-270` (`exec` sleeps 1 ms per `try_wait` turn), `:229-274` (`pre_exec` closes fds 3..1024 one `fcntl` each), `core.rs:283-299` (`live_group` runs `pane get` per record of the group on every allocate), `src/runner/dispatch/herdr-round.mjs` (`followPaneScreen` polls `tc.read` every 3 s = one host process + probe per 3 s per attempt).
- What goes wrong: one `capabilities` op through the host = 8.7 ms p50 (5.2 min, 17.4 max, 12 runs, load 1.11), with 2 herdr children, each first tried at a non-existent PATH entry (`~/.grok/bin/herdr`) before `~/.local/bin/herdr` (execvp search; 52 herdr execs in the doctor run are 26 real). At 3 s polling this is 0.3 % of a round; the cost is process count, not time. The Node poll test's bar (`test/terminal-control/client-route.test.mjs:122-136`) is p95 < 1 000 ms — three orders above the measured value, so it proves nothing about regressions.
- Fix shape: cache the capability report keyed by (herdr path identity, incarnation) in the store; `wait` with deadline instead of the 1 ms loop; `CLOEXEC` at spawn. Lower the poll test's bar to a value that would catch a probe added per call (e.g. p95 < 100 ms over a fake herdr) — a test change, not a new test.

### D — weight

**F-D1 — Ports and helpers with no caller after WORK lands.** Medium. Reproduced by grep (cited in the T2 phase file inventory).
- `checkpointTrackedFiles` (`scoped_commit.rs:1760-1813`; addon `git/scoped_commit.rs:76-89`; `src/git/scoped-commit.mjs`) and the `legacyEvents` declaration path: WORK's `work/es-cutover` removes `legacyEvents` (`790616298`); the port is then dead. Owner: WORK deletes, T2 verifies with `rg checkpointTrackedFiles` at the cutover merge.
- `Policy::LocalMutation` (driver) used by one fetch-mapping `update-ref`; fold into the borrowed policy path.
- `hooks_value` / `local_hooks_value` (`repository_config.rs:673-726` region): two near-identical config reads; `hooks_value` goes through `invoke(None, …)`, the only unhardened `invoke` caller left in the crate (the correctness seat should weigh that; here it is weight).
- `WalReader::read_ref` vs `PublicationPort::read_ref` (F-C4): one reader.
- `src/runner/repo-locks.mjs:96-125`: `addWorktree`/`addWorktreeSync` translate `git worktree add` argv (`-b`, `--detach`, path) into a port request; both callers (`src/runner/worktree.mjs:803-809,1259`, `src/runner/session.mjs:300`) can build the request directly. −40 Node lines and one less place that parses Git argv.
- `src/runner/dispatch/transport.mjs` `herdrSpawnAdapter`: a registered adapter whose only behaviour is to refuse.
- `packages/terminal-control/rust/tests/herdr_driver_live.rs`: one test that needs a live herdr server; not in the gate; either wire it to the fake or retire it.

**F-D2 — Doctor's cost is structurally in other areas' row counts, not in Git rows' size.** Informational for T2, handed to T5. 558 of 586 host children in one doctor run are `internal seat-binding bind --protocol 1` (one host process per bind, each paying the Git floor key and a `cat-file` pair through the port). Out of this council's scope by the brief; recorded because the Git-side cost per child (F-C3, F-C5) is what makes it 50 s.

**F-D3 — Size target.** T0+T1 ended ≈ −2 640 net; the fixes above are all removals or folds: F-C4 (−1 reader, −1 `resolve_head` child path), F-C5 (−1 port construction path in Node, −1 resolve per call in the addon), F-D1 (−≈ 60 Rust, −≈ 60 Node, −1 Rust test file), F-C1 adds one `compact` call site and one test case (+≈ 20). Terminal: −1 adapter stub, −3 raw herdr sites (replaced by port calls, ≈ −30). Expected T2 net: Node −150 to −300, Rust −100 to −250, tests −50 to −150; net ≤ 0 holds with margin. No proposed addition in §"Proposed additions" is counted here.

## R2 — per-worktree-add containment share

### R2.1 Method

- Door: `addWorktreeSync(createLockScope('bench'), repo, ['-b', <branch>, <dir>], {waitMs: 60000})` imported from the active release payload (`libexec/legacy-node/src/runner/repo-locks.mjs`), `FGOS_HOST_BIN=<release>/bin/fgos`, `FGOS_STATE_ROOT` a private 0700 directory on the same ext4 volume. The addon loaded is the release's `libexec/native/fgos.node`. Each run is a fresh `git init -b main` + seed commit + the activation tombstone (`{"lock":"activation","by":"fgos git","at":"fixture"}`, same bytes as `test/helpers/git-fixture.mjs`).
- Wall time per add from `performance.now()` around the call; plain `git worktree add -q -b` interleaved (port, plain, port, plain …) in the same process and repository.
- Counts: `strace -f -ttt -T -e trace=execve,exit_group,fsync,fdatasync,clone,clone3,vfork` on a 1-add and a 3-add run; marginal per add = (n3 − n1)/2. Counts are strace-independent; strace-inflated times are reported only as such.
- Contained-child overhead: the driver's exact wrapper argv from the trace (`bwrap --unshare-user --unshare-pid --as-pid-1 --dev-bind / / --proc /proc -- …`) around `git rev-parse --git-dir`, versus the same `git` plain and `bwrap … /bin/true`, 40 runs each, two rounds, un-straced.
- fsync probe: `write(1 byte); fsync` × 100 on a file in the scratch directory, before and after the runs.
- WAL walk: `openat` trace of a 3-add run, record reads windowed per add by the first open of each add's `candidate.lock`; read-only `native.inspectGit` timed ×5 on the scratch repo (10 chains) and on this checkout (322 chains).

### R2.2 Results (end to end)

| run | load (1 min) | port add p50 | port min/max | plain add p50 | note |
|---|---|---|---|---|---|
| A, fresh repo, 10+10 interleaved | 0.82 | **184 ms** | 179 / 299 (first) | 6.8 ms | first add carries the floor probe (fresh state root) |
| Y, fresh repo, 10 port | 3.25 | 175 ms | 164 / 234 (first) | — | another seat's `fgos run` on the machine |
| ab1/ab2, fresh repos | 2.3 | 215 / 200 ms | 195–223 / 186–216 | — | |
| c0, fresh repo | 2.0 | 216 ms | 163 / 256 | — | |
| W, 100 plain worktrees, 0 chains | 3.36 | 211 ms | 201 / 279 | — | +36 ms vs Y: ≈ 0.36 ms per registered worktree |
| X, 1 worktree, 120 retained chains | 3.25 | 197 ms | 186 / 240 | — | +22 ms vs Y: ≈ 0.18 ms per retained chain |
| c2, 120 worktrees + 120 chains | 2.4 | **292 ms** | 249 / 312 | — | adds 111–120 of one repo; adds 11–30 were 221, 91–110 were 273 |

### R2.3 Per-add attribution (marginal, n3 − n1)

| component | count per add | unit cost (measured) | per add | share of 184 ms |
|---|---|---|---|---|
| `fsync`/`fdatasync` | 25 | 5.25 ms p50 (probe 5.22–5.28, p95 5.36–5.50, load 0.97–2.36) | **≈ 131 ms** | **≈ 71 %** |
| contained children (bwrap-pidns) | 19 | wrapper overhead +1.6 to +2.9 ms p50 (bwrap_git 2.3/3.9 vs plain 0.71/0.99; min +1.1; `bwrap /bin/true` 1.9/3.9) | **30–55 ms** | **16–30 %** |
| git work inside those children | 19 | ≈ 0.7–1.0 ms (`git rev-parse` plain p50) | 13–19 ms | 7–10 % |
| borrowed children (`worktree add` + 2 `git-core` helpers) | 3 + 2 | ≈ 7 ms (plain add) | ≈ 7–10 ms | 4–5 % |
| Node, N-API, WAL digests, `/proc` scan | — | remainder | ≤ 10 ms | ≤ 5 % |

Budget check: 184 − 131 = 53 ms is everything that is not fsync; it must hold 19 git executions (≥ 13 ms) and the add itself (≈ 7 ms), so containment overhead end to end is **≤ ≈ 33 ms by the budget and 30–55 ms by the microbench** — the two agree at ≈ 30 ms. Under strace the same figure reads 5.5 ms per child (170 ms per add); that is ptrace cost on bwrap's setup syscalls, reported here so nobody re-derives the OPC trigger from a traced run.

Contained verb census per add: `for-each-ref` 6, `symbolic-ref HEAD` 4, `config --null --show-origin --list` 2–3, `rev-parse --show-object-format` 2–3, `rev-parse --verify` 2, `worktree list --porcelain` 1, `cat-file -t` 1, `ls-files -z` 1. Process setup, once per process: `bwrap /bin/true` 1, `git var` 2, `config --list` 1, formats 1, `symbolic-ref` 1.

### R2.4 Against OPC's baseline and trigger

- OPC baseline (`research-261022-1341-opc-phase-a-baseline.md`): bwrap +3.1/+3.7 ms per contained child; after Phase A (`verification-261022-2005-opc-phase-a.md`): +3.6/+3.1 ms. With this run's 19 children per add that is 59–70 ms per add; my un-straced wrapper microbench on the same argv gives 30–55 ms (lower floor on a quiet machine, same order).
- **OPC's trigger (≥ 100 ms containment per add) is not reached: 30–65 ms per add, 16–35 % of the add.** fsync is 2–4× the containment share. Phase B stays deferred on this evidence; the containment cost that is worth taking is the child count (F-C4, F-C5: 19 → ≈ 12), which the OPC conformance suite does not constrain.
- TEST's R2 row ("10 adds = 218 bwrap + 249 git, ≈ 0.5 s/add vs ≈ 20 ms plain") is consistent with this: 22 children per add including process setup; the 0.5 s is this checkout's history (322 chains × 0.18 + 15 worktrees × 0.36 ≈ +65 ms → ≈ 250 ms idle) under full-suite load (my runs at load 3 were already +15–20 % over load 0.8). The phase file's "≈ 22 × 3.7 ≈ 80 ms does not explain 0.5 s" was right; the rest is fsync, history and load, not bwrap.

### R2.5 WAL walk cost (F-C1 evidence)

- Record reads per add in a fresh repo: add 1 = 15, add 2 = 22, add 3 = 44 (81 total = 15 own + 12 per prior chain = 6 records × 2 passes: `scan` and `active`). Ledger file opened once per add.
- `inspectGit` (one `scan`): 7.7 ms p50 at 10 chains / 60 records (`retainedBytes` 67 080); **28.5 ms** p50 at 322 chains / 1 928 records (`retainedBytes` 2 201 206, `ledgerBytes` 3 915), load 1.08. ≈ 0.065 ms per chain per pass; two passes per admission.

## Table 1 — migration (Node → Rust / port)

| item | today | target | owner | note |
|---|---|---|---|---|
| `gitPortOptions` repo resolution | Node builds a `GitInspect`, calls `resolveRepo()` per mutation port (`src/git/inspect.mjs:27-37`) | the mutation port resolves once in Rust on construction; Node passes `repoPath` only | T2 | F-C5; −1 child per port construction |
| `addWorktree`/`addWorktreeSync` argv translation | Node parses `-b/--detach/path` (`repo-locks.mjs:96-125`) | callers pass the typed request; the two shims go | T2 | F-D1 |
| anchor-pane check | raw `herdr pane get` in `terminal-control-checks.mjs:30` | `inspect` op through the client | T2 | Part A TC-2 |
| `herdr-executor-kinds` row | raw `herdr agent start --help` / `integration status` (`registrations.mjs:4389-4420`) | `capabilities` op (driver reports agent kinds and integration) | T2 | needs one field added to the capability report — proposed addition, else keep as is and name it in the spec |
| worker server start | raw `herdr --session <name> server` (`worker-session-boot.mjs:90`) | stays raw; spec names it as the one process-start spawn outside the port | T2 docs | not a pane op |
| `checkpointTrackedFiles` / `legacyEvents` | port + facade + addon method | deleted with the WORK cutover | WORK | T2 verifies at merge |

## Table 2 — delete list

| path | lines (≈) | why | proof that owns the behaviour afterwards |
|---|---|---|---|
| `packages/git/rust/src/scoped_commit.rs:1760-1813` `checkpoint_tracked_files` + addon `git/scoped_commit.rs:76-89` + `src/git/scoped-commit.mjs` method | 60 R + 10 N | WORK removes the only caller (`790616298`) | behaviour removed; `noop_is_durable_and_checkpoint_selects_only_non_event_tracked_files` (Rust) retires with it, named in the WORK change |
| `driver.rs:1859-1914` `WalReader::read_ref` (3 children) | 55 R | duplicate of the patterned `PublicationPort::read_ref` | `publication.rs` `read_ref` tests; `recovery_matrix.rs` `read_ref` wiring |
| `Policy::LocalMutation` | 15 R | single fetch `update-ref` caller | `fetch_mapping_is_additive_idempotent_and_records_remote_url` |
| `repository_config.rs` `local_hooks_value` (fold into `hooks_value` with a scope arg) | 25 R | two readers of one key | `hooks_fill_empty_preserve_custom_diagnose_and_remove_only_owned` |
| `src/runner/repo-locks.mjs:96-125` shims | 30 N | F-D1 | `test/runner/worktree-admin-multiprocess.test.mjs` (calls the request form) |
| `src/runner/dispatch/transport.mjs` `herdrSpawnAdapter` | 15 N | refuses only | none needed; the refusal moves to the registry's "unknown transport" path |
| `packages/terminal-control/rust/tests/herdr_driver_live.rs` | 1 test | not in the gate | `herdr_driver_fake.rs` owns the driver contract |
| `src/git/inspect.mjs:30-36` resolve-per-port | 6 N | F-C5 | `inspect.rs` `inspect_real_repositories_…` |

## Table 3 — doctor rows (cost and shape)

Measured in one `fgos doctor --json` run on this checkout: 72.8 s un-straced; the ten `git-*` rows run at positions 130–139 in ≈ 20 s (strace window) with ≈ 370 contained children; the three `terminal-*` rows + `herdr-executor-kinds` at 89–92 cost ≈ 10 herdr children and ≈ 50 ms.

| row | `registrations.mjs` | what it spawns today | after | keep/merge |
|---|---|---|---|---|
| `git-worktree-recovery` | 6354-6364 (`checkGit(cwd, id)` loop → `inspectGitWorktreeRecovery`) | `inspect_worktree_orphans`: per registration `resolve_head` (3) + `worktree_clean` (≈ 4) = ≈ 105 children at 15 worktrees; + `wal.active` scan | `resolve_head` = 1–2 children (F-C4); one scan shared (F-C6) | keep |
| `git-component-compatible`, `git-transport-config`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-durability-capability` | 6354-6364 (`checkGit` loop) | each calls `native.inspectGit` = floor read + full WAL scan (28.5 ms here) + `list_refs refs/fgos/remotes/` + `untrusted_transport_config` (1–2 children) | one `inspectGit` per doctor run, rows read fields | keep rows, merge the call |
| `git-publication-refspecs` | `git-checks.mjs:54` | `inspectGit` once, twice when remote ≠ origin | same single call | keep |
| `git-land-recovery` | 6367 | `list_retained_land`: full scan + `inspect` of every terminal non-compacted chain (322) before the `Land` filter; `direct` ×3 (full listings) per Land chain | filter on the scan entry kind; patterned `read_ref` | keep |
| `git-mutation-one-door` | 6372 | static census, no Git children | — | keep |
| `terminal-control` | 4476 | one host op (`capabilities`) + raw `herdr pane get` for the anchor pane | `inspect` through the client | keep, remove the raw spawn |
| `terminal-config` | 4481 | none | — | keep |
| `terminal-allocations` | 4486 | `reconcile-scan` host op: `pane get` per record | unchanged; records are few | keep |
| `herdr-executor-kinds` | 4494 | raw `herdr agent start --help` + `integration status` | `capabilities` if the report grows that field (proposed addition), else unchanged and named in the spec | keep |
| fixes `git-driver-directories`, `git-wal-dir`, `git-land-recovery`, `git-publication-refspecs`, `terminal-dir` | 6389-6392, 4491 | fix paths only | unchanged | keep |

Out of this area but measured in the same run: `seat-binding-*` rows spawn 558 host processes, each paying F-C3 + one `cat-file` pair through the port (T5).

## Table 4 — tests (speed/weight view only; the TEST lane owns labels)

| test | layer | verdict here | reason |
|---|---|---|---|
| `test/terminal-control/client-route.test.mjs:122` "read … fast enough to poll" | Node wiring | keep, tighten bar | p95 < 1 000 ms cannot catch a per-call probe; measured 8.7 ms p50 through the host. Bar: p95 < 100 ms over the fake |
| `packages/git/rust/src/wal.rs` `ten_thousand_terminal_operations_have_no_record_directories` | Rust unit | keep; extend to Worktree kind | currently proves compaction only for kinds that compact; F-C1's fix lands its case here (one assertion, not a new test) |
| `publication.rs` `publication_keeps_retained_chains_bounded_and_compacted_ids_bound` | Rust | keep | owner of the bounded-retention behaviour; the worktree case joins it or `worktree.rs` |
| `packages/git/rust/src/driver.rs` `floor_record_is_reused_only_for_the_same_key_and_consistent_verdict`, `floor_key_names_the_git_binary_and_config_identities` | Rust unit | keep; F-C3's key change edits the second | — |
| `test/runner/worktree-admin-multiprocess.test.mjs` | Node e2e | keep; it is the R2 harness's twin | after F-C1/F-C4 its wall time drops; TEST's W2/W3 (parked on R2) can proceed: containment is not the lever |
| `herdr_driver_live.rs` | Rust | retire | §Delete list |
| `test/terminal-control/group-queue.test.mjs:32` (`setTimeout 60`) | Node | keep | the one timed wait; 60 ms, bounded |
| `herdr_driver_fake.rs:287` (`sleep 60 s` in the hung-command fake) | Rust | keep | it is the fake's hang, bounded by the driver timeout under test |
| Node git tests that own "Rust behaviour" (TEST D4, 53 rows) | Node | no speed opinion | each is one addon load (≈ 10–20 ms) + a fixture repo; the suite cost is fixture `git init` + commits, not the addon |

## Proposed additions (RUL104: listed, not done; owner chooses)

1. **Spec §10 pin rule for Worktree kinds** (F-C2): the largest single saving (≈ 8–10 fsyncs ≈ 45–55 ms per add, 25–30 %) needs a spec sentence before code. Evidence: R2.3. Benefit: worktree add ≈ 130 ms instead of 184.
2. **Per-row duration in doctor JSON** (`{id, description, passed, message}` → `+ ms`): evidence: this seat needed strace and registration order to attribute 72.8 s. Benefit: the next HARDEN measurement is one command.
3. **Capability report field for agent kinds / integration status** so `herdr-executor-kinds` can leave the raw herdr spawn. Evidence: Table 3. Benefit: zero pane/herdr access outside the port, which is the spec's stated invariant.
4. **A retention bound in `fgos doctor`'s `git-operation-journal` message** (count of retained chains, oldest age): evidence: 322 chains for four days went unnoticed. Benefit: the next unbounded kind shows up as a doctor warning, not as a 0.5 s add in a test lane.

## Rejected hypotheses

- **"bwrap containment is why an add costs 0.5 s in TEST's run."** Rejected: 19 contained children × 1.6–3.7 ms = 30–70 ms; fsync is 131 ms; history +65 ms on this checkout; load does the rest. A PATH-without-bwrap A/B was attempted and found invalid: `containment::select` finds bwrap at fixed locations (`linux.rs:20-21,41-46`), not via PATH — the "no bwrap" runs still spawned 25 bwrap children (strace), so their equal timings (213 vs 209, 215 vs 200 ms) are a null result, not evidence.
- **"The N-API boundary is a measurable cost."** Rejected for this lens: the non-fsync, non-child remainder per add is ≤ 10 ms including Node, marshalling, WAL digests and the `/proc` scan; the addon's hash-once-per-process check (`src/native/door.mjs:46-51`) is paid once.
- **"Worktree count, not WAL history, explains the growth across 120 adds."** Both do, separately measured: +0.36 ms per registered worktree (`worktree list` rows → `resolve_topology` + `branch_in_use` per row, `worktree.rs:705-719`) and +0.18 ms per retained chain; the c-series' +76 ms is their sum within noise.
- **"`fsync` timing is skewed by strace."** Rejected: traced fsync p50 5.3 ms equals the un-traced probe (5.22–5.28 ms); only exec-heavy paths (bwrap) inflate under ptrace.
- **"A second process against the same repo refuses with `worktree-admin-name-in-use` — a port bug."** Rejected as my harness: the registration name is the destination basename (`worktree.rs:728-735`), and the harness reused `port-<i>` across runs; plain Git would have suffixed the name. Whether a name clash should be `recovery` rather than `refused` is a correctness-seat question, noted and not pursued here.
- **"Terminal-control's host-per-op is the cost."** Rejected: 8.7 ms per op; the per-op herdr probes are the only recurring waste and they are small; nothing here justifies a long-lived terminal-control process.

## Scratch left behind (ext4, outside the repo; safe to delete)

`/home/vantt/projects/forgent-worktrees/t2-seat-speed-r2/` — harness, `bench-*.json`, `trace-*.log` (incl. `trace-doctor.log`, 123 s run), scratch repos `repo-*` and worktrees `wts-*`, private state root `state/`. Nothing under the repository was modified except this report; no Git mutation was made in the repository; the measured doctor run was diagnostic (no `--fix`).

Status: DONE
Summary: R2 measured end to end through the active release: a port worktree add is ≈ 184 ms (plain Git 7 ms), of which fsync is ≈ 131 ms (25 syncs × 5.25 ms) and bwrap containment 30–65 ms (19 children) — OPC's ≥ 100 ms trigger is not reached; the 0.5 s TEST saw is unbounded WAL retention (322 chains in this checkout, F-C1, High) plus worktree count and load. Doctor costs 72.8 s / 2 267 contained children on this checkout, mostly other areas calling an unpatterned `list_refs` and a per-process floor key.
Concerns/Blockers: F-C2's fix is a spec decision (pin rule for Worktree kinds), listed as a proposed addition; doctor rows cannot be timed individually without a per-row duration field (proposed); 558 of doctor's host children belong to T5's seat-binding rows and are recorded here only because the Git port pays their per-child cost.
