# investigate-context (real, asgn_coordinator_driver_op_031)

## Dispatched objective (verbatim)

Scout the real herdr-gateway repository using ONLY absolute paths (do not rely on your own current directory): /home/vantt/projects/herdr-gateway/web/src/block-classify.ts and /home/vantt/projects/herdr-gateway/web/src/terminal-render.ts (the universal heuristic), /home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md's R21-R28 and Open Gaps, and /home/vantt/projects/herdr-gateway/upstreams/collie/web/src (the vendored per-agent grammar reference -- look for grammar/wizard.ts, prompt-select, and chrome-detection files) -- report what each approach actually costs and covers today, not in the abstract. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Scouted herdr-gateway codebase comparing the universal block classification heuristic against Collie's per-agent grammar approach. The universal approach uses generic structural markers with a pure client-side algorithm. The per-agent grammar uses strict, UI-coupled regex and line counting tailored exclusively for Claude Code."
}
```

## Real agent-report.md (verbatim)

# Agent Report: Terminal Heuristics vs Per-Agent Grammars

## Overview
This report summarizes the findings from scouting the `herdr-gateway` repository to compare the two current approaches for interpreting terminal output: the universal heuristic (`block-classify.ts`) and the vendored per-agent grammars (`upstreams/collie/`).

## 1. Universal Heuristic (`block-classify.ts` & `terminal-render.ts`)
**What it covers:** 
It attempts to universally classify blocks of terminal output (separated by blank lines) into either `pan` (structured data like tables or menus) or `wrap` (continuous prose). According to `docs/specs/terminal-detail.md` (R21-R28), the decision is made strictly on the content per-block.
**What it costs:**
- **Performance:** Low computational cost. It's a pure client-side function running over styled lines.
- **Accuracy / Maintenance:** It relies on generic signals: empty column gutters, framing rules (box-drawing characters `[─-▟]`), Markdown pipes, and bullet/arrow summary pairs. As noted in the `terminal-detail.md` Open Gaps, if it guesses wrong towards `wrap`, it breaks alignment irrecoverably. For full-screen apps, terminal line wrap metadata is lost, so it has to guess purely based on character arrangement.

## 2. Per-Agent Grammar (`upstreams/collie/web/src/lib/harness/claude/`)
**What it covers:**
It covers specific interactive elements exclusively for **Claude Code**:
- `wizard.ts`: Detects multi-question wizards (the "Focus area -> Scope -> Submit" stepper).
- `prompt-select.ts`: Detects single-choice numbered menus.
- `chrome.ts`: Strips specific Claude Code TUI elements (input box, status lines, background agent footers) from the tail of the buffer to allow native UI overlays.

**What it costs:**
- **Fragility / Maintenance:** Extremely high. The logic is heavily coupled to Claude Code's exact output shape. It relies on hardcoded string matching (e.g. `"1. Submit answers"`, `ready to submit your answers?`), specific regexes for checkboxes (`/([☐☒☑✔✅])/`), and rigid line-counting window boundaries (e.g., `MAX_STATUS_LINES = 3`, `MAX_DRAFT_LINES = 12`).
- **Scalability:** Poor. Any UI change by Anthropic can break the detection. Adding new agents requires writing entirely new, bespoke, fixture-driven grammars.

## Conclusion
The universal heuristic provides a low-maintenance, generic fallback for improving terminal readability on mobile devices. The per-agent grammar approach provides rich, reliable native UI integration but incurs heavy technical debt due to its brittle dependency on exact TUI formatting, and currently only supports Claude Code.
