---
title: "HARDEN: soát và làm cứng các tầng thấp, từ T0 lên T5"
description: "Skeleton plan for the HARDEN lane: per-layer closed loop (measure, council, arbitrate, sub-plan, verify, land, re-measure, close) from Process Facts & Control (T0) to Execution Core (T5), moving lower-layer decisions into Rust and shrinking Node to thin clients, without growing the system."
status: pending
priority: P1
effort: ~30d of HARDEN work (rough; each layer's sub-plan re-estimates) plus wait time on SEAT landing (gates phase 02 close) and ES store layer (gates phase 04b)
branch: main (plan only; each layer opens its own track branch)
tags: [harden, foundation, rust, process, holder-lock, git, run-supervisor, execution-core, tests, doctor]
blockedBy: []
blocks: []
created: 2026-10-21
---

# HARDEN: soát và làm cứng các tầng thấp, từ T0 lên T5

## Goal

Find and fix bugs and serious problems nobody has handled yet in the lower layers. Work bottom-up and close one layer before opening the next. At the end, every T0–T4 component has exactly one authority, and that authority lives in Rust. Every change passes the nine gates, and the system ends **smaller** (RUL104, D-ADR0062).

**Source of truth:** the [approved proposal](../reports/proposal-261021-0851-harden-review-criteria-and-method.md):
- axes A–G: §2.1;
- severity and the evidence rule: §2.2–2.3;
- gates 1–9: §3;
- the method: §4;
- owner decisions: §5.

The [rules-growth review](../reports/review-261021-1008-rules-that-grow-the-system.md), §0 and R1–R7, explains why the system grows. Read both; this plan only adds what is specific to HARDEN and points to them for the rest.

## Scope

| Layer | Phase | Components | Crates | Node around it |
|---|---|---|---|---|
| T0 (start) | [01](phase-01-t0-process-facts-and-leaf-crates.md) | Process Facts & Control + Containment port, `host-runtime`, `canonical-json`, `durable-file` | `packages/{process,host-runtime,canonical-json,durable-file}` | `src/runner/dispatch/process-identity.mjs` and the liveness / signal / atomic-write / canonical-JSON copies (inventory in phase 01) |
| T1 | [02](phase-02-t1-holder-lock-identity-convention.md) | Holder-lock, Session Identity, Convention | `packages/{holder-lock,session-identity,convention}` | `src/holder-lock/*`, `src/runner/lock-fence.mjs`, `src/state/hot-lock.mjs`, `src/util/session-identity.mjs`, `src/convention/*` |
| T2 | [03](phase-03-t2-git-terminal-control.md) | Git, Terminal-control | `packages/{git,terminal-control}` | `src/git/*`, `src/terminal-control/*`, herdr-specific Node outside the port |
| T3 | [04](phase-04-t3-agent-protocol-observe-event-store.md) | Agent protocol, Observe, Event Store | `packages/{agent-protocol,observe,event-store}` | `src/event-store/*`, `src/state/events.mjs`, `src/state/legacy-event-git-adapter.mjs`, `src/observe/*` |
| T4 | [05](phase-05-t4-run-supervisor-launch-gate.md) | Run Supervisor + Launch gate | `packages/run-supervisor` | `src/run-supervisor/*`, attempt supervision in `src/runner/dispatch` |
| T5 (end) | [06](phase-06-t5-execution-core-dispatch-seat-run-result.md) | Execution Core, Dispatch Transport & Confinement, Seat Binding, Run Result Evaluator | `packages/run-result` (+ Seat Binding crate after SEAT lands) | `src/runner/execution/*`, `src/runner/dispatch/*` |

Each layer also reviews its own doctor rows, `fgos setup` steps (`registerConfigDefault`/`registerFix`) and the packaging and activation of its components, under gate 8. Packaging-distribution is reviewed layer by layer, not as a separate wave.

**Out of scope.** Handed off in [phase 07](phase-07-closing-and-handoff.md):
- T6 Workflow (guide + case);
- T7 Work Lifecycle (the WORK lane);
- T8 Skill/Domain;
- T9 Host & Surface (`bin/fgos.mjs`, gateway, herdr-dashboard);
- Packaging-Distribution as a whole (`fgctl`, and `src/setup` beyond each layer's own rows).

Also out of scope:
- new features: they go into a layer report's "proposed additions" section, and the owner chooses;
- Agent Mailbox (not built);
- OPC (held lane, a new capability);
- rule-management mechanics: the [handoff](../reports/handoff-261021-1021-rule-management-tight-no-conflict-right-place.md) covers rule placement, the net-size gate mechanism, the plan addendum, and whether "authority moved ⇒ delete the Node copy" becomes a rule;
- test rules and tooling (TEST lane).

## Phases

| # | Phase | Depends on | Status |
|---|---|---|---|
| 00 | [T0 baseline + one-time whole-suite test investigation](phase-00-baseline-and-test-investigation.md) | — (TEST lane is told, not waited on) | done 10-21 13:40: [T0 baseline](../reports/research-261021-1210-harden-t0-baseline.md), [test investigation](../reports/research-261021-1210-harden-test-suite-investigation.md) |
| 01 | [T0 Process Facts & Control + leaf crates](phase-01-t0-process-facts-and-leaf-crates.md) | 00 | **landed** 10-21 22:06 on the second machine (main `7d1f1c1b2`, release `613dfa84…`); [closing report](../reports/closing-261021-2213-harden-t0-process-facts-door.md); owner machine by [guide](../reports/guide-261021-2213-harden-t0-owner-machine-landing.md); open: SEAT carry list (sub-plan phase 7), owner ask 2 on net size |
| 02 | [T1 Holder-lock, Session Identity, Convention](phase-02-t1-holder-lock-identity-convention.md) | 01 closed; **SEAT landed** (T0 carry list and T1 identity/convention edits wait for it) | pending |
| 03 | [T2 Git, Terminal-control](phase-03-t2-git-terminal-control.md) | 02 closed | pending |
| 04 | [T3 Agent protocol, Observe, Event Store](phase-04-t3-agent-protocol-observe-event-store.md) | 03 closed; 04b also needs the ES store layer finished | pending |
| 05 | [T4 Run Supervisor + Launch gate](phase-05-t4-run-supervisor-launch-gate.md) | 04 closed (04a and 04b) | pending |
| 06 | [T5 Execution Core, Dispatch & Confinement, Seat Binding, Run Result](phase-06-t5-execution-core-dispatch-seat-run-result.md) | 05 closed; SEAT landed | pending |
| 07 | [Closing report + handoff of T6–T9](phase-07-closing-and-handoff.md) | 06 closed | pending |

The phases run strictly one after another: if a lower layer has not closed, no council opens for the layer above it (proposal §4.2). Inside one layer, leads may run in parallel when their file sets do not overlap.

The T1 council may still run while SEAT is landing. Phase 02 only closes once SEAT has landed. If SEAT has not landed when the phase 02 council finishes, the big lead records the wait on the board. The phase does not close early.

## The per-layer loop

Every step follows proposal §4.2 (loop), §4.3 (Rust move), §4.6 (verify) and §4.7 (dead code, tests, Rust priority). Below are only the outputs that HARDEN adds to that loop. Phases 01–06 list the inputs specific to their layer.

1. **Measure the layer's own baseline on current main** when its council opens (proposal §4.2 step 1). Measure the routes the layer owns (p50/p95, cold/warm), its tests and their wall time, LOC for Rust, Node and test, its open backlog rows, and its doctor rows and setup steps. Record the main SHA. Each layer measures its own; phase 00 measures T0 only.
2. **Council, two parts in one run** (owner 2026-10-21 12:05: a council settles each component at a high level).
   - **Part A — target shape per component (decide first):** for every component of the layer, the council proposes and the owner settles: what it is the authority for; its contract and ports; the Rust/Node boundary and the Node budget; the delete list; the doctor rows it keeps; its size target. The settled shape is written into the component's spec so the next review starts from it.
   - **Part B — review against that shape** (four lenses, axes A–G).
   - **Own council** for large components: Git, Event Store, Run Supervisor, Execution Core + Dispatch. Small components share the layer council (e.g. `canonical-json`, `host-runtime`).
   Every seat returns its findings plus these HARDEN outputs:
   - **migration table:** Node part | what it decides | move or not | reason | order | Node budget after the move (lines/exports, written into the spec; review R2);
   - **delete list:** mechanisms, checks, tests, doctor rows, setup steps, and instruction text that can go (review R5). A finding that asks to add something must name what it replaces, or say why nothing can go;
   - **doctor table:** each fail/warn condition of the layer's rows, and which surviving row keeps it. Rows may merge, but no condition may be lost silently (gate 8);
   - **tests table:** the owning proof per behaviour, Node↔Rust duplicates (reusing the TEST lane labels where they exist), time-based waits, and tests that should move down a layer;
   - each seat reads every line of the layer's crates and Node facade (proposal §4.7b). The red-team seat hunts for what the other seats missed.
3. **Arbitration** by the big lead, with a source for every accept or reject. **Owner ask 1** batches the Part A target shapes of every component of the layer, the Critical items, the "proposed additions" and the **landing time slot** of this layer, so the land does not wait for a second round trip. Owner ask 2 exists only if ask 1 left the slot open (proposal §4.5).
4. **Detailed sub-plan** with `ak-plan --hard`, including red-team and validate, at a `fgos convention path` plan directory linked from the layer phase. Every sub-phase lists Create / Modify / **Delete** / **Tests to retire** and a net-size line. Every retired test names the test that now owns its behaviour.
5. **Implement:** one Sonnet lead per worktree. Each brief carries the delete list, the rule "find the owning test before writing a new one", and a Δ-lines report.
6. **Verify independently** (proposal §4.6).
7. **Land** (proposal §4.2):
   - merge to main and build the release;
   - activate on the three workspaces on the owner machine (forgentX, mdview, mcp-skill-hub) and on the **second machine** (`~/projects/forgent`), in an order written in the sub-plan;
   - run doctor and smoke on each.

   Any change to the `~/.fgos/config.json` schema activates on every workspace and machine together.
8. **Re-measure** on the activated release, on the same machine and load class as step 1, and write the before/after table.
9. **Close.** A layer closes only when all of these hold:
   - the four conditions of proposal §4.2;
   - **no High-or-above finding left unreproduced** (proposal §4.7b, §2.2);
   - the layer's own net Δ (its HARDEN commits only: Node + Rust + test) is ≤ 0, or every increase names the deletion that pays for it.

   Only then does the next council open.

## Size rule (review R1, R2, R5)

- Every phase states a **net-size** line: expected Δ lines for Node (`src/`, `bin/`, `scripts/`), Rust (`packages/`, `apps/`) and tests (`test/`, Rust `tests/`). The layer report gives the measured Δ next to it. Before the council, the expected Δ is a range and labelled as an estimate.
- Δ is counted on **HARDEN's own commits** from the layer's track branch. Growth from SEAT, ES or MAIL and deletions made by the TEST lane are neither charged nor credited to HARDEN.
- When a layer moves authority to Rust, it deletes the deciding Node copy in the same layer (L10 applied to the language move).
- The plan adds no rule file and no new mechanism. A new doctor row must name the row it replaces.

## Dependencies on other lanes

| Lane | What HARDEN needs, or must avoid | Where it bites |
|---|---|---|
| TEST (second machine) | TEST owns the test rules and tooling: the `suite:` line, `test/suite-baseline.json`, the duplicate check, `scripts/test-proof-inventory.mjs`.<br><br>TEST retires mirrors-Rust and contract-prose tests in its five ports: event-store, run-supervisor and terminal-control now, git and holder-lock now that Git 07 has landed on main (`origin/git/p07-switch` is an ancestor of main).<br><br>HARDEN takes TEST's labels as input and retires only what TEST has not, plus tests of mechanisms HARDEN deletes. One message to TEST before phase 00 plus the board row update is enough; HARDEN does not wait for an ack. | 00, 02–05 |
| ES | The Event Store part of T3 waits for the ES store layer. If that layer is not ready, T3 splits into 04a (agent protocol + Observe) and 04b (Event Store); both run before T4. | 04 |
| SEAT (`seat-binding-wave`, phases 06–11 running) | The SEAT branch changes files in T0, T1 and shared files.<br><br>T0 caller sites it touches: `src/runner/dispatch/assignment-runner.mjs`, `src/runner/execution/{run,unit-summary}.mjs`.<br><br>T1 files it touches: `src/util/session-identity.mjs`, `src/convention/*`, `packages/convention/*`.<br><br>Shared files it touches: `src/setup/registrations.mjs`, `apps/fgos/src/main.rs`.<br><br>Source: `git diff --name-only $(git merge-base main seat-binding-wave) seat-binding-wave`.<br><br>Consequences: T0 carries the named SEAT-file sites (phase 01); phase 02 closes after SEAT lands; T5 starts after SEAT lands. | 01, 02, 05, 06 |
| WORK (held "until every foundation is done") | WORK waits for the foundations, and the state store's hot mutex (`src/state/hot-lock.mjs`) would otherwise fall between the two lanes.<br><br>HARDEN owns that file's liveness judging (T0 door) and its review (T1). WORK owns replacing the state store. T0 leaves the state store's atomic writes alone (they are WORK-owned and on the hot path).<br><br>If the hot mutex itself is to stay in Node until WORK, the owner names it as an exception (T1 ask 1). Recorded on the board. | 01, 02 |
| Git / ES (combined N-API addon) | The addon `packages/git/node-addon` belongs to Git: owner decision Q1 (`docs/platform/git/spec.md:211,695`); its reversal trigger E3 is still unproven (`:837`). Any T0 use of it is a cross-lane decision that goes to the owner (phase 01 Q1). | 01 |
| Rule management ([handoff](../reports/handoff-261021-1021-rule-management-tight-no-conflict-right-place.md)) | That lane owns rule placement and the shared mechanisms. HARDEN applies axis G and gate 6 to its own components, sets the Node budget for each foundation in that foundation's spec (handoff §4), and reports ideas for shared mechanisms to that lane. | all |
| MAIL (ready, not started) | Its first slice imports `fgos-process`, `fgos-holder-lock`, `fgos-durable-file` and `fgos-session-identity`. Any T0/T1 API change is announced on the board before merge. | 01, 02 |
| OPC (held) | New capability on the containment port, so outside HARDEN. T0 keeps `containment.port.v1.json` stable. | 01 |
| DOC 260925 (lead `forgentx-5f`) | That lane patches docs in its Phase 9, starting from today's bytes. Before merging, each HARDEN layer messages the DOC lead with the spec and boundary-doc paths it changed. | 01–06 |

## Shared files likely to collide

These files are touched by more than one lane:
- `src/setup/registrations.mjs` (every layer's doctor rows; SEAT)
- `CHANGELOG.md`
- `docs/platform/component-boundary.md` and `docs/platform/*/spec.md` (DOC)
- `apps/fgos/src/main.rs` (SEAT)
- `packages/host-runtime/contracts/command-routes.json`
- `packages/git/contracts/mutation-census.v1.json` (hashes `process-identity.mjs` at :725 and is regenerated by the build)
- `test/suite-baseline.json` (TEST)
- `src/runner/worktree.mjs` (board: GIT G4)

Phase 00 adds HARDEN's rows to the board's "File chung dễ va" table. Whichever lane lands later rebases and resolves the conflict (board rule), checking for semantic conflicts as well (proposal §4.6).

## Risk summary

| Risk | L × I | Mitigation |
|---|---|---|
| A layer never closes because of a long tail of Medium/Low findings | M × H | A finding may be **rejected with a reason**; a Low finding may be rejected as not worth the size. |
| A Node→Rust move puts a spawn on a hot path or under a hot lock (`exec-under-hot-lock`, `src/holder-lock/hot-guard.mjs:35-39`) | H × H | Phase 01 rules out a route spawn for anything reachable under `enterHotLock` or in a waiter loop. Budgets are absolute per call class. |
| SEAT slips and phase 02 cannot close | M × H | Explicit dependency (Phases table). The wait is visible on the board. T0 work is unaffected. |
| HARDEN collides with SEAT/ES/WORK/DOC files | M × H | Carry lists, board shared-file rows, a message to the DOC lead, API changes announced before merge. |
| Test-suite sensitivity to load hides regressions or creates false ones | H × M | Proposal §4.6 verify rule. Phase 00 separates causes in the test runner from causes in the tests. |
| The plan itself grows the system | M × M | Net-size per phase on HARDEN's own commits, a delete list per council, gates 2 and 8. |
| No compatibility policy (fences, legacy readers, old records) | M × H | Review R4 is an owner question. Until it is answered, keep the existing fences and add none. Each sub-plan lists the on-disk formats it changes and whether the previous release can read them. |

## Rollback

Per layer:
- Each sub-plan lists the on-disk formats it changes (lock records, attempt records, digests, refs) and whether the previous release can still read them.
- **Before the next layer merges:** revert the layer's merge commit and re-activate the previous release on every workspace and on both machines. Record the revert SHA: a later re-merge must revert that revert first.
- **After the next layer has merged on top:** roll forward with a fix. Never revert a lower layer underneath an upper one.
- A reverted layer reopens. The layer above it waits until it closes again.

## Success criteria (whole plan)

- **T0–T4 authority:** every component has one authority in Rust. Each layer's migration table shows every Node row either moved or kept as a thin adapter. Any remaining exception is named and owner-accepted; the expected candidate is the state store's hot mutex until WORK (T1 ask 1).
- **Size:** across T0–T5, the sum of the per-layer net Δ of HARDEN's own commits is < 0.
- **One door per job:** these jobs each end with one path in T0–T5:
  - liveness judging, signalling and atomic write: T0;
  - lock, `.fgos`/state-root lookup and identity: T1 (`.fgos` lookup inventory: `rg -l "path\.join\([^)]*'\.fgos'" src bin` finds 36 files);
  - git call and pane access: T2;
  - config read: T5.
- **Tests:** per-layer test wall time drops against that layer's own baseline. `scripts/test-select-coverage-map.mjs` shows no source file losing its last covering test. Whole-suite wall time is re-measured in phase 07 against phase 00.
- **Doctor:** the doctor rows of T0–T5 do not grow in number. Duplicate and orphan rows go to zero. Every fail/warn condition still has a row.
- **Reports:** each layer has a closing report with its before/after table. Phase 07 hands T6–T9 off with their inputs.

## Owner decisions

2026-10-21 12:05, owner: "đồng ý theo khuyến nghị".
1. **Compatibility policy (review R4):** stop-everything landing on every workspace and both machines at once; old data needs one read path only; fences and drains live for one release, then go. So T1 may delete `src/holder-lock/fences.mjs` and the legacy readers once their release has passed, and T4 may delete `src/run-supervisor/legacy-sweep.mjs`.
2. **How Node reaches the T0 door:** an **in-process binding** (N-API) with T0's own loader; Rust decides, nothing spawns on hot paths. Cost accepted: ship the addon for every supported target and for the npm channel. The cold paths may keep the route. Coordinate the addon ownership with the Git lane (combined addon in `packages/git/node-addon`).
3. **The state store's hot mutex stays in Node until WORK lands** (it belongs to the Work layer, T7, out of scope).
4. **Council per component** (new): each layer council settles a target shape per component (Part A) before reviewing (Part B); large components get their own council (see the per-layer loop, step 2).

2026-10-21 15:46, owner, T0 ask 1 ([arbitration](../reports/council-261021-1507-harden-t0-arbitration.md) §6): "1a 2b 3a, đồng ý theo khuyến nghị".
5. **T0 target shapes approved as written** (arbitration §2): they go into each component's spec in the T0 sub-plan.
6. **Proposed additions:** only doctor per-row timing in `--json`, in phase 07 (T9). No `durable-file::replace_atomic`, no per-machine bwrap probe cache.
7. **T0 landing:** when T0 closes, the second machine self-lands in a quiet window (GIT/ES told first); the owner machine follows a guide at a time the owner picks on receipt.
8. **Hand-offs must be recorded by the receiving lane in its own plan** (owner: "dặn các luồng nhận gì thì nhớ ghi và cập nhật plan của nó, không được xót"). The ledger below tracks each one until the receiver confirms.

## Hand-off ledger (items HARDEN gave to other lanes)

A row closes only when the receiving lane has written the item into its own plan and said where. HARDEN re-checks open rows at every layer close.

| # | Item | Source | Receiver | Where the receiver records it | Status |
|---|---|---|---|---|---|
| H1 | Test-cost line in every lead brief / phase file (tests added/retired, new CLI/host spawns, CLI-call cost before/after) | [test investigation](../reports/research-261021-1210-harden-test-suite-investigation.md) §8 | TEST (`forgent-f8`) + rule-management lane | TEST plan `plans/261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md`; rule-management handoff `handoff-261021-1021-…` | **closed (TEST part)** 18:42: on main `4ebf60748` (suite: change line, admission warning for a new CLI/host/fgctl spawn without a `// boundary:` reason, `--cli-cost`, fgos-run §4 checklist); [report](../reports/phase-lead-261021-1759-test-governance-guards-claude-and-help-routes.md). Rule text: **closed** 18:50: owner 18:13 told TEST to do it ("em làm đi"); landed as an extension of the review checklist in `core/skills/fgos-run/SKILL.md` §4 (`4b9518c44`), which AGENTS.md L5 q5 points to; kept out of AGENTS.md by L8 (review procedure, not doctrine) |
| H2 | Run test files longest-first (488 s → ~330 s estimated) | investigation §3, §8 | TEST | TEST plan | **recorded 16:00 in TEST plan "Received items and owner decisions (2026-10-21)" (`7ed88b85f`)**, row H2; owner adopted, then **parked** (owner chose (c): `node --test` sorts files by name, so ordering needs a run()-based driver; tail re-measured after TEST phase 3; `b71005d55`) |
| H3 | Debug vs release host/addon staging for tests | investigation §3, §8 | TEST | TEST plan | **recorded 16:00 in TEST plan "Received items and owner decisions (2026-10-21)" (`7ed88b85f`)**, row H3; owner: not now, parked until the addon stops being hashed per process; since 17:43 that fix is H13 (T9), not T0 (TEST told). **Whoever lands H13 owes TEST (`forgent-f8`) a ping** |
| H4 | `test/rust-host/fgctl-*` call the real `claude` CLI over the network (missing `FGOS_CLAUDE_COMMAND`) | investigation §4, §7 | TEST | TEST plan | **closed** 18:42: on main `4ebf60748`; `buildTestEnv` sets `FGOS_CLAUDE_COMMAND` to a missing binary for every suite process; a full run saw 0 real claude calls (was 11) |
| H5 | `help-routes.test.mjs` 119 s → ~1 s (spawn host directly, keep one dev-door case) | arbitration §3, §5 | TEST | TEST plan, phase 3 slow-file batch | **closed** 18:42: on main `4ebf60748`; help-routes 95 s → 14 s alone |
| H6 | bwrap probe per process + git in a pid namespace (~10 ms of every CLI call) | arbitration D3 | GIT (OPC design) | `plans/reports/design-261020-1035-operation-scoped-containment.md` input row | **closed** 15:55: OPC design "Input from HARDEN T0 (2026-10-21)" (`23b23528e`), GIT board row open items (`2ac24696a`) |
| H7 | RT-M1 (subreaper set on the calling process) — fixed by T0, Git informed | arbitration §3 | GIT (for information) | none needed | closed |
| H8 | Cross-process addon verification moves from GIT into the T0 loader leaf | arbitration D1, GIT 15:35 | HARDEN T0 (taken back from GIT) | T0 sub-plan acceptance criteria | **closed** 15:55: GIT board row marks it moved to HARDEN T0 (`2ac24696a`); in no GIT lead queue; **then moved on to T9 with H13** (owner 17:43, OQ-3 (c)); GIT told |
| H13 | **Each CLI call verifies the release once** (merges H8): today the Rust host re-hashes the whole release on every `fgos <verb>` (`apps/fgos/src/legacy_exec.rs:145-148`, ~36 ms for 30 MB / 820 files) and the Node loader hashes the addon again (~8 ms release, 75 ms debug). Owner 17:43 chose OQ-3 (c): T0 only moves the existing per-process check into its leaf; the cross-process fix is designed once here | T0 sub-plan OQ-3; measured 2026-10-21 17:40 on the second machine | HARDEN phase 07 (T9/Packaging) | [phase 07](phase-07-closing-and-handoff.md) inputs | recorded here (owner: "nhớ nhắc T9 note vào plan") |
| H14 | **Retire the `npm install -g github:vantt/forgent` channel formally** (README:102-117, `docs/specs/distribution.md:34-36`, the doctor message naming it): owner 17:43 confirmed fgOS is not supported when installed by npm; the only supported install is `fgctl init`. T0's process door refuses there by name, as Git already does | T0 sub-plan OQ-2 | HARDEN phase 07 (T9/Packaging) | [phase 07](phase-07-closing-and-handoff.md) inputs | recorded here |
| H15 | Land T0 on the owner machine (three workspaces) with the GIT lane's next landing there; the T0 guide's canonical corpus check runs before activation | owner 10-21 23:37 (T0 ask 2 (b)); [guide](../reports/guide-261021-2213-harden-t0-owner-machine-landing.md) | GIT (`Điểm yếu…` session). 10-22 00:26: GIT folded the T0 guide into [its owner-machine guide](../reports/guide-261022-0011-owner-machine-git-durability-and-t0.md) (step 6 corpus check mandatory), main `613a9d87b`; this machine runs release `9e4c2630` since 00:21 | GIT's owner-machine guide and board row | **recorded** 23:45 on the GIT board row and log; GIT's next owner-machine guide folds in the T0 guide with step 6 as a hard step; landing report link to follow |
| H9 | host-runtime T9 list: `providers/external_process/**`, production `EchoProvider`/`test.fixture.echo`, tautological admission gate, empty `RouterPolicy`, `command-routes-drift` spawn cost | arbitration §2, §5 | HARDEN phase 07 (T9 handoff) | [phase 07](phase-07-closing-and-handoff.md) inputs | recorded here |
| H10 | Doctor per-row timing in `fgos doctor --json` (owner 2b) | arbitration §6 | HARDEN phase 07 (T9) | [phase 07](phase-07-closing-and-handoff.md) inputs | recorded here |
| H11 | Release-manifest canonical-JSON producer/verifier pair (if the corpus proof does not pass in T0) | arbitration §2 | HARDEN phase 07 (Packaging) | [phase 07](phase-07-closing-and-handoff.md) inputs | recorded here |
| H12 | Spec/boundary/doc files T0 will change (`process/spec.md`, `component-boundary.md`, `holder-lock/spec.md:229,238,312`, `reading-map.md:57,59`, three docs listing `coordination-abandoned-claims`) | arbitration §5 | DOC (`forgentx-5f`, owner machine) | DOC plan `plans/260925-documentation-authority-unification/` | board note 21:30 with the full file list (log.md); waiting for `forgentx-5f` to record it in plan 260925 |

### Items other lanes handed to HARDEN

| # | Item | From | Recorded in | Status |
|---|---|---|---|---|
| R2 | Contained git is the main cost of a worktree add: every Rust git-port command runs under `bwrap --unshare-pid --as-pid-1`; strace of 10 `addWorktreeSync` calls = 218 bwrap + 249 git execs, ≈ 0.5 s per add vs ≈ 20 ms plain `git worktree add`. Users pay it on every worktree add; it dominates `test/runner/worktree-admin-multiprocess` (71–90 s), `worktree`, `merge`, `spawn-worker`. Same root as H6 (per-CLI-call bwrap probe + git in a pid namespace), with stronger numbers | TEST (`forgent-f8`) runner lead, 10-21 23:10; evidence `plans/reports/phase-lead-261021-2137-test-governance-p3-runner.md` §4 | [phase 03 (T2)](phase-03-t2-git-terminal-control.md) "Received from other lanes"; joins the OPC design input (H6) | open: T2 Git council, with the GIT lane's OPC design |
| R3 | One unremountable host mount breaks every contained call: while a snapshot was mounted at `/var/tmp/fgos-e1/mnt`, every `bwrap --dev-bind / /` on the machine failed ("Can't bind mount /oldroot/… remount /newroot/var/tmp/fgos-e1/mnt: Invalid argument"), so every contained Git call failed; this explains the `three_clones` / `sync_review` flakes of 19:12–19:40 (owner E1 runs 18:45–19:16, 23:15–23:35). Production hosts with odd or transient mounts (USB, autofs, a dm device being torn down) hit the same. Containment port is a T0 component | GIT/ES (`Điểm yếu…`), 10-22 00:10; test-side fix on main `b36a8e6ad` (root fixtures in a private mount namespace) | [phase 02 (T1)](phase-02-t1-holder-lock-identity-convention.md) "Received from other lanes" (T0 debt); related R2/H6 | open: T1 council (containment driver must fail by name or degrade, not break every git call) |
| R4 | A seat launch through the host costs ≈ 1.2 s in product code: host supervisor, bwrap, two Node child processes for `attempt-step` (150–250 ms each) and ≈ 15 confined git calls. TEST counted 466 launches in 6 test files (cut to 411 without losing proofs); concurrency inside a file does not help because the seat path blocks the event loop (9 playbook runs under `Promise.all`: 44 s vs 42 s). Estimate: `attempt-step` in-process or in the host cuts every seat-running file by ≈ 25–35%, and users running units pay less | TEST (`forgent-f8`), 10-22 00:44; [report](../reports/phase-lead-261021-2137-test-governance-p3-exec.md) (main `b9e354f15`) | [phase-05 T4](phase-05-t4-run-supervisor-launch-gate.md#received-from-other-lanes-record-here-never-lose); git-call share with R2 (T2) | open, owner layer T4 |
| R1 | HL-N8 / HL-N9: the two bytes-equal checks in `hot-lock.mjs` (`unlinkRecordIfUnchanged`, `reclaimDeadHolder`) cover for each other; no single test pins either | TEST (`forgent-f8`), owner decision ~20:50 10-21; [report](../reports/phase-lead-261021-1845-test-governance-p2-holder-lock.md) §4, §7 | [phase 02 (T1)](phase-02-t1-holder-lock-identity-convention.md) "Received from other lanes" | open, T1 |

## Red Team Review

### Session — 2026-10-21

The review used four hostile reviewers: Failure Mode, Assumption Destroyer (with a full fact-check of the inventory), Safety Adversary, and Scope & Complexity. The planner adjudicated their findings. The planner runs as a teammate, so the owner cannot be asked directly; findings that would reverse an owner decision were turned into owner questions, not applied.

**Findings:** 37 raw, deduplicated into 20 (18 accepted, 2 partly rejected).
**Severity:** 3 Critical, 10 High, 7 Medium.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | A route spawn for each call is impossible under a hot lock (`hot-guard.mjs:35-39`, `hot-lock.mjs:16`), and the relative budget would allow a 1000× slowdown. | Critical | Accept | 01 Q1, risk table |
| 2 | Pid-only records (staging dirs, gateway registry, sessions, credential copies) have no defined `unknown` mapping, so the wrong directory gets deleted or the wrong process killed. | Critical | Accept | 01 §A table + proofs |
| 3 | The tests marked for retirement are the only proof that `unknown` is never reclaimed and that an injected `isAlive` short-circuits; the Rust vectors cover neither. | Critical | Accept | 01 Tests to retire |
| 4 | The addon option is unavailable on some channels (npm bin, direct node, `build:skills`), targets only linux-x64 and win32-x64, loads once per process, inverts layering (`src/git/native.mjs` pulls in T1/T4), and belongs to Git. | High | Accept | 01 Q1, risks |
| 5 | Prior art was missed: the route `fgos internal process-observe` already exists in the holder-lock crate, and process spec §3/§8 settled the Node leaf. | High | Accept | 01 context + Q1 |
| 6 | Option (c), a Node leaf, reopens owner decision 10:01. | High | Accept (moved to an owner exception question) | 01 Q1 |
| 7 | Atomic writes come in different contract classes (replace, create-only link, mode-keeping, fsync, heartbeat); 2 helpers, 2 renames and 3 Rust twins were missed, as were temp-name readers. | High | Accept | 01 §B |
| 8 | Bare-pid kills are invisible to the validation grep; no proof of `IdentityMismatch`; the exclusion set of `stop-processes-inside` is not stated. | High | Accept | 01 §A, validation |
| 9 | SEAT gates phase 02 without saying so, and the carry list missed `assignment-runner.mjs:117,924`, `registrations.mjs` and `main.rs`. | High | Accept | Phases table, 01 constraints |
| 10 | Measuring every baseline in phase 00 is confounded by SEAT/ES/TEST and only measured T0–T2 routes. | High | Accept | loop step 1, size rule, 00 |
| 11 | The rule "Opening the next council" silently overrode owner decision §4.2 (land, then open). | High | Accept: deleted; the landing slot moved into ask 1 | loop 3, 7, 9 |
| 12 | Rollback ignored the second machine, data written by the new release, and revert-after-upper-merge. | High | Accept | loop 7, Rollback |
| 13 | The close criteria dropped "no unreproduced High+" and the line-by-line read. | High | Accept | loop 2, 9 |
| 14 | The hot-lock WORK/HARDEN deadlock; T0 was rewriting state-store writes that WORK will delete. | High | Accept | deps, 01 §B, 02 |
| 15 | The canonical-JSON twins are not byte-equal; `scripts/build-rust-distribution.mjs:37` (producer) and 2 Node twins were missed. | Medium | Accept | 01 §C |
| 16 | `coordination-abandoned-claims` is dead: nothing produces `claim.json` (`rg` finds only `registrations.mjs`). Rows #9/#10 were misattributed. | Medium | Accept: delete instead of red test | 01 §A, §D |
| 17 | The pgid-reuse group kill (#12) cannot be caught by a red test. | Medium | Accept | 01 §A #12 |
| 18 | Unclear split with the TEST lane (who deletes, double counting); the TEST ack was blocking. | Medium | Accept | deps, size rule, 00 |
| 19 | plan.md restated the proposal (loop, gates, owner decisions) and had drifted from it. | Medium | Accept | plan.md compressed |
| 20 | Delete phase 00 "202 s baseline check" and "growth history". | Medium | **Reject**: proposal §4.7b asks for both explicitly (requested scope). Also delete the net-size estimates for phases 02–06: **Reject**, because the brief requires an expected Δ line; it is kept as a labelled range. | — |

Also applied from the reviews:
- correct counts: 140 `registerCheck(` calls registering 147 rows; herdr appears in 55 files (12 quoted literals); process crate tests are 13 files;
- the `registerFix` steps of each layer;
- doctor and spec coordination with DOC;
- Q3 (whether the Rust-move rule becomes a RUL) moved to the rule-management lane.

### Whole-Plan Consistency Sweep

Every file was re-read after the edits. Checks:
- Phase 00 now measures T0 only. Each layer measures its own baseline in loop step 1. Phase 07 no longer asks for T6–T9 "phase 00 rows".
- The phrase "Opening the next council" has been removed everywhere.
- The SEAT dependency appears consistently in plan.md, phase 01 and phase 02.
- Option (c) is now only an owner exception question.
- The `confinement-herdr-maturity` attribution was corrected to `coordination-abandoned-claims`.
- The net-size lines say "HARDEN commits only".

No contradiction remains open. Open owner questions: Unresolved 1–3.

## Validation Log

### Verification Results
- Claims checked: 64. Every `file:line` in phase 01 §A–§E and the per-layer LOC, row and route claims in phases 02–06 were checked with `rg`/`sed` on main `f453cd941`. The Assumption Destroyer reviewer re-checked them independently.
- Verified: 58 | Failed (fixed in place): 6 | Unverified: 0.
- Tier: Full (8 phases).
- The 6 failures were:
  - the process test file count;
  - the attribution of rows #9/#10;
  - 2 atomic helpers missed;
  - 3 Rust atomic twins missed;
  - 2 canonical twins missed, plus the producer script.

  All are corrected in phase 01.

### Questions
The validate interview goes to the owner through the team lead, in the batched form of proposal §4.5. It uses the three Unresolved questions above. No implementation starts before T0 ask 1.
