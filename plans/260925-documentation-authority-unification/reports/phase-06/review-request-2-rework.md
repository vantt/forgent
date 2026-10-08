# Agent Coordination — single rework review request

Status: **ready-for-review**. A10 is implemented; both owner contract blockers are resolved. This is the one allowed content rework re-review, not batch closure, tooling re-review or Phase 6 completion. First independent reports: `bb03cab52579d358015c611fa8b8543062a6e4da`. Follow `review-brief.md` and the owner-approved ordinary reading method. No ordinary seeded pack/red-team; checkpoints remain after Step 3, after Step 6 and in Step 10.

## Pins and complete workset

Candidate text: `1f4f0b06274fa95fe94f10e904e1ff12a2898ef4`. Corrected same-path data and classification receipts: `1727b03d14e5b4161eae2c578219b066acf038d6`. The release commit containing this request additionally pins pending receipt references to that data commit. Ownership implementation: `a207f4266`; classification implementation: `a63b50749`. Current pack hashes and commands are in `rework-packet.json`; do not reuse first-review packs.

| Workset | Current result | Review required |
|---|---|---|
| Manual source rows | 1,435 unique; 1,329 reviewed; 106 pending | All pending rows: original 78 reworks, 27 reopened kind corrections, one demoted exact introduction; five packs 16/64/21/4/1. Four raw logs now bind their own same-path `.log`, not a Markdown duplicate. |
| Physical evidence | 863 mirror files plus four manual logs, all own same-path equal-blob copies | Recheck the changed 48 mirrors/four logs; zero bad carrier bindings. Canonical kinds retain fatal semantic-owner uniqueness. |
| Conflict receipts | 74 corrected | 69 evidence-name resolutions, equal-blob SVG receipt, four earlier accepted receipts with changed member evidence. |
| Identical-unit exceptions | 342 groups: 206 unchanged accepted, 136 pending | Original 128 corrected groups plus eight newly distinct physical-carrier groups. The 126 shared rechecks have one origin retained in two receipts, not independent corroboration. No checker exemption added here. |
| Current reverse receipts | 130 pending | Read every full shown text in candidate-classification-review.md and the committed receipt JSON. Fixed-class proposals: 77 structural-frame, 39 bookkeeping, 14 candidate-native-navigation. Reject unsupported substantive material rather than classifying it as a frame. Historical reverse verdicts do not constitute new digest/class approval. |
| Historical reverse rework | 59 corrected proposals | 52 previously blocked copies now source-bound; scheduler source binding and consolidated paragraph accounted; five labelled wrapper units are included in the new receipts. Keep reverse-agent-coordination.md/json as historical review evidence. |
| Retired candidate unit | One pending supersede decision | ledger/retired-unit-decisions.json; complete transition paragraph remains exactly once in contracts/README.md. |
| Script proof population | 15,599 rows: 12,878 Mirror + 2,721 Unit-exact | Reviewer draws 100 random script-proven rows from the regenerated population; author draws none. Hash and command evidence in rework-packet.json. |
| Legacy links | 17 target units, 50 overlapping occurrences | candidate-legacy-link-queue.json; Step 10 owns link rewrites. |

## Reading order and paths

All plan-relative paths below are under `plans/260925-documentation-authority-unification/`.

