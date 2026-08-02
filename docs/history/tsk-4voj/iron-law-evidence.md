---
item: tsk-4voj
timestamp: 2026-08-02T05:03:00.000Z
---

# Iron Law evidence: tsk-4voj

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2-D3 —
this item's final diff, classified the same way `approve` itself does
(`classifyIronLaw({filesChanged: changedFiles(repoRoot, item),
description})`), came back `required: true`:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Matched module: `bin/fgos.mjs` (this item's own fix edits the Iron Law
gate's own file). Full `filesChanged` at the time of this check:
`bin/fgos.mjs`, `docs/history/tsk-4voj-iron-law-leaf-scope/CONTEXT.md`,
`docs/history/tsk-4voj-iron-law-leaf-scope/plan.md`,
`test/cli/fgos.test.mjs`.

## Failing-test-first proof

The new regression test itself (`test/cli/fgos.test.mjs`, "approve of a
leaf item forked AFTER a sibling already merged a gated-module change
into the root does NOT trip Iron Law on the ancestor's file") is the
failing-test-first proof for this fix: it was run RED against the
pre-fix code (`bin/fgos.mjs` stashed back to its pre-change state via
`git stash push -- bin/fgos.mjs`), then GREEN after unstashing.

**RED (bin/fgos.mjs reverted, test file with the new test still in
place)** — real command and real output:

```
$ git stash push -- bin/fgos.mjs
$ node --test --test-name-pattern="forked AFTER a sibling" test/cli/fgos.test.mjs

✖ approve of a leaf item forked AFTER a sibling already merged a gated-module change into the root does NOT trip Iron Law on the ancestor's file (tsk-4voj false-positive closed) (411.904139ms)
  AssertionError [ERR_ASSERTION]: leaf's own diff never touches a gated module -- must approve without --acknowledge-iron-law: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-dwBr2U/.fgos/config.json#runner; edit .fgos/config.json by hand to change.
  fgos: approve: "iron-leaf-child" trips the Iron Law — a failing test must precede this self-modifying diff before it can land. Matched flags: [none]; matched modules: [src/runner/sibling-produced.mjs]. Re-run with --acknowledge-iron-law to confirm failing-test-first proof and proceed.

  4 !== 0

ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**GREEN (fix restored)** — real command and real output:

```
$ git stash pop
$ node --test --test-name-pattern="forked AFTER a sibling|OWN commit touches a gated module" test/cli/fgos.test.mjs

✔ approve of a leaf item forked AFTER a sibling already merged a gated-module change into the root does NOT trip Iron Law on the ancestor's file (tsk-4voj false-positive closed) (413.449813ms)
✔ approve of a leaf item whose OWN commit touches a gated module (src/runner/**) still REFUSES without --acknowledge-iron-law, even with leaf-scoped diff (tsk-4voj D1 does not under-scope) (335.037633ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

## Full verify command (real output)

The item's own `verify` field (`node --test 'test/state/**/*.test.mjs'
'test/cli/**/*.test.mjs' 'test/runner/**/*.test.mjs' 'test/e2e/**/*.test.mjs'
'test/evolve/**/*.test.mjs'`) run in full after the fix:

```
ℹ tests 1729
ℹ suites 0
ℹ pass 1724
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 122806.859832
```

Two pre-existing, unrelated failures found outside this verify's own
scope while running the unscoped `npm test` earlier — `test/architecture.
test.mjs` and `test/skills/fgos-mirror.test.mjs`, both independently
reproduced on `main` with zero changes applied — are filed separately as
`tsk-11t` and `tsk-4jk`, not fixed here (see `plan.md`'s Verify section).
