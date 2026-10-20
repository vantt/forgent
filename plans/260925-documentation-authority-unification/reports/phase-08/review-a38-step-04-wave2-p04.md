# Review a38: Step 4 wave 2, part 04 (set step04-002)

Pin dc24ce645 (author input). Payload: step-04-wave2-p04.json. All six files were read whole through EOF from the payload source context. Target and existence checks were run against the dc24ce645 blobs. No checker, probe or script from the repo was run. Nothing was written to the worktree.

Slots: 40 joined slots (22 + 3 + 4 + 10 + 1 + 0). Every slot was reviewed: 14 source slots and 26 render-join slots.

## Per file

| File | Slots | Verdict |
| --- | ---: | --- |
| domains/coding/skills/fgos-coding-shaping/SKILL.md | 22 (7 source: 6 preserve, 1 patch; 15 render-join) | ok |
| domains/coding/skills/fgos-coding-validating/SKILL.md | 3 (1 source preserve, 2 render-join) | ok |
| domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md | 4 (1 source preserve, 3 render-join) | ok |
| domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md | 10 (3 source preserve, 7 render-join) | ok |
| domains/coding/task-specs/lock-decisions.md | 1 (preserve) | ok |
| domains/coding/task-specs/shape-plan.md | 0 (zero-edge control) | ok |

### fgos-coding-shaping/SKILL.md (ok)

- **Preserve slots** (skills-109, 110, 111, 113, 114, 115): source lines 7, 21, 37, 88, 167 and 227. These are the `docs/history/<feature>/DISCUSSION.md` and `CONTEXT.md` conventions and the `#task-<slug>` refs example. They are correctly preserved under L12-10, and the history tree is retained.
- **Patch slot** (skills-112): source line 73, `docs/specs/runner.md` to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`.
  - The target exists at the pin.
  - The target's provenance header names `docs/specs/runner.md` as its source.
  - It has exactly one `## Business Rules` heading (line 25), so the anchor resolves.
  - Line 78 of the target (RUL45) carries the trust-boundary paragraph: a report's name and description are "KHÔNG ĐÁNG TIN" (untrusted), and the text is never itself a shell command. This is the only untrusted-input rule in `docs/specs/runner.md`, so it is the right holder.
  - The hunk `@@ -70,7 +70,7 @@` is correct: context lines 70-72, change at 73.
  - The replacement keeps the backtick form and the `'s untrusted-input rule` wording.
  - The relative form (repo-root path) is unchanged from the original, so it resolves.
  - It is a skill-prose change only, so it cannot change behavior.
- **Render joins** (skills-035..041, 057, 168..174): all carry label `render-join`, target null and anchor null.
  - sourceDisposition is correct on each: preserve for all, patch for skills-038 and skills-171, timing Phase 9.
  - The line offsets are right: the render header sits at line 16 of .agents and plugins, so source line N maps to N+1 for N > 15.
  - .agents and plugins each hold 7 hits and 7 slots. .claude is a description wrapper with 1 hit (line 7) and 1 slot.
  - No render path carries a diff.
- **Step 5 exclusions:** class4-l-000074 and class4-l-002076 (line 228, the fenced `fgos edit --refs` example). L12-60(1) is applied correctly.
- No missed doc-tree reference. The other path-like tokens (`../_shared/...`, `plugins/fgOS/skills/submit/SKILL.md`) are not in the docs/specs or docs/architect trees, and all exist at the pin.

### fgos-coding-validating/SKILL.md (ok)

- One source preserve slot at line 15, `docs/history/<feature>/plan.md`, with edgeId null. This is an author-added supplemental slot keyed by exact tuple (L12-60(7)). It is a correct L12-10 preserve.
- Render joins at .agents line 16 and plugins line 16 are correct. The .claude wrapper has no docs hits and no slot, which is correct.
- history-011, history-025 and history-040 are listed as Step 5 exclusions for the same occurrences that now carry slots (see record-text note 1). The outcome is preserve either way.
- The remaining references (`references/*.md`, `../_shared/*`) resolve. The long lines 97, 98 and 165 contain no docs-tree paths.

