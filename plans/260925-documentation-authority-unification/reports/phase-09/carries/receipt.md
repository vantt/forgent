# Conserved Claims And Packaging Refresh — Doer Receipt

Author: `fgos-run_unit-run-1792750955a733`  
Source pin: `3e2d05af89313dbfbf0d26cd0de34f6b660d194b`  
Status: **Authored and locally verified; independent review pending. No gate accepted.**

## Read First

- [Machine receipt: commands, exits, every touched row and ID](receipt.json)
- [New additive carry shard](../../../ledger/decisions/s11-preflip-carries.json)
- [44 source occurrences and successor bindings](claim-carries.json)
- [121 existing decision repairs, complete before/after content and neighbors](binding-refresh.json)
- [Candidate document hashes](document-operations.json)

The original reading map and area specifications remain the starting authority. This batch changes candidate documentation and authored accounting only; it neither changes the transitional switchboard nor executes cutover.

## Delivered

| Work | Result |
| --- | --- |
| Conserved reference/operation duties | 44: family 14 = 13, 15 = 12, 16 = 11, 18 = 8 |
| Candidate documents | 16, with 1,009 unit bindings, full content and previous/next placement witnesses |
| Existing ledger corrections | 121 rows across 9 shards; each changed row is listed in `receipt.json` |
| Dropped dispositions | 17: 16 restored, 1 already owner-superseded; all current author rechecks pending review |
| Unapplied pointer deltas | 24 files, exact forward/rollback diffs and both whole-file hashes |
| Removed consumer | `reference-003709`: `assignment-policy.mjs` is absent; historical claim conserved, module not resurrected |
| Current packaging source scan | 415 units: 324 complete non-heading units and 91 heading/direct-block lineage records |
| Final focused proof replay | 8 files, **110 pass, 0 fail, 0 skipped** |

### Live Holders And Preservation

- `docs/platform/platform-foundations.md`: exact source Business Rules and full foundational narratives, including D-ADR0035/0054/0062 and the original retired marker. Locked RUL11/RUL104 wording is unchanged.
- `docs/platform/work-state/decisions/retired-decision-history.md`: original retired marker and `### 0032 — Multi-role Team Harness` layout restored verbatim. The separate runner Iron Law 0032 remains intact.
- `docs/platform/work-state/contracts/knowledge-registry.md`: maintained framework/role/doc identity, lifecycle, migration-rule and attestation clauses. It is a scoped state-registry contract, not promotion of the redesign proposal, open questions or migration program. Registry-managed end-user paths remain unchanged.
- `docs/platform/runner/contracts/conserved-dispatch-doctrine.md`: routes to the existing full Native-First 0026/0033 narrative; conserves session/merge isolation and maintained operation-template constraints without reviving the retired coordination engine.
- `docs/platform/herdr-web-dashboard/contracts/gateway-readiness.md`: gateway missing-config/token refusal and the independent client baseUrl observation. Historical setup-only creation is explicitly qualified by the existing registered token fix.
- Packaging live contracts now hold full manifest canonicalization, common init pipeline/root discovery, vendored parser maintenance and the restored dev-source design. Dev-source **implementation remains absent**; Plan C is not a documentation-cutover dependency.

The session sentence survives as an exact quotation in the current return guard, but was not found in the named legacy spec by the inspected history searches. The new holder records this limitation instead of asserting a verbatim paragraph move. Native-First name drift is an explicit locator correction. Existing narrative text, native extraction and owning tests were reused; no new dispatch, registry or activation mechanism was built.

### Packaging And Review Corrections

[Source parity](source-parity.json) compares current source text, not merely old target digests. [Heading lineage](source-heading-parity.json) accounts for each direct source block, including splits into live contracts and retained evidence. Normalization ignores link spelling, whitespace and heading depth; it does **not** prove link-destination identity, implementation truth or future-pin freshness.

Current npm onboarding refusal, terminal row/defaults, identity checks, process-containment/runtime-socket rows, executor-skill/tier-fallback checks, Windows `LockFileEx` and RUL107 are carried. Removed lock-fences/defaults and obsolete install-guide diagnostics are no longer represented as current registry behavior. Fixed source guide rows retain current check/fix wording.

All six named packaging review rows are addressed: `9d97a24e`, `c87924f5`, `9881ddf7`, `249083ed`, `891db485`, `83a4a913`. The topology destinations are restored to the legacy architecture destination; metadata/status corrections are explicitly supersede, not false byte-identical moves. The stale dev-source partial-carry remainder is replaced by split heading/table accounting.

