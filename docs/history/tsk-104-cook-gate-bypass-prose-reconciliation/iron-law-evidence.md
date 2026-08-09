# Iron Law evidence — tsk-104

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

## Why this is a false positive, verified against the real diff

`matchedFlags: ["audit"]` came from the word "audit" appearing in this
item's own stored `description` field ("...kèm decision record riêng...
triển khai fail-closed và audit trail có cấu trúc...") — the same shape of
description-keyword false positive `tsk-47e`'s own iron-law-evidence
already documented (`docs/history/context-md-enforcement-scope/iron-law-
evidence.md`), itself citing `tsk-slq`'s precedent.

The real changed-files list (`changedFiles()`, the same function
`classifyIronLaw` itself was called with) is:

```
docs/architecture-manifest.json
docs/history/tsk-104-cook-gate-bypass-prose-reconciliation/CONTEXT.md
docs/history/tsk-104-cook-gate-bypass-prose-reconciliation/plan.md
docs/history/tsk-1kh-architecture-manifest-missing-row/CONTEXT.md
docs/history/tsk-1kh-architecture-manifest-missing-row/plan.md
plugins/fgOS/skills/cook/SKILL.md
```

(The `tsk-1kh` paths are present because that item's fix — an unrelated,
separately-scoped `main`-regression discovered mid-session — was merged
into this branch locally so this item's own `npm test` verify could pass
against a green baseline; see `plan.md`'s own note. `tsk-1kh` returned and
was Iron-Law-evaluated separately on its own branch.)

Zero `.mjs`/`.js` source files. `plugins/fgOS/skills/cook/SKILL.md` is
markdown prose, not on `MODULE_RULES`'s self-modifying-capable list
(`src/evolve/iron-law.mjs:20-38`); `docs/architecture-manifest.json` is
JSON data, also not on that list. `matchedModules: []` is correct.

## Why no failing-test-first transcript is attached

Per `tsk-47e`'s own precedent for this exact shape: no code changed, so
there is nothing to write a failing test against. `plugins/fgOS/skills/
cook/SKILL.md` is prose read by a session, not executable code — no test
covers it (confirmed this session, `tsk-2ew`'s own `CONTEXT.md` D2:
`test/skills/fgos-mirror.test.mjs` only covers `.claude/skills/**`).
`npm test` was green before this diff (2743/2738/0 fail/5 skipped,
checkpoint after `tsk-1gj`) and stays green after (same counts, verified
directly in this worktree post-merge) — there is no behavior change for a
failing-test-first cycle to be run against.

## Verification source

- `src/evolve/iron-law.mjs` read directly — confirms `matchedFlags` is a
  pure description-text scan, independent of `filesChanged`.
- `changedFiles()` output above — the exact function/inputs
  `classifyIronLaw` was actually called with this item's own commits.
- `docs/history/context-md-enforcement-scope/iron-law-evidence.md` —
  precedent for a description-keyword false positive resolved by
  documenting it rather than fabricating evidence.
- `docs/history/tsk-104-cook-gate-bypass-prose-reconciliation/CONTEXT.md`
  D0-D3 and `plan.md`'s risk map — the decisions this evidence satisfies.
