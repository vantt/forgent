# Opus design review: hosting council-like protocols in fgOS (2026-10-04, read-only)

Scope: the panel synthesizer fix, the two hand-off mechanisms, and how flexible fgOS is for council-style protocols.
Status from the reviewer: DONE_WITH_CONCERNS. Verbatim findings below; the lead's follow-up notes are at the end.

## Findings by severity

**HIGH 1. Blind roles are not actually blind.** bwrap `--ro-bind / /` lets any confined worker read all of the main `.fgos/assignments/`, including sibling panelists' outboxes and every seat's round-1 report. Ref paths also carry the seat name (`.../panelist-2/1/outbox/report-1.md`). So "blind" and "anonymized" hold only by convention. Matters directly for council's blind round and cross-examination. Separate from the fix itself.

**HIGH 2. The report is found by file-name guessing in two places, and they disagree.** `src/runner/execution/role-input-refs.mjs:10-11` hardcodes `report-\d+.md` / `agent-report.md` and takes the first match, not the highest N. `src/workflow/runner.mjs:54` only checks `endsWith('agent-report.md')`, so it misses herdr's `outbox/report-N.md` and drops those reports silently. Production produces both names: herdr writes `report-${round}.md` (`dispatch/brief.mjs:43`), the cli path writes `agent-report.md` (`assignment.mjs:412`, `:882`). Dispatch knows the exact path when it builds the brief but never records it. Right fix: a typed `evidence.report` (and `evidence.claim`) field written by dispatch; both consumers read it; the regexes go away.

**HIGH 3. Persona and other template data in Workflow YAML are silently dropped.** `definition.mjs:269` parses `template.persona` and `taskSpec`, but `runner.mjs:253-263` never copies them into `unitData`, so `persona: panelist` / `synthesizer` in `delphi.yaml` has no effect. `pattern` is forced to a string (`definition.mjs:265`), so YAML cannot pass pattern params (role array, `members`) although `resolvePattern` accepts the object form (`presets.mjs:71-86`).

**MED 4. Raw `unit-run:` refs reach workers.** `run.mjs:322` copies `unit.inputs` into `contextRefs`; the `unit-run:<id>/<role>` grammar is validated (`unit.mjs:18,44`) but never resolved, so a worker receives a string that is not a path.

**MED 5. Per-role data never reaches the brief.** `dispatchBound` uses the outer `unit.objective` / `unit.inputs` (`run.mjs:309,322`), not `rUnit`. A pattern cannot give a seat its own objective or inputs: restate gate, cross-exam prompt, "seat B sees A and C" are blocked.

**MED 6. Workflow hand-off drops panelists and truncates.** `runner.mjs:51` keeps only the last result per unit (for a panel that is the synthesizer) and inlines at most 6000 chars (`:26`). The comment at `:29-31` (".fgos is closed to workers") is contradicted by the verified read access.

**LOW 7. The edit site is right, with one gap.** `dispatchBound` is correct; resume/fallback safe (`history()` returns `runResult`, `assignment.json` written once). `inputs = []` default is not a compatibility shim. Absolute paths fine under `--ro-bind /` except a checkout under `/tmp`. Acceptance rested on one live run; claude-herdr's read never verified.

## The one hand-off mechanism to converge on

`contextRefs` holding report paths, with the existing `unit-run:<unitRunId>/<role>` grammar as the portable reference, resolved in one place.
1. Dispatch writes `evidence.report`.
2. `role-input-refs` reads that field and also resolves `unit-run:` refs from that unit run's `history()`.
3. `buildUnitObjective` stops inlining report text; it emits `unitData.inputs = ['unit-run:<id>/<role>', ...]` for every result of the steps it depends on (the id is in the `unit.complete` payload, `runner.mjs:313`). The short `agentClaim.summary` may stay inline.
Deletes the 6000-char inline path and the `endsWith` lookup, and fixes the dropped Workflow reports.

## Council ingredients: what each needs

| Ingredient | Today |
|---|---|
| Persona per seat | Data via `overrides` `scope.role` (`bind.mjs:88`); YAML cannot carry it until finding 3 is fixed |
| Separate chairman | Data (synthesizer, `independentOf`, `panel.mjs:80`) |
| Blind parallel round | Data in the pattern, blindness not enforced (finding 1) |
| Restate gate | Data (a panel step), needs finding 5 for per-seat text |
| Anonymized cross-exam | Needs primitive B |
| Rounds with a stop condition | Needs primitive C (Delphi unrolls a fixed two rounds) |
| Dissent quota / agreement check / extra calls | Needs primitive C plus structured claims; `reviewed`'s `verify` hook is prior art |
| Confidence-weighted tally / genuine split | A check script over `agentClaim` JSON; split routed to the existing human gate (`runner.mjs:177`) |
| Outcome ledger | New, Observe area, out of scope |
| Human transcript | Read-only projection over `brief-N.md` + `contextRefs` + outbox + `unit.json` bindings; almost free after finding 2 |

Smallest generic primitives, by leverage:
- **A. Template pass-through:** YAML `persona` and `params` (seats `[{role, persona, objective}]`) flow into `unitData` and the per-role unit (findings 3, 5).
- **B. Input selector with optional `anonymize`:** copy selected reports into the role's own assignment directory under neutral names (`seat-A.md`), list only those as refs.
- **C. Generic loop on a Workflow step:** `repeat: {max, until: <check-cmd>}` plus `when:`; the check reads results JSON and exits pass or names the next step.
- **D. Read confinement:** bind only the assignment directory and granted refs instead of `/`, so blindness becomes real (touches confinement authority: check `docs/platform/component-boundary.md`).

## Conflicts with laws and docs
Hardcoded file names / role names in the runner (`role-input-refs.mjs:10`, `runner.mjs:54`, `run.mjs:396` `role !== 'producer'`); dead declared data (finding 3); RUL11: two hand-off paths and two report names, consolidate before adding council features. Prior art step was done well (plan.md:25-29).

Open question from the reviewer: is it acceptable for `buildUnitObjective` to stop inlining text? It depends on agents actually reading refs, which rests on two live runs so far.

## Lead's follow-up notes
- Finding 2 matches the lead's own suspicion about `agent-report.md`; now confirmed by the reviewer from code, not yet reproduced live.
- Finding 1 is stronger than the lead had stated: absolute read access is the same property that made the fix work.
- Not yet checked by the lead: findings 3, 5, 6 line numbers (taken from the reviewer).
