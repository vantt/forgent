# Phase 1: Shared know-how, skills, spec and pane lookup

Capability: `code:implement`.

## Inputs

- Landed plan `plans/261125-2313-head-communication-agent-to-agent/` (its `reports/integration.md` and the send
  answer values in `packages/mailbox/contracts/frame.v1.txt`).
- `core/skills/fgos-secretary/SKILL.md` (mail lines near 32, 76, 122), `core/skills/fgos-supervisor/SKILL.md` (line
  near 153), `core/skills/fgos-lead/SKILL.md` (line 15 "You have no mailbox").
- `core/skills/_shared/` for fragment style; `docs/platform/session-host/spec.md` permission section.
- `apps/fgos/src/wiring/supervision.rs` `pane_of`; `packages/identity/rust/src/directory.rs` `terminal_key()`.

## Footprint

`core/skills/_shared/head-mail.md`, `core/skills/fgos-secretary/SKILL.md`, `core/skills/fgos-supervisor/SKILL.md`,
`core/skills/fgos-lead/SKILL.md`, `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**` (regenerated,
never hand-edited), `docs/platform/session-host/spec.md`, `apps/fgos/src/wiring/supervision.rs`,
`apps/fgos/tests/supervision_verbs.rs`, `CHANGELOG.md`.

## Steps

1. Write `core/skills/_shared/head-mail.md`: send once with `--wake`; the `path` values and what to do for each;
   each refusal code and its next step; reading one's own inbox with `--claim`; who each persona may write to.
2. Replace the mail lines in the three skills with a pointer to `../_shared/head-mail.md`; fix the lead's "no
   mailbox" line.
3. `npm run build:skills`.
4. Session-host spec: add the base `head` `mailbox inbox` row to the permission section.
5. `supervision.rs`: make `pane_of` call `Listed::terminal_key()`; keep its refusal code `session-has-no-pane`.
6. `CHANGELOG.md` `[Unreleased]`: one line for the head-to-head mail change of both plans.

## Verify

`npm run build:skills && npm test -- test/setup && cargo test -p fgos --test supervision_verbs`. Pass: green, and
the acceptance greps of `plan.md` hold.

## Rollback

Revert the commit and re-run `npm run build:skills`.
