# Validation: plan 261117-1856-secretary-session-spine

- Plan: `plans/261117-1856-secretary-session-spine/` on branch `plan/secretary-session-spine`, head `b06ffc241`
  (plan `base: b704fdd08`). Read: `plan.md`, all 18 phase files, `core/skills/_shared/plan-contract.md`, the source
  discussion (on this branch at `docs/discussions/secretary-miu/DISCUSSION.md`; on `origin/main` it is back at
  `docs/history/secretary-miu/DISCUSSION.md`, see F9).
- Validator: independent; did not write the plan and did not edit it.
- Impact analysis: GitNexus absent on this machine. Blast radius below is from `rg` over the tree at `b06ffc241`
  (weak proof per the AGENTS.md gate).
- Contract check: `node scripts/plan-contract-check.mjs --plan …` fails here with `git-addon-unavailable`, from the
  worktree and also when the main checkout's script is run with plain `node`. The plan's claim that it prints `ok`
  was **not reproduced** (F15).

## Verdict: approve-with-fixes

The plan is well built. The phase table, waves and dependencies are sound. Footprints within each wave are
disjoint. Every SM-D decision has an owning phase. Integration is last. The owner's two later answers are recorded.
But five phases are marked `ready` and would fail on their first step, or build a second door, because their
prior-art reading missed code that already exists:

- the typed-delivery step lives in `fgos-agent-protocol`, not in the run supervisor;
- the internal route is wired in `apps/fgos/src/main.rs`;
- a `session-register` SessionStart hook row already exists, owned by the Rust distribution crate;
- Identity refuses a second holder of a role unless `--take` is passed;
- a `discussion-scratchpad` Convention kind already exists;
- the config bundle is listed by hand in `packages/config/rust/src/bundle.rs`.

All fixes are local edits to phase files, footprints and one plan section. None reopens an SM-D decision.
Phases 1, 2, 5, 6, 7 and 10 may start as written. Phases 3, 4, 8 and 9 need their footprint or steps fixed first
(F2, F5, F7, F10). Phases 12, 14 and 17 need the design fixes F3, F4 and F6 before they start.

## Findings (most severe first)

### F1 — High: phase 9 moves a delivery step that is not in `supervise/terminal.rs`; the shared door already exists in `fgos-agent-protocol`

- Evidence:
  - `packages/run-supervisor/rust/src/supervise/terminal.rs:929` calls `adapter.await_ready(&mut io, READY_MS)`
    and `:947` calls `adapter.deliver_brief(&mut io, &plan.brief, &mut outbox)`. The adapter is
    `fgos_agent_protocol::terminal::Terminal` (`packages/agent-protocol/rust/src/terminal/mod.rs:265`,
    `adapter_for(cli)` `:271`, `await_ready` `:435`, `deliver_brief` `:554`, `confirm_submitted` `:605`).
  - The module doc of that adapter says: "An adapter never opens a pane, builds argv …" (`mod.rs:1-7`).
  - Per-CLI readiness and typing are already one pure state machine over `AgentIo` (claude, codex, agy, omp, pi).
  - `component-boundary.md` Run Supervisor row: the supervisor "drives the pane through the agent protocol".
- Problem:
  - Phase 9 step 2 ("Move the ready-wait + typed opening-text step from `supervise/terminal.rs` into the crate
    (`deliver_opening`) … byte for byte") would copy or fork the agent-protocol door. That breaks one door (L10,
    principle 1).
  - The plan's "Prior art … Reused" list does not name `fgos-agent-protocol` at all.
  - The plan's "Two delivery copies" risk is aimed at the wrong file.
- Fix:
  - Phase 9's `terminal` adapter calls `fgos_agent_protocol::terminal::adapter_for(cli)` → `await_ready` →
    `deliver_brief`. It uses its own `AgentIo` over Terminal Control's `Core` (the supervisor's `TermIo` is the
    model) and an empty `Outbox` for a head session.
  - Nothing moves out of `supervise/terminal.rs` in phase 9. Drop that file from phase 9's footprint.
  - Add `packages/agent-protocol/**` as read-only input to phases 1 and 9.
  - Phase 1's facts report records the cut. The gate-link/`agent_bound`/outbox loop stays in the supervisor. Pane
    allocation, launch, delivery and release are the port's.
  - This also delivers owner requirement 6a (typed visibly, by the same step worker seats use) through the step
    that really is shared.

