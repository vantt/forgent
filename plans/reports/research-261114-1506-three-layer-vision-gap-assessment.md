# Three-layer vision: how far the code is (gap assessment)

Read-only. Snapshot `origin/main` `623df58b7` (2026-11-14), taken with `git archive` because the main checkout (`3ee10a3fa`) is 20 commits behind. Line counts are `wc -l` per file, with each file assigned to a tier by the longest matching prefix in `docs/architecture-manifest.json` `tiers`. File:line citations refer to that snapshot. Asked by HARDEN lead forgent-6a for the owner.

The vision being measured (owner, 2026-11-14): Execution runs one Unit reliably. Workflow holds generic coordination mechanisms only. Domain composes business cases from those mechanisms plus doctrine. Work is a surface beside or above Domain. The placement test is that anything in Workflow which names a business case is misplaced.

## 0. The short answer

**The overall vision is roughly 40 percent reached.** The one structural fact behind most of the gap: **the coordination mechanisms the vision assigns to Workflow live in Execution.**

- The fan-out/fan-in, parallel seats, review loop, arbiter (judge or synthesizer), round limits and seat independence all sit in `src/runner/execution/loops/*` and `src/runner/execution/patterns/*` (tier 5).
- The Workflow component (tier 6) does three things:
  - it holds the case ledger, admission, gates, resume, handoff and budgets;
  - it runs its own steps **serially**;
  - it carries a coding-specific conductor entry.
- Councils are already built mostly the way the vision wants (YAML compositions plus a thin skill). But they live in `core/`, not in a domain, and the coordination they compose comes from Execution.
- Coding does not compose Workflow mechanisms at all. It runs on the Work step FSM plus prose skills, and the `wf-coding-cutover` that would change this is still `proposed`.

| Layer | Reached | One-line reason |
|---|---|---|
| Execution | **about 65%** | It runs one Unit reliably, with known open launch faults. But about 2.4k lines are Workflow mechanisms and about 2.8k lines are Work-shaped. |
| Workflow | **about 35%** | The case, admission, gate, resume, handoff and budget layer is real and hardened. Most of the listed mechanisms are absent from it (they sit in Execution, or are missing). About 1.3k lines (17%) encode the coding case. |
| Domain | **about 40%** | Seven councils are YAML compositions with thin skills. They sit in `core/`, need business-named capability rows in Execution config, and cannot get a hard-independent arbiter or a quorum without code. Coding is its own orchestration. |
| Work as surface | **about 50%** | No static import from Execution or Workflow reaches tier 7. It is still load-bearing: coding progress, about 2.8k Work-shaped Execution lines, three tier exceptions (t0/t1/t2 into higher tiers), and the domain-doctrine loader. |

The percentages are judgment, not a formula. Each one weighs the checklist rows in the tables below.

---

## 1. Execution (tier 5, plus run-supervisor tier 4)

**Size:** tier 5 is 31,278 lines (`src/runner/dispatch` 23,001, `src/runner/execution` 7,410, other files 867); tier 4 is 2,204 lines.

### 1.1 Can one Unit run reliably end to end? Mostly yes.

Evidence that it works:
- HARDEN T5 met behaviour acceptance (`plans/reports/closing-261106-2006-harden-t5-execution-core.md`).
- The T6 smokes on the release passed: a `council-lite` 4-seat panel ran to `pass`, and an infrastructure failure was rerun to `pass` through `workflow resume` (`closing-261108-1838-harden-t6-workflow.md`, "Smokes").
- T9 moved the scope rule and the Unit result fields into Execution (phases 05-07 and 26-34).

What still fails, from the backlog (`docs/backlog.md`):

| Item | Status | Effect on "reliable" |
|---|---|---|
| `p-d2dc4f2e`: a herdr seat never starts, and the brief is typed into the shell | proposed (partly fixed) | The headline reliability gap. Resume reruns once by hand; there is no launch-confirmed-started rule. |
| `p-4bkfiw7d3j`: the agent loses the tty foreground about 7 s after start | proposed | The run is cancelled with `foreground-not-agent`. |
| `p-tslryr3buq`: plain `fgos run` Unit runs are never removed | proposed (partly fixed) | Disk use grows; `dispatch inspect` gets slower. |
| Run-output size cap (T5 arbitration addition 5) | not taken | One dirty checkout gives 684 KB of `evidence.json` per seat. |
| T5 budgets | missed | `src/runner/execution` over its 7,000-line budget; seven functions over 300 lines at close, later reduced (T5 report §"lots"). |