1. `reports/phase-06/owner-answers.md` A10, this request, `review-brief.md`, `tooling.md`, `carrier-ownership-verification.json`, `candidate-classification-verification.json`, `rework-packet.json`.
2. Five `ledger/decisions/s2-agent-coordination-{judgment-01,judgment-02,judgment-03,log-duplicates,reopened-exact}.json`; pending classification references in `s2-agent-coordination-classifications.json`; `ledger/candidate-classifications-agent-coordination.json`; `reports/phase-06/candidate-classification-review.md`.
3. `ledger/conflict-resolutions.json`, `ledger/retired-unit-decisions.json`; `reports/phase-06/identical-unit-exceptions.md/json`, `reverse-agent-coordination.md/json`, `review-rework-evidence.json`, `same-path-binding-blocker.json`, `post-review-edits.md`, `candidate-legacy-link-queue.json`. The old blocker/evidence artifacts retain historical diagnostics; A10 release data and rework-packet.json are current.
4. Seven changed candidate files under `docs/platform/agent-coordination/`: `proposals/dag-request-scheduler.md`, `proposals/README.md`, `verification/README.md`, `contracts/README.md`, `history/documentation-migration/{documentation-governance,documentation-standardization-plan,source-inventory}.md`. Both enum texts and both literal historical snapshots remain unchanged.

Regenerate scratch with the unchanged native refresh invocation in rework-packet.json, preserving explicit retired-unit dispositions. Run each recorded `propose-doc-decisions.mjs --pack` command; read all 106 pending source rows and reverse material. Source rows use committed ordinary Claim/Verdict/Note/Source-digest/Target-digest reports and unchanged `--apply-review`.

Classification acceptance needs a **new committed** independent report with `Author session`, `Reviewer`, `Receipt commit: 1727b03d14e5b4161eae2c578219b066acf038d6` and the six-column Claim/Class/Verdict/Unit digest/Shown text digest/Note table specified in review-brief.md. Read the pinned full section/text, not heading identity alone. Only accepted references may acquire reviewed status/report pin after that commit; this author records no approval. No receipt or label alone closes a reverse unit. Checkpoint-named reports cannot substitute for this ordinary classification review.

## Exercised proofs

Tests: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-doc-conservation.test.mjs test/scripts/doc-decision-mirrors.test.mjs` → 40/40; `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-candidate-conservation.test.mjs` → 32/32. Scripts suite → 901/901. Full suite, 393 explicit files with `--test-concurrency=4` → 7,391 total, 7,318 pass, zero fail, eight skip/65 todo. Post-commit full suite and both B0 native defaults also pass; output hash unchanged. Exact command arrays are in the two tooling verification JSON files; skipped/todo behavior is UNPROVEN.

D scoped to all 937 sources, once with each A1 prior registry: exit 0, zero fatal/lost-id/self-review. E, same commands plus `--strict`: exit 1 with exactly 106 pending source rows, 342 identical-unit exception groups and 130 unapproved classification units. The unchanged comparator still rejects pending source and reverse counts; exception table count is 342, holds zero. This is the correct pre-review diagnostic, **not P6 green**.

A has zero unexpected pairs after exactly the five A3 exemptions; B/C/I unchanged; ratchet 995 files / 24 accounted edits / one accounted new file; placement 448/447, one recorded exception, zero leftover/ambiguity/evidence without index; H 30 accounted, zero new, Agent Coordination zero. Both legacy area/evidence tree hashes match their immutable pins. Retirement cutover remains expected red: four pass/15 blocked/one review.

## Owner lists and exact next step

- Archive/delete: 65 temporary migration notices independently accepted; two retired policy/plan documents retained verbatim as authorized history moves. No physical legacy archive/deletion or delete-as-obsolete.
- Real conflicts: the 12 physical-carrier ownership failures are resolved solely by A10's evidence-only rule; canonical rule remains fatal. The 74 corrected conflict receipts still require this re-review.
- Holds: zero unknown-blocking source holds. Pending reviews are not fabricated holds.
- Promoted edits: only the previously recorded portal edits in promoted-edits.md; no new promoted-document edit or authority flip.

The owner starts the one independent re-review using this request and commits the reports. The executor then applies only committed ok verdicts, binds accepted classification receipts, reruns both strict proofs, performs P6 rehearsal/fresh readers and closes the batch before Host Invocation. P6 closure, actual receipt acceptance, reader scenarios and promotion rehearsal remain **UNPROVEN**. Stop now at ready-for-review.
