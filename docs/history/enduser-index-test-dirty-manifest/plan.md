# enduser-index-test-dirty-manifest — plan

Item: `tsk-2ce`.

## Mode

**tiny** — flags counted: 0 of 10 (no auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
weak proof, multi-domain; the one existing-covered-behavior touch is a
mechanical hook addition to an already-passing test file, not a behavior
change under test). One file touched, one direct task. A `small`/
`standard` mode would overstate this — there is no gray area left after
`CONTEXT.md`'s D1/D2, and no split candidate exists (see step 5 below).

## Approach

Per `CONTEXT.md` D1: snapshot `docs/enduser-docs-index.json`'s real
content before any test in `test/report/enduser-index.test.mjs` calls
`runDocsIndex()`, restore it after the whole suite finishes — one
module-level `node:test` `before()`/`after()` pair, not a per-test
`try/finally`, since every test in this file that touches the manifest
shares the same file and there is no cross-test coupling that requires
restoring in between (the idempotency test at line ~206 already asserts
two back-to-back runs match each other, which restoring only once, after
both, does not disturb).

Per D2: the restore is unconditional — no worktree-vs-main branch, no
reuse of the existing `hasRealCompoundHistory()` detection for this
purpose (that helper stays scoped to the one assertion it already gates).

Mechanism (per `CONTEXT.md`'s pinned assumption): plain `fs`, no `git`.

```js
let manifestSnapshot; // string | undefined (undefined = file did not exist)

before(() => {
  try {
    manifestSnapshot = fs.readFileSync(MANIFEST_PATH, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    manifestSnapshot = undefined;
  }
});

after(() => {
  if (manifestSnapshot === undefined) {
    fs.rmSync(MANIFEST_PATH, { force: true });
  } else {
    fs.writeFileSync(MANIFEST_PATH, manifestSnapshot, 'utf8');
  }
});
```

Placed right after the existing `hasRealCompoundHistory` helper (before
the first `test(...)` call), mirroring this file's existing top-of-file
helper-then-tests layout. No new imports needed — `fs`/`node:test`'s
`before`/`after` are already imported or trivially added to the existing
`import { test } from 'node:test'` line.

No production code touched (`bin/fgos.mjs`, `src/report/enduser-index.mjs`
stay untouched, per `CONTEXT.md`'s feature boundary). No fixture tree
introduced — every existing assertion keeps reading the real, freshly
regenerated manifest during the test run; only the on-disk leftover after
the suite finishes changes.

Ordering: not applicable — one file, one change, nothing to sequence
against `fgos graph`'s critical path.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| snapshot/restore hook | low — pure fs read/write, mirrors existing `tutorialsDir` precedent in the same file | verify command below: assert `git diff --quiet` on the manifest path after the suite runs |
| interaction with the idempotency test (runs `docs-index` twice, compares outputs) | low — restore happens once, after both runs, so the in-suite comparison is unaffected | same test (`fgos docs-index is idempotent...`) must still pass unchanged |

## Split

Not needed — one honest piece of work, one file. No child items.

## Verify command

```
node --test test/report/enduser-index.test.mjs && git diff --quiet -- docs/enduser-docs-index.json
```

Proves both: the suite (including the unchanged idempotency and
real-tree assertions) still passes, AND the tracked manifest file is
byte-identical to its pre-test state afterward — the concrete symptom
`tsk-2ce` reports.
