# A38 review: Step 5 bounded part-01

- Reviewer: `reviewer:sonnet-session:a642704cf61747822@2026-10-17`
- Author session: `codex-session:fgos-run_unit-run-17922161b19023@2026-10-17`
- Reviewed commit: 5334499c1075646bc05c7873868e10dbefa27106 (detached read-only worktree)
- Pin check: PASS. The request's light script ran once: all pins and the three parts matched sha256 and byte size, part limits held, and the remainder frame has 22,454 sorted unique ids with a matching `sortedIdsSha256`. `git diff --check` was clean.
- Review mode: ordinary
- Scope: `review-input-step-05-01/part-01.json` only (60 entries). No remainder draw, no rollup. Nothing was written to any repo. No fgos CLI, tests or inventory jobs were run.

## Totals

ok 60, rework 0. Mechanical on all 60; deep read on 23 (13 mandatory plus 10 seeded).

Part composition:

| Kind | Rows | Alignment | Risk | Route |
|---|---|---|---|---|
| duplicate-group | X-DUP-01..04 | deferred | medium | Step 6 |
| semantic-group | X-SEM-05..32 | deferred | medium | Step 2, except SEM-29/31 Step 6 |
| a34-residual | X-A34-01..28 | deferred | 13 high (01, 17..28), 15 medium | Step 5 sample; Step 9 all affected |

All 60 rows are `deferred`, so none claims current-truth implementation. All four rows beginning `X-DUP` are Step 6 deferrals; `X-DUP-01`, `-02` and `-04` are byte-identical pairs, while `X-DUP-03` is not (see gaps).

## Mechanical checks (all 60)

- Row id equals entryId, and each id is unique.
- Every `statementFileSha256` matches the file on disk.
- Every evidence `fileSha256` matches its file. Evidence refs with `fileSha256: null` are directories (`apps/fgos-gateway/web`, `apps/fgctl/src`, `packages/distribution`). All exist.
- Every owner path exists.
- Every proof command refers only to files that exist.
- `deepReadRequired` is true exactly on the 13 high-risk rows. There are no parked rows (`parkedReason` is null throughout).

## A34 binding verification (all 28 rows, beyond the sample)

Checked against `step-05-a34-preservation.json`:

- `decisionSha256` and `residualFileSha256` match disk and equal the B0 hashes. `residualBytesUnchanged` is true on every row.
- Each row's decision file and residual file appear in the part's evidence list. `owner` matches the part row.
- Each `verbatimPayload` hashes to `residualPayloadSha256`.
- Payload provenance, checked by locating it in the source text:
  - Rows 01 and 15..28: payload equals `residualText` in the residual file's claim record.
  - Rows 02..13: the payload is a substring of the restored passage at the cited `restored` target in the current tree. For X-A34-07 the payload is the concatenation of two restored sections, each of which is present.
  - Row 14: payload is a substring of `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at the residual's `sourceCommit` and in the current file.
- `legacySuccessorRehomeOwed` is true for exactly 13 rows (01, 17..28). Source drift from B0 is flagged on 13 rows and target drift on 11. All of these match the recomputed current hashes, and `counts` match.
- Every `activationCondition` starts with the Step 9 and Phase 9 re-home and no-activation obligation.

## Deep-read selection

- Mandatory: the 13 high-risk rows (X-A34-01, 17..28). There is no parked row. There is no digest mismatch among the mandatory rows.
- Required count: max(10, ceil(15% of 60) = 9) = 10.
- Seeded: Python 3.10.12 `random.Random("a38-s5-p1-quokka-7314").sample(sorted(non-high-risk ids), 10)`. The held seed is `a38-s5-p1-quokka-7314`, drawn after the pin check. The pool was the 47 non-high-risk rows.
- Seeded ids: X-A34-04, X-A34-11, X-A34-12, X-A34-13, X-A34-14, X-DUP-02, X-SEM-06, X-SEM-13, X-SEM-19, X-SEM-24.
- X-DUP-01, 03 and 04 were also read, because the sample drew X-DUP-02 and they share one claim shape.
- Total deep rows: 13 mandatory + 10 seeded = 23 distinct ids (the seed did not hit any mandatory row), plus X-DUP-01/03/04 read as siblings.

## Rework calculation

Substantive deep-read rework numerator: 0. Denominator: 23 deep-read rows. 0 / 23 = 0%, which is below the 3% threshold, so no full-part expansion was needed. The 28 A34 bindings were checked in full anyway, with 0 rework.

## Verdict table

| ids | verdict | note | evidence |
|---|---|---|---|
| X-DUP-01, -02, -04 | ok | deep (-02 and -01/04 as siblings), plus mechanical | Old and new paths hash equal: 9f200578 for gateway-api yaml, 2ce8f77f for the schema, b18be20a for spec.config.yaml. Deferred to Step 6. |
| X-DUP-03 | ok | deep | Sha differs between the paths (b7797fea vs 74762f5c). Disclosed in evidence; Step 6 gap recorded below. |
| X-SEM-05..12, 14..16 | ok | mechanical (SEM-06 deep) | statement path and owner exist; ledger decision hashes match; code evidence paths exist. |
| X-SEM-13 | ok | deep | Owner file sha equals `legacySourceSha256`. Note on statementPath below. |
| X-SEM-17..32 | ok | mechanical (SEM-19, -24 deep) | UI-spec statement files match; they cite the `s8-ui-spec-01` decision, `spec.config.yaml` and `apps/fgos-gateway/web`. |
| X-A34-01, 17..28 | ok | deep, high | See A34 verification above. |
| X-A34-02..16 | ok | mechanical (-04, -11, -12, -13, -14 deep) | Same checks, medium risk. |

## Rework items

None.

## Observations and gaps (reported, not repaired)

1. X-DUP-03, Step 6, owner `docs/platform/contracts/architecture-manifest.json`, risk medium. The "duplicate pair" is not byte-identical. The root `docs/architecture-manifest.json` has holder-lock path classifications that the platform copy lacks: seven `src/holder-lock/*` entries, `src/setup/holder-lock-checks.mjs` and `src/runner/dispatch/cwd-lock.mjs`. The platform copy is therefore stale relative to the root. The row discloses both hashes and defers equality to Step 6, so this is not rework.
2. X-SEM-13, Step 2, risk low. `statementPath` is `docs/specs/runner.md`, but the semantic group's members are three historical files under `agent-coordination/history/retired-engine/inbound/...`, and `owner` is the first of them. runner.md is not a group member. It is the "current execution authority" that those history files point to. `docs/specs/runner.md` is unchanged between 21555f026 and 5334499c1, so the pinned hash is current. This is wording and mapping, not conservation loss, so it is not rework. An optional doc-fix would point `statementPath` at the owner.
3. X-SEM-17..32 and X-SEM-12 evidence refs for code are directories, so they carry no digest. This is acceptable under the row's own scope, "no whole-file behavior claim".
4. Outside part-01 but visible: the raw blob inequality for `docs/specs/reading-map.md` stays visible, `21555f026:` is f4f36b52 and `21555f026^2:` is b306e3a3. This part-01 scope does not need action.

All 13 high-risk A34 rows carry the Phase 9 re-home obligation and are not activated. Implementation gaps (Step 6 for X-DUP-03) are owner-routed.

Status: DONE
Summary: 60 ok, 0 rework; pins and part limits verified at 5334499c1. All 28 A34 bindings were verified against residual files, and 23 rows were deep-read (0 / 23 = 0% rework). Only observations remain: X-DUP-03's stale duplicate manifest (Step 6) and X-SEM-13's statementPath mapping.
