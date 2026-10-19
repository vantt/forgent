# Step 3 pilot round 4 — narrowed independent re-review request

AUTHOR patch records only; no consumer edit or authority flip. Same 21 files, author pin `ae141550c2e022310de7a0efea757580c0b2479f`, inventory pin `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. Read A51 and L12-21..L12-32 in [owner-answers.md](owner-answers.md), especially all six L12-32 rulings, and the current [authoring digest](progress.md#authoring-rules-digest--give-scaled-batches-this-checklist-verbatim).

Round 3 is archived byte-for-byte in [step-03-records-r3/](step-03-records-r3/), including its manifest. Current records are in [step-03-records/](step-03-records/); [manifest](step-03-pilot-manifest.json) freezes all 21 records and rerun selector. [Complete delta](step-03-r4-changes.json) separates **9 outcome changes** (8 existing edges and 1 added edge) from **486 record-text-only changes**. Enum migration changes every edge object; this is not 486 disposition changes. Effective per-edge replacement, disposition, target and anchor determine outcome; hunk regrouping alone is metadata. Complete changed-file diff hashes are also recorded.

## Scope and acceptance

L12-32 narrows this round to the **six round-3 rework files plus any file with an outcome change**: **7 files**. Use the same six groups below; g04 has nothing to review and receives no reviewer. Read the complete assigned record, pinned consumer context, complete proposed diff and actual target passages; give one file verdict covering all edges, added references, parks, preserves and row flips. Do not accept semantics from a checker receipt or search hit. No author self-acceptance or reviewer dispatch is performed by this request.

Keep A51 denominators separate: batch-001 1 file, batch-002 5, batch-040 11, batch-041 4. All already crossed 3% and were reviewed in full; the narrowed round-4 recheck covers batch-002 1, batch-040 5, batch-041 1, batch-001 0. This is not a new pooled sample or a reset of the rework history. Lead owns fresh-context reviewer dispatch, budget, elapsed cost, acceptance and real runner-commit accounting.

## Review checklist

- 08169 parks as description-rewrite, aligned with system-overview's plugin park. The candidate says more than 12 verbs and check is unshipped. 08170 parks because default 8788 conflicts with candidate 4170 (`gateway.port` override); 08171 on the same row parks too. Root-map 07997/07998 receive the same treatment. Static serving ON and mandatory token auth still match.
- 08209 parks because the source says iron-law has no call site, but runner/spec.md:196 lists call sites. Check the concrete shipped-status blocker. These newly found outcome changes are within L12-32(3)'s all-record comparison requirement.
- 08074 anchors to `area-map`, proof lines 50–51. 08232 anchors to `62-nơi-đặt-policy`, proof line 148 (and its recorded scope names 148–149). Check nearest heading and claim scope, not only anchor existence.
- Added `author-r4-docs-specs-runner-L1729C2` preserves `specs/runner.md:26` as retired-region self-reference; source framing, stale coordinate and non-executable successor notes are recorded. The checker runs the expanded partial-root scan itself.
- 08124 says removed at 4270c0c0d, not never-existing. 08131 says renamed/merged at dd4816c0f to beehive.md. 08123/08128 give the runner decisions D-ADR0030 successor heading. Keep original source spelling and historical roles.
- Recheck added-edge Step 5 dependency categories in decision-citation-drift and distribution; blockedCategory equals dependencyCategory. Prose is optional explanatory text, with category consistency checked when supplied.
- All 105 remaining patches contain `descriptionTruth`: complete adjacent paragraph/row, six comparison dimensions, pinned target digest and actual target-line quotes. The checker binds this evidence and rejects an explicit mismatch; **the reviewer decides whether the comparisons and whole-file justifications are true**. Accepted L12-32(6) cases remain unchanged.
- Hit groups use category `citation-only | carriage | partial-holder | unrelated | dead`, optional note. Counts/locations/hashes still replay. Judge whether a category accurately describes the hit set; a partial holder can be insufficient because of a separate carry/description/parity blocker.
- The herdr source's stale 8788 statements at L59/L219–220 are recorded in its coverage.descriptionDrift, with candidate 4170 evidence. Its own five citation patches assert layout/lifecycle roles and leave those port statements unchanged; no outcome changed in that file, so it is outside this re-review. This does not authorize carrying a stale default as current behavior.

## Exact group allocation

### g01

Report: `review-a38-step-03-pilot-r4-g01.md`. Prior evidence: [round-3 g01](review-a38-step-03-pilot-r3-g01.md).

- `docs/reading-map.md` — batch-002; new outcome change. Outcome ids: `maps-j-07997`, `maps-j-07998`. Text-only edge changes: 95.

### g02

Report: `review-a38-step-03-pilot-r4-g02.md`. Prior evidence: [round-3 g02](review-a38-step-03-pilot-r3-g02.md).

- `docs/specs/reading-map.md` — batch-040; round-3 rework. Outcome ids: `maps-j-08169`, `maps-j-08170`, `maps-j-08171`, `maps-j-08209`. Text-only edge changes: 86.

### g03

Report: `review-a38-step-03-pilot-r4-g03.md`. Prior evidence: [round-3 g03](review-a38-step-03-pilot-r3-g03.md).

- `docs/specs/runner.md` — batch-041; round-3 rework. Outcome ids: `maps-j-08232`, `author-r4-docs-specs-runner-L1729C2`. Text-only edge changes: 129.

### g04

Nothing to re-review: all round-3 files were ok and no disposition, target, anchor or effective diff changed. **No reviewer; no report is requested.** Reserved report name: `review-a38-step-03-pilot-r4-g04.md`.

### g05

Report: `review-a38-step-03-pilot-r4-g05.md`. Prior evidence: [round-3 g05](review-a38-step-03-pilot-r3-g05.md).

- `docs/specs/platform-foundations.md` — batch-040; round-3 rework. Outcome ids: **none** (mandatory rework recheck). Text-only edge changes: 23.
- `docs/specs/decision-citation-drift.md` — batch-040; round-3 rework. Outcome ids: **none** (mandatory rework recheck). Text-only edge changes: 14.
- `docs/specs/distribution.md` — batch-040; round-3 rework. Outcome ids: **none** (mandatory rework recheck). Text-only edge changes: 10.

### g06

Report: `review-a38-step-03-pilot-r4-g06.md`. Prior evidence: [round-3 g06](review-a38-step-03-pilot-r3-g06.md).

- `docs/specs/distillery.md` — batch-040; round-3 rework. Outcome ids: `maps-j-08074`. Text-only edge changes: 2.

## Mechanical replay and handback

Run serially, with the session environment unset:

```sh
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-check.py --author-commit ae141550c2e022310de7a0efea757580c0b2479f
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-check.py --author-commit ae141550c2e022310de7a0efea757580c0b2479f --select
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-probes.py --author-commit ae141550c2e022310de7a0efea757580c0b2479f
```

See `step-03-r4-{check-result,probes-result,sample-result,verification,command-results}.json` and light-test log. The existing resolver and anchor tools are unchanged. No Git index/ref/commit write is needed. Diff applicability uses disposable pinned copies in `/tmp/fgos-work/`.

Lead follows the actual runner commit with separate L12-11 two-manifest accounting and committed-byte checks. No guessed commit id or protected manifest edit here. Parks remain individually scoped; GAP-02 full-content carry and workflow carry/link re-resolution remain prerequisites. Scaling requires clean independent pilot acceptance; Phase 9 remains separately gated.
