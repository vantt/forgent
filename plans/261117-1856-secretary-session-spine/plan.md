---
contract: plan-v1
title: "Secretary Miu, one start door and host port for head sessions, automatic session rotation"
status: draft
priority: P1
blockedBy: []
footprint:
  - plans/261117-1856-secretary-session-spine/**
  - docs/platform/session-host/**
  - packages/session-host/**
  - docs/platform/component-boundary.md
  - docs/reading-map.md
  - src/runner/agent-definitions.mjs
  - src/runner/dispatch/assignment.mjs
  - test/runner/agent-definitions.test.mjs
  - packages/convention/**
  - docs/platform/convention/**
  - docs/history/*/DISCUSSION.md
  - docs/discussions/**
  - domains/coding/skills/**
  - core/skills/_shared/plan-contract.md
  - src/report/context-render.mjs
  - src/report/authoritative-match.mjs
  - src/state/work.mjs
  - src/state/frontier.mjs
  - src/state/worker-slots.mjs
  - bin/fgos.mjs
  - plugins/fgOS/skills/**
  - .agents/skills/**
  - .claude/skills/**
  - .claude/agents/**
  - .claude/settings.json
  - packages/terminal-control/**
  - src/terminal-control/**
  - test/terminal-control/**
  - docs/platform/terminal-control/**
  - packages/identity/**
  - docs/platform/identity/**
  - core/skills/fgos-shaping/**
  - core/skills/fgos-clarifying/**
  - core/skills/fgos-secretary/**
  - core/skills/handoff/**
  - core/agents/secretary.yaml
  - src/session-rotation/**
  - test/session-rotation/**
  - core/config-standard/sessionRotation.yaml
  - core/config-schema/sessionRotation.schema.yaml
  - docs/architecture-manifest.json
  - Cargo.toml
  - Cargo.lock
  - apps/fgos/**
  - src/session-host/**
  - test/session-host/**
  - src/state/domain-registry.mjs
  - test/state/**
  - test/intake/**
  - packages/run-supervisor/**
  - src/run-supervisor/**
  - test/run-supervisor/**
  - src/runner/dispatch/herdr-round.mjs
  - src/runner/dispatch/cli.mjs
  - src/runner/dispatch/terminal-slot.mjs
  - test/runner/dispatch-terminal-slot.test.mjs
  - docs/platform/run-supervisor/spec.md
  - scripts/fgos-session-start-hook.mjs
  - scripts/fgos-session-rotation-hook.mjs
  - src/setup/agent-hooks.mjs
  - packages/distribution/contracts/agent-hooks.v1.json
  - packages/distribution/contracts/doctor-registry.v1.json
  - test/setup/agent-hooks.test.mjs
  - src/portfolio/**
  - test/portfolio/**
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - test/cli/**
  - packages/git/contracts/mutation-census.v1.json
  - CHANGELOG.md
base: b704fdd08e7cbb54a6b3a023eafcd80f7dd19341
source:
  - docs/discussions/secretary-miu/DISCUSSION.md (hand-off block, SM-D1..SM-D13, section 7)
  - p-r4u2ewexvn
  - plans/reports/research-261117-1624-handoff-skills-research.md
  - shaper notes 2026-11-17 (main d77ca29aa) — existing `fgos session` verb collision; Terminal Control launch_line quoting; opening prompt typed visibly in a pane
created: 2026-11-17
---

# Secretary Miu, one start door and host port for head sessions, automatic session rotation

The plan is `draft` because two owner questions are open (section "Owner questions"). They block only phases 10, 15,
16, 17 and the integration phase 18. Every other phase is `ready` and may start now.

## Outcome

1. The owner talks to one long-lived head session, the secretary **Miu**, a core domain-free persona
   (`core/agents/secretary.yaml`, tier `standard`, no model) that classifies each request with `fgos-clarifying`,
   asks one line when the domain is unclear, routes (answer from portfolio files, open a shaper, hand a settled
   discussion to a planner, a ready plan to a supervisor), orders topics, reports in at most 10 lines and batches the
   open owner questions of all three stages into one five-part batch. It never does detail work (SM-D1, D4, D7, D11, D12).
2. Every agent session goes through one spine (SM-D6): bind() chooses CLI, provider, account, model (from the tier)
   and persona; the worker branch is wrapped by the run supervisor, the head branch by Identity and session rotation;
   both are placed by **one host port** (`start`, `alive`, `front`, `retire`) whose adapters are `terminal` (Terminal
   Control with its herdr driver) and `direct`. No second placement path is left in the run supervisor or in dispatch.
3. A head session's persona comes from the same agent-definitions door a worker brief uses, pinned per session (SM-D10).
   In a pane, the opening prompt is typed visibly into the CLI composer as full text by the same delivery step worker
   seats use (shaper note, main `d77ca29aa`); a screenless host may pass it by argument or file.
4. A head session rotates itself (SM-D2, D5, D13): at every turn end a script reads the context in use; over the soft
   threshold at rest, or the hard threshold at any turn end, it writes a redacted, immutable handoff under
   `.fgos/runtime/session-rotation/<persona>-<name>/`, starts the successor through the head-start door, waits until it
   answers, then retires the old session. Any failure leaves the old session alive. `/handoff` does the same on demand.
5. Discussions live in `docs/discussions/<slug>/` named by Convention kind `discussion` (SM-D8); a core domain-free
   shaper shapes any domain without its own shaper (SM-D3); open discussion questions sit in `QUESTIONS.md` (SM-D9).

## Design settled by this plan (facts phase records the evidence)

**Prior art (read on the base commit; GitNexus is not installed here, `fgos dispatch decide --for impact-analysis`
answered `unavailable / tool.missing`, so the blast radius below is from `rg`, a weak proof by the AGENTS.md gate).**

- Placement today is split over three layers: Node dispatch allocates the pane (`src/runner/dispatch/herdr-round.mjs:448`
  `tc.allocateAsync`, client from `terminal-slot.mjs:63`), the controller writes the attempt intent and envelope with
  `mode: direct|terminal` (`src/run-supervisor/direct-launch.mjs:178,204`), and the Rust run supervisor branches on the
  mode (`packages/run-supervisor/rust/src/supervise.rs:289,569`, `gate.rs:201`), launches and types the brief into the
  pane through Terminal Control (`supervise/terminal.rs`, readiness `:929`), and releases the slot (`terminal_slot.rs`).
  Node also reads and releases panes in `src/run-supervisor/steps/settle-attempt.mjs:77` and `src/runner/dispatch/cli.mjs:252-257`.
  Callers of the placement functions: `src/runner/dispatch/assignment-runner.mjs` (77-87, 714, 896, 1016). Tests:
  `test/run-supervisor/direct-cutover.test.mjs`, `windows-custody.test.mjs`, `terminal-groups.test.mjs`,
  `test/runner/dispatch-terminal-slot.test.mjs`, `test/terminal-control/*.test.mjs`. `git log -S'placement' -- src/run-supervisor`
  is empty: no earlier host abstraction existed or was removed. **Reused:** Terminal Control's route and core
  (allocate, launch with `launch_line` shell-quoting at `packages/terminal-control/rust/src/core.rs:1258`, inspect,
  release, read, send), the run supervisor's ready-wait and typed-brief step, the agent-definitions door,
  `fgos identity session --register --role`. **Missing:** the port itself, a `focus` operation (herdr has `tab focus`;
  Terminal Control has none, every create passes `--no-focus`), a head role kind in Identity (only `lead:` and `work:`,
  `packages/identity/rust/src/directory.rs:37`), a head-start use case, any rotation mechanism (none exists;
  `src/state/handoff.mjs` and `src/workflow/unit-handoff.mjs` are unrelated uses of the word).
- **Home of the host port.** A new foundation component **Session Host**, a Rust crate `packages/session-host/rust`
  (`fgos-session-host`) with an internal route and a thin Node client `src/session-host/client.mjs`, layered above
  Terminal Control (layer 2) and below the run supervisor (layer 4). Settled by evidence, not asked: the run supervisor,
  which must place through it, is Rust (`supervise.rs`), so the port must be Rust to be reachable without a second path;
  `docs/platform/component-boundary.md` §4 forbids the run supervisor knowing a pane and says Terminal Control is usable
  without a run and must not know runs, so the port belongs to neither; design principle 4 (foundations in Rust).
- **Port contract (written in phase 1, checked on paper against a pane host and a screenless host).**
  `start(spec) -> Placement{host, key, display}` where `spec = {host: terminal|direct, key, groupKey?, beside?, cwd, env,
  command, args, opening: {text, delivery: typed|argument|file}, display}`; `alive(placement) -> live|gone|unknown`;
  `front(placement) -> fronted|unsupported`; `retire(placement, close|retain) -> retired|unknown`. `terminal` = Terminal
  Control allocate + launch (quoted) + ready-wait + typed opening text; `direct` = the run supervisor's prepared gate
  command started without a screen (containment stays the supervisor's: the adapter receives the prepared command, it
  never builds containment). A head session on `direct` answers `unsupported: a head session needs an interactive host`
  until a screenless host with a message channel is built (non-goal). The screenless paper check (SDK or cloud) passes
  the opening text by `argument` or `file`, liveness by its own handle, `front` = `unsupported`.
- **Persona protocol vs rendered sections (SM-D10).** The renderer shows `description`, `persona.voice|style|archetype`
  and `decision_boundary.can_decide|must_escalate` (`src/runner/agent-definitions.mjs:123-142`); `skills:` is parsed and
  dropped. SM-D7's does/never fits `description` + `decision_boundary`; the procedure (route table, batching, 10-line
  report) goes into a core skill `fgos-secretary`. The renderer is extended by one thing only if it must: phase 3
  first looks for an existing skills section in the worker brief; if one exists it is reused for the head opening text,
  else `projectPersona` gains `skills` (RUL104: without it the protocol skill never reaches the session, a real gap).
- **Rotation mechanics.** Two are unproven (SM-D13) and go to the spike (phase 2): statusline sidecar timing vs the
  Stop hook (and whether a sidecar can be written at all, since this repo's `statusLine` is the user's own AgentKit
  script), and `/clear` via Terminal Control `send` with SessionStart `source=clear`. The spike result fixes the
  measure source in phase 8 and the executor shape in phase 14. `/clear` cannot meet SM-D13's two-step rule (the old
  context is gone before the successor answers), so whatever the spike finds it is recorded only as a fallback for a
  host that cannot open a second session, never used on the terminal host. Handoff file names are the Session Host's
  own runtime names (like mailbox runtime files), not a Convention kind: Convention names repository documents.
- **Identity.** A head session registers itself from its SessionStart hook with role `head:<persona>-<name>` when the
  head-start door set `FGOS_HEAD_ROLE` in its environment; Identity stays the only authority for who and whether alive.

## Acceptance criteria

1. `fgos <head verb> start secretary --name miu` (verb name per owner question 1) opens a herdr tab running the CLI
   bind() chose at tier `standard`, the persona text typed visibly into the composer by the shared delivery step, and
   `fgos identity session` lists the session with role `head:secretary-miu`; the same verb opens `shaper --name <slug>`.
   Proof: `node --test test/session-host/head-start.test.mjs` (behaviour) and one live check recorded in phase 18's report.
2. Rotation: a forced low threshold rotates a live head session, the old pane closes only after the successor answered
   and named the pending question it resumed; a successor killed before answering leaves the old session alive.
   `/handoff` triggers the same path. Proof: `node --test test/session-rotation/*.test.mjs` and the live check in phase 18.
3. Handoff files only under `.fgos/runtime/session-rotation/<persona>-<name>/`, immutable `<yymmdd-hhmm>-<sid8>.md`,
   `latest.json` atomic, last 10 kept, redacted. Proof: `node --test test/session-rotation/handoff-store.test.mjs`.
4. `docs/platform/session-host/spec.md` holds the port contract with both paper adapters; `rg -n "mode.*terminal|allocateAsync"
   src/runner src/run-supervisor` finds no placement outside the Session Host client, and the run supervisor places through
   `fgos-session-host`. Proof: `cargo test -p fgos-session-host -p fgos-run-supervisor`, `node --test test/run-supervisor`.
5. `fgos-clarifying` returns an explicit unsure verdict instead of `coding`; a marketing request is classified
   `marketing` (needs owner question 2) and shaped by `core/skills/fgos-shaping`. Proof: phase 7 and 10 tests.
6. `fgos convention path --kind discussion --slug x` answers `docs/discussions/x/`; `ls docs/history/*/DISCUSSION.md` is empty.
7. The owner-question reader lists one batch from a fixture with one open question per stage, each tagged topic + stage.
   Proof: `node --test test/portfolio/open-questions.test.mjs`.
8. `npm test` and `cargo test --workspace` green on the merged tree (phase 18, after asking the owner for the slot);
   `node scripts/plan-contract-check.mjs --plan plans/261117-1856-secretary-session-spine` prints `ok`;
   `CHANGELOG.md` `[Unreleased]` names the head verb, `/handoff`, the discussions move and the session rotation config.

## Non-goals

- Work integration or any Work-layer change; the portfolio data model and generated board
  (`plans/261117-1430-portfolio-driving-draft`); consolidating owner questions into one place (SM-D9 debt).
- Building adapters other than `terminal` and `direct` (cloud, UI, SDK are checked on paper only); a head session on `direct`.
- Rules loaded three times (H3 Agent Context Engine, `p-7eb9e65b`); the mailbox head finder (`p-5igcekysul`).
- The domain registry alignment (`p-pgmxt7n7hx` first half) unless the owner answers question 2 with "pull in".
- No `--yagni` flag was passed: the full scope of the hand-off block is delivered, nothing beyond it.

## Leader rules (every phase)

- Run focused tests only (`node --test <file>`, `cargo test -p <crate>`); never `npm test` or `scripts/run-tests.mjs`
  on the shared machine without asking the owner. Check `git diff --cached --stat` before each commit for unexpected
  deletions; stage explicit paths. Commit messages describe behaviour, never plan or phase ids.
- Rust phases: `cargo clippy -p <crate> -- -D warnings` and `cargo check -p <crate> --target aarch64-apple-darwin`
  (macOS must keep building; skip with a note only if the target is not installed). Keep `CARGO_TARGET_DIR` off `/tmp`.
- Test policy (design principle 8): each phase names its behaviour's one owning proof; extend the owning test file,
  never copy cases to a second layer. A retired mechanism retires its tests in the same commit.
- Hot file `packages/git/contracts/mutation-census.v1.json`: regenerate (`node scripts/git-one-door-scan.mjs
  --write-census`) in any commit the pre-commit hook asks for; never hand-merge; phase 18 owns the final regeneration.
- Generated skill renders (`.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`) are regenerated with
  `npm run build:skills`, never edited by hand; one phase per wave owns them (phases 4, 7, 10, 16).
- A phase that finds it needs a file outside its footprint stops and reports `NEEDS_CONTEXT`; it never widens itself.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Host-port contract, home and blast radius](phase-01-host-port-contract.md) | - | docs/platform/session-host/**, packages/session-host/contracts/**, docs/platform/component-boundary.md, docs/reading-map.md, plans/261117-1856-secretary-session-spine/reports/facts-host-port.md | 1 | ready |
| 2 | [Spike: statusline sidecar timing and /clear via Terminal Control](phase-02-rotation-spike.md) | - | plans/261117-1856-secretary-session-spine/reports/spike-rotation.md | 1 | ready |
| 3 | [One persona door for head sessions](phase-03-persona-door.md) | - | src/runner/agent-definitions.mjs, src/runner/dispatch/assignment.mjs, test/runner/agent-definitions.test.mjs | 1 | ready |
| 4 | [Discussions move to docs/discussions with Convention kind discussion](phase-04-discussions-location.md) | - | packages/convention/**, docs/platform/convention/**, docs/history/*/DISCUSSION.md, docs/discussions/**, domains/coding/skills/**, core/skills/_shared/plan-contract.md, src/report/context-render.mjs, src/report/authoritative-match.mjs, src/state/work.mjs, src/state/frontier.mjs, src/state/worker-slots.mjs, bin/fgos.mjs, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 1 | ready |
| 5 | [Terminal Control focus operation](phase-05-terminal-focus.md) | 1 | packages/terminal-control/**, src/terminal-control/**, test/terminal-control/**, docs/platform/terminal-control/** | 2 | ready |
| 6 | [Identity head role kind](phase-06-identity-head-role.md) | 4 | packages/identity/**, packages/convention/contracts/convention.rules.v1.json, docs/platform/identity/** | 2 | ready |
| 7 | [Core domain-free shaper and unsure domain verdict](phase-07-core-shaper.md) | 4 | core/skills/fgos-shaping/**, core/skills/fgos-clarifying/**, domains/coding/skills/fgos-coding-shaping/**, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 2 | ready |
| 8 | [Rotation core: measure, decide, handoff store, config](phase-08-rotation-core.md) | 2 | src/session-rotation/**, test/session-rotation/**, core/config-standard/sessionRotation.yaml, core/config-schema/sessionRotation.schema.yaml, docs/architecture-manifest.json | 2 | ready |
| 9 | [Session Host crate, route, client and the shared opening-text delivery](phase-09-session-host-crate.md) | 1, 5 | packages/session-host/rust/**, Cargo.toml, Cargo.lock, apps/fgos/**, src/session-host/client.mjs, test/session-host/client.test.mjs, packages/run-supervisor/rust/src/supervise/terminal.rs, docs/architecture-manifest.json | 3 | ready |
| 10 | [Domain registry names the domains that exist](phase-10-domain-registry.md) | 7 | src/state/domain-registry.mjs, test/state/**, test/intake/**, core/skills/fgos-clarifying/**, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 3 | draft |
| 11 | [Worker attempts placed through the host port](phase-11-worker-placement.md) | 9 | packages/run-supervisor/**, Cargo.lock, src/run-supervisor/**, test/run-supervisor/**, src/runner/dispatch/herdr-round.mjs, src/runner/dispatch/cli.mjs, src/runner/dispatch/terminal-slot.mjs, test/runner/dispatch-terminal-slot.test.mjs, docs/platform/run-supervisor/spec.md | 4 | ready |
| 12 | [Head-start use case and Identity registration at SessionStart](phase-12-head-start.md) | 3, 6, 9 | src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, scripts/fgos-session-start-hook.mjs, src/setup/agent-hooks.mjs, packages/distribution/contracts/agent-hooks.v1.json, test/setup/agent-hooks.test.mjs, .claude/settings.json | 4 | ready |
| 13 | [Owner-question reader over the three stage places](phase-13-owner-questions.md) | 7 | src/portfolio/**, test/portfolio/**, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, bin/fgos.mjs, test/cli/questions-verb.test.mjs, docs/architecture-manifest.json | 4 | ready |
| 14 | [Rotation executor: two-step replacement](phase-14-rotation-executor.md) | 2, 8, 12 | src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs, docs/platform/session-host/spec.md | 5 | ready |
| 15 | [Head verb binding: start and rotate](phase-15-head-verb.md) | 12, 13, 14 | src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, bin/fgos.mjs, apps/fgos/**, test/cli/head-verb.test.mjs, docs/platform/session-host/spec.md | 6 | draft |
| 16 | [Secretary persona, secretary skill and /handoff skill](phase-16-secretary-and-handoff-skills.md) | 3, 7, 13, 15 | core/agents/secretary.yaml, core/skills/fgos-secretary/**, core/skills/handoff/**, .claude/agents/**, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 7 | draft |
| 17 | [Rotation hooks, doctor row and install wiring](phase-17-rotation-hooks.md) | 14, 15 | scripts/fgos-session-rotation-hook.mjs, scripts/fgos-session-start-hook.mjs, src/setup/agent-hooks.mjs, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/contracts/doctor-registry.v1.json, test/setup/agent-hooks.test.mjs, .claude/settings.json | 7 | draft |
| 18 | [Integration, live checks and full gate](phase-18-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 | CHANGELOG.md, docs/reading-map.md, packages/git/contracts/mutation-census.v1.json, plans/261117-1856-secretary-session-spine/reports/integration.md | 8 | draft |

**Waves.** 1: phases 1-4. 2: 5-8. 3: 9-10. 4: 11-13. 5: 14. 6: 15. 7: 16-17. 8: 18. Layers stay serial: the port
contract (1) lands before the crate (9), the crate before its two consumers (11, 12), the head-start use case before
rotation (14), and the verb (15) before anything whose text names it (16, 17).

**Hot files and why they do not collide.** `docs/architecture-manifest.json`: phases 8 (W2), 9 (W3), 13 (W4), one per
wave, each adds its own `src/` directory. `Cargo.lock`: 9 (W3), 11 (W4). `apps/fgos/**`: 9 (W3), 15 (W6). Command
registry, manifest, routes and `bin/fgos.mjs`: 4 (W1, a comment only), 13 (W4), 15 (W6). Skill renders: 4, 7, 10, 16 in
waves 1, 2, 3, 7. `scripts/fgos-session-start-hook.mjs`, agent-hooks and `.claude/settings.json`: 12 (W4), 17 (W7).
`core/skills/fgos-clarifying/**`: 7 (W2), 10 (W3). `docs/platform/session-host/spec.md`: 1 (W1), 14 (W5), 15 (W6); phases 9, 11 and
12 write their spec additions into their phase report and phase 14 folds them in (they do not write the spec).
`packages/run-supervisor/rust/src/supervise/terminal.rs`: 9 (W3) moves the delivery step out, 11 (W4) owns the rest.
Mutation census: regenerated per commit, owned by 18.

**Contract check.** `scripts/plan-contract-check.mjs --plan plans/261117-1856-secretary-session-spine` printed `ok`
(2026-11-17). From a linked worktree the YAML door refuses (`git-addon-unavailable`), so the planner ran this branch's
script with its `src/` resolved to the activated release's payload (same YAML door, same rules). Reading also confirms:
every phase sits in a later wave than each dependency, and no two phases of one wave overlap by fixed prefix.
`--all` flags no overlap for this plan while it is `draft`; once it turns `ready` it will overlap the ready plan
`261117-1553-run-verify-record-and-attention-view` (`bin/fgos.mjs`, command registry and manifest, `test/cli/**`,
`docs/platform/run-supervisor/spec.md`, `CHANGELOG.md`, census): phases 11, 13, 15 and 18 must start after that plan
lands, or `blockedBy` is set to it at that moment (see Risks).

## Owner questions

1. **Head-session verb name: `fgos session start` is already taken.**
   - *Chuyện gì đang xảy ra:* SM-D6 named the head-session door `fgos session start <persona> --name <name>`, but
     `fgos session start|end|list|gc` already exists and means something else: a per-session detached-HEAD git worktree
     with its registry `.fgos/sessions.json` (`apps/fgos/src/wiring/session.rs`, `src/cli/command-registry.mjs:2195`).
   - *Nguyên nhân:* found by the shaper after the hand-off and confirmed here; callers of the existing verb:
     `bin/fgos.mjs`, `src/runner/worktree.mjs`, `test/cli/fgos-disconnected-worktree-guard.test.mjs`,
     `test/cli/fgos-return.test.mjs`, `test/cli/helpers/fgos-cli-harness.mjs`, `test/verbs/merge/approve-leaf-and-worktree.test.mjs`,
     `docs/reading-map.md`, `docs/architecture-manifest.json`, `CHANGELOG.md`.
   - *Các lựa chọn:* (a) a new noun **`fgos head start|rotate <persona> --name <name>`** ("head" is Identity's and the
     mailbox's existing word for the live agent session): no existing caller moves; cost one Node verb entry, manifest and
     routes, ~150 lines + one wiring test, phase 15 only. (b) overload `fgos session start <persona>` beside
     `session start [--item]`: one noun, but one verb with two unrelated meanings (worktree vs agent session) and a
     positional that changes the whole behaviour; cost similar plus Rust wiring in `session.rs`. (c) rename the worktree
     verb (e.g. `fgos checkout-session`) and give `session` to heads: matches SM-D6's wording, but moves every caller and
     doc listed above in one change (L10), ~400 lines across Rust, Node, tests, and a user-visible rename.
   - *Khuyến nghị:* (a). It keeps one meaning per verb, moves nothing, and the use case behind it (phase 12) is the same
     under any name, so only phase 15 and the text of 16-17 depend on the answer.
   - *Phạm vi của câu trả lời:* the verb name and its subcommands only; it does not reopen SM-D6 (two thin verbs on one
     spine) and does not authorize changing the existing `fgos session` behaviour unless (c) is chosen.

2. **Pull the domain-registry fix into this plan, since acceptance criterion 5 needs it?**
   - *Chuyện gì đang xảy ra:* the hand-off lists "fixing the domain registry" as a non-goal (filed as `p-pgmxt7n7hx`),
     but its criterion 5 says a marketing request is classified by `fgos-clarifying`; the registry it reads
     (`src/state/domain-registry.mjs`: `coding`, `synthetic`, `triage`, `fixture-marketing`) has no `marketing`, while
     `domains/` holds `coding`, `council`, `marketing`.
   - *Nguyên nhân:* read `src/state/domain-registry.mjs:28,103,136` and `core/skills/fgos-clarifying/SKILL.md:80-90,125-130`.
     The unsure verdict instead of `coding` (SM-D3, binding) is in phase 7 regardless; only the vocabulary is in question.
   - *Các lựa chọn:* (a) pull in: phase 10 makes the registry and `domains/` name the same domains from one source, with one
     owning test; cost ~100-200 lines in `src/state` + tests, one wave, closes `p-pgmxt7n7hx` with it. (b) keep it out:
     criterion 5 is proven only for the unsure path now, and the marketing case after `p-pgmxt7n7hx` lands; phase 10 is
     withdrawn and `p-pgmxt7n7hx` stays its own item.
   - *Khuyến nghị:* (a). The criterion cannot be met otherwise, the change is small and in the same files the plan already
     reads (RUL11: the mess is inside this work's scope).
   - *Phạm vi của câu trả lời:* phase 10 only (registry vocabulary from one source and its test); not the mailbox item and
     not any other registry change.

## Risks and rollback

- **Worker placement regression (phase 11, highest risk).** The worker path is covered by the run-supervisor and dispatch
  tests above; phase 11 changes the envelope from `mode` to a host placement in one change for Rust and Node, so no tree
  has a half-moved envelope. Blast radius is from `rg` (GitNexus missing); phase 1's facts report widens the grep to
  `windows-custody`, adopt (`adopt.rs:511`) and recovery readers before phase 11 starts.
- **Two delivery copies.** Phase 9 moves (not copies) the typed-brief step into the crate and points `supervise/terminal.rs`
  at it in the same commit, so no commit holds two copies.
- **Rotation closes a live session wrongly.** Two-step rule: retire only after the successor answered; every failure
  leaves the old one; the executor never SIGKILLs. A spike outcome that disproves the sidecar falls back to the transcript
  measure with the window size from config (`sessionRotation.windowTokens`), already in phase 8's shape.
- **Statusline ownership.** If the spike shows a sidecar needs this repo's or the user's `statusLine` changed, phase 8 uses
  the transcript measure only and the statusline change becomes a new owner question, not a silent edit.
- **Overlap with `261117-1553-run-verify-record-and-attention-view`.** Shared files listed under "Contract check". Phase 4 touches `bin/fgos.mjs` for one comment only (a trivial rebase); phases 1-10,
  12, 14, 16, 17 do not touch them. Before setting this plan `ready`, if that plan is still `ready` or `running`, add it
  to `blockedBy` or hold phases 11, 13, 15, 18 until it is `done`.
- **Rollback.** Each phase is one commit (or a short series) on its own branch; revert the phase's merge commit and
  regenerate the census, manifest and renders on the reverted tree. Phase 4's move is reverted as one commit (`git revert`),
  which restores every `docs/history/*/DISCUSSION.md`. The whole plan reverts by reverting phase 18's merge set in reverse wave order.
