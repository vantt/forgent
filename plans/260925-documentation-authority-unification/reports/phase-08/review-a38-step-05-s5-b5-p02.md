# Review p02 (seam 5 judgment files, batch 5)

Scope: 13 test files, 159 items (30 ADMIT, 129 REJECT). Every item is disposition preserve. There are no diffs, no parks and no patches. Reviewed against the pinned windows in the payload. I also checked the pin for the decision-0022 successor heading and for the generator parks dynamic-009788/009791.

## Per-file verdicts

| file | verdict | items |
|---|---|---|
| test/cli/fgos-post-merge-2.test.mjs | ok | 18 |
| test/cli/fgos-post-merge-4.test.mjs | ok | 27 |
| test/cli/fgos-post-merge.test.mjs | ok | 30 |
| test/cli/fgos-preflight.test.mjs | ok | 4 |
| test/cli/fgos-read-3.test.mjs | ok | 1 |
| test/cli/fgos-return.test.mjs | ok | 13 |
| test/cli/fgos-stage-3.test.mjs | ok | 14 |
| test/cli/fgos-stage.test.mjs | ok | 8 |
| test/cli/knowledge-attest-gate.test.mjs | ok | 29 |
| test/cli/take-pick-claim-eligibility.test.mjs | ok | 1 |
| test/direct/fgos-edit.test.mjs | ok | 6 |
| test/direct/fgos-step.test.mjs | ok | 6 |
| test/e2e/coexistence-canary.test.mjs | ok | 2 |

## OUTCOME defects

None.

Basis:
- No item in these files reads or compares real repository document bytes or wording.
- All `docs/how-to/*`, `docs/explanation/example.md`, `docs/some-doc.md`, `docs/worktree-reclaim/*` and `docs/history/<id>` paths are test-owned fixtures. They are written into `os.tmpdir()` or `mkdtemp` roots (`cwd`, `main`, `wt`, `tmpDir`) or into in-memory state patches (`docsRef`).
- The `docs/backlog.md` string in fgos-preflight L60/L125 is emitted by a fake script the test writes itself (`checkBacklogScript`), not by the real gate.
- The R21 tmp-root rejects hold. I checked every `non-document-fs-probe` operand: all are rooted in cwd/main/wt/tmpDir, or are `path.resolve('bin/fgos.mjs')`, which is code, not a document.
- The enduser-index generator parks (dynamic-009788/009791) cover only the `docs/decisions` explanation alias. The how-to and explanation fixtures here do not depend on it, so no co-cut obligation is missed.
- The preserves carry no `docs/specs` or `docs/architect` "retained" witness. The only comment pointers are docs/history (R16 uniform admit/preserve) and the retired decision 0022.
- take-pick-claim-eligibility reference-004022 cites retired `docs/decisions/0022-fgos-choke-point-survey.md`. It carries a successorNote to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0022--...`. The pinned holder has the heading `### 0022 — Khảo sát choke-point fgOS ...` at L295, so R8 is satisfied.

## Record-text notes (no outcome change)

1. take-pick-claim-eligibility reference-004022 `reason` says "no module-header live-holder pointer in this selected batch". The citation is on L2, inside the module header comment. Preserve with successorNote is defensible under R8's retired-decision precedent. The wording is misleading and should say the citation is a dated retired-decision origin with a live successor, not that no header pointer exists.
2. Admission labels are inconsistent for the same operation kind. The outcome is preserve either way, so these are label-only.
   - fgos-post-merge-2: `run(cwd,['doc-sources','docs/how-to/shared.md'])` (L197/216/234) is ADMIT document-path-comparison. The sibling `addOutcome(... docPath: 'docs/how-to/shared.md')` (L190/192/195/229) is REJECT config-or-metadata. These are different operands on different lines, so R7 is not breached.
   - fgos-return L370 `hit.file === \`docs/history/${id}/iron-law-evidence.md\`` is ADMIT (003997/017718). The equivalent emitted-path assertion at L403 `hit.file === \`${docsRef}/RESEARCH.md\`` (dynamic-017722) is REJECT text-label-join.
   - knowledge-attest-gate passes `--doc-path docs/worktree-reclaim/guide.md` and `--aliases ...` to the product CLI in execSync command strings (L101/119/126/132/...). These are REJECT text-label-join. The same-shape `run(cwd,[...,'--doc-path',...])` in fgos-stage-3 (L183/204/221/239) is ADMIT.
   - reference-004003 (fgos-stage-3 L236, `git add` of a tmp-repo fixture) is labelled `config-or-metadata`. `non-document-fs-probe` would be more accurate.

## Lead-judgment questions

1. Should the knowledge-attest-gate command-string doc paths (including the alias `guide-old.md`) be admitted, to match the other CLI-arg cases? They exercise product registry/alias lookup. They are tmp-rooted fixtures, so the outcome stays preserve and parity is owned by the Phase 9 full-suite run. It is a consistency call only.

## Counts

- Files 13, items 159: ADMIT 30 (comparison 24, comment-provenance 6), REJECT 129.
- By nonDocumentUse: non-document-fs-probe 60, config-or-metadata 32, text-label-join 22, state-event-store 13, scalar-pass-through 2.
- Dispositions: preserve 159, patch 0, park 0, render-join 0.
- Outcome defects 0; record-text notes 2; Lead questions 1.

Status: DONE
Summary: All 13 test files review ok: 159 items, no outcome defects. Two record-text notes and one admission-consistency question are listed.
