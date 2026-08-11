# Iron Law evidence — tsk-4hk

`classifyIronLaw` on this item's final diff returns `required: true`,
`matchedModules: []`, `matchedFlags: ["sự cố"]` (description-text keyword
match against `HEAVY_KEYWORDS`, not a files-changed match — see
`src/evolve/iron-law.mjs`'s own doc comment: description flags are always
computed independently of `filesChanged`).

```json
{"required":true,"matchedFlags":["sự cố"],"matchedModules":[]}
```

## Why this is a false positive, verified against the real diff

This item's final diff touches exactly three paths, none of them on
`MODULE_RULES` (`src/evolve/iron-law.mjs:20-26` — `src/runner/`,
`src/report/entropy.mjs`, `src/evolve/`, `bin/fgos.mjs`,
`src/state/store.mjs`, `src/state/fsm.mjs`):

```
$ git diff main --cached --stat -- docs/ plugins/
 docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md | 64 ++++++++++++++++++++
 plugins/fgOS/skills/cook/SKILL.md                                        |  7 +++
 plugins/fgOS/skills/pick/SKILL.md                                        | 10 ++++
 3 files changed, 81 insertions(+)
```

(`CONTEXT.md`/`plan.md` under the same feature dir landed in two earlier
commits on this branch, `ec60a0a`/`2f23e6c` — already accounted for in
`fgos-coding-planning`'s own gate approval, not new in this step's diff.)

Zero `.mjs`/`.js` source files changed — no code, self-modifying-capable or
otherwise; every touched path is Markdown. `matchedFlags: ["sự cố"]` came
from the Vietnamese phrase "sự cố" (incident) appearing literally in this
item's own `description` field ("Sự cố dọc đường: tôi làm sai quy trình 2
lần...", set at submit time) — `src/intake/risk-keywords.mjs:17` lists
`'sự cố'` verbatim in `HEAVY_KEYWORDS`. This is the same shape of
description-keyword false positive `tsk-47e`'s own iron-law-evidence
already documented for `"audit"` matching a docs-only diff
(`docs/history/context-md-enforcement-scope/iron-law-evidence.md`) — an
item that is *about* an incident trips the same keyword an item that
*fixes* one would.

## Why no failing-test-first transcript is attached

This item's diff has no code to write a failing test against: the
deliverable is the incident journal entry itself plus two `SKILL.md`
reminder notes (`CONTEXT.md` D1/D2). `npm test` was green before this diff
and stays green after (`node --test`, 2360 pass / 0 fail / 5 pre-existing
skip, run directly against this branch — see the item's own `return`
record). There is no behavior change for a failing-test-first cycle to be
run against.

## Verification source

- `src/evolve/iron-law.mjs` and `src/intake/risk-keywords.mjs:17` read
  directly — confirm `matchedFlags` is a pure description-text scan against
  `HEAVY_KEYWORDS` (containing the literal string `'sự cố'`), independent
  of `filesChanged`.
- `git diff main --cached --stat -- docs/ plugins/` — confirms the real
  diff (three Markdown paths, `matchedModules: []` corroborated).
- `docs/history/context-md-enforcement-scope/iron-law-evidence.md` —
  precedent for a description-keyword false positive resolved by
  documenting it rather than fabricating evidence.
