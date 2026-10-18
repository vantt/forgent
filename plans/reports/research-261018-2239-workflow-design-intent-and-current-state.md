# Workflow in fgOS: design intent over time and current state (AGENT-WF step 1)

Written 2026-10-18 (Asia/Saigon) as input for the AGENT-WF architecture council. Read-only research; nothing in the repo was changed. Owner direction under test: [brief-261018-2235-agent-workflow-model-owner-direction.md](brief-261018-2235-agent-workflow-model-owner-direction.md).

## Summary

- **The original intent was close to the owner's direction.** The July 2026 vision described a workflow as a shared lifecycle backbone with *conditional* human gates that park asynchronously ([work-item-lifecycle-vision.md](../../docs/work-item-lifecycle-vision.md) §1–2). The September vision "trong mềm, ngoài cứng" (soft inside, hard outside) states the owner's position almost word for word: the kernel enforces legality, while domains carry "doctrine, prompts, evidence posture, and operating style" ([system-vision-trong-mem-ngoai-cung.md](../../docs/architect/system-vision-trong-mem-ngoai-cung.md) §3–4). The first domain workflow file (Aug 2026) was a **state map**: named stages, each with a guiding skill, plus legal transitions. It was not a step script.
- **The October request-to-run track (P1–P6) turned "Workflow" into a step DAG executor.** The goal of decision 0049 was to close an *authority* gap: three sequencers had overlapped (stage FSM + `loop.mjs`, the coordination engine DAG, and prose skills). The fix made the Workflow runner "the only sequencer". Agent flexibility was never weighed in that decision; flexibility was not the problem it solved.
- **Today one word, "Workflow", names two different models, often inside the same YAML file.** In [`domains/coding/workflows/feature.yaml`](../../domains/coding/workflows/feature.yaml):
  - (i) a **Work-lifecycle state map** (`transitions`, `operations`, `skill`, `phase`). `step-fsm.mjs` and the Work driver read it, and an agent's verdict picks the edge.
  - (ii) a **runner DAG** (`units`, `dependsOn`, `gate`, `kind: integrate`), read by `src/workflow/runner.mjs`.
  
  `coding/feature` has **never been run by the Workflow runner** in this repo: 0 of 84 stored runs. The runs are discussion workflows (architecture-advisory 28, group-cognition 23, council-lite 8…) plus one-off `units/*`.
- **The runner is strictly BPMN-like.** Steps run when every `dependsOn` is complete. Units inside a step run one after another. A unit outcome outside `acceptOutcomes` fails the whole workflow. Gates are `consent` or `input`. There is no condition, alternative route, optional step, retry route or milestone.
- **Most of the owner's model already exists in pieces and could be reused.** Existing pieces: state maps with legal transitions, per-step `operations` with `primary` and secondaries (discretionary tasks), `roleGraph` (who may consult whom, per stage), task-specs (input, output, gates, done), route tables with "Why" and "Do NOT use when" (fgos-advise, the 12 coding routes), the driver cycle in `coordination-driver.md` (observe → choose one legal action → verify → adapt), the Work `statusCategory` milestones, and the Observe friction channel. What is missing is one model that names these pieces: milestone, entry and exit criteria, MUST/SHOULD/MAY-instead, and a justified unlisted route. Also missing: a harness check of an agent-produced order against MUST.

## 1. Design intent over time

