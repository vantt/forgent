# P00 Handoff - Harness Writer Hermeticity

**Cell:** test-suite-feedback-cost--p00
**Status:** implemented, targeted + full suite green (rust-host binary gaps excluded)

## Root cause

`test/cli/helpers/fgos-cli-harness.mjs`'s `run()` spawned every CLI child by
inheriting `process.env` verbatim. `src/util/session-identity.mjs`'s
`resolveWriterIdentity` reads `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` per
process, falling back to a 3-hop pid-walk when neither is set.
`resolveWriterLogPath` (store.mjs) reuses one open file per resolved writer
id, so writer identity directly determines which physical log (and which
seq counter) a write lands in.

`test/cli/fgos-intake-4.test.mjs`'s "genuinely legacy durable-doing item"
test mixes an in-process write (`moveToDurableDoingForTest`, calling
`resolveWriterLogPath`/`appendEvent` directly) with subsequent spawned-CLI
writes (`ask`, `answer` via `run()`), and hardcodes the resulting `seq`.
Under an ordinary shell (pid-walk), the in-process call's 3-hop walk starts
one process-depth higher than a spawned child's walk, so it lands on a
different ancestor and gets its own isolated writer log — `ask`=seq:2,
`answer`=seq:3. Under an agent session, both sides read the identical
`CLAUDE_CODE_SESSION_ID` string, collapse onto ONE shared writer log, and the
in-process write becomes an extra entry ahead of `ask` — `ask`=seq:3,
failing the hardcoded expectation. This is a harness hermeticity defect
(TFC-D02), not a product regression.

## Fix

Pinned one fixed, test-only, charset-valid session id
(`DEFAULT_CLI_SESSION_ID = 'fgos-cli-harness-test'`) into every `run()`-
spawned child's own env, applied via
`{ ...process.env, FGOS_SESSION_ID: DEFAULT_CLI_SESSION_ID, ...extraEnv }`
so:

- every other inherited env value passes through unchanged (R3);
- every spawned child in a test agrees with every other spawned child,
  regardless of the invoking shell;
- `process.env` itself is never touched, so an in-process call keeps
  resolving via whatever the real environment/pid-walk naturally gives it —
  reproducing the ordinary-shell "in-process write isolated from spawned
  writes" shape deterministically, on every shell;
- a caller's own `extraEnv.FGOS_SESSION_ID` (return/post-merge multi-actor
  tests) still overrides the pin (R2), since it is spread last.

## Env merge order

`{ ...process.env, FGOS_SESSION_ID: DEFAULT_CLI_SESSION_ID, ...extraEnv }`

## R4 audit result

Grepped every `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` call site under
`test/`. Only `test/cli/fgos-intake-4.test.mjs`'s one test (line 318)
combines an in-process writer-log write with subsequent spawned-CLI writes
and asserts a hardcoded `seq`. Every other CLI test file's own
`moveToDurableDoingForTest` usage either never asserts `seq` afterward, or
(`fgos-handoff.test.mjs`) uses a locally-defined copy never touched by this
harness. No CLI test relies on a spawned child's identity resolving via
pid-walk (no test unsets `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` to probe
`run()`'s fallback path) or on two spawned children in the same test
disagreeing with each other.

GitNexus `impact`/`detect_changes` returned zero matched symbols for this
test-helper file/function (likely out of its indexed scope) — cross-checked
manually via the grep sweep above instead of trusting the zero result.

## Focused outputs (all pass)

```
node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs        # current agent-session env
CLAUDE_CODE_SESSION_ID=agent-session-probe node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs
FGOS_SESSION_ID=agent-session-probe node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs
```

All four variants: 1 pass, 0 fail (R5 satisfied).

Also ran the full affected-file set (return/return-2/return-3/post-merge/
intake/intake-4/read-4/read-5/edit): 206 pass, 0 fail.

## Full-suite output

`npm test`: 6523 tests, 6463 pass, 51 fail (rust-host: `fgctl-init.test.mjs`,
`fgctl-stage.test.mjs`, `fgctl-upgrade.test.mjs`, `release-tree.test.mjs` —
all failing on a missing compiled `target/release/{fgos,fgctl}` binary in
this environment, per `cargo build --release --workspace` not having been
run here). Zero failures outside `test/rust-host/`; the harness change
introduced no regression across the other 6472 tests. This pre-existing,
environment-scoped gap is orthogonal to P00's scope and is left for P01/P02
(the plan's own full-test checkpoint policy defers the mandatory
whole-suite green proof to "after P00 and P01 are both merged").

## Production code touched

None. Only `test/cli/helpers/fgos-cli-harness.mjs` changed.
