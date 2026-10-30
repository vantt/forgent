---
title: "Human gates in two levels: one Rust gate door decides, Work only shows"
description: "Move gate-bypass and gate-check to Rust, then build one gate door (decide, ask, grant, require) on the Event Store, decide risk from facts, and retire self-declared approvals and the risk-keyword gates."
status: pending
priority: P2
effort: 12d
branch: main
tags: [harden, gate, work, workflow, rust, event-store, iron-law]
created: 2026-10-30
---

# Human gates in two levels

Owner decision 55 (`plans/261021-1118-harden-low-layers-bottom-up/plan.md:257`), shape
[brainstorm-261029-1743](../reports/brainstorm-261029-1743-harden-gate-two-levels-shape.md)
(its section "Owner answer and HARDEN's challenge" overrides earlier sections), facts
[research-261029-1740](../reports/research-261029-1740-harden-gate-two-levels-facts.md).
Nothing is built by this plan. It is written now and built with the Work batch after T5 (3a).

## Outcome

- One Rust component, the **gate door** (`packages/gate/rust`, crate `fgos-gate`), is the only authority that decides whether a guarded step needs a human, records the question, accepts a human answer and refuses a guarded step that has no matching grant.
- The gate door is the only writer of gate events. They ride the Event Store, so a grant made on one machine reaches an agent on another and outlives the asking session.
- Work and the dashboard only show gate events. No code decides from the Work view.
- Risk comes from facts of the action (written paths against one path-class table, deletions, reach outside the worktree, size), never from words. `src/intake/risk-keywords.mjs` leaves every gate, Iron Law included (RUL35 superseded).
- An agent can no longer approve itself by typing a flag.

## Non-goals

- No new human channel beyond the three of decision 55 (hook on the real `AskUserQuestion` result, dashboard, CLI from a non-agent session).
- No change to `ironLaw.level` semantics (RUL64) or to the test-first proof the Iron Law asks for; only its risk input changes.
- No change to the Work `awaiting-human` status machine (FSM edges stay); only what releases a consent park changes.
- No Workflow ledger cutover to the Event Store (RUL-WF-24 / F10 stays as is). Gate events live in the gate door's own stream, not in the case ledger.

## Phases

| # | Phase | Depends on | Parallel with | Owner/lane that must agree | Status |
|---|---|---|---|---|---|
| 01 | [Rust gate crate: level reader and native `gate-check`](phase-01-rust-gate-crate-level-and-check.md) | T5 closed (Work batch opens), or WORK agrees earlier | none | WORK (files under `src/state/`, `packages/work-state`) | pending |
| 02 | [Gate log on the Event Store, frames, `require`, CLI channel; Workflow consent moves onto it](phase-02-gate-log-frames-and-workflow-consent.md) | 01 | none | WORK; AGENT-WF (Workflow files); lead:ES (consumer registration); Git/OPC (addon module); IDENT (non-agent session check, CLI channel) | pending |
| 03 | [Human channels: Claude hook, dashboard, Work `answer --approve`; MCP approve removed](phase-03-human-channels.md) | 02 | 04 | WORK; MAIL told (hook table, possible move of the caller check) | pending |
| 04 | [Risk from facts; Iron Law on the same facts; keyword list retired](phase-04-risk-from-facts.md) | 02 | 03 | WORK; runner owner for Iron Law; Config owner for the new key | pending |
| 05 | [Guarded Work doors call `require`; Work drops its approval fields](phase-05-work-intake-doors-require.md) | 03, 04 | 06 | WORK (Work batch) | pending |
| 06 | [Merge consent at `fgos approve` on the real diff](phase-06-merge-consent-at-approve.md) | 03, 04 | 05 | WORK; Git/OPC reviews (land path); `fgos-fanout` skill owner | pending |
| 07 | [Skills, dashboard display, `gate-approve` removal](phase-07-skills-dashboard-and-gate-approve-removal.md) | 05, 06 | 08 (docs only) | WORK; coding-domain skills owner; dashboard owner | pending |
| 08 | [Specs, decision supersede, CHANGELOG](phase-08-docs-specs-changelog.md) | 05, 06 (final behaviour) | 07 | DOC (if `docs/` freeze still holds) | pending |

Parallel pairs have disjoint file sets (listed per phase): 03 owns the gate crate's `lib.rs` and `channel.rs`, the host hook wiring, the hook table, the gateway and the `answer` verb; 04 owns `decide.rs`, the config section, the Iron Law files and `classify.mjs`; 05 owns `src/intake/`, `src/state/` and `src/verbs/state/read.mjs`; 06 owns `src/verbs/merge/`, `src/runner/iron-law-gate.mjs` and the fanout skill with its renders; 08 owns `docs/` and `CHANGELOG.md`. Every other pair runs in order.
Phase 01 can land alone (drop A). Phases 02 to 08 land together (drop B), because 02 adds the door and only 05 to 07 delete the paths it replaces (L10 across the drop, see "Landing").