### references/bootstrap-and-reality-gate.md (ok)

- Source slot skills-116 at line 7 (`docs/history/<feature>/`) is preserve, which is correct.
- Render joins at line 8 in .agents, .claude and plugins are correct (header at line 1).
- Line 44 cites `CLAUDE.md`'s impact-analysis capability gate. This is a bare root file and not a docs-tree edge, so it is not slotted. See Lead question 1.

### references/gate-auto-approve-mechanics.md (ok)

- Source preserve slots, all with edgeId null (supplemental):
  - Line 14: `docs/history/<feature>/plan.md`, inside the fenced `fgos gate-check` command.
  - Line 65, twice: `docs/history/gate-bypass/CONTEXT.md`, and the same path followed by `>`.
- `docs/history/gate-bypass/{CONTEXT,DISCUSSION,plan}.md` exist at the pin, so these are retained history pointers (L12-60(6)).
- All 7 render joins (.claude skills-059..061; .agents class4-l-000078/079; plugins class4-l-002080/081) are correct. Offsets are N+1 because the header is at line 1.
- The line-65 spans keep the census's trailing `>` and `)` characters. This is a span convention only.

### lock-decisions.md (ok)

- skills-117 at line 10 (`docs/history/<feature>/CONTEXT.md`) is preserve, which is correct under L12-10. There is no diff.

### shape-plan.md (ok)

- Zero slots. Line 12, `docs/history/<feature>/plan.md`, is recorded as history-029 in stepFiveExcluded (L12-10: preserve convention, Step 5 confirms reader/writer parity). Preserve is the correct outcome.

## Outcome defects

None. Dispositions, targets, anchors, diff and timing are correct on all 40 slots. L12-10 conventions are preserved literally and no external topology is converted.

## Record-text notes (not rework)

1. **Overlapping coverage.** Several occurrences are both a preserved slot and a Step 5 exclusion. Examples are validating SKILL.md line 15 (history-025 and the supplemental slot) and gate-auto-approve lines 14 and 65. shape-plan line 12 is excluded only, with no slot, while lock-decisions line 10 is a slot. All outcomes are preserve, so there is no consequence.
2. **Description wording.** shape-plan `zeroEdgeCoverage` says "all census occurrences are Step 5 code/message examples". Line 12 is a task-spec Output heading (a convention path). The stepFiveExcluded reason ("convention/control census", L12-10) describes it correctly, but the zeroEdgeCoverage text does not.
3. **Fenced-line rationale.** The `gate-auto-approve-mechanics.md` source line 14 slot reason cites L12-10 and L12-60(6) while the Step 5 entries cite L12-60(1) (fenced). Both are consistent with preserve.
4. **Span convention.** sourceSpans columnStart is 1-based (columnEndExclusive likewise). A zero-based slice of the source line shifts by one character. This is uniform across the payload, so it is a convention and not a defect.
5. **Anchor granularity.** skills-112 anchors to the file-level `#business-rules` heading. RUL45 is a bullet with no heading of its own, so there is no finer anchor.

## Lead-judgment questions

1. `bootstrap-and-reality-gate.md` line 44 says "`CLAUDE.md`'s impact-analysis capability gate". In this repo that gate lives in `AGENTS.md`, and `CLAUDE.md` only imports it. This is a bare root-file name, so it is not an edge under L12-60(8). The domain skill is also portable to external projects whose `CLAUDE.md` holds the gate. I left it unslotted. Do you want a Step 5 or Phase 9 note for it?
2. The skills-112 patch retargets to RUL45 (discovered-work report text is untrusted). The skill's sentence generalizes this to "any item's title/description". The original also cited `runner.md` for this, and RUL45 is the only untrusted-input rule in it, so I judged it a path-only retarget. If you want strict description truth under L12-32(3), the alternative is a park with "description needs rewrite".

## Counts

| Set | Stratum | Files reviewed | Files with outcome rework |
| --- | --- | ---: | ---: |
| step04-002 | wave 2 part 04 (all mandatory) | 6 | 0 |
