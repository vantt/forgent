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
  `FGOS_ACTIVE_MANIFEST_PATH`, `scripts/run-tests.mjs:122-129`) with its **own** Cargo target
  (`rvm-<step>-base-target`, never the phase's: a shared target broke the F0 close review), run as a harness entry
  with that env; run one `lock-status` and one `git status` case through it. The description file reaches a test
  through the `FGOS_TEST_` prefix `run-tests` already passes (`scripts/run-tests.mjs:145-151`), so `run-tests.mjs` is
  not edited. Lock verbs refuse on the checkout channel (AGENTS.md "Legacy-Node CLI Ownership Boundary"), so a `node:`
  entry of the base tree is not enough: say whether it is.
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
  feed into the report (`lock-status.mjs:170`, `attempt.lock` under `.fgos/assignments/**/runs/<attempt>`)? The plan
  decided D6: the host lists the run directories (`runsRoot` = `<main>/.fgos/workflow-runs`,
  `src/runner/execution/case-run-paths.mjs:17`; `scanAssignmentLayout`, `src/runner/dispatch/assignment-layout.mjs:59-90`,
  with its depth limit and symlink barrier; `listOpenAttemptDirs`, `src/run-supervisor/client.mjs:76`) and passes
  them into `holder-lock::status` (a run-supervisor call from holder-lock is a cycle: `packages/run-supervisor/rust/Cargo.toml`
  depends on `fgos-holder-lock`). Confirm each lister's exact rules so the fixture `run-dirs-vectors.json` can pin them.
- **F4 hot records.** Fields of `packages/holder-lock/contracts/hot-lock.v1.json` against what `readHotRecord`,
  `judgeHotRecord`, `reclaimDeadHolder`, `clearHotRecord`, `unlinkRecordIfUnchanged` (`src/state/hot-lock.mjs:53-150`)
  read; every caller of those five (`rg`). Known: `judgeHotRecord` is already the process door's `judge`
  (`hot-lock.mjs:53-55`); `withStateTx` reaches the readers only under contention (`tryLinkRecord` first,
  `hot-lock.mjs:198-209`); the Rust `LockScope` refuses `hot-mutex` rows (`packages/holder-lock/rust/src/scope.rs:131-135`),
  so the reclaim lock is taken by path with `acquire`; `test/holder-lock/hot-lock-contract.test.mjs` owns the contract.
  Record a contended `withStateTx` timing (two processes) as the baseline 03 compares against.
- **F5 beacon.** Writer(s) of `.fgos/runtime/main-checkout-activity.json` (`.githooks/pre-commit`,
  `src/runner/main-checkout-activity.mjs`, `bin/fgos.mjs` `clearBeaconIfOwn`), its fields, and every reader (Node's
  `readBeacon` also serves the commit gate, `main-checkout-activity.mjs:56, 109, 113`). Is there a contract file, and
  which spec owns the beacon? (Plan: none exists; 04 writes `packages/holder-lock/contracts/main-checkout-activity.v1.json`
  under holder-lock §14, main checkout one door, unless this answer names another owner.)
- **F6 `lock fence`.** The full state machine in `src/runner/lock-fence.mjs:97` (confirm, TERM, `TERM_WAIT_MS` 5000,
  KILL, `KILL_WAIT_MS` 3000, probe, hot-record path, self refusal via `selfChain`), each refusal code and its exit
  (`lockErrorToStoreError`, `bin/fgos.mjs:322-326`; also `lock-fence-signal-refused`, `lock-fence.mjs:60`), and
  `confirmFence` (330-340). `self_chain` lives only in the addon (`packages/git/node-addon/src/process.rs:164-177`);
  `signal_by_identity` is `packages/process/rust/src/control.rs:103`. Known: `Parked` carries `reason` and
  `diagnostics` only and exits 0 (`contracts.rs:239-243`, `cli_presenter.rs:266-269`) — S23-Q3.
- **F7 `git` and `worktree` exit codes.** Which addon errors carry a category (Node maps plain `Error` to exit 1:
  `src/verbs/worktree/create.mjs:7`, `remove.mjs:9, 25`); the exact `data` shapes of `git status` and `git recover`.
- **F8 envelope and refusals.** Confirm stdout is the pretty `fgos.v1` envelope with or without `--json` on both sides
  (the host's `wrap_envelope` already prints it pretty). Confirm every native refusal today exits 1 as `fgos: error: ...`
  (`cli_presenter.rs:57-76`; only `fgos_identity::Refusal` sets its own code, exit 65) — the reason for D3.
- **F9 `events`.** `eventStoreContext(dir, { detached })` (`bin/fgos.mjs:143-158`) and `src/verbs/events/context.mjs`
  (`STATE_ROOT_GONE`): which parts the `rebuild` verb (2654-2657, not ported) still needs after the four use cases go;
  the `event-store-child` fault class (`bin/fgos.mjs:4134`) and every test reading it (`test/event-store/triggers.test.mjs:171-239`);
  the exit code of `events export` without `--out` (a plain `Error`).
- **F10 `session`.** Every reader of `.fgos/sessions.json` and its fields (`listSessions` callers
  `src/verbs/merge/approve.mjs:232`, `src/runner/merge.mjs:1033`, `src/state/postland-drift.mjs:57`, the `return` arm
  `bin/fgos.mjs:3253`); the Rust reader `packages/identity/rust/src/resolve.rs:22` and its contract
  `identity.writer.v1.json:26`; `session list` returns the raw registry; the arm uses `process.cwd()`
  (`bin/fgos.mjs:3550`) while the front door validates and admits `--dir` (4066, 4073): the provider must take the
  caller's cwd for the nesting and self-mount checks (`session.mjs:255-259, 408-441`); the shutdown seal at
  `src/runner/session.mjs:387`; the retained-ref path; `test/cli/helpers/fgos-cli-harness.mjs:28` and
  `test/setup/checks.test.mjs:33` importing `createSession`. Whether `apps/fgos-gateway` tests drive `/v1/sessions`
  with a real CLI.
- **F11 `gateway`.** `startGateway` (`src/runner/gateway-control.mjs:187`): the `cargo build --release --bin fgos-gateway`
  call (211), spawn (233-238), "listening on" wait, `.fgos/gateway.json` shape, lock `gateway` 120 s, identity check,
  `stopGateway`'s `maintainEventStore(... shutdown: true)` (359), `gatewayStatus`'s `GET /v1/contract` (387); the build's
  cwd (`apps/fgos-gateway`, 211) and the port from `readMachineConfig` (34, 156). Does any Rust crate the host links
  already make an HTTP/1.1 request (else 09 uses `std::net::TcpStream`)? Live checks: (1) does a gateway started by
  `fgos gateway start` today carry `FGOS_RUST_HOST_RECURSION_GUARD` (`/proc/<pid>/environ`), and does its
  `POST /v1/sessions` then fail (`legacy_exec.rs:249`, `main.rs:283`)? (2) Does `fgos gateway start` work on Windows
  today (decides whether S23-Q4 is asked)?
- **F12 S23-Q1 inputs.** `provisionWorktree` callers and `worktree-provisioning.v1`; `agent-definitions.mjs` callers
  (eight, listed in plan.md S23-Q1); doctor's `listAgents`/`agentRenderWarnings` (`src/setup/registrations.mjs:42`).
- **F13 S23-Q2 inputs.** Preliminary count on `e6b78d1d1`: one, `docs/how-to/compare-discussion-setups-with-metrics-eval.md:185`. Count every `--<flag>=<value>`, `--dir=` and flag-before-sub use for the eight pre-F0 native verbs
  (`config`, `convention`, `friction`, `gate-bypass`, `identity`, `mailbox`, `metrics`, `version`) in `core/`,
  `domains/`, `plugins/`, `docs/how-to`, `.githooks`, `scripts`, `src` and `apps/fgos-gateway` (the gateway builds
  CLI calls). List each with `file:line`.
- **F16 refusals of each arm.** Every `requireField`, `optionalField`, `requireSubVerb` and explicit `StoreError` of
  the eight arms (`bin/fgos.mjs` ranges in plan.md's collision table) with its text and category: each becomes a parity
  case (e.g. `session end` without an id, `lock fence` without a name, `events seal` without `--stream`, a bare `--item`).
- **F14 Node arm shapes.** Static imports of the eight verbs in `bin/fgos.mjs` (98-114) and their `ARM_STATIC_IMPORTS`
  lines (`test/architecture.test.mjs:1660-1700`); which imports other arms still need (`HolderLockError`,
  `lockErrorToStoreError`, `clearBeaconIfOwn`: `main-checkout-reset` shares `test/cli/fgos-lock-fence.test.mjs:163`).

- **F15 a detached child and a gone state root.** Every root decision reads repository facts through
  `fgos_git::invocation_root::read_repo_facts` (`packages/git/rust/src/invocation_root.rs:98-108`), which calls
  `GitDriver::topology_at` (`packages/git/rust/src/driver.rs:359-365`), which builds `GitDriver::new` (266-273), which
  **creates an absent state root**. The Git spec §20 rule says a detached seal or publish child never recreates a gone
  state root, and `GitDriver::new_if_root_exists` (277-283) exists for it. Node's `main()` resolves the root
  (`bin/fgos.mjs:4066`, through the addon `resolve_invocation_root`, `packages/git/node-addon/src/git.rs:220-256`, no
  facts given) before it knows the call is a child (4088). Reproduce: remove the state root, run a Node `events seal`
  child, check whether the root came back. If it does, it is a regression of F0's root door (an item for the big lead
  now, with the commit that introduced it), and phase 01 requirement 5 fixes it in the door for both CLIs.

## Behaviour pinned so far (from the code on `e6b78d1d1`; 00 confirms each row, the verb phase turns it into cases)

Every verb prints the pretty `fgos.v1` envelope (`contract`, `generated_at`, `data_hash`, `data`) on success;
refusals are `fgos: <message>` on stderr with the category's exit code
(`packages/host-runtime/contracts/exit-codes.v1.json`: validation 4, precondition 2, conflict 3, lock-timeout 7,
unexpected 1). The shared parser has no `--k=v` form and a bare flag takes the next token unless it starts with `--`.

| Verb | argv | `data` on success | Refusals (exit) |
|---|---|---|---|
| `git status` | no flags; `--dir` (main-checkout policy) | `repository, journal, pendingOperations, retainedLand, worktrees, nativeLocks, mergeInProgress` (a failed part `{ error }`; non-repo `{ repository: { notARepository: true } }`) | unknown sub `unknown git sub-verb "<x>". Usage: fgos git <status|recover> [--dir <path>]` (4) |
| `git recover` | as above | `recovered, kept, message` [+ `mergeInProgress`, `next`] | as above |
| `lock-status` | none | `mainCheckout {outcome, holders, path, guarantee}, locks[], problems[], beacon` | none of its own (row errors inline); unexpected (1) |
| `lock fence <name>` | `--param k=v` (repeatable), `--yes`, `--attest-stopped` | `lock, path, status (free|attested-free|fenced), holders, terminated, killed` | `lock fence: <code ...>` for `unknown-lock`, `lock-fence-not-confirmed`, `lock-fence-self`, `lock-fence-unlistable`, `lock-fence-still-held`, `lock-param-invalid`, `lock-path-param-missing`, `lock-not-node-owned` (2); missing/unknown sub, missing name (4) |
| `worktree create <path>` | `--branch <n>` or `--detach`, `--base <ref>`; cwd only | the port's created object | arity, missing sub, bare `--branch` (4); `--branch` with `--detach`, port refusals (1, F7) |
| `worktree remove <path>` | `--delivered-to <ref>` (required), `--discard-ignored` | `removed, path, expectedTip, deliveredTo, deliveredToRef, evidenceDigest, discardedIgnored` | arity, missing `--delivered-to` (4); undeliverable ref, unregistered path, dirty/undelivered/process inside (1, F7) |
| `events sync` | `--remote`, `--no-push`, `--opportunistic` | sync result `+ status`; opportunistic: result, `{ error }`, or `{ skipped: "state root gone" }` | missing/unknown sub `events requires sync|status|seal|export` (4) |
| `events status` | `--remote` | store status `+ remote, remoteUrl, refspecMissing, facts` | as above |
| `events seal` | `--stream <s>` (`^[a-z][a-z0-9-]*$`), `--history <abs path under <main>/.fgos/cache/>` | seal result; lock busy `{ busy: true }` (0) | bad stream or history (4) |
| `events export` | `--out <f>` (required), `--stream`, `--since <json>` | export result | missing `--out` (plain `Error`: exit per `categoryOf`, F9) |
| `session start|end|list|gc` | `start [--item <id>]`, `end <id> [--force]`; cwd only | summary `sessionId, worktreePath, itemId, startCommit, pid, startedAt`; `end` adds `forced` [+ `retained`, `warnings`]; `list` the raw registry; `gc` `{ reclaimed, skipped }` | `SessionError` (4); missing sub `session requires a sub-verb: fgos session <start|end|list|gc> ...` (4) |
| `gateway start|stop|status` | none | `start` the start result; `stop` `{ alreadyStopped, pid, port? }`; `status` `{ running, reachable, pid, port, staleRegistry, identity? }` | every `GatewayControlError` (build failure, start timeout, identity, lock timeout, already running) (4); missing sub via `requireSubVerb` (4) |
| `agents list` | `--worktree <path>` | `projectRoot, agents[], masked, duplicates, ignored` | missing/unknown sub (4) |

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
