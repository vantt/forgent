You are the Lead Advisor again, now in Phase 8. Your job this time:
translate the Decision Packet below into the ONLY artifact in this whole
session written to be read by the person rather than by the panel.

Use exactly this template shape (verbatim from architecture-advisory-artifact-templates.md's
"Human-Facing Explanation" template):

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

The person's vocabulary (from Phase 1 intake, preserve exactly): daemon,
thin client, single-daemon, registry/render/search, authority, experimental,
local ownership. Do not introduce "microservice", "monolith", "cache",
"replica", or other words they didn't use.

--- THE DECISION PACKET (synthesis.md, in full) ---

RECOMMENDATION: "Thin Shell, Measured First" — daemon keeps registry/
render/search authority; desktop shell owns only window/presentation/
connection state. Land CI + instrumentation on the shell BEFORE any
launcher-coordination hardening; don't reopen ownership until real-workload
numbers exist. Concretely, in order: (1) put the shell in CI; (2) fix 3
deterministic launcher bugs (silent-fallback, wrong-port, raw-bind-host
URL); (3) deploy TTI/search-latency telemetry; (4) do NOT yet build robust
cold-start coordination (the race is unreproduced — that state-machine work
is exactly what one live objection calls "entrenching"); (5) ask the
maintainer directly: did shell development stop because it's abandoned, or
because it's considered done? (6) reopen ownership only against measured
workloads.

Chosen against: local ownership (rejected — second unmaintained
implementation, one maintainer, expensive to reverse once local state
exists); deleting the shell entirely (NOT refuted, only DEFERRED behind
step 5 — a live, unresolved objection says "0 commits since July" is
equally consistent with "working exactly as designed" as with
"abandoned"); embedding the daemon into the desktop binary (considered,
conceded as also being new work, not free).

COSTS, explicitly: the cold-start race stays open while telemetry
accumulates — a deliberate, named cost; CI/telemetry setup work on an
"experimental" component produces no user-visible improvement by itself;
if step 5's answer is "abandoned," steps 1-3 will turn out to have been
wasted (step 5 is cheap and could go first — ask it today if you can); the
reversibility this recommendation counts on is itself disputed by one
unresolved objection (Attack 1) and never tested either way.

TWO LIVE, UNRESOLVED DISAGREEMENTS (name both, do not pick a side, do not
launder into "considerations"):
1. Whether fixing launcher coordination well actually makes the
   architecture MORE locked-in (entrenches the multi-process split) rather
   than staying reversible, as the recommendation assumes. Nobody measured
   the comparison. Unresolved.
2. Whether "0 commits since July, frozen version, no CI/tests" means the
   shell is abandoned, or means it's a thin client working exactly as
   intended (needing zero changes when the daemon grew capability in
   September). This is the single most decision-relevant open question in
   the whole session, and it is answerable with one direct question to the
   person, asked nowhere yet.

WHAT STAYS THE PERSON'S OWN CALL (carried forward from Phase 4, never
resolved by the panel by design): whether the "experimental" desktop shell
is a real product bet worth continued investment, or a spike that's fine
to let go — this determines how much the launcher-coordination investment
is even worth making, and only the person can answer it. Also theirs: if
Attack 1's reversibility dispute matters to them more than shipping
something now, they may prefer Proposal 3's original fix-first order over
the recommendation's measure-first order — that trade was a values call
the synthesizer explicitly declined to make for them.

--- YOUR TASK ---

Write explanation.md now, in the template shape above, translating the
Decision Packet honestly — including both live disagreements and the
"what stays yours" framing, not softened. Do not write files — output your
full explanation.md content directly in your response as markdown.
