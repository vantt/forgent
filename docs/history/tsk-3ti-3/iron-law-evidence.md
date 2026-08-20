# Iron Law evidence: tsk-3ti-3

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real committed diff:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/loop.mjs"
  ]
}
```

(`src/runner/prompt-templates.mjs` also changed in this same commit but is not
itself on `MODULE_RULES`' illustrative list — `src/runner/loop.mjs` alone is
enough to make this diff Iron-Law-required.)

## Verify command

```bash
npm test
```

## Failing-before / passing-after transcript (reproduced, not asserted)

The new `extractDomainCouplings` check (`test/architecture.test.mjs`, commit
`a1b4a83f`) scans real on-disk `core`/manifest files for hardcoded domain-name
literals. To prove it genuinely catches the bug this item fixed, the pre-fix
versions of the two touched files were restored temporarily and the new test
re-run against them:

```
$ git show a1b4a83f^:src/runner/loop.mjs > src/runner/loop.mjs
$ git show a1b4a83f^:src/runner/prompt-templates.mjs > src/runner/prompt-templates.mjs
$ node --test test/architecture.test.mjs
✖ domain-siloing: core không import/couple domain cụ thể, domain không import domain khác
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  + [
  +   'src/runner/loop.mjs (core) import domain cụ thể domains/coding',
  +   'src/runner/prompt-templates.mjs (core) import domain cụ thể domains/coding',
  +   'src/runner/prompt-templates.mjs (core) import domain cụ thể domains/coding'
  + ]
  - []
ℹ pass 5
ℹ fail 1
```

Files restored to their committed (fixed) state immediately after
(`git status` clean, byte-identical), then the same test re-run:

```
$ node --test test/architecture.test.mjs
✔ domain-siloing: core không import/couple domain cụ thể, domain không import domain khác (21.933471ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

Full suite: `npm test` — 3727/3727 passing on the merged branch.
