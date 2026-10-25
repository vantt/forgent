# Strict binding-verdict join

Pin: `608a4ada5f195b0d0b9d3568a71b8dde4954aacb` (turn-start HEAD). Authority: L12-137, L13-20.3, `../w23-register-corrections-brief.md`. **Tool built; gate not passed.** No ledger or review was edited, no independent approval manufactured.

## Result

`join-608a4ada5.json` is the deterministic stdout of `join.py --pin <pin>`; exit **1** honestly reports gaps:

| Population / outcome | Count |
|---|---:|
| Frozen register `changedBindings` entries | 257 |
| Obligations, retaining origins | 2,179 |
| Effective ledger rows | 1,924 |
| Rows with matching APPROVE and no other error | 174 |
| Missing per-row verdict | 1,484 |
| Related verdicts, but no matching two-digest APPROVE | 266 |
| Open exact-binding REWORK | 3 |
| Invalid effective binding hashes | 27 |
| Unresolved ledger locations | 0 |
| JSON review files | 60 |
| Actual per-row verdict objects | 663 |
| `aggregateOnly` review files | 50 |

Error counts overlap: do not add missing/mismatch/REWORK/hash counts into a new population. The execution plan's **191** is historical; the frozen register present at this pin actually contains **257**, all enumerated rather than silently truncated. The output lists every effective row, its originating obligations, review locators, the two digests and errors. Open REWORKs are `g0-content-redecisions.json /bindingRefresh/{9,50,123}`. Later aggregate W16/W17 approvals do not supply per-row digests; the tool does not claim these semantic fixes were never reviewed. The 27 noncanonical stored hashes are listed, not rewritten or grandfathered.

## Contract and reuse

- Reads **only committed blobs** at explicit `--pin`; output to stdout, no repository write. A future F invocation uses the same door, not authoring-time working-tree bytes.
- Reuses `ledgerfix/bindings.py`: snapshot exclusions, canonical four-field/group binding hash, row traversal, identity and exact `supersedesBinding` chains. History shows these mechanisms in the earlier ledger normalization/rebind work; no replacement authority is introduced.
- Includes every frozen `changedBindings` row, explicit supersession/bindingRefresh/rebindReason row, and in-place binding-payload change since the frozen source pin. Deduplicates **effective locations**, retaining all origin rows; duplicate aliases are not silently discarded.
- A row must have an actual independent review object under `reviews/`, identifying the claim or exact lineage pointer and matching **both** stored digests. Author `reviewStatus`, prose, counts and boolean `checks.unitDigest` cannot fill a missing digest. W19's review-local B ids use explicit lineage pointers with uniqueness checks; they are not minted ledger ids.
- A current-binding REWORK remains open until a strictly later, matching per-row APPROVE by Git ancestry. Same-review conflicting verdicts stay open. Historical REWORK on another binding is not carried forward.
- `aggregateOnly` enumerates reviews with no per-row binding verdict objects; incomplete per-row records are reported as mismatches, not promoted to approvals. W9/W10 GAP-05 overlay reviews remain historical semantic evidence, not invented per-row verdicts.
- This is a stored-ledger/verdict join, **not** live target extraction, conservation approval, exhaustive review of authored G6/G9 packets, or F execution. Independent reviewers/Lead own filling the evidence gaps before the packet; F changes require only their own delta reviews.

## Proof commands

Let `P=plans/260925-documentation-authority-unification/reports/phase-09`. Exact command arrays/exits are in `commands.json`, `tests.json`, and `../gate-reconcile/corrections-proof.json` (final replay); historical runs are not represented as current proof.

| Command | Exit | Result |
|---|---:|---|
| `python3 -B P/g0join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb` | 1 | Structured gaps above; stdout committed as `join-608a4ada5.json`, empty stderr |
| Same command, deterministic replay | 1 | Byte-identical stdout; empty stderr |
| `python3 -B P/g0join/test_join.py` | 0 | 10 owning tests: exact/absent/stale digests, lineage/claim isolation, latest REWORK, aggregate-only, malformed hash, pointer ambiguity, in-place changes and missing/ambiguous successors |
| `python3 -B P/census-join/test_locators.py` | 0 | 3 owning locator regression tests; no source execution |
| `python3 -B P/gate-reconcile/reconcile.py` twice | 0 / 0 | One generator, deterministic register and receipts |
| `python3 -B P/gate-reconcile/verify.py` | 0 | Record integrity only; volatile `checkedAtHead` restored |
| `python3 -B P/gate-reconcile/controls.py` | 0 | Existing 10 controls retained; 4 correction/order/sizing controls added |
| `git diff --check` | 0 | Whitespace proof |

No fgOS CLI (including capability query), native addons, product suites, lifecycle verbs, Git writes, pair accounting, preview service or out-of-scope writes. Impact-analysis: degraded/unqueried under the no-CLI/no-MCP boundary; direct history/caller inspection only. New tests own the new join behavior; no existing test is weakened or replaced. No config/default/infra dependency or end-user behavior changes. Scratch, if used by citation replay, is exit-cleaned tempfile storage under `/tmp/fgos-work/`. `needsWrites: []`.
