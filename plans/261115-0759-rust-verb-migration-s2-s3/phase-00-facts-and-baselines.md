---
phase: 0
title: "Facts, prior art, parity cases and baselines (S2 and S3)"
status: pending
effort: 1d
wave: A
blockedBy: []
---

# Phase 00: Facts and baselines

Read-only. Answers the prior-art questions and the open facts every later phase relies on, pins each verb's
argv, output and exit-code behaviour as parity cases, and records the numbers the exit criteria compare against.
Its report reaches both step leads before any wave-B phase lands; a fact that contradicts a phase's design names
the phase and line it changes.

Phase-lead rules: [plan.md](plan.md) "Phase-lead rules". Branch `rust-verb-migration-program/s23-p00`, worktree
`/home/vantt/projects/forgent-worktrees/rvm-s23-p00` from `origin/main`. Report slug `s23-p00-facts`.

## Prior art (already scouted for this plan; re-verify each with one command and record the sha)

| Verb | What existed before | Change that removed or moved it | Intended |
|---|---|---|---|
| all eight | never a Rust route: every one of the 324 commits touching `command-routes.json` kept them `legacy-cli`; no registry `native` flag | - | - |
| `lock-status`, `unlock` | Node in `src/runner/main-checkout-lock.mjs` (`435ddf3db` tsk-5z2, `8ef58808f` tsk-3h4) | deleted by `cd7ed1207` (2026-10-17, one door for the repo kernel locks); `unlock` replaced by `lock fence` in `c96954930` (holder-lock spec §17) | yes |
| `session` | `src/runner/session.mjs` since `1d96b4412` (2026-07-17) | refactors `00c4bed22`, `2e151f9b4`, `98e1c5824` | - |
| `gateway` | `src/runner/gateway-control.mjs` from `f3393c40b` (tsk-31v) | follow-ups `fc25b5ed5`, `f4d9186cd` | - |
| `events` | `src/verbs/events/` dormant verbs `408e0d694` (2026-10-19) | import/migrate/rollback verbs removed by `b6927cce9`, `4db1df785` (2026-10-28) | yes |
| `worktree` | `src/verbs/worktree/` from `8a8362712` (Worktree port and public create verb) | - | - |
| `git` | `src/git/status.mjs` from `4430edde8` (2026-11-08) | - | - |
| `agents` | `src/runner/agent-listing.mjs` `02106766d`; lookup refactored `55029e981` (2026-11-14) | - | - |

Rust that already does each job's core (reuse, never copy): Event Store `seal`, `sync`, `status`, `export_jsonl`,
`lifecycle::maintain` (`packages/event-store/rust/src/{seal,sync,diagnostics,export,lifecycle}.rs`); holder-lock port
`probe`, `holders`, `guarantee` (`packages/holder-lock/rust/src/port.rs:1536, 1565, 1571`), `predecessor.rs`; process
facts and control (`packages/process/rust/src/facts.rs:215` `judge`, `control.rs:103`); Git recovery
(`packages/git/rust/src/recovery.rs:51, 82, 103, 180`), inspection (`driver.rs:372` `resolve_repo`, `inspect.rs:564`
`list_worktrees`), Worktree port (`worktree.rs:689, 705, 983`), `store_admission.rs` (`is_session_worktree` 166);
`fgos_process::mapped::spawn_detached` (`packages/process/rust/src/mapped.rs:194`); Durable File; `yaml-doc`.

Also record, with `git log -S`: `listOpenAttemptDirs`, `existingInstances`, `readBeacon`, `judgeHotRecord`,
`sessionSummary`, `gatewayStatus`, and any older Rust `fn fence`/`lock_status`/`gateway_status` under `apps` or
`packages` (expect none).

## Open facts (each answered with `file:line`)

- **F1 parity baseline entry.** Node refuses a `native` verb (`bin/fgos.mjs:4066-4071`), so node-vs-host in one tree
  is impossible after a flip. Prove the recipe phase 01 builds: a linked worktree at the step base, staged by
  `node scripts/run-tests.mjs` there (it writes `FGOS_HOST_BIN`, `FGOS_ACTIVE_RELEASE_PATH`,
  `FGOS_ACTIVE_MANIFEST_PATH`, `scripts/run-tests.mjs:122-129`), run as a harness entry with that env; run one
  `lock-status` and one `git status` case through it. Lock verbs refuse on the checkout channel (AGENTS.md
  "Legacy-Node CLI Ownership Boundary"), so a `node:` entry of the base tree is not enough: say whether it is.
