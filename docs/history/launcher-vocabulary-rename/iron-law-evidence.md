# tsk-2cw — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["src/runner/dispatch.mjs", "src/runner/loop.mjs", "src/runner/worker-log.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/docs/launcher-vocabulary-guard.test.mjs` (the item's own `verify`: `npm test && node --test test/docs/launcher-vocabulary-guard.test.mjs` — `npm test`'s glob does not include `test/docs/**`, so the guard test only runs via this explicit second invocation).

## Failing-before (real transcript, `src/runner/{dispatch,loop,worker-log}.mjs` reverted to their pre-rename content via `git checkout HEAD~1 -- <3 files>`)

```
✖ NEGATIVE: "orchestrator" does not appear in fgOS-owned prose outside the allowlist (39.525306ms)
  AssertionError [ERR_ASSERTION]: pinned term "orchestrator" leaked back into: docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md, src/runner/dispatch.mjs, src/runner/loop.mjs, src/runner/worker-log.mjs, test/docs/launcher-vocabulary-guard.test.mjs
✖ POSITIVE: src/runner/*.mjs comments now say launcher, not orchestrator (0.267811ms)
  AssertionError [ERR_ASSERTION]: src/runner/worker-log.mjs must mention "launcher"
ℹ tests 7
ℹ pass 5
ℹ fail 2
```

(The `docs/decisions/0028...`/`test/docs/launcher-vocabulary-guard.test.mjs` entries in the NEGATIVE failure's list are a separate, already-fixed allowlist gap — see the follow-up commit `1538a6e` — not part of what this revert was isolating; the two failures that trace directly to the reverted runner files are `src/runner/dispatch.mjs`/`loop.mjs`/`worker-log.mjs` in the NEGATIVE list and the POSITIVE test naming `worker-log.mjs` explicitly.)

## Passing-after (real transcript, files restored via `git checkout HEAD -- <3 files>`, confirmed `git status --short src/runner/` clean)

```
✔ NEGATIVE: "orchestrator" does not appear in fgOS-owned prose outside the allowlist (37.902218ms)
✔ NEGATIVE self-check: a synthetic in-scope violation is actually caught (true positive) (0.125949ms)
✔ NEGATIVE self-check: real allowlisted paths are not vacuously exempted (true negative) (0.096587ms)
✔ POSITIVE: decision 0026 defines "launcher" (specific sentence, not a bare word) (0.224806ms)
✔ POSITIVE: decision 0028 exists and partially supersedes 0026 (naming only) (0.16542ms)
✔ POSITIVE: the 12 skill mirrors still point at 0026's unchanged filename (D2) (2.149051ms)
✔ POSITIVE: src/runner/*.mjs comments now say launcher, not orchestrator (0.47258ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Full `npm test` after: `tests 2645 / pass 2640 / fail 0` (5 skipped, none failing) — confirmed clean before this item's implementation commit landed.

## What changed

`src/runner/worker-log.mjs:12`, `src/runner/loop.mjs:37`, `src/runner/dispatch.mjs:712` — the pinned-term comment "an orchestrator can recover what a worker actually did" / "so an orchestrator can recover what" / "captured by the orchestrator itself" renamed to "launcher", matching decision 0028's supersede of decision 0026's naming (`docs/history/launcher-vocabulary-rename/CONTEXT.md` D1/D2). `dispatch.mjs:640-641`'s own citation of 0026's filename (which is not renamed, per D2) was left untouched — only the standalone role-noun usage at line 712 changed.
