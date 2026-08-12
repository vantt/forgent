# Locked Constraints for Merge Redesign — Extraction Report

**Date:** 2026-08-12 | **Scope:** Read-only extraction of settled merge/worktree/concurrency constraints

---

## Locked Laws (L1-L10, platform-foundations.md)

| Law ID | Forbids/Requires Re Merge | Review Threshold | Source:Line |
|---|---|---|---|
| **L7** | Three durability layers: D1 (branch/PR), D2 (vĩnh viễn git), D3 (nén được), D4 (dựng lại được), D5 (máy này thôi). Merge moves item `D1 → D2`. | "Khi forgent có fleet-run/branch-PR flow thật, mức D1/D3 cần quy tắc retention cụ thể" | `platform-foundations.md:169-185` |
| **L9** | Three distinct completion stages CANNOT be merged: `run-complete` (proposed, verify xanh on branch), `merge-complete` (done, đã duyệt/merge vào main), `durable` (đã đẩy remote). Merge = `run-complete → merge-complete`. | "Khi có fleet-run/remote-push flow thật, mỗi mức cần quy tắc retention/đối-chiếu riêng" | `platform-foundations.md:211-239` |
| **L10** | Single write door: all mutations go through ONE gate (moveWork); no parallel write paths. `add-through-not-alongside` doctrine. | Multi-writer would supersede L3 premise, would cascade via proposal at L3's review threshold | `platform-foundations.md:241-269` |

---

## Decision Records: Merge-Relevant Rulings

| ID | Merge-Relevant Ruling | Status | Source:Line |
|---|---|---|---|
| **0005** | Runner is ONLY writer during dispatch (`fgos` calls). Worker never self-gathers state; runner verifies independently. Result = proposal (awaiting-approval), not merged. | Active | `0005-runner-va-co-lap-worker.md:25-34` |
| **0009** | fgOS doctrine scope bounded to `.fgos/` path + worktree tmpdir + nhánh `fgw/*`; two owned merge cửa (merge post-duyệt, dispatch worker). Everything else of host = READ-ONLY. | Active (pending STR10 enforcement) | `0009-chong-giao-thoa-luc-cai.md:30-40` |
| **0020** | **Chặn-cây** approach: worktree has NO `.fgos/` copy after `git worktree add` (deleted, no symlink). `merge.mjs` guards diff touching `.fgos/` path hard-reject pre-merge on main checkout. Session keeps symlink (D10). | Active; enforcement pending in worktree.mjs + merge.mjs | `0020-chan-fgos-khoi-worktree-worker.md:51-102` |
| **0022** | Choke-point audit: `take` vs `pick` claim-eligibility (FIXED); `isWorkingTreeClean` duplication `return` vs `approve` (FIXED); `createWorktree` 6 call sites tự quyết baseRef/cleanup (identified, no fix applied). | Active; items 1-2 fixed; item 3 deferred for wrapper | `0022-fgos-choke-point-survey.md:27-179` |
| **0027** | Domain owns 6 status labels before `delivered` (todo/doing/blocked/awaiting-human/awaiting-approval/wontfix). Four status chain AFTER `delivered` (delivered→retrospective→cleanup→done) is LINEAR, domain-invariant. Map 6→statusCategory for domain-agnostic frontier/rollup/discovery. | Active; consumer-migration pending (tsk-38t-3) | `0027-domain-so-huu-status:65-177` |

---

## Contract Invariants: mergeReadiness / Iron Law / Main Checkout Sync

### 1. Merge-Readiness Gate Conditions (runner.md spec)

**Source:** `docs/specs/runner.md:280-365` ("Cổng duyệt PR nội bộ")

**Prerequisites before merge attempt:**
- Item status must be `awaiting-approval` (goal-check passed on branch)
- Working tree of main checkout must be clean (loại trừ `.fgos/` via `isFgosOnlyStatusLine`)
- `cwd` must be in main checkout, NOT a worktree (two checks: sổ đăng ký + `isMainWorktree` cấu trúc)
- If runner source: Iron Law gate runs BEFORE ANY GIT OPS, `required: true` needs `--acknowledge-iron-law` flag (human only, never auto)

**Merge mechanics (runner source, `git worktree add` branch):**
1. `git merge --no-commit --no-ff fgw/<id>` (staging-only probe)
   - **Conflict** → `git merge --abort` + `awaiting-approval → blocked` (reason: `merge-conflict`) + friction logged
   - **Staged clean** → run goal-check on staged tree (NOT committed yet)
     - **Pass** → `git commit` (finalize merge) + `awaiting-approval → done` (role: human) + cleanup branch/worktree
     - **Fail** → `git merge --abort` + `awaiting-approval → blocked` (reason: `verify-fail-post-merge`) + friction logged

**Merge mechanics (pull-door source):**
- NO merge step (code already on main); run goal-check directly on main
- Pass → `done` (role human); Fail → `blocked` (reason: `verify-fail`) + friction

---

### 2. Iron Law Gate (STR13 Slice 3, self-improve loop)

**Source:** `docs/specs/runner.md:332-336`; `runner.md:42` (phán quyết Iron Law)

**Invocation:** Before any git ops in `approve` flow. Reads diff of `fgw/<id>` vs main.