## Prior art (what existed, what is reused, what is missing)

Searched with `git log -S` on `gate-bypass`, `gateApprove`, `human-consent`, `HEAVY_KEYWORDS`, `canAutoApproveMergedGate`, `readGateBypassLevel`, `read_gate_bypass_level`, `gateCheckUseCase`.

| Prior art | Where | Reused how |
|---|---|---|
| Workflow consent guard, digest-bound (`human-consent`, refusals `consent-missing`, `consent-stale`, `consent-subject-unknown`) | `src/workflow/case-admission.mjs:153-162`, milestone fold `src/workflow/case-projection.mjs:109-117,158-163`, added in `5b2b91044` | The model of `require`. Phase 02 moves it into the gate door and keeps its three refusal names. Its subject digest (`stepSubjectDigest`, `src/workflow/unit-handoff.mjs`) is the exact-digest binding. |
| Workflow approved frame (scope, effects, consent points, countable budget, RUL-WF-12) | `docs/specs/workflow.md:104,259`; `src/workflow/case-start.mjs:44` `resolveFrame`; `src/workflow/case-frame.mjs` | The grant's frame uses the same vocabulary as `core/skills/_shared/decision-question.md:17-21` and RUL-WF-12. No second frame notion. |
| Rust level reader with config-then-legacy fallback | `packages/work-state/rust/src/lib.rs:66-114` (`28de422a3`, native route `05b6bf861`) | Moved, not rewritten, into `fgos-gate` in phase 01. |
| `gate-check` CLI wrapper (tsk-65q) | `bin/fgos.mjs:2379-2394`, `src/verbs/state/read.mjs:28-41` (`71b50a2f2`) | Same flags, now native. |
| Iron Law module list (hardcoded path classes) | `src/evolve/iron-law.mjs` `MODULE_RULES` | Becomes the fgOS project's own rows of the path-class table (phase 04). |
| Event Store consumer with no Node cache (mailbox) and `project:<name>` streams | `packages/event-store/contracts/consumers.v1.json`; `docs/platform/event-store/spec.md:158,188-193` | Gate consumer registered the same way (phase 02). |
| Hook caller check and its same-user limit | `packages/mailbox/rust/store/src/head.rs:164` `caller_is_head`; `docs/platform/agent-mailbox/spec.md:448` | Reused by the hook channel (phase 03); the same limit is stated, not hidden. |
| Session identity, CLI of a session | `packages/identity/rust/src/current.rs:148`, `resolve.rs:210` `ancestry_cli`, `session.rs:50` | The non-agent check of the CLI channel (phase 03). |
| `decision-question` PreToolUse hook | `src/setup/agent-hooks.mjs:121`; `bin/fgos.mjs:5049` | The question form check stays; the new PostToolUse row sits beside it. |
| gate-bypass history D1-D11, tsk-224 keyword measurement (83.6% false trigger) | `docs/history/gate-bypass/CONTEXT.md`, `docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` | D2 (mechanical open-items check) and D11 (monotone toward asking) are kept. D1 ("never the awaiting-human park") and D4 (keyword floor non-negotiable) are superseded by decision 55. |

Missing today, built here: a writer of gate events that only the door owns; a grant that crosses machines; a refusal at the guarded verb for the two skill gates and at merge; facts-based risk; a channel check on human answers.

## Data flow (end state)

1. A guarded caller (skill via `fgos gate-check`, discovery advance, decompose, `fgos approve`, Workflow admission) builds a **subject**: kind, work or case id, facts (declared writes and capability before work; real diff at merge), optional digest, hint text.
2. `decide(subject)` reads policy once (bypass level, path-class table, open items, self-reported cost) and returns `auto`, `ask` or `deny` with reasons. `auto` appends `gate.auto` (a policy grant).
3. `ask(subject, question, approve option)` appends `gate.asked`. The Work item may also park (`awaiting-human`, display and frontier only).
4. A human answers through one of three channels. The door checks the channel and appends `gate.granted` (frame or digest) or `gate.declined`.
5. The guarded step calls `require(subject)`. The door folds its stream and refuses with a named reason unless a grant covers the subject (inside the frame, or the same digest at merge).
6. Dashboard, `fgos show`, observe and the scorecard read the door's projection. Nothing decides from it except `require`.

## Acceptance criteria

