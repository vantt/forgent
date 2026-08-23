# task-spec: fgos-researching

domain: core | role: researcher | scope: stage-agnostic | requires-skill: fgos-researching

## Input
- Specific question or research goal to investigate.
- Existing context (item description, prior Q&A, prior verdicts, `view.discovery[id]`).

## Output
- Grounded research findings with concrete `file:line` or URL citations.
- Accumulating log entries appended under dated sections in `docs/history/<feature>/RESEARCH.md`.
- Verdict object `{clear: true, verify?: string}` OR `{clear: false, question: string}` returned directly to caller.
- **No state write** — verdict returned directly to calling skill/verb.

## Gates
- Soft: Search repository (`rg`) first; external search (`WebSearch`/`WebFetch`) only for terms not found in repo. Parallel independent sub-queries dispatched as 6-field contracted units via Task-tool.
- Hard: Stage-agnostic (never assumes or reads caller stage). Never decides scope, architecture, or code changes; never overwrites `RESEARCH.md`.

## Verify-template
- When `clear: true`: Runnable verify command string when goal calls for one.
- When `clear: false`: N/A.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| Independent research sub-query needs parallel branch | dispatch-branch (sync) | helper task | contracted-task | grounded findings digest |
| Research round completed | verdict (sync) | caller | research-verdict | `{clear, verify?, question?}` |
| No trigger matches | — record findings in RESEARCH.md and return verdict — | | | |
