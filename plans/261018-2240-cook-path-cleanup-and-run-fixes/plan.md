---
title: "COOK P1 (cut) + P3: clean stale facts, rename the old cook to deliver, fix the run path for cook"
status: completed
priority: P1
created: 2026-10-18
source: plans/reports/roadmap-261016-2212-fgos-cook-and-git-component.md (P1, P3)
board: plans/261017-1313-fgos-platform-program-board/plan.md (row COOK)
---

# COOK P1 (cut) + P3

Owner decisions of 2026-10-18 (board row COOK, log 22:20): P1 is cut to factual cleanups only; the rewrite of the coordination doctrine waits for the AGENT-WF spec. P3 runs as written, plus one rule: rigor high/critical requires every seat on a distinct model family. Every change follows RUL104 (tốt hơn, không to hơn) in `AGENTS.md`.

## Phases

| Phase | Scope | Status |
|---|---|---|
| [P1](phase-01-stale-facts-and-deliver-rename.md) | Stale facts, `/fgOS:cook` → `/fgOS:deliver` | done |
| [P3](phase-02-run-path-fixes-for-cook.md) | `verify` on Unit, verify runner with timeout, no pinned `npm test`, one-liner `--input`/`--verify`, `docs:write`, skills at flow level for `bind()`, distinct families at high/critical | done |

## Acceptance

- Every test that imports a touched module passes; full `npm test` run on the branch with known-unrelated failures named.
- No reference to `/fgOS:cook` meaning the old skill remains outside history/archive/plans.
- P3 behavior has matching tests; spec (`docs/specs/runner.md` or the area spec that owns Unit) states the new facts; `CHANGELOG.md` `[Unreleased]` lines for user-visible changes.

## Out of scope

Rewriting `core/skills/_shared/coordination-driver.md` doctrine (waits for AGENT-WF spec), `fgos-cook` itself (P5), model/tier config lists (owner picks later).
