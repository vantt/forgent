# Research: `fgos version` latency, pre-F0 base vs F0 head (A/B)

Date 2026-11-15, fg-server2, read-only (build output only). Lead COOK (forgent-b7).

## Verdict

1. F0 did not make `fgos version` slower inside a repository. Base and F0 spawn the same processes and take the same time: about 21-23 ms warm, about 60 ms cold.
2. The ~78 ms of phase 11 is the COLD case of the Git floor probe (52 execs, 22 bwrap, against 15 execs and 7 bwrap warm), not a warm 15-process run. The floor verdict record is ONE machine-global file (`~/.local/state/fgos/git-floor-verdict.json`) whose key includes the host version, a digest of `packages/git/rust/src/driver.rs` and the git binary stamp. Every differently built `fgos` (each worktree, each release, F0 vs base) invalidates the record the previous one wrote, so a machine with several builds in use keeps paying the full probe.
3. F0 added exactly one spawn pair to every native verb: the containment probe (`bwrap ... /bin/true`, 2 execs, about +2 ms) because the invocation root door builds a `GitDriver` even though its check is disk-only. Visible only outside a repository (1 exec -> 3 execs; `version` 1.3 -> 3.4 ms, `config show --json` 1.0 -> 3.1 ms).
4. `version` is the one verb that spawns Git by itself, and it did before F0: it reads the product checkout HEAD through the Git component.

## Method

- Base = origin/main b85ec733d, F0 = origin/rust-verb-migration-program/f0 (7c8f65c30), detached worktrees `rvm-ab-base`, `rvm-ab-f0`, each `cargo build --locked --release -p fgos` into its own target dir.
- Timing: python `subprocess` wall time, 3 warm-up + 30 runs, median (min/max in brackets), run serially. Machine load average 5-12 on 24 cores (other lanes running), so the first rounds were noisy and are NOT used; the figures below use a private state root per binary (`FGOS_STATE_HOME=/dev/shm/ab-state-<name>`) so no other lane's build can rewrite the floor record during the run.
- Process lists: `strace -f -e trace=execve`.

## Timings (private state root, ms, median [min-max])

| verb | cwd | base | F0 |
|---|---|---|---|
| version (warm floor record) | in repo | 22.8 [18.9-32.3] | 20.6 [19.0-24.1] |
| version (floor record deleted before each run = cold) | in repo | 64.6 [57.9-106] | 60.5 [57.9-203] |
| version | /tmp | 1.3 | 3.4 |
| config show --json | in repo | 24.7 | 27.5 |
| config show --json | /tmp | 1.0 | 3.1 |
| --help | in repo | 1.2 | 6.5 [1.5-10] |
| --help | /tmp | 1.1 | 2.0 |

`convention path --help` is a legacy route in base (fails here with FGOS_ACTIVE_RELEASE_PATH unset), so it has no A/B pair.

Shared-state runs (default state root, other lanes active): version in repo ranged 20-85 ms for BOTH binaries, bimodal; alternating the two binaries gave 250 ms medians (each run re-probed and rewrote the record; plus load). Same effect, noisier.

## Process lists, `fgos version` in a repository

- Warm record: 15 execs in BOTH base and F0, identical list: fgos; bwrap + /bin/true (containment probe); then bwrap + git x6: `var GIT_CONFIG_SYSTEM`, `var GIT_CONFIG_GLOBAL`, `config --null --show-origin --list`, then three with `--git-dir/--work-tree`: `config --null --show-origin`, `rev-parse --show-object-format`, `rev-parse -q --verify HEAD`. (This is the "15 processes" of phase 11.)
- Cold record (key mismatch): 52 execs in both. The 15 above plus the floor probe: `git --version`, `init --bare`, `hash-object -w`, `update-ref`, `symbolic-ref`, `update-ref -d`, `rev-parse --verify`, `symbolic-ref -q`, `update-ref` with `core.hooksPath=hooks` (two reference-transaction hook execs), `hook run pre-commit`, `config remote.origin.promisor/url/core.sshCommand`, `cat-file -e` (partial-clone probe, which spawns `git-core/git`, two `sh` and two `transport` helpers).
- Outside a repository: base 1 exec (fgos only), F0 3 execs (fgos, bwrap, /bin/true).
- Release path without a `.git` (`FGOS_ACTIVE_RELEASE_PATH` pointing at an installed release dir, F0): 9 execs, 10.4 ms warm: bwrap probe, the three floor-key git calls, then `NotARepository`. This is the production shape (installed `fgos`), where `version` still pays the floor-record check for nothing.

## Who spawns what (file:line, F0 head 7c8f65c30; same code in base unless marked)

