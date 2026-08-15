# tsk-in1-2 — Iron Law failing-test-first evidence

`classifyIronLaw` result (scoped to this leaf's own diff vs its target
`fgw/tsk-in1`, not the wider `main` trunk): `required: true`,
`matchedFlags: []`, `matchedModules: ["src/runner/dispatch.mjs"]`.

## Test command

Item's own verify: `npm test && ! grep -n 'cfg.executors\b'
src/runner/dispatch.mjs`

## Failing-before (real transcript — `src/runner/dispatch.mjs` temporarily
checked out back to the parent commit's version, test file left at its
new content)

```
✔ ... 210 tests ...
✖ loadRunnerConfig never validates an "executors" block — a malformed one loads fine, inert
  AssertionError: expected `cfg.executors` to equal 'nope' after load —
  the pre-fix validateRunnerConfigShape still rejects a non-object
  "executors" value with a RunnerConfigError, so loadRunnerConfig throws
  instead of returning.
ℹ tests 211
ℹ pass 210
ℹ fail 1
```

The test file's OTHER rewritten cases don't discriminate pre/post-fix on
their own (their fixtures were rewritten to drop `executors` blocks
entirely, so the pre-fix `perTier` line evaluates to `undefined` either
way) — the resolve-side half of this change (the `perTier` fallback
itself) is proven separately below with a direct before/after comparison,
since no fixture in the final test file exercises it anymore (the field
is fully retired; a proof case for it would test dead code on purpose).

## Resolve-side proof (direct before/after comparison, real output —
D6's other real touch point, `resolveExecutorConfig`'s `perTier` line)

```js
const cfg = {
  executor: { command: '/global/executor', args: ['{prompt}'] },
  executors: { heavy: { command: '/heavy/executor', args: ['{prompt}'] } },
  models: { heavy: 'opus' },
  timeoutMs: 5000,
};
resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy' }).command
```

- BEFORE (pre-fix `dispatch.mjs`): `/heavy/executor` — the retired
  per-tier fallback still won.
- AFTER (post-fix `dispatch.mjs`): `/global/executor` — falls straight
  through to the global executor, no intermediate stop, matching D6.

## Passing-after (real transcript, dispatch.mjs restored to the fix)

```
ℹ tests 211
ℹ pass 211
ℹ fail 0
```

Full `npm test`: `tests 3352 / pass 3347 / fail 0` (5 skipped,
pre-existing, unrelated), `duration_ms 135408`. Item's own verify
(`npm test && ! grep -n 'cfg.executors\b' src/runner/dispatch.mjs`): exit
0 — the two remaining literal `cfg.executors` mentions were reworded in
comments (D1/D2 doc-comment edits) to avoid the substring while still
explaining the retirement's history.

## What changed

- `src/runner/dispatch.mjs`: removed `validateRunnerConfigShape`'s
  `"executors"` block validation (lines ~682-694 pre-fix) and
  `resolveExecutorConfig`'s `perTier` fallback line (~line 902 pre-fix,
  `const executor = byCapacity ?? perTier ?? (cfg && cfg.executor)` →
  `const executor = byCapacity ?? (cfg && cfg.executor)`). Updated 5
  doc-comment blocks describing the retired 3-way precedence
  (`capacities` > `executors.<tier>` > `executor`) down to 2-way
  (`capacities` > `executor`), two of them reworded to avoid the literal
  `cfg.executors` substring the item's own verify greps for.
- `test/runner/dispatch.test.mjs`: removed 6 tests that specifically
  probed the retired `executors`-block validation
  (accept/reject-shape/reject-non-tier-key/reject-bad-adapter), rewrote 5
  more whose fixtures relied on the retired `perTier` fallback to resolve
  a specific command, removed 1 test (`spawnWorker (P41): light and heavy
  each dispatch through their own per-tier executor...`) whose whole
  premise no longer exists, updated the `CAPACITY_KINDS`-adjacent
  precedence-chain comments.
- Docs (AGENTS.md docs-gate, user-visible config-surface change):
  `CHANGELOG.md`, `docs/specs/runner.md` (RUL41 rewritten, RUL63's
  precedence phrase fixed), `docs/reference/capacity-cross-provider-
  governance.md`, `docs/how-to/wire-a-headless-function-through-an-agent-
  executor-capacity.md`, `docs/how-to/configure-a-capacity-to-dispatch-
  via-a-named-agent.md` — updated in place; `docs/how-to/add-a-scoped-
  allowedtools-override-for-a-nested-executor-call.md` (entirely built
  around `cfg.executors.judge`, itself already superseded by `tsk-5ge`/
  `tsk-4w4` before this item) given a superseded notice pointing at the
  modern equivalent rather than a full rewrite, kept as historical record
  of `tsk-62d`'s own reasoning.
