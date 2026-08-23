# Iron Law evidence — state/runner merge boundary (tsk-49i)

Accumulated per item, never overwritten. One section per `approve
--acknowledge-iron-law` run.

Scope of the human pre-authorization (decision log of `tsk-49i`,
2026-08-15T04:19:44Z): children of `tsk-49i` merging into the parent branch
`fgw/tsk-49i` ONLY. Merging `tsk-49i` itself into `main` is explicitly
excluded and still needs a fresh human decision.

---

## tsk-49i-1 — cut the 5 state→runner import edges

**Why the gate fires.** `classifyIronLaw` over this item's own changed-file
list (`src/evolve/iron-law.mjs`, run against the real working tree before
commit):

```
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/claim-port.mjs",
    "src/runner/frozen-judge.mjs",
    "src/runner/loop.mjs",
    "src/runner/merge.mjs",
    "src/runner/promote-engine.mjs",
    "src/runner/root-affinity.mjs",
    "src/runner/worktree.mjs",
    "src/state/store.mjs",
    "src/runner/iron-law-gate.mjs"
  ]
}
```

**Command used as the failing-before / passing-after proof** — the item's own
registered `verify`:

```
npm test \
  && test -f src/runner/iron-law-gate.mjs \
  && test -f src/util/session-identity.mjs \
  && test -f src/util/normalize-path.mjs \
  && grep -qF ironLawForItem bin/fgos.mjs \
  && ! grep -rqF ../runner/ src/state/ \
  && ! grep -rqF runner/session-identity plugins/fgOS/skills/terminal/rename.sh .githooks/pre-commit \
  && ! grep -qF 1.1.0 plugins/fgOS/.claude-plugin/plugin.json
```

### RED — before the change (worktree at `7b84c46e`, parent branch tip)

Structural clauses run on the untouched tree:

```
$ test -f src/runner/iron-law-gate.mjs && test -f src/util/session-identity.mjs \
  && test -f src/util/normalize-path.mjs && grep -qF ironLawForItem bin/fgos.mjs \
  && ! grep -rqF ../runner/ src/state/ \
  && ! grep -rqF runner/session-identity plugins/fgOS/skills/terminal/rename.sh .githooks/pre-commit \
  && ! grep -qF 1.1.0 plugins/fgOS/.claude-plugin/plugin.json
exit=1
```

Every clause was red on that tree, not just the first: neither
`src/runner/iron-law-gate.mjs` nor `src/util/session-identity.mjs` nor
`src/util/normalize-path.mjs` existed; `ironLawForItem` appeared nowhere in
`bin/fgos.mjs`; `grep -rn "\.\./runner/" src/state/` returned all five import
edges (`cleanup-harness.mjs:41`, `drift-status.mjs:18`, `graph-harness.mjs:23`,
`store.mjs:42`, `graph-metrics.mjs:18`); both `plugins/fgOS/skills/terminal/
rename.sh` and `.githooks/pre-commit` still carried the
`runner/session-identity` path; `plugin.json` was still at `1.1.0`.

### RED — a real behavior regression the suite caught mid-change

Moving `detectTrunk`/`isMainWorktree` out of `merge.mjs` into `worktree.mjs`
also moved them onto `worktree.mjs`'s own `git` helper, which — unlike
`merge.mjs`'s — inherits git's stderr instead of piping it:

```
✖ list on a fresh non-worktree dir with no store at all: exit 0, empty view,
  no warning (legitimately "not evaluated", not a worktree footgun)
  AssertionError: Expected values to be strictly equal:
  + 'fatal: not a git repository (or any of the parent directories): .git\n'
  - ''
```

Fixed by giving the two moved probes a `gitQuiet` helper with the exact
`stdio: ['ignore', 'pipe', 'pipe']` they had at their previous home.

A second failure in the same run — `.agents/skills/_shared` and
`plugins/fgOS/skills/_shared` must stay byte-identical — was the mirror copy
of `capacity-dispatch-fallback.md` not yet carrying the new module path.

### GREEN — after the change

```
$ npm test
ℹ tests 3338
ℹ pass 3333
ℹ fail 0

$ test -f src/runner/iron-law-gate.mjs && test -f src/util/session-identity.mjs \
  && test -f src/util/normalize-path.mjs && grep -qF ironLawForItem bin/fgos.mjs \
  && ! grep -rqF ../runner/ src/state/ \
  && ! grep -rqF runner/session-identity plugins/fgOS/skills/terminal/rename.sh .githooks/pre-commit \
  && ! grep -qF 1.1.0 plugins/fgOS/.claude-plugin/plugin.json
exit=0

$ node --test test/architecture.test.mjs
✔ đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một
✔ mọi row dùng tầng đã khai trong layers
✔ import một chiều xuống: không file nào import ngược lên tầng trên
ℹ pass 3  ℹ fail 0
```

---

## tsk-49i-2 — extract the merge cluster's use-case layer

**Why the gate fires.** `classifyIronLaw` over this item's own changed-file
list, run against the real working tree before commit:

```
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/merge.mjs",
    "src/runner/worktree.mjs"
  ]
}
```

