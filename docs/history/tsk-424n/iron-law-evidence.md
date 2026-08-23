# Iron Law evidence — tsk-424n

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on this item's own branch
diff against trunk (`changedFiles`, `src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

**`matchedModules: ["bin/fgos.mjs"]` is a branch-ancestry false positive,**
the same class already documented for `tsk-503`
(`docs/history/tsk-503/iron-law-evidence.md`): `changedFiles` diffs this
branch's tip against `main` (trunk), which still includes `fgw/tsk-1qi`'s
own already-delivered, already-Iron-Law-acknowledged `bin/fgos.mjs` change
(this item's branch was forked from `fgw/tsk-2qc`, which carries that
commit — `fgw/tsk-2qc` itself has not yet merged to `main`). Confirmed:

```
$ git show --stat HEAD | head -3
commit a7444c9085353138ade379d2fc278fd4d74ad4b9
feat(tsk-424n): mark the 14 coding-domain dev-skills user-invocable: false

$ git log --oneline main..HEAD -- bin/fgos.mjs
ab7a5fe8 feat(tsk-1qi): make .agents/skills the canonical source, generate .claude/skills thin wrappers
```

Only `ab7a5fe8` (tsk-1qi's own commit) touches `bin/fgos.mjs` on this
branch — this item's own commit (`a7444c90`) never does. Documented here
per `review-audit-self-decision.md`'s "document non-issues briefly";
`required: true` is honored mechanically regardless (D13: over-reporting
is the safe direction), so this item's own verify still gets a real
failing-before/passing-after proof below.

Verify command (this item's own, `fgos list --id tsk-424n --json`):

```
npm test -- 'test/skills/**/*.test.mjs'
```

## Failing before (pre-tsk-424n commit, `ab7a5fe8`, this item's own new assertions only)

Checked out `ab7a5fe8` into a detached temp worktree, copied this item's
own updated `test/skills/fgos-mirror.test.mjs` in unmodified, and ran it:

```
$ node --test test/skills/fgos-mirror.test.mjs
ℹ tests 13
ℹ pass 10
ℹ fail 3
```

The 3 failures are exactly this item's own new assertions:

```
✖ every fgos-* dev-skill source in .agents/skills carries user-invocable: false
  expected: /^user-invocable: false$/m
  actual: (fgos-clarifying's real frontmatter, no user-invocable line)
✖ every fgos-* dev-skill wrapper in .claude/skills inherits user-invocable: false ...
✖ every fgos-* dev-skill mirrored into plugins/fgOS/skills also carries user-invocable: false ...
```

(The 4th new test, "distill does NOT carry user-invocable: false", already
passed before this item too — `distill` was never in scope, so a
before/after distinction is not expected there.)

## Passing after (this item's real change, HEAD)

```
$ node --test test/skills/fgos-mirror.test.mjs
ℹ tests 19
ℹ pass 19
ℹ fail 0

$ npm test -- 'test/skills/**/*.test.mjs'
ℹ tests 3207
ℹ pass 3202
ℹ fail 0
ℹ skipped 5
```

All 3 previously-failing assertions now pass — the 14 dev-skills (source,
generated wrapper, and plugin mirror) all carry `user-invocable: false`;
`distill` still does not. Full repo suite stays green.