- **F2 Node spawns of the eight verbs.** Every Node or Rust site that starts `fgos <verb>` for one of them:
  `src/event-store/maintenance.mjs:11` (`events sync`), `:52` (`events seal`) through `spawnDetachedCli`
  (`src/util/spawn-detached-fgos.mjs:19`, `OWN_CLI` = `bin/fgos.mjs`); `apps/fgos/src/invocation_doors.rs:101-123`;
  `apps/fgos-gateway/src/gateway.rs:1091, 1115` (`session start|end --json` via `fgos_command`); search for more
  (`rg -n "'(lock|lock-status|git|worktree|events|session|gateway|agents)'" src scripts packages apps core domains`).
- **F3 `lock-status` enumeration.** Compare `LOCK_FILES` (`src/runner/lock-status.mjs`, the per-row table) with the
  registry `v3Path` templates (`packages/holder-lock/contracts/lock-registry.v1.json`) row by row: is every row
  equal to "the template glob" except the run-scoped placeholders? Where do `<workflowRunDir>` and `<runDir>`
  instances live (`runsRoot`, `src/runner/execution/case-run-paths.mjs`; `listAssignmentRuns`,
  `src/runner/dispatch/assignment-layout.mjs`)? What does `listOpenAttemptDirs` (`src/run-supervisor/client.mjs`)
  feed into the report, and does `packages/run-supervisor/rust` already list those directories? Recommend how the
  Rust status module learns the run-scoped roots without importing Execution code (a declared root per placeholder
  in the registry, or a run-supervisor crate call), with the cost of each.
- **F4 hot records.** Fields of `packages/holder-lock/contracts/hot-lock.v1.json` against what `readHotRecord`,
  `judgeHotRecord`, `reclaimDeadHolder`, `clearHotRecord`, `unlinkRecordIfUnchanged` (`src/state/hot-lock.mjs:53-150`)
  read; every caller of those five (`rg`), and whether any runs on a hot path where an addon call would be measurable
  (`withStateTx` 380).
- **F5 beacon.** Writer(s) of `.fgos/runtime/main-checkout-activity.json` (`.githooks/pre-commit`,
  `src/runner/main-checkout-activity.mjs`, `bin/fgos.mjs` `clearBeaconIfOwn`), its fields, and every reader. Is there
  a contract file? (Plan assumes none: 04 writes `packages/holder-lock/contracts/main-checkout-activity.v1.json`.)
- **F6 `lock fence`.** The full state machine in `src/runner/lock-fence.mjs:97` (confirm, TERM, `TERM_WAIT_MS` 5000,
  KILL, `KILL_WAIT_MS` 3000, probe, hot-record path, self refusal via `selfChain`), each refusal code and its exit
  (`lockErrorToStoreError`, `bin/fgos.mjs:322-326`), and `confirmFence` (330-340). Does the host presenter
  (`apps/fgos/src/cli_presenter.rs:266`, `ProviderOutcome::Parked`) let the CLI ask and reinvoke, or does 05 add that?
- **F7 `git` and `worktree` exit codes.** Which addon errors carry a category (Node maps plain `Error` to exit 1:
  `src/verbs/worktree/create.mjs:7`, `remove.mjs:9, 25`); the exact `data` shapes of `git status` and `git recover`.
- **F8 envelope.** For every verb: is stdout always the pretty-printed `fgos.v1` envelope, with or without `--json`
  (`bin/fgos.mjs` ~4104-4125)? How does `cli_presenter::present_outcome` (120) print a native outcome without
  `--json` today? Phase 01 must give these verbs the same answer.
- **F9 `events`.** `eventStoreContext(dir, { detached })` (`bin/fgos.mjs:143-158`) and `src/verbs/events/context.mjs`
  (`STATE_ROOT_GONE`): which parts the `rebuild` verb (2654-2657, not ported) still needs after the four use cases go;
  the `event-store-child` fault class (`bin/fgos.mjs:4134`) and every test reading it (`test/event-store/triggers.test.mjs:171-239`);
  the exit code of `events export` without `--out` (a plain `Error`).
