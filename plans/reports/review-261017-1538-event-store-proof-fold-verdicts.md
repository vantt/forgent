# Event Store spec: fold of the pre-signature proofs

Run `wf-run-1792225689256-49707cac`, unit `unit-run-1792225689550-8c2088a3` (claude opus, tetcu72), 2026-10-17. Verdict per model-check counterexample and the git experiment facts folded into [docs/platform/event-store/spec.md](../../docs/platform/event-store/spec.md).

## Outcome

Of the six counterexamples, the amended spec already fixed one (C3). It partly fixed three (C4, C5, C6) and did not fix two (C1, C2). The updated text below fixes all five that were open. It also folds in the V-REF-01 facts that sections 10, 14, 15 and 22 needed, and it marks both proofs as done in section 23.1, with what each one did not prove. Section 26 stays unsigned. The owner decisions, the unresolved dissent and the earlier changelogs are kept, and a changelog for this fold is appended.

## Verdict per counterexample, against the amended text

Line numbers refer to the spec as it stands in the workspace before this fold.

| | Verdict | Why (current text) | Fix in the updated spec |
|---|---|---|---|
| C1 seq collision after a crash between rotation rename and `hwm.json` | **Not fixed** | Section 9 step 4 (line 220) still reads the last `seq` from "tail of `active.jsonl`, else `hwm.json`". Section 10 step 1 (line 232) renames first and writes `hwm.json` after, and nothing reads `closed/` before a `seq` is assigned | New section 9 step 4 recovers the high-water mark under `event-append` from the verified receipt `sealed.json`, every closed segment, `hwm.json` and the committed part of `active`. There is no git call, because `sealed.json` is now written durably before any delete (section 10 step 2.4). A gap or overlap refuses with `event-store-seq-recovery-conflict`, and the next seal outside the gate rebuilds a lost receipt. The rename now fsyncs both directories (the model's assumption). A crash-table row is added |
| C2 partial batch exposure | **Not fixed** | Section 9 (line 224): "they fold only complete lines" is exactly the rule the model broke (byte prefixes 3, 4 and 5 expose `e1`) | I chose **batch framing**: a canonical `batch-commit` marker line follows every batch in the same `write` and is covered by the ack `fsync`. Readers fold only lines that a verifying marker closes. Recovery drops everything after the last valid marker. Dropping the promise was rejected because a Work batch is one settlement unit (section 13), and a visible prefix would hand every reducer a half-mutation that nobody acknowledged |
| C3 non-transitive comparator | **Fixed by M2, confirmed** | Section 12 (line 308) is the Kahn sort with the smallest (`ts`, `origin`, `stream`, `seq`) among ready nodes, which is the model's proposed fix. The model ran it 36,864 times and got one result per case | Unchanged, apart from one added sentence the model asked for: a cycle is corruption (`event-store-order-cycle`) and is never broken by dropping an edge |
| C4 coverage stop with an unknown origin under a merge | **Partly fixed** | Section 11 (lines 280-286) visits every parent, so the model's exact trace (c, then m, then b) is read. But step 3 stops at any seal whose `lastSeq <= cover`, on the premise that "the walk that established `cover` already read every ancestor of this commit". Coverage is a number per (`origin`, `stream`), not a set of commits. It can be reached without walking that commit (own events folded from open logs and sealed later on top of a sync merge; a rebuilt receipt), and a merge can then put an unknown origin under a covered seal | Pruning is now allowed only at a **certified commit**, one that a complete walk processed together with all of its ancestors. Otherwise the walk goes to the roots. Coverage only selects which lines to fold. The walk stays outside the Work gate |
| C5 missing causal predecessor | **Partly fixed** | Section 12 (line 306) defers the event and reports it. But section 11 step 5 (line 284) raises `cover` to "the highest `lastSeq` read", so the cursor moves past the deferred event and the next read never returns it | Coverage and the cursor stop at the last emitted `seq` of each stream (deferral is always a suffix). A walk that leaves anything deferred certifies no commit. A deferred event counts as incomplete data and never as corruption, and nothing waits on the network inside the gate |
| C6 late concurrent event sorts earlier | **Partly fixed** | Section 12 (line 314) limits "incremental fold equals the sort" to "own-store appends", and section 15 (lines 383-384) asks for a full rebuild when a mirror tip changes. Own-store appends from another process are not enough, though: their `seen` must cover the folded view. The text never says that the cursor is coverage and not an offset, or that no global prefix exists. It does not cover a released deferred event, and it offers only a full refold | The claim is restricted to the one proven case: own-stream appends under the gate, decided on this view, with no foreign or deferred event added. The reader checks that `seen` covers the cursor. The text now states that the cursor is coverage and that no global prefix exists between different event sets. Consumers replay the affected suffix or rebuild |

## Fold of the git experiment (V-REF-01)

- **Section 10, step 2.3.** A failed CAS exits non-zero and changes nothing. The caller rereads the tip and reruns step 2.1 before any retry, and never reuses the stale `<old>`. Inside the store the reread tip leads either to crash recovery or to `event-store-ref-moved`.
- **Section 14.**
  - A default clone or fetch carries only `refs/heads/*`. Setup must install `+refs/fgos/events/*:refs/fgos/remotes/<remote>/events/*` before readers expect mirrors, and until then status reports the refspec as missing.
  - Sync pushes only the own ref. A non-fast-forward push converges through a two-parent merge commit and is never forced.
  - Refs and objects reachable only from `refs/fgos/*` survive `gc`, `gc --prune=now`, `repack -ad` and `pack-refs --all`.
  - Forge acceptance stays an acceptance gate on the owner's real remote.
  - The mirror namespace moved from `refs/fgos/mirror/<remote>/...` to the tested `refs/fgos/remotes/<remote>/...`, as the objective required. The change reaches sections 14, 21 and 23.
- **Sections 15 and 22.** A range walk `A..B` still traverses the reachable part it needs. On the 100,011-commit DAG a full walk took 224 ms and a range walk took 190 ms for 90,011 commits. Snapshot and compaction stay the follow-up for when a rebuild exceeds the budget.

## What changed, in short

1. Section 9: batch framing with a `batch-commit` marker (C2), a recovery step for uncommitted batches, and high-water-mark recovery before any `seq` is assigned (C1). Steps are renumbered from 6 to 7.
2. Section 8: the layout describes the marker-framed `active.jsonl`, and `sealed.json` now carries `certified` and is written durably before any delete.
3. Section 10: both directories are fsynced on rotation, the CAS failure and retry rule is stated, the receipt is written durably before the delete, two crash-table rows are added, and the chain invariant no longer justifies pruning.
4. Section 11: certified-commit pruning replaces the coverage stop (C4). Coverage and certification stop at deferred events (C5), and the closing paragraph now records the model-check result.
5. Section 12: the deferral rules (C5), the cycle as corruption (C3), and the restricted incremental claim with "the cursor is coverage" and no global prefix (C6).
6. Section 14: the default fetch, the setup refspec, the mirror namespace, push of the own ref only, merge-not-force and gc survival.
7. Section 15: the cursor contents, the proven-case check, replay of the suffix or a rebuild, and the range-walk cost.
8. Sections 21 and 22: the doctor integrity codes, plus limits bullets for deferral, no global prefix, fresh clones and range-walk cost.
9. Section 23.1: both proofs are marked done with links, results and an explicit "not proven" list. Section 23.2 items 2 and 4 gain regression vectors for C1, C2, C4, C5 and C6.
10. Section 24 gains a pointer to the proofs. The header, the introduction, open item 1 and a factual note on the last dissent are updated. A new changelog, "Changes after the pre-signature proofs", is appended.

## Unresolved questions

- The corrected rules (framing, high-water-mark recovery, certified pruning, deferral and the incremental check) are design arguments. No model check has covered them, and they rest on the stress test and V-SEQ-01 in section 23.2. The owner may want a second model-check run on the corrected text before signing, but the spec does not require one.
- Renaming the mirror namespace to `refs/fgos/remotes/<remote>/...` follows the objective and the tested refspec. If the owner prefers the old `refs/fgos/mirror/...`, only the text changes, because the experiment showed no git difference between the two.


