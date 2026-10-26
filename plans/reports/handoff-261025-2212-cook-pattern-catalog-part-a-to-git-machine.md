---
title: "Handoff: COOK pattern catalog Part A moves to the Git machine"
description: "Where Part A stands after phases 01 and 02, why phase 03 is stuck at the Git commit door on fg-server, and how a new COOK session continues on fg-server2."
---

# Handoff: COOK, pattern catalog Part A

The owner closed the COOK session on fg-server on 2026-10-25 at 22:12. The work moves to the machine where the lanes that manage Git run, which is **fg-server2** (HARDEN `claude-p74h`, and earlier GIT/OPC). The owner calls you "anh". Write to the owner in Vietnamese and write reports and commits in English.

## Paste-ready prompt for the new session

> You are COOK, the lead of lane COOK (`lead:COOK`), now on fg-server2. Read `plans/reports/handoff-261025-2212-cook-pattern-catalog-part-a-to-git-machine.md` on main in full, then the plan `plans/261024-2008-pattern-catalog-part-a/plan.md`, then the notebook `plans/reports/cook-notebook-261025-0918-pattern-catalog-part-a.md`. Claim the role with `fgos identity session --role lead:COOK </dev/null`. Then do the first actions listed in the handoff. Work with HARDEN (and whoever holds the Git code) directly on this machine to fix the two Git commit-door defects first. Follow AGENTS.md and the rules in the handoff.

## Where the work is

- **Plan:** `plans/261024-2008-pattern-catalog-part-a/` (12 phases). The owner approved the spec on 10-24 18:09. U1 means Branch A only, and U6 is the unset path. U8 = b means you must stop and ask the owner before landing phase 12.
- **Branch:** `cook/pattern-catalog-part-a` on origin, tip `11fb662f6`.

  | Commit | Content |
  |---|---|
  | `2973f9177` | Phase 01: loop engines and their tests moved to `src/runner/execution/loops/`, import paths only |
  | `ec07e53a0` | Merge of main after MAIL landed (census regenerated) |
  | `8b0e37ff9`, `88f4f0941` | Phase 02: `activityUnitOf` export in `src/workflow/case-admission-port.mjs`, plus reviewer findings F1 and F2 fixed |
  | `11fb662f6` | Merge of main at `d580c1416` (census regenerated, 0 undeclared sites) |

- **Verification done on fg-server:**
  - Phase 01: verify 52/0.
  - Phase 02: `node scripts/run-tests.mjs test/workflow/case-admission-port.test.mjs` 13/0.
  - Full `npm test` at `ec07e53a0`: 19 red, none from COOK. 17 are known reds. `skill-wrappers` is also red on clean main. `citation-drift` is red only because the scanner reads the git-ignored `ak-*` skill dirs that `worktree create` provisions.
  - `cargo test --workspace`: 1 red, `nested_pidns_recipient_is_killed_at_release`, which passes alone twice and is a load flake.
- **Phase 03 slice 3a** (schema, standard, fixtures, Rust golden): **not committed.** The best take is saved as `plans/261024-2008-pattern-catalog-part-a/reports/phase-03a-take2-uncommitted.patch`, covering 6 files including the census. `cargo test -p fgos-config` passed 95/0 on fg-server. No reviewer has read it, and nobody has compared it against spec 5.4.
- **Deferred items:**
  - Phase 02's F3: the playbook shape `{step, units}` is re-encoded in `case-admission-port.mjs:65` instead of shared with `guide-schema.mjs:165`. Fold it into phase 08.
  - Observation: `caseId` is joined into a path unchecked. This is pre-existing and should be a separate item.
  - Observation: the returned `pattern` is untrimmed while `unit.mjs:262-267` trims. This matters for phases 06 and 08.

## Why phase 03 is stuck (fix this first, with the Git owner)

1. **ScopedCommit masks a refused commit when HEAD is a merge** (board `3f032fbdd`).
   - After the commit attempt, `scoped_commit.rs` parses `git show --raw -z … HEAD` with `split_observation`, and it does this before it checks `observed == baseline.head`.
   - On a merge HEAD, git prints the combined-diff shape, so the parser fails `commit-header-invalid`. The real `CommitRejected` cause (the pre-commit hook) is lost, and the WAL chain stays pending.
2. **That pending chain then blocks every later scoped commit on the branch.**
   - Operation `2443e5e5-0287-47b1-8cc4-d28cd47425a6` in fg-server's WAL causes `resource-recovery-required` (`refs.rs:156`).
   - `fgos doctor --fix` (`git-land-recovery`) recovers only Land operations.
   - `recover_scoped_commit` exists, through the node-addon `recover`/`reconcile`, but COOK found no CLI door that calls it for a pending ScopedCommit.
   - This WAL is on fg-server. A fresh worktree on fg-server2 has its own WAL, so the block does not follow you. It still needs a recovery on fg-server, and a door for that is a Git decision.
