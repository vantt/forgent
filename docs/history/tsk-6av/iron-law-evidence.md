# Iron Law evidence — tsk-6av

`classifyIronLaw` on this item's final diff returns `required: true`,
`matchedModules: []`, `matchedFlags: ["sự cố"]` (description-text keyword
match against `HEAVY_KEYWORDS`, not a files-changed match — see
`src/evolve/iron-law.mjs`'s own doc comment: description flags are always
computed independently of `filesChanged`).

```json
{"required":true,"matchedFlags":["sự cố"],"matchedModules":[]}
```

## Why this is a false positive, verified against the real diff

This item's diff touches exactly 9 paths (`git diff --name-only
main...fgw/tsk-6av -- . ':!.fgos'`, run live from the item's own branch),
none of them on `MODULE_RULES` (`src/evolve/iron-law.mjs:20-26` —
`src/runner/`, `src/report/entropy.mjs`, `src/evolve/`, `bin/fgos.mjs`,
`src/state/store.mjs`, `src/state/status-fsm.mjs`,
`src/intake/risk-keywords.mjs`, `src/intake/classify.mjs`,
`src/state/workflow-stage-graphs.mjs`):

```
.agents/skills/_shared/catchup-self-recovery.md
core/skills/_shared/catchup-self-recovery.md
docs/history/merge-approve-self-recovery-consolidation/RESEARCH.md
docs/history/merge-approve-self-recovery-consolidation/plan.md
plugins/fgOS/skills/_shared/catchup-self-recovery.md
plugins/fgOS/skills/approve/SKILL.md
plugins/fgOS/skills/merge-loop/SKILL.md
plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md
plugins/fgOS/skills/merge-next/SKILL.md
```

Zero `.mjs`/`.js` source files changed — no code, self-modifying-capable or
otherwise; every touched path is Markdown (skill prose or docs).
`matchedFlags: ["sự cố"]` came from the Vietnamese phrase "sự cố"
(incident/trouble) appearing literally in this item's own `description`
field, submitted in Vietnamese ("Merge pipeline đang thụ động khi gặp sự
cố...", "when it hits trouble/an incident") — `src/intake/risk-keywords.mjs`
lists `'sự cố'` verbatim in `HEAVY_KEYWORDS`. This is the same shape of
description-keyword false positive already documented for two other items
(`tsk-47e`'s `"audit"` matching a docs-only diff,
`docs/history/context-md-enforcement-scope/iron-law-evidence.md`; `tsk-4hk`'s
own `"sự cố"` match on an unrelated Markdown-only diff,
`docs/history/pick-cook-worktree-bypass-reminder/iron-law-evidence.md`) —
an item that reports or fixes a problem trips the same keyword an item
that literally causes an incident would.

## Why no failing-test-first transcript is attached

This item's diff has no code to write a failing test against: the
deliverable is a new shared skill-prose reference file
(`_shared/catchup-self-recovery.md`, mirrored 3 places) plus edits to
three consuming `SKILL.md`/reference files and this feature's own
`RESEARCH.md`/`plan.md`. `npm test` was green before this diff and stays
green after — confirmed live, run directly against this branch after the
implementation and after reconciling with a separately-landed overlapping
item (tsk-c5u): `node --test 'test/**/*.test.mjs'`, `3772 pass / 0 fail /
5 pre-existing skip`. There is no behavior change for a failing-test-first
cycle to be run against.

## Verification source

- `src/evolve/iron-law.mjs` and `src/intake/risk-keywords.mjs` read
  directly — confirm `matchedFlags` is a pure description-text scan
  against `HEAVY_KEYWORDS` (containing the literal string `'sự cố'`),
  independent of `filesChanged`.
- `git diff --name-only main...fgw/tsk-6av -- . ':!.fgos'` — confirms the
  real diff (9 Markdown/doc paths, `matchedModules: []` corroborated).
- `node --test 'test/**/*.test.mjs'` run live on this branch, post-merge
  with `main` (which itself now includes tsk-oet's fix for an earlier,
  unrelated pre-existing regression this item's own verify surfaced and
  reported separately) — `3772 pass / 0 fail / 5 skip`.
- `docs/history/pick-cook-worktree-bypass-reminder/iron-law-evidence.md`
  (`tsk-4hk`) and `docs/history/context-md-enforcement-scope/iron-law-evidence.md`
  (`tsk-47e`) — precedent for a description-keyword false positive
  resolved by documenting it rather than fabricating evidence.
