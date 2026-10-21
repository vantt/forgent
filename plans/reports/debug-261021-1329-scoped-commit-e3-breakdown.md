# ScopedCommit E3 breakdown: where the typed port's time goes

Diagnosis only. No product code changed, nothing committed. Host fg-server2, ext4 on Samsung 980 PRO, governor `performance`, git 2.53.0, source = worktree `git-fu` (bf199c74b; scoped_commit/wal/driver unchanged since the E3 run). Times Asia/Saigon, 2026-10-21 13:30-13:45.

## 1. Answer in one paragraph

The port is not slow in compute. With every `fsync` made a no-op the port takes **70.7 ms p50** (legacy 74.3 ms). The whole gap is durability the legacy path does not do at all: the port issues **19 fsyncs in a warm repository (16 serial flushes, 83 ms) and 27 in a fresh one (+21 ms)**, each costing a raw **5.2 ms** on this disk. The legacy commit does zero fsyncs. Of the port's 155 ms (warm), fsync wall time is 83 ms (53 percent), 8 bwrap-contained Git spawns are 27 ms, 28 plain Git spawns ~31 ms, Rust/Node glue ~14 ms. Targeted fixes that touch no spec text recover about 15-17 ms (ratio ~1.9 p50); reaching 1.5 x needs spec-text decisions or an absolute budget.

## 2. Method and measurement conditions

- Fixture identical to the E3 `scopedCommit` row (fresh repo, linked worktree, one tracked payload, preflight + commit timed together, `createGitScopedCommit` constructor excluded). Scratch copy of `scripts/git/e3-bench.mjs` plus a `probe` mode, under `/home/vantt/.claude/jobs/e1505f04/tmp/e3-breakdown/` (`bench-copy.mjs`, `run-probe.sh`, `run-shim.sh`, `gated-final.sh`).
- Two variants: **cold** = fresh repo per sample (the E3 fixture; the first operation in a repository creates the WAL directories); **warm** = a prior operation in another linked worktree of the same repo already created them (steady state).
- Step timing without ptrace overhead: an `LD_PRELOAD` shim (`probe-shim.c`) in the Node process logs `posix_spawn`/`fork` to reap time per child, every `fsync` with its duration and path, and `access()` markers. Log goes to **/dev/shm**: writing the log to ext4 added ~30 ms because every extra journal write makes the next fsyncs real; likewise `strace -o` on ext4 inflated fsync counts and time, so strace was used only for structure (children, argv, containment = `bwrap --unshare-pid`). Shim cost on tmpfs: about +4 ms on the port row (passthrough alone), so shim runs read 1-4 ms higher than vanilla runs.
- The shim is inherited by the hook-context `git commit` child, so the "NOFSYNC" run also removes git's own 3 fsyncs.
- n = 40 per row, p50 (p95 in brackets). Each run started with 1-min load < 3 (gate in `gated-final.sh`; start loads 1.5-2.8; max 1-min load seen inside a run 2.8). Two repetitions. Raw: `final-series.txt`, `final-*.json|log`.

| Run (ms) | legacy | port total (pre+commit) | preflight | commit | load1 start |
|---|---|---|---|---|---|
| rep1 vanilla cold | 79.9 (93.8) | 177.7 (186.0) | 20.3 | 157.5 | 1.5 |
| rep2 vanilla cold | 72.6 (80.2) | 172.8 (180.7) | 19.5 | 153.3 | 2.7 |
| rep1 vanilla warm | 78.8 (86.3) | 155.1 (166.7) | 20.1 | 134.7 | 2.1 |
| rep2 vanilla warm | 74.3 (78.9) | 154.6 (160.5) | 20.1 | 134.7 | 2.5 |
| rep1 / rep2 warm, NOFSYNC | - | 72.0 / 70.7 | 19.7 / 19.4 | 52.2 / 51.3 | 2.8 / 2.1 |

p50 ratio port/legacy: cold 2.2-2.4, warm 2.0-2.1 (E3 run: 171/70 = 2.4 p50, 2.69 p95). Constructor `createGitScopedCommit`: 8.2 ms, not in the E3 row.

## 3. Per-step table, port (warm, rep2, p50 of 40 windows; fsync = union wall time)

Preflight (20.2 ms): checkout_repository = 2 contained spawns (`config --null --show-origin --list`, `rev-parse --show-object-format --show-ref-format`) 6.7 ms; 6 plain Git (MERGE_HEAD, staged diff, HEAD, symbolic-ref, dirty diff, ls-files others) 10.3 ms; glue 3.2 ms.

Commit (135.7 ms):

