# Proposal: a single-writer state daemon for fgOS (CLI + MCP + runner as thin clients)

Status: **proposal, not scoped, not scheduled** — captured during `tsk-3jh`'s
own investigation so the discussion isn't lost; not part of `tsk-3jh`'s own
scope (see "What tsk-3jh actually does" at the end).

## Problem this responds to

`tsk-3jh`'s own real, measured evidence: every `fgos <verb>` process — and
every internal read/write helper in `src/state/store.mjs` — independently
calls `rebuildView(logPath)` = `readEvents(logPath)` (parse the *entire*
`events.jsonl`, 10,539 events / 4.5MB and growing unbounded) +
`foldEvents(...)` (refold from scratch), with **zero caching, even within
one synchronous call chain**. Measured: one `moveWork` (todo→doing) =
166ms / 3 full log reads (13.1MB parsed); `claimWork`'s state-layer alone =
274ms / 7 full log reads (30.6MB parsed) — `claim-port.mjs` calls
`listWork`, `readRawEvents`, `moveWork`, `addOutcome` in sequence, none
reusing the previous call's result.

This is a fixed tax on every verb, monotonically growing with project age.

## Four options considered, neutral evaluation

Discussed live while investigating `tsk-3jh`. `.fgos/` worktree-isolation
precedent (`docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`,
`docs/explanation/worktree-isolation-axis-decision.md`) already
establishes vocabulary for options 1-3; option 4 (daemon) is new to this
discussion.

