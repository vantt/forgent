# Composable advise: structure and parameters for rebuilding a workflow from a base

Advisory design only. No repository file was changed except this report; nothing is committed. Everything marked OPTIONAL is a proposed runtime extension, not current behaviour.

Evidence is kept in the scratchpad `/tmp/claude-1000/-home-vantt-projects-forgentX/9786a51f-6583-4c3f-a283-a80ad24dee26/scratchpad/compose-design/` (brief, pattern/override JSON, six seat reports in `seat-reports/`, synthesis `seat-reports/synthesizer.md`, six-hats run outputs and unit summaries).

## 1. Seat-count truth (verified by code and real runs)

**Code.**

- `members` defaults to 3 (`src/runner/execution/patterns/panel.mjs:25-34`). There is no cap in `panel.mjs`, `definition.mjs` or `run.mjs`. The validator only checks that `params` is an object (`src/workflow/definition.mjs:302-304`).
- The only gate is independence in `bind.mjs`:
  - every panelist is `independentOf` all other panelists (`panel.mjs:63-68`);
  - the synthesizer is `independentOf` all panelists (`panel.mjs:89-98`);
  - a violation is refused with reason `independence`, unless the seat's override carries `acceptDependence: true` and origin `human-cli` (`bind.mjs:189-214`).
- A workflow YAML cannot carry that waiver, because it rejects executor, tier and override fields (`definition.mjs:14-22`). A waiver is a human CLI decision.
- The earlier "2-4 lenses" was a design choice, not a runtime limit. Conclusion: N panelists need N+1 distinct usable provider families, and anything above that needs a human waiver.

**Families on this machine.** Five are usable: claude, openai, gemini, xai, z-ai (glm). deepseek is registered but fails with "No API key found for openrouter" (run A below).

**Empirical runs (six hats, cheap question, `runUnit` with an object pattern and `human-cli` overrides).** Seat counts were read from `unit-summary.json`, not from exit codes.

| Run id | Setup | Result |
|---|---|---|
| unit-run-1791684535848-05a9cb03 (A) | 6 seats on 6 families incl. deepseek, synthesizer claude with waiver | All 6 seats launched in parallel; 5 passed; panelist-5 (deepseek) `execution-failure`, so the synthesizer never ran. Outcome `execution-failure`. A provider fault, not a seat limit. |
| unit-run-1791684621683-d31c10e8 (B) | 5 distinct families plus a 6th seat on claude, no waiver | Panelists 1-5 passed. Panelist-6 `policy-refusal`: "Candidate claude violates independence requirement against [claude, openai, gemini, xai, glm]". |
| unit-run-1791684700090-afd99b01 (C) | As B, but the 6th seat carries `acceptDependence` and the synthesizer has no override | 6 panelists passed (claude shared by seats 1 and 6). Synthesizer auto-refused: violates independence against all six. |
| unit-run-1791684751474-115641ec (D) | As C, plus synthesizer override gemini with `acceptDependence` | 7 seats, outcome **pass**. Six panelists ran, and the synthesizer got gemini, which is a family a panelist also used. |
| unit-run-1791684898544-884e2012 (design panel) | 6 design seats plus synthesizer | 7 seats, outcome **pass**. Families: claude (opus), claude (fable, waiver), openai (gpt-6-astra), gemini (3.1-pro-high), xai (grok-4.6), glm. Synthesizer openai gpt-6-astra with waiver. |

Facts that follow:

1. Six seats run. There is no seat cap.
2. Panelists must be pairwise on different families unless a human waives it. Seats may share a family only through `acceptDependence`.
3. The synthesizer is not automatically moved to another family. With every family taken, binding refuses it unless a waiver exists.
4. With five usable families and no waivers, a workflow started through `fgos workflow start` can have at most **4 panelists**. Six Thinking Hats works through the `runUnit` API with overrides, but not through the workflow door today. This was not tested through `workflow start`. The earlier real 4-lens workflow run (`wf-run-1791655904917-67798f73`) is consistent with it: 4 seats on 4 families.
5. The owner's memory of an original design with at least five roles: I found no code or spec evidence. `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md:371` names Six Thinking Hats only as an example framework. `architecture-advisory.yaml` has 3 curated panelists (SYSTEM, ALTERNATIVE and CONSTRAINT LENS, as per-seat `roleTasks`), and its `critique` step runs a `reviewed` unit (`reviewer`), while its `synthesis` step needs `reviewer` plus `red-team` (`minCheckers`). `business-discussion` runs the default 3 seats; "product, finance, customer" is only objective text. Five or more seats is possible but was never a built shape.

