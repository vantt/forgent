# W33 ownership audit review

Pin: `a91edadbe` (HEAD). This is an independent, read-only review; the only files written are this report and its [JSON twin](w33-ownership-audit-review.json). I read ruling [L13-27](../owner-answers.md) and the briefs [w30-g0rework-edge](../w30-g0rework-edge-brief.md), [w31-ownership-drift](../w31-ownership-drift-brief.md) and [w31-ownership-reader](../w31-ownership-reader-brief.md) first. None of the reviewed files changed between `4a4fefbe8` and the pin.

## Verdicts

| Item | Verdict | Severity |
| --- | --- | --- |
| `73e89962e`: six target-digest edges, records 149 to 154 | APPROVE | Low |
| `98d71bef2`: mandatory live ownership audits in `verify.py` | APPROVE | None |
| `ca3179b3c`: reader judges drift through `rebind.py --check` | APPROVE | Low |
| `c3882df26`: `audit-report.py` reads `unaccountedTargetDigestDrift` | APPROVE | Low |
| `4a4fefbe8`: plan-branch pair accounting | APPROVE | Low |

Counts: 5 APPROVE, 0 REWORK, 4 Low notes, none blocking.

## Commands run (one at a time, `NODE_OPTIONS=--no-addons`, `CLAUDE_CODE_SESSION_ID` unset, `python3 -B`)

