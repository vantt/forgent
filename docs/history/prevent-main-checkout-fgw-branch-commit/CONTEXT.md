---
type: explanation
title: Prevent committing on the main checkout while it sits on a fgw/* branch
tags: []
timestamp: 2026-08-03T09:13:00.000Z
source_capture_ids: [tsk-4hkd]
---

# Prevent committing on the main checkout while it sits on a fgw/* branch

## Feature boundary

`tsk-4hkd` is a retro item: the user twice ran `git checkout <fgw/branch>`
directly on the main checkout instead of claiming through `fgos pick`
(which stands up a dedicated linked worktree per item, ADR0020). This let
the main checkout's working tree pick up unrelated retro-loop items and
other people's code that happened to be staged/committed on that branch.
Damage was self-recovered (clean re-split into `fgw/retro-loop-docs-260802`
and `fgw/dispatch-terminology-rename-260803`, nothing lost) — this item's
job is prevention, not remediation.

Explicitly out of scope: a `docs/how-to/` write-up alone (a doc nobody
reads before making the mistake again) and a `fgos doctor` check alone (a
check nobody remembers to run) — both rejected by the user as insufficient
(see D1). The fix must be automatic and unavoidable at the moment of risk.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Deliverable is an automatic guard, not a doc or a doctor check: extend the existing `.githooks/pre-commit` hook (already wired via `core.hooksPath`, already guards main-checkout commits for the STR65 lock — `acquireMainCheckoutLock` call in `main()`) with one more refusal clause. Before allowing a commit: resolve `git rev-parse --git-dir` vs `git rev-parse --git-common-dir` for the checkout the hook is running in — equal means this IS the main checkout (a linked worktree's own copy of the same hook file resolves these to different paths, since `git worktree add` gives each worktree its own git-dir under `.git/worktrees/<name>`). If they're equal (main checkout) AND the current branch (`git symbolic-ref --short HEAD`, or detached-HEAD-safe equivalent) matches `^fgw/`, refuse the commit with a message pointing at `fgos pick <id>` and checking back out to the default branch. Linked worktrees are unaffected — they are supposed to live on a `fgw/*` branch; only the main checkout must never sit on one. |

## Scout evidence

- `.githooks/pre-commit` (repo root) — existing hook, Node script, already
  does exactly this kind of main-checkout-only enforcement for the STR65
  lock (`acquireMainCheckoutLock`/`HELD`/`AMBIGUOUS` branches). New guard
  is a second `refuse(...)` branch in the same `main()`, same file, same
  wiring — no new install/config surface (per AGENTS.md's install/setup/
  doctor gate: this doesn't add a config default, env var, or new
  dependency, so it does not need a new `fgos doctor` check or `fgos
  setup` merge entry).
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020) — a
  linked worktree never carries its own `.fgos/`; the one real store lives
  only in the main checkout. Confirms the invariant this guard enforces:
  main-checkout-only state, item work only in worktrees.
- `docs/how-to/run-a-state-verb-from-inside-a-worktree.md` — same
  main-checkout-vs-worktree distinction already documented for a different
  angle (running state verbs), reusing the identical
  `git rev-parse --path-format=absolute --git-common-dir | xargs dirname`
  resolution this guard's git-dir comparison is built on.
- No existing `fgos doctor` check (`src/setup/checks.mjs`) or
  `docs/how-to/*.md` entry covers "main checkout accidentally on a
  `fgw/*` branch" — confirmed via `rg` across `docs/` and
  `src/setup/checks.mjs`.
- `fgos tool query --capability impact-analysis --status present` →
  `full` (GitNexus registered and present). Per the project's
  impact-analysis capability gate, the MUST rules in AGENTS.md/CLAUDE.md
  apply as written for the executing stage: run `impact()` before editing
  `.githooks/pre-commit`'s `main()`, and `detect_changes()` before
  committing.

## Outstanding questions deferred to planning/executing

- None material — this is a single-file hook edit. Test coverage: the
  existing pre-commit hook already has an e2e test that copies the hook
  file into a disposable temp repo (per the hook's own header comment);
  the new guard should get a case added there, not a new test harness.
