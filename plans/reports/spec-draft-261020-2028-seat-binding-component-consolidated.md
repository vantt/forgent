---
area: seat-binding
updated: 2026-10-20
status: draft rev 2 — consolidated from owner answers (through 21:06) and the council review; every decision settled, waits only for owner approval of the whole text (lane SEAT gate 1); no code or config changed
revisionOf: spec-draft-261020-1017-seat-binding-component.md (kept unchanged for comparison)
sources: [spec-draft-261020-1017-seat-binding-component, council-261020-1547-seat-binding-spec-review, research-261020-0955-seat-binding-needs-and-mechanisms-inventory, research-261020-1339-model-family-tier-ladders]
---

# Seat Binding — consolidated spec draft (rev 2)

## 1. How to read this revision

- §2–§9 are **operative**: a planner works from them alone. The appendix is history, not contract.
- Owner decisions come from [rev 1](spec-draft-261020-1017-seat-binding-component.md) (§3.0–§3.0.2, §R, §R.2, §R.3, §T, §W, §9 answers, correction note) and from the owner answers of 2026-10-20 20:39 and 21:06 (§2.3). The council defects G1–G8 and its accepted findings come from the [council synthesis](council-261020-1547-seat-binding-spec-review.md) and its settled packet. Tags such as `[G3]` mark the sentence that carries each item; §12 maps every id to its section.
- Goal (owner 09:54, unchanged): every need is configurable, including taste per seat and per capability; the machine prints one sentence per seat that says which executor, model, effort, tier and account it got and which rule supplied each; each fact is declared once.
- Model choice principle (owner 09:50): planned, well-guided work runs on a cheap model at the right level; complex thinking, own perspective and special design run on premium families.

## 2. Settled decisions

### 2.1 Locked owner decisions (never reopened here)

| # | Decision | Source |
|---|---|---|
| D1 | One authority answers the whole seat question (who, which model, tier, account, what on failure, why). | rev 1 §3.1 |
| D2 | Rigor decides only checker count and family independence. `rigorToTier` is deleted; tier is declared directly. | Q1, 12:05/12:10 |
| D3 | Six tiers defined by the nature of the work, definitions generated as `"$comment"` beside the config from one code source. | §T, 13:36 |
| D4 | A cell is a model plus an optional effort. Declared collapse between adjacent tiers is allowed. A tier a family cannot meet stays empty (deepseek and glm: no flagship, no frontier). | §T, 13:45 |
| D5 | Five roles: `producer`, `synthesizer`, `reviewer`, `red-team`, `judge`. `panelist` is removed; a panel is N `producer` seats plus a `synthesizer`. Seat, role and persona are separate. | Q9 12:38, 12:48 |
| D6 | Workflows declare seats explicitly: `seats: [{seat, role, persona?, tier?}]`; workflows never declare `prefer`. | §W 13:58 |
| D7 | R1: role taste lives in capability config (`capabilities."code:*".roles.red-team.prefer = ["xai"]`). A capability prefix is not a domain; there is no `domains` key. | Q2, R.2, correction 13:55, 21:06 A |
| D8 | R2: a domain package carries only portable `tier` and independence (a later wave). | R.3 13:28, 13:50 |
| D9 | Persona lookup: workspace `fgos/agents` → workflow folder (`wf.<name>.yaml`, `agent.<name>.yaml`) → owning domain → core. Convention owns the naming rule. A persona is passed into binding and may carry model taste. | Q7, Q10 13:17 |
| D10 | Only a human may raise tier; an agent-made raise is refused by name. | Q3 13:17 |
| D11 | Rust crate, internal route, thin Node facade. Conversion in one wave. | Q4 |
| D12 | Checker seats carry the unit's capability. | §W |
| D13 | Taste answers: (a) `shape-proposals` one frontier seat (system lens), two flagship; (b) `architecture:explain` flagship; (c) business/delphi synthesis standard; (d) opinion panels lead with cheap families (gemini, deepseek, glm); (e) `code:review`/`code:debug` keep codex then claude. | Q6 13:26 |

### 2.2 Owner-faithful defaults (restate owner answers; no confirmation needed)

- Shape S (§3.3) is the default because it is the owner's sentence D1.
- Persona taste key: `capabilities.<cap-or-prefix>.personas.<persona-name>`; the pin is the qualified persona identity plus digest, not the config key.
- `maxTier` (global and capability) is the only cost ceiling this wave; no `tierCeiling` on the frame. G5 is therefore load-bearing for spend control. [P3]

### 2.3 Owner answers of 2026-10-20 20:39 and 21:06

