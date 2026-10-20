# Wave 3 review: parts 12, 13, 14 (set step04-017, one whole-file verdict)

File: `CHANGELOG.md` (category A), set step04-017. Pin dc24ce645. Source read through EOF across the three payloads: p12 lines 1-559, p13 lines 560-1285, p14 lines 1286-2057. I also checked the full pinned blob (2057 lines). Structure: `[Unreleased]` 8-331, release entries rc.5..rc.1 332-801, `[v0.1.0] - 2026-09-18` 802-2046, `[0.1.0]` stub 2047.

Verdict: **ok** (0 outcome defects).

## Slots reviewed (4 of 4; p12 and p13 carry none, all four are in p14)
All four are `preserve`, no diff, `target`/`anchor` null, timing none. All four sit inside the dated `[v0.1.0] - 2026-09-18` history region (line 802), which the records name as `historyRegion`.

| slot | line:cols (1-based) | reference | existence at pin | outcome |
|---|---|---|---|---|
| evidence-001 | 1040:4-51 | `docs/architect/agent-coordination/verification/` (the full cited path is `.../code-implementation-track-policy/p05.md`) | tree: 868 files, `p05.md` exists | preserve ok. This is a dated evidence citation (A51, L12-26/38/40/46). The witness is tree plus history (350 commits). |
| author-added (L12-62 sweep) | 1343-1344 | `docs/decisions/` + `index.md`, wrapped across the line break | exists (generated index, 22 history commits) | preserve ok. A comment pointer to the generated index preserves (ruling 4/5). Span text matches the source. |
| author-added | 1433-1434 | `docs/history/agy-permission-capability-allowlist/` + `RESEARCH.md` | exists | preserve ok. Design-origin provenance ("live-proven ... Round 4"), L12-47. |
| author-added | 1879-1880 | `docs/how-to/recover-approve-sync-root-from-inside-a-` + `worktree-with-trust-dir.md` | absent at pin | preserve ok (see Lead question 1). The reason says "absent at author pin; historical path only", which is true. |

Span columns match the pinned text for all four. Joined logical references are correct. `stepFiveExcluded` is empty, which is right: this file has no runtime strings.

## Whole-file checks
- Wrapped-path scan of the whole file (docs, plans, core, domains, src, archive, plugins and `.agents` prefixes, path ending a line with no extension). It finds exactly the three wrapped slots above, plus line 1330 `<docs/quadrant-dir>`. That one is a placeholder, not a path, and sits in v0.1.0 history. No missed wrapped path.
- Unslotted path mentions: about 90 across `[Unreleased]` and v0.1.0. Step 2 never produced census edges for them (the only Step 2 edge for this file is evidence-001). Every one is a past-tense release-note description of a change, not a navigation pointer.
- Dead paths in `[Unreleased]` (lines 8-801): moved or retired things such as `plans/2609*/...` (moved to archive, out of scope per L12-62 ruling 9), removed `src/...` modules, `.agents/hooks.json` (a generated file, deliberately not shipped), and a legacy flow-definition copy. All are dated history (L12-60 ruling 2), so preserving is correct and no live "see X" pointer is left dangling.
- No diff, so there is no replacement-rendering or anchor risk, and no behavior change.

## Per-set / stratum counts
set step04-017, stratum prose/release-notes: files reviewed 1, rework 0; slots reviewed 4, rework 0 (p12: 0 slots, p13: 0 slots, p14: 4 slots).

## Record-text notes (not rework)
- The slot reason for the 1879 slot does not name the same-basename moved copy at `docs/knowledge/how-to-recover-fgos-approve-fgos-sync-root-from-inside-a-wor/recover-approve-sync-root-from-inside-a-worktree-with-trust-dir.md`. The reason is true as written, but a successor note would help a Phase 9 literal-remnant search.
- `evidence-001` `originalLine` is 928 (Step 2 commit) against 1040 at the pin. This is expected drift from the merge.

## Lead-judgment questions
1. The 1879 pointer ("See `docs/how-to/recover-...-trust-dir.md`'s new `promote-to-component` section") has a same-basename moved-verbatim holder under `docs/knowledge/`. L12-62 ruling 1 makes that a patch for live files. I judged preserve correct, because it is a dated v0.1.0 release-note entry (L12-60 ruling 2, history class) and ruling 1's named cases are live skills. Please confirm that the dated-history rule overrides ruling 1 for CHANGELOG release entries.
2. Treating the whole CHANGELOG as history means the roughly 90 unslotted mentions above, including `docs/specs/reading-map.md` at line 533 and `docs/platform/component-boundary.md` at line 532 in `[Unreleased]`, rely on the Phase 9 literal remnant search. The scope is already census-driven and consistent with the other records, so I raise it only so the choice is explicit.

Status: DONE
Summary: CHANGELOG.md (p12-p14, one whole-file verdict) is ok. All 4 preserve slots are correct, there is no diff and no missed wrapped path, and the two judgment questions above are for the Lead.
