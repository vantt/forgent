---
title: "herdr-inline-prompt-delivery"
description: "Support both inline (default) and file-pointer prompt delivery modes in herdr-spawn across claude, codex, agy, pi, and omp under bwrap confinement."
status: completed
priority: P1
effort: "4h"
tags: [herdr-spawn, dispatch, bwrap, inline, file-pointer]
created: 2026-10-14
---

# herdr-inline-prompt-delivery

## Overview

Enable dual-mode prompt delivery in `herdr-spawn` (`inline` and `file-pointer`), flipping the default to `inline` so a human watching a Herdr pane sees the full multi-line prompt directly in the TUI conversation while keeping `brief-<round>.md` on disk for audit and compaction recovery. Fix the four root causes uncovered in live pre-implementation testing across `claude`, `codex`, `agy` (`ay`), `pi`, and `omp` under `bwrap` confinement:

1. **TUI Paste-Chip Submission (`confirmBriefSubmitted`):** `claude`, `agy`, `pi`, and `omp` fold multi-line bracketed pastes (`>10` lines or `>1,000` chars) into paste chips (`[Pasted text #1 +N lines]`, `[paste #1 +N lines]`, `[Paste]`, `#1 … +N lines`, `Pasted N lines`) in the composer box before expanding them into the transcript upon `Enter`. `confirmBriefSubmitted` previously only matched the literal last 48 chars of `message` (`squash(message).slice(-48)`), missing paste chips and exiting after 3 polls without sending `Enter`.
2. **Pane Terminal & Caller Session Env Hygiene (`SHELL_MANAGED_ENV` & `workerBaseEnv`):** When a non-interactive caller subprocess (`TERM=dumb`) or an active `omp`/`claude` session (`OMPCODE=1`, `OMP_PROFILE`, `PI_PROFILE`, `PI_CONFIG_FILES`, `HERDR_PANE_ID`) spawns a confined `bwrap` pane, `launcher.sh` previously exported `TERM=dumb` (causing `codex` to block on `WARNING: TERM is set to "dumb". Continue anyway? [y/N]:`), overwrote the worker pane's `HERDR_PANE_ID`, and caused child `omp` workers to ignore `PI_CODING_AGENT_DIR` (`private-home`) and disable `herdr-omp-agent-state.ts`.
3. **OMP 100-Line Paste Modal Menu & Working-State Fallback:** At `>= 100` lines (`paste.largeMenuThreshold = 100`), `omp` opens a modal menu that swallows the trailing `Enter` of `herdr agent prompt`. Setting `paste:\n  largeMenuThreshold: 0` in the `xai-vantt` profile's `config.yml` (copied into `private-home` by `bwrap.mjs`'s existing `home-files` mechanism without provider-specific branching in `bwrap.mjs`, preserving Spec R4) and adding a visible-screen working-spinner fallback in `readAgentState` (`herdr-round.mjs`) solves both normal and `blind: true` confined runs.
4. **Restore `omp-herdr-vantt` Invocation (`executors.xai`):** Add the confined `omp-herdr-vantt` invocation under `runner.executors.xai.invocations` in `.fgos/config.json`.

## Prior Art & Evidence

- **Reused:**
  - `PROMPT_DELIVERIES = ['file-pointer', 'inline']` (`src/runner/dispatch/config.mjs:883`), introduced in `deea8e8df` / `70d003ac2` (2026-09-07).
  - `briefMessage({ delivery, briefText, runDir, roundNumber })` (`src/runner/dispatch/herdr-round.mjs:830`).
  - `awaitPromptReady` & `confirmBriefSubmitted` (`src/runner/dispatch/herdr-round.mjs:964-1075`), introduced in `f635ad235` (2026-10-02).
  - `copyHomeFiles` / `provisionSelectedCredential` (`src/runner/dispatch/confinement/drivers/bwrap.mjs:36-72`).
- **What was missing:**
  - Paste-chip and bottom-composer visible-screen detection in `confirmBriefSubmitted` (adapted from `thieung/herdr-cook-plan` `references/dispatch.md` § *Confirm the prompt was submitted*).
  - Stripping caller-session/terminal vars (`TERM`, `COLORTERM`, `TERM_PROGRAM`, `TERM_PROGRAM_VERSION`, `HERDR_PANE_ID`, `HERDR_TAB_ID`, `HERDR_WORKSPACE_ID`, `OMPCODE`, `OMP_PROFILE`, `PI_PROFILE`, `PI_CONFIG_FILES`) so the worker pane keeps its own terminal identity and `private-home` profile.
  - `paste.largeMenuThreshold: 0` in `xai-vantt` `config.yml` + visible-screen working fallback in `readAgentState` (adapted from `thieung/herdr-cook-plan` `references/omp.md`).