### F2 — High: phase 9's wiring files are wrong; the internal route lives in `apps/fgos/src/main.rs`, and the run-supervisor `Cargo.toml` is outside every phase footprint

- Evidence:
  - `apps/fgos/src/main.rs:153-176` dispatches `fgos internal terminal-control` and `seat-binding` before the route
    table: "not listed in command-routes.json or help".
  - `apps/fgos/src/routing.rs` holds the public verb table (`:90` `session`).
  - `apps/fgos/src/wiring/mod.rs` declares every wiring module, so a new `wiring/session_host.rs` also needs
    `mod.rs`.
  - `packages/run-supervisor/rust/Cargo.toml:15` depends on `fgos-terminal-control`. Placing through the port needs
    a `fgos-session-host` dependency there. Phase 9's footprint lists `supervise/terminal.rs` but not this
    `Cargo.toml`, and phase 11 (`packages/run-supervisor/**`) comes a wave later.
- Fix:
  - Phase 9 footprint: replace `apps/fgos/src/routing.rs` and `apps/fgos/src/wiring/session_host.rs` with
    `apps/fgos/src/main.rs`. Add one `internal session-host` arm that mirrors `terminal-control`, plus
    `apps/fgos/Cargo.toml`.
  - Add the `fgos-session-host` dependency to `packages/run-supervisor/rust/Cargo.toml` in phase 11, which owns
    `packages/run-supervisor/**`. After F1, phase 9 no longer touches the supervisor.
  - Update the plan-level footprint to match.
  - State in the spec that the run supervisor links the crate as a library, in process. It never shells out to the
    route. The direct adapter must hand the child handle back to the supervisor, which keeps the process group,
    deadline and wait status.

### F3 — High: two-step rotation cannot pass with the Identity and head-start rules as written

- Evidence:
  - `packages/identity/rust/src/directory.rs:420` refuses a role held by a live session: "… pass --take to move
    it". `provider.rs:98,138` (`--register [--role <role> [--take]]`).
  - Phase 6 step 2 copies that refusal for `head:`.
  - Phase 12 step 1: when a live session holds `head:<persona>-<name>`, `front` it and return `{already: true}`.
  - Phase 14 step 1 calls `startHeadSession({persona, name, beside: old})` while the old session is still live (the
    two-step rule, SM-D13). It then waits until "Identity holds its registration", then moves the role.
- Problem:
  - The successor start fronts the old session instead of starting a new one.
  - If it did start, its SessionStart registration of the same `head:` role is refused. The hook is "silent on
    failure", so the wait times out every time.
  - Rotation can never succeed, which fails AC2 and SM-D2/SM-D13.
  - Phase 14 also never says how it sees that the successor "answered and named the resumed question".
- Fix:
  - Give `startHeadSession` an explicit `successorOf: <old placement>` mode that skips the one-live-head check.
  - The successor registers with no role, or with a lineage marker. Phase 14 moves the role with
    `fgos identity session --role head:<p>-<n> --take` only after the readiness signal. That is the existing
    `--take` door, no new rule.
  - Name the readiness signal concretely. Example: the successor's SessionStart loader writes `ready.json`
    `{sessionId, resumedQuestionId}` into the lineage folder, and the executor checks Identity liveness for that
    session id. Do not scrape the screen ad hoc.
  - Phase 6's owning test adds the `--take` case for `head:`. Phase 14's test covers "successor ready → role moved
    → old retired".

### F4 — High: phases 12 and 17 add a second, repo-only hook path beside the shipped `fgos hook` rows; the real owner is the Rust distribution crate (mission boundary)

