# Shared fragment: catchup self-recovery decision logic and playbooks

Central reference for self-recovery decision logic when a merge or approval operation lands on a `blocked` state. Called directly by `approve/SKILL.md` (the layer that actually attempts a merge and can hit these park reasons) as a mechanical step of its own step 7 table — `merge-next`/`merge-loop` inherit this for free through the existing call chain `merge-loop → merge-next → approve`, with no copy or reference of their own required.

This shared reference consolidates the rules, evidence bar, and playbooks for attempting self-recovery via `fgos catchup` (or flake diagnosis) across `approve`, `merge-next`, and `merge-loop`.

## Eligible reasons (`CATCHUP_REASONS`)

The 5 block reasons eligible for self-recovery playbooks are:

1. `verify-fail-post-merge`
2. `verify-timeout-post-merge`
3. `integration-drift`
4. `merge-failed-unclassified`
5. `merge-conflict`

Any reason not listed here (e.g. `iron-law`, `fgos-write-rejected`, plain `verify-fail`) has NO playbook in this shared file and must escalate or follow its caller's local handling.

## Universal rules for all playbooks

- **Ceiling: the calling context's own retry limit, never a new one invented here.** When invoked directly from `approve/SKILL.md` step 7 (the primary caller, single-shot) — approve's own **two-retries ceiling for mechanical fixes** applies (step 7: "Two retries is the ceiling for any mechanical fix. A third identical failure is not mechanical, whatever it looked like — report it."). When driven inside a loop-shaped caller instead, the once-per-id-per-loop-run cap applies: record `<id>` as "playbook already attempted" *before* attempting, whatever the outcome, and a later block on the same `<id>` in the same run — same reason or a different one — stops immediately. Never run a second playbook for the same id past whichever ceiling actually governs the calling context.
- **Leave a decision trail before acting, never after**:
  A playbook that resolves silently is indistinguishable from a real failure that got swallowed, so log the attempt first and its outcome after:
  ```bash
  fgos decision --id <id> \
    --text "<skill-name>: attempting the <reason> playbook for <id>" \
    --rationale "<the signal actually read from the envelope and friction detail>" \
    --relation none
  ```
  A playbook run that skipped this is a defect in the run, not a clean self-resolve.
- **Verified-not-blind evidence bar**: Retrying a `verify-fail-post-merge` or `verify-timeout-post-merge` park blindly is forbidden. A session MUST meet the verified evidence bar (isolating failing test file, verifying if in diff, running isolated test, fixing pre-existing bug on `main` if reproducible, or confirming flake) before retrying or moving an item back to `awaiting-approval`.
- **Reading `fgos catchup <id>`'s outcome**:
  The playbooks that recover through `catchup` all end here:
  - `outcome: "merged"` or `"already-caught-up"` — green; the item is back at `awaiting-approval`. Log the outcome decision and continue the calling context's own flow (retry step 6 when called from `approve` directly; continue the loop when called from a loop-shaped caller).
  - `outcome: "conflict"` — a real content conflict (`conflictedFiles` names which). **The playbook has failed.** Stop and report the id, the target branch, and the file list.
  - `outcome: "verify-fail"` with `timedOut: true` — timed out again. **The playbook has failed.** Stop and report.
  - `outcome: "verify-fail"` with `timedOut: false` — a real red verify on the merged tree (`exitStatus` and `output` carry proof). **The playbook has failed.** Stop and report the id and failing output lines. Never chain into another playbook — this id's attempt against the governing ceiling is spent.
  - The command itself errors (CLI failure) — stop and report the error verbatim; never retry it.

## The named playbooks

One per block reason. Read `<id>`'s merge target from the envelope's `target` field rather than assuming trunk.

### Playbook: verify-fail-post-merge

