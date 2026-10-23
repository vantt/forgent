# Spec draft, Part A: degree of applying a collaboration pattern through bounded params

Status: draft for owner approval. Nothing here is implemented and no area spec changes until the owner approves it and section 17 is merged.
Date: 2026-10-23. Code facts verified at main `4065cbd68`.
Language: the area specs are Vietnamese; quoted current sentences stay verbatim, all other text is English.

This is **Part A** of a split decided by the COOK lead under RUL104 after two red-team reviews (`reports/red-team-contracts.md`, `reports/red-team-assumptions-scope.md`). Part A is only what the owner asked for. Everything about milestone evidence hardening is **Part B**, a separate backlog outline: `part-b-evidence-hardening.md`.

Evidence classes: **owner** (decided 2026-10-23, binding), **packet** (advice of advisory packet rev.3, `.fgos/assignments/unit-run-1792741678364-45ec2060/producer/2/runs/01/outbox/report-1.md`, not yet approved), **code** (verified at the head above), **spec choice** (decided here, needs owner confirmation, collected in section 15).

## 1. Problem and evidence

The owner's requirement (packet `ownerRequest`): a light validate and a light implement are different degrees and must stay distinguishable; the mechanism is the degree of applying a pattern, not a slice-weight to rigor to review ladder; each layer states intent and degree explicitly; the result is configurable; the fix is not aimed at the single case `reviewed`.

What fails today (**code**):

1. **A guide's declared unit never reaches the door.** `chosenPattern` (`src/runner/execution/run.mjs:366`) is `caller object > unit.pattern > caller string > solo` and never sees the guide. A case activity run without `--pattern` runs `solo` although `domains/coding/workflows/feature.yaml:145` says `unit: { pattern: reviewed }`. The COOK skill tells the conductor to copy the pattern by hand (`core/skills/fgos-cook/references/route-table-pending.md`, `case-and-doors.md`).
2. **Solo ignores verify.** `runSolo` (`src/runner/execution/patterns/solo.mjs`) takes a `verify` hook and never calls it. Worse, a solo run settles as soon as the producer result is recorded: the block in `run.mjs` that tests `patternName === 'solo'` writes `unitJson.settlement` immediately (around line 1581), so a verify added to the loop would never gate the settlement.
3. **A seat can be named so that its result counts as the harness's verify.** `isVerifyResult` (`legacy-seat-read.mjs`) is a seat-id test, `/^verif(y|ier)$/`; `receiptsFromResults` (`case-projection.mjs:240`) turns any passing result with that seat id into an evaluator `harness-verify` receipt; solo accepts a declared seat with any id (`seat-resolver.mjs:198-201`) and `declaredSeatsOf` lets `unit.seats` silently beat preset `params.seats` (`seat-resolver.mjs:159-162`).
4. **A preset is not a pinned meaning.** `resolvePattern` shallow-merges caller params over preset params (`patterns/presets.mjs`), so a caller list replaces `rfc`'s `minCheckers`; `run.mjs` persists the unexpanded selector (773, 1438-1441), so a resume re-expands with whatever the presets and config are now.
5. **The coding red-team requirement is a branch in code** (`seat-resolver.mjs:116`) that no project can lower; `minCheckers` is read from the exact capability key only (`:113`).
6. **A request has no door.** The agent can pick a pattern name (`--pattern`) but cannot ask for a param value on the door, and nothing records a reason for one.

P6 evidence (**packet**; `plans/reports/measure-261022-1758-cook-p6-pane-launch.md`, notebook rows 6-7): `implement-item` ran solo with `--verify`, passed and left `receipts: []`; `child-verified` was never reached in an 11-dispatch, 4.5-hour case. No controlled comparison exists and this spec claims no speed figure.

## 2. Scope and non-goals

In scope (Part A): how the degree is **declared** (guide activity `unit`), **requested** (agent, on `fgos run`), **resolved and pinned** (Execution Core), the **bounds** a project can set, the **minimum evidence** that makes a light degree real (solo verify with a harness receipt), and the red-team default made tunable.

Not in Part A (each one is in Part B or settled non-goals):

- no change to how an existing case ledger folds, no evaluator-kind enforcement, no consent payload change, no freshness or subject-locator system, no new guard primitive, no assessor seat, no coding-guide restructure;
- no new refusal for panel or debate: a capability-level `verify` on them behaves as today (not run, no refusal);
- no new admission refusal code and no change to the AdmissionPort proposal (`port.admit` keeps its fields);
- no `selector-conflict`, no Unit file schema change (`unit.pattern` stays a string);
- no universal degree field, no new pattern loop, no `review-light` / `debate-light`, no project overlay of a shipped guide (**owner**), no policy engine.

The model is domain-neutral. The coding guide is one consumer; its edits are Part B.

## 3. Concepts

| Term | Meaning | Defined by |
|---|---|---|
| Activity unit | the guide's default collaboration for an activity: `unit: { pattern, params }` | guide (existing field) |
| Request | `{ pattern?, params }` the agent supplies for one dispatch through `fgos run --params`, plus a reason | the one request door (section 8) |
| Baseline | the selector the existing precedence chain picks for a dispatch (section 6) | Execution Core |
| Effective collaboration | the single resolved result: base pattern name, params with provenance | Execution Core |
| Pin | the effective collaboration (and the request) stored on the Unit-run record | Execution Core |
| Param kind | how a param merges and is bounded: `ceiling`, `additive`, `closed-set`, `free` (7.2) | pattern module |
| Invariant | a preset value its promise depends on; no request, `unit.seats` or config weakens it | preset |
| Bound | a project's ceiling for a requested value (7.3) or a preset invariant | config / preset |

Degree is chiefly the params of the pattern the activity points at (**owner**); a new pattern or preset name only for a different observable promise (**owner**). "Light means fewer people or a different topology, never a weaker receipt than the milestone guard": one writer plus a harness receipt, one assessor verdict and one advisor finding are three different receipts (**packet**). Part A makes the first one real.

## 4. The three messages and who owns each

Not three services; three messages on layers that exist.

1. **Activity obligation** (guide): the default `unit: { pattern, params }`, effects, `produces`, MUST rows (unchanged).
2. **Requested collaboration** (agent): activity or route, optionally a `--params` request with a reason.
3. **Effective collaboration** (Execution Core): resolved once, pinned, with provenance per param.

