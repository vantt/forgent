# Current Cell: P10.2 (parallel with P10.3, P10.4 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-2`
Branch: `step-09-mvp6-to-mvp9-p10-2`
Next action: dispatch Doer

P10.1 closed and committed (`9b91aa9f`, cell-log fix `995ba45e`) —
`core/protocol-packs/group-thinking.json` (empty pack registry) and
`src/verbs/coordination/group-thinking-pack.mjs` (the public request
gate) now exist and are closed. P10.2 runs in its OWN isolated worktree,
parallel with P10.3 (Nominal-Group-Lite, `.claude/worktrees/
step-09-mvp6-to-mvp9-p10-3`) and P10.4 (Delphi-Feedback-Lite, `.claude/
worktrees/step-09-mvp6-to-mvp9-p10-4`) — per this track's own documented
P06.1/P07.1 process-deviation lesson, no shared checkout this time.

## P10.2 — RFC-Review-Lite Definition (Phase 10)

### Goal (plan's own cell text, phase-10-group-thinking-protocol-pack-conformance-and-closeout.md)
- Independent objections before controlled reveal.
- Response and driver disposition with artifact-backed lineage.
- No general comments/thread service.

### Shape and precedent
This is a REAL, pack-registrable protocol definition — not another proof
fixture. The closest structural precedent in this repo is
`core/coordination-protocols/deliberation-rfc-chain.yaml` (Phase 08,
MVP8's own RFC-chain proof: `proposal -> objection -> response -> driver
disposition`, one visibility window gating all contribution-bearing
operations, `respond`'s target closed through the existing
`driver-disposition-recorded` door). **Do not copy that file verbatim or
reuse its `metadata.id`** — this cell's own definition is a genuinely new,
independently pack-registrable artifact (P10.5 registers it through the
pack, alongside P10.3/P10.4's own definitions). The "-Lite" naming and
"independent objections before controlled reveal" phrasing suggest this
protocol's actual shape may differ from the Phase 08 fixture in a real
way — read the Phase 08 fixture as a mechanism precedent (how to wire
visibility windows / contribution types / disposition), not as a template
to clone. Decide the real shape from this cell's own three bullets above,
and document your reasoning in P10.2.md.

**"No general comments/thread service"** — reuse the existing MVP8
`deliberation-contribution-linked` mechanism (closed enum:
`proposal|objection|response|clarification|rank|specialist-request`) for
every piece of reasoning this protocol records. Never invent a new
message/comment/thread concept.

**Per-actor provider/tier requirement (user-driven, session-recorded):**
at least this definition (or one of P10.3/P10.4 — coordinate is
unnecessary since each cell is independent, but if none of the three
demonstrates it, that is a real gap) should give a real, worked example
of `spec.actors[].policy.{preferExecutor,minTier}` on at least one role
(e.g. an objector/reviewer role preferring a different CLI provider than
a proposer role) — proving the group-thinking pack genuinely supports
Claude/Codex/agy collaborating as different actors in one session, not
just structurally permitting it. If you judge RFC-Review-Lite is a
natural fit for this (an independent-objection role is a plausible
place for a distinct reviewer persona/provider), do it here; if not, say
so in P10.2.md and let a later cell (P10.5, which registers all three
and proves the pack end-to-end) pick it up.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — full phase spec: this cell's own text, P10.3/P10.4's text (sibling
   cells, running in parallel — read to avoid metadata.id collisions or
   registry-shape assumptions that don't match theirs), P10.5's text
   (what your definition/tests must hand off), and P10.6's text (the
   conformance lane your definition must later survive).
2. `core/coordination-protocols/deliberation-rfc-chain.yaml` — mechanism
   precedent (visibility windows, contribution types, disposition
   wiring), not a template to clone.
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.1.md`,
   `P08.2.md`, `P08.3.md` — the closed MVP8 mechanism this definition's
   contribution lineage rests on.
4. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`
   — the pack/gate this definition will eventually be registered through
   (P10.5's job, not yours) — read it so your definition's shape is
   compatible (real `metadata.id@version`, no assumption about a second
   registry mechanism).
5. `docs/architect/agent-coordination/contracts/flow-definition.md` —
   the full promoted FlowDefinition schema contract, including the
   `contributions.allowedTypes[]` and `specialistSlotRef`/`specialistSlots[]`
   sections (P08.3/P09.3 promoted them) and the actor `policy` field
   table (for the per-actor provider/tier example above).
6. `src/runner/definitions/schema.mjs` — read the real, current schema
   (don't trust any doc summary alone) for exact field constraints.

### May Touch
- One new file under `core/coordination-protocols/` (your own naming,
  e.g. `group-thinking-rfc-review-lite.yaml` — pick a name that won't
  collide with P10.3/P10.4's own new files; read their cell text if
  unsure, or just pick a protocol-specific prefix)
- A new test file under `test/runner/` or `test/verbs/` proving the
  definition validates and — at minimum — that its intended chain
  (objection -> response -> driver disposition) can run end-to-end
  through the real engine doors (matching the P08.3 method-chain test
  style: real dispatch, real `linkSessionContribution`, real replay
  reconstruction, no chat-history dependency)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.2.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- `core/protocol-packs/group-thinking.json` (P10.1's registry — P10.5
  registers your definition into it, not you)
- `src/verbs/coordination/group-thinking-pack.mjs`, `core/skills/
  fgos-group-thinking/SKILL.md` (and its generated projections under
  `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/`) — the
  shared gate/skill, off-limits to this cell per phase-10.md's own text
- `core/coordination-protocols/group-cognition-framework.yaml` (never)
- Anything under `src/runner/**` — if you find a genuine kernel gap,
  STOP and report it as a blocking finding (a shared missing primitive)
  rather than patching the kernel from this cell
- Any file P10.3/P10.4 would also plausibly touch (their own new
  protocol file, their own new test file) — this is a parallel-worktree
  cell; a real collision here means a merge conflict later, so keep your
  footprint to files only THIS cell would ever create

### Acceptance
- New FlowDefinition validates against the real, current schema (a
  focused test proves it).
- The RFC-Review-Lite shape (independent objections before controlled
  reveal; response and driver disposition with artifact-backed lineage;
  no general comments/thread service) is genuinely provable end-to-end,
  not just schema-valid — at least one real dispatch+replay test.
- `metadata.id` is genuinely unique (won't collide with P10.3/P10.4's
  own definitions or any existing core fixture — grep
  `core/coordination-protocols/*.{yaml,yml,json}` for existing ids
  before picking).
- Zero files outside this cell's May-Touch list touched — confirmed via
  `git status --short` before finishing.
- Focused suite for touched files green; full-repo sweep run from THIS
  worktree (uncommitted diff — matches this track's own established
  P08.3/P09.3/P10.1 precedent and reasoning) shows no new failures
  beyond the standing baseline (`fgos-intake-4.test.mjs:318`) and known
  load-induced flakes.
- Write `P10.2.md` in this track's established Design Notes / Proof
  Matrix / Gaps format (P10.1.md is the most recent example of the
  shape, don't copy its content). State explicitly whether this
  definition demonstrates the per-actor provider/tier requirement, and
  if not, say so plainly rather than silently omitting it.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
