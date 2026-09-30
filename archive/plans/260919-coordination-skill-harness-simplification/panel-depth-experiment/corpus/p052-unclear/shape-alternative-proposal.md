# shape-alternative-proposal (real, asgn_coordinator_driver_op_033)

## Dispatched objective (verbatim)

Propose a genuinely different architecture: a per-agent semantic grammar system (as already built for Claude Code in /home/vantt/projects/herdr-gateway/upstreams/collie/web/src) for herdr-gateway's own terminal-detail classification, replacing or supplementing the universal heuristic. Use ONLY absolute paths for everything you read (do not rely on your own current directory). Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Proposed a per-agent semantic grammar architecture for herdr-gateway's terminal-detail classification, inspired by the HarnessAdapter pattern in collie."
}
```

## Real agent-report.md (verbatim)

# Architecture Proposal: Per-Agent Semantic Grammar System

## Current State
Currently, `herdr-gateway` relies on a "universal heuristic" to perform terminal-detail classification across all agents. While a universal approach provides a baseline fallback, it struggles with the unique output structures, UI elements, and formatting rules of different terminal agents, leading to brittle heuristics and classification inaccuracies.

## Proposed Architecture
We propose replacing or supplementing the universal heuristic with a **per-agent semantic grammar system**, drawing direct inspiration from the pluggable detection seam already built for Claude Code in `/home/vantt/projects/herdr-gateway/upstreams/collie/web/src/lib/harness`.

### Core Components
1. **The Pluggable Adapter Interface**:
   Instead of a monolithic classification engine, we introduce an interface that each supported agent implements. For example, an adapter would define its own block-building pipeline over the terminal's styled lines, parsing out agent-specific UI chrome, status lines, input drafts, and semantic structures.

2. **The Adapter Registry**:
   A single decision site maps an `agent` identifier string to its specific grammar adapter. This acts as the centralized gatekeeper for the classification pipeline.

3. **Universal Fallback**:
   If an agent is not found in the registry (e.g., it is unknown or unverified), the system seamlessly falls back to the existing "universal heuristic" (the raw mirror). This preserves baseline functionality for unsupported agents while utilizing precision parsing where available.

### Benefits
- **Modularity and Extensibility**: Adding support for a new agent simply requires contributing a new adapter to the registry without modifying core classification logic.
- **Accuracy**: Adapters can implement precise parsers tailored to the exact formatting and grammar of their respective agents, eliminating the noise of a one-size-fits-all approach.
- **Stability**: The registry provides a single point of truth for classification policies, ensuring that rendering and state-machine assumptions do not drift apart.

This architectural shift will elevate `herdr-gateway`'s classification from a best-effort universal parser to a robust, agent-aware semantic engine.
