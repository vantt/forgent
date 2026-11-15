# Phase 13: a Config repair moves per-capability taste into the new tables

Start after: S4 on main, plan approved. Wave 1, parallel with 01, 02, 14; **03 lands after this phase**. Rules:
[phase-lead-rules.md](phase-lead-rules.md). Facts: F6, F10 (Config repair mechanism). Worktree `erd-p13`, report slug
`erd-p13-taste-move-fix`. Effort: 1.5d.

## Context

Phase 03 removes `roles`, `personas` and `seats` from `runner.capabilities.<x>` (schema `additionalProperties: false`).
A config still holding them is then refused on load, and the PreToolUse hook blocks every Agent/Task call on a config
refusal (`dispatch/hook.mjs:50-54`): refusing by name with only a manual guide would stop agent work in every project
that has not been edited (red-team, Critical). Config already owns repairs, one function per fix id
(`packages/config/rust/src/repair.rs`, rows and fixes in `packages/config/contracts/doctor-rows.v1.json`), so the move
is one more registered fix of that mechanism (D11), not a new migration tool.

## Requirements

1. `doctor-rows.v1.json`: row `config-capability-taste-moved` (fails when the project or global file holds
   `runner.capabilities.<x>.roles|personas|seats`; message names paths only, never values) with fix
   `move-capability-taste`.
2. `repair.rs` `move-capability-taste`, through the write transaction (`write.rs`), never by hand-written YAML:
   `capabilities.<x>.roles.<r>` -> `runner.roles.<r>`, `capabilities.<x>.personas.<p>` -> `runner.personas.<p>`, keeping
   each value's `@fgos:why` reason line; when two capabilities give one role or persona different values, or the
   target already holds a different value, the fix changes nothing and the row names both paths (the person decides with
   `fgos config set/unset`); `capabilities.<x>.seats.<s>` has no place in the new shape (seat taste lives in the
   workflow, phase 14): the fix removes it and its report names each removed path. Idempotent: a second run applies
   nothing. A confined session is refused (the module's existing rule).
3. Golden vectors in the Config crate's repair tests: a single move, two capabilities agreeing, two disagreeing
   (refused, nothing written), a target already set, `seats` removed and reported, a global file, a file with none.
4. The row is a readiness repair (AGENTS.md "registered fix only when the repair is safe and about readiness"): the
   moved values keep their meaning; only conflicting values stop for a person.

## Files

- Modify: `packages/config/contracts/doctor-rows.v1.json`, `packages/config/rust/src/{repair.rs,doctor.rs}`, the
  crate's repair and doctor tests, mutation census.
- Create/Delete: none. Tests retired: none.
- Net size: about +180 Rust lines, +150 test lines.

## Acceptance

- `cargo test -p fgos-config` green with the new vectors; on a copy of this repo's `.fgos/config.yaml` (three blocks,
  F6) the fix refuses on the two disagreeing red-team orders and names both paths; after the person sets
  `runner.roles.red-team` and unsets the two blocks, a second run moves `reviewer` and reports nothing else.

## Risks / rollback

- A machine runs the new release before `doctor --fix` (H x M): the window lasts until the fix runs; the landing guide
  (12) runs `fgos doctor --fix` right after activation in each project. Revert: one commit.