## 2. Alternatives compared

Scores are relative judgments (0 none, 3 large), not measured lines.

| Shape | Diff / shared-code risk | What the skill writes | Verdict |
|---|---|---|---|
| Do nothing new (base + request + context refs) | 0 / 0 | Existing launch line | Useful baseline. Cannot specialise seats. |
| Inline flags on `workflow start` (`--seats "a\|b\|@name"`) | 1 (lenses), 2 (with personas) / 1-2 | One ordered list plus existing fields | **Chosen carrier.** Mirrors `--stance-options` (`bin/fgos.mjs:2173-2186`). |
| Tiny recipe JSON/YAML file the skill writes | 2 / 2 | A structured file | New carrier, schema and lifecycle for fields the flag already holds. Revisit only if per-seat evidence routing is proven necessary. |
| Persona-by-name via lookup tiers | 2 / 2 | Existing names | Needs the unbuilt RUL13 resolver and role-scoped persona. A phase, not a free flag. |
| Domain-pack directory convention | 1 (docs) / 0-2 | Selects existing assets | Right home for flesh and soul. Must not become a registry or auto-attach bundle. |
| Reading card (shared README ref) | 1 / 0 | A shared ref | Immediate and safe, but per-seat placement is prompt-dependent. |
| Expansion diff shown before launch | 2 / 1 | Same inputs | Debug aid. Defer a preview command until needed. |
| Skill writes a full workflow YAML | Unbounded / 3 | A DAG | Rejected: model-authored execution semantics. |

The adversary seat (gemini) argued for a JSON file. It also made two factual mistakes: it invented `fgos run --recipe`, and it claimed a six-seat run fails. `fgos run` cannot carry pattern params, and run D proves six seats run. Its useful point stands: avoid a second workflow language.

## 3. Recommended structure

A recipe is **the existing launch record plus one optional field**: `base + request + seats? + contextRefs? + stanceOptions?`. There is no recipe file, registry, new workflow type or domain workflow YAML.

| Field | Status / type | Default | Hard limits |
|---|---|---|---|
| `base` | REQUIRED, positional workflow id | skill selects | Custom seats only on bases with generic panels: group-cognition, business-discussion, nominal-group, delphi. |
| `request` | REQUIRED string | none | Non-empty; keep the person's words. |
| `seats` | OPTIONAL ordered string[], `--seats "a\|b\|@name"` (NEW) | omitted = base unchanged | At least 2 entries; no schema maximum; distinct case-insensitively; the synthesizer is never an entry. |
| inline seat | string not starting with `@` | none | 3-160 characters, one line, no braces or pipe. A task focus, not an identity, credential or instruction. |
| named seat | `@` + persona basename (phase 2) | none | `[a-z][a-z0-9-]{0,63}`. Must resolve uniquely; an unknown name is an error, never a silent fallback. |
| `contextRefs` | OPTIONAL repeatable, existing field | `[]` | Existing safe-reference grammar (`definition.mjs:33-40`). Knowledge and standards use this same field. |
| `stanceOptions` | OPTIONAL, existing field | `[]` | Advise contract: 2-4 verbatim options from the person, on routes that allow them. |
| FORBIDDEN | `members`/`seatCount`, `rounds`, `blind`, `gate`, `critique`, synthesizer choice, `knowledgeRefs`/`standardsRefs`/`seatRefs`, steps, edges, raw `roleTasks`, and any `provider`/`model`/`executor`/`tier`/`invocation`/`prefer`/`overrides`/`acceptDependence` | base-owned | Choose a different base instead of patching one. |

Vocabulary cost: one new flag, one value convention (`@name`), one folder convention. A correction to the earlier design: the earlier lead used a `--lenses` flag capped at 2-4. This design renames it to `--seats`, because the value may be a persona name or a lens, and drops the schema cap in favour of preflight feasibility (section 6).

