# Terminal-detail block classification: keep the flat OR-chain, build the corpus

Subject: `web/src/block-classify.ts` in herdr-gateway, `looksStructured()`
Written for: the operator who owns the 2026-08-11 decision, and the colleagues who will maintain this file

## The consequence first

Nothing in the code needs to change. The recommendation is to keep `looksStructured()` as a flat, ordered OR-chain of small named detectors and to decline the Pluggable Output Grammar registry (Proposal B).

What you gain by declining B: the file stays readable as one argument. When a block is mis-rendered, one person opens one function, reads the detectors top to bottom, and sees which one claimed the block and which earlier one deliberately stepped aside. That is the whole debugging story today, and it survives.

What you would lose by adopting B: that story gets cut into pieces that no longer reference each other. The stated example is `BOX_CHARS` excluding the arrow character precisely so a later summary detector can claim it. In the OR-chain that exclusion and its beneficiary sit a few lines apart and one comment explains both. In a registry, the exclusion lives in one grammar file and the beneficiary in another, and neither file can explain why the other exists. A future maintainer who sees the arrow exclusion in isolation will reasonably "fix" it, and the summary detector will silently stop firing. This is a real debuggability regression, not a style preference.

What B does not buy you: the registry is behaviourally a pure OR-chain. Same inputs, same verdicts, same ordering semantics. So the exchange is zero behavioural gain for a concrete loss in explainability. That is why this rejection is not the generic "you aren't gonna need it" argument. Even if you did need pluggability later, this specific shape would still be paying for it with the cross-detector notes.

## The one action that is authorized

Assemble the fixture corpus that phase-04 specified and never built, and score it as a confusion matrix.

The scoring rule follows directly from the operator's locked 2026-08-11 decision: classification is fully automatic, there is no UI control to correct it, and when the classifier is unsure it should err toward pan.

| Outcome | Meaning (inference, see below) | Tolerance |
|---|---|---|
| False-wrap | structured output rendered as wrapped prose | must be zero |
| False-pan | prose rendered in the pan (structured) mode | tolerated |

The asymmetry is the point. With no manual override, a false-wrap destroys a table, tree, or box drawing the user cannot recover. A false-pan makes a paragraph scroll sideways, which is annoying and recoverable. The corpus exists to prove the zero, and to catch the day a detector edit breaks it.

Deliverables for this action, as I read the mandate:

- A fixture corpus covering each named detector's positive cases, plus the exclusion cases (the arrow-vs-box case at minimum), plus plain prose negatives.
- A confusion-matrix report that fails on any false-wrap and merely reports false-pan counts.
- No change to `looksStructured()` itself. If the corpus reveals a false-wrap, that becomes a separate, evidenced decision, not a side effect of this task.

## Architecture second: why the flat chain is the right shape here

Proposals A and C are the same shape. A restates the status quo with intent; C is the status quo. Choosing between them is choosing whether to write down why the shape is deliberate. This document is that writing-down.

The properties that make the OR-chain fit this problem:

- **Order is semantics.** Detectors are tried in sequence and the first match wins. The ordering encodes precedence between overlapping signals. A flat list makes that precedence visible as line order. A registry would have to reintroduce ordering as configuration, which is the same information in a less legible place.
- **Exclusions are cross-detector by nature.** One detector narrows itself so another can claim the case. That relationship is bidirectional knowledge. It belongs in one place both detectors can see.
- **The detector set is small and named.** Small named functions in one chain are already the "plugins". The registry adds indirection without adding a capability the chain lacks.
- **The failure mode is asymmetric and locked.** The err-toward-pan rule is a property of the whole chain, not of any one detector. A flat function is the natural place to hold a whole-chain invariant and to assert it with a corpus.

## Defending this to colleagues

Expect two objections.

"We'll want to add grammars later." Adding a detector to an OR-chain is adding one small function and one line. Adding it to a registry is adding one file and one registration. Neither is hard. The chain is not the bottleneck on extensibility, so extensibility does not decide this.

"The function will get long." Length is a symptom to watch, not a reason to fragment now. The trigger for revisiting is concrete: when a cross-detector exclusion can no longer be explained by a comment its neighbour can see. Until then, fragmentation costs more than it saves.

## What I am confident about, what I am inferring, and why it matters

Confident, because stated in the mandate:

- The recommendation is A (equals C), rejecting B.
- The rejection ground is the split exclusion notes, not generic YAGNI.
- No code change is required.
- The single authorized action is the phase-04 corpus plus confusion matrix scored on false-wrap rate.
- The 2026-08-11 decision is locked: fully automatic, no UI control, err toward pan when unsure.

Inferred, and worth checking:

- **What "wrap" and "pan" mean.** I read them as the two terminal-detail rendering modes: wrap for prose, pan (horizontal scroll, layout preserved) for structured output. If pan means something else, the table above still holds structurally but the wording of the fixture labels should follow the codebase's terms.
- **That `looksStructured()` returns a boolean gate for pan.** The mandate calls it a detector chain and ties its output to wrap-versus-pan. If it instead returns a richer classification, the confusion matrix needs more than two columns, but the zero-false-wrap rule is unchanged.
- **The detector names beyond `BOX_CHARS`.** Only one is named. The corpus must be built against the real list, which this run could not read.
- **Whether phase-04 left a fixture format or location.** "Never-assembled" implies the intent exists somewhere. The builder should adopt whatever format phase-04 specified rather than invent one.

These inferences separate no candidates. A, B, and C are ranked identically under any resolution of them. They matter only for how the corpus is labelled and where it lives.

## What this document does not independently verify

- I could not confirm the current detector list, their order, or the exact `BOX_CHARS` exclusion comment.
- I could not confirm that phase-04's fixture spec exists or what shape it prescribes.
- I could not verify that the current false-wrap rate is zero. The mandate says it "must stay at zero", which implies it is believed to be zero today; the corpus is what would prove it.

A reader acting on this document should open `block-classify.ts` once to confirm the detector list before writing fixtures. Nothing in the recommendation itself depends on that read.

Altitude of this decision: one module, one function. Burden: low and fully reversible, since no code changes and the only artifact is a test corpus. Ratification signal: strong. The mandate arrives with the recommendation already formed and a locked upstream decision. This document ratifies with reasons rather than reopening.

Unresolved questions:

- Real detector names and order in `looksStructured()` (needs one file read, outside this run's scope).
- Whether phase-04 specified a fixture format or directory.
- Exact codebase vocabulary for the two rendering modes.