**Verdict on reliability: about 80%.** The happy path is solid. The pane-launch fault class is still open, and it is the one an unattended run ("release humans") hits.

### 1.2 Knowledge from other layers that leaked down

| Leak | Evidence (file:line) | Belongs to | Lines |
|---|---|---|---|
| **Collaboration loops**: fan-out/fan-in, parallel seats, review loop, debate judge, synthesizer, round limits | `src/runner/execution/loops/index.mjs:1-83` (`runLoop` switch: solo, reviewed, panel, debate); `loops/panel.mjs:44-98` (parallel members, bind barrier, synthesizer fan-in); `loops/reviewed.mjs` (rounds); `loops/debate.mjs` (thesis, antithesis, judge) | Workflow (mechanism) | loops 860 |
| **Pattern catalog**: loop + params + invariants + promise | `src/runner/execution/patterns/catalog.mjs`, `catalog-entries.mjs:206-219` (seat-shape rules per loop) | Workflow (mechanism) | 1,025 |
| Seat shaping per loop | `src/runner/execution/seat-resolver.mjs` (395), `seat-ledger.mjs` (79), `loops/role-tasks.mjs` | Workflow | about 480 |
| **A named preset hardcoded in code** | `src/runner/execution/seat-resolver.mjs:260-263` (`research-fan-out` turned into panel with 3 members and a synthesizer) | Domain/config | 4 |
| Named presets in a legacy reader | `src/runner/execution/legacy-seat-read.mjs:57-61` (`consult`, `research-fan-out`, `-gated`, `code-change`, `rfc`) | retire | 170 |
| Named presets in shipped Execution config | `core/config-standard/runner.yaml:858-~920` (`code-change`, `consult`, `rfc`, `research-fan-out`) | Domain | about 60 |
| **Business capability rows** in shipped Execution config | `core/config-standard/runner.yaml:~386-720`: 36 entries including `delphi:*`, `nominal-group:*`, `group-cognition:*`, `architecture:*`, `business:*`, `marketing:*`, `coding:*`, `code:*`, `fgos-coding-implement` | Domain | about 330 |
| **Work-stage vocabulary**: declared Assignment (`domain`, `workflow`, `stage`, `operation`, `taskSpec`, `onAdvance`) | `src/runner/dispatch/assignment.mjs:201-345` (`buildAssignment`, `declaredOperationFields`); `assignment-normalizer.mjs`; `operation-prompt-templates.mjs:10-13` (domain template tier); `execution-contract.mjs:176-200` (ADR-007 stage and coordination vocabulary); `effective-execution-contract.mjs`; `decide.mjs:153-180` (`--work`, `--stage` through a Work resolver port) | Work, retired by `wf-coding-cutover` | about 2,700 (275 term hits) |
| Stale doc comment | `src/runner/dispatch/assignment.mjs:207-208` ("defaults to … 'coding'", "'feature'"); the code requires the caller to pass the domain (`:338-340`) | fix the comment | 2 |
| Domain or council words | `coding`: comments only. `marketing` and `council`: 0 hits in Execution. | clean | — |

**Static imports are clean.** The import closure of `src/runner/execution/run.mjs` is 176 files with 0 in tier 7. The architecture test A4 holds: Execution imports nothing from `workflow/`.

**Leak share.** Of 31.3k lines, about 2.4k are Workflow mechanisms (8%) and about 2.8k are Work-shaped (9%).

### 1.3 How much wraps facts that Rust already owns (rough estimates)

Method: for each module, I read which Rust crate owns the fact, and whether the Node code restates that fact or only calls the crate's door. The figures are estimates (±50%), not measurements.

