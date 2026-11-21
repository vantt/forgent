# Phase 4: Coordinating heads keep their provider floor

Capability: `code:implement`.

Closes `p-of5vpvce3e`.

## Inputs

- Owner rule (2026-11-21): a head that coordinates others runs on Claude. The secretary runs on Sonnet; the supervisor,
  leads, planners and shapers run on Opus. A weaker family is never chosen, even when it is the freest account.
- `.fgos/config.yaml` `runner.personas`: supervisor, lead, shaper and planner already have `tier: flagship` and
  `prefer: [{executor: claude, invocation: claude-herdr-bypass-bwrap}]`. The secretary has `tier: standard` and
  `pool: claude-miu` only, so its seat can still be bound to another family.
- `src/session-host/head-start.mjs` `bindHeadSeat` (asks `bind` for one interactive seat under the persona) and
  `test/session-host/head-start.test.mjs`.
- `core/config-standard/runner.yaml` (`prefer` entries and `allowCrossProvider`).

## Footprint

`.fgos/config.yaml`, `test/session-host/head-start.test.mjs`.

## Steps

1. Through `fgos config patch`, give the secretary persona
   `prefer: [{executor: claude, invocation: claude-herdr-bypass-bwrap}]`, keeping `tier: standard` and its pool, with
   an `@fgos:why` that cites the owner rule.
2. Owning test, in `head-start.test.mjs`: with a runner config whose only free account is a non-Claude family, starting
   each coordinating persona (secretary, supervisor, lead, planner, shaper) under its `prefer: claude` pin is refused
   `bind-refused`, or waits, and never binds the other family. Build the runner config in the test; never read the
   repo's own config there.
3. Repo-config fact: add one assertion that this repository's `.fgos/config.yaml` pins every coordinating persona to
   `claude`. That is a rule about the repo's own files, so it belongs in `npm test`. Put it beside the test above; no new
   test file.
4. If the bind crosses family despite a pin without `allowCrossProvider`, stop. That fix is in
   `src/runner/execution/bind.mjs`, which the s6a plan owns, so report it to the lead as a plan change.

## Verify

`node scripts/run-tests.mjs test/session-host/head-start.test.mjs` passes, and `fgos config get
runner.personas.secretary` shows the pin.

## Rollback

Revert the phase commit. The pin is one config entry.
