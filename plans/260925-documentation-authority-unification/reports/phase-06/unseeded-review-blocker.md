# Unseeded ordinary review: frozen-contract blocker

## Decision needed

A5 (`a7ec5054a`) requires ordinary batch reviews without seeded packs, while freezing tooling at `1ec3ceca6` plus H1 only. The unchanged apply and gate contracts require per-approval sensitivity bindings. Both requirements cannot currently be satisfied honestly. Do not change the guards, fabricate score values, or apply real approvals without a new committed owner decision.

This is a gate-semantic blocker demonstrated before content authoring, equivalent to the phase's rehearsal stop condition 12; a fix would also exceed A5's H1-only tool scope. H1 is complete; this is not a request for another tooling re-review.

## Observed proof

Code commit: `658b4e602e92f32d4435d9173aec98eb1420b715`.

A disposable fixture uses a real committed source/report, distinct author/reviewer identities, a normal shown pack, complete verdicts and mandatory authorship. The fixture has no actual seed result for the attempted ordinary approval. Running:

```sh
env -u CLAUDE_CODE_SESSION_ID node /tmp/phase06/unseeded-review-probe.mjs
```

Exit 0 means the probe observed both expected refusals, not an approval:

```text
unseeded apply: review application requires a passing sensitivity proof and the shown pack
unseeded gate: [{"type":"decision-review-report-missing","message":"claim claim_fixture: no matching committed independent verdict with pack and sensitivity bindings"}]
```

`applyReviewVerdicts` requires `pack`, `seedProof.key` and sensitivity verdicts before approval. It then replays the key and requires a passing score. `validateManualReview` rejects a reviewed manual row without its seed-score binding. The frozen `--help` explicitly requires `--seed-key` and `--seed-verdicts` for apply. Existing fixture hash declarations are not genuine review proofs and are not a permitted workaround for repository rows.

The disposable probe was removed after verification; its observed output is retained in `mandatory-authorship-verification.json`. Reproduction recipe: create an isolated committed-report fixture as in `test/scripts/doc-review-authorship.test.mjs`; call `buildReviewPack` on its pending authored row, then `applyReviewVerdicts` with the shown pack and complete independent verdicts but no `seedProof`; separately remove `seedScoreId` from the fixture's reviewed row and run `applyDecisions`. Both refusals must remain under the current frozen code.

## Completed work and unchanged boundaries

- H1 red `7667c4754`: 15 tests, 8 pass, 7 fail; green `658b4e602`.
- Non-H1 regression changes reverted in `ab69e3d6b`; dropped helpers and untracked `plans/reports/promotion-ledger.json` removed.
- Scripts suite: 861/861 pass across 51 files. Full suite: 7,324 tests, 7,251 pass, zero fail, 8 skip and 65 todo across 389 files. Skipped/todo paths are UNPROVEN.
- Both prior-registry D invocations pass and match the original baseline, with zero fatal findings. Actual batch E remains UNPROVEN.
- A: zero violations after the five exact A3 exemptions. B/C/I unchanged. Ratchet and placement pass; candidate findings retain the five baseline findings. Retirement cutover remains expected exit 1: 15 blocked, 4 pass, 1 review, zero invariant failures.
- Frozen structural CLI fixture: clean zero findings, all eleven defects rejected. No H2, Medium or Low changes retained. No real seed selection, approval, legacy-root edit or authority cutover authored.

## Owner options

1. **Recommended:** commit a narrowly scoped amendment permitting an ordinary committed-report approval channel without a seed, while retaining mandatory authorship, independence, shown-text binding and committed per-row report checks. Keep genuine seeded proofs only at the A5 checkpoints. This requires an explicitly authorized tool-contract change; none has been made.
2. Restore per-batch sensitivity proofs with the current frozen tooling. This changes A5's review procedure, not gate code.

After the owner commits the choice, follow it tests-first where code changes are authorized, finish the remaining Step 1 maps/counts, then execute content batches sequentially and stop at each committed review request. `review-brief.md` already records the A5 procedure and the blocked application boundary. Archive/delete lists, authored holds and promoted-document edits remain empty; SC-1 remains the previously owner-resolved conflict.
