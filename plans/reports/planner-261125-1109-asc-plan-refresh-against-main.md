# ASC plan refresh against main (2c27d499a)

Plan: [plans/261122-1946-agent-start-context/plan.md](../261122-1946-agent-start-context/plan.md). Written on
`f03efc32e` (2026-11-22), re-checked on `2c27d499a` (origin/main, 2026-11-25). Status stays `draft`, with no `lead:`
line: the owner wants a deep discussion of this plan before anything starts. Owner-settled ASC-D1 to ASC-D7 and the
approved ACE boundary are unchanged.

## 1. Facts pass (claim -> state on 2c27d499a)

| Claim in the old plan | State | Evidence |
|---|---|---|
| Blockers `261118-1341-s6a`, `261122-0118-heads-stable-and-able` | gone (both `done`) | their `plan.md` frontmatter |
| Phase 1 files (`session-attempt`, `assignment-runner`, `herdr-round`, `brief`, `assignment`, `transport`.mjs, `run-supervisor/direct-launch.mjs`) | still present, now owned by running plan `261122-2108` (dead set of 63 files) | `261122-2108/reports/closure.md` rows 3, 15, 16, 17, 30, 37, 41 |
| `docs/architecture-manifest.json` (owners, tiers, "every file declared") | gone, retired into `packages/component-authority/model/` | `343984e07`; registry reads model at `instruction-registry.mjs:448-486` |
| Governance holder table, system-overview area map are hand-edited | changed: generated from the model (`fgos authority render`) | `governance.md:547-561`, `system-overview/spec.md:41-82,105-290` |
| A new component just needs a spec row | changed: `fgos authority declare --kind component --approved-by <answered q-id>` | `command-manifest.json:1048`; component-authority spec §3.2 |
| `src/setup/agent-hooks.mjs` (Node hook table) | gone; table is Rust only, installed by `fgos doctor --fix --only <cli>-hook-wired` | `4259868c5` |
| `scripts/fgos-session-start-hook.mjs` is the SessionStart hook | changed: repo-only path injector wired by `.claude/settings.json:162`; the distributed verb is `fgos hook session-rotation --event session-start` | `agent-hooks.v1.json` rows; `command-manifest.json:2005` |
| Hook rows for claude/codex/agy | changed: only under `rowsMailboxOn` (mailbox opt-in); SessionStart rotation row is claude only | `agent-hooks.v1.json` |
| `apps/fgos/tests/unit_run_host.rs` | never existed; tests live in `apps/fgos/src/wiring/unit_run_host/tests/` | `git log --all` empty |
| `openingText`, `FIRST_STEPS`, `taskBriefOf` in `head-start.mjs` | still true (lines 114, 104, 111; `defaultOpening` 99) | |
| `renderPersonaSection`, `renderOnWake` | still true (`agent-definitions.mjs:310,291`); importers: `head-start.mjs:100`, `dispatch/assignment.mjs:48` (dead set) | |
| `persona.rs:310` persona rendering | still true; called by `HostPrompt` at `unit_run_host/execution.rs:391-418` | |
| `scripts/project-agents.mjs:110` renderer | still true (`projectAgentMarkdown` line 111) | |
| `PromptPort` `builder.rs:34` | still true; `render_assignment_prompt` 757; builder is 1,103 lines | |
| Claim rendered twice `builder.rs:887`, `brief.rs:351` | still true; renderer moved to `packages/execution/rust/src/run_result/claim.rs:94` (crate `fgos-execution`) | |
| `role_tasks_data.rs` in the engine | changed: `packages/execution/rust/src/loops/role_tasks_data.rs` | |
| `launch-session` `opening` at `session_attempt.rs:154,195,310` | still true; host side also reads it at `unit_run_host/session_attempt.rs:137-140` | |
| `execution-door.mjs:376` | still true | |
| `instruction-registry.mjs:573-640` `discoverInstructionSources` | changed lines: 588; registry still Node (nothing moved to Rust); authority order `composition.mjs:66`, specificity `registry.mjs:74-83` still true | |
| `appliesTo` ~line 307 | still true (308-317) | |
| Unit roots | 4 core units, 1 component root (`packaging-distribution`), 1 domain root (`coding`, 2 units) | `ls` |
| `buildHandoff` in `rotate.mjs` | changed: `src/session-rotation/handoff-store.mjs:66`; `placeHead` call `rotate.mjs:571` | |
| `session_start_context` hook ~line 265 | changed: call at `session_rotation_hook.rs:340`; `handoff.rs:190`, `CONTEXT_LIMIT` 10,000 still true | |
| `taskOfHead` ~213 | still true | |
| Domain on items (P10) | still absent: 0/534 backlog files, 0 plans carry `domain:`; open discussion `ds-ubqlutna6r` may settle it | |
| Persona `on_wake` "already carried" | partly: only `lead`, `planner`, `supervisor` of 14 | |
| L8 at `platform-foundations.md:284-306` | still true | |
| Anchor tests | still true, plus `test/docs/run-doors-doctrine.test.mjs` | |
| RUL102 | present at `packaging-distribution/spec.md:248,838`; composition contract row provider `packaging-distribution` in `contracts.yaml:509` | |
| Per-start record "JSONL under observe" | changed: Observe has a record v2 door (`record/store/door.rs`, kinds via `observe_declarations.rs`); reuse it | observe spec lines 83, 121-126 |
| Worker prompt capturable by a Node recorder | false: `apps/fgos` is a binary crate with no lib target; no host op renders a prompt without running a unit | `apps/fgos/Cargo.toml`; `execution-routes.v1.json` ops |
| Runner item P14 (templates) | still open, backlog `p-gd3rm7rbvw` (proposed); `work-compat.mjs` 176 lines (discussion said 393 with templates) | |
| ~12 text-forming places | see §2 | |
| AGENTS.md bytes | 50,860 (discussion: 50.8 KB) | `wc -c` |

