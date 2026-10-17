# Phase report: run supervisor P01, containment port + Linux drivers

Status: DONE_WITH_CONCERNS. Branch `run-supervisor/p01-containment-linux` (c1e79c6ad) merged into integration (db9ee40fb, main merged first).

## Built
- `containment/mod.rs`: `ContainmentDriver` trait, `SpawnSpec`, `Spawned`, `ContainmentDomain`, `Guarantee`, `ContainmentError` (named), `select(SelectEnv)`.
- `containment/linux.rs`: `BwrapPidns` (prefix check, `--info-fd` child-pid read, domain `linux-gate`, empty = `judge(gate)==Dead`), `LinuxPgroup` (setsid leader, subreaper, `/proc` tree + pgrp scan, `seen` set). bwrap probe runs the real default argv once per process and path.
- `Domain::LinuxPgroup(ProcTuple)` in `lib.rs` (+ `domain_is_empty/kill_all`), mapped in holder-lock `predecessor.rs` (`linux-pgroup`, matches predecessor.v1.json).
- Contract `containment.port.v1.json`: `bwrapPrefix` and `mode` added to spawn spec.

## Tests (all real bwrap / processes)
`cargo test -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor -p fgos-agent-protocol`: 86 pass, 0 fail, 23 binaries (run in phase worktree and in integration, private target dir).
New: `containment_bwrap.rs` 7 tests (pid 1 + NSpid, setsid grandchild heartbeat stops <200ms + empty, direct survives killed supervisor, terminal dies with it, die-with-parent errors, select), `containment_pgroup.rs` 3 tests (20-tree with setsid, record-only judge/kill, SIGTERM-grace snapshot), 1 unit test.
`cargo check --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (fgos-process, holder-lock, tests): ok.

## Review (Sonnet code-reviewer) and fixes
Fixed: pgroup grace path snapshots tree before SIGTERM; tree walk only while leader alive (dead leader pid may be reused); `BwrapPidns::kill_all` returns Refused on wait timeout; added terminal-prefix error test and grace test.
Not fixed (concerns): subreaper orphans stay zombies until the caller reaps (judged dead, correctness fine); spawn timeout path (10 s) kills only the bwrap monitor, gate may live in direct mode; second `/proc/stat` parser local to linux.rs; bwrap tests print `skip: no-bwrap-pidns` and pass on machines without userns.

## Decisions
- `Domain::LinuxPgroup` carries the leader tuple (pgid = leader pid), per predecessor.v1.json, not a separate pgid field.
- Given bwrap prefix is never edited; terminal mode without `--die-with-parent` is an error, default prefix adds it.
- Gate that exits before its identity is read -> `spawn-failed`.
- Impact analysis: GitNexus index stale; grep shows `Domain` matched only in lib.rs and predecessor.rs (both updated). No HIGH/CRITICAL symbol edited.

## Unresolved
- Windows/macOS CI run not requested (P02 owns those drivers).
