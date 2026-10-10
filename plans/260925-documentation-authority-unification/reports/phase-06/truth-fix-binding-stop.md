# Targeted truth-fix: binding scope decision

Status: **owner decision required; not ready for independent review**.

The owner-authorized prose correction is committed in `f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f`: exactly 21 rejected sections in 14 files, 433 accepted section bodies unchanged. The actual clean main merge is `a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2`, including the runner corrections from `59cd76672`. No extra current section, file move, carriage disposition, gate/checker/baseline/vocabulary or extractor is changed.

## What blocks the requested review boundary

The unchanged gate rejects the consequences of the authorized text edits outside the named 49-row list:

| Finding | Count | Consequence |
|---|---:|---|
| decision-target-drift | 47 | Existing target bindings no longer name the prior digest; some are ordinal shifts and some changed shown text. No approval is silently restamped. |
| decision-exact-invalid | 50 | Exact-carry proofs lose a digest match or the unchanged document-level 50% exact-share qualification. These cannot keep script approval without the proof. |
| retired-row-disposition-missing | 2 | Genuine removed candidate identities remain in the registry but need explicit pending successor accounting. One is the rejected receipt claim_69b011aac8a371496f54e1c681286bfd; the other claim_424bbeb8e8fe53a80b03440fb53ae248 is outside the 49. |

**98 of these 99 findings are outside the named 49.** Full tuples, claim IDs and source paths are in [truth-fix-binding-stop.json](truth-fix-binding-stop.json). The authorized 15 source/17 successor rework bindings remain pending with their original carriage decisions; all 14 corrected receipt contents/current identities are prepared in `ledger/candidate-classifications-agent-coordination-truth-fix.json`, but not activated across the blocked accounting boundary. Three owner-intent holds stay held.

The first post-author D had one extra author-caused rationale defect: it quoted the earlier schema omission as current rationale. The rationale now states the full corrected schema; the historical reviewNote is untouched. That one finding disappears under the unchanged gate. The remaining 99 require actual binding/class accounting, not a wording workaround.

## Owner decision needed

Recommended: authorize **only the mechanical accounting consequences of these same 21 sections**. Rebind by prior digest and ancestry; retain independent approval only for byte-identical shown text and unchanged heading ancestry; return changed shown text/ancestry to pending; use the existing weak-exact/manual class for entries whose recomputed proof no longer qualifies; record pending successors for the two retired candidates. Include exactly those derived changed rows in the targeted check. No extra truth content, physical carriage, gate, checker, baseline, vocabulary or extractor change.

Without that authorization, the alternative is to leave this truth-fix state parked, not claim review readiness or restore the known false current text. The author has not applied the out-of-scope repairs or granted new approvals.

## Exercised proof

Commands, complete explicit arguments and outputs are recorded in [truth-fix-accounting-agent-coordination.json](truth-fix-accounting-agent-coordination.json).

- Full D passes before the truth text edit against both prior registries; after authoring it is red with the above binding findings. Both existing `--previous-registry` invocations are retained; no loader change.
- Scoped strict E is red under both prior registries: 104 fatal findings, the same 99 plus five open-conservation categories. Batch closure is not claimed.
- `node scripts/check-legacy-docs-ratchet.mjs`: exit 0.
- `node scripts/check-doc-constitution.mjs --no-ledger --check-placement`: exit 0.
- `node scripts/check-doc-candidate-status.mjs --json`: exit 0, no new routing regression.
- `env -u CLAUDE_CODE_SESSION_ID node --test` with the 51 explicit paths in the accounting report: **912 tests passed; 0 fail/skip/cancel**.
- Four actual behavior smokes: **41 checks passed** over recovery legality, registered advisory projection, actual read-only CLI help, resolver binding, claim validation, v3/v4 normalization, cancel-unsupported and passive stance. No worker launch or state-changing command.
- Preservation: 74 historical witnesses and 867 payloads unchanged, five frozen pins unchanged, 174 first-parent non-merge commits/0 allowlist violations/five exact inherited exceptions. C/I: no authority or instruction-reader link change.

## Paths and owner lists

- Corrected current documents/21 section keys: `truth-fix-accounting-agent-coordination.json` scope.sections.
- Section ledger and current-code excerpts: `truth-ledger-agent-coordination.json`, `truth-fix-evidence-agent-coordination.json`.
- Source judgments, successor data, prepared 14 receipts: `ledger/decisions/s2-agent-coordination-truth-judgment.json`, `ledger/retired-unit-decisions.json`, `ledger/candidate-classifications-agent-coordination-truth-fix.json`.
- No new archive/delete or promoted area-portal edit. Historical carriage is unchanged. The 14 current-text edits are the authorized rejected-section correction, not a promotion.
- Main runner conflicts: resolved by `59cd76672`, merged here; no direct spec edit. One separately owned confinement retirement from main is pending for its owning future specs-batch review under standing A13.
- Holds: claim_d6db58a3090422d42154f240f54c9f5a, claim_f11410ffab23bcae1d89e8b6cbedf8bc, claim_bd4897029d5fdbab80b1b7ccee475e12; no new owner intent/approval.

**Next:** owner decides the narrow mechanical binding scope. Then apply only that scope, prove unchanged D/E, activate and pin the corrected receipts, generate the exact changed-row ordinary packs, publish the targeted independent check request, stop ready for review. Final gate closure and independent acceptance remain **UNPROVEN**.
