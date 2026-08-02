# Iron Law evidence — tsk-47e

`classifyIronLaw` on this item's final diff returns `required: true`,
`matchedModules: []`, `matchedFlags: ["audit"]` (description-text
keyword match against `HEAVY_KEYWORDS`, not a files-changed match — see
`src/evolve/iron-law.mjs`'s own doc comment: description flags are always
computed independently of `filesChanged`).

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

## Why this is a false positive, verified against the real diff

This item's final diff touches exactly four paths, none of them on
`MODULE_RULES` (`src/evolve/iron-law.mjs:20-38` — `src/runner/`,
`src/report/entropy.mjs`, `src/evolve/`, `bin/fgos.mjs`,
`src/state/store.mjs`, `src/state/fsm.mjs`, `src/intake/risk-keywords.mjs`,
`src/intake/classify.mjs`, `src/state/workflow-stage-graphs.mjs`):

```
$ git diff main fgw/tsk-47e --stat
 .fgos/events.jsonl                                 | 13 ++
 docs/explanation/fgos-capture-points-and-the-why-gap.md | 34 ++
 docs/history/context-md-enforcement-scope/CONTEXT.md    | 91 ++
 docs/history/context-md-enforcement-scope/plan.md       | 44 ++
 4 files changed, 182 insertions(+)
```

Zero `.mjs`/`.js` source files changed — no code, self-modifying-capable
or otherwise. `matchedFlags: ["audit"]` came from the word "audit"
appearing in this item's own stored `description` field (written at
intake, e.g. "capture-recording-points-audit-260729-1745-report.md" and
references to bee's "audit" precedent in the acceptance criteria) — the
same shape of substring/contextual hit `tsk-slq`'s own iron-law-evidence
already documented for "auth" matching inside "authoring"
(`docs/history/tsk-slq/iron-law-evidence.md`).

## Why no failing-test-first transcript is attached

`tsk-slq`'s precedent supplies a real failing-then-passing test transcript
because that item's diff, despite also tripping the gate on a
description-keyword false positive, genuinely changed code (a real bug in
`validateDefinition`) — there was something to prove failing-then-fixed.
This item's diff has no code to write a failing test against: the
deliverable is the decision doc itself (`CONTEXT.md`/`plan.md`, per this
item's own D4: "the actual precondition-check code itself is a separate
follow-up item"). `npm test` was green before this diff and stays green
after (`node --test`, 2340 pass / 0 fail, run directly against this
branch — see the item's own `return` record, `passed: true`,
`aheadCount: 0`) — there is no behavior change for a failing-test-first
cycle to be run against.

## Verification source

- `src/evolve/iron-law.mjs` read directly — confirms `matchedFlags` is a
  pure description-text scan against `HEAVY_KEYWORDS`, independent of
  `filesChanged`.
- `git diff main fgw/tsk-47e --stat` — confirms the real diff (four
  non-code paths, `matchedModules: []` corroborated).
- `docs/history/tsk-slq/iron-law-evidence.md` — precedent for a
  description-keyword false positive resolved by documenting it rather
  than fabricating evidence.
