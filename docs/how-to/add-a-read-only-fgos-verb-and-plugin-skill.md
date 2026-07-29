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

## 3. Add the plugin skill wrapper

`plugins/fgOS/skills/<name>/SKILL.md`, same shape as `conflicts`'s:
ignore `$ARGUMENTS` for a no-arg verb, run the CLI via the literal
`${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
substitution (never a relative path — an installed plugin runs from a
copied cache location), and relay the `data` field back plainly without
reinterpreting it. No separate plugin manifest entry is needed — skills
are discovered by directory presence under `plugins/<name>/skills/`.

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
