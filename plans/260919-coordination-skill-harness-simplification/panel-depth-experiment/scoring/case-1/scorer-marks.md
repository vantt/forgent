# Blind scorer report — case-1

Scoring inputs only: `question.md`, `redteam-findings-source.md`, `control-objections-source-X.md`, `control-objections-source-Y.md`, `explanation-X.md`, `explanation-Y.md`, `ground-truth.md`. Findings lists were frozen from the three source critiques before matching against either explanation. PRESENT requires the same object + same risk/failure + same consequence in any wording (adopt / condition-on / name-and-rebut). No partial credit. No inference beyond the text.

## RT findings (frozen list)

**RT-1.** Keeping Proposal A (the flat OR-chain) ignores internal maintainability and producer-side scaling by leaning on consumer output shape.

- Quote: "ignores internal maintainability/producer-side scaling by leaning on consumer output shape."

**RT-2.** `looksStructured` is a dumping ground of hardcoded, tool-specific heuristics (Claude Code menu; "Review your answers" summary); as supported CLI producers grow, the flat OR-chain will balloon into an unmaintainable, brittle regex nightmare / accumulating technical debt, so ranking A as near-zero risk is wrong on substance.

- Quote: "The `looksStructured` function is a dumping ground of hardcoded, highly specific heuristics targeting exact tools. It explicitly searches for \"Claude Code's own menu\" (`MENU_CURSOR_ITEM`, `MENU_ITEM`) and \"Claude's own 'Review your answers' summary\" (`SUMMARY_QUESTION`, `SUMMARY_ANSWER`). As the number of supported CLI tools (producers) grows, this flat OR-chain will inevitably balloon into an unmaintainable, brittle regex nightmare."

**RT-3.** The decision set omits a legitimate low-overhead hybrid: extract the heuristics into an array of modular, independently testable predicate functions (Strategy pattern; `type Classifier = (lines: string[]) => boolean`; `HEURISTICS.some(...)`), which addresses producer-side maintainability/scaling without a grammar registry.

- Quote: "A simple, legitimate hybrid would be to extract the heuristics into an array of modular predicate functions (the Strategy pattern) conforming to a simple interface, e.g., `type Classifier = (lines: string[]) => boolean`. […] `HEURISTICS.some(h => h(content))`. This approach completely solves the critic's valid maintainability and producer-scaling concerns while requiring practically zero architectural overhead."

Excluded from the frozen list (process or pure agreement, not decision substance): dismissal-as-dishonest / rubber-stamp; B-as-deliberate-strawman / false-dichotomy engineering; "panel deliberation was a sham"; agreement that B is a YAGNI/unmotivated abstraction.

## CX findings (frozen list)

**CX-1.** Proposal A conflates consumer output shape with implementation architecture: the caller only needs a boolean, but the producer must handle an expanding universe of CLI formats.

- Quote: "it conflates the shape of the output with the architecture of the implementation."

**CX-2.** Keeping `looksStructured()` as a flat, ordered OR-chain of named detectors in one file guarantees `block-classify.ts` will degrade into a monolithic God Function.

- Quote: "By keeping `looksStructured()` as a flat, ordered OR-chain of small named detectors within a single file, Proposal A guarantees that `block-classify.ts` will degrade into a monolithic \"God Function.\""

**CX-3.** Open/Closed violation: every new CLI layout requires modifying core `looksStructured`, forcing a touch of a highly sensitive path to add a tool.

- Quote: "Every new CLI layout (e.g., a new Claude Code prompt style, a new `git log` graph) requires modifying the core `looksStructured` function. It forces developers to touch a highly sensitive code path just to add support for a new tool."

**CX-4.** Regression risk: in a flat OR-chain, a new heuristic can unintentionally catch prose or edge cases that should have fallen through; there is no isolation.

- Quote: "In a flat OR-chain, every new heuristic risks unintentionally catching prose or edge cases that should have fallen through to later detectors (or wrapped). There is no isolation."

**CX-5.** Cognitive overload: the file already mixes distinct domains (box-drawing ratio, Markdown pipes, Claude menu cursors, answer-summary pairs); as the list grows, interactions among ad-hoc regexes and loops become impossible to understand.

- Quote: "The file already mixes distinct domains: box-drawing ratio logic, Markdown pipe parsing, Claude Code menu cursors, and answer-summary pairs. As the list grows, understanding the interaction between these ad-hoc regexes and loop constructs becomes impossible."

