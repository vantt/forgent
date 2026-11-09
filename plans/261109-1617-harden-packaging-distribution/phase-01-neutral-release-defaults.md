---
phase: 01
title: "Neutral release defaults: route only to agent CLIs detected on the machine, owner routing moves to the global config, a clear error when none is detected"
status: pending
depends_on: ["in-flight (2) landed (for the two doctor-row edits only)", "T8-P11 landed (registrations.mjs)", "owner guide written first"]
parallel: "group G2; YAML, bind filter, run error and guide start now; the two registrations.mjs rows wait their chain turn (after P02)"
effort: ~1.5d
net_size: "YAML about -50 to -150 / Node about +60 / Rust 0 / tests about +60 (estimate)"
---

# Phase 01 - Decision 80 Q1 (a)

## Context

Audit F2 (UX-10, ONB-08, ONB-14). On a clean HOME, `fgos dispatch explain --for execute` picks gemini through `omp-cli-bwrap` (`core/config-standard/runner.yaml:173-226`; executors `claude :13`, `glm :53`, `openai :83`, `gemini :173`, `xai :228`, `deepseek :283`; capability `prefer` chains from `:343`). The `gemini` and `omp` executors carry `supports.skills: ["ak:cook"]` (a kit name; decision 79 Q5 says fgOS names no kit) and the `z-ai.*@thehive/openrouter` pools. Doctor rows `executor-skills-installed` (`registrations.mjs:1075`, `model-pool-checks.mjs:60-84`) and `confined-pane-accounts` (`registrations.mjs:2525`) then fail, and `fgos run` exits 11 with the cause only in `stderr.log` (`src/state/store.mjs:77`; envelope text from `src/workflow/runner.mjs:274`).

Reused: `findExecutableOnPath` (`src/runner/paths.mjs:150`) and the host-table lookup that in-flight item (2) adds. No sixth PATH search. Prior art checked: the standard itself records that the owner chose omp on 2026-10-16 (`runner.yaml:175`); this phase moves that owner choice out of the shipped file.

## Requirements

1. **Guide first (gates landing).** A Vietnamese guide (name via `fgos convention path --type guide --slug owner-machine-packaging-routing`): the exact YAML that goes into the owner's global config on each owner machine (pools, skill claims, `prefer` toward omp/gemini), the command that confirms routing is unchanged (`fgos dispatch explain --for execute` and `--for review`, before and after, diff pasted), and the revert. No release carrying this change is activated on any machine before the owner has the guide.
2. **Neutral standard.** Remove from `runner.yaml` the skill claims that name a kit and the owner pool and account declarations. Executors stay declared; `prefer` chains list every supported CLI and the filter in 3 decides which count. Step 1 confirms the global file can add `supports.skills` and pools (`x-fgos-merge` semantics, T8 Q6); if a key is tighten-only, the guide defines a second executor instead.
3. **Eligibility filter.** One place turns `prefer` into a binding (`src/runner/execution/bind.mjs` `[UNVERIFIED]`; step 1 finds it). An invocation is eligible only when its `command` resolves on PATH. The filter lives there, not at call sites.
4. **No-agent error.** With no eligible executor `fgos run` returns an envelope `error {code: "agent-cli-missing", why, fix}`; `fix` names the supported CLIs and says to run `fgos doctor` after installing one. No new exit code: step 1 picks the existing outcome whose mapping fits (`not-started` is in `INFRASTRUCTURE_OUTCOMES`, `src/workflow/store.mjs:262`, but has no entry in `OUTCOME_EXIT_CODES`, so confirm what it exits as).
5. **Doctor rows.** `executor-skills-installed` and `confined-pane-accounts` report `skip` for an executor whose CLI is not detected. Row ids and count unchanged.
6. **Language.** The five Vietnamese `@fgos:doc` tier lines (`runner.yaml:705-709`, shown by `config explain` and `dispatch explain`) become English.
7. AGENTS.md install gate: no new env var or default; a CHANGELOG line (users see a different default).

## Files

**Create:** the guide.
**Modify:** `core/config-standard/runner.yaml`; the bind owner (step 1) and the `fgos run` error path; `src/setup/model-pool-checks.mjs` and `src/setup/registrations.mjs` (`confined-pane-accounts` only), both after P02; the tests below; `CHANGELOG.md`.
**Delete:** owner pool, account and kit-skill declarations in the standard.
**Tests to retire:** any case that asserts the standard's `ak:cook` claim or a thehive pool; the standard-shape test below owns that behaviour (step 1 names the retired cases).

## Red tests first

- Bind owner test: scratch `PATH` with no agent CLI -> bind refuses with `agent-cli-missing`; only `claude` -> execute binds claude; only `omp` -> execute binds gemini via omp. Why new: no existing test varies PATH.
- Standard-shape test (the existing config-standard test; step 1 names the file): no `ak:` string and no `thehive` in the shipped standard.
- `test/setup/model-pool-checks.test.mjs`: an undetected CLI gives `skip`, not `fail`.

## Net size

YAML about -50 to -150; Node about +60 (filter 30, error 30); tests about +60.

## Steps

1. Facts: find the bind owner; list `x-fgos-merge` of the keys that move; read (read-only) the owner machines' current global config so the guide is exact.
2. Guide. 3. Red tests, filter, error, YAML. 4. The two rows, after P02 lands. 5. `dispatch explain` diff on a copy of the owner's config; scratch-HOME run.

## Validation

FR the three test files plus `test/architecture.test.mjs`; `fgos dispatch explain --for execute` in scratch HOME with and without a stub `claude` on PATH; `fgos doctor --json` row id list identical before and after (paste).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Owner routing silently changes when the release activates | Med x High | guide first; explain diff before activation; the guide carries the revert |
| A stub CLI on PATH is not a real login, so bind picks a CLI that cannot run | Med x Low | eligibility is presence only; a broken login stays a runtime error with its own fix (out of scope) |
| `x-fgos-merge` forbids the global file from adding what moved | Low x High | step 1 checks before any edit |

## Rollback

Revert the merge; the owner's global block (guide) duplicates what the old standard declared and merges idempotently (step 1 proves it).

## Closes

UX-10, ONB-14 (run error), ONB-08 (with P06, P07); ONB-16 partial (the Vietnamese lines).
