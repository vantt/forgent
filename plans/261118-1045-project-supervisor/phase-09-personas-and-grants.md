# Phase 9 — Personas and grants

**Owner question Q1 answered (A), 2026-11-18:** the lead's sandbox writes only its plan dir.

Adds the three personas the supervisor plan needs (`supervisor`, `lead`, `planner` as a head) and the grant table rows
that confine them (PS-14, PS-16, PS-24). The grant table stays the one reader (`grantOf`); nothing else bypasses it.

## Inputs
- Step 0: the session-verb plan (`plans/261118-0947-session-verb-for-agent-sessions`, a blocker) renames
  `head rotate|answered|restore role|start` to `session ...`. Re-read `src/session-host/head-grants.mjs` on the landed
  tree. If the verbs still say `head ...`, stop with `NEEDS_CONTEXT`.
- `src/session-host/head-grants.mjs:19` (`ROTATION_VERBS`), `:21-26` (`GRANTS`: `secretary`, `shaper`), `:46`
  (`grantOf(role, persona)`); its only caller `src/session-host/head-start.mjs:172`, inside `placeHead` (used by
  `startHeadSession` and by the rotation executor); the name rule `head-start.mjs:21` (`NAME_PATTERN`, 32 chars) and
  fronting `:202-219`.
- Phase 10's resolver `src/session-host/head-plan.mjs` (`planOfHead(projectRoot, persona, name)`: the plan dir of a
  lead name by PS-11, its footprint read from the trunk tip).
- Confinement path rule: `src/runner/dispatch/confinement/workspace-paths.mjs:18-34` (`validateWorkspacePaths`).
- Persona yaml shape: `core/agents/secretary.yaml`, `core/agents/planner.yaml`; projection:
  `scripts/project-agents.mjs` (writes `.claude/agents/*.md`).
- Socket verbs (phase 10): `land`, `run`, `request result`, `worktree create`, `session stop`, `supervisor handled`,
  `supervisor done`.

## Footprint
`src/session-host/head-grants.mjs`, `src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`,
`core/agents/supervisor.yaml`, `core/agents/lead.yaml`, `core/agents/planner.yaml`, `.claude/agents/**` (regenerated,
never hand-edited).

## Steps
0. Re-grep inputs. Note which verb spelling landed; use it everywhere below.
1. Grant rows (`writes` are project-relative; `verbs` are socket verbs; every head keeps `ROTATION_VERBS`):
   - `secretary`: add `land`, `request result`.
   - `shaper`: writes `['docs/discussions']`; add `land`, `request result`.
   - `planner`: writes `['plans', 'docs/discussions']`; verbs `land`, `request result` + rotation.
   - `supervisor`: writes `['plans', 'docs/backlog.md']`; verbs `session start`, `session stop`, `land`,
     `request result`, `supervisor handled`, `supervisor done` + rotation. It never gets `run`.
   - `lead`: writes = its plan dir (step 2); verbs `run`, `land`, `worktree create`, `request result` + rotation.
     No `session start`.
   Only a lead's `land` may name a branch; the route enforces it (phase 10).
2. Lead writes: `grantOf(role, persona, { projectRoot })` for persona `lead` calls `planOfHead` and returns
   `['plans/<dir>']`. Refusals (`HeadGrantError`) are the resolver's: `plan-not-found`, `plan-ambiguous`. The footprint
   is not a write grant (PS-24); it bounds `run` and `land` in the route (phase 10).
3. Pass `projectRoot` from `placeHead` (`head-start.mjs:172`) to `grantOf`, so a start and a rotation resolve the same
   grant. The shape of `grantOf` without `projectRoot` is unchanged for every other persona.
4. `core/agents/supervisor.yaml` and `lead.yaml` in the secretary's shape: `decision_boundary`, `rigor`, `tool-scope`
   (`Read`, `Bash`), no `skills` field (phase 18 adds it with the skills, so no persona names a missing skill).
   Supervisor never implements, reviews, lands code or chats with the owner; lead never starts or stops a session. Add
   the head-session note to `planner.yaml`: as a head it starts from a settled discussion, writes only `plans` and
   `docs/discussions`, lands with `land --paths`.
5. Regenerate `.claude/agents/**` with `node scripts/project-agents.mjs`.
6. Tests (in `head-start.test.mjs`, the owner of `grantOf`; extend the existing grant-table test, `:109`):
   - each persona's verbs and writes equal the rows above;
   - a lead's writes equal its plan dir, and a resolver refusal surfaces as `grant-invalid`;
   - a rotation (`placeHead` with a `gen`) resolves the same lead grant;
   - an unnamed persona still holds nothing; a non-head role is still refused.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-start.test.mjs` passes.
- After `node scripts/project-agents.mjs`, `git diff --stat .claude/agents` shows only the new agents and `planner.md`.
- `rg -n "grantOf" src` finds `head-grants.mjs` and `head-start.mjs` only.

## Rollback
Revert the phase commit and rerun `node scripts/project-agents.mjs`. Heads started meanwhile keep the grant they
launched with until they rotate.
