# tsk-3wq — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": ["sự cố"],
  "matchedModules": []
}
```

## Failing-test-first proof

`test/state/events.test.mjs`'s new lock-contention test, run against the
pre-fix version of `src/state/events.mjs` (`git show HEAD~1:...`, swapped
in temporarily, then restored — working tree confirmed byte-identical to
`HEAD` afterward via `git diff --stat`):

```
✖ repairTruncatedLastLine now blocks on a lock another process holds — the actual old-vs-new discriminator (29.513682ms)
  AssertionError [ERR_ASSERTION]: repairTruncatedLastLine must block until the held lock releases (~500ms) — only took 0ms, meaning it did not actually wait for the lock
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3wq-2vDehT/test/state/events.test.mjs:331:10)
```

Same test, same repo, post-fix (`src/state/events.mjs` at `HEAD`):

```
✔ repairTruncatedLastLine now blocks on a lock another process holds — the actual old-vs-new discriminator (534.567774ms)
```

The test forks a real OS process that acquires `events.lock` (via the
real `withEventsLock`, the same lock `appendEvent` holds) and holds it for
500ms, signaling acquisition through a marker file (polled, no fixed-delay
race). The parent then calls `repairTruncatedLastLine` and times it: the
pre-fix (unlocked) code ignores the held lock entirely and returns in 0ms;
the post-fix code correctly blocks for ~500ms before it can even start its
own read — proving the fix actually closes the race, not just changes the
code's shape.

An earlier draft of this same regression test (two concurrent
`repairTruncatedLastLine` calls on the same corrupt log, still present in
the suite as `repairTruncatedLastLine under two concurrent OS processes
serializes...`) was checked against the same pre-fix swap and found to
NOT discriminate — both old and new code happen to converge on the same
output for that specific scenario, since two concurrent repairs read
identical source content and compute identical results regardless of
locking. That test is kept as valid regression coverage (deterministic,
lossless behavior under concurrent repair attempts) but is not itself the
Iron Law proof; the lock-contention test above is.

## Live merge-driver repro (component 1, D1's core fix)

Not a unit test (git-level behavior, no seam to unit-test through) — a
real git repro instead, documented in full in
`docs/history/events-jsonl-merge-driver-recurring-write-loss/
repro-notes.md`: two divergent branches with colliding independently-
numbered `seq` values, merged with and without `.gitattributes`'s `merge=
union` entry. Without it: a real `CONFLICT (content)` with raw `<<<<<<<`
markers — the exact tsk-n4i mechanism. With it: a clean merge (exit 0),
zero events lost, and `events-jsonl-contiguity.mjs --fix` resequences the
residue to a fully contiguous result.

## Full item verify command (step 3, already run)

```
node --test test/state/events.test.mjs test/state/store.test.mjs test/setup/checks.test.mjs test/scripts/events-jsonl-contiguity.test.mjs
```

Result: 166 tests, 0 fail.