**Command used as the failing-before / passing-after proof** — the item's
own registered `verify`:

```
npm test \
  && test -d src/verbs/merge \
  && test -f src/report/item-trace.mjs \
  && ! grep -qF state/drift-status bin/fgos.mjs
```

### RED — before the change (worktree at `f22f1497`, parent branch tip)

```
$ test -d src/verbs/merge && test -f src/report/item-trace.mjs \
  && ! grep -qF state/drift-status bin/fgos.mjs
exit=1
```

All three structural clauses were red on that tree: `src/verbs/` did not
exist at all, `src/report/item-trace.mjs` did not exist, and `bin/fgos.mjs`
still imported `driftStatus` from `../src/state/drift-status.mjs` directly
(the drift read is now the `merge` use case's, so the entry file no longer
names that module).

### RED — three real regressions the suite caught mid-change

All three were caught by running the suite per extracted verb rather than
once at the end:

```
✖ approve of a leaf item with a clean merge lands the work on fgw/<root> …
  fgos: execFileSync is not defined
```
the moved `approve` body still shelled `git merge-base --is-ancestor`
directly and needed its own `node:child_process` import.

```
✖ approve --github --pr on a fake gh merge success transitions the item
  awaiting-approval -> delivered with role human
  fgos: ghCommandOpts is not defined
```
the moved body still called the adapter's env reader; the gh command now
arrives through `options.ghCommand`, keeping "a use case never reads
process.env" intact.

```
✖ sync-root / approve: `runMerge` has already been declared
```
caught at `node --check` while assembling the moved bodies.

### GREEN — after the change

```
$ npm test
ℹ tests 3338
ℹ pass 3333
ℹ fail 0

$ test -d src/verbs/merge && test -f src/report/item-trace.mjs \
  && ! grep -qF state/drift-status bin/fgos.mjs
exit=0

$ node --test test/architecture.test.mjs
✔ đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một
✔ mọi row dùng tầng đã khai trong layers
✔ import một chiều xuống: không file nào import ngược lên tầng trên
ℹ pass 3  ℹ fail 0
```

One flake seen once and not reproducible: `concurrent movePorting calls on
DIFFERENT ids never lose a write to state.json (tsk-1q5)` failed on one
full-suite run at 10.4s, passed alone and on the next full run. It exercises
`movePorting`/`state.json` locking, which this item does not touch.

---

## tsk-55f — lazy verify-timeout resolution (regression from tsk-49i-2)

Found by the branch review of `main...fgw/tsk-49i`, then reproduced by hand
before anything was written.

**Why the gate fires.** `classifyIronLaw` over this item's own changed-file
list:

```
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs"
  ]
}
```

**Command used as the failing-before / passing-after proof** — the item's
own registered `verify`:

```
npm test \
  && test -f test/cli/fgos-merge-next-no-config-write.test.mjs \
  && grep -qF resolveTimeoutMs src/verbs/merge/sync-root.mjs
```

### RED — reproduced by hand first, on two identical fresh repos

Two temp git repos, each with a store initialized and no runner config,
one driven by `main`'s binary and one by the branch's:

```
$ <main>/bin/fgos.mjs sync-root nosuchid --dir <repo-old>/.fgos
fgos: sync-root: work "nosuchid" not found.
$ ls <repo-old>/.fgos/          # no config.json

$ <branch>/bin/fgos.mjs sync-root nosuchid --dir <repo-new>/.fgos
fgos: no runner config found — detected "claude" on PATH; wrote a default
      (executor: claude) at …/.fgos/config.json#runner; edit .fgos/config.json
      by hand to change.
fgos: sync-root: work "nosuchid" not found.
```

Same split for `merge next` with nothing ready: `main` printed only
`{"picked": null}`, the branch wrote a default runner config first.

### RED — the regression test, run against the unfixed tree

The fix was stashed (`git stash push -u -m tsk-55f-fix-probe -- bin/fgos.mjs
src/verbs/merge/approve.mjs src/verbs/merge/sync-root.mjs`) and the new test
run against the code as `tsk-49i-2` left it:

```
$ node --test test/cli/fgos-merge-next-no-config-write.test.mjs
✖ merge next with nothing ready writes no runner config — its outcome is a
  pure read (tsk-55f)
  AssertionError: merge next resolved a verify timeout before deciding
  anything, writing a default runner config
✖ sync-root refusing an unknown id writes no runner config — the refusal is
  side-effect-free (tsk-55f)
  AssertionError: sync-root resolved its verify timeout before the item
  guard, writing a default runner config
ℹ tests 2  ℹ pass 0  ℹ fail 2
```

The stash was then re-applied by name and dropped — never popped, since the
stash stack is shared across every worktree of this repo.

### GREEN — after the change

```
$ node --test test/cli/fgos-merge-next-no-config-write.test.mjs
ℹ tests 2  ℹ pass 2  ℹ fail 0

$ npm test
ℹ tests 3340
ℹ pass 3335
ℹ fail 0

$ test -f test/cli/fgos-merge-next-no-config-write.test.mjs \
  && grep -qF resolveTimeoutMs src/verbs/merge/sync-root.mjs
exit=0
```

