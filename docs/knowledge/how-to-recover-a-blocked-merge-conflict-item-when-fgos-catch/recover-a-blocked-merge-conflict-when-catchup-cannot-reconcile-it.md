---
type: how-to
title: How to recover a blocked merge-conflict item when `fgos catchup` itself can't reconcile it
tags: []
timestamp: 2026-07-30T07:37:00.000Z
source_capture_ids: [tsk-6c2]
framework: diataxis
mode: how-to
---
# How to recover a blocked merge-conflict item when `fgos catchup` itself can't reconcile it

Use this when `fgos approve <id>` reports `to: "blocked"`,
`reason: "merge-conflict"`, you resolve the conflict **by hand** on the
item's own branch instead of waiting for `fgos catchup` to do it, and then
`fgos catchup <id>` itself fails with something like:

```
fgos: Command failed: git commit -m catch-up: merge main into fgw/<id>
```

## Before you start

- This applies once you have already run `git merge main` yourself inside
  the item's branch/worktree, resolved the real conflicting hunks, and
  committed — i.e. the branch is **already** caught up with `main`.
  `fgos catchup` is the normal, correct door out of a `merge-conflict`
  block, and since `tsk-k7i` it handles this exact case itself — the
  failure above only happens on an fgOS checkout predating that fix.

## Steps

1. **Confirm the branch really is already caught up.** From the main
   checkout:

   ```
   git merge-base --is-ancestor main fgw/<id> && echo "main is an ancestor -- already caught up"
   ```

2. **Just run `fgos catchup <id>`.** It handles this case now
   (`tsk-k7i`): before merging, it checks
   `git merge-base --is-ancestor <target> HEAD` inside its ephemeral
   checkout. When the branch already contains the target, it skips the
   merge and the commit entirely, still runs the item's own verify on the
   existing tree, and on green takes the same
   `blocked -> awaiting-approval` edge a clean reconcile takes — reporting
   `outcome: "already-caught-up"` rather than `"merged"`, since no commit
   was created. On red it leaves the item `blocked` and reports
   `verify-fail`.

   The manual `fgos move <id> --to awaiting-approval --expect blocked`
   this how-to used to prescribe here is no longer needed for this case.
   Reach for it only if `catchup` still refuses for some *other* reason —
   and note that it bypasses verify entirely, so it is only honest when you
   can point at real evidence (a passing full test run on the actual merged
   tree) yourself.

3. **Why it used to fail.** `catchup` ran
   `git merge --no-commit --no-ff <target>` and then `git commit`
   unconditionally. On an already-caught-up branch the merge stages
   nothing, so the commit died with "nothing to commit" — permanently, for
   that item, since retrying never changes the condition. Kept here because
   any fgOS checkout predating `tsk-k7i` still behaves this way.

4. **Retry approve.** `mergeRunnerItem` (`src/runner/merge.mjs`) is
   idempotent for an already-merged branch — it returns `outcome: "merged"`
   without attempting a redundant commit, so this is safe to run again even
   though the git-level merge already happened:

   ```
   fgos approve <id> [--acknowledge-iron-law]
   ```

## A second failure you may hit right after this: an unrelated flaky test

`approve` re-runs the *full* suite (not just the item's own recorded
`verify`), so a `verify-fail-post-merge` block right after step 4 above is
often unrelated load-induced flake, not a real regression — see
`docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`
(the `tsk-2z3` example there is the *same* failing file,
`test/install-packaging.test.mjs`'s `e2e: npm pack -> npm install -g ->
fgos init from a fresh external cwd`, independently reproduced a second
time here — confirming it as a recurring load-induced flake, not a one-off).
Its own fix — re-run the specific failing file alone to confirm it passes,
then retry — applies unchanged here too.

## Real example

Item `tsk-6c2` (adding retry-with-backoff to `take`/`pick`/`approve` on
main-checkout-lock contention) branched from `main` well before several
other items merged, including `tsk-3vo`'s own `resolveVerifyTimeoutMs`
helper inserted at almost the exact same point in `bin/fgos.mjs` this
item's own new `parseWaitFlags` helper landed at. `fgos approve
tsk-6c2 --acknowledge-iron-law` came back:

> `{"id":"tsk-6c2","mode":"merge","to":"blocked","reason":"merge-conflict","target":"main"}`
> — real `fgos approve` response

`git merge main` inside the item's own worktree surfaced exactly one
conflicted file (`bin/fgos.mjs`, two adjacent-insertion hunks); resolved by
keeping both functions as siblings, then committing the merge. Re-running
`fgos catchup tsk-6c2` then failed exactly as step 3 above describes
(`git commit` on nothing to commit) — this account predates `tsk-k7i`, so
today's `catchup` would have handled it in one call; `fgos move tsk-6c2
--to awaiting-approval --expect blocked` followed by a full local `npm
test` (1772 passing) confirmed the merge was sound before retrying
`approve`.

> `{"id":"tsk-6c2","mode":"merge","to":"blocked","reason":"verify-fail-post-merge","target":"main","exitStatus":1}`
> — real `fgos approve` response, second attempt — the unrelated flake
> described above (`test/install-packaging.test.mjs`)

`fgos move tsk-6c2 --to awaiting-approval --expect blocked` then `fgos
approve tsk-6c2 --acknowledge-iron-law` a third time merged cleanly —
`mergeRunnerItem` correctly recognized the branch as already merged and
moved straight to the (by then unblocked) `moveWork(to: 'done')` step.

## Related

- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` — the
  sibling how-to for the unrelated-flaky-full-suite-verify case on its own,
  without a preceding merge-conflict.
- `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` and
  `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — the siblings for *specific* conflicting content types; this doc is
  about catchup's own execution bug once you've already resolved whatever
  the actual conflict was.
- `fgos check <id>` — full outcome/friction history, including the entries
  quoted above.
