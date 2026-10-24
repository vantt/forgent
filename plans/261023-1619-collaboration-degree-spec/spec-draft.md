# Spec draft, Part A: patterns declared in config, params tuned per unit

Status: draft for owner approval. Nothing here is implemented; no area spec changes until the owner approves it and section 18 is merged.
Date: 2026-10-24. Code facts verified at main `4065cbd68` and re-checked at `be939a764` where the second panel cites it.
Language: area specs are Vietnamese; quoted current sentences stay verbatim, all other text is English.

History of this draft: Part A of a split decided under RUL104 (milestone evidence hardening is Part B, `part-b-evidence-hardening.md`); revised after two red-team reviews and one review r2 (`reports/`); revised again on 2026-10-24 after the owner found the params too rigid and asked for config-declared, maximally flexible patterns with easy dispatch-time params, and after a second panel (`wf-run-1792756301921-5ca8b9bb`, final packet `.fgos/assignments/unit-run-1792758630825-12eb2f56/producer/2/runs/01/outbox/report-1.md` and `result-1.json`; explanation `unit-run-1792760475393-fb16f44c/producer/1`). The first advisory packet is `unit-run-1792741678364-45ec2060/producer/2` (rev.3).

Evidence classes: **owner** (decided, binding), **council** (a position in a packet, advice, not approved), **code** (verified), **spec choice** (decided here, needs confirmation, section 16).

## 1. Problem and evidence

The owner's requirement: light and serious applications of a pattern must stay distinguishable; the mechanism is the degree of applying a pattern; each layer states intent and degree; everything configurable; dispatch-time params easy; the fix is not aimed at the single case `reviewed`. What fails today (**code**):

1. A workflow activity's declared unit never reaches the door: `chosenPattern` (`src/runner/execution/run.mjs:366`) never sees the workflow, so a `--case --activity` dispatch with no selector runs `solo` although `feature.yaml:145` says `unit: { pattern: reviewed }` (P6 notebook row 7; `core/skills/fgos-cook/references/route-table-pending.md` tells the conductor to copy the pattern by hand).
2. Named presets are a code constant (`PRESETS`, `patterns/presets.mjs`): a project cannot declare one, and a project that wants a lighter `reviewed` has no way to say so.
3. Solo ignores a supplied verify, and settles as soon as the producer result is recorded (`recordInlineRun`, `run.mjs:1513`, settle block ~1581-1590).
4. A result whose seat id matches `/^verif(y|ier)$/` counts as the harness's verify (`legacy-seat-read.mjs` `isVerifyResult`; `receiptsFromResults`, `case-projection.mjs:240`); solo accepts any declared seat id (`seat-resolver.mjs:198-201`); `unit.seats` silently beats `params.seats` (`seat-resolver.mjs:159-162`).
5. `resolvePattern` shallow-merges caller params over preset params; `run.mjs` stores the unexpanded selector (773, 1438-1441), so a resume re-expands with whatever code and config are now.
6. Param keys are unvalidated on every carrier (an unknown key is ignored; `gated: true` on `research-fan-out-gated` is written at `presets.mjs:38` and `legacy-seat-read.mjs:55` and read by no loop).
7. The coding red-team requirement is a branch in code (`seat-resolver.mjs:116`); capability `minCheckers` is read from the exact key only (`:113`); `maxRounds` is only a default (`reviewed.mjs:113,144`, `seat-resolver.mjs:262`).
8. A request has no door and no recorded reason.

P6 evidence (**council**; `plans/reports/measure-261022-1758-cook-p6-pane-launch.md`): `implement-item` ran solo with `--verify`, passed, left `receipts: []`; `child-verified` never reached in an 11-dispatch, 4.5-hour case. No controlled comparison exists; no speed figure is claimed.

## 2. Glossary (owner decision, D-ADR0073; used in the whole spec)

| Term | Meaning | Today's name in code |
|---|---|---|
| **workflow** | the versioned definition file; a **playbook** is a workflow whose points are all listed-routes-only (`steps`/`units`); a **conductor-driven workflow** has `activities` with a `unit` (e.g. `coding/feature`) | workflow (`guide-schema.mjs`), Workflow definition |
| **case** | one instance (run-through) of a workflow, with its own ledger, milestones, frame, consent, worktree binding and close; units dispatched into a case pass its admission | case, `wf-run-` id, `.fgos/workflow-runs/` |
| **unit** | one piece of work handed to the run door, inside a case or standalone | Unit, `unit-run-` id (`unitRunId`) |
| **pattern** | a named choice = loop + default params + invariants + one-sentence `promise`; declared in config layered project > global > shipped. Every loop has a shipped pattern of the same name with plain defaults, so `--pattern reviewed` keeps working | "preset" (`code-change`, `consult`, `rfc`, `research-fan-out`); `PRESETS` |
| **loop** | one of the four engines held in code: `solo`, `reviewed`, `panel`, `debate` | CollaborationPattern, dir `src/runner/execution/patterns/` |
| **params** | the tuning of one pattern for one unit | `params` |
| **seat** | a role in a pattern | seat |
| **run** | one execution of one seat (the noun means only that) | `runs/NN`; the Run Supervisor calls it "attempt" |
| **Workflow** | names only the component (`src/workflow`) | unchanged |
| activity unit / step unit | the same shape in both: `unit: { pattern, params }` | step template `pattern` + `params`; activity `unit` |
| request | `--params` / `--param` values for one dispatch | - |
| baseline | the selector the precedence chain picks without any request | - |
| pin | the effective collaboration stored on the unit record | `unit.json` |