- Evidence:
  - `packages/distribution/contracts/agent-hooks.v1.json` already has a claude row `kind: session-register`,
    `event: SessionStart`. It runs `"$S" identity session --register` through the project shim. Every row calls
    `fgos hook <kind>` or a `fgos` verb through `.fgos/installation/bin/fgos`, never `node scripts/…`.
  - The table owner is `packages/distribution/rust/src/agent_hooks.rs` (`KIND_SESSION` `:43`, contract
    `include_str!` `:1373`), with byte vectors in `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`
    ("the run supervisor's trust store hashes hook bytes").
  - `src/setup/agent-hooks.mjs:10-11` treats `node …/scripts/…-hook.mjs` commands as historical forms to migrate
    away from.
  - Rule 4 of the Rust module and AGENTS.md "Legacy-Node CLI Ownership Boundary" also apply.
  - `scripts/fgos-session-start-hook.mjs` is wired only in this repo's hand-kept `.claude/settings.json:162`.
- Problem:
  - Phase 12 step 4 registers the head role from `scripts/fgos-session-start-hook.mjs`. Phase 17 adds
    `scripts/fgos-session-rotation-hook.mjs`. Both run only in the fgOS repo, so in another project (D-ADR0035
    mission #1/#2) Miu never registers and never rotates.
  - Phase 12 duplicates the existing `session-register` door.
  - The footprints edit `src/setup/agent-hooks.mjs` and the contract but not the Rust owner or its goldens.
    `agent_hooks.rs` is also in the footprint of the ready plan `261117-1524-windows-plain-path-fold`, an overlap
    the plan does not list.
- Fix:
  - Phase 12 extends the existing `session-register` path. Identity reads `FGOS_HEAD_ROLE`, or the row passes
    `--role "$FGOS_HEAD_ROLE"` when it is set. No new script.
  - Phase 17 adds hook kinds behind `fgos hook <kind>` (e.g. `session-rotation` on Stop, the handoff loader on
    SessionStart) as rows of `agent-hooks.v1.json`.
  - Footprints add `packages/distribution/rust/src/agent_hooks.rs`,
    `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`, the `fgos hook` verb's owner, and the
    trust-store hash fixture if one pins hook bytes.
  - Add `261117-1524` to the overlap list. Phases 12 and 17 wait for it, or rebase after it lands.
  - `.claude/settings.json` stays a mirror regenerated by setup, not hand-edited.

### F5 — High: phase 4's consumer list and footprint are far too small; the existing `discussion-scratchpad` kind would leave two kinds for one file

- Evidence:
  - `packages/convention/contracts/convention.rules.v1.json:124` already has kind `discussion-scratchpad`, glob
    `docs/history/<feature>/DISCUSSION.md`. Its golden is at `packages/convention/rust/tests/golden.rs:280-281`.
    It is also classified `past-state` in `docs/platform/documentation/subcomponents/document-identity/spec.md:369`.
  - Phase 4 notes the kind exists but only adds `discussion`.
  - `rg "history/…DISCUSSION"` finds consumers that are outside the listed set and the footprint:
    - `src/runner/agent-roster.mjs:2`, `src/setup/skill-wrappers.mjs:4`;
    - `core/skills/_shared/executor-dispatch-fallback.md:170,243`, `core/skills/_shared/citation-format.md:10`;
    - `test/state/domain-fields.test.mjs:6`, `test/e2e/fixture-marketing-domain.test.mjs:3`;
    - `scripts/check-decision-citation-drift.baseline.json:73-85`: baseline keys contain the path text, so
      rewriting the source text changes the keys and the drift check fails;
    - `plugins/fgOS/skills/terminal/SKILL.md:37`;
    - 26 files under `docs/` outside `docs/history` (31 links).
  - Six sibling files inside moved `docs/history/<slug>/` folders link to `DISCUSSION.md` relatively, and three
    moved files carry `../` links.
  - Step 3's own `rg` (excluding only archive and plans) will hit all of these, so the phase stops at
    `NEEDS_CONTEXT`.
  - On `origin/main` the count is **41**, not 40 (F9).
  - Convention currently refuses `docs/discussions/**` as `unplaced-docs` (main commit `4defbff48`).
- Fix:
  - Replace `discussion-scratchpad` with `discussion` in one change: rename the kind, retarget its glob, update
    the golden and the document-identity table row. Do not keep both.
  - Widen phase 4's footprint to the files above, `docs/**` for link rewrites (only the matched files), the six
    sibling files, and the citation-drift baseline. Regenerate the baseline with its own script.
  - Recount on the branch base.
  - Verify must include `fgos convention check` passing on `docs/discussions/**`, and the citation-drift check.
  - Phase 4 is still wave 1 with no conflict: its widened paths are owned by no other wave-1 phase. Check phase 3:
    it touches `src/runner/*` but not `agent-roster.mjs`.

### F6 — High: phase 12 assumes bind() yields an executable command line; worker argv, env, account lease and folder trust are built inside the attempt path

- Evidence:
  - `bind()` (`src/runner/execution/bind.mjs:567`) returns a binding (`executor`, `invocation` id, `pool`, `model`,
    effort; `bindingIdentity` `:27`).
  - The pane command, env and trust come later, in the worker path:
    - `assignment-runner.mjs` builds `resolvedCmd`, `interactiveMode.kind`, `fullEnv` from `workerBaseEnv()` and
      `resolveExecutorEnv` (around `:977-1030`);
    - `herdr-round.mjs` `prepareTerminalAttempt` (`:354`) seeds folder trust (`seedAttemptTrust`/`seedWorkspaceTrust`
      `:222,334`), the account home (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`) and confinement (`establishConfinement`
      `:130`).
  - Phase 11 makes `assignment-runner.mjs` read-only. Phase 12 step 3 only says "comes from the bound executor's
    invocation, never hand-built".
- Problem: a head session started without the same trust seeding and account env shows the CLI's trust or login
  screen, or runs on the wrong account. Copying the steps into `head-start.mjs` is a second door.
- Fix:
  - Phase 1's facts report names the one function that turns a binding into `{command, args, env, trust}` for an
    interactive seat.
  - If that step is inlined in `assignment-runner.mjs`/`herdr-round.mjs`, a phase (11, or a new wave-3 phase)
    extracts it into one exported door that both the worker path and `startHeadSession` call. Footprint:
    `src/runner/dispatch/assignment-runner.mjs` with phase 11, or split.
  - Phase 12 declares that door as its input.
  - The phase 12 test asserts the head start passes the bound account env and trust seeding through it.

### F7 — Medium: phase 8 cannot register a new config section inside its footprint

- Evidence: `packages/config/rust/src/bundle.rs:17-25` lists every schema and standard section by hand with
  `include_str!`. `tests/golden_schema.rs` "fails when this list and `core/config-schema/` or
  `core/config-standard/` disagree". `packages/config/contracts/fixtures/registry-defaults.v1.json` also carries
  per-section defaults.
- Fix:
  - Add `packages/config/rust/src/bundle.rs` (keep the alphabetical order) and the registry-defaults fixture (if it
    must list the section) to phase 8 and to the plan footprint.
  - Add `cargo test -p fgos-config` to phase 8's Verify.

### F8 — Medium: owner requirement — `fgos head` is provisional (backlog `p-g2iprtzptz`), and the plan never says so

- Evidence:
  - `origin/main` commit `e584e4ab5` adds `p-g2iprtzptz` (priority high): investigate the old `fgos session`, merge
    or retire it, "then the head-session verb is renamed `fgos session` with every caller, doc and test moved and
    no `fgos head` alias left".
  - The discussion on main (same commit) records "`fgos head` is a provisional name".
  - The plan (`plan.md:92,271`, phase 15:3, phase 16:3,25,30, phase 17:3) presents `fgos head` as final.
    `p-g2iprtzptz` appears nowhere in the plan.
- Fix:
  - In `plan.md` "Owner questions" and phase 15, record that the verb is provisional per `p-g2iprtzptz`, and add
    it to `source` and Non-goals ("renaming to `fgos session` is `p-g2iprtzptz`").
  - Keep the verb literal in as few places as possible:
    - the spec verb section;
    - the registry entry;
    - the skill text of phase 16, which references it once per skill;
    - the CHANGELOG line, which marks it provisional.
  - Phase 18's report lists every place the literal `fgos head` appears (`rg -n "fgos head"`), as the input for
    the rename item.
  - Keep Identity's `head:` role kind and `FGOS_HEAD_ROLE` separate from the verb name. "head" is Identity's word
    and does not follow the rename. Say so, so the rename item does not touch them.

### F9 — Medium: the source discussion moved back to `docs/history` on main; the plan points at a path main no longer has

- Evidence: `origin/main` `4defbff48` moved `docs/discussions/secretary-miu/DISCUSSION.md` back to
  `docs/history/secretary-miu/` because Convention refuses `docs/discussions/**` (`unplaced-docs`). It also edited
  `docs/backlog.md` and `docs/platform/proposals/documentation-system-unification.md` to the old path.
- Plan places that use the branch path:
  - `plan.md:83` (`source`);
  - every phase "Inputs" line naming `docs/discussions/secretary-miu/DISCUSSION.md` (phases 1, 2, 4, 7);
  - phase 4 step 2's "if a slug already exists under docs/discussions/, stop": on this branch `secretary-miu`
    exists there, so the step stops at once if the branch is not rebased.
- Fix:
  - Rebase the plan branch on `origin/main`.
  - Point `source` and the inputs at `docs/history/secretary-miu/DISCUSSION.md`.
  - Bump `base`.
  - Phase 4 moves 41 files, this one included.

### F10 — Medium: phase 3 moves the persona renderer but leaves its existing owning cases in `test/runner/assignment.test.mjs` outside its footprint

- Evidence:
  - `test/runner/assignment.test.mjs:160-190` ("renders a # Persona section …", "omits the persona section …
    byte-identical no-op") and `:502` (persona text read as YAML) own today's persona-section behaviour.
  - Phase 3 step 5 puts "one owning test" in `agent-definitions.test.mjs` and says "Do not add a second test
    elsewhere", but cannot touch `assignment.test.mjs`.
- Fix:
  - Add `test/runner/assignment.test.mjs` to phase 3's footprint.
  - Move the render cases to the door's test, which becomes the owner. Keep one brief-wiring case in
    `assignment.test.mjs` (principle 8).
  - Name the new owner in the commit body.

### F11 — Medium: live checks in phases 12 and 18 run against the activated release, which will not know the new route or role

- Evidence: AGENTS.md: plain `fgos` runs the activated release, not edited `src/` or `bin/`. The pane's SessionStart
  row calls the project shim (`.fgos/installation/bin/fgos`). Phase 12's live check imports `head-start.mjs`
  directly, but the client must reach `fgos internal session-host`, and the opened pane's hook must accept the
  `head:` role. Neither exists in the activated release, and the hook fails silently.
- Fix: phases 12 and 18 state the precondition: run through `npm run fgos:dev` with `FGOS_HOST_BIN` set to the
  freshly built host, or build, stage and activate the integration tree on a scratch project before the live
  checks. A silent registration failure must be read back explicitly (`fgos identity session --json`), not assumed.

### F12 — Medium: SM-D13 per-persona thresholds are missing from phase 8's config shape

- Evidence: SM-D13: "the persona's project config may set soft/hard thresholds and the state files to reload".
  Phase 8 step 1 has global `soft`, `hard`, `keep`, `windowTokens` and only `personas.<name>.reload` per persona.
- Fix: `sessionRotation.personas.<name>.{soft,hard,reload}` with the global values as defaults. `decide.test.mjs`
  covers a persona override.

### F13 — Low: AC4's grep is not a reliable proof

- Evidence: `rg -n "mode.*terminal|allocateAsync" src/runner src/run-supervisor` hits non-placement text today:
  `settle-attempt.mjs:91` (a comment) and `herdr-round.mjs:369` (an error message about the terminal key). Phase 11
  allows an old-record `mode` reader, which the AC4 grep would also hit.
- Fix:
  - Make AC4 and phase 11 Verify grep for calls on the terminal client (`\.allocateAsync\(|\.releaseAsync\(|
    from '.*terminal-control/client` outside `src/session-host`) and for Rust uses of
    `fgos_terminal_control::core::Core::launch`/`allocate` outside `packages/session-host`.
  - List the allowed old-record reader by file:line.
  - Also list `src/verbs/dispatch/inspect.mjs`, `src/setup/terminal-control-checks.mjs` and
    `src/setup/registrations.mjs` (other importers of the terminal client) as read-only users that stay.

### F14 — Low: phase 13 suggests extending `fgos ask`, which is a Work-layer verb

- Evidence: `src/cli/command-registry.mjs:770-772` — `ask`: "Park an item in awaiting-human …". Work-layer changes
  are a non-goal (hand-off block).
- Fix: drop the "extend `fgos ask`" option. Use a read-only portfolio verb (e.g. `fgos questions --open`), or
  first check whether `fgos workflow status` and the plan reader already cover two of the three stages, and say so.

### F15 — Low: the "contract check prints ok" claim and phase 18 step 5 name a command that fails as written

- Evidence: both runs above give `git-addon-unavailable`. Phase 18 step 5 says to run it from the main checkout;
  plain `node scripts/plan-contract-check.mjs` there fails the same way.
- Fix: write the exact working command into plan.md "Contract check" and phase 18 (e.g. through the activated
  release payload, as the planner says it did), and paste its output into the phase 18 report.

### F16 — Low: smaller accuracy items

- Plan text says "Handoff file names are the Session Host's own runtime names", but the store is
  `src/session-rotation/handoff-store.mjs`. Say "session rotation's".
- Phase 6 adds a Convention identifier kind for the head name. If `packages/convention/rust/tests/golden.rs`
  enumerates identifier kinds, it is outside phase 6's footprint. Add it.
- Phase 8 "at rest = no in-process background task from the Stop payload". The research report does not confirm
  the Stop payload carries that. Add it to the phase 2 spike's checklist.
- Owner requirement 6a ("typed visibly into the composer"): Claude Code collapses a long paste into a chip.
  `confirm_submitted` already handles that for worker inline briefs. Phase 1's spec should say "visible" means the
  same as a worker inline brief, so the live check in phase 18(a) has a clear pass condition.

## Checklist results

### (1) Decisions and acceptance criteria → owning phases

| Item | Owning phases | Contradiction |
|---|---|---|
| SM-D1 order topics | 16 | none |
| SM-D2 automatic rotation, two thresholds, `/handoff` | 2, 8, 14, 15 (`--now`), 16, 17 | F3 blocks it in practice |
| SM-D3 core shaper, no `coding` default | 7, 10 | none |
| SM-D4 no own list, backlog row | 16 | none |
| SM-D5 rotation files, Identity authority | 8, 14 | none; F3 concerns the Identity use |
| SM-D6 one spine, one host port, two thin verbs | 1, 9, 11, 12, 15 | F1, F2, F6 (second doors) |
| SM-D7 protocol | 16 | none |
| SM-D8 discussions location | 4 | F5, F9 |
| SM-D9 three stage places | 7, 13 | F14 |
| SM-D10 one persona door | 3, 12 | none; F10 is test ownership |
| SM-D11 tier `standard` | 12, 16 (`runner.personas.<p>.tier` exists, `core/config-schema/runner.schema.yaml:57`) | none |
| SM-D12 classify with `fgos-clarifying` | 7, 16 | none |
| SM-D13 generic rotation, spike, two-step | 2, 8, 14, 17 | F3, F12 |
| AC1 start door | 12, 15, 18 | F4, F6, F11 |
| AC2 rotation | 14, 17, 18 | F3 |
| AC3 handoff files | 8 | none |
| AC4 host port, no second placement | 1, 9, 11 | F1, F13 |
| AC5 non-coding classification | 7, 10, 18 | none |
| AC6 discussions | 4 | F5, F9 (count 41) |
| AC7 question batch | 13 | none |
| AC8 suites green, one proof | 18 + each phase | F10 |

### (2) Feasibility

- Host-port contract and Rust home: sound. `component-boundary.md:95` confirms the supervisor is Rust and links
  `fgos-terminal-control` in process, so a Rust port between layers 2 and 4 is the right home.
- Lifting `direct`/`terminal` out of `src/run-supervisor/direct-launch.mjs:185,208`: the Node side is small (only
  `herdr-round.mjs:448` calls `allocateAsync`). The Rust side is where the work is (`supervise.rs`,
  `terminal_slot.rs`, `adopt.rs`).
- Blockers: F1, F2, F6.
- Terminal Control quoting: `launch_line` shell-quoting is reused through `Core::launch`. The supervisor's own
  `shell_quote` in `supervise/terminal.rs:264` builds the launcher script. Phase 1 should say which of the two the
  port uses for a head command (the `Core::launch` path), so no third quoting appears.
- Phase 5 (focus) is feasible as written.

### (3) Cold-run shape

- Every phase file has inputs, footprint, ordered steps, verify and rollback.
- Footprints within each wave are disjoint by fixed prefix: checked waves 1–8, including the hot files
  architecture manifest (8/9/13 in waves 2/3/4), skill renders (4/7/10/16 in waves 1/2/3/7), and the hook files
  (12 in wave 4, 17 in wave 7).
- Every phase sits in a later wave than all of its dependencies.
- The integration phase 18 is last.
- The gaps are footprints that miss real files (F2, F4, F5, F7, F10), which turn "cold run" into `NEEDS_CONTEXT`.

### (4) Overlap with 261117-1553 and 261117-1524

- The plan's list is correct for 1553: `bin/fgos.mjs`, command registry and manifest, `test/cli/**`, run-supervisor
  spec, CHANGELOG, census. Gating phases 13, 15 and 18 on both plans being `done` resolves it.
- `blockedBy: []` plus per-phase `draft` is an acceptable use of plan-contract §5.
- Missing overlap with 1524: `packages/distribution/rust/src/agent_hooks.rs`, once F4 is fixed. Phases 12 and 17
  must also wait for 1524 or rebase on it.
- 1524's own `source` is `docs/history/windows-plain-path-fold/DISCUSSION.md`, a file phase 4 moves. Plans are
  records and stay untouched, but tell 1524's owner or land phase 4 after 1524 so its source link does not dangle
  while it runs.

### (5) Prior art, test policy, install gate

- Reused correctly: the agent-definitions door, Terminal Control route and core, `identity session --register`,
  workflow gates, the plan reader.
- Missed:
  - `fgos-agent-protocol` terminal adapters (F1);
  - the `session-register` hook row and the Rust hook table (F4);
  - `discussion-scratchpad` (F5);
  - the binding→argv/env/trust step (F6);
  - `identity --take` (F3);
  - the config bundle list (F7).
- Test policy: each phase names one owning proof and one wiring proof per boundary; phase 11 retires moved cases.
  Exception F10.
- Install gate:
  - config-standard and config-schema: phase 8, plus F7;
  - doctor-registry row: phase 17;
  - CHANGELOG: phase 18;
  - a new runtime route `fgos internal session-host`: consider whether it needs a doctor row like
    `run-supervisor-route`. Follow `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.

### (6) Owner requirements added after settling

- Opening prompt typed visibly as full text: the intent is carried (plan.md Outcome 3, phase 1 step 3, phase 9,
  phase 12 step 3, AC1). But the mechanism must be the real shared step (F1), with a stated pass condition
  (F16, last item).
- `fgos head` provisional (`p-g2iprtzptz`): **not reflected** (F8).

## Phases that may start now

1, 2, 5, 6, 7, 10 as written. Phases 3, 4, 8 and 9 start after their footprint or step edits (F10; F5 and F9;
F7; F1 and F2). Phases 12, 14 and 17 stay `draft` until F3, F4 and F6 are fixed in their files. Phase 11 waits for
the F6 decision on who owns the extracted door.