- `version` resolves HEAD: `packages/distribution/rust/src/lib.rs:191-195` `resolve_git_commit` (`GitDriver::open_at`, `resolve_commit_ref`), reached from `resolve_cli_version_info`; product root from `resolve_product_root` (`lib.rs:158-184`: `FGOS_ACTIVE_RELEASE_PATH`, exe-relative, or a `package.json` in cwd; that is why /tmp spawns nothing and a repo with package.json spawns everything). Pre-F0.
- `GitDriver::open_at` -> `resolve_repo` -> `require_floor` first, before the topology check: `packages/git/rust/src/driver.rs:343-349`, `372-374`, `330-336`. So even a non-repository path pays the floor check. Pre-F0.
- Containment probe (bwrap /bin/true): `packages/process/rust/src/containment/linux.rs:61-90` `pidns_usable`, once per process, selected in `GitDriver::build` at `driver.rs:311`. Pre-F0 for any verb that builds a driver.
- Floor record check (git var x2, config --list): `driver.rs:667-710` (`config_paths`, the `var` loop at 691) and `driver.rs:1482-1531` `floor_key`; the key includes `hostVersion`, `probeCode` (digest of driver.rs, so ANY edit to driver.rs, including F0's +9 lines, changes it) and the git binary stamp. A mismatch runs `probe_floor` (`driver.rs:1533`, probes at ~1618-1700) and overwrites the single record (`driver.rs:1471-1479`). Pre-F0.
- Repository facts after the floor: `read_repository_facts` (`driver.rs:380-399`): `config` and `rev-parse --show-object-format`. Pre-F0.
- F0 root door: `apps/fgos/src/main.rs:290-299` `Doors::enter`, `apps/fgos/src/invocation_doors.rs` -> `fgos_git::invocation_root::read_repo_facts` (`packages/git/rust/src/invocation_root.rs:98-104`) -> `GitDriver::topology_at` (`driver.rs:357-365`, new in F0, documented "no Git child"). It spawns no git, but `GitDriver::new` -> `build` -> `containment::select` (`driver.rs:311`) runs the bwrap probe: this is F0's only added spawn pair, on every native verb. `store_admission`, the fault record and the Event Store start/end trigger add no process for `version` (identical lists in repo).
- `version` is in `LENIENT_ROOT_VERBS` (`invocation_doors.rs:30-39`): a refused root never blocks it, but the root is still resolved first.

## Attribution

- F0: +2 execs / about +2 ms outside a repository for every native verb (bwrap probe in the root door's driver build). Inside a repository the driver was already built by the verb, so no delta.
- Pre-existing: all 13 git/bwrap spawns of `version` in a repo, and the cold-record 52-exec probe. Neither got slower or faster with F0.
- Not F0 but made visible by it: the single machine-global floor record. F0 changed driver.rs, so F0 and base thrash each other's record; any lane's rebuild does the same.

## Smallest fixes (not implemented)

1. `version` needs no Git for its answer's fast path. Smallest: in `resolve_git_commit` (`packages/distribution/rust/src/lib.rs:191`) read HEAD from disk (the topology the root door already uses, then `.git/HEAD` plus ref or `packed-refs`), or run the Git call only when `--runtime-json`/a flag asks for the commit. Belongs in `packages/distribution/rust`, behind the existing Git component port (a new read-only method on `fgos_git`, next to `topology_at`, so the distribution crate stays free of Git file formats). Removes all 13 spawns: ~21 ms -> ~3 ms in repo, 60 -> 3 ms cold.
2. Root door: make the driver build lazy so `topology_at` does not run the bwrap probe (`containment::select` at `driver.rs:311` only when the first child is spawned, e.g. a `OnceLock` in the driver). Belongs in `packages/git/rust/src/driver.rs`; recovers the +2 ms on every verb including `--help` (+1 to +5 ms measured) and `config`.
3. Floor record: key it per probe-relevant inputs, not per host build: keep the record per `probeCode`/hostVersion (a small map or per-key file) so two builds stop evicting each other. Belongs in `driver.rs` `git_floor_verdict`/`FLOOR_RECORD` (`driver.rs:28`, `1471-1531`). It is what turns 60 ms into 20 ms on a multi-build machine; ask the owner first since it changes the record format.
4. `resolve_repo` calls `require_floor` before the disk-only topology check (`driver.rs:373`); checking topology first would let a non-repository path (installed release dir) skip the floor entirely: 9 execs -> 1 exec for `version` in production. Belongs in `driver.rs`; check every `resolve_repo` caller still needs the floor for a non-repository answer before moving it.

## Unresolved

- Phase 11 reported 15 processes at 78 ms: the 15 matches the warm list, the 78 ms matches the cold-record timing. Both can occur in one run only if the record was rewritten between measurements; not reproduced as a single run.
- Timings are on a loaded machine (load 5-12); the private state root removes the cross-lane effect on the floor record but not CPU contention. Warm in-repo median could shift a few ms.

Cleanup state: worktree rvm-ab-base removed; removal of rvm-ab-f0 REFUSED (worktree-delivery-unproven: its head is not delivered to origin/main), so rvm-ab-f0, both target dirs and the /dev/shm/ab-* scratch dirs are still on disk, pending the lead.
