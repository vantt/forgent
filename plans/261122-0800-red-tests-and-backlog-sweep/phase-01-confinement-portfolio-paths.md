# Phase 1: Confinement tests use the plans/ portfolio

Capability: `code:implement`.

## Inputs

- `test/runner/dispatch-confinement-backend-p03.test.mjs`, around the test "a launched secretary shape cannot write
  docs/backlog.md or any docs file…" (about line 1279). It still writes `docs/discussions` and reads
  `docs/backlog.md`.
- a1022572a ("move backlog and discussions under plans/ and swap the head grants") and the current secretary grant
  in `src/session-host/head-grants.mjs` (read only). The secretary now writes `plans/backlog/*` and
  `plans/backlog.md` through the host write door.
- `test/runner/dispatch-confinement-policies.test.mjs` (about lines 726 and 757) and
  `test/runner/dispatch-confinement-machine-private.test.mjs` (about line 485). These use `docs/backlog.md` and
  `docs/discussions` as sample portfolio paths.

## Footprint

`test/runner/dispatch-confinement-backend-p03.test.mjs`, `test/runner/dispatch-confinement-policies.test.mjs`,
`test/runner/dispatch-confinement-machine-private.test.mjs`.

## Steps

1. Read the secretary case and the landed grant. Rewrite the case so it asserts the landed behaviour. A launched
   secretary shape cannot write any `docs/` file. It reads the backlog that the host write door replaced at
   `plans/backlog.md`, and it cannot write `plans/discussions/` directly (or can, if that is what the grant
   gives). Take each expectation from the grant, never from the old test. Rename the test title to match.
2. In the two other files, replace the sample portfolio paths with `plans/backlog.md` and `plans/discussions`. Keep
   each assertion's strength: a file grant stays a file and a directory grant stays a directory.
3. Do not touch `test/golden-recorders/**`, `policy.v1.json` or `resources.v1.json`. Their `docs/backlog.md`
   inputs are handed to plan S6a (see plan.md, "Handed to other plans").

## Verify

`node scripts/run-tests.mjs test/runner/dispatch-confinement-backend-p03.test.mjs test/runner/dispatch-confinement-policies.test.mjs test/runner/dispatch-confinement-machine-private.test.mjs`
passes. `rg -n 'docs/backlog\.md|docs/discussions'` on the three files finds nothing.

## Rollback

Revert the phase commit.
