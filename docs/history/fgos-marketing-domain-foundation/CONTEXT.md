# fgos-marketing-domain-foundation — CONTEXT

Locked decisions for the multi-role team-harness design and the
marketing-cockpit foundation absorption. Full discussion history, scout
evidence, and rationale live in `DISCUSSION.md` (same directory, 8 rounds,
2026-08-15). This doc is the exploring-stage decision record
`fgos-coding-planning` consumes; the first buildable slice is scoped by
the item's `refs` anchor `DISCUSSION.md#task-role-axis-coding`.

## Feature boundary

In scope: a mechanical core harness for multi-role agent teams —
role/holder axis, guarded handoff (call/pass), hard/soft one-way gates,
task-spec contract convention, and per-domain workflow multiplicity —
implemented for the `coding` domain first, then the `marketing` domain
(absorbing marketing-cockpit's skills/task-specs) on the proven harness.
Out of scope for the first slice: signal bus (deferred until a real
fan-out use case), judge-gate runner (blocked on the L5 DoD question,
only needed for marketing), scheduler/cron primitive, team-level shape
overlay on top of domain.

## Locked decisions

All eight minted via `fgos decision --id tsk-2t9c` during the shaping
discussion (event seq in table); DISCUSSION.md §4 is the same table with
round-by-round provenance.

| D-ID | Decision | Seq |
|------|----------|-----|
| D1 | Work item gains a third orthogonal axis `role/holder`; verb `handoff` guarded by a per-domain `roleGraph` declared in DOMAINS; an off-graph route is REFUSED and the refusal lists the legal edges | 18029 |
| D2 | Coding-first sequencing: lift coding's four existing implicit interactions (fgos-researching = consult, code-review = review, subagent fanout = assist, ask/answer = advise) into visible guarded handoffs first; marketing lands afterward on the proven harness | 18030 |
| D3 | Mechanism/policy split: harness guards legality + writes truth + wakes the right role, never judges; soul (agent-type) understands its role/problem/support needs and freely picks among legal edges | 18031 |
| D4 | Handoff has two kinds — call (round-trip, ball returns to sender; 4 reasons: advise/assist/review/consult; generalizes ask/answer) and pass (one-way stage transfer). Same item → handoff; different item/tree → signal | 18032 |
| D5 | One-way gates by principle: hard one-way ⟺ crossing produced a side effect beyond the item/worktree boundary (merge to main, external publish, terminal done/wontfix, cleanup-deleted worktree); every intra-item gate is soft — re-crossable with a mandatory recorded reason | 18058 |
| D6 | Task-spec A-lite: contract (task-spec: input/output/gates/verify-template, declared file per domain, cockpit `.fgOS/tasks/` model) separated from know-how (skill); skillMap points stage → (task-spec, skill); initially read-first material via refs, no engine enforcement | 18059 |
| D7 | Declaration hierarchy domain → N workflows → item; selector reuses `kind` via a `workflowFor: {kind → workflowName}` map with a default; coding un-merges into feature (current graph, default) / bugfix / lightweight; workflow (one item's shape) ≠ template (multi-item composition, `fgos expand`) | 18060 |
| D8 | Async call (parked for another role) = full handoff event, holder changes; sync in-session call (subagent) = single compact `call-summary` event on completion, holder unchanged. Invariant: holder changes only via async handoff. Nested calls allowed with a capped callstack | 18070 |

## Pinned terms

- **workflow** — the lifecycle shape of ONE item (stage graph + gates +
  stepMap), declared per domain, selected by `kind`. Never the multi-item
  sense.
- **template** — a declarative recipe `fgos expand` stamps into an item
  tree (parent + children + prewired deps). The multi-item sense.
- **call / pass** — the two handoff kinds per D4.
- **hard / soft gate** — per D5's boundary-side-effect principle.
- **role ≠ capacity** — roleGraph picks the role holding the work;
  `src/runner/dispatch.mjs` (decide/execute one-door) picks the executor
  running it. Router/driver (fgos-routing, fgos-coding-driving) remains
  the who/what-next layer.

## Scout evidence (paths verified during the discussion)

- `src/state/workflow-stage-graphs.mjs` — DOMAINS registry; line 346:
  coding kind vocabulary `bug/chore/design/docs/feature/task`
  (domain-owned classification) — basis for D7's kind-as-selector.
- `src/state/work.mjs`, `status-fsm.mjs`, `stage-fsm.mjs`,
  `src/state/frontier.mjs`, `src/runner/loop.mjs`, `dispatch.mjs` —
  engine already multi-domain via `getDomain(item.domain)`; no hardcoded
  stage literals.
- `fgos ask`/`answer` + `awaiting-human` — existing call-to-human
  round-trip the handoff-call generalizes (D4).
- `upstreams/marketing-cockpit/.fgOS/` — tasks/ (30+ typed task specs),
  workflows/ (25), orchestration/{routing,delegation,priority}.yaml,
  runtime/config/domain-signal-catalog.yaml, runtime/state.yaml —
  mapped by scout agents; comparison verdicts in DISCUSSION.md §5.
- Single-graph strain evidence for D7: discovery-verdict skip branch,
  bug prove-cause rule vs feature flow, docs/chore ceremony overhead.

impact-analysis: degraded — GitNexus registered and `present`
(`fgos tool query`), but its index is behind current HEAD (stale per
analyze-hook report at exploring time); blast radius from it is not to be
trusted without an rg cross-check.

## Canonical references

- `DISCUSSION.md` (this directory) — full 8-round record, §6 synthesis,
  §7 candidate task list with anchors.
- `docs/routing-handoff-contract.md`, `docs/specs/work-state.md`,
  `docs/specs/runner.md` — contracts the harness extends.
- `docs/platform-foundations.md` L5 — the DoD law the deferred
  judge-gate question (#7) must be reconciled with at marketing time.

## Deferred to planning

- Concrete callstack ceiling for nested calls (number, global vs
  per-domain) — the ceiling's existence is D8-locked; the value is an
  implementation choice the user explicitly delegated to planning.
- Split shape: DISCUSSION.md §7 lists seven candidate tasks with
  anchors, sibling relations, and draft verify commands — planning owns
  whether/how to split and in what order (D2 fixes only
  coding-before-marketing).

## Outstanding questions

None
