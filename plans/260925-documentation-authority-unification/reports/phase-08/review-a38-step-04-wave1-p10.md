# Review a38 — Step 4 wave 1, part 10 (set step04-009)

Pin: ef62747dd. Payload: step-04-wave1-p10.json. Reviewer read only; no scripts run.

## core/instructions/platform-laws.md

- Set: step04-009. Stratum: mandatory (root source/projection boundary). Source owner: core/instructions registry source, projected into the AGENTS.md managed block (lines 317-396, source header witness at AGENTS.md:337).
- Verdict: **ok**
- Slots reviewed: 24 of 24. These are 12 source slots (instructions-039..050, source lines 15, 17-26, 28) and 12 render-join slots (instructions-025..036, AGENTS.md lines 341, 343-352, 354).
- Source read whole (28 lines, 1888 bytes), plus AGENTS.md 337-354 at the pin.

### Checks

- Disposition and timing: all 24 slots are patch with timing Phase 9. This is right because the source cites `docs/platform-foundations.md`, and the legacy file is retired under the Step 4 patch scope.
- Source slots, target: docs/platform/platform-foundations.md exists at the pin. It holds the full law body (`## Luật nền platform forgent (Phase 0 — compound-learning stack)` at line 86, `### L1`..`### L10` at lines 113, 137, 165, 195, 222, 239, 267, 285, 309, 339).
- Source slots, anchors: each one names its own law heading.
  - Lines 15 and 28 (generic law ownership) use the law-body heading.
  - Lines 17-26 map L1..L10 one-to-one.
  - The anchors follow the extractor form with single hyphens, e.g. `l5-definition-of-done-sáu-câu-hỏi`. This is the same form existing live citations use (docs/platform/README.md:90, runner/README.md:68, ui-spec/README.md:60).
  - They are plain backticked `path#anchor` citations, so the L12-26 rule 7 extractor-anchor form is the correct one, not the GitHub slug.
- Diff: one hunk, `@@ -12,17 +12,17 @@`, covering source lines 12-28.
  - It touches only lines 15, 17-26 and 28; every other line in the hunk is context.
  - Backticks and the `**Lx — title**` labels are kept.
  - The destination label form is unchanged, and the path is repo-root, as in the original.
  - Applied verbatim, it renders correctly. The frontmatter and the rest of the source are untouched.
- Render joins (instructions-025..036): the render-block text at AGENTS.md matches the source passages exactly. The spans are exact-line-correspondence (old 339 → 341, etc.).
  - They are recorded as joins on the canonical source (target null, anchor null, reason points to the owning source).
  - This matches L12-58: render and managed-block paths carry no diff of their own.
  - No render diff was carried, and no generation or parity claim was made.
- Missed references: git grep at the pin shows only AGENTS.md and the source contain the passage. There are no other projections (plugins/** and .agents/** do not carry it). No other `docs/platform-foundations.md` citations exist in the file.
- Behavior: the only code references are classifier path lists and tests (scripts/generate-shipped-path-inventory.mjs:175,815; test/scripts/generate-shipped-path-inventory.test.mjs). They use the file path, not its content, so the patch changes no behavior.

### Outcome defects

None.

### Record-text notes (not rework)

- All 12 render-join slots carry disposition "patch" with null target and anchor. This is valid under the join rule but reads oddly beside the 12 source slots that have a real target. The reason text explains it.

### Lead-judgment questions

- core/instructions/platform-laws.md is classified "mixed-repository-local-and-consumer" by the shipped-path inventory (it ships to consumer projects). Its law links point at `docs/platform/...`, a repo-local path, just as the original `docs/platform-foundations.md` was. The record preserves that existing semantics. Whether consumer-facing instruction text should cite repo-local doc paths at all is a separate product question, not a Step 4 defect.

## Counts

- step04-009 / mandatory stratum, this part: 1 file reviewed, 0 rework, 24 slots reviewed.
- Patched-file sample: not applicable to this part. Part 09 covers the rest of the set.

Status: DONE
Summary: The single file platform-laws.md is ok. All 24 slots (12 source patches, 12 render joins) checked; the targets and anchors resolve, the diff applies cleanly, and there are no missed references or behavior changes.
