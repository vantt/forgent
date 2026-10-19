# Review a38 — Step 3 wave 2 expansion, Part 07

Reviewer: independent read-only semantic reviewer. Pin `ae141550c2e022310de7a0efea757580c0b2479f` (worktree detached at feeeeee92). No checker or probe was run; step-03-resolve.py was not needed. Nothing was written to the worktree.

## Method and bindings

- Record: `step-03-records/batch-041.jsonl`, line whose `file` is `docs/specs/work-state.md`. It is a full per-edge record (not `retiresWithTree`), which is correct: work-state.md is a named L12-34(2) exception (RUL10 carry under L12-17).
- Record line sha256 `de29f1ec…d894` (67,958 bytes incl. newline), diff sha256 `83a172d2…1ec3fde0`, source digest `499ec683…970eb3a8`. All three equal the values in step-03-wave2-expansion-review-index.json.
- Source: `git show <pin>:docs/specs/work-state.md` (327,843 bytes, 2,352 lines). File is over 60 KB, so I read the full heading outline (all 100+ headings), then every edge region (the physical source line plus context for all 39 edges), and ran independent whole-file greps for path-like tokens (`docs/`, `.md`, `plans/`, markdown links, bare sibling names, `specs/`, `work-state`, `runner.md`, etc.) to look for missed references. I did not read every non-edge line of the file; prose between edge regions was covered only by the greps.
- Fields extracted by Python (edgeId, spans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency categories, per-group searchWitness category and counts, unitDispositionReason, targetFacts); the diff printed and compared separately.
- Independent checks done: every span text equals the source substring (1-based columns, 39/39); the diff's removed line equals source L1362, the added line equals it with only the path replaced, context lines equal L1359-1361 and L1363-1365; the 36 inventory edges are all present and 3 author-added edges (L1642, L1891, L1894) exist; target/holder existence at the pin.

## Verdict

| File | Set | Stratum | Verdict | Edges reviewed |
|---|---|---|---|---:|
| `docs/specs/work-state.md` | batch-041 | Part-A-outcome-change | **ok** | 39 (36 census + 3 author-added) |

Edge mix: 33 preserve, 5 parked (08349 dead-link; 08353/08354 step5-parity; 08367/08368 description-rewrite), 1 patch (08355), 0 row-flip.

### Outcome defects (rework)

None. Highlights of what was verified:

- **08355 (patch, Phase 9)**: L1362 "(per `docs/specs/decision-citation-drift.md`)" -> `docs/platform/decision-citation-drift/spec.md`. Target exists at the pin. Adjacent description is true for the holder: its Entry Points/Scan-scope rows say manual invocation only, no CI trigger, scope `docs/backlog.md` + `docs/specs/*.md`. Whole-file anchor is right for a locator-free pointer. Diff is exactly one line.
- **08353/08354 (park)**: same list item (L1362); the globs `docs/specs/*.md` and `docs/specs/` describe scan scope that moves with the real reader/default (Step 5). Mixed unit is justified by per-edge `unitDispositionReason`.
- **08349 (park, dead link)**: `docs/history/install-coexistence/reports/canary-run.md` has no history in git at the pin and no `docs/history/install-coexistence/` exists. Park is right (live Open Gaps navigation). Mixed unit with 08348 (retained root doc) is justified.
- **08351 (preserve, never-existing dir)**: `docs/history/store-atomic-rmw/` sits under the explicit "**Đã đóng:**" marker; L12-31(8) already settled "08351 preserve stands on passage role".
- **08367/08368 (Part A change preserve -> park)**: the legacy path `docs/reference/triage-table-columns.md` is absent at the pin; the registry maps it to `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`, whose status table and enumeration list all ten statuses. A bare patch would leave the false adjacent "7 old statuses vs 10" claim, so park as description-rewrite follows L12-32(3)/L12-37(2). Holder facts confirmed. See Lead question 1.
- **08358**: successor note `docs/platform/work-state/decisions/retired-decision-history.md` exists and holds `## 8. ADR 0012 …`; absence of `docs/specs/0012-…md` confirmed.
- Self-reference preserves (08360-08362, 08364 and author-added L1642/L1891/L1894) name `docs/platform/work-state/spec.md` as non-executable successor; no self-path note on an edge naming the same path.
- All `docs/history/**` preserves (08343, 08347, 08365, 08369-08371, 08374, 08340) exist at the pin; multi-line spans 08343 (L692-693) and 08369 (L2115-2116) join to existing files.