| Layer | Owns | Must not |
|---|---|---|
| Guide / domain author | activity id, effects, `produces`, MUSTs, the default `unit`, routes | hide a hard obligation in prose no guard enforces; declare a numeric param cap (D1) |
| Conductor / skill | which activity or route fits the slice; an optional request with a reason | keep a private route table; hand-copy the guide's pattern when it can omit the selector; send a request without a reason |
| Config (project > global > shipped) | the ceiling key of 7.3; the `minCheckers` and `maxRounds` defaults it already carries | rewrite what a preset promises; cancel a guide MUST or preset invariant |
| Execution Core | the one resolution; the pin; every refusal of 7.4 | import Workflow or read the guide; choose acceptance authority; derive tier from degree |
| Workflow | the pinned guide snapshot and one exported read, `activityUnitOf` (6.2) | decide request validity (it never sees params) |
| Pattern execution / Seat Binding | the loop exactly; seats | add undocumented seats; downshift silently |

Three hands, three scopes (**owner**): the agent changes the degree per slice, the project sets what the agent may choose from, the guide author sets what nobody changes. The shipped guide is the guide file in the fgOS release that every project reads (today `domains/coding/workflows/feature.yaml`).

## 5. The activity `unit` shape: reuse, do not invent

Prior art (**code**): a playbook step already declares `pattern` and `params` inline in its unit template, e.g. `core/workflows/architecture-advisory.yaml:56-70` (`pattern: reviewed`, `params: { minCheckers: [...], roleTasks: {...} }`). `src/workflow/definition.mjs` (around line 370) normalises `template.pattern` (string) and `template.params` (`structuredClone`, not validated). `unitPatternOf` (`src/workflow/unit-handoff.mjs:163`) turns a template into `pattern` or `{ pattern, params }`, "the same shape the Execution Core accepts from a CLI caller", and the run door takes the object as the caller selector (`run.mjs:367`, `callerPattern`). The guide already stores a free `unit` object per activity (`guide-schema.mjs`, activity normalisation: object, `structuredClone`; `rejectExpressionKeys` skips `unit`) and the coding guide already writes `unit: { pattern: reviewed }`.

Decision: an activity's `unit` **is** that template shape, restricted to the two keys the resolver reads: `pattern` (string) and `params` (object). Other keys of a playbook-derived activity (`step`, `units`, `kind: integrate`, `target`) are not collaboration declarations. No new shape, no new schema field, no change to the guide loader beyond (optionally) checking that `unit.pattern` is a string and `unit.params` an object.

`activityUnitOf({ mainRoot, caseId, activity })` (the Workflow-side read, 6.2) returns `{ pattern, params }` from the case's pinned guide snapshot, or `null` when the activity does not exist, has no `unit`, has no string `unit.pattern` (e.g. `{ kind: integrate }`), or belongs to a playbook-derived guide (its `unit` is `{ step, units }`). `null` means "no activity default": the chain falls to `solo`, exactly as today.

Params in an activity `unit` and in step templates stay unvalidated defaults, as today (section 7.4).

## 6. Selection precedence

### 6.1 One chain; the existing four steps keep their order

Today's chain (`chosenPattern`): caller object, then `unit.pattern`, then caller string, then `solo`. Part A inserts one step and changes none. The **baseline** is the result of this chain computed **without** any `--params` request, so a request can never shadow a Unit or step pattern:

