# Phase 03: persona and role taste get their own tables (`runner.personas`, `runner.roles`)

Start after: S4 on main, plan approved. Wave 1, parallel with 01 and 02; **lands after 02**. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F6. Worktree `erd-p03`, report slug `erd-p03-taste-tables`. Effort: 3d.

## Context

Owner decision 2026-11-14 (`docs/platform/vision.md` section 6): each kind of customization has exactly one place;
persona and role preferences leave the capability rows for their own tables (names proposed by the owner's lead:
`runner.personas`, `runner.roles`; "taste" was rejected). Today they live per capability
(`runner.capabilities.<cap|prefix:*>.{roles,personas,seats}`, schema `runner.schema.yaml:540-565`, crate
`model.rs:233-245`, precedence seat-binding spec 6.3). D-ADR0072's persona rule (persona files carry no `tier` or
`prefer`) is kept. Ranking stays in the Seat Binding crate; this phase changes the shape it reads.

## Requirements

1. Crate `fgos-seat-binding`: `Config` gains `personas: map<name, Scope>` and `roles: map<role, Scope>`
   (`Scope {tier?, prefer?}`); `CapabilityEntry` loses `roles`, `personas`, `seats`. Precedence per attribute
   (rewrite of spec 6.3): `tier`: override (5.4 step 2) > `personas.<p>` > `roles.<role>` > the workflow seat's `tier` >
   `cap.tier` > `prefix.tier` > `defaults.tier`; `prefer`: override executor > `personas.<p>` > `roles.<role>` >
   `cap.prefer` > `prefix.prefer` > `tierFallback.<tier>`; `maxTier` and `rigor` columns unchanged. The exact-then-prefix
   entry lookup (`policy.rs:24-35`) stays (a project may still write one override row per job).
2. Schema `core/config-schema/runner.schema.yaml`: top-level `personas` and `roles` (`project-only`, same as the
   per-capability tables they replace; `roles` keys limited to the five roles); `$defs.capability` drops `roles`,
   `personas`, `seats`. `core/config-standard/runner.yaml`: move `code:*` `roles.red-team` to `runner.roles.red-team`
   with value `[xai, claude, openai]`, delete the `marketing:*` `roles` block (Q2 default; the `marketing:*` row itself
   goes in phase 05), and delete the `seats` blocks of `architecture:critique` and `architecture:synthesize` (phase 02
   moved their `tier: frontier` into the workflows; their `prefer [openai, claude]` is Q2). This is why 03 lands after
   02. Regenerate whatever the schema feeds (`rg -n "runner.schema.yaml" scripts packages/config`).
3. Node: `capability-config.mjs` `bindingTasteOf`/`SCOPE_GROUPS` (:124-148) read the new tables;
   `seat-policy.mjs:28 seatConfigOf` passes them; `dispatch/config.mjs:682,761` validates that executors named in
   `runner.personas.*.prefer` and `runner.roles.*.prefer` exist; `agent-definitions.mjs:233-240` message points at
   `runner.personas.<name>`. Every reader stays inside the existing `doors` rows (capability reads, prefer chooser).
4. This repository's tracked `.fgos/config.yaml`: its two `roles.red-team` blocks (`:94`, `:112`) move to
   `runner.roles` through the config door (`npm run fgos:dev -- config set|unset ... --reason ...`), same commit as the
   schema change. No new migration mechanism (D11): an old file is refused by name by the schema (`config check`
   lists it); the landing guide (phase 12) tells each machine what to move.
5. Proofs: crate golden `packages/seat-binding/contracts/seat-binding.golden.v1.json` cases for each precedence row
   (old per-capability cases rewritten to the new tables, one case per column; no case left on a removed key);
   `packages/config/rust/tests/golden_validate.rs` refuses `capabilities.<x>.roles`; Node
   `test/runner/execution/capability-config.test.mjs` (bindingTasteOf), `test/runner/agent-definitions.test.mjs:224-226`
   (message).
6. Spec: `docs/platform/seat-binding/spec.md` sections 6.1-6.4, 10.4 rewritten to the new tables; section 15 gets a
   decision entry (number from `fgos identity mint d-adr`): "persona and role taste live in `runner.personas` and
   `runner.roles`; capability rows hold jobs and tool abilities; amends 6.3 of D-ADR0072, whose persona-file rule
   stands". `docs/platform/vision.md` "Known gaps" capability bullet: one line, step 2 in progress (S5).

## Files

- Modify: `packages/seat-binding/rust/src/{model.rs,policy.rs,explain.rs}` (explain names the new sources),
  `packages/seat-binding/contracts/seat-binding.golden.v1.json`, `packages/seat-binding/rust/tests/*` that build a
  `Config`, `core/config-schema/runner.schema.yaml`, `core/config-standard/runner.yaml` (roles and seats blocks only),
  `packages/config/rust/tests/golden_validate.rs` (and any `packages/config` golden fed by the schema; list in report),
  `src/runner/execution/capability-config.mjs`, `src/runner/execution/seat-policy.mjs`, `src/runner/dispatch/config.mjs`,
  `src/runner/agent-definitions.mjs`, `.fgos/config.yaml`, `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md`,
  their Node tests, mutation census.
- Create/Delete: none. Tests retired: per-capability `roles/personas/seats` cases whose behaviour is gone; each named.
- Net size: about -80 / +120 Rust and schema lines, -20 / +30 Node.

## Steps

1. Red: golden cases for the new tables. 2. Crate. 3. Schema, standard, generated outputs. 4. Node readers.
5. Repo config through the door. 6. Spec and decision entry. 7. Gates plus `cargo test -p fgos-seat-binding -p fgos-config`
   and the Node tests `rg -l "bindingTasteOf|seat-policy|personaModelTasteProblem|roles.red-team" test` lists.

## Acceptance

- `rg -n "\.roles\b|\.personas\b|seats" core/config-schema/runner.schema.yaml` shows them only at the top of `runner`
  (and `seats` nowhere under `$defs.capability`); golden green; `config check` on this repo clean.
- `fgos dispatch explain --for code:review` with a red-team seat names `runner.roles.red-team` as the prefer source.

## Risks / rollback

- Another machine or project still holds `capabilities.<x>.roles|personas|seats` (H x M): refused by name; phase 12's
  guide lists the move; machines upgrade together. Q4 asks whether the owner wants an automatic fix instead.
- Precedence slip (persona vs role vs workflow tier) (M x H): one golden case per row of the new table.
- Revert: one commit series; the repo config reverts with it.
