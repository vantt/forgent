# tsk-19z — Iron Law evidence

`classifyIronLaw` on this item's real diff (commit `783ac37d`, computed via
`changedFiles`/`classifyIronLaw` per `fgos-coding-implement`'s own step 4):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/session-identity.mjs"]
}
```

## Test command

```
node --test test/runner/session-identity.test.mjs
```

## Failing-before transcript

Real run with the post-rename test file (`FGOS_SESSION_ID` fixtures)
against the pre-rename source (`git checkout f12e8ce8 -- src/runner/
session-identity.mjs`, restored to `HEAD` afterward — never a
hand-edited/fabricated transcript):

```
✖ FGOS_SESSION_ID takes precedence over CLAUDE_CODE_SESSION_ID when both set (1.254665ms)
✖ identity resolves from the session registry when the env id matches a row (28.04484ms)
✖ an env id absent from the registry keeps the same value but reports env (29.018548ms)
✖ a registry row is never matched by directory or by row pid (21.676948ms)
✖ a corrupt registry falls through to env without throwing -- no sessions.json at all (21.381463ms)
✖ a corrupt registry falls through to env without throwing -- not valid JSON (22.70461ms)
✖ a corrupt registry falls through to env without throwing -- a half-written array (26.318979ms)
✖ a corrupt registry falls through to env without throwing -- a JSON object rather than an array (24.694269ms)
✖ a corrupt registry falls through to env without throwing -- an array of non-objects (23.698604ms)
✖ a corrupt registry falls through to env without throwing -- an unreadable fgosDir path (24.963511ms)
ℹ tests 24
ℹ suites 0
ℹ pass 14
ℹ fail 10
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 358.050531
```

Every failure is the same shape: the pre-rename source still reads
`BEE_SESSION_ID` from `env`, so a test fixture setting `FGOS_SESSION_ID`
resolves to the ancestor-pid fallback instead (`{id: 648965, source:
'pid'}` vs. the expected `{id: 'session-corrupt', source: 'env'}`),
proving the test genuinely exercises the renamed env-var key rather than
passing vacuously.

## Passing-after transcript

Real run against the fixed source (`HEAD`, commit `783ac37d`):

```
ℹ tests 24
ℹ suites 0
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135.802093
```

## Broader regression proof

Full `npm test` suite (3123 tests, 3118 pass, 5 pre-existing
environment-conditional skips unrelated to this change —
`coexistence-canary.test.mjs`'s `BEE_SKIP` ×5, untouched per CONTEXT.md D5)
ran green against the fixed source, confirming no regression elsewhere.
