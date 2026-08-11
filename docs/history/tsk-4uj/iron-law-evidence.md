# tsk-4uj — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

This is a **high-risk** item (plan.md's own Mode gate: hard-gate flag
`audit/security` — `approve`'s worktree-identity guard has a two-incident
history, `P44` and `review-260718`) — the evidence below is deliberately
thorough given the stakes.

## Test command

`node --test test/cli/fgos.test.mjs` (the item's own recorded `verify`);
the excerpts below are the item's own new tests specifically
(`--test-name-pattern="tsk-4uj"`), then the full suite result.

## Failing-before (real transcript excerpt, before this item's `bin/fgos.mjs` edit)

Both `approve` and `sync-root` temporarily reverted to `const repoRoot =
process.cwd();` (no `--trust-dir` branch) — exactly the pre-fix shape:

```
✖ sync-root --trust-dir with --dir succeeds from inside a linked worktree (tsk-4uj) (293.642062ms)
✔ sync-root --trust-dir WITHOUT --dir is a no-op -- still refuses from inside a linked worktree (tsk-4uj) (285.327544ms)
✖ approve --trust-dir with --dir succeeds from inside an ad-hoc worktree (tsk-4uj) (408.129953ms)
✔ approve --trust-dir WITHOUT --dir is a no-op -- still refuses from inside an ad-hoc worktree (tsk-4uj) (388.78976ms)
✔ approve --github --pr --trust-dir WITHOUT --dir is a no-op -- still refuses from an ad-hoc worktree before any gh call (tsk-4uj) (407.167746ms)
ℹ tests 5
ℹ pass 3
ℹ fail 2
```

Exactly the 2 tests asserting the NEW opt-in behavior fail (`--trust-dir`
had no code to act on yet); the 3 tests asserting UNCHANGED default
behavior already pass against unmodified code, as expected — they are the
regression guard, not new behavior.

Real failure detail (`sync-root`):

```
approve: refusing to run from "/tmp/fgos-adhoc-wt-9mtjQI" — this is a git
worktree, not the repository's main working tree, whether or not it was
created through "fgos session start". Run approve from the main checkout.
```

(the `--trust-dir` flag was accepted as a CLI arg but had no effect on
`repoRoot`, so the guard still fired exactly as it does with no flag at
all.)

## Passing-after (real transcript excerpt, after the fix)

```
✔ sync-root --trust-dir with --dir succeeds from inside a linked worktree (tsk-4uj) (334.338692ms)
✔ sync-root --trust-dir WITHOUT --dir is a no-op -- still refuses from inside a linked worktree (tsk-4uj) (279.362344ms)
✔ approve --trust-dir with --dir succeeds from inside an ad-hoc worktree (tsk-4uj) (431.115563ms)
✔ approve --trust-dir WITHOUT --dir is a no-op -- still refuses from inside an ad-hoc worktree (tsk-4uj) (395.283258ms)
✔ approve --github --pr --trust-dir WITHOUT --dir is a no-op -- still refuses from an ad-hoc worktree before any gh call (tsk-4uj) (390.003678ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

Full `test/cli/fgos.test.mjs` suite after the fix (confirms every
pre-existing P44/session-nesting/`--github` guard test, and every other
CLI test in the file, is unaffected by this change):

```
ℹ tests 586
ℹ pass 586
ℹ fail 0
```

## What changed

`bin/fgos.mjs`'s `case 'approve'` and `case 'sync-root'` — `const repoRoot
= process.cwd();` replaced with `const repoRoot = flags['trust-dir'] ===
true ? path.dirname(dir) : process.cwd();`. Default (no flag) is
byte-identical to before. With `--trust-dir` AND an explicit `--dir`,
`repoRoot` resolves to the `--dir`-supplied main checkout instead of the
caller's shell `cwd` — the same substitution `tsk-k8u`/`tsk-5vl` already
proved for `take`/`pick`/`catchup`, gated behind this explicit opt-in flag
per CONTEXT.md D3 given `approve`'s own incident history (`P44`,
`review-260718`). `promote-to-component` (`bin/fgos.mjs` ~3438-3450) was
deliberately left untouched (CONTEXT.md D4, filed as `tsk-2bg`) — its
`repoRoot = process.cwd();` line is unchanged.

Also added: `docs/how-to/recover-approve-sync-root-from-inside-a-
worktree-with-trust-dir.md`, explaining the trade-off and citing the
incident history for whoever reaches for the flag.
