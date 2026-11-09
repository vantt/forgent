---
phase: 10
title: "Setup, doctor and wire-agents arms as use cases; retire fgos preflight; one shim probe per shim per doctor run; claude plugin calls in parallel; mailbox timer names only the activated host"
status: pending
depends_on: ["08 landed (T6 closed; layer order)", "17, 19, 22 landed (the component answers the three rows call)", "24 landed (workflow catalog; registrations.mjs chain)", "packaging P02, P04, P08 landed, or the arm each owns skipped (doctor arm, version/help, uninstall)"]
parallel: "T8 layer; alone in its layer; the Rust and gateway phases run beside it"
effort: ~1.5d
net_size: "Node: bin about -160 (-90 if preflight were kept; it is not), src about +60; scripts 0; Rust 0; tests about -300 (estimate)"
---

# Phase 10 - Setup, doctor, preflight (T9-11, T9-13, C9, T9-12 last import; decision 81 Q1; authority audit AU-02, AU-07)

## Context

**Setup arm** (`bin/fgos.mjs:4022-4160`) composes nine steps inline that belong in `src/setup/` (one use case). **Doctor arm** (`:4251-4271`) holds the doctor loop (arbitration `:4252-4258`) and its strict exit; after packaging P02 it reads `ok` from a result shape; this phase moves the loop into `runDoctor({ root, fix, strict })` beside `createDoctorRun` (`src/setup/registrations.mjs:197`). **wire-agents arm** (`:4232-4250`, landed this week) builds its plan inline: `resolveMainCheckoutRoot`, `planAgentWiring`, `applyAgentWiring`: a use-case call. **Preflight** (`:4317-4389`): decision 81 Q1 retires it from the product CLI: it ran `npm run build:skills` and two `scripts/` checks in whatever cwd it stood in, in a worktree it wrote `.fgos/instructions/effective/repo.json` and stuck the worktree; `git grep` finds no caller outside its own test.

**T9-11 (measured).** 14 identical shim probes in one doctor run, 1.9 s at load 17 (`isShimRunnable`, `src/setup/agent-hooks.mjs:75,393,618`), and `claude-plugin-marketplace` makes three `claude` CLI calls in series, 1.3-1.5 s. `createDoctorRun().once` (`registrations.mjs:197-216` region) is the existing memo door.