The only unmatched normalized source unit is the compound settled-facts table: every original left-column claim is retained, while the dev-source status cell says **selected design, mechanism unimplemented**. Its complete diff and binding are recorded, not hidden as equality.

### Dropped Claims

`dropped-001` is restored now, including its complete design section and compound-table clause. The old defer verdict is historical only; the current verdict is pending review.

For 002–017, existing restored passages and the owner-selected supersession of 010 were rechecked at their current anchors/digests. They were not needlessly rewritten. Historical reviews remain historical; new `preflipDisposition` entries are pending. No new product decision or genuine unresolved tie was inferred. End-of-window npm removal remains an owed release-owner obligation, not something this batch executes.

## Binding Recipe

Every authored/rebound effective binding uses SHA256 of UTF-8, sorted-key **compact JSON + exactly one LF**, containing only:

```json
{"targetOwner":"…","targetAnchor":"…","targetUnitDigest":"…","targetAncestry":[]}
```

Keys are sorted for serialization; `successorGroup` and placement witnesses are excluded. The exact recipe is declared in the shard and machine receipt. The frozen phase-08 register has **no `bindingHashEncoding` field at this pin**. It was not edited. This batch does not claim to have globally converted the other owners' 191 historical bindings.

`unitCarries` records candidate placement; `conservedClaims` records reference/operation duties. Neither invents native claim IDs. Existing native IDs are referenced only when the immutable identity registry's source digest matches. Independent reviews were not inherited by changed existing decisions.

## Reproduce

Read-only binding/hash/content/neighbor/zero-fuzz patch replay:

```sh
node plans/260925-documentation-authority-unification/reports/phase-09/carries/verify-carries.mjs
```

Result: [verification-result.json](verification-result.json), exit 0. `git diff --check`: exit 0.

Focused proof replay, using a **new** scratch path and the release path read from the authorized main activation:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/carries/replay-focused-proofs.py \
  --release-path '<releasePath>' \
  --scratch /tmp/fgos-work/w1-d1-replay-new
```

The script copies current source and unchanged owning tests to scratch, copies the activated release's actual addon/helper, and uses the existing package `native-addon.json` door with real digest/ABI/path checks. Only the three documentation tests' read destinations and scratch AGENTS pointers use the proposed deltas. Temporary directories, HOME and the production state-root convention are isolated; the state root has required mode 0700. Every test is invoked individually with `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`.

| Owning proof | Final pass |
| --- | ---: |
| `test/docs/rul11-anchor-phrase.test.mjs` | 5 |
| `test/docs/rul104-anchor-phrase.test.mjs` | 2 |
| `test/docs/decisions-corpus-retired.test.mjs` | 7 |
| `test/state/knowledge-registry.test.mjs` | 31 |
| `test/state/knowledge-bootstrap.test.mjs` | 11 |
| `test/runner/operation-prompt-templates.test.mjs` | 36 |
| `test/util/yaml.test.mjs` | 15 |
| `test/cli/knowledge-verbs.test.mjs` | 3 |

[All 29 attempted individual test commands and logs](test-results.json) are retained, including failed setup attempts. Initial direct tests refused the unshipped checkout addon despite `FGOS_HOST_BIN`. Staging needed contract files and an isolated state root; a 0775 fixture root was correctly refused and fixed to 0700. One scratch attempt targeted the real machine attestation root and was refused EROFS before later isolation. These were fixture corrections, never disabled production checks. Final evidence proves current Node source against the activated addon ABI, **not Rust working-tree freshness**.

## Integration Boundary

[Pointer specs](pointer-patches.json) are exact **current-pin D1 deltas**, not replacements for shared whole-file compositions. Existing approved composition references/hashes are recorded. Lead/D2 must compose the complete approved set once at its final pin, regenerate the six skill previews from canonical core/domain sources, rerun owning proofs and recompute hashes. No fuzzy application or cutover-readiness claim is made here. The corpus test retains the separate architecture-map/system-overview destinations pending those owners' compositions.

No full suite, Cargo workspace test, Git write/commit, live fgOS command against this repository, activation, main landing, owner-answer/progress/gate-status edit or identity §7a change occurred. `impact-analysis: degraded` under the brief's no-CLI boundary; no production symbol was edited. Browser previews were not launched under the constrained no-extra-service boundary. `needsWrites` for completing this scoped doer output: none.
