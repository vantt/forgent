# Lead synthesis of the recipe design panel (2026-10-11)

Verbatim output of the design lead (Opus) after four independent seats (Opus, Fable, gpt-6-astra, gemini-3.1-pro-high). Kept as evidence for [the decision report](design-261011-0300-discussion-recipe-lenses-decision.md). It proposes a single `--lenses` flag; that report explains why it is not recommended yet.

## Synthesis — simplest "recipe" for fgOS discussions

The design lead synthesizes four seat reports. Advisory only; no repository file was changed.

### 0. Splits and unresolved questions first

| # | Question | Seats | Chosen | Why |
|---|---|---|---|---|
| 1 | What carries the recipe | P1, P3, P4: a JSON `--recipe`. P2: one `--lenses` flag on the existing launch line | **Flag** | Same meaning in fewer concepts. The base is already the positional `<workflowId>`, so a JSON object only repackages one field. It mirrors `--stance-options` (`bin/fgos.mjs:2182`). |
| 2 | `critique: false` field | P1, P4 yes. P2, P3 no | **No** | It needs `dependsOn` rewiring plus the `inputs` reachability check (`definition.mjs:409-420`). The critique it would remove is currently mis-briefed anyway (see 6). "No critique" already has a route: `council-lite`. |
| 3 | `gate` field | P4 only | **No** | "Before synthesis" is undefined on `council-lite`, where synthesis sits inside the panel (`panel.mjs:87-99`). Bases that need a gate already have one (`business-discussion.yaml:50-55`, `nominal-group.yaml:33-36`). It also cuts against "Release con người". |
| 4 | Lenses on `delphi` | P1, P2 apply to both rounds. P3 refuse | **Apply to every eligible panel unit** | One uniform rule, no special case. Both rounds get the same `panelist-i` keys, so `sameSeat` (`delphi.yaml:46`) stays aligned. Cost: pane use doubles, and the pre-launch line says so. |
| 5 | Lenses on `council-lite` | P4 yes (the prototype's recipe 4). P1, P2, P3 no | **Refuse** | It would replace the only measured postures, while the posture files still arrive as contextRefs (`council-lite.yaml:13-16`), which gives a contradictory brief. |
| 6 | Store the recipe | P4 discard. Others store | **Store `lenses` in the start event** | About 3 lines, next to `stanceOptions` (`store.mjs:46`). Status and the A/B analysis need provenance. |
| 7 | Lens cap | 4 / 4 / 3 / 5 | **Hard limit 2-4, skill default 3** | N lenses need N+1 provider families, because the synthesizer must not share a family with any panelist (`panel.mjs:94-97`). |
| 8 | Base digest for portability across upgrades | P3 | **Not built** | Resume reads the stored definition (`store.mjs:43`), so a later base edit cannot change a run. Fresh re-expansion after an upgrade is allowed to differ, and that is documented. |

Unresolved:

- **(U1) Provider families.** It is not yet established whether the prototype's 4-lens run put its synthesizer on a 5th family. Phase-04's "4 seats" meant 3 panelists plus the synthesizer (`phase-04…:32`). If this machine has only 4 families, the real cap is 3.
- **(U2) Rust host flag forwarding.** I did not check that the Rust host forwards a new `--lenses` flag to the legacy-node entry. `--stance-options` works, so it probably does, but this must be verified.
- **(U3) Lens value is unproven.** Phase-04 measured postures + Restatement together: mean 9.0 vs 7.7, tie on Q2, n=1, one judge (`phase-04…:24,29,37`). There is no evidence at all for free-form lenses.

### 1. Options compared

- **A. Patch fields (the prototype).** Works today: a real run of an expanded definition completed. But `critique` and `gate` turn it into a small DAG editor. Taking only its lens patch is right.
- **B. One generalized skeleton.** It adds a seventh base plus a stage vocabulary that restates six YAMLs. That is a second workflow language. Rejected (all seats agree).
- **C. More fixed YAMLs.** Covers structure but cannot carry question-specific lens text, which belongs to the question in the same way `stanceOptions` does (`phase-04…:54`). If lenses fail the A/B, C reduces to *adding nothing*: no-critique and gated variants already exist as bases.
- **D (chosen). A cut down to one field:** `--lenses` on `workflow start`. The structure is chosen by picking the base; the runtime only specializes a generic panel.

### 2. Recipe format

A recipe is the existing launch line plus one new field. Five fields, four of which already exist:

| Field | Type | Default | Hard limits | New? |
|---|---|---|---|---|
| base | workflow id (positional) | required | discovered workflow (`loader.mjs`) | no |
| request | string | required | as today | no |
| **lenses** | `"a\|b\|c"` → string[] | absent, base unchanged | 2-4 entries; each 3-160 chars after trim; single line; no `{` `}`; unique case-insensitive | **yes** |
| stanceOptions | `"a\|b"` | none | as today | no |
| contextRefs | repeatable | none | as today | no |

There is no separate seat count, critique, gate, rounds, persona or provider field. Infra fields stay forbidden (`definition.mjs:14-22`), and the recipe has no free-form slot where one could go.

Examples:

1. **Decision, non-code:**
   `fgos workflow start group-cognition --request "Offer the client a 3-year retainer at 20% discount, or stay monthly?" --lenses "cash flow and payback over 36 months|delivery capacity and lock-in|renewal leverage and client concentration" --stance-options "accept 3-year|counter 2-year|stay monthly"`
2. **Risk review, non-code:**
   `fgos workflow start business-discussion --request "Risks of moving payroll to a new vendor in Q4" --lenses "tax and compliance filing|cut-over and data migration|employee trust and support load"`
   Its approval gate stays, so this run is attended only. A review of a *supplied artifact* still routes to `rfc`.
3. **Ideation:**
   `fgos workflow start nominal-group --request "Ways to cut onboarding drop-off; I'll rank them" --lenses "first-session friction|pricing and trial terms|human support touchpoints"`
   The human vote gate stays unchanged.
4. **Ambiguous problem:**
   `fgos workflow start group-cognition --request "Should we move to the new system?" --lenses "what problem is actually being solved|cost of staying put|migration and rollback risk"`
   It has no stance options. If the skill cannot name two distinct angles, it omits `--lenses`, which is exactly today's route.

### 3. Expansion semantics

There is one pure function, `applyLenses(workflow, lenses)`. It runs inside `prepareWorkflowRun` after the base is loaded (`runner.mjs:771-773`) and before `createWorkflowRun` (`:786`). An invalid recipe therefore creates no run and opens no pane.

1. Normalize the lenses: trim, check the limits, keep the given order.
2. `structuredClone` the loaded definition. The registry object is never mutated.
3. Visit steps in order, then units in order. A unit is **eligible** when `template.pattern === 'panel'` and none of its `params.roleTasks` keys match `/^panelist-\d+$/`. For each eligible unit:
   - set `params.members = N`;
   - set `params.roleTasks['panelist-' + i] = LENS_TASK` with `{lens}` filled from `lenses[i-1]`, keys inserted 1..N;
   - leave every other key alone (a synthesizer text, `blind`, `persona`, `inputs`).
4. **Refusals.** If any panel unit already has `panelist-*` roleTasks, refuse. This covers `council-lite` and `architecture-advisory`, so lenses never overwrite curated ones. If no panel unit is eligible, refuse.
5. Re-validate with the same validator the start path uses (`runner.mjs:765-767`). The result is stored as `payload.workflow`. `workflowId` stays the base id, so metrics still group by base.

`LENS_TASK` is one constant mirroring the council prose (`council-lite.yaml:20-26`):

> "Your lens: {lens}. Analyse the question through this lens only; it is a task focus, not an identity or provider choice. Do not change repository files. First, in a section named "Restatement", write in at most three lines the question you are answering and what is out of scope; then analyse, and end with an explicit position, its evidence, and what would change it. {objective}"

The runtime already does the rest:

- `{objective}` is substituted through a replacer function (`role-tasks.mjs:39-42`). That is why braces are banned in lens text: a lens containing `{objective}` would be expanded.
- The stance addendum is appended for panelists (`role-tasks.mjs:62,69-71`).
- The template `persona` still binds on every seat (`runner.mjs:180-183`). The lens text says it is a focus, not an identity.

A base declares nothing for this to work.

**Determinism.** The inputs are only the base definition and the ordered lens list. There is no clock, random value, environment or model output. Keys are inserted in a fixed order, so `JSON.stringify(applyLenses(b, l))` is byte-identical across calls and machines. A test proves it: expand twice, compare the strings, and check against a golden fixture.

The start event itself differs between runs, because it carries a run id and timestamp (`store.mjs:32,38`). Determinism is about the *definition*, not the run.

Resume, answer and the detached advance read the stored definition, so a recipe is never expanded again.

| Base | Lenses | Reason |
|---|---|---|
| group-cognition | yes | one generic panel (`group-cognition.yaml:13-19`) |
| business-discussion | yes | generic panel (`:18-23`); framing, critique, gate and roadmap kept |
| nominal-group | yes | generic panel (`:13-19`); vote gate kept |
| delphi | yes | both panels get the same seats; panes ×2 |
| council-lite | refused | fixed postures plus posture contextRefs |
| architecture-advisory | refused | curated system/alternative/constraint lenses; specialist route |
| architecture-advisory-reopen | refused | no eligible panel |

Presets (`rfc`, `consult`, `research-fan-out`) are out of reach: `fgos run` carries no params.

### 4. Smallest code change (about 55 production lines, 0-1 new files)

| File | Change | Lines |
|---|---|---|
| `src/workflow/lenses.mjs` (new; or inline in runner.mjs if fewer files is preferred) | `normalizeLenses`, `applyLenses`, `LENS_TASK`, errors | ~40 |
| `src/workflow/runner.mjs` `prepareWorkflowRun` | `if (lenses.length) workflow = applyLenses(workflow, lenses)`; pass `lenses` to `createWorkflowRun` | ~4 |
| `src/workflow/store.mjs` | `lenses = []` in the signature and `payload.lenses` (`:28,46`); carry it in the projection | ~4 |
| `bin/fgos.mjs:2182` + `src/cli/command-registry.mjs` | parse `--lenses` exactly like `--stance-options`; registry row | ~5 |
| Tests | see section 6 | ~80 |
| `core/skills/fgos-advise/SKILL.md`, `references/request-kinds-and-routes.md`, then `npm run build:skills` | rule change, launch-input row | ~15 |
| runner/workflow area spec, `CHANGELOG.md [Unreleased]` | one settled fact, one line | ~4 |

Status shows `lenses` because the projected state is spread into the status output. No new renderer is needed.

Setup and doctor are unaffected: no config default, environment variable or required file is added.

Errors are `RunnerConfigError`, raised before anything is recorded:

- `--lenses needs 2-4 entries separated by "|", got 6`
- `lens 3 is empty | over 160 characters | contains a newline or brace | repeats lens 1`
- `workflow "council-lite" fixes its own seat lenses (unit "deliberate"); use group-cognition, business-discussion, nominal-group or delphi, or drop --lenses`
- `workflow "<id>" has no panel unit that accepts --lenses`

**Not built:**

- recipe files, a recipe registry, a `fgos recipe` verb, or a JSON `--recipe` object;
- `critique`, `gate` or `rounds` patches, and any step rewiring;
- a generalized skeleton;
- a lens library or new persona files;
- a separate `--seats` flag;
- lenses for presets or the architecture route;
- a synthesizer override;
- a base digest;
- any provider, model or tier knob.

**Prerequisite, separate and YAML only (~30 lines).** Give the `reviewed` units of `group-cognition` and `business-discussion` the rfc-style reviewer and red-team `roleTasks` (`presets.mjs:42-61`).

Today those units fall back to "the work is the latest commit" (`role-tasks.mjs:21-36`; the gap is acknowledged in `request-kinds-and-routes.md:113-118`). So for a non-code question, the critique step checks the wrong thing. This bug exists with or without lenses. Fix it first.

### 5. How the skill fills it

- **Where lenses come from.** The skill writes free one-liners taken from the person's own request: the concerns, stakeholders, constraints or failure angles they named, or that the domain plainly implies. The form is `<concern> [and what it weighs]`.
  - No role-play: "act as the CFO" is not a lens; "cash flow and payback" is.
  - The council posture files stay owned by `council-lite` and are never copied into `--lenses`.
- **Limits.** 2-4 lenses, each up to 160 characters, one line, no braces, mutually distinct. Lenses are never asked of the person; the existing never-ask list stays (`SKILL.md:55-56`).
- **Default.** Pass `--lenses` only on the four eligible bases, and only when the request supports at least two clearly distinct angles. Otherwise omit it and get today's behaviour exactly. Default to 3 lenses, or 2 when only two concerns exist. Never invent a third to fill a quota.
- **Pane budget.** One panel costs N panelists plus 1 synthesizer, and each needs a distinct provider family. Delphi doubles the panel cost. Reviewed units add producer and checker panes.
  - The pre-launch line (`SKILL.md:57-58`) states the lenses, the seat count, and "custom lenses, unmeasured" until the A/B result lands.
  - After a `provider-limit` outcome, drop to fewer lenses rather than retrying blindly.
- **Rule edits.**
  - `SKILL.md:64-65` and `:91-94` change from "seats and lenses come only from the chosen Workflow" to "...or from `--lenses` on group-cognition, business-discussion, nominal-group, delphi".
  - In the unmet-knob example at `:99`, "a custom lens" is deleted; "5 seats" and "3 rounds" stay unmet.
  - `request-kinds-and-routes.md:103-107` is updated to match.

### 6. Verification plan

**Unit tests:**

- Expanding the same input twice gives byte-identical output, and it matches a golden snapshot (group-cognition + 3 lenses).
- Omitting `--lenses` gives exactly the base definition.
- The source registry object is not mutated.
- Lens order sets the seat mapping.
- Delphi gets the same `panelist-i` mapping on both panels, and the result passes the validator.
- `council-lite` and `architecture-advisory` are refused with lenses and accepted without.
- Every limit error fires: count, length, braces, newline, duplicate.
- The CLI records `payload.lenses`, and status shows it.
- An invalid lens list creates no run directory.
- After a lensed start, editing the base YAML and resuming still uses the stored definition.
- Foreground and detached starts produce the same expanded definition.

**Experiment.** Run it before building the door, using the existing in-memory `startWorkflow({workflow})` API and the prototype expander, after the checker-briefing fix.

- Two questions: the 3-year retainer (non-code decision) and Q3 "move to the new system" (ambiguous; it has a phase-04 baseline).
- Two arms on each: plain `group-cognition`, and the same base with 3 skill-written lenses. Same request, refs and stance options. Four runs in total.
- Judging: one blind judge, labels shuffled, the phase-04 rubric (spread / clarity / counterfactual / evidence / execution). Also check whether each seat's Restatement and analysis actually follow its lens.
- Record attempts, latency and provider-limit outcomes.

**Decision rule:**

- **Keep lenses** if the lensed arm scores ≥ plain on both questions, scores higher on spread or counterfactual on at least one, and gives at least one evidence-backed consideration the plain arm missed, with no extra failed attempts.
- **Drop lenses** if it ties or loses on both questions, or if seats ignore their lens on both questions, or if lenses cause more provider-limit failures.
- **If the only credited gain is the Restatement section,** drop lenses and add Restatement to the base panel's roleTasks in YAML instead. That is a cheaper fix with no runtime change.
- **If results are mixed (one up, one down),** run Q2 before deciding.

This is a shipping screen, not statistical proof.

### 7. Risks

- **Lens text is model-written prompt text.** It is bounded by the length, brace and newline limits and the fixed template. These bound size; they do not make arbitrary content safe. The recipe grants no tools or authority.
- **Provider-family exhaustion** at 4 lenses (U1).
- **Field creep.** Any new recipe field needs at least 3 logged real requests that base choice could not serve. This follows the route reference's own rule (`request-kinds-and-routes.md:109-111`).
- **A lensed `business-discussion`** remains attended-only because of its gate.
- **A lensed run on an unfixed critique** reviews the wrong thing. Hence the prerequisite.

### 8. Recommendation

Take these steps in order:

1. **Fix the checker briefing in YAML** for group-cognition and business-discussion.
2. **Run the 2-question lens A/B** through the existing in-memory API (4 runs).
3. **If lenses pass, add one flag:** `fgos workflow start <base> --lenses "a|b|c"`. The runtime applies it to every generic panel unit, refuses bases that have curated lenses, and stores the lenses plus the expanded definition in the start event. About 55 production lines, at most one new file.

What would change this:

- **Lenses fail the A/B → choose C, which here means build nothing.** Critique on/off and gate on/off are already base choices (council-lite, business-discussion, nominal-group). The unmet-knob rule stays as is.
- **At least 3 real requests need "lensed but no critique" → add one fixed YAML** (C), not a `critique` field.
- **Fewer than 5 provider families on the target machines (U1) → lower the hard cap to 3.**
- **The owner needs recipes portable byte-for-byte across fgOS upgrades → add a base-digest check** to the start door.
