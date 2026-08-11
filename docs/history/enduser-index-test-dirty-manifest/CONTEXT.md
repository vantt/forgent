# enduser-index-test-dirty-manifest — locked decisions

Item: `tsk-2ce`. Bug: `test/report/enduser-index.test.mjs`'s integration
tests run `fgos docs-index` against the REAL repo `docs/` tree as part of
`npm test`, overwriting the tracked file `docs/enduser-docs-index.json` as
a side effect. Run from a linked worktree (no `.fgos/` by ADR0020), the
outcomes view folded by `docs-index` is empty, so every `sourceCaptureId`
in the regenerated file comes back `null` — a plain `npm test` silently
dirties a tracked file with degraded content. Found while working tsk-65n:
had to `git checkout` the file back before committing, and it rules out
`npm test` as any item's verify command (approve re-verifies on main).

## Feature boundary

Scope is the test file's side effect only: make `npm test` leave
`docs/enduser-docs-index.json` exactly as it found it, in both a linked
worktree and the main checkout. Out of scope: changing `docs-index`'s
production write path, adding a CLI output-path flag, or touching
`sourceCaptureId` resolution/`listWork` behavior itself — the null values
in a worktree run are an accurate reflection of that checkout's real
(absent) `.fgos/` state, not a bug to fix.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix via snapshot/restore of `docs/enduser-docs-index.json`'s real content — capture it before the docs-index-touching tests run, restore it (or remove it, if it didn't exist before) after — rather than switching to a temp fixture tree or adding a new CLI `--out` flag. Keeps the file's existing explicit design intent (`runDocsIndex`'s own comment: "Deliberately run against the REAL repo cwd (never a temp fixture)... this cell's must_haves forbid a proxy test") intact — the test still exercises the real generator over the real `docs/` tree and reads the real produced manifest; only the leftover disk state changes. No production CLI surface touched. |
| D2 | Restore runs unconditionally — in a linked worktree AND in the main checkout, even when `.fgos/` state is real and the regenerated content legitimately differs from what's committed. `npm test`'s job is verification, not regeneration; keeping the tracked manifest current is `fgos-indexing`'s separate, deliberate action, never an `npm test` side effect. One restore path, no worktree-vs-main branch in the test. |

## Pinned assumptions (implementer-level, deferred to `fgos-coding-planning`)

- Snapshot/restore mechanism: plain `fs.readFileSync`/`fs.writeFileSync`
  (or `fs.rmSync` if the file was absent before), not `git checkout` —
  matches this same test file's existing `tutorialsDir` rename/restore
  precedent (`test/report/enduser-index.test.mjs:168-178`, plain `fs`, no
  git dependency) and avoids any risk of a git-based restore discarding a
  real uncommitted edit to the manifest that predates the test run.
- Restore hook placement (single module-level `after()` vs. per-test
  `try/finally`) is an implementation choice for `fgos-coding-planning`/execution
  to make, not locked here.

## Scout evidence cited

- `test/report/enduser-index.test.mjs:14-20` — `runDocsIndex()` and its
  "Deliberately run against the REAL repo cwd (never a temp fixture)"
  comment; must_haves forbid a proxy test that passes with the manifest
  absent.
- `test/report/enduser-index.test.mjs:168-178` — existing
  `tutorialsDir`/`hiddenDir` rename-then-`finally`-restore precedent in
  the same file, plain `fs`, no git.
- `bin/fgos.mjs:1362-1417` — `docs-index` handler: `repoRoot =
  path.dirname(dir)`; `manifestPath = path.join(repoRoot, 'docs',
  'enduser-docs-index.json')` is hardcoded, no override flag; write is
  skipped only when computed content is byte-identical to existing
  content (idempotent-by-construction, not skip-writable to another
  path).
- `bin/fgos.mjs:2846-2855` — a worktree session omitting `--dir` gets a
  real, degraded (not error) view: `.fgos/ not found` warning, view reads
  as empty rather than refusing — matches the item's observed
  all-`sourceCaptureId`-null symptom.

## Outstanding questions deferred to planning

None — both material product decisions (fix strategy, restore scope) are
locked above; the rest is implementer-level (hook placement, exact
snapshot/restore code shape).
