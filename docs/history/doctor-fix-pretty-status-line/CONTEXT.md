# doctor-fix-pretty-status-line — locked decisions

Item: `tsk-45g`. Source request (raw, untrusted per RUL45): pasted output of
`fgos doctor --fix --pretty` run from `~/projects/paseo`, showing a red `✗`
next to `fix: gate-bypass-configured (gateBypass.level already "off")`.

## Feature boundary

`fgos doctor --fix --pretty`'s rendering of the `fixed` array
(`bin/fgos.mjs`'s `renderPretty`, `verb === 'doctor'` branch) mislabels a
fix that correctly found nothing to do. In scope: fixing that one render
line. Out of scope: the unrelated `core.hooksPath not wired` line in the
same pasted output — that check has no registered fix by design (only
`fgos setup` wires hooks; `doctor --fix` only runs entries with a
`registerFix`, and `main-checkout-hook-wired` has none), so its `✗` is
correct, expected behavior, not a bug.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `renderPretty`'s doctor `fixed` loop (`bin/fgos.mjs:3711-3714`) must stop using `f.changed` as the `formatCheck` pass/fail boolean. A registered fix's contract (`register-a-fixable-doctor-check-in-fgos.md` step 2, `registrations.mjs:515-517`) is "idempotent — a no-op (`changed: false`) when the state is already valid, never rewrite unnecessarily." `changed: false` therefore means "already correct," a success state, not a failure — yet `formatCheck(f.changed, ...)` renders it as a red `✗` (`ansi.mjs`'s `formatCheck(false, ...)` contract, confirmed by `ansi.test.mjs`). Fix lines must render `✓` (green) unconditionally — a registered fix per its own documented contract either writes the corrected value or reports it was already correct; there is no third, failing outcome in the `{changed, message}` shape (`registerFix`'s jsdoc, `registrations.mjs:102-120`). The `message` string already carries whether it changed or was already fine; the color no longer needs to (and must not) also encode that. |

## Pinned terms

- **"fix line"** — the `fix: <id>` lines `renderPretty` prints from
  `data.fixed` when `doctor --fix --pretty` ran, distinct from the
  `checks` lines below them (which still use `c.passed` correctly and are
  unaffected).

## Scout evidence cited

- `bin/fgos.mjs:3537-3543` — `doctor` case: `runFixes` result is passed to
  `renderPretty` as `data.fixed`, an array of `{id, changed, message}`.
- `bin/fgos.mjs:3709-3718` — `renderPretty`'s doctor branch: `formatCheck(f.changed, ...)` for fix lines vs. `formatCheck(c.passed, ...)` for check lines.
- `src/setup/ansi.mjs:33` + `test/setup/ansi.test.mjs:33-46` — `formatCheck(true, ...)` renders a green `✓`, `formatCheck(false, ...)` renders a red `✗`.
- `src/setup/registrations.mjs:110-120` — `registerFix` jsdoc: fix returns `{changed, message}`, no third/failing state documented or used.
- `src/setup/registrations.mjs:515-532` — `fixGateBypassConfigured`: returns `{changed: false, message: '...already "<level>"'}` when nothing needed fixing — the exact case reproduced from the submitted output.
- `docs/how-to/register-a-fixable-doctor-check-in-fgos.md` step 2 — "The fix must be a no-op (`changed: false`) when the state is already valid" — documents `changed: false` as the intended, correct no-op outcome, not a failure.
- Reproduced live: fresh `fgos setup` (which sets `gateBypass.level` to the default) followed by `fgos doctor --fix --pretty` prints `✗ fix: gate-bypass-configured (gateBypass.level already "off")` — a fully healthy state rendered as failed.
- `main-checkout-hook-wired` (`registrations.mjs:374-378`) has no `registerFix` entry (only `gate-bypass-configured` does, per `registrations.mjs:559-562` and this file's own step-3 doc) — confirms its `✗` in the submitted output is an unrelated, correctly-reported, unfixed check, not part of this bug.

## Outstanding questions deferred to planning

None — the fix is fully determined by the `{changed, message}` contract
documented above; there is no remaining implementer-level choice beyond
applying it (change one boolean's source at `bin/fgos.mjs:3713`, extend
`renderPretty`'s existing test coverage for the doctor branch).
