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
