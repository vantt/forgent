# Phase 2: Brief injection and session start parity

## Inputs
- `src/session-host/head-start.mjs`
- `src/session-host/head-plan.mjs`
- `test/session-host/head-start.test.mjs`
- Phase 1 task resolution functions

## Footprint
- `src/session-host/head-start.mjs`
- `test/session-host/head-start.test.mjs`

## Steps
1. In `src/session-host/head-start.mjs`:
   - In `openingText({ persona, name, personaLines, handoff, forQuestion, onWake, task })`:
     When `task` is present (`{ path, firstStep }`), inject the `# Task` section, stating:
     `# Task`
     `Your task is \${task.path}.`
     `\${task.firstStep}`
   - In `defaultOpening` / `placeHead`:
     Call `taskOfHead(projectRoot, persona, name, ports)` (or `ports.taskOfHead`).
     For `lead`: first step is "Read the phase table, check which wave or phase is next, create its worktree, and run it to done."
     For `planner`: first step is "Read the discussion, write plans/<dir>/plan.md and its phase files per the plan contract, run node scripts/plan-contract-check.mjs, and land via fgos land --paths."
     For `shaper`: first step is "Read domains/<domain>/AGENTS.md, conduct the design discussion, and maintain DISCUSSION.md."
     Pass `task` to `openingText`.
   - Ensure an unbound task-bound persona fails in `placeHead` / `startHeadSession` with `HeadStartError` (e.g. `task-not-found`), launching nothing and leaving no placement record.
2. In `test/session-host/head-start.test.mjs`:
   - Add test: starting a planner by discussion head name writes the discussion path and first step into `request.opening`.
   - Add test: starting a lead by plan head name writes the plan path and first step into `request.opening`.
   - Add test: starting a planner or lead with an unbound name rejects before launch.
   - Add test: verify hand start and supervisor start of the same name produce identical opening briefs.

## Verify
```bash
node --test test/session-host/head-start.test.mjs
```
Pass condition: all tests in `test/session-host/head-start.test.mjs` pass cleanly.

## Rollback
`git checkout HEAD -- src/session-host/head-start.mjs test/session-host/head-start.test.mjs`
