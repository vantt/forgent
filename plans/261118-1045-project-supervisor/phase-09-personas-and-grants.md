# Phase 9 — Personas and grants

Adds the three personas the supervisor plan needs (`supervisor`, `lead`, `planner` as a head) and the grant table rows
that confine them (PS-14, PS-16). The grant table stays the one reader (`grantOf`); nothing else bypasses it.

## Inputs
- Step 0: the session-verb plan (`plans/261118-0947-session-verb-for-agent-sessions`, a blocker) renames
  `head rotate|answered|restore role|start` to `session ...`. Re-read `src/session-host/head-grants.mjs` on the landed
  tree. If the verbs still say `head ...`, stop with `NEEDS_CONTEXT`.
- `src/session-host/head-grants.mjs:19` (`ROTATION_VERBS`), `:21-26` (`GRANTS`: `secretary`, `shaper`), `:46`
  (`grantOf(role, persona)`); its only caller `src/session-host/head-start.mjs:172`; the name rule
  `head-start.mjs:21` (`NAME_PATTERN`, 32 chars) and fronting `:202-219`.
- Plan frontmatter reader: `src/util/yaml.mjs:89` (`readFrontmatter`); the plan footprint rule
  `scripts/plan-contract-check.mjs:31` (`overlaps`: a glob counts as its fixed prefix).
- Confinement path rule: `src/runner/dispatch/confinement/workspace-paths.mjs` (`validateWorkspacePaths`).
- Persona yaml shape: `core/agents/secretary.yaml`, `core/agents/planner.yaml`; projection:
  `scripts/project-agents.mjs` (writes `.claude/agents/*.md`).
- Verbs the later phases add to the socket: `land`, `run`, `request result`, `session stop` (phase 10);
  `supervisor handled`, `supervisor done` (phases 10 and 12).

## Footprint
`src/session-host/head-grants.mjs`, `test/session-host/head-start.test.mjs`, `core/agents/supervisor.yaml`,
`core/agents/lead.yaml`, `core/agents/planner.yaml`, `.claude/agents/**` (regenerated, never hand-edited).

## Steps
0. Re-grep inputs. Note which verb spelling landed; use it everywhere below.
1. Grant rows (`writes` are project-relative; `verbs` are socket verbs; every head keeps `ROTATION_VERBS`):
   - `secretary`: add `land`, `request result`.
   - `shaper`: writes `['docs/discussions']`; add `land`, `request result`.
   - `planner`: writes `['plans', 'docs/discussions']`; verbs `land`, `request result` + rotation.
   - `supervisor`: writes `['plans', 'docs/backlog.md']`; verbs `session start`, `session stop`, `land`,
     `request result`, `supervisor handled`, `supervisor done` + rotation. It never gets `run`.
   - `lead`: writes from its plan (step 2); verbs `run`, `land`, `worktree create`, `request result` + rotation. No `session start`.
2. Lead writes: `grantOf(role, persona, { projectRoot })` for persona `lead` resolves the plan by the name (PS-11: a
   unique prefix of the plan dir, names cut to 32), reads `footprint` with `readFrontmatter`, and returns each
   entry's fixed prefix (`dir/**` -> `dir`) plus the plan dir itself. Refusals (`HeadGrantError`): `plan-not-found`,
   `plan-ambiguous` (the portfolio collision of PS-11), `plan-footprint-empty`. A path the confinement rule refuses
   is not widened: the grant fails `grant-invalid` through `head-start.mjs:172`.
3. Pass `projectRoot` from `startHeadSession` to `grantOf`; no other caller changes. The shape of `grantOf` without
   `projectRoot` is unchanged for every other persona.
4. `core/agents/supervisor.yaml` and `lead.yaml` in the secretary's shape: `decision_boundary`, `rigor`, `tool-scope`
   (`Read`, `Bash`), no `skills` field yet (phase 18 adds it with the skills, so no persona names a missing skill). Supervisor never implements, reviews, lands or chats with the owner; lead never starts or stops a
   session. Add the head-session note to `planner.yaml`: as a head it starts from a settled discussion, writes only
   `plans` and `docs/discussions`, lands with `land --paths`.
5. Regenerate `.claude/agents/**` with `node scripts/project-agents.mjs`.
6. Tests (in `head-start.test.mjs`, the owner of `grantOf`; extend the existing grant-table test, `:109`):
   - each persona's verbs and writes equal the rows above;
   - a lead's writes equal its plan footprint prefixes, and the three refusals fire;
   - an unnamed persona still holds nothing; a non-head role is still refused.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-start.test.mjs` passes.
- After `node scripts/project-agents.mjs`, `git diff --stat .claude/agents` shows only the new agents and `planner.md`.
- `rg -n "grantOf" src` finds `head-grants.mjs` and `head-start.mjs` only.

## Rollback
Revert the phase commit and rerun `node scripts/project-agents.mjs`. Heads started meanwhile keep the grant they
launched with until they rotate.
