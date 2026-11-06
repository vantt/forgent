---
phase: 07
title: "Component pointer rows: Event Store, holder-lock, run supervisor, terminal control, mailbox; each judgment moves to its component's verb first"
status: pending
depends_on: [06]
parallel: "none (registrations.mjs, bin/fgos.mjs chains)"
owning_lane: "HARDEN (reviewers: ES for Event Store, OPC for holder-lock, MAIL for the mailbox row; run supervisor and terminal rows are HARDEN's own closed layers T4/T2)"
effort: ~1d
net_size: "Node −40 / Rust 0 / tests −20 (estimate)"
---

# Phase 07 — Component pointer rows

## Context

Decision 65 (2b) and audit §2.2, §2.5. Pointer rule (plan decided items 3, 4): read-only, `passed: true`, "N … ; run `<verb>`", no fix, reuses the run's facts or stays within the cost cap (each ≤ 250 ms, all pointers together ≤ 1 s on fg-server2; over it, print "run `<verb>`" without N). Code read on `fd476d709` (re-read after P01–P06):

| Component | Rows today | Judgment's door after this phase | Pointer row |
|---|---|---|---|
| Event Store | `event-store-unsealed`, `-integrity`, `-sync` (`src/setup/event-store-checks.mjs:67-98`; loop `registrations.mjs:5479-5482`) | `fgos events status` (`bin/fgos.mjs:2947-2950` → `src/verbs/events/status.mjs`) | `event-store-incidents` (new id), from `context.status()` already read for `event-store-machine-id` |
| Holder-lock | `lock-holders` (`src/setup/holder-lock-checks.mjs:272-400`, 949 ms; registration `registrations.mjs:2048-2052`) | `fgos lock-status` (`src/runner/lock-status.mjs`, `bin/fgos.mjs:4389`) gains the two judgments it lacks: predecessor domain still running (`predecessorProblem` `:272`), hot record does not parse or its holder cannot be judged (`hotRecordProblem(s)` `:318-347`), plus stranger holders | `lock-holders` (id kept), pointer form |
| Run supervisor | `run-attempts-stuck` + fix (`src/setup/run-supervisor-checks.mjs:315-368`; `registrations.mjs:2069-2080`); orphan sockets in `runtime-socket-dir` check/fix (`:204-256`) | adopt on the normal path (`sweepAttempts`, `src/run-supervisor/client.mjs:112-123`, called by `src/runner/execution/run.mjs:621`, `src/runner/loop.mjs:1317`); manual: `fgos dispatch recover`; read: `fgos dispatch inspect` | `run-attempts-stuck` (id kept), pointer form |
| Terminal control | `terminal-allocations` (`src/setup/terminal-control-checks.mjs:91-123`; `registrations.mjs:3809-3813`) | new read section of `fgos dispatch inspect` (`--terminal`), repair stays adopt (terminal spec `:171`, `:218`) | `terminal-allocations` (id kept), pointer form |
| Mailbox | `mailbox-hook` record verdict (`registrations.mjs:2181-2227`) | `fgos mailbox status` (native; the row already asks it) | `mailbox-hook` (id kept): opt-in wiring stays readiness; record verdict becomes a warning pointer |

## Requirements

- **Event Store.** Before deleting the three rows, confirm `fgos events status --json` reports every condition they judge (ES spec `:639-641`: unsealed age thresholds and orphan branch streams; integrity errors, skipped mirrors, sync warnings; last push and ahead/behind). Anything missing is added to `statusUseCase`'s answer from the same `status()` call (no second read). `event-store-incidents` message: the non-zero items with counts, then "run `fgos events status`"; zero: "no unsealed backlog, integrity problem or unpublished event". The 3600 s unsealed failure and integrity failure become warnings (RT-6).
- **Holder-lock.** Move `predecessorProblem`, `hotRecordProblem(s)` and the stranger-holder judgment from `holder-lock-checks.mjs` into `collectLockStatus` (answer gains `problems: [...]`, existing keys byte-identical); `lock-holders` calls `collectLockStatus` and prints the count of problems or, over the cost cap, only the pointer. `lock-kernel-semantics`, `lock-borrow-vectors` and the `lock-dirs` fix stay (readiness). OPC reviews.
- **Run supervisor.** `run-attempts-stuck` counts open attempt directories without `closed.json` using the cheapest fact (`listOpenAttemptDirs`, no adopt spawn) unless the spawn fits the cap; message "N attempt(s) open, M unit run(s) await resume; the next `fgos run` adopts them, or run `fgos dispatch recover`". Delete `fixRunAttemptsStuck` and its registration. Move `orphanAttemptSockets`/`removeOrphanAttemptSockets` next to `ensureRuntimeSocketDir` in `src/run-supervisor/` and call the removal from `sweepAttempts` (same commit as removing it from the fix: RT-10); `runtime-socket-dir` check/fix keep only existence, ownership and mode. Messages naming `fgos setup` there name `fgos doctor --fix`.
- **Terminal.** Move the body of `checkTerminalAllocations` into the terminal-control client side (`src/terminal-control/`, a function returning the scan answer and the grace used) and expose it as `fgos dispatch inspect --terminal` (selector `terminal: true` in `invokeDispatchInspectOperation`, `bin/fgos.mjs:2668-2673`; section built in `src/runner/dispatch/runtime-inspection.mjs` / `src/verbs/dispatch/inspect.mjs`). The pointer prints the finding count and "run `fgos dispatch inspect --terminal`". Terminal spec `:158` names the verb.
- **Mailbox.** `checkMailboxHook`: an unreadable record (`data.record !== 'ok'`, `:2220`) becomes `warning: … run \`fgos mailbox status\``; opt-in states unchanged. MAIL reviews; no Rust change.
- For each component spec (`docs/platform/event-store/spec.md:636-642`, `holder-lock/spec.md`, `run-supervisor/spec.md`, `terminal-control/spec.md:158`, `agent-mailbox/` spec), the doctor table lists the pointer row and names the verb.
- `CHANGELOG.md`: three Event Store rows become `event-store-incidents`; `lock-status` reports problems; `dispatch inspect --terminal`; `run-attempts-stuck` no longer adopts in `doctor --fix` (the next run does); incident rows warn instead of failing.

