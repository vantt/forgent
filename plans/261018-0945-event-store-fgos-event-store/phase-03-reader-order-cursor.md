# Phase 03: reader, coverage walk, order, cursor

- **Depends on:** phase 02 merged; **Git 01 merged** for the ref walk (D1). Kahn sort, deferral and cursor logic are pure and may be coded first. M1 (walk stop set) settled with the Git 01 lead before step 2.
- **Branch / worktree:** `es/p03-reader`, `.claude/worktrees/es-p03`.
- **Model / effort:** opus, rigor critical; 30h. A `fable` re-check through the architecture capability covers the two rules the model never checked (promote placement, in-gate bound).
- **Blocks:** phase 04.

## Context

- Spec §11 (reader protocol, coverage walk, termination, in-gate bound, read boundary), §12 (placement, causal graph, deferral, Kahn sort, contract, provisional success), §15 (cursor, fold-or-rebuild), §23.2 items 2 (C4 vector, shared with phase 04) and 4 (V-SEQ-01 store parts).
- Git 01 `walk_commits(repo, tips, cursor, bounds) -> {commits, next_cursor, complete}`; Git spec §4 row 3: "Only Event Store decides certified coverage pruning. Incomplete traversal never claims complete coverage."
- Model evidence: Kahn 36,864 + 124,416 runs; certified walk 15,360 walks; C4, C5, C6 witnesses ([corrected model check](../reports/experiment-261017-1545-event-store-model-recheck-corrected.md)). Not model checked: promote placement, in-gate bound.

## Requirements

1. **Coverage walk (§11).** Input tips, `cover`, `certified`; stack plus visited set; stop only at certified commits (M1: passed as Git's stop set); read `seal.json`, for `seal` read the part of `events.jsonl` above `cover[(o, s)]` and only marker-closed batches; for `merge` read nothing; continue Git's bounded walk until `complete`. Only a complete walk changes `cover` and `certified`; a hole is `event-store-gap`.
2. **Tips.** Own refs per scope, mirrors `refs/fgos/remotes/<remote>/events/*`, legacy (`refs/fgos/legacy` or its mirror) accepted only at the OID pinned by the tracked `.fgos/events` fence file (D18); before migration, legacy events come from the tracked files at HEAD through the phase 01 port (D10, read-only). Pins `refs/fgos/git-operations/*` are never tips.
2a. **Verification of fetched content (D17).** A seal's `machineId` equals its ref's machine-id segment; every event's `origin`/`stream`/`scope` equals its seal header; only `project` scope on `events` refs; a mirror commit claiming this store's own origin above its receipt is `event-store-ref-tampered`. Each check has a named test.
3. **Read (§11 steps 1-3).** Phase 02's own-stream read, then the walk; dedupe by `h`; contiguity from cursor; `event-store-gap` on a hole the ref does not fill.
4. **Placement (§12).** Legacy prefix in `(ts, file, seq)` order with the legacy dedupe (phase 01 port); promote blocks as one node keyed by the promote event; dedupe; `event-store-seq-conflict` on two events with one (`origin`, `stream`, `seq`).
5. **Causal graph and deferral.** Edges (i) and (ii); missing predecessor defers the event and its dependents; deferred events raise no coverage and block certification; `event-store-order-cycle` on a cycle, never broken.
6. **Kahn sort.** Ready node with smallest (`ts`, `origin`, `stream`, `seq`) compared field by field as bytes; no pairwise comparator anywhere.
7. **Cursor (§15).** Per-stream highest emitted `seq`, `cover`, `certified`, mirror and legacy tips; canonical serialization so a consumer stores it verbatim.
8. **Fold-or-rebuild answer.** `incremental` only in the proven case (no mirror or legacy tip change, no released deferred event, every new event's `seen` covers the cursor); otherwise `rebuildRequired` with the first differing position so the consumer can replay a suffix.
8a. **Legacy provenance.** Legacy events are returned with `{file, line}` (phase 01) so `legacy_friction.rs` and the friction doctor check keep their keys.
9. **Provisional success.** The reader reports concurrency (events whose writer had not seen each other); it never picks a winner (the reducer rule is Work's, phase 09).
10. **Model re-check.** Extract the corrected model's Python source from the report into `packages/event-store/proofs/model/` unchanged, add the two unchecked rules (promote placement, in-gate bound) and run it; the run is a `fable` architecture unit; its report goes through `fgos convention path --kind report --type experiment --slug event-store-model-check-promote-ingate`.


- **P02 review L5 — lost local receipt and hint.** Cross-check the own ref tip outside the Work gate when locally recovered high is zero and active starts at seq 1 on a stream with an existing ref. Rebuild coverage/receipt through the shared ref walk before allowing sequence reuse; test simultaneous loss of `sealed.json` and `hwm.json` after closed-segment deletion. A local zero must never silently restart a published stream.

## Files

| Action | File |
|---|---|
| create | `packages/event-store/rust/src/{walk,order,cursor,read}.rs`, `packages/event-store/rust/tests/{walk_certified,order_kahn,deferral,cursor_incremental,v_seq_store}.rs` |
| create | `packages/event-store/proofs/model/**` (model source, run script, README with the command) |
| edit | `packages/event-store/rust/src/lib.rs` |

## Steps

1. Kahn, placement and deferral as pure functions over event sets; property tests.
2. Settle M1; walk over real refs built through the port in temporary repositories.
3. Read pipeline and cursor; fold-or-rebuild answer.
4. V-SEQ-01 store parts; C4, C5, C6 witnesses as named tests.
5. Model re-check unit (`fable`); fold any finding back as a test or a stop.
6. Opus review; merge (dormant).

## Validation

```bash
cargo test --locked -p fgos-event-store
cargo clippy -p fgos-event-store --all-targets -- -D warnings
python3 -I packages/event-store/proofs/model/run.py --all   # exits 0 only with no counterexample
```

Vectors:
- **C4:** commits `a, b, m=merge(a,b), c(parent m), q, p=promote(c,q)`, coverage `{A1, A2}`, `certified={a}`: delta is `{B1, P1, Q1}`; starting at `c` still finds `B1`.
- **C5:** `b.seen[A]=1` with A absent: `b` deferred, no coverage advance, no certification; after A arrives `[a, b]` emitted once.
- **C6:** `[x(ts=2)]` then concurrent `y(ts=1)`: answer `rebuildRequired` at position 0; suffix replay equals full rebuild.
- **V-SEQ-01 (store part, §23.2 item 4):** clock rollback, equal timestamps, `seq` across seal and restart, delayed foreign events; one sequence for every permutation of the input (all permutations up to 7 events, random 10,000 above); full rebuild equals incremental fold in the proven case.
- Walk visits at most V + E commits; a lost `certified` set only lengthens the walk.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| M1 refused by Git | Low × Medium | Correctness holds without a stop set; cost becomes a full walk per catch-up. Signal: catch-up walk count equals DAG size in the bench; response: stop and settle with the Git lead, never parse commit objects in this crate. |
| Model re-check finds a defect in promote placement or the in-gate bound | Low × High | Stop the phase; the defect is a spec issue for the owner, not a silent code fix. |
| Kahn cost on a full rebuild | Medium × Medium | O((V+E) log V); a rebuild above 2 s on the slowest machine opens the compaction item (spec §22 threshold). |

## Rollback

Dormant: revert the merge.
