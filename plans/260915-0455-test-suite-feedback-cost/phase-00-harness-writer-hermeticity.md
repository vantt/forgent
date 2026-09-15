# P00 - Harness Writer Hermeticity

**Capability:** `code:implement`

**Depends on:** none

## Purpose

Make CLI harness results independent of whether `npm test` was launched from an
agent session or an ordinary shell, per TFC-D02 and TFC-D03.

## Read First

`decision-lock.md`, `src/util/session-identity.mjs`, `src/state/store.mjs`,
`test/cli/helpers/fgos-cli-harness.mjs`, and
`test/cli/fgos-intake-4.test.mjs`.

## File Lease

- May edit: `test/cli/helpers/fgos-cli-harness.mjs`
- May edit after demonstrated need: CLI tests whose writer-identity assumptions
  are exposed by the audit
- May add: focused harness tests under `test/cli/`
- Must not edit: writer identity production code or sequence expectations merely
  to make the test pass

## Requirements

R1. The harness supplies a charset-valid, <=200-character test-only
   `FGOS_SESSION_ID` to ordinary CLI children.
R2. Caller-provided `extraEnv.FGOS_SESSION_ID` remains able to override the
   default for tests that intentionally exercise identity.
R3. Other inherited environment values remain intact.
R4. Audit tests that combine in-process writes with spawned CLI writes and assert
   writer-local sequence or filenames; record each disposition.
R5. The legacy durable-doing test passes with inherited
   `CLAUDE_CODE_SESSION_ID`, inherited `FGOS_SESSION_ID`, and neither.

## Adversarial Checks

- Invalid or overlong pinned identity silently falling into pid-walk.
- Merge order allowing inherited env to overwrite the test pin.
- Test override unable to replace the default.
- A writer-provenance test accidentally converted into a harness-default test.

## Verification

Run focused variants during implementation, then one full suite:

```sh
node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs
CLAUDE_CODE_SESSION_ID=agent-session-probe node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs
FGOS_SESSION_ID=agent-session-probe node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs
npm test
```

## Acceptance

All variants produce the same expected sequence; identity override has a direct
test; the audit names every affected test; full suite is green; no production
symbol changed.

## Risks And Rollback

Risk is accidental identity masking in tests that intentionally control writer
provenance. Roll back the harness default and retain the audit report if R2
cannot preserve those tests without production changes.

## Handoff

Record the chosen pinned value, env merge order, audit result, focused outputs,
and full-suite output. P01 inherits the hermetic harness.
