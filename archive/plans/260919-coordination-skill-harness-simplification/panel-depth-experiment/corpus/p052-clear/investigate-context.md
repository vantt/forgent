# investigate-context (real, asgn_coordinator_driver_op_020)

## Dispatched objective (verbatim)

Scout the real herdr-gateway repository using ONLY absolute paths (do not rely on your own current directory): /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's current signals and their evidence base, /home/vantt/projects/herdr-gateway/web/test/block-classify.test.ts's coverage, /home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md's R21-R28 rules and Open Gaps section, and the two most recent commits (881fa33, 15b1203) that added the framing-rule/menu-cursor/summary-pair signals. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Scouted block-classify.ts, block-classify.test.ts, terminal-detail.md (R21-R28, Open Gaps), and the signals added in recent commits."
}
```

## Real agent-report.md (verbatim)

# Scout Report

## `block-classify.ts`
- **Signals**: Added logic for `isFramingRule`, `MENU_CURSOR_ITEM` / `MENU_ITEM`, and `SUMMARY_QUESTION` / `SUMMARY_ANSWER`.
- **Evidence Base**: Uses these regular expressions and counting logic to identify structured outputs (Claude Code's choice menus, summary answers, boxed framing) and correctly classify them as "pan" instead of "wrap".

## `block-classify.test.ts`
- **Coverage**: Includes explicit tests for the new signals:
  - "accepts a footer whose rules are diluted by the content between them"
  - "accepts a numbered choice menu even though descriptions vary in length"
  - "accepts a 'Review your answers' question/answer summary"
  - Negative cases to avoid false positives (e.g., stray arrows or stray numbered lists).

## `terminal-detail.md` (R21-R28, Open Gaps)
- **R21-R28**: Define how the terminal handles text wrapping versus panning. Blocks are split at blank lines (R21). Structured blocks keep their shape and pan (R22), continuous text wraps to fit width (R23). When uncertain, defaults to pan (R25).
- **Open Gaps**:
  - Miss rates on judging structured vs. continuous text in real outputs are unmeasured.
  - Full-screen agent displays lose line-break info, forcing breaks where the agent chose rather than cleanly at the reader's width.
  - Rendered result not tested on real phones or browsers.

## Commits (881fa33, 15b1203)
- Implemented and tested the framing-rule, menu-cursor, and summary-pair signals to enhance terminal rendering for specific agent UI paradigms.
