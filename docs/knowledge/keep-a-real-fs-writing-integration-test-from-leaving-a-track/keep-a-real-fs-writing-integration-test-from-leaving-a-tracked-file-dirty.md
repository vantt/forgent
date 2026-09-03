---
framework: diataxis
mode: how-to
---
# Keep a real-fs-writing integration test from leaving a tracked file dirty

A recipe for the case where an integration test deliberately exercises a
CLI's real production write path — against the real repo tree, not a temp
fixture — but that write path targets a tracked file, so a plain test run
leaves the working tree dirty. Grounded in `tsk-2ce`
(`docs/history/enduser-index-test-dirty-manifest/CONTEXT.md`):
`test/report/enduser-index.test.mjs`'s integration tests run `fgos
docs-index` against the real repo `docs/` tree, overwriting the tracked
`docs/enduser-docs-index.json` as a side effect of `npm test`.

## The trap this recipe avoids

Two tempting "fixes" were explicitly ruled out of scope:

- Switching the test to a temp fixture tree — but the test's own existing
  comment already locks in why not: `runDocsIndex()` is "Deliberately run
  against the REAL repo cwd (never a temp fixture) ... this cell's
  must_haves forbid a proxy test that would pass with the manifest
  absent."
- Adding a CLI `--out` flag so the test can redirect the write elsewhere —
  out of scope per the item's own locked feature boundary: "changing
  `docs-index`'s production write path, adding a CLI output-path flag ...
  the null values in a worktree run are an accurate reflection of that
  checkout's real (absent) `.fgos/` state, not a bug to fix."

Both would have changed what the test actually exercises. The real fix
touches only the test's own bookkeeping around the write, not the write
path itself.

## The fix: snapshot before, restore after — unconditionally

```js
let manifestSnapshot;

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

Locked reasoning for this exact shape (`CONTEXT.md` D1/D2):

- Plain `fs.readFileSync`/`fs.writeFileSync` (or `fs.rmSync` if the file
  was absent before) — never a `git checkout`-based restore. This matches
  the same test file's existing `tutorialsDir`/`hiddenDir` rename-then-
  restore precedent, and avoids the risk of a git-based restore silently
  discarding a real, uncommitted edit to the manifest that predates the
  test run.
- The restore runs unconditionally — in a linked worktree AND in the main
  checkout, even when `.fgos/` state is real and the regenerated content
  legitimately differs from what's committed: "`npm test`'s job is
  verification, not regeneration; keeping the tracked manifest current is
  `fgos-indexing`'s separate, deliberate action, never an `npm test` side
  effect." One restore path, no worktree-vs-main branch in the test
  itself.

## Why this mattered beyond the one test file

The bug wasn't cosmetic — it made `npm test` unsafe as any item's own
`verify` command, since `approve` re-verifies on `main`: a test run that
silently dirties a tracked file leaves `git diff --exit-code
docs/enduser-docs-index.json` (or any similar guard) failing on the very
next `approve`, even though nothing about the actual change under test was
wrong. Discovered as friction while working an unrelated item (`tsk-65n`):
"had to `git checkout` the file back before committing."

## Root cause, for context

Run from a linked worktree (no `.fgos/`, per ADR0020), `docs-index`'s
folded outcomes view is empty, so every `sourceCaptureId` in the
regenerated manifest comes back `null` — a plain `npm test` degrades the
tracked file's content, not just its timestamp. `bin/fgos.mjs`'s own
`docs-index` handler write is otherwise idempotent-by-construction (skipped
when computed content is byte-identical to what's already on disk) — the
dirtying only happens because the *content* itself differs when the
folded view is degraded.
