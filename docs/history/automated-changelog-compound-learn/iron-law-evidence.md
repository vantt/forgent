# Iron Law evidence — tsk-469

`classifyIronLaw` on this item's final diff returns `required: true`,
`matchedModules: []`, `matchedFlags: ["audit"]` (description-text keyword
match against `HEAVY_KEYWORDS`, not a files-changed match — see
`src/evolve/iron-law.mjs`'s own doc comment: description flags are always
computed independently of `filesChanged`).

```json
{"required":true,"matchedFlags":["audit"],"matchedModules":[]}
```

## Why this is a false positive, verified against the real diff

This item's final diff (relative to `main`'s merge-base, the same shape
`changedFiles` computes) touches exactly three paths, none of them on
`MODULE_RULES` (`src/evolve/iron-law.mjs:20-38` — `src/runner/`,
`src/report/entropy.mjs`, `src/evolve/`, `bin/fgos.mjs`,
`src/state/store.mjs`, `src/state/fsm.mjs`, `src/intake/risk-keywords.mjs`,
`src/intake/classify.mjs`, `src/state/workflow-stage-graphs.mjs`):

```
$ git diff main...fgw/tsk-469 --stat
AGENTS.md                                          |  2 +
CHANGELOG.md                                       | 28 +++++++++++++
docs/history/automated-changelog-compound-learn/plan.md | 47 ++++++++++++++++++++++
3 files changed, 77 insertions(+)
```

Zero `.mjs`/`.js` source files changed — no code, self-modifying-capable or
otherwise. `matchedFlags: ["audit"]` came from the word "audit" appearing in
this item's own stored `description` field ("audit install/setup/config/
doctor ngay 2026-08-07 phat hien repo hoan toan khong co CHANGELOG.md...")
— the exact same shape of description-keyword false positive
`tsk-47e`'s own iron-law-evidence already documented for "audit" matching a
docs-only diff (`docs/history/context-md-enforcement-scope/
iron-law-evidence.md`).

## Why no failing-test-first transcript is attached

This item's diff has no code to write a failing test against: the
deliverable is `CHANGELOG.md` itself plus one added sentence in `AGENTS.md`
(D-tsk12m-A/D-tsk12m-C, per `plan.md`). `npm test` was run directly against
this branch: 2068 pass / 1 fail / 1 cancelled / 5 pre-existing skip. The one
failure (`test/docs/launcher-vocabulary-guard.test.mjs`, the "orchestrator"
pinned-term guard) flags four files unrelated to this item's footprint
(`docs/history/backlog-execution-reconciliation/RECONCILIATION.md`,
`docs/history/tsk-4eu-executors-key-tier-validation/iron-law-evidence.md`,
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`,
`plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md`) —
none of which this item touches (`git diff main...fgw/tsk-469` above lists
only `AGENTS.md`/`CHANGELOG.md`/this feature's `plan.md`, and none contain
the string "orchestrator"). `git log --oneline -1` on the offending
RECONCILIATION.md file shows it landed on `main` via `f86c426`, predating
this item entirely — a pre-existing failure, not a regression from this
diff. The one cancelled test (`test/cli/fgos.test.mjs`, a pending-promise
timeout) is a known flake unrelated to any file this item touches. There is
no behavior change here for a failing-test-first cycle to be run against.

## Verification source

- `src/evolve/iron-law.mjs` and `src/intake/risk-keywords.mjs` read
  directly — confirm `matchedFlags` is a pure description-text scan against
  `HEAVY_KEYWORDS`, independent of `filesChanged`.
- `git diff main...fgw/tsk-469 --stat` — confirms the real diff (three
  non-code paths, `matchedModules: []` corroborated).
- `npm test` run directly on this branch — 2068 pass / 1 fail / 1 cancelled
  / 5 skip; the one failure and one cancellation traced above to causes
  outside this item's footprint.
- `docs/history/context-md-enforcement-scope/iron-law-evidence.md` —
  precedent for the identical "audit" description-keyword false positive,
  resolved by documenting it rather than fabricating evidence.
