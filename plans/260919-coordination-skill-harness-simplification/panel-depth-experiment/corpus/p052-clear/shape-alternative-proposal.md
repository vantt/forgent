# shape-alternative-proposal (real, asgn_coordinator_driver_op_022)

## Dispatched objective (verbatim)

Propose a genuinely different architecture for /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification -- not a strawman, a real candidate that solves the same problem differently (e.g. a per-agent grammar, a different signal composition, or something else entirely). Use ONLY absolute paths for everything you read (do not rely on your own current directory). Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Proposed a Pluggable Output Grammar architecture using a registry of layout signatures to replace monolithic heuristics."
}
```

## Real agent-report.md (verbatim)

# Alternative Architecture: Pluggable Output Grammars

## The Current State
The current architecture in `block-classify.ts` uses a monolithic sequence of bottom-up heuristics. It checks for spaces (gutters), then box characters, then markdown pipes, then specific regexes for Claude menus and summaries. As new agents and CLI tools introduce new layouts, this function will grow linearly into a fragile, order-dependent list of edge cases and regexes.

## The Proposed Architecture: Registry of Layout Signatures
Instead of a single `looksStructured` function that asks "is this structured?", we shift to a top-down, modular architecture: **Pluggable Output Grammars**.

1. **Layout Signatures**: We define a registry of independent modules, each responsible for recognizing a specific class of layout.
   - `UnixColumnarSignature`
   - `MarkdownTableSignature`
   - `AgentMenuSignature`
   - `BoxDrawingSignature`
2. **Confidence Scoring**: Instead of returning a boolean, each signature returns a `MatchScore` (0.0 to 1.0) for a given block.
3. **Context Injection**: The classifier can accept external context (e.g., `active_command: "git log"` or `agent: "claude"`). Signatures can boost their confidence if the context matches their domain.
4. **The Classifier Engine**: The engine evaluates the block against the registered signatures. If the maximum confidence score exceeds a threshold, the block is classified as `pan`. The engine can run signatures in parallel.

## Why this is genuinely different
- **Decoupled**: Adding support for a new AI agent's unique output format no longer risks breaking the heuristics for standard Unix tables. You simply register a new signature.
- **Explainable**: When a block is panned, the system knows *why* (e.g., "Matched AgentMenuSignature with 0.95 confidence"), rather than just hitting `true` somewhere inside a 50-line heuristic function.
- **Extensible**: Allows users, plugins, or extensions to inject custom grammars for bespoke internal tools without modifying the core classifier logic.
