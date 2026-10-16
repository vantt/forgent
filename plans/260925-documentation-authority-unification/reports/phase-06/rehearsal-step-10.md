# Step 10 full-corpus promotion rehearsal

Content pin: `498048c1a6651556a0ae977a2871135b5ac7c945`. Disposable clone: `/tmp/fgos-work/step10-rehearsal-iNWSm9`. Started 2026-10-16T12:48:18.581Z; finished 2026-10-16T13:03:48.457Z; **clone removed: True**. [Raw command/result receipt](step10-global-rehearsal.json).

The clone regenerated a genuine native inventory: `{'files': 4486, 'units': 91388, 'commit': '498048c1a6651556a0ae977a2871135b5ac7c945'}`. Only current plan decision shards and the exact compact native registry overlaid its detached SYNC checkout. Docs diff: `''`. No authority was flipped, candidate promoted, alias adopted or source deleted. Scratch Git operations belong exclusively to the requested disposable clone; source/worktree Git was read-only.

Full strict-E opens: `[('claims-partial-carry', 28), ('claims-not-reviewed', 24), ('identical-units-multiple-owners', 362), ('registry-gaps-without-disposition', 2), ('candidate-blocks-unreferenced', 2334)]`. Fatal findings: `['claims-partial-carry', 'claims-not-reviewed', 'identical-units-multiple-owners', 'registry-gaps-without-disposition', 'candidate-blocks-unreferenced']`. Native invariant failures are distinct from strict open-data findings; this is no global-green claim.

The unchanged `evaluateRetirement`, `summarizeResults` and `exitCodeFor` exports underlying `check-doc-retirement.mjs --cutover` ran against the full applied in-memory native overlay. Cutover exit **1**, counts `{'pass': 6, 'blocked': 13, 'review': 1}`. We do not claim the aggregate-JSON CLI entry succeeded; the full JSON transport exceeds Node's string limit, and no checker was changed.

| Gate | Check | State | Measured blocker |
|---|---|---|---|
| promotionGate | owner-per-claim | blocked | 22629 owner violations of retained rows, retained rows without an owner and unknown-blocking rows |
| promotionGate | no-new-legacy-growth | pass | none: legacy-docs ratchet violations |
| promotionGate | metadata-and-structure | blocked | 89 platform documents with no switchboard status (89, evidence payloads excluded), missing metadata fields (0), no placement (0) or an ambiguous route (0) |
| promotionGate | links-resolve | blocked | 156 unresolved relative links or Related paths in candidate and promoted documents |
| promotionGate | claims-reviewed | blocked | 24 claim rows whose reviewStatus is not reviewed |
| promotionGate | intent-and-boundary | review | human review owed (docs/doc-governance.md §8, §11); record it with --review-record |
| retirementGate | file-disposition | pass | none: inventory files whose file-level disposition is unknown-blocking |
| retirementGate | claims-closed | blocked | 52 claim rows that are unknown-blocking, partial-carry or unreviewed (overlapping counts) |
| retirementGate | dropped-claims-resolved | pass | none: dropped-claims register entries without a reviewed disposition |
| retirementGate | aliases-cover-immutable-refs | blocked | 994 of 994 legacy paths that history reads by path have no bare-path alias (alias table holds 0 entries) |
| retirementGate | consumers-rewritten | blocked | 5213 consumer edges read a legacy path from outside the legacy roots and history (upper bound, not yet proven non-authority; by kind {"literal":2954,"executable-proof":651,"dynamic":60,"glob":1455,"shipped-contract":35,"fixture":58}; 7467 unresolved dynamic patterns from authority consumers are not counted) |
| retirementGate | evidence-digests | blocked | no evidence relocation manifest and no verifier exist; this dry run does not execute one |
| retirementGate | no-new-legacy-growth | pass | none: legacy-docs ratchet violations |
| retirementGate | write-lease | blocked | the lease is a design only (cutover-write-lease-design.md); no door, hook guard or doctor check exists |
| retirementGate | row-set-conserved | pass | none: previous claim ids missing from the current registry, or retired rows without a disposition (against 2 registries) |
| retirementGate | one-owner-per-semantic-claim | pass | none: semantic claims with more than one owner |
| retirementGate | cutover-mode | blocked | 68113 ledger cutover violations ({"not-reviewed":22864,"partial-carry":13,"unknown-blocking":22616,"without-own-rationale":22616}) plus 4 vocabulary usage drift(s) |
| retirementGate | reviewed-rationale | blocked | 22616 rows whose disposition requires a rationale and that carry none of their own |
| retirementGate | canonical-metadata-complete | blocked | 1 of 160 canonical platform documents lack promotion fields (0 headerless, 1 incomplete) |
| migration-acceptance | no-unresolved-conflicts | blocked | 32 duplicate-content groups (4, excluding 814 evidence mirrors that resolve by deduplication) and semantic-conflict groups (28) still open |

This dry run preserves real current-truth/promotion review, expected-set differences, candidate-unverified/A34, conflict groups, empty adopted aliases and non-doc consumer/write-lease/evidence-relocation obligations. No evaluator or review was waived. L10-7's missing Step2 reduced rehearsal is recorded separately in [rehearsal-step-02.md](rehearsal-step-02.md).
