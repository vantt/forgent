---
type: how-to
title: Add a read-only fgOS verb and its plugin skill
source_capture_ids: [tsk-2ew]
framework: diataxis
mode: how-to
---
# Add a read-only fgOS verb and its plugin skill

A recipe for adding a new pure-read CLI verb (no `.fgos/` mutation) and the
matching Claude Code plugin skill that wraps it — grounded in adding
`fgos merge list` / `/fgOS:merge-list`.

## 1. Write the pure function first, separately from the CLI

Put the actual logic in `src/state/` (or wherever the domain lives),
taking a work-state view and returning plain data — no `fs`, no
`Date.now()`, no event append. `fgos merge list` is a thin wrapper over
`mergeReadiness` (`src/state/graph-harness.mjs`); the CLI case is one line:

```js
case 'merge': {
  const sub = requireField(positional[0], 'merge requires a sub-verb: fgos merge <list>');
  if (sub === 'list') {
    return mergeReadiness(listWork(dir));
  }
  throw new StoreError('validation', `merge: unknown sub-verb "${sub}" (known: list).`);
}
```

A sub-verb pattern (`session`, `goal`) is the right shape once more than
one action is expected under the same verb name later — reject unknown
sub-verbs explicitly rather than silently falling through.

## 2. Register it in `COMMAND_REGISTRY`

`src/cli/command-registry.mjs` is the single source `--help --json` and
`test/cli/fgos-manifest.test.mjs` both check against — a verb dispatched
in `bin/fgos.mjs` but absent from the registry fails
`"manifest verb-name set equals the set of verbs runVerb() actually
dispatches"` immediately. Mirror an existing read-only entry
(`triage`/`conflicts`) for the boolean flags:

```js
touchesState: false,
requiresExistingStore: false,
externalEffect: false,
paginated: false,
```

A sub-verb needs a `positional`/`enum` shape like `session`'s registry
entry, not a flat `properties` object.

**Only mirror this block verbatim for a verb that reads and returns data —
never for one that writes any real file.** `docs-index` copied exactly
this block (`false`/`false`/`false`) despite writing
`docs/enduser-docs-index.json`, a real file outside `.fgos/`; it should
have been `externalEffect: true` from the start (`tsk-1wn`,
`docs/history/docs-index-repo-root-fix/CONTEXT.md` D2/D4). If the new
verb's handler ever calls `fs.writeFileSync`/`fs.appendFileSync` (or
similar) against anything outside `.fgos/`, set `externalEffect: true`
instead — and derive that write's target root from the SAME resolved
root `dir` uses, never a second, independent `process.cwd()` read (see
`docs/how-to/run-a-state-verb-from-inside-a-worktree.md`'s third case).

## 3. Add the plugin skill wrapper

`plugins/fgOS/skills/<name>/SKILL.md`, same shape as `conflicts`'s:
ignore `$ARGUMENTS` for a no-arg verb, run the CLI via the literal
`${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
substitution (never a relative path — an installed plugin runs from a
copied cache location), and relay the `data` field back plainly without
reinterpreting it. No separate plugin manifest entry is needed — skills
are discovered by directory presence under `plugins/<name>/skills/`.

**Always pass `--dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"`
on the `node "$FGOS_BIN" <verb> ...` line and its paired `fgos <verb> ...`
PATH-fallback line** — the same flag every write-verb skill already
carries. See the real bug this omission caused below: this is not
optional polish for a read-verb skill, it is the difference between a
correct result and a silently wrong one.

## A real bug this pattern prevents (`tsk-2ew`): a missing `--dir` looks like an empty backlog, not an error

All 10 existing read-verb plugin skills (`list`, `ready`, `triage`,
`show`, `stale`, `rollup`, `graph`, `check`, `conflicts`, `merge-list` —
including the very `conflicts` skill this doc names as the shape to
copy) shipped without `--dir` at all:

> "grep -c -- \"--dir\" on all 10 `plugins/fgOS/skills/{list,ready,...}
> /SKILL.md` returns 0 for every file. Every one of the 13 write-verb
> skills ... already passes `--dir` on every `fgos <verb>` call — the
> split is exactly read vs write."
> — real `docs/history/tsk-2ew-read-verb-skills-add-dir/CONTEXT.md`

A worktree never carries its own `.fgos/` by design (ADR0020). Without
`--dir`, a read-verb call from inside a worktree session — the normal
`/fgOS:pick` workflow — resolves against a non-existent local store and
returns an **empty result with exit 0**, not an error:

> "Đo trực tiếp từ worktree: `fgos list` -> 0 item, exit 0; cùng lệnh với
> `--dir <mainRoot>` -> 86 item."
> — real item description, `tsk-2ew`

The CLI does print a warning, but only to stderr — a plugin skill that
only pipes stdout never sees it. Worse, `list/SKILL.md`'s own closing
instruction ("if `data.work` is empty, say so plainly — an empty result
is valid, not a failure") was *correct* prose for a genuinely empty
backlog, but became exactly the wrong guidance for this specific failure
mode: a session in a worktree calling `/fgOS:list`/`/fgOS:ready`/
`/fgOS:triage` reported "nothing to do" against a real 86-item backlog,
and its own instructions told it that silence was the expected, valid
answer. The fix was mechanical once found (mirror the `--dir` pattern
onto all 10 files), but the danger is structural: a missing `--dir` on a
read-verb skill degrades to a plausible-looking wrong answer, never a
visible error — which is exactly why this step calls it out as
mandatory rather than a style preference.

## 4. Test at both layers

- The pure function gets its own `test/state/*.test.mjs` file (hand-built
  views, same style as `impact.test.mjs`/`graph-metrics.test.mjs`).
- The CLI verb gets its own tests in `test/cli/fgos.test.mjs`, using
  `run(cwd, [...])`/`tmpCwd()`/`envelopeData(...)`. **Build fixture items
  with an explicit `--verify true`, not `addOk`'s default (`npm test`)** —
  the sandbox has no `package.json`, so a real `npm test` call fails,
  silently parking an item `blocked` instead of `done` even though
  `approve` still exits 0. This produced one real, non-obvious test
  failure while adding `fgos merge list`'s own tests (a `proposed` item
  whose dep was expected to reach `done` stayed `blocked` instead, so the
  dependency-wait gate under test never saw a cleared dependency).