| Step | ms | fsync (count, wall) | contained spawns | plain Git | glue |
|---|---|---|---|---|---|
| S0 addon entry, checkout_repository, Wal::open | 8.4 | 0 | 2 = 6.7 | 0 | 1.7 |
| S1 admission reads, scope match, rollback inventory, add, staged, write-tree (11 Git) | 18.0 | 0 | 0 | 14.6 | 3.4 |
| S2 WAL Intent + Prepared | 21.4 | 5 = 20.8 | 0 | 0 | 0.6 |
| S3 re-verify (rev-parse, write-tree) + WAL TargetAttempt | 13.4 | 2 = 10.4 | 0 | 2.0 | 1.0 |
| S4 `git commit` (core.fsync=all, 3 fsyncs inside git) | 17.4 | 3 = 15.6 | 0 | 1.8 own | 0 |
| S5 post-hook facts refresh (2 contained) + show + diff | 11.4 | 0 | 2 = 6.9 | 2.4 | 2.1 |
| S6 sync_refs (3 dir fsyncs; 2 are free after the first) + WAL Outcome | 16.6 | 5 = 15.6 | 0 | 0 | 1.0 |
| S7 compaction: pin-absent reader (symbolic-ref + show-ref, 2 contained) + ledger record + 2 dir fsyncs | 28.6 | 4 = 20.8 | 2 = 6.9 | 0 | 0.9 |
| **Total** | **135.7** | **19 = 83.1** | **6 = 20.5** | **16 Git = 20.8 net of commit's fsyncs** | **10.9** |

Whole port, warm: fsync 83 (53 %), contained spawns 27 (17 %), plain Git ~31 (20 %), glue ~14 (9 %). Node to addon: first spawn starts 1.0 ms after the call; the tail after the last fsync is ~0.1 ms, so the call/loan/verification overhead is about 1 ms. Write-scope matching, JSON, snapshot inventory sit inside the glue figures (S1 residual 3.4 ms total): negligible.

Cold adds only S0: 29.3 ms instead of 8.4 (8 directory fsyncs creating `fgos`, `git`, `operations`, `compacted`, each fsynced plus its parent, +20.9 ms). Once per repository, not per operation.

Counts per preflight+commit: 28 Git children (8 contained under bwrap, 20 plain borrowed), 27 fsyncs cold / 19 warm.

Per-child cost: plain borrowed Git 1.0-1.4 ms spawn-to-reap plus ~0.4 ms glue; contained spawn 3.4 ms (standalone `bwrap+git` 2.1 ms vs `git` 0.65 ms, measured in `spawn-cost.py`; the extra ~1.3 ms is the 2 ms `try_wait` sleep loop plus reader threads in driver.rs invoke_context, while the borrowed path in holder-lock port.rs:1023 already wakes on pipe/exit).

## 4. Per-step table, legacy `commitUnitWork` (rep2 warm run, 75 ms p50)

24 children, 0 fsyncs, no WAL: 12 Git (rev-parse --git-common-dir 1.2, config core.hooksPath 1.2, MERGE_HEAD 1.3, diff --cached 1.6, status --porcelain 1.7, add 1.7, diff --cached 1.6, config user.name 1.3, user.email 1.3, commit 2.3, rev-parse HEAD 1.3, show --name-only 1.6; sum ~19.5 ms) each followed by one `fgos internal lock-fd --protocol 2 --drain-child` helper (3.0-3.9 ms each, ~42 ms total) and ~0.6 ms of Node gap per child (~14 ms). The legacy path pays more per child than the port; the port pays for durability the legacy never had.

## 5. Floor

Raw ext4 cost here (`flush-cost.py`, n=300): file fsync 5.18 ms, directory fsync 5.20 ms, one WAL-style record install (write, fsync, link, fsync dir) 10.4 ms; a directory fsync with nothing dirty is free (hence two of the three `sync_refs` fsyncs cost nothing).

Required serial flushes by the signed rules (§10 record install rule, rule 4, directory-durability paragraph; E1 order and negative controls held 2026-10-21):
- WAL records Intent, Prepared, TargetAttempt, Outcome: 4 x (file fsync, then directory fsync) = 8 (the `operations/` fsync after record 0 runs in parallel already).
- Git commit objects + ref: 2 (a third, the index, comes from the chosen `core.fsync=all`).
- Ref directory chain after the CAS: 0 extra if overlapped with the Outcome record's file fsync (§10 requires only "before the receipt").
- Compaction ledger record: 2 (if compaction stays inline, spec §8 "compacting terminal chains immediately").

Floor = 12 flushes x 5.2 = **~62 ms** (10 = 52 ms if compaction is taken off the call). Today: 16 serial flushes (83 ms). Floor for the whole operation with today's Git child set: 70.7 (compute, measured) + 62 = **~133 ms, ratio ~1.8 p50 against legacy 74**. The 1.5 x budget (about 111-120 ms) is therefore not reachable by fsync work alone; it needs compute cuts of ~15-20 ms on top of the zero-risk items, or an absolute budget as chosen for Land.

## 6. Candidates (warm p50 savings are estimates unless marked measured)