Commands stay: `fgos run` (the verb: runs a unit, which has one or more runs) and `fgos workflow start|status|answer|resume|close` (`start` opens a case of the named workflow; the others act on a case). Physical renames of ids and directories (`wf-run-` to `case-`, `.fgos/workflow-runs/` to `.fgos/cases/`, `unit-run-` to `unit-`, the Run Supervisor's "attempt" to "run") are **not** in Part A: they belong to backlog item `wf-physical-rename`.

"Light means fewer people or a different topology, never a weaker receipt than the milestone guard" (**owner**).

## 3. Scope, non-goals, rename boundary

In scope: patterns as a config catalog over four code-held loops; the activity/step `unit` shape; one precedence chain; two-way replaceable params over unioned floors; validation of every carrier; bounds; the run-time door; the pin; solo verify with a harness receipt; red-team default tunable; the physical rename (section 13) with config conversion, doctor and CHANGELOG.

Not in Part A (Part B or settled): ledger folds, evaluator-kind enforcement, consent payload, freshness, new guard primitive, assessor seat, coding-workflow restructure, **any new Workflow admission code** (the workflow-MUST and frame floors are a named dependency, 8.3); a fifth loop, `extends` between patterns, expressions or JS in config, a "who may set" ACL, `--without`/`--set`, comma lists, a project/global Workflow loader (separate item), a new evaluator; project overlay of a shipped workflow (**owner**); renaming the `fgos workflow` verb, `wf-run` ids and the `workflow-runs` directory (these join the existing backlog item `wf-physical-rename`, `docs/backlog.md`).

## 4. The three messages and who owns each

1. **Activity obligation** (workflow): the default `unit: { pattern, params }`, effects, `produces`, MUSTs.
2. **Requested collaboration** (agent): activity or route, optionally `--pattern`, `--params`, `--param`, with a reason.
3. **Effective collaboration** (Execution Core): resolved once, pinned, with provenance.

| Layer | Owns | Must not |
|---|---|---|
| Workflow / domain author | activity/step `unit`, `produces`, MUSTs, routes | hide a hard obligation in unenforced prose; declare a numeric param cap (forbidden by D1 (a): a workflow's bound is its MUST rows) |
| Conductor / skill | which activity fits; an optional request with a reason | keep a private route table; hand-copy the workflow's pattern; send a request without a reason |
| Config (project > global > shipped, Rust Config owns parse, merge, comments, provenance) | the pattern catalog; loop tuning and `bounds`; capability `minCheckers` | change a shipped name's loop or weaken its invariants; cancel a floor |
| Execution Core | validity of every carrier; the one resolution; the floors it can compute (loop domain, pattern invariants, `checkersByRigor`, capability policy); the pin; every refusal of 8.5 | import Workflow or read the workflow; choose acceptance authority; derive tier from degree |
| Workflow admission | the floors that need the workflow or frame (workflow MUSTs, `rigor-below-floor`, `seat-launch-ceiling-exceeded`), judged on the proposal the Core hands to `admit()` | recompute a different collaboration; receive params (it never sees a request) |
| Loops + Seat Binding | the loop exactly; seats | add undocumented seats; downshift silently |

Three hands, three scopes (**owner**): the agent changes the degree per slice; the project sets what the agent may choose from; the workflow author sets what nobody changes.

## 5. The pattern catalog in config

### 5.1 Entry shape

Declared at `runner.patterns.<name>`; flat properties, `additionalProperties: false` on each entry (the Config schema walker follows only `properties`, `additionalProperties`, `items`, `$ref`: `packages/config/rust/src/schema.rs` ~298-351). One entry:

```yaml
runner.patterns.<name>:
  promise: <one sentence; required for a new name>
  loop: solo | reviewed | panel | debate          # required for a new name
  defaults:                                        # only params the loop reads (8.1)
    maxRounds: 1                                   # integer >= 1
    minCheckers: [reviewer, red-team]              # CHECKER_SEATS names
    seats: [{ seat, role, persona?, tier? }]       # the checkDeclaredSeats entry shape
    roleTasks: { <seat or kind>: <text> }          # keyed as role-tasks.mjs keys it
    rebuttal: true
  invariants:                                      # per param, exactly one form
    <param>: { atLeast: [...] }                    # list params (minCheckers): the effective value must include these
    <param>: { fixed: <value> }                    # scalars and structures (seats, roleTasks, rebuttal): the effective value must equal this
```

Tighten and weaken, defined per form: for `atLeast`, a layer **tightens** by listing a superset and **weakens** by dropping any element; for `fixed`, a layer may **add** a `fixed` on a param that had none (tighten) and must not change or remove one (weaken). The pin's `digest` is the sha256 of the canonical JSON (`canonicalJson`) of the merged entry.

### 5.2 Merge: Config's existing semantics, no entry-level replace

`docs/platform/config/spec.md` (~139-140): a map merges per entry (`x-fgos-merge: deep`); `replace` applies only to a whole section. Part A adds no per-entry replace. Lists, including `seats`, are leaf values and replace as one value; `defaults`, `invariants` and `roleTasks` merge per key.

| Case | Rule |
|---|---|
| a layer's entry for a **shipped** name | merges deep into the shipped entry. `promise` and `loop` are inherited: an override entry need not carry them and must not change them (a different `loop` or `promise` refuses `pattern-invariant-weakened`). The resolver then checks the merged `invariants` against the shipped ones: no `atLeast` element dropped, no `fixed` changed or removed |
| a **custom** name (project over global) | merges deep per key; the merged result must carry `promise` and `loop`; the resolver rejects any key of `defaults` or `invariants` the final `loop` does not read (`param-unknown`), so a stray key from a global entry of another loop never survives |
| invariants | a layer may add invariants and extend `atLeast` lists; shrinking or changing is weakening |

### 5.3 Reserved names and the retired shape

`seatBinding` (the Seat Binding schema marker, 13.2) and `defaultRule` (retired) are reserved: not usable as pattern names. `reviewed` is both a shipped pattern name and the old key of the loop-tuning object: an object at `runner.patterns.reviewed` that holds `maxRounds` or `checkersByRigor` and no `loop`/`defaults` **is the retired tuning shape** (refused in a config file with `config-key-retired`, 13.2); an entry holding both shapes is a config error.

### 5.4 Shipped catalog and what stays in code

Shipped (in `core/config-standard/runner.yaml`, `@fgos:doc` comments, no live code constant, L10): `solo`, `reviewed`, `panel`, `debate` with plain defaults (shipped `panel` and `debate` carry no seat defaults: they still need seats from the Unit or a request, as today), and `code-change`, `consult`, `rfc`, `research-fan-out`. `research-fan-out-gated` is **retired**: its `gated` flag changes no launch or behaviour. Invariants are the minimal promise, not the whole roster:

| Pattern | Loop | Invariants | Defaults (replaceable) |
|---|---|---|---|
| `code-change`, `rfc` | reviewed | `minCheckers: { atLeast: [reviewer, red-team] }` | `maxRounds`, `roleTasks` (`rfc`: 1 round, document tasks) |
| `consult` | solo | `seats: { fixed: [{ seat: advisor, role: producer }] }` | - |
| `research-fan-out` | panel | `seats` keeps one synthesizer (a loop cardinality rule, not an invariant) | three researcher seats |

Setup never seeds the shipped catalog into a project (files hold only differences). Stays in code: the four loops, their order, replay, postures, independence, verdict authority, custody, admission, `seatLaunchesOf`, the verify checkpoint. A verify command is never in a pattern. Config cannot mint a role with verdict or writer posture, an evaluator, a shell hook or a fifth algorithm (the engine that let config define topology was retired on purpose, commit `2180b4e72`).

## 6. The activity and step `unit` shape: reuse

Prior art (**code**): a playbook step declares `pattern` and `params` inline, e.g. `core/workflows/architecture-advisory.yaml:56-70`; `src/workflow/definition.mjs` (~370) normalises them; `unitPatternOf` (`src/workflow/unit-handoff.mjs:163`) emits `pattern` or `{ pattern, params }`, "the same shape the Execution Core accepts from a CLI caller" (`run.mjs:367`); the workflow already stores a free `unit` object per activity (`guide-schema.mjs` activity normalisation) and `feature.yaml:145` writes `unit: { pattern: reviewed }`. Decision: activities and steps declare the **same** `unit: { pattern, params }`, where `pattern` is a catalog name. Other keys of a playbook-derived activity (`step`, `units`, `kind: integrate`, `target`) are not collaboration declarations. No new shape, no schema field.

`activityUnitOf({ mainRoot, caseId, activity })`, a Workflow export in `src/workflow/case-admission-port.mjs`, returns `{ pattern, params }` from the case's pinned workflow snapshot, or `null` when the activity is missing, has no `unit`, has no string `unit.pattern` (`{ kind: integrate }`) or is playbook-derived (`{ step, units }`). One owner: `bin/fgos.mjs` (which already builds `caseRef` and imports `createCaseAdmissionPort`) calls it when `caseRef` is present and passes a plain `options.activityUnit`. The AdmissionPort gains no operation. Execution Core never imports the workflow loader (principle 2, `test/architecture.test.mjs`).

## 7. Selection precedence

### 7.1 One chain

1. caller **object** (`{ pattern, params }`: the step door's `unitPatternOf`);
2. `unit.pattern` (Unit file or one-liner-built Unit);
3. caller **string** (`--pattern <name>`);
4. **activity unit** (new; case dispatch only; `activityUnit` non-null);
5. the shipped pattern `solo`.

The step-4 insertion changes only calls that today fall to `solo`. The **baseline** is the chain computed without any request; a request never shadows a Unit or step pattern and carries no pattern of its own.

**Explicit swap in a case.** When a case dispatch's explicit selector (steps 1-3) names a pattern different from a non-null `activityUnit.pattern`: `--reason` is required (`request-reason-required`; outside a case no reason is needed); the pin records it (`requested.pattern`, `baseline.source`); and the **activity pattern's invariants are floors on the effective result**: `atLeast` lists are unioned in, a `fixed` param must equal, and a loop that does not read an invariant's param refuses `pattern-invariant-weakened` naming the activity pattern. A swap therefore cannot weaken what the activity's pattern locked. Plain `reviewed` locks nothing, so `--pattern solo` on an activity declaring `reviewed` stays an allowed, reasoned, recorded choice. Gating a swap as a route deviation is not in Part A (B9); until B6/B9 the owner rule "never a weaker receipt than the milestone guard" is **not enforced by Part A** for such a swap or for a solo unit with no verify command (stated, RR-P6).

### 7.2 `selector-conflict` (Q-C, council default; owner decision 3)

When two **explicit** selectors (steps 1-3) name different patterns, the dispatch refuses `selector-conflict` before admission, reserving nothing. "Different" means different catalog names after resolving each; the same name is not a conflict; a single explicit selector never conflicts with the inherited activity unit (explicit beats it). Today the Unit silently wins over a caller string; the census (9.2) proves no shipped caller passes two different names, and the refusal replaces a silent shadow with a visible one. Timing argument: the proposal is built inside `run` after `chosenPattern` and before any seat runs (`run.mjs:700-733`), so the check belongs before admission (council position, parent `:75`; the critique reviewer's R5 was a citation fix and is not counted as a vote).

## 8. Params

### 8.1 Validity, on every carrier (Execution Core, per loop)

The loop's **param table** (one per loop, in the loop module; `--param` types from it):

| Param | Loop(s) | Type and domain | Requestable |
|---|---|---|---|
| `maxRounds` | reviewed | integer >= 1 | yes (`--param` or `--params`) |
| `minCheckers` | reviewed | list of `CHECKER_SEATS` names (`reviewer`, `red-team`, `tester`) | yes (`--params`) |
| `seats` | all | list through `checkDeclaredSeats` (`seat-resolver.mjs:139`), reserved ids refused | yes (`--params`) |
| `rebuttal` | debate | boolean | yes (`--param` or `--params`), unless locked by an invariant |
| `roleTasks` | reviewed, panel, debate | map seat-or-kind to text | **no**: declaration-only |

An **unknown key refuses `param-unknown` on every carrier**: request, Unit, step template, activity unit and config pattern. A value outside its domain refuses `param-invalid`. `roleTasks` is declarable in a pattern, template, Unit or activity unit and a request carrying it refuses `param-not-requestable` (instruction prose must not be rewritable by the requesting agent; it is not a security boundary, since the same actor can author a template, and it never mints a receipt or cancels a MUST). Today `maxRounds: 0` would skip every round and return `pass` with no results (`reviewed.mjs` ~143-158, 376-383): the domain check closes that.

Codes moved into `param-invalid` (every thrower): `unknown-checker-seat` (`seat-resolver.mjs:118`, `checkerSeatsOf`; the code is retired, tests that assert it move); the new reserved-seat-id refusal in `checkDeclaredSeats` (~148); a non-scalar or malformed `--param` (9.1). The existing seat-shape codes of `checkDeclaredSeats` (`invalid-seats`, `invalid-seat-id`, `duplicate-seat`, `invalid-seat-role`, `invalid-seat-tier`) keep their names: they say a seat entry is malformed, a different case.

### 8.2 Replaceable defaults (one normalisation, per key; the more specific value **replaces**, it does not union)

request > selector params (caller object / step template) > `unit.seats` (the `seats` key only) > activity default (**only** when the baseline selector is the activity unit; an activity's params for pattern A never apply to an explicit pattern B) > pattern default (catalog, layered) > loop config default (`runner.loops.<loop>`, 8.4) > built-in. Defaults are not floors, which is what makes "lighter" expressible. Capability `minCheckers` is **not** in this chain: it is a floor (8.3). Every later reader (seat resolver, `seatLaunchesOf`, the proposal, the pin) consumes the normalised winner; raw `unit.seats` is not re-read.

### 8.3 Floors, conjoined, never last-writer-wins

- **Execution Core** unions what it can compute from the Unit and the config snapshot: the loop's domain and cardinality; the chosen pattern's invariants (and, on an explicit swap in a case, the activity pattern's, 7.1); `checkersByRigor[effective rigor]`; and the capability's `minCheckers` (exact key, then `<prefix>:*`, or the `code` default, section 12). A `minCheckers` **request adds, never removes**: a request below any of these floors, including a pattern invariant or a capability `minCheckers`, is a **minimum** (Q-B): the floors are unioned on top and the result shows, per checker, the contribution that keeps it (`rigor:<level>`, `pattern-invariant:<name>`, `capability:<key>`, `code:default-red-team`, `request`). It is never reported as lighter when the roster did not shrink, and it is not a refusal. A smaller roster comes from replacing a pattern **default** or, in config, a capability's `minCheckers` (which replaces another config layer's value for that capability, project > global, but never lowers `checkersByRigor` or an invariant).
- **Which code for a bad roster.** If the violated requirement is a named pattern invariant and the roster was set by a caller (`unit.seats`, a request `seats`, a step or activity default) against it: `pattern-invariant-weakened`. If no invariant is named, e.g. a reviewed roster missing a role the loop itself requires (`seat-resolver.mjs:205-223`, "exactly"): `seat-multiplicity` (existing). Heavier on reviewed goes through `minCheckers`, not `seats`; the exact match is not retired.
- **Workflow admission** owns the floors that need the workflow or frame: `rigor-below-floor` and `seat-launch-ceiling-exceeded` (existing, `case-admission.mjs` ~209-236, computed from the proposal's `rigor` and `seatLaunches`, which the Core derives from the effective params, so a heavy request beyond the frame already refuses there). The workflow-MUST checks and the proposal fields they need are Part B's dependency (B6, B9). Part A adds no admission code and no proposal field; the Core never reads the workflow.

### 8.4 Loop tuning and bounds (Q-A = (b), owner decision 4)

`runner.loops.<loop>` holds the tuning of one loop (today `runner.patterns.reviewed`: `maxRounds`, `checkersByRigor`) and gains **one generic bounds shape**: `runner.loops.<loop>.bounds.<param>: { min?, max? }` (numeric params; Part A ships `maxRounds` as the only one).

- **Application:** checked against the **effective value after merge**, and only when that value's carrier is the request: a request outside refuses `param-out-of-bounds`. A pattern default, activity default, step template or Unit value that wins is not clamped or refused and runs as declared (doctor warns).
- **Config validation errors** (load time, doctor; not run refusals): `min > max`; a non-integer bound on an integer param; a bound on a param the loop does not read.
- `maxRounds` stays a default; it is not overloaded as a ceiling and `maxRoundsCeiling` does not exist. Absent `bounds`, nothing changes for any project.
- Honesty on the decision: the second panel's default was (a), budget only, with no seat citing a real project; the owner chose (b), which also serves the restated Q2 (`ownerDecisions` in the first packet names `runner.patterns.reviewed.maxRounds` as the lever). The council's earlier "maxRounds is a ceiling" described behaviour the code does not have. Registration: 13.3.

### 8.5 Refusals: one code per case, all Execution Core, before admission

| Code | Case | Example |
|---|---|---|
| `param-unknown` | key unknown to the loop, any carrier | `maxRound` in a step template |
| `param-invalid` | value outside its domain: bad `maxRounds`, unknown checker name, reserved seat id, non-scalar or malformed `--param` | `maxRounds: 0`; `minCheckers: ["x"]`; seat `verify`; `--param minCheckers=reviewer` |
| `param-not-requestable` | a request carries `roleTasks` | `--params '{"roleTasks":{...}}'` |
| `param-out-of-bounds` | a request outside `bounds`, after merge | `bounds.maxRounds.max: 2`, `--param maxRounds=3` |
| `pattern-invariant-weakened` | a layer, caller roster or swap changes a locked invariant (rule in 8.3), or a layer changes a shipped name's `loop`/`promise`; names the source. A `minCheckers` request below an invariant is **not** this case: it is unioned | project sets `rfc` without `red-team`; `unit.seats` for `code-change` lacking `red-team` |
| `seat-multiplicity` (existing) | a roster violating the loop's own cardinality, no invariant named | reviewed roster missing a required checker role |
| `param-request-conflict` | the same key given twice: through `--params` and `--param`, or a repeated `--param` key | `--param maxRounds=1 --param maxRounds=2` |
| `request-reason-required` | a request, or an explicit selector differing from the activity's pattern (7.1), on a dispatch that names a case, with no `--reason` | `--case c --activity x --param maxRounds=1` |
| `selector-conflict` | two explicit selectors name different patterns | `--pattern rfc` with `unit.pattern: reviewed` |
| `unknown-pattern` (existing) | the name is not in the catalog | `research-fan-out-gated` after retirement |
| `verify-command-unsupported` | a Unit-explicit `verify` (Unit file or `--verify`) on a loop with no verify checkpoint (`panel`, `debate`); a capability-level `verify` is not refused: the unit reports `verify: { ran: false, reason }` as today | `--pattern panel --verify "npm test"` |
| `config-key-retired` | a config file (project or global) holds a retired key: the loop-tuning shape at `runner.patterns.reviewed`, or an old loop or pattern name; the message names the file and the replacement key (13.2). Not raised for stored records, which are read through the record-read path (section 10) | `runner.patterns.reviewed.maxRounds` in the project file |
| `collaboration-pin-unusable` | a resume finds a pin that cannot be read or names an unregistered pattern or loop | resume after a pattern was removed |

Mapping from the council's earlier names: its `param-out-of-bounds` is the bounds case only; the floor cases are `seat-multiplicity` and `pattern-invariant-weakened`; `param-below-floor` is **dropped**; `param-request-invalid` became `param-invalid`; `param-reason-required` became `request-reason-required` (it now also covers a swap); `preset-invariant-weakened` became `pattern-invariant-weakened`. A request on a standalone unit needs no reason; with a case the reason is the existing `--reason`, which already travels `caseRef.reason` to `proposal.reason` to the `route` event (`case-admission.mjs`).

## 9. The request door and the caller census

### 9.1 Door, least typing first

1. **No flag**: `--case --activity` inherits the activity unit.
2. `--pattern <name>`: any catalog name, shipped or project-declared.
3. `--params '<json object>'`: any param, lists, `seats`; the form for agents.
4. `--param key=value`, repeatable, scalars only (`maxRounds`, `rebuttal`), typed by the loop's schema. Prior art: `fgos lock fence <name> [--param k=v]` (`bin/fgos.mjs` ~4354), an existing idiom on another verb. No comma lists.

Forms 3 and 4 are collected in `bin/fgos.mjs` into one `options.request` (never a caller object, never in `chosenPattern`); the Core types the scalars once the baseline loop is known. **`--param` parsing:** split on the first `=`; the key must be a param the loop reads (else `param-unknown`); the value is typed by the param's declared type in the loop's param table (8.1): `maxRounds` a decimal integer literal, `rebuttal` exactly `true` or `false`; an empty value, a missing `=`, a list-, map- or seats-typed key, `1.5` or `abc` refuse `param-invalid`; values are not trimmed or coerced. A **repeated** `--param` key refuses `param-request-conflict` (not last-wins), and so does the same key through `--params` and `--param`; argv order never decides. `--reason` is required with a case (`request-reason-required`). Resume takes no new params (`--params`/`--param` beside `--resume` is refused, as `--case` already is, `bin/fgos.mjs` ~2912-2930). No new verb. Discovery uses existing read doors: `fgos config standard|show|explain`, and the effective roster and planned launches through `fgos dispatch decide` or dry-bind. Rejected: a per-degree pattern name (`rfc:light`), a `pattern(a=1)` mini-language, an object-form `pattern` in the Unit file (schema read by older hosts), `--without`/`--set`.

### 9.2 Caller census (**code**)

| Caller | Today | After Part A |
|---|---|---|
| `fgos run "<prompt>" --pattern <name>` (skills `fgos-run`, `fgos-cook`, `fgos-advise`, `fgos-group-thinking`; `docs/how-to/run-a-coordination-session.md`) | caller string (`bin/fgos.mjs:2854`) | unchanged for every shipped name; `research-fan-out-gated` no longer exists (the skill text names none: checked) |
| `fgos run --pattern <name> --unit <file>` (`fgos-advise`) | Unit's `pattern` beats the caller string | unchanged when the file has no `pattern` or the same name; `selector-conflict` if it names another. No shipped `--unit` file exists to differ (checked) |
| Unit and `--units` file `pattern` (`unit.mjs:262-268`, `units-source.mjs:75`) | non-empty string | unchanged; the name must be in the catalog |
| Registered steps (`steps.mjs:20`, `unit-handoff.mjs:163`) | name or `{ pattern, params }` | unchanged; `unit.pattern` and the object carry one template name (no conflict). Every shipped `params:` in `core/workflows` and `domains` uses only `minCheckers` and `roleTasks` (checked), so `param-unknown` reaches none |
| Playbook proposer | explicit step selector | unchanged; `activityUnitOf` never read |
| `--case --activity` with a selector | explicit | unchanged |
| `--case --activity` **without** a selector | falls to `solo` | **changes by design**: runs the activity's `unit`; may launch more seats and can newly refuse (`seat-multiplicity` for a Unit with solo-shaped `seats`, `seat-launch-ceiling-exceeded`, a binding refusal at three or four families). The escape is an explicit `--pattern solo` |
| `dry-bind.mjs:67`, `seats.mjs`, `capability-plan-lint.mjs` (`KNOWN_PATTERNS` :58, :500), `definition.mjs` (:344, :383 literal `'reviewed'`) | read the name | move to the catalog and the resolved loop (L10, section 13) |
| legacy declared-operation path (`declaredOperationOf`) | solo-only refusal | unchanged |

## 10. The pin and resume

On the unit record, one new field, written once on a fresh unit **before** admission depends on it:

```
collaboration: {
  requested: null | { pattern: string|null, params: object, reason: string|null },   // pattern: an explicit swap in a case (7.1)
  baseline:  { source: 'caller-object'|'unit'|'caller-string'|'activity'|'solo', selector: <as given> },
  pattern:   { name, layer: 'project'|'global'|'shipped', digest },   // definition digest
  effective: { loop, params, seats, postures, roleTasks, launchBound },
  provenance: {
    params:   { <param>: 'request'|'selector'|'unit'|'activity'|'pattern-default'|'pattern-invariant'|'capability'|'config'|'builtin' },
    checkers: { <seat>: 'rigor:<level>'|'pattern-invariant:<name>'|'capability:<key>'|'code:default-red-team'|'request' }
  }
}
```

`unitRecord.seatSchema` is written **2** when a pin is present (it writes 1 today, `run.mjs:768`), so a schema-1 host refuses the record by the existing fence (`run.mjs:211-224`, 620-622; proof `test/runner/execution/run.test.mjs:731-738`) instead of resuming on defaults. The "older release runs the defaults" path is **deleted**. `record.pattern` is written as the chosen pattern's name for display; no semantic reader uses it once a pin exists.

| Consumer | With a pin |
|---|---|
| fresh-run resolution: seats, `seatLaunchesOf`, the `port.admit` proposal (`run.mjs` ~703-724) | one resolution result reused |
| loop execution and the `maxRounds` readers (`reviewed.mjs:113,144`, `seat-resolver.mjs:262`) | receive `effective.loop` and `effective.params` (already fully expanded; no re-expansion) |
| solo settle in `recordInlineRun` (`run.mjs:1513`, ~1581-1590) | `effective.loop`; settles only when no verify command exists (11) |
| resume (`run.mjs:654` `declaredOperationOf`; 1438-1441) | the pin only |
| `unit-summary.mjs:72,146` | pin: shows effective params and both provenance dimensions |
| `legacy-seat-read.mjs` (pre-seat records) | untouched |

Resume: a record with **no** `collaboration` field (every in-flight unit at upgrade, schema 1) still resumes, but through the single record-read path for stored history, not through live config: its config snapshot's `patterns.reviewed.*` is read as loop tuning by that path, and its stored selector goes through the historical decoder (`legacy-seat-read.mjs`) to a catalog name (`consult`, `rfc`, `code-change`, `research-fan-out` keep their names; `research-fan-out-gated` maps to `research-fan-out`, its `gated` key was never read). This is reading what a record stored, not accepting old keys in live config: a live config file holding an old key is refused (`config-key-retired`, 13.2). A pinned record resumes on the pin regardless of later catalog or config edits (the config snapshot already pins runner config). An unreadable pin, or one naming an unregistered pattern or loop, refuses `collaboration-pin-unusable`. Resume takes no new params.

## 11. Minimum evidence for a light degree to be real

1. **Solo runs a supplied verify once** after a passing producer, **only when `verifyCommandOf(unit, runnerConfig)` returns a command** (Unit `verify`, else the exact capability's). The run-level `verify` hook returns `{ pass: true }` when no command exists (`run.mjs` ~1415), so solo never calls it unconditionally: a unit with no command writes **no** `verify` result and mints **no** harness-verify receipt. The result is `{ seat: 'verify', round: 1, outcome, findings }` as `reviewed` writes (~302), through the same bounded runner (`runner.timeoutMs`); a failed verify returns findings with no repair loop; resume reuses a prior passing result; a crash before the result is durable is not a verified pass.
2. **Solo does not settle before its verify.** `recordInlineRun` applies the same `verifyCommandOf` test with the Unit and snapshot config read from `unit.json`; with a command it sets `execution: pending`, leaves `settlement` unset, and a resume runs the verify through the loop.
3. **The receipt is tied to the harness having executed the verify, never to a seat id a worker can choose.** `verify` and `verifier` are reserved seat ids: `checkDeclaredSeats` refuses them in every declaration (`unit.seats`, `params.seats`, a config pattern's seats), so only the runner's verify checkpoint can produce a result with that seat key; `unit.seats` is the `seats` param at its slot in 8.2 and falls under the invariants.
4. Candidate-commit ordering is unchanged (commit before verify); a committed candidate in a linked worktree is reported separately from verified delivery.
5. Panel and debate: capability-level `verify` behaves as today (not run, not refused); a Unit-explicit `verify` refuses `verify-command-unsupported` (8.5).

Not claimed: the receipt's digest is still computed at settle from the tested paths as today (Part B, B3). A case activity whose workflow requires a verify receipt, run as a solo unit with **no** command, still passes without a receipt; preventing it is Part B (B6).

## 12. Red-team: a shipped default in the resolver, tunable by config

Today `seat-resolver.mjs:116` adds `red-team` for `code` and `code:*` unconditionally. Part A makes it a **shipped default in the resolver** (`{ code: [red-team], 'code:*': [red-team] }`) used when no capability entry defines `minCheckers`; no setup write and no standard-config copy (no shipped or project config carries `minCheckers` today: checked). `runner.capabilities.<cap>.minCheckers` is a **floor**, read **exact key, then `<prefix>:*`**, first defined wins; when defined (including `[]`) it replaces the `code` default (and another config layer's value, project > global); the result is still unioned with `checkersByRigor` and pattern invariants, which a list cannot erase, and a request can add to it but never remove from it (8.3). Two behaviour changes, each with a CHANGELOG line: an explicit `minCheckers` that omits `red-team` no longer gets it added; a `<prefix>:*` entry now applies under that prefix. Doctor warns (information) on the first. Cost (council): at standard rigor a coding `reviewed` round launches producer + reviewer + red-team on two families, one more than `checkersByRigor` alone; at high and critical the default adds nothing. Not reopened (Q-D). The provenance table of 10 classifies each checker contribution (`checkersByRigor` floor; capability policy; the code default; pattern invariant; request minimum), so "lighter" is auditable.

## 13. Physical rename (owner decision 2: one L10 step, done with Part A's implementation)

### 13.1 What moves

| From | To |
|---|---|
| `src/runner/execution/patterns/{solo,reviewed,panel,debate,index,role-tasks}.mjs` (loops) | `src/runner/execution/loops/` |
| `patterns/presets.mjs`: `PRESETS`, `resolvePattern` | `patterns/` keeps only the catalog loader and validator (proposed names: `catalog.mjs`, `resolveCollaboration`); `PRESETS` is deleted (no live constant); the shipped data is `core/config-standard/runner.yaml` |
| `patternName` meaning a loop | `loop` |
| config `runner.patterns.reviewed` holding `maxRounds`/`checkersByRigor` (loop tuning) | `runner.loops.reviewed` |
| config `runner.patterns.<name>` | the catalog (section 5) |
| config `runner.patterns.defaultRule` | dropped (dead key, no runtime consumer); Part A owns it, B10 no longer lists it |
| config `runner.patterns.seatBinding` marker (`config.mjs:290-300, 1488-1505`; `registrations.mjs:281`) | **stays**, a reserved name, `schema: 2` (13.2) |
| test dirs `test/runner/execution/patterns/*` | follow the move (`loops/`, catalog test) |

Consumers to move in the same change (L10; nothing keeps the old path): `patterns/index.mjs`, `seat-resolver.mjs`, `run.mjs`, `unit-summary.mjs`, `dry-bind.mjs`, `legacy-seat-read.mjs` (the historical decoder keeps reading stored schema-1 records; it is not a second live catalog and never reads live config), `capability-plan-lint.mjs`, `workflow/definition.mjs`, `seats.mjs`, `bin/fgos.mjs` help, `docs/architecture-manifest.json`, `packages/git/contracts/mutation-census.v1.json` (lists paths), `test/architecture.test.mjs` guards, the skills and renders (`npm run build:skills`), `docs/how-to/use-fgos-group-thinking.md`, area specs (section 18). Not in this step: the `fgos workflow` verb, `wf-run` ids, the `workflow-runs` directory: they join backlog item `wf-physical-rename`.

### 13.2 Fence, upgrade and conversion

1. **The fence (decided).** The marker stays at `runner.patterns.seatBinding`, a reserved name, and its `schema` is bumped to **2**. Older releases read schema 1 only (`config.mjs:1505`) and keep a strict `runner.patterns` allowlist (`:1488-1495`: "a release that does not know this key refuses the whole file"), so an older release **refuses a converted file** (schema 2, or catalog entries under `runner.patterns`) instead of binding seats on defaults. The new release also accepts schema 1.
2. **Old keys in a config file are refused, never translated (SEAT lead, board 2026-10-24 15:12).** An old key in a project or global config file (the retired loop-tuning shape at `runner.patterns.reviewed` (5.3), which belongs at `runner.loops.reviewed`; `defaultRule`; old loop and pattern names) is refused with `config-key-retired`, naming the file and the replacement key. The loader has no path that silently drops or translates an old key, and fgOS keeps no alias. Marker schema 1 is still accepted (item 1). Precedent: the refusal of a retired `rigorToTier` in the global config instead of dropping it in memory (commit `478f351ff`; `dropRetiredGlobalKeys`, the older drop-in-memory path, was removed). `fgos doctor` reports the same refusal as a failing check (13.3) and `fgos setup` converts the project file (item 3), so the way out of the refusal is one command. **Limit:** the refusal applies to config files only; stored schema-1 case and unit records stay readable through the single record-read path (section 10), so resume does not break.
3. **Conversion.** `fgos setup` converts the project file with a backup, writes the marker as schema 2, and writes a comment on each key it writes saying what it does and why (config comments are documentation). The shipped standard file (`core/config-standard/runner.yaml`, which today carries `patterns.defaultRule/reviewed/seatBinding`) is converted in the same change.
4. **Global file.** `fgos setup` does **not** rewrite the global file (older installed releases read it with the strict allowlist). An old key in it is fixed per machine by a one-minute command announced on the board at landing, as was done for `rigorToTier`; until then the new release refuses the file with `config-key-retired`. Catalog entries or `runner.loops` written by hand into the global file are warned by doctor while an older release exists, because that release refuses the file.
5. **Running records.** Unpinned schema-1 records resume through the record-read path for stored history, not through live config (section 10). Reversal condition (SEAT): a running case can only resume while the config still holds the old names.

### 13.3 Registration (install/setup/doctor gate)

| Question | Answer |
|---|---|
| New keys | `runner.loops.<loop>.bounds.<param>: { min?, max? }` (optional, no shipped value); `runner.patterns.<name>` entries (shipped ones in the standard file) |
| Schema | `core/config-schema/runner.schema.yaml`: `loops` (tuning + `bounds`) and `patterns` (the entry of 5.1, `additionalProperties: false`); no `default` keyword, shipped values live in `core/config-standard/runner.yaml` with `@fgos:doc` comments saying what each key does and why |
| Validation | `src/runner/dispatch/config.mjs` replaces `ALLOWED_PATTERNS_KEYS`; one semantic resolver is reused by run, dry-bind, doctor, plan lint and workflow validation: known loop, params the loop reads, invariants not weakened (5.2), reserved names, retired shape, seat ids and cardinality, `roleTasks` targets, bounds validity (8.4) |
| Setup | the conversion of 13.2; never seeds the shipped catalog; `--fix` never loosens a floor or rewrites a promise. **To confirm:** how `config-merge` represents an optional key with no default |
| Doctor | existing `runner-patterns-config` (id kept) validates catalog and loops through the same resolver, read-only, never spawns a seat or runs verify; reports each retired key in a config file as a failing check (`config-key-retired`) naming the file and the replacement key; warns on a default beyond a bound, on global catalog entries while an older release exists, and (information) on an explicit capability `minCheckers` that omits `red-team`; hints (never refuses) on two patterns with the same loop, params and invariants and different names. No new check name, so `docs/specs/distribution.md` row 77 is unchanged |
| Install level | project > global > shipped via the existing Config owner; nothing assumes a level |
| CHANGELOG `[Unreleased]` | one line each: pattern catalog and `runner.loops`; `--params` and `--param`; activity unit inheritance; `selector-conflict` and the swap reason; bounds; solo verify; reserved seat ids; red-team default and the `minCheckers` lookup; `verify-command-unsupported`; retired `research-fan-out-gated`, `defaultRule`, `unknown-checker-seat`; the marker schema 2 and the refusal of retired config keys with `config-key-retired` |

## 14. Acceptance scenarios

One owning proof per scenario at the lowest layer that can see it; at most one wiring proof above (principle 8). None exists yet unless noted. Fixtures include a non-coding domain (capability `business:*`/`docs:*`; a workflow fixture local to the test, since the only shipped workflow is the coding one).

| # | Scenario | Owning proof | Wiring |
|---|---|---|---|
| S1 | A `--case --activity` dispatch with no selector runs the activity's `unit`; the pin shows `baseline.source: 'activity'` and provenance (non-coding workflow fixture) | `test/runner/execution/run-case-admission.test.mjs` | none |
| S2 | `activityUnitOf` is null for a missing activity, no `unit`, `{ kind: integrate }`, playbook-derived units; the chain falls to `solo` | `test/workflow/case-admission-port.test.mjs` | none |
| S3 | Two explicit selectors naming different patterns refuse `selector-conflict` before admission, reserving nothing; the same name, or one explicit selector, runs | `test/runner/execution/run.test.mjs` | none |
| S4 | A project-declared non-coding pattern (config only, no JS change) runs through resolver and dry-bind; shipped `reviewed` with plain defaults still works for `--pattern reviewed` | `test/runner/execution/patterns/catalog.test.mjs` | `test/setup/seat-binding-dry-bind.test.mjs` (existing, extended) |
| S5 | Layering: a project override of a shipped name merges per key and need not carry `promise`/`loop`; a project adds a name, replaces a shipped default, tightens an invariant; dropping an `atLeast` element, changing a `fixed`, or changing a shipped name's `loop` refuses `pattern-invariant-weakened` with its source; `research-fan-out-gated` is `unknown-pattern`; a reserved name used as a pattern name is a config error; an entry with both the retired and the catalog shape is a config error | `test/runner/execution/patterns/catalog.test.mjs` | none |
| S6 | Two-way defaults: a pattern default of `maxRounds: 1` replaces the loop default, a request raises it to 3 inside bounds; an explicit pattern B beside an activity declaring A does not inherit A's params; competing `unit.seats` and request `seats` resolve to one declared winner | `test/runner/execution/patterns/catalog.test.mjs` | none |
| S7 | Floors: a `minCheckers` request below the `checkersByRigor`, capability or invariant floor is unioned and the result lists the keeping contribution per checker (never "lighter"); `unit.seats` for `code-change` lacking `red-team` refuses `pattern-invariant-weakened`; a reviewed roster missing a loop-required role (no invariant) refuses `seat-multiplicity` | `test/runner/execution/seat-resolver.test.mjs` | none |
| S8 | Validity: unknown key refuses `param-unknown` on a request, Unit, step template, activity unit and config pattern; `maxRounds: 0`/`1.5`/`"abc"` refuses `param-invalid` and never runs an empty loop; `roleTasks` in a request refuses `param-not-requestable` | `test/runner/execution/patterns/catalog.test.mjs` | none |
| S9 | Bounds: a request outside `bounds.maxRounds` refuses `param-out-of-bounds`; a shipped pattern or activity default outside the bounds runs unclamped; absent bounds never refuse; doctor warns on a default beyond a bound | `test/runner/execution/patterns/catalog.test.mjs` | `test/runner/dispatch-config-patterns.test.mjs` (schema) |
| S10 | Door: `--param` and `--params` normalise to one request; `--param` splits on the first `=`, types by the param table, and refuses an empty value, `1.5`, `abc` and a list-typed key with `param-invalid`; a repeated key, or the same key through both forms, refuses `param-request-conflict`; a request in a case with no `--reason` refuses `request-reason-required`; both flags refused beside `--resume`; a standalone request runs without a reason | `test/cli/run-verb.test.mjs` | `test/runner/execution/run-case-admission.test.mjs` (reason reaches the `route` event) |
| S11 | Pin and resume: a pinned unit keeps its effective meaning after a catalog and config edit; an unreadable pin refuses `collaboration-pin-unusable`; a schema-1 host refuses a schema-2 record; an unpinned schema-1 record resumes through the record-read path for stored history (snapshot `patterns.reviewed.*` as loop tuning; a stored `research-fan-out-gated` runs as `research-fan-out`) | `test/runner/execution/run.test.mjs` (extend the existing fence proof) | none |
| S12 | Light implement: solo with a verify command runs it once after a passing producer; pass gives a harness verify result and receipt; fail gives findings and no repair; a crash before the result is durable is not a verified pass; **no command means no `verify` result and no receipt**; an inline solo record with a command ends `execution: pending` | `test/runner/execution/patterns/solo.test.mjs` (moves to `loops/`) | `test/runner/execution/run.test.mjs` (`recordInlineRun`) |
| S13 | Seat ids `verify` and `verifier` are refused in `unit.seats`, `params.seats` and config pattern seats; a solo Unit declaring one cannot produce a harness-verify receipt | `test/runner/execution/seat-resolver.test.mjs` | none |
| S14 | Red-team default: `code:implement` reviewed includes red-team with no config; a `code:*` `minCheckers: [reviewer]` (prefix) replaces the default; an exact-key entry wins over the prefix; `[]` clears the default; a request below the capability `minCheckers` is unioned, never removing red-team; `business:advise` never gets it | `test/runner/execution/seat-resolver.test.mjs` | none |
| S15 | Verify on panel/debate: a capability-level `verify` is not run and not refused; a Unit-explicit `verify` refuses `verify-command-unsupported` | `test/runner/execution/run.test.mjs` | none |
| S16 | Heavy request: a request whose effective params exceed the frame's `seatLaunchesPerDispatch` refuses `seat-launch-ceiling-exceeded` at admission on effective params | `test/workflow/case-admission.test.mjs` (existing code) | `test/runner/execution/run-case-admission.test.mjs` |
| S17 | A `--case --activity` Unit with solo-shaped `seats` and no `pattern`, on an activity declaring `reviewed`, refuses `seat-multiplicity`; with `--pattern solo` and a `--reason` it runs as today and the pin records the swap; the same swap without `--reason` refuses `request-reason-required` | `test/runner/execution/run-case-admission.test.mjs` | none |
| S18 | Config upgrade: the new release refuses an unconverted project or global file with `config-key-retired`, naming the file and the replacement key, and doctor reports it as a failing check; setup converts the project file with backup, comments and marker schema 2; the per-machine command fixes the global file (setup does not rewrite it); the shipped standard file is converted; an older release refuses a schema-2 file; a schema-1 record still resumes through the record-read path | `test/setup/registrations.test.mjs` | `test/runner/dispatch-config-patterns.test.mjs` |
| S19 | Rename complete (L10): no live `PRESETS` constant, no `patternName` meaning a loop, manifest and census paths moved, architecture guards green on the new directories | `test/architecture.test.mjs` | none |
| S20 | Legacy declared-operation Unit: the explicit solo-only refusal is unchanged | existing proof, kept | none |
| S21 | Explicit swap in a case: `--pattern solo` against an activity declaring `code-change` (invariant `minCheckers atLeast [reviewer, red-team]`) refuses `pattern-invariant-weakened` naming the activity pattern, because solo does not read `minCheckers`; `--pattern rfc` against it runs with the activity pattern's invariants unioned | `test/runner/execution/patterns/catalog.test.mjs` | none |

The runtime verification engineer's live replay (P6 rows 6-7, solo-verify crash windows) is owed; no scenario claims it was done.

## 15. Red-team and review disposition

**First panel, 20 findings** (`reports/red-team-contracts.md` C-F1..10, `reports/red-team-assumptions-scope.md` A-F1..10). A = resolved in Part A; B = moved to Part B. Entries marked * were reshaped by the second panel.

| Finding | Disposition |
|---|---|
| C-F1 two guards, one milestone; A-F1 evaluator-kind enforcement re-judges ledgers; A-F2 scope | **B** (the split); Part A changes no fold |
| C-F2 seat-id forgery, `unit.seats` bypass | **A** 11.3, 8.2 (reserved ids; `unit.seats` a slotted param) |
| C-F3 digest at settle; C-F4 assessor/milestone; C-F8 consent writer | **B** (B3, B7/B8, B4) |
| C-F5, A-F5 `maxRounds` default and ceiling* | **A** 8.4: `maxRounds` stays a default; bounds are a separate generic shape under the loop; requests refused, declarations never clamped |
| C-F6 `verify-command-unsupported` breaks capability verify* | **A** 8.5, 11.5: refused only for a Unit-explicit verify; capability-level verify unchanged |
| C-F7 precedence vs merge; selector equality* | **A** 7, 8.2: one chain, one merge; "different" = different catalog names, refused only when both are explicit (Q-C) |
| C-F9, A-F6 red-team migration | **A** 12: resolver default, no setup write |
| C-F10 scenarios, proposal fields, resume code | **A** 14, 8.3 (proposal fields are Part B's dependency), 8.5 |
| A-F3 caller census, object-form break | **A** 9.2; no Unit schema change |
| A-F4 request door, prior art | **A** 9.1, 6 |
| A-F7 necessity of spec choices | **A** 16 re-judged |
| A-F8 domain neutrality | **A** 14 fixtures; the `code` default is existing behaviour (12) |
| A-F9 stranger-implementable | **A** 6, 10, 8.5 examples |
| A-F10 pin consumers, resume code* | **A** 10 (seatSchema 2, fail-closed; the older-release path deleted) |

**Review r2** (H1, H2, M1-M4): H1 value domain, now `param-invalid` on every carrier (8.1); H2 `roleTasks` not requestable, `param-not-requestable` (8.1); M1 solo settle site and no-command case (11, S12); M2 8.2 wording, kept in the census row (9.2, S17); M3 `activityUnit` one owner (6); M4 baseline without request, `record.pattern` (7.1, 10).

**Second panel (`wf-run-1792756301921-5ca8b9bb`), five open findings on its final packet**, applied as its explanation section 6 says:

| Finding | Where fixed |
|---|---|
| red-team F1: three codes for one roster case | one code per case; `seat-multiplicity` kept for a wrong roster; `param-below-floor` dropped; mapping from `param-out-of-bounds` stated (8.3, 8.5) |
| red-team F2: proposal field list incomplete; `verify-command-unsupported` missing | full field list including verify command presence stated as Part B's dependency (8.3); `verify-command-unsupported` added for the run door (8.5, 11.5) |
| red-team F3: Q-A cited only `:50`, not `:794`; downstream operator missing | 8.4 cites the owner decision and states the council default was budget-only; expertise list names the downstream operator (17) |
| red-team F4: R5 counted as a Q-C vote | dropped from the votes (7.2, 17) |
| tester F3: Part B checks directed into Part A, called existing | `verify-command-required`, `verdict-seat-required` and the proposal fields stay Part B (B6, B9); Part A adds no admission code and no proposal field; `rigor-below-floor` and `seat-launch-ceiling-exceeded` are the only admission codes Part A relies on (existing) |

**Review r3** (`reports/review-part-a-r3.md`; lead decisions in the owner's frame):

| Finding | Where fixed |
|---|---|
| H1 the `seatBinding` move defeats the older-release fence | marker stays at `runner.patterns.seatBinding`, reserved, `schema: 2`; older releases refuse a converted file; SC-R3 dropped (13.2, 5.3) |
| H2 upgrade path for project files and running cases | old keys in a config file refused with `config-key-retired` (project converted by setup, global by a per-machine command); standard file converted in the same change; unpinned schema-1 records resume through the record-read path incl. `research-fan-out-gated` (13.2, 10, S11, S18) |
| H3 no concrete invariant or entry schema; merge semantics | entry schema, `atLeast`/`fixed`, tighten/weaken, override entries inherit `promise`/`loop`, Config's per-entry deep merge with no entry-level replace, reserved names and the retired `patterns.reviewed` shape (5.1-5.3) |
| H4 capability `minCheckers`: default in 8.2, floor in 8.3 | a floor, unioned; requests add and are shown; removed from the replaceable chain; 8.2, 8.3, 12, S7, S14 agree |
| H5 two codes for one case, ownerless cases | one code per case; roster rule (`pattern-invariant-weakened` if a named invariant was violated by a caller roster, else `seat-multiplicity`); `minCheckers` below an invariant is unioned; reserved ids, non-scalar `--param` and `unknown-checker-seat` retire into `param-invalid` with the thrower list (8.1, 8.5) |
| H6 explicit `--pattern` swap defeats the activity pattern | `--reason` required in a case (`request-reason-required`), recorded in the pin, activity pattern's invariants unioned as floors; the remaining gap stated (7.1, RR-P6, S17, S21) |
| M1 `--param` parsing and bounds application | 9.1 parsing rules (first `=`, typed by the param table, empty/repeated refused); 8.4 application after merge, request carrier only, config validation errors |
| M2 global catalog entries and older releases | doctor warns while an older release exists (13.2, 13.3) |
| Part B: `defaultRule` duplicate owner, stale B3 text; vocabulary; 8.3 field list | B10 and B3 edited in Part B; Part A owns `defaultRule`; `<preset>` and "workflow presets" fixed; 8.3 keeps one pointer to B6/B9 |

The second panel's other elements are adopted as owner decision 3: catalog over four loops, replaceable defaults in both directions over unioned floors, validation of every carrier, the JSON-plus-scalar door, the extended pin.

## 16. Spec choices and the owner decisions

### 16.1 Decided by the owner (binding)

2026-10-23 (first packet `ownerDecisions`): missing expertise; Q1 = (a) assessor (design is advice, Part B); degree is chiefly params with a new name only for a different promise; Q2 no overlay, project tunes bounds and defaults via config, agent requests with a reason, Core resolves and pins once, MUSTs and invariants not overridable. 2026-10-24: (1) the vocabulary of section 2; (2) the physical rename in Part A (section 13); (3) the second packet's model; (4) Q-A = (b) bounds shape, Q-B and Q-C as the packet defaults; (5) the five findings fixed; (6) Part B unchanged but for the B6/B9 line.

### 16.2 Spec choices needing confirmation (decided and reported; one word overturns)

| Id | Choice | Why |
|---|---|---|
| SC-R1 | `PRESETS` deleted; proposed identifiers `catalog.mjs`, `resolveCollaboration`, dir `loops/` | implements the owner's vocabulary; names changeable at planning |
| SC-R2 | codes renamed for the vocabulary: `param-invalid` (every carrier), `pattern-invariant-weakened`, `request-reason-required` | one code family |
| SC-R3 | the `seatBinding` marker stays at `runner.patterns.seatBinding`, reserved, `schema: 2` (lead decision; replaces the earlier move to `runner.seatBinding`) | keeps the older-release fence |
| SC-R4 | an old key in a config file (project or global) is refused with `config-key-retired`, naming the file and the replacement key; `fgos setup` converts the project file; a per-machine command fixes the global file; stored schema-1 records stay readable through the record-read path | the loader has no silent drop or translation and keeps no alias; SEAT board 2026-10-24 15:12, precedent `478f351ff`; reversal (SEAT): a running case can only resume while the config still holds the old names |
| SC-R5 | `verify-command-unsupported` only for a Unit-explicit verify | keeps capability-level verify as today |
| SC-R6 | `selector-conflict` replaces today's silent "Unit wins" when both selectors are explicit and differ | Q-C |
| SC-R7 | `roleTasks` declaration-only (`param-not-requestable`); `rebuttal` requestable unless locked | r2 H2 and council |
| SC-R8 | pins carry pattern name, layer and definition digest; `seatSchema: 2` | fail-closed resume |
| SC-R9 | no entry-level replace; override entries merge deep and inherit `promise`/`loop` | Config's existing semantics |
| SC-R10 | capability `minCheckers` is a floor; requests add and are shown | Q-B, H4 |
| SC-R11 | an explicit selector differing from the activity's pattern needs `--reason` in a case and carries the activity pattern's invariants | H6; gating as a deviation stays B9 |
| SC-R12 | `--param` is typed by the loop's param table; repeated key refuses | M1 |

### 16.3 Decision question D1 (settled by the owner, option (a))

**What is happening.** The owner's rule says an agent may request params "within the bounds the pattern and the workflow allow". The model now has pattern invariants and config `bounds`, but a workflow activity carries only a default `unit` and its MUST rows; reviewers found the workflow bound has no field. **Cause.** Checked in `guide-schema.mjs` (activity: `unit` and `must` only) and `case-admission.mjs` (MUST rows and routes, no param caps). **Options.** (a) the workflow's bound is its MUST rows (enforced by Part B's admission checks); numeric caps live in config `bounds` or a pattern invariant. Gain: no new field, no rule language (RUL-WF-25); harm: a workflow author cannot write "never above N rounds"; cost: 0. (b) a workflow `bounds` row per activity: gain, the workflow states a cap; harm, a fourth place beside config bounds, invariants and defaults that can disagree, and the Core would need a port read; cost, schema, port read, resolver, doctor, proofs. **Recommendation.** (a); the wording "the workflow allows" leaves normative text; reverse if a real workflow needs a cap that is not a promise (RT-10). **Scope of the answer.** A yes confirms (a) for Part A only; it decides no choice in 16.2 and nothing in Part B.

**Owner answer: (a), 2026-10-24 16:26** ("d1 dong y"). A workflow's bound on params is only its MUST rows; workflows declare no numeric param cap. Reversal condition: a workflow needs a cap that is not a promise, which reopens D1 as (b) (RT-10).

## 17. Dissent, risks, expertise

| Topic | Positions | State |
|---|---|---|
| Q-A bound for the heavy side | config bound per loop (framing, system, constraint, critique producer) vs budget only (alternative, synthesis) | owner chose (b) |
| Q-B `minCheckers` below floor | union and display (framing, system, critique producer) vs refuse (constraint, synthesis) | council default kept: minimum, union, display |
| Q-C selector conflict | refuse before admission (council `:75`, timing argument) vs before dispatch (critique producer) vs drop (draft SC-A3); R5 is a citation fix, not a vote | refuse before admission, only when both explicit |
| Q-D coding red-team | keep as capability policy (majority) vs drop (constraint) | not reopened |
| `review-light`/`debate-light`, `allowedPatterns` | constraint: add | not added; a new name needs a different promise (config now makes a name cheap, the promise sentence is required) |
| Light validation | assessor vs `reviewed` one round vs `consult` | owner chose (a); design Part B |
| No overlay | synthesis: acceptable; critique: not shown | owner decided; RT-5 |

| Id | Risk or trigger | Mitigation or action |
|---|---|---|
| RR-P1 | outside a case a request can ask for many rounds when no `bounds` is set | `bounds` exists now; display and pin |
| RR-P2 | the union-minimum display is ignored and an agent believes it made the slice lighter | display of the keeping contribution is mandatory in result and preview; RT-P5 |
| RR-P3 | a catalog or `runner.loops` key in the global file breaks older activated releases (they refuse the file, which is the fence) | doctor warns while one is installed; setup leaves the global file (13.2); RT-P4 |
| RR-P4 | Config door not wired at implementation tempts a JS merger | catalog waits for the Config door; no second semantics |
| RR-P5 | `selector-conflict` refuses a caller | census 9.2; RT-P6 |
| RR-P6 | Part A read as proving milestone safety: it does not enforce the guard for a solo unit with no verify command or for an explicit swap to a lighter loop (the swap is reasoned and recorded) | stated in 7.1 and 11; B6, B9 |
| RR-P7 | the pinned digest diverges from loop code after a release | `collaboration-pin-unusable`; RT-4 |
| RR-P8 | Part B's checks need proposal fields the proposal lacks | pointer to B6/B9 (8.3); the Core must not read the workflow |
| RR-P9 | per-entry deep merge lets a stray key from one layer's entry survive | the resolver validates the merged entry against the final loop (5.2); no entry-level replace |
| RR-P10 | the rename touches many consumers, skills and renders | one L10 step, S19, S18 |
| RR10/RR11 | red-team default costs one checker at standard rigor; at high/critical a round needs three or four families. A round halts only when the fallback walk, which re-binds under current independence, finds no eligible replacement | tunable by `minCheckers`; named failure; RT-8, RT-9 |
| RT-9 | high/critical rounds halt often | restore the missing eligible family first; widen `fallbackPerSeat` only when attempts, not supply, are exhausted (it multiplies the launch ceiling and creates no family); change capability rigor only if no Unit rigor or case `rigorFloor` states a stronger one (`rigor-below-floor` refuses lower); never reconfigure a running case; never weaken independence silently |
| RT-P1 | a project needs a cap `bounds` cannot express | reopen the bounds shape |
| RT-P2 | agents re-copy whole rosters to drop one seat | consider a subtraction adapter over the same request |
| RT-P3 | a project needs its own multi-Unit composition | open the Workflow loader to a project/global source: separate item |
| RT-10 | a workflow needs a cap that is not a promise | reopen D1 as (b) |

Expertise still owed: runtime verification engineer (proofs of pin, solo-verify crash windows, receipt on a real release); Config component owner (entry-level replace, snapshot provenance naming a catalog entry); distribution/activation owner (which installed releases have the `seatSchema` fence; global-file coexistence); admission-port owner (proposal fields, for Part B); non-coding workflow author (first non-coding pattern fixture, default task wording); **downstream operator** of a project running a shipped workflow (deferred by the owner until a draft exists: this is that draft).

## 18. Amendments to area specs

When approved, merge with a minted D-ADR (`fgos identity mint d-adr` at merge; none minted here). Renders are rebuilt with `npm run build:skills`, never hand-edited. COOK route-table text (`core/skills/fgos-cook/references/route-table-pending.md`, `case-and-doors.md`) is corrected in the implementing change.

| Spec, section | Current text amended | Change |
|---|---|---|
| `docs/specs/workflow.md` 2.2 | terms table | add glossary terms: loop, pattern, params, request, baseline (section 2) |
| `docs/specs/workflow.md` 7.2 step 3 | "**Cửa**: giải pattern; phân giải ngữ cảnh authority qua port (RUL-WF-11); từ chối nếu không hợp lệ." | the door inherits the activity unit when no selector is given, applies a request, validates every carrier, pins the result |
| `docs/specs/workflow.md` 6 | rules | RUL-WF-29: degree through params; the chain of 7.1 and the merge of 8.2 (number assigned at merge) |
| `docs/specs/workflow.md` 5.2 AdmissionPort | "port có ba phép hoặc tương đương: ..." | not amended: no port operation; Part B states the proposal fields (8.3) |
| `docs/specs/runner.md` ~1500 | "agent-led hoặc declared qua Workflow / CollaborationPattern (`solo`, `reviewed`, `panel`, `debate` + preset)." | loops and patterns per section 2; the catalog in config; one resolution, pinned |
| `docs/specs/runner.md` ~1146 | "A reviewed run with no verify command still passes on its checkers but its result carries `verify: { ran: false, reason }`; a solo or panel run, which has no verify step, says nothing." | `solo` runs a supplied verify once (11); panel unchanged; `verify-command-unsupported` for an explicit one |
| `docs/specs/runner.md` ~1115 (`fgos run` one-liner flags: "`--persona`, `--writes`, ..., `--override`") | flag list without `--pattern` | add `--pattern`, `--params`, `--param`, `--reason` (with a case), the pin and `selector-conflict` |
| `docs/specs/runner.md` "Hợp đồng rigor và tier" | "chỉ quyết số checker của một unit `reviewed` và mức độ độc lập giữa các ghế, **không** quyết tier" | unchanged in meaning; the code red-team requirement is a resolver default replaced by `minCheckers` (12); config key names `runner.loops` |
| `docs/specs/seat-binding.md` 2 and 7.1 | "ghế checker mỗi tên từ `checkersByRigor[effectiveRigor]` ∪ `minCheckers` (và `red-team` cho capability `code:*`)" (within line 214) | red-team is the default `minCheckers` of `code`/`code:*`, replaced by an explicit entry (exact, then prefix); `verify`/`verifier` reserved seat ids; `checkersByRigor` lives under `runner.loops.reviewed` |
| `docs/platform/config/spec.md` | catalogs paragraph (~133: "the patterns, the workflow presets" in the standard-catalog sentence) | "the pattern catalog" replaces "the patterns, the workflow presets"; `runner.loops` is the loop tuning; retired keys in a config file are refused with `config-key-retired` (13.2) |
| `docs/specs/seat-binding.md` marker sentence (~245) | "Marker `runner.patterns.seatBinding.schema` vẫn do config project mới ghi và validator vẫn đọc giá trị của nó; thiếu marker không bị từ chối." | the marker is a reserved name, `schema: 2` after conversion; older releases refuse it; the new release reads schema 1 and 2 |
| decision history | - | the D-ADR for the owner's 2026-10-23 and 2026-10-24 decisions |

Not amended by Part A: `docs/specs/distribution.md` (no new doctor check name), `docs/platform-foundations.md` L1-L10 (L10 is applied: the door, step handoff, conductor skills, renders, config conversion and the rename move in one cutover and the old path is deleted), the workflow schema (`guide-schema.mjs`), `feature.yaml`, RUL-WF-7, RUL-WF-14, RUL-WF-19 (Part B).
