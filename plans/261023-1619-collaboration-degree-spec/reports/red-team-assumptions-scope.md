# Red team: assumptions and scope of the collaboration-degree spec draft

Target: `plans/261023-1619-collaboration-degree-spec/spec-draft.md` (502 lines), read in full. Code spot-checked at working tree HEAD. Findings are ordered by severity. Nothing was built or run.

## Verdict on the owner's ask

The owner asked for a small thing. Degree is the bounded params on the guide activity, the agent can request params within bounds with a reason, config tunes the bounds, and MUSTs and invariants cannot be overridden. The draft delivers that and also adds a large platform program: a new guard primitive, a new seat role, a consent-receipt rewrite, a freshness system, a port read, a setup migration, a retired config key and a coding-guide restructure. Only a fraction of this is needed for "degree through params". RUL104 ("better, not bigger") is violated in section 7 as a whole.

## Findings

### F1 (Critical) Evaluator-kind enforcement "on every event path" re-judges existing ledgers and the core playbooks

Spec: section 7 F3 ("This applies on every event path: `settle`, `step.complete`, `gate.answer`"), 15.1 RUL-WF-19 amendment ("only an unguarded diagnostic milestone accepts `findings`"). The Problem section cites `case-projection.mjs:104, 109-116, 129`.

The projection is a pure fold over the case ledger. Tightening acceptance in the fold changes the state of every case already on disk and every running case.

Failure scenario: a case opened last week achieved `plan-validated` through a solo `shape-plan` with no receipt. After upgrade the same ledger folds to "not achieved". `implement-item` becomes ineligible mid-case. The case was running under a guide snapshot pinned at start, so it cannot pick up the F8 milestone split either.

The spec has no migration, no versioning of the projection and no statement about in-flight cases. RR5 mentions "playbooks or tests that assumed `shape-plan` alone achieves `plan-validated`" and treats it as a test problem.

The spec also never checks which core playbooks (`core/workflows/*.yaml`, `domains/marketing/workflows/content-publish.yaml`) depend on `step.complete` achieving without a receipt. Section 10 S20 proves only a hypothetical guide fixture.

Fix: version the acceptance rule per guide snapshot (a new rule applies only to a guide revision that declares the guard). Make the rule additive: a milestone with no named guard keeps today's behaviour. State explicitly that old ledgers fold as before. Grep every shipped playbook milestone first and list the results in the spec.

### F2 (High) The scope exceeds the owner's request and does not state where it can be cut

Spec: sections 7 F3, F8, F9, 8.2 to 8.4, 11.3 G2 and G3.

The owner asked for params as degree, bounds and a reason. These items are not that:

- A new guard primitive, `reviewer-verdict`, which amends locked workflow rules RUL-WF-7 and N10.
- A new seat role, `assessor`, with a new posture set.
- A rewritten consent path: `milestones` and `subjectRef` on `gate.answer`, plus a digest-scoped "already answered" rule.
- A freshness system, `subjectRef` locators and `current-digest-unknown`.
- The retirement of `mutatingMinRigor`.
- A coding-guide rewrite.

Evidence the draft knows this: 11.3 admits G2 and G3 were found "while verifying", and F8 admits that until the coding cutover "`plan-validated` cannot be achieved with consent".

Section 8.2 shows that the consent rewrite exists to support F8's two-MUST design. That design serves the single P6 case and not the params mechanism. The owner explicitly said the fix must not be aimed at a single case.

Fix: split the spec. Part A: the params mechanism (the Unit `pattern` object form, merge, bounds, provenance, pin, reason, inheritance). Part B: milestone-evidence hardening, labelled as a separate owner decision with its own approval. Mark which F-items Part A does not need.

### F3 (High) "Existing guides and units keep working" is false for the object-form `pattern`

Spec: section 7 F7 ("Unit `pattern` accepts a preset name or `{ pattern, params }`"), 5.1 ("The current object-beats-string split (`chosenPattern`) is retired"), 15.2.

`unit.mjs` accepts only a non-empty string (`unit.mjs:262-268`). `chosenPattern` (`run.mjs:366`) accepts an object only from the caller. The spec changes the Unit schema, and so the Unit file consumed by other projects. Three consequences are not covered:

1. Units written by the new version cannot be read by an older host or an older global release, and the spec says nothing about the `legacy-node` payload and Rust host split in AGENTS.md. The spec's own Unit-run record pin (F7) says an old record "whose meaning cannot be resumed is refused by name", but there is no definition of when that happens.
2. `selector-conflict` turns a previously valid call into a refusal. Today a caller string plus a Unit pattern works because the Unit wins. Under the new rule both explicit and different now refuses. Existing skill text, scripts and external callers in other projects pass `--pattern` alongside Units. No caller census is given.
3. The L10 rule says to move every caller. The spec lists callers only as "both doors, the step handoff, conductor skills, generated renders" (15.4) with no grep result.

