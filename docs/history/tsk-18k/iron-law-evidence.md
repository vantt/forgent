# Iron Law evidence: tsk-18k

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-18k`):

```json
{"required":true,"matchedFlags":["data loss","delete","audit"],"matchedModules":["src/runner/merge.mjs","src/runner/worktree.mjs"]}
```

## Test command

```
node --test test/runner/merge-target-slot-multiprocess.test.mjs
```

## Failing-before (pre-fix `merge.mjs`, `identity = resolveWriterIdentity(fgosDir).id`)

Temporarily swapped `src/runner/merge.mjs` back to its pre-tsk-18k content
(`git show 4e0b259a:src/runner/merge.mjs`, the commit immediately before the
implementation commit) and reran the test file — including the two new
assertions this item added. Two failures, both showing the actual bug: the
on-disk lock record is keyed by the env-derived session-id STRING, not a
real OS pid:

```
✖ a slot held by a REAL separate process is refused in this one, under the same inherited identity (37.435656ms)
  AssertionError [ERR_ASSERTION]: the reported holder is the CHILD's own real OS pid (tsk-18k identity fix), not a shared session string
  + actual - expected

  + 'eb492d63-fc97-4ec9-8479-9d5a76b54e18'

✖ tsk-18k: the merge-target-slot lock is keyed by the real OS pid, not the shared env session id — two sibling processes never collide on release/renew (47.623978ms)
  AssertionError [ERR_ASSERTION]: the on-disk lock record is keyed by the child's own real pid
  + actual - expected

  + 'eb492d63-fc97-4ec9-8449-9d5a76b54e18'
  - 275127

ℹ tests 5
ℹ suites 0
ℹ pass 3
ℹ fail 2
```

`'eb492d63-fc97-4ec9-8479-9d5a76b54e18'` is this repo's own env session id —
the literal string two sibling processes (this test's parent and its forked
child) both inherited and would have contended under, the exact collision
Finding 1 describes: a TTL-stale holder's release/renew call sharing that
same string can misidentify a reclaimer's fresh lock as its own.

## Passing-after (post-fix `merge.mjs` restored, `identity = process.pid`)

```
✔ a slot held by a REAL separate process is refused in this one, under the same inherited identity (35.825483ms)
✔ tsk-18k: the merge-target-slot lock is keyed by the real OS pid, not the shared env session id — two sibling processes never collide on release/renew (43.493071ms)
✔ two DIFFERENT target refs never contend across processes — parallelism is per target (44.9014ms)
✔ the holder process leaves exactly one lock file, named for its own target (34.739856ms)
✔ the slot is released when the holding PROCESS exits, not merely when its promise settles (44.980197ms)

ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
```

## Full item verify (all 4 files, post-fix)

```
node --test test/runner/main-checkout-lock.test.mjs test/runner/merge-target-slot-multiprocess.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/merge.test.mjs
```

```
ℹ tests 162
ℹ suites 0
ℹ pass 162
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

Includes the tsk-46a CAS-guard regression test (`test/runner/merge.test.mjs`,
"withMergeEphemeralWorktree refuses to force-move the branch when it moved
since this call started") passing unchanged against the new atomic
`git update-ref` guard — same observable error message/fields, now backed by
git's own compare-and-swap instead of a separate read-then-write.