## 2. Text-forming places today

1. `head-start.mjs` `openingText` + `FIRST_STEPS` + hardcoded ritual (Node).
2. `agent-definitions.mjs` `renderPersonaSection` + `renderOnWake` (Node).
3. `unit_run_host/persona.rs` `persona_section` (Rust host).
4. `scripts/project-agents.mjs` `projectAgentMarkdown` (Node build script).
5. `builder.rs` `render_assignment_prompt` (engine).
6. `claim.rs:94`, rendered twice (`builder.rs:887`, `brief.rs:351`).
7. `brief.rs` `render_brief` / `render_pointer`.
8. `role_tasks_data.rs` (now in `fgos-execution`).
9. `contract/templates.rs` + `core/prompt-templates/*`.
10. `src/runner/prompt-templates/*.txt` + `work-compat.mjs` `buildPrompt` (+ `src/runner/prompt-templates.mjs`; `dispatch/operation-prompt-templates.mjs` is in the dead set).
11. Handoff: `handoff-store.mjs` `buildHandoff` + `handoff.rs` `session_start_context`.
12. `dispatch/assignment.mjs` `renderAssignmentPrompt` (dead set, deleted by `261122-2108`).

Also forming start-adjacent text, outside this plan: `instruction-projections.mjs` (AGENTS.md projection, setup time)
and `scripts/fgos-session-start-hook.mjs` (repo-only paths line).

Phase 5 removes 1-4 and the duplicate of 6; 7 handles 11 (phase 7); 12 goes with `261122-2108`; 5, 7, 8 stay
Execution's assignment payload; 9-10 move with P14 part 2. So "12 places become 1" was an overstatement: the
one-producer test covers persona, ritual, on-wake and opening text. The plan's Outcome now says that.

## 3. What changed in the plan and why

- Phase 1 removed (file deleted); acceptance 2 now says plan `261122-2108` is `done` before phase 5. Phase ids kept.
- `base:` -> `2c27d499a1…`. `blockedBy:` -> `261122-2108`, `261124-0004` (both running; s6a and 0118 are done). A
  per-phase "Waits on other plans" table keeps phases 2 and 4 `ready` and startable now.
