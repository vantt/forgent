# Lens persona evidence — 2026-10-09

Status: implementation present; live council acceptance BLOCKED, not complete. No component-boundary change.

## Existing seam and wording
Dry probe used unchanged `runPanel` + `renderBrief`, with `params.roleTasks[panelist-N]`; each generated `brief-1.md:19` carried a different experiment persona path (socrates, torvalds, meadows). This was a local no-provider dry run, not a completed Workflow. Original `panel.mjs:66` passes params; `role-tasks.mjs:59,65` selects and wraps each role's task. Template `persona` alone remains unit-wide; no per-seat binding persona was invented. Prior art: commit `8a2373937` introduced advisory per-seat roleTasks. The dry probe and temporary control definition were removed after use.
Three source postures reuse the experiment's methods. Method/blind spot/ending rule fit in description, so renderer is unchanged. Removed predetermined preference for small/boring designs, compulsory opposition, and structural-over-local fixes; facts may support any option or agreement. Each posture explicitly permits agreement and requires evidence, unknowns, and reversal conditions.

## Named real runs
Council: `council-lite`, `wf-run-1791538986970-a1b16b5d`, Unit `unit-run-1791538986978-69c183a0`; terminal outcome `blocked`, no synthesizer execution.
Control: temporary `council-control`, `wf-run-1791539210705-f6d6d689`, Unit `unit-run-1791539210716-5c6e1464`; `completed/pass`. It used solo with `params.role: panelist-1`, same capability, request, blind mode, cwd, Claude/Sonnet/standard; no persona instructions or persona refs. Solo omits peer-independence checks; no peer reports reached the compared panel seat either. This is one paired observation, not causal proof.
Question: manual triage 20 min/day, 2/100 misroutes weekly caught within one day; classifier 3 engineer-days plus 0.5 day/month; weekly audit of 20 requests costs 15 min; accuracy untested. Compare manual, immediate automation, and two-week shadow trial without changing manual decisions. The exact request is persisted in both Workflow events.
Evidence root: `/home/vantt/projects/forgentX/.fgos/assignments/`; below, all briefs/reports are under `<Unit>/<role>/1/runs/01/`.

| Seat | Real brief evidence | Report/method evidence | Settlement |
|---|---|---|---|
| panelist-1, Claude/Sonnet | `brief-1.md:29`: council-assumptions; refs at 34–36 | `outbox/report-1.md:12–15`: three tested assumptions, disproved vs unknown; 22–30: manual position and reversal conditions | pass |
| panelist-2, OpenAI/gpt-5.6-terra | `brief-1.md:29`: council-ship-maintain; refs at 34–36 | No report: agent not briefed; `stderr.log:1` and `result.json:146–147` show `Continue anyway? [y/N]:` | blocked |
| panelist-3, Gemini/gemini-3.8-flash-medium | `brief-1.md:29`: council-feedback-loops; refs at 34–36 | `outbox/report-1.md:14–73`: chains, balancing/reinforcing loops, delays/signals; 90–119: shadow trial and reversal conditions | policy-refusal |
`bind()` chose distinct provider families; Codex capacity selection records account `fgovn`. All binding personas are null by design: task posture is conveyed through roleTasks and source refs, not actor identity.

## Paired comparison
Persona report: council Unit `panelist-1/outbox/report-1.md:12–15,22–30`. Control report: control Unit `panelist-1/outbox/report-1.md:9–26,30–34` (full paths use the layout above).
Both choose manual for now, reject immediate automation, and condition a shadow trial on additional justification. Both calculate roughly 2 hours/month net savings and a 12-month payback, and question a 200-request trial's ability to prove accuracy parity. Persona adds explicit three-level assumption tests/status labels; control organizes cost/options instead. No clear substantive stance/reasoning improvement demonstrated; do not claim the persona moved the stance or improved quality from this pair. Both summaries remain unmeasured (no stanceOptions).

## Separate execution issues and verification
Worktree creation completed but its hook printed `git: 'hook' is not a git command`. No hook/config repair attempted. Codex trust dialog blocked its seat before brief delivery; no manual configuration relocation or provider override attempted.
Gemini's read-only refusal was caused by my concurrent CHANGELOG/spec edits: `evidence.json:39–45` lists exactly those two files. This is contaminated operator timing, not evidence of agent mutation. The report itself exists but is not a passing seat result. No runtime fix is in scope; retry the council only after the external launch blocker is resolved and with no concurrent repository edits.
Projection: `node scripts/project-agents.mjs` and `npm run build:skills`; only new generated `.claude/agents/council-*.md` retained. The agent projector also rewrote six unrelated adapters; those generated changes were restored explicitly. No render output was hand-edited; core/skills, .agents and plugins have no retained changes.
Narrow tests: 36/36 pass (`project-agents`, `discussion-workflows`, `role-tasks`), with CLAUDE_CODE_SESSION_ID unset. First full suite: 7020 tests, 6947 pass, 0 fail, 8 skipped, 65 todo; command exit 1 because my scratch deletion during execution triggered the store-leak guard. Scaffolding removed before the second full run.
GitNexus worktree-scoped detect_changes attempted, but the worktree is not registered/indexed; it returned Repository not found. No function/class/method was edited; graph scope certification is unavailable, not claimed.
Next: resolve the external Codex launch dialog outside this scope; rerun all three seats plus synthesizer. Only then close live acceptance. Next phase adds per-seat restatement before analysis; it is not implemented here. The paired observation does not justify claiming a quality gain; broader blind remeasurement remains separate.
Final full run: `env -u CLAUDE_CODE_SESSION_ID npm test` exited 0: 7020 tests, 6947 pass, 0 fail, 8 skipped, 65 todo; no store leak. No rust-host failure. No runtime/renderer change.
Retained additions: source personas 51 lines; generated personas 72; workflow 40; report 34; CHANGELOG/spec 2. Total 199 lines, zero deletions; outside source personas 148 lines against approximately 150 (stop threshold 225). Counting generated personas conservatively as outside source personas.
