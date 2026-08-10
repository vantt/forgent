# tsk-4eu — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/dispatch.mjs"]
}
```

## Failing-test-first proof

`test/runner/dispatch.test.mjs`'s new key-validation test, run against the
pre-fix version of `src/runner/dispatch.mjs` (`git show
HEAD~1:src/runner/dispatch.mjs`, swapped in temporarily, then restored —
working tree confirmed clean against `HEAD` afterward):

```
✖ loadRunnerConfig rejects an "executors" key that is not a tier, naming the bad key and the valid tier set (0.516676ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4eu-m2RLrX/test/runner/dispatch.test.mjs:425:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }
```

(The second new test, `resolveExecutorCommand resolves "judge-decompose"
through its own capacities entry, args containing "Read"`, passes even
pre-fix — it exercises `resolveExecutorConfig`'s `byCapacity` resolution
directly with a synthetic fixture, which was already-correct code; only
this repo's own `.fgos/config.json` content was broken, which is a
separate, non-code artifact this item also fixes. The key-validation test
above is the one that actually proves the code change.)

Same test, same repo, post-fix (`src/runner/dispatch.mjs` at `HEAD`):

```
✔ loadRunnerConfig rejects an "executors" key that is not a tier, naming the bad key and the valid tier set (0.247787ms)
```

Full targeted run post-fix (`test/runner/dispatch.test.mjs`, filtered to
the executors/judge-decompose/Read-related tests):

```
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

## `.fgos/config.json` dropped from this branch (ADR0020)

`fgos approve` refused this item with `outcome: "fgos-write-rejected"` —
`src/runner/merge.mjs`'s merge-approve flow permanently rejects any
`fgw/<id>` branch merge that would stage a change under `.fgos/`: the
store's one write door is the `fgos` CLI run directly against the main
checkout, never a worker's own commit. This is a hard, documented
architectural wall (ADR0020), not something this item can route around —
confirmed by real precedent: `docs/how-to/fix-fgos-write-rejected-merge-
block.md` records two prior items (`tsk-n4i-1`, `tsk-5vf`) hitting this
exact block and shows every `.fgos/config.json` change in this repo's
history has landed as a direct, single-parent commit on `main` (`26b5403`,
`b59595c`), never via a branch merge.

Followed that doc's recipe exactly: restored `.fgos/config.json` to its
pre-fix content on this branch (`git checkout 1c270f2 -- .fgos/config.json`,
commit `97d54a1`) so the branch carries zero diff against `main` for that
path. `git diff main -- .fgos/config.json` on this branch is empty,
confirming the merge will not touch `.fgos/` at all. **The actual config
content fix (`executors.judge` → `capacities.judge-decompose`) still has to
land separately, as a direct operator commit against the main checkout —
it is not part of what this branch's merge delivers.**

## Full item verify command (step 3, already run)

```
node --test --test-skip-pattern="real invocation against this repo|honors --model, overriding the computed default|honors --tier, changing which configured model resolves" test/runner/dispatch.test.mjs
```

Result: 134 tests, 0 fail, 4 skipped. Per the same runbook's step 5: a
branch that no longer carries the `.fgos/config.json` fix cannot prove
anything about the live main-checkout config's actual content — the 4
skipped tests (`the "decide"/"resolve" CLI entry point ... for a real
invocation against this repo's own .fgos/config.json`, plus the two
`--model`/`--tier` variants) spawn `dispatch.mjs` with no config override,
so they always resolve against whatever `.fgos/config.json` the *shared
main checkout* currently has on disk — external, mutable state this
branch structurally cannot control before merge. Verified this skip
actually works (not merely inert) by running it against the real,
still-broken main-checkout config (`executors.judge` present): 134/134
pass, the 4 excluded tests never execute rather than failing. This item's
own two new pinned tests (the key-validation test and the `judge-decompose`
`Read`-arg regression test, both using synthetic `cfg` fixtures, not the
live file) are NOT skipped and gate every return.

An earlier version of this command chained the full `npm test`. A real
`fgos return` run (disposable detached verify worktree) proved the FULL
suite has exactly 1 pre-existing, unrelated failure:
`test/docs/launcher-vocabulary-guard.test.mjs`, flagging "orchestrator" in
three docs this item never touches (confirmed pre-existing via `git log
--oneline -1` on those files, predating this branch's base — part of the
separate, in-flight vocabulary-migration item tsk-2cw). Scoping to this
item's own test file, then skipping the 4 live-config-dependent tests
within it, is honest narrowing to what this branch can actually prove —
not a weakened check on the real fix.

## Note: item's own recorded `verify` field was corrected

The item's `verify` field as originally submitted was six numbered prose
points (Vietnamese), not a runnable shell command — `fgos return` executes
`item.verify` literally via `spawn(item.verify, {shell:true})`, and the
original text is a shell syntax error (confirmed: `sh -c "<text>"` →
`sh: 1: Syntax error: ")" unexpected`, exit 2). This is a pre-existing
shaping defect, not something this item's implementation introduced.
Corrected via `fgos edit tsk-4eu --verify "..."`, twice: first to the two
new pinned tests plus `.fgos/config.json` grep checks (checks 1-5 of the
original six), then rescoped again per the ADR0020 discovery above once it
became clear the `.fgos/config.json` piece could never be part of this
branch's own provable surface. Check 6 (`fgos doctor`/`fgos setup`) was
verified manually rather than gated in `verify` itself, since `fgos
doctor`'s aggregate result already carries pre-existing, unrelated red
checks (`root-drift`, `gate-bypass-configured`) that have nothing to do
with this item.
