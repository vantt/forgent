# withheld-redteam-explanation (real, asgn_i27_driver_op_004, coordinationId i27-p052-unclear-withheld-v2)

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Wrote the lead-advisor document for the person: recommend Proposal A (stay in-system, evolve block-classify.ts) with two conditions -- source the fixture corpus from airemote (R2 E2 F2) not collie (R3 E1 F3), and name the Claude-specific rules in place rather than building a harness/ subsystem. Proposal B refuted on collie's own tier ladder (read-only lift is Tier 1; its conformance machinery is Tier 2). Proposal C confirmed highest-risk by the 0.1.18-0.1.20 reactive-patch pattern. Left explicitly unresolved: real Codex/Agy blast radius (PBI-061), with the concrete MENU_CURSOR_ITEM glyph mismatch (U+276F vs U+203A) flagged as the first thing to verify. Run was blind by design; no file outside the prompt was read.",
  "evidenceRefs": [
    ".fgos/assignments/asgn_i27_driver_op_004/runs/01/agent-report.md"
  ],
  "blind": true,
  "recommendation": "proposal-a-with-conditions",
  "unresolved": [
    "Product bet: Claude-first viewer vs multi-agent terminal",
    "Whether MENU_CURSOR_ITEM matches U+276F literally or via a wider class (Codex U+203A failure unconfirmed)",
    "Meaning of R/E/F in the prior-art score rubric"
  ]
}
```

## Real agent-report.md (verbatim)

# Terminal-detail classification in herdr-gateway: stay universal, or go per-agent?

Lead-advisor document for the person who owns `web/src/block-classify.ts`.
Written blind: the only evidence used is the intake and the synthesis/red-team
material handed to this run. Nothing in the repo, the plan tree, or the module
itself was opened. Where that blindness matters, it is called out.

## The answer, consequence first

Keep the classifier in-system and evolve it. Do not build a per-agent grammar
subsystem. That is Proposal A, with two conditions attached below.

What this costs you, stated up front:

- You keep one module that already contains Claude-specific rules, and you make
  those rules visible by name instead of pretending the heuristic is universal.
- You commit to sourcing a real fixture corpus, not a hand-written one, before
  the next Claude-specific patch lands.
- You accept that the question of what actually breaks on Codex and Agy panes
  stays open until someone captures a real fixture from each. No proposal in the
  packet measured it. This document does not close it either.

What this buys you: the next three releases stop being reactive patches with no
regression net, and you never pay the assembly cost of an adapter architecture
for a capability whose own reference implementation treats it as cosmetic.

## What you asked, and what I think you are deciding

The stated question is "universal heuristic or per-agent grammar." I am
confident that is the surface. The worry underneath, inferred, is narrower and
heavier: three releases in a row (0.1.18, 0.1.19, 0.1.20) each shipped one more
Claude-specific patch, and there is no way to know whether any of them broke the
other agents. The word "universal" in the question reads as an aspiration the
module never met, not a property it has.

Altitude: this is a module-level decision with a product-bet shadow. The module
is one file. The shadow is whether herdr-gateway is a Claude Code viewer that
tolerates other agents, or a multi-agent terminal that must classify each one
correctly. I am guessing you have not decided that shadow question, and I am
holding it open rather than picking a side. It matters because it separates
Proposal A (fine if Claude is primary) from a real per-agent design (only
justified if all agents are first-class). Context investigation, not this
document, should collapse it with evidence such as actual pane counts by agent.

Burden: cheap to reverse at the module level. The classifier is read-only lift.
A wrong classification wraps or pans a block incorrectly. It does not inject
keystrokes, swallow dialogs, or lose data. That reversibility is what makes the
recommendation safe to act on now.

Is the decision already made? I see no sign of ratification-seeking. The three
proposals were genuinely argued, and the critic's side lost on a ground the
critic did not raise. Treat this as an open decision that now has an answer.

## The three proposals

**Proposal A, evolve the existing classifier in place.** Recommended. It matches
the actual risk tier of the capability, keeps the change local to a file
colleagues already know, and makes the two real gaps (no corpus, unnamed
Claude-specific rules) explicit instead of architectural.

**Proposal B, a per-agent HarnessAdapter grammar modeled on collie.** Refuted.
The critic's argument against it was that the risk is cosmetic, so a grammar is
overkill. That argument is correct but soft. The sharper ground is collie's own
internal tier ladder. Collie classifies read-only lift, which is exactly what
wrap and pan classification is, as Tier 1, cosmetic-risk. Collie reserves its
fixture-corpus, conformance-suite, and live-verify machinery for Tier 2,
interactive send: keystroke injection and dialog-swallowing. Importing collie's
full apparatus for block classification is importing Tier-2 machinery for a
Tier-1 capability. The reference you would be copying from would not do this to
itself. That is defensible to a colleague who has read collie, which is the
audience that would otherwise push for B.

**Proposal C, keep patching reactively.** Highest risk of the three, and this is
observation, not argument. The last three real releases are each a Claude
patch with no corpus and no cross-agent regression run. C is not "do nothing."
C is "keep doing the thing whose consequences nobody has measured."

## The two conditions on Proposal A

**Condition 1: source the corpus from airemote, not collie.** The repo's own
prior-art log already scored candidates. airemote's composer-testdata-ground-
truth scored R2 E2 F2. Collie's conformance suite scored R3 E1 F3, single-
source, high assembly cost. I am confident in the ranking as reported. I am
guessing at what R, E, and F stand for, and it does not change the conclusion:
the packet reports airemote as cheaper to adopt and multi-source, and that is
what a regression corpus for a Tier-1 capability needs. Do not hand-author
fixtures. The whole failure mode of the last three releases is that the rules
were written from one agent's output by eye.

**Condition 2: name the Claude-specific rules that already live in the module.**
Do not move them into a `harness/` directory. Do not build an adapter interface
for them. Label them where they are, so that a reader of the file can see which
lines assume Claude Code and which lines are agent-neutral. This is the cheapest
possible step toward honesty about universality, and it is the step that makes
a future per-agent split possible if the product bet ever demands it.

## The unresolved finding: a concrete cross-agent failure, unmeasured

Nobody's proposal measured the real blast radius on Codex or Agy panes. That
is the PBI-061 gap and it stays open. But the session surfaced one concrete
mechanism, and it should not be buried under "needs more data."

The module's recently added `MENU_CURSOR_ITEM` detector hardcodes Claude Code's
selection-cursor glyph, U+276F, the heavy right-pointing angle `❯`. Codex's real
captured fixture data, already in the repo per the composer-testdata source,
uses a different glyph for the identical concept: U+203A, the single right-
pointing angle quotation mark `›`.

If both facts hold, the classifier today silently fails to recognize a real
Codex selection menu as structured. That is precisely the failure this whole
debate is about, and it would be happening now, in shipped releases, unnoticed,
because no Codex or Agy fixture was ever captured to catch it.

I am confident about what the packet reports on both glyphs. I could not open
the module or the fixture data to confirm either, so I am not confident the
detector fires on the glyph alone rather than on a broader pattern that might
also match `›`. This is the single highest-value thing for context
investigation to check, and it is a grep, not a study. It also separates the
proposals cleanly: if confirmed, it is a one-line fix under A and strong
evidence that C is already costing you; it is not evidence for B, because B
would also have hardcoded a glyph per adapter and only found the mismatch with
the same corpus A needs anyway.

## Confidence ledger

Confident, from the packet:

- The three-release reactive-patch pattern.
- Collie's Tier 1 / Tier 2 split and where read-only lift falls.
- The prior-art scores for airemote versus collie.
- The two glyph code points as reported.

Guessing, and why the guess matters:

- That the underlying product bet (Claude-first viewer versus multi-agent
  terminal) is undecided. If it is already decided as multi-agent, Condition 2
  should be followed sooner by an actual per-agent split, still not a collie
  import.
- That `MENU_CURSOR_ITEM` matches the glyph literally rather than through a
  wider character class. If wider, the Codex failure may not exist and the
  finding downgrades to "still uncorpused, still unmeasured."
- What R, E, F encode in the prior-art scores. The direction of the comparison
  is what carries the recommendation, not the letters.

Held open deliberately, not resolved:

- Real Codex and Agy blast radius. No fixture, no measurement, no claim.

## What this run did not have

This run was blind by design. It did not read `block-classify.ts`, the fixture
data, the prior-art log, the coordination artifacts, or any release notes. Every
factual claim above is a restatement of what the packet supplied. A reader who
wants to act on the glyph finding should verify it in the module before
treating it as confirmed. A reader who wants to challenge the airemote-over-
collie condition should look at what the R/E/F scores actually measure; the
packet gave the scores but not the rubric.

Unresolved questions, for the record:

1. Is herdr-gateway a Claude-first viewer or a multi-agent terminal? Product
   owner's call, and it sets how far past Condition 2 to go.
2. Does `MENU_CURSOR_ITEM` fail on U+203A in practice? One grep plus one Codex
   capture answers it.
3. What do R, E, F mean in the prior-art log, and does airemote's F2 hide an
   assembly cost the packet did not surface?
