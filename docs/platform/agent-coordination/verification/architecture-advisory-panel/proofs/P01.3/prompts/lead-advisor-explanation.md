You are the Lead Advisor again, now in Phase 8. Your job this time:
translate the Decision Packet below into the ONLY artifact in this whole
session written to be read by the person rather than by the panel.

Use exactly this template shape (verbatim from
architecture-advisory-artifact-templates.md's "Human-Facing Explanation"
template):

```
## What We Think You Should Do
<the recommendation, in their vocabulary and at their altitude>

## What This Means For Your System, Concretely
<name real paths and real behaviors, not abstractions>

## What Gets Easier

## What Gets Harder
<every architecture trades something>

## The First Reversible Step
<what to do this week that validates or kills this cheaply, and what it costs>

## When You Should Reverse This
<an observed condition -- a number, a rate, an event they will actually see>

## What We Are Not Sure About
<the panel's live uncertainty, including any dissent that survived, attributed. Do not smooth it>

## What Stays Yours
<explicitly: the judgment the panel cannot make for them, and why it is theirs>
```

Bad fill to avoid (from the same template): restating synthesis.md with
the provenance stripped out; a "what gets harder" section listing only
mild costs while a real objection stays buried; surviving dissent softened
to "some considerations"; a "what stays yours" that reads as a disclaimer
("of course, the final decision is yours") instead of naming the specific
judgment.

The person's vocabulary (from Phase 1 intake, preserve exactly): EOD,
intraday, pipelines (plural, separate), contracts, evolution, difficult.
Do not introduce "batch/streaming", "microservice", "monolith", or other
words they didn't use. They also never said "abandoned" or "broken" —
nothing in their words claims production failure; keep the framing about
change, not runtime failure.

--- THE DECISION PACKET (synthesis.md, in full) ---

RECOMMENDATION: Keep the two pipelines and the existing shared runner
(`AssetRunner`). Do not build a new pluggable pipeline abstraction. Close
3 named seams, in this order: (1) make intraday's breadth-gate policy
explicit at the boundary instead of silently defaulting to bypass; (2)
port EOD's schema-tolerance fix into intraday's loaders; (3) make
intraday's read of EOD's persisted output a checked input (mechanism for
this third item is an open, non-blocking choice among three options the
panel did not adjudicate).

Three advisors reached "don't restructure" by three different routes:
diagnostically (a shared engine and shared domain logic already exist, so
there's no pipeline-count boundary left to draw), by blast-radius (EOD's
unattended overnight run with dead-man-switch/5-session-catchup means a
shared-engine change could touch 6 sessions at once — keep that path
untouched, inject compatibility only at consumer edges), and by priors
(the repo is ~1 month old, boundaries are still settling, so explicit
data-safety beats code-level cleanliness).

STEP ZERO (holds regardless of anything else unresolved): the breadth-gate
omission. EOD got a new signal input (breadth) that intraday never wired;
the shared gate silently bypasses when it's missing. This was
independently confirmed: an actionable Telegram alert can be sent based on
this silent bypass, and the pipeline runner checks run AFTER the alert is
already dispatched — a check added later cannot un-send a notification.
This was the one claim in the whole session that was directly attacked
and survived the attack, verified against the runner's own code.

DEMOTED, WITH EVIDENCE: the shared alert-daily-cap coupling (two advisors
treated it as a real ongoing risk; one built their entire "do nothing"
trigger around it) was independently confirmed to be a rare, fail-safe
edge case, not a chronic one — EOD and intraday do not run at overlapping
times in normal operation, per the code's own documentation, and the only
real overlap is a rare manual/backfill EOD run during market hours, which
only suppresses extra alerts, never over-sends. The "no-build" path's
proposed trigger is now undercut, and nobody proposed a replacement.

MECHANISM NOT SETTLED: for closing the third seam (intraday's undeclared
read of EOD's output), 3 advisors proposed 3 different specific
mechanisms and nobody in the panel supplied evidence that would separate
them. This does not block the recommendation — it's an implementation
choice, not a direction choice.

COSTS, explicitly: this recommendation is choosing against the
forward-looking reading of the word "evolution" — if what's actually
painful is porting each new feature into both pipelines (there's a real,
concrete instance of this pressure already on record: proposed new
intraday trading-plan features that EOD already has), then this
recommendation spends time on seams that don't reduce that cost at all,
and the same porting cost gets paid again on the very next feature. One
advisor said this outright as their own stated condition for being wrong.
It also costs silence being traded for visibility: today intraday always
runs, even on bad or missing inputs; after these fixes, it can refuse or
fail loudly instead — which is the point, but it is a real behavior
change, not free.

TWO LIVE, UNRESOLVED DISAGREEMENTS (name both, do not pick a side, do not
launder into "considerations"):
1. Whether the near-unanimous "don't restructure" agreement among all
   three advisors is genuine independent convergence, or an artifact of
   all three having read the same investigation findings and simply
   solving what those findings pointed at — while under-weighting the
   forward-looking reading of "evolution is difficult" (see costs above).
   Nobody in the panel answered this; it was raised late and never
   revisited by any advisor.
2. Whether the option that keeps the pipelines separate (with the seam
   fixes above) or the option that reframes the problem away from
   pipeline count entirely is the more accurate reading of the original
   question — two advisors effectively answered "keep separate, harden";
   one answered "the pipeline-count framing itself was the wrong
   question." Their concrete recommended work overlaps heavily, but that
   is not the same as agreeing on what question they were answering.

WHAT STAYS THE PERSON'S OWN CALL: (a) whether the breadth-gate input
should be REQUIRED (intraday sometimes doesn't run rather than run on a
bad assumption) or DELIBERATELY EXEMPTED with a documented reason
(intraday keeps running, accepting that gap as known and accepted) — both
options remove today's silent default, they differ in which failure mode
becomes visible, and only the person who is on call for either failure
mode can make that trade; (b) the single fact that would most change this
whole recommendation, which no code inspection can answer: when they say
"evolution is becoming difficult," do they mean the kind of thing they
keep discovering only after it already went wrong (this recommendation
addresses that directly), or do they mean the cost of building the same
new feature twice, once per pipeline (this recommendation does not
address that, and the question should be reopened toward a shared
abstraction instead if so).

--- YOUR TASK ---

Write explanation.md now, in the template shape above, translating the
Decision Packet honestly — including both live disagreements and the
"what stays yours" framing, not softened. Do not write files — output your
full explanation.md content directly in your response as markdown.
