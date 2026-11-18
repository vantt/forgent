# Validation and red-team: owner-question store plan

Reviewer: independent code-reviewer subagent, 2026-11-18. Read-only on the plan; this file is the only write.
Plan at HEAD `f9f371270` (branch `plan/owner-questions`, base `570780a58`). Blockers read on `origin/main`
(`758312333`) and the supervisor plan on `origin/plan/supervisor` (`f1cd5635e`).

Verdict: **not ready**. Two critical design gaps (confined heads cannot use the door; a contradictory lock proof),
nine high findings, the rest medium or low. Most of the line references are correct (list in section C).

## A. Critical

### C1. Confined heads and workers cannot write the store, and the Stop hook then loops
- Evidence: the main askers are heads (shaper, planner, supervisor, lead, Miu), and heads are confined. A grant can
  never bind `.fgos` writable (`src/runner/dispatch/confinement/workspace-paths.mjs:26-31`). A shaper's grant writes
  nothing (`src/session-host/head-grants.mjs:26`), and the secretary writes only `plans`, `docs/backlog.md` and
  `docs/discussions` (`head-grants.mjs:22-24`). From inside a confined head, writes go through its request socket
  (`CHANGELOG.md:17`).
- `ask`, `answer --via secretary`, `ack` and `cancel` all append under `.fgos/observe/questions/` and take
  `.fgos/locks/observe.lock` (QP-2, phase 3 step 3). Inside the sandbox those writes fail with EROFS or EACCES.
- The hook writes its notice state to `.fgos/runtime/questions/notified/<session>.json` (QP-11). Inside a head that
  write fails, and the error path "prints nothing" (phase 6 step 2). The hook then blocks again at every Stop. `ack`
  cannot clear it, because `ack` cannot write either. The plan never mentions `stop_hook_active`, although the
  mailbox adapters already handle it (`packages/mailbox/rust/store/src/adapters/claude.rs:15`). Result: a Stop loop
  that never ends in exactly the sessions the feature exists for.
- Nothing in the footprint touches `head-grants.mjs`, `packages/run-supervisor/contracts/head-request.v1.json` or
  `head_request.rs`.
- Fix:
  - Add `questions ask|ack|cancel` (all heads) and `questions answer --via secretary` (secretary only) as head-request
    verbs, served by the head's run supervisor. That supervisor resolves the asker from the head it serves, which
    also makes the asker impossible to forge.
  - Add those three files to the footprint, in a phase after phase 4.
  - Make the hook block only when `stop_hook_active` is false and need no state it must write. Either derive
    "noticed" from the store through the socket, or block once per turn until `ack`.
  - Add a hook test that runs inside a confined head and a test for a write that fails.

### C2. Acceptance 3 contradicts the store design
- Acceptance 3 (plan.md:161-163) says "a held Observe lock leaves the question recorded and only raises the write
  door's counter".
- The question store takes the same lock: `acquire_store_lock` (`packages/observe/rust/src/store_lock.rs:43`, 4 s
  wait), and the write door takes it too (`origin/main:packages/observe/rust/src/record/store/door.rs:164`, 500 ms
  wait).
- While another process holds the lock, `ask` either waits up to 4 s and fails with `observe-lock-timeout`, or the
  test passes only because it uses a second fixture root. In that case the test proves nothing about production.
  `observe-lock-timeout` is also missing from the refusal list (phase 1 step 4).
- Fix: either give the store its own lock (a `questions` holder-lock registered in
  `packages/holder-lock/contracts/lock-registry.v1.json`), or restate acceptance 3 as "the event write fails open
  while the questions append succeeds". Whichever is chosen, add the timeout refusal to `refusals.v1.json`. See H4
  for why a separate store is the better answer.

## B. High

### H1. `answer-not-owner` can be bypassed, and the gateway's identity is undefined
- QP-16 decides "agent session vs owner" by whether a session resolves. Identity resolves from four environment
  variables or from "a process holding a terminal" (`packages/identity/rust/src/resolve.rs:9-14`;
  `current.rs:154-171`).
  - The owner's own terminal shell resolves too (pid source), so "a terminal with no agent session" has no
    definition.
  - An agent that runs `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID fgos questions answer …` changes how it
    resolves.