- Waves renumbered 1-6 (2,4 / 3 / 5 / 6,7,8 / 9,10 / 11).
- Phase 2 shrunk to new files only (spec, contracts, vectors). Reading-map row, model rows, generated views and the
  RUL102 amendment moved to phase 3, because `docs/reading-map.md`, `packaging-distribution/spec.md` and
  `component-authority/model/**` are held by `261122-2108` (and `reading-map.md` row-level by `261114-2051`).
- Phase 3: registration through `fgos authority declare` (+ render), RUL102 amendment, `RecordSink` over Observe's
  `RecordDoor` with a declared `start-context` kind instead of a private JSONL (one door, RUL104).
- Phase 4: head and agent-file goldens only; worker goldens moved to phase 5 step 1 as a host test (see §1); measures
  `.claude/rules` in the main checkout.
- Phase 5: paths fixed (`claim.rs`, `role_tasks_data.rs`, host `session_attempt.rs`, `HostPrompt`); manifest rule ->
  `model/doors/` row; recapture step for persona files changed by `261124-0004`; templates explicitly stay for P14.
- Phase 6: owner gate (note 3) written into the phase; host-binary need of `build:skills` named.
- Phase 7: `handoff-store.mjs` added; line numbers fixed. Phase 8: domain facts and `ds-ubqlutna6r` pointer.
- Phase 9: 32 KiB Codex limit as a check; re-read sections on base. Phase 10: Rust-only hook table, mailbox opt-in
  rows, `fgos-session-start-hook.mjs` dropped from footprint, schema file name `startContext.schema.yaml`.
- Phase 11: token table counts the always-loaded text per start, external blocks as their own line.
- Footprint: removed `docs/architecture-manifest.json`, `src/setup/agent-hooks.mjs`, `scripts/fgos-session-start-hook.mjs`,
  `apps/fgos/tests/unit_run_host.rs`, `src/runner/dispatch/*`, `src/run-supervisor/*`, `test/runner/**`,
  `test/run-supervisor/**`, `test/golden-recorders/**`, `core/config-schema/**`; added the model, generated views,
  `observe_declarations.rs`, `command-routes.json`, `handoff-store.mjs`, `test/runner/agent-definitions.test.mjs`,
  `core/config-schema/startContext.schema.yaml`.

## 4. Collisions (simulated with the checker's own `activeOverlaps`)

- Phases 2 and 4: none against any `ready` or `running` plan.
- Whole plan: `261122-2108` (model, unit_run_host, execution contracts, head-start/agent-definitions tests,
  architecture test, reading-map, packaging-distribution spec), `261124-0004` (head-start.mjs + test, routing.rs,
  command manifest/routes, Cargo.lock, secretary/supervisor persona and agent files, three model door files),
  `261124-2320` (`CHANGELOG.md`).
- Row-level, no frontmatter footprint: `261114-2051` phase 11 (AGENTS.md legacy-Node paragraph, reading-map line 144);
  draft `261122-2110` (core/agents, routing.rs, wiring/mod.rs).
- Checks: `plan-contract-check`: `ok`. `fgos resource-check --plan` (from the main checkout): `accept (10 units, 0
  findings)`, all collisions cross-wave, critical path 2 -> 3 -> 5 -> 6 -> 9 -> 11.
- Note: `plan-contract-check` reads the model through `fgos authority model`, which built the Rust host in this
  worktree once (an implicit `cargo build`, not a test run).

## 5. Points to discuss with the owner

