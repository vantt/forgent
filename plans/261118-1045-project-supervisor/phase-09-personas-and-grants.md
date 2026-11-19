# Phase 9 — Personas and grants

**Owner question Q1 answered (A), 2026-11-18:** the lead's sandbox writes only its plan dir.

Adds the three personas the supervisor plan needs (`supervisor`, `lead`, `planner` as a head) and the grant table rows
that confine them (PS-14, PS-16, PS-24). The grant table stays the one reader (`grantOf`); nothing else bypasses it.

## Inputs
- Re-checked against main `f0128ff57` (2026-11-19): the session-verb plan landed (`session ...` verbs) and the
  owner-question store added the shared question verbs and `session write`.
- `src/session-host/head-grants.mjs`: `HEAD_VERBS` `:29` (`session bind session|rotate|answered|restore role`, every
  head), `QUESTION_VERBS` `:36` (every head) and `QUESTION_ANSWER_VERB` `:38` (secretary only), `GRANTS` `:45-53`
  (`secretary`, `shaper`; each row `{writes, verbs, mailbox, peers}`), `grantOf(role, persona)` `:72`. A `writes`
  entry that is a directory is bound writable; one that is a file stays read-only and only the socket's
  `session write` replaces it (and publishes it through the paths land). Its only caller
  `src/session-host/head-start.mjs:183`, inside `placeHead` `:177` (used by `startHeadSession` `:213` and by the
  rotation executor `src/session-rotation/rotate.mjs`); the name rule `head-start.mjs:22` (`NAME_PATTERN`, 32 chars).
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
1. Grant rows (`writes` are project-relative; `verbs` are socket verbs; every head keeps `HEAD_VERBS` and
   `QUESTION_VERBS`; `mailbox` and `peers` stay `false` for every new row, the secretary keeps its own):
   - `secretary`: add `land`, `request result`.
   - `shaper`: writes `['docs/discussions']`; add `land`, `request result`.
   - `planner`: writes `['plans', 'docs/discussions']`; verbs `land`, `request result`.
   - `supervisor`: writes `['plans', 'docs/backlog.md']`; verbs `session start`, `session stop`, `session write` (its
     backlog file grant is read-only without it), `land`, `request result`, `supervisor handled`, `supervisor done`.
     It never gets `run`.
   - `lead`: writes = its plan dir (step 2); verbs `run`, `land`, `worktree create`, `request result`.
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
6. Tests (in `head-start.test.mjs`, the owner of `grantOf`; extend the existing grant-table test, `:94-103`):
   - each persona's verbs and writes equal the rows above;
   - a lead's writes equal its plan dir, and a resolver refusal surfaces as `grant-invalid`;
   - a rotation (`placeHead` with a `gen`) resolves the same lead grant;
   - an unnamed persona still holds nothing; a non-head role is still refused.

## Verify
- `node scripts/run-tests.mjs test/session-host/head-start.test.mjs` passes.
- After `node scripts/project-agents.mjs`, `git diff --stat .claude/agents` shows only the new agents and `planner.md`.
- `rg -n "grantOf\(" src` finds `head-grants.mjs` and `head-start.mjs` only (plus the doc comment in
  `src/runner/dispatch/session-attempt.mjs`).

## Rollback
Revert the phase commit and rerun `node scripts/project-agents.mjs`. Heads started meanwhile keep the grant they
launched with until they rotate.
