# interpret-request (real, asgn_coordinator_driver_op_019)

## Dispatched objective (verbatim)

Interpret the person's intent: validate whether continuing to reactively patch /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's universal heuristic (vs. proactively generalizing it) is the right strategy going forward. Use absolute paths for everything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Reactive patching is not the real problem and proactive generalization is not the fix. The classifier's stated invariant is inverted in its implementation: block-classify.ts:9-16 and spec R25 both claim pan is the default when uncertain, but looksStructured() returns false for anything unrecognized (:175) and :201 maps false->wrap. There is no uncertainty band, so the unrecoverable direction (structured content wrongly wrapped) is what every unrecognized shape gets for free -- which is why the patch stream is one-directional (0.1.18 rules/menus, 0.1.19 Q&A summary). R25 cannot be implemented literally without defeating PBI-060's driver, so the spec is what needs correcting, not the code. Recommend: (1) fix spec R25 + file header to state actual behavior; (2) build the fixture corpus the spec's own Open Gap already asks for, with the rule that every reported miss lands as a fixture before a regex -- this makes reactive patching cheap and permanent; (3) name the two tiers already present in the file (universal shape signals vs. Claude-Code glyph signals, which decay on Claude Code releases and have no test guarding them); (4) do not proactively generalize until the corpus exists, per the repo's own PBI-057 precedent. The locked user decision on wrap policy (PBI-060 #6: fully automatic, no control) was not challenged.",
  "verdict": "continue-reactive-but-change-what-a-patch-leaves-behind",
  "primary_finding": "Stated invariant inverted in implementation: wrap, not pan, is the no-evidence default; spec R25 asserts a safety property the code does not have and cannot have as written.",
  "recommendations": [
    {
      "priority": 1,
      "action": "Correct spec R25 (docs/specs/terminal-detail.md:246-248) and file header (block-classify.ts:9-16) to state that unrecognized shapes wrap and pan requires positive evidence.",
      "cost": "minutes"
    },
    {
      "priority": 2,
      "action": "Build the golden fixture corpus named in terminal-detail.md:298-303; require every reported miss to land as a fixture before a regex.",
      "cost": "small, uses existing vitest"
    },
    {
      "priority": 3,
      "action": "Mark the universal-shape vs. Claude-Code-chrome tier boundary in-file via comments/grouping; no new module.",
      "cost": "minutes"
    },
    {
      "priority": 4,
      "action": "Do not proactively generalize the universal heuristic until the corpus can show which signal buys coverage (repo precedent PBI-057).",
      "cost": "none"
    }
  ],
  "known_one_sided_misses": [
    "GUTTER_MIN_LINES=4 (:35) -- 2-3 row space-aligned tables never trip the gutter signal",
    "width=Math.min(row lengths) (:113) -- one short row collapses the column-search window",
    "pipe tables require the first content line to hold pipes (:152)",
    "countSummaryPairs (:92-98) requires strict adjacency; a two-line question breaks the pair"
  ],
  "user_decisions_respected": [
    "PBI-060 #6: wrap policy is fully automatic, no control, pan when hesitant -- not challenged",
    "Thresholds (GUTTER_MIN_LINES etc.) surfaced as corpus-settleable, not silently re-tuned"
  ],
  "files_read": [
    "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
    "/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md",
    "/home/vantt/projects/herdr-gateway/docs/specs/reading-map.md",
    "/home/vantt/projects/herdr-gateway/docs/backlog.md"
  ],
  "limits": [
    "Bash unusable this session (EROFS on scratch dir): no git log, grep, or directory listing",
    "No subagents dispatched, per session constraint",
    "0.1.18-0.1.20 commit titles taken from session git context; bodies and diffs unread",
    "docs/backlog.md lines 42-70 unread (25k token page cap)"
  ],
  "open_questions": [
    "Were 0.1.18/0.1.19 user-reported or found in self-testing?",
    "Does a classifier fixture harness already exist in web/test/ (could not list the directory)?",
    "Is any non-Claude-Code agent (codex, agy) in real daily use? If so tier-2 is a coverage hole today, not just a decay risk.",
    "Backlog lines 42-70 may already contain a PBI covering this classifier."
  ],
  "code_modified": false
}
```

## Real agent-report.md (verbatim)

# Advisory: reactive patching vs. proactive generalization of `block-classify.ts`

Role: lead-advisor. Date: 2026-09-07.
Subject: `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`

## Verdict

**Neither framing is the right one.** Keep discovering signals reactively — that
matches the repo's own evidence-first norm — but change what a patch *costs* and
what it *leaves behind*. Do **not** proactively generalize the universal
heuristic: without a corpus that is a larger guess with a wider blast radius,
and it risks regressing cases already paid for in three releases.

The real problem is not the patch cadence. It is that the code cannot fail in
the safe direction, and both the file header and the spec claim it can.

## Finding 1 — the stated invariant is inverted in the implementation

`block-classify.ts:9-16` argues:

> structured wrongly wrapped -> alignment lost, unreadable, unrecoverable
> prose wrongly panned       -> exactly the behaviour that shipped before
> So `pan` is the default and `wrap` is the path that has to prove itself.

The code does the reverse. `looksStructured()` returns `false` for any shape it
does not positively recognize (`:175`), and `:201` maps `false -> "wrap"`.
There is no third state, no uncertainty band. So:

- `pan` requires positive proof.
- `wrap` — the unrecoverable direction — is what an unrecognized block gets for free.

Spec R25 (`/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md:246-248`)
states the safe version as a business rule: "When the screen cannot tell which
of the two a block is, it treats it as R22 [pan]." The code has no "cannot tell"
branch, so R25 is not implemented.

**Consequence:** every miss the operator can report is a false-wrap. The patch
stream being one-directional (0.1.18 rules/menus wrapping, 0.1.19 Q&A summary
wrapping) is not bad luck — it is the only failure mode the design permits.

**Caveat, important:** R25 cannot be implemented literally. Panning everything
unrecognized would pan most prose and defeat PBI-060's entire driver ("wrap
prose but not tables"). So the *spec* is what is wrong here, not the code. Fix
the document, do not invert the code.

## Finding 2 — two tiers already exist, unnamed

`looksStructured()` mixes two kinds of signal with different decay properties:

| Tier | Signals | Decays when |
|---|---|---|
| Universal (shape-derived) | `stableGutters` (`:109`), `isFramingRule` (`:63`), `BOX_LINE_RATIO` (`:139-140`), pipe columns (`:143-158`) | never — properties of layout itself |
| Vendor chrome (glyph-derived) | menu cursor `❯` (`:165-167`), `●○◯`/`→` pairs (`:173`) | whenever Claude Code redraws its UI |

The comments already admit tier 2 ("is Claude Code's own menu", "Claude's own
answer-summary layout"). PBI-061 independently flags the same rot risk for a
different Claude-Code scrape: "version có thể vẽ khác."

Today nothing marks the boundary, and no test would notice a glyph change. A
Claude Code release could silently disable both tier-2 signals at once and the
symptom would present as a fresh, unrelated-looking wrap bug.

## Finding 3 — known one-sided misses already in the code

All in the destructive (wrongly-wrapped) direction:

- `GUTTER_MIN_LINES = 4` (`:35`): any 2-3 row space-aligned table (short `ls -la`,
  a 3-row `df -h`) never trips the gutter signal and wraps.
- `width = Math.min(...rows.map(r => r.length))` (`:113`): one short row (a totals
  line, a truncated last row) collapses the column-search window for the whole block.
- Pipe tables require the *first* content line to hold pipes (`pipeColumns[0] !== ""`,
  `:152`): a markdown table with a title line in the same block fails.
- `countSummaryPairs` (`:92-98`) requires strict adjacency: a question long enough
  to occupy two lines breaks the pair.

I am not recommending these be changed by hand. They are thresholds, and per the
project's own rules a threshold is a decision to settle with evidence, not to
quietly re-tune. They are listed because they show the miss surface is broad and
one-sided — which is what makes the corpus (below) worth more than more regexes.

## Recommendation — smallest set that changes the trajectory

Ordered by value-per-cost.

1. **Correct the spec and the file header.** State what actually happens:
   unrecognized shapes wrap; `pan` requires positive evidence. Touch R25
   (`terminal-detail.md:246-248`) and `block-classify.ts:9-16`. Cost: minutes.
   Value: stops every future session — human or agent — from reasoning off a
   safety guarantee that does not exist.

2. **Start the fixture corpus the spec already asks for.** `terminal-detail.md:298-303`
   names this exact gap: "Real miss rates have not been measured against a corpus
   of the output the operator actually reads." Capture real screens (Claude Code
   menu/summary/footer, codex, agy, plain shell, `git log --graph`, `ls -la`,
   `cargo tree`) as golden fixtures with expected per-block verdicts. Rule going
   forward: **every reported miss lands as a fixture before it lands as a regex.**
   This is the change that makes reactive patching cheap and permanent instead of
   endless — it converts "add a pattern, hope" into "add a pattern, proven, and it
   can never silently regress." The repo already runs vitest; no new tooling.

3. **Name the two tiers in the file.** A comment boundary and grouping is enough
   today — no new module, no abstraction. It makes tier-2 decay visible at the
   point someone edits it. Revisit extraction only if tier 2 grows past a handful
   of patterns or a second agent's chrome shows up.

4. **Do not proactively generalize.** The repo has a documented precedent for
   exactly this restraint (PBI-057: "Đừng làm trước khi có bằng chứng cần").
   Once (2) exists, generalization stops being speculative — the corpus will show
   which universal signal actually buys coverage, and thresholds like
   `GUTTER_MIN_LINES` become measurable rather than argued.

## What I explicitly did not touch

- **The wrap policy itself is a locked user decision** (PBI-060 #6: "tự động hoàn
  toàn, không nút, lưỡng lự thì pan"). Nothing above proposes a UI control, a
  per-block override, or a manual escape hatch. R24 stands.
- No code was modified. This is advisory only.

## Method / limits

- `Bash` was unusable this session (`EROFS: read-only file system` on its scratch
  dir), so no `git log`, no `grep`, no directory listing. Per session constraint,
  no subagents were dispatched.
- Read directly: `block-classify.ts` (all 222 lines), `docs/specs/terminal-detail.md`,
  `docs/specs/reading-map.md`, `docs/backlog.md` (lines 1-41 of 70).
- Commit titles for 0.1.18-0.1.20 came from session git context, not from a
  `git log` I ran. Their *bodies* and diffs are unread.

## Unresolved questions

1. Were 0.1.18 and 0.1.19 both user-reported, or found in self-testing? Changes
   how much the miss rate reflects real operator reading.
2. Does a test fixture harness already exist for the classifier
   (`web/test/terminal.test.ts` is cited in the spec, but I could not list
   `web/test/` to confirm what it covers)? Recommendation (2) may be partly built.
3. Is any non-Claude-Code agent (codex, agy) in real daily use? If yes, tier-2's
   Claude-only shape is already a coverage hole, not just a decay risk.
4. `docs/backlog.md` lines 42-70 unread — a PBI on this classifier may already exist.
