---
phase: 01
title: "Defects found in passing: doctor writes and starts a child in a non-fgOS repo, a warning reported as a failure, a fix that does nothing"
status: completed
depends_on: []
parallel: "wave 1, alone (registrations.mjs and bin/fgos.mjs chains start here)"
owning_lane: "HARDEN (reviewer: ES for the lifecycle set and locks.rs)"
effort: ~0.5d
net_size: "Node −20 / Rust +0 (one message) / tests +40 (estimate)"
---

# Phase 01 — Defects and red proofs

## Context

[plan.md](plan.md) fact 4; audit "Defects found (not fixed)". Code read on `fd476d709`:

- `src/setup/registrations.mjs:5110-5124` `checkObserveDirWritable`: `mkdirSync(.fgos/observe)` then writes and unlinks a probe file, on doctor's default path (violates packaging-distribution RUL9, spec `:665`). Registered `:5341-5346`.
- `bin/fgos.mjs:4851` `EVENT_STORE_LIFECYCLE_VERBS` includes `'doctor'` → `opensEventStore` (`:4871-4877`) is true → `eventStoreLifecycle` set (`:5282-5289`) → end trigger `maintainEventStore(..., end: true)` (`:5353-5358`) → `sealIfDue` per stream and, when a push is due, `handSyncToChild` spawns `fgos events sync --opportunistic --dir <root>` (`src/event-store/maintenance.mjs:17-20,48-52`).
- The child refuses on the lock directory: `packages/event-store/rust/src/locks.rs:128-135` "`<dir>` must be an existing 0700 directory; run fgos setup" (`fgos setup` is deprecated; the registered fix is `event-store-lock-dirs`, `registrations.mjs:5478`). The fault goes to `.fgos/logs` (`src/cli/invocation-fault-log.mjs:48-56,92`) because `.fgos/` now exists.
- `.fgos/locks` creator: **[UNVERIFIED]** (plan fact 4d).
- `src/setup/executor-profile-warnings.mjs:99-109` returns `passed: false` with "informational, not blocking"; the doctor convention is `passed: true` + `warning:` prefix (`src/setup/terminal-control-checks.mjs:5-7`, `event-store-checks.mjs:26`). Its test asserts the wrong level: `test/setup/executor-profile-warnings.test.mjs:73-81`.
- `registrations.mjs:3427-3451` `fixNoStuckMergeAbort` always returns `changed: false` and repeats the check's message: a registered fix that never fixes. The check (`:3408-3421`) stays until P06 folds it into `fgos git status`.

## Requirements

