# Phase 3: Docs, supervisor skill and changelog

Capability: `code:implement`. Acceptance criterion served: 5 (docs, skill and changelog part).

## Inputs

- `plans/discussions/ds-itzp2debmh-session-type-submits-enter/DISCUSSION.md` §4 and §6 (the locked behaviour).
- `plan.md` of this plan: Outcome, and Non-goals (the prompt-door choice).
- `docs/platform/supervision/spec.md`: the `fgos session type` row (about line 141) and the wake text (about line 225).
- `docs/platform/session-host/spec.md`: the verbs row (about line 195).
- `docs/platform/agent-mailbox/spec.md` §15.8: the typed nudge, rule 4, and the `deliver_brief` warning.
- `core/skills/fgos-supervisor/SKILL.md`: lines about 84, 142 and 156.
- `changelog.d/README.md`.

## Footprint

`docs/platform/supervision/spec.md`, `docs/platform/session-host/spec.md`, `docs/platform/agent-mailbox/spec.md`,
`core/skills/fgos-supervisor/SKILL.md`, the generated `.agents/skills/fgos-supervisor/SKILL.md` and
`plugins/fgOS/skills/fgos-supervisor/SKILL.md`, and `changelog.d/261128-0942-session-type-submits.md`.

## Steps

1. Use the documentation write door: `fgos doc locate "<claim>"` for each claim below, and grow the unit it
   names. Create no new document.
2. Supervision spec: `session type` submits the line through the session-host gate-and-submit call, and answers
   `submitted`, or refuses with the causes named in the plan's Outcome. `--no-enter` answers `held`. The
   `target-not-stuck` gate is unchanged.
3. Session-host spec: the verbs row names the new answers. The typed-wake text says one call serves both the
   mailbox and `session type`: profile gap, separate `Enter`, confirm, never the prompt door.
4. Agent-mailbox spec §15.8: the typed nudge now waits the profile's `enter_gap_ms` and confirms the submit. Its
   rules are otherwise unchanged. Keep the `deliver_brief` warning.
5. Supervisor skill: the wake step says the verb submits. On `composer-not-empty`, read the quoted draft and do
   not retype. On `busy` or `dialog-open`, read the screen and handle it as the skill already says. On
   `delivery-unknown`, read the screen before typing again. Add no `\r` workaround. Then run
   `npm run build:skills` to regenerate the two copies, and never hand-edit them.
6. Changelog fragment `changelog.d/261128-0942-session-type-submits.md`, starting with `- Fixed:`. It says that
   `fgos session type` now submits the line and answers `submitted`, refuses by name otherwise, and that
   `--no-enter` types without submitting and answers `held`.

## Verify

`npm run build:skills && node scripts/run-tests.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`
and `git diff --exit-code .agents/skills plugins/fgOS/skills` after the build (the generated copies match their
source). Pass: green. `rg -n 'typed: true' docs/platform core/skills` finds nothing about `session type`.

## Rollback

Revert the phase commit, then run `npm run build:skills`.