- `rg -n "readGateBypassLevel|canAutoApprove|gateCheckUseCase|recordGateApprove|risk-keywords" src bin core domains` returns no production hit, and `HEAVY_KEYWORDS` appears only in `src/intake/classify.mjs` as a non-gating size hint (Q2 a) or nowhere (Q2 b).
- `fgos gate-check` and `fgos gate-bypass` are native routes; `test/rust-host/command-routes.test.mjs` shows no `legacy-node` route for either; `gate-approve` has no route.
- A guarded step with no grant is refused by the verb, by name (proof per door in phases 02, 05, 06).
- `fgos answer --approve` from an agent session writes no grant and says why; the same command from a plain terminal writes one (phase 03 proof).
- A grant written on machine A is honoured by `require` on machine B after one Event Store sync (phase 02 two-store proof).
- A rebase or typo fix inside the approved frame does not ask again; a write to a path outside the frame or in a higher risk class does (phase 02 and 04 proofs).
- `npm test` and `cargo test --workspace` green on the drop-B merge; net Node size of the plan below zero (sum of phase net lines).

## Net size (estimate, sum of phase lines)

Node (`src/`, `bin/`): about -650. Rust (`packages/`, `apps/`): about +1,360 (the new component, approved by decision 55; Node pays for part of it). Tests: about -130. Skill and task prose: about -165. Docs: about +370. The plan grows Rust and shrinks Node, prose and tests, which is the direction of the HARDEN size rule when authority moves to Rust (Node deciding copy deleted in the same drop).

## Landing

