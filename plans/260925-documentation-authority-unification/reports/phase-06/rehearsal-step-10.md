# Step 10 refreshed full-corpus promotion rehearsal

Content/SYNC `c3614f4d223f0c787ee6dc7ce0a8c89433ddc7be`; package pin is the runner commit containing this report. Disposable clone `/tmp/fgos-work/step10-rehearsal-9YQMNl`; started2026-10-16T17:24:19.409Z,finished2026-10-16T17:41:24.498Z,elapsed**1025.089s**. **Clone removed: True**; independently checked absent. [Full command/gate receipt](step10-package-rehearsal.json).

Inputs changed sincef70ecf4ec (lists,gaps,rows,two current-body restorations plus Session Identity header,native registry), changing strict-E membership,promotion completeness and snapshot bindings. [Input hashes/re-run reason](step10-package-checkpoint-input-changes.json). The old498048c1a rehearsal remains historical; it was not treated as coverage for this pin.

The first attempt was SIGKILLed during native generation before producing gate results. Memory pressure is inferred from RAM-backed scratch holding4.8 GiB and full swap,not kernel-confirmed;that owned clone was removed. The consumed2.2 GiB v8 transport was released. The retry's physical clone contains all docs/scripts/decision input directories and the sole native registry;its isolated Git object-store alternate exposes **every blob of the complete commit**, so native API generation and consumer scan are unfiltered. No Git state mutation verb runs. Scratch is about483 MiB instead of4.8 GiB. [Failure/cleanup evidence](step10-package-rehearsal-attempt1.json).

Native regenerated**4486 files/91388 active units**,full denominator asserted;no carry-forward or registry persistence repeated. The unchanged production strict-E evaluator ran on the full1,045-source scope and separately on Step2's`docs/architect/agent-coordination` scope. Full open population exactly equals the package E result: **claims-partial-carry=28; identical-units-multiple-owners=362; candidate-blocks-unreferenced=2336**. The three native fatal entries are these known open categories;no additional corruption finding. No active pending/unknown/undisposed reading-map gap was silently hidden. [Step2 result](rehearsal-step-02.md).

The unchanged`evaluateRetirement`,`summarizeResults`and`exitCodeFor`exports underlying`check-doc-retirement.mjs --cutover`ran on the complete applied native in-memory overlay. **Cutover exit1;counts{'pass': 8, 'blocked': 11, 'review': 1}**. This is the actual production evaluator result,not a claimed successful aggregate-JSON CLI invocation or simulated promotion. Monolithic JSON exceeds Node's string limit;lossless native transport is used without omitting a field.

| Gate | Rule | Actual status | Actual measurement |
|---|---|---|---|
| promotionGate | owner-per-claim | blocked | 22629 owner violations of retained rows, retained rows without an owner and unknown-blocking rows |
| promotionGate | no-new-legacy-growth | pass | none: legacy-docs ratchet violations |
| promotionGate | metadata-and-structure | blocked | 89 platform documents with no switchboard status (89, evidence payloads excluded), missing metadata fields (0), no placement (0) or an ambiguous route (0) |
| promotionGate | links-resolve | blocked | 158 unresolved relative links or Related paths in candidate and promoted documents |
| promotionGate | claims-reviewed | pass | none: claim rows whose reviewStatus is not reviewed |
| promotionGate | intent-and-boundary | review | human review owed (docs/doc-governance.md §8, §11); record it with --review-record |
| retirementGate | file-disposition | pass | none: inventory files whose file-level disposition is unknown-blocking |
| retirementGate | claims-closed | blocked | 28 claim rows that are unknown-blocking, partial-carry or unreviewed (overlapping counts) |
| retirementGate | dropped-claims-resolved | pass | none: dropped-claims register entries without a reviewed disposition |
| retirementGate | aliases-cover-immutable-refs | blocked | 994 of 994 legacy paths that history reads by path have no bare-path alias (alias table holds 0 entries) |
| retirementGate | consumers-rewritten | blocked | 5213 consumer edges read a legacy path from outside the legacy roots and history (upper bound, not yet proven non-authority; by kind {"literal":2954,"executable-proof":651,"dynamic":60,"glob":1455,"shipped-contract":35,"fixture":58}; 7467 unresolved dynamic patterns from authority consumers are not counted) |
| retirementGate | evidence-digests | blocked | no evidence relocation manifest and no verifier exist; this dry run does not execute one |
| retirementGate | no-new-legacy-growth | pass | none: legacy-docs ratchet violations |
| retirementGate | write-lease | blocked | the lease is a design only (cutover-write-lease-design.md); no door, hook guard or doctor check exists |
| retirementGate | row-set-conserved | pass | none: previous claim ids missing from the current registry, or retired rows without a disposition (against 2 registries) |
| retirementGate | one-owner-per-semantic-claim | pass | none: semantic claims with more than one owner |
| retirementGate | cutover-mode | blocked | 68089 ledger cutover violations ({"partial-carry":13,"unknown-blocking":22616,"not-reviewed":22840,"without-own-rationale":22616}) plus 4 vocabulary usage drift(s) |
| retirementGate | reviewed-rationale | blocked | 22616 rows whose disposition requires a rationale and that carry none of their own |
| retirementGate | canonical-metadata-complete | pass | none: of 160 canonical platform documents lack promotion fields (0 headerless, 0 incomplete) |
| migration-acceptance | no-unresolved-conflicts | blocked | 32 duplicate-content groups (4, excluding 814 evidence mirrors that resolve by deduplication) and semantic-conflict groups (28) still open |

Promotion160/160 and H0 are structural metadata evidence;they do not grant current-truth or cutover approval. Adopted alias table remains empty;draft aliases are not installed. No pending review,partial carry,candidate reverse unit,owner queue,A34 obligation,conflict group or non-doc/consumer/write-lease/evidence-relocation requirement was waived. Docs diff in clone is empty;source docs stay atc3614f4d2. Cleanup executes in`finally`,and the final receipt plus external absence check confirm both owned rehearsal clones are removed.
