# Binding Hash And Residual Repair Receipt

Status: **scoped work verified; assignment blocked by one out-of-scope pilot shard.** Author evidence only; no independent approval or gate closure.

Source pin: `cffe725b948f5a695728c8da08f114e7e97075d6`.

## Read First

- [Machine receipt: commands, counts, touched IDs and artifact hashes](receipt.json)
- [Replay result](verification-result.json) and [read-only replay](verify.py)
- [Exact before/after ledger records](record-edits.json)
- [Original and added register hash migrations](recipe-migration.json)
- [Scope blocker and exact proposed pilot record](needs-writes.json)

The repository reading map, area sources and the pre-flip execution plan remain the starting authorities. This work does not promote candidate documents, apply cutover patches, accept A34 residuals or supersede historical reviewer verdicts.

## Delivered Within Scope

| Work | Result |
|---|---|
| Register | All 191 original identities retained; 257 unique rows after indexing D1's 121 existing-decision rebinds and the residual/rebind delta union |
| Ledger | 134 changed records in 13 shards; complete old/new records and immutable source IDs retained |
| Hash | One declared four-key compact sorted JSON + LF recipe; Python and independent Node computations agree |
| Placement | Both unchanged frozen Step 0 extractors agree; complete selected content and both immediate neighbours witnessed |
| Historical sources | 18 source units independently authenticated against historical Git objects |
| Partial-carry sweep | All 26 ledger rows checked: 14 refreshed, 12 unchanged from Step 0 with existing reviewed section-carrier accounting retained |
| Replay | Two runs byte-identical; five negative probes reject; two composition patches pass whole-file-hash-gated zero-fuzz forward/rollback |

Only `changedBindings` and the new root `bindingHashEncoding` change in the phase-08 register. Replay reconstructs the original register **byte-for-byte** after removing/reversing those two fields. Other register counts and projections remain historical; no frozen count field was rewritten to disguise the expanded 257-row review set.

### Named Rework Corrections

- Runner `registryGaps[26]` and `[27]` now bind the full RUL77-onward passage at `unheaded-block-93`, not the RUL76 line. Content, actual Business Rules ancestry and both neighbours identify the successor. The whole-block supersede row explicitly names its five changed historical lines; it no longer adopts the historical all-lines-verbatim assertion.
- Runner `[24]` residual includes **both** changed table rows, including provider-capacity inventory/state. Runner `[29]` residual includes **all six** changed pointer lines, including loop runner-lock, account-pin parsing, timeout lock lifetime and catchup. Every other rebound partial-carry residual is similarly recomputed from the authenticated full historical source to the current target, retaining every deleted/replaced nonblank source line verbatim.
- `claim_af89c4e6` was already correctly rebound by W0 to `17b94e60…`. It is independently reconfirmed, not falsely reported as a newly discovered/repaired target delta. Its stale register projection is refreshed.
- `claim_15308eb4` binds `docs/platform/agent-confinement/spec.md#unheaded-block-73` in the **composed after-state** of `carry:credential-store-setup`, after predecessor `file:docs/platform/agent-confinement/spec.md`. Ledger and register name that conditional state, spec ID and whole-file hashes. The carried unit digest remains `5364ce63…`; its owner, placement and ancestry change. Candidate bytes are untouched. Application/revalidation at the final pin remains owed.
- `claim_a7278e15` now binds the candidate Observe Owns block at `unheaded-block-5`, as its native sibling does, with the two historical changed lines in its current-digest residual.
- D1's six packaging review repairs are not redone. Their effective current bindings are used for the global recipe migration. D1's new carry inventory is not miscounted as 1,009 additional *rebindings*.

[Binding repairs](binding-repairs.json), [placement proofs](binding-proofs.json), [source proof](source-proof.json), [residuals](partial-carry-residuals.json) and [sweep](partial-carry-sweep.json) retain the exact witnesses. All authored changes remain `pending`; no old approval is inherited. Historical residual files and source IDs are not modified.

## Single Hash Recipe

SHA-256 of UTF-8 sorted-key compact JSON, followed by **exactly one LF**, containing exactly:

```json
{"targetOwner":"…","targetAnchor":"…","targetUnitDigest":"…","targetAncestry":[]}
```

Absent fields encode as `null`; arrays retain order; Unicode is not ASCII-escaped. `successorGroup`, placement, composition metadata and review metadata are excluded. The 16 contextual-footer group rows therefore use explicit null anchor/digest/ancestry in this four-key hash; all eight members of each group are separately authenticated. The migration does not pretend the four-key hash cryptographically includes the group.

D1's 52 heading bindings retain its existing ancestry convention (parents plus selected heading). The dual-extractor witness uses parents-only ancestry; replay explicitly checks parent ancestry **and** selected title against the stored D1 array. Arrays are not silently normalized while hashing, and this turn does not redo D1's heading bindings.

## Blocker: Pilot File Outside Writable List

`claim_f5365b8e40fb58c75adc56a574263242` lives in:

`plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json`

That is **not** under `ledger/decisions/**`. It was read but never written. [needs-writes.json](needs-writes.json) contains the exact before/proposed-after record: candidate `cli-io-contract.md#unheaded-block-10`, sibling-matching digest/ancestry, refreshed three-line residual and canonical binding hash. It also records the hash-only update needed for sibling `claims[35]`.

Both pilot register rows have recomputed hashes for their **actual current** pilot bindings, not the unapplied proposal. The pilot ledger-side hashes remain absent. Until the owner/Lead grants or applies that pilot delta, this assignment and global G0 remain blocked. The author replay passes the scoped invariants while explicitly reporting both pilot hash gaps; it does not label the global gate green.

## Reproduce And Limits

From the project root:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0fix/verify.py
```

The verifier only writes disposable files under `/tmp/fgos-work/w2-g0fix-brief/`. It reads current source/ledger bytes, historical Git objects and both unchanged embedded extractors. It replays the approved predecessor and carriage spec on scratch bytes with whole-file SHA checks before every forward/rollback; compares every register hash in Python and Node; checks complete current/conditional placements, historical source witnesses, residual coverage, unchanged pilot bytes and the exact authorized edit set. Negative probes reject stale residual targets, omitted provider-capacity history, incorrect neighbours, incorrect unit digests and the old spaced/no-LF recipe.

`prepare.py` authored the mechanical migration from the recorded input pin. It now refuses the already-migrated tree before overwriting evidence; use `verify.py` for normal replay. Its preparation-only failures (wrong Observe selector, D1 heading-ancestry convention, compact register serialization and nested-vs-root recipe detection) were corrected before ledger/register mutation; the successful final preparation and replay are recorded in `receipt.json`.

No Node test file, full suite, Cargo workspace test, fgOS CLI, Git write, activation, lease, pair accounting, owner-answer/progress/gate-status write or candidate-doc edit was run. Full `npm test`/`scripts/run-tests.mjs` are expressly prohibited by the brief. No production symbol changed; `impact-analysis: degraded` under its no-CLI boundary. No browser preview/service was launched because it may write outside the exact writable list. D1's saved exact-after record comparisons remain historical for the residual rows this delta updates; use this current delta replay and obtain fresh independent verdicts instead of rewriting D1's receipts.