- **Research report:** `plans/reports/research-261014-2255-herdr-spawn-verbose-prompt-injection.md`.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Support both `inline` (new default) and `file-pointer` in `herdr-spawn` with runtime/env override (`FGOS_HERDR_PROMPT_DELIVERY`). | P1 |
| 2 | Upgrade `confirmBriefSubmitted` and `SHELL_MANAGED_ENV`/`workerBaseEnv` so complex multi-line prompts submit reliably under `bwrap`. | P1 |
| 3 | Add `omp-herdr-vantt` (`executors.xai`), configure `paste.largeMenuThreshold: 0` in profile `config.yml`, and add `omp` visible-working fallback in `readAgentState`. | P1 |
| 4 | Prove both `inline` and `file-pointer` modes across `claude`, `codex`, `agy`, `pi`, and `omp` with unit tests and live `bwrap` runs. | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Inline Default, Paste-Chip Submit & Env Hygiene](./phase-01-start.md) | Completed |
| 2 | [Phase 2: OMP Confined Herdr Invocation & Profile Config](./phase-02-omp-herdr-bwrap.md) | Completed |
| 3 | [Phase 3: Unit/Snapshot Tests, 5-CLI Live Proof & Docs Sync](./phase-03-tests-live-proof-docs.md) | Completed |

## Success Criteria

- [x] `promptDelivery` defaults to `'inline'` for `herdr-spawn`, while `'file-pointer'` remains fully supported via config, `opts.promptDelivery`, or `FGOS_HERDR_PROMPT_DELIVERY=file-pointer`.
- [x] `brief-1.md` continues to be written to disk in both modes, and `renderBrief` unconditionally includes the on-disk brief path under `# Brief <round>`.
- [x] `confirmBriefSubmitted` detects TUI paste chips (`[paste #...]`, `[Pasted text #...]`, `[Paste]`, `#1 … +N lines`, `Pasted N lines`) in `seen.promptText` and the bottom composer lines of `agentRead(..., { source: 'visible' })` while `seen.state === 'idle'`.
- [x] Confined `bwrap` launches preserve the Herdr pane's own `TERM`/`HERDR_PANE_ID` and do not leak parent `OMPCODE`/`OMP_PROFILE`/`PI_PROFILE` into child workers.
- [x] All unit/integration tests and baseline snapshots pass, and live `bwrap` verification succeeds for `claude`, `codex`, `agy`, `pi`, and `omp`.

## Red Team Review

| # | Severity | Finding | Evidence | Disposition |
|---|---|---|---|---|
| RT-1 | Critical | Seeding `config.yml` / `extensions/herdr-omp-agent-state.ts` inside `bwrap.mjs` violates Spec R4 (no provider branching in `bwrap.mjs`) and breaks `copyHomeFiles` allow-list test. | `src/runner/dispatch/confinement/drivers/bwrap.mjs:8-9,518`, `test/runner/dispatch-confinement-backend-p03.test.mjs:663-667` | **Accepted:** Keep `bwrap.mjs` 100% untouched. Set `paste.largeMenuThreshold: 0` in `~/.omp/profiles/xai-vantt/agent/config.yml` (already in `credentialSource.files`) and add visible-screen working detection in `herdr-round.mjs` (`readAgentState`). |
| RT-2 | Critical | Checking all 25 lines of `visibleScreen` in `isDraftStillInComposer` can match a historical paste chip after turn start, sending unwanted mid-turn `Enter` keys; removing `if (seen.state === null) break` breaks `fake-herdr-pane.mjs`. | `src/runner/dispatch/herdr-round.mjs:1041-1065`, `test/helpers/fake-herdr-pane.mjs:151` | **Accepted:** Keep `if (seen.state === null) break;` (real `omp` returns `state: 'idle'` via `default_known_agent_idle_fallback`, while `fake-herdr-pane` returns `null`), require `seen.state === 'idle'`, and restrict `visibleScreen` paste-chip fallback to the bottom 6 non-empty composer lines. |
| RT-3 | High | Placing the on-disk brief recovery line inside `contractSection` omits it when `effectiveContract` is null. | `src/runner/dispatch/brief.mjs:57-64` | **Accepted:** Render `- Brief file on disk (re-read after compaction or restart): ${p.briefPath}` unconditionally right under `# Brief ${round}`. |
| RT-4 | High | `xai` is not in `CANONICAL_EXECUTOR_DESCRIPTORS` of `dispatch-policy-baseline-snapshot.test.mjs`; only the 9 existing `herdr-spawn` rows flip from `'file-pointer'` to `'inline'`. | `test/runner/dispatch-policy-baseline-snapshot.test.mjs:101,120-135` | **Accepted:** Update only line 101 and the 9 existing `herdr-spawn` rows in `dispatch-policy-baseline-snapshot.test.mjs`. |
| RT-5 | Medium | Under `blind: true`, `bwrap` masks `~/.config/herdr`, so `herdr-omp-agent-state.ts` cannot reach `$HERDR_SOCKET_PATH`. | `src/runner/dispatch/confinement/drivers/bwrap.mjs:513`, `herdr-round.mjs:909` | **Accepted:** In `readAgentState` (`herdr-round.mjs`), when `agentGet` and `agentExplain` return `unknown` or fallback `idle` without a matched rule, check the visible screen tail for OMP/Pi working spinners (`⎋ Working…` / `── [⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏] Working`). |

### Whole-Plan Consistency Sweep

- Reconciled `plan.md`, `phase-01-start.md`, `phase-02-omp-herdr-bwrap.md`, and `phase-03-tests-live-proof-docs.md`: removed `bwrap.mjs` modifications from Phase 2, scoped `isDraftStillInComposer` to bottom composer lines with `seen.state === 'idle'` in Phase 1, placed the brief recovery path unconditionally under `# Brief ${round}` in Phase 1, and aligned snapshot updates in Phase 3. Zero unresolved contradictions remain.

<!-- slug: herdr-inline-prompt-delivery -->
