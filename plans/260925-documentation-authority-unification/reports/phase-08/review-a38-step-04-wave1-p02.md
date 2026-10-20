# Review a38 — Step 4 wave 1, part 02 (set step04-002)

Pin: author input `ef62747ddb0952d3cf1a3558f5ea650e77fcbe7e`. Payload `step-04-wave1-p02.json`. 4 files, 31 slots. Each source was read whole from the payload source context, which equals the pinned blob (digests match the record).

Checks done on every slot:
- The source span text matches the pinned render/source line. Columns are 1-based, with an exclusive end, applied uniformly. All 31 spans match.
- Dispositions were checked against L12-7/10/30/32/58.
- Patch target, anchor, diff hunk and replacement were checked.
- Each render's header or wrapper status and slot coverage were checked in all three render trees (.claude, .agents, plugins/fgOS).

## Per-file verdicts

### 1. domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md
- Set step04-002, stratum: mandatory (L12-10 control). Verdict: **ok**. 2 slots reviewed (skills-055, skills-056), 0 rework.
- Both are render-only joins on `.claude/skills/.../verify-sync-and-gap.md`, source lines 64 and 68 (render 65/69), `docs/history/<feature>/plan.md`. Disposition is preserve with a render-join reason.
- This is the L12-10 portable plan.md convention (an external project's layout via `fgos edit --footprint`). Preserving is right and no diff is carried.
- The `.claude` copy is a full generated copy with a header (line 1) matching the source digest. The `.agents`/plugins occurrences (history-009/010, history-041..) and the source's own lines 64/68 belong to the history census and the L12-10 control set (part p20). They are correctly not slots here.
- No missed legacy-root reference. Source lines 16 and 49-50 cite `docs/how-to/...`; see note N2.

### 2. domains/coding/skills/fgos-coding-shaping/SKILL.md
- Set step04-002, stratum: patched (sample 1/1). Verdict: **ok**. 22 slots reviewed, 0 rework.
- Source slots skills-109..115 cover every occurrence in the source:
  - 7 `docs/history/<feature>/DISCUSSION.md`: preserve (L12-10).
  - 21 `docs/history/<feature>/DISCUSSION.md`: preserve (L12-10).
  - 37 `docs/history/<feature>/CONTEXT.md`: preserve (L12-10).
  - 73 `docs/specs/runner.md`: **patch**.
  - 88 `docs/history/<feature>/DISCUSSION.md`: preserve (L12-10).
  - 167 `docs/history/<feature>/DISCUSSION.md`: preserve (L12-10).
  - 227 `docs/history/<feature>/DISCUSSION.md#task-<slug>`: preserve (L12-10).
  - I found no other legacy-root or history reference in the file (the `plugins/fgOS/skills/submit/SKILL.md` link at line 139 is not a legacy root).
- Render joins:
  - `.agents` skills-035..041 and plugins skills-168..174 cover the 7 occurrences each, at render lines +1 for the header line 16.
  - `.claude` skills-057 covers line 7 only. That file is the generated thin wrapper (tsk-1qi) whose body carries only the frontmatter description. No other occurrence exists there.
  - Patch joins skills-038/171 are render-only: no target, anchor or diff, which is correct.
- The patch (skills-112, source L73; diff hunk `@@ -70,7 +70,7 @@`, one line changed):
  - Target: `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. It exists at the pin and is the candidate file "Runner Business Rules".
  - Anchor: `business-rules`. It resolves to `## Business Rules` (line 25), which encloses the RUL45 bullet at line 78.
  - RUL45 is the established untrusted-input rule. Its "Ranh giới tin cậy" paragraph says the text is untrusted and the `verify` field can never become a shell command. `docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md:42` cites it as "untrusted input, RUL45". The old `runner.md` L1012 holds the same RUL45.
  - Replacement: `` `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`'s untrusted-input rule ``. Backtick and `'s` form are kept, the repo-root path form matches the source, and the adjacent description stays true. The line renders correctly when applied verbatim.
  - Timing is Phase 9. The patch is a specification only; nothing is applied now.
  - A narrower holder than the area README is correct (L12-30(7), L12-32(2)).

### 3. domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md
- Set step04-002, stratum: unpatched sample. Verdict: **ok**. 4 slots reviewed (skills-116 source line 7; skills-042 .agents, skills-058 .claude, skills-175 plugins, each render line 8), 0 rework.
- All are `docs/history/<feature>/` in "Read the item's `docsRef` to find ...". Preserve under L12-10 is correct. All three renders carry the generated header (line 1), so the join is right.
- Coverage is complete. Line 44 mentions `CLAUDE.md` as a capability gate, which is not a legacy path.

### 4. domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md
- Set step04-002, stratum: mandatory (L12-10 control). Verdict: **ok**. 3 slots reviewed (skills-059, skills-060, skills-061), 0 rework.
- skills-059 (render line 15) is `docs/history/<feature>/plan.md` in a `fgos gate-check --plan` example. Preserve is correct (L12-10).
- skills-060/061 (render line 66) are two `docs/history/gate-bypass/CONTEXT.md` occurrences. The file exists at the pin and `docs/history/` is retained, so preserve is correct. One is a "see ..." pointer and one is an example `touches:` value.
- The record has only `.claude` render slots. See note N1 for the missing source/.agents/plugins occurrences.

## Outcome defects
None. No wrong disposition, target, anchor or diff. No false adjacent description. No behavior change (skill prose only, one citation string). No relative-path problem.

## Record-text notes (not rework)
- **N1 (coverage consistency, outcome-neutral).** `gate-auto-approve-mechanics.md` source line 65 holds two `docs/history/gate-bypass/CONTEXT.md` occurrences. The same two occurrences exist at render line 66 in the `.agents` and plugins copies.
  - Only the `.claude` copy has slots (skills-060/061). The domains source, `.agents` and plugins copies have no slot, and neither does the history census.
  - The census patterns match only `plan.md` forms; `docs/history/gate-bypass/CONTEXT.md` is not in the `planning` pattern.
  - The disposition would be preserve either way (the target is retained history, not a legacy root), so the diff is unaffected.
  - The record's coverage claim "every frozen batch slot" is literally true.
  - Under L12-31(6) a missed legacy-root reference becomes an `authorAddedEdge`. This path is not a legacy root, so I treat it as a note.
- **N2.** `docs/how-to/write-verify-for-a-skill-prose-change.md` and `docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md` appear in `verify-sync-and-gap.md`, source lines 16-17 and 49-50.
  - The doc-registry maps them to `docs/knowledge/...` (renamed aliases). They are outside this census's legacy patterns, so they are not Step 4 slots.
  - They are likely a Step 3 or separate docs/how-to alias concern, not a defect here. Lead may confirm that some record owns them.
- **N3.** For the render slots of `fgos-coding-shaping` (skills-036/037/039/040/041, skills-057, skills-168..174 and similar), the appended "Source disposition: preserve ... Exact passage: '  keeping one coherent docs/history/<feature>/DISCUSSION.md per feature'" quotes the passage of skills-109 (line 7) instead of that slot's own passage.
  - The "Exact render passage" part earlier in the same reason is correct, so this is cosmetic.
- **N4.** `.claude/skills/fgos-coding-shaping/SKILL.md` has `headerWitnesses: []`. It is a thin wrapper whose body says "generated thin wrapper (tsk-1qi)", not an assembled copy with the header comment, and its digest differs from the other renders.
  - The record labels it `generationDoor: npm run build:skills`.
  - The join to the source is semantically right: the description line is copied from the source frontmatter.
  - The record gives no wrapper-specific provenance note, so the door label for this file is unverified (see Q1).

## Lead-judgment questions
- **Q1.** Which generator produces the `.claude/skills/*/SKILL.md` thin wrappers: `build:skills` or the separate wrapper generator named in tsk-1qi? The Step 4 provenance records `build:skills` with no header witness. This affects provenance wording only, not the outcome.
- **Q2.** Should N1's missing `gate-bypass/CONTEXT.md` occurrences be added as `authorAddedEdge` rows (preserve) for consistency with the `.claude` copy, or left out as non-legacy history references?

## Counts
- step04-002 patched stratum: 1 file reviewed, 0 rework.
- step04-002 mandatory stratum (files 1 and 4): 2 files reviewed, 0 rework.
- step04-002 unpatched stratum (file 3): 1 file reviewed, 0 rework.
- Part total: 4 reviewed, 0 rework. Slots reviewed 31/31: 28 preserve, 3 patch (one source patch plus two render joins of it), 0 parked.

Status: DONE
