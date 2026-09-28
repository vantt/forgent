# Red Team Assessment: Architecture Advisory Panel Conduct

## Objective
Independently attack the architecture-advisory-panel's conduct on the `universal-heuristic-vs-per-agent-grammar` question for herdr-gateway's terminal-detail classification.

## Findings

### 1. The Paradox of Rejecting B while Ranking C as Riskiest
**Question:** Is it internally consistent to reject B (per-agent HarnessAdapter) for being disproportionate engineering weight while ranking C (reactive patching) as the riskiest?
**Assessment:** The panel's stance is technically coherent but exposes a failure of scope. It is consistent to argue that a full `HarnessAdapter` (Proposal B) is overkill because the failure mode is merely cosmetic (mis-wrapped UI text), unlike `collie` where it prevents safety-critical keystroke injection (incident #34). However, ranking Proposal C as the "riskiest" refers to architectural rot: reactive patching without a fixture corpus guarantees regressions and unbounded technical debt. By framing the debate this way, the panel accepted a paralyzing dichotomy: either over-engineer for a cosmetic issue, or accept guaranteed architectural degradation.

### 2. The Ignored Middle Path
**Question:** Did anyone seriously evaluate a middle path (e.g., formalizing the already-existing but undocumented per-agent special cases inside `block-classify.ts` into an explicit, tested per-agent extension point)?
**Assessment:** **No.** The panel engaged in architectural self-deception. They debated a "universal heuristic" (Proposals A/C) as if it were a pure, abstract reality. In truth, `[REDACTED]/web/src/block-classify.ts` is already infected with per-agent grammar. It contains hardcoded logic specifically for Claude Code, explicitly documented in comments:
- `MENU_CURSOR_ITEM` ("Claude Code's own menu")
- `SUMMARY_QUESTION` / `SUMMARY_ANSWER` ("Claude's own answer-summary layout")

The panel completely missed the middle path: acknowledging that the heuristic is already per-agent, and formalizing these special cases into a lightweight extension registry (short of a full `HarnessAdapter`). They debated abstract proposals while ignoring the reality of the code they were supposedly governing.

### 3. PBI-061's Undocumented Blast Radius
**Question:** Is PBI-061's undocumented blast radius on Codex/Agy panes being taken seriously or waved past?
**Assessment:** **Waved past.** PBI-061 (`backlog.md`) explicitly notes an open risk: `(4) chỉ áp Claude (giống collie) hay Codex/Agy cũng có convention tương tự — chưa biết` (whether the convention only applies to Claude or also Codex/Agy is unknown). The architecture panel allowed this to remain a footnote rather than a central constraint. By maintaining a nominally "universal" classifier that secretly relies on Claude-specific heuristics, they are actively risking false positives on Codex and Agy panes. The panel failed to enforce the isolation required by their own "universal" stance.

## Conclusion
The panel's conduct was intellectually dishonest. They debated a false dichotomy (pure universal vs. heavy HarnessAdapter) while actively ignoring the fact that the codebase already implements a sloppy, undocumented middle path (hardcoded Claude heuristics in a "universal" file). They ranked the status quo (C) as the riskiest approach yet failed to propose the obvious, cheap structural fix: extracting the existing per-agent hacks into a formalized extension point.
