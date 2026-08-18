# tsk-2bg — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

This is a **high-risk** item (`plan.md`'s own Mode gate: hard-gate flag
`audit/security` — this item adds an opt-in bypass to a trust-boundary
guard on `promote-to-component`, a verb that performs real git merges of
multiple member branches) — the evidence below follows the same
thoroughness `tsk-4uj`'s own `iron-law-evidence.md` used for the sibling
`sync-root`/`approve` change.

## Test command

`node --test test/cli/fgos.test.mjs test/runner/promote-engine.test.mjs`
(the item's own recorded `verify`); the excerpts below are the item's own
new tests specifically (`--test-name-pattern="promote-to-component"`),
then the full `test/cli/fgos.test.mjs` suite result.

## Failing-before (real transcript excerpt, before this item's `bin/fgos.mjs` edit)

`promote-to-component` temporarily reverted to `const repoRoot =
process.cwd();` (no `--trust-dir` branch) — exactly the pre-fix shape:

```
promote-to-component --trust-dir with --dir succeeds from inside a linked worktree (tsk-2bg) (540.369328ms)
  AssertionError [ERR_ASSERTION]: fgos: promote-to-component: refusing to run from "/tmp/fgos-cli-ptc-trust-wt-zOajyR/wt" — this must run from the main checkout, which a linked worktree structurally is not.
  4 !== 0
ℹ tests 2
ℹ pass 1
ℹ fail 1
```

Exactly the 1 test asserting the NEW opt-in behavior fails (`--trust-dir`
had no code to act on yet); the no-op test (asserting UNCHANGED default
behavior — flag passed without `--dir`) already passes against unmodified
code, as expected — it is the regression guard, not new behavior. (The
third new test, the plain baseline refusal with no flag at all, is
identical to today's existing behavior by construction and was not
re-run against the reverted code for that reason — it has no
`(tsk-2bg)` suffix and predates this item's own code change.)

## Passing-after (real transcript excerpt, after the fix)

```
✔ promote-to-component refuses from inside a linked worktree (must land on the real main checkout) (335.267568ms)
✔ promote-to-component --trust-dir with --dir succeeds from inside a linked worktree (tsk-2bg) (444.798872ms)
✔ promote-to-component --trust-dir WITHOUT --dir is a no-op -- still refuses from inside a linked worktree (tsk-2bg) (333.168735ms)
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

(all 11 tests in the `promote-to-component` suite, including the 8
pre-existing functional tests, unaffected.)

Full `test/cli/fgos.test.mjs` suite after the fix (confirms every
pre-existing guard test — `sync-root`/`approve`'s own P44/session-nesting/
`--github`/`--trust-dir` tests included — and every other CLI test in the
file, is unaffected by this change):

```
ℹ tests 603
ℹ pass 603
ℹ fail 0
```

`test/runner/promote-engine.test.mjs` (`retargetMember`'s own existing
worktree-guard test, `56b34d9a`, confirms D6's "zero code change there"
claim empirically — untouched by this item's diff, still passes):

```
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

## What changed

`bin/fgos.mjs`'s `case 'promote-to-component'` — `const repoRoot =
process.cwd();` replaced with `const repoRoot = flags['trust-dir'] ===
true ? path.dirname(dir) : process.cwd();`, immediately ahead of the
existing (unchanged) `isMainWorktree(repoRoot)` guard. Default (no flag)
is byte-identical to before. With `--trust-dir` AND an explicit `--dir`,
`repoRoot` resolves to the `--dir`-supplied main checkout instead of the
caller's shell `cwd` — the exact same substitution tsk-4uj already
shipped for `sync-root`/`approve` (CONTEXT.md D3), extended here per D5.

`src/runner/promote-engine.mjs` — **no change** (D6). `retargetMember`
receives the same already-resolved `repoRoot` from `bin/fgos.mjs:3648`
unchanged; its own `isMainWorktree` check (line 54) inherits the
relaxation for free, proven by the `--trust-dir` happy-path test above
completing a real merge through it.

Also added: three new CLI-level regression tests in
`test/cli/fgos.test.mjs`, and a correction to `RESEARCH.md`/`plan.md`
noting `retargetMember`'s own guard already had test coverage before this
item (an earlier keyword search missed it) — the real coverage gap was
narrower, CLI-layer only, now closed.