| Node module (lines) | Rust owner | Node restates | Estimated overlap |
|---|---|---|---|
| `dispatch/run-result.mjs` (1,139) | `packages/run-result` (1.2k): derives the outcome through the addon (`:995`) | V2/V3 validate, normalize and interpret (`:149`, `:291`, `:363`, `:677`) restate the contract | 600-700 |
| `src/run-supervisor/*.mjs`, Node part (2,204) | `packages/run-supervisor` (7k): attempt custody | `run-lock.mjs` (392), `cwd-lock`, `cancel-registry` restate custody facts. `trust-store` (661) is Node-only. | 600-800 |
| Seat binding Node (`bind.mjs` 607, `seat-resolver` 395, `seat-policy` 105, `legacy-seat-read` 170, `seat-binding/client` 181) | `packages/seat-binding` (2.6k) ranks and refuses | input assembly, posture, the legacy reader | 300-400 |
| `dispatch/confinement/` (about 5.6k) | `packages/process` containment (pgroup, kill, Linux) | `cleanup.mjs` (554) and part of `resources.mjs` (704) overlap process facts. The bwrap policy and argv are Node-owned. | 400-600 |
| Launch path (`assignment-runner` 1,463, `herdr-round` 515, `transport` 300, `visibility-session` 283, `worker-session-boot` 224) | `terminal-control`, `agent-protocol`, `run-supervisor` | orchestration around the crate doors | 300-500 |
| Provider accounts and credentials (`provider-credential-renewal` 1,488, `provider-capacity` 1,081, `llm-accounts` 321, probes about 640) | none (`packages/secrets` only resolves secrets) | — | about 0 (a Rust candidate under design principle 4, not a duplication) |
| `dispatch/config.mjs` (786) | `packages/config` (schema door) | cross-field rules only, as its header says | about 100 |
| `settlement.mjs` (907) | `packages/git` | already calls the Git port (`:47`) | about 0 |

**Total: about 2.8k to 3.9k of 31.3k (9-12%) restates facts that Rust owns.** Rust duplication is not the main problem. The larger problem is the about 5.2k lines that belong to Workflow or Work.

---

## 2. Workflow (tier 6, `src/workflow` 7,364 lines; definitions in `core/workflows` and `domains/*/workflows`)

### 2.1 Mechanisms against the owner's list

| Mechanism | State | Where |
|---|---|---|
| Fan-out / fan-in | **in Execution**; Workflow has only a static `--units` wave and `dependsOn` joins | `loops/panel.mjs:57-83` (Execution); the Playbook runner runs ready steps **serially** (`src/workflow/runner.mjs:351-352`) and the units of a step serially (`:315-317`) |
| Parallel or serial seats | **in Execution** | panel is parallel and reviewed is serial (loops) |
| Review loops | **in Execution** | `loops/reviewed.mjs`; `acceptOutcomes` (`definition.mjs:100,136`) only accepts the loop's result |
| Quorum or vote | **missing** | no hit in `src/workflow` or `src/runner/execution`; `seat-resolver.mjs:359` is only a label for the summary |
| Arbiter that keeps dissent | **partial, in Execution**. The judge has hard family independence only in `debate` (2 sides). The panel synthesizer's independence is soft only. Keeping dissent is prose in YAML objectives (`core/workflows/group-cognition.yaml`, `synthesize-action.objective`). | no receipt, guard or field enforces kept dissent |
| Gates and human stops | **present** | `case-gate.mjs`; step `gate: {kind: human}`; `GATE_MODES` consent and input (`guide-schema.mjs`); `human-consent` guard |
| Resume | **present** | RUL-WF-38: an infrastructure failure is rerun as a fresh admitted Unit; verdicts are final |
| Infrastructure retry | **partial**. Retry is manual (`resume` once per call). Execution does the account and family fallback (`fallbackPerSeat`) and one lost-brief retry. Workflow has no automatic retry (decision 71 4a, deliberately). | — |
| Passing results between steps | **present** | `unit-handoff.mjs:50-70` (`inputs: [{step, sameSeat, label}]`, `unit-run:<id>/<seat>` refs) |
| Budgets and round limits | **budgets present; rounds in Execution** | the frame (`dispatches`, `mutatingDispatches`, `seatLaunchesPerDispatch`, `fallbackPerSeat`, `deviationsBeforeAsk`, `rigorFloor`); `maxRounds` and `rebuttal` are loop params (Execution) |
| Independence (blind) guard | **present** as a MUST guard (`independence-blind`), enforced by requiring that a blind panel be packaged as **one Execution Unit** (N4, spec §10.1) | `guide-schema.mjs:21-28` |
| Ledger, admission, frame, worktree binding | **present, hardened** | the T6 core |
| Loop-until or iteration across steps | **missing**; Delphi rounds are unrolled steps | `core/workflows/delphi.yaml` |