Fix: add a caller census (`rg "pattern" src bin core/skills`) to the spec. Choose compatibility explicitly: keep precedence "Unit beats caller string" if the caller is not an object, or list the exact breaking set.

### F4 (High) The per-slice request door is the owner's central ask, and the spec makes it unusable

Spec: SC1 (section 12.2), 11.1 reviewer F1: the agent must write a `--unit` file with object-form `pattern`, plus `--case --activity --reason`.

The owner said the agent "may request params within bounds with a reason". A conductor that today types `fgos run "<prompt>"` must now author a Unit file to ask for `maxRounds: 1`. SC1's own justification ("requests are the exception") undercuts the weight of the central feature. A related claim is unverified: the spec says `param-request-reason-required` fires on "a param request on a case dispatch" but defines "request" through provenance `request`. A Unit file written by a registered step that carries params (as `core/workflows/architecture-advisory.yaml:70` already does, with `minCheckers: [reviewer, red-team]`) counts as a request by provenance. Whether a playbook step's own params need a reason is not stated.

Prior art the spec never cites: playbook steps already declare `pattern` plus `params` inline (`architecture-advisory.yaml:66-70`, `architecture-advisory-reopen.yaml:19-23`). That is the existing "params on the declared unit" mechanism. The draft should show why the guide activity cannot reuse that step-params shape unchanged (L10).

Fix: put the reason in one place. Either a `--params <json>` plus `--reason` on `fgos run`, or accept the Unit file route only and drop the claim that this is the agent's normal tool. Say plainly which one the owner asked for. State whether playbook step params are "requests".

### F5 (High) `maxRounds` as a ceiling (SC4) silently breaks existing projects and shipped presets, and the "no new key" claim hides a semantic change

Spec: 6.3 SC4, S13, RR12.

Today `maxRounds` is a default that a Unit beats (`params?.maxRounds ?? cfg.patterns.reviewed.maxRounds ?? 2`). Other projects set it as a default, for example 2 or 3, and shipped playbooks or Units set higher values for particular steps. After the change:

- A project that set `maxRounds: 1` as a convenient default now cannot run any Unit asking for 3. The refusal `param-out-of-bounds` fires on an existing, previously valid Unit.
- The spec's softer rule ("a preset or activity default above the ceiling resolves to the ceiling with provenance `config`") is silent clamping of a shipped preset's meaning. This contradicts F7's own "never clamps".
- The same key is "the fallback default" and "the ceiling". A project that wants a default of 2 and a ceiling of 4 cannot express it. The owner asked for "project tunes bounds via config", which implies bounds separate from defaults.

Fix: a separate key is the honest design, for example `runner.patterns.reviewed.maxRoundsCeiling`, absent means no ceiling. This is additive, breaks nobody, and registers into setup and doctor as AGENTS.md requires. Rejecting this because "no new key" is the wrong tradeoff when the alternative is a silent break. Alternatively, keep the ceiling off by default and set only by explicit config.

### F6 (High) The red-team move to config rests on a migration that cannot be proven for all install levels or machines

Spec: F5 upgrade path (G5), S14, RR8.

Code check: `seat-resolver.mjs:116` adds red-team unconditionally for `code` and `code:*`, and no shipped `minCheckers` exists for them. The spec requires `fgos setup` to write the key into existing project `.fgos/config.json`. Failure conditions:

- Global-level config only (a project with no local entry). Setup writes where? The spec says "existing `code` / `code:*` capability entry that has none"; a project with no entry at all gets nothing, and red-team vanishes silently. The spec does not cover this case, and the AGENTS.md gate says never to assume the install level.
- A second machine or worktree that never re-ran setup (multi-machine). Config is per machine and per project checkout, and the key is the safety floor of the coding path. The old behaviour was machine-independent code.
- A project that already has a `code` entry from an older setup: write-if-absent merges can collide with the "explicit `[]` clears" semantics. A written key and an old explicit `[]` are indistinguishable.

The spec itself calls this a floor ("RR8", "RT-C-R1") and then moves it to the most fragile layer. The reason given is the owner's "project tunes through config", but the owner also said invariants are not overridable. Red-team on `code` was effectively an invariant.

Fix: keep red-team as a shipped default in the capability layer (core standard config read by the resolver as the fallback when the project has no `minCheckers`), not as a setup-written copy. Then absent project key inherits the shipped value. Drop the setup write, which is a larger mechanism than the problem needs.

### F7 (High) Several of the ten "Spec choice" items are not necessary, and two are larger than their label

Section 12.2, each judged:

