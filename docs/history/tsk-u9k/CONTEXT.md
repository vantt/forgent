# Milestone tsk-u9k: judge scout output persists and is reused across judgeDiscovery/judgeDecompose calls

## Targets and their real evidence

- `tsk-62v` — Generalize `dispatch.mjs`'s executor resolution to be
  capacity-aware (capacities.<id> schema, `kind` vocabulary reusing
  `tool-registry.mjs`'s `KINDS`, PATH-scan dedupe, additive `spawnWorker`
  fields, dispatch announce/audit trail). Landed on `main` via commit
  `1f1788a`, carried into `main` by the `tsk-64p` integration merge
  (`e656309`). Iron Law-gated (`src/runner/dispatch.mjs`,
  `src/runner/loop.mjs`); failing-test-first proof recorded at
  `docs/history/tsk-62v/iron-law-evidence.md`. Status: `done`.

- `tsk-g18` — Persist `judgeDiscovery`/`judgeDecompose`'s autonomous scout
  output (`Bash(rg:*)` transcript) across nested-executor calls via
  parent-side transcript capture (`--output-format stream-json`), writing
  `docs/history/<docsRef>/scout-notes.md` — the judge subprocess itself
  gains zero new tool grant (still no `Write`), only the parent process
  writes the file. `discovery.mjs`/`decompose.mjs` read that file before
  invoking the judge and skip re-capturing when notes already exist.
  Landed on `main` via commit `e804cb5` (merged into `fgw/tsk-64p`, which
  was already ahead of `main`; `main` head at merge was `4123318`).
  Existing `judge-executor.mjs`/`discovery.mjs`/`decompose.mjs` test suites
  passed unchanged; new tests cover transcript parsing, the
  Bash(rg:\*)-only capture filter, and the skip-on-fresh-notes path
  (`test/intake/judge-executor.test.mjs`, `test/intake/discovery.test.mjs`,
  `test/intake/plan.test.mjs`). Status: `done`.

## What shipping this milestone actually amortizes

Before this milestone, every `judgeDiscovery`/`judgeDecompose` call on an
item re-ran its own `Bash(rg:*)` scout query from scratch — including
retries across the same clarify/decompose loop on one item — with no
mechanism to reuse a prior call's already-gathered evidence
(`plans/reports/research-260801-1001-judge-scout-result-not-persisted-reused-report.md`).
`tsk-g18`'s scout-notes.md persistence, built on `tsk-62v`'s capacity-aware
dispatch resolution, closes that gap: a fresh `scout-notes.md` under the
item's own `docsRef` is read before the judge runs again and injected into
its prompt, so a repeated pass on the same item can skip re-scouting an
identical query.

## Operational gap discovered and fixed while closing this milestone

Merging `tsk-g18` surfaced a genuine, previously-undiscovered gap in
`fgos approve`'s own disposable merge-verify worktree: `createWorktree`
(`src/runner/worktree.mjs`) never installed dependencies, so a freshly
merged `package.json` dependency (`yaml`, from the sibling `tsk-slq` item)
crashed the ephemeral verify with `ERR_MODULE_NOT_FOUND`. Fixed by
symlinking the main checkout's already-installed `node_modules` into every
fresh worktree (`main` commit `4123318`) — documented at
`docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`
("Real example: a genuine gap in the merge machinery itself").

## Verify

```
node bin/fgos.mjs list --json --all --dir <repo-root> | jq -e '.data.work as $w | ["tsk-62v","tsk-g18"] | map($w[.].status) | all(. == "done")' > /dev/null
```