**CX-6.** Internal composition of the heuristics must be modular so the architecture can absorb CLI-format churn; a flat OR-chain fails that.

- Quote: "the internal composition of these heuristics must be modular. The architecture must protect the core system from the endless churn of CLI format updates, which a flat OR-chain completely fails to do."

**CX-7.** A pluggable registry adds no value to the caller because `terminal-render.ts` only consumes binary `block.mode` (wrap vs pan).

- Quote: "`terminal-render.ts` only consumes a binary `block.mode` (wrap vs pan), so exposing internal reasoning via a pluggable registry (Proposal B) adds no value to the caller."

**CX-8.** No demonstrated Phase 5 need for runtime-pluggable / third-party detectors; a registry today is YAGNI plugin-boilerplate for a need that does not exist.

- Quote: "No demonstrated Phase 5 requirement for runtime-pluggable or third-party detectors. Adding one today is registry-shaped, plugin-boilerplate abstraction for a need that doesn't exist yet (YAGNI)."

**CX-9.** The six checks are empirically patched special cases, not orthogonal grammars; independently-registered units risk losing the interaction context that makes each check correct.

- Quote: "The 6 existing checks are not clean orthogonal \"grammars\" — they're empirically patched special cases discovered against real false positives […] Forcing these into independently-registered units risks losing the interaction context that makes each one correct."

**CX-10.** Asymmetric-risk domain as stated in this source: a wrongly-panned structured block is unrecoverable (no UI control), while a wrongly-wrapped prose block just matches old behavior.

- Quote: "a wrongly-panned structured block is \"unrecoverable\" for the user (no UI control to fix it), while a wrongly-wrapped prose block just matches old behavior."

**CX-11.** Debuggability (reading top-to-bottom why a block classified as it did) is a safety property; dynamic registration/dispatch is strictly harder to trace than a linear `if` chain.

- Quote: "debuggability — being able to read top-to-bottom why a block classified the way it did — is a safety property here, not a style preference. Dynamic registration/dispatch is strictly harder to trace than a linear `if` chain."

**CX-12.** If registration order or which detectors are active becomes configurable, that risks breaking the invariant that a verdict depends only on the block's own text (never viewport, never external state).

- Quote: "Risks quietly breaking the documented invariant that a verdict depends only on the block's own text (never viewport, never external state) if registration order or which detectors are active becomes configurable."

**CX-13.** Proposal B carries full rewrite/migration cost against six heuristics with no shown correctness or extensibility win.

- Quote: "Full rewrite/migration cost against 6 heuristics with no corresponding correctness or extensibility win shown."

**CX-14.** Forward risk of A: as detectors accumulate, chain order/documentation discipline must hold so independent ORs do not quietly become order-dependent.

- Quote: "Only forward risk: as detectors accumulate, chain order/documentation discipline needs to hold so independent ORs don't quietly become order-dependent."

**CX-15.** A and C are not independent designs — they produce the same already-shipping code and differ only in justification; the real fork is B versus not-B.

- Quote: "A and C are not two independent designs — they produce the same code (the code that already exists), differing only in which justification is foregrounded (structural purity vs. testability). The real fork in the road is B […] versus not-B (A/C, status quo)."

**CX-16.** Unresolved whether any concrete Phase 5 requirement (externally-registered / user-defined layout signatures) drives B, or whether B is speculative.

- Quote: "Was there a concrete Phase 5 requirement driving Proposal B (e.g. an actual need for externally-registered/user-defined layout signatures), or is it speculative?"

Excluded: ranking C as already-testable/zero-cost (agreement); "A costs nothing because it already ships" (restatement); inaccessible op_021/022/023 (process).

## CY findings (frozen list)

Control-objections-source-Y.md is byte-for-byte the same critique as source-X. Frozen CY list is therefore the same atoms, re-numbered:

**CY-1.** Proposal A conflates consumer output shape with implementation architecture: the caller only needs a boolean, but the producer must handle an expanding universe of CLI formats.

- Quote: "it conflates the shape of the output with the architecture of the implementation."

**CY-2.** Keeping `looksStructured()` as a flat, ordered OR-chain of named detectors in one file guarantees `block-classify.ts` will degrade into a monolithic God Function.

