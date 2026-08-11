# Iron Law evidence — tsk-27y

## Classification

`{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}` —
`bin/fgos.mjs` is a real self-modifying-capable module on `MODULE_RULES`
(`src/evolve/iron-law.mjs`), and this item genuinely changes it (new
`--verdict`/`--verify`/`--question`/`--reason`/`--children` flags on the
`discover`/`decompose` CLI case blocks). No false positive here.

## Why the standard bug-fix RED/GREEN recipe needed adapting

This item is a new, additive feature (caller-supplied verdict protocol),
not a bug fix — there is no pre-existing failure to reproduce. Instead,
proof that the new behavior actually works (not just that a judge
subprocess happened to agree) comes from the item's own new CLI e2e tests
in `test/cli/fgos.test.mjs`, each of which configures the fake judge
executor with the OPPOSITE verdict from what `--verdict` supplies —
proving the flag genuinely bypasses the subprocess judge, not that a real
judge coincidentally produced the same answer.

## RED — new caller-supplied-verdict tests against pre-fix code

Pre-fix `bin/fgos.mjs`, `src/intake/discovery.mjs`,
`src/intake/plan.mjs`, `src/cli/command-registry.mjs` restored from
`git show 63982e0^:<path>` (the parent of this item's own single
implementation commit), with the new tests from post-fix
`test/cli/fgos.test.mjs` layered on top (test file is additive-only, no
existing test needed changing):

```
$ node --test --test-name-pattern="verdict" test/cli/fgos.test.mjs
ℹ tests 14
ℹ pass 4
ℹ fail 10
```

All 10 failures are the new caller-supplied-verdict tests — the pre-fix
CLI has no `--verdict` flag at all, so `discover`/`decompose` always ran
the (deliberately opposite-configured) judge subprocess and produced the
opposite outcome the assertions expected, e.g.:

```
✖ decompose --verdict pass-through moves the item to executing, bypassing the configured (opposite) judge verdict
✖ discover --verdict clear --verify moves the item to decompose with that exact verify, bypassing the configured (opposite) judge verdict
```

The 4 passing tests are pre-existing (unrelated to this item's flags),
confirming the pre-fix swap didn't break unrelated CLI behavior.

## GREEN — same tests against post-fix code

Post-fix files restored via `git checkout HEAD -- bin/fgos.mjs
src/intake/discovery.mjs src/intake/plan.mjs
src/cli/command-registry.mjs` (identical command, no code changed beyond
that restore):

```
$ node --test --test-name-pattern="verdict" test/cli/fgos.test.mjs
ℹ tests 14
ℹ pass 14
ℹ fail 0
```

## Item-scoped verify

```
$ node --test test/cli/fgos.test.mjs test/intake/plan.test.mjs test/intake/discovery.test.mjs
ℹ tests 668
ℹ pass 668
ℹ fail 0
```

## Full suite (regression check)

```
$ node --test 'test/**/*.test.mjs'
ℹ tests 2400
ℹ pass 2395
ℹ fail 0
ℹ skipped 5
```

0 failures, 5 pre-existing skips — no regression anywhere else in the
suite from this diff. Working tree confirmed clean of the temporary
pre-fix swap (aside from the pre-existing, untouched sparse-checkout
`.fgos/*` deletions every session in this worktree sees, per ADR0020) —
the RED-phase file swaps were restored via `git checkout HEAD --` before
this evidence was written, not left in place.

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming `bin/fgos.mjs` is self-modifying-capable and triggers
  `required: true` on a real files-changed match.
- The RED/GREEN transcripts above — real command runs against real file
  contents swapped in/out on disk (`git show 63982e0^:<path>` extraction,
  `git checkout HEAD --` restore), not paraphrased or fabricated.
- `docs/history/caller-verdict-protocol-discover-decompose/CONTEXT.md` and
  `plan.md` — the decisions (D1-D3) and scope this evidence satisfies.
