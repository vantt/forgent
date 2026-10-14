---
phase: 1
title: "Phase 1: Inline Default, Paste-Chip Submit & Env Hygiene"
status: todo
priority: P1
effort: "1.5h"
dependencies: []
---

# Phase 1: Inline Default, Paste-Chip Submit & Env Hygiene

## Overview

Flip `herdr-spawn`'s default `promptDelivery` from `'file-pointer'` to `'inline'` while keeping `'file-pointer'` as an explicit first-class mode, upgrade `confirmBriefSubmitted` and `readAgentState` to handle TUI paste chips and visible-screen working states across all 5 agent CLIs, and prevent caller subprocess environment variables (`TERM=dumb`, `HERDR_PANE_ID`, `OMPCODE`, `OMP_PROFILE`, `PI_PROFILE`, `PI_CONFIG_FILES`) from clobbering the Herdr worker pane's terminal and profile state.

## Requirements

- [x] Default `promptDelivery` in `herdrSpawnInteractiveAdapter` (`transport.mjs`) and `briefMessage` (`herdr-round.mjs`) to `'inline'`, with override support via `opts.promptDelivery` and `process.env.FGOS_HERDR_PROMPT_DELIVERY`.
- [x] Render `- Brief file on disk (re-read after compaction or restart): ${p.briefPath}` unconditionally right under `# Brief ${round}` in `renderBrief` (`brief.mjs`).
- [x] Upgrade `confirmBriefSubmitted` (`herdr-round.mjs`) to detect collapsed paste chips (`[paste #\d+...]`, `[Pasted text #\d+...]`, `[Paste]`, `#\d+ … +\d+ lines`, `Pasted \d+ lines`) and head/tail prompt text in `seen.promptText` or the bottom 6 non-empty composer lines of `agentRead(target, { source: 'visible', lines: 20 })` while `seen.state === 'idle'`.
- [x] Upgrade `readAgentState` (`herdr-round.mjs`) to check the visible screen tail for OMP/Pi working spinners (`⎋ Working…` or `── [⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏] Working`) when `agentGet` returns `unknown` and `agentExplain` has no matched rule.
- [x] Strip parent session overrides (`OMPCODE`, `OMP_PROFILE`, `PI_PROFILE`, `PI_CONFIG_FILES`) in `workerBaseEnv` (`adapters.mjs`) and exclude pane-owned terminal variables (`TERM`, `COLORTERM`, `TERM_PROGRAM`, `TERM_PROGRAM_VERSION`, `HERDR_PANE_ID`, `HERDR_TAB_ID`, `HERDR_WORKSPACE_ID`) from `buildLauncherScriptContent` (`SHELL_MANAGED_ENV` in `herdr-round.mjs`).

## Related Code Files

- Modify: `src/runner/dispatch/adapters.mjs`
- Modify: `src/runner/dispatch/transport.mjs`
- Modify: `src/runner/dispatch/brief.mjs`
- Modify: `src/runner/dispatch/herdr-round.mjs`

## Implementation Steps

1. In `src/runner/dispatch/adapters.mjs` (`workerBaseEnv`), strip `OMPCODE`, `OMP_PROFILE`, `PI_PROFILE`, and `PI_CONFIG_FILES` alongside `FGOS_RUST_HOST_RECURSION_GUARD`.
2. In `src/runner/dispatch/herdr-round.mjs` (`SHELL_MANAGED_ENV`), add `'TERM'`, `'COLORTERM'`, `'TERM_PROGRAM'`, `'TERM_PROGRAM_VERSION'`, `'HERDR_PANE_ID'`, `'HERDR_TAB_ID'`, and `'HERDR_WORKSPACE_ID'` and document why pane terminal/session variables belong to the target pane rather than the caller's ambient process.
3. In `src/runner/dispatch/transport.mjs` (`herdrSpawnInteractiveAdapter`), resolve `delivery` as `opts.promptDelivery ?? process.env.FGOS_HERDR_PROMPT_DELIVERY?.trim() ?? promptDelivery ?? 'inline'`.
4. In `src/runner/dispatch/brief.mjs` (`renderBrief`), render `- Brief file on disk (re-read after compaction or restart): ${p.briefPath}` unconditionally under `# Brief ${round}`.
5. In `src/runner/dispatch/herdr-round.mjs`, update `briefMessage`, `readAgentState`, and `confirmBriefSubmitted` (`isDraftStillInComposer` scoped to `seen.promptText` and bottom 6 non-empty lines of `visibleScreen` when `seen.state === 'idle'`).

## Todo

- [x] Update `workerBaseEnv` in `src/runner/dispatch/adapters.mjs`
- [x] Update `SHELL_MANAGED_ENV`, `briefMessage`, `readAgentState`, and `confirmBriefSubmitted` in `src/runner/dispatch/herdr-round.mjs`
- [x] Update `herdrSpawnInteractiveAdapter` default `delivery` in `src/runner/dispatch/transport.mjs`
- [x] Add unconditional on-disk brief recovery path to `renderBrief` in `src/runner/dispatch/brief.mjs`

## Success Criteria

- [x] `briefMessage` returns `briefText` when `delivery` is `'inline'` (or omitted) and `renderPointer` when `delivery` is `'file-pointer'`.
- [x] `confirmBriefSubmitted` presses `Enter` when `seen.state === 'idle'` and the composer holds a paste chip (`[Pasted text #1 +45 lines]`, `[paste #1 +45 lines]`, `[Paste]`, `#1 … +45 lines`, `Pasted 105 lines`), without false-positiving on historical screen text.
- [x] `buildLauncherScriptContent` does not emit `export TERM=dumb` or `export HERDR_PANE_ID=...`, and `verifyProcessEnvironment` skips `SHELL_MANAGED_ENV` keys consistently.
