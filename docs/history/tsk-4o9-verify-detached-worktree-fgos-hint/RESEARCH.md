# RESEARCH: which door did tsk-3fj go through, and what's the real gap

## Round 1 (tsk-4o9, stage discovery)

**Checked:** `readRawEvents`'d the full event history for `tsk-3fj` (24
events) and the specific event the item cites at seq 10387 (belongs to
`tsk-3fj`'s own parent, `tsk-5wz`), `bin/fgos.mjs`'s `return` case
(:2367-2557, both branch-source and main-source blocked paths),
`src/runner/goal-check.mjs` (`runGoalCheck`'s real return shape), `git
log`/`git diff` between the scan's own snapshot (`806ac1a`) and current
HEAD for `test/runner/dispatch.test.mjs`, and a fresh `listWork` scan for
every item whose CURRENT `verify` field contains the literal substring
`.fgos/`.

**Door determined — `fgos return`, not `fgos move` (the item's own
primary question):** `tsk-3fj`'s event at `seq 10491` (`work.move`,
`doing` -> `awaiting-approval`) carries `branchHeadAtReturn:
"3e120c7f8290b051bfebacfd5f17e2e30f78b3bb"` — a field `store.mjs`'s own
comments confirm is stamped ONLY by `return`'s own call to `moveWork`
(never by a raw `fgos move`, which never computes or passes it). The very
next event, `seq 10492` (`work.outcome`), carries `payload.actual =
{outcome: "awaiting-approval", passed: true, attempts: 1, errorClass:
null, aheadCount: 3}` — the exact "predicted-at-claim, actual-at-close"
bookkeeping only `return`'s success path writes (`addOutcome`, called
right after the passing `moveWork` in both of `bin/fgos.mjs`'s `return`
branches). The item's own uncertainty ("headAtReturn null on both this
item and a confirmed-return item") checked the wrong field: `tsk-3fj` is
a branch-sourced item (`fgw/tsk-3fj` exists), so the discriminating field
is `branchHeadAtReturn`, not `headAtReturn` (main-source-only, per
`store.mjs`'s own "Branch-source take/return markers" comment) — and
`branchHeadAtReturn` IS present. Conclusion: this is NOT a `tsk-280`-class
`fgos move` bypass.

**Original red-verify symptom is already resolved, by unrelated work:**
current HEAD is 369 commits ahead of the scan's own snapshot
(`806ac1a`). `git log 806ac1a..HEAD -- test/runner/dispatch.test.mjs`
shows `44d5c4cc fix(tsk-49u): dispatch.test.mjs expects
coding-classify-intake gone` — a later, unrelated item already updated
the test to match the capacity's own retirement (confirmed by `tsk-3fj`'s
own retrospective doc,
`docs/explanation/coding-classify-intake-capacity-lifecycle-created-then-
retired-as-dead-config.md`). Running `node --test
test/runner/dispatch.test.mjs` right now: 179/179 pass, 0 fail. The
scan's "verify ĐỎ ngay lúc này" claim is stale relative to current HEAD,
not a live gap this item needs to fix.

**The real, still-open gap:** `tsk-3fj`'s own `verify` field was
hand-edited 3 times in 24 minutes (`seq 10386` @ 08:53:50, `seq 10423` @
09:00:02, `seq 10489` @ 09:17:34) — each edit narrowing the command
further. The ORIGINAL verify
(`"node bin/fgos.mjs doctor && git show --stat HEAD | grep -qv
'.fgos/config.json' && echo ok"`) invokes `fgos doctor`, which reads
`.fgos/config.json` for its own config checks — a dependency that
structurally cannot be satisfied in `return`'s own re-verify step, which
runs inside a genuinely detached, disposable git worktree
(`git worktree add --detach tmpWorktree branchHead`,
`bin/fgos.mjs:2431`) that per ADR0020 never carries `.fgos/` at all. The
human already knew this constraint in the abstract — `tsk-3fj`'s own
PARENT item (`tsk-5wz`, `seq 10387`) literally documents it in its own
verify text item #7: "một lệnh đọc .fgos/ không thể pass trong
detached-worktree re-verify của fgos return (ADR0020)" — but nothing
warned or caught it AT THE POINT `tsk-3fj`'s own doomed verify was
written, so the human had to discover the failure empirically and
iterate 3 times to find a command that would pass.

**Fix shape confirmed feasible, false-positive risk of the obvious
approach confirmed real:** `runGoalCheck` (`goal-check.mjs:33-106`)
already captures `output` = combined stdout+stderr from the real verify
run, and both of `return`'s blocked paths (`bin/fgos.mjs:2472-2488`
branch-source, `:2538-2551` main-source) already call `addFriction` with
a `detail` string — the natural place to append an advisory hint. A
NAIVE alternative (pattern-match the verify STRING itself for the
literal substring `.fgos/`, blocking at edit/return time) was checked
against every item's CURRENT real verify field and found to have genuine
false positives: `tsk-3ce` uses an absolute path (works fine in a
detached worktree), `tsk-2ta`/`tsk-2ta-4` grep a doc FILE'S content for
the string `~/.fgos/config.json` (never touches the real directory),
`tsk-f38`/`tsk-5hv` use `.fgos/` only inside an `rg`/`grep` EXCLUSION
glob (`--glob '!.fgos/...'`, never a dependency). Checking the real
FAILURE OUTPUT instead of the verify command string avoids all of these:
none of those 4 items' verify commands would ever actually produce an
error mentioning `.fgos` + `ENOENT`/`not found`, since none of them
depend on `.fgos/`'s presence.

**Verdict:** `{clear: true, verify: "node --test test/runner/goal-check.test.mjs test/cli/fgos.test.mjs && npm test"}`