### Runtime consumption (OPTIONAL)

1. Parse `--seats` beside the existing start flags. Load the base through the current loader. Refuse a base with curated panelist tasks (council-lite, architecture-advisory), because lenses would silently replace curated postures.
2. Pure `structuredClone` expansion inside `prepareWorkflowRun` (`src/workflow/runner.mjs:765-794`): `params.members = N`, ordered entries mapped to `panelist-1..N` on every eligible panel. Delphi gets identical mappings in both rounds, so `sameSeat` (`delphi.yaml:35-46`) stays aligned. Topology, gates, `blind`, checker tasks and synthesizer text are untouched. No clock, randomness or model call.
3. Inline lens becomes a constant runtime-owned `roleTasks` sentence that ends in `{objective}`. A named seat becomes a validated internal role-to-persona mapping. The workflow runner emits `{scope:{unit,role},persona,origin:"workflow"}` ahead of the unit-wide persona (`runner.mjs:180-182`); binding already matches `scope.role` (`bind.mjs:86-95`). The spec asks for exactly this extension (`docs/specs/runner.md` ~1452).
4. **Pin persona content at start.** The rendered persona text and its source digest are stored in the run. Resume never re-reads a live file. `renderPersonaSection` currently reads only the running project's `core/agents` (`assignment.mjs:728-744`), so carrying pinned text to the renderer is a real, small assignment-contract extension. If it cannot reuse the existing renderer cleanly, stop phase 2.
5. **Shared refs correction.** Run-level `--context-ref` reaches only steps with no `dependsOn` (`runner.mjs:69`), not every later seat or checker. With `--seats`, copy the shared refs into each unit template so downstream seats, checkers and synthesis receive them. Without `--seats`, behaviour is unchanged.
6. Revalidate the expanded definition with the same validator, then dry-bind it before spending. Use `simulateUnitBindings` with the expanded `{pattern, params}` (`src/runner/execution/dry-bind.mjs:21-38`). The doctor wrapper drops `template.params` (`src/setup/workflow-pool-independence.mjs:107-114`), so do not reuse it as is.
7. Store the expanded definition in the existing `workflow.start` event (`store.mjs:36-48`) plus a small provenance record: normalized seats, base digest, resolved persona digest and normalized refs. Explicitly add it to the status projection (`store.mjs:150-156`). Status and resume read the stored definition, with no re-expansion.

Determinism: the same base bytes, the same normalized ordered inputs and the same resolved persona bytes give a byte-identical definition. Context-ref files are read live, so evidence is not frozen; say so rather than claim it.

Diff estimate: the lens-only slice is about 55 production lines (earlier report, `plans/reports/design-261011-0300-recipe-panel-lead-synthesis.md:65-90`). Named personas, lookup, pinning and preflight are additional and larger, and were not estimated.

## 4. Domain flesh and soul

- **Personas** (`name.yaml` in the shape of `core/agents/council-assumptions.yaml`): `fgos/agents/` in the customer workspace, then `domains/<domain>/agents/`, then installed core. This is RUL13 (`docs/specs/distribution.md:289-294`): whole-file replacement, same-tier collision errors, installed core found through the release manifest. Lookup, doctor support and extension-root discovery are still unfinished (`:341`). No domain today has an `agents/` directory.
- **Knowledge and standards**: plain documents in the project (`knowledge/`, `standards/`, or wherever the customer keeps them), attached with `--context-ref`. A short README per pack says what applies and which seats suit it.
- **Seat vs all seats**: every seat receives the shared set. The lens or persona text may say which subset to weigh, but this is attention guidance, not access control. A per-seat ref field is deliberately not built.
- **Installed pack knowledge** outside the workspace cannot be passed as an absolute ref (`definition.mjs:33-40` rejects it). The first domain proof uses project-local documents; an installed-knowledge handle is deferred.
- **Discovery**: the skill lists the actual files in the three tiers, reads descriptions and decision boundaries, and picks names. A README guides; it never executes.
- **Standards need provenance**: a version, applicability and source. The runtime never infers which accounting regime or employment jurisdiction applies.

## 5. Skill side