---

## tsk-2fx — lazy wait-flag parsing (second half of the same regression)

Found by the branch review, which read the tree at `36e85ae5` — before
`tsk-55f` landed. Its timeout findings were already fixed by that item; this
is the half that survived, re-confirmed against the current branch tip.

**Why the gate fires.** `classifyIronLaw` over this item's own changed-file
list:

```
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/worktree.mjs"
  ]
}
```

**Command used as the failing-before / passing-after proof** — the item's
own registered `verify`:

```
npm test \
  && test -f test/cli/fgos-merge-next-idle-turn.test.mjs \
  && grep -qF resolveWaitFlags src/verbs/merge/approve.mjs
```

### RED — reproduced by hand first, on two identical fresh repos

`tsk-55f` deferred `resolveVerifyTimeoutMs` but left `parseWaitFlags` eager
in `parseMergeClusterOptions`, so an idle `merge next` still validated
`approve`'s wait flags before deciding it had nothing to do:

```
$ <main>/bin/fgos.mjs merge next --wait 0 --dir <repo-old>/.fgos
{"picked": null, "reason": "nothing ready to merge"}          exit 0

$ <branch>/bin/fgos.mjs merge next --wait 0 --dir <repo-new>/.fgos
fgos: approve --wait must be a positive number of milliseconds (got "0").
                                                              exit 4
```

That flips the shape merge-loop's own pool-empty stop rule reads: a driver
carrying a stale `--wait` stops on an error instead of stopping cleanly.
The `--timeout` variant was already green, confirming `tsk-55f` held.

### RED — the regression test, run against the unfixed tree

The fix was stashed (`git stash push -u -m tsk-2fx-fix-probe -- bin/fgos.mjs
src/verbs/merge/approve.mjs src/verbs/merge/sync-root.mjs`), then:

```
$ node --test test/cli/fgos-merge-next-idle-turn.test.mjs
✖ merge next with nothing ready ignores a malformed --wait and still
  reports an empty pool (tsk-2fx)
✖ sync-root refusing an unknown id names the item, not a --wait typo — its
  guards run first (tsk-2fx)
ℹ tests 4  ℹ pass 2  ℹ fail 2
```

The two `approve` cases passed even unfixed — deliberate: they prove
laziness MOVES the parse rather than removing it, so they must be green on
both sides. The stash was re-applied by name and dropped, never popped.

### GREEN — after the change

```
$ node --test test/cli/fgos-merge-next-idle-turn.test.mjs
ℹ tests 4  ℹ pass 4  ℹ fail 0

$ npm test
ℹ tests 3344
ℹ pass 3339
ℹ fail 0
```

Also folded in, both orphaned by this same branch and confirmed dead:
`bin/fgos.mjs` no longer imports `changedFiles` (its only three call sites
were the Iron Law checks that moved into `iron-law-gate.mjs`), and
`worktree.mjs`'s `gitRead` doc no longer claims to be exported.

---

## tsk-h6r — `review --pr` validated in the verb, not the adapter

Last live finding from the branch review, re-confirmed against the tip after
`tsk-2fx`.

**Why the gate fires.** `classifyIronLaw` matched `bin/fgos.mjs`.

**Command used as the failing-before / passing-after proof** — the item's
own registered `verify`:

```
npm test \
  && test -f test/cli/fgos-review-pr-precedence.test.mjs \
  && ! grep -qF "optionalField(flags.pr" bin/fgos.mjs
```

### RED — reproduced by hand first

```
$ <main>/bin/fgos.mjs review nosuch --github --pr --dir <repo-old>/.fgos
fgos: review: work "nosuch" not found.

$ <branch>/bin/fgos.mjs review nosuch --github --pr --dir <repo-new>/.fgos
fgos: review --github --pr requires a PR number: --pr <n>
```

Exit 4 either way, so nothing keyed on exit codes changes — the cost is that
a caller with both a bad id and a bare `--pr` is told about the flag instead
of the item that does not exist.

### RED — the regression test, run against the unfixed tree

Fix stashed (`git stash push -u -m tsk-h6r-fix-probe -- bin/fgos.mjs
src/verbs/merge/review.mjs`):

```
$ node --test test/cli/fgos-review-pr-precedence.test.mjs
✖ review on an unknown id reports the item, not the bare --pr flag (tsk-h6r)
ℹ tests 3  ℹ pass 2  ℹ fail 1
```

The other two cases pass on both sides deliberately: they pin that the
refusal still happens once the guards ahead of it pass, and that a stray
`--pr` without `--github` stays ignored. Building that second case also
surfaced a guard this evidence should record: the `--pr` check sits behind
`classifySource`, so the fixture has to be runner-sourced — a legacy item is
refused for its source first, on both main and the branch.

### GREEN — after the change

```
$ node --test test/cli/fgos-review-pr-precedence.test.mjs
ℹ tests 3  ℹ pass 3  ℹ fail 0

$ npm test
ℹ tests 3347
ℹ pass 3342
ℹ fail 0
```