### Missed references

None that change an outcome. Non-edge path tokens checked and found out of scope or of no outcome: `AGENTS.md`, `docs/enduser-docs-index.json` (L36, L1098, generated manifest), bare `work-item-lifecycle-vision.md` (L448), `id-systems-audit.md`, `work-item-management.md:117`, `beads.md:36` (resolve to retained root/distillery docs, none exist under docs/specs/), `critical-patterns.md` (no file), `plans/reports/research-…md`, bare `DISCUSSION.md`/`CONTEXT.md`/`plan.md` (history feature dirs, retained). No relative links other than L1371. No `specs/<name>.md` partial-root forms.

## Record-text notes (not rework)

- 08343 (L692, "xem `…`" in a live Behaviors paragraph) and 08347 (L1320, live Open Gaps citation) carry the label "dated completed-action evidence", but neither passage has a dated past-action marker; they are retained-path navigation. Disposition (preserve) is unaffected because the targets exist and survive.
- 08353/08354 use category `step5-parity`; both passages also name a retiring tree as an object in live text (L12-37(4) would call that description-rewrite). Both are parks either way, so Phase 9 outcome is the same; the category could be tightened.
- 08349 `dependency` repeats the long blockedReason string; harmless.

## Lead-judgment questions

1. **08367/08368 inside the retired-decision region.** Both passages sit in ADR 0027 (audit table row L2069 and Hệ quả L2107), under the "relocated verbatim" framing at L1366, a region where 20+ other edges were preserved as history (L12-31(5)), including the absent-path 0012 link (08358). The author parked these two because the legacy path is a registry alias (L12-37(2): renamed-alias preserve fails outside declared carriage/history files, "even in quotations"). Reading A (as authored): the region is not a history file, so park/patch applies. Reading B: the region is verbatim history; the "7 vs 10 status, today" claim is point-in-time and a Phase 9 "reconcile the description" park would rewrite history, so preserve with the registry successor note is correct. I verified the factual basis of the park (holder lists ten statuses) and the checker passes; I did not mark rework because the record follows the literal L12-37 wording. Please rule which reading binds regions inside non-history files.
2. **`docs/coexistence.md` retention.** Five live-text preserves (08339 L15, 08345 L862, 08346 L1222, 08348 L1324, 08352 L1360) treat `docs/coexistence.md` as retained navigation, as the accepted reading-map records do. `docs/platform/coexistence/spec.md` is the candidate area spec for the same doctrine (provenance: `docs/coexistence.md`). If Phase 9 flips or retires the root doc, these become patches. No evidence either way in plan/phase-09 text; consistent with accepted precedent, so not marked rework.
3. **L1233 "`docs/<quadrant>/`" (not an edge).** Live RUL52 text says end-user docs are placed under `docs/<quadrant>/`; the knowledge registry now places them under `docs/knowledge/<slug>/`. Census has no edge for this placeholder (unlike `docs/history/<feature>/`, 08340). Outcome-neutral for Step 3 (a placeholder would preserve), but a candidate for the Phase 9 semantic-remnant search.

## Counts

| Set / stratum | Reviewed files | Rework |
|---|---:|---:|
| batch-041 (set) | 1 | 0 |
| Part-A-outcome-change (stratum) | 1 | 0 |
| This part overall | 1 | 0 |

Edges: 39 reviewed, 0 outcome defects.

Status: DONE
Summary: `docs/specs/work-state.md` (39 edges, record/diff hashes match the index) is ok with 0 outcome defects; 3 record-text notes and 3 Lead questions (the main one: whether the 08367/08368 alias parks inside the verbatim retired-decision region should instead preserve as history).
