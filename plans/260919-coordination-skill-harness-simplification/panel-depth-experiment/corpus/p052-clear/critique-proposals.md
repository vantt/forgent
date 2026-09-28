# critique-proposals (real, asgn_coordinator_driver_op_024)

## Dispatched objective (verbatim)

Attack the strongest of these three real Phase 5 proposals for /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification -- not the weakest. Proposal A (system-shaper): keep looksStructured() as a flat, ordered OR-chain of small named detectors, not a pluggable registry -- the only consumer (terminal-render.ts) reads just block.mode, never detector reasoning. Proposal B (alternative-shaper): a Pluggable Output Grammar architecture, a registry of layout signatures replacing the monolithic heuristics. Proposal C (constraint-advocate): keep the current architecture (pure, OR-combined, independently-testable structural detectors with hardcoded thresholds) because it is the only shape that stays cheaply unit-testable without a browser/corpus. Use ONLY absolute paths for anything you read (e.g. /home/vantt/projects/herdr-gateway/web/src/block-classify.ts). Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Attacked Proposal A as the strongest proposal, highlighting how its reliance on consumer output shape ignores internal maintainability and producer-side scaling."
}
```

## Real agent-report.md (verbatim)

# Architecture Critique: Attacking Proposal A

Proposal A is the strongest of the three because it leverages a core architectural truth: YAGNI (You Aren't Gonna Need It) driven by the actual consumer contract. It correctly observes that `terminal-render.ts` only consumes a binary `block.mode` (wrap vs pan), so exposing internal reasoning via a pluggable registry (Proposal B) adds no value to the caller. 

However, Proposal A's logic contains a fatal flaw: **it conflates the shape of the output with the architecture of the implementation.**

While the *consumer* only needs a boolean, the *producer* side (the classification logic itself) must handle an ever-expanding universe of CLI output formats. By keeping `looksStructured()` as a flat, ordered OR-chain of small named detectors within a single file, Proposal A guarantees that `block-classify.ts` will degrade into a monolithic "God Function." 

Here is why Proposal A fails at scale:

1. **Violation of the Open/Closed Principle**: Every new CLI layout (e.g., a new Claude Code prompt style, a new `git log` graph) requires modifying the core `looksStructured` function. It forces developers to touch a highly sensitive code path just to add support for a new tool.
2. **Regression Risk**: In a flat OR-chain, every new heuristic risks unintentionally catching prose or edge cases that should have fallen through to later detectors (or wrapped). There is no isolation.
3. **Cognitive Overload**: The file already mixes distinct domains: box-drawing ratio logic, Markdown pipe parsing, Claude Code menu cursors, and answer-summary pairs. As the list grows, understanding the interaction between these ad-hoc regexes and loop constructs becomes impossible.

Even if the output is just a boolean, the internal composition of these heuristics must be modular. The architecture must protect the core system from the endless churn of CLI format updates, which a flat OR-chain completely fails to do.
