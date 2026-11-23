# Phase 5: `declare`, the Authority-map rule and the skill wiring

## Inputs
- Phase 1's crate and verb.
- `docs/platform/component-authority/spec.md` (doors, and who calls them).
- `docs/platform/documentation/subcomponents/admission/spec.md:28-30,158` (the admission model).
- `packages/questions/rust/` (read API for a question's state).
- `core/skills/_shared/plan-contract.md` (§3 body, §4 "Door check" at :88-90, §5 rules).
- `scripts/plan-contract-check.mjs` and `test/scripts/plan-contract-check.test.mjs`.
- Skill sources: `domains/coding/skills/fgos-coding-planning/`, `fgos-coding-implement/` (search step at SKILL.md:76-82), `fgos-coding-validating/`, `fgos-coding-shaping/`, and `core/skills/fgos-shaping/`.

## Files it may write
packages/component-authority/rust/, Cargo.lock, apps/fgos/src/main.rs, test/cli/subcommand-flag-drift.test.mjs, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, the three host-runtime command contracts, core/skills/_shared/plan-contract.md, core/skills/fgos-shaping/, domains/coding/skills/fgos-coding-{planning,implement,validating,shaping}/, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, .agents/skills/, plugins/fgOS/skills/, .claude/skills/ (regenerated only)

## Steps
1. Add `declare.rs` and the subcommand `fgos authority declare --kind component|decision-kind|door|contract --row <json> [--approved-by <q-id>] [--plan <dir>] [--move]` (writes):
   - validate the row against `model.v1.json`;
   - refuse a canonical name or alias that is already used by any row;
   - refuse a missing `parent`, `owner`, `provider` or consumer;
   - refuse a contract path that already has a provider;
   - refuse paths that do not exist;
   - `component` and `decision-kind` require `--approved-by` naming a question the question store reports answered
     (the owner is always asked, per CA-D3 and §6);
   - `--move` of a decision kind's owner requires `--plan` naming an existing plan dir whose `plan.md` Authority map
     names the survivor.

   On success, write the row into the model file in the working tree (atomic write through the durable-file door,
   never a private rename) and print it. The commit that lands it is the caller's. Add crate and verb tests for each refusal.
2. `plan-contract.md`:
   - Add body section **Authority map**, between Non-goals and Phases: a table "New thing | Model row | Note".
     Each new decision, function, module, verb or contract maps to a row id from `fgos authority locate`, or to
     `declare: <kind> <id>`. A row that overlaps an existing one says `survivor: <id>; retired: <path>`.
   - Rename the existing "Door check" to "Footprint check", so the overlap check is not mistaken for a capability check.
   - Add a rule: the validating reviewer rejects a plan whose map is missing or unproven. Until documentation H2
     admission exists, that review is the independent admission step for each `declare` in the map.
3. `scripts/plan-contract-check.mjs`, for `draft` and `ready` plans only:
   - the `Authority map` heading is required;
   - each row id must exist in the model (read the model JSON files directly, as the plan footprint does) or be a `declare:` line;
   - a line that says `overlaps` must also carry `survivor:`.

   Extend `test/scripts/plan-contract-check.test.mjs` with one case per rule, plus a `running` plan that is not checked.
4. Skills:
   - planning: Step 2 (Approach) runs `fgos authority locate` for each new thing and writes the Authority map.
   - implement: replace the prose search at SKILL.md:76-82 with `fgos authority locate` before writing a helper or module.
   - validating: the reviewer checks the map, and a missing or unproven map is a reject.
   - fgos-shaping and fgos-coding-shaping (the skills that write discussions and specs): `locate` before naming a
     component or contract, and `declare` when a spec creates one.

   Run `npm run build:skills`.
5. Gate (owner answer q-3iylevstr2 A, 2026-11-23). `locate` and `declare` are a gated capability. Every skill
   requirement in step 4 and the plan-contract rule in step 2 apply only where the project has
   `packages/component-authority/model/`. Where it does not, the skill records `authority: inactive` in the plan
   or verify note and goes on, in the same shape as the impact-analysis gate in AGENTS.md. In step 3,
   `scripts/plan-contract-check.mjs` skips the Authority-map rule when the checked project has no model. Add one
   test case for that skip.

6. The project's own model (owner order 2026-11-23 12:5x, scope addition approved). `locate` and `declare` read
   and write the model of the project they run in, never fgOS's repository:
   - The wiring in `apps/fgos/src/wiring/authority.rs` resolves the project root through the invocation-root door
     (`packages/git/rust/src/invocation_root.rs`) and passes `<root>/packages/component-authority/model/` to the
     crate. The crate takes the directory as a parameter and resolves no path itself. No second path rule and no
     convention entry: the model has one location relative to the project.
   - No model directory: `locate` returns a `fgos.v1` envelope with `authority: "inactive"` and exits 0, the same
     answer the skills record (step 5). A directory that exists but is missing a file is still refused by the
     loader, as in phase 1.
   - The first `declare` in a project with no model creates an empty one there: `layers.json`, `components.json`,
     `decision-kinds.json`, `contracts.json` and `doors/`, each with no rows and valid against
     `packages/component-authority/contracts/model.v1.json`. It then writes the declared row. Every write goes
     through the durable-file door. The `--approved-by` rule of step 1 still holds, so a new component or decision
     kind still needs an answered owner question; a refused `declare` creates nothing.
   - Owning proof, in `apps/fgos/tests/authority.rs`: in a temporary project with no model, `locate` answers
     `inactive`; a `declare --kind component --approved-by <answered q>` creates the model and the row; `locate` then
     ranks that row first; the five created files load and validate. A crate test covers "refused declare leaves no
     model". The run in this repository still reads this repository's model, so the phase 1 tests are unchanged.

## Verify
- `cargo test -p fgos-component-authority` and `cargo test -p fgos --test authority` are green, including the
  temporary-project case of step 6.
- `node --test test/scripts/plan-contract-check.test.mjs` is green, including the no-model skip.
- `npm run build:skills` leaves `git status` clean after commit.
- `node scripts/plan-contract-check.mjs --all` reports no new error for `running` plans.

## Rollback
Revert the phase commit. The skills, contract and checker go back together, and the generated surfaces are
regenerated by the revert.
