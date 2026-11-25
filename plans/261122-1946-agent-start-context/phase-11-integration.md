# Phase 11: Integration gate, token table, changelog

## Inputs

- All phase branches, already landed on main.
- `reports/before-bytes.md` from phase 4.
- The per-start records (Observe kind `start-context`, phase 3).

## Footprint

`CHANGELOG.md`, `plans/261122-1946-agent-start-context/reports/**`.

## Steps

1. Run the full gate on main: `npm test` and `cargo test --workspace --no-fail-fast`. Fix nothing outside this
   phase's footprint. Hand any red back to the phase that owns its file.
2. Start one head per persona and one worker per role task through the real doors on this tree, for example
   `npm run fgos:dev -- session start <persona>` and `npm run fgos:dev -- run "<probe>" --capability <role>`. Read
   the per-start records.
3. Write `reports/start-token-table.md`: before (phase 4 and the phase-5 worker goldens) against after (the records),
   in tokens, for each head persona and each worker operation. Count each start as its opening plus the always-loaded
   text the CLI reads (AGENTS.md, CLAUDE.md), so the table shows the net change per start and not only the opening.
   Report the external blocks (AgentKit, GitNexus, MDView, `.claude/rules`) as an unchanged line of their own.
4. Add a line to `## [Unreleased]` in `CHANGELOG.md` covering two things: agents get their start context from one
   composer, and hand-opened sessions get context through a SessionStart hook with the configurable
   `startContext.entryPersona`.
5. Run `rg -n "openingText|FIRST_STEPS|renderOnWake|renderPersonaSection" src scripts` and the one-producer test once
   more on the merged tree.

## Verify

- `npm test` and `cargo test --workspace` are green.
- `reports/start-token-table.md` has a row for each persona and each operation.

## Rollback

Revert the CHANGELOG line. The reports are records and stay.
