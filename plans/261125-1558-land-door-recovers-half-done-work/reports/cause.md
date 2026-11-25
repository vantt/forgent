# Cause Report: 2026-11-25 Land Door & Git Journal Incidents

## Overview

This report documents the evidence and root causes for the three incidents observed on 2026-11-25 in the Git journal (`.git/fgos/git/operations/` and `.git/fgos/git/compacted/`) on repository `forgent`, proving the analysis in `plans/261125-1558-land-door-recovers-half-done-work/plan.md`.

---

## Incident 1: Dead Writer Candidate Worktree Retention (`land-477002`)

- **Timestamp**: 2026-11-25 13:23:55 – 13:34:00
- **Operation Chain ID**: `land-477002-1795587836789029861-1`
- **Related Chains**:
  - `land-477002-1795587835224529037-0` (`RemoteFetch` for target sync)
  - `land-477002-1795587836789029861-1` (`Land` candidate attempt)
  - `land-477002-1795587836789029861-1-push` (`RemotePush` of candidate ref)
- **Writer Identity**: `476958` (bare OS PID, no session UUID)
- **Door**: Land Candidate door (`packages/supervision/rust/src/land.rs`: `Lander::land_candidate`)
- **Step Stopped At**: Push rejection and retry abandonment (`outcome: abandonedBeforeAttempt`).
  In `00000000.json`, the land candidate prepared candidate commit `a64854f4fcd31446596bcfda502e7eca56a5aa7c` from source `ecadc3b0659e330f32d05d6d0c5ff5c81e811501` against target `f83e9c169eef0ffac8fbc5d074e305dcc8466a48` with candidate worktree `.fgos/runtime/git-candidates/land-477002-1795587836789029861-1-rcjWk9`.
  In `land-477002-1795587836789029861-1-push`, the push was attempted against `c0416313dec864733beadd3c1752c21be6165204`, which rejected because remote had moved. In sequence 2 (`00000002.json`), the operation recorded `outcome: abandonedBeforeAttempt`.
- **Root Cause & Blockage**:
  The candidate worktree was retained on disk. `fgos git recover` (`recover_git_operations` in `packages/git/rust/src/incidents.rs`) only releases a dead writer's retained land when `writer_is_dead` returns true. That check delegates to `fgos_identity::directory::session_proven_dead`, which looks up session records in `.fgos/sessions/`. Because writer `476958` was a bare PID (used by secretary, shaper, and direct supervisor runs) rather than a session ID, `session_proven_dead` returned false. Recovery refused with `land-abandoned-writer-mismatch` ("only its writer can recover it"), keeping 9 candidate worktrees (over 46 GB) indefinitely.

---

## Incident 2: By-Hand Commit on Local Main (`b4581336d`)

- **Timestamp**: 2026-11-25 12:29:30
- **Commit OID**: `b4581336d9c468d5dc89de85d255443eb3b10f7b`
- **Subject**: `fix(run-tests): the leak check ignores every live .fgos tree other sessions write during a run`
- **Door**: None (By-hand git commit executed directly by human operator outside fgOS doors).
- **Journal Provenance**:
  No `ScopedCommit` or `Land` operation chain exists in the WAL for `b4581336d`. It is only referenced as an observed remote tip in subsequent `RemoteFetch` operations (e.g. `land-2829813-1795584687740857716-0` and `fetch-2839686-1795584710349066445-0`).
- **Step Stopped At**: Commit created locally on `main` without pushing to `origin/main`.
- **Root Cause & Blockage**:
  When a subsequent land operation ran (`land-2829813`), `sync_target` found local `main` ahead of `origin/main`. Because the commit had no ScopedCommit chain from the land door, it represented unverified local operator changes. `sync_target` correctly refused with `land-target-ahead`. Such commits must remain unpushed by the land door to preserve human gatekeeping.

---

## Incident 3: Supervisor Land Died Between Scoped Commit and Push (`83c313366`)

- **Timestamp**: 2026-11-25 14:12:46
- **Commit OID**: `83c313366e36497fc1a459378004b6b3ca0da39e`
- **Subject**: `chore(gitignore): supervisor wake reports stay local and are not landed on main`
- **Operation Chain ID**: `land-1733814-1795590764057651072-2` (compacted receipt in `.git/fgos/git/compacted/land-1733814-1795590764057651072-2`)
- **Related Chains**:
  - `land-1733814-1795590762310107878-0` (`RemoteFetch`, observed remote tip `9c455001d97c4982bcc894181725d96f0297461b`)
  - `land-1733814-1795590764057651072-2` (`ScopedCommit` with receipt `["k", "83c313366e36497fc1a459378004b6b3ca0da39e", "false"]`)
- **Door**: Land Paths door (`packages/supervision/rust/src/land.rs`: `paths_commit`)
- **Step Stopped At**: Between `scoped_commit` and `push_local`.
  The local `scoped_commit` succeeded, committing `83c313366` to local `main` on top of `9c455001d`. However, before `push_local` could execute (no sequence `-3` RemotePush was recorded), the process terminated or was killed.
- **Root Cause & Blockage**:
  Commit `83c313366` was left intact on local `main`. At 14:13:03, a subsequent land operation (`land-1745753-1795590783548113051-0`) ran `sync_target`. It fetched `origin/main` (still at `9c455001d`) and found that local `main` was strictly ahead.
  Instead of identifying that `83c313366` was created by a valid, verified fgOS land-door `ScopedCommit` chain and completing the push, `sync_target` treated local `main` as foreign and refused with `land-target-ahead`. All subsequent lands were blocked until an unconfined operator manually pushed `83c313366` to GitHub, allowing `land-1756001` to proceed at 14:13:26.

---

## Conclusion

The findings from the live Git journal confirm the plan's Cause section:
1. `land-477002`: Bare PID writers cannot be proven dead by the identity directory, leaving candidate worktrees trapped.
2. `b4581336d`: By-hand commits lack ScopedCommit provenance and must continue to be refused by `land-target-ahead`.
3. `83c313366`: Land-door commits left unpublished due to a crash or interruption before `push_local` must be recognized by `sync_target` via their journaled ScopedCommit provenance and automatically pushed to origin.