- The purpose-to-route table stays authoritative (`core/skills/fgos-advise/references/request-kinds-and-routes.md:41-53`): option choice goes to council-lite, exploration to group-cognition, generate-and-rank to nominal-group, revise-estimates to delphi, approval plus roadmap to business-discussion. Repository architecture and review-of-artifact keep their routes.
- The skill then reads available personas and picks 2-4 non-redundant perspectives. Default is three. Prefer a discovered persona; otherwise write a short inferred lens that names a legitimate analytic concern.
- Never invent: persona names, file paths, external facts, credentials, standards, stance options, rounds, or a provider exception.
- Ask only when subject, artifact, authority or the decision is missing (the current four triggers, `SKILL.md:51-56`). Proposed addition: when the answer depends on an unknown jurisdiction, reporting basis or policy authority, inspect the supplied evidence first, then ask one batched factual question.
- One pre-launch line states purpose, base, ordered seats, refs, fixed rounds and gate, and any unmet requirement. Never ask the person for protocol, seats, blind, rounds or providers.
- The current ban on skill-filled seats (`SKILL.md:59-65,91-98`) must be revised for this to work.
- If the person explicitly asks for six perspectives and the machine allows four, say so and offer the closest supported route. Do not silently shrink it.

## 6. Seat limit rule

- Validator: at least 2 distinct seats, no schema maximum.
- Preflight, before any pane opens: dry-bind the expanded definition and refuse an infeasible composition with the concrete reason.
- On this machine: 5 families give at most 4 panelists plus a synthesizer on the workflow door, because no waiver can be expressed there. Six panelists need seven families or a human waiver.
- The skill default is 3. Each extra seat is a provider pane and quota, so there must be a real coverage need.
- No automatic waiver and no recipe field for it. If six-hat runs through the workflow door become a real need, the smallest fix is an explicit human flag on `workflow start` that prints the consent (see unresolved question 1).

## 7. Phasing

0. **Now, no runtime change.** Use today's routes with project documents as `--context-ref`; log requests where a seat specialisation would have mattered. Optional cleanup: the route reference's "known gap" about checker tasks is stale, because `group-cognition.yaml:29-43` and `business-discussion.yaml:33-47` already carry artifact-aware checker tasks.
1. **Smallest composition proof.** `--seats` with inline lenses only, on the four generic bases, pure clone expansion, explicit shared-ref copy, expanded-params dry-bind, provenance in the start event and projection. Prove it on one finance and one HR fixture. No persona lookup, no new store.
2. **Named personas.** Implement RUL13 lookup once; role-scoped persona emission; pinned rendering through the existing assignment path; setup and doctor registration (required by `AGENTS.md` install/doctor gate); a test in a consumer project, not only the fgOS repo; skill, spec and CHANGELOG updates, then `npm run build:skills`.
3. **Only after evidence.** Additive expertise on curated bases, per-seat evidence routing, or installed-knowledge handles. If per-seat refs prove necessary, reconsider a strict JSON carrier with the same expansion semantics.

## 8. Example recipes (proposed syntax, not runnable today)

Document paths and persona names are fixture requirements, not files that exist now.

Finance (exploration, no invented stance options):

```sh
fgos workflow start group-cognition \
  --request "Why does our month-end close keep slipping? Use our close policy and reconciliation aging." \
  --seats "Reconciliation bottlenecks and evidence quality|Handoff timing and operational ownership|Automation failure modes and recovery" \
  --context-ref docs/finance/close-policy.md --context-ref docs/finance/reconciliation-aging.md
```

Named variant after phase 2: `--seats "@finance-controller|@finance-operations|Automation failure modes and recovery"`.

HR (ideas the person will rank):

```sh
fgos workflow start nominal-group \
  --request "Generate ways to reduce first-90-day onboarding drop-off; I will rank the ideas. Use our onboarding policy and funnel." \
  --seats "New-hire access and first-week friction|Manager capacity and learning feedback|Policy consistency and measurable outcomes" \
  --context-ref docs/hr/onboarding-policy.md --context-ref docs/hr/onboarding-funnel.md
```

Named variant: `--seats "@employee-experience|@hr-operations|Manager capacity and learning feedback"`. The run must park at the human vote gate (`nominal-group.yaml:30-36`). Finished seats are not a finished workflow.