**Trigger:** Certain patterns in diff (self-modifying code, toolchain changes, etc. — exact classifier in `src/runner/merge.mjs`)

**Outcome:**
- `required: true` → reject merge unless `--acknowledge-iron-law` flag present (human MUST decide, never auto)
- `required: false` → proceed to merge
- Human flag present → proceed to merge

**Documented stop:** merge-loop stops and reports when Iron Law blocks same item twice in a row; merge-next just reports "Iron Law trip, needs human `--acknowledge-iron-law`"; never auto-resolve.

---

### 3. Main Checkout Sync (blockedOnSync, tsk-173)

**Source:** `docs/specs/runner.md:270-271`; `merge-next/SKILL.md:77-104`

**Constraint:** Root item drifted relative to its target branch. Item blocks on `sync-root` state.

**merge-next behavior:**
- If top pick is a blockedOnSync root → auto-attempt `sync-root` verb before merge
- If sync succeeds → no merge (root only); nothing ready after
- If sync fails (reason: iron-law/merge-conflict/fgos-write-rejected/verify-fail) → report synced root id, block reason; never auto-resolve

---

## Documented Stop Rules (Merge-Related Skills)

### merge-loop (plugins/fgOS/skills/merge-loop/SKILL.md)

| Stop Reason | When | Human Action Required |
|---|---|---|
| **Frontier empty** | `picked: null, reason: "nothing ready to merge"` | None; loop ends cleanly |
| **Iron Law block** | `picked: <id>, blocked: "iron-law"` — same id, two consecutive iterations | Yes; human runs `approve <id> --acknowledge-iron-law` after verifying failing-test-first proof (optional iron-law-evidence.md read from branch) |
| **D1b no-progress** | `verify-fail-post-merge` block → agent self-diagnoses via merge-loop's playbook (test isolation, retry once via `fgos move <id> --to proposed`) → still blocked | Yes; loop stops after one retry with no progress |
| **Same-id-blocked-twice** | Any block reason (merge-conflict/verify-fail/iron-law) persists across two consecutive picks of SAME id | Yes; plain report with id + block reasons; no auto-resolve allowed |

**Key:** verify-fail-post-merge is the ONLY reason merge-loop self-diagnoses (tests, flakes); all others go straight to block-counting.

### merge-next (plugins/fgOS/skills/merge-next/SKILL.md)

**No loop stop logic (single attempt).** Returns JSON envelope data:
- `{picked: null, reason: "nothing ready to merge"}` — stop, nothing to report
- `{picked: <id>, approve: {done}}` — success
- `{picked: <id>, approve: {blocked, reason: "..."|"merge-conflict"|"verify-fail"}}` — blocked; human must intervene per reason
- `{picked: <id>, blocked: "iron-law"|"merge-conflict"|..., syncRoot: {...}}` — auto-sync root blocked; report root id + sync-fail reason

### merge-list (plugins/fgOS/skills/merge-list/SKILL.md)

**Pure read:** Returns `{ready: [...], waiting: [...], conflicts: [...]}` (mergeReadiness ranking, `src/state/graph-harness.mjs`).

**Ordering:** Dependency-wait clear, no footprint conflict, sorted by `rankImpact`.

---

## Open Contradictions

### 1. `.fgos/` Guard Scope vs Session Symlink

**Contradiction:** 0020 says "chặn-cây" (delete `.fgos/` from worktree, guard diffs), but `session.mjs` symlinks `.fgos/` back into worktree (D10, 100% unchanged per 0020).

**Source:** 0020 decision itself; `session.mjs:346-359` vs worktree.mjs (not yet updated per 0020 implementation note)

**Status:** Acknowledged gap; 0020 explicitly exempts `session.mjs:346-359` (phiên driver is different actor); worktree.mjs update deferred.

### 2. Iron Law Auto-Sync vs Never-Auto-Resolve

**Contradiction:** merge-next auto-attempts `sync-root` on blockedOnSync root before merge, but Iron Law gate never auto-resolves even when block reason is not iron-law (tsk-173 allows auto-sync, merge-loop rules forbid auto-resolve for any blockage).

**Source:** runner.md ("blockedOnSync"), merge-next/SKILL.md (auto-sync), merge-loop/SKILL.md (stop rules)

**Status:** Intentional distinction — sync-root is mechanical (same-commit target reconcile), merge/verify is outcome-dependent. Documented but tight.

---

## Summary

**Merge is chained gate:** working-tree-clean → worktree-identification → Iron Law → merge-staging → post-merge-verify → commit + done.

**Breakage points:** merge-conflict (abort, blocked), verify-fail-post-merge (abort, blocked), Iron Law trip (human gate, never auto), same-item-twice (merge-loop stop).

**Write invariants:** Single door (moveWork) for all state; merge does NOT go through it in real-time (merge commits to git, then FSM move logs result post-hoc via approve-gate → done).

**Domain/status:** Merge connects `awaiting-approval` (domain-agnostic state, gateway between execution+review) to `done` (linear, domain-invariant terminal).

**Human-required:** Iron Law always; verify-fail-post-merge after D1b self-resolve plays out; any item blocked twice in a row.

