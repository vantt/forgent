---
contract: plan-v1
title: "Heads operate without the owner: role charter for the two hands, one fgos argv window with a permission table, one help channel and mail to the two hands, cage review, and a domain-free release rule"
status: draft
priority: P1
blockedBy:
  - 261121-2110-component-authority-doors
  - 261122-0118-heads-stable-and-able
base: e250e79a7e853af443edf91f225d94d1815db6e6
footprint:
  - plans/261124-0004-heads-operate-without-owner/**
  - docs/platform/supervision/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/agent-confinement/spec.md
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
  - src/session-host/head-grants.mjs
  - src/session-host/head-request.mjs
  - src/session-host/head-request-client.mjs
  - src/session-host/head-release.mjs
  - packages/session-host/contracts/head-permissions.v1.json
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - apps/fgos/src/routing.rs
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-request.test.mjs
  - test/session-host/head-release.test.mjs
  - test/live/head-grant-probe.live.mjs
  - src/runner/dispatch/confinement/drivers/bwrap.mjs
  - src/runner/dispatch/confinement/workspace-paths.mjs
  - src/runner/dispatch/confinement/resources.mjs
  - test/runner/dispatch-confinement-*.test.mjs
  - core/config-standard/secretary.yaml
  - core/config-schema/secretary.schema.yaml
  - core/config-standard/release.yaml
  - core/config-schema/release.schema.yaml
  - .fgos/config.yaml
  - CHANGELOG.md
source:
  - plans/discussions/privileged-chores-research/DISCUSSION.md
  - p-g5ktat4kej
  - p-v6xinnjoxh
  - p-dw3h5wscns
  - p-ndortdckid
  - p-ia2v33b54u
  - p-btxvtb34u3
  - p-oqs75qwyco
created: 2026-11-24
---

# Heads operate without the owner

Mode: standard. Decisions cited by their discussion ids (PC-D1 to PC-D10) from
`plans/discussions/privileged-chores-research/DISCUSSION.md`; none is reopened here.

## Outcome

The secretary (Miu, the right hand) and the supervisor (the left hand) can do the routine privileged chores the owner
runs by hand today, and every head has one channel to ask for help:

- The supervisor looks after every agent that has no lead (PC-D2). Miu keeps the same power asleep and uses it only
  when no supervisor can act, to bring the machinery back (PC-D1). Both rules are written in the specs, skills, agent
  descriptions and grant comments, and no sentence says the opposite.
- Anything that touches shared state (`.git` of main, `.fgos`, config, worktrees, the release) goes through one
  window: the head sends an `fgos` argv over its request socket, the run supervisor looks it up in one data table
  `persona x fgos verb prefix -> allow | ask | deny` with inheritance (head < supervisor < secretary), and `allow` runs
  it with no shell, `ask` becomes an owner question carrying the exact argv, `deny` refuses with a reason (PC-D3,
  PC-D6). `fgos can-i <argv>` answers before acting. The 28 hand-written branches that only forward are gone, and
  `SUCCESSOR_READ_VERBS` is a column of the same table.
- Every persona may `supervisor raise` a `coordination-help` event; leads and planners may mail the two hands and only
  them; Miu's 15-minute tick also asks "is a supervisor alive?" and "is a help request older than the threshold?" and
  takes over when either is true (PC-D5, PC-D8).
- Each cage holds the role's own work (PC-D7): the project's declared verify commands run inside it, owner answers,
  mail and friction work from it, and a peers-granted head no longer keeps the host pid namespace.
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

## Prior art (reused, missing)

Reused: the persona table and its one reader `grantOf` (`src/session-host/head-grants.mjs`); the request socket, its
contract and its Rust enforcement (`head-request.v1.json`, `head_request.rs`); the `coordination-help` raise kind,
already in the contract; the self-protecting doors `worktree remove --delivered-to`, `git recover`,
`config patch --project-only`, the main-checkout lock and the `.fgos` ban in `validateWorkspacePaths`; the live grant
probe of plan 0118 phase 11; `fgctl repair` as the rollback door (it reactivates the previous release,
`previousArtifactDigest`); `land.gates` as the forgent recipe's checks; Miu's `/loop 15m` tick; the `friction record`
and `questions answer` socket verbs (plan 0118 phase 2), which phase 4 re-proves rather than rebuilds.

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
| Permission table `persona x verb prefix -> allow/ask/deny` as data | `declare: contract session-host-head-permissions-v1` | Read only by `grantOf`; overlaps the verb lists in `GRANTS`, survivor: `declare: contract session-host-head-permissions-v1`; retired: `src/session-host/head-grants.mjs` verb arrays |
| Argv forwarder replacing the forward-only branches | `session-host`, `run-supervisor/head-request.v1` | Overlaps the 28 `case` branches, survivor: `run-supervisor/head-request.v1` forwarder; retired: forward-only branches of `runHeadRequest` in `src/session-host/head-request.mjs` |
| `SUCCESSOR_READ_VERBS` as a table column | `run-supervisor` | Overlaps the Rust constant, survivor: `declare: contract session-host-head-permissions-v1` read flag; retired: `SUCCESSOR_READ_VERBS` in `packages/run-supervisor/rust/src/head_request.rs` |
| `fgos can-i <argv>` | `session-host` | Answered from the envelope's rules by the run supervisor, like `session bind session` |
| Help channel and Miu takeover threshold | `supervision`, `config` | `secretary.help.staleMinutes`, new key in `core/config-standard/secretary.yaml` |
| Lead and planner mail limited to the two hands | `agent-mailbox`, `session-host` | |
| Cage changes (verify commands, pid namespace) | `agent-confinement` | |
| Release recipe as project data | `declare: contract config-release-v1` | Keys in `core/config-standard/release.yaml`; domain-free |
| Release policy branch of the window | `session-host`, `packaging-distribution` | Applies through `fgctl upgrade` and rolls back through `fgctl repair`, both existing doors |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Role charter for the two hands](phase-01-role-charter.md) | - | docs/platform/supervision/spec.md, docs/platform/session-host/spec.md, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, core/agents/secretary.yaml, core/agents/supervisor.yaml, .claude/agents/secretary.md, .claude/agents/supervisor.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 1 | draft |
| 2 | [The fgos argv window and its permission table](phase-02-argv-window.md) | - | src/session-host/head-grants.mjs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, packages/session-host/contracts/head-permissions.v1.json, packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, apps/fgos/src/routing.rs, test/session-host/head-grants.test.mjs, test/session-host/head-request.test.mjs, test/live/head-grant-probe.live.mjs, docs/platform/run-supervisor/spec.md | 1 | draft |
| 3 | [Help channel and mail to the two hands](phase-03-help-and-mail.md) | 1, 2 | packages/session-host/contracts/head-permissions.v1.json, src/session-host/head-grants.mjs, test/session-host/head-grants.test.mjs, test/session-host/head-request.test.mjs, core/config-standard/secretary.yaml, core/config-schema/secretary.schema.yaml, core/skills/fgos-secretary/SKILL.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/**, docs/platform/supervision/spec.md | 2 | draft |
| 4 | [Cage: the role's own work runs inside](phase-04-cage-loosen.md) | 2 | src/runner/dispatch/confinement/workspace-paths.mjs, src/runner/dispatch/confinement/resources.mjs, test/runner/dispatch-confinement-policies.test.mjs, plans/261124-0004-heads-operate-without-owner/reports/cage-before-after.md | 2 | draft |
| 5 | [Cage: a peers head keeps its own pid namespace](phase-05-cage-tighten.md) | 4 | src/runner/dispatch/confinement/drivers/bwrap.mjs, src/runner/dispatch/confinement/resources.mjs, test/runner/dispatch-confinement-machine-private.test.mjs, docs/platform/agent-confinement/spec.md, plans/261124-0004-heads-operate-without-owner/reports/cage-pid-namespace.md | 3 | draft |
| 6 | [Domain-free release rule and the forgent recipe](phase-06-release-rule.md) | 3 | src/session-host/head-release.mjs, src/session-host/head-request.mjs, packages/session-host/contracts/head-permissions.v1.json, packages/run-supervisor/contracts/head-request.v1.json, test/session-host/head-release.test.mjs, core/config-standard/release.yaml, core/config-schema/release.schema.yaml, .fgos/config.yaml, core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-secretary/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 3 | draft |
| 7 | [Integration, full suite and live probe](phase-07-integration.md) | 1, 2, 3, 4, 5, 6 | CHANGELOG.md, plans/261124-0004-heads-operate-without-owner/reports/head-grant-probe.md, plans/261124-0004-heads-operate-without-owner/reports/integration.md | 4 | draft |

Wave reading (checked with `node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`): wave 1 holds
the charter (docs, skills, agent sources) and the window (session-host code, contracts, routing), whose footprints
are disjoint. Wave 2 holds the help-and-mail phase, which edits the table and both skills after both wave-1 phases,
beside the cage loosen, which owns only confinement files. Wave 3 holds the pid-namespace tightening, which owns
`bwrap.mjs` and `resources.mjs` after phase 4, beside the release rule, which owns the release files, the table and the
skills after phase 3; the two share no path. The generated skill surfaces (`.agents/skills/**`, `plugins/fgOS/skills/**`,
`.claude/skills/**`) are hot: they are regenerated with `npm run build:skills` by phases 1, 3 and 6 only, which sit in
waves 1, 2 and 3, one writer per wave. `CHANGELOG.md` is written only by phase 7.

Order against other plans:

- `261121-2110-component-authority-doors` (running) and `261122-0118-heads-stable-and-able` (running) own
  `src/session-host/head-request.mjs`, `src/session-host/head-grants.mjs`, the secretary skill, the live probe, the
  generated skill surfaces, the confinement directory and `CHANGELOG.md`. This plan is `blockedBy` both and stays
  `draft` until both are `done`; the planner (or the supervisor on its wake) then flips `status: ready` once the check
  passes with no cross-plan overlap. The discussion's reading that phases T2, T4, T5 and T6 avoid the doors plan does
  not hold: every one of them regenerates the skill surfaces or edits the confinement files that plan owns.
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
  before (phase 4's report) for a baseline.
- **A bad release takes down the supervisor itself.** Phase 6 rolls back on a failed probe; if the supervisor cannot
  come back, Miu's tick sees "no live supervisor" (phase 3) and runs `fgctl repair` through the window (phase 6's
  secretary rule).
- **Pid-namespace tightening breaks peer messaging for Miu.** Phase 5 proves ListAgents and SendMessage both ways
  before it removes the host pid space; if it cannot, it stops and leaves the grant as is with a report, and the row
  `p-oqs75qwyco` stays open.
- Rollback: every phase lands as its own commit set through the lead; reverting a phase is `git revert` of its
  commits, then a release by the rule (or by the owner before phase 6 lands). The plan as a whole reverts the same way
  in reverse phase order.

## Outstanding questions

None
