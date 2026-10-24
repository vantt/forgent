# Work cutover final CLI A/B, release addons

2026-10-24 11:40-11:42 (Asia/Saigon), after the coordinator's go (HARDEN merge finished, other lanes holding). A = `origin/main` `641151f0c`; B = `work/es-cutover` `f230d87ca` (contains that main; `merge-base --is-ancestor` true). Read-only measurement; scratch worktrees, separate ext4 release target dirs and fixtures removed afterwards.

## Method (same as the previous release run)
`cargo build --release --locked -p fgos -p fgos-node-addon`, own target dir per side. The release host and addon are staged for `node bin/fgos.mjs move` through the dev-host manifest env, and copied into B's harness staging dir so the harness cannot restage a debug addon. Every run re-hashes the addon named by the manifest and aborts on mismatch (`identity.txt`). Fixtures on ext4, session ids unset, 1 unmeasured warm move per side, then A,B,A,B with 10 moves per run = 20 per side in one set, loads 0.18-0.67 (all < 3, no wait). Counts from a separate strace pass (4 moves per side).

| | A | B |
|---|---|---|
| addon sha256 | `01b2d85d66012be3...0bad` | `f3e5c4c56f7c17f3...6e0d` |
| addon size | 12,204,704 B | 12,363,264 B |
| loaded from | `.fgos/runtime/diag-host/release/fgos.node` | `.fgos/runtime/git-addon/<hash>/fgos.node` (release bytes) |

## Result (median ms, range, n=20 per side)

| side | until result prints | until CLI exits | until seal child exits (receipt probe, ~85 ms, included) |
|---|---|---|---|
| A | 150 (139-181) | 153.5 (143-185) | 153.5 (inline) |
| B | 272.5 (223-345) | 293 (242-364) | 775.5 (664-880) |

Per-run medians of print: A 150.5 / 147.5, B 284 / 257.5. B/A until print = 1.8x; B costs 122 ms more per move before the answer.

## Counts per move (strace, 4 moves, median)

| | git children | fsyncs |
|---|---|---|
| A CLI | 5 | 0 |
| B CLI (to exit) | 11 (15 on the fixture's first move) | 4 |
| B seal child | 32 | 65 |

Same counts as the earlier runs. Each repo-touching sandboxed git (`bwrap` exec to exit, strace) took 17-20 ms in B's gate and 17.6 ms for A's single one, 4-5 ms for repo-less ones: the slow-git regime of the previous report was present again, so most of B's extra 122 ms is the six gate git calls (about 100 ms) plus start trigger and append (about 40 ms) less shared costs; see the previous report for the phase split and ideas.

Status: DONE