- Quote: "By keeping `looksStructured()` as a flat, ordered OR-chain of small named detectors within a single file, Proposal A guarantees that `block-classify.ts` will degrade into a monolithic \"God Function.\""

**CY-3.** Open/Closed violation: every new CLI layout requires modifying core `looksStructured`, forcing a touch of a highly sensitive path to add a tool.

- Quote: "Every new CLI layout (e.g., a new Claude Code prompt style, a new `git log` graph) requires modifying the core `looksStructured` function. It forces developers to touch a highly sensitive code path just to add support for a new tool."

**CY-4.** Regression risk: in a flat OR-chain, a new heuristic can unintentionally catch prose or edge cases that should have fallen through; there is no isolation.

- Quote: "In a flat OR-chain, every new heuristic risks unintentionally catching prose or edge cases that should have fallen through to later detectors (or wrapped). There is no isolation."

**CY-5.** Cognitive overload: mixed domains (box-drawing, Markdown pipes, Claude menu, answer-summary); interactions become impossible as the list grows.

- Quote: "The file already mixes distinct domains: box-drawing ratio logic, Markdown pipe parsing, Claude Code menu cursors, and answer-summary pairs. As the list grows, understanding the interaction between these ad-hoc regexes and loop constructs becomes impossible."

**CY-6.** Internal composition must be modular to absorb CLI-format churn; a flat OR-chain fails that.

- Quote: "the internal composition of these heuristics must be modular. The architecture must protect the core system from the endless churn of CLI format updates, which a flat OR-chain completely fails to do."

**CY-7.** A pluggable registry adds no value to the caller because `terminal-render.ts` only consumes binary `block.mode`.

- Quote: "`terminal-render.ts` only consumes a binary `block.mode` (wrap vs pan), so exposing internal reasoning via a pluggable registry (Proposal B) adds no value to the caller."

**CY-8.** No demonstrated Phase 5 need for runtime-pluggable / third-party detectors; a registry today is YAGNI plugin-boilerplate.

- Quote: "No demonstrated Phase 5 requirement for runtime-pluggable or third-party detectors. Adding one today is registry-shaped, plugin-boilerplate abstraction for a need that doesn't exist yet (YAGNI)."

**CY-9.** The six checks are empirically patched special cases, not orthogonal grammars; independently-registered units risk losing interaction context.

- Quote: "The 6 existing checks are not clean orthogonal \"grammars\" — they're empirically patched special cases […] Forcing these into independently-registered units risks losing the interaction context that makes each one correct."

**CY-10.** Asymmetric-risk domain as stated in this source: a wrongly-panned structured block is unrecoverable; a wrongly-wrapped prose block matches old behavior.

- Quote: "a wrongly-panned structured block is \"unrecoverable\" for the user (no UI control to fix it), while a wrongly-wrapped prose block just matches old behavior."

**CY-11.** Debuggability (reading top-to-bottom why a block classified as it did) is a safety property; dynamic registration/dispatch is strictly harder to trace than a linear `if` chain.

- Quote: "debuggability — being able to read top-to-bottom why a block classified the way it did — is a safety property here, not a style preference. Dynamic registration/dispatch is strictly harder to trace than a linear `if` chain."

**CY-12.** Configurable registration order / active detectors risks breaking the text-only (never viewport / never external state) verdict invariant.

- Quote: "Risks quietly breaking the documented invariant that a verdict depends only on the block's own text (never viewport, never external state) if registration order or which detectors are active becomes configurable."

**CY-13.** Proposal B carries full rewrite/migration cost against six heuristics with no shown correctness or extensibility win.

- Quote: "Full rewrite/migration cost against 6 heuristics with no corresponding correctness or extensibility win shown."

**CY-14.** Forward risk of A: independent ORs may quietly become order-dependent as detectors accumulate.

- Quote: "Only forward risk: as detectors accumulate, chain order/documentation discipline needs to hold so independent ORs don't quietly become order-dependent."

**CY-15.** A and C are not independent designs — same already-shipping code; real fork is B versus not-B.

- Quote: "A and C are not two independent designs — they produce the same code (the code that already exists) […] The real fork in the road is B […] versus not-B (A/C, status quo)."

**CY-16.** Unresolved whether any concrete Phase 5 requirement drives B, or whether B is speculative.

- Quote: "Was there a concrete Phase 5 requirement driving Proposal B (e.g. an actual need for externally-registered/user-defined layout signatures), or is it speculative?"

