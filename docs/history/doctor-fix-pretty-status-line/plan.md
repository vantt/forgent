# doctor-fix-pretty-status-line — plan

Item: `tsk-45g`. Decisions: `docs/history/doctor-fix-pretty-status-line/CONTEXT.md` (D1).

## Mode

Flags counted (auth / authorization / data model / audit-security /
external systems / public contracts / cross-platform / existing covered
behavior / weak proof around the area / multi-domain):

- **existing covered behavior** — yes. `test/setup/checks.test.mjs` already
  covers `fgos doctor --pretty`/`fgos doctor --fix` CLI rendering.
- All other flags — no. No auth, no data model, no external system, no
  public API contract change (a `--pretty` human-readable rendering tweak,
  not `wrapEnvelope`/JSON shape — `bin/fgos.mjs:3543`'s `{fixed, checks}`
  JSON payload is untouched), single platform, single small module, no
  weak-proof area (it's the opposite — a new test pins the fix), single
  domain.

1 flag → **tiny**: one direct task, one file touched, no split.

## Approach

D1 is fully mechanical: `renderPretty`'s doctor `fixed` loop
(`bin/fgos.mjs:3711-3714`) currently calls
`formatCheck(f.changed, \`fix: ${f.id}\`, f.message)`. Change the boolean
argument from `f.changed` to `true` — every registered fix's own contract
(`registerFix` jsdoc, `registrations.mjs:102-120`; confirmed in
`docs/how-to/register-a-fixable-doctor-check-in-fgos.md` step 2) returns
only `{changed, message}` with no failing outcome, so a fix line is always
a pass; `changed` stays available in `f.message` (already differentiates
"wrote X" vs "already X" in every existing fix, e.g.
`fixGateBypassConfigured`, `registrations.mjs:519-532`).

No alternative approach was considered beyond this one-line change — the
CONTEXT.md evidence already narrows this to a single correct fix; inventing
a second code path (e.g. a third "neutral" symbol) would need its own
product decision this item's request never asked for and no scout evidence
supports.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `renderPretty`'s doctor `fixed` line rendering | low — pure string formatting, no state/write path touched | `test/setup/checks.test.mjs`'s new e2e test (already written, currently RED against the unfixed code — confirms the test actually exercises the bug before the fix lands) |

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): **full** — `gitnexus` provider
registered and `present`. `fgos-coding-validating`/`fgos-coding-implement` run
`impact({target: "renderPretty", direction: "upstream"})` before the edit
lands, per `CLAUDE.md`'s MUST rule — expected low blast radius (`renderPretty`
is called only from the CLI's own output path, `bin/fgos.mjs`'s
`--pretty` branch), but this plan does not skip that check just because the
change looks small.

Files touched: `bin/fgos.mjs` only (the one line inside `renderPretty`).
`test/setup/checks.test.mjs` is already committed with the regression test
(written during `fgos-coding-exploring`'s scout pass, ahead of the fix, so it
proves the bug before proving the fix).

Order: single step — flip the boolean, then run the verify command.

## Shape (tiny)

Direct note: in `bin/fgos.mjs`, change

```js
lines.push(formatCheck(f.changed, `fix: ${f.id}`, f.message));
```

to

```js
lines.push(formatCheck(true, `fix: ${f.id}`, f.message));
```

Concrete cases the new test already covers: a no-op fix (`changed: false`,
"already correct") must render green, not red. The existing `changed: true`
case ("wrote X") was already green before this fix and stays green
(`formatCheck(true, ...)` unconditionally) — no regression there. The
`checks` array lines (`c.passed`) are untouched — only the `fixed` array's
line is in scope, per CONTEXT.md's own feature boundary excluding the
unrelated `main-checkout-hook-wired` check.

## Split

None — one honest one-line fix with one already-written proof point. The
item proceeds as itself.

## Proof surface

Verify (already recorded on the item, `hasRealVerify`-checked):

```
node --test test/setup/checks.test.mjs
```
