# Herdr-Gateway Block Classification Scout Report

## 1. Current Signals (`block-classify.ts`)
The `block-classify.ts` file implements heuristics to identify structured text blocks to decide if they should be panned or wrapped. Key signals include:
- **Framing Rules (`isFramingRule`)**: Looks for continuous runs of box-drawing characters (e.g., `/[─-▟]/`) of length >= 8.
- **Menu Cursors (`MENU_CURSOR_ITEM`)**: Detects interactive choice menus using the `❯ 1.` pattern.
- **Summary Pairs (`countSummaryPairs`)**: Detects summary formats with adjacent bulleted questions (e.g., `● Question`) and arrowed answers (`→ Answer`).
- **Stable Gutters (`stableGutters`)**: Looks for vertically aligned whitespace columns (e.g., `ls -la` output).
- **Markdown Tables**: Checks for pipe `|` characters maintaining consistent columns.

## 2. Test Coverage (`block-classify.test.ts`)
The tests comprehensively cover both true positives and edge case rejections:
- **True Positives**: Box-drawn frames, tree renderings, markdown tables, diluting footers (for Claude Code boxes), numbered choice menus (even with varying descriptions), and review answer summaries.
- **False Positives (Rejections)**: Prose, stray box characters/arrows in text, and ordinary numbered lists without live cursors.
- **Behaviors**: Splits blocks at blank lines properly, ignores ANSI styling, maintains stability across content append events, and defaults to panning for structured content.

## 3. Specifications (`terminal-detail.md`)
**Rules R21-R28**:
- R21: Screen is read as blocks, split at blank lines.
- R22: Structured blocks (columns, box chars) keep their shape (pan).
- R23: Continuous text is broken to fit width (wrap).
- R24: The screen decides automatically; no manual override exists.
- R25: In cases of uncertainty, the system defaults to R22 (pan). Incorrectly panning is less destructive than incorrectly wrapping (which breaks formatting irrevocably).
- R26 & R27: The block's treatment is independent of screen width and does not re-flow dynamically as new content arrives.
- R28: Text selection/copying preserves original line breaks regardless of the display mode.

**Open Gaps**:
- Classifications are based on heuristics and can be wrong. Guessing wrap (R23) instead of pan (R22) destroys alignment permanently, hence the R25 bias toward panning.
- Terminals hold no record of where full-screen apps broke long lines naturally.
- The layout rules (R21-R28) have unit coverage but are not fully validated in real mobile browsers/devices (e.g., URL linkify and bottom-panel insets).

## 4. Commits 881fa33 & 15b1203
*Unable to retrieve exact diffs for commits 881fa33 and 15b1203 due to an execution error on the host system (`read-only file system` error in the agent CLI environment). However, the evidence of those commits is present in the analyzed files above, detailing the integration of the framing-rule, menu-cursor, and summary-pair signals.*
