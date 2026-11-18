# Phase 5: Rename `fgos head` to `fgos session`

Decisions: SV-8, SV-9, SV-10. Depends on phase 4 (shared registry/manifest/`bin/fgos.mjs`) and phase 3 (name free).

## Inputs (read first)
- What secretary phases 15-17 landed: `rg -n "fgos head|'head'|head start|head rotate" src bin core domains docs/platform packages test --glob '!target'`
  (registry entry, `bin/fgos.mjs` arm, `test/cli/head-verb.test.mjs`, `src/session-host/**`, `src/session-rotation/**`, hook text, `core/skills/fgos-secretary/**`, `core/skills/handoff/**`, session-host spec verb section).
- `packages/run-supervisor/contracts/head-request.v1.json` (`verbs`), `packages/run-supervisor/rust/src/head_request.rs` and tests, `src/session-host/head-request.mjs`, `test/session-host/head-request.test.mjs`.
- Mailbox hits on "head start" (`packages/mailbox/**`, `apps/fgos/src/wiring/mailbox_hook.rs`) are the mailbox's own head term: read to confirm, do not rename.

## Files this phase may write
See the phase table footprint in plan.md.

## Steps
0. Re-grep on the landed tree; list every `fgos head` use with its file. Stop with `NEEDS_CONTEXT` if the verb landed in Rust or under another name.
1. Registry entry `head` becomes `session` (same sub-verbs, flags, exit codes); drop the "provisional" note; regenerate manifest and routes.
2. `bin/fgos.mjs` arm and every message/help text that prints `fgos head ...`.
3. Socket verbs `head start|rotate` become `session start|rotate` in the contract, the Rust supervisor and the Node client; tests follow.
4. Skills and hook text: `fgos head` becomes `fgos session`; `npm run build:skills` regenerates `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`.
5. Rename `test/cli/head-verb.test.mjs` to `test/cli/session-verb.test.mjs` (same cases, plus `session end` answering unknown sub-verb as one case of the existing refusal proof).
6. Session-host spec: the verb section speaks of `fgos session`; one decision-history line records the rename and that `fgos head` left no alias.

## Verify
- `node scripts/run-tests.mjs test/cli/session-verb.test.mjs test/session-host test/cli/fgos-manifest.test.mjs`; `cargo test -p fgos-run-supervisor`.
- Acceptance 1 and 2 of plan.md.

## Rollback
`git revert` the phase commit set; regenerate manifest, routes and skills.
