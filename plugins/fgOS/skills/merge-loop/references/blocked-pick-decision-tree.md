# The blocked-pick decision tree — full mechanics

The full detail behind SKILL.md's Step 4, for the "anything else is a
blocked pick" branch. Work every blocked pick through these four
sections, in order, never skipping ahead: escalate-only carve-outs, the
rules every playbook obeys, the named playbooks, and the same-id-twice
stop rule for reasons with no playbook.

## Escalate-only carve-outs, checked before any playbook

Two cases never get a playbook, whatever `reason` came back and however
many attempts are notionally left:

- **Iron Law** (`blocked: "iron-law"`, or an `approve` block whose reason
  is `iron-law`) — never run a playbook for it, never call `fgos
  catchup`, never call `fgos ask <id>` to park it, and never run
  `/fgOS:approve <id> --acknowledge-iron-law` on this skill's own
  authority. An Iron Law hold always needs a real human operator, with no
  exception this skill is ever allowed to apply.

  **Record it and walk past it; the run continues.** Add `<id>` to this
  run's Iron Law list and go on to the next iteration. One held item must
  not hold up the items behind it that can still land, and a person
  should be called back once for the whole list rather than once per held
  item — Step 5 gathers each one's evidence and Step 6 presents them all
  together.

  **The held item stays exactly `awaiting-approval`.** Never `fgos ask`
  it, never move it to `awaiting-human`, never move it at all. There is
  deliberately no `awaiting-approval → awaiting-human` FSM edge to use
  here — building one was considered and rejected. Skipping happens in
  this prose, never in the item's state.

  One id, one record: if an id already on this run's Iron Law list comes
  back `iron-law` again on a later iteration, that is no progress — end
  the loop there, with the list as it stands. The engine normally parks a
  known-tripping candidate into `skipped` on the following call rather
  than re-attempting it, so a second live trip for the same id means its
  pre-check and the real gate disagree, which re-running cannot fix.

- **A root that has not gathered all of its children.** The blocked
  `<id>` resolves to itself as root (so its merge target is the trunk,
  not a `fgw/<rootId>` integration branch) AND at least one of its
  descendants is still open. Stop the loop and report; run no playbook,
  no `catchup`, no retry. Landing a root into the trunk while any of its
  children are still open is exactly the partial land this design
  forbids, and retrying never makes it safe — the missing children are
  the problem, not the merge.

  Read this, never infer it:

  ```bash
  fgos rollup <id>
  ```

  A descendant counts as finished only when its `status` is one of
  `delivered`/`retrospective`/`cleanup`/`done`/`wontfix` — anything else,
  including `blocked` and `awaiting-approval`, is still open. Walk the
  whole chain, not just direct children: an open grandchild anchors the
  root exactly the way an open child does.

## The rules every playbook obeys

- **At most once per id per loop run.** Record `<id>` as "playbook
  already attempted" *before* attempting, whatever the outcome. If a
  later iteration blocks that same `<id>` again — same reason or a
  different one — that is a "no progress" stop: stop the loop
  immediately and report. Never run a second playbook for the same id in
  the same run, and never re-run the same one.
- **Leave a decision trail before acting, never after.** A playbook that
  resolves silently is indistinguishable from a real failure that got
  swallowed, so log the attempt first and its outcome after:

  ```bash
  fgos decision --id <id> \
    --text "merge-loop: attempting the <reason> playbook for <id>" \
    --rationale "<the signal actually read from the envelope and from fgos check <id>'s friction detail>" \
    --relation none
  ```

  A playbook run that skipped this is a defect in the run, not a clean
  self-resolve.
- **Reading `fgos catchup <id>`'s outcome.** The playbooks that recover
  through `catchup` all end here, so this is written once:
  - `outcome: "merged"` or `"already-caught-up"` — green; the item is
    back at `awaiting-approval`. Log the outcome decision and continue
    the loop, which picks it up normally on a later iteration.
  - `outcome: "conflict"` — a real content conflict, `conflictedFiles`
    naming exactly which. **The playbook has failed.** Stop the loop and
    report the id, the target branch, and that file list.
  - `outcome: "verify-fail"` with `timedOut: true` — timed out again.
    **The playbook has failed.** Stop and report per the timeout entry
    below.
  - `outcome: "verify-fail"` with `timedOut: false` — a real red verify
    on the merged tree; `exitStatus` and `output` carry the proof. **The
    playbook has failed.** Stop the loop and report the id and the
    failing lines from `output`. Never chain from here into the
    `verify-fail-post-merge` playbook — this id's one attempt per run is
    already spent.
  - The command itself errors (a real CLI failure, not a reported
    outcome) — stop and report the error verbatim; never retry it.

  A playbook that runs when it should not have can waste a cycle, but it
  cannot land anything broken: `catchup` runs the item's own `verify` on
  the staged merge and `git merge --abort`s on red, before any commit.