## Files

**Create:** none expected (bodies move into existing component modules).

**Modify:** `src/setup/event-store-checks.mjs`, `src/verbs/events/status.mjs` (only if a condition is missing), `src/setup/holder-lock-checks.mjs`, `src/runner/lock-status.mjs`, `src/setup/run-supervisor-checks.mjs`, `src/run-supervisor/client.mjs` (+ the runtime-dir module), `src/setup/terminal-control-checks.mjs`, `src/terminal-control/<client side module>`, `src/runner/dispatch/runtime-inspection.mjs`, `src/verbs/dispatch/inspect.mjs`, `bin/fgos.mjs` (inspect selector), `src/cli/command-registry.mjs` (`dispatch` flags), `src/setup/registrations.mjs`; tests below; specs above; registry contract; `CHANGELOG.md`; census.

**Delete:** none.

**Tests to retire** (each names its owner):
- `test/setup/event-store-checks.test.mjs` unsealed/integrity/sync cases → moved to the `fgos events status` use-case test (find with `rg -ln statusUseCase test`), assertions kept; one pointer case stays.
- `test/setup/holder-lock-checks.test.mjs` lock-holders cases → moved to the `collectLockStatus` test (find its owner; `test/runner/lock-status*.test.mjs`), assertions kept; one pointer case.
- `test/setup/run-supervisor-checks.test.mjs` stuck-row fail and fix cases → adopt behaviour owned by `test/run-supervisor/sweep.test.mjs` and `adopt-client.test.mjs` (T4); orphan-socket removal cases move to `sweep.test.mjs`; one pointer case.
- `test/setup/terminal-control-checks.test.mjs` allocation cases → moved to the terminal-control client test, plus one `dispatch inspect --terminal` wiring case in the existing inspect test.
- `test/setup/registrations.test.mjs:1291` mailbox case → keeps its assertions except the failing level (now a warning).

## Net size

Node: three ES rows → one pointer −15; lock judgments moved ±0, pointer −20; stuck fix −25, socket move ±0; terminal moved ±0, inspect section +25; mailbox ±0 → about −40. Tests: moved ±0, fix cases −30, wiring +15 → about −20.

## Validation

- FR the moved owning tests, `test/setup/event-store-checks.test.mjs test/setup/holder-lock-checks.test.mjs test/setup/run-supervisor-checks.test.mjs test/setup/terminal-control-checks.test.mjs test/run-supervisor/sweep.test.mjs test/setup/registrations.test.mjs test/setup/checks.test.mjs`
- `npm run fgos:dev -- events status --json`, `lock-status --json`, `dispatch inspect --terminal --json` on fg-server2 answer the moved conditions
- doctor on fg-server2: pointer rows' summed time ≤ 1 s; total time before/after
- Smoke: create an orphan attempt socket in a scratch runtime dir → next `sweepAttempts` removes it; `doctor --fix` no longer touches it

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A condition the old row judged is not in the component verb | M × M | Condition table per component before deleting (report) |
| `lock-status` gets slower for its users | M × L | Measured; the judgments read the same files the holders listing already reads |
| `doctor --strict` stops failing on stuck attempts / integrity | M × M | Decided (plan item 3); CHANGELOG; the component verbs keep their exit codes |
| Orphan sockets wait until the next `fgos run` | L × L | Sockets are harmless until a new attempt with the same name; adopt runs before every run |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

Five pointer rows; every moved condition answered by its component verb; adopt and socket cleanup only on the run path; landed with a guide section.

## Lead brief essentials

One component per commit; condition table before each deletion. All plan.md lead rules apply.