| When | Source | What a workflow was FOR (short quotes) |
|---|---|---|
| 2026-07-15 | [work-item-lifecycle-vision.md](../../docs/work-item-lifecycle-vision.md) §1–2, §5 | "pipeline bán-tự-động (mixed-autonomy): tự động là mặc định, người xen vào ở những **cổng (gate) có điều kiện**", and human involvement "thay đổi theo giai đoạn". "fgOS biến gate thành checkpoint bất đồng bộ mà hệ đậu lại (park)". "Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain … kế thừa base và thêm stage riêng" (Intake → Clarify → Divide → Execute → Compound-learning). The coding lifecycle at §4 is a numbered list of 11 items, but its §5 human-involvement map and §7 open questions ("does step 7 need a person?") show the order was **descriptive**, the numbered-list trap in its original form. |
| 2026-07 (base-workflow-model, hash `2ae492d8`, quoted in [work-state.md](../../docs/specs/work-state.md) decision 0027) | RUL35 | "Một domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping …, và cạnh chuyển-stage hợp lệ riêng" (a domain declares exactly three things: an ordered list of stages, a step mapping, and its own legal stage transitions). The model is states plus legal moves. |
| 2026-08 | `c99fd42a4`: first [`feature.yaml`](../../domains/coding/workflows/feature.yaml) (`git show c99fd42a4:domains/coding/workflows/feature.yaml`) | `stages:` (name → `skill`, `taskSpec`) + `transitions:` (including skips `discovery → planning` and `clarify → exploring`). No units, no DAG. The **skill was the operating guide**; the agent's verdict chose the edge. |
| 2026-08 | [work-state.md](../../docs/specs/work-state.md) decision 0027 | A domain owns the labels and transitions of statuses *before* `delivered`; the tail `delivered → retrospective → cleanup → done` is universal. Owner: "retro không có status khác nhưng sẽ có cách học khác (skill), cleanup cũng sẽ có cách dọn khác (skill)" (retro has no different status but a different way to learn, through a skill; cleanup has a different way to clean, through a skill). These are case-level milestones shared by every domain. |
| 2026-08-17 | AGENTS.md mission + [platform-foundations.md](../../docs/specs/platform-foundations.md) decision 0035 | Mission #2: "làm nền vận hành các business base workflow" (be the foundation that runs business base workflows). |
| 2026-09-05 | [system-vision-trong-mem-ngoai-cung.md](../../docs/architect/system-vision-trong-mem-ngoai-cung.md) | "The outside must be hard: contracts … state transitions are lawful … capabilities are fenced". "The inside must be soft: … agents can reason, reframe, negotiate, and recover; coordination can use human-shaped operating patterns". "Runtime kernels stay small and hard. The kernel should enforce legality, not absorb every domain judgment into schema." It was written because Step 09 became "correct but stiff". |
| 2026-09 | [domainization/README.md](../../docs/architect/domainization/README.md) §5 | `workflows/*.yaml` owns "stages, stepMap, transitions, skillMap, taskSpecMap, legal operations"; core exposes "role graph and workflow legality". Again legality, not a script. |
| 2026-09-30 | [synthesis-260930-1229-request-to-run-brainstorm.md](synthesis-260930-1229-request-to-run-brainstorm.md) §6 (lines 241–289) | Owner decision 22:38: **Workflow is split from Work**: "Hệ thống chạy được Workflow không cần Work" (the system can run a Workflow without Work); "Một runner duy nhất cho Workflow run … Không để hai sequencer" (one runner for a Workflow run; never two sequencers). D3: the Pattern versus Workflow rule: "nhiều sản phẩm nối nhau, bước sau lấy kết quả bước trước làm đầu vào mới, hoặc có cổng người → Workflow" (chained products, where a step takes the previous step's result as new input or there is a human gate, make a Workflow). The AgentKit plan and the Workflow are "giống ở hình dạng, khác ở nguồn" (same shape, different source); a multi-phase plan becomes a Workflow run. |
| 2026-10-01/02 | [runner.md](../../docs/specs/runner.md) decisions 0047, 0048, **0049** | 0048: the thin driver `fgos-run` "không tự lập lịch, không tự merge mà giao trọn cho Workflow runner" (does not schedule or merge itself; it hands everything to the Workflow runner). The three prose facades that "tự lập lịch, tự chạy vòng lặp bằng prose" (scheduled themselves and ran their loops in prose) were deleted. **0049**: "Work không còn `stage` … Workflow runner (`src/workflow/**`) là sequencer duy nhất". The context names the problem: "logic tuần tự bước bị phân tán giữa `loop.mjs`, FSM stage, và prose của skill" (step sequencing was spread across `loop.mjs`, the stage FSM and skill prose). Nothing that 0049 superseded talked about agent adaptivity. It superseded the `workflow-adapter.mjs` / `FlowDefinition` profile `Workflow` and the stage field. |
| 2026-10-16 | [research-261016-2141-plan-conductor-coding.md](research-261016-2141-plan-conductor-coding.md) §6, §7 | The first written reversal: "Workflow là DAG tĩnh, trái với điều phối thích nghi" (a Workflow is a static DAG, the opposite of adaptive coordination). A conductor agent chooses each piece from a 12-route table; workflows only for "từng đợt việc đã rõ hình" (one wave of work whose shape is already clear). The report proposes retiring the mechanical `--plan` translation (C7). |
| 2026-10-18 | [owner brief](brief-261018-2235-agent-workflow-model-owner-direction.md) | Workflow = guide + constraints; the agent produces the order. |

**Reading.** The intent moved from a *state map with guiding skills* (July–September) to a *DAG executor* (October). The October change solved authority sprawl, a real L5 problem, by putting sequencing in code. It also moved *judgment* about order out of the agent, which the 2026-09-05 vision had explicitly kept in the soft inside. "Only sequencer" still makes sense as an authority statement: one component owns the *record* of progress. It does not have to mean that one component *decides the order*.

## 2. Current state of code

### 2.1 Data model: what a Workflow file declares

Validator: [`src/workflow/definition.mjs`](../../src/workflow/definition.mjs) (`validateWorkflow`, lines 130–489).

| Level | Fields | Meaning |
|---|---|---|
| Workflow | `id`, `title`, `description`, `steps[]`, `transitions[]`, `aliases`, `statusSkills` | G2 bans `executor/provider/model/tier/invocation/prefer/overrides` (line 18) |
| Step | `id`, `title`, `dependsOn[]`, `kind` (`standard` \| `integrate`, l.29), `target` (integrate only), `gate {kind: human, mode: consent\|input, question, header}` (l.217–229), `phase` (`clarify\|discover\|plan\|execute`, l.32), `skill`, `operations[]` (`id, primary, taskSpec, role, reason, dispatch: human-only, skills, policy.rigor`), `units[]` | |
| Unit template | `capability` (required), `pattern`, `rigor`, `writes`, `dependsOn`, `params`, `stanceOptions`, `contextRefs`, `inputs`, `acceptOutcomes` (`pass`/`findings`), `persona`, `blind`, `anonymizeInputs`, `timeoutMs`, `objective` | Becomes a Unit for `runUnit` |

There are **no** fields for: entry or exit criteria other than `dependsOn`, conditions, optional or discretionary steps, alternatives, repetition, milestones, definitions of done, budgets, or the reasons behind an order.

### 2.2 Who sequences, and how

[`advanceWorkflowRun`](../../src/workflow/runner.mjs) (l.386–786):

- A step is ready when every `dependsOn` is `completed` (l.405–412). Ready steps are processed in a `for` loop with `await runUnit` (l.432, ~l.614): **sequential in practice**, despite the DAG.
- Units inside a step run in declaration order. `u.dependsOn` is copied onto the Unit (l.541) but the runner does not schedule by it.
- Gate: parks (`gate.park`) until `fgos workflow answer`. `consent` releases only with `--approve` (decision 0048 §3).
- Failure: a unit outcome not in `acceptOutcomes` causes `step.fail` and then `workflow.fail` (l.~700–735). There is no alternative route. An integrate step refuses on out-of-scope writes (l.478–490).
- Store: `.fgos/workflow-runs/<id>/events.jsonl` ([store.mjs](../../src/workflow/store.mjs)). It runs detached, and resume continues a dead controller's unit run.

### 2.3 The two doors

| Door | What | Code |
|---|---|---|
| `fgos run "<prompt>"` / `--unit` | One Unit → CollaborationPattern → `bind()` | [`src/runner/execution/run.mjs`](../../src/runner/execution/run.mjs), [`bind.mjs`](../../src/runner/execution/bind.mjs) |
| `fgos workflow start <id> \| --units <file> \| --plan <dir>` | Workflow run | [`runner.mjs`](../../src/workflow/runner.mjs), [`units-source.mjs`](../../src/workflow/units-source.mjs) (one step per Unit, RUL89), [`plan-source.mjs`](../../src/workflow/plan-source.mjs) (phase → step) |

`bind()` and workflow steps: a step's unit template may carry only demand (`capability`, `rigor`, `persona`, `pattern`). `bind()` resolves the executor through five levels (decision 0047 §2). A persona locked by a Workflow cannot be replaced by an override (synthesis Q6). This boundary is good and should be kept: it is already "MUST NOT pin infrastructure", held by machine.

### 2.4 Patterns and presets

- Patterns: `solo`, `reviewed`, `panel` ([`src/runner/execution/patterns/`](../../src/runner/execution/patterns/)). They are the inner loop of one Unit run, including bounded fix rounds.
- Presets ([`presets.mjs`](../../src/runner/execution/patterns/presets.mjs)): `code-change` (reviewed + reviewer + red-team + `verify: 'npm test'` pinned, a known mission-#1 bug, C2), `consult`, `research-fan-out(-gated)`, `rfc`.
- Patterns are already agent-choosable "MAY" options at the Unit level; route tables pick among them.

### 2.5 The second "sequencer" that still exists: the Work lifecycle

Decision 0049 removed `stage` from Work, but the coding lifecycle is **not** run by the Workflow runner:

- Work carries `workflowStep`. [`step-fsm.mjs`](../../src/state/step-fsm.mjs) checks moves against the Workflow's `transitions` (header l.12–13).
- [`domain-registry.mjs`](../../src/state/domain-registry.mjs) serves `operationsForStep`, `skillForStep` and `isLegalStepMove` to `operation-choice.mjs`, `work-dispatch.mjs` and `work-compat.mjs`.
- The stage skills (`fgos-coding-discovering` … `-implement`) plus [`fgos-coding-driving`](../../domains/coding/skills/fgos-coding-driving/SKILL.md) drive it. Verdict verbs (`fgos discover --verdict`, `fgos plan`) pick the edge (RUL46: only the engine applies a transition; RUL94: a driver step runs as a Unit).
- `bin/fgos.mjs:1244–1281` only *defers* to a Workflow run when `work.workflowRunId` is set. Nothing in the coding path sets it.

So the coding domain still runs on the **original state-map model**, agent-judged and engine-checked. The Workflow runner serves discussions and one-off unit batches. `fgos-coding-driving` and `domains/coding/AGENTS.md` still say "stage", the stale wording the COOK lane is fixing.

### 2.6 Where an agent can and cannot deviate today

| Place | Agent may | Agent may not |
|---|---|---|
| Inside a Unit run (pattern) | Producer reasoning, fix rounds up to `maxRounds` | Change checkers set by rigor; commit (the runner commits within `writes`, decision 0060) |
| Workflow run | Answer a gate; resume | Skip, reorder, add, or replace a step; take an alternative on failure |
| Work lifecycle (coding) | Pick the edge by verdict (`clear` → skip exploring); call secondary operations of the step (`resolve-question`, `scout-blast-radius`…) by task-spec triggers; consult along `roleGraph` edges | Make a move outside `transitions`; run a `human-only` op; answer a human gate itself (RUL47) |
| Lead/conductor (prose) | Everything: choose the route, door, rigor, batching | Nothing is enforced except what the doors enforce (G2, `writes`, worktree, guard tests) |

That is the pattern in the brief's lesson. Flexibility currently lives either in the Work lifecycle (an old, good shape but coding-only) or in unenforced prose (the lead chains). The Workflow runner offers none.

### 2.7 Stale or contradictory surfaces found

- [`core/skills/_shared/coordination-driver.md`](../../core/skills/_shared/coordination-driver.md) teaches `fgos coordination …` verbs. No `coordination` entry exists in `src/cli/command-registry.mjs` (grep empty). It is still loaded by [`fgos-advise`](../../core/skills/fgos-advise/SKILL.md) l.34. Its *abstract* cycle and nine hook slots are sound and match the owner's model.
- [`runner.md`](../../docs/specs/runner.md) l.1486: "Workflow dùng DAG steps + tích hợp vòng đời Work" (Workflow uses DAG steps and Work-lifecycle integration). This contradicts 0049 and §2.5 (C5 in the conductor report).
- `feature.yaml`'s `units`, `gate` and `integrate` are unused in practice (0 runs). They are dead weight that a reader takes as authoritative.
- `plan-source.mjs` turns `dependencies: []` into "everything in parallel" and leaves `writes` empty (conductor report C7).

## 3. Gap analysis against the owner direction

Legend: **E** exists, **P** partial, **M** missing, **X** actively contradicts.

| # | Owner position | State | Evidence and what could be reused (RUL104) |
|---|---|---|---|
| 1 | Separate (a) guide, (b) constraints, (c) order | **X** in the runner (a, b and c are fused into `steps` + `dependsOn`); **P** in the Work lifecycle | (a) lives in skills + task-specs + `domains/*/AGENTS.md`; (b) partly in code guards (G2, `writes`, worktree gate, `human-only`, consent gates, `transitions`); (c) in `dependsOn`. Reuse: keep (a) and (b) where they are and stop expressing (c) as authority in the YAML. |
| 2 | (c) is a capability space ("may do a, b, c, not d") | **P** | `steps[].operations` (primary + secondaries) + `roleGraph.edges[stage]` (who → whom, reason, sync/async) in [`registry.yaml`](../../domains/coding/registry.yaml) + `dispatch: human-only` = exactly "allowed at this point". Enforced: `operation ∈ operations` (RUL73.1) and `human-only` refusal. Missing for non-coding domains and for the runner. |
| 3 | Milestone states, not step numbers; entry/exit criteria; parallel by condition | **P** | Work `status` + `statusCategory` (0027) are case milestones; `workflowStep` + `transitions` are states. Task-specs carry Output/Gates (exit criteria in prose). Missing: named milestones with machine-checkable criteria (artifact exists, verdict recorded, verify green); runner readiness = "all deps completed" only. |
| 4 | Numbered-list trap | **X** | Every `core/workflows/*.yaml` is a linear chain (`dependsOn: [previous]`); `plan-source` maps phase order to deps; the July vision itself was written as a numbered list. No place records *why* an order is required. |
| 5 | MUST / SHOULD (reason) / MAY instead per decision point | **P** (MUST only, scattered) | MUST held by machine: G2, `writes`/runner-commit, mutating worktree gate, consent gate, `human-only`, `transitions`, guard tests. SHOULD-with-reason exists only as prose route tables: fgos-advise "Why / Do NOT use when" ([request-kinds-and-routes.md](../../core/skills/fgos-advise/references/request-kinds-and-routes.md)), the 12 coding routes R1–R12. MAY-instead: patterns/presets as interchangeable options, `discovery → planning` skip. No shared schema for any of the three. |
| 6 | Unlisted route allowed with justification; "listed routes only" marker | **M** | The runner has no deviation event. The Work lifecycle refuses any move outside `transitions` (fits "listed routes only"). The closest prior art is the retired coordination engine's `authorize-and-dispatch` for optional operations with a driver identity and `disposition --rationale` (commits `ca854f443`, `d2a87c6e4`, `232ef31e1`; `coordination-driver.md` Step 5). |
| 7 | Knowledge keeps its reason | **P** | Reasons live in decision histories, task-spec prose ("No `advise` at this stage, by the skill's own hard rule… D6"), and route-table "Why" columns, never next to the constraint in a machine-readable form. |
| 8 | Workflows learn from deviations | **P** | Learning channels exist: Observe friction (`.fgos/observe/friction/`), outcome/settlement/learning logs per item (`/fgOS:show`), retrospective status + `fgos-coding-knowledge`, `docs/knowledge/`. Missing: a deviation record (route taken, reason, result) and a promotion/demotion step. |
| 9 | Pre-written playbooks (council-lite, delphi, architecture panel) | **E** (as rigid DAGs) | 7 core workflows, used for real (§4). Missing: a statement per playbook of which parts are fixed. |
| 10 | "Any plan" is an intermediate product; one coordination loop; per-domain route table | **P** | One loop exists as doctrine (`coordination-driver.md` cycle) and as the conductor proposal; coding route table R1–R12 drafted; fgos-advise route table live. `--plan` mechanical translation contradicts it (C7). |
| — | Approved frame (scope + budget, priority #2) | **P** | Per-unit `timeoutMs`, pattern `maxRounds`, rigor floors; retired engine had `aggregateBounds`. No frame object set at approval for a whole run. |
| — | "Flexibility to the agent, constraints by machine" | **P** | Proven where machine checks exist (G2, `writes`, guard tests, adopt door). The `hard outside / soft inside` vision already states it as a review check (§6 of that doc). |

## 4. Inventory of existing workflows and playbooks

Relative links are under [`core/workflows/`](../../core/workflows/) and [`domains/`](../../domains/). "Required" means that a later step consumes an earlier step's output or that a fairness guarantee depends on the order. "Habit" means that only the written order puts it there.

| Workflow | How expressed | Truly required order | Order that is habit or fixed by the YAML only |
|---|---|---|---|
| `council-lite` | 1 step, 1 panel unit (blind, 3 lenses + synthesizer) | Seats before the synthesizer (inside the pattern) | — (already minimal). The 3 lenses are fixed in YAML; `--seats` cannot change them. |
| `architecture-advisory` | 6 linear steps: framing → shaping(panel, blind) → critique(reviewed) → synthesis(reviewed, high) → explanation → close gate (input) | Blind shaping before critique (independence MUST); critique before final synthesis; the gate last (it reads `missing expertise`) | Framing before shaping is a SHOULD (the panel could self-frame for a small question); a separate explanation step could be a MAY-instead (merged into synthesis); reopen is a separate workflow and not a route. |
| `architecture-advisory-reopen` | synthesis → explanation → gate | Same as above | A whole second YAML exists for what is a route back to an earlier milestone. |
| `delphi` | blind-proposals → feedback-synthesis → second-round → final-consensus | Round 2 needs the anonymized summary of round 1 (MUST) | Number of rounds (fixed at 2) is a SHOULD with a reason (cost about 2×). |
| `nominal-group` | silent-generation → round-robin → voting(human input gate) → final-ranking | Silent before sharing (independence MUST); vote before ranking | The gate placement is required; consolidation could merge with sharing. |
| `group-cognition` | sense-making(panel) → dialectical(reviewed) → action-synthesis | Mostly a habit chain; the critique needs the sense-making output | Whether a dialectical round is needed is a judgment call (MAY). |
| `business-discussion` | framing → perspectives → critique → synthesis → approval gate → action-plan | Approval before the roadmap (MUST: "do not plan before sign-off") | Framing → perspectives → critique → synthesis is the standard SHOULD path. |
| `marketing/content-publish` | brief → draft(reviewed, brand-guardian) → approval gate → publish | **MUST NOT publish before approval**, the brief's own example, enforced here by a consent gate | Brief before draft is a SHOULD (a small update can skip research). |
| `coding/feature` (lifecycle use) | state map: discovery → (exploring) → planning → executing, `transitions` + `operations` + `skill`; plus unused `units/gate/integrate` | Verdict-chosen skip already encodes MAY; human gate before merge (approve) MUST | `planning` validate-plan as a separate unit is a SHOULD by risk; the `integrate` / `approval` steps duplicate Work's own `awaiting-approval` and the approve door. |
| `units/*` (`--units`) | one step per Unit, deps from Unit `dependsOn` | Only declared deps | Fine as a batch door (R11). |
| `plan/*` (`--plan`) | phase → step, `blockedBy` → deps | Real deps are in the plan's tables, not front-matter | Mechanical; see C7. |
| Lead chains (6.2–6.5, owner machine) | prose: `common-rules.md`, briefs, phase files; the big lead orders the work | Rules held by guard tests, `writes`, the adopt door | Everything else; prose-only rules were skipped (brief "Prior art"). |

Pattern across the table: the **required** orderings are almost all **independence constraints** (blind before reveal) or **consent constraints** (approve before act). Both kinds are naturally MUST at a milestone. Most of the remaining chain links are SHOULD-with-a-reason or habit.

## 5. CMMN mapping (short)

| CMMN | fgOS today | Note |
|---|---|---|
| Case (file, lifecycle) | Work item (record + status FSM) or a Workflow run without Work | 0049 already lets a "case" exist without Work |
| Case plan model | Domain Workflow YAML (`domains/<d>/workflows/*.yaml`) | Today a DAG; in CMMN, a set of plan items with sentries |
| Stage | `workflowStep` / step `phase` (`clarify/discover/plan/execute`) | A container where a set of tasks is legal |
| Milestone | Work `status` / `statusCategory` (0027), gate `answered`, `step.complete` events, task-spec "Output" | Not named as milestones; no criteria object |
| Sentry (entry/exit criterion = event + condition) | `dependsOn` (event only: completed), `transitions` (from-state), consent gate, integrate's out-of-scope check | No `if` part; no exit criteria |
| Human task | gate `kind: human` (`consent`/`input`); `dispatch: human-only` op | Maps cleanly |
| Process task | Unit (`capability` + pattern) | Maps cleanly |
| Discretionary task (planning table) | secondary `operations[]` of a step + task-spec "Collaboration" triggers + `roleGraph` edges | The closest existing feature; coding only |
| Applicability rule | task-spec "Trigger" column, route table "Do NOT use when" | Prose only |
| Required / repetition / manual activation rules | `acceptOutcomes`, pattern `maxRounds`; none for repetition at step level | Missing |
| Case file items | `contextRefs`, report paths (decision 0053), `.fgos/workflow-runs/*` | Exists |

## 6. Feature ideas (owner chooses; RUL104 section)

Each item names the problem and the evidence; none is proposed for implementation here.

1. **Name a milestone and attach the existing checks to it.** Problem: gates, deps and task-spec outputs are three spellings of "this point is reached". Evidence: §2.1, §5. Benefit: one place to hang MUST / SHOULD / MAY instead.
2. **A deviation event in the run log** (route, reason, outcome). Problem: there is nowhere to log a SHOULD deviation or an unlisted route. Evidence: §3 rows 6 and 8. Benefit: the evidence base for promotion or demotion, using the existing JSONL store and Observe.
3. **Merge the two meanings of `feature.yaml`.** Problem: the dead runner fields mislead readers (§2.5, §2.7). Benefit: fewer fields, one model. This is "better, not bigger" if it deletes `units`, `gate` and `integrate` from lifecycle workflows.
4. **Rewrite `coordination-driver.md` on the two doors** (already planned, waiting on this spec, COOK lane). Benefit: the generic agent loop the owner describes already exists in prose.

## Open questions for the council

1. **Keep "only sequencer" as an authority over the run record, or over the order?** 0049 closed authority sprawl. Can the agent choose the order while one component still owns the record, so that 0049 is refined rather than reversed?
2. **Which model should be generalized: the Work-lifecycle state map (§2.5) or the runner DAG?** The state map already has states, legal moves, discretionary operations and verdict-chosen skips, and it runs coding today. The runner has detached execution, a store and gates. Can one model take both, so that one of them is deleted?
3. **What exactly does the harness check against (b)?** Today's machine MUSTs are G2, `writes`, the mutating gate, consent gates, `human-only`, `transitions` and guard tests. Which new MUST kinds (artifact-present, verdict-recorded, verify-green, approval-before-X) are needed, and are they all expressible as "milestone M is reached" checks?
4. **Where do playbooks sit?** Is a playbook a Workflow YAML with marked fixed parts, a route in a route table, or a CollaborationPattern preset? Today `architecture-advisory` and `-reopen` are two files for one case with two entry points.
5. **Who owns per-domain route tables?** A domain's `AGENTS.md`, a skill reference (as for fgos-advise), or the Workflow file? How does a new domain such as marketing or video declare its own?
6. **The approved frame (scope + budget):** is it a run-level object set at approval, and which existing bounds (`timeoutMs`, `maxRounds`, rigor floor) does it gather instead of adding new ones?
7. **Promotion of routes:** which evidence counts (outcome `pass`, rework, owner verdict), who promotes (owner only, or a council with the owner's approval), and is the result a decision record (`docs/decisions/`) or a direct YAML edit?
8. **`--plan` mechanical translation and `feature.yaml`'s unused runner fields:** delete them in the same change as the new model (L10), or keep them until the conductor proves itself (conductor report §8.5)?
9. **Parallelism:** the runner is sequential in practice (§2.2). Is "parallel when entry criteria hold" a runner change, or is it left to the agent, which starts several `fgos run` calls itself?