1. **Project wins** over the workflow seat tier (20:39; replaces the council's floor-wins default). Owner: "cho project thắng đi. nếu không thắng thì hạn chế người dùng, tool của chúng ta sẽ không có người dùng luôn, nếu họ không có kinh phí là ko thể dùng." A workflow seat `tier` is the workflow's recommended tier, a portable default like R2, not a floor.
2. **`family#invocation` pin is hard** (20:39). An unavailable pinned invocation refuses the seat by name; only an entry without an invocation lets the transport choose. [R8]
3. **No `families` key; `prefer` stays the single key** (21:06 A) at capability, `roles.<role>`, `personas.<persona>` and `seats.<seat>`. Capabilities are also served by tool executors (`impact-analysis: prefer "gitnexus"`; `gitnexus` and `herdr` are `kind: tool`), so "family" is not a general config concept. Seat Binding governs **agent seats only**; for agents there is one executor per family (doctor `executor-family-unique`, `src/setup/registrations.mjs:1473`), so an agent executor id names its family.
4. **No tier raise by override in wave 1** (21:06 B). Tier rises only through committed config; a raise through a workflow gate subject is a later item (§4.5).
5. **Workflow recommendation above capability defaults; `maxTier` lowers visibly** (21:06 C). Capability and prefix `tier` are the project's defaults and sit below a workflow seat's recommendation; only seat, persona and role keys outrank it. A resolved tier above `maxTier` is lowered to `maxTier`, visibly. Refusal remains only for a missing cell (§4.4).
6. **Drain plus doctor stop**, and **`--provider` stays executor-keyed** (21:06; council defaults confirmed).

## 3. Component: authority, boundary, shape

### 3.1 Authority

**Seat Binding is the only authority that answers "which executor, invocation, model, effort, tier and account does this agent seat run on, and where does it go on failure", with a reason for each part.** No other component computes tier, model, executor order, account order or the fallback step for an agent seat. The Execution Core row of `docs/platform/component-boundary.md:64` (today: `bind.mjs` is that authority) moves to Seat Binding in the same wave.

**Scope: agent seats only.** A capability served by a tool executor (`kind: tool`, e.g. `impact-analysis` → `gitnexus`, `pane-labeling` → `herdr`) keeps today's path untouched; Seat Binding neither resolves nor rewrites it.

### 3.2 Boundary

| Seat Binding owns | Seat Binding does not own |
|---|---|
| Agent seat tier, ceiling, executor order, cell and pool, account order, rotate-vs-next decision (walk), pin and override checks, independence when choosing, the explanation | Seat list of a unit: patterns and workflow `seats:` produce it; Seat Binding receives it through one seat resolver (§6.1) |
| Account state as a port: lease, release, quarantine, lazy probe (adapter = `provider-capacity`) | Running the agent, transport, confinement, login-store copy (Dispatch Transport and Confinement) |
| `explain` and `dry-bind` = the same function run without a lease | Case admission, frame, seat-launch ceiling (Workflow; Seat Binding reports launches used) |
| Tier vocabulary and ladder definitions (one constant, source of `$comment`) | Persona loading and its layers (`agent-definitions`; names and paths by Convention) |
| | Tool-executor capabilities (`kind: tool`) |

Consumers only ask: `runUnit` behind `fgos run` and `fgos workflow`, the Work path (`assignment-policy` becomes a thin consumer), the write gate, doctor, `fgos dispatch explain`, `workflow start --seats`. The second walker `attemptProviderCapacityFallback` is deleted (L10).

### 3.3 Shape S (default)

- **Two pure stages in the crate.** Stage 1 *policy*: (seat ask, config) → tier, ceiling, cell set, ordered executors, effective rigor, constraints; cached per seat + config digest. Stage 2 *ranking*: (policy, peers, walk state, accountView) → one ranked candidate list naming exact executor, invocation, model, effort, pool and account; re-run on each walk step and each `lease-conflict`.
- **Thin Node facade** calls the crate through the Rust host internal route, the Convention/Session Identity pattern. A missing route fails closed; there is no JS policy fallback. [G8]
- **No host exec under the provider lock.** The facade collects `accountView` outside `withProviderStateLock`, calls the crate, then acquires under the lock. [R1] (Today ranking and `ranked[0]` run inside the lock: `provider-capacity.mjs:623-636`.)
- **Decision, acquisition and replay are one authority.** [G6]
  - Each attempt persists a versioned `bindingInput` (seat, role, posture, effective rigor, `independentOf`/`preferIndependentOf` peers at decision time, walk state, config digest, tier source and ceiling, accountView digest) and a `leaseReceipt`.
  - The adapter acquires exactly the account the crate named, under the existing lock, or returns `lease-conflict`; the runner then rebinds with a fresh view under the same policy.
  - The write gate and doctor replay the persisted snapshot and verify the receipt; they never re-read today's quarantine clock. `explain`/doctor current-health answers are provisional.
  - Preserved behaviour: hard pins, no retry over a writing seat's partial writes (RUL92), quarantine and lazy probe, launch ceilings, a run-wide pin skipping seats it cannot apply to.
- **Exec budget.** The plan states and measures the host exec count per seat × round × walk step against an existing facade (Session Identity or Convention), on a three-seat panel with one walk step. Not measured in this pass (§11.4).

**Shape B (named fork, not default).** Rust owns static seat policy only; Node Execution Core keeps placement, independence, spread, walk and lease. It matches today's boundary map and removes G6 structurally, but two components then answer the seat question and `explain` is assembled from two sources. **Reversal trigger:** the owner rejects S's two-stage, no-exec-under-lock protocol, or the measured exec budget fails; then the S-vs-B question is asked with panelist-2's cost table. Shape A (resolver inside `bind.mjs`, no crate) is the priced Node baseline only; it contradicts D11.

## 4. Tier

### 4.1 Ladder (one source, generated `$comment`)

| Tier | Work | Self-check | Examples |
|---|---|---|---|
| nano | mechanical, no reasoning | only recognise or transform by pattern? | classify, extract, format, route, vote |
| mini | light reasoning on given input, narrow scope | all information in hand, only understand and summarise? | summarise, answer from supplied docs, exact small edit, small diff review |
| standard | follow an existing plan, many steps | plan and detailed guidance exist? | code to plan, write tests, refactor to description |
| advanced | find the way, no ready answer | must investigate and decide how? | hard debug, complex code, multi-file work without a plan |
| flagship | judgement, design, critique | is the result an opinion or a design? | review, red-team, solution design, panel synthesis |
| frontier | most expensive decisions | hard to reverse, costly if wrong? | architecture lock-in, final synthesis of an important council |

The table lives as one constant in the crate beside the tier vocabulary (`TIER_STRENGTH`). `fgos setup` writes it as `"$comment"` keys beside `modelPolicies`, `tierFallback` and `maxTier`; the loader ignores `$comment` at every level; doctor reports a `$comment` that differs from the source; `explain` prints the seat's tier definition. `$comment` is stripped before validation and before the semantic config hash. [G8]

### 4.2 Rigor, split from tier

| Concept | Answers | Decided by |
|---|---|---|
| tier | how strong a model | §4.4 |
| effective rigor | how careful | stronger of capability rigor (cap entry, else prefix) and unit rigor |
| ↳ checker count | how many checker seats | `patterns.reviewed.checkersByRigor[effectiveRigor]` ∪ `params.minCheckers` |
| ↳ hard independence | must seats differ in family | pattern table §6.3, strictness from effective rigor |
| budget cap | most a seat may get | `maxTier` (§4.4 step 4) |

Consequence: planned code runs at high rigor (more checkers, strict independence) on a cheap tier; a design council runs at a high tier without extra checkers. A Work item `risk: heavy` no longer lifts tier by itself; it adds checkers only.

### 4.3 Cells [G4]

| Cell form | Meaning |
|---|---|
| `"<model>[@<pool>]"` | model, pool defaults to the family's pool; no effort |
| `{ "model": "...", "pool": "...", "effort": "..." }` | `pool` and `effort` optional |
| non-empty array of the above | ordered entries, walked in order inside the family |
| tier key omitted | **unmet**: the family cannot serve this tier |

- `parseTierCell` (`tier-cell.mjs:25-40`, rejects every non-string today) accepts the object form; string cells stay valid, so existing cells migrate unchanged.
- Effort is part of the tier promise: it enters `bindingIdentity`, the binding snapshot and the write-gate comparison. An override may not lower a cell's effort (refusal `effort-below-cell`); an override at or above the cell effort is accepted as today.
- A cell without effort runs at the invocation template's own level (pi/omp templates hard-code `--thinking medium`); that level is recorded but is not a promise.
- An effort the candidate's actual CLI cannot render skips that candidate; on a hard pin the seat is refused `effort-unsupported`, naming the levels the CLI does render (§11.1).
- Effort vocabulary this wave is the canonical `REASONING_EFFORT_VALUES` = `low, medium, high, max` (`config.mjs:519`). Widening it (`xhigh`, `minimal`, `off`, which the installed CLIs accept) rides with the separate model-refresh diff, because only those proposed cells use them. Rewriting effort-in-name model ids (gemini `-low`/`-medium`/`-high`) also rides with that diff.
- The inline-lead escape is removed whenever configured candidates were rejected by policy or supply: `bind.mjs:500-514` today hands a `producer` to the session lead with `model: 'default'`, `source: 'session-lead-inline'`, bypassing every tier, cell and ceiling rule. It stays only for a unit that configured no candidate at all.

### 4.4 Tier composition (project wins, `maxTier` as budget lever) [G3]

For one agent seat, in order:

1. **Resolved tier** = the first declared value down this list (§5.3 has the full table):
   1. project seat key: `cap.seats.<seat>`, then `prefix.seats.<seat>`;
   2. project persona key: `cap.personas.<p>`, then `prefix.personas.<p>`;
   3. project role key: `cap.roles.<role>`, then `prefix.roles.<role>`;
   4. the workflow seat `tier` (recommended);
   5. project capability default: `cap.tier`, then `prefix.tier`;
   6. R2 domain package tier (later wave; absent this wave);
   7. `defaults.tier`.
2. **Override.** An override tier above the resolved tier is refused `tier-escalation-unauthorized` in wave 1 (§4.5). An override at or below it is accepted and recorded as `tierSource: override`.
3. **Visible source.** The binding record, run evidence and `explain` carry `tierSource` (the exact config path, `workflow:<id>/<unit>/<seat>` or `override`). When the chosen value differs from the workflow recommendation, they also carry the recommendation, e.g. `workflow recommends frontier, project config sets flagship (capabilities."architecture:shape".seats.system.tier)`.
4. **Budget cap.** `maxTier` = `cap.maxTier` ?? `prefix.maxTier` ?? global `maxTier`; a capability value may deliberately exceed the global one. A resolved tier above `maxTier` is **lowered to `maxTier`**, visibly: `tierSource`, `loweredFrom` and the reason `max-tier-cap` (naming the `maxTier` line) go into `explain`, the binding record and the run evidence.
5. **Cells.** A family with no cell at the final tier is skipped in the walk (B1 behaviour). If no allowed candidate has a cell at that tier, the seat is refused `tier-cell-missing`, naming the config line to change (the tier key that set it, or the `prefer` list that restricted it). A seat hard-pinned to a family without that cell is refused the same way. A missing cell never lowers the tier.
6. **Continuity.** A seat that runs more than one round in a unit (Delphi `sameSeat`, debate rebuttal) keeps executor + model + effort. Account rotation inside the same pool is allowed when it keeps that pin; otherwise the seat is refused `seat-continuity-unavailable`.

Invalid tier names in config are load errors. The only lowering that ever happens is the visible `max-tier-cap`; nothing lowers a tier silently.

### 4.5 Authority to raise [G5]

- The door (the admission or invocation boundary) computes a trusted `raiseAuthorized`; the crate never reads `override.origin`. Default authority is agent. The same gate governs `acceptDependence` (`bind.mjs:385` trusts `origin === 'human-cli'` today).
- Today `human-cli` is a self-asserted string: `bin/fgos.mjs:2851` sets it on any override without origin, `:2862/:2878/:2889` synthesise it for `--effort`, `--timeout`, `--account`, and `src/workflow/unit-handoff.mjs:198` synthesises it in workflow handoff.
- **Wave 1 (settled 21:06 B):** no door can attest a human for a direct `fgos run` (§11.2), so `raiseAuthorized` is false at every door. A tier rises only through committed project config (tier keys, `maxTier`) or a workflow recommendation. `fgos run --tier`/`--override` raises are refused `tier-escalation-unauthorized`; `--effort`, `--timeout`, `--account` keep working, since they are not tier raises.
- **Later item:** a raise through a workflow consent gate answered with `fgos workflow answer --approve`, whose subject digest covers the seat and the requested tier.

## 5. Configuration [G1]

### 5.1 Who declares what

| Declarer | Keys | Notes |
|---|---|---|
| Workflow unit | `capability`, `pattern`, `persona?`, `rigor?`, `seats: [{seat, role, persona?, tier?}]` | `tier` is a recommendation; never `prefer`, `executor`, `overrides` |
| Domain package (R2, later wave) | `tier`, independence | portable only; never `prefer` |
| Project `.fgos/config.json` `runner` | `defaults`, `maxTier`, `tierFallback`, `modelPolicies`, `capabilities` | the final word (R1), within §4.4 |
| Global `~/.fgos/config.json` | `llmAccounts`, machine executors | takes no new key this wave (§8) |

### 5.2 Schema

| Key | Shape | Meaning |
|---|---|---|
| `defaults.tier` | tier | system default (`standard`) |
| `maxTier` | tier | global budget cap |
| `tierFallback.<tier>` | family list, six keys incl. `mini` | walk order after the first-attempt list |
| `modelPolicies.<family>.<tier>` | cell (§4.3) | omitted key = unmet |
| `capabilities.<cap-or-prefix>` | `{ tier?, maxTier?, rigor?, prefer?, roles?, personas?, seats?, ...existing keys }` | `<prefix>:*` matches every capability starting `<prefix>:` |
| `….roles.<role>` | `{ tier?, prefer? }` | one of the five roles |
| `….personas.<persona-name>` | `{ tier?, prefer? }` | bare persona name |
| `….seats.<seat>` | `{ tier?, prefer? }` | keyed by seat name within the capability (D6, §W) |

- `prefer` keeps today's entry shape: an executor id, or `{executor, invocation}` for a pin. For an agent executor, the id names its family (one executor per family, `executor-family-unique`), which is how `prefer` meets the family-keyed `tierFallback` and `modelPolicies` (e.g. executor `glm` ↔ family `z-ai`). The spec writes an invocation pin as `family#invocation`; in config it is the `{executor, invocation}` entry.
- Existing capability keys (`description`, `aliases`, `confinement`, `serves`, `persona`, `minCheckers`, `verify`) stay.

### 5.3 Precedence per property

| Order | `tier` | `prefer` (first-attempt order) | `maxTier` | `rigor` |
|---|---|---|---|---|
| 1 | override at or below resolved (§4.4 step 2) | executor override | `cap.maxTier` | `cap.rigor` |
| 2 | `cap.seats.<seat>` | `cap.seats.<seat>` | `prefix.maxTier` | `prefix.rigor` |
| 3 | `prefix.seats.<seat>` | `prefix.seats.<seat>` | global `maxTier` | — |
| 4 | `cap.personas.<p>` | `cap.personas.<p>` | | |
| 5 | `prefix.personas.<p>` | `prefix.personas.<p>` | | |
| 6 | `cap.roles.<role>` | `cap.roles.<role>` | | |
| 7 | `prefix.roles.<role>` | `prefix.roles.<role>` | | |
| 8 | **workflow seat `tier`** | `cap.prefer` | | |
| 9 | `cap.tier` | `prefix.prefer` | | |
| 10 | `prefix.tier` | `tierFallback.<tier>` | | |
| 11 | R2 domain tier (later) | | | |
| 12 | `defaults.tier` | | | |

Rules:
- Each property resolves independently down its column; a seat may take `tier` from one row and `prefer` from another. `maxTier` then caps `tier` (§4.4 step 4).
- Lists replace, never merge; maps (`roles`, `personas`, `seats`) inherit per key from the prefix entry.
- Absent = inherit from the next row. `prefer: []` is a load error.
- `prefer` orders the first attempt only; on failure the walk follows `tierFallback.<tier>` restricted to the families in the seat's list (owner Q4 of MP-B1: capability only narrows).
- Prefix = the text before the first `:`; a capability without `:` has no prefix row. One prefix level only, so no tie between prefixes.
- The bare-verb fallback (`code:review` → `review`, `bind.mjs:70-84`) is retired in the same wave; the plan lists every consumer of that lookup (doctor rows, `explain`) before deleting it. Lookup becomes exact key → `<prefix>:*` → defaults, merged per property instead of picking one entry by usable `prefer`.
- Independence and spread apply after precedence, as a filter (§6.3), and `explain` names the filter that moved a seat.

### 5.4 Personas [G7]

- The workflow loader discovers packaged workflows (`<wf>/wf.<wf>.yaml`) besides flat files and attaches `{sourcePath, workflowDir, owningDomain|null}`; `owningDomain` comes from the file's location, never from the capability prefix. Today `src/workflow/loader.mjs:72-98` scans flat files only.
- `agent-definitions` resolves workspace → `workflowDir` → `owningDomain` → core, accepting `agent.<name>.yaml` beside the workflow; a domain's personas are visible only inside that domain. Today `agentTierDirs` (`agent-definitions.mjs:36-54`) merges every domain into one tier and expects `<name>.yaml`.
- Convention owns the name and path rules; reading, layer order and pinning stay in `agent-definitions`.
- The persona is resolved before `bindSeat`; the binding persists the qualified identity (`<layer>:<source>/<name>`) and digest. Taste is looked up by bare persona name under `capabilities.<cap-or-prefix>.personas`. Persona files never carry `prefer`.

## 6. Seat identity and patterns [G2]

### 6.1 Seat contract

- Every ask and result carries `seat` (id unique in the unit), `role` (one of five) and the pattern **posture** (`readOnly`, `forceOutOfProcess`, panel-member stance). Write and launch behaviour come from posture, never from the role `producer`. [B3]
- Bindings, assignment directories, the seat ledger, panel and debate resume and handoff refs are keyed by `unitRun + seat + round + attempt`. Today they are role-keyed (`role-ledger.mjs:20-34`), so three `producer` seats would collapse into one slot.
- One seat resolver produces the seat list for execution, simulation, doctor and admission launch counting. It validates unique seat ids and the pattern's role multiplicities.
- Composition:
  - `solo`: one seat `producer` unless declared.
  - `reviewed`: seat `producer` plus one seat per checker role from `checkersByRigor[effectiveRigor]` ∪ `minCheckers`, seat id = role name unless declared.
  - `panel` and `debate`: `seats:` is required. `params.members`, `params.role`, `params.synthesizeRole` and `panelist-N` keys of `roleTasks` are removed; `roleTasks` and `workflow start --seats` are keyed by seat.
  - `debate`: `thesis` and `antithesis` become seats with role `producer`; `judge` is a seat with role `judge` (`patterns/debate.mjs:35-43` today keys them as roles).
- `CHECKER_ROLES` (`bind.mjs:19-24`, forcing out-of-process by role name and `panelist-` prefix) is replaced by posture.
- Stance is recorded from the panel-member posture, not from a role kind (`role-tasks.mjs:100` keys it on `kind === 'panelist'`, which disappears). [P2]

### 6.2 Launch order [R5]

Seats are bound and reserved in the order the resolver lists them; each binding is published to the seat ledger before the next seat binds; launch is parallel only after every seat of the batch is bound. A subprocess facade must not let three producers read an empty peer set (today this holds only because bind-and-note runs in one synchronous stretch, `role-ledger.mjs:13-17`).

### 6.3 Independence per pattern [B3]

| Pattern | Soft (spread, prefer different family) | Hard (refuse if unmet) |
|---|---|---|
| solo | — | — |
| panel | producers among themselves; synthesizer vs producers | — |
| reviewed | — | each checker vs producer; at high/critical, checkers pairwise |
| debate | the two sides | judge vs both sides |

An unmet hard rule refuses the seat `independence-unsatisfiable`, naming the peers; `explain` prints which rule moved a seat.

## 7. Pins and the `--provider` flag

- An invocation pin (`family#invocation`, in config `{executor, invocation}`) is hard: an unavailable pinned invocation refuses the seat `pin-unsatisfiable` (or skips the candidate when the pin is scoped to a run-wide override); never a silently different invocation; `explain` prints the reason. Only an entry without an invocation lets the transport choose. [R8] (MP-B1 phase 07 saw `code:review`'s `codex-cli-bwrap` pin replaced by `codex-herdr`; that becomes a refusal.)
- Note for the later model-config diff: the `code:review` and `code:debug` pins (`codex-cli-bwrap`, `claude-cli-bwrap`, beside `confinement: {mode: required, policy: host-write-denied}`) are candidates for removal, keeping only the confinement requirement. The herdr invocations would satisfy that requirement at bind (§11.5).
- `fgos run --provider` stays executor-keyed this wave; the `{executor, invocation}` entry covers the pin form. [minor-provider-flag]

## 8. Conversion: one wave with a stop [G8]

1. **Drain.** The wave starts only when no pre-fence `unit.json` is `doing` or `paused`; doctor check `seat-binding-drain` reports the blocking records. A pre-fence record asked to resume is refused `record-predates-seat-binding`. The doctor check is the wave's stop predicate. [R9]
2. **Fence.** Config and `unit.json` carry a schema version written by the new release. An older activation refuses the new project schema instead of misbinding (today it throws on the first new capability key, `config.mjs:1364`, and requires `rigorToTier`, `config.mjs:1710-1715`).
3. **Release first.** Build, stage and activate the release carrying crate, route and facade; doctor confirms the route is registered on the installed host. Then migrate project config.
4. **`fgos setup` converts project config** deterministically and idempotently, backup first, printing the diff: delete `rigorToTier`; add `mini` to `tierFallback`; keep string cells; write `$comment`s; add capability `tier`/`maxTier`/`roles`/`personas`/`seats` only where the taste answers need them. `prefer` keeps its key and shape. Core workflows convert to explicit `seats:` in the same wave.
5. **Global file.** The new keys go to project config only; the global file takes no new key this wave, so releases that read it keep loading it (`config.mjs:1364` rejects unknown capability keys). [P4]
6. **Rollback** = the prior release and the pre-migration config backup, together.
7. **Hash.** `snapshotRunnerConfig` (`run.mjs:161-172`, today capabilities, patterns, rigorToTier, modelPolicies, executors, governance) covers `defaults`, `maxTier`, `tierFallback` and drops `rigorToTier`.
8. **Doctor.** `model-policy-tier-coverage` and `workflow-pools-satisfy-independence` are replaced by one check that binds every seat of every registered workflow with the same function (dry-bind).
9. **Records.** New `docs/specs/seat-binding.md`; component-boundary row; new records superseding the seat-choice parts of RUL80, RUL91, RUL98, RUL102, RUL103, RUL106 (never edited in place); runner and workflow specs updated.

## 9. Worked examples

### 9.1 Project config used by the examples

```json
"defaults": { "tier": "standard" },
"maxTier": "flagship",
"capabilities": {
  "architecture:*": {
    "tier": "flagship", "rigor": "high",
    "prefer": ["claude", "openai", "gemini", "xai", "deepseek"],
    "roles": { "red-team": { "prefer": ["xai"] } }
  },
  "architecture:shape": {
    "rigor": "critical", "maxTier": "frontier",
    "seats": { "system": { "prefer": ["claude", "openai"] } }
  },
  "architecture:critique": { "maxTier": "frontier", "seats": { "producer": { "tier": "frontier" } } },
  "architecture:synthesize": { "rigor": "critical", "maxTier": "frontier", "seats": { "producer": { "tier": "frontier" } } },
  "group-cognition:*": { "prefer": ["claude", "openai", "gemini", "xai", { "executor": "glm", "invocation": "pi-cli-bwrap" }] }
}
```

`architecture:explain` needs no entry: it inherits flagship from the prefix (D13 b). Which critique seat carries frontier ("one critique seat frontier", MP-B1 06) is taste; the example puts it on the critique producer. Model names below are today's cells.

### 9.2 `architecture-advisory`, end to end

Workflow (converted `shape-proposals`):

```yaml
- id: shape-proposals
  template:
    capability: architecture:shape
    pattern: panel
    blind: true
    seats:
      - { seat: system,      role: producer,    persona: system-lens, tier: frontier }
      - { seat: alternative, role: producer,    persona: alternative-lens }
      - { seat: constraint,  role: producer,    persona: constraint-lens }
      - { seat: synthesis,   role: synthesizer }
```

| Unit / seat | Tier (source) | maxTier | Executor → model | Independence |
|---|---|---|---|---|
| frame-context / producer | flagship (`architecture:*`.tier) | flagship (global) | claude → `opus` | — |
| shape / system | frontier (workflow recommendation outranks `architecture:*`.tier) | frontier (cap) | claude → `fable` | panel soft |
| shape / alternative | flagship (`architecture:*`.tier) | frontier | spread: openai → `gpt-6.1-sol` | soft |
| shape / constraint | flagship | frontier | spread: gemini → `gemini-4-argon-high` | soft |
| shape / synthesis | flagship | frontier | claude → `opus` (soft spread allows reuse) | soft |
| critique / producer | frontier (cap seat key) | frontier (cap) | claude → `fable` | — |
| critique / reviewer | flagship (prefix) | frontier | hard ≠ claude: openai → `gpt-6.1-sol` | hard vs producer |
| critique / red-team | flagship | frontier | `prefix.roles.red-team.prefer` → xai `grok-4.6` | hard; pairwise at high |
| synthesize / producer | frontier (cap seat key) | frontier | claude → `fable` | — |
| synthesize / reviewer, red-team, tester | flagship (prefix); rigor critical → three checkers | frontier | openai; xai; tester → gemini | hard, pairwise |
| explain / producer | flagship (prefix) | flagship | claude → `opus` | — |

**Variant A (budget by capability default).** The project sets `"architecture:*": { "tier": "standard" }`. Seats without a workflow recommendation run standard; `system` keeps frontier, because the workflow recommendation outranks capability and prefix `tier`, provided `architecture:shape.maxTier` allows it.

**Variant B (budget by cap).** The project declares no `architecture:shape` entry and keeps global `maxTier: flagship`. `system` resolves frontier from the workflow and is lowered: `tier flagship (max-tier-cap: maxTier = flagship, global), lowered from frontier (workflow:architecture-advisory/shape-proposals/system)`. To keep frontier on that seat, set `capabilities."architecture:shape".maxTier = "frontier"`. To pin the seat lower everywhere, set `capabilities."architecture:shape".seats.system.tier`.

**Variant C (refusal).** The project sets `"architecture:shape": { "seats": { "system": { "prefer": ["deepseek"] } } }` under Variant B. The tier is capped to flagship; deepseek has no flagship cell; `prefer` replaces the list, so no other candidate exists. Result: `tier-cell-missing: shape-proposals/system flagship — no allowed executor has a cell; change capabilities."architecture:shape".seats.system.prefer or set capabilities."architecture:shape".seats.system.tier`.

Explain line for one seat:

```
architecture-advisory / critique-proposals / red-team  (role red-team, capability architecture:critique)
  → xai grok-4.6 @ flagship, effort: invocation default (medium), account xai/<id>
    tier: capabilities."architecture:*".tier = flagship; maxTier: capabilities."architecture:critique".maxTier = frontier (not applied)
    prefer: capabilities."architecture:*".roles.red-team = [xai]; independence: ≠ producer(claude) ok, ≠ reviewer(openai) ok
    on failure: rotate xai accounts → tierFallback.flagship ∩ [xai] → none left: refuse
```

### 9.3 Debate: `group-cognition / dialectical-critique`

```yaml
- id: dialectical-critique
  template:
    capability: group-cognition:critique
    pattern: debate
    persona: critic
    seats:
      - { seat: thesis,     role: producer }
      - { seat: antithesis, role: producer }
      - { seat: judge,      role: judge, tier: flagship }
```

| Seat | Tier (source) | Pick | Rule |
|---|---|---|---|
| thesis | standard (`defaults.tier`) | claude `sonnet` | sides soft |
| antithesis | standard | spread: openai `gpt-5.6-terra` | sides soft |
| judge | flagship (workflow recommendation; ≤ global maxTier) | hard ≠ claude, openai: gemini `gemini-4-argon-high` | judge hard vs both |

Rebuttal round: thesis and antithesis keep executor + model + effort (§4.4 step 6). If gemini, xai and glm all lacked a usable flagship cell, the judge is refused `independence-unsatisfiable`, naming both sides' families; glm (z-ai) has no flagship cell after the ladder change, so it is skipped, never lowered. A project with global `maxTier: standard` would cap the judge to standard visibly (`max-tier-cap`).

### 9.4 Remaining taste answers as config lines

| Answer | Line |
|---|---|
| (c) business/delphi synthesis standard | `"business:synthesize": {"tier": "standard"}`, `"delphi:synthesize": {"tier": "standard"}` |
| (d) opinion panels lead cheap | `"business:perspectives": {"prefer": ["gemini", "deepseek", "glm", "claude", "openai"]}` (same for opinion-panel capabilities) |
| (e) code review/debug codex then claude | `"code:review"`/`"code:debug"`: `{"prefer": [{"executor": "openai", "invocation": "codex-cli-bwrap"}, {"executor": "claude", "invocation": "claude-cli-bwrap"}]}` (today's lines; see §7 note) |
| red-team taste per area | `"code:*": {"roles": {"red-team": {"prefer": ["xai"]}}}`, `"marketing:*": {"roles": {"red-team": {"prefer": ["claude"]}}}` |

## 10. Settled 21:06

Nothing stays open for the owner except approving the whole text. Settled items and the rule each one fixes:

| Item | Settled as | Where |
|---|---|---|
| Workflow seat tier vs project | project wins (20:39) | §2.3, §4.4 |
| Capability/prefix `tier` vs workflow recommendation | capability and prefix `tier` are defaults below the recommendation; seat, persona and role keys outrank it (21:06 C) | §4.4, §5.3 |
| Above `maxTier` | lowered to `maxTier`, visibly, reason `max-tier-cap` (21:06 C) | §4.4 step 4 |
| Refusal | only for a missing cell, naming the config line (21:06 C) | §4.4 step 5 |
| Config key | `prefer` everywhere, no `families`; agent seats only (21:06 A) | §2.3, §3.1, §5.2 |
| Tier raise by override | none in wave 1; committed config only; gate-subject raise later (21:06 B) | §4.5 |
| `family#invocation` pin | hard (20:39) | §7 |
| Old records | drain plus doctor stop (21:06) | §8 step 1 |
| `--provider` | executor-keyed (21:06) | §7 |

## 11. Verification (read-only, this pass)

### 11.1 Effort levels per executor CLI

Configured agent invocations (`.fgos/config.json` `runner.executors`): `claude` (claude), `codex` (openai), `pi` (z-ai via executor `glm`, openai, deepseek), `omp` (gemini, xai). Rendering table: `REASONING_EFFORT_CONTROLS`, `provider-adapter.mjs:255-261`.

| CLI | Flag (from `--help`) | Accepted levels | Rendered by fgOS |
|---|---|---|---|
| claude | `--effort <level>` | low, medium, high, xhigh, max | yes |
| codex 0.163.0 | no flag; `-c model_reasoning_effort=<v>` (help lists only generic `-c`) | not enumerated; accepts any string unchecked, so fgOS checks; adapter maps `max` → `xhigh` | yes |
| pi | `--thinking <level>`; also `--model <id>:<level>` | off, minimal, low, medium, high, xhigh, max | yes |
| omp | `--thinking=<value>` | off, minimal, low, medium, high, xhigh, max, auto | yes |
| agy (installed, not configured) | `--effort` | low, medium, high, xhigh, max | yes |
| grok (installed, not configured) | `--reasoning-effort` (alias `--effort`) | not enumerated | no control mapped |
| gemini | binary not installed | — | — |

Canonical vocabulary is `low, medium, high, max` (`config.mjs:519`); every configured CLI renders all four. Pass-through of effort by OpenRouter for deepseek/z-ai was not checked (vendor coverage is out of scope).

### 11.2 Trusted human-authority input

**No.** Nothing in the current machinery attests a human for a direct `fgos run`:
- `bin/fgos.mjs:2851` defaults `origin = 'human-cli'`; `:2862`, `:2878`, `:2889` synthesise it; `unit-handoff.mjs:198` synthesises it for workflows; `bind.mjs:385` trusts it.
- Session identity (`src/util/session-identity.mjs`, `docs/platform/session-identity/spec.md:52`) resolves which session wrote, not whether a human did.
- The strongest existing door is a workflow consent gate: `answerWorkflow` → `recordAnswer` → `recordGateAnswerRound` (`case-verbs.mjs:167-184, 222-233`, `case-runtime.mjs:176-209`) writes an append-only round with `approved` and `subjectDigest`, and admission's `human-consent` rule accepts only a gate answer (`case-admission.mjs:153-160`). It does not exist for a direct `fgos run`, and its record carries no answerer identity (`case-runtime.mjs:193`), so it is trusted by convention like every fgOS consent.
- Hence §4.5: no override raise in wave 1, with that gate named as the later door.

### 11.3 Code citations re-checked at HEAD `4c248d749`

Re-checked again after merging main (`71888fdf5`): no cited source file changed; `component-boundary.md` gained one row (Event Store) elsewhere, and the Execution Core row is still at :64.

| Citation | Status |
|---|---|
| `bind.mjs:17-24` CHECKER_ROLES | valid (set at :19, helper :22-24) |
| `bind.mjs:63-84` lookupCapabilityConfig | moved slightly: function at :70-84 |
| `bind.mjs:385` acceptDependence on `human-cli` | valid |
| `bind.mjs:500-514` inline-lead fallback | valid |
| `bin/fgos.mjs:2845-2852` origin default | valid (:2851); synthesis also at :2862/:2878/:2889 |
| `unit-handoff.mjs:194-204` | valid (:198) |
| `config.mjs:1364-1376` capability key allowlist | valid |
| `config.mjs:1710-1715` rigorToTier required | valid |
| `tier-cell.mjs:22-38` parseTierCell | moved: :25-40 |
| `provider-capacity.mjs:623-636` ranking under lock | valid |
| `role-ledger.mjs:13-35` | valid (map at :20-34) |
| `run.mjs:160-172` snapshotRunnerConfig | valid (:161-172) |
| `role-tasks.mjs:100` hasStance | valid |
| `agent-definitions.mjs:36-54` | valid |
| `loader.mjs:72-98` | valid |
| `component-boundary.md:64` | valid |
| `session-identity.mjs:48-60` exec refused under lock | moved: counter at :47-57, refusals at :109 and :203 |
| git `4a07c6bb8` debate pattern | valid; roles at `patterns/debate.mjs:35-43` |
| `executor-family-unique` doctor check | exists, `src/setup/registrations.mjs:1473` |

### 11.4 Not verified here

- Facade exec cost of Shape S: the timing command was blocked by the worktree guard; stays a plan proof item (§3.3).
- Vendor tier, model and price claims in §4.1 cells: unverified by anyone; they matter only to the later model-refresh diff (step 7 of lane SEAT).

### 11.5 Herdr invocations vs `confinement: required`

At bind, yes. `resolvePostureInvocation` (`confinement/policies.mjs:717-744`) accepts a candidate whose invocation declares a bwrap backend present on the machine. `pickConfinedInvocation` (`:682-701`) admits `herdr-spawn` invocations when herdr is present; `codex-herdr` and `claude-herdr-bwrap` both declare `confinement.backend: bwrap`. The confinement authority still records `herdr-partial-maturity` for herdr spawns, and host IPC is out of scope there (`confinement/authority.mjs:424-468`). Dropping the pins therefore keeps the confinement requirement, but lets herdr seats run with that recorded caveat.

## 12. Traceability

Every id appears as an operative sentence, and a planner may not drop any of them.

| Id | Section |
|---|---|
| G1 | §5.2, §5.3 |
| G2 | §6.1 |
| G3 | §4.4, §9 |
| G4 | §4.3 |
| G5 | §4.5, §11.2 |
| G6 | §3.3 |
| G7 | §5.4 |
| G8 | §3.3 (fail closed), §4.1 (`$comment` hash), §8 |
| P2 | §6.1 |
| P3 | §2.2 |
| P4 | §8 step 5 |
| B3 | §6.1, §6.3 |
| R1 | §3.3 |
| R5 | §6.2 |
| R8 | §2.3, §7 |
| R9 | §8 step 1 |
| minor-provider-flag | §7 |

Proof list for the plan (from the packet; the floor item is replaced by the 21:06 rule):
- two producer seats resume separately;
- panel producers never run inline and never write;
- the debate judge is hard-independent of both sides;
- ordered concurrent panel bind with soft spread;
- a workflow recommendation beats capability/prefix `tier` but loses to seat, persona and role keys;
- a resolved tier above `maxTier` is lowered with `max-tier-cap` and the lowered-from value in `explain`, record and evidence; a deliberate capability `maxTier` above global passes;
- a missing cell skips the family, a seat with no allowed cell refuses naming the config line, and a hard pin refuses;
- an unsupported or lower effort cannot claim the tier;
- an untrusted `human-cli` cannot raise tier or `acceptDependence`;
- tool-executor capabilities bind exactly as before;
- a lease race rebinds under the same policy;
- gate replay survives a later quarantine;
- an adjacent persona shadows only its own workflow or domain;
- stance still records with explicit seats;
- the host exec count matches the spec and is zero under the provider lock;
- conversion is idempotent, and an older activation refuses the new project schema instead of misbinding.

## 13. Do not add

- cost accounting
- new collaboration patterns
- a model evaluator
- a general thinking-control API
- vendor effort-mode coverage
- a second walker
- a JS policy fallback when the host route is missing
- `tierCeiling` on the frame
- R2 domain packaging
- a `families` key

The `{objective}` leak into checker `roleTasks` of `core/workflows/architecture-advisory.yaml` is a live defect outside this spec.

## 14. Provenance

- Council: workflow `architecture-advisory`, case `wf-run-1792496104999-4c0d9095`, settled 2026-10-20; packet `.fgos/assignments/unit-run-1792498871506-22e9d338/producer/2/runs/01/outbox/packet-1.json`; explanation `.fgos/assignments/unit-run-1792502428145-a2c7079c/producer/1/runs/01/outbox/report-1.md`.
- Red-team wording corrections, carried here and not applied in the settled packet:
  - **R2-A:** `revisionOf.rule` says the verdict is "byte-identical to round 1". Only `blockingDefects`, `alternatives`, `proofListForPlan` and `doNotAdd` are; `verdict.ownerDecisionsCoherent`, `statement` and `whatMakesItReadyTraceability` changed per R1, R2 and R4. Read it as: conclusion unchanged, verdict text qualified.
  - **R2-B:** `evidence.driftSincePanelCheckout` names the round-1 span `7a5179886..fc36fae67`, while the packet's checkout is `73ad73558`. The round-2 drift (three uncited files) is stated in `notes`.
- Owner decisions after the council, relayed by the coordinator:
  - 20:39: project wins (quoted in §2.3); `family#invocation` hard.
  - 21:06: A (`prefer` stays, agent seats only), B (no override raise in wave 1), C (capability/prefix `tier` below the workflow recommendation; `maxTier` lowers visibly; refusal only for a missing cell); drain plus doctor stop and executor-keyed `--provider` confirmed.
- Superseded council defaults:
  - floor-wins (20:39);
  - "refuse above ceiling, never clamp" in G3, which assumed floor-wins, replaced by the visible `max-tier-cap` lowering (21:06 C);
  - `prefer` → `families` conversion and the global deprecated-`prefer` window (packet `namedDefaults.newDecisionsClosedByDefault` item 4, and G8's global-window step), dropped with 21:06 A.

## Appendix (non-operative): history

- Historical Q&A, the three root causes (rigor carrying three jobs, no seat level in config, one decision computed in many places), the R1–R4 option table and its R.2 restatement, the MP-B1 appendix (invocation pin overridden by transport) and the live-run appendix (session `d50dc90b`): see [rev 1](spec-draft-261020-1017-seat-binding-component.md) §2, §9, §R, §R.2 and its two appendices.
- Superseded rev 1 text, kept only there:
  - §3.0.1 "four roles"; §3.3 "Node first";
  - §5.1/§5.2/§6: global `roles`, `seats.<role>`, `families` replacing `prefer`, five-key `tierFallback`, presets without tier, `architecture:explain` standard, `modelPolicies` unchanged;
  - §W and §R.3: workflow/domain tier as a **floor** ("sàn", "không thấp hơn", "không tự hạ"), replaced by project wins with the visible `max-tier-cap` (§2.3, §4.4).
- The earlier revision of this file (commit `93a1ad738`) carried floor-free refusal above the ceiling and a `families` key; both were replaced at 21:06.
- Inventory ids (N, D, K, O) refer to [the inventory](research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md); the ladder evidence is in [the tier research](research-261020-1339-model-family-tier-ladders.md).
