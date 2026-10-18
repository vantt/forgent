# Phase 05: sharing across machines, sync core

- **Depends on:** phases 03 and 04 merged; Git 01 merged (`fetch_refs`, `push_refs`, `ensure_fetch_mapping`). M4 (typed non-fast-forward result) settled before step 3.
- **Branch / worktree:** `es/p05-sync`, `.claude/worktrees/es-p05`.
- **Model / effort:** opus, rigor high; 20h.
- **Blocks:** phase 06. Its V-EVENT run id is a blocking edge of Git 08.

## Context

- Spec §5 (machine id, store id, two clones on one machine), §14 (refs table, refspecs, sync steps 1-5, triggers, offline, shared machine id, joining and leaving, gc), §21 (`event-store-refspec`, `event-store-sync`, `event-store-machine-id` warning), §23.2 item 5 (local bare part).
- Git spec §4 required protocol rows 4-5: fetch `+` only into mirrors; push only own events and the authorized legacy ref; never force; non-fast-forward triggers Event Store fetch and two-parent reconcile; no Git-side reconciliation. Git V-EVENT: "seal/coverage/receipt tests unchanged through new port; mirrors, divergence two parents, no-force push".
- V-REF-01: fresh clone has no `refs/fgos/*`; explicit refspec fetch creates no own ref; non-fast-forward push exits 1; two-parent merge pushes without force.

## Requirements

1. **Refspec install (crate side).** `ensure_refspecs(remote)` calls Git `ensure_fetch_mapping` with exactly `+refs/fgos/events/*:refs/fgos/remotes/<remote>/events/*` and `+refs/fgos/legacy:refs/fgos/remotes/<remote>/legacy`; never a push refspec. The setup fix that calls it is phase 07.
2. **`sync({remote, noPush})` under `event-seal`.** Step 1 seal every pending segment of every stream; step 2 `fetch_refs` with the configured refspecs, through Git's non-interactive Remote context (no terminal prompt, SSH batch mode), after checking the remote URL recorded by setup (D20; a change refuses `event-store-remote-changed`); after the fetch, an updated mirror tip that is not a descendant of the previous one records `event-store-mirror-rewound` and the consumer keeps its cache (D17); step 3 reconcile own ref with its mirror: descends → push; mirror descends → fast-forward own ref by CAS; diverged → commit of kind `merge` (tree `seal.json {v: 1, kind: "merge", machineId, parents}` only, parents own then mirror, date per D6), CAS, push. Every CAS follows phase 04's retry rule. Step 4 push only `refs/fgos/events/<own>`, and `refs/fgos/legacy` only when the local ref equals the OID pinned by the tracked fence file (D18) and the remote lacks it; a remote legacy ref at another OID refuses `event-store-legacy-mismatch`; a typed non-fast-forward rejection converges on the next sync, never by force. Step 5 record `{time, tips, error}` in `<eventOpenRoot>/sync.json` durably and return "mirror tips changed" for consumers.
3. **Offline.** Fetch or push failure is recorded and returned; append, seal and read are unaffected; `status` shows "unpublished since".
4. **Shared machine id.** When the mirror of the own id carries a store id other than this store's, report `event-store-machine-ref-shared` with the fix `git config fgos.machineId <other-id>`.
5. **Retirement support.** `unpublishedSummary()` returns per stream whether everything sealed is pushed (own ref equals or is an ancestor of its mirror) and the oldest unsealed age; `status` and the retirement rule of the execution model use it.

## Files

| Action | File |
|---|---|
| create | `packages/event-store/rust/src/{sync,refspec,reconcile}.rs`, `packages/event-store/rust/tests/{v_event,three_clones,offline_sync,shared_machine_id}.rs` |
| edit | `packages/event-store/rust/src/lib.rs` |

## Steps

1. Refspec install through Git; doctor facts it needs are Git's (M5).
2. Sync steps with a local bare repository as the remote.
3. Settle M4; non-fast-forward convergence.
4. Three clones, offline period, shared machine id, legacy ref distribution.
5. V-EVENT named test; publish its green run id to the Git 08 lead; opus review; merge (dormant).

## Validation

```bash
cargo test --locked -p fgos-event-store -p fgos-git
cargo test --locked -p fgos-event-store --test v_event --test three_clones -- --nocapture
cargo clippy -p fgos-event-store --all-targets -- -D warnings
```

Vectors (local bare remote, no external push):
- **V-EVENT:** seal, coverage and receipt through the port; mirrors only fetch-written; divergence resolved by a two-parent merge; push never forced; mirrors, local and branch refs, and Git pins never pushed.
- **Three machines (§23.2 item 5, local part):** three clones push, fetch, go offline, diverge, merge on a shared machine id, distribute `refs/fgos/legacy`; every clone's read gives one identical sequence after full sync.
- Fresh clone with no refspec: `status` reports refspec missing, not empty history.
- `git gc --prune=now` in clone and bare keeps every reachable `refs/fgos/*` object; objects of an interrupted seal become garbage.
- Retirement: a clone with sealed but unpushed events reports unpublished until sync succeeds.
- Tamper and rewind (D17): a force-pushed machine ref is recorded as `event-store-mirror-rewound` with the cache kept; a foreign commit claiming the own origin is refused; a forged `refs/fgos/legacy` at another OID is refused.
- Non-interactive: with no cached credentials, sync fails fast with a recorded error instead of prompting.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| A forge rejects or hides `refs/fgos/*` | Medium × High | Q3 probe before the cutover; a rejection keeps events local and `status` shows it. |
| Merge commits accumulate with frequent divergence | Low × Low | One merge per divergence, walk stops at certified commits. |
| Fetch overwrites own ref | Low × Critical | Refspec maps only into the mirror namespace; test asserts the own ref is untouched by fetch. |

## Rollback

Dormant: revert the merge.