- **F10 `session`.** Every reader of `.fgos/sessions.json` and its fields (`listSessions` callers
  `src/verbs/merge/approve.mjs:57`, `src/runner/merge.mjs:47`, `src/state/postland-drift.mjs:9`); `session list`
  returns the raw registry; `--dir` is ignored (`bin/fgos.mjs:3550`, `process.cwd()`); the shutdown seal at
  `src/runner/session.mjs:387`; the retained-ref path; `test/cli/helpers/fgos-cli-harness.mjs:28` and
  `test/setup/checks.test.mjs:33` importing `createSession`. Whether `apps/fgos-gateway` tests drive `/v1/sessions`
  with a real CLI.
- **F11 `gateway`.** `startGateway` (`src/runner/gateway-control.mjs:187`): the `cargo build --release --bin fgos-gateway`
  call (211), spawn (233-238), "listening on" wait, `.fgos/gateway.json` shape, lock `gateway` 120 s, identity check,
  `stopGateway`'s `maintainEventStore(... shutdown: true)` (359), `gatewayStatus`'s `GET /v1/contract` (387). Does any
  Rust crate the host links already make an HTTP/1.1 request (else 09 uses `std::net::TcpStream`, no new edge)?
- **F12 Q1 inputs.** `provisionWorktree` callers and `worktree-provisioning.v1`; `agent-definitions.mjs` callers
  (eight, listed in plan.md Q1); doctor's `listAgents`/`agentRenderWarnings` (`src/setup/registrations.mjs:42`).
- **F13 Q2 inputs.** Count every `--<flag>=<value>`, `--dir=` and flag-before-sub use for the eight pre-F0 native verbs
  (`config`, `convention`, `friction`, `gate-bypass`, `identity`, `mailbox`, `metrics`, `version`) in `core/`,
  `domains/`, `plugins/`, `docs/how-to`, `.githooks`, `scripts`, `src` and `apps/fgos-gateway` (the gateway builds
  CLI calls). List each with `file:line`.
- **F14 Node arm shapes.** Static imports of the eight verbs in `bin/fgos.mjs` (98-114) and their `ARM_STATIC_IMPORTS`
  lines (`test/architecture.test.mjs:1660-1700`); which imports other arms still need (`HolderLockError`,
  `lockErrorToStoreError`, `clearBeaconIfOwn`: `main-checkout-reset` shares `test/cli/fgos-lock-fence.test.mjs:163`).

## Parity cases (one table per verb, written here as a list; the verb phase writes the file)

For each verb, list the argv set with expected exit code and comparison mode (`exact-bytes` for stderr refusals,
`semantic-json` for envelopes since `generated_at` differs, `fs-delta` for writes on a fresh fixture each): every
sub-command's success, every refusal path (missing/unknown sub, unknown flag, each verb-specific refusal from F6, F7,
F9-F11), `--dir` forms (a project, a non-project, a linked worktree with a frozen `.fgos`), flag-before-sub shapes,
a `--flag=value` token (Node refuses it as an unknown flag; the host must too). Mark each case whose host answer
differs by an accepted change (plan.md Outcome) and say which.

## Baselines

- `node scripts/git-one-door-scan.mjs --root .` summary (this plan's read on `e6b78d1d1`: 0 undeclared; classes
  `configured-binary` 94, `rust-test` 161, `git-driver` 1, `sandbox-door` 2).
- Route counts (80 routes: 72 `legacy-cli`, 8 `native`).
- Medians of 15 runs through the staged host (Node-served today): `lock-status`, `git status --json`,
  `events status`, `session list`, `gateway status`, `agents list`, `worktree create` on a scratch repo; machine load.
- `cargo check` msvc and darwin for `fgos`, `fgos-holder-lock`, `fgos-git`, `fgos-event-store`, `fgos-node-addon`.

## Files

- Create: the report only. Modify: none. Delete: none. Tests retired: none.

## Acceptance

- Every row of the prior-art table re-verified (sha + one line); F1-F14 answered with `file:line`; parity case lists
  for all eight verbs; baselines with commands and load.
- Any fact that changes a phase's design reaches the step lead before wave B lands, naming phase and line.

## Risk and rollback

- A fact found late changes a phase mid-way (M x M): wave-B phases may start Rust work at once, but no flip commit
  lands before this report. Rollback: nothing to roll back.
