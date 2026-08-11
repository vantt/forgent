# Plan: unlock's honest string-identity message

Item: `tsk-24t`. Mode: **tiny** — one message-composition branch in one
existing case, no split.

## Approach

Per D1/D2: in `bin/fgos.mjs`'s `unlock` case, replace the unconditional
"live session" message with a branch on `typeof lockResult.holderPid`:

```js
if (lockResult.status === HELD) {
  const ttlPart = lockResult.remainingTtlMs != null
    ? `, expires in ${formatLockDurationMs(lockResult.remainingTtlMs)}`
    : ', no TTL window known';
  const holderDescription = typeof lockResult.holderPid === 'number'
    ? `a live session (${lockResult.holderPid}`
    : `an identity whose liveness cannot be determined (${JSON.stringify(lockResult.holderPid)}`;
  throw new StoreError(
    'lock-timeout',
    `unlock: main checkout lock is held by ${holderDescription}, held ${formatLockDurationMs(lockResult.lockAgeMs)}${ttlPart}) -- refusing to clear it.`,
  );
}
```

Impact-analysis posture: **degraded** (GitNexus present, index stale per
this session's own PostToolUse hook). Low actual risk: only the thrown
error's message text changes for the string-identity branch; the numeric
branch's wording, the `'lock-timeout'` category, and the refuse-to-clear
behavior are all byte-identical to today for both branches.

## Cases

- **Boundary**: `lockResult.remainingTtlMs` null (no TTL window known) —
  unaffected, same `ttlPart` branch as today.
- **Existing behavior unchanged**: a numeric `holderPid` (a genuinely
  live process, `isPidAlive` ran) still gets the "live session" wording —
  the fix narrows the FALSE claim, never removes the true one.
- **Regression guard / positive case**: a string `holderPid` (the
  pre-commit hook's own identity shape) gets the new honest wording,
  never claims "live" — a new test constructs this exact scenario
  (write a string-identity lock record within TTL, call the `unlock`
  verb, assert the thrown message does NOT contain "live session" and
  DOES contain the honest phrasing) and asserts `unlock` still refuses to
  clear it (`cleared` never returned, `'lock-timeout'` category still
  thrown) — proving D1's "behavior unchanged" claim, not just the
  message.

## Outstanding questions

None
