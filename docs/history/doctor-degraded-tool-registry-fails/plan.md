# plan.md — tsk-3oa2: doctor's degraded tool-registry posture never fails

Mode: small

1 flag (existing covered behavior — `test/setup/checks.test.mjs`'s
"always passes" test and `test/setup/doctor-fresh-run.test.mjs`'s
must-pass list both touch this check). No CONTEXT.md: discovery verdict
was clear.

## Approach

**Chosen path:** `checkToolRegistryConfigured` (`src/setup/
registrations.mjs:404-423`) reports `passed: true` on all three postures —
inactive, full, and degraded. Change only the degraded branch to
`passed: false`; inactive and full are correctly clean/healthy states and
stay `passed: true`.

**Alternatives rejected:**
- *A distinct third "warn" tier* — rejected. `DOCTOR_CHECKS`'
  `{passed, message}` shape is boolean-only across every one of the 20+
  registered checks; adding a tri-state result for one check alone would
  need a schema change touching every consumer of `checks[].passed`
  (`fgos doctor`'s CLI renderer, `doctor-fresh-run.test.mjs`'s `mustPass`
  list shape, any future doctor-check reader) for a single check's
  benefit. `passed: false` with an actionable message is the same shape
  every other "needs attention" check already uses.
- *A freshness field on `fgos tool query`* — real, separate ask (noted in
  the fable report as an "and/or"); out of this item's scope, which is
  specifically the doctor-check regression. Could be filed as its own item
  if wanted later.

**Risk map:** Light — one boolean flip plus updating the tests that
directly assert against the old value.

**Impact-analysis posture:** `degraded` (GitNexus present but stale, same
posture recorded for tsk-2xj this session).

## Shape

- `src/setup/registrations.mjs` — flip the one line.
- `test/setup/checks.test.mjs` — the existing "tool-registry-configured
  always passes" test asserted against `process.cwd()` (this real repo's
  live state), which is not a controlled fixture and mislabels what it
  tests (its title says "inactive is a clean skip" while never actually
  forcing an inactive posture). Replace with three controlled-fixture
  tests: inactive (no tools registered) passes, full (registered +
  checked present) passes, degraded (registered but never checked) now
  fails — using the real `fgos tool register`/`fgos tool check` CLI verbs
  against a temp `.fgos` store, the same real-process pattern this file
  already uses elsewhere.
- `test/setup/doctor-fresh-run.test.mjs`'s `mustPass` list keeps
  `tool-registry-configured` unchanged — that fixture registers no tools
  at all (inactive posture), which still passes under this fix.

## Split decision

No split.

## Outstanding questions

None
