# Current Cell: P10.3 (parallel with P10.2, P10.4 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-3`
Branch: `step-09-mvp6-to-mvp9-p10-3`
Next action: dispatch Doer

P10.1 closed and committed (`9b91aa9f`, cell-log fix `995ba45e`) —
`core/protocol-packs/group-thinking.json` (empty pack registry) and
`src/verbs/coordination/group-thinking-pack.mjs` (the public request
gate) now exist and are closed. P10.3 runs in its OWN isolated worktree,
parallel with P10.2 (RFC-Review-Lite, `.claude/worktrees/
step-09-mvp6-to-mvp9-p10-2`) and P10.4 (Delphi-Feedback-Lite, `.claude/
worktrees/step-09-mvp6-to-mvp9-p10-4`) — per this track's own documented
P06.1/P07.1 process-deviation lesson, no shared checkout this time.

## P10.3 — Nominal-Group-Lite Definition (Phase 10)

### Goal (plan's own cell text, phase-10-group-thinking-protocol-pack-conformance-and-closeout.md)
- Private proposals, controlled sharing, clarification, and private rank
  contributions.
- No formal tally/winner semantics in this step.

### Shape and precedent
This is a REAL, pack-registrable protocol definition — not another proof
fixture. The closest structural precedent in this repo is
`core/coordination-protocols/deliberation-nominal-group-chain.yaml`
(Phase 08, MVP8's own proof: two private proposals -> controlled reveal
-> clarification anchoring both -> two private rank contributions;
"private" proven via the pre-existing MVP6 `authorizeDeclaredOperation`
context-grant gate, not a new secrecy mechanism — P08.3's own Design
Notes explain WHY a self-referential visibility window can't gate a
proposal directly, and how the proof was structured around that
constraint). **Do not copy that file verbatim or reuse its
`metadata.id`** — this cell's own definition is a genuinely new,
independently pack-registrable artifact. Read the Phase 08 fixture as a
mechanism precedent, not a template to clone; decide this protocol's real
shape from the two bullets above and this cell's own "-Lite" framing, and
document your reasoning in P10.3.md.

**"No formal tally/winner semantics in this step"** — the private rank
contributions are recorded (contribution type `rank`, closed MVP8 enum)
but this definition/protocol must NOT compute, declare, or imply an
aggregate ranking, winner, or tally. If you're tempted to add anything
resembling vote-counting, stop — that's explicitly out of scope for this
step per the plan's own P10.4 sibling text too ("no claim of strong
anonymity or statistical convergence" — the whole group-thinking pack in
this phase deliberately avoids formal social-choice semantics).

**Per-actor provider/tier requirement (user-driven, session-recorded):**
see P10.2's own contract for the full framing — at least ONE of
P10.2/P10.3/P10.4 should demonstrate real `spec.actors[].policy.
{preferExecutor,minTier}` usage on at least one role. Nominal-Group's
distinct participant-vs-facilitator roles may be a natural fit (e.g. a
facilitator persona on a different provider than the participants) — your
call; if you build it, prove it live (a real dispatch test showing two
different executors invoked, matching P10.1's own precedent for how to
prove this, not just declare it in the schema). If you don't, say so
plainly in P10.3.md's Gaps rather than silently omitting it — the
Coordinator will check whether at least one of the three cells covered
this before Phase 10 can be considered to have satisfied the user's
explicit requirement.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — full phase spec: this cell's own text, P10.2/P10.4's text (sibling
   cells, running in parallel — read to avoid metadata.id collisions),
   P10.5's text (what your definition/tests must hand off), and P10.7's
   text (the conformance lane your definition must later survive).
2. `core/coordination-protocols/deliberation-nominal-group-chain.yaml`
   — mechanism precedent (private-proposal privacy via context-grant
   gating, not a new secrecy mechanism), not a template to clone.
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.3.md`
   — read its Design Notes on the self-referential-window constraint and
   the Nominal-Group privacy proof's exact reasoning in full; you will
   likely hit the same structural constraint building this definition.
4. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.1.md`,
   `P08.2.md` — the closed MVP8 contribution-lineage mechanism this
   definition rests on.
5. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`
   — the pack/gate this definition will eventually be registered through
   (P10.5's job, not yours).
6. `docs/architect/agent-coordination/contracts/flow-definition.md` —
   the full promoted FlowDefinition schema contract, including
   visibility windows, `contributions.allowedTypes[]`, and the actor
   `policy` field table.
7. `src/runner/definitions/schema.mjs` — read the real, current schema.

### May Touch
- One new file under `core/coordination-protocols/` (your own naming,
  e.g. `group-thinking-nominal-group-lite.yaml` — pick a name that won't
  collide with P10.2/P10.4's own new files)
- A new test file under `test/runner/` or `test/verbs/` proving the
  definition validates and its intended chain (private proposals ->
  controlled reveal -> clarification -> private rank) runs end-to-end
  through the real engine doors (matching P08.3's method-chain test
  style: real dispatch, real `linkSessionContribution`, real replay
  reconstruction, no chat-history dependency)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.3.md`
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
- Any file P10.2/P10.4 would also plausibly touch — keep your footprint
  to files only THIS cell would ever create

### Acceptance
- New FlowDefinition validates against the real, current schema.
- The Nominal-Group-Lite shape (private proposals, controlled sharing,
  clarification, private rank; NO tally/winner semantics) is genuinely
  provable end-to-end, not just schema-valid.
- `metadata.id` is genuinely unique (grep `core/coordination-protocols/
  *.{yaml,yml,json}` for existing ids before picking).
- Zero files outside this cell's May-Touch list touched.
- Focused suite green; full-repo sweep run from THIS worktree
  (uncommitted diff, matching P08.3/P09.3/P10.1's own established
  precedent) shows no new failures beyond the standing baseline
  (`fgos-intake-4.test.mjs:318`) and known load-induced flakes.
- Write `P10.3.md` in this track's established format. State explicitly
  whether this definition demonstrates the per-actor provider/tier
  requirement.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