**Score.** 5 of 12 rows are fully present in Workflow. 4 are in Execution. 2 are partial. 1 is missing.

### 2.2 Places where Workflow names or encodes a business case

| Where | What | Severity |
|---|---|---|
| `src/workflow/propose.mjs:33` | `DEFAULT_GUIDE = 'coding/feature'` | high: the conductor entry defaults to the coding case |
| `src/workflow/propose-classify.mjs:4,22` | hard path to `domains/coding/slice-kinds.yaml`; slices are classified by code write paths (migrations, contract, docs) | high: the coding doctrine table is wired into Workflow code |
| `src/workflow/propose*.mjs` (630 + 326 + 192 + 132 = 1,280 lines) | the whole `propose` door: plan.md slices, `writes`, `verify` commands, coding rigor (`propose.mjs:35-100`) | high: this is the coding conductor (added `3130002d4` and `96b0d12d9`, 2026-11-03 and 11-05) |
| `src/workflow/definition.mjs:23-24` and the tail of the file | the Work step-machine vocabulary (`clarify|discover|plan|execute`, `human-only`, `operations`, `transitions`, `statusSkills`), kept for `wf-coding-cutover` (spec §9) | medium: Work/coding vocabulary inside the Workflow schema |
| `src/workflow/seats.mjs:147,152` | error text names `group-cognition`, `business-discussion`, `nominal-group`, `delphi` | low: it names presets, but a new council makes this text stale |
| `docs/platform/workflow/spec.md` §5.2 | the doctrine of the `debate` pattern (thesis, antithesis, judge) and its use by `group-cognition` written into the Workflow spec | low (docs) |
| `core/workflows/*.yaml` (7 files, 553 lines) | `council-lite`, `delphi`, `nominal-group`, `group-cognition`, `business-discussion`, `architecture-advisory(-reopen)` | medium: business cases shipped as **core**, not in a domain; `test/workflow/playbook-observable-order.test.mjs:20` hard-reads `core/workflows` |
| `domains/coding/workflows/feature.yaml` (176) | two vocabularies, Work lifecycle plus guide (spec §10.2, N16) | medium, waits on the cutover |

**Workflow's own code is clean of council logic.** Councils are YAML data. The coding case is in Workflow code (about 1.3k lines, 17% of `src/workflow`).

### 2.3 Is "pattern" a mechanism or a business case?

It has three parts, and they answer differently:
- **A loop** (`solo`, `reviewed`, `panel`, `debate`) is a **mechanism**. It is generic, and it belongs to Workflow under the vision.
- **A pattern** (loop + defaults + invariants + `promise`, D-ADR0073 and D-ADR0074) is a **parameterized mechanism**. That is fine as a concept. The **shipped named entries** are business cases:
  - `code-change` and `rfc` (a review recipe for code or docs), `consult` and `research-fan-out` (`runner.yaml:858-920`);
  - two of them are hardcoded in code (`seat-resolver.mjs:260`, `legacy-seat-read.mjs:57-61`).
- **The placement is wrong under the vision.** The catalog is `runner.patterns` (Execution config) and the loops run inside one Unit (decision 0047 §4). The spec itself defines a Unit as "one Unit or a bounded wave" while letting the pattern do multi-agent coordination below the admission line (spec §5.2: "admission runs after the pattern is resolved, before `bind()`").

---

## 3. Domain (tier 8 has no code: `domains/*`, `core/skills`, `core/workflows`)

### 3.1 How councils and coding are built today

