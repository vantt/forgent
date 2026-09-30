# Interpretation Packet — Unit I21, H4 exposure class: invest further, or stop here?

Role: lead-advisor.

## 1. Who decides, and what the decision actually is

One person is deciding whether to invest further in closing the H4 exposure class. Concretely, H4 is: the generic `review` capability, declared with no `.prefer`, silently pinned all 8 [REDACTED] actors onto an unconfined executor. The round-2 fix restricted accepted resolutions to exactly `bindingSource === 'capability.prefer'` (binding.mjs:268).

The decision on the table has two parts that are easy to conflate:

- **Part A (the H4 question proper):** is the exposure class, as defined, closed by the round-2 fix, or does it need a separate kernel-hardening unit?
- **Part B (a residual the panel surfaced):** a bare-string `.prefer` silently falling through to an unconfined first invocation. Zero observed instances. Not H4, but adjacent.

Part A has a synthesis answer. Part B has a live disagreement. The person should not experience these as one yes/no.

## 2. Stated question vs. the actual worry

**Stated:** "Should we invest further in closing H4?"

**Inferred worry (moderate confidence):** not "is line 268 correct" but "did we fix an instance or a class, and do I have to keep watching this?" The phrase *exposure class* and the framing *no author action required* point to a person who wants to stop carrying H4 as an open item, and needs to know it is safe to put down.

**Why this inference matters:** if the worry is "can I put this down," the document's job is to name the one condition (F1) and the one residual (Part B) that would stop them from putting it down. If instead the worry is "is our binding model right at all," this would be a different, larger unit about sensitivity-aware routing. I lean to the first reading because the packet describes the steady state as *fail-closed, sensitivity-blind* without complaint; I am guessing that the person accepts unbound-as-default rather than wanting per-sensitivity routing. `intake.md` would settle this; I did not read it.

## 3. Vocabulary adopted, not corrected

I use the person's terms as given: *H4 exposure class*, *generic `review` capability*, *`.prefer`*, *bindingSource*, *round-2 fix*, *unbound*, *fail-closed*, *sensitivity-blind*, *consumer-side failure*, *author-judgment failure*, *kernel-hardening unit*, *doctor-check visibility*, *defense-in-depth*, *move-only-on-evidence*, *F1*. I do not rename "unbound" to "unresolved" or "kernel-hardening" to "guard," even where a shaper might.

## 4. Altitude

Two altitudes are present in one question, and that is the main interpretive hazard:

- **Module altitude:** binding.mjs:268 and, conditionally, resolve.mjs. This is where Part A lives. Small, reversible, already mostly done.
- **Policy altitude:** whether this dispatch path should carry defense-in-depth guards against zero-observed-instance residuals, or move only on evidence. This is where Part B lives. It is a team posture question wearing a module-sized coat.

Mixing them is how a one-line guard becomes a hardening unit. The person's question ("invest further") is phrased at policy altitude; the synthesis answer is at module altitude. Both are legitimate. The document should keep them apart.

## 5. Burden of the decision

- **Reversibility:** high on both sides. The round-2 fix is in. A guard in resolve.mjs would be additive. A doctor check is additive. Nothing here is a one-way door.
- **Cost:** opening a kernel-hardening unit is a scheduling and attention commitment, not a large code commitment. Not opening it costs a residual with no observed instance.
- **Commitment already made:** the round-2 fix. The person is not deciding whether to fix H4; that happened. They are deciding whether to keep spending on it.
- **Authority:** three panel roles disagree on Part B. The packet says this goes to the person. I read that as: the person has the authority, and the panel has declined to launder a values choice through more analysis. That is correct behavior, not a gap.

## 6. Ratification signal

**Inference (moderate-to-high confidence):** for Part A, the decision is effectively already made, and what is being asked is ratification. Signals: the synthesis recommendation is stated as *confirm the round-2 fix already closes*; the question is framed as *invest further* (a stop/go on a default of "no"); no one in the packet argues H4-as-defined is still open.

**Why it matters:** if this is ratification, the honest document says so, and reduces the person's remaining work to (1) check F1 and (2) decide Part B. If I am wrong and the person is genuinely uncertain about Part A, then the confinementSensitive point in §9 is the part they most need.

For Part B, there is no ratification signal. It is genuinely open.

## 7. Confidence map

**Confident (given directly in the packet):**
- The round-2 fix restricts accepted resolutions to `bindingSource === 'capability.prefer'`.
- Under that fix, any future capability with no `.prefer` falls to unbound: fail-closed, sensitivity-blind, no author action required.
- H4 was a consumer-side failure: a `confinement.mode: required` declaration existed and no code read it.
- No code change is required for the H4 question itself.

**Guessing (and why the guess matters):**
- That the person accepts sensitivity-blind unbound as the steady state (§2). Separates "close H4 and stop" from "open a sensitivity-aware binding unit."
- That F1 is unchecked because nobody looked, not because it is hard to check. If it is hard, the recommendation's only condition is not cheap, and the person should know that before treating Part A as closed.
- That the ratification read (§6) is right. If wrong, §9 carries more weight.

**Held open (not mine to collapse):**
- Whether the bare-string `.prefer` fall-through is reachable today. The packet says zero observed instances; it does not say unreachable. This is the substance of Part B and stays with the person.

## 8. The recommendation, as synthesized, and its one condition

**Part A:** confirm the round-2 fix closes the H4 exposure class as defined. Open no separate kernel-hardening unit for H4.

**Conditioned on F1:** whether any dispatch-time path re-resolves an operation by capability NAME rather than by the bound preferExecutor. This is a single unchecked observation. If the answer is yes, the recommendation inverts: the guard must move into resolve.mjs, and a unit is warranted. If no, Part A is closed.

I want to be plain that F1 is the hinge, not a footnote. A "confirm and stop" that skips F1 is a confirm on faith. The check is an observation, not a design task; it belongs before the person signs off, not after.

## 9. Why a confinementSensitive flag is not the answer

A `confinementSensitive` flag would ask capability authors to declare sensitivity. H4 was not an author-judgment failure. The declaration already existed (`confinement.mode: required`); the failure was that no consumer read it. Adding a second declaration nobody reads would not have prevented H4. This matters for anyone tempted to treat "add a flag" as the cheap hardening: it addresses a failure that did not happen.

## 10. The live disagreement, held open, goes to the person

**Position 1 (system-shaper, architecture-critic):** close the bare-string `.prefer` fall-through structurally now, in the dispatch path, even with zero observed instances. Rationale: defense-in-depth; a silent unconfined first invocation is exactly the H4 shape, and the cost of the guard is small.

**Position 2 (alternative-shaper):** put doctor-check visibility in first, and touch the dispatch path only once there is an observed instance. Rationale: move only on evidence; the path was just fixed, and every additional guard on it is surface area.

**What this is:** a values trade-off between defense-in-depth and move-only-on-evidence. More evidence does not resolve it, because the disagreement is about how to act in the absence of evidence. I am not picking a side, and I am not smoothing it into "do both," which would quietly commit the person to the structural change.

**What each commits the person to, stated without preference:**
- Position 1: one more change to a dispatch path, justified by shape rather than incident.
- Position 2: a residual that stays open until something trips the doctor check, plus the doctor check itself.

## 11. What the person has to do

1. Have F1 checked. One observation.
2. If F1 is no: ratify Part A as closed. If yes: open the resolve.mjs unit.
3. Decide Part B between the two positions in §10. This is a posture choice; the panel has correctly not made it for you.

Unresolved questions: whether F1 is cheap; whether the bare-string fall-through is reachable; whether sensitivity-blind unbound is the wanted steady state.
