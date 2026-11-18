---
contract: plan-v1
title: "Secretary Miu, one start door and host port for head sessions, automatic session rotation"
status: ready
priority: P1
blockedBy: []
footprint:
  - plans/261117-1856-secretary-session-spine/**
  - docs/platform/session-host/**
  - packages/session-host/**
  - docs/platform/component-boundary.md
  - docs/reading-map.md
  - src/runner/agent-definitions.mjs
  - test/runner/assignment.test.mjs
  - packages/config/rust/src/bundle.rs
  - packages/config/contracts/fixtures/registry-defaults.v1.json
  - src/runner/dispatch/assignment.mjs
  - test/runner/agent-definitions.test.mjs
  - packages/convention/**
  - docs/platform/convention/**
  - docs/history/*/DISCUSSION.md
  - docs/discussions/**
  - domains/coding/skills/**
  - core/skills/_shared/**
  - docs/knowledge/**
  - docs/explanation/**
  - docs/distillery/**
  - docs/platform/documentation/**
  - docs/platform/proposals/**
  - docs/platform/work-state/decisions/**
  - docs/platform/runner/decisions/**
  - docs/platform/platform-foundations.md
  - docs/platform/herdr-web-dashboard/spec.md
  - src/setup/skill-wrappers.mjs
  - src/runner/agent-roster.mjs
  - scripts/check-decision-citation-drift.baseline.json
  - scripts/plan-contract-check.mjs
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
  - apps/fgos/Cargo.toml
  - apps/fgos/src/main.rs
  - src/session-host/**
  - test/session-host/**
  - src/state/domain-registry.mjs
  - test/state/**
  - test/intake/**
  - packages/run-supervisor/**
  - src/run-supervisor/**
  - test/run-supervisor/**
  - src/runner/dispatch/herdr-round.mjs
  - src/runner/dispatch/assignment-runner.mjs
  - src/runner/dispatch/session-attempt.mjs
  - src/runner/dispatch/confinement/policies.mjs
  - src/runner/dispatch/confinement/resources.mjs
  - src/runner/dispatch/confinement/drivers/bwrap.mjs
  - test/runner/dispatch-confinement-policies.test.mjs
  - docs/platform/agent-confinement/spec.md
  - src/runner/dispatch/cli.mjs
  - src/runner/dispatch/terminal-slot.mjs
  - test/runner/dispatch-terminal-slot.test.mjs
  - docs/platform/run-supervisor/spec.md
  - packages/distribution/rust/src/agent_hooks.rs
  - packages/distribution/rust/tests/goldens/agent-hooks-vectors.json
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
  - docs/history/secretary-miu/DISCUSSION.md (hand-off block, SM-D1..SM-D13, section 7)
  - p-r4u2ewexvn
  - p-g2iprtzptz (the `fgos head` name is provisional)
  - plans/reports/research-261117-1624-handoff-skills-research.md
  - shaper notes 2026-11-17 (main d77ca29aa) — existing `fgos session` verb collision; Terminal Control launch_line quoting; opening prompt typed visibly in a pane
created: 2026-11-17
---

# Secretary Miu, one start door and host port for head sessions, automatic session rotation

Both owner questions are answered (2026-11-17: verb `fgos head`, provisional per backlog `p-g2iprtzptz`; `p-pgmxt7n7hx` pulled in). The two overlapping plans (`261117-1553-run-verify-record-and-attention-view`, `261117-1524-windows-plain-path-fold`) landed and are marked done (2026-11-17), so every phase is `ready` and the contract check prints `ok`.

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
  host that cannot open a second session, never used on the terminal host. Handoff file names are session rotation's
  own runtime names (like mailbox runtime files), not a Convention kind: Convention names repository documents.
- **Identity.** A head session registers itself through the existing installed `session-register` SessionStart row
  (`packages/distribution/rust/src/agent_hooks.rs`), which passes `--role head:<persona>-<name>` when the head-start
  door set `FGOS_HEAD_ROLE`; a rotation successor, refused while the old session holds the role, registers without it
  and takes the role itself (`--take` moves a role only to the caller) from its own hook once it has answered.
  Identity stays the only authority for who and whether alive. (Validation session 1.)
- **Opening delivery (validation session 1).** The shared delivery step already is one door, `fgos-agent-protocol`
  (`adapter_for`, `await_ready`, `deliver_brief` over `AgentIo`); the Session Host reuses it through its own `PaneIo`
  and moves nothing out of the run supervisor, whose `TermIo` later wraps `PaneIo`. Hooks reach other projects only as
  `fgos hook <kind>` through the shim, so rotation is one hook kind `session-rotation`, never a repository script.
- **Head sessions are confined like workers; one request socket (owner, 2026-11-18).** A head session gets no
  exception from a worker: it starts through the worker's seat door (run supervisor, bwrap, account lease, private
  home), so the herdr socket and the user runtime directory stay masked for it as for every dispatch. The difference
  between roles is only a grant keyed by the Identity role: writable paths (bwrap binds) and allowed verbs. Verbs reach
  the host through one request socket that the session's own run supervisor opens and binds back into that sandbox,
  the same way the GO socket is bound back; no new daemon. The supervisor resolves the caller's role through Identity,
  checks the grant, performs the verb outside the sandbox and logs it. This plan ships one verb, `head start`, so a
  confined secretary can still start sessions; the secretary's writable paths are `plans/**`, `docs/backlog.md`,
  `docs/discussions/**`. The grant schema in `core/config-standard`/`core/config-schema` and the other verbs (`land`,
  backlog row, answering `QUESTIONS.md` and plan questions) are a follow-up plan. The role name stays
  `head:<persona>-<name>`.
  Rotation runs inside the confined head, so phase 14 adds a second verb `head rotate` to the same request contract
  and route (one door into the rotation executor), not a second socket. Until the grant follow-up, the head ceiling
  is the constant `HEAD_HARD_CEILING_MS` (7 days); rotation keeps real sessions far shorter.
- **New code goes to Rust when it can (owner, 2026-11-18).** The project is moving to Rust; any new module this plan
  still adds is written in Rust whenever its dependencies allow it now, and its Node twin is deleted in the same change.
  Phase 17's hook therefore becomes a native `fgos hook session-rotation` subcommand in Rust (next to the native
  `hook mailbox`), its socket client reuses the Rust head-request frame codec, and `measure`/`decide` (used only by the
  hook) move to Rust with their Node files and tests retired. Code already landed in Node because it calls the Node seat
  door (`head-start`, `head-request`, `head-request-client`, `head-grants`, `rotate`, `session-attempt`,
  `handoff-store`) is tracked for porting as `p-kkkgpg6dzc`.

## Acceptance criteria

1. `fgos head start secretary --name miu` opens a herdr tab running the CLI
   bind() chose at tier `standard`, the persona text typed visibly into the composer by the shared delivery step, and
   `fgos identity session` lists the session with role `head:secretary-miu`; the same verb opens `shaper --name <slug>`.
   Proof: `node --test test/session-host/head-start.test.mjs` (behaviour) and one live check recorded in phase 18's report.
2. Rotation: a forced low threshold rotates a live head session, the old pane closes only after the successor answered
   and named the pending question it resumed; a successor killed before answering leaves the old session alive.
   `/handoff` triggers the same path. Proof: `node --test test/session-rotation/*.test.mjs` and the live check in phase 18.
3. Handoff files only under `.fgos/runtime/session-rotation/<persona>-<name>/`, immutable `<yymmdd-hhmm>-<sid8>.md`,
   `latest.json` atomic, last 10 kept, redacted. Proof: `node --test test/session-rotation/handoff-store.test.mjs`.
4. `docs/platform/session-host/spec.md` holds the port contract with both paper adapters; phase 11's placement-call grep
   (`\.allocateAsync\(|\.releaseAsync\(` in Node, `Core::launch|.allocate(` in the run supervisor) finds no placement outside
   the Session Host client and crate, and the run supervisor places through
   `fgos-session-host`. Proof: `cargo test -p fgos-session-host -p fgos-run-supervisor`, `node --test test/run-supervisor`.
5. `fgos-clarifying` returns an explicit unsure verdict instead of `coding`; its vocabulary names every domain of
   `domains/` (`p-pgmxt7n7hx`, pulled in), so a marketing request is classified `marketing` and shaped by
   `core/skills/fgos-shaping`. Proof: phase 7 and 10 tests; live check in phase 18.
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
- (`p-pgmxt7n7hx`, the domain registry, is no longer a non-goal: the owner pulled it in, phase 10.)
- Renaming `fgos head` to `fgos session` (backlog `p-g2iprtzptz`); Identity's `head:` role keeps its name either way.
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
| 1 | [Host-port contract, home and blast radius](phase-01-host-port-contract.md) | - | docs/platform/session-host/**, packages/session-host/contracts/**, docs/platform/component-boundary.md, docs/reading-map.md, plans/261117-1856-secretary-session-spine/reports/facts-host-port.md | 1 | done |
| 2 | [Spike: statusline sidecar timing and /clear via Terminal Control](phase-02-rotation-spike.md) | - | plans/261117-1856-secretary-session-spine/reports/spike-rotation.md | 1 | done |
| 3 | [One persona door for head sessions](phase-03-persona-door.md) | - | src/runner/agent-definitions.mjs, src/runner/dispatch/assignment.mjs, test/runner/agent-definitions.test.mjs, test/runner/assignment.test.mjs | 1 | done |
| 4 | [Discussions move to docs/discussions with Convention kind discussion](phase-04-discussions-location.md) | - | packages/convention/**, docs/platform/convention/**, docs/history/*/DISCUSSION.md, docs/discussions/**, domains/coding/skills/**, core/skills/_shared/**, docs/knowledge/**, docs/explanation/**, docs/distillery/**, docs/platform/documentation/**, docs/platform/proposals/**, docs/platform/work-state/decisions/**, docs/platform/runner/decisions/**, docs/platform/platform-foundations.md, docs/platform/herdr-web-dashboard/spec.md, src/setup/skill-wrappers.mjs, src/runner/agent-roster.mjs, scripts/check-decision-citation-drift.baseline.json, src/report/context-render.mjs, src/report/authoritative-match.mjs, src/state/work.mjs, src/state/frontier.mjs, src/state/worker-slots.mjs, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 1 | done |
| 5 | [Terminal Control focus operation](phase-05-terminal-focus.md) | 1 | packages/terminal-control/**, src/terminal-control/**, test/terminal-control/**, docs/platform/terminal-control/** | 2 | done |
| 6 | [Identity head role kind](phase-06-identity-head-role.md) | 4 | packages/identity/**, packages/convention/contracts/convention.rules.v1.json, packages/convention/rust/tests/golden.rs, docs/platform/identity/** | 2 | done |
| 7 | [Core domain-free shaper and unsure domain verdict](phase-07-core-shaper.md) | 4 | core/skills/fgos-shaping/**, core/skills/fgos-clarifying/**, domains/coding/skills/fgos-coding-shaping/**, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 2 | done |
| 8 | [Rotation core: measure, decide, handoff store, config](phase-08-rotation-core.md) | 2 | src/session-rotation/**, test/session-rotation/**, core/config-standard/sessionRotation.yaml, core/config-schema/sessionRotation.schema.yaml, docs/architecture-manifest.json, packages/config/rust/src/bundle.rs, packages/config/contracts/fixtures/registry-defaults.v1.json | 2 | done |
| 9 | [Session Host crate, route, client and the shared opening-text delivery](phase-09-session-host-crate.md) | 1, 5 | packages/session-host/rust/**, Cargo.toml, Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/main.rs, src/session-host/client.mjs, test/session-host/client.test.mjs, docs/architecture-manifest.json | 3 | done |
| 10 | [Domain registry names the domains that exist](phase-10-domain-registry.md) | 7 | src/state/domain-registry.mjs, test/state/**, test/intake/**, core/skills/fgos-clarifying/**, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 3 | done |
| 11 | [Worker attempts placed through the host port](phase-11-worker-placement.md) | 9 | packages/run-supervisor/**, Cargo.lock, src/run-supervisor/**, test/run-supervisor/**, src/runner/dispatch/herdr-round.mjs, src/runner/dispatch/cli.mjs, src/runner/dispatch/terminal-slot.mjs, test/runner/dispatch-terminal-slot.test.mjs | 4 | done |
| 12 | [Head sessions start confined, through the worker's seat door](phase-12-head-start.md) | 3, 6, 9, 11 | src/session-host/head-start.mjs, src/session-host/head-grants.mjs, test/session-host/head-start.test.mjs, src/session-host/client.mjs, test/session-host/client.test.mjs, packages/session-host/rust/src/route.rs, packages/session-host/rust/src/host.rs, packages/session-host/contracts/**, src/runner/dispatch/assignment-runner.mjs, src/runner/dispatch/session-attempt.mjs, src/runner/dispatch/herdr-round.mjs, src/runner/dispatch/confinement/policies.mjs, src/runner/dispatch/confinement/resources.mjs, test/runner/dispatch-confinement-policies.test.mjs, docs/platform/agent-confinement/spec.md, src/run-supervisor/direct-launch.mjs, test/run-supervisor/direct-cutover.test.mjs, packages/run-supervisor/contracts/envelope.v3.json, packages/run-supervisor/contracts/attempt-intent.v1.json, packages/run-supervisor/contracts/worker-env-allowlist.v1.json, packages/run-supervisor/rust/Cargo.toml, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/src/supervise/terminal.rs, packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs, Cargo.lock, docs/architecture-manifest.json, plans/261117-1856-secretary-session-spine/reports/phase-12-head-start.md | 5 | done |
| 12b | [One request socket per head session and the verb head start](phase-12b-head-request-socket.md) | 12 | packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json, packages/run-supervisor/contracts/envelope.v3.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/src/lib.rs, packages/run-supervisor/rust/src/route.rs, packages/run-supervisor/rust/src/attempt_step.rs, packages/run-supervisor/rust/src/supervise/terminal.rs, packages/run-supervisor/rust/tests/head_request.rs, src/session-host/head-request.mjs, test/session-host/head-request.test.mjs, src/runner/dispatch/session-attempt.mjs, src/runner/dispatch/confinement/drivers/bwrap.mjs, test/run-supervisor/bwrap-driver.test.mjs, plans/261117-1856-secretary-session-spine/reports/phase-12b-head-request-socket.md | 6 | done |
| 13 | [Owner-question reader over the three stage places](phase-13-owner-questions.md) | 7 | src/portfolio/**, test/portfolio/**, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, bin/fgos.mjs, test/cli/questions-verb.test.mjs, docs/architecture-manifest.json, scripts/plan-contract-check.mjs | 4 | done |
| 14 | [Rotation executor: two-step replacement](phase-14-rotation-executor.md) | 2, 8, 12, 12b | src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs, docs/platform/session-host/spec.md | 7 | done |
| 15 | [Head verb binding: start and rotate](phase-15-head-verb.md) | 12, 12b, 13, 14 | src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, bin/fgos.mjs, test/cli/head-verb.test.mjs, docs/platform/session-host/spec.md | 8 | ready |
| 16 | [Secretary persona, secretary skill and /handoff skill](phase-16-secretary-and-handoff-skills.md) | 3, 7, 13, 15 | core/agents/secretary.yaml, core/skills/fgos-secretary/**, core/skills/handoff/**, .claude/agents/**, plugins/fgOS/skills/**, .agents/skills/**, .claude/skills/** | 9 | ready |
| 17 | [Rotation hooks, doctor row and install wiring](phase-17-rotation-hooks.md) | 14, 15 | src/session-rotation/hook.mjs, bin/fgos.mjs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/distribution/rust/src/agent_hooks.rs, packages/distribution/rust/tests/goldens/agent-hooks-vectors.json, src/setup/agent-hooks.mjs, packages/distribution/contracts/agent-hooks.v1.json, packages/distribution/contracts/doctor-registry.v1.json, test/setup/agent-hooks.test.mjs, .claude/settings.json | 9 | ready |
| 18 | [Integration, live checks and full gate](phase-18-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 | CHANGELOG.md, docs/reading-map.md, docs/platform/run-supervisor/spec.md, packages/git/contracts/mutation-census.v1.json, plans/261117-1856-secretary-session-spine/reports/integration.md | 10 | ready |

**Waves.** 1: phases 1-4. 2: 5-8. 3: 9-10. 4: 11, 13. 5: 12. 6: 12b. 7: 14 (adds `head rotate` to the 12b contract). 8: 15. 9: 16-17. 10: 18. Layers stay serial: the port
contract (1) lands before the crate (9), the crate before its two consumers (11, then 12, which also needs 11's seat
preparation door), the confined head launch (12) before its request socket (12b) and rotation (14), and the verb (15, which
calls 12b's `startHead`) before anything whose text names it (16, 17).

**Hot files and why they do not collide.** `docs/architecture-manifest.json`: phases 8 (W2), 9 (W3), 13 (W4), one per
wave, each adds its own `src/` directory, and 12 (W5) adds its two modules. `Cargo.lock`: 9 (W3), 11 (W4), 12 (W5). Command registry, manifest, routes and `bin/fgos.mjs`: 13 (W4), 15 (W7), 17 (W8)
(the stale DISCUSSION.md comment at `bin/fgos.mjs:1816` is fixed by phase 15, not phase 4). Skill renders: 4, 7, 10, 16 in
waves 1, 2, 3, 8. Hook table (`agent_hooks.rs`, its golden vectors, the Node mirror, `agent-hooks.v1.json`) and `.claude/settings.json`: 17 (W8) only (12 registers the head role from the run supervisor, not a hook).
`src/session-rotation/**`: 8 (W2), 14 `rotate.mjs` (W6), 17 `hook.mjs` (W8). `src/runner/dispatch/herdr-round.mjs`: 11 (W4), 12 (W5). `src/runner/dispatch/session-attempt.mjs`: 12 (W5), 12b (W6).
`core/skills/fgos-clarifying/**`: 7 (W2), 10 (W3). `docs/platform/session-host/spec.md`: 1 (W1), 14 (W6), 15 (W7); phases 9, 11 and
12 write their spec additions into their phase report and phase 14 folds them in (they do not write the spec).
`packages/run-supervisor/rust/src/supervise/terminal.rs` and `envelope.v3.json`: 11 (W4), 12 (W5), 12b (W6); 9 moves nothing out of it (validation session 1).
`docs/platform/run-supervisor/spec.md`: 18 only; 12 and 12b write their additions into their reports.
`apps/fgos/src/main.rs`: 9 (W3) only.
Mutation census: regenerated per commit, owned by 18.

**Contract check.** `scripts/plan-contract-check.mjs --plan plans/261117-1856-secretary-session-spine` prints `ok` while
the plan is `draft` (re-run after validation session 1, 2026-11-17). Plain `node scripts/plan-contract-check.mjs` refuses
with `git-addon-unavailable` from a worktree and from the main checkout; the working command copies this branch's script
and `scripts/lib/is-main-module.mjs` into a scratch dir whose `src` links to the activated release's
`libexec/legacy-node/src` and runs it from the main checkout with the plan's absolute path (same YAML door, same rules). Reading also
confirms every phase sits in a later wave than each dependency, and no two phases of one wave overlap by fixed prefix.

**Why the plan stays `draft`.** Set to `ready`, the check refuses it: its footprint overlaps two `ready` plans on main.
- `261117-1553-run-verify-record-and-attention-view`: `bin/fgos.mjs`, `src/cli/command-registry.mjs`,
  `packages/host-runtime/contracts/command-manifest.json`, `test/cli/**`, `docs/platform/run-supervisor/spec.md`,
  `CHANGELOG.md`, the census. Here: phases 13, 15, 17, 18.
- `261117-1524-windows-plain-path-fold`: `docs/architecture-manifest.json`, `CHANGELOG.md`, the census,
  `packages/distribution/rust/src/agent_hooks.rs`. Here: phases 8, 9, 13 (one appended layer entry each), 12 and 17 (the
  hook table) and 18.
Phases 8 and 9 stay `ready`: their only shared file is one appended layer entry in `docs/architecture-manifest.json`,
resolved by a rebase onto whichever lands first. Phases 12, 13, 15, 17 and 18 are `draft` until both plans are `done`. Whoever
sees the second of them land sets those five phases and the plan to `ready`, after `--plan` prints `ok` again.

## Owner questions

Both answered by the owner on 2026-11-17: question 1 **(a) `fgos head`**, question 2 **(a) pull `p-pgmxt7n7hx` in**.
Kept below as the record of what was asked.

3. **(2026-11-18, answered (2))** Confine head sessions like workers and also give them one request socket with the verb
   `head start` in phase 12 (option 2), rather than confining now and leaving the secretary unable to start sessions
   until a later plan (option 1). Recorded under "Design settled by this plan".
4. **(2026-11-18, answered (a))** A head may hold a leased account for hours (phase 12 open question 1): accepted;
   rotation keeps sessions short and `fgos doctor credential-copies-retained` names staged copies. A dedicated account per
   head persona (option c) goes to the role-grant follow-up plan.

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
- **Two delivery copies.** None can arise: delivery stays in `fgos-agent-protocol`, which both the Session Host and the run
  supervisor call; phase 9's verify greps that `deliver_brief`/`await_ready` are defined only there.
- **Rotation closes a live session wrongly.** Two-step rule: retire only after the successor answered; every failure
  leaves the old one; the executor never SIGKILLs. A spike outcome that disproves the sidecar falls back to the transcript
  measure with the window size from config (`sessionRotation.windowSize`), already in phase 8's shape.
- **Statusline ownership.** If the spike shows a sidecar needs this repo's or the user's `statusLine` changed, phase 8 uses
  the transcript measure only and the statusline change becomes a new owner question, not a silent edit.
- **Overlap with two ready plans.** See "Why the plan stays `draft`": phases 12, 13, 15, 17, 18 wait; 8 and 9 rebase one
  appended manifest entry. If either plan is withdrawn instead of landing, the wait ends the same way.
- **Dangling source of a running plan.** `261117-1524` cites `docs/history/windows-plain-path-fold/DISCUSSION.md`, which
  phase 4 moves; plans are records and are not edited, so phase 4's leader tells that plan's owner, or lands after it.
- **Rollback.** Each phase is one commit (or a short series) on its own branch; revert the phase's merge commit and
  regenerate the census, manifest and renders on the reverted tree. Phase 4's move is reverted as one commit (`git revert`),
  which restores every `docs/history/*/DISCUSSION.md`. The whole plan reverts by reverting phase 18's merge set in reverse wave order.

## Validation Log

### Session 1 — 2026-11-17
**Trigger:** `/ak-plan validate` from the secretary; owner wrapper rules: no live interview, decide what evidence settles,
batch only owner-intent questions; Full tier against this worktree's code; GitNexus absent (blast radius by `rg`).
**Questions asked of the owner:** 0. Every question the framework raised was settled by code or docs evidence (below);
none depends on owner intent, so "Owner questions" gains nothing. SM-D1..SM-D13 were not reopened.

#### Questions decided from evidence

1. **[Assumptions]** Where is the source discussion? Options: `docs/discussions/secretary-miu/` | `docs/history/secretary-miu/`.
   - **Decision:** `docs/history/secretary-miu/DISCUSSION.md`. Evidence: main commit `4defbff48` moved it back because
     Convention refuses `docs/discussions/**` (`unplaced-docs`); phase 4 is what makes `docs/discussions/` legal.
2. **[Architecture]** Phase 9 "moves" the ready-wait + typed-brief step out of `supervise/terminal.rs`. Options: move it |
   reuse the existing door.
   - **Decision:** reuse. Evidence: the step already lives in `fgos-agent-protocol`
     (`packages/agent-protocol/rust/src/terminal/mod.rs:435` `await_ready`, `:554` `deliver_brief`, `adapter_for`) behind
     `AgentIo` (`port.rs:34`); `supervise/terminal.rs` only drives it inside its watched `drive` (l.908-947) through `TermIo`.
     The Session Host gets a `PaneIo` (`AgentIo` over Terminal Control by key); `opening` becomes optional (worker briefs stay
     in `drive`); phase 11 makes `TermIo` wrap `PaneIo`. Phase 9 no longer writes `supervise/terminal.rs`.
3. **[Architecture]** Where is an internal route wired? Options: `routing.rs` + `wiring/session_host.rs` | `main.rs`.
   - **Decision:** `apps/fgos/src/main.rs` (l.159-166 wires `fgos internal terminal-control`). Footprint corrected.
4. **[Architecture]** Which door installs the head-registration and rotation hooks? Options: repo scripts under `scripts/` |
   the installed hook table.
   - **Decision:** the installed hook table. Evidence: hooks reach a project only as `fgos hook <kind>` / `fgos identity ...`
     through the shim, from `packages/distribution/rust/src/agent_hooks.rs` (golden vectors replayed by the Node mirror test
     `test/setup/agent-hooks.test.mjs:1042`); a `session-register` SessionStart row already exists (`agent_hooks.rs:53,642`,
     `.claude/settings.json:181`); `scripts/fgos-session-start-hook.mjs` is repo-only, and head sessions must work in every
     project (D-ADR0035 mission #1). Phase 12 extends the existing row; phase 17 adds one Node hook kind `session-rotation`.
5. **[Risks / flow]** How does the `head:` role reach the successor? Options: executor moves it | successor takes it.
   - **Decision:** the successor takes it with `--take` from its own hook at the end of its first answer, in the same step
     that writes the "answered" record the executor waits on. Evidence: a live holder makes `--register --role` refuse, and
     `--take` moves a role only to the calling session (`packages/identity/rust/src/directory.rs:384-420`), so a detached
     executor cannot move it. Keeps SM-D13's two-step rule: the role moves only after the successor answered.
6. **[Scope]** Phase 4's consumer list and footprint. Options: keep the short list | full `rg` list.
   - **Decision:** full list; Convention's existing `discussion-scratchpad` placement kind (`convention.rules.v1.json:124`)
     is reused, not duplicated. Evidence: `rg -l "docs/history/[^/]+/DISCUSSION.md"` outside `plans/`, `archive/`,
     `docs/history/` finds ~30 more files (docs/knowledge, docs/explanation, docs/platform/..., `src/setup/skill-wrappers.mjs`,
     `src/runner/agent-roster.mjs`, `core/skills/_shared/*`, the citation-drift baseline). L10: one change moves every consumer.
7. **[Architecture]** Does the persona skills line also reach worker briefs? Options: head only | the one shared section.
   - **Decision:** the shared section. Evidence: SM-D10 "exactly as a worker brief does"; no brief skills section exists
     (`assignment.mjs` hits only workflow-op `skills`); seven core personas already declare `skills:`.
8. **[Scope]** Phase 13 "reuse the plan-contract-check reader". Decision: move the section lookup into
   `src/portfolio/plan-sections.mjs` and have the script import it (no reader is exported; `src/` must not import `scripts/`).

#### Confirmed Decisions
- Discussion source path: `docs/history/secretary-miu/DISCUSSION.md` until phase 4.
- Delivery door: `fgos-agent-protocol`, reused by the Session Host; no code moves out of the run supervisor in phase 9.
- Hooks: installed hook table only; `session-register` row extended; one `session-rotation` hook kind.
- Role handover: successor takes `head:` with `--take` after answering.
- Phases 12 and 17 join 13, 15, 18 as `draft` (shared command registry/manifest/`bin/fgos.mjs`, and `agent_hooks.rs` with `261117-1524`).

#### Impact on Phases
- Phases 1, 2, 4, 7: discussion path. Phase 1: wider grep (`worker-session-boot.mjs:128`, `adopt.rs:462`), delivery door.
- Phase 3: skills-line evidence and worker-brief note. Phase 4: reuse `discussion-scratchpad`, full consumer list, footprint.
- Phase 9: reuse agent-protocol, `PaneIo`, optional opening, `main.rs`; footprint. Phase 11: `TermIo` wraps `PaneIo`;
  `createRoundTerminalControl` stays for `worker-session-boot`; line numbers.
- Phase 12: hook door, role refusal path, placement lookup for `front`; footprint. Phase 13: section reader move; footprint.
- Phase 14: successor-side answer record and role take; detach door `src/util/spawn-detached-fgos.mjs`.
- Phase 17: hook kind through the shim, footprint, status `draft`.

### Verification Results
- **Tier:** Full (18 phases; Fact Checker, Flow Tracer, Scope Auditor, Contract Verifier)
- **Claims checked:** 92
- **Verified:** 79 | **Failed:** 10 | **Unverified:** 3

#### Failures (all propagated above)
1. [Fact Checker] `docs/discussions/secretary-miu/DISCUSSION.md` — on main it is `docs/history/secretary-miu/DISCUSSION.md` (`4defbff48`).
2. [Fact Checker] phase 9 "typed-brief step in `supervise/terminal.rs`" — it is `fgos-agent-protocol` `terminal/mod.rs:435,554`.
3. [Fact Checker] internal route wiring in `apps/fgos/src/routing.rs`/`wiring/` — actual `apps/fgos/src/main.rs:159-166`.
4. [Contract Verifier] phase 12/17 hook door `scripts/*.mjs` + `src/setup/agent-hooks.mjs` — the installed door is
   `packages/distribution/rust/src/agent_hooks.rs` + golden vectors; `session-register` row already exists.
5. [Flow Tracer] phase 14 "executor moves the role" — `--take` moves only to the caller (`directory.rs:384-420`);
   phase 12's `--register --role` is refused for a successor while the old session holds the role.
6. [Contract Verifier] phase 4 consumers — ~30 more linking files outside its footprint.
7. [Scope Auditor] phase 4 "add kind `discussion`" — kind `discussion-scratchpad` already owns the placement (`rules.json:124`).
8. [Contract Verifier] `createRoundTerminalControl` — a 4th caller `src/runner/dispatch/worker-session-boot.mjs:128` (non-placement).
9. [Contract Verifier] phase 13 "reuse its reader" — `scripts/plan-contract-check.mjs` exports no section reader (l.28 regex list).
10. [Fact Checker] line drift: `supervise.rs:569` -> 568, `gate.rs:201` -> 199; `adopt.rs:462` (mode reader) was missing.

#### Unverified
- Claude Code statusline/Stop payload fields and `/clear` behaviour (phase 2 spike owns them).
- How a new config area file is registered (`rg workerSlots src/config` finds only the schema; phase 8 stops if outside footprint).
- Whether Terminal Control's store can look a key up by prefix for `front` (phase 12 step 1 decides, with a stated fallback).

#### Verified (sample)
`herdr-round.mjs:448` allocateAsync; `terminal-slot.mjs:63`; `direct-launch.mjs:120,178,185,204`; `supervise.rs:289`;
`assignment-runner.mjs:77-87,714,896,1016`; `core.rs:1258` `launch_line`; `driver/herdr.rs:640,654,696` `--no-focus`, no
`focus` in Terminal Control; `driver/mod.rs:155-214` trait; route verbs `route.rs:29-35,291`; `directory.rs:37,167`;
`agent-definitions.mjs:104,117,123,124,136,252`; `assignment.mjs:641,758,770`; `unit-run-start.mjs:42`; `bind.mjs:567`;
`runner.personas` project-only taste and `defaults.tier: standard`; `domain-registry.mjs:28,103,136`; clarifying SKILL
`coding` default at l.86-87, l.126; `domains/{coding,council,marketing}/AGENTS.md`; `command-registry.mjs:770` `ask`,
`:2195` `session`; `routing.rs:90`; `case-projection.mjs:45,116`; `scripts/export-command-selectors.mjs`,
`scripts/project-agents.mjs`, `decision-question.md`, research report, all named test files exist; both blocking plans are
still `ready` on main.

### Comparison with the independent validator (`plans/reports/review-261117-1935-secretary-plan-validation.md`, read after this pass)
- **Agreed (found by both):** its F1 (delivery in `fgos-agent-protocol`), F2 (route in `main.rs`), F3 (role handover; its
  fix has the executor run `--take`, which `directory.rs:384-420` shows moves the role only to the caller, so this log keeps
  the successor-side take), F4 (installed hook table, `session-register` row), F5 (phase 4 consumers, reuse
  `discussion-scratchpad`), F9 (discussion path, 41 files).
- **Adopted from it after checking the code (missed by this pass):** F4's overlap with `261117-1524` on `agent_hooks.rs`
  (verified in its frontmatter; phases 12 and 17 now `draft`); F6 seat preparation door (`prepareTerminalAttempt`
  `herdr-round.mjs:354`; phase 11 exports it, phase 12 now depends on 11 and moves to wave 5, later waves shift by one);
  F7 config bundle (`packages/config/rust/src/bundle.rs:17-25`, into phase 8); F8 `fgos head` provisional per
  `p-g2iprtzptz` (the owner said so in this run's brief too; source, non-goal, phases 15 and 18); F10 persona cases in
  `test/runner/assignment.test.mjs` (into phase 3); F11 live-check precondition (phases 12, 18); F12 per-persona
  thresholds (SM-D13, phase 8); F13 AC4 grep on calls (AC4, phase 11); F14 drop extending the Work-layer `fgos ask`
  (phase 13); F15 the working contract-check command (plan, phase 18); F16 small items (wording, phase 6 golden,
  spike at-rest fact, "visible" pass condition).
- **Found here only:** `worker-session-boot.mjs:128` keeps `createRoundTerminalControl` alive; the plan-contract-check
  section reader moves into `src/portfolio/` (no `src` -> `scripts` import); line drift `supervise.rs:568`, `gate.rs:199`,
  `adopt.rs:462`.
- **Disagreement:** none on substance; only the role-move mechanism above, settled by the Identity code.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 .. phase-18.
- Decision deltas checked: 18 (the 8 above plus the 10 adopted from the comparison: 1524 overlap, seat preparation and wave
  shift, config bundle, provisional verb, persona test owner, live precondition, persona thresholds, AC4 grep, `fgos ask`,
  contract-check command).
- Reconciled stale references: 27 (plan footprint and source, phase table rows 3/4/6/8/9/12-18 incl. waves, waves text,
  hot-file waves, draft lists in four places, AC4, non-goals, risks, contract-check text, Identity and delivery design
  bullets, phases 1/2/3/4/6/8/9/11/12/13/14/15/17/18 text).
- Unresolved contradictions: 0.
