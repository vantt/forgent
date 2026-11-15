# Phase 03: persona and role taste get their own tables (`runner.personas`, `runner.roles`)

Start after: S4 on main, plan approved. Wave 1, parallel with 01, 02, 13, 14; **lands after 02, 13 and 14**. Rules:
[phase-lead-rules.md](phase-lead-rules.md). Facts: F6, F10. Worktree `erd-p03`, report slug `erd-p03-taste-tables`.
Effort: 3d. Owner question Q2 sets the red-team order; the default is used until it is answered.

## Context

Owner decision 2026-11-14 (`docs/platform/vision.md` section 6): each kind of customization has exactly one place;
persona and role preferences leave the capability rows for their own tables (names proposed by the owner's lead:
`runner.personas`, `runner.roles`; "taste" was rejected). Today they live per capability
(`runner.capabilities.<cap|prefix:*>.{roles,personas,seats}`, schema `runner.schema.yaml:540-565`, crate
`model.rs:233-245`, precedence seat-binding spec 6.3). D-ADR0072's persona rule (persona files carry no `tier` or
`prefer`) is kept. Ranking stays in the Seat Binding crate; this phase changes the shape it reads. 13 ships the repair
that moves old keys, so a machine is one `fgos doctor --fix` away from a valid file (D11).

## Requirements

1. Crate `fgos-seat-binding`: `Config` gains `personas: map<name, Scope>` and `roles: map<role, Scope>`
   (`Scope {tier?, prefer?}`); `CapabilityEntry` loses `roles`, `personas`, `seats`. Precedence per attribute
   (rewrite of spec 6.3, the relative order of what remains unchanged): `tier`: override (5.4 step 2) >
   `personas.<p>` > `roles.<role>` > the workflow's tier (seat, else unit, 14) > `cap.tier` > `prefix.tier` >
   `defaults.tier`; `prefer`: override executor > `personas.<p>` > `roles.<role>` > `cap.prefer` > `prefix.prefer` >
   `tierFallback.<tier>`; `maxTier` and `rigor` columns unchanged. The exact-then-prefix entry lookup
   (`policy.rs:24-35`) stays (a project may still write one override row per job). The crate input `protocol` stays 1:
   the request shape is the crate's own, and S5 never activates between 03 and 09 (one landing series).
2. Schema `core/config-schema/runner.schema.yaml`: top-level `personas` and `roles` (`project-only`, as the
   per-capability tables they replace; `roles` keys limited to the five roles); `$defs.capability` drops `roles`,
   `personas`, `seats`. `core/config-standard/runner.yaml`: `code:*` `roles.red-team` becomes `runner.roles.red-team`
   `[xai, claude, openai]`; the `marketing:*` `roles` block is deleted; the `seats` blocks of `architecture:critique`
   and `architecture:synthesize` are deleted (their producer `tier: frontier` and `prefer [openai, claude]` have no place
   in the new shape: Q2). Regenerate whatever the schema feeds (`rg -n "runner.schema.yaml" scripts packages/config`).
3. Node: `capability-config.mjs` `bindingTasteOf`/`SCOPE_GROUPS` (:124-148) read the new tables;
   `seat-policy.mjs:28 seatConfigOf` passes them; `dispatch/config.mjs:682,761` validates that executors named in
   `runner.personas.*.prefer` and `runner.roles.*.prefer` exist; `agent-definitions.mjs:233-240` message points at
   `runner.personas.<name>`. Every reader stays inside the existing `doors` rows.
4. This repository's tracked `.fgos/config.yaml` (three blocks, F6): run 13's `fgos doctor --fix` from the dev door;
   it refuses on the two disagreeing red-team orders; set `runner.roles.red-team` to the Q2 answer (default: the
   project's own `[openai, xai]`, whose `@fgos:why` records the independence incident it fixed) with its reason, unset
   the two red-team blocks, run the fix again (it moves `reviewer [xai, openai]` to `runner.roles.reviewer`). Same commit
   as the schema change. The report states the scope change: these orders now apply to every capability, not only
   `code:*`/`marketing:*`.
5. Proofs: crate golden `packages/seat-binding/contracts/seat-binding.golden.v1.json` (old per-capability cases
   rewritten to the new tables, one case per precedence column; no case left on a removed key);
   `packages/config/rust/tests/golden_validate.rs` refuses `capabilities.<x>.roles`; Node
   `test/runner/execution/capability-config.test.mjs` (bindingTasteOf), `test/runner/agent-definitions.test.mjs:224-226`.
6. Spec: `docs/platform/seat-binding/spec.md` sections 6.1-6.4, 10.4 rewritten to the new tables (14 added the unit
   tier line to 6.1); section 15 gets a decision entry (number from `fgos identity mint d-adr`): "persona and role
   taste live in `runner.personas` and `runner.roles`; capability rows hold jobs and tool abilities; amends 6.3 of
   D-ADR0072, whose persona-file rule stands". `docs/platform/vision.md` capability bullet: one line, step 2 in progress.

## Files

- Modify: `packages/seat-binding/rust/src/{model.rs,policy.rs,explain.rs}`, `packages/seat-binding/contracts/seat-binding.golden.v1.json`,
  `packages/seat-binding/rust/tests/*` that build a `Config`, `core/config-schema/runner.schema.yaml`,
  `core/config-standard/runner.yaml` (roles and seats blocks only), `packages/config/rust/tests/golden_validate.rs` (and any
  `packages/config` golden fed by the schema; list in report), `src/runner/execution/capability-config.mjs`,
  `src/runner/execution/seat-policy.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/agent-definitions.mjs`,
  `.fgos/config.yaml`, `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md`, their Node tests, mutation census.
- Create/Delete: none. Tests retired: per-capability `roles/personas/seats` cases whose behaviour is gone; each named.
- Net size: about -80 / +120 Rust and schema lines, -20 / +30 Node.

## Acceptance

- The schema has `personas`/`roles` only at the top of `runner` and no `seats` under `$defs.capability`; golden green;
  `config check` on this repo clean; `fgos dispatch explain --for code:review` with a red-team seat names
  `runner.roles.red-team` as the prefer source.

## Risks / rollback

- The main checkout holds uncommitted edits to `.fgos/config.yaml` (H x M): the landing guide (12) reconciles them
  before pulling; never overwrite them.
- Precedence slip (M x H): one golden case per row of the new table. Revert: one commit series (the repo config reverts with it).
