# shape-system-proposal (real, asgn_coordinator_driver_op_032)

## Dispatched objective (verbatim)

Propose the strongest 'stay within the current system' architecture: continue and evolve the universal visual-heuristic classifier at /home/vantt/projects/herdr-gateway/web/src/block-classify.ts rather than adopting a per-agent grammar. Use absolute paths for everything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Recommend staying in-system: continue evolving the universal content-shape classifier at /home/vantt/projects/herdr-gateway/web/src/block-classify.ts rather than adopting a per-agent grammar. The classifier already reads only a block's own text (never agent identity), is locked into the product spec (docs/specs/terminal-detail.md R21-R27, fail-closed toward 'pan'), and is already being evolved cheaply and safely via narrow, evidence-driven signal additions (3 of the last 5 commits each added one regex + threshold + pinned regression test, e.g. menu-cursor and Q&A-summary detectors). A per-agent grammar would not remove the need for a fallback heuristic (unmapped/new agents still need one), would require threading agent identity through the screen-read/render pipeline in violation of the locked R26 content-only invariant, and would multiply maintenance cost across N agents x their own version churn, since the richest available signal today is still just the raw printed screen text. Full reasoning, evidence, and a recommended forward-evolution plan are in agent-report.md.",
  "recommendation": "stay-in-system",
  "subject_file": "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
  "alternative_rejected": "per-agent grammar (dedicated parser/adapter per coding-agent CLI)",
  "evidence_reviewed": [
    "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
    "/home/vantt/projects/herdr-gateway/web/test/block-classify.test.ts",
    "/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md",
    "/home/vantt/projects/herdr-gateway/docs/backlog.md",
    "/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/plan.md",
    "/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/phase-04-block-classifier-and-wrap-policy.md",
    "/home/vantt/projects/herdr-gateway/plans/260728-1135-terminal-ansi-render-lightweight/plan.md"
  ],
  "unresolved_questions": [
    "No real operator-corpus miss-rate measurement exists yet for the classifier (tracked as an Open Gap in docs/specs/terminal-detail.md) — should be prioritized before further signal tuning.",
    "No Codex/Agy pane fixtures were available when the classifier's signal separation was measured, so coverage for those agent types is unconfirmed."
  ]
}
```

## Real agent-report.md (verbatim)

# Stay-in-system architecture: evolve the universal visual-heuristic classifier

**Subject:** `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`
**Alternative rejected:** a per-agent grammar (a dedicated parser/adapter per coding-agent CLI: Claude, Codex, Agy, ...)
**Verdict:** stay in-system. Continue evolving the single content-shape classifier. Do not fork into per-agent parsers.

## What the current system actually is

`block-classify.ts` (222 lines) is a pure, agent-agnostic function: split a screen into blocks at
blank lines, and for each block decide `wrap` (continuous text, safe to reflow) or `pan` (the
program chose this shape — tables, trees, box frames, ASCII art, menus, Q&A summaries — never
reflow it). It reads only the block's own text (`StyledLine[]` → plain strings). It has no notion
of which agent produced the screen. Read the module's own header comment
(`block-classify.ts:1-16`) — the design rationale is stated in-code:

> Being wrong is asymmetric... `pan` is the default and `wrap` is the path that has to prove
> itself. A classifier that hesitates falls back to what the operator already lives with.

This is a locked, operator-approved decision, not an implementation detail up for casual reversal.
`docs/specs/terminal-detail.md` R21-R27 codifies it as product spec:

- R24: "There is no control for it anywhere: no switch, no per-block override, nothing to discover
  or configure."
- R25: fail-closed toward `pan` when unsure.
- R26: verdict depends **only on the block's own content**, never on viewport, agent identity, or
  anything external.
- R27: a block's treatment must not change while its content is unchanged (poll-to-poll stability).

The decision record (`plans/260728-1135-terminal-ansi-render-lightweight/plan.md`, "open decision
6") shows this was explicitly negotiated with the user 2026-08-11 and locked: "fully automatic, no
UI control of any kind... the operator explicitly ruled out buttons."

## Evidence the current system is already working and evolving cheaply

Three of the last five commits on `main` are incremental, narrowly-scoped extensions to this exact
module, each adding one new visual idiom without touching segmentation or the wrap/pan decision
core:

- `881fa33` — stop rules and choice menus from wrapping under real Claude Code footers (added
  `isFramingRule`, `MENU_ITEM`/`MENU_CURSOR_ITEM`).
- `15b1203` — pan Claude's "Review your answers" Q&A summary (added
  `SUMMARY_QUESTION`/`SUMMARY_ANSWER`/`countSummaryPairs`).
- `c1bebce` — widen the reply-guard tail window past Claude Code's footer (a downstream consumer
  fix, not the classifier itself, but caused by the same footer shape).

Each addition is: one narrow regex, one minimum-repetition threshold to avoid false positives on
prose (mirroring the module's own documented lesson: a lone "→" in a sentence must not trip the
same signal that catches a repeated Q&A pair — see the code comment at `countSummaryPairs`), and a
unit test pinned to the real capture that broke. This is a healthy, low-cost evolution loop already
in motion. The phase-4 delivery record
(`plans/260811-1426-terminal-dom-renderer-swap/phase-04-block-classifier-and-wrap-policy.md`) shows
the same pattern at initial ship: measured signal separation on real captures (structural gutters:
7-11% of Claude panes vs 66% of colour-heavy shell panes — a 6-9x separation), then narrowed
box-drawing to exclude arrows/bullets after a captured false positive. The system self-corrects from
evidence, cheaply, without architectural change.

## Why a per-agent grammar is the weaker path, concretely

**1. It doesn't remove the need for a fallback heuristic — it just adds a second system on top of
one.** Any agent not yet given a grammar (a new CLI, an unreleased version, an unmapped shell
program) still needs a default classification. That default is, by construction, exactly the kind
of content-shape heuristic that already exists. A per-agent grammar can only ever be a set of
special cases layered over the same fallback — net new code, not a replacement.

**2. The richest signal available today is already "scrape the raw screen text."** There is no
richer, more structured channel to build a grammar from. `docs/backlog.md` PBI-061 hits this
directly for a different subsystem (agent self-chosen display names): the host's own herdr
integration has no field for it — the only place collie (the reference project) got that signal was
by regexing the raw pane text, the same substrate `block-classify.ts` already consumes. Building a
"grammar" here would still mean writing regexes against printed terminal output per agent — it does
not upgrade to a real protocol, it just partitions the same regex work by agent identity instead of
by visual shape.

**3. Agent UI surfaces are not stable per agent, let alone across agents.**
`docs/specs/terminal-detail.md` R12 states this as a proven constraint: "an agent can change whether
it takes over the whole screen between its own versions while its name stays the same." A
per-agent grammar is a per-agent-per-version maintenance liability — every Claude Code /
Codex / Agy release that changes its TUI chrome silently breaks its grammar until someone notices
and patches it, with no fallback for the gap. The current heuristic degrades gracefully in that same
gap: worst case, a case it doesn't recognize renders as `pan`, which by design (R25) is "exactly
today's behaviour" — an invisible non-event, not a broken layout.

**4. It requires threading agent identity through a pipeline that deliberately doesn't carry it.**
`classifyBlocks` takes only `StyledLine[]` (`block-classify.ts:191`). Introducing per-agent
dispatch means plumbing an agent-type tag through the screen-read route (`src/web/screen.rs`),
`PaneScroller`, the frontend fetch path, and the render call site (`terminal-render.ts`) — a real
API-shape change — in direct service of undoing R26, an invariant the operator already
signed off on for a different reason (stability across phone-rotation/keyboard events). Reopening
R26 for this should get the same explicit operator sign-off it took to write it, not be a side
effect of picking a different classification strategy.

**5. Fixes compound across agents for free today; they wouldn't under a grammar.** The menu-cursor
and Q&A-summary detectors were discovered from Claude Code captures, but they now also correctly
`pan` any other program that happens to draw the same shape (a selection cursor in front of a
numbered list, a bulleted-question/arrowed-answer pairing) — Codex, Agy, or a plain shell script
that mimics the same UI idiom. A grammar keyed on agent identity would need the same fix written
N times, once per agent whose grammar the shape appears in, and would silently miss it for any
agent not yet covered.

**6. Testability and blast radius favor one shared module.** 19+ unit tests
(`web/test/block-classify.test.ts`) cover segmentation, each signal, and — importantly — two
regression classes that only a shared module makes cheap to guarantee once: "never re-verdicts a
block across polls while content is unchanged" and "verdict is identical across viewport widths."
Under a per-agent grammar, each parser would need to reprove both properties independently, and a
regression in one agent's grammar cannot be caught by another agent's test suite.

## What "stay within the system" evolution should look like going forward

This is not "leave it alone" — it's "keep growing it the way it has been growing, from evidence."

1. **Keep the discovery loop exactly as-is.** New false-wrap/false-pan cases enter as narrow,
   evidenced additions (a specific regex + a minimum-repetition guard + a pinned unit test from a
   real capture), the same shape as the last three commits. Do not add a signal speculatively for
   an agent behavior that hasn't been captured yet — the module's own doc comments show that
   speculative signals (arrows/geometric shapes in the box-drawing class) produced a real false
   positive and had to be narrowed back.

2. **Close the two open gaps already on record, without new architecture:**
   - `docs/specs/terminal-detail.md` "Open Gaps" states real miss-rates have never been measured
     against a corpus of what the operator actually reads. `.bee/spikes/terminal-render-bench/probe-wrap-signals.mjs`
     already exists for exactly this measurement — wire it into a repeatable check (even a manual
     one run before each classifier change) instead of waiting for the next user-reported footer
     bug, which is how all three recent fixes were found.
   - Alt-screen panes (Claude Code) have no pty soft-wrap signal (`recent_unwrapped` doesn't apply
     to them) — the gutter/box-drawing signals alone carry the decision there. This is a known,
     accepted weak spot in the locked design, not a defect to architect around; revisit only if the
     miss-rate measurement above shows it's actually causing misclassification in practice.

3. **If a genuinely new signal class is needed, add it as one more clause in `looksStructured`,
   not a parallel code path.** The function already composes five independent signals (gutters,
   framing rules, box-drawing ratio, pipe-tables, menu cursors, Q&A pairs) with the same OR-into-pan
   structure. That's the extension point. It is the same reason the last three fixes cost one
   function each and zero architecture changes.

4. **If tuning ever fails to reach a trustworthy miss rate**, the phase-4 plan already names the
   correct next step explicitly: reopen the no-UI-control decision with the operator, not
   quietly build a second system beside this one. That stop condition is the one legitimate trigger
   for reconsidering scope — and it is a product conversation, not an architecture forced by this
   codebase.

## Unresolved questions

- No real operator-corpus miss-rate measurement exists yet (tracked as an Open Gap already in
  `docs/specs/terminal-detail.md`). Recommend prioritizing this over any new signal work, since it's
  the only way to know whether the current heuristic needs tuning at all versus is already good
  enough.
- Whether Codex/Agy panes have been captured and checked against the same signal set is unconfirmed
  — the phase-4 measurement corpus notes "no Codex/Agy fixture exists (no such pane was running)."
