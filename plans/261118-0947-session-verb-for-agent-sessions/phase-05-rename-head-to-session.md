# Phase 5: Rename `fgos head` to `fgos session`

Decisions: SV-8, SV-9, SV-10. Depends on phase 4 (shared registry/manifest/`bin/fgos.mjs`) and phase 3 (name free).

## Inputs (read first)
- What secretary phases 15-17 landed: `rg -n "fgos head|'head'|head start|head rotate" src bin core domains docs/platform packages test --glob '!target'`
  (registry entry, `bin/fgos.mjs` arm, `test/cli/head-verb.test.mjs`, `src/session-host/**`, `src/session-rotation/**`, hook text, `core/skills/fgos-secretary/**`, `core/skills/handoff/**`, session-host spec verb section).
- `packages/run-supervisor/contracts/head-request.v1.json` (`verbs`), `packages/run-supervisor/rust/src/head_request.rs` and tests, `src/session-host/head-request.mjs`, `test/session-host/head-request.test.mjs`.
- Mailbox hits on "head start" (`packages/mailbox/**`, `apps/fgos/src/wiring/mailbox_hook.rs`) are the mailbox's own head term: read to confirm, do not rename.

## Files this phase may write
See the phase table footprint in plan.md.

## Facts re-checked on main 4e51097ec (lead, 2026-11-19)
Phases 7-8 added verbs: the CLI `head` entry is `fgos head <start|rotate|write>` (`command-registry.mjs` 2278-2329;
manifest 4629-4734, routes 654-660); `bin/fgos.mjs` `case 'head':` 3385-3410. Socket verbs now: `head start`,
`head rotate`, `head answered`, `head restore role`, `head bind session`, `head write` — named in
`head-request-client.mjs` 17-21, `head-grants.mjs` 23/29/39, `head-request.v1.json`, Rust `head_request.rs` 55-68
(+tests 993-994), `head_client.rs` 164/173, `tests/head_request.rs` (41), and outside the first footprint
`apps/fgos/src/wiring/session_rotation_hook.rs` 159-178 (+tests 405-476) and `mailbox_identity.rs` 146/563.
Skills: `fgos-secretary/SKILL.md` 26 (`fgos head write`), 33; `handoff/SKILL.md` 19. Specs: session-host 98-174,
supervision 32/56/96 (96 plans `fgos session start|stop|rotate`: align it). Tests: `test/session-host/head-request.test.mjs`,
`head-start.test.mjs` 101-114, `test/cli/head-verb.test.mjs`.

**Lead decisions (2026-11-19):** rename only the CLI noun and the socket verb strings (`session <x>`); the JS constant
names (`HEAD_*_VERB`), file names (`head-*.mjs`, `head_request.rs`, `head-request.v1.json`), `internal head-request`,
Identity's `head:` role and `FGOS_HEAD_*` env stay (SV-9: "head" stays the Session Host's word for the session kind).
Rust and Node verb tables change in one commit (the supervisor refuses unknown verbs). The `agent-confinement` spec
mention (~445) and the CHANGELOG line wait for phase 6 (phase 7d holds those files in this wave).

## Steps
0. Re-grep on the landed tree; list every `fgos head` use with its file. Stop with `NEEDS_CONTEXT` if the verb landed in Rust or under another name.
1. Registry entry `head` becomes `session` (same sub-verbs, flags, exit codes); drop the "provisional" note; regenerate manifest and routes.
2. `bin/fgos.mjs` arm and every message/help text that prints `fgos head ...`.
3. Every socket verb `head <x>` (at base: `head start`, `head rotate`, `head answered`, `head restore role`) becomes `session <x>` in the contract, the Rust supervisor and the Node client; tests follow.
4. Skills and hook text: `fgos head` becomes `fgos session`; `npm run build:skills` regenerates `.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`.
5. Rename `test/cli/head-verb.test.mjs` to `test/cli/session-verb.test.mjs` (same cases, plus `session end` answering unknown sub-verb as one case of the existing refusal proof).
6. Session-host spec: the verb section speaks of `fgos session`; one decision-history line records the rename and that `fgos head` left no alias.

## Verify
- `node scripts/run-tests.mjs test/cli/session-verb.test.mjs test/session-host test/cli/fgos-manifest.test.mjs`; `cargo test -p fgos-run-supervisor`.
- Acceptance 1 and 2 of plan.md.

## Rollback
`git revert` the phase commit set; regenerate manifest, routes and skills.