- **Signal**: `{picked: <id>, approve: {blocked, reason: "verify-fail-post-merge"}}` — the post-merge verify genuinely ran and failed (`timedOut` is absent or `false`); the merge was rolled back and the target is unchanged.
- **What the machine tries**: Walk `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`'s steps directly, in this same session:
  1. Read `approve`'s own `output` field from the response (the full test-suite output, not just the recorded `verify` command) and identify exactly which test(s) failed.
  2. Check whether the failing test's file is inside the item's own diff (`fgos review <id>` or branch's changed files) — a failure in a file the item never touched is the first signal it's unrelated noise.
  3. Re-run the failing test file alone a few times (`node --test path/to/the-failing.test.mjs`) — reproduces deterministically (a genuine pre-existing bug) or only fails under full-suite run (load-induced flake).
  4. If it's a genuine pre-existing bug, fix it as its own separate commit directly on `main` — never folded into `<id>`'s own branch/commits. Confirm the fix with the specific failing test, then the full suite, before moving on. If flake, no fix is needed.
  5. Either way (verified flake or pre-existing bug fixed on `main`), retry once: `fgos move <id> --to awaiting-approval` (the FSM's `blocked -> awaiting-approval` recovery door for this exact reason), then re-run approval/merge.
- **Stop condition**: The governing ceiling above (approve's two-retries when called from `approve`; once-per-id-per-run when called from a loop). Read retry outcome: `{picked: <id>, approve: {done}}` continues normally; blocked again for any reason stops immediately.
- **Reported on failure**: The id, which test failed, whether it sat inside the item's own diff, whether isolated re-runs reproduced it, and whether a pre-existing bug was fixed on `main`.

### Playbook: verify-timeout-post-merge

- **Signal**: `{picked: <id>, approve: {blocked, reason: "verify-timeout-post-merge"}}`. Confirm `timedOut: true` on the same envelope. `fgos check <id>`'s friction detail reads "goal-check timed out on staged merge ... after `<ms>`ms — not a verify failure; merge aborted, `<target>` unchanged, rerun catchup", and its `errorClass` is `verify-timeout`, never `verify-miss`.
- **What the machine tries**: `fgos catchup <id> --timeout <2× the budget that timed out>`, reading the timed-out budget from friction detail. The doubled budget applies to this one call only. **Never edit `.fgos/config.json`'s `runner.timeoutMs`**.
- **Stop condition**: The governing ceiling above, and a second timeout at the doubled budget stops immediately regardless.
- **Reported on failure**: The id, both budgets tried, that `<target>` is unchanged, output from catchup, and that the configured default timeout was left untouched.

### Playbook: integration-drift

- **Signal**: `{picked: <id>, approve: {blocked, reason: "integration-drift"}}`. Produced only for a root that HAS children merging into trunk, on either a conflict or non-timeout verify failure. Tell flavours apart via friction `errorClass`: `merge-conflict` vs `verify-miss`. Confirm the root has gathered all of its children first (no open descendants) — if any remain open, escalate without running this playbook; that carve-out is never this playbook's to skip.
- **What the machine tries**: One `fgos catchup <id>`. Merges current trunk INTO the root's own branch and re-verifies in an ephemeral worktree.
- **Stop condition**: The governing ceiling above.
- **Reported on failure**: The id, friction `errorClass`, `conflictedFiles` list or failing lines from `output`, and target unchanged.

### Playbook: merge-failed-unclassified

- **Signal**: `{picked: <id>, approve: {blocked, reason: "merge-failed-unclassified"}}` — `git merge --no-commit --no-ff` exited non-zero without staging a real conflict. Stderr is carried in friction detail.
- **What the machine tries**:
  1. Read stderr first. If it names a condition a retry cannot change (missing ref, "not a git repository", no space left on device, permission error), **stop without retrying** and report stderr.
  2. Otherwise, one `fgos catchup <id>`.
- **Stop condition**: The governing ceiling above, plus the non-retryable-stderr check.
- **Reported on failure**: The id, git's exit status and stderr verbatim, whether retry was attempted or skipped, and target unchanged.

### Playbook: merge-conflict

- **Signal**: `{picked: <id>, approve: {blocked, reason: "merge-conflict"}}` — post-merge `git merge --no-commit --no-ff` staged a real textual conflict; merge rolled back and target unchanged.
- **What the machine tries**: One `fgos catchup <id>` — merges item's target branch back into item's branch in ephemeral worktree, re-runs verify, and on green takes the `blocked -> awaiting-approval` edge.
- **Stop condition**: The governing ceiling above.
- **Reported on failure**: The id, `conflictedFiles` list or failing lines from `output`, and target unchanged.
