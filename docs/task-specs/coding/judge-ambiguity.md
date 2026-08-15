# task-spec: judge-ambiguity

domain: coding | stage: discovery | position: implementer

## Input
- A claimed item at stage `discovery`, `title`/`refs` already committed.
- Any `judgeDiscovery` history already logged (`view.discovery[id]`).

## Output
- A verdict, `clear` or `unclear`, applied via `fgos discover --verdict`.
- On `clear`: the item's real `verify` command, resolved and stamped.
- On `unclear`: the item parked in `awaiting-human` with the specific
  question that made it unclear, and the stage advanced to `exploring`.

## Gates
- None owned at this stage — the verdict itself is the only checkpoint,
  and it is machine-alone (no `contextApprove`/`validateApprove` gate
  fires here).

## Verify-template
- N/A — this stage produces the item's own verify command, it does not
  run one itself.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A named library/API/concept surfaces that cannot be resolved from context already in hand | consult (sync) | researcher | consult | finding + clear/unclear verdict |
| The ambiguity needs a product decision, not a research answer | advise (async) | human-advisor | advise | answer, folded into the discovery verdict |
| No trigger matches | — self-judge and apply the verdict — | | | |
