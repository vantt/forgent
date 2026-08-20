# task-spec: fgos-clarifying

domain: core | lifecycle: Init | role: classifier | requires-skill: fgos-clarifying

## Input
- Raw submission text provided at submission time (untrusted string).
- Registered domain vocabulary (`Object.keys(DOMAINS)` from `src/state/workflow-stage-graphs.mjs`).

## Output
- Verdict object `{title?, description?, domain, question?}` returned directly to caller.
- Domain classification (`coding`, `synthetic`, `triage`, `fixture-marketing`, etc., defaulting to `coding`).
- Optional restatement/rewrite of vague `title`/`description` reported via one-line change message (`ap thang roi bao lai mot dong`).
- Single concrete question when submission goal/intent is not understood (`chi hoi khi khong hieu`).
- **No state write** — verdict returned directly to launcher before item creation.

## Gates
- Soft: Silent by default (`chi hoi khi khong hieu`) — ask only on a genuine gap in understanding overall goal. Directly rewrite vague text (`ap thang roi bao lai mot dong`).
- Hard: Runs at Init before `fgos submit` creates an item; never writes state directly and never invokes CLI verbs.

## Verify-template
- N/A — Init submission intake classification, produces no code artifact.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| Submission intent is genuinely missing or ununderstandable | clarify-ask (sync) | user | submit-question | raw intent answer |
| Intent clear & domain classified | verdict (sync) | submit launcher | verdict | `{title?, description?, domain}` |
| No trigger matches | — return verdict directly — | | | |