## The named playbooks

One per block reason. Read `<id>`'s merge target from the envelope's
`target` field rather than assuming the trunk — every reason below can
arrive from a leaf→root merge as well as a root→trunk one.

**Playbook: verify-fail-post-merge**

- *Signal*: `{picked: <id>, approve: {blocked, reason:
  "verify-fail-post-merge"}}` — the post-merge verify genuinely ran and
  failed (`timedOut` is absent or `false`); the merge was rolled back and
  the target is unchanged.
- *What the machine tries*: walk
  `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`'s
  steps directly, in this same session:
  1. Read `approve`'s own `output` field from the response (the full
     test-suite output, not just the recorded `verify` command) and
     identify exactly which test(s) failed.
  2. Check whether the failing test's file is inside the item's own diff
     (`fgos review <id>` or the branch's changed files) — a failure in a
     file the item never touched is the first signal it's unrelated
     noise.
  3. Re-run the failing test file alone a few times (`node --test
     path/to/the-failing.test.mjs`) — reproduces deterministically (a
     genuine pre-existing bug) or only fails under the full-suite run
     (load-induced flake).
  4. If it's a genuine pre-existing bug, fix it as its own separate
     commit directly on `main` — never folded into `<id>`'s own
     branch/commits. Confirm the fix with the specific failing test, then
     the full suite, before moving on. If it's flake, no fix is needed.
  5. Either way, retry once: `fgos move <id> --to awaiting-approval` (the
     FSM's `blocked -> awaiting-approval` recovery door for this exact
     reason), then run `/fgOS:merge-next` again.
- *Stop condition*: the once-per-id-per-run rule above. Read the retry's
  own result: `{picked: <id>, approve: {done}}` continues the loop
  normally; blocked again for any reason — identical
  `verify-fail-post-merge` with no progress, or now a different one —
  stops the loop immediately, without falling through to the
  same-id-twice rule.
- *Reported on failure*: the id, which test failed and whether it sat
  inside the item's own diff, whether the isolated re-runs reproduced it,
  and whether a pre-existing bug was fixed on `main` along the way.

**Playbook: verify-timeout-post-merge**

- *Signal*: `{picked: <id>, approve: {blocked, reason:
  "verify-timeout-post-merge"}}`. Confirm `timedOut: true` on the same
  envelope before treating it as a timeout — reason and flag are set
  from the same value, so a mismatch means something else is wrong and
  this playbook does not apply. `fgos check <id>`'s friction detail reads
  "goal-check timed out on staged merge ... after `<ms>`ms — not a verify
  failure; merge aborted, `<target>` unchanged, rerun catchup", and its
  `errorClass` is `verify-timeout`, never `verify-miss`.
- *What the machine tries*: exactly what that detail line already
  prescribes, once — `fgos catchup <id> --timeout <2× the budget that
  timed out>`, reading the timed-out budget from the friction detail. The
  doubled budget applies to this one call only. **Never edit
  `.fgos/config.json`'s `runner.timeoutMs`**: raising the default is a
  named-and-rejected fix — it papers over the symptom, and an even
  slower machine would just hit the same wall at a higher number — and it
  would silently change every other item's budget too.
- *Stop condition*: the once-per-id-per-run rule, and a second timeout at
  the doubled budget stops immediately. Two timeouts in a row is no
  longer a load blip, and this skill cannot tell a genuinely hung verify
  from a merely overloaded machine past that point.
- *Reported on failure*: the id, both budgets tried, that `<target>` is
  unchanged, any `output` catchup returned, and — explicitly — that the
  configured default timeout was left untouched, so a person reading the
  report knows the number they see is still the repo's own.

**Playbook: integration-drift**

- *Signal*: `{picked: <id>, approve: {blocked, reason:
  "integration-drift"}}`. This reason is produced only for a root that
  HAS children merging into the trunk, on either a conflict or a
  non-timeout verify failure. Tell the two flavours apart from `fgos
  check <id>`'s friction `errorClass`: `merge-conflict` (the root's
  aggregate diff conflicts with the trunk's current tip) versus
  `verify-miss` (it merged cleanly, but the merged tree fails the root's
  own verify).
- *Run the ungathered-root carve-out first and honour it.* This reason is
  the shape that carve-out most often lands on: a root with any
  descendant still open escalates, and this playbook never runs for it.
- *What the machine tries*: one `fgos catchup <id>`. That is precisely
  the operation the reason names — merge the current trunk INTO the
  root's own branch and re-verify there, in an ephemeral worktree outside
  the shared checkout, rather than re-attempting the same stale merge
  into the trunk.
- *Stop condition*: the once-per-id-per-run rule. A `conflict` or a red
  verify from that catchup stops immediately — those are exactly the
  "real conflict" and "real red verify" the design reserves for a
  person.
- *Reported on failure*: the id, which flavour the friction `errorClass`
  named, the `conflictedFiles` list or the failing lines from `output`,
  and that the trunk is unchanged — both `approve` and `catchup` abort
  before committing anything.

**Playbook: merge-failed-unclassified**

- *Signal*: `{picked: <id>, approve: {blocked, reason:
  "merge-failed-unclassified"}}` — `git merge --no-commit --no-ff` exited
  non-zero without staging a real conflict. `fgos check <id>`'s friction
  detail carries git's own exit status and stderr verbatim ("failed
  without a real conflict (exit `<n>`): `<stderr>`").
- *What the machine tries*:
  1. Read that stderr first. If it names a condition a retry cannot
     change — a missing ref, "not a git repository", no space left on
     device, a permission error — **stop without retrying** and report
     the stderr. A retry is not a recovery for any of those, and
     spending the attempt on one only delays the report.
  2. Otherwise, one `fgos catchup <id>`. This reason is the best fit for
     catchup among the merge-related parks: nothing actually conflicted,
     so simply re-attempting the merge often just succeeds once whatever
     transient condition caused it has passed.
- *Stop condition*: the once-per-id-per-run rule, plus the
  non-retryable-stderr check above, which stops before the attempt is
  spent at all.
- *Reported on failure*: the id, git's exit status and stderr verbatim
  from the friction detail, whether a retry was attempted or skipped as
  non-retryable, and that the target is unchanged (`merge --abort`
  already ran, or the merge was never attempted).

**Playbook: merge-conflict**

- *Signal*: `{picked: <id>, approve: {blocked, reason:
  "merge-conflict"}}` — the post-merge `git merge --no-commit --no-ff`
  staged a real textual conflict; the merge was rolled back and the
  target is unchanged.
- *What the machine tries*: one `fgos catchup <id>` — merges the item's
  own target branch back into the item's own branch inside an ephemeral
  worktree, re-runs the item's own `verify` there, and on green takes the
  `blocked -> awaiting-approval` edge itself. Walk
  `docs/how-to/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md`:
  1. Run `fgos catchup <id>` (appending whichever of `--timeout <ms>`/
     `--no-timeout` Step 1 parsed). It resolves its own repo root from
     `--dir`, so it runs correctly from any directory — never leave or
     enter a worktree first to make it work.
  2. Read the returned `outcome` and act on exactly that, nothing else —
     the "reading `fgos catchup <id>`'s outcome" rule above already
     covers all four possible outcomes; this playbook follows it exactly
     like the three above it, never a variant of its own.
- *Stop condition*: the once-per-id-per-run rule.
- *Reported on failure*: the id, the returned `conflictedFiles` list (a
  real conflict survived the playbook) or the failing lines from
  `output` (a real red verify on the reconciled tree), and that the
  target is unchanged.

## The same-id-twice stop rule, for reasons with no playbook

This rule fires **only for a block reason that has NO playbook** above.
It used to swallow every reason indiscriminately, which meant a
documented, machine-runnable recovery stopped the loop and woke a person
for nothing.

Reasons with no playbook today: `fgos-write-rejected`, plain
`verify-fail`, and any reason this file does not name at all — a reason
added to the CLI later correctly falls here rather than being guessed at.

For those reasons only, compare `<id>` against the id picked (and
blocked) on the immediately preceding iteration:

- **Different id, or this is the first blocked pick of the run** —
  normal. Continue to the next iteration, remembering this `<id>` as
  "last blocked."
- **Same `<id>` blocked on two consecutive iterations in a row** — stop
  the loop. Report the id and the block reason(s) in a plain chat
  message in the current conversation.

A reason that DOES have a playbook never reaches this rule; the
once-per-run rule above is its stop instead, and that one fires on the
FIRST repeat rather than the second. Narrowing this rule therefore makes
the loop stricter for playbook reasons, not more permissive — the only
thing it removes is the wait for a second identical block before a
person is told.
