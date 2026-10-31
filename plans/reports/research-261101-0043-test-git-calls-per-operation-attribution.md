---
title: "Git calls per operation: where each git child of one move and one approve comes from"
description: "Caller attribution for owner decision 57 (cut per-operation Git calls): every git child of one Work move and one approve mapped to the code that asked for it, with time per call site."
---

# Git calls per operation, by call site

Owner decision 57 (HARDEN plan, 2026-10-31 11:02) cuts the Git calls one operation makes, by code owner, measured
before and after on TEST's probes. This report is the caller attribution the split waits on. Owner, 2026-11-01 00:35:
«ok làm 1,2,3 đi» gives TEST the attribution and the Node-side cuts.

## How it was measured

A throwaway probe (`test/zz-gitcalls.test.mjs`, not committed) runs in one process: one Work `move` todo→blocked, one
`move` doing→awaiting-approval with `skipReturnGuard`, and one `approve` of a trivial runner item (`verify: true`).
It wraps every function of the native addon (and the methods of its classes) and every `child_process` spawn. Each
wrapped call drops a marker path through `access(2)`; `strace -f -e execve,access` then gives every `git` exec
together with the innermost open marker, which carries the JS caller frames. The same wrappers record wall time
per call site. Timing is from one run on an otherwise idle fg-server2 (a second run under load was about 1.5–2×).

Async native calls (`GitLand.prepare`, `GitLand.publish`) close their marker before their work runs; their git
children are attributed by the marker that just closed.

In-process callers seal synchronously. A CLI process hands its seals to one detached child after it prints
(`src/event-store/seal-coalescing.mjs`), so a person at the terminal does not wait for the seal; the CPU and the
git children are still spent, and every in-process test pays them in line.

## Totals

| Operation | git children | Wall time (in process) |
|---|---|---|
| `move` todo → blocked | 31 | 120 ms |
| `move` doing → awaiting-approval, skip reason | 77 | 317 ms |
| `approve` of a trivial runner item | 231 | 953 ms |

## Where they come from

| Call site | Owner (decision 46/57) | Calls | git each | Time |
|---|---|---|---|---|
| `EventStore.seal` after a lifecycle append (`consumer-event-gate.mjs:84`) | Event Store crate | 5 in the three ops | 26 (7 single-ref `for-each-ref`, 4 `hash-object -w --stdin`, 4 `cat-file --batch`, 2 `--batch -Z`, 2 `--batch-check`, `rev-list --objects`) | 405 ms |
| `EventStore.read` (state reads) | Event Store crate | 12 | 5–8 (`for-each-ref`, 1–2 `rev-list --stdin`, 3 `cat-file` processes) | 240 ms |
| `GitLand.recover` at approve | Git crate (OPC) | 1 | 33 (10 single-ref `for-each-ref`, 6 `symbolic-ref`, 4 `update-ref -d`) | 225 ms |
| `GitLand.prepare` | Git crate (OPC) | 1 | 48 (10 single-ref `for-each-ref`, 5 `symbolic-ref`, the merge itself ~15) | 154 ms |
| `GitLand.publish` | Git crate (OPC) | 1 | 33 (7 `symbolic-ref -q HEAD`, 3 `write-tree`, 6 single-ref `for-each-ref`, 3 `worktree list`) | 101 ms |
| `GitInspect.call` from Node merge/approve callers | Land/merge callers (HARDEN) | 29 | 1–3 | 170 ms |

### Why a move makes more than one transaction

`moveUseCase` (`src/verbs/state/move.mjs`) and `moveWorkOnce` (`src/state/store.mjs`) write follow-up events in
their own transactions, and each transaction is one full state read, one gated read, one append and one seal:

- `move --skip-return-guard` / `--override-reason`: a `listWork` read for the guard (`move.mjs:37`), then
  `addDecision` (`move.mjs:48`), then `moveWork` (`move.mjs:56`).
- every move into `awaiting-approval`: `recordCall` for the review handoff after the move (`store.mjs:975`).
- every move into `delivered`: one `recordCallReturn` per open call thread, plus the learning compose.

So the doing → awaiting-approval move above is four state reads and three seals for one status change.

### Repeated Git questions in approve's Node callers

| Question | Asked | From |
|---|---|---|
| `detectTrunk` (2 git each) | 4× | `approve.mjs:699`, `merge.mjs:377`, `merge.mjs:857`, `branchExists` inside it |
| `branchExists` | 6× | `classifySource` (`merge.mjs:226`) 3×, `detectTrunk` 3× |
| `resolveRefSha` | 7× | `changedFiles` 4×, `landOperationFor`, `landRunnerItem` 2× |
| `changedFiles` (merge-base, rev-list ×2, diff) | 2× | `ironLawForItem` (`iron-law-gate.mjs:58`) and `landRunnerItem` (`merge.mjs:898`), same refs |

## Cuts, by owner

1. **Event Store crate** (the largest share of a move): a seal asks for refs one `for-each-ref` at a time and opens a
   new `cat-file` process per lookup kind; a read opens three `cat-file` processes. One ref snapshot and one
   `cat-file --batch` per operation is decision 57's shape.
2. **Work store (Node)**: write a move's follow-up events (decision, review handoff, call returns) in the move's own
   transaction, and read the guard from the transaction's view, so one move is one read, one append and one seal.
3. **Land/merge callers (Node)**: answer `detectTrunk`, `branchExists`, `resolveRefSha` and `changedFiles` once per
   approve and pass the answer down instead of asking again.
4. **Git crate (OPC)**: `GitLand.recover/prepare/publish` read single refs and `HEAD` repeatedly (23 single-ref
   `for-each-ref`, 18 `symbolic-ref` in one approve).
