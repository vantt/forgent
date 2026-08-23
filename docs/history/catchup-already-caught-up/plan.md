# plan — `fgos catchup` on an already-caught-up branch

Item: `tsk-k7i`. Decisions: `CONTEXT.md` D1 (guard + verify + move), D2
(`outcome: 'already-caught-up'`). Verify: `npm test`.

## Mode: standard

Flags counted: **2 of 10**.

- **public contracts** — the verb's `outcome` field is machine-readable
  output, and `docs/specs/runner.md:1021` is a locked contract describing
  `catchup`'s exact branch structure. Both change.
- **existing covered behavior** — D1's guard runs before the merge on
  *every* `catchup` call, so all existing covered scenarios execute through
  new code. There are **7** of them in `test/cli/fgos.test.mjs:5250`+, not
  the three the spec prose implies — counted by running
  `node --test --test-name-pattern 'catchup' test/cli/fgos.test.mjs`
  (8 pass, the eighth being the unknown-verb usage-string test): root
  integration-drift, leaf targeting the parent branch, real same-line
  conflict, inapplicable blocked reason, `--timeout`/`--no-timeout`
  conflict, nonexistent id, non-`blocked` status.

Not flagged: auth, authorization, data model, audit/security, external
systems, cross-platform, weak proof (the area has real CLI tests),
multi-domain.

Why not smaller: `small` assumes no gray areas and no contract change. Two
contracts move here — a locked spec section and the verb's output vocabulary
— and a wrong guard silently changes behavior on every existing `catchup`
path, not just the broken one. Why not larger: no hard-gate flag applies, the
shape is one guard in one `case` block, and `tsk-3yl` already proved the
identical guard on the sibling verb.

No split. This is one honest piece: guard, outcome, tests, docs. Nothing in
it is independently workable or independently valuable.

Graph position (`fgos graph --json`): not on `criticalPath` (depth 10, rooted
at `tsk-4vo`), absent from `topUnblock`. Deps empty, no dependents — nothing
downstream waits on this, so ordering below is internal only.

## Approach

Inside `case 'catchup'` (`bin/fgos.mjs:2229`), the ephemeral worktree is
still created first: `runGoalCheck` needs a checkout of the item's own
branch, and `repoRoot` is on `main`. The guard then runs inside that
worktree, before `git merge --no-commit --no-ff <target>`:

1. `git merge-base --is-ancestor <target> HEAD` in the ephemeral worktree.
   Exit 0 → already caught up. Exit 1 → not caught up, fall through to
   today's merge path unchanged. Any other exit → a real error, propagate.
2. Already caught up → skip merge and commit entirely; run `runGoalCheck` on
   the existing tree (D1: the status move must rest on a freshly-executed
   check).
   - green → `moveWork(blocked → awaiting-approval)`, the same D18 edge the
     clean path takes, and return `outcome: 'already-caught-up'` (D2).
   - red → return `outcome: 'verify-fail'`, item stays `blocked`. **No
     `git merge --abort`** on this path — no merge is in progress, so the
     clean path's abort call would itself throw.

Rejected alternatives:

- *Catch the `git commit` failure after the fact.* Rejected for the same
  reason `tsk-3yl` rejected it (`CONTEXT.md` D1): the "nothing to commit"
  wording is locale- and git-version-dependent; `is-ancestor` is not.
- *Guard before creating the ephemeral worktree.* Both refs resolve from
  `repoRoot`, so the check itself would work — but verify still needs the
  branch checked out, so the worktree gets created anyway. Guarding earlier
  buys nothing and splits the logic across two scopes.
- *Call `mergeRunnerItem`'s `isAlreadyMerged` directly.* Its argument order
  encodes the opposite merge direction, and `runner.md:1021` records that
  `catchup` deliberately performs its own merge rather than delegating.
  Whether to lift a shared helper is left open below.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| `merge-base --is-ancestor` exit-code handling — `catchup` uses `execFileSync` directly, not `merge.mjs`'s `git()` helper, so exit 1 arrives as a thrown `Error` with `status === 1` and must be read as boolean `false`, never an error | medium | A CLI test on an already-caught-up branch observes `outcome: 'already-caught-up'`, and a normal not-caught-up `catchup` still reaches the merge path — proving both exit codes route correctly |
| The red-verify branch skipping `git merge --abort` | medium | A CLI test with a failing verify on an already-caught-up branch returns `outcome: 'verify-fail'`, leaves the item `blocked`, and does not throw |
| Regression on the seven existing `catchup` scenarios, all of which now run through the guard | medium | `node --test --test-name-pattern 'catchup' test/cli/fgos.test.mjs` stays at 8 pass / 0 fail, with no test edited to accommodate the guard (that is the pre-change baseline, measured) |
| The `blocked → awaiting-approval` move on a path that created no commit | low | The already-caught-up green test asserts the item's status moved and that `git rev-parse HEAD` on the branch is unchanged from before the call |

Every medium above carries to `fgos-coding-validating` as a proof point; none is
settled by argument here.

## Shape (phased)

1. **Guard + already-caught-up path** — `bin/fgos.mjs`, `case 'catchup'`:
   the `is-ancestor` check inside the ephemeral worktree, the green branch
   (verify → `moveWork` → `outcome: 'already-caught-up'`), the red branch
   (verify-fail, no abort, stays `blocked`).
2. **Tests** — `test/cli/fgos.test.mjs`, in the existing `catchup` block:
   already-caught-up green (status moves, outcome is the new value, branch
   HEAD unchanged) and already-caught-up red (stays `blocked`, no throw).
   All seven existing scenarios stay untouched.
3. **Docs** — `docs/specs/runner.md:1021`: add the already-caught-up branch
   and the new `outcome` value to the recorded contract.
   `docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md:43`
   currently states this is "a real gap in `catchup`'s own already-caught-up
   edge case" and documents a manual workaround; that becomes false once
   phase 1 lands and must be corrected, not left standing.

Cases worth proving against, beyond the risk map: an item blocked for each
of the three accepted reasons (`merge-conflict`, `verify-fail-post-merge`,
`integration-drift`) reaching the guard identically — the guard must not
read `item.reason`; and a leaf item, whose target is the parent's
integration branch rather than `main`, hitting the same guard.

## Open for planning-adjacent judgment

Whether the guard is inlined in `case 'catchup'` or lifted into a helper
shared with `merge.mjs`'s `isAlreadyMerged`. Inline is the smaller change
and matches the deliberate no-delegation stance in `runner.md:1021`; a
shared helper avoids two exit-code-handling implementations of the same git
primitive. Not decided here — it changes no behavior and no contract.
