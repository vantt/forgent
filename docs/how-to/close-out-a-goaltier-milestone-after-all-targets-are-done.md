---
type: how-to
title: How to close out a goalTier milestone/MVP item once all its targets are done
tags: []
timestamp: 2026-08-01T10:31:22.000Z
source_capture_ids: [tsk-u9k]
---
# How to close out a goalTier milestone/MVP item once all its targets are done

Use this when a `goalTier: "milestone"` (or `"mvp"`) item's `targets` array
are all `status: "done"`, but the milestone item itself still sits at
`status: "todo"` and never shows up in `fgos merge list`'s `ready` array —
`fgos rollup` does not read the `targets` field at all, so a goalTier item
never closes itself just because its targets finished.

## Before you start

- This is a **different** relationship from a decomposed root item's
  `children` (see Related): a milestone's `targets` are ordinary work
  items that usually merge **straight into `main`** on their own, not into
  a shared `fgw/<milestone-id>` integration branch the way decomposed
  children merge into their root's branch. A fresh claim of the milestone
  therefore starts with **zero** commits ahead of `main` — there is
  nothing for the targets' own commits to have accumulated onto.
- A goalTier item's stored `verify` field is very often **prose**
  ("Done when tsk-X and tsk-Y both reach done…"), not a runnable shell
  command — it was usually written that way at submit time before anyone
  intended to actually run it. `fgos return`/`fgos approve` both shell out
  to whatever string is there via `spawn(item.verify, { shell: true, cwd
  })` — prose will just fail as a bad command, not report a clear error
  about being non-executable.

## Steps

1. Confirm every target is actually done:
   ```
   fgos show <milestone-id> --json   # read .data.work.targets
   fgos list --id <target-id> --json # for each target, check .status
   ```

2. **Give the milestone a real, runnable `verify` command** before doing
   anything else — checking every target's status via `fgos list` itself:
   ```
   fgos edit <milestone-id> --verify \
     'node <repo-root>/bin/fgos.mjs list --json --all --dir <repo-root> | jq -e ".data.work as \$w | [\"<target-1>\",\"<target-2>\"] | map(\$w[.].status) | all(. == \"done\")" > /dev/null'
   ```
   **The `--dir <repo-root>` (absolute path) is not optional here.** The
   worktree `fgos return`'s own verify step runs this command inside never
   carries its own `.fgos/` at all (ADR0020 — every fresh worktree has it
   stripped) — a verify command that shells `fgos` itself without an
   explicit `--dir` silently resolves against a missing store and exits 1,
   with **empty** `output` in the returned JSON (no stack trace, no
   message — just `passed: false, exitStatus: 1, output: ""`), which is
   easy to misread as the check itself being wrong rather than a path
   problem. Test the exact command by hand from a plain shell before
   trusting it.

3. Claim the milestone item itself:
   ```
   fgos pick <milestone-id>
   ```
   This forks a **brand-new** `fgw/<milestone-id>` branch from the current
   tip of `main` (or whatever `HEAD` `fgos pick` uses) — unlike a
   decomposed root's branch, it starts with nothing on it yet.

4. `fgos return <milestone-id>` **will refuse** the first time:
   ```
   fgos: return: branch "fgw/<milestone-id>" has not advanced past
   branchHeadAtTake ... — commit the work on the branch before
   returning, or pass --no-new-commits-ok if the work was already done
   before this claim.
   ```
   This is expected — the targets' work already landed on `main` before
   this claim, so there is genuinely nothing new to commit on the
   milestone's own branch. `--no-new-commits-ok` exists for exactly this.

   **But if your verify command was wrong the first time** (step 2's
   `--dir` gotcha) and you already hit a failed `return` once, `--no-new-
   commits-ok` will refuse on the RETRY too:
   ```
   fgos: return: "<id>" cannot use --no-new-commits-ok — this item was
   previously blocked by a failed verify; the flag only closes out work
   that was never returned, never rescues a failed retry. Commit new
   work and retry return normally.
   ```
   This is a deliberate guard — the flag is for "nothing to commit,
   never mind", not for "my verify was broken, let me skip past it
   without proving the fix." Once you've been blocked once, you need a
   REAL new commit. Writing a genuine closure note under
   `docs/history/<milestone-id>/CONTEXT.md` (real evidence: which
   targets, which commits, what the milestone actually delivered) both
   satisfies this and gives the later compound-learn step real source
   material — `fgos edit <milestone-id> --docs-ref
   docs/history/<milestone-id>` first if the item has no `docsRef` yet.

5. `fgos move <milestone-id> --to doing` (if step 4's first attempt left
   it `blocked`) then `fgos return <milestone-id>` again (no flag needed
   once there's a real commit — `aheadCount` will be `1`).

6. `fgos compound <milestone-id> --doc-type <quadrant> --doc-path ...` —
   same compound-learn step every item goes through.

7. `fgos approve <milestone-id> [--acknowledge-iron-law]` — merges the
   milestone's own branch (just the closure-note commit) into `main`.

## Real example

`tsk-u9k` (milestone: judge scout output persists and is reused across
`judgeDiscovery`/`judgeDecompose` calls, targets `tsk-62v`, `tsk-g18`, both
`status: "done"` on `main`) hit every gotcha above in sequence:

- Its stored `verify` was prose ("Done when tsk-62v and tsk-g18 both reach
  done…") — fixed via `fgos edit --verify` to a real `jq`-checked command.
- The first version of that command omitted `--dir <repo-root>` — `fgos
  return --no-new-commits-ok` came back `{"passed": false, "exitStatus":
  1, "output": ""}` and the item landed at `blocked`.
- `--no-new-commits-ok` then refused on retry (the "cannot use ... this
  item was previously blocked" guard above) — resolved by writing a real
  `docs/history/tsk-u9k/CONTEXT.md` closure note (this file's own sibling)
  and committing it, then `fgos return tsk-u9k` (no flag) succeeded with
  `aheadCount: 1`.

## Why this doesn't happen automatically

Same underlying reason a decomposed root doesn't close itself (see
Related): `fgos rollup`/`fgos triage` can report on a goalTier item's
`targets` but never write to `status`/`stage` — a goalTree item earns its
own `done` through the same claim → verify → return → compound → approve
cycle every other item goes through, on purpose, so the final commit on
its own branch has a natural place to hold a real, evidence-based closure
summary instead of the milestone silently vanishing into "some targets
happen to be done now."

## Related

- `docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md`
  — the sibling how-to for a **decomposed root** (children merge into the
  root's own `fgw/<root-id>` branch via `parent`) rather than a **goalTier
  milestone/MVP** (targets merge straight into `main` via `targets`) —
  same closing cycle, different branch topology and a different starting
  `aheadCount`.
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` —
  what to do when `approve`'s own full-suite verify (a different, later
  gate than `return`'s item-scoped verify) blocks a merge for a reason
  unrelated to the item's own diff.
- `fgos check <id>` — full outcome/friction history for an item, including
  the `verify-miss` friction entry this how-to's real example quotes.