## RT marks in X

- **RT-1 — ABSENT.** X never states that A leans on consumer output shape or that doing so ignores producer-side scaling. Relaying that "the critic raised a valid attack on Proposal A" names process, not this atom.
- **RT-2 — ABSENT.** X never states that the hardcoded tool-specific OR-chain will balloon into an unmaintainable regex/tech-debt dump as producers grow. It locates the defect in *which shapes are recognised*, not in how detectors are arranged.
- **RT-3 — PRESENT.** Same object (Strategy-pattern array of modular predicates / iterated named units), same gap (third option never evaluated), same claimed cheapness (same behaviour / same file / no debuggability objection).
  - Quote: "An array of modular predicate functions — a Strategy-pattern refactor. Same behaviour, same OR-composition, same file if you like; each detector extracted into its own named unit and the chain becomes an iteration over them."

## RT marks in Y

- **RT-1 — ABSENT.** Y never mentions consumer output shape as a justification error, nor producer-side scaling as ignored.
- **RT-2 — ABSENT.** Y's expected objection "The function will get long" is not this atom (no producers-grow / hardcoded tool-specific heuristics / brittle regex nightmare / technical debt). No partial credit.
- **RT-3 — ABSENT.** Y never names a Strategy-pattern / iterated-predicate hybrid as a missing third option. "Small named functions in one chain are already the \"plugins\"" is a claim that A already has plugin-like shape, not the hybrid.

## CX marks in X

- **CX-1 — ABSENT.** No "output shape vs implementation architecture" conflation claim.
- **CX-2 — ABSENT.** No God-Function / monolithic-degradation claim.
- **CX-3 — ABSENT.** No Open/Closed / sensitive-path claim. Adding detectors is treated as later corpus-driven work, not as an architectural failure.
- **CX-4 — ABSENT.** No isolation/regression claim about new heuristics in the flat OR-chain catching prose. The BOX_CHARS/summary story is aimed at splitting under B, not at OR-chain isolation.
- **CX-5 — ABSENT.** No mixed-domain cognitive-overload claim.
- **CX-6 — ABSENT.** X does not assert that internal composition *must* be modular or that the flat OR-chain fails to absorb CLI churn. Naming the hybrid as unevaluated is RT-3, not this atom.
- **CX-7 — ABSENT.** No `terminal-render.ts` / binary `block.mode` consumer-contract claim. "B buys nothing in behaviour" is a different object (A/B functional identity).
- **CX-8 — ABSENT.** "Not on YAGNI grounds — that argument is available" names the slogan without the atom (no Phase 5 pluggable-detector requirement / need does not exist).
- **CX-9 — PRESENT.** Same object (cross-detector interaction context, arrows excluded so the summary detector can fire), same failure (independent modules/registry lose that context), same consequence (silent breakage with no trace).
  - Quote: "One constant is narrowed so a different detector can claim what it gave up. Today those two notes sit forty lines apart and a reader hits both. Under B they live in a box-drawing grammar module and a q-and-a-summary grammar module respectively."
