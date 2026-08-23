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
| D1 | `docs-index` preserves a docPath's existing on-disk `sourceCaptureId` when the store is unreachable, instead of overwriting it with `null`. Only a genuinely reachable store — present and actually lacking a capture for that doc — is allowed to write `null` over a prior value. Precise signal (corrected at `fgos-coding-validating`, see D3): the resolved `.fgos/` directory can exist while carrying no `events.jsonl` (observed live: a worktree's `.fgos/` holding only `main-checkout.lock`) — "unreachable" means the **log file** is absent, not the directory. | Fixes the real defect, not just the test's own symptom: any human or session running `docs-index` for real inside a worktree (the normal path — `fgos pick` stands one up) hits the identical silent corruption, not only the one integration test. Directly reproduced above. |
| D2 | ~~`test/report/enduser-index.test.mjs`'s own `runDocsIndex()` passes `--dir` pointing at a real, resolvable store...~~ **Superseded by D3 below — never implemented.** | Original reasoning: the test's own outcome should not depend on which physical location happens to run it. See D3 for why this was dropped. |
| D3 | D2 is dropped. `runDocsIndex()` stays exactly as it is today — no `--dir`, no change. | `fgos-coding-validating` proved live that `--dir` redirects `docs-index`'s own `repoRoot` (`case 'docs-index'`: `const repoRoot = path.dirname(dir)`), not just which store informs `sourceCaptureId` — pointing it at main checkout broke a real, unrelated test (`fgos docs-index tolerates a missing quadrant dir`, which hides the WORKTREE's own `docs/tutorials/` and expects it absent from the manifest; with `--dir` redirecting `repoRoot` to main, the verb scanned main's untouched `docs/tutorials/` instead). Separately, D1 alone was shown (dry-run simulation) to reconstruct content byte-identical to a worktree's freshly-checked-out (`HEAD`-identical) manifest when the store is unreachable — the same real ids main checkout would re-resolve are already the prior on-disk values D1 preserves. D2's goal is met by D1 alone; its mechanism was actively harmful. User confirmed dropping D2 after this trade-off was presented. |

D1's rejected alternative — making `docs-index` refuse outright without a
reachable store (raising `requiresExistingStore` from its current `false`)
— was explicitly declined: it would diverge from the documented,
codebase-wide convention that a missing store degrades every read verb to
an empty view rather than an error (`src/state/store.mjs:777`,
`readyWork`'s own comment, the same shape `listWork` gives `docs-index`),
and would force every caller of `docs-index` without `--dir` — not just this
one test — to start supplying one.

## Pinned terms

- **store unreachable** — the log file `listWork`/`rebuildView` reads
  (`events.jsonl` under the `.fgos/` directory `dataDir()`/`resolveFgosDir`
  resolves to) does not exist on disk. **Not** the same as the `.fgos/`
  directory itself being absent — corrected at `fgos-coding-validating` (D3):
  caught live that a worktree's `.fgos/` can exist (holding only
  `main-checkout.lock`) while `events.jsonl` inside it is absent, so a
  directory-existence check would misread this exact condition as
  "reachable." Distinct from **store reachable but genuinely empty** (the
  log exists, `rebuildView` succeeds, and the view's `outcomes` simply has
  no entry for a given docPath) — that case is real "no capture recorded"
  and must still write `null`, per D1's own scope.
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
- ~~Whether "store unreachable" is detected via `fs.existsSync` on the
  resolved `.fgos/` directory directly, or some other existing signal.~~
  Resolved at `fgos-coding-validating` (D3): `fs.existsSync(path.join(dir,
  'events.jsonl'))`, matching `readEvents`'s own `ENOENT` check — see the
  pinned term above.
- The item's own `verify` field is still the intake placeholder
  (`chưa xác định — P15 bổ sung`) and needs a real command before `return`.