| # | Approach | Correctness | Safety (untrusted writer) | Performance | Build cost |
|---|---|---|---|---|---|
| 1 | **Lock-in-tree** (symlink `.fgos/` back to shared store — `session.mjs`'s existing D10 pattern) | Always current (real file) | **Weakest** — a stray write from an unrestricted worker lands directly in the live log, unreviewed | No help — still one file, one lock; more concurrent worktrees holding live symlinks would mean *more* lock contention | Lowest |
| 2 | **Isolate-tree** (bootstrap-copy `.fgos/` per worktree + union-merge at merge-back — beegog/symphony pattern, `repository-harness`'s own `symphony-isolated-runner`) | Needs a real merge/reconciliation algorithm — two divergent logs both mutating the same CAS-guarded item is genuinely hard to resolve correctly | Good — a stray write only corrupts the worker's own disposable copy | **Only option here that actually reduces the read/write-amplification problem** — a worker on a small local copy doesn't replay the whole central log | Highest — a real subsystem, breaks fgOS's current single-writer/CTR001 model |
| 3 | **Block-tree** (delete `.fgos/` from every worktree checkout, `merge.mjs` hard-rejects any diff touching `.fgos/`) — **the option fgOS actually chose**, `docs/decisions/0020` | Safest by construction — nothing to read stale, nothing to write to | Good, plus a mechanical merge-time guard as defense in depth | **No help at all** — orthogonal to the read-amplification problem; this only answers "does a worktree get its own copy," not "how fast is a read against the one shared log" | Low |
| 4 | **Single-writer daemon** (long-running process holds the folded view in RAM, folds *incrementally* as new events arrive, is the only process that ever touches `events.jsonl`; CLI/MCP/runner become thin clients over IPC) | Real file is touched by exactly one process — no cross-process race to reason about at all | Best of all four — no other process ever has a raw write path to the file, structural rather than convention-based | **Solves the root cause directly** — reads become in-RAM lookups, no per-call re-parse of a growing log | High — new subsystem (IPC, lifecycle, fallback), but doesn't require abandoning the single-writer model like option 2 does — it *strengthens* it |

**Verdict:** no universal winner — depends on which problem is being
solved. For "should a worktree get its own `.fgos/`" (the question
`0020` actually answered), option 3 remains correct and cheapest for
today's verified need (nothing in the dispatch path reads/writes `.fgos/`
from inside a worktree). For "how do we stop paying a full-log-replay tax
on every verb call" (`tsk-3jh`'s own problem), **option 4 is the strongest
answer** — option 2 is the only alternative that also helps, but at a much
higher cost and a real conflict with CTR001's one-door-write model that
option 4 instead reinforces.

Concrete evidence the daemon idea isn't purely theoretical: `src/runner/
loop.mjs`'s `runWatch` is *already* a genuinely long-running process
(`while (!options.signal?.aborted)`) — and it still calls `listWork(dir)`
fresh every single iteration, with zero reuse of the previous tick's fold.
Even the one piece of infrastructure already shaped like a daemon isn't
exploiting that shape today.

## The daemon design sketched in conversation

- **Transport**: Unix domain socket, scoped per repo under
  `.fgos/daemon.sock` (mirrors the existing per-repo `.fgos/` scoping and
  `.fgos/runner.lock` convention) — not a single machine-wide daemon.
- **Lazy boot**: the `fgos` CLI tries to connect first; on
  `ENOENT`/`ECONNREFUSED` it spawns the daemon (detached) and retries the
  connect with backoff. Two CLI invocations racing to boot resolve
  naturally — the loser's retry-connect succeeds against the winner's
  socket, no separate boot-lock needed.
- **Idle shutdown**: the daemon exits after N minutes of no client
  activity — deliberately not "runs forever once started." Directly
  motivated by this same session's own inode-exhaustion incident (~150
  abandoned worktrees/processes never cleaned up) — a daemon with no
  self-shutdown would be the same class of accumulating-background-load
  problem.
- **Graceful fallback**: any environment where the socket can't be
  created (sandboxing, an unwired Windows named-pipe path) falls straight
  back to today's direct-file-read behavior — never a hard failure for
  lacking a daemon.
- **Three thin clients, one daemon**:
  1. `fgos` CLI (unchanged agent-facing interface — this is the point:
     agents keep calling `fgos <verb>` exactly as today).
  2. An MCP server (`fgos-mcp` or similar) as a *second* client of the
     same daemon socket — structured JSON-RPC tool calls instead of
     shelling out + parsing stdout, and sidesteps the untrusted-title/
     description shell-splicing concern (RUL45) every skill in this repo
     currently has to hand-guard against. Direct precedent already live
     in this exact toolchain: `mcp__gitnexus__*` — one repo, both a CLI
     and an MCP server, already proven to coexist.
  3. `fgos-runner` (`loop.mjs`'s `runWatch`) — becomes a third client for
     free, closing the exact missed-opportunity gap named above.
- **Correctness discipline carried forward, not abandoned**: the daemon
  becomes the literal, structural embodiment of CTR001's one-door-write
  rule (today enforced by convention/code review across independent
  processes coordinating via a file lock) — strengthens the existing
  architecture rather than replacing it with option 2's multi-writer/
  reconcile model.

## What this proposal does NOT decide

- Whether to build this at all, and when.
- Exact RPC wire format, incremental-fold implementation, MCP tool
  surface, or how `fgos-mcp` would be packaged/registered.
- Whether `runWatch`'s own in-process fold-reuse (no IPC needed, same
  process) is worth doing as a smaller first step before any daemon/IPC
  work — flagged in conversation as a lower-risk stepping stone, not
  decided.

## What `tsk-3jh` actually does (unchanged, narrower scope)

Per the earlier, separately-locked decision: `tsk-3jh` stays scoped to
eliminating *redundant reads within one synchronous call chain* (e.g.
`claimWork` re-fetching the view multiple times via `listWork`/
`readRawEvents`/`moveWork`/`addOutcome` when nothing else could have
written to the log in between) — no daemon, no IPC, no change to the
worktree-isolation model. This proposal is future context for `tsk-13m`/
`tsk-5nj` (noted in the original queue as sharing files with `tsk-3jh`) or
a later, independently-scoped initiative — never silently folded into
`tsk-3jh`'s own implementation.

## Open questions

- Does the daemon idea get its own backlog item now, or wait until
  `tsk-3jh`/`tsk-13m`/`tsk-5nj` land and the smaller fix's real measured
  improvement is known?
- Is `runWatch`'s own in-process fold-reuse worth doing as an independent,
  smaller item regardless of the daemon decision?