1. caller **object** (`{ pattern, params }`: the step door's `unitPatternOf`; a `--params` request is **not** a caller object, see 6.3);
2. `unit.pattern` (Unit file or one-liner-built Unit);
3. caller **string** (`--pattern <name>`);
4. **activity unit** (new; case dispatch only; `activityUnit` non-null);
5. `solo`.

The step-4 insertion only changes calls that today fall to `solo`: a `--case --activity` dispatch with no selector. Every call that carries any selector resolves exactly as today.

"Different selector" is defined, not enforced: two selectors differ when their resolved base `patternName` differs, or, with the same name, their resolved params differ. A difference never refuses in Part A; the chain decides and the pin records the baseline and the request, so a shadowed caller string is visible. (A `selector-conflict` refusal was proposed by the packet and is dropped: it would refuse a caller-string-plus-Unit call that works today. It is not carried into Part B either.)

### 6.2 Where the activity unit comes from

One owner: the composition root. `bin/fgos.mjs` (which already imports `createCaseAdmissionPort` from `src/workflow/case-admission-port.mjs` and builds `caseRef`) calls the Workflow export `activityUnitOf` from the same module when `caseRef` is present and passes the result to `runUnit` as a plain `options.activityUnit` (`{ pattern, params }` or `null`). Execution Core never imports the guide loader (principle 2, `test/architecture.test.mjs`) and the AdmissionPort gains **no** operation, so `assertCaseAdmissionPort` (`run.mjs`), test fakes and any out-of-tree port are untouched. `activityUnit` is chain step 4 (6.1). Playbook cases and standalone runs never call it.

### 6.3 A request on top of the baseline

A request `{ params }` is applied last, to the baseline computed without it (6.1): its params merge **per key** over the baseline's params (7.1). A request carries no pattern of its own and cannot change the pattern. `--pattern <name>` keeps its present meaning and place (chain step 3: a Unit `pattern` still beats it, exactly as without `--params`), so `--pattern X --params ...` resolves the pattern as `--pattern X` alone does today. Changing the pattern remains `--pattern` and is **not** gated in Part A: the packet's rule "a different pattern is a route deviation" would need admission to compare patterns with the activity's unit, a new mechanism this part does not add. Recorded gap, section 15.4 (G1).

### 6.4 What is not a request

Params that arrive through a step template, a Unit file, an activity `unit` or a preset are **declarations**, not requests: no reason is needed and no bound applies to them. Only params supplied through the `--params` door are requests (answers red-team assumptions F4: playbook step params are not requests).

## 7. Params: merge, kinds, bounds, invariants, provenance

### 7.1 Merge, per key (highest first)

request (`--params`) > selector params (caller object / step template) > `unit.seats` (for the `seats` key only) > activity default (when the baseline is the activity unit) > preset default > config default (only `maxRounds`: `runner.patterns.reviewed.maxRounds`) > built-in. Every effective param carries provenance: `request | selector | unit | activity | preset | config | builtin`.

### 7.2 Param kinds (one table per pattern module; the resolver is the only validator)

| Kind | Params today | Merge and bound |
|---|---|---|
| ceiling | `reviewed.maxRounds` | a request above the ceiling key refuses (7.3) |
| additive | `reviewed.minCheckers` | effective = union of the request with rigor-required checkers (`checkersByRigor[effective rigor]`), the capability's `minCheckers` (or its red-team default, section 11) and preset invariants; a request can add, never remove; never a refusal |
| closed-set | `seats` (all patterns that read it) | a request or `unit.seats` that differs from a preset that marks `seats` invariant refuses `preset-invariant-weakened`; otherwise validated as today (`seat-multiplicity`) |
| declaration-only | `roleTasks`, `rebuttal` | settable by a preset, step template, Unit or activity default; a **request** carrying either refuses `param-unknown` (a request must not rewrite a checker's instructions or switch off a debate round); unknown seat ids in `roleTasks` keep today's behaviour for declarations |

**The one request validator.** Requestable params are `maxRounds`, `minCheckers`, `seats`; any other key, including the declaration-only `roleTasks` and `rebuttal`, refuses `param-unknown`. Value domain, checked before any ceiling or invariant: `maxRounds` is an integer >= 1; `minCheckers` is a list of known checker seat names (`CHECKER_SEATS`: `reviewer`, `red-team`, `tester`); `seats` goes through `checkDeclaredSeats` (`seat-resolver.mjs:139`, including the reserved ids of 10.3). A violation refuses `param-request-invalid`. Without this a request such as `maxRounds: 0` makes the `reviewed` loop skip every round and return `pass` with no results (`reviewed.mjs` ~143-158, 376-383), and the config validator that rejects `<= 0` (`config.mjs` ~1538) is not on the request path.

The keys the pattern modules read today are exactly `maxRounds`, `minCheckers`, `roleTasks`, `seats` (reviewed, solo, panel, debate) and `rebuttal` (debate) (**code**: `grep` of `params` reads in `patterns/*.mjs`, `seat-resolver.mjs`).

### 7.3 Ceilings: a separate key per pattern, requests only

New config key `runner.patterns.reviewed.maxRoundsCeiling` (integer >= 1, absent means no ceiling). It sits under the pattern's own config object, so a ceiling for another pattern's numeric param is another key under that pattern (none exists today; `rebuttal` is boolean and `seats` is closed). `maxRounds` keeps its present meaning, a default, and is never overloaded.

- The ceiling bounds **requests only**. A shipped preset, an activity default, a step template or a Unit file value above it is **never clamped or refused**; it runs as declared.
- A request above it refuses `param-out-of-bounds` (7.4).
- Absent key: nothing changes for any project. The key is optional and has no shipped value.

### 7.4 Refusals: one owner, Execution Core, before admission

Resolution runs before admission (`workflow.md` 7.2 step 3: the door resolves the pattern; 5.2: admission runs after the pattern is resolved), so a refused request reserves nothing. No code has two owners; this table is the only place an owner is stated.

| Code | Condition | Worked example |
|---|---|---|
| `param-unknown` | a request key is not a requestable param of the resolved pattern, or is declaration-only | `--params '{"maxRound":1}'`, or `--params '{"roleTasks":{...}}'`, on `reviewed` |
| `param-out-of-bounds` | a request value is above the ceiling key | ceiling 2, `--params '{"maxRounds":3}'` |
| `preset-invariant-weakened` | a request or `unit.seats` replaces a closed-set invariant of a preset | `consult` with `seats: [{seat:'a',role:'producer'},{seat:'b',role:'producer'}]` |
| `param-reason-required` | a request is made on a dispatch that names a case and carries no `--reason` | `--case c --activity x --params '{"maxRounds":1}'` with no `--reason` |
| `param-request-invalid` | `--params` is not a JSON object, or a value is outside its domain (7.2) | `--params 3`; `--params '{"maxRounds":0}'`; `--params '{"minCheckers":["x"]}'` |
| `collaboration-pin-unusable` | a resume finds a pin whose pattern the release no longer registers | resume after a pattern was removed |

Validation (`param-unknown`, value domain, kinds) applies to the **request** only; activity defaults, step templates and preset params keep today's tolerance (so `research-fan-out-gated`'s `gated: true`, which no pattern module reads, is untouched).

A request on a standalone run (no case named) is allowed without a reason: there is no guide or route to justify against; the pin records it. With a case, the reason is the existing `--reason`, which already travels `caseRef.reason` to `proposal.reason` to the `route` event's `reason` (`case-admission.mjs` writes it when present), so no admission change is needed.

### 7.5 Preset invariants (initial table; lives in `patterns/presets.mjs`)

| Preset | Invariant | Tuning |
|---|---|---|
| `code-change`, `rfc` | `minCheckers` includes `reviewer`, `red-team` | `maxRounds`, `roleTasks` |
| `consult`, `research-fan-out`, `research-fan-out-gated` | `seats` composition | none |

A caller list for an additive invariant is unioned, never replaces (fixes the shallow merge of 1.4). Census (**code**): no shipped workflow or domain YAML pairs these presets with `unit.seats`/`params.seats` (`grep` of `pattern: consult|research-fan-out|rfc|code-change` in `core/` and `domains/` finds none), so the `seats` refusal reaches no shipped caller.

## 8. The request door and the caller census

### 8.1 Door: `fgos run ... --params '<json object>'`

Options evaluated:

| Form | Cost to the agent | Verdict |
|---|---|---|
| `fgos run ... --params '{"maxRounds":1}' --reason "<text>"` | one flag, one JSON object; works with prompt-built Units and `--unit` files | **chosen** |
| repeated `--param key=value` | simpler for scalars | rejected: `minCheckers`, `roleTasks`, `seats` need structure; a second parser |
| Unit file with an object-form `pattern` | file authoring for every request | rejected: heavy for the owner's "requests should be easy"; changes the Unit schema read by older hosts |

`--params` is parsed in `bin/fgos.mjs` into `options.request = { params }` and passed beside, never inside, the pattern options: it is not a caller object and does not enter `chosenPattern`. The single resolution (section 9.1) computes the baseline from the existing options without it, then applies the request with section 7's merge and checks. `--pattern` stays a string flag. `--params` is refused beside `--resume` (a resume keeps its pin, as `--case` already is, `bin/fgos.mjs` ~2912-2930). The flag is new, so no existing call can carry it.

### 8.2 Caller census (**code**; every current reader of `--pattern` / Unit `pattern` / the chain)

| Caller | Form today | After Part A |
|---|---|---|
| `fgos run "<prompt>" --pattern <name>`: `fgos-run`, `fgos-cook`, `fgos-advise`, `fgos-group-thinking` skills, `docs/how-to/run-a-coordination-session.md` | caller string (`bin/fgos.mjs:2854`) | unchanged (chain step 3) |
| `fgos run --pattern <preset> --unit <file>` (`fgos-advise`) | caller string + Unit file | unchanged: Unit `pattern` still beats the caller string |
| Unit file / `--units` file `pattern` (`unit.mjs:262-268`, `units-source.mjs:75`) | non-empty string | unchanged: schema untouched |
| Registered workflow steps (`steps.mjs:20`, `unitPatternOf`, `unit-handoff.mjs:163`) | name, or `{ pattern, params }` object | unchanged: object stays chain step 1 |
| Playbook proposer (`src/workflow/runner.mjs`) | explicit step selector through `unitPatternOf` | unchanged; `activityUnit` is never read for it |
| `--case --activity` conductor dispatch **with** `--pattern` | caller string | unchanged |
| `--case --activity` conductor dispatch **without** a selector | falls to `solo` | **changes by design**: runs the activity's `unit.pattern` and defaults when one exists, else still `solo`. May launch more seats than before, and can **newly refuse** a dispatch that worked: `seat-multiplicity` (a Unit declaring solo-shaped `seats` and no `pattern` now inherits `reviewed`, whose declared seats must match its checkers), `seat-launch-ceiling-exceeded` (frame `seatLaunchesPerDispatch`), or a binding refusal at three or four families. The escape is an explicit `--pattern solo`, which still wins (chain step 3) |
| `dry-bind.mjs:67`, `seats.mjs`, `capability-plan-lint.mjs:500` | read `unit.pattern` / template pattern | unchanged |
| legacy declared-operation path (`declaredOperationOf`, `run.mjs`) | solo-only refusal | unchanged |

No object-form break (no schema change) and no change for any call that names a selector. The one call shape that changes is a `--case --activity` dispatch with no selector and an activity that declares a `unit.pattern`: it can hit the new refusals named in its row (`seat-multiplicity`, `seat-launch-ceiling-exceeded`, binding refusals); an explicit `--pattern solo` restores today's behaviour.

## 9. The pin

### 9.1 Record fields

On the existing Unit-run record (`unit.json`), one new additive field; existing fields (`pattern`, `seats`, `seatLaunchCeiling`, `configSnapshot`) are untouched.

```
collaboration: {
  schema: 1,
  requested: null | { params: object, reason: string | null },
  baseline:  { source: 'caller-object' | 'unit' | 'caller-string' | 'activity' | 'solo', selector: <as given> },
  effective: { patternName, params, provenance: { <param>: 'request'|'selector'|'unit'|'activity'|'preset'|'config'|'builtin' } }
}
```

`effective.patternName` is the **base** pattern (`reviewed`, never the preset name) and `effective.params` is fully expanded, so re-resolving it is idempotent and never re-reads `PRESETS` or config. It is written once, on a fresh run, **before** the record is persisted and before admission depends on it (admission already runs after resolution, so the record exists when admission is asked). When a pin is written, **`record.pattern` is written as `effective.patternName`** (the base name), not `options.pattern ?? unit.pattern ?? 'solo'` (`run.mjs:773`), so a reader that does not know the pin (an older release, an unlisted consumer) never sees `solo` for an activity-inherited `reviewed` run.

### 9.2 Consumers (every reader moves to the pin when present)

| Consumer | Today | With a pin |
|---|---|---|
| fresh-run resolution: seat resolution, `seatLaunchesOf`, the `port.admit` proposal (`run.mjs` ~703-724) | `chosenPattern(...)` computed repeatedly | one resolution result reused |
| loop execution (`runPattern`, `run.mjs` ~1473) and the `maxRounds` readers it reaches (`reviewed.mjs:113,144`, `seat-resolver.mjs:262`) | re-expands selector with current presets and config | receives `effective.patternName` and `effective.params`; they already read `params?.maxRounds ?? cfg... ?? 2`, so provenance `builtin`/`config` still resolves through that expression |
| solo settle in `recordInlineRun` (`run.mjs:1513`, ~1581-1590) | `resolvePattern(unitJson.pattern ...)`, settles unconditionally | `effective.patternName`, and settles only when no verify command exists (10.2) |
| resume (`run.mjs:654`, `declaredOperationOf`; and 1438-1441) | recorded unexpanded selector | pin's `effective.patternName` |
| `unit-summary.mjs:72,146` | `record.pattern` | pin when present (summary shows effective params and provenance) |
| `legacy-seat-read.mjs` (pre-seat records) | reads `record.pattern` | untouched |

### 9.3 Resume

- **A record with no `collaboration` field** (every in-flight run at upgrade) behaves **exactly as today**: all consumers fall back to `resolvePattern(record.pattern)`. Nothing is refused, nothing is re-pinned.
- A record with a pin resumes with the pinned effective collaboration regardless of later preset or config edits (config is already pinned by `configSnapshot`).
- A pin naming a pattern the running release does not register refuses `collaboration-pin-unusable`, naming the pattern. A newer record on an older release ignores the unknown `collaboration` field and resumes on `record.pattern`, the base pattern, with that release's default params: requested and activity params are lost on such a resume, which is the risk RT-4 describes. The CHANGELOG line states a minimum release for resuming a pinned run.

## 10. Minimum evidence for a light degree to be real

Only what Part A needs for "light implement" to mean something:

1. **Solo runs a supplied verify once** after a passing producer, **only when `verifyCommandOf(unit, runnerConfig)` returns a command** (Unit `verify`, else the capability's). The `verify` hook in `run.mjs` (~1415) returns `{ pass: true }` when no command exists, so solo must never call it unconditionally (as `reviewed` guards it with its has-verify test): a run with no command writes **no** `verify` result and mints **no** harness-verify receipt, through the same bounded runner `reviewed` uses (`runner.timeoutMs`). The result is a runner-written result entry `{ seat: 'verify', round: 1, outcome, findings }` (as `reviewed.mjs` writes at ~line 302), so the existing receipt path (`receiptsFromResults`) sees a harness verify result. A failed verify returns findings; there is no repair loop. Resume reuses a prior passing verify result for the round (as `reviewed` reuses `priorResults`); a crash before the result is durable is not a verified pass.
2. **Solo does not settle before its verify.** The solo shortcut that settles at producer-result time sits in `recordInlineRun` (`run.mjs:1513`; the settle block ~1581-1590, the door where a conductor records an inline producer result; it has no verify engine). It applies only when `verifyCommandOf(unit, runnerConfig)` is undefined, with the Unit and snapshot config read from `unit.json`; when a command exists it sets `execution: pending`, leaves `settlement` unset, and a resume runs the verify through `runPattern`.
3. **The receipt is tied to the harness having executed the verify, never to a seat id a worker can choose.** `verify` and `verifier` become reserved seat ids: `checkDeclaredSeats` (`seat-resolver.mjs:139`) refuses them in every declaration (`unit.seats` and `params.seats`, one door), so only the runner's own verify checkpoint can produce a result carrying that seat key. `unit.seats` is treated as the `seats` param at provenance `unit` (7.1) and falls under the invariants of 7.2.
4. **Candidate-commit ordering is unchanged** (commit before verify, as `reviewed`); a committed candidate in a linked worktree is reported separately from verified delivery.
5. **Panel and debate are unchanged.** A capability-level `verify` on them is not run and not refused, as today; a Unit-explicit `verify` on them is ignored, as today (`runner.md` Business Rules: "a solo or panel run, which has no verify step, says nothing" is amended only for solo, section 17).

Not claimed: the receipt's digest is still computed at settle from the tested paths exactly as today (`case-admission-port.mjs`); closing that gap is Part B. A case activity whose guide requires a verify receipt, run solo with **no** verify command, still passes without a receipt, as today; preventing that (`verify-command-required`) is Part B. Part A removes the case where a command is supplied and ignored (P6 row 7 as run: `--verify` given, solo, no receipt).

## 11. Red-team: a shipped default in the resolver, tunable by config

- Today `seat-resolver.mjs:116` adds `red-team` for `code` and `code:*` unconditionally. Part A turns it into a **shipped default inside the resolver**: a constant `{ code: [red-team], 'code:*': [red-team] }` used when no capability entry defines `minCheckers`. No project config is written, no standard-config copy is needed, and an existing project with no `minCheckers` behaves identically (this repository's `.fgos/config.json` and the shipped `core/config-standard/runner.yaml` carry none; **code**).
- The existing key is the tuning lever: `runner.capabilities.<cap>.minCheckers` is read **exact key, then `<prefix>:*`**, first defined property wins; when defined (including `[]`) it **replaces** the default; the result is still unioned with rigor-required checkers (`checkersByRigor`) and preset invariants, which a list cannot erase. Lowering the requirement is therefore a visible project edit of an existing key; no new key.
- Behaviour changes, each with a CHANGELOG line: (a) an explicit `minCheckers` on a `code` capability that omits `red-team` no longer gets red-team added; (b) a `<prefix>:*` `minCheckers` now applies to the capabilities under that prefix (today only the exact key is read). The existing doctor check `runner-patterns-config` additionally warns on (a) (informational: "red-team default replaced by this entry"); implementation confirms the check is the right home.
- Cost stated (packet RR10): at standard rigor a coding `reviewed` round launches producer + reviewer + red-team on two families, one more than `checkersByRigor` alone; at high and critical the default adds nothing because `checkersByRigor` already names red-team.
- The `code`-named default is existing behaviour kept, not a new coding policy in the neutral layer; a non-coding capability gets no red-team from it (scenario S12).

## 12. Config, setup and doctor registration

| Gate question | Answer |
|---|---|
| New key | `runner.patterns.reviewed.maxRoundsCeiling`: optional, no shipped value |
| Schema | `core/config-schema/runner.schema.yaml` (under `patterns.reviewed.properties`, integer, minimum 1) |
| Validation | `src/runner/dispatch/config.mjs` (`ALLOWED_REVIEWED_KEYS` gains the key; positive integer) |
| Setup | the key is registered in `core/config-standard/runner.yaml` with an `@fgos:doc` comment saying what it does and why (it bounds `--params` requests only, never shipped presets or defaults; absent means no ceiling); no default value is merged by `config-merge` because there is none. **To confirm at implementation:** how `config-merge` and `fgos config standard` represent an optional key with no default |
| Doctor | existing `runner-patterns-config` (`src/setup/registrations.mjs` ~552-565, check at ~1311) validates it (positive integer, fails otherwise) and warns when the ceiling is below the effective `maxRounds` default (the default still runs; the warning says requests can never reach it). No new check, so `docs/specs/distribution.md` row 77 needs no new name |
| Install level | project > global > shipped through the existing Config owner with provenance; nothing assumes a level |
| CHANGELOG `[Unreleased]` | at implementation, one line each: `fgos run --params`; activity unit inheritance; the ceiling key; solo verify; reserved seat ids; red-team default and the `minCheckers` lookup |
| Retired keys | none in Part A (`mutatingMinRigor` retirement is Part B) |

## 13. Acceptance scenarios

Each is observable and has one owning proof at the lowest layer that can see it; a boundary above gets at most one wiring proof (principle 8). None of these proofs exists yet unless noted. Fixtures include a non-coding domain (capability `business:*` / `docs:*`; a guide fixture local to the test, since the only shipped guide is the coding one).

| # | Scenario | Owning proof | Wiring proof |
|---|---|---|---|
| S1 | A case dispatch with no selector runs the activity's `unit.pattern` and params; the pin shows `baseline.source: 'activity'` and per-param provenance (non-coding guide fixture: a business activity `unit: { pattern: reviewed, params: { maxRounds: 1 } }`) | `test/runner/execution/run-case-admission.test.mjs` | none |
| S2 | `activityUnit` is null for a missing activity, no `unit`, `{ kind: integrate }` and playbook-derived units; the chain then falls to `solo` | `test/workflow/case-admission-port.test.mjs` | none |
| S3 | Existing chain unchanged: caller string + Unit `pattern` gives the Unit's; a caller object beats both; none refuses | `test/runner/execution/run.test.mjs` (extend the existing chain proof) | none |
| S4 | A request inside bounds with a reason: pin shows request, effective value and provenance `request`; the reason is on the `route` event | `test/runner/execution/patterns/presets.test.mjs` (merge and provenance) | `test/runner/execution/run-case-admission.test.mjs` (reason reaches the route event) |
| S5 | A request on a case dispatch with no `--reason` refuses `param-reason-required` before admission; nothing is reserved | `test/runner/execution/run.test.mjs` | none |
| S6 | A request above `maxRoundsCeiling` refuses `param-out-of-bounds`; `maxRounds` of `0`, `1.5`, `"abc"` refuses `param-request-invalid` and never runs an empty loop; a shipped preset or activity default above the ceiling runs unclamped; absent ceiling never refuses | `test/runner/execution/patterns/presets.test.mjs` | none |
| S7 | Unknown request key, and a request carrying `roleTasks` or `rebuttal`, refuses `param-unknown`; a `minCheckers` request naming an unknown checker refuses `param-request-invalid`; a request or `unit.seats` weakening `consult` refuses `preset-invariant-weakened`; an additive `minCheckers` request is unioned, never replaces `rfc`'s | `test/runner/execution/patterns/presets.test.mjs` and `test/runner/execution/seat-resolver.test.mjs` | none |
| S8 | `--params` flag: a non-object refuses `param-request-invalid`; refused beside `--resume`; a standalone request (no case) runs without a reason and is pinned | `test/cli/run-verb.test.mjs` | none (this is the one door proof) |
| S9 | Resume: a pinned run keeps its effective meaning after a preset and config edit; a record with no pin behaves as today; an unregistered pinned pattern refuses `collaboration-pin-unusable` | `test/runner/execution/run.test.mjs` | none |
| S10 | Light implement: solo with a verify command runs it once after a passing producer; pass yields a harness verify result and receipt; fail yields findings and no repair; a crash before the verify result is durable is not a verified pass; the run does not settle before the verify; **no command means no `verify` result and no receipt**; an inline solo record (`recordInlineRun`) with a command ends `execution: pending` with no settlement | `test/runner/execution/patterns/solo.test.mjs` | `test/runner/execution/run.test.mjs` (`recordInlineRun` settle) |
| S11 | Seat ids `verify` and `verifier` are refused in `unit.seats` and `params.seats` for every pattern; a solo Unit declaring such a seat cannot produce a harness-verify receipt | `test/runner/execution/seat-resolver.test.mjs` | none |
| S12 | Red-team default: `code:implement` reviewed includes red-team with no config; a `code:*` `minCheckers: [reviewer]` (prefix) removes it; an exact-key entry wins over the prefix; `[]` clears it; `business:advise` never gets it | `test/runner/execution/seat-resolver.test.mjs` | none |
| S13 | Panel and debate with a capability `verify`: not run, not refused, as today | `test/runner/execution/patterns/panel.test.mjs` (existing, kept) | none |
| S14 | The ceiling key: invalid value fails `runner-patterns-config`; ceiling below `maxRounds` warns; an old config without the key is unaffected | `test/runner/dispatch-config-patterns.test.mjs` | `test/setup/registrations.test.mjs` |
| S15 | Legacy declared-operation Unit: the explicit solo-only refusal is unchanged | existing proof, kept | none |
| S16 | Domain neutrality: the same resolution path serves a non-coding guide fixture with a `consult` activity and a `reviewed` activity, and no coding capability, preset or guide row is involved | `test/runner/execution/run-case-admission.test.mjs` (non-coding fixture) | none |
| S17 | A `--case --activity` dispatch whose Unit declares solo-shaped `seats` and no `pattern`, on an activity with `unit.pattern: reviewed`, refuses `seat-multiplicity` by name; the same call with `--pattern solo` runs as today | `test/runner/execution/run-case-admission.test.mjs` | none |

The runtime verification engineer's live replay of P6 rows 6-7 and the solo-verify crash windows (before verify, after command, before settlement) is owed (owner decision); no scenario claims it was done.

## 14. Red-team disposition (20 findings)

Source files: `reports/red-team-contracts.md` (C-F1..C-F10) and `reports/red-team-assumptions-scope.md` (A-F1..A-F10). "A" resolved in this part; "B" moved to `part-b-evidence-hardening.md`.

| Finding | Severity | Disposition |
|---|---|---|
| C-F1 two guards on one milestone; consent alone makes it eligible | Critical | **B.** Part A adds no second guard and changes no milestone acceptance, so it is not exposed; the per-guard evidence model is Part B scope |
| C-F2 seat-id forgery of harness-verify; `unit.seats` bypasses bounds | Critical | **A.** Reserved seat ids `verify`/`verifier` in the one declaration door (10.3); `unit.seats` is the `seats` param under invariants (7.1, 7.2) |
| C-F3 digest stamped at settle, not at evaluation | High | **B.** Part A states the digest path is unchanged (10, "Not claimed"); restamp fix is Part B |
| C-F4 F8's assessor activity has no milestone; `integrate`, `fix-verify-red` uncovered | High | **B.** No coding-guide change or assessor in Part A. `integrate` is covered here only as `activityUnit` null (5, S2) |
| C-F5 clamp vs refuse; `maxRounds` default and ceiling in one key; consumers unnamed | High | **A.** Separate key `maxRoundsCeiling`; requests refused, shipped defaults never clamped (7.3); the three `maxRounds` readers named (9.2) |
| C-F6 `verify-command-unsupported` breaks capability verify on panel/debate | High | **A.** The refusal is dropped; panel/debate behaviour stays as today (2, 10.5, S13) |
| C-F7 precedence and merge order disagree; selector equality undefined | Medium | **A.** One chain (6.1), one merge order (7.1), "different selector" defined and not enforced (6.1) |
| C-F8 consent writer takes ids, digest and locator from the caller; `gate.park` premise | Medium | **B.** No consent change in Part A. Part B must also reconcile the `runner.mjs` stale-approval re-park path (~448-457) the finding found |
| C-F9 setup-written `minCheckers` conflicts with inheritance; premise unproven | Medium | **A.** No setup write; the default lives in the resolver (11); the shipped config carries no `minCheckers`, so nothing needed merging |
| C-F10 scenarios with two owners or no observable; proposal fields; resume code; S17 layer | Medium | **A.** Part A changes no `port.admit` field (2), so no proposal-shape table is needed; every scenario has one owner (13); the resume refusal is named (`collaboration-pin-unusable`, 7.4); S1's door difference is covered by S3/S8; S17 (assessor independence) is **B** |
| A-F1 evaluator-kind enforcement re-judges existing ledgers | Critical | **B.** Part A changes no fold (2). Part B must version the rule per guide snapshot and list which shipped playbooks rely on receiptless `step.complete` (it was not checked here) |
| A-F2 scope exceeds the request | High | **A and B.** The split itself; Part A is the params mechanism only |
| A-F3 object-form Unit break; `selector-conflict`; no caller census | High | **A.** No Unit schema change; no `selector-conflict` (6.1); caller census (8.2) |
| A-F4 request door unusable; playbook step params; prior art uncited | High | **A.** `--params` flag chosen and justified (8.1); step params are declarations, not requests (6.4); prior art cited and reused (5) |
| A-F5 `maxRounds` as ceiling breaks users; silent clamp | High | **A.** Same as C-F5 |
| A-F6 red-team migration unprovable across levels and machines | High | **A.** Resolver default, no per-project write (11) |
| A-F7 are the spec choices necessary | High | **A.** Re-judged in section 15; SC4, SC6, SC7 and the admission code dropped or moved to B |
| A-F8 domain neutrality overstated; `code-change` preset; S20 unproven | Medium | **A.** The `code` red-team default is kept existing behaviour and stated as such (11); fixtures are non-coding and local to tests because only one shipped guide exists (13, S16); no new coding name or policy is added |
| A-F9 a stranger cannot implement: `activityUnit` edge cases, field shapes, provenance, examples | Medium | **A.** `activityUnit` null cases (5); pin field shape (9.1); provenance enumeration (7.1); a worked example per refusal code (7.4). The independence "provenance" gap belongs to the assessor, **B** |
| A-F10 resume and pin assumptions; consumers unenumerated; refusal code | Medium | **A.** Consumer table (9.2); unpinned records behave as today (9.3); `collaboration-pin-unusable` (7.4). Multi-machine: a newer pin on an older release is an ignored additive field |

### r2 review (`reports/review-part-a-r2.md`): six fixes applied

| Finding | Where fixed | Resolution |
|---|---|---|
| H1 value domain of a request | 7.2 (one request validator), 7.4 (`param-request-invalid`), S6, S7 | `maxRounds` integer >= 1, `minCheckers` limited to `CHECKER_SEATS` names, `seats` through `checkDeclaredSeats`; a violation refuses `param-request-invalid`, so `maxRounds: 0` can no longer yield an empty `pass` |
| H2 `roleTasks` requestable | 7.2 (kind `declaration-only`), 7.4 (`param-unknown`), S7 | `roleTasks` and `rebuttal` are declaration-only; a request carrying either refuses `param-unknown`; requestable params are `maxRounds`, `minCheckers`, `seats` |
| M1 solo settle site and receiptless verify | 9.2, 10.1, 10.2, S10 | the settle site is `recordInlineRun` (`run.mjs:1513`); solo calls verify, and `recordInlineRun` defers settlement, only when `verifyCommandOf` returns a command; no command means no `verify` result and no receipt; S10 covers the no-command and inline cases |
| M2 8.2 closing claim false | 8.2 (row and closing sentence), S17 | the changed call shape is stated to newly refuse (`seat-multiplicity`, `seat-launch-ceiling-exceeded`, binding refusals); escape `--pattern solo`; scenario added |
| M3 `activityUnit` owner stated two ways | 4, 6.2, 5 (name), 13 S2, 16, 17 | one owner: `bin/fgos.mjs` calls the Workflow export `activityUnitOf` and passes a plain `options.activityUnit`; no new port operation; the `workflow.md` 5.2 amendment is removed |
| M4 baseline vs request; `record.pattern` | 6.1, 6.3, 8.1, 9.1, 9.3 | baseline is computed without the request; `--params` is parsed into `options.request`, not a caller object; a request carries no pattern (reading of the reviewer's fix chosen to keep today's "Unit beats caller string" rule for identical flags), so the pin's `requested` is `{ params, reason }`; `record.pattern = effective.patternName` when a pin is written; an older release resuming a pinned record runs the base pattern with default params, stated with a CHANGELOG minimum-release note |

The nine rev.3 findings on the packet (tester F1; reviewer F1-F3; red-team F1-F5), for continuity: tester F1 (RR11/RT-9) is **A** (restated in section 16); reviewer F1 (door and reason) is **A**, resolved by `--params` with the Core owning `param-reason-required` (no admission code); reviewer F2 (owner of the bound refusals) is **A**, Execution Core (7.4); reviewer F3 and red-team F2 ("bounds the guide allow") are **A**, decision D1; red-team F3 (attribution) is **A**, one owner table only (7.4); red-team F1 (consent writer), F4 (F9 labelled approved) and F5 (RT-6, RR6) are **B**.

## 15. Spec choices and the owner question

### 15.1 Decided by the owner (binding, packet `ownerDecisions`, 2026-10-23)

- Missing expertise: only the runtime verification engineer now; the non-coding guide author and the downstream shipped-guide operator review this draft.
- Q1 = (a): light validation is one read-only, out-of-process assessor seat issuing a verdict. Only the option is decided; its design is advice and lives in Part B.
- Degree is chiefly the bounded params of a pattern, declared as defaults on the guide activity; a new name only for a different observable promise; every degree keeps the evidence the milestone guard requires.
- Q2: no overlay of shipped guides; the project tunes bounds and defaults through config (project > global > shipped); the agent chooses activity/route per slice and requests params within bounds with a recorded reason; Execution Core resolves and pins once; guide MUSTs and pattern invariants are not overridable.

### 15.2 Spec choices needing confirmation (decided and reported; one word overturns)

| Id | Choice | Why | Reversal cost |
|---|---|---|---|
| SC-A1 | request door is `--params '<json>'` on `fgos run`, reason is the existing `--reason`, `param-reason-required` is the Core's | lightest for the agent (8.1); no admission change | a flag removal |
| SC-A2 | ceiling is a separate key `runner.patterns.reviewed.maxRoundsCeiling`, requests only | breaks nobody; shipped presets never clamped | key removal |
| SC-A3 | precedence adds the activity unit below the existing chain; no `selector-conflict` | no call that works today breaks | none |
| SC-A4 | validation (`param-unknown`, kinds) applies to requests only | defaults and templates keep today's tolerance (`gated`) | widen later |
| SC-A5 | invariant table (7.5): `minCheckers` unioned, `seats` closed for presets that declare them, `unit.seats` included | stops `rfc` losing red-team and `unit.seats` bypass; no shipped caller affected | table edit |
| SC-A6 | pin = additive `collaboration` field on `unit.json`; unpinned records behave as today | smallest record change; no migration | field removal |
| SC-A7 | reserved seat ids `verify`/`verifier`; solo defers settlement to its verify | closes the forgery for the light path without a new receipt system | none |
| SC-A8 | red-team default in the resolver, replaced by an explicit `minCheckers`; prefix lookup | no setup write; tunable by an existing key | two small behaviour changes (11) |
| SC-A9 | a different pattern than the activity's is recorded in the pin, not gated | gating needs a new admission mechanism | feature idea (G1) |

### 15.3 Decision question D1 (the one remaining owner question)

**What is happening.** The owner's rule says an agent may request params "within the bounds the pattern and the guide allow". The model has pattern bounds (preset invariants) and project bounds (the ceiling key), but a guide activity carries only a default `unit` and its MUST rows. Reviewers found the guide bound has no field.

**Cause.** Checked in `src/workflow/guide-schema.mjs` (activity normalisation: `unit` and `must` only) and `case-admission.mjs` (admission reads MUST rows and routes; nothing about param caps).

**Options.**

- **(a) The guide's bound is its MUST rows; numeric caps live in config or a preset invariant** (this draft). Gain: no new field, no rule language (RUL-WF-25). Harm: a guide author cannot write "never above N rounds" directly. Cost: 0 lines; a cap that is a promise goes in a preset.
- **(b) a guide `bounds` row per activity**, enforced by the Core. Gain: the guide author states a hard cap. Harm: a third place beside config and presets that can disagree; the Core needs a port read of the bound and a precedence rule against the activity default and the ceiling. Cost: guide schema, port read, resolver, doctor, proofs.

**Recommendation.** (a). In Part A the MUST rows are not enforced against params at all (that is Part B), so (a) here means: the text "bounds the guide allows" is removed from normative wording and no guide bound exists until a real guide needs a cap that is not a promise (RT-10).

**Scope of the answer.** A yes confirms (a) for Part A. It decides no other choice in 15.2 and nothing in Part B.

### 15.4 Gaps recorded (not blocking Part A)

| Id | Gap | Where |
|---|---|---|
| G1 | "A different pattern is a route deviation" (owner) is not enforced: `--pattern` can still change the pattern, the pin records the baseline source and the effective pattern, and enforcing needs admission to compare with the activity unit | feature idea; Part B may take it with the admission work |
| G2 | a case activity whose guide requires a verify receipt, run solo with no command, still passes receiptless | Part B (`verify-command-required`) |

## 16. Dissent kept (packet `unresolvedDissent`; none averaged into agreement)

| Topic | Positions | State |
|---|---|---|
| What light validation is | framing and system: one verdict assessor; constraint: `reviewed` one round one checker; alternative: `consult` | owner chose (a); dissent kept; design in Part B |
| Vocabulary owner: activity id vs preset name | activity id carries intent, presets carry degree vs conductor proposes a platform promise vs one activity plus `allowedPatterns` | recommendation, not consensus |
| Coding red-team requirement | constraint: delete the hardcode now; others: preserve it | preserved as a resolver default (11) |
| `review-light` / `debate-light` | constraint: add; others: a name that only packages params is not a degree | not added |
| Where inheritance runs | constraint: in `run.mjs`; others: composition root through the port | composition root passes a plain option, no port operation (6.2) |
| Is the no-overlay limit acceptable under RUL104 | synthesis: yes; critique: not shown | owner decided; watched by RT-5 |
| Degree through params vs names | owner: params first; constraint: names | owner decided |
| Admission strength, consent subject | contribution-scoped admission; `plan.md` vs decisions artifact | **Part B** |

Residual risks and reversal triggers kept for Part A:

| Id | Risk or trigger | Mitigation or action |
|---|---|---|
| RR1 | rigor read as global assurance | a high-rigor solo is still solo |
| RR3 | a conductor overuses a light solo route | the guide's default activity stays `reviewed`; a different pattern is recorded (G1) |
| RR4 | pinned expansion diverges from loop code | `collaboration-pin-unusable`; S9 |
| RR10 | the kept red-team default costs one more checker launch per standard coding `reviewed` round | tunable through `minCheckers`; RT-8 |
| RR11 | at high or critical rigor a coding `reviewed` round needs three or four distinct families. A round halts only when the fallback walk, which re-binds under current independence, finds no eligible replacement; an outage alone does not halt it while a permitted healthy candidate remains. This cost exists with or without the default | named failure, never a silent downshift |
| RR12 | a conductor launch grows because an activity unit is now inherited (was `solo`) | frame `seatLaunchesPerDispatch` refuses before spend; stated in 8.2 |
| RT-3 | conductor logs show solo on multi-file slices, or the deviation allowance is spent on ordinary calls | tighten routes; revisit |
| RT-4 | a resumed run changes rounds, seats or subject after a preset or config edit | the pin is not authoritative for some consumer; fix that consumer |
| RT-5 | a downstream project forks a shipped guide only to change one activity's unit | record as evidence; reopening no-overlay is an owner question |
| RT-8 | at standard rigor conductors route around `implement-item`, or projects lower the default, because of the second checker | lower `code`/`code:*` `minCheckers`; touches nothing else |
| RT-9 | high- or critical-rigor coding rounds halt often enough that serious cases stall | restore the missing eligible family first; widen `fallbackPerSeat` only when attempts, not eligible supply, are exhausted (it multiplies the launch ceiling and creates no family); change capability rigor only when no Unit rigor or case `rigorFloor` states a stronger one (effective rigor is the stronger; `rigor-below-floor` refuses lower); a running case is never reconfigured; never weaken independence silently |
| RT-10 | a real guide needs a param cap that is not a promise | reopen D1 option (b) |

## 17. Amendments to area specs (Part A only)

When approved, merge with a minted D-ADR (`fgos identity mint d-adr` at merge; none is minted here). Generated renders (`.claude/skills`, `plugins/fgOS/skills`, `.agents/skills`) are rebuilt with `npm run build:skills`, never hand-edited. The COOK route-table text (`core/skills/fgos-cook/references/route-table-pending.md`, `case-and-doors.md`) is corrected in the implementing change, not by this draft.

| Spec, section | Current text amended | Change |
|---|---|---|
| `docs/specs/workflow.md` 5.2, AdmissionPort bullet | "port có ba phép hoặc tương đương: phân giải binding của worktree đích, admit một đề xuất, settle một reservation;" | not amended: the port keeps three operations and the `admit` proposal is unchanged (6.2) |
| `docs/specs/workflow.md` 7.2 step 3 | "**Cửa**: giải pattern; phân giải ngữ cảnh authority qua port (RUL-WF-11); từ chối nếu không hợp lệ." | the door inherits the activity unit when no selector is given, applies a `--params` request, validates it, pins the result |
| `docs/specs/workflow.md` 2.2, add terms | - | request, effective collaboration (section 3) |
| `docs/specs/workflow.md` 6, add rule | - | RUL-WF-29: degree through params; the chain of 6.1 and merge of 7.1; numbers assigned at merge |
| `docs/specs/runner.md`, Business Rules "a Unit carries its own verify and skills..." (~line 1146) | "A reviewed run with no verify command still passes on its checkers but its result carries `verify: { ran: false, reason }`; a solo or panel run, which has no verify step, says nothing." | `solo` runs a supplied verify once (10); panel is unchanged |
| `docs/specs/runner.md`, `fgos run` one-liner flags (RUL88 area, ~line 1115) | "`--persona`, `--writes` (needs a linked worktree; omitted = read-only), `--capability` (default `execute`), `--rigor`, `--effort`, `--override`" (the flag list; `--pattern` is not among them) | add `--params` and the pin (9) |
| `docs/specs/runner.md`, "Hợp đồng rigor và tier" | "chỉ quyết số checker của một unit `reviewed` và mức độ độc lập giữa các ghế, **không** quyết tier" | unchanged in meaning; add that the code red-team requirement is a resolver default replaced by a capability's `minCheckers` (11) |
| `docs/specs/seat-binding.md` 2 vocabulary and 7.1 | "ghế checker mỗi tên từ `checkersByRigor[effectiveRigor]` ∪ `minCheckers` (và `red-team` cho capability `code:*`)" (within line 214) | red-team is the default `minCheckers` of `code`/`code:*`, replaced by an explicit entry (exact, then prefix); add that seat ids `verify` and `verifier` are reserved |
| decision history | - | the D-ADR for the owner's 2026-10-23 decisions as applied by Part A |

Not amended by Part A: `docs/specs/distribution.md` (no new doctor check name), `docs/platform-foundations.md` L1-L10 (no law changes; L10 holds: the door, the step handoff, conductor skills and renders move in one cutover and the hand-copy workaround leaves in the same change), the guide schema, `feature.yaml`, RUL-WF-7, RUL-WF-14, RUL-WF-19 (all Part B).
