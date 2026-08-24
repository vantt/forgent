# Plan: session-identity-pid-walk-flaky-test (tsk-5n6)

Mode: tiny

Flags checked against fgos-routing's Mode gate (auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain): 0
apply. One file, one direct task, root cause already pinned with citations
(see `RESEARCH.md` Round 1).

No `CONTEXT.md` exists for this feature — discovery's verdict was `clear`,
which skips `exploring` (the stage that normally writes it). `RESEARCH.md`
Round 1 carries every locked fact this plan relies on.

## Approach

**Chosen path:** give the "3-hop walk" test in
`test/util/session-identity.test.mjs` (line 217) its own test-local
`execFile` wrapper, passed as `resolveWriterIdentity`'s `execFile` option,
that shells out to the real `ps` binary but with a timeout larger than the
production `PPID_TIMEOUT_MS` (200ms, `src/util/session-identity.mjs:99`) —
e.g. 2000ms. This keeps the test's own stated purpose intact (asserting
against a REAL OS process tree, per its comment at
`test/util/session-identity.test.mjs:204-207`) while removing its
sensitivity to the tight 200ms bound that exists for a different reason
(not blocking the held cross-process `events.lock` in production,
`src/util/session-identity.mjs:96-98`) that does not apply inside this
test.

**Alternatives rejected:**
- Widen `PPID_TIMEOUT_MS` itself (the shared production constant) —
  rejected: it is a deliberate lock-safety bound for a real production
  code path this test does not exercise; loosening it repo-wide to fix a
  test-only symptom trades a real production guarantee for a test
  convenience. (RESEARCH.md Round 1, "Found" bullet 2.)
- Mock/stub `execFile` entirely, asserting only that the walk logic is
  correct against fake ancestor pids — rejected: this test already has a
  sibling covering exactly that case (`test/util/session-identity.test.mjs`
  ~line 188-194); this specific test's own comment states its purpose is
  proving the walk against a real OS process tree, which a full mock would
  defeat. (RESEARCH.md Round 1, "Found" bullet 4.)

**Risk map:** single component (one test file), risk `light` — the change
is additive (a test-local wrapper function) and does not touch
`src/util/session-identity.mjs` or any other test. No medium/high-risk
item on this map, so no proof point beyond the verify command itself is
needed at `fgos-coding-validating`.

**Files touched:** `test/util/session-identity.test.mjs` only (the "3-hop
walk..." test, lines 217-269) — no production code change expected.

**Order:** single piece, no ordering dependency.

## Shape

One direct change: replace the test's call `resolveWriterIdentity(undefined,
{ env: {}, pid: leafPid })` (line 256) with a call that also passes a
custom `execFile` — a thin wrapper around the real `execFileSync` (or
`node:child_process`'s `execFileSync`, matching the production import)
that overrides only the `timeout` option to a larger value (e.g. 2000ms)
before delegating to the real binary, so the assertion keeps exercising
real `ps` against the real spawned 3-hop chain, just without the
200ms-under-load fragility.

Cases already covered by this change without further sketching (tiny
lane): the existing assertion (`assert.deepEqual(result, { id:
process.pid, source: PID })`, line 257) is the one behavior being made
reliable — no new case is being added, no existing behavior is being
changed, only the real-`ps`-call's timeout margin used inside this one
test.

## Split decision

No split — one honest piece. No child specs.

## Verify

Already synced onto the item at discovery (real, not a placeholder):

```
node --test --test-name-pattern "3-hop walk reaches the real ancestor across a spawned process chain" test/util/session-identity.test.mjs
```

## Outstanding questions

None