- **CX-10 — ABSENT.** X's asymmetry is the opposite polarity: laid-out block wrongly *wrapped* is unrecoverable; prose wrongly *panned* matches old behavior. Same-consequence test fails; no inference that the source misspoke.
- **CX-11 — PRESENT.** Same object (debuggability of classification under B vs the linear chain), same risk (B's split/dynamic shape is harder to trace), same consequence (you cannot see why a verdict happened; not a style point).
  - Quote: "B is behaviourally identical to A and pays for that identity with a specific, concrete loss of debuggability." / "the summary shape breaks with no trace back to the arrow."
- **CX-12 — ABSENT.** No text-only / never-viewport / never-external-state invariant.
- **CX-13 — ABSENT.** No rewrite/migration-cost claim against six heuristics.
- **CX-14 — ABSENT.** X says order is unobservable today; it does not warn that independent ORs may become order-dependent.
- **CX-15 — PRESENT.** Same object (A and C are the same shape/code), same consequence (the live fork is B vs not-B).
  - Quote: "Proposal C — the status quo, which is Proposal A. Same shape, different label."
- **CX-16 — ABSENT.** No unresolved-question about a concrete Phase 5 requirement driving B.

## CY marks in Y

- **CY-1 — ABSENT.** No conflation-of-output-shape claim.
- **CY-2 — ABSENT.** "The function will get long" is not God-Function degradation.
- **CY-3 — ABSENT.** "Adding a detector […] is adding one small function and one line" / "the chain is not the bottleneck on extensibility" does not state OCP or a sensitive-path cost. Different consequence; no partial credit.
- **CY-4 — ABSENT.** No isolation/regression-on-new-heuristic claim.
- **CY-5 — ABSENT.** No mixed-domain cognitive-overload claim.
- **CY-6 — ABSENT.** Y argues the flat chain is the right shape; it does not state a modularity *requirement* or that the OR-chain fails to absorb churn.
- **CY-7 — ABSENT.** No `terminal-render.ts` / `block.mode` consumer-contract claim.
- **CY-8 — ABSENT.** Rejection "is not the generic 'you aren't gonna need it' argument" names YAGNI without asserting no Phase 5 pluggable-detector requirement.
- **CY-9 — PRESENT.** Same BOX_CHARS↔summary interaction-context object, same registry-split failure, same silent-break consequence.
  - Quote: "BOX_CHARS excluding the arrow character precisely so a later summary detector can claim it. […] In a registry, the exclusion lives in one grammar file and the beneficiary in another […]. A future maintainer who sees the arrow exclusion in isolation will reasonably \"fix\" it, and the summary detector will silently stop firing."
- **CY-10 — ABSENT.** Y's polarity is inverted vs this source: false-*wrap* of structured output is unrecoverable; false-*pan* of prose is recoverable. Same-consequence test fails.
- **CY-11 — PRESENT.** Same object (top-to-bottom reading of which detector claimed the block), same risk (B cuts that story into unreferenced pieces), same consequence (debuggability regression, not style).
  - Quote: "When a block is mis-rendered, one person opens one function, reads the detectors top to bottom, and sees which one claimed the block and which earlier one deliberately stepped aside." / "This is a real debuggability regression, not a style preference."
- **CY-12 — ABSENT.** "A registry would have to reintroduce ordering as configuration" is a legibility claim, not the text-only / never-viewport invariant.
- **CY-13 — ABSENT.** No rewrite/migration-cost claim.
- **CY-14 — ABSENT.** Y treats order as present-tense semantics ("first match wins"), not as a future independent-OR → order-dependent risk.
- **CY-15 — PRESENT.** Same object (A and C are the same shape); live choice is writing down why, not a third architecture.
  - Quote: "Proposals A and C are the same shape. A restates the status quo with intent; C is the status quo."
- **CY-16 — ABSENT.** No Phase 5 requirement gap for B.

## Dispositions

PRESENT marks only.

- **RT-3 in X — DISPOSED.** Recommendation conditions on the hybrid: no merits/debuggability objection; not done now as sequencing (corpus/false-wrap first); expires when false-wrap is zero; would change if the hybrid made the §1 fixes easier.
- **CX-9 in X — DISPOSED.** Adopted as the actual reason to reject B (matched exclusion notes must stay colocated).
- **CX-11 in X — DISPOSED.** Adopted as the "real" anti-B argument (concrete loss of debuggability, not YAGNI).
- **CX-15 in X — DISPOSED.** Adopted: treat A and C as one shape; keep A; reject B.
- **CY-9 in Y — DISPOSED.** Adopted as the anti-B reason (arrow exclusion and summary detector must remain mutually visible).
- **CY-11 in Y — DISPOSED.** Adopted as the reason to decline B (keep the one-function top-to-bottom debugging story).
- **CY-15 in Y — DISPOSED.** Adopted: A equals C; recommend A; reject B.

No PRESENT mark is MENTIONED-ONLY.

## GT-1 marks

GT-1 is the 30.8% false-wrap rate (4/13 on the R25-gated core tier). GT-2 is not applicable.

- **explanation-X — CONSISTENT.** States the figure in-band and treats it as material to sequencing.
  - Quote: "false wrap (must be zero): 4/13 = 30.8%" (also: "The direction with a hard bar on it is at 31%."). Hand-traced-prediction caveats do not move this out of 30–32% or call the rate negligible/non-existent.
- **explanation-Y — CONTRADICTS.** Makes no 30–32% claim and instead treats the current rate as believed to be zero.
  - Quote: "I could not verify that the current false-wrap rate is zero. The mandate says it \"must stay at zero\", which implies it is believed to be zero today; the corpus is what would prove it."
