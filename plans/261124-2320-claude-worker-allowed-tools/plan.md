---
contract: plan-v1
title: "Claude worker units may run cargo, node and npm test through the standard claude-cli-bwrap invocation"
status: running
lead: head:lead-forgent-261124-2320-claude-f6d5c
priority: P1
blockedBy: []
base: caca9a02bc45ef93b8c20a00d0dbe04e2b0e8bee
footprint:
  - plans/261124-2320-claude-worker-allowed-tools/**
  - core/config-standard/runner.yaml
  - test/runner/dispatch.test.mjs
  - CHANGELOG.md
source:
  - plans/discussions/ds-ayxhxswso6-claude-worker-allowed-tools/DISCUSSION.md
  - p-ayxhxswso6
created: 2026-11-24
---

# Claude worker units may run cargo, node and npm test through the standard claude-cli-bwrap invocation

## Outcome

A claude worker started through the `claude-cli-bwrap` invocation can run `cargo`, `node` and `npm test` without
the approval prompt that nobody answers. Phases 2, 3, 6 and 7 of the running plan
`261124-0004-heads-operate-without-owner` can then run their Rust units. The change is one argument added to one
invocation in the standard file `core/config-standard/runner.yaml`. It reaches workers only after a release that
carries the edited standard is staged and activated.

## Acceptance criteria

1. `core/config-standard/runner.yaml`: the `claude-cli-bwrap` args end with `--allowedTools` followed by one value,
   `Bash(cargo:*),Bash(node:*),Bash(npm test:*)`. No other invocation, executor, `confinement`, `credentialStore` or
   `env` key changes. Check with `git diff <base> -- core/config-standard/runner.yaml`.
2. `node --test test/runner/dispatch.test.mjs` passes. Its test of the worker allowlist also reads the standard's
   `claude-cli-bwrap` args and asserts that the grant is exactly those three tools and that no git write grant exists.
3. `npm run fgos:dev -- config check` reports no finding.
4. `npm test` and `cargo test --workspace` pass on the phase branch.
5. `CHANGELOG.md` `## [Unreleased]` has one line about the grant.
6. After the release step in phase 2, a claude unit started with `fgos run` from a linked worktree, bound to
   `claude-cli-bwrap`, runs `cargo --version` and reports its output with no permission refusal. The record goes to
   `plans/261124-2320-claude-worker-allowed-tools/reports/live-cargo-probe.md`.

## Non-goals

- A per-unit allowed-tools field (a separate, larger item; discussion, Non-goals).
- Syncing worktree p02 of plan 0004 with main. The lead of plan 0004 does that before it reruns phase 2.
- Any change to the bwrap posture, to the rule that the runner commits only declared writes, or to other invocations
  (`claude-cli`, `claude-herdr-bwrap`, `claude-herdr-bypass-bwrap`) or other executors (discussion, Constraints).
- A schema change. `core/config-schema/runner.schema.yaml` declares invocation `args` as a list of strings
  (global-only scope, which binds project files, not the standard). `supports.toolGating: allowedTools` is already
  declared for the claude executor, so the flag fits the declared gating.
- The machine-global default executor's own grant (the comma-joined list moved there by commit b26b9b1b0) stays
  as it is.

## Prior art

- Commit b26b9b1b0 removed the old grant from `.fgos/config.yaml`. That grant was one `--allowedTools` value listing
  cargo subcommands, `node --test`, rtk variants and `Skill` on the default executor. The removal was intended: the
  default executor's launch list moved to each machine's global config. The discussion records why a project file
  cannot carry the grant again: `runner.executors.claude.invocations` is global-only, and changing the global file
  would affect every project on the machine.
- The format reused is that old one: a single comma-joined value after `--allowedTools`. The existing owning test
  in `test/runner/dispatch.test.mjs` ("grants the worker acceptEdits plus test commands only") already parses that
  shape. Putting the flag last in argv with a single value also keeps the variadic `--allowedTools` from consuming
  anything after it. The three tools are exactly those the owner chose (q-nog2h4wfjm, q-qzcq5xti2k, option 2).
- Missing before this plan: no test checks the standard invocation's grant, and the existing test's pattern does not
  allow `Bash(npm test:*)`. Phase 1 extends that one test and adds no new one (design principle 8).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| The standard `claude-cli-bwrap` invocation grants the confined headless claude worker `Bash(cargo:*)`, `Bash(node:*)` and `Bash(npm test:*)` | config | A default value in `core/config-standard` (the config component's standard). There is no new decision, function, verb or contract. `fgos authority locate` also returns `runner`, which consumes the args unchanged. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Grant in the standard invocation, its proof and the changelog line](phase-01-standard-grant.md) | - | core/config-standard/runner.yaml, test/runner/dispatch.test.mjs, CHANGELOG.md | 1 | done |
| 2 | [Release and live cargo probe](phase-02-release-and-live-probe.md) | 1 | plans/261124-2320-claude-worker-allowed-tools/reports/live-cargo-probe.md | 2 | draft |

## Progress

- 2026-11-25: phase 1 `done`, landed on main at `29dd50475`
  ([report](reports/lead-261125-1111-claude-worker-grant-phase-01.md)). The full `npm test` and
  `cargo test --workspace` were not run, because the lead's confinement cannot build the addon or the workspace.
  The owning dispatch test, the land gate and the `fgos-config` crate tests pass.
- 2026-11-25: phase 2 parked on the owner or the unconfined supervisor. They stage and activate a release from main
  at or after `29dd50475`, and run the full `npm test` and `cargo test --workspace` there. Then the live cargo probe
  can run.
- 2026-11-25: owner answered q-nii67wdhv3 with option 1: the owner opens one unconfined `lead:SUPERVISOR`
  session. Once `fgos identity resolve lead:SUPERVISOR` finds it, the supervisor sends it the release build, stage
  and activate from main (>= `29dd50475`), `npm test`, `cargo test --workspace`, and then starts the live cargo
  probe. At 11:27 no such session was live yet; phase 2 stays parked on it.

Checks made under the table: `node scripts/plan-contract-check.mjs --plan plans/261124-2320-claude-worker-allowed-tools`
and `fgos resource-check --plan plans/261124-2320-claude-worker-allowed-tools`. The two phases sit in different waves,
and phase 2 writes only its report.

Overlaps with other plans:

- `261124-0004-heads-operate-without-owner` (running) has `CHANGELOG.md` in its footprint (its phase 7). That is the
  only shared path. Because of it this plan stays `draft`, as the discussion directs ("otherwise `draft` with the
  reason"). The contract check reads an overlap between a `ready` plan and a running plan as an error.
  `blockedBy: 261124-0004` would deadlock, because plan 0004's phases 2, 3, 6 and 7 wait on this plan. The fix is a
  one-line append under `## [Unreleased]`. Phase 1 alone is marked `ready`, so the supervisor can admit it. Two
  routes clear the overlap, and either is the supervisor's call. One: admit phase 1 by hand and land the changelog
  line after re-reading main. Two: the lead of plan 0004 drops `CHANGELOG.md` from its phase-7 footprint until this
  plan lands.

  **Admitted 2026-11-25 by owner order (supervisor):** route one. The lead runs phase 1 now and lands the
  `CHANGELOG.md` line after re-reading main; plan 0004 keeps its footprint.
- `261122-2108-delete-dead-node-execution-closure` (draft, not active) owns `test/runner/dispatch.test.mjs`. It is
  not an active overlap today. Whichever plan lands second rebases on the other's version of that test.
- `.fgos/config.yaml`, owned by plan 0004 phase 6, is not touched here.

## Owner questions

None. The owner settled the grant and where it lives (q-nog2h4wfjm, q-qzcq5xti2k, option 2). The open question
q-owq4jhwng7 (which route reruns plan 0004 phase 2) is answered by this plan's route. The supervisor closes it when
phase 2 here records the live probe.

## Outstanding questions

None

## Risks and rollback

- **The grant reaches no worker until a release.** Workers run the activated release's standard, not the checkout's.
  Phase 2 names who releases: the owner, or the unconfined supervisor session. A confined head cannot stage or
  activate a release.
- **Another golden or snapshot embeds the standard `claude-cli-bwrap` args.** The scan found none that read the
  standard directly. `test/runner/dispatch-policy-baseline-snapshot.test.mjs` and
  `packages/config/rust/tests/detect_path.rs` declare their own descriptors. If the full gate shows a recorded vector
  derived from the standard, regenerate it with its recorder (for example
  `node test/golden-recorders/core-runner-config.recorder.mjs`), never by hand. If that regeneration needs a path
  outside the phase footprint, stop and report `DONE_WITH_CONCERNS` so the footprint is widened in the plan first.
- **`Bash(node:*)` is broad.** It lets the worker run any node script inside the bwrap confinement. The owner chose it
  knowing this. Confinement and the declared-writes commit rule still bound what can land.
- **Rollback:** revert the phase-1 commit (one commit touching three files). Workers lose the grant at the next
  release made from the reverted tree.
