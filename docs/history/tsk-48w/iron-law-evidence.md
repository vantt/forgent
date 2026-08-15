# Iron Law evidence: tsk-48w

`classifyIronLaw` against the real committed diff (`fgw/tsk-ldb...
fgw/tsk-48w`) returned `required: true`, matched flags:

```
secret
```

No matched modules. The flag fired on the item's OWN description text
(still full of "FGOS_HERDR_WEB_SECRET"/"secret" mentions from the
pre-realignment P1 scope, per D14's own note "cụm D9 (token riêng
FGOS_HERDR_WEB_SECRET...) — CHẾT theo D13") — not on anything this diff
actually implements. This item's real scope, after D14, carries no secret
material of any kind (the web client authenticates with the gateway's
existing Bearer token, D13; nothing new is generated or stored here). The
closest live analog to the "secret" risk class this diff actually touches
is the `.gitignore` protection for the bundle output directory
(`herdr-plugin/static/`) — the same protective mechanism class as the
dead secret-file idea (stopping something that shouldn't be committed from
being committed), so that is what this evidence proves failing-before/
passing-after against.

## Test command

```
git check-ignore -q herdr-plugin/static/probe-file
```

## Failing-before / passing-after

Captured live by reverting `.gitignore` to its pre-this-diff content
(`git show HEAD~1:.gitignore`), re-running the check, then restoring the
real committed `.gitignore` and re-running to confirm green — `git diff`
against the committed file confirmed byte-identical restoration before
re-running.

**Before** (`.gitignore` at the parent commit, no `/herdr-plugin/static/`
line):

```
$ git check-ignore -q herdr-plugin/static/probe-file
exit code: 1
```

(`git check-ignore -q` exits `1` when the path is NOT ignored — real red,
not a placeholder.)

**After** (real committed `.gitignore`, confirmed identical via `git
diff .gitignore` returning empty before this run):

```
$ git check-ignore -q herdr-plugin/static/probe-file
exit code: 0
```

## Also real: the two exhaustive-list regressions caught during Implement

Two existing tests asserted a hardcoded, complete list of registered
doctor-check ids and would have silently kept passing against a stale
expectation had they not been updated alongside the new
`herdr-web-dashboard-configured` registration:

**`test/setup/checks.test.mjs`** (`DOCTOR_CHECKS has exactly the three v1
checks...` — the id-list assertion) and **`docs/specs/distribution.md`**'s
own Data Dictionary #7 row (enforced by
`test/setup/registrations.test.mjs`'s `Data Dictionary #7 names exactly
the registered doctor checks` test) — both updated to include
`herdr-web-dashboard-configured` in the same change; confirmed via the
full `node --test 'test/setup/**/*.test.mjs'` run: **222 tests, 222 pass,
0 fail** (one real failure surfaced and was fixed before this final run —
see the commit history on this branch for the intermediate red state at
`test/setup/registrations.test.mjs:192`, the `Data Dictionary #7` test,
before `docs/specs/distribution.md` was updated).

Also real: `test/setup/checks.test.mjs`'s own `config-not-stale passes
when the existing config already has every default key` fixture needed
`herdrWebDashboard: DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS` added, since
`checkConfigNotStale` reads every registered config-default key via
`assembleRegistryDefaults()` and the new registration widened that set.

## Full suite at the final, returned state

`cargo test --lib gateway` (herdr-plugin): **23 tests, 23 pass, 0 fail**
(9 pre-existing + 4 new `static_serving_*` + the earlier `tsk-54y`
tests, all green -- confirms `with_static_serving`'s wrap-don't-touch
design left `build_router`'s own 9 tests undisturbed, per the plan's own
"smaller path" reasoning).

`cargo test --lib settings` (herdr-plugin): **11 tests, 11 pass, 0 fail**
(5 pre-existing `OrchestratorSettings` + 6 new `WebDashboardSettings`).

`node --test 'test/setup/**/*.test.mjs'`: **222 tests, 222 pass, 0 fail**.

## Not applicable here

No package install beyond what `plan.md`'s own validating pass already
named and proved with real evidence (`rust-embed`/`axum-embed`/
`tower-http` `fs` feature — all real `cargo add --dry-run` probes before
Execute). No scope/architecture redesign. No blocking issue found in the
touched path beyond the two exhaustive-list regressions caught and fixed
above.
