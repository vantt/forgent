# Lead-advisor verdict — reactive patching vs. generalizing `block-classify.ts`

Assignment `asgn_coordinator_driver_op_001`, run 01. Target:
`/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`.

## Verdict

**Keep patching reactively. Do not proactively generalize.** But the unease behind the
question is pointing at a real problem — just not the one it names.

## Why reactive patching is correct here (not merely tolerable)

Three properties make this file an unusually good fit for symptom-driven patching:

1. **The failure modes are asymmetric and the asymmetry is locked.** Wrongly-wrapped
   structured content destroys alignment unrecoverably; wrongly-panned prose is exactly
   the behaviour that shipped before the feature — an invisible non-event
   (`block-classify.ts:9-16`). The operator locked "fully automatic, no UI control of any
   kind, errs toward pan when unsure" on 2026-08-11 (`plan.md:63-64`).

2. **`looksStructured` is a pure OR-chain** of six independent recognizers
   (`block-classify.ts:131-176`). Adding a clause can only move cases wrap→pan — toward
   the safe direction. A reactive patch here has a bounded, non-destructive blast radius
   by construction. The only thing a new clause can break is a prose-must-wrap case, and
   those are pinned by existing tests.

3. **Cost per patch is genuinely small.** 221-line module, one call site, ~10 lines and 2
   tests per shape, rollback is "force the verdict to `pan`" (`phase-04:181-182`).

There is no accumulating design debt of the kind that would justify a rewrite.

## Why generalizing is the wrong move

Generalizing a fail-closed detector means **loosening** it. Loosening moves cases toward
wrap — the unrecoverable direction — and contradicts a locked operator decision.

This is not hypothetical. The file already contains one walked-back generalization: the
box-drawing class originally included arrows and geometric shapes, and one `→` in a
three-line paragraph is 33% of its lines, over the 30% threshold, so ordinary prose
panned (`block-classify.ts:43-50`, `phase-04:25-30`). The broader heuristic was the
*worse* one. A more general heuristic here is a higher-variance heuristic.

## What the unease is actually detecting

Two consecutive releases each chased a different Claude Code widget — 0.1.18 (framing
rules + choice menus), 0.1.19 (Q&A summary). That cadence is the real signal, and it has
two causes worth separating:

**Cause A — vendor chrome is disguised as universal layout.** Three of the six
recognizers (`isFramingRule`, `MENU_CURSOR_ITEM`, `countSummaryPairs`) detect one
vendor's TUI chrome. Three (gutters, pipes, box ratio) are source-agnostic. The code does
not distinguish them, so every vendor-shape addition reads as another edit to "the
universal heuristic" and feels like drift. It isn't drift — it's a lookup table that
hasn't been named as one.

**Cause B — nothing counts the misses.** Phase 4's own Validation section required a
corpus-based confusion matrix with `structured-wrapped-as-prose == 0`
(`phase-04:160-169`). What shipped is 19 hand-written example tests. The plan's stop
condition is "a miss rate the operator trusts" (`plan.md:97-99`) — and that is currently
untestable. So the question "is patching converging or diverging?" has no answer, which
is precisely why it feels unresolved.

Note also the structural ceiling already recorded: alt-screen Claude panes expose no pty
soft-wrap signal, and "No mechanism fixes this; it is a property of the source"
(`phase-04:176-180`). The hardest misses are concentrated in exactly the source class
that no amount of generalization can reach.

## Recommended actions, in order

1. **Build the corpus + confusion matrix.** Cheapest, highest-leverage, and already
   specified. The stated blocker (real captures contain live work content) has a stated
   solution: synthesise a clean set (`plan.md:127-128`).
2. **Split the clause list in two** — source-agnostic layout signals vs. Claude-Code
   chrome recognizers. No behaviour change. Makes the next patch an obvious list-addition
   and makes the growth rate of vendor recognizers visible.
3. **Build fit-by-shrink** (`phase-04:118-123`): scale a mildly-too-wide block's font down
   to fit. In scope for phase 4, never built, button-free, needs no recognition step, and
   removes the most common real irritation without touching the classifier at all.
4. **Decide PBI-060 note (6) once:** how many render paths the app feeds. PR #5's Log view
   solves Claude panes by *source separation* rather than heuristic. If it lands, most of
   the pressure driving these chrome patches disappears — that changes whether the
   classifier is even the right place to spend.

## Tripwires that mean reopen the decision

- Vendor-chrome recognizer count keeps growing per release, once countable.
- A patch ever has to *loosen* a source-agnostic signal rather than add a pan-clause.
- The confusion matrix shows any structured-wrapped-as-prose case.

Two escapes are already priced and parked: the **pty soft-wrap signal** (dropped in phase
4 with the explicit trigger "if the structure detector proves insufficient in use", which
is arguably now met; cost = two backend reads per poll, `phase-04:12-23`) and the
**manual toggle** (ruled out by the operator — reaching it means reopening *with* them,
not shipping it).

## Limitations of this analysis

- **Bash was non-functional for the entire session** (EROFS creating its temp dir, plus an
  unresolvable approval gate), in both the main session and a delegated read-only
  subagent. No `git log`, `git show` or `git diff` ran.
- Commit history for the file is therefore **inferred**, from three sources: the two
  commit subjects in the session's git-status snapshot, the file's own comments (which
  narrate each addition and the symptom that caused it), and phase-04's "Departures from
  the plan" section. The *direction and shape* of recent patches is well-supported; exact
  dates and the full commit list are not verified.
- `web/src/views/terminal.ts` is modified in the working tree and could not be diffed.

## Unresolved questions

1. Has the operator reported a miss since 0.1.19, or is this unease about release cadence
   rather than a current defect? Decides whether action 1 is urgent or merely due.
2. Is PR #5 (Log view) still live? Decides whether action 4 is a real fork.
3. Does the phase-4 measurement corpus at `.bee/spikes/terminal-render-bench/` still exist
   after the `.bee` → `.fgos` migration (commits `395d21b`, `fa2f1b7`)? If it was removed,
   action 1 costs more than it looks.