3. **Lesson:** until defect 1 is fixed, merging main into the case branch makes the next refused commit hang again. Either keep the hook happy before dispatch (writes must include the census when a Rust or other census site changes), or wait for the fix.

## Seat lessons from this case (all on the board for HARDEN)

| Problem | What happened | Status |
|---|---|---|
| deepseek reviewer seats | Hit 402 twice on OpenRouter v4-pro, and stalled twice on thehive v4.1-flash (counters frozen, ended only by the 35-minute executor timeout); see [evidence](evidence-261025-2126-cook-reviewer-seat-stalls.md) | The owner chose to move reviewers off deepseek: `runner.capabilities["code:*"].roles.reviewer.prefer: [xai, openai]` in `.fgos/config.yaml` (`d580c1416`). Unset it when pi seats report a stall themselves. That binding is **not yet seen in a run**, so confirm it in the first reviewer's `dispatch-plan.json` |
| claude seats | Read-only claude seats write no outbox | Never prefer claude for checkers |
| `fgos run --resume` | Keeps the old seat binding after a config change, and replays an already-settled run without relaunching | After a config change or a settled failure, use a fresh dispatch |
| No-change producer | A producer that changes nothing ended the round unreviewed | HARDEN fixed this (R11 a, `reviewed.mjs`) |
| Checker seats run plain `node --test` | Those runs fail `git-addon-unavailable` | Brief every reviewer that these are sandbox limits, to run its verify once, and to report within 15 minutes; `node scripts/run-tests.mjs` is the right runner |
| `foreground-not-agent` | Killed one producer at launch | A fresh dispatch launched fine. Never bypass the gate |
| Producer | gemini `gemini-3.8-flash-high` (omp) passed every time | — |
| Red-team | xai `grok-4.5` passed every time | — |

## The case on fg-server

- caseId `wf-run-1792894823697-d06fe2f7` (guide `coding/feature`).
- Milestones achieved: `request-received`, `decisions-locked`, `plan-validated`. `child-verified` was never reached: no reviewed pass receipt exists for any phase.
- Frame left: about 20 of 30 dispatches and 15 of 22 mutating dispatches.
- The case ledger lives on fg-server, so a session on fg-server2 opens **a new case** for the remaining phases. Ask the owner to approve the new frame. Close the old case only on the owner's word: `fgos workflow close wf-run-1792894823697-d06fe2f7` on fg-server.

## First actions on fg-server2

1. Pull main, then `fgos worktree create <path> --branch cook/pattern-catalog-part-a` from the origin branch (or fetch and check out the branch in a linked worktree).
2. With the Git owner: fix defect 1, and decide the recovery door for a pending ScopedCommit (defect 2). Then recover operation `2443e5e5…` on fg-server, or ask the owner to let it be abandoned there.
3. Merge main into the branch and regenerate the census (`node scripts/git-one-door-scan.mjs --write-census`).
4. Open the new case and dispatch phase 03 again. Either use 3a's patch as the reference the reviewer compares against, or let the producer redo it. Writes must include the census.
5. Phases 04–12 follow the plan's order. Phase 03 has to be reviewed against spec 5.4, and the next `lead:CFG` holder reviews the config mechanism before landing. SEAT and CFG closed tonight, so the key names follow the plan as written.

## Rules that stay in force

- Use `/usr/bin/git`. Run every `fgos …` with `</dev/null`.
- In a shared main checkout: never check out branches, commit only by pathspec, and write the board through a detached worktree from origin/main.
- Change config only through `fgos config set|unset … --reason`. Do not print secrets. Do not touch ak, ck, rtk, `~/.claude/rules` or the shell rc files.
- Code goes through cook dispatches or Sonnet agents in a worktree, followed by independent verification: the full suite with `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` and `FGOS_SESSION_ID` unset, each red file run alone, and `cargo test --workspace --no-fail-fast`, run sequentially with `-j 4`.
- Do not land on main without the owner. Every decision gets a reversal condition, and every report to the owner gets one line at the top of the board `log.md`.

## Not carried over

- The ref `refs/cook/phase01-first-move` (old phase 01 commit, identical tree to `2973f9177`) exists only on fg-server and is not needed.
- `.fgos/runtime/tmp/cook-part-a/` on fg-server holds the raw run outputs. The notebook quotes what matters.
