# HARDEN T1 baseline: holder-lock, session identity, convention, hot mutex

Big lead `forgent-a8`, 2026-10-22 01:38 (Asia/Saigon). These are the measured "before" numbers for the [T1 council](council-261021-2338-harden-t1-council-brief.md), so every seat argues from the same figures.

## Setup

- Second machine, 24 cores, ext4 NVMe. Load average was 0.25 at the start and 0.25 at the end, and no other suite was running.
- The code is the active release `sha256:79d2eed3…` (main `e679a2d4e`), so every number comes from code that is actually shipped: the Node payload `libexec/legacy-node` and the host `bin/fgos`.
- The fgOS directory is a scratch directory on ext4, `forgent-worktrees/t1-bench/.fgos`. The session variables were unset and `FGOS_HOST_BIN` was set to the release host.
- In-process calls were warmed with 5 calls, then sampled 300 times. Each route was spawned 30 times.
- The script is a throwaway in the session scratchpad and is not committed. Two runs gave the same numbers within 3%; the second run is shown.
- GIT found that this NVMe's fsync is bimodal, at 5.2 or 7.5 ms per fsync. So a plain `write`+`fsync` probe on the same filesystem sits next to the lock numbers: any fsync-bound figure should be read against it.

## Numbers

| Call | p50 | p95 | What it is |
|---|---|---|---|
| Plain `write`+`fsync` probe on the same fs | 5.20 ms | 5.36 ms | reference for fsync-bound paths |
| Holder-lock `acquireSync` + `release`, uncontended (`gateway`) | **1.36 ms** | 1.52 ms | one host route spawn per acquire (`runLockRouteSync`, `src/holder-lock/index.mjs:252`) |
| Hot mutex `withStateTx` with an empty body | 19.6 µs | 29.1 µs | in-process Node |
| `resolveWriterIdentity`, cached | 0.9 µs | 1.7 µs | in-process Node |
| `resolveStateRoot` | 0.8 µs | 2.1 µs | in-process Node |
| Route `fgos internal state-root` | 1.23 ms | 1.30 ms | host spawn |
| Route `fgos identity --pid` | 1.41 ms | 1.45 ms | host spawn |
| Route `fgos convention name` | 1.38 ms | 1.43 ms | host spawn |

## What the numbers say

1. **The holder-lock costs a process spawn on every uncontended acquire.** That is 1.36 ms, about 70 times the cost of the hot mutex. It matches the cost of a bare host route (1.2–1.4 ms), so almost all of it is the spawn, not the locking. The owner decided on 12:05 that hot paths and lock waits go through the in-process door. Whether the holder-lock acquire is a hot path, and which of its callers are, is for the council to settle (brief, Part A).
2. **The hot mutex's fast path is cheap in absolute terms.** At 19.6 µs it is far below one fsync. TEST's HL-F1 says it costs 6–10% more than the lock it replaced; that is about 2 µs and is for the hot mutex review. The 22–25 µs that TEST measured under load sits in the same range.
3. **Identity and state-root lookups are already sub-microsecond in Node.** Moving them to Rust through the door would add N-API cost (T0 measured about 4 µs for a small canonical-JSON call). The council weighs that against having one authority.
4. **Each cold route costs about 1.2–1.4 ms.** That is the host spawn floor on this machine, and it is the price of any call that keeps a route.

## Not measured here

- Contended holder-lock acquires and lock waits: these need a second process and belong to the seat that proposes a change to them.
- The fence verb (`fgos lock fence`): T0's smoke measured it at 0.2 s on a free lock, including the CLI start-up.
- The SEAT files: SEAT has not landed, so the identity and convention numbers are main's.