**T9-13 (red-team F3).** `src/setup/mailbox-sync-timer.mjs:204-206`: tier 0 (the project shim) then `bin(cwd)` tiers 1-3 (`<cwd>/bin/fgos.mjs`, `node_modules/.bin`, PATH) written into a systemd or launchd unit; `quote()` escapes `"` and `\` only. Tier 0 is the shim the shim-root fix hardens; this phase does not touch the launcher.

**T9-12 last import.** `src/setup/registrations.mjs:106` imports `../cli/version.mjs` (`resolveCliVersionInfo`, 35 lines, imports `COMMAND_REGISTRY`); after P01 removes the `version` arm its only consumer is the `cli-version-visible` doctor check (and the `version` arm if packaging P04 kept a call).

Reused doors: `createDoctorRun().once`, `agent-wiring.mjs` (`planAgentWiring`/`applyAgentWiring`), `hostBinFromActivation` (confined read of the activated release's host), the registry for the preflight entry, `renderPretty` (output formatting stays in the shell).

## Requirements

1. **`setupUseCase(ctx, options)`** in `src/setup/` composing the nine steps; **`runDoctor({ root, fix, strict })`** beside `createDoctorRun` (returns the checks and whether it failed; the strict exit decision is the caller's, via P01's `exitOf`); **`wireAgentsUseCase`** in `src/setup/agent-wiring.mjs`. Arms keep flags, one call, print.
2. **Doctor performance, no row lost.** `isShimRunnable` goes through `run.once` keyed by shim path (one probe per shim per run); the three `claude` calls of `claude-plugin-marketplace` run in parallel; no new row, no condition lost (arbitration §1.8; the five `*-hook-wired` rows keep their conditions and share the probe). Idea F-1 (`doctor --time`) is not taken.
3. **Timer binary.** The timer names the activated release's host read through `hostBinFromActivation` (confined), never tiers 1-3; control characters and `%` are refused in `projectRoot`, `bin` and `remote`.
4. **Retire `fgos preflight`** (decision 81 Q1): delete the arm, its registry entry (`src/cli/command-registry.mjs`, 4 mentions), its route (`packages/host-runtime/contracts/command-routes.json`, 2 mentions), `test/cli/fgos-preflight.test.mjs` (156 lines) and the verb's explanation page text (`docs/explanation/fgos-preflight-verb.md`: mark retired, link the script). The three checks stay as `scripts/check-decision-citation-drift.mjs`, `scripts/check-backlog-reconciliation.mjs` and `npm run build:skills`; one `package.json` script chains them for this repo. The route table drops from 82 to 81 selectors (P16 recounts). One CHANGELOG line. No change to `build:skills` or the citation script.
5. **Version info leaf.** `cli-version-visible` stops importing from `src/cli`: the module moves to its only remaining consumer's layer (a leaf under `src/setup/` if the `version` arm is gone, else `src/util/`; step 1 decides with `test/architecture.test.mjs`); the manifest guard exception from P04 is removed.
6. **Doctor shows, components judge (authority audit AU-07).** Three rows stop judging another component's state and call that component's answer, built by the fix phases: `identity-shared-directory` (`src/setup/identity-checks.mjs`) reads P17's identity directory judgement; `run-attempts-stuck` (`src/setup/run-supervisor-checks.mjs`) reads P19's adopt probe answer; `confinement-orphaned-resources-reaped` (`src/setup/registrations.mjs`) calls P22's confinement orphan judgement and removal (its `--fix` calls the same removal). Row ids, count and every warn/fail condition unchanged; the cases move to the component tests in those phases and doctor keeps one wiring proof per row.
7. **Active release (AU-02).** `resolveActiveReleaseForDoctor` and `doctorDriftActivation` (`registrations.mjs`) read the activation through P02's one reader (`resolveActiveHostBin`'s activation read); the doctor-only steps 3-5 survive only as the dev-door case `fgos:dev` names. Packaging P10's pin-drift row reads the same answer.

## Files

**Create:** none unless step 1 needs the moved version leaf as a new path (a `git mv`).

**Modify:** `src/setup/identity-checks.mjs`, `src/setup/run-supervisor-checks.mjs` (AU-07 rows), `src/setup/registrations.mjs` (`createDoctorRun` consumers, `:106`, `runDoctor`; board chain after packaging P02 and P01 rows), `src/setup/agent-hooks.mjs` (probe through `run.once`, three sites), `src/setup/agent-wiring.mjs`, the `claude-plugin-marketplace` row's file, `src/setup/mailbox-sync-timer.mjs` (MAIL told), the setup composition files (`rg -l "registerFix|registerConfigDefault" src/setup`), `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json`, `bin/fgos.mjs` (`:4022-4160`, `:4232-4271`, `:4317-4389`, `renderPretty` setup/doctor parts `:4721-4864`, `main()` wire-agents branches `:5316-5318`, `:5346`), `package.json` (one script), `docs/explanation/fgos-preflight-verb.md`, `docs/architecture-manifest.json` (remove the P04 exception), `packages/git/contracts/mutation-census.v1.json` (regenerate), `CHANGELOG.md` (preflight retired; timer refuses unsafe paths).

**Delete:** the preflight arm and entry and route; `test/cli/fgos-preflight.test.mjs`; the doctor loop and setup composition in the arms; timer tiers 1-3.

**Tests to retire:** `test/cli/fgos-preflight.test.mjs` (156 lines): the behaviour was removed from the product CLI; the checks it ran are owned by `test/skills/fgos-mirror.test.mjs` (mirror drift), `test/scripts/check-decision-citation-drift.test.mjs` (citations) and the script itself (backlog reconciliation). `test/cli/fgos-setup.test.mjs` and doctor wiring cases that assert decisions through a spawned CLI move to `test/setup/checks.test.mjs` / a `setupUseCase` unit; one wiring case per arm stays (P01's census lists them).

## Red tests first

- `test/setup/checks.test.mjs`: a doctor run with five hook rows spawns one shim probe per shim (a counter on the probe); today 14 identical.
- `test/setup/mailbox-sync-timer.test.mjs`: unit text with `%`, a newline or a control character in `projectRoot`, `bin` or `remote` is refused; a unit never names `<cwd>/bin/fgos.mjs`, `node_modules/.bin` or PATH.
- Claude plugin row: the three calls overlap (test double records start times).
- `fgos preflight` answers "unknown verb" (exit 4) through the host (replaces the old suite).

## Net size

bin about -160 (setup, doctor, init-adjacent -60, preflight -73, wire-agents -10, render -17); src +60 (use cases +90, timer -5, version leaf move 0, probe memo +25 -50 elsewhere); scripts 0; tests about -300 (preflight -156, spawned-CLI cases -140 after the census). Honest note: the arbitration's -90 case (Q1 b, keep the verb) no longer applies; the saving that depended on deleting `check-backlog-reconciliation.mjs` (-143) is not taken, because decision 81 keeps the script.

## Steps

1. Callers by `rg` of `isShimRunnable`, `resolveCliVersionInfo`, `resolveFgosBin`, `planAgentWiring`, `preflight` (code, docs, skills, hooks, CI) with `file:line`; confirm again that nothing but its test calls preflight.
2. Read the board chain on `registrations.mjs`; take the slot after packaging P02 and P01 rows, before packaging P10.
3. Red tests; use cases; probe memo; parallel calls; timer; preflight retirement; version leaf.
4. Doctor timing before/after on a quiet machine (the 12 s doctor target is Work's remaining gap, `delivered-not-on-trunk` 4.8 s, arbitration §2.3).
5. Message MAIL (timer file), DOC (explanation page), WORK (none: no Work file) before merge.

## Validation (focused)

FR `test/setup/checks.test.mjs test/setup/mailbox-sync-timer.test.mjs test/setup/agent-hooks*.test.mjs test/cli/fgos-setup.test.mjs test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/doctor*` plus the doctor `--json` row id list diff before/after (ids and count identical); `fgos preflight` smoke through the built host; land gate. Independent reviewer; CHANGELOG present.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `registrations.mjs` collides with packaging P01, P02, P10 and the doctor readiness plan | H x M | chain in the plan; board line; one function at a time; rebase on the landed predecessor, never on a branch |
| Packaging P02, P04 or P08 not landed when this phase is ready | M x M | skip that arm (named in the report) and open a follow-up commit when it lands; never edit its range first |
| A shim probe result is cached across the run when the shim is fixed mid-run by `--fix` | L x M | the memo is per run; `--fix` re-probes after a fix step (case in the test) |
| Someone scripts `fgos preflight` | L x L | none found by `git grep`; CHANGELOG line; the npm script exists for this repo |

## Rollback

Revert the merge commit; the verb returns. Doctor rows unchanged either way.

## Done when

Red then green; `rg -n "preflight" bin src packages/host-runtime/contracts` nothing; `fgos doctor --json` id list identical; the setup, doctor and wire-agents arms hold flags, one call, print; MAIL, DOC told.
