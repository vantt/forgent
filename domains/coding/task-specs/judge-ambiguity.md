# task-spec: judge-ambiguity

domain: coding | stage: discovery | role: implementer | requires-skill: fgos-coding-discovering

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
| A named library/API/concept surfaces that cannot be resolved from context already in hand — call as many times as there are independent ambiguous points | consult (sync) | researcher | consult | finding, folded into the `clear`/`unclear` verdict |
| No trigger matches | — self-judge and apply the verdict — | | | |

**No `advise` at this stage, by the skill's own hard rule.** Discovery is
machine-alone (D6) — it never asks a human directly. A gap needing a
product decision is precisely what an `unclear` verdict routes to
`exploring` for; `advise` belongs to `lock-decisions.md`'s own table, not
here. (Corrected from an earlier draft that wrongly carried an `advise`
row — found wiring `fgos-coding-discovering` for real, tsk-2t9c D14.)
