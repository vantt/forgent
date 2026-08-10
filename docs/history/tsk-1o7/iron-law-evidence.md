# Iron Law evidence — tsk-1o7

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-1o7`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test --test-name-pattern="needs" test/runner/dispatch.test.mjs
```

(Full suite: `node --test test/runner/dispatch.test.mjs` — 141/141 pass on
the post-fix tree; `npm test` also green on the post-fix tree.)

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-1o7 committed content
(`git show HEAD~1:src/runner/dispatch.mjs`), the two new tests run in
isolation:

```
✖ resolveExecutorCommand resolves a kind:"cli" capacity declaring needs+for through capability match, with no name coincidence between the capacity id and the registered tool name (10.267872ms)
  AssertionError [ERR_ASSERTION]: Got unwanted exception.
  Actual message: "capacity "submit-assist-classify" declares kind "cli" but is not registered — run "fgos tool register --name submit-assist-classify --kind cli --command <cmd> --capability <label>" first."
      at resolveExecutorConfig (src/runner/dispatch.mjs:611:13)
      at resolveExecutorCommand (src/runner/dispatch.mjs:765:20)
      at test/runner/dispatch.test.mjs:1111:5

✖ resolveExecutorCommand resolves a needs-declaring capacity when a second provider is registered under the same capability but a different name (6.075591ms)
  AssertionError [ERR_ASSERTION]: Got unwanted exception.
  Actual message: "capacity "submit-assist-classify" declares kind "cli" but is not registered — run "fgos tool register --name submit-assist-classify --kind cli --command <cmd> --capability <label>" first."
      at resolveExecutorConfig (src/runner/dispatch.mjs:611:13)
      at resolveExecutorCommand (src/runner/dispatch.mjs:765:20)
      at test/runner/dispatch.test.mjs:1136:5

ℹ tests 2
ℹ pass 0
ℹ fail 2
```

Both tests fail on the exact old bug: `resolveExecutorConfig`'s presence
check looked up `tools['submit-assist-classify']` by name, found nothing
(the fixture registers providers under `agy-classify`/`agy`/`gemini-cli`,
never under the capacity's own id), and threw "not registered" even though
a real provider for the needed capability was registered and present.

## Passing-after transcript

`src/runner/dispatch.mjs` restored to its committed (post-tsk-1o7) content,
same two tests:

```
✔ resolveExecutorCommand resolves a kind:"cli" capacity declaring needs+for through capability match, with no name coincidence between the capacity id and the registered tool name (15.776936ms)
✔ resolveExecutorCommand resolves a needs-declaring capacity when a second provider is registered under the same capability but a different name (5.71917ms)

ℹ tests 2
ℹ pass 2
ℹ fail 0
```

`git status --porcelain src/runner/dispatch.mjs` was empty after the
restore (byte-identical to the committed tree) before this passing run —
confirming the pass is against the real committed fix, not a leftover
working-tree edit.