Third (delphi): "Give independent estimates, then revise: how many weeks will the warehouse migration take?" gives `delphi`, three inline seats, shared `docs/ops/migration-constraints.md`, no stance options, the same role mapping in both rounds.

## 9. Verification (a stranger can run it)

Designed here, not executed against an unbuilt feature.

- Intake: the three requests select the bases above. A finance question with supplied options still selects council-lite with no custom seats. A review of a supplied artifact still selects rfc.
- Determinism: expand twice from identical inputs and compare the definitions byte for byte, excluding event id and timestamp. Omitting `--seats` leaves the old definition and old ref behaviour unchanged.
- Golden structure: steps, `dependsOn`, gates, `blind`, capabilities, checker and synthesizer tasks and Delphi inputs are unchanged. Only the declared seat fields and the explicit ref copies differ.
- Assignment inspection: each lens appears only in its intended seat's brief. A named seat gets the pinned persona and the synthesizer does not inherit a panelist persona. Shared evidence reaches the downstream checkers and the synthesizer. Persona text containing `{objective}` stays literal.
- Lookup (phase 2): workspace shadowing, whole-file replacement, collision failure, unknown name failure, and resume uses pinned content after the persona file is edited or deleted.
- Negative input: one seat, an empty or duplicate or overlong seat, an unsafe name or path, forbidden keys, an unknown base, an unreadable ref. Each creates no run.
- Families: three panelists fit four families, four fit five, five fail on five families. A recipe cannot inject a waiver. Show that a dry-bind pass is not a guarantee: a credential failure like run A's deepseek still surfaces at runtime.
- Inspect the real `workflow.start` event, the status projection, the role briefs and the reports. Do not trust a worker's claim.
- Smoke test: **not run.** The optional finance lensed-with-knowledge vs plain comparison needs fixture documents inside the repository and the unbuilt flag, and the earlier A/B was already net zero at low power. Acceptance is flexibility with no regression, not a quality gain.

## 10. Risks, cuts, and what would make the owner regret it

Risks:

- Role-specific override ordering could leave the unit persona on a seat.
- A missing persona snapshot makes resume drift.
- A shared evidence bundle can overwhelm seats.
- Stale standards produce confident wrong answers.
- A dry-bind pass does not prove quota or credentials.

Cut if composition would need any of these:

- a new engine, store or registry;
- DAG edits to a base;
- provider policy inside a recipe;
- a second persona renderer.

Pause phase 2 if pinned persona text cannot travel through the existing assignment contract.

Do not cut a phase merely because quality ties the plain run. That was the owner's accepted bar.

Regret signals: dozens of subtly different recipes instead of understandable bases, or users curating provider configs just to ask a domain question.

## 11. Recommendation

Adopt the five-field launch-record design: an optional ordered `--seats` on the four generic bases, with shared context refs, in phases 1 then 2. Personas come from the RUL13 tiers with `scope.role`, pinned at start. Framework procedure, provider policy and domain knowledge stay with their current owners. I would switch to a tiny strict JSON carrier only if real per-seat evidence routing is needed. I would stop phase 2 if persona transport needs a second mechanism.

## 12. Unresolved questions

1. Six Thinking Hats and any seat count above families minus one are impossible through `workflow start`, because only a human CLI override can waive dependence. Accept the family limit, or add an explicit human-only flag on `workflow start` that prints the consent? I recommend accepting the limit until a real request needs it.
2. Is shared evidence enough at realistic document volumes, or will seats need private refs?
3. Who authors and maintains the HR and finance packs? No domain has an `agents/` directory now.
4. Can pinned persona text reach the assignment renderer without a second parser? This blocks phase 2 only.
5. Does the workflow door (not `runUnit`) auto-spread panelists across families under a capability `prefer` list without overrides? Only the earlier 4-lens run suggests it; I did not test it.
6. Does the Rust host forward a new `--seats` flag to the legacy-node entry? The earlier report left this open; `--stance-options` suggests yes.
7. Persona boundaries versus domain expertise: a generic researcher boundary may conflict with a domain posture when both render.

Status: DONE_WITH_CONCERNS