| Id | Necessary for the owner's ask? | Smaller choice |
|---|---|---|
| SC1 | Partly; it defines the request door | A `--params` flag, see F4 |
| SC2 | Yes, in spirit, but a second owner of "reason" next to `route-reason-required` | Fold into the existing reason rule; one code |
| SC3 | Yes; it is the smaller choice and should stay | None |
| SC4 | No as designed; breaks users | A separate ceiling key, F5 |
| SC5 | Yes; but the table lives in code beside the "one source" claim, so doctor cannot show it to projects | Keep, and expose the table through inspect output |
| SC6 | No; it exists for F8 | Defer with Part B, F2 |
| SC7 | No; a `subjectRef` plus a re-read system for freshness | Defer with Part B |
| SC8 | Yes, but "finishes = in `produces`" breaks a guide where two activities share one milestone (the current `shape-plan` and `validate-plan`) | Keep, with a note that the guide validation must reject a shared `produces` for guarded milestones |
| SC9 | Yes in principle; but it makes every currently tolerated unknown key a refusal (the same shipped preset carries `gated: true`, which nothing reads) | Warn first, refuse later; or only validate on the new object form |
| SC10 | Text only | Fine |

SC6 and SC7 are labelled "additive" and "two additive fields". They change a persisted event payload that readers in other projects fold, and they change an "already answered" invariant (RUL-WF-14). That is not additive in the compatibility sense.

### F8 (Medium) Domain neutrality is claimed more than it is delivered

Spec: section 2 ("activities, milestones, patterns, params and receipts say nothing about code"), S20.

- `code`/`code:*` is named inside F5 and in 6.5's invariant table (`code-change` carries `reviewer, red-team`). A preset called `code-change` is a coding-domain name living in the shared pattern layer, and its invariant is a coding policy. A marketing project reusing `reviewed` for content gets a different effective promise depending on the capability name.
- The assessor is called "light validation" for coding but the pattern is neutral; fine. But `reviewer-verdict` as a guard name bakes in a review-shaped role.
- S20 asserts "no coding assumption" with a fixture that does not exist ("none of the proofs below exists yet"). The only real non-coding guide is `domains/marketing`, and `domains/marketing/workflows/content-publish.yaml` is a playbook, so a guide-case marketing path is not shown at all.
- Only one shipped guide exists (`rg "kind: guide"` finds only `domains/coding/workflows/feature.yaml`). Every claim about "guides in other projects" is extrapolated from one coding example.

Fix: move policy that is coding-specific (the red-team requirement, `code-change`) out of the neutral spec text and into the coding domain's own config or preset; state that S20 is unproven until a non-coding guide fixture is written.

### F9 (Medium) A stranger agent cannot implement from this spec without guessing

Concrete gaps:

- `activityUnit({ caseId, activity })`: what happens when the guide snapshot lacks the activity, has no `unit`, or has only `unit.kind: integrate` (as `integrate` does at `feature.yaml:148`)? Not stated.
- The proposal field `requested` (SC2) is never given a shape or a defined interaction with the existing `proposal.reason`.
- "Per-param provenance" in the pin: the storage location is "the existing Unit-run record" with no field names, no schema version and no definition of how `request` differs from `activity-default` when a registered step and a Unit file both carry params.
- 6.2 param kinds: `seats` is "closed-set" but `roleTasks` is "free" while its seat ids are validated. `minCheckers` is "additive" but a request that adds `tester` is allowed with no cost bound, and the spec never says whether additive requests are "requests" that need a reason.
- F9 independence: "enforced where provenance exists" has no definition of provenance, which is how the independence would actually work.
- The retired `defaultRule` key: "refused with guidance, setup converts with backup" relies on a registered dead-key mechanism that the spec names but never verifies exists for this key class.
- The Spec's cross-references to line numbers (`bin/fgos.mjs` ~2912-2930, `run.mjs` ~1375-1407) are approximate and drift.

Fix: add one worked example per refusal code and a field-level shape for the pin and the proposal.

### F10 (Medium) Resume and pinning claims are untested assumptions about a record that already exists

Spec: F7, S11, RR4.

"The run's config snapshot already pins runner config (`snapshotRunnerConfig`), presets are code and are pinned by the expansion itself." That assumes that at resume every consumer reads the pin. The spec lists "every loop consumer reads the pin" as a requirement but offers no enumeration of the consumers. Prior consumers (`run.mjs` 773 and 1440 persist the unexpanded selector, per the Problem section) suggest at least two exist. A Unit-run record written by the old version has the selector only; "refused by name" kills an in-flight run on upgrade. Multi-machine: a case resumed on a second machine with a different preset table (older release) reads a pin whose meaning it cannot execute. The spec says "refused by name" but gives no refusal code for it, unlike the table in 5.3.

Fix: enumerate resume readers in the spec (`rg` result), define the code, and state upgrade behaviour for in-flight runs.

## Items I checked and found already settled by the draft (not findings)

- No overlay of shipped guides: the owner decided it.
- Refusal ownership is consistent in 5.3.

## Unresolved questions

1. Is the owner approving Part B (evidence hardening) as part of this spec, or only the params mechanism? The draft bundles them and F8 depends on the consent rewrite.
2. Does any shipped playbook (`core/workflows`, marketing) rely on `step.complete` achieving a milestone with no receipt? The spec does not say; I did not run the projection.
3. Is a `maxRounds` ceiling meant to bind shipped presets, or only caller requests?

Status: DONE