| Case | How it is built | Composition? |
|---|---|---|
| Councils (`council-lite`, `delphi`, `nominal-group`, `group-cognition`, `business-discussion`) | YAML playbooks (62-100 lines each): steps, `dependsOn`, units with `pattern: panel|debate|solo|reviewed`, `blind`, `must: independence-blind`, `frameDefaults`, `closure`. They are started by `fgos-group-thinking` (179 lines of md), a thin starter that lists the IDs in prose. | **Yes, as data.** The coordination comes from Execution loops. Steps are serial. Dissent is kept by prose. |
| Architecture advisory | 2 YAML playbooks plus `fgos-architecture-panel/SKILL.md` (142 lines), which "starts only the two registered definitions" and owns no orchestration | **Yes**, the cleanest example |
| Marketing | `domains/marketing/workflows/content-publish.yaml` (68 lines): solo, reviewed, a human gate, a publish step with `writes`, MUST `human-consent` and `write-scope-isolation` | **Yes**, a smoke example |
| Coding | Path A: the Work step FSM (`src/runner/loop.mjs` 1,826, `operation-choice.mjs` 2,464, `src/state/status-fsm`, `step-fsm`) plus 8 `fgos-coding-*` skills (about 3.5k lines of md) driving `fgos pick|plan|discover|return` (`fgos-coding-driving/SKILL.md:40,85,214-237`). Path B: `fgos-cook` (422 lines of md) as a conductor over the Workflow `propose` and case doors, with the coding slice logic inside Workflow. | **No.** Its own orchestration in Work code plus prose. `wf-coding-cutover` is `proposed`. |

### 3.2 Paper test: a 3-seat review council with an arbiter for a marketing brief

**Variant 1 (soft arbiter: panel synthesizer, dissent kept by prose):**

| File | Lines | Needed? |
|---|---|---|
| `domains/marketing/workflows/brief-review-council.yaml` (one step, panel with 3 producers and a synthesizer, `blind: true`, `must: independence-blind`, `contextRefs` to 3 of the 4 existing `domains/marketing/agents/*.yaml`, `roleTasks` with the "keep dissent" text, frame, closure; optionally a human-gate step) | 50-65 | yes |
| capability: reuse `marketing:write` or `marketing:research` (zero lines), or add `marketing:review` to `core/config-standard/runner.yaml` (about 8 lines). `marketing:*` (`:711`) has no `prefer`, so a new name without its own row gets a doctor warning and a headless refusal. | 0-8 | maybe; it lives in **Execution** config |
| `core/skills/fgos-group-thinking/SKILL.md` and `fgos-advise` routing lines, then `npm run build:skills` | 5-10 | only for discovery in natural language |
| test or fixture | 0 (the order guard enforces only `core/workflows`) | no |

**Total: 1-3 files, about 55-85 lines, no Workflow or Execution code change.** On this variant the council is easy.

