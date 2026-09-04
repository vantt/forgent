# Current Cell: P10.4 (parallel with P10.2, P10.3 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-4`
Branch: `step-09-mvp6-to-mvp9-p10-4`
Next action: dispatch Doer

P10.1 closed and committed (`9b91aa9f`, cell-log fix `995ba45e`) —
`core/protocol-packs/group-thinking.json` (empty pack registry) and
`src/verbs/coordination/group-thinking-pack.mjs` (the public request
gate) now exist and are closed. P10.4 runs in its OWN isolated worktree,
parallel with P10.2 (RFC-Review-Lite, `.claude/worktrees/
step-09-mvp6-to-mvp9-p10-2`) and P10.3 (Nominal-Group-Lite, `.claude/
worktrees/step-09-mvp6-to-mvp9-p10-3`) — per this track's own documented
P06.1/P07.1 process-deviation lesson, no shared checkout this time.

## P10.4 — Delphi-Feedback-Lite Definition (Phase 10)

### Goal (plan's own cell text, phase-10-group-thinking-protocol-pack-conformance-and-closeout.md)
- Private inputs, mediated evidence-preserving aggregate artifact, and
  bounded next-round proposals.
- No claim of strong anonymity or statistical convergence.

### Shape and precedent
This is a REAL, pack-registrable protocol definition — not another proof
fixture. The closest structural precedent in this repo is
`core/coordination-protocols/deliberation-delphi-chain.yaml` (Phase 08,
MVP8's own proof: round-1 private proposals -> a MEDIATED, non-contribution
aggregate artifact -> round-2 proposals anchored to round 1, with a real
round-ordering negative test proving round-2 cannot link before the
mediated aggregate settles). **Do not copy that file verbatim or reuse
its `metadata.id`** — this cell's own definition is a genuinely new,
independently pack-registrable artifact. Read the Phase 08 fixture as a
mechanism precedent (how the mediated-aggregate step is wired, how
round-ordering is enforced), not a template to clone; decide this
protocol's real shape from the two bullets above and this cell's own
"-Lite" framing, and document your reasoning in P10.4.md.

**"No claim of strong anonymity or statistical convergence"** — the
mediated aggregate artifact is evidence-PRESERVING (every input's
provenance is traceable through the session's own replay/ledger, per
this whole track's "no chat history, no hidden driver prose" discipline)
but this definition must NOT claim or imply participant anonymity beyond
what the existing MVP6 context-grant mechanism actually provides, and
must NOT claim the aggregate represents a statistically convergent or
formally validated consensus. If your design doc, definition comments, or
test names slip into language implying either, correct it — this is the
same discipline P08.3's own Nominal-Group section already established
for "privacy" language (scoped correctly to context-injection control,
not information-theoretic secrecy).

**Bounded next-round proposals** — "bounded" likely means a real cap
(e.g. `maxRounds` on the relevant topology edge, or an equivalent
declared bound) — do not build an unbounded round-repeat loop; confirm
there's a real, testable ceiling.

**Per-actor provider/tier requirement (user-driven, session-recorded):**
see P10.2's own contract for the full framing — at least ONE of
P10.2/P10.3/P10.4 should demonstrate real `spec.actors[].policy.
{preferExecutor,minTier}` usage on at least one role. A Delphi panel's
distinct panelist-vs-mediator roles may be a natural fit — your call; if
you build it, prove it live (a real dispatch test showing two different
executors invoked). If you don't, say so plainly in P10.4.md's Gaps
rather than silently omitting it — the Coordinator will check whether at
least one of the three cells covered this before Phase 10 can be
considered to have satisfied the user's explicit requirement.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — full phase spec: this cell's own text, P10.2/P10.3's text (sibling
   cells, running in parallel — read to avoid metadata.id collisions),
   P10.5's text (what your definition/tests must hand off), and P10.8's
   text (the conformance lane your definition must later survive).
2. `core/coordination-protocols/deliberation-delphi-chain.yaml` —
   mechanism precedent (mediated-aggregate wiring, round-ordering
   enforcement), not a template to clone.
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.3.md`
   — read its Delphi round-ordering negative test and Design Notes in
   full.
4. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.1.md`,
   `P08.2.md` — the closed MVP8 contribution-lineage/aggregation
   mechanism this definition rests on (also read
   `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.3.md`/
   `P07.4.md` for the `aggregation-validated` mechanism if your mediated
   artifact needs it).
5. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`
   — the pack/gate this definition will eventually be registered through
   (P10.5's job, not yours).
6. `docs/architect/agent-coordination/contracts/flow-definition.md` —
   the full promoted FlowDefinition schema contract, including
   visibility windows, `contributions.allowedTypes[]`, aggregation, and
   the actor `policy` field table.
7. `src/runner/definitions/schema.mjs` — read the real, current schema.

### May Touch
- One new file under `core/coordination-protocols/` (your own naming,
  e.g. `group-thinking-delphi-feedback-lite.yaml` — pick a name that
  won't collide with P10.2/P10.3's own new files)
- A new test file under `test/runner/` or `test/verbs/` proving the
  definition validates and its intended chain (private inputs ->
  mediated aggregate -> bounded next-round proposals) runs end-to-end
  through the real engine doors (matching P08.3's method-chain test
  style: real dispatch, real replay reconstruction, no chat-history
  dependency), plus a real round-ordering/bound negative test.
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.4.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- `core/protocol-packs/group-thinking.json` (P10.1's registry — P10.5
  registers your definition into it, not you)
- `src/verbs/coordination/group-thinking-pack.mjs`, `core/skills/
  fgos-group-thinking/SKILL.md` (and its generated projections) — the
  shared gate/skill, off-limits to this cell per phase-10.md's own text
- `core/coordination-protocols/group-cognition-framework.yaml` (never)
- Anything under `src/runner/**` — if you find a genuine kernel gap,
  STOP and report it as a blocking finding rather than patching the
  kernel from this cell
- Any file P10.2/P10.3 would also plausibly touch — keep your footprint
  to files only THIS cell would ever create

### Acceptance
- New FlowDefinition validates against the real, current schema.
- The Delphi-Feedback-Lite shape (private inputs, mediated aggregate,
  bounded next-round proposals; NO strong-anonymity or convergence
  claims) is genuinely provable end-to-end, not just schema-valid,
  including a real round-bound negative test.
- `metadata.id` is genuinely unique (grep `core/coordination-protocols/
  *.{yaml,yml,json}` for existing ids before picking).
- Zero files outside this cell's May-Touch list touched.
- Focused suite green; full-repo sweep run from THIS worktree
  (uncommitted diff, matching P08.3/P09.3/P10.1's own established
  precedent) shows no new failures beyond the standing baseline
  (`fgos-intake-4.test.mjs:318`) and known load-induced flakes.
- Write `P10.4.md` in this track's established format. State explicitly
  whether this definition demonstrates the per-actor provider/tier
  requirement.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
