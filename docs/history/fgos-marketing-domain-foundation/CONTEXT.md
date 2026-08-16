# fgos-marketing-domain-foundation — CONTEXT

Locked decisions for the multi-role team-harness design and the
marketing-cockpit foundation absorption. Full discussion history, scout
evidence, and rationale live in `DISCUSSION.md` (same directory,
2026-08-15); `design-distill.md` is the quick-reference version. This doc
is the decision record `fgos-coding-planning`/`fgos-coding-validating`
consume; the first buildable slice is scoped by the item's `refs` anchor
`DISCUSSION.md#task-role-axis-coding`.

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

All thirteen minted via `fgos decision --id tsk-2t9c` (event seq in
table); DISCUSSION.md §4 is the same table with round-by-round provenance.

| D-ID | Decision | Seq |
|------|----------|-----|
| D1 | Work item gains a third orthogonal axis `role/holder`; verb `handoff` guarded by a per-domain `roleGraph` declared in DOMAINS; an off-graph route is REFUSED and the refusal lists the legal edges | 18029 |
| D2 | Coding-first sequencing: lift coding's four existing implicit interactions (fgos-researching = consult, code-review = review, subagent fanout = assist, ask/answer = advise) into visible guarded handoffs first; marketing lands afterward on the proven harness | 18030 |
| D3 | Mechanism/policy split: harness guards legality + writes truth + wakes the right role, never judges; soul (agent-type) understands its role/problem/support needs and freely picks among legal edges | 18031 |
| D4 | Handoff has two kinds — call (round-trip, ball returns to sender; 4 reasons: advise/assist/review/consult; generalizes ask/answer) and pass (one-way stage transfer). Same item → handoff; different item/tree → signal | 18032 |
| D5 | One-way gates by principle: hard one-way ⟺ crossing produced a side effect beyond the item/worktree boundary (merge to main, external publish, terminal done/wontfix, cleanup-deleted worktree); every intra-item gate is soft — re-crossable with a mandatory recorded reason | 18058 |
| D6 | Task-spec A-lite: contract (task-spec: input/output/gates/verify-template, declared file per domain, cockpit `.fgOS/tasks/` model) separated from know-how (skill); skillMap points stage → (task-spec, skill); initially read-first material via refs, no engine enforcement | 18059 |
| D7 | Declaration hierarchy domain → N workflows → item; selector reuses `kind` via a `workflowFor: {kind → workflowName}` map with a default; coding un-merges into feature (current graph, default) / bugfix / lightweight; workflow (one item's shape) ≠ template (multi-item composition, `fgos expand`) | 18060 |
| D7a | **Amendment to D7 (mechanism-first).** Piece 2 lands the hierarchy and the `workflowFor` selector with exactly ONE workflow registered — `feature`, carrying today's graph byte-for-byte, with every `kind` mapping to it — proving the mechanism at zero migration risk. The `bugfix` and `lightweight` graphs become a separate later item, shaped once real operating data exists. D7's hierarchy, selector and workflow-vs-template distinction all stand unchanged; only "un-merge into three graphs now" is deferred | 18248 |
| D8 | Async call (parked for another role) = full handoff event, holder changes; sync in-session call (subagent) = single compact `call-summary` event on completion, holder unchanged. Invariant: holder changes only via async handoff. Nested calls allowed with a capped callstack | 18070 |
| D9 | Task-spec must carry a Collaboration section: a trigger-prose table per call edge, declared per (workflow, stage) — when to call, which reason, to which role, what the returning ball carries. Three-layer split: prose teaches (task-spec), soul decides (may judge not to call), guard blocks (roleGraph). Off-pattern calling is surfaced to compound-learn via call-summary/handoff events | 18110 |
| D10 | Four-layer ontology: task-spec (contract) / skill (executor know-how) / knowledge (domain expertise — mostly model weights for coding, real file assets for marketing) / context (instance facts — the existing refs/docs layer). Grow-tasks-before-roles principle; coding roleGraph closes at 5 positions with ~13 task-specs. Job titles (PO/PM/TechLead/SE/Tester) are soul-layer personas: a per-team roster bundles positions + task allowlist + authority per title, never encoded into the harness. Classic PM duties are already mechanized (frontier/triage/stale/merge) | 18189 |
| D11 | Soul↔role binding for teams larger than the role set: role is a per-item attribute, not a team seat. (1) A call addresses (position, task-spec) and resolves by pull — it lands in the frontier as a small work-order; eligible souls claim it, never push-assigned. (2) Sticky within a call-thread — later rounds of the same thread return to the soul holding its context; a new thread rebinds freely. (3) Targeted calls (`--to-soul`) are a deliberate exception; the guard still checks only position legality, and the targeting is event-logged for compound-learn. Fewer souls than roles (solo) degrades gracefully: one soul carries many titles, claims its own calls, self-review stays visible in the log | 18229 |
| D12 | Title/persona = the existing agent-type definition (`.claude/agents/*.md`, spawnable via subagent_type; fgOS already projects agent definitions). Eligibility is declared by ONE new frontmatter field `claims: [task-spec list]` on the agent-type — positions are derived from the claimed specs. The claim event records (sessionId, agent-type). Concurrency uses existing worker-slots; spawn-on-demand uses the existing runner/dispatch path. No roster file, no humans registry, no agent-pools — human authority stays in the pull-door verbs until a real multi-human team exists. Surviving idea from the roster draft: a soul instance is a runtime record born at claim, never config | 18232 |
| D14 | `fgos-coding-implement` wired to actually call `handoff`/`handoff-return` at 3 points: (1) Orient reclaim (holder != implementer on re-entry → `handoff-return` before anything else); (2) Implement collaboration (consult/assist log a `call-summary` after the finding/work-product; advise fires the `handoff` async call BEFORE `fgos ask`); (3) Return — the `handoff --to reviewer` call fires ONLY after `return`/`catchup` actually succeeds, never before (self-review found the naive before-return ordering would mark `holder: reviewer` even on a run that turns out `blocked`) | 18355 |
| D13 | Artifact-schema enforcement splits in two: the harness supplies the validator and the chokepoint (validate BEFORE dispatch so no orphan child work is created, machine-readable structured errors so an agent can self-repair, always a soft path recording a reason rather than a hard block); the schemas themselves are domain data declared beside the task-specs, never inside the engine. The declaration-schema family (agent/skill/workflow/runtime) is learned now, as piece 3's doctor checks; the artifact-schema family (~33 cockpit files: brief/slot/calendar/persona/brand-profile) arrives with the marketing port and is deliberately NOT built for coding, whose artifacts are prose, not structured data | 18242 |
| D15 | `fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating` wired to call `handoff`/`handoff-return` for real, same rigor as D14. Two real gaps found while wiring (not by design review alone): (1) `roleGraph` had zero edges at stage `discovery` — wrong "machine-only = no interaction" assumption; discovery genuinely dispatches `fgos-researching` (real consult), so the edge was missing and `judge-ambiguity.md` wrongly claimed an `advise` row there too — both fixed. (2) `shape-plan.md` and `validate-plan.md` both wrongly listed `advise (async)` rows for triggers that actually resolve live, in-session — planning's `CONTEXT.md`-gap hands back to exploring as a skill dispatch (only exploring's own re-entry decides whether a real park happens), and validating's Gate has no `fgos ask` anywhere, only live `gate-approve --actor human` — both tables corrected. Also distinguished capacity-dispatch (swaps executors, same task) from consult-via-`fgos-researching` (a different named helper skill) after almost conflating them while wiring exploring | 18381 |
| D18 | Real end-to-end run (a fresh agent driving a real item, `tsk-ogx`, through the actual coding-domain skill flow) found the D14 review handoff never fires in practice, even on a genuinely successful return — first attempt was a NULL EXPERIMENT (agent's isolated worktree defaulted to `main`, which has none of this feature; caught by `git show main:bin/fgos.mjs \| grep "case 'handoff'"` → 0 hits), re-verified for real on `fgw/tsk-2t9c`. Root cause (Opus diagnosis, independently checked against the actual prose): the Return-step instruction is imperative but trailing, duplicated once per door into `awaiting-approval` (`return`/`catchup`), and nothing gates on a skip — no error, no red test. Fix: `moveWork` now fires the review handoff itself as a side effect of reaching `awaiting-approval`, mirroring D16's `to==='delivered'` auto-close exactly (same `roleGraph` opt-in guard, same fail-safe try/catch, same "every door converges on one call" argument). `fgos-coding-implement`'s Return step rewritten to describe this instead of instructing it; the `## Next` section's silent contradiction fixed. Also fixed a secondary gap the driving agent found unprompted: `fgos take` (vs `fgos pick`) leaves no registered worktree path back to `return`, undocumented in every skill — `return`'s refusal now names `fgos session start` on its own line | 18413 |
| D17 | Resolved the Opus-flagged workflow/kind gap (see D16's own follow-on discussion): `kind` selects an item's workflow/stage graph but was freely editable at any stage/status. User rejected a "frozen `work.workflow` field + validated change-verb" as reopening the same hole in disguise, and proposed the actual fix: lock `kind` edits once `status` leaves `todo`. Verified this holds — claim (`todo`→`doing`) happens only right before the FIRST `executing`-stage invocation (`fgos-coding-driving`'s own hard rule), so discovery/exploring/planning always run pre-claim; `fgos discover`'s own classification patch (the one legitimate post-`submit` kind-write) always fires while `status` is still `todo`, so the new guard never blocks it. No new field, no new write door, no validated-change verb — `kind` simply stops being live once it would matter. Updated `resolveWorkflow`'s own doc comment (previously implied `domain.stages` "stays valid to read directly" as a durable fact; now correctly attributes that safety to the kind-lock invariant, not coincidence) | 18383 |
| D16 | Independent review (fresh code-reviewer agent) of D14+D15 found 2 HIGH + 3 MED + 4 LOW findings, all fixed. HIGH: `fgos-coding-implement`'s reclaim never ran on the automated `fgos-coding-driving` loop path (it depended on a status re-check that path skips) — fixed generically INSIDE `fgos-coding-driving` itself, not `fgos-routing` (driving reuses routing's registry data but never re-invokes routing as a skill each iteration, per its own D12 comment; a routing-only fix would not have closed the gap). Matches the user's stated longer-term vision: `fgos-routing` = cross/inter-domain routing, `fgos-coding-driving` = the in-domain mechanical spine, deliberately built domain-neutral in its own body already (D12) so this fix generalizes to future domains/workflows for free. HIGH: the `review` handoff never closed on the `approve` path — `holder` stuck at `reviewer` forever on every delivered item; fixed in `moveWork` (`store.mjs`): `to==='delivered'` now loops closing every open call frame, best-effort/fail-safe, sequential after the original lock releases (never nested). MED: exploring's immediately-answered `fgos ask` left `holder: human-advisor` mid-session with no outgoing edges — added an inline reclaim right after the ask/answer pair. MED: all 5 skills' reclaim blocks fired `handoff-return` exactly once, insufficient for a depth-2 nested call — now loop until `holder === implementer`. MED: `implement-item.md`'s Collaboration table claimed `review` fires on "verify green OR HIGH-risk area" — the OR half was never built; corrected to verify-green only. MED-LOW: `roleGraph.edges` had no `decompose` key (legacy pre-rename alias of `planning`, same `skillMap` target) — added as the same array reference, never a copy. LOW: unified reclaim/consult-log wording across all 5 skills. Also fixed in the area: `judge-ambiguity.md`/`compound-learn.md` were registered in `taskSpecMap` since piece 3 but never cited from their own skills — wired both; `write-a-task-spec.md` claimed "six" stage-owned task-specs, `taskSpecMap` has always had five — corrected. Reviewer's Q4 (`validate-plan.md` not in `taskSpecMap`) confirmed NOT a bug — it's a sub-task within `planning`'s own gate, correctly excluded from a genuinely stage-granular map | 18382 |

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