| # | Change | Saving | Rule touched | Property weakened? |
|---|---|---|---|---|
| C1 | Contained path: replace the 2 ms `try_wait` sleep loop (driver.rs invoke_context) with the poll-on-exit wake the borrowed path already uses | 8-10 ms (8 contained spawns, ~1.3 each) | none (deadline, kill_all, domain-empty check unchanged) | no |
| C2 | Run `sync_refs` through the existing `append_ordered(alongside)` (used by publication.rs:475) so the ref-directory fsync overlaps the Outcome record's file fsync | 5.1 ms (measured serial step) | §10 "ref directory fsynced before the receipt": preserved by `before_install` | no |
| C3 | Compaction reader: skip the candidate-pin read for ScopedCommit (never installs a pin) or fuse symbolic-ref + show-ref into one child | 3.5-6.9 ms (measured S7 contained spawns) | §10 compaction guard / §8 pin release; owner nod because pins are Git-reserved | no for ScopedCommit; guard vacuous there |
| C4 | `show -s` + `diff --name-only` as one `show --name-only -z --format` read | ~1.4 ms | §8 single header observation (2026-10-20 note) | no |
| C5 | One `status --porcelain=v2 --branch -z` instead of staged diff + HEAD + symbolic-ref + dirty diff + ls-files others, in both preflight and commit | ~5.5 ms each, ~11 ms total | §7 hardened parsers (new parser), §8 | no if fresh per call and `--no-optional-locks` kept; needs equivalence tests |
| C6 | One child for config list + formats (derive formats from config text) at the 3 checkout_repository sites | ~10 ms | §7/§8: changes what is trusted for format facts; post-hook refresh stays | medium risk, needs owner review |
| C7 | Drop the two trailing compaction fsyncs (after record removal, after rmdir) | 10.3 ms | §10 compaction durability; named checkpoints `removed-records-fsync`, `removed-operation-parent-fsync` have tests | not by reasoning (ledger is durable before removal, replay is idempotent), but not covered by the E1 negative controls: needs one |
| C8 | `core.fsync=objects,reference` for the commit (drop the index fsync) | 5.2 ms | §10 directory-durability paragraph (core.fsync is a backend input); receipt claims processCrash only | owner decision; not proven by E1 |
| C9 | Take compaction off the call (consumer calls compact later) | up to 28.4 ms from latency, moves the cost | §8 "compacting immediately", WAL amplification budget (≤ 32 KiB / ≤ 12 inodes), API change; borrowed locks cannot outlive the call so no detached thread | latency hiding only |
| C10 | First-use WAL directories: skip fsync of the new empty directory, keep the parent's | ~10 ms once per repository | §10 "newly created ancestor directories are fsynced and their parent" | rule text says both; per-repo, not per-op |
| C11 | One contained domain per operation instead of per Git child (owner idea already parked in e3-budgets.md) | ~10 ms on top of C1 | §5/§7 containment granularity | owner decision |

Stacks (warm p50 155): zero-spec-risk C1+C2+C4 about -16 ms, 139 ms, ratio ~1.85. Adding C3+C5+C6 about -25 ms, ~114 ms, ratio ~1.5 at the edge. C7/C8/C9 would take it under 100 ms but each needs an owner decision. Fixture note: the E3 row is cold; an honest steady-state comparison is the warm row (about 20 ms lower), still ~2.0.

## 7. Notes on reading the E3 comparison

- Port row = preflight + commit (20 + 135 ms warm); legacy row = commit only, with no durability, no WAL, no containment, no admission. The comparison cannot reach 1.5 x unless the safety work is removed or its cost hidden.
- Do not trust strace-with-output-on-ext4 for fsync counts or time: it perturbs the journal (my first traces showed 25 vs the real 27 and inflated times).

## 8. Unresolved questions

- Constructor 8.2 ms (`createGitScopedCommit`) is outside the E3 row; whether a consumer pays it per call or per process was not examined.
- C1 and C6 estimates come from standalone spawn costs and the timeline, not from a patched build (no product edits allowed).
- Whether C7 is covered by the E1 power-cut harness (it traced Publication, not compaction removal) was not tested.
- Legacy's `fgos internal lock-fd` helper (42 ms of its 75) is the legacy cost that disappears with the baseline; not an optimisation target.

Status: DONE
Summary: Port warm p50 155 ms vs legacy 74 ms; with fsync disabled the port is 71 ms, so the gap is 19 fsyncs (16 serial flushes at 5.2 ms, 83 ms) plus 8 contained spawns; floor under signed rules is about 133 ms, zero-risk fixes recover about 16 ms.
Concerns/Blockers: 1.5 x p50 is not reachable without spec-touching candidates (C3, C5-C9) or an absolute budget; shim runs carry about +4 ms overhead; a few load readings reached 2.8 inside runs (all below 3).
