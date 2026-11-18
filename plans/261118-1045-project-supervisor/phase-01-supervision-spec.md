# Phase 1 — Supervision area spec

Supervision is a new product area. A new area gets a spec before it gets code (platform-foundations L5, question 2). This phase writes that spec and registers the area in the three maps. Docs only. No source, no tests.

## Inputs
Step 0 first: re-grep every path and line below at the current tree. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `plans/261118-1045-project-supervisor/plan.md`: decisions PS-1 to PS-24, outcome, acceptance criteria, owner question Q1.
- `plans/reports/shaping-261118-1045-supervisor-owner-questions.md`, section "SETTLED DESIGN" (line 241 onward): the owner's ten items.
- Style: `docs/platform/observe/spec.md` (authority header at lines 3-19, then "Ownership", "1. Overview & Boundaries", "2. Shared Entities", "3. Storage Model", "4. Commands & Routing"). Newer area specs add a "Lịch sử quyết định" section (AGENTS.md, question 6).
- Area map rows: `docs/platform/system-overview/spec.md` (the table that lists "Observe (Metrics & Friction)"); `docs/platform/component-boundary.md:82` (Observe row) and `:117` (related-files row); `docs/reading-map.md:204` (Observe line format).
- Facts the spec cites, verified at base: Land port `packages/git/rust/src/land.rs:102` (rank-20 slot held while `LandSession` lives); `packages/distribution/rust/src/timer.rs:33` (`Schedule`); `src/session-host/head-start.mjs:202-219` (one live head per role); `packages/holder-lock/contracts/lock-registry.v1.json` (lock rows).

## Footprint
`docs/platform/supervision/**`, `docs/platform/system-overview/spec.md`, `docs/platform/component-boundary.md`, `docs/reading-map.md`.

## Steps
1. Create `docs/platform/supervision/spec.md` with the authority header and these sections:
   - Overview and boundaries. Owns: portfolio reader, event queue, watcher, wake door, supervisor verbs, discussion source, landing use case. Must not own: Work items, Git mutation (composes the Git ports), session start (Session Host and head start), config storage.
   - Shared entities: Plan (frontmatter vocabulary, owned by the plan contract), Event (raised once, `handled` flag), Lane (a held machine-scope lock), Lead, Supervisor (Identity role `head:supervisor-<project handle>`, PS-8; the Identity directory is per OS user, so every head name carries the project handle), Ticket (request verbs that answer at once).
   - Storage: events live in the Event Store under a `supervision` consumer; lanes under `<lockRoot>/lane/<k>.lock`; the watcher tick lock `watcher` (repo scope).
   - Commands and routing: `fgos watcher tick`, `fgos supervisor wake|plans|queue|handled|done`, `fgos land`, `fgos request result`, `fgos session stop`, `fgos slots`; a confined caller reaches the socket verbs through one host rule (PS-20).
   - Flows: tick -> event -> action (wake or notify); wake -> drain -> admit -> start lead; lead -> `fgos land`.
   - Failure modes: no supervisor startable from a timer or a head killed with the tick's unit, land onto a dirty main checkout, a land killed mid-way (`fgos git recover`), lane leak, two supervisors, a stuck supervisor (`supervisor-stuck`), late or foreign commits (PS-21).
   - Trust boundary (PS-19, decided): `fgos land` runs `land.gates` and `land.regenerate` with `sh -c` in the candidate worktree, unconfined, as the owner, on branch code. The control is review (a lead lands only a reviewed phase) and the trusted main checkout's config (as `runner.capabilities.<c>.verify`). Confined gates are a separate backlog row (phase 19).
   - Decision history: PS-1 to PS-24 as dated one-liners, each with its ground. Note the three deliberate departures from the settled wording (merge slot instead of a `land` lock; Identity role instead of a supervisor lock; the supervisor lands portfolio edits with `land --paths`, PS-14) and that PS-24 waits on owner question Q1.
2. Add one Supervision row to the area table of `system-overview/spec.md` and to `component-boundary.md` (next to Observe), plus one related-files link at its line `:117`.
3. Add a `docs/reading-map.md` line for `packages/supervision/rust`, `core/watcher/`, the spec, and the contract folder. Mark each path "planned" until phase 19 clears the word.
4. Do not copy contract details (verbs' flags, config defaults). Link to `packages/supervision/contracts/` and `core/config-standard/`.

## Verify
- `rg -n "supervision/spec.md" docs/reading-map.md docs/platform/system-overview/spec.md docs/platform/component-boundary.md` shows three hits.
- `node scripts/run-tests.mjs test/docs` if that folder owns link checks (`ls test | rg -i doc` first); otherwise the repo doc-health check named in AGENTS.md. Pass: no broken link, no new warning.
- Each decision id in the spec appears once in `plan.md`.

## Rollback
Revert the phase commit. Nothing reads these docs at run time.
