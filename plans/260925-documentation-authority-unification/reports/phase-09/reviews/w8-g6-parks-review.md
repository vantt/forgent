# W8 G6 park rows review

**Verdicts: 1,220 APPROVE, 40 REWORK** (of 1,260 park rows). Per-row verdicts: [w8-g6-parks-review.json](w8-g6-parks-review.json).

| Result | Rows | APPROVE | REWORK |
|---|---:|---:|---:|
| park-unconfirmed-preserve-premise | 959 | 944 | 15 |
| park-source-removed-by-cutover | 162 | 137 | 25 |
| park-current-passage-unbound | 137 | 137 | 0 |
| park-source-absent | 2 | 2 | 0 |

Branch HEAD `f2162d9ff`. Source pin `4178dcc6e`. Read-only. No git writes, no fgos CLI, no test suites.

## Method

I wrote my own Python script and did not run proof.py. It starts from the phase-08 record lines, the census, the step-05 move set and git blobs. For every row it:

- finds the record item and checks `itemSha256`, the file and `disposition: preserve`;
- binds the spans at the pin and at HEAD;
- simulates the physical move itself (its 1,039 moves match `proof.json` exactly, at both the pin and HEAD);
- re-derives the operands and their stability;
- applies its own version of the sentence/cell evidence rule and the wrapper rule;
- checks the row's owner and blocker.

Result: all 1,260 recorded results are reproduced at the pin, and every one still holds at HEAD. Between the pin and HEAD only five docs and CHANGELOG changed, and that did not move any park result.

## REWORK class A: operand normalization (15 rows)

**Rows:** f00144, f00417, f00418, f00419, f00429, f03463, f03478, f04208, f04387, f06557, f06569, f06829, f07654, f08000, f08062.

These rows are parked because "no operand is stable". That is false. Each real target exists at the pin and at HEAD, both before and after the move. The rule failed for four reasons:

- **Line locators:** `docs/backlog.md:88` and similar are treated as a separate path that never exists.
- **`@` prefix:** the CLAUDE.md import `@AGENTS.md` is read with the `@` as part of the path.
- **Truncated census path:** `agent-coordination/verification` is recorded where the line actually cites `docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md`.
- **Non-docs path:** `packages/run-supervisor/contracts` can never count as stable, because after-presence is only computed under `docs/`.

**Exact fix:** in proof.py's operand step:

1. Strip a trailing `:<n>[-<n>]` before the reachability check.
2. Strip a leading `@`.
3. When the census path is a substring of a longer path on the bound line, use the full path from the line.
4. For targets outside `docs/`, set after-present to present-at-pin. The move only touches `docs/`.

Then rerun twice and check the outputs are byte-identical. These 15 rows should move to `preserve-operand-reachability-unchanged`, unless sentence evidence applies first. Update the receipt totals afterwards.

## REWORK class B: removed source with no successor (25 rows)

**Rows:** 24 in `docs/specs/reading-map.md` (f08209 … f08288) and f08335 in `docs/specs/workflow.md`.

The removal is real: the move-set id is `retiring-root-or-retired-decision`, with `to: null`. But the blocker reads "Review … in the non-identical successor(s)  and compose…" with an empty list, so the row has no concrete next action.

**Exact fix:** for removed rows that have no move destination, write a blocker that says the source retires with no destination. Then do one of two things, by Lead ruling:

- add them to `retire-with-tree.json`, following the 38 `docs/specs/work-state.md` exclusions;
- or name the holder to recheck: `docs/reading-map.md` for the reading-map entries, `docs/platform/workflow/spec.md` for f08335.

## Semantic sample (62 rows)

The sample was drawn with `random.Random(20261024).sample` from each result stratum, over rows sorted by id: unconfirmed 40, removed 10, unbound 10, absent 2. I read each row's bound lines at the pin. The per-row findings are in the JSON under `sampleFindings`.

- **Unbound, absent and removed (22 rows): all are correct parks.** The 3 reading-map rows in the sample also fall under class B. Unbound rows are line drift plus spans that are short or occur more than once. Only 17 of the 137 could be rebound uniquely from the passage quoted in their own reason, so leaving the rebind until pin F is reasonable.
- **Unconfirmed: 29 of 40 should be confirmed, not parked.** The premise is real, but it sits outside the sentence-scoped rule:
  - upstream coordinates in `docs/distillery/sources|reports`, where the file frontmatter says `type: git-repo` and gives a `url` (f01179, f01117, f01149, f01156, f01086, f01049);
  - dated reports and plans under `archive/plans/**` and `plans/reports/**` (f00202 … f00379, f08517);
  - past-tense fixed/said narratives (f03109, f03257, f04041, f04321, f03999, f07326);
  - an adversarial literal (f08779) and a runtime build output (f03362, mis-normalized to `docs/how-to/target/...`).
- **Unconfirmed: 11 of 40 are correct parks.** These are live product conventions (`docs/history/<feature>/` in skills and code: f08463, f08472, f08489, f00475, f08803) or live navigation. Three of them (f08113, f08071, f06985) should become repoint overturns to the successor the blocker already names.

Note on the sample: being parked is a safe outcome for G6 ("owned park"), so the over-parking is cost for the Lead, not a correctness defect. That is why those rows are APPROVE, not REWORK. The affected populations are 150 in distillery and 184 in archive/plans plus plans/reports. File- or frontmatter-anchored evidence kinds for them are a possible addition and need the owner to choose them. They are not part of this rework.

## Scope note

`f07526` is an unconfirmed park that carries a `repoint-proposal` with a present successor. It is APPROVE as an owned prepared repoint, even though its blocker text does not repeat the row id.
