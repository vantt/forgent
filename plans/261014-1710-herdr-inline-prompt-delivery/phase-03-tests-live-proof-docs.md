---
phase: 3
title: "Phase 3: tests-live-proof-docs"
status: todo
priority: P1
effort: "1.5h"
dependencies: [1, 2]
---

# Phase 3: Unit/Snapshot Tests, 5-CLI Live Proof & Docs Sync

## Overview

Update unit and baseline snapshot tests to reflect `'inline'` as the default `promptDelivery` while explicitly testing both `'inline'` and `'file-pointer'` modes (including paste-chip `Enter` resends and `SHELL_MANAGED_ENV` stripping), run live end-to-end verification across all 5 CLIs (`claude`, `codex`, `agy`, `pi`, `omp`) with complex multi-line prompts, and update `docs/specs/runner.md` and `CHANGELOG.md`.

## Requirements

- [x] Update `test/runner/herdr-spawn-adapter.test.mjs` to test both the `'inline'` default and explicit `'file-pointer'` mode, plus unit tests for `confirmBriefSubmitted` paste-chip detection (`[paste #1 +45 lines]`, `[Pasted text #1 +45 lines]`, `Pasted 105 lines`) and historical screen non-matching.
- [x] Update `test/runner/dispatch-policy-baseline-snapshot.test.mjs` line 101 and the 9 existing `herdr-spawn` rows to reflect the `'inline'` default.
- [x] Run live `bwrap` Herdr pane verification across `claude`, `codex`, `agy`, `pi`, and `omp` in both `'inline'` and `'file-pointer'` modes with a complex multi-line prompt.
- [x] Update `docs/specs/runner.md` and `CHANGELOG.md` (`## [Unreleased]`).

## Related Code Files

- Modify: `test/runner/herdr-spawn-adapter.test.mjs`
- Modify: `test/runner/dispatch-policy-baseline-snapshot.test.mjs`
- Modify: `docs/specs/runner.md`
- Modify: `CHANGELOG.md`

## Implementation Steps

1. Update `test/runner/herdr-spawn-adapter.test.mjs` (`test('the prompt travels as a file...')` at line 256 and `test('inline delivery...')` at line 757) to assert that `'inline'` is the default delivery and `'file-pointer'` sends the single-line pointer when declared via `promptDelivery: 'file-pointer'` or `FGOS_HERDR_PROMPT_DELIVERY=file-pointer`.
2. Add unit tests in `test/runner/herdr-spawn-adapter.test.mjs` for `isDraftStillInComposer` / `confirmBriefSubmitted` paste-chip detection (`[paste #1 +45 lines]`, `[Pasted text #1 +45 lines]`, `Pasted 105 lines`), historical screen rejection, and `SHELL_MANAGED_ENV` (`TERM`, `HERDR_PANE_ID`) exclusion.
3. Update `test/runner/dispatch-policy-baseline-snapshot.test.mjs` line 101 and the 9 existing `herdr-spawn` rows (`335, 360, 385, 497, 528, 559, 590, 621, 652`) from `'file-pointer'` to `'inline'`.
4. Run targeted and related test suites (`node --test test/runner/herdr-*.test.mjs test/runner/dispatch-*.test.mjs test/runner/execution/run-herdr.test.mjs`).
5. Execute live `bwrap` Herdr pane verification across `claude`, `codex`, `agy`, `pi`, and `omp` for both `'inline'` and `'file-pointer'` modes with a complex multi-line prompt.
6. Update `docs/specs/runner.md` and `CHANGELOG.md`.

## Todo

- [x] Update `test/runner/herdr-spawn-adapter.test.mjs` and add paste-chip + env hygiene tests
- [x] Update `test/runner/dispatch-policy-baseline-snapshot.test.mjs` (line 101 + 9 `herdr-spawn` rows)
- [x] Run test suites and live 5-CLI verification (`inline` & `file-pointer`)
- [x] Update `docs/specs/runner.md` and `CHANGELOG.md`

## Success Criteria

- [x] All dispatch, herdr, and baseline snapshot tests pass (`0` failures).
- [x] All 5 CLIs (`claude`, `codex`, `agy`, `pi`, `omp`) pass live verification with complex multi-line prompts under `bwrap`.
- [x] `CHANGELOG.md` and `docs/specs/runner.md` document the `'inline'` default, paste-chip confirmation, pane terminal/profile env hygiene, and `omp-herdr-vantt`.
