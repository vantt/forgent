# shape-constraint-proposal (real, asgn_coordinator_driver_op_023)

## Dispatched objective (verbatim)

Propose the architecture that best respects real operational constraints (test coverage, release cadence, no-UI-control per /home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md R24, the fail-closed asymmetry per R25) for /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification. Use absolute paths for everything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Constraint-advocate recommendation: keep block-classify.ts's current architecture (pure, OR-combined, independently-testable structural detectors with hardcoded thresholds) rather than moving to a scored/weighted or pluggable/config-driven classifier. It is the only shape that stays cheaply unit-testable without a browser/corpus, matches the repo's small-diff-per-rule release cadence, keeps zero runtime control surface (R24), and structurally cannot regress the fail-closed pan bias (R25) the way a weighted ensemble can via score dilution. Recommend extending in place with one named detector function per new signal; only extract to a detector array/registry if the OR-chain becomes unreadable, and only pursue a smarter (ML/statistical) classifier once a labeled real-transcript corpus exists (currently absent per the spec's Open Gaps).",
  "recommendation": "keep-and-extend-current-architecture",
  "constraints_considered": [
    "test-coverage",
    "release-cadence",
    "R24-no-ui-control",
    "R25-fail-closed-asymmetry"
  ],
  "evidence_files": [
    "web/src/block-classify.ts",
    "web/test/block-classify.test.ts",
    "docs/specs/terminal-detail.md"
  ],
  "unresolved_questions": [
    "No labeled corpus of real operator terminal output exists to measure current classifier miss-rate (spec Open Gaps).",
    "No competing architecture proposal was supplied in this assignment's context to react against."
  ]
}
```

## Real agent-report.md (verbatim)

# Constraint-advocate position: block-classify.ts architecture

Role: constraint-advocate. Objective: propose the architecture that best respects
real operational constraints for `web/src/block-classify.ts` (terminal-detail
block classification) — test coverage, release cadence, R24 (no UI control),
R25 (fail-closed asymmetry toward "pan").

No competing proposal or prior discussion was supplied as context, so this is a
from-the-evidence recommendation, not a rebuttal of another agent's design.

## What exists today

`looksStructured(content: string[]): boolean` is a pure function: six
independent, single-purpose detectors (`stableGutters`, `isFramingRule`,
box-char ratio, markdown-pipe columns, cursor-menu, question/answer summary),
combined with plain `||` — first true wins, "pan". No match falls through to
"wrap". `classifyBlocks` wraps this per blank-line-delimited block, itself pure
(`StyledLine[] -> Block[]`, no viewport/width input).

Evidence read directly:
- `web/src/block-classify.ts:1-221`
- `web/test/block-classify.test.ts:1-264` — one `describe` block per detector,
  plus a "the bias that matters" block asserting every known-structured shape
  never wraps.
- `docs/specs/terminal-detail.md` R21-R27 (block rules), R24 (no control
  surface), R25 (fail-closed toward R22/pan). Open Gaps section: "Real miss
  rates have not been measured against a corpus of the output the operator
  actually reads" and "R21-R28 are covered by unit tests over the classifier
  and the built DOM, which prove the decisions and the markup but not the
  layout."

## Recommendation: keep the OR-of-independent-detectors architecture; extend it in place

Reject any move toward a scored/weighted ensemble, a pluggable detector
registry/config, or an ML/statistical classifier. Extend the existing shape:
one named boolean detector per structural signal, each with its own doc
comment stating the false-positive/false-negative story, combined by `||`.

### Why, against each constraint

**Test coverage.** The current function is synchronous, deterministic, and
takes plain strings — no DOM, no browser, no fixture corpus needed to assert a
verdict. That's exactly why `block-classify.test.ts` can unit-test every rule
in isolation and still assert the composite (`classifyBlocks`) end to end. The
spec's own Open Gaps admit no real-corpus miss-rate has been measured and
layout is DOM/jsdom-only, not browser-verified — a weighted or ML model adds a
second, harder testing problem (calibration data, non-obvious regression
diffs when a threshold shifts) on top of a gap that isn't closed for the
simple case yet. Any heavier model is not testable to the same bar with
current fixtures, so it's not affordable now.

**Release cadence.** Every rule so far (`isFramingRule`'s ratio-dilution fix,
the choice-menu cursor rule, the "Review your answers" summary rule) shipped
as one self-contained function plus one `||` clause plus its own tests — a
small, independently reviewable diff with an isolated blast radius. A
registry/plugin architecture (detectors registered elsewhere, looked up by
name/priority, maybe configurable weight) adds indirection that buys nothing
at today's scale (6 detectors) and slows down exactly the kind of
one-glyph-shape-at-a-time fix this file has needed so far. YAGNI applies
directly: don't build a plugin system for a problem the current flat file
still solves cleanly.

**R24 — no UI control, nothing to configure.** The current constants
(`GUTTER_MIN_LINES`, `GUTTER_MIN_COUNT`, `BOX_LINE_RATIO`, `RULE_MIN_LENGTH`,
`MENU_MIN_ITEMS`, `SUMMARY_MIN_PAIRS`) are compiled-in literals, changed only
by a code diff + review + test update. This is the constraint that most needs
active guarding going forward: any architecture that exposes these as runtime
config — an env var, a feature flag, a "strictness" knob meant only for
ops/debugging — becomes a de facto control surface R24 forbids, whether or
not it's ever exposed in the UI. The recommendation is explicit on this
point: thresholds stay hardcoded constants, tuned only via code change, never
via config/flag, even for internal use.

**R25 — fail-closed toward pan.** R25 isn't implemented as a boolean
default-branch ("if unsure, return pan") — it's implemented as low,
deliberately generous thresholds inside each detector (2 gutters, not 4; a
rule only 8 characters long; a 0.3 box-line ratio; 2 menu items; 2
question/answer pairs) plus pure `||` composition, so any single sufficient
signal wins outright and can never be diluted by absence of others. This is
the structurally important property to preserve: `isFramingRule`'s own doc
comment records a real bug class this shape fixed — a long draft between two
rule lines diluting the box-ratio below threshold, which a *scored/weighted*
architecture (sum-then-threshold, confidence averaging) reintroduces by
construction, because averaging is exactly what lets a strong true signal get
outvoted by a lot of weak false ones. An OR-of-independent-sufficient-
conditions architecture cannot regress in the dangerous (wrap) direction when
a new detector is added; a weighted-ensemble architecture can, silently, as
soon as two detectors' scores interact. This is the single strongest
technical reason to keep the current shape over any "smarter" alternative.

### Boundary condition (when to revisit)

If the detector count grows large enough that the linear `||` chain in
`looksStructured` becomes hard to read/review (not the case at 6), extract it
to a `const DETECTORS: Array<(content: string[]) => boolean>` iterated with
`.some(...)` — same OR semantics, better readability, still zero config
surface. Do this only when review friction actually shows up; not
speculatively.

### What not to do without a corpus

Any change aimed at improving recall/precision beyond today's manually-argued
detectors (e.g. a statistical or learned classifier) needs a labeled corpus of
real operator-visible terminal output first — the Open Gaps section already
flags this as unmeasured. Until that corpus exists, "smarter" is not
verifiable, so it isn't buildable under the test-coverage constraint. If
better recall is wanted, the actionable step is a golden-output regression
fixture built from captured real transcripts, run through the *existing* pure
classifier in CI — not a new model architecture.

## Unresolved questions

- No corpus of real operator terminal output exists to measure current
  miss-rate (Open Gaps, terminal-detail.md). Constraint-advocate treats this
  as a precondition for any richer classifier, not something this proposal
  can resolve.
- No competing architecture proposal was provided in this assignment's
  context to react against; if one exists elsewhere in the panel, it should
  be checked against the R25/OR-vs-weighted argument above specifically.
