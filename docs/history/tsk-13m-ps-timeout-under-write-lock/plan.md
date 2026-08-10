# Plan: bound ppidOf's execFileSync with a timeout

Item: `tsk-13m`. Mode: **tiny** — one file, one options field added to one
existing `execFileSync` call, no split.

## Approach

Per D1/D2: in `src/runner/session-identity.mjs`'s `ppidOf`, add
`timeout: 200` to the existing `execFile('ps', [...], { encoding: 'utf8'
})` options object:

```js
const out = execFile('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8', timeout: 200 });
```

`ppidOf`'s existing `try/catch` already treats every `execFileSync`
failure identically (returns `null`), so a timeout-induced throw needs no
new branching — this is the whole fix.

Impact-analysis posture: **degraded** (GitNexus present, index stale per
this session's own PostToolUse hook notices) — low actual risk:
`ppidOf`/`resolveWriterIdentity`'s own signature is unchanged, only the
options object passed to an already-caught `execFileSync` call gains one
field; every one of the 3 call sites in `store.mjs` (`editWork`-shaped
patch, `moveWork`, `moveStage`) calls `resolveWriterIdentity(dir)` with no
new arguments and gets the exact same return shape either way.

## Cases

- **Boundary**: `ps` genuinely absent (existing "first hop fails" test) —
  unaffected, same `UNRESOLVED` path, `timeout` never triggers since the
  call fails immediately either way.
- **Existing behavior unchanged**: every existing fake-`execFile`-injected
  test in `test/runner/session-identity.test.mjs` destructures only
  `(_file, args)`, ignoring the options object — none of them break.
- **New regression proof**: a fake `execFile` that captures its `options`
  argument, asserting `options.timeout` is a number in `(0, 500]` —
  fails pre-fix (no `timeout` key at all), passes post-fix.

## Outstanding questions

None