- **Red first.** Extend the owning RUL9 proof `test/setup/checks-doctor-config.test.mjs:392` ("fgos doctor (no flags) on a fresh cwd … read-only proof"): in a scratch Git repo with no fgOS setup and a private `HOME`, after `fgos doctor --json` exits, `<repo>/.fgos` does not exist and no `fgos events` process was started (wait for a detached child with a bounded poll of the process table filtered to the test's own `HOME`/cwd). Red on main for both.
- **No lifecycle around doctor.** Remove `'doctor'` from `EVENT_STORE_LIFECYCLE_VERBS` (`bin/fgos.mjs:4851`); update the comment at `:4849-4850` and the group-3 classification comment (`:4930-4935`) if it names doctor's triggers. `doctor --fix` gains nothing from seal/publish either (its Event Store fix only makes lock dirs). Before editing: `git log -S"EVENT_STORE_LIFECYCLE_VERBS" --oneline` and read why doctor was added; if the commit names a behaviour that still needs it, stop and report.
- **Observe row reads only.** `checkObserveDirWritable` never creates: an existing `.fgos/observe` is judged with `fs.accessSync(dir, W_OK)` plus a real write probe only when the directory already exists (probe file creation inside an existing fgOS directory is what the row proves; keep it if the lead shows `access` alone misses a read-only mount, else drop it); an absent directory passes with `info:` naming the door that creates it on first use (trace it: `src/state/fgos-file-registry.mjs:45` `OBSERVE_DIR` and its writers). No `.fgos` outside an fgOS project.
- **Find `.fgos/locks`.** With the two fixes above, rerun the red test; if `.fgos/locks` (or any `.fgos` entry) still appears, bisect by calling each `DOCTOR_CHECKS[i].check(repo, run)` in a scratch repo and listing `.fgos` after each; fix the row that writes (read-only path), or, if the writer is a Rust probe, give the probe a scratch directory outside the project. Record the culprit with `file:line` in the report.
- **Lock-dir message.** `locks.rs:132`: "…; run fgos doctor --fix (event-store-lock-dirs)". Grep `rg -n "run fgos setup" packages src` and change every message that still sends a user to the deprecated verb for a fix that `doctor --fix` registers; leave messages about shell integration (`fgos setup`'s remaining job) alone.
- **Warning level.** `checkExecutorProfileWarnings` returns `{ passed: true, message: 'warning: N legacy executor-profile warning(s): …' }`; the description at `registrations.mjs:3829` drops the plan label "Phase 06 (executor-policy-dispatch-seams):". The T5 sub-plan keeps owning the row; this phase changes only the level (tell the T5 lead on the board).
- **No-op fix deleted.** Delete `fixNoStuckMergeAbort` and its `registerFix` (`registrations.mjs:3423-3451`, keep the check). Fix inventory line in `setup-doctor-registry.md` and `checks.test.mjs`/`registrations.test.mjs` lists lose `no-stuck-merge-abort` as a fix.
- `CHANGELOG.md` `[Unreleased]`: doctor no longer writes or publishes in a project that is not set up; `executor-profile-warnings` warns instead of failing; `no-stuck-merge-abort` has no fix (it never had an effect).

## Files

**Create:** none.

**Modify:**
- `bin/fgos.mjs:4849-4851` (set and comment)
- `src/setup/registrations.mjs:3423-3451` (fix removed), `:3827-3837` (description), `:5110-5124` (observe check)
- `src/setup/executor-profile-warnings.mjs:92-109`
- `packages/event-store/rust/src/locks.rs:128-135` (+ the culprit of `.fgos/locks`, if any)
- `src/event-store/maintenance.mjs` only if a comment there names doctor
- Tests: `test/setup/checks-doctor-config.test.mjs:392` (extended), `:524-556` (fix assertions removed, check assertions kept), `test/setup/executor-profile-warnings.test.mjs:73-81`, `test/setup/observe-doctor-checks.test.mjs:27` ("passes and creates .fgos/observe" → passes on an existing dir; absent dir is `info:` and creates nothing), the Rust test that pins the lock-dir message if one exists (`rg -n "run fgos setup" packages/event-store/rust`)
- `test/setup/registrations.test.mjs` (fix inventory), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (fix inventory line), `CHANGELOG.md`

**Delete:** none (functions only).

**Tests to retire:** `checks-doctor-config.test.mjs:531-534,550-553` fix assertions → behaviour removed (the fix had no effect); the check assertions of the same tests stay. `observe-doctor-checks.test.mjs:27` "creates .fgos/observe" → behaviour removed; the row's new behaviour is owned by the same test, rewritten. No Rust test retires.

## Net size

Node: no-op fix −28, observe check ±0, lifecycle −1, warnings −1 → about −20 (+ culprit). Rust: 0 lines (text). Tests: red proof +30, observe rewrite +5, fix asserts −8, warning level ±0 → about +30 to +40.

## Validation

- FR `test/setup/checks-doctor-config.test.mjs test/setup/executor-profile-warnings.test.mjs test/setup/observe-doctor-checks.test.mjs test/setup/registrations.test.mjs test/setup/checks.test.mjs test/event-store/maintenance*.test.mjs` (the last if present: `ls test/event-store`)
- `cargo test -p fgos-event-store`; clippy, msvc, darwin, fmt for `fgos-event-store`
- Manual: scratch repo `git init`, `npm run fgos:dev -- doctor --json`, then `find . -name .fgos` empty and `pgrep -f "events sync"` empty; time it (≤ 4.5 s).
- `rg -n "registerFix\(\{\s*id: 'no-stuck-merge-abort'" src` → nothing.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A test or workflow relied on doctor publishing events (sync as a side effect) | L × M | grep `doctor` in `test/event-store` and `test/cli` for seal/sync expectations; every other verb still triggers; `fgos events sync` exists |
| Observe row with no probe misses a read-only filesystem | L × L | keep the write probe when the directory exists (that is an fgOS project) |
| The `.fgos/locks` writer is a Rust holder-lock probe whose directory choice is shared with `fgctl` | M × M | change only the doctor caller's directory argument; no change to the probe's own contract; OPC reviews |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

Red proof green; no `.fgos` and no child in a scratch repo; `executor-profile-warnings` warns; no no-op fix; landed with a guide section.

## Lead brief essentials

Red test first (it must fail on main for `.fgos` and for the child). Read the history of the lifecycle set before editing it. Name the `.fgos/locks` writer with `file:line`. All plan.md lead rules apply.
