---
contract: plan-v1
title: "Heads operate without the owner: role charter for the two hands, one fgos argv window with a permission table, one help channel and mail to the two hands, and a domain-free release rule"
status: running
lead: head:lead-forgent-261124-0004-heads-1bb1c
priority: P1
blockedBy:
  - 261121-2110-component-authority-doors
  - 261122-0118-heads-stable-and-able
base: 77d9cab4dffce6c5da3df8d5948f4783a2f648e2
footprint:
  - plans/261124-0004-heads-operate-without-owner/**
  - docs/platform/supervision/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/run-supervisor/spec.md
  - core/skills/fgos-secretary/SKILL.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/agents/secretary.yaml
  - core/agents/supervisor.yaml
  - .claude/agents/secretary.md
  - .claude/agents/supervisor.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - packages/session-host/rust/src/lib.rs
  - packages/session-host/rust/src/permissions.rs
  - packages/session-host/rust/src/forwarder.rs
  - packages/session-host/rust/src/release.rs
  - packages/session-host/rust/tests/permissions.rs
  - packages/session-host/rust/tests/forwarder.rs
  - packages/session-host/rust/tests/release.rs
  - packages/session-host/rust/Cargo.toml
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/git/node-addon/src/session_host.rs
  - packages/git/node-addon/src/lib.rs
  - packages/git/node-addon/Cargo.toml
  - src/native/door.mjs
  - src/session-host/head-grants.mjs
  - src/session-host/head-start.mjs
  - src/session-host/head-request.mjs
  - src/session-host/head-request-client.mjs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/contracts/envelope.v3.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - Cargo.lock
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - apps/fgos/src/routing.rs
  - src/runner/dispatch/session-attempt.mjs
  - apps/fgos/src/wiring/unit_run_host/session_attempt.rs
  - apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-request.test.mjs
  - test/session-host/head-start.test.mjs
  - test/live/head-grant-probe.live.mjs
  - packages/component-authority/model/doors/execution-s-node-seam.yaml
  - packages/component-authority/model/doors/the-node-bind-facade-has-only-its-named-callers.yaml
  - packages/component-authority/model/doors/node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure.yaml
  - core/config-standard/secretary.yaml
  - core/config-schema/secretary.schema.yaml
  - core/config-standard/release.yaml
  - core/config-schema/release.schema.yaml
  - .fgos/config.yaml
  - CHANGELOG.md
source:
  - plans/discussions/ds-liu5g4k3gh-privileged-chores-research/DISCUSSION.md
  - p-g5ktat4kej
  - p-v6xinnjoxh
  - plans/discussions/ds-4qpcunq7n7-confinement-to-rust/DISCUSSION.md
created: 2026-11-24
---

# Heads operate without the owner

Mode: standard. Decisions cited by their discussion ids (PC-D1 to PC-D11) from
`plans/discussions/ds-liu5g4k3gh-privileged-chores-research/DISCUSSION.md`; none is reopened here. PC-D11 (owner, 2026-11-24
00:14) fixes three things this plan follows: it is a separate plan, it runs after the doors plan and 0118 and before
0056, and its new code is Rust: the table, forwarder, `can-i` and release code live in `packages/session-host/rust`, the first slice of plan 3 of the Node-to-Rust inventory
(`plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md`); the rest of session-host is not ported
here.

## Outcome

The secretary (Miu, the right hand) and the supervisor (the left hand) can do the routine privileged chores the owner
runs by hand today, and every head has one channel to ask for help:

- The supervisor looks after every agent that has no lead (PC-D2). Miu keeps the same power asleep and uses it only
  when no supervisor can act, to bring the machinery back (PC-D1). Both rules are written in the specs, skills, agent
  descriptions and grant comments, and no sentence says the opposite.
- Anything that touches shared state (`.git` of main, `.fgos`, config, worktrees, the release) goes through one
  window: the head sends an `fgos` argv over its request socket, the run supervisor looks it up in one data table
  `persona x fgos verb prefix -> allow | ask | deny` with inheritance (head < supervisor < secretary), held and read
  only by the Rust session-host crate, and `allow` execs the verb from Rust with no shell and no Node hop, `ask` becomes an owner question carrying the exact argv, `deny` refuses with a reason (PC-D3,
  PC-D6). `fgos can-i <argv>` answers before acting. The 28 hand-written branches that only forward are gone, `SUCCESSOR_READ_VERBS` is a column of the same table, and the
  cage sizes (`writes`, `mailbox`, `peers`) are rows of it too; `GRANTS` in `head-grants.mjs` is no longer a source of
  authority, only a thin port the Node launch reads through.
- Every persona may `supervisor raise` a `coordination-help` event; leads and planners may mail the two hands and only
  them; Miu's 15-minute tick also asks "is a supervisor alive?" and "is a help request older than the threshold?" and
  takes over when either is true (PC-D5, PC-D8).
- `src/session-host/head-start.mjs` and `src/session-host/head-request.mjs`, which this plan rewrites, carry no
  authority debt: their allowance lines in the three execution door rows are paid (phase 2).
- A release is a domain-free rule in the supervisor skill over a recipe the project declares as data (PC-D9, PC-D10):
  a reversible recipe is applied, probed, rolled back on a failed probe and reported, with no question; an
  irreversible one always waits for a person. The forgent recipe (its land gates, `fgctl upgrade`, the live grant
  probe, `fgctl repair`) lives in `.fgos/config.yaml`, not in any skill.

## Acceptance criteria

1. Each phase's verify command passes (listed in its phase file).
2. `npm test` and `cargo test --workspace` are green on the integrated tree (phase 7).
3. The change is in the active release and `node test/live/head-grant-probe.live.mjs`, run inside a confined
   supervisor, secretary, planner, shaper and lead, proves every changed verb, rule and grant; the before and after
   tables are in `plans/261124-0004-heads-operate-without-owner/reports/head-grant-probe.md`. The first build and
   activation after this plan lands is the owner's, by hand (PC-D9); later ones follow the release rule of phase 6.
4. `rg -n "never .*(reads|types into) .*session|not in your grant" core/skills/fgos-secretary/SKILL.md core/agents/secretary.yaml`
   finds no sentence that forbids Miu her dormant recovery power (phase 1).

## Non-goals

Each has its own owner (discussion hand-off):

- The supervisor's rhythm and the keeper that re-reads state every tick: plan `261122-0056-orchestration-skeleton`.
- Mail that wakes an idle recipient: plan `261030-0323-mailbox-v9-wake-on-mail`. Until then Miu's tick and the
  supervisor's wake pick mail up.
- Turning `ask` into an automatic run inside an approved frame: the gate door `decide` of plan
  `261030-1029-harden-gate-door-two-levels`. This plan leaves `ask` as an owner question.
- Rules over shell command patterns (withdrawn in the discussion, §5 23:20). Raw shell outside the cage is never
  `allow`.
- `maxLeads` by machine capacity (`p-tyowvhthul`) and `session type` that does not submit (`p-lfwmzs6zsr`).
- Any new fgOS verb beyond `can-i` and the one release policy branch; the window forwards existing verbs (RUL104).
- **Moved away by the owner's split (2026-11-24, `plans/discussions/ds-4qpcunq7n7-confinement-to-rust/DISCUSSION.md`):**
  the former phase 4 (loosen the cage so the role's own work runs inside it, including `npm test` and
  `cargo test --workspace`, PC-D7) and the former phase 5 (a peers head keeps its own pid namespace, `p-oqs75qwyco`),
  with every `src/runner/dispatch/confinement/**` file, `test/runner/dispatch-confinement-*.test.mjs` and
  `docs/platform/agent-confinement/spec.md`, now belong to plan `261124-1853-confinement-to-rust`, written once in
  Rust after `261122-2108` and not patched in Node here. The re-proof of `p-ndortdckid`, `p-ia2v33b54u` and
  `p-btxvtb34u3` moved with them; a cause that needs `.fgos` writable comes back from that plan as a window job for
  this plan's table.

## Prior art (reused, missing)

Reused: the persona table and its one reader `grantOf` (`src/session-host/head-grants.mjs`); the request socket, its
contract and its Rust enforcement (`head-request.v1.json`, `head_request.rs`); the `coordination-help` raise kind,
already in the contract; the self-protecting doors `worktree remove --delivered-to`, `git recover`,
`config patch --project-only`, the main-checkout lock and the `.fgos` ban in `validateWorkspacePaths`; the live grant
probe of plan 0118 phase 11; `fgctl repair` as the rollback door (it reactivates the previous release,
`previousArtifactDigest`); `land.gates` as the forgent recipe's checks; Miu's `/loop 15m` tick; the `friction record`
and `questions answer` socket verbs (plan 0118 phase 2), whose re-proof moved to `261124-1853-confinement-to-rust`.

Missing, built here: the permission table as data with `ask`, inheritance and `can-i`; the help-channel grant rows
and Miu's two takeover checks; a recipient limit for lead and planner mail; the release recipe as config and its
policy branch.

Checked before writing (`git log -S`): the supervisor's own tick was designed and dropped before code on 2026-11-18
for watcher tick plus event wake (PS-13, `ca060ba79`, `fe8db5304`); it is not revived here, the keeper of plan 0056
owns it.

## Authority map

`fgos authority locate` was run for each new thing; no row owns the table, `can-i`, or the release recipe, so each is
declared.

| New thing | Model row | Note |
|---|---|---|
| Permission table `persona x verb prefix -> allow/ask/deny` as data | `declare: contract session-host-head-permissions-v1` | Read only by the Rust crate `packages/session-host/rust`; overlaps `GRANTS`, survivor: `declare: contract session-host-head-permissions-v1`; retired: the `GRANTS` table and verb arrays of `src/session-host/head-grants.mjs` (its `grantOf` becomes a thin port over the addon) |
| Argv forwarder replacing the forward-only branches (Rust) | `session-host`, `run-supervisor/head-request.v1` | Overlaps the 28 `case` branches, survivor: `session-host` forwarder called by `head_request.rs`; retired: forward-only branches of `runHeadRequest` in `src/session-host/head-request.mjs` |
| `SUCCESSOR_READ_VERBS` as a table column | `run-supervisor` | Overlaps the Rust constant, survivor: `declare: contract session-host-head-permissions-v1` read flag; retired: `SUCCESSOR_READ_VERBS` in `packages/run-supervisor/rust/src/head_request.rs` |
| `fgos can-i <argv>` | `session-host` | Answered from the envelope's rules by the run supervisor, like `session bind session` |
| Help channel and Miu takeover threshold | `supervision`, `config` | `secretary.help.staleMinutes`, new key in `core/config-standard/secretary.yaml` |
| Lead and planner mail limited to the two hands | `agent-mailbox`, `session-host` | |
| Paying the authority debt of `head-start.mjs` and `head-request.mjs` | `execution-s-node-seam`, `the-node-bind-facade-has-only-its-named-callers`, `node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure` | Overlaps the allowance lines, survivor: the door each row names; retired: the `src/session-host/head-start.mjs` and `src/session-host/head-request.mjs` allowances in those three rows |
| Release recipe as project data | `declare: contract config-release-v1` | Keys in `core/config-standard/release.yaml`; domain-free |
| Release policy branch of the window (Rust) | `session-host`, `packaging-distribution` | Applies through `fgctl upgrade` and rolls back through `fgctl repair`, both existing doors |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Role charter for the two hands](phase-01-role-charter.md) | - | docs/platform/supervision/spec.md, docs/platform/session-host/spec.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/agents/secretary.yaml, core/agents/supervisor.yaml, .claude/agents/secretary.md, .claude/agents/supervisor.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 1 | done |
| 2 | [The fgos argv window and its permission table, in Rust](phase-02-argv-window.md) | - | packages/session-host/rust/src/lib.rs, packages/session-host/rust/src/permissions.rs, packages/session-host/rust/src/forwarder.rs, packages/session-host/rust/tests/permissions.rs, packages/session-host/rust/tests/forwarder.rs, packages/session-host/rust/Cargo.toml, packages/session-host/contracts/head-permissions.v1.json, packages/git/node-addon/src/session_host.rs, packages/git/node-addon/src/lib.rs, packages/git/node-addon/Cargo.toml, src/native/door.mjs, Cargo.lock, src/session-host/head-grants.mjs, src/session-host/head-start.mjs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/contracts/envelope.v3.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, apps/fgos/src/routing.rs, src/runner/dispatch/session-attempt.mjs, apps/fgos/src/wiring/unit_run_host/session_attempt.rs, apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs, test/session-host/head-grants.test.mjs, test/session-host/head-request.test.mjs, test/session-host/head-start.test.mjs, test/live/head-grant-probe.live.mjs, docs/platform/run-supervisor/spec.md, packages/component-authority/model/doors/execution-s-node-seam.yaml, packages/component-authority/model/doors/the-node-bind-facade-has-only-its-named-callers.yaml, packages/component-authority/model/doors/node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure.yaml | 1 | running |
| 3 | [Help channel and mail to the two hands](phase-03-help-and-mail.md) | 1, 2 | packages/session-host/contracts/head-permissions.v1.json, packages/session-host/rust/tests/permissions.rs, packages/session-host/rust/tests/forwarder.rs, core/config-standard/secretary.yaml, core/config-schema/secretary.schema.yaml, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, docs/platform/supervision/spec.md | 2 | draft |
| 6 | [Domain-free release rule and the forgent recipe](phase-06-release-rule.md) | 3 | packages/session-host/rust/src/release.rs, packages/session-host/rust/src/lib.rs, packages/session-host/rust/tests/release.rs, packages/session-host/contracts/head-permissions.v1.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, core/config-standard/release.yaml, core/config-schema/release.schema.yaml, .fgos/config.yaml, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-secretary/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 3 | draft |
| 7 | [Integration, full suite and live probe](phase-07-integration.md) | 1, 2, 3, 6 | CHANGELOG.md, plans/261124-0004-heads-operate-without-owner/reports/head-grant-probe.md, plans/261124-0004-heads-operate-without-owner/reports/integration.md | 4 | draft |

Wave reading (checked with `node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`): wave 1 holds
the charter (docs, skills, agent sources) and the window (session-host code, contracts, routing), whose footprints
are disjoint. Wave 2 holds the help-and-mail phase, which edits the table and both skills after both wave-1 phases.
Wave 3 holds the release rule, which owns the release files, the table and the skills after phase 3. Phase ids 4 and
5 are not reused: they moved to `261124-1853-confinement-to-rust`, and the integration phase no longer depends on
them. The generated skill surfaces (`.agents/skills/**`, `plugins/fgOS/skills/**`,
`.claude/skills/**`) are hot: they are regenerated with `npm run build:skills` by phases 1, 3 and 6 only, which sit in
waves 1, 2 and 3, one writer per wave. `CHANGELOG.md` is written only by phase 7.

Order against other plans:

- `261121-2110-component-authority-doors` (running) and `261122-0118-heads-stable-and-able` (running) own
  `src/session-host/head-request.mjs`, `src/session-host/head-grants.mjs`, the secretary skill, the live probe, the
  generated skill surfaces and `CHANGELOG.md`. This plan is `blockedBy` both and stays
  `draft` until both are `done`; the planner (or the supervisor on its wake) then flips `status: ready` once the check
  passes with no cross-plan overlap. The discussion's reading that phases T2, T4, T5 and T6 avoid the doors plan does
  not hold: every one of them regenerates the skill surfaces or edits the confinement files that plan owns.
- PC-D11 orders this plan after both the doors plan and 0118; the discussion's earlier note in its hand-off ("Thứ tự", 00:20) that only
  phase 2 waits for the doors plan is superseded, and it could not hold anyway, since every phase overlaps that plan's
  footprint.
- `261122-2108-delete-dead-node-execution-closure` (draft) owns `src/runner/dispatch/**` and
  `apps/fgos/src/wiring/unit_run_host/**`. Phase 2 of this plan writes three files inside those globs:
  `src/runner/dispatch/session-attempt.mjs`, `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` and
  `apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs`, because retiring `envelope.session.verbs` reaches them
  (owner answer `q-nog2h4wfjm`, 2026-11-24). This plan runs first; 2108 rebases onto it on those three files. 2108 is
  `draft`, so the overlap is not an admission error now; it cannot turn `ready` while this plan is active. `261124-1853-confinement-to-rust` holds the confinement work and
  shares only `CHANGELOG.md` with this plan, each written by its plan's last phase.
- `261122-0056-orchestration-skeleton` (draft) shares `src/session-host/head-request.mjs`,
  `core/skills/fgos-supervisor/SKILL.md`, `docs/platform/supervision/spec.md`, `docs/platform/session-host/spec.md`,
  the generated skill surfaces and `CHANGELOG.md`. This plan runs first (discussion hand-off); 0056 rebases onto it on
  those files only. The cross-plan overlap check enforces that order by itself: 0056 cannot turn `ready` while this
  plan is active, so no edit to 0056 is needed.

## Owner questions

None. Every product decision is locked (PC-D1 to PC-D10); the owner may still veto PC-D6, PC-D7 and PC-D8 in the
morning (discussion §1). The planner's own shape choices are written as decisions in phase files 2, 3 and 6.

## Risks and rollback

- **Self-escalation through the window.** `config patch` could widen a grant or the release recipe. Proof point:
  phase 2 makes edits under the grant, confinement and `release` keys a `deny` for every head, one test per deny rule
  (grant keys, a cwd/root/env-changing flag, activate). Validating checks the proof exists.
- **A forwarder regression breaks every head at once.** The window is the one door for all heads. Proof point: the
  live probe of phase 7 calls every verb from five personas before the release is called done; the probe also runs
  on the old release first, before the owner activates the new one, for a baseline.
- **A bad release takes down the supervisor itself.** Phase 6 rolls back on a failed probe; if the supervisor cannot
  come back, Miu's tick sees "no live supervisor" (phase 3) and runs `fgctl repair` through the window (phase 6's
  secretary rule).
- Rollback: every phase lands as its own commit set through the lead; reverting a phase is `git revert` of its
  commits, then a release by the rule (or by the owner before phase 6 lands). The plan as a whole reverts the same way
  in reverse phase order.

## Lead notes

- 2026-11-24 22:05, phase 1 parked: built on branch `heads-operate-without-owner/p01` (3 commits; the acceptance
  `rg` finds nothing). Every land since 21:50 is refused `main-checkout-dirty-overlap` by other sessions' uncommitted
  edits in the main checkout (`plans/261124-1945-run-tests-fgos-leak-check/phase-01-skip-live-runtime-dirs.md`,
  earlier `plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md`); last ticket
  `c-2200-1795532684711`. Supervisor event `60c3b2166d595c39`. Next wake: re-review the branch with a reviewer, then land.
- 2026-11-24 22:05, phase 2 parked: the unit came back blocked (ticket `c-14984-1795531913411`), leaving a half-done,
  uncommitted tree in worktree `261124-0004-heads-operate-without-owner-p02` that must not land as is. Its footprint
  misses `src/runner/dispatch/session-attempt.mjs`, `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` and its
  tests, and the unit sandbox refused cargo and node. Owner question `q-nog2h4wfjm`; supervisor event `c60b8e801d6eae98`.
- 2026-11-24 22:26, phase 1 reviewed and still parked on the land: two fix units (`c-5846-1795532878036`,
  `c-4376-1795533319699`) cleared every blocking review finding; branch tip `1c139c298`, acceptance `rg` finds nothing.
  Land `c-5470-1795533764158` is refused `main-checkout-dirty-overlap` on the uncommitted
  `plans/261124-1945-run-tests-fgos-leak-check/phase-01-skip-live-runtime-dirs.md` in the main checkout. The branch base
  `f999c4018` is 46 commits behind main, and main's commits since then touch that file, so the land counts it as
  written. Two ways clear it: that file gets committed by its owner (owner question `q-3rhc6lroqc`), or the branch is
  synced with main. A sync-only `fgos run --sync main --writes ... --worktree ...` (the form in `run --help`) is
  refused `bad-args` "run takes one prompt", and a prompt plus `--sync main` unit (`c-6366-1795533799302`) ended
  `execution-failure` (`verdict-inconclusive`, exit-11) without merging. Next wake: land again once the file is clean,
  else retry the sync with a fresh unit.
- 2026-11-24 22:26, phase 2 still parked on owner question `q-nog2h4wfjm` (open).
- 2026-11-24 22:40, phase 2: owner answered `q-nog2h4wfjm` "Widen footprint, allow cargo" (written into
  `phase-02-argv-window.md`). Still parked: the footprint edit (three session-attempt files) is a planner's edit, and
  the lead's own `land --paths` may not touch `footprint`. Raised to the supervisor to start a planner; the rerun
  follows in worktree `261124-0004-heads-operate-without-owner-p02`.
- 2026-11-24 22:40, phase 1: land `c-1789-1795534639461` refused `main-checkout-dirty-overlap` again, now on
  `plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md`, because the branch base is 56
  commits behind main. The sync-only `fgos run --sync main --writes ... --worktree ...` (the form in `run --help`) is
  still refused `bad-args` "run takes one prompt" through the request window, and a prompt plus `--sync main` unit
  (`c-2368-1795534729073`) shows the window forwarded the argv without `--sync`, `--plan` and `--phase`, so no merge
  ran (`execution-failure`, `verdict-inconclusive`). Phase 1 stays parked until the shaper commits that discussion
  file, or the window forwards `--sync`. Branch tip `1c139c298`, reviewed, acceptance `rg` finds nothing.
- 2026-11-24 23:00, phase 1: after the supervisor reported the discussion file committed (`e005444fb`), land
  `c-6002-1795535270324` passed every `land.gates` test (170 of 171) and failed only on `--test test/skills`, which
  the gate cannot import as a directory; the test files must be named one by one. The retry naming them
  (`c-6384-1795535457992`) was refused `main-checkout-dirty-overlap` again: the shaper re-dirtied
  `plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md` and it stayed dirty for the whole
  9-minute retry window. Still parked on that file, or on a sync of the branch with main.
- 2026-11-24 23:00, phase 2: the planner's widening landed (`4cce55f61`). Rerun unit `c-7867-1795535626766`
  (claude, `code:implement`, in the p02 worktree) came back `blocked`: the worker's sandbox (bwrap) refuses `cargo`
  with "This command requires approval" (node works), so it changed nothing. No `fgos run` flag widens the worker
  sandbox, so the "allow cargo" half of the owner's answer has no door the lead can use. The p02 worktree is also on
  base `f999c4018` and lacks the planner's phase-file edits, and the window drops `--sync`. Parked on whoever owns
  the worker sandbox's approval list.

- 2026-11-24 23:06, phase 1 done: the watcher landed `heads-operate-without-owner/p01` as `719331230` (ticket
  `c-10969-1795536197308`, every `test/skills` file named) after two `land-target-changed` retries; the worktree was
  removed by the land. Phase 2 waits on owner question `q-qzcq5xti2k` (cargo and node for claude workers).
- 2026-11-25 00:15, supervisor wake: phase 2 stays parked on owner question `q-owq4jhwng7` (open; supersedes
  `q-qzcq5xti2k`, see `phase-02-argv-window.md`); the lead is idle on that verified wait, so it is left live, not
  replaced. Phases 3, 6 and 7 wait behind phase 2.

- 2026-11-25 09:39, phase 2 parked again on owner question `q-nt7ptsq2nd`: the pinned rerun (`q-owq4jhwng7`)
  could not be made, because the request window forwards `run` without `--override` (and without `--timeout`,
  `--sync`, `--plan`, `--phase`); ticket `c-1632-1795574308428` ran on the default `claude-cli-bwrap` and came back
  `blocked` with no change. The recommended option is the owner running the pinned command written in
  `phase-02-argv-window.md` (Lead notes). Phases 3, 6 and 7 wait behind phase 2.

- 2026-11-25 11:22, phase 2 parked on fix ticket `c-29218-1795579848109`: the owner's answers `q-3svd4ttdn7` (commit by
  hand, done as `8c51967e4` on `heads-operate-without-owner/p02`) and `q-ulx4nkztpq` (follow-up item; backlog row
  raised to the supervisor as event `3ff87a2e006f375f`) are written into `phase-02-argv-window.md` and acked. A reviewer
  confirmed the table's parity with `GRANTS`, the decision logic and the Node cleanup, but found three blocking holes in
  the window's deny rules: `--dir` is not refused; `protectedConfigPrefixes` (`grant`, `confinement`, `release`) match
  no real config key; and `config patch` can check one file and apply another. It also found two smaller regressions:
  the `supervisor raise` kind limit and the `--delivered-to` ref were lost. The lead verified the first two holes in
  the source. Fix unit `c-29218-1795579848109` (claude, in the p02 worktree, started 11:10) was still `running` after 12
  waits. Next wake: read that ticket, re-review the branch, then land it, naming the phase's tests.

## Outstanding questions

None open for this plan.
