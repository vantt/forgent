# Iron Law evidence — tsk-2tk

`classifyIronLaw` on this item's final committed diff returns:

```json
{
  "required": true,
  "matchedFlags": ["schema"],
  "matchedModules": []
}
```

## Why this is a false positive, verified against the real diff

`matchedFlags: ["schema"]` came from the word "schema" appearing in this
item's own stored `description` field ("...không đổi logic/schema/test
assertion nào..." — the sentence disclaiming a schema change, not
describing one). This is the exact same description-keyword false
positive shape `docs/history/tsk-104-cook-gate-bypass-prose-reconciliation/
iron-law-evidence.md` already documented for the word "audit" (itself
citing `tsk-47e`'s and `tsk-slq`'s precedent) — and the same "schema"
keyword also tripped this item's own `fgos-coding-validating` gate check
earlier in this same session (see `plan.md`'s discovery/validating trail),
confirming it is the description text, not the diff, that keywords are
matching.

The real changed-files list (`changedFiles()`, the same function
`classifyIronLaw` itself was called with) is:

```
.agents/skills/fgos-coding-planning/SKILL.md
.claude/skills/fgos-coding-planning/SKILL.md
docs/explanation/gate-bypass-design.md
docs/explanation/why-cooks-never-auto-approve-prose-lost-to-gate-bypass.md
docs/explanation/why-heavy-keywords-matching-moved-to-word-boundaries.md
docs/history/tsk-224-post-merge-prose-drift/RESEARCH.md
docs/history/tsk-224-post-merge-prose-drift/plan.md
docs/reference/gate-bypass-config.md
plugins/fgOS/skills/cook/SKILL.md
plugins/fgOS/skills/fgos-coding-planning/SKILL.md
src/cli/command-registry.mjs
src/intake/plan.mjs
```

Two `.mjs` files are present (`src/cli/command-registry.mjs`,
`src/intake/plan.mjs`), but neither is on `MODULE_RULES`'s
self-modifying-capable path list (`src/evolve/iron-law.mjs:20-38`: only
`src/runner/`, `src/report/entropy.mjs`, `src/evolve/`, `bin/fgos.mjs`,
`src/state/store.mjs`, `src/state/status-fsm.mjs`,
`src/intake/risk-keywords.mjs`, `src/intake/classify.mjs`,
`src/state/workflow-stage-graphs.mjs`) — confirmed by reading the rule
list directly. `matchedModules: []` is correct. The rest are Markdown
prose/comment edits and two decision-history docs, none of which are
`.mjs`/`.js` source.

## Why no failing-test-first transcript is attached

Same precedent as `tsk-104`: this item changed zero executable behavior —
every edit is a string literal in a description field
(`command-registry.mjs:386,391`), a comment
(`src/intake/plan.mjs:531-538`), or Markdown prose (the 8 skill/doc
files). There is no logic branch, no schema, no function signature
touched to write a failing test against. `node --test
test/skills/fgos-mirror.test.mjs test/cli/command-registry.test.mjs`
(this item's own recorded `verify`) was green before this diff (10/10,
baseline run in this same worktree) and stays green after (10/10, rerun
post-commit) — a mirror/drift-guard check, not a behavior check, because
there is no behavior here to check. Full `npm test` was 3148/0 fail on
`main` before this item's work began and 3149/0 fail after (one
pre-existing net-new test unrelated to this diff, verified by the parent
cook session's own baseline capture) — no regression.

## Verification source

- `src/evolve/iron-law.mjs` read directly — confirms `matchedFlags` is a
  pure description-text scan, independent of `filesChanged`, and confirms
  neither touched `.mjs` file is on `MODULE_RULES`.
- `changedFiles()` output above — the exact function/inputs
  `classifyIronLaw` was actually called with, against this item's real
  committed diff (`fgw/tsk-2tk`, commit `8d4dde2d`).
- `docs/history/tsk-104-cook-gate-bypass-prose-reconciliation/
  iron-law-evidence.md` — precedent for a description-keyword false
  positive resolved by documenting it rather than fabricating evidence,
  itself citing `docs/history/context-md-enforcement-scope/
  iron-law-evidence.md` and `tsk-slq`.
- `docs/history/tsk-224-post-merge-prose-drift/RESEARCH.md`/`plan.md` —
  the discovery/planning trail this evidence closes out.
