# tsk-ozk — Iron Law Evidence

Classifier result for diff:
```json
{"required":true,"matchedFlags":["migration"],"matchedModules":[]}
```

## Scoped test command
```bash
node --test test/scripts/knowledge-migration.test.mjs
```

## RED transcript (stashed implementation files)
Restoring pre-implementation files (`scripts/knowledge-migration.mjs`, `scripts/knowledge-classifier.mjs`, `docs/architect/knowledge-registry-redesign.md`) while keeping updated test expectations produced 6 assertion failures:

```
✖ failing tests:

test at test/scripts/knowledge-migration.test.mjs:52:1
✖ knowledge-migration - apply moves file and updates store currentPath and aliases (76.633137ms)
  AssertionError [ERR_ASSERTION]: New file must exist after apply
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-ozk-3JZPls/test/scripts/knowledge-migration.test.mjs:73:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }

test at test/scripts/knowledge-migration.test.mjs:194:1
✖ knowledge-migration - apply refuses when the target path already exists on disk (no overwrite) (83.436493ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-ozk-3JZPls/test/scripts/knowledge-migration.test.mjs:215:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: /target 'docs\/knowledge\/worktree-reclaim\/guide\.md' already exists on disk/,
    operator: 'throws',
    diff: 'simple'
  }

test at test/scripts/knowledge-migration.test.mjs:578:1
✖ knowledge-migration - a locked git index (both "git mv" and the fallback "git add" fail) throws instead of reporting silent success (105.915661ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  
  + 'docs/worktree-reclaim/guide.md'
  - 'docs/knowledge/worktree-reclaim/guide.md'
          ^
  
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-ozk-3JZPls/test/scripts/knowledge-migration.test.mjs:621:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'docs/worktree-reclaim/guide.md',
    expected: 'docs/knowledge/worktree-reclaim/guide.md',
    operator: 'strictEqual',
    diff: 'simple'
  }
```

## GREEN transcript (restored implementation)
Restoring fix:

```
✔ knowledge-migration - dry-run does not mutate disk or store (73.47684ms)
✔ knowledge-migration - apply moves file and updates store currentPath and aliases (91.670839ms)
✔ knowledge-migration - apply demotes an active doc to provisional (design §13.5 rule 6) (88.582044ms)
✔ knowledge-migration - apply is idempotent: a second run finds nothing left to plan, no throw (80.680204ms)
✔ knowledge-migration - apply fails closed (throws, applies nothing) when a planned source file is missing from disk (51.639091ms)
✔ knowledge-migration - apply refuses (no partial apply) when the planned doc is not registered in the registry (70.511053ms)
✔ knowledge-migration - apply refuses when the target path already exists on disk (no overwrite) (67.49162ms)
✔ knowledge-migration - apply refuses when projection paths cannot depend on the caller cwd; writes docs/doc-registry.* under repoRoot (103.629228ms)
✔ knowledge-migration - dry-run reports conservation errors for duplicate source and duplicate target, apply refuses them (47.414971ms)
✔ knowledge-migration - apply moves a source path containing shell metacharacters correctly (execFileSync, not a shell string) (96.324054ms)
✔ knowledge-migration - dry-run reports a duplicate-source conservation error even when both rows are already migrated (moveCount 0) (49.26573ms)
✔ knowledge-migration - refuses (does not silently report success) an unregistered doc whose inventory oldPath already equals the computed target (66.622713ms)
✔ knowledge-migration - refuses (does not report success) a retired doc that already sits at its computed target (64.372363ms)
✔ knowledge-migration - refuses (does not report success) a live doc that already sits at its computed target but the file is missing on disk (53.626272ms)
✔ knowledge-migration - dry-run against a completely fresh store (no bootstrap ever run) reports a clean error, not a TypeError (51.096409ms)
✔ knowledge-migration - refuses "already migrated" when the inventory oldPath is neither the doc's currentPath nor a recorded alias (45.318372ms)
✔ knowledge-migration - a frontmatter-write failure leaves the source file and the registry untouched (no partial apply) (80.055372ms)
✔ knowledge-migration - a locked git index (both "git mv" and the fallback "git add" fail) throws instead of reporting silent success (118.535918ms)
✔ knowledge-migration - refuses a planned move for an ACTIVE doc under a retired topic before any file mutation (70.804898ms)
✔ knowledge-migration - refuses a planned move for a PROVISIONAL doc under a retired topic (no demote involved to catch it otherwise) (72.573282ms)
✔ knowledge-migration - the "already migrated" shortcut also refuses a live doc already at its target under a retired topic (52.299659ms)
✔ knowledge-migration - a valid-but-non-array inventory-data.json fails with a clear message, not "is not iterable" (44.135779ms)
ℹ tests 22
ℹ suites 0
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1862.953245
```
