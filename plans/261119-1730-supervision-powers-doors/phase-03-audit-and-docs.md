# Phase 3: Live grant audit and the settled facts

## Inputs
Phases 1 and 2 on `main` and released; the caps lane's `phase-07-grant-audit.md` as the pattern; the grant table.

## Files it may write
Its footprint in the plan table.

## Steps
1. From a throwaway secretary head and a throwaway supervisor head (ask the supervisor to start them; never the real
   Miu), run every added power once and record command, exit code and output in `reports/grant-audit.md`.
2. A power that fails: fix it in the owning phase's file if small, otherwise remove it from `GRANTS` and file a backlog
   row (`fgos identity mint backlog`, written through `session write`).
3. Record settled facts in the owning specs: verbs and trust in `docs/platform/supervision/spec.md`, coordination kinds and
   the prune door in `docs/platform/observe/spec.md`, the socket entries in `docs/platform/session-host/spec.md`, the grant
   list in `docs/platform/agent-confinement/spec.md`; add the decision narrative (SP-D1..SP-D8 pointer) to the supervision
   spec's decision history; add `## [Unreleased]` lines in `CHANGELOG.md`.

## Verify
`reports/grant-audit.md` lists every power with a passing exit code; `npm test` and `cargo test --workspace` green;
`node scripts/plan-contract-check.mjs --all`.

## Rollback
Docs and report only; revert the commit. A removed power is restored by a new plan, not by revert.
