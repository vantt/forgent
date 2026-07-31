# CONTEXT — `docs-index` on an unreachable store

Item: `tsk-f31` (kind `bug`). Refs: `tsk-k7i` (found and worked around while
executing it).

## Feature boundary

Two call sites: `case 'docs-index'` in `bin/fgos.mjs` (the generator that
writes `docs/enduser-docs-index.json`), and
`test/report/enduser-index.test.mjs`'s `runDocsIndex()` helper (the one
integration test that runs the real generator against the real repo tree).

In scope: what happens to a docPath's `sourceCaptureId` when the process
resolving it cannot reach a real `.fgos/` store, and where that test points
its own `docs-index` invocation.

Out of scope: `buildEnduserIndex`/`findSourceCaptureId`'s pure-function
contract when given a real `outcomesView` (unit-tested, unaffected);
anything about `.fgos/` being absent from a worktree in the first place
(ADR0020, working as designed — confirmed by direct repro below, not being
revisited); the `docs-index` registry's `requiresExistingStore: false` flag
(explicitly kept, not toggled — see D1's rejected alternative).

## The failure being fixed

Reproduced first-hand in this item's own worktree (`fgw/tsk-f31`, created by
`fgos pick`, no `.fgos/` present per ADR0020 — confirmed:
`ls -la .fgos/` → `No such file or directory`):

```
node bin/fgos.mjs docs-index
```

exits 0, no warning, and rewrites the tracked `docs/enduser-docs-index.json`
— 71 insertions / 71 deletions measured live. Every entry whose real
`sourceCaptureId` is a genuine id in the main checkout's store comes back
`null`, because `case 'docs-index'` (`bin/fgos.mjs:1405`) calls
`listWork(dir)` where `dir` resolved from a missing `.fgos/`, and
`listWork`/`rebuildView` (`src/state/store.mjs:767`) treats a missing log
exactly like a legitimately empty one: **"A missing log rebuilds to an
empty view ... never an error, exit 0"** (comment on the neighboring
`readyWork`, same code path). `docs-index`'s own registry entry
(`src/cli/command-registry.mjs:689`) declares `requiresExistingStore: false`
deliberately.

`buildEnduserIndex` then can't tell "this doc genuinely has no capture" from
"the store that would know was unreachable this run" — both produce the
same empty `outcomesView`, and `findSourceCaptureId` returns `null` either
way (`src/report/enduser-index.mjs:72`).

Found while executing `tsk-k7i`: a clean `npm test` on `fgw/tsk-k7i` dirtied
this same tracked file the same way, discovered only because the diff was
inspected before staging.

## Locked decisions

| ID | Decision | Why |
|---|---|---|
| D1 | `docs-index` preserves a docPath's existing on-disk `sourceCaptureId` when the resolved `.fgos/` directory does not exist, instead of overwriting it with `null`. Only a genuinely reachable store — present and actually lacking a capture for that doc — is allowed to write `null` over a prior value. | Fixes the real defect, not just the test's own symptom: any human or session running `docs-index` for real inside a worktree (the normal path — `fgos pick` stands one up) hits the identical silent corruption, not only the one integration test. Directly reproduced above. |
| D2 | `test/report/enduser-index.test.mjs`'s own `runDocsIndex()` passes `--dir` pointing at a real, resolvable store — the main checkout's `.fgos/`, resolved the same way `fgos-routing`'s own root resolution already does (`git rev-parse --path-format=absolute --git-common-dir \| xargs dirname`) — instead of relying on `docs-index`'s default `process.cwd()` resolution. | The test's own outcome should not depend on which physical location happens to run it (main checkout vs. any worktree). This is additive to D1, not a substitute for it: D1 protects every other caller of `docs-index` that never passes `--dir` at all. |