**Variant 2 (the owner's actual ask: an independent arbiter that keeps dissent):** it does not fit without code.
- `debate` needs exactly 2 producers (`patterns/catalog-entries.mjs:217`).
- The panel synthesizer's independence is only `preferIndependentOf` (`loops/panel.mjs:88`).
- A unit template cannot declare hard independence (`independentOf` has no hits in `src/workflow`).
- A 2-step version (panel, then a solo arbiter fed through `inputs`) loses both the independence guarantee and the blind packaging.

So the test needs either a **new loop or a param in Execution** (a judge-role panel), or a **Workflow-level independence guard across units**. Keeping dissent is unenforced either way.

**Verdict:** a council is **easy if the arbiter may be soft. It is not easy, and needs a change one or two layers down, if the arbiter must be independent, or if quorum or iteration is wanted.**

---

## 4. Work (tier 7, 24,031 lines): surface, or load-bearing?

| Dependency | Now / blocker | Evidence |
|---|---|---|
| Static imports from Execution or Workflow into tier 7 | **none** | closures of `run.mjs` (176 files) and `workflow/runner.mjs` (200 files): 0 tier-7 files |
| Lower tiers importing tier 7 | **3 recorded exceptions** | manifest `tierExceptions`: `src/identity/directory-store.mjs` (t1) imports `src/state/runtime-coordination.mjs` (`getMainFgosDir`); `src/runner/worktree.mjs` (t2) imports `src/state/store.mjs` (`StoreError`); `src/util/host-bin.mjs` (t0) imports `src/runner/paths.mjs` (t2) |
| Work-shaped code inside Execution | **now** | about 2.7k lines (§1.2), kept alive by the coding FSM |
| Coding progress authority | **now** | the step FSM stays authoritative until `wf-coding-cutover` (spec §5.2, N12; backlog `proposed`) |
| Work lifecycle vocabulary inside the Workflow schema | **now** | the tail of `definition.mjs` (spec §9) |
| Domain doctrine loader | **now** | `src/state/domain-registry.mjs` (tier 7) is read by 14 modules, including `bin/fgos.mjs`, `setup/registrations.mjs` and `runner/loop.mjs` |
| Gate and question batching | **now**, conflicting | `src/state/decision-question.mjs` and `gate-bypass.mjs` are in Work. The 2026-11-09 vision memo puts gates in Work; point 2 of the 2026-11-14 vision puts gates and human stops in Workflow. |
| Fan-out over work items | Work-level, acceptable | `src/runner/fanout-batch.mjs` (`listWork`, worker slots) |

**Verdict:** by import, Work is a surface. By behaviour, it is **still load-bearing**:
- coding cannot run without it;
- Execution carries its operation model;
- Identity (t1) reaches into it for the main `.fgos` directory.

The single unblocker is `wf-coding-cutover`.

## 5. Layer order: Domain (8) above Work (7)

What this forces in practice:

1. **Domain code may import Work, and Work may not import Domain code.** Tier 8 has no files, so the rule is mostly nominal. Its real effects:
   - domain doctrine reaches Work only as data, through the Work-tier `domain-registry.mjs`, which makes Work the doctrine loader;
   - code that is genuinely coding-specific had nowhere to go but Work (`operation-choice.mjs`, `intake/plan.mjs`, `loop.mjs`) or Workflow (`propose*`).
2. **Domain skills are built on Work verbs** (`fgos pick|plan|discover|return` in `fgos-coding-*`). That is Domain-on-Work, the inverse of point 5 of the vision ("Work beside or above Domain").
3. **A Work app per domain** (the 2026-11-09 memo: business apps per domain on one core-schema) cannot be domain-specific code under this order, because Work may not know Domain. That fits a "generic core-schema" Work. It does not fit a "surface or orchestration layer above Domain" Work.
4. **The order matches neither vision fully.** As the order stands, a Domain composition may legally depend on Work lifecycle, which point 3 of the vision says it should not need.

---

## 6. Top misplacements, ranked by how much they block the vision

| # | Misplacement | Blocks | Proposed fix | Label |
|---|---|---|---|---|
| 1 | **The collaboration loops and the pattern catalog are in Execution** (`src/runner/execution/loops/*`, `patterns/*`, seat shaping; about 2.4k lines) | points 2, 3, 4: Workflow lacks its mechanisms, and Execution is not "one Unit" | Move the loops and the catalog to `src/workflow/` (tier 6) behind a `runSeat` port that Execution already exposes in effect (`hooks.runRole`). Execution then runs one seat-Unit, and Workflow owns fan-out, review, judge and rounds. The independence guard moves from "packaged Unit" (N4) to ledger-level independence across seat-Units. | The code move is **better, not bigger** (no new behaviour, L10 move). It reverses settled decisions 0047 §4, N4 and the spec §5.2 admission ordering, so **it needs the owner.** |
| 2 | **The coding conductor is in Workflow** (`propose*.mjs` 1,280 lines; `propose.mjs:33`; `propose-classify.mjs:22`) | point 6, the placement test, failed directly | Make the guide name its own classification table (data in the domain); require `--guide`, or take the default from the domain catalog, instead of `DEFAULT_GUIDE`; keep `propose` generic (slices, writes, frame) and move the coding rules into `domains/coding/` data. | **Better, not bigger** |
| 3 | **Work-stage Assignment path in Execution** (about 2.7k lines) and the Work vocabulary in `definition.mjs` | points 1, 5 | Land `wf-coding-cutover`, then delete the declared-operation path, `decide --work`, the operation prompt templates and the Work normalizers in the same change (L10). | **Better, not bigger** (already a backlog item; owner sequencing) |
| 4 | **Business capability rows and named presets in Execution config and code** (`runner.yaml` about 36 capability rows and 4 presets; `seat-resolver.mjs:260-263`; `legacy-seat-read.mjs:57-61`) | point 3: every new council touches Execution config | (a) Delete the hardcoded `research-fan-out` branch and read the catalog entry. (b) Retire `legacy-seat-read` presets once the old configs are migrated. (c) Collapse the per-playbook capability names into a few generic ones (for example `deliberate:propose|critique|synthesize`). | (a)-(c): **better, not bigger.** Letting a domain ship its own capability rows is a **new mechanism, needs the owner.** |
| 5 | **Missing Workflow mechanisms**: quorum, hard-independent arbiter for N seats, kept-dissent receipt, parallel steps in a playbook, loop-until, automatic infrastructure retry | point 2: "a council should be very easy, ready and stable" | Each is new behaviour. Rank by need: hard-independent arbiter and kept-dissent receipt first (the paper test needs them), then parallel ready steps, then quorum. | **New mechanism, needs the owner** (each one) |
| 6 | **Councils ship as core, not as a domain** (`core/workflows/*.yaml`, 7 files; `fgos-group-thinking` lists IDs in prose; the order-guard test hard-reads `core/workflows`) | point 3, partly naming | Move them to a domain directory (for example `domains/deliberation/workflows/`). `domainCatalog` picks the directory up with no code. The test reads the workflow catalog instead of a fixed path. The skill reads the catalog, not a prose list. | **Better, not bigger**; the domain name is the owner's choice |
| 7 | **Layer order Domain 8 above Work 7, and gates in Work** (`decision-question.mjs`, `gate-bypass.mjs`) | point 5 | Decide the target order (Work 9-, or beside Domain), and whether question batching is a Workflow mechanism or a Work touch point. The manifest change is one line; the consequences are a design decision. | **Needs the owner** (two visions conflict) |
| 8 | Restated Rust facts (about 3-4k lines, §1.3) | point 4, size only | Per module: drop the V2/V3 validators in `run-result.mjs` once V3 is the only writer; let the Rust run-supervisor own `run-lock` and `cwd-lock`. | **Better, not bigger** |
| 9 | Small items: the stale comment at `assignment.mjs:207-208`; preset names in `seats.mjs:147,152` error text; debate doctrine in workflow spec §5.2 | hygiene | Fix the comment; generate the error list from the catalog; move the pattern doctrine to the runner or pattern spec. | **Better, not bigger** |

## 7. Limitations of this assessment

- **No runtime check.** No live run and no test run was made. Reliability comes from the closing reports and the backlog.
- **The Rust-overlap figures are estimates** from reading module roles, not from line-by-line matching.
- **Prose skill orchestration was sampled**, not read in full: `fgos-coding-*` (about 3.5k lines of md) and `fgos-cook`.
- **The percentages are judgment.** Use them for direction, not as gates.

## Unresolved questions (for the owner)

1. **What is a Unit?** Is a Unit one seat (the vision: Execution runs one Unit, and Workflow coordinates seats), or one pattern (decision 0047 §4 and N4: the blind panel is packaged as one Unit)? Misplacement 1 depends on this answer.
2. **Gates and question batching: Workflow mechanism or Work touch point?** The 2026-11-09 vision memo (Work owns gates, skip and batching) and point 2 of the 2026-11-14 vision (Workflow owns gates and human stops) disagree.
3. **Is `core/` a domain?** If the general councils stay in `core/workflows`, is `core` treated as the "general" domain, or should they move to a named domain?
4. **What should the manifest order be?** Does Work move above Domain (surface), sit beside it, or stay below (generic core-schema)? The answer changes where per-domain Work apps may live.
5. **Ordering against the coding cutover.** Should `wf-coding-cutover` land before the loop move (misplacement 1), since both touch `feature.yaml` and the Execution Assignment path?

Status: DONE
Summary: Overall about 40 percent reached. Execution about 65%: reliable, but it holds the Workflow mechanisms and the Work operation model. Workflow about 35%: the case, admission and gate layer is hardened, but most listed mechanisms sit in Execution and it embeds the coding conductor. Domain about 40%: councils are YAML compositions with no code change needed for a soft arbiter, but an independent arbiter needs code. Work is still load-bearing through coding.
Concerns/Blockers: The top fix (moving the loops to Workflow) reverses settled decisions 0047 §4 and N4, so it needs the owner. Two owner visions conflict on where gates belong.
