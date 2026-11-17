# task-spec: fgos-clarifying

domain: core | lifecycle: Init | role: classifier | requires-skill: fgos-clarifying

## Input
- Raw submission text provided at submission time (untrusted string).
- Domain vocabulary (`clarifyingDomainVocabulary()` from `src/state/domain-registry.mjs`).

## Output
- Verdict object `{title?, description?, domain, domainUnsure?, question?}` returned directly to caller.
- Domain classification (one name from that vocabulary); when no domain fits, the unsure verdict `domain: null`, `domainUnsure: true` with a one-line question naming the candidate domains.
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
