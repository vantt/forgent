# Archive closure budget-stop receipt

**BLOCKED — the brief's explicit stop condition fired.** Source pin: `3c368e5201f4ab4a5a245f4c6caf896d64bfc0a8`. Authority: `w5-d5d-brief.md` item 1 and `reviews/w5-d5c-archive-review.{md,json}`. This is not a completed rehearsal or G8/F acceptance.

## Result and full list

`build-design.py` now follows Markdown links from kept declared rulings and navigation roots to a fixed point, with source/line reasons. It adds **637 files / 281,770,653 B**, or **5.64 times** the 50,000,000 B stop budget. The proposal was **not applied**. The complete list, pinned blob ids, SHA256, sizes, reasons, roots and edge locators are in `link-closure.json`; `manifest.json.pendingRework` binds that file by digest. No new partition replaced the historical one.

| Retention state | Files | Bytes |
|---|---:|---:|
| Prior D5c validated partition (old pin `23f6eaccf`) | 883 | 631,486,701 |
| Before closure at this task's pin | 888 | 632,057,359 |
| Added by fixed-point closure | 637 | 281,770,653 |
| Proposed after — **NOT applied** | 1,525 | 913,828,012 |
| Applied closure delta | 0 | 0 |

The five-file before-set difference is source evolution since D5c, not this worker's retention change. The general rule reuses the existing navigation/read roots and identifies ruling document types, not four filenames. Ruling roots: constitution, evidence-relocation policy and claim/disposition vocabulary; navigation roots: 102. Every descendant's links are followed, including evidence targets; nothing is selectively dropped to meet the budget.

The four requested direct targets are in the proposal:

| Target under the plan root | Bytes | Exact ruling locator |
|---|---:|---|
| `alias-table-and-resolver-contract.md` | 3,951 | `minimum-constitution.md:235` |
| `cutover-write-lease-design.md` | 27,057 | `minimum-constitution.md:244`; `evidence-payload-relocation-policy.md:15` |
| `reports/phase-06/same-path-binding-blocker.json` | 59,528 | `minimum-constitution.md:332` |
| `reports/doc-inventory.md` | 693,382 | `evidence-payload-relocation-policy.md:96` |
| Total direct targets | 783,918 | Reasons use `ruling link: <file>:<line>` |

The largest newly reached target is `reports/phase-06/checkpoint-10-source-population.json` (**71,398,693 B**), already above the whole budget. Other large examples are the proposals redesign rereview pack (**11,004,517 B**), sync627 all-shards consistency (**10,718,452 B**) and step10 accounting-02 Markdown (**10,125,116 B**). The report lists all 637, not only these examples.

Recomputed retained-to-archived relative links at the current pin: **124 reader files / 1,029 links / 631 targets** before closure. The unapplied proposal would leave **1 reader / 3 links / 3 targets**. `design.md` states how to follow these through the approved archive ref and verify the recovered bytes. The working tree itself has not been pruned.

## Executed proof and stopped work

- `python3 -B .../archive/build-design.py --output-dir .../archive`: **exit 1, intentional budget stop**. Repeated builds produced the same counts. `audit/rebuild-d5d.log` is the final run. No archive refs/index were written.
- `python3 -B .../archive/verify-design.py`: **exit 2, verified budget stop**, not the former exit-0 full custody/rehearsal pass. It independently traverses the reading graph and checks every added blob/SHA/size, exact set equality and before/proposed totals. See `verification.json`.
- `rehearse.py` now refuses a budget-blocked manifest **before scratch creation**. Its invocation exits nonzero at this guard. No heavy clone, new test run, accounting simulation, timing variant or cache eviction was executed.
- Deleted **only** `audit/attempt-1/rehearsal.bundle` (**1,788,526 B**); the rest of attempt-1 is unchanged. Kept the current `audit/rehearsal.bundle`.
- Existing manifest partition/audit descriptors and historical rehearsal objects remain bound to their old pin. Rehearsal metadata explicitly disclaims cold acceptance; its old fresh-clone labels are not cold-cache evidence. No new Check A or link-parity pass is claimed. The reviewed prior candidate's A was green with no new H links; that does not validate this unapplied proposal.

## Owner handoff

**Decision needed:** the requested transitive rule retains 281.77 MB more, exceeding the approved stop budget. Either authorize the full listed closure (approximately +282 MB on the reduced tip, then rebuild and measure), or revise which navigation/ruling graph must remain directly navigable (design/review work; archive-ref links remain necessary). Recommendation: review the complete graph/list before changing the budget; do not silently keep only the four cheap targets. The answer governs retention only, not F approval or publication. No owner question or lifecycle state was written through fgOS.

After that disposition, implement and prove the remaining cold-residency and external-scratch changes, then rerun builder/rehearsal/verifier and full A/link parity. These steps are **deferred**, not claimed complete. No new scratch was created, so no scratch cleanup is outstanding. `/tmp` here is tmpfs; future timing needs a real-disk `$TMPDIR` outside the repository.

Only `archive/**` was changed. No source Git writes, pair accounting, product/test edits, fgOS CLI, `.fgos`/secret access, lifecycle calls, leases, publication, landing, npm test or `scripts/run-tests.mjs`. Impact-analysis: degraded/unqueried under the no-fgOS-CLI brief; direct history/source review only. Cargo suite and browser/service preview were not run for this stopped records task. `needsWrites=[]`; no out-of-scope change is needed to report this blocker.
