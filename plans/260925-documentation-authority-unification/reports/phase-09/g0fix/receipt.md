# Binding Hash And Residual Repair Receipt

Status: **Superseded authoring receipt; independent review pending.** The current HEAD proof and recipe migration are [ledgerfix/receipt.md](../ledgerfix/receipt.md), [verification.json](../ledgerfix/verification.json) and [recipe-migration.json](../ledgerfix/recipe-migration.json). The counts and original transitions below describe the earlier continuation, not current target bytes. No G0/G7/G9 approval or gate closure is asserted.

Original authoring pin: `cffe725b948f5a695728c8da08f114e7e97075d6`. Continuation input: `a27d85d0a`; its pilot write restriction was explicitly lifted by the new assignment.

## Read First

- [Machine receipt](receipt.json), [replay result](verification-result.json), [read-only verifier](verify.py).
- [Original ledger edits](record-edits.json) and [resolved pilot request with exact before/applied-after record](needs-writes.json).
- [Hash migration](recipe-migration.json), [original placement witnesses](binding-proofs.json), [candidate repair witnesses](binding-repairs.json).
- [Authenticated historical source](source-proof.json), [residual coverage](partial-carry-residuals.json), [complete partial-carry sweep](partial-carry-sweep.json).

The reading map and area sources remain the starting authorities. These records do not promote candidate documents, apply cutover patches, accept A34 residuals or replace historical reviewer verdicts.

## Applied Continuation

`pilot/decisions/b-io-contract.json` is the only decision shard changed in this continuation:

- `registryGaps[4]`, `claim_f5365b8e40fb58c75adc56a574263242`, now binds the complete candidate Writer Source Trust Levels block at `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10`, matching sibling `claim_57f11d837272b3f9781b376ef1665c81`.
- Candidate unit digest: `f62415e8ccc40c73ee561ccc0cf7d550e46dbca39047ae09fe139b0fe91e0bb2`. Both frozen extractors verify the full content, actual ancestry and both immediate neighbours.
- The refreshed remainder references residual row 14, its unchanged file digest and all **three** deleted/replaced historical source lines. `A34Accepted` remains false; source identity and disposition are unchanged.
- Both pilot rows now store the declared four-key hash `34d1e9c56a94dc1318b715e3bf44c17f5f2ce8af1ffa0261d534a8bcdfb62ac0`. The register projects the actual new binding, and the migration retains both the original hash and the continuation's `e4402240… → 34d1e9c5…` transition.
- Both rows remain pending; no old approval is inherited. The exact two-record pilot delta is verified against Git objects, and every other pilot field must remain unchanged.

`needsWrites=[]`. No candidate/source document or other decision shard was changed in this continuation.

## Full Assignment Replay

| Owning check | Result |
|---|---|
| Original 191 register identities plus D1/delta union | 257 unique current rows; every ledger/register/Python/Node hash agrees |
| Original ledger edits plus pilot continuation | 136 exact record deltas in 14 shards; immutable source IDs retained |
| Partial carries | All 26 ledger rows plus 1 pilot row checked; 14 ledger residuals and the pilot residual refreshed, 12 unchanged since Step 0 |
| Historical source authentication | 18 full units checked against historical Git objects |
| Content and placement | Two unchanged frozen extractors agree; complete selected content and immediate neighbours checked |
| Credential carriage composition | Both whole-file-hash-gated patches pass zero-fuzz forward/rollback |
| Replay | Two runs byte-identical; six negative probes reject, including the pilot's old legacy binding |
| Scope | Only `changedBindings` and `bindingHashEncoding` may differ in the phase-08 register; all other register bytes reconstructed exactly |

The prior runner RUL77–RUL97 rebinds, provider-capacity/two-line and pointer/six-line residual corrections, W0 component-boundary confirmation, Observe candidate rebind and conditional credential-store carriage are replayed, not redone. D1's packaging repairs remain untouched.

## Historical Evidence And Current State

The original `binding-proofs.json`, `binding-repairs.json` and `record-edits.json` retain their authoring-pin evidence. The ledger-fix follow-up refreshes the residual artifact at current bytes and sets row 14 `outOfScopeProposalOnly=false`: the pilot binding is live, not a proposal. All 15 residual file-hash references and remainder citations are refreshed together.

`needs-writes.json` now records resolution and the exact applied delta. The verifier authenticates the original pilot placement, replaces only that effective proof with the already-authored candidate placement in `binding-repairs.json`, and checks **every residual against the live decision record**. There is no proposal fallback. Original ledger edit evidence plus the two explicitly recorded pilot edits must reconstruct the complete current shards exactly.

The final recipe is declared in `step-08-preflip-gates.json#bindingHashEncoding`: UTF-8 sorted-key compact JSON plus one LF; individuals contain `{targetOwner,targetAnchor,targetUnitDigest,targetAncestry}`. Ancestry is self-inclusive, including the heading's own title. Null-anchor groups add `successorGroupMemberDigests`, sorted with duplicate digests retained, so their hashes bind content. Members are also authenticated against current bytes. Parents-only ancestry is rejected.

The credential-store binding now resolves through the later applied current-holder overlay in `s14-resync-b.json`; its obsolete conditional `targetComposition` is removed from the live row and gate projection. The old composed-patch proof remains historical. Current full-unit/placement checks replace that conditional branch; independent delta review remains owed.

## Reproduce And Limits

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g0fix/verify.py
```

This entry point now delegates to the single current `ledgerfix/verify.py` proof, which checks HEAD's working tree, complete residual accounting, strict ancestry, group content and all stored hashes. Compare stdout with `../ledgerfix/verification.json`. Historical extractor scratch remains under `/tmp/fgos-work/w2-g0fix-brief/`; new authoring/replay scratch is under `/tmp/fgos-work/w3-ledger-fix-brief/`. Full earlier commands and preparation-only correction history remain available in `receipt.json` at `a27d85d0a`.

No Git mutation, fgOS CLI, Work lifecycle verb, live state/secrets, activation, lease, pair accounting, owner-answer/progress/gate-status write or candidate-doc application occurred. No Node test file, full suite or Cargo workspace test ran; the brief prohibits full-suite commands and this change is records-only. `impact-analysis: degraded` under the no-CLI boundary; no production symbol changed. Browser preview/services were not launched because they could write outside the exact writable scope.