- The gateway's MCP surface runs LLM-written Rhai against bound functions (`apps/fgos-gateway/src/mcp.rs:1-30,
  469`). Phase 7 adds `answer_question` to that surface, and QP-16 lets the gateway token answer as the owner. Any
  agent with gateway MCP access can therefore answer as the owner.
- The gateway shells `fgos` through `run_verb_blocking` (`gateway.rs:427`). That child inherits the environment of
  whoever ran `fgos gateway start`, often an agent session, so the answer may be refused, or attributed to that
  agent.
- Fix:
  - Classify an agent by its process ancestry (`resolve::ancestry_cli`), not by its environment.
  - State plainly in the spec that the rule guards against mistakes and is not a security control.
  - Do not expose `answer_question` on the MCP surface; keep REST answer only, for the dashboard user.
  - Have the gateway pass an explicit, authenticated owner context, such as the `Caller` from `require_token`
    (`gateway.rs:440`), and record it as `via: gateway:<caller>`.

### H2. A rotated head never gets its own answer
- The key is question id + session id (OQ-D5, QP-11). Heads rotate as their normal lifecycle: the successor has a
  new session id, and Identity moves the role (`apps/fgos/src/wiring/session_rotation_hook.rs:1-9`).
- A question asked by Miu or a lead before a rotation is therefore never shown to its successor. `ack` from the
  successor is refused too, because only the asker or a `--for` successor may ack (QP-4).
- Fix: when the asker held a `head:` role, match and authorize on that role as well as the session id. Add a
  rotation case to acceptance 5.

### H3. The successor `--for <id>` has no owner
- QP-4 and QP-15 let "a session started as its successor (`--for <id>`)" ack and cancel.
- No plan builds it:
  - this plan's footprint has no `session start` change;
  - session-verb keeps the verb in Node and adds no `--for` (`origin/main:plans/261118-0947-.../plan.md`, SV-10);
  - the supervisor plan never mentions `--for`, `ack` or `question-answered` (grep over every file of
    `origin/plan/supervisor:plans/261118-1045-project-supervisor/`).
- Nothing says where the successor link is stored or how `ack` reads it.
- Fix: name the owner (the supervisor plan, phase 12 or 16) and the storage, for example an Identity role
  `answers:<qid>` set at start. The successor path then reuses the role check from H2.

### H4. The cross-machine premise is false: Observe shards do not sync
- QP-4, the Risks table and DISCUSSION §3 row 8 assume "sync is by git".
- In the main checkout, `.fgos/observe/friction/*.jsonl` sit untracked (`git status` shows `??`). Only 4 old shard
  files were ever committed (`git ls-files .fgos/observe`), and no code commits Observe shards (`rg "\.fgos/observe"
  packages/git src/git .githooks` finds nothing).
- So a question asked on one machine is invisible to `fgos questions`, S04 and Miu on another. Merging answers
  "earliest wins" across machines never happens.
- The Event Store is already the "single authority for how an fgOS event ... is shared across machines"
  (`docs/platform/component-boundary.md:95`). The supervisor's event queue already lives there (supervisor phase 8).
  The plan's prior-art section never mentions it.
- Fix: either make the store an Event Store consumer (`packages/event-store/contracts/consumers.v1.json`), which
  also settles C2 and M5, or say plainly that the store is per machine and file a backlog row. This touches the
  storage half of OQ-D2, so it is a decision question for the owner if the planner does not choose the Event Store.

### H5. The supervisor plan does not reflect the agreement this plan records
- plan.md:231-239 says the supervisor plan lists this plan in `blockedBy`, uses the bare `fgos questions`, and has
  its watcher read `core/questions/definitions/`. On `origin/plan/supervisor`:
  - `blockedBy` lists only secretary, session-verb, ops-metrics and S5 (lines 6-10);
  - it still uses `fgos questions --open` (plan.md:111, phase-18:8 and 18), which this plan deletes with no alias;
  - its definitions live in `core/watcher/` (phase 13).
- Their footprints overlap: `gateway.rs`, `types.ts`, `command-routes.json`, `command-manifest.json`,
  `doctor-registry.v1.json`, `observe_declarations.rs`, `bin/fgos.mjs` and the census (supervisor phase 16 and
  19).
- Fix: get the supervisor plan edited (`blockedBy`, verb name, definitions path, `--for` owner) before this plan
  goes `ready`, and cite its commit. Until then, mark it as an open cross-plan dependency.

### H6. `--ref` is checked against the main checkout, but draft plans live on branches
- QP-7 and phase 3 step 5 check `plan:<dir>` and `discussion:<topic>#Qn` "against the main checkout root". This
  plan, and every draft plan and shaping discussion, exists only on its worktree branch until it lands.
- A planner therefore cannot ask about its own draft plan: it gets `ref-invalid`.
- Fix: check the ref against the caller's own checkout (cwd worktree), and record the branch and commit with it.
  When the ref is missing, warn and still accept the question.

### H7. Deleting the reader breaks a test and the architecture manifest that phase 4 does not own
- `test/cli/questions-verb.test.mjs` drives `fgos questions --open` through `bin/fgos.mjs`, and it is outside every
  footprint.
- `docs/architecture-manifest.json:1480` maps `src/portfolio/open-questions.mjs` to a layer. Phase 4 deletes the file
  and adds `work-questions.mjs`, but only phase 3 owns the manifest.
- `sectionText` in `src/portfolio/plan-sections.mjs:27` loses its only caller, and nothing retires it.
- Fix: add `test/cli/questions-verb.test.mjs` (retire it, and name `apps/fgos/tests/questions_verb.rs` as the new
  owner) and `docs/architecture-manifest.json` to phase 4 and the frontmatter. Drop `sectionText`.

### H8. Generated and hot files are written by phases that do not own them
- The census pins `src/cli/command-registry.mjs`, `src/setup/agent-hooks.mjs`, `src/session-host/head-start.mjs` and
  every skill render (`packages/git/contracts/mutation-census.v1.json:1013,1237,1233`, `.agents/skills/**`).
- Phases 6 and 8 change those files, but only phase 4 owns the census. Phase 9 step 1 "regenerates the command
  manifest, the census and the skill surfaces", yet none of those are in phase 9's footprint.
- Phase 2 changes the mint kinds, but `packages/identity/contracts/identity.write.v1.json:78`,
  `src/cli/command-registry.mjs:1153-1157` (the enum), the generated manifest and `core/instructions/id-minting.md:15`
  all list the kinds and are outside its footprint.
- The plan frontmatter misses `test/fixtures/questions/**` (phase 5), `test/cli/**` and
  `docs/platform/component-boundary.md` (see M7).
- Fix:
  - Give the census to phases 6 and 8, which are serial waves, or to phase 9 alone, and say which.
  - Add the census, the manifest and the renders to phase 9.
  - Add the four identity and registry files to phase 2.
  - Bring the frontmatter in line.

### H9. The plan waits on all of ops-metrics when it needs only three phases
- The write door has landed (`origin/main` `4fddbb722`; `RecordDoor::write`). The definition runner is ops-metrics
  phase 7, still `ready`.
- `blockedBy: 261118-0936-ops-metrics` holds this plan behind 16 phases. Phases 1-3 need only ops-metrics phases 1
  and 4, plus the session-verb Identity change for phase 3. Priority #1 (ship faster) and plan-contract §5
  ("every phase the answer does not touch is marked ready").
- Fix: state the real dependency for each phase. Phases 1 and 2 can be `ready` now, phase 5 waits for ops-metrics
  phase 7, and phase 3 waits for session-verb phase 4.

## C. Medium

- **M1. A second Node bridge where one already exists (one door, RUL104).**
  - QP-10 runs `work-questions.mjs` "the way `bridge.rs` runs its module". That would make a second bounded path into
    Node.
  - The doors table names the doctor bridge as "the one bounded way a native verb reaches Node", with `retiredBy`
    S7 (`docs/architecture-manifest.json:1175`). The bridge already carries one non-doctor request, `work-store-init`
    (`apps/fgos/src/wiring/doctor/bridge.rs:9-11`).
  - A hand-written deadline loop would also hit the "run a bounded child" door (`architecture-manifest.json:404`).
  - Step 3 also adds a new `fgos ask` (awaiting-human) reader in Node. That is new code, not code moved from
    `open-questions.mjs`, which reads only QUESTIONS.md, plan sections and gates (`open-questions.mjs:1-11`).
  - Fix: add a `work-questions` request kind to the existing bridge, and its contract
    `packages/distribution/contracts/doctor-bridge.v1.json`. Add those files to the footprint. Say that this extends
    a mechanism that is due to retire.
- **M2. Two validators for one five-part template (principle 7, OM-D13).**
  - `src/state/decision-question.mjs:1-4` is "the one check for every door that asks the owner to decide". The plan
    adds a second one in Rust, with different rules: the Node side is stage-based for discovery questions and
    requires `MIN_PART_CONTENT` of 20; the Rust side uses an `--open-discovery` flag and the QP-19 limits.
  - The existing `fgos hook decision-question` on `AskUserQuestion` (`.claude/settings.json`;
    `src/setup/agent-hooks.mjs:218`) is a live second way to ask the owner, and the plan never names it, although
    the outcome says "every question goes through one door".
  - Fix: name `questions-input.v1.json` the rule authority, and file the fold of `decision-question.mjs` and the
    AskUserQuestion path as a backlog row, or list them as non-goals.
- **M3. Some QP-19 rules are too strict, and some can be gamed.**
  - "never 'as above' or a bare code" cannot be measured. A deny-list is English-only (the owner reads Vietnamese,
    for example "như trên"), and "bare code" would refuse legitimate ids (`q-…`, `D-ADR…`).
  - "One question is one decision" cannot be checked by a program, yet it is listed as a refusal rule.
  - `--open-discovery` is declared by the caller, so any agent can use it to skip the option rules.
  - JSON Schema `maxLength` counts code points, while Rust `len()` counts bytes, which matters for Vietnamese text.
  - Fix: keep only the measurable rules in the contract (lengths, counts, exactly one recommended, `blocks` present,
    `scope` as two fields `allows`/`forbids`). Move the other two rules to the writing guide. Tie discovery to the
    `stage` field the way the Node checker does, and count characters, not bytes.
- **M4. The answered-question definition has no "not acked yet".**
  - Phase 5 falls back to "emit every answered question and let the watcher dedupe", because acks are not events.
  - The supervisor then wakes for every answer, including ones the asker already acked through the hook. That costs
    one LLM wake per answer.
  - Fix: declare and emit `fgos.question.acked` too, and let the definition anti-join on it. Ops-metrics phase 5
    already proves anti-joins.
- **M5. The store lives in Observe's directory under Observe's lock, although OQ-D2 says "not Observe".**
  - Observe's spec lists its own four stores (`docs/platform/observe/spec.md:62`). Readers that walk
    `.fgos/observe/*`, and the friction migration (ops-metrics phase 13), have to learn about a store they do not
    own.
  - If H4 does not move the store, use a root of its own (`.fgos/questions/`) through the shard door's `root`, so
    only the code is reused, not the directory. That needs `store_dir` to take a parent directory, a small additive
    change to `shard.rs:98`.
- **M6. S04 does not cover DISCUSSION acceptance 4.**
  - That acceptance says S04 "shows and answers the same set" as `fgos questions`, which includes Workflow gates.
    Plan acceptance 7 and phase 7 show store questions and `fgos ask` items, but no gates.
  - `GET /v1/questions` also returns the `work` section, while S04 keeps `listWork(awaiting-human)`, so `fgos ask`
    items would show twice.
  - Fix: S04 renders exactly what `/v1/questions` returns, gates included, and drops its own `listWork` call.
- **M7. The new area is registered in the wrong map.**
  - Phase 9 adds the area to `docs/platform/system-overview/spec.md`, but that file has no area table (no Observe
    row). The area map is `docs/platform/component-boundary.md:82,117`, which supervisor phase 1 uses.
  - Fix: register the area in `component-boundary.md` and `docs/reading-map.md`. Optionally add a `questions` row to
    the holder table in `docs/platform/governance.md:540`, since the spec carries decision history.
- **M8. Migrated questions go to a session that is gone.**
  - QP-13 makes the cutover session the asker. The hook then tells the short-lived cutover leader, never the plan's
    planner, and `ack` by the real owner of the question is refused.
  - Fix: let the hook and the supervisor treat a `migrated: true` record by its `ref` owner, or allow `ack` by role
    on `--migrated` records.
- **M9. The Stop hook blocks once per question.**
  - "Blocks once per answered question" (QP-11) gives N continuations for N answers.
  - Fix: one block per Stop listing every unnoticed answer, guarded by `stop_hook_active`.
- **M10. The doctor row duplicates an existing judgment.**
  - The Claude and Codex hook rows are judged by `dispatch-decide-hook-wired`, `codex-hook-wired` and the like (owner
    `rust:packaging`), not by a row per hook kind. A `questions-hook` row creates a parallel judgment.
  - The notice-state directory grows without bound, since files of dead sessions are never pruned.
  - Fix: extend the existing `*-hook-wired` rows. Prune notice files through the verb, or drop the state entirely
    (C1).

## D. Low

- **L1.** QP-8 names `record::write`, but the landed door is `RecordDoor::new(root, embedded, payload_root).write(Record)
  -> WriteOutcome`. Its duplicate check runs only inside one writer's shard (`door.rs:208-220`), so a replay from
  another process is not idempotent.
- **L2.** QP-14 calls `list_questions` and `answer_question` "MCP tools", but the gateway MCP exposes only `search`
  and `execute` with Rhai bindings (`mcp.rs:300,469`).
- **L3.** `src/session-host/head-start.mjs:97` already tells heads to run the bare `fgos questions`, which fails today
  (`bin/fgos.mjs:2273`: "requires --open"). Phase 4 step 6 has nothing to do, but the live bug is worth a CHANGELOG
  note.
- **L4.** QP-6 reads the persona from `head:<persona>`, but the role is `head:<persona>-<name>`, and the split is
  ambiguous (`head-grants.mjs` comment on `grantOf`). Use `FGOS_HEAD_PERSONA` through Identity, or the grant table.
- **L5.** Phase 6 adds rows that `fgos setup` writes into committed files (`.claude/settings.json`,
  `.codex/hooks.json`, `.agents/hooks.json`), and those files are outside the footprint.
- **L6.** The plan-contract check cannot run from the worktree (`git-addon-unavailable`, confirmed). Its `ok` comes
  from a PyYAML scratch copy, which is not the repo's YAML door. Run it again through `npm run fgos:dev` or on the
  main checkout before `ready`.

## E. Claims checked and correct (section A of the brief)

- The shard door: `shard.rs:75,149,194,206,279` and `store_lock.rs:43`, with the 4 s wait and the
  `.fgos/locks/observe.lock` path.
- Identity: `current.rs:154` (signature `(state_root, caller_pid, fgos_dir)`; SV-6 removes `fgos_dir`, which phase 3
  step 0 covers), `directory.rs:66` (roles), and the `directory` feature.
- Mint: `mint.rs:18-26,65-80`.
- Host wiring: `routing.rs:80,97-109`, `main.rs:107,285`, `cli_projector.rs:61` and `invocation_doors.rs:475`.
- Node and census: `command-registry.mjs:287,1416`, `bin/fgos.mjs:2273`, census `:1065`, `docs/reading-map.md:191`,
  `core/skills/fgos-secretary/SKILL.md:44` and `CHANGELOG.md:12`.
- Gateway: `run_verb_blocking` at `gateway.rs:427` (close to the cited `:432`) and routes at `:1270`.
- Verify targets: the crate names `fgos`, `fgos-identity` and `fgos-distribution`; `scripts/run-tests.mjs`;
  `npm run build:skills`; `npm run fgos:dev`; and the vitest web test all exist.
- Ops-metrics non-goals do give the `fgos.question.*` declaration and its producer to this component, so QP-8's
  override of OM-D11 holds.
- Within each wave, the phase footprints in the table are disjoint, and every phase sits in a later wave than its
  dependencies.

## F. Coverage of the DISCUSSION

- OQ-D1, D3, D5, D6 and D7 are kept, with the caveats in H2, H3 and M8. OQ-D7's asker `migrated` became a marker
  flag. QP-13 states this with its reason, so it is not a silent reversal, but see M8.
- OQ-D2's "sync by git" premise is false (H4).
- OQ-D4's "same set in S04" is only partly covered (M6).
- DISCUSSION acceptance 1, 2, 3, 5, 6, 7 and 8 map to plan acceptance 1-9. Acceptance 3 has the C2 contradiction,
  and acceptance 4 is only partly covered for S04 (M6).

Status: DONE_WITH_CONCERNS
Summary: Not ready: confined heads cannot use the door (C1), acceptance 3 contradicts the store's own lock (C2), and
nine high findings remain (owner-rule bypass, rotation, successor owner, no cross-machine sync, supervisor plan
mismatch, ref check on branches, footprint and generated-file gaps, blocker scope).