| Command | Exit | Result |
| --- | --- | --- |
| `python3 -B P/g0rework/verify.py` | 0 | `status: partial`, `ok: false`, `recordProofsPassed: true`. All 15 nested commands exit 0. For both manifests: raw drift 23, unaccounted 0, `noNewDoubleOwnership: true`. Script hashes equal the receipt table. |
| `python3 -B P/rebind/rebind.py --check` | 0 | drift 0, 7 authenticated superseded origins, 16 authenticated groups |
| `python3 -B P/g0rework/refresh-carries.py --check` | 0 | pass, 346 parity rows, 91 live heading rows |
| Independent digest extraction (`rebind.py`'s own `extract()` on virtual copies of the parent and the cause commit) | 0 | All six edges match exactly |
| Independent negative controls in tempfile copies | 0 | All three controls refused (see item 3) |

Not reproduced: `phase-08/audit-report.py` and `checks.mjs` were never run, because they are forbidden. The Lead's result that the audit is ok at `4a4fefbe8` is not reproduced here. I checked item 5 statically against `checks.mjs`'s own offender predicate.

## 1. `73e89962e`: APPROVE

- **Digests.** For all six edges, the old digest, new digest, anchor and ancestry are equal to the unit extracted at the cause commit's parent and at the cause commit.
- **Units.** `e88d4e283` changed exactly four bound units of `work-state/spec.md`: `3-work-item-data-dictionary`, `unheaded-block-4`, `6-domain-model` and `unheaded-block-54`. `5a849befc` changed exactly two bound units of `component-boundary.md`: `9-hexagonal-architecture-view` and `unheaded-block-70`. Each changed unit has exactly one edge, and the reasons match the diff lines 74, 83, 516 and 549.
- **affectedBindings.** I traversed every ledger and pilot row with `bindings.rows()` at `73e89962e`. For every edge, the list equals the set of rows that bind the anchor with its old or new digest: nothing is missing and nothing is extra.
- **Witnesses.** They are reused through `witnessSource`. The inline witnesses keep only six identity keys, and those equal the source witness's `selected` field for field. The 22 older records copy the whole witness instead.
- Low: records 149 and 150 key `file`/`pointer` on the refreshed overlay row, while 151 to 154 key on the origin row. `verify.py` resolves the owner either way, so this has no effect.

## 2. `98d71bef2`: APPROVE

- **Mandatory, and failure propagates.** Both live `ownership.mjs` and `audit-ownership.mjs` run for both manifests on every run. Their exits enter `commands`, and `recordProofsPassed` requires all of them to be 0. `liveOwnershipPassed` also requires that no row fails, and `ownershipPassed` depends on it. When it fails, `verify.py` exits 1.
- **Environment.** `NODE_OPTIONS` is now set outright to `--no-addons` plus the `dlopen` guard instead of appended to the inherited value, which is stricter. `CLAUDE_CODE_SESSION_ID` is popped.
- **`checks.mjs`.** It is never written and never run, and no nested proof references `checks.mjs` or `audit-report.py`.
- **No weakening.** The removed leaf-name guard is moot, because the three written names are now fixed literals.

## 3. `ca3179b3c`: APPROVE

- **Scope.** I diffed the embedded strings against `ca3179b3c^`. In both manifests only `ownership.mjs` and `audit-ownership.mjs` changed. `checks.mjs`, including its exception list, the libraries, and every other key are byte-identical.
- **Accounting.** `ownership.mjs` keeps the raw predicate and `targetDigestDrift` unchanged. When drift exists, it calls `rebind.py --check` and accounts a raw row only by exact key membership in `authenticatedSupersededOrigins` (keyed on `originBinding`) or `authenticatedIdenticalUnitGroups`. The key is `[file, claimId, targetOwner, targetAnchor, targetUnitDigest]`. That is set membership only; no matching logic is copied into JavaScript. The reader fails closed on a spawn error, an exit other than 0 or 1, or unparseable output. The authoring-pin replay asserts zero drift, so the live checker is never consulted under pinned inputs.
- **All other drift still fails.** `audit-ownership.mjs` changes only `targetDigestDrift` to `unaccountedTargetDigestDrift` in `noNewDoubleOwnership`, and the duplicate and new-pair conditions stay. `rebind.py` exposes groups only through its unchanged `matches()`, which requires every member to match. `verify.py` adds a multiset-partition assertion over raw, accounted and unaccounted rows, and now also requires `noNewDoubleOwnership === true`. `test-accounting.py` loses only its `print` line.
- **Negative controls.** These are my own fixtures, built from rows the receipt's harness does not use:

| Control | rebind `--check` | ownership (both manifests) | audit (both manifests) | Census |
| --- | --- | --- | --- | --- |
| Stale digest, no successor: `b-io-contract.json#/claims/36` | 1 | 0 | 1, with the assert message | raw 24, accounted 23, unaccounted = that claim |
| Group with its **first** member non-matching: `s9-runner-01.json#/registryGaps/18` | 1 | 0 | 1 | raw 23, accounted 22, unaccounted = that claim |
| Extra control: superseded origin whose successor `s14-resync-b.json#/bindingRefresh/604` is broken | 1 | 0 | 1 | raw 23, accounted 22, unaccounted = the origin claim |

The receipt's own two controls (`registryGaps/22` and the last-member mutation of `claim_004b47fc…`) also pass inside the nested `test-accounting.py`.

- Low: `verify.py`'s "exact recorded rebind" wording now governs only the 127 overlay rows. The 23 audit rows are judged by `rebind.py --check`, as L13-27 requires; the module docstring already says so.

## 4. `c3882df26`: APPROVE

- **Right field.** `audit-ownership.mjs` spreads the census and rewrites the same `*-target-ownership.json`, so `unaccountedTargetDigestDrift` is present when the report helper reads it.
- **Still fails on any unaccounted drift**, in two ways: `failingRows` must be `[]`, and `audit-ownership.mjs` exits 1 through `assert(noNewDoubleOwnership)`. If the field were ever missing, the helper throws and the report fails closed.
- Low: `report.json` no longer shows the raw drift rows or their count; they survive only in the scratch census files. Consider adding the raw count beside `failingRows`.

## 5. `4a4fefbe8`: APPROVE

- **Nothing else changed.** In each manifest, only `checks.mjs` changed, through one pure insertion. The prior 5,819 exceptions are unchanged and keep their order, and both manifests receive the same 346 entries.
- **Authority and range.** Every entry has authority `L12-137` and the shape `{commit, path, authority}`, with no duplicates. Every commit lies in `6bb1c7d61..4a4fefbe8^`. The 16 commits outside first-parent come from merged `plan/260925-w1-dN` branches, and none is on main. Every (commit, path) pair is a real change in that commit.
- **Coverage.** Under `checks.mjs`'s own predicate (`diff-tree` over the `--no-merges` commits, minus `allowed-paths.json`), there are 317 offender pairs, and all of them are covered.
- Low: 29 entries cover pairs on already-allowed paths (24 under `ledger/decisions`, 5 under `docs/platform/`). They are no-ops today, because `accountOf` consults only offenders. But they would pre-authorize `docs/platform` edits under `L12-137` if `allowed-paths.json` ever narrowed. Also, 23 other allowed pairs in the same range were left out, so the selection rule is inconsistent. Older L12-137 entries set the same precedent (29 of them). Not blocking.

## Recommended follow-ups (non-blocking)

1. Drop the 29 allowed-path exceptions, or state the selection rule, at the next pair accounting.
2. Have `audit-report.py` also report the raw drift count.
3. Optionally, make the `file`/`pointer` keying of records 149 and 150 consistent with 151 to 154.

No component-boundary change.
