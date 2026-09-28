# critique-proposals (real, asgn_coordinator_driver_op_035)

## Dispatched objective (verbatim)

Attack the strongest of these three real proposals for whether herdr-gateway's terminal-detail classification (/home/vantt/projects/herdr-gateway/web/src/block-classify.ts) should stay a universal content-shape heuristic or move to a per-agent grammar. Proposal A (system-shaper): stay in-system -- the classifier already reads only a block's own text, never agent identity, and is locked into docs/specs/terminal-detail.md's fail-closed-toward-pan spec. Proposal B (alternative-shaper): a per-agent semantic grammar, inspired by the HarnessAdapter pattern in /home/vantt/projects/herdr-gateway/upstreams/collie. Proposal C (constraint-advocate): keep the universal-heuristic architecture, patched reactively per counter-example rather than via a maintained per-agent grammar. Use ONLY absolute paths for anything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Attacked Proposal B: importing Collie's HarnessAdapter is massive over-engineering because word-wrapping (unlike keystroke injection) carries only a cosmetic risk profile.",
  "attacked_proposal": "Proposal B (alternative-shaper)"
}
```

## Real agent-report.md (verbatim)

# Architecture Critique: Rejecting Proposal B

Proposal B is arguably the strongest architectural pivot on the table. It correctly observes that `block-classify.ts` is already violating its "universal" mandate by hardcoding agent-specific regexes (e.g., Claude's `SUMMARY_QUESTION` and `MENU_CURSOR_ITEM`). Proposal B seeks to formalize this via the `HarnessAdapter` pattern from `collie`, giving each agent its own parser.

**However, Proposal B fatally misunderstands the risk profile of its domain.**

Collie uses the `HarnessAdapter` pattern because it maps terminal output to **executable native buttons** (Tier 2 interactive). A false positive in Collie injects a stray keystroke into a live, running shell—a destructive capability. To mitigate this, Collie requires a heavy architecture: strict fixture corpora, capability fences, pure detectors, and a dedicated registry to fail closed.

`herdr-gateway`'s `block-classify.ts`, by contrast, maps terminal text purely to **visual layout** (`wrap` vs `pan`). As `terminal-detail.md` dictates, the design is intentionally asymmetric: *"getting it wrong in the R22 direction leaves the block exactly as it always looked"*. The cost of a false positive is purely cosmetic.

Importing Collie's heavy, registry-bound `HarnessAdapter` machinery just to decide CSS word-wrapping is architectural overkill. It introduces Tier-2 complexity (fixture maintenance, CI gates) to solve a Tier-0 problem where the fallback (panning) is already acceptable. We should reject Proposal B's over-engineering; if a global heuristic (Proposal C) occasionally mis-wraps a line due to a regex collision, the blast radius is microscopic compared to the maintenance burden of a per-agent registry.