- **Drop A (phase 01)** and **drop B (phases 02-08)** each land on fg-server2 by self-land after a full gate: `npm test` and `cargo test --workspace` green on the merge result, plus clippy `-D warnings`, the msvc and `aarch64-apple-darwin` compile checks and the one-door census scan (land-gate checks). Then build, stage and activate the release; run `fgos doctor` through the installed shim.
- **Owner machine:** a Vietnamese guide per drop under `plans/reports/` (path from `fgos convention path`), linked on the board, listing pull, build, activate, doctor, the one smoke per drop (drop A: `fgos gate-bypass`, `fgos gate-check`; drop B: ask from an agent, answer from the dashboard on the other machine, `require` passes) and the rollback below.
- **Board:** at build start, the lane row and one log line in the program board (only then, per AGENTS.md).
- **On-disk format changes (drop B only):**
  - new Event Store stream `project:gate` with types `gate.asked`, `gate.auto`, `gate.granted`, `gate.declined` (sealed and pushed; the previous release never reads that stream, Work reads only its own);
  - Workflow `gate-answers/<step>.rounds/*.json` files keep the answer text but no longer carry the approval; new rounds omit `approved`, old rounds with it are read as text only;
  - Work stops appending `work.gate-approve` and the `approved` flag on `work.move`; old events stay in history and replay unchanged;
  - new config key `riskPaths` (schema-checked; the previous release's config door refuses an unknown key only if strict — checked in phase 04 step 1);
  - if the owner picks Q1(a), `.fgos/gate-bypass.json` is no longer read.
  Drop A changes no on-disk format.
- **Rollback:** revert the drop's merge commit and re-activate the previous release on every workspace and both machines; record the revert SHA. Before drop B lands, rehearse on a full clone: write gate events with the new release, activate the previous release, run `fgos events status`, `fgos doctor` and one `fgos list` (memory "rehearse the real write"). A previous release must ignore `project:gate`; if it refuses, drop B ships a fence first.

## Risks (plan level)

| Risk | L x I | Mitigation |
|---|---|---|
| Same-user limit: an agent can deliberately fake a hook payload or run `fgos answer` from a detached terminal | M x H | Channel checks raise the bar from a flag to a deliberate forge; grants record channel and session; Q3 asks whether that is enough |
| Cross-machine grant arrives late (sync cadence) | M x M | `require` refusal names `grant-not-synced-yet` hint when a pending ask exists; `fgos events sync` is the fix; sealOnWrite for `gate.granted` |
| Frame matching too loose (risky change slips inside a frame) | L x H | Risk class is part of the frame; merge-time check on the real diff is mandatory and digest-exact (phase 06) |
| Drop B is large and crosses five lanes | H x M | Phases land on one branch in order; each phase has its own focused proof; parallel only where files are disjoint |
| Previous release breaks on the new stream | L x H | Rollback rehearsal above before landing |
| Owner-machine workspaces with only `.fgos/gate-bypass.json` drop to `off` | M x L | Q1; fail direction is toward asking |

## Open questions for the owner

Only questions decision 55 does not answer. Each follows `core/skills/_shared/decision-question.md`.

**Q1. The legacy `.fgos/gate-bypass.json` file**
- **What is happening:** the bypass level is read from shared config, and when nothing set it there, from a standalone legacy file `.fgos/gate-bypass.json` (`packages/work-state/rust/src/lib.rs:88-98`, `src/state/gate-bypass.mjs:74-93`). Phase 01 moves that reader into one Rust function.
- **Cause:** the file predates shared config; `fgos config migrate` moves `config.json` to YAML but does not fold this file in (`packages/config/rust/src/migrate.rs`, no hit for it). The shape report left its fate to you because it changes how a user sets the level.
- **Options:** (a) delete the fallback in phase 01; a project that only has the file falls back to `off` (more questions, never fewer) until someone runs `fgos config set gateBypass.level <v>`; cost: one line in the owner-machine guide and the CHANGELOG, about 30 Rust lines and 2 tests less. (b) keep it inside the one Rust reader; cost: a second place a user's setting can hide, kept forever.
- **Recommendation:** (a). It fails toward asking, and the guide tells each workspace the one command.
- **Scope of the answer:** phase 01 only; nothing else reads the file.

**Q2. The intake size hint after the keyword list leaves the gates**
- **What is happening:** `classify.mjs` uses the heavy keyword list to set a temporary size `heavy` at submission (`src/intake/classify.mjs:66-70`). That `risk: heavy` raises review rigor (`src/state/replay.mjs:161,458`, `src/runner/loop.mjs:1597`) and the dispatch tier (`src/runner/work-dispatch.mjs:370`), and today it also triggers the heavy-risk park in `plan.mjs:737`. Phase 05 removes the park's use of it; rigor and dispatch tier are not gates.
- **Cause:** decision 55 retires the list from every gate. Rigor and tier are not gates, so the decision does not say whether the list survives as a hint.
- **Options:** (a) move the list into `classify.mjs` beside its `LIGHT_KEYWORDS` and `KIND_KEYWORDS` (one consumer, one file), delete `src/intake/risk-keywords.mjs`; cost: about zero lines net, rigor behaviour unchanged. (b) delete the heavy list entirely; submissions never start `heavy`, rigor and dispatch tier rise only from the discovery judgment; cost: a behaviour change in rigor for early items, about 40 lines less.
- **Recommendation:** (a). It keeps rigor as it is and still leaves no keyword in any gate; (b) changes rigor, which is outside this plan's frame.
- **Scope of the answer:** phase 04 and the RUL35 supersede text in phase 08.

**Q3. How strong "unforgeable" must be inside one OS user**
- **What is happening:** the three channels of decision 55 check who answers: the hook verifies it was called by the agent CLI host for a real `AskUserQuestion` result; the CLI verifies the session has no agent CLI in its environment or process ancestry; the dashboard is authenticated by the gateway.
- **Cause:** every process of the same OS user can, with deliberate effort, start a detached terminal (`tmux new -d`, `setsid`) or feed a made-up hook payload. The mailbox spec records the same limit for its hook (`docs/platform/agent-mailbox/spec.md:448`). Only the dashboard path needs a secret the agent does not hold (the gateway token in `~/.fgos/private/`, readable by the same user, though).
- **Options:** (a) accept the same-user limit, record channel and session on every grant, and say so in the gate spec; cost: none beyond phase 03. (b) for grants in the highest risk class, accept only the dashboard channel; cost: one more rule in `decide`, and on Codex and agy you must open the dashboard for every risky approval. (c) sign grants with a key held outside the user's reach (OS keyring prompt); cost: a new mechanism and a prompt on every approval.
- **Recommendation:** (a). The goal of decision 55 is to stop habitual self-approval, which a flag made trivial; a deliberate forge is visible in the grant record.
- **Scope of the answer:** phase 03 and the gate spec text in phase 08.

**Q4. The path-class rows shipped to every project**
- **What is happening:** phase 04 adds one config table `riskPaths` (project over global). fgOS's own rows (today's Iron Law `MODULE_RULES`, the Git and lock cores) go into this repository's `.fgos/config.yaml`. The bundled standard is what every other project gets.
- **Cause:** decision 55 names the classes (migrations, schema, CI, credentials, public contracts, Git and lock cores) but not which patterns fgOS ships to projects that set nothing.
- **Options:** (a) ship a small generic set: `**/migrations/**`, `**/*.sql`, `.github/workflows/**`, `**/.env*`, `**/*secret*`, `**/*.pem`, lockfiles excluded; projects add their own; cost: some risky paths of a project go unnoticed until it adds rows. (b) ship an empty standard; every project must write its own; cost: no fact-based risk at all on projects that never configure it. (c) ship a large list covering many stacks; cost: false asks, the problem the keyword list had.
- **Recommendation:** (a), plus the merge-time diff check, which still asks on deletions, size and reach outside the worktree even with no path rows.
- **Scope of the answer:** `core/config-standard/riskPaths.yaml` in phase 04 only.