D1's rejected alternative — making `docs-index` refuse outright without a
reachable store (raising `requiresExistingStore` from its current `false`)
— was explicitly declined: it would diverge from the documented,
codebase-wide convention that a missing store degrades every read verb to
an empty view rather than an error (`src/state/store.mjs:777`,
`readyWork`'s own comment, the same shape `listWork` gives `docs-index`),
and would force every caller of `docs-index` without `--dir` — not just this
one test — to start supplying one.

## Pinned terms

- **store unreachable** — the directory `dataDir()`/`resolveFgosDir` resolves
  to (`.fgos/` under the effective repo root) does not exist on disk at all.
  Distinct from **store reachable but genuinely empty** (the directory
  exists, `rebuildView` succeeds, and the view's `outcomes` simply has no
  entry for a given docPath) — that case is real "no capture recorded" and
  must still write `null`, per D1's own scope. The live repro above is
  exclusively the first case: `ls -la .fgos/` returned ENOENT, not an empty
  directory.
- **on-disk value** — the `sourceCaptureId` currently present for a docPath
  in the manifest file (`docs/enduser-docs-index.json`) as it exists on disk
  *before* the current `docs-index` run writes anything.

## Scout evidence

- `bin/fgos.mjs:1405`-`1420` — `case 'docs-index'`: `repoRoot =
  path.dirname(dir)`, `listWork(dir)`, `buildEnduserIndex(docEntries,
  view.outcomes ?? {})`, then a write-only-if-changed guard that already
  reads `previousContent` from `manifestPath` before deciding whether to
  write — the exact place D1's preserve-on-disk-value logic has to plug in.
- `src/state/store.mjs:767`-`785` — `listWork`/`readyWork`: the documented,
  deliberate "missing log → empty view, never an error" convention this
  bug rides on, shared by every other read-only verb.
- `src/report/enduser-index.mjs:72`-`139` — `findSourceCaptureId` and
  `buildEnduserIndex`: pure functions, given `outcomesView` as a parameter;
  neither reads `.fgos/` or a prior manifest itself.
- `src/cli/command-registry.mjs:683`-`691` — the `docs-index` registry
  entry: `requiresExistingStore: false`, and the existing description text
  already treats `sourceCaptureId: null` as a legitimate "none recorded"
  value — the bug is a *false* null, not an illegitimate value shape.
- `test/report/enduser-index.test.mjs:14`-`20`, `126`-`139` — `MANIFEST_PATH`,
  `runDocsIndex()` (no `--dir`, `cwd: REPO_ROOT` where `REPO_ROOT` is
  whichever checkout the test file itself lives in), and the demo assertion
  this touches.
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — the decision
  record for why a freshly created worktree carries no `.fgos/` at all
  (`createWorktree`, `src/runner/worktree.mjs:289`-`291`, confirmed live:
  `fs.rmSync(path.join(worktreePath, '.fgos'), ...)`). Not being revisited.
- Live repro, this worktree (`fgw/tsk-f31`): `ls -la .fgos/` → ENOENT;
  `node bin/fgos.mjs docs-index` → exit 0; `git diff --stat
  docs/enduser-docs-index.json` → `71 insertions(+), 71 deletions(-)`;
  restored via `git checkout -- docs/enduser-docs-index.json` before
  continuing.

## Deferred to planning

- Exactly how D1's "preserve the on-disk value" is implemented: whether the
  merge happens inside `buildEnduserIndex` (would need a third parameter —
  changes its pure-function signature) or in `case 'docs-index'` itself
  (reads `previousContent`'s parsed entries and back-fills `sourceCaptureId`
  for any docPath the current `outcomesView` didn't resolve) — the write-side
  location already reads `previousContent` for the unchanged-guard, so
  keeping the merge there avoids touching the pure function's contract, but
  that's an implementation call, not decided here.
- Whether "store unreachable" is detected via `fs.existsSync` on the
  resolved `.fgos/` directory directly, or some other existing signal —
  not investigated at this stage.
- The item's own `verify` field is still the intake placeholder
  (`chưa xác định — P15 bổ sung`) and needs a real command before `return`.
