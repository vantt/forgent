# Iron Law evidence — tsk-1qi

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on this item's own committed
diff (`changedFiles`, `src/runner/merge.mjs`, against trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

`bin/fgos.mjs` is one of `MODULE_RULES`'s self-modifying-diff paths — this
item edits `fgos setup`'s own handler, so `required: true` is a correct
match, not a false positive.

Verify command (this item's own, `fgos list --id tsk-1qi --json`; fixed
post-implementation, see plan.md's own "Verify fix, piece 2" note — the
original `npm test -- test/skills/` passed a bare directory alongside the
npm script's own already-active glob, the identical `node --test`
phantom-failure quirk piece 1/tsk-2qc-1 already hit and fixed the same
way):

```
npm run build:skills && npm test -- 'test/skills/**/*.test.mjs'
```

## Failing before (pre-tsk-1qi commit, `3529f162`)

`src/setup/skill-wrappers.mjs` and `test/setup/skill-wrappers.test.mjs`
did not exist before this item. Checked out `3529f162` (this branch's
commit immediately before tsk-1qi's own) into a detached temp worktree,
copied this item's own new `test/setup/skill-wrappers.test.mjs` in
(unmodified), and ran it against that pre-change tree:

```
$ node --test test/setup/skill-wrappers.test.mjs
node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'.../src/setup/skill-wrappers.mjs' imported from
'.../test/setup/skill-wrappers.test.mjs'
```

Fails cleanly — the generator module this item introduces did not exist
yet, so every one of its 13 new tests is unreachable.

Separately, before this item, `test/skills/fgos-mirror.test.mjs` asserted
`.claude/skills` and `.agents/skills` were BYTE-IDENTICAL (the old
hand-mirrored contract) — an assertion this item's own change makes false
by design (`.claude/skills/*` becomes a generated thin wrapper). That old
assertion is retired along with the hand-mirroring it proved, replaced by
the wrapper-correctness assertions below.

## Passing after (this item's real change, HEAD)

```
$ node --test test/setup/skill-wrappers.test.mjs
ℹ tests 13
ℹ pass 13
ℹ fail 0

$ node --test 'test/skills/**/*.test.mjs'
ℹ tests 15
ℹ pass 15
ℹ fail 0

$ npm run build:skills && npm test -- 'test/skills/**/*.test.mjs'
(15 skill wrapper(s) generated; full suite green)

$ npm test   # full repo suite, unmodified verify command
ℹ tests 3203
ℹ pass 3198
ℹ fail 0
ℹ skipped 5
```

All new tests pass, the retired byte-identical assertion is gone (replaced
by wrapper-correctness assertions that pass against the real generated
`.claude/skills/*` files), and the full repo suite stays green.