1. **The token saving comes late and is smaller than "AGENTS.md shrinks".** Always-loaded for Claude here:
   AGENTS.md 50,860 B + `.claude/rules` 18,369 B + CLAUDE.md 505 B ≈ 17.4k tokens (+ skill listing). fgOS-owned:
   hand sections 20,769 B + impact gate ≈ 2,950 B + projection 6,494 B ≈ 7.5k tokens (≈43%). External, out of scope
   by ASC-D2: AgentKit block 16,953 B + `.claude/rules` 18,369 B (the same rules twice) ≈ 8.8k tokens (≈51%), GitNexus
   2,902 B. Phase 9's cut (~5.5k tokens off the sheet) is the only phase that lowers what every CLI reads, and it is
   at the end of the critical path. A coding head or worker on this repo will match most moved units again, so its
   net saving is near zero; the saving is real for secretary/supervisor/non-coding starts, hand-opened sessions,
   other projects, and Codex (which today loses everything past 32 KiB). Ask: is that the saving the owner expects,
   and should ASC-D2 be revisited for the duplicated AgentKit rules (environment owned by others; likely a separate
   item, not this plan)?
2. **How the saving is measured.** Criterion 6 records opening bytes per start; it did not count the always-loaded
   text. Phase 11 now counts opening + AGENTS.md/CLAUDE.md per start and lists external blocks unchanged. Confirm this
   is the measure (bytes/4 tokens, per persona and per worker operation).
3. **Phase 6 scope (owner note 3).** Situation: phase 6 adds `when:` to every unit and folds the Node setup matcher
   into the composer; the discussion only covered the door. Cause: the council made "one matcher" a condition, and
   phase 9 needs `when:` units to deliver the moved AGENTS.md text. Options: (A) as planned, `when:` keys fixed to the
   eight registry keys (`kind, cli, project, persona, role, domain, workflow, stage`), Node matcher folded; cost
   medium, `build:skills` then needs a host binary. (B) `when:` read only by the composer, Node projection matcher
   kept; cost small, two matchers stay (breaks the council condition). (C) defer 6 and 9; cost: no AGENTS.md cut, so
   no token saving. Recommendation: A with the field list fixed as above and told to DOCOS (approval point 4). Scope:
   phase 6 and the content of phase 9.
4. **Could the cut land earlier?** Phase 3's composer already selects by `when:`; phase 9 could depend on 5 instead
   of 6 if the composer's `UnitSource` validates `when:` itself, landing the token cut one wave earlier. Cost: phase 6
   and 9 both write `core/instructions/**`, so 6 would rebase over 9. Not changed; owner's call with point 3.
5. **Approval id for `fgos authority declare`.** Situation: the new component needs `--approved-by <answered q-id>`.
   Cause: the 2026-11-22 approval came as supervisor event `16707082c8c40dac`. Options: (A) the secretary records the
   approval as an answered question now (cost: one question round trip, no wait); (B) declare at phase 3 with a fresh
   question (cost: a park at phase 3). Recommendation: A. Scope: phase 3 step 1.
6. **RUL102 amendment placement.** Situation: approval said "amend RUL102 and the composition contract owner row in
   the same change" as the phase 2 spec. Cause: both now live in files `261122-2108` holds. Options: (A) amend in
   phase 3, spec now (phase 2 starts today); (B) keep it in phase 2, which then waits for `261122-2108`. Recommendation:
   A; the spec states the boundary and the amendment lands with the component declaration. Scope: phases 2-3.
7. **Hand-opened hook rows are mailbox opt-in.** Phase 10 must choose: join `rowsMailboxOn` or a new
   `startContext` opt-in key. Recommendation: own opt-in key, default on, because ASC-D3 covers every hand-opened
   session, not only mailbox projects.
8. **Goldens drift from running plans.** `261124-0004` phase 1 edits `core/agents/secretary.yaml` and
   `supervisor.yaml`. Phase 4 can start now but its secretary/supervisor goldens may need recapture; phase 5 step 1
   does it with the changing commit named. Alternative: start phase 4 after that phase lands. Low stakes.
9. **Persona `on_wake` and first steps for other personas.** Only lead, planner, supervisor carry `on_wake`; only
   lead, planner, shaper have a `FIRST_STEPS` line. Moving them to persona data keeps that; no new text is added
   (non-goal). Flag only.

## Unresolved questions

- Points 3, 5, 6 above need owner answers before phases 6 and 3.
- Whether `doc-health` requires a reading-map row for a new area spec before phase 3 adds it was not proven; phase 2
  runs `node scripts/doc-health.mjs` on the spec and stops if it does.
