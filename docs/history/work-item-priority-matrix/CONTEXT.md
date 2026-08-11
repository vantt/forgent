# CONTEXT: work-item priority matrix (tsk-4y5)

## Feature boundary

`tsk-4y5` asked for a mechanism to auto-set a work item's priority from an
impact/urgency matrix, using impact-analysis capability, defaulting urgency
to medium when the submitter doesn't supply it. Exploring this surfaced a
much larger scope than the original one-field ask: `priority`'s role
changes from explicit input to calculated output, `intent` is retired in
place, two new fields (`urgent`, `effort`) are introduced, and `impact`
absorbs a de-risking-value component. It also surfaced a separate,
already-recognized front-of-pipeline problem (verb `discover` overloaded
across two stages) that this exploration treats as a locked decision but
explicitly defers sequencing/splitting to `fgos-coding-planning`.

Out of scope for this document: implementation of the formula, the exact
`weight()`/`discount()` numeric tables, and whether this ships as one item
or several — all three are `fgos-coding-planning`'s job, not this skill's.

## Locked decisions

| D-ID | Decision | Rationale |
|---|---|---|
| D1 | Split the current dual-purpose `discover` verb into two: `discover` (stage `clarify`, wraps today's `judgeDiscovery`) and `decompose` (stage `decompose`, wraps today's `judgeDecompose`). No new mechanism — a rename/split of an existing overloaded verb. | `judgeDiscovery`/`judgeDecompose` are two distinct functions already (`src/intake/discovery.mjs`, `src/intake/plan.mjs`) sharing one CLI verb name picked by the item's current `stage`. **Correction (post-lock audit):** `tsk-ozl` was cited here originally as flagging "this exact confusion" — re-read in full, it does not. `tsk-ozl`'s actual complaint is narrower and clarify-stage-only: `resolveDiscovery` calls `judgeDiscovery` *unconditionally* even when a session already ran `fgos-coding-exploring` and locked `CONTEXT.md`, re-judging blindly instead of trusting `docsRef`'s existence — a behavior bug, not a naming/API-surface issue. D1 (a rename/split) does **not** fix `tsk-ozl`'s bug by itself; they are two separate, real problems on the same verb. Bundling recommendation (not a hard dependency): whoever implements D1 is already touching `discover`'s call sites — a natural moment to also fix `tsk-ozl`'s conditional-rejudge behavior in the same pass, though either can ship alone. |
| D2 | New field `urgent` — human-entered, optional, `--urgent <level>` via `edit`/`add`. Absent reads as `medium`. Input only, never a sort key itself. | Matches the original ask verbatim ("nếu người không đưa urgent thì nó sẽ là medium"). Kept separate from `priority` so `priority`'s existing absent-sorts-last semantics (Data Dictionary #25) is never overloaded with a different absent-meaning. |
| D3 | New field `impact` — calculated. Rough pass at `clarify`: `blocks` (STR21 `rankImpact`, `src/state/impact.mjs`) + a semantic feature/release-relatedness scan. Refined at `decompose`: add a de-risk bonus (D8) once a real code target is known. | Reuses STR21's existing derive (`blocks`) rather than inventing a new work-graph metric. The semantic-relatedness half answers the original ask's "liên quan cục diện feature nào" — not built anywhere today, net-new work for `fgos-coding-planning`/implementation to scope. Named `impact` deliberately: checked against `fgos triage`'s real output columns (`docs/reference/triage-table-columns.md`) — the CLI-visible column is `blocks`, not `impact`, so this name does not collide with any live surface, only with `rankImpact`'s internal/doc naming (a documentation-hygiene note, not a blocker). |
| D4 | `risk` keeps its name and field; its calculation source is upgraded. Today: pure keyword match (`src/intake/classify.mjs:66-93`, mirrors `tier`). Add: the `impact-analysis` capability's blast-radius measurement (`fgos tool query --capability impact-analysis --status present`, wired by `tsk-1e4`) as a second signal, available once a code target is known (`decompose`). `risk` acts as a **discount** on `priority` (higher risk → smaller multiplier), never a boost. | Matches `risk`'s existing live consumer, `decompose.mjs`'s `risksGate` (risk=heavy forces a human-confirm gate — a brake, never an accelerant) — folding risk into `priority` as a positive/boosting term would contradict behavior already shipped. Confidence-discount framing mirrors RICE's own "Confidence" term. |
| D5 | New field `effort` — calculated, decompose-time only. Source: reuse `fgos-coding-planning`'s existing mode/flag-count mechanism (`tiny`/`small`/`standard`/`high-risk`/`spike`, `.claude/skills/fgos-coding-planning/SKILL.md` step 2 "Mode gate"), mapped to a numeric weight — not a new estimation model. | `effort` has zero existing signal source in the repo today (unlike `risk`/`impact`); inventing a bespoke estimator would be ungrounded. `fgos-coding-planning`'s mode-flag-count is already a real, working effort proxy, just not currently persisted as a work-item field. |
| D6 | `priority` changes role: from explicit human/agent input (STR7) to a **calculated output**, `priority = invert((impact × weight(urgent)) / max(effort, floor) × discount(risk))`. Computed twice: a rough pass at `clarify` (`fgos-coding-exploring`, `effort` assumed at a default floor since unknown yet) and a refined pass at `decompose` (`fgos-coding-planning`/`fgos-coding-validating`, once `effort` and the real blast-radius are known). Both passes write via the existing `edit --priority <n>` door. `invert()` because the existing sort contract is ASC (Data Dictionary #25, lower number = higher priority) while the raw score is naturally "bigger = more important" — the inversion step is a MUST-not-skip detail, not an implementation footnote. A human keeps the same override door (`edit --priority`) to force a value at any time — unchanged. Priority's effect on *other* items' own `priority` values (cascade/ripple) is explicitly **deferred**, out of scope for this item. | RUL59's literal text permits "a person OR an agent" to write `priority` via `edit --priority` — only the picker/frontier read path is barred from inferring it. A calculated value written by an intelligent session through that same door is already legal today (this is exactly `intent`'s existing shape, STR8) — no law change needed, only a role swap. Two compute points are forced by D5's timing constraint (`effort` unknown until `decompose`). |
| D7 | `intent` is retired **in place**: `clarify`/`decompose` stop writing it once D6 ships; the field, its validation, and the `edit --intent` flag stay in the schema/CLI unchanged (no removal). Frontier v2's `intent` DESC tie-break degrades to vacuous (always absent on new items) without any change to `frontier.mjs` or a new contract version. | Matches this repo's existing additive-only schema discipline (absent-is-safe shape already used everywhere in Data Dictionary #25/#26). Removing a working field/flag for zero behavioral gain is unnecessary churn. |
| D8 | De-risking value is **not** folded into `risk`; it is folded into `impact` as a bonus, computed only at `decompose` from the same `impact-analysis` blast-radius measurement D4 already reads (reused, not a new signal). The same raw number is legitimately read twice — once as `risk`'s discount input, once as `impact`'s bonus input — with opposite-direction mappings; this is not circular (neither field's calculation depends on the other's *output*, both read the same upstream measurement independently). | Resolves `risk`'s original directional ambiguity (does high risk mean "do sooner, de-risk early" or "do slower, be careful"?) by recognizing these are two different questions that were wrongly bundled into one field. Separating them makes both `risk` (always a brake) and `impact` (always a value) cleanly monotonic. |

## Pinned terms

- **Rough pass** — the `clarify`-stage `priority`/`impact` computation, using only signals available without a known code target (`blocks`, semantic scan, keyword `risk`, `urgent`, a default `effort` floor).
- **Refined pass** — the `decompose`-stage recomputation once `fgos-coding-planning`/`fgos-coding-validating` know the real `effort` (mode/flag-count) and the real blast-radius (`impact-analysis` capability, when present).
- **Discount vs bonus** — `risk` only ever *shrinks* the final `priority` score; de-risking value only ever *grows* `impact`. The two are never the same arithmetic term.

## Scout evidence cited

- `src/intake/discovery.mjs`, `src/intake/plan.mjs`, `src/intake/judge-executor.mjs` — `judgeDiscovery`/`judgeDecompose` are separate functions sharing one CLI verb; both nested `claude -p` calls run under `DEFAULT_RUNNER_CONFIG.executor.args`'s `--allowedTools 'Bash(git add:*),Bash(git commit:*)'` (`src/runner/dispatch.mjs:207-220`) — zero scout/tool access, confirmed by direct read, not inferred.
- `src/state/work.mjs` (Data Dictionary #25/#26), `docs/specs/work-state.md` RUL59, `docs/specs/runner.md` RUL42 — `priority`/`intent`'s current legal write-doors.
- `src/intake/classify.mjs:66-93` — `risk`'s current pure-keyword source, mirrors `tier`.
- `src/intake/plan.mjs` `risksGate` — `risk`'s only live consumer today, a brake (human-confirm gate), never an accelerant.
- `.claude/skills/fgos-coding-planning/SKILL.md` step 2 ("Mode gate") — existing mechanical flag-count, reused as `effort`'s source.
- `.claude/skills/fgos-coding-planning/SKILL.md:95-98`, `.claude/skills/fgos-coding-validating/SKILL.md:81-86`, `CLAUDE.md:10-33` — `tsk-1e4`'s `impact-analysis` capability-gate wiring (merged 2026-07-31), reused for D4/D8's blast-radius signal.
- `src/state/impact.mjs`, `docs/reference/rankimpact-sort-key-order.md`, `docs/reference/triage-table-columns.md` — `blocks`/`rankImpact`, confirms the CLI-visible column is `blocks`, not `impact` (naming-collision check for D3).
- `docs/backlog.md` STR7, STR8, STR14, STR40, STR67, STR68, STR92, STR93 — prior art on `priority`/`intent`, capability registries, and the `fgos-coding-exploring`/`judgeDiscovery` verdict-handoff bug (STR93) this exploration's own scout-reuse design mirrors.

## Related / prior-art items (not dependencies, same problem space)

- `tsk-ozl` — pre-existing, narrower bug on the same `discover` verb (see D1's correction above); now a `deps` entry of `tsk-2b0`.
- `tsk-2b0` (filed this session) — D1 (verb split) spun off into its own item, `deps: [tsk-ozl]` (confirmed by the person driving this exploration — bundling the two fixes on the same verb touch, not a strict technical blocker). Resolves the "ship as one item or several" question for D1's slice specifically.
- `tsk-1xx` (filed this session) — `add`/`edit` missing `--parent` flag; unrelated mechanism, found during the same research pass.
- `tsk-17w` (filed this session) — `fgos-coding-exploring` missing the `impact-analysis` capability-gate that `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement` already have (`tsk-1e4`, confirmed `status: done`). **Resolved (post-lock audit): NOT a hard dependency.** D3/D8's rough pass at `clarify` deliberately uses only `blocks`+semantic-scan (no capability query at all); the refined pass at `decompose` already has the capability-gate wired via `tsk-1e4` (done, not blocked on `tsk-17w`). `tsk-17w` would only make the *rough* pass at `clarify` slightly more informed — a genuine independent improvement, not a prerequisite this item's design needs to function.
- `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` — hand-authored reference doc capturing the pipeline's current (pre-this-feature) shape; this feature will need a follow-up pass over that doc once shipped.

## Outstanding questions deferred to `fgos-coding-planning`

- D1 (front-of-flow: verb split) is now its own item (`tsk-2b0`), filed and out of this item's scope. Remaining question for `fgos-coding-planning`: does the field-reorg half (D2-D8) still need splitting into more than one item, or is it one honest piece of work?
- Exact numeric tables for `weight(urgent)`, `discount(risk)`, `effort` mode→number mapping, and the `floor`/inversion constants — deliberately left as implementation detail, not locked here.
