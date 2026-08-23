# tsk-3xo — domain-agnostic stage literals in discover/decompose

## Feature boundary

A second (non-`coding`) fgOS domain whose registry maps a stage to
`Clarify`/`Divide` cannot cross those stages: `bin/fgos.mjs`'s sync CLI
gates and `src/intake/discovery.mjs`/`src/intake/plan.mjs`'s internal
`moveStage` calls hardcode the literal stage names `'clarify'`/
`'decompose'`/`'executing'` instead of resolving them via
`stageForStep(getDomain(work.domain), step)`
(`src/state/workflow-stage-graphs.mjs`). This item replaces those literals
with the domain-aware resolver at all 7 confirmed call sites, adds the
regression test that currently doesn't exist, and corrects a stale doc
comment that mis-describes the failure mode.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope includes Finding 3's doc correction, not just Finding 1's literal-replacement fix: also fix `src/state/workflow-stage-graphs.mjs:32-40`'s comment (currently claims a domain-2 item hitting a Clarify/Divide-mapped stage gets its stage "silently overwritten" — re-verified false, see Evidence below: `stage.mjs`'s `transitionStage` throws a loud `FsmError` instead) and correct the matching stale claim in `tsk-3w3`'s first decision-log entry ("domain khac se bi ghi de stage am tham, khong loi"). Same file/comment neighborhood as the D-decision-driven fix, no extra file-scope cost. User-confirmed 2026-08-04 after the divergence was surfaced (report §5 "Item A" recommended bundling it; the item's own filed description omitted it). |
| D2 | `tsk-3xo` is a child of `tsk-3w3` (multi-domain-readiness milestone), no dependency on `tsk-38t`. Not asked as a fresh question — already converged, unanimously, across two independent evidence sources written before this session started: the report's own §5 recommendation, and `tsk-3w3`'s own third decision-log entry (06:49 timestamp) proposing exactly this. No dissenting evidence found. Executed via `fgos edit tsk-3xo --parent tsk-3w3` as part of this stage. |
| D3 | Adjacent gap (decompose.mjs's child `addWork`, lines 741-756, never propagating `work.domain` to children) stays OUT of this item's scope — item's own filed description already states this explicitly ("chua fix trong item nay"), consistent with the report's own open-question #3 (log as 4th finding or leave for later, undecided either way — this item does not need to resolve that question, only avoid touching that code path). |

## Pinned terms

- **"the 7 call sites"** — `bin/fgos.mjs:955` (`discover` verb gate),
  `bin/fgos.mjs:979` (`decompose` verb gate), `discovery.mjs:593-599` and
  `discovery.mjs:663-669` (2× `moveStage(..., to:'decompose',
  expectedStage:'clarify', ...)`), `decompose.mjs:542,604,685,759` (4×
  `moveStage(..., to:'executing', expectedStage:'decompose', ...)`). All 7
  confirmed present at exactly these lines by direct read during this
  stage (2026-08-04).
- **"the proven pattern"** — `bin/fgos.mjs:744-745`'s existing
  `stageForStep(getDomain(opts.domain, {onUnrecognized:()=>{}}),
  'Clarify') ?? getDomain(...).stages[0]` in `submitWork`, the one place
  in the codebase that already does this exact substitution correctly.

## Scout evidence

- `src/state/workflow-stage-graphs.mjs:141-158` — confirmed
  `getDomain(name, opts)`, `stageForStep(domain, step)`,
  `skillForStage(domain, stage)` signatures; `stageForStep` returns
  `undefined` when the domain declares no stage for that step (relevant to
  the new test's "lands on the domain's own correct next stage" assertion).
- `bin/fgos.mjs:952-966` (`discover` verb) and `:976-987` (`decompose`
  verb) — confirmed the two hardcoded `if (stage !== 'clarify'|'decompose')`
  CLI gates read exactly as described; `work.domain` is available at both
  call sites via `listWork(dir).work[id]`.
- `src/intake/discovery.mjs:593-599,663-669` and
  `src/intake/plan.mjs:542,604,685,759` — confirmed all 6
  `moveStage(...)` literal call sites.
- `src/state/workflow-stage-graphs.mjs:32-40` — confirmed the stale
  doc-comment text targeted by D1's doc correction.
- `fgos tool query --capability impact-analysis --status present` (run
  fresh this stage, 2026-08-04) → `gitnexus` present, one provider,
  `status: "present"`. Per `CLAUDE.md`'s capability gate: **full** mode —
  the project's GitNexus MUST-run-`impact()`-before-editing rule applies
  as written when this item reaches `executing`.

## Canonical references

- `plans/reports/internal-research-260804-1230-routing-coding-driving-domain-gap-plan-report.md`
  — source report, §3 "Finding 1" (the bug + fix shape + new-test spec),
  §5 "Item A" (this item's own recommended scope, including the D1
  bundling this stage confirmed), §7.5 (diagram of where all 4 findings
  sit).
- `tsk-3w3` decision log (`fgos show tsk-3w3 --json`) — 3 entries, the
  first of which carries the stale "silently overwritten" claim D1
  corrects, the third of which proposes the D2 parent relationship this
  stage confirmed and executed.

## Outstanding questions deferred to planning

None — the fix shape, exact call sites, and new-test spec are already
fully specified by the source report and the item's own description;
`fgos-coding-planning` should confirm whether this is simple enough to skip
straight to `executing` or still needs a written plan, not re-derive any
of the above.
