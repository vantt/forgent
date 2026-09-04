# Current Cell: P10.1 (solo — opens Phase 10)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

P09.3 closed and committed (`52c05597`, cell-log fix `7a66eaf6`) — Phase 09
is done. This track has now closed Phases 00, 06, 07, 08, 09. P10.1 opens
the final phase, Phase 10 (External Acceptance), and runs solo in this
worktree — nothing else in Phase 10 is ready to pair with it (P10.2-P10.4
depend on this cell's registry/skill shape).

## P10.1 — Pack Registry And Public Surface (Phase 10)

### Goal (plan's own cell text, phase-10-group-thinking-protocol-pack-conformance-and-closeout.md)
- Index protocols by canonical `FlowDefinition metadata.id@version`; do
  not create a second protocol identity.
- Keep protocol definitions data-first.
- Define public request adapter and replay renderer boundaries.
- Build a thin `fgos-group-thinking` skill/surface that selects an
  explicit registered protocol, launches/resumes coordination, and
  renders public replay.
- Do not hide protocol semantics in skill prose.

### Phase 10's own framing — read before designing anything
Phase 10's Objective: "Build the reusable application layer OUTSIDE core
that exercises MVP6-MVP9 through public contracts." Its "Pack Integration
Gate" (binding on every cell in this phase, not just this one): "Pack,
conformance inputs, and skill are physically/authoritatively outside the
Agent Coordination kernel. All protocol behavior is expressed by public
declarations and engine contracts." Its Step 09 Exit Contract (the whole
track's own closing bar, which P10.10 eventually checks): "No behavior
depends on chat history or hidden driver-only prose," "Every adaptive
action is authorized, bounded, evidence-linked, and idempotent," "No
Work/Coding/git/worktree/merge/mutation authority moved into the
substrate." P10.1 sets the shape every later Phase 10 cell inherits — get
the boundary right here, not later.

### The central design question this cell must resolve
This repo already has a real, working protocol-discovery mechanism
(`src/runner/definitions/protocol-loader.mjs`, project/domain/core tiers,
`metadata.id@version` identity, duplicate/precedence handling already
solved) and real, working CLI request/replay surfaces
(`fgos coordination run --file <request.json>`,
`fgos coordination show <id>`, `src/verbs/coordination/{run,show}.mjs`).
**"Index protocols by canonical FlowDefinition metadata.id@version; do
not create a second protocol identity" almost certainly means: reuse
`protocol-loader.mjs` as-is, never build a parallel registry/index
mechanism.** What this cell actually needs to design and build:
- **The "Pack"** — most likely a small, explicit, data-first list (not
  code) naming exactly which registered protocol ids this
  Phase-10-specific surface exposes (the group-thinking protocols P10.2-
  P10.4 will add — RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-
  Lite — plus, your call, whether any of this track's already-built
  fixtures under `core/coordination-protocols/` belong in it too; read
  P10.2-P10.4's own cell text before deciding, since they may expect this
  cell to leave the registry structure ready for their additions rather
  than pre-listing protocols that don't exist yet). "Data-first" means:
  do not encode protocol selection logic or protocol-specific branches in
  code or skill prose — a flat, explicit list a person or the pack itself
  can read.
- **The public request-adapter/replay-renderer boundary** — most likely
  a thin pass-through to the EXISTING `run.mjs`/`show.mjs` CLI verbs
  (already public, already proven across MVP6-9), not a new execution
  path. "Do not hide protocol semantics in skill prose" means the skill
  must not embed decision logic about WHAT a protocol does — it only
  selects an id and calls the real engine doors.
- **The `fgos-group-thinking` skill itself** — a new
  `.agents/skills/fgos-group-thinking/SKILL.md` (see
  `.agents/skills/fgos-routing/SKILL.md` for this repo's own
  skill-authoring convention/frontmatter shape), thin, requiring EXPLICIT
  protocol selection (never auto-discovery/silent-default), that
  launches/resumes coordination and renders replay by calling the real
  CLI verbs — designed from the start so P10.5's later proof ("the skill
  cannot switch protocols silently, bypass grants, validate its own
  aggregate, authorize a specialist, or close a session directly") will
  actually hold. You are not required to write P10.5's proof tests here,
  but the skill's own design must make that proof possible, not merely
  plausible — name explicitly, in P10.1.md, why each of those five
  bypasses is structurally impossible given how you wired it.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — the full phase spec, all 10 cells, the Pack Integration Gate, and
   the Step 09 Exit Contract. Read P10.2/P10.3/P10.4's own cell text too
   (even though you're not building those definitions) so your registry
   shape doesn't collide with what they'll need to add.
2. `src/runner/definitions/protocol-loader.mjs` — the existing
   discovery/registry mechanism, full header comment plus implementation.
   Confirm it already does everything "index by canonical id@version"
   needs before building anything new.
3. `src/verbs/coordination/{run,show}.mjs` — the existing public CLI
   request/replay surfaces this cell's skill should call, not reimplement.
4. `src/verbs/coordination/launch-master-loop.mjs` — check whether this
   is a relevant precedent for "launches/resumes coordination" (read it
   before assuming it is or isn't).
5. `.agents/skills/fgos-routing/SKILL.md` — this repo's own
   skill-authoring shape/frontmatter convention to match.
6. `docs/architect/agent-coordination/contracts/coordination-session.md`
   and `flow-definition.md` — the full promoted contract surface this
   cell's skill sits on top of (do not restate it in skill prose — link
   to it or call the doors it documents).
7. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md`
   — file-ownership map; confirm whether `.agents/skills/` and
   `src/verbs/coordination/` already have a lease group, or this cell is
   the first to touch them in this track.
8. `plans/260903-2334-step09-mvp6-to-mvp9/plan.md` — re-read the
   Shared-File Lease Rule; P10.2-P10.4 will run in parallel after this
   cell closes, each in its OWN isolated worktree (this track's own
   documented process-deviation lesson from P06.1/P07.1 — no exceptions
   this time), so this cell's own file-ownership boundaries need to be
   clean and narrow enough that those three parallel cells don't collide
   with it or each other.

### May Touch
- `.agents/skills/fgos-group-thinking/SKILL.md` (new)
- A new, small "pack registry" file/directory — your call on exact shape
  and location (likely under `core/` or a new `docs/architect/` location;
  name and justify the choice in P10.1.md, matching this cell's own
  "data-first" requirement)
- New test file(s) under `test/` proving the registry/skill boundary
  (explicit-selection-required, no silent protocol switching, thin
  pass-through to real doors — whatever you can prove at THIS cell's
  scope; full negative-proof coverage of the 5 named bypasses is P10.5's
  job, but a basic positive/shape proof belongs here)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- Anything under `src/runner/coordination/**`, `src/runner/definitions/**`,
  `src/runner/deliberation/**`, `src/runner/team-cognition/**` — Phase 10
  is explicitly "outside core," per its own Objective and Pack Integration
  Gate. If you find yourself needing to change kernel code to make the
  Pack work, STOP and report it as a blocking finding (a shared missing
  primitive, per phase-10.md's own closing instruction: "If a shared
  missing primitive is proven, do not hide it in the Protocol Pack or
  skill... leave Step 09 open with a named proposal and evidence") rather
  than quietly reaching into the kernel.
- `core/coordination-protocols/group-cognition-framework.yaml` (never)
- Do not write the RFC-Review-Lite/Nominal-Group-Lite/Delphi-Feedback-Lite
  protocol definitions themselves — that is P10.2/P10.3/P10.4's job, each
  in its own isolated worktree, after this cell closes.

### ADDENDUM (added mid-flight, 2026-09-04 — user-driven requirement)
**The skill/request-adapter boundary this cell builds MUST preserve
per-actor provider/model/tier customization — not collapse a
group-thinking session onto one provider.** This capability already
exists at two levels and must not be stripped or hard-coded away:
- `spec.actors[].policy` (`src/runner/definitions/schema.mjs`,
  `POLICY_PATCH_FIELDS = {minTier, preferPersona, preferExecutor,
  fallbackExecutors, visibility}`) already lets a FlowDefinition declare a
  DIFFERENT executor/tier per actor.
- `src/verbs/coordination/run.mjs`'s `actorPolicyFields` already resolves
  `actorEntry?.executor`/`actorEntry?.tier` per actor (falling back to a
  global default only when the actor doesn't declare its own), and
  forwards it as `cliPolicy` into `dispatchDeclaredOperation`.
- fgOS's own executor registry (`.fgos/config.json`) already has real,
  working `codex-cli`, `agy-cli`/`agy-herdr` executors dispatched via the
  `cli-spawn` adapter (real subprocesses, not simulated) — Claude,
  Codex, and Antigravity (agy) collaborating within one session is
  already mechanically possible today, at the kernel layer.
User's explicit bar: "ít nhất phải collab giữa claude, codex và agy trên
mô hình cli-spawn" (at minimum, Claude/Codex/agy must be able to
collaborate under the cli-spawn model) — this is a hard requirement, not
a nice-to-have. Concretely for THIS cell: whatever request-adapter
boundary you build MUST pass through a caller's (or a definition's own)
per-actor `executor`/`tier`/`preferPersona`/`fallbackExecutors` choices
unchanged, end to end — never defaulting every actor to one hardcoded
provider, never dropping the field when building the thin wrapper around
`run.mjs`. Add this to your Proof Matrix explicitly: name where in your
skill/adapter a caller can express "actor A uses provider X, actor B uses
provider Y" and confirm it reaches `run.mjs`'s real `actorPolicyFields`
resolution unchanged. If the skill's own request shape doesn't yet expose
this (e.g. it only accepts a single global executor), that is a real gap
— name it loudly in P10.1.md's Gaps, don't silently narrow scope. Full
proof that RFC-review-lite/Nominal-Group-lite/Delphi-feedback-lite
(P10.2-P10.4) actually ASSIGN different providers to different
personas/roles is those cells' own job, not this one's — but this cell
must not build a boundary that makes that impossible.

### Acceptance
- `protocol-loader.mjs` reused, not forked or duplicated — confirm and
  state this explicitly in P10.1.md rather than assuming a reader will
  take it on faith.
- A real, data-first pack registry exists, with a clear justification for
  its shape and location, ready for P10.2-P10.4 to add their three
  definitions to without needing to touch this cell's own code again.
- `fgos-group-thinking` skill exists, thin, calls the real
  `run.mjs`/`show.mjs` doors, requires explicit protocol selection.
- At least a basic test proving the skill cannot silently default/switch
  protocols (an unset or unknown protocol selection is refused, not
  guessed).
- Zero kernel files touched; zero files outside this cell's May-Touch
  list touched, confirmed via `git status --short` before finishing.
- Focused suite for touched files green; combined regression sweep (this
  cell's own new test files plus a broad `coordination-*`/`verbs/coordination-*`
  run) green; full sweep re-run from the MAIN CHECKOUT (never this
  worktree — `coordination-static.test.mjs` false-fails on the substring
  "worktree") shows no new failures beyond the standing baseline
  (`fgos-intake-4.test.mjs:318`) and known load-induced flakes.
- Write `P10.1.md` in this track's established Design Notes / Proof
  Matrix / Gaps format (P09.3.md is the most recent example of the shape,
  don't copy its content). Explicitly address, one by one, why each of
  P10.5's five named bypasses ("switch protocols silently, bypass grants,
  validate its own aggregate, authorize a specialist, close a session
  directly") is structurally impossible given this cell's design — this
  is the cell's real deliverable, not a checkbox.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`

## P10.1 Disposition (independent Reviewer + Red-Team, round 1)

Reviewer: no findings — every claim independently re-derived from the
real diff and re-run tests, including the mid-flight addendum's
per-actor provider requirement (verified genuinely real via a live
dispatch showing two distinct executors invoked).

Red-Team: 1 HIGH, empirically confirmed with a live PoC, ACCEPTED, fix
required before close:

- **[HIGH] The pack's protocol-selection gate is not actually enforced
  on session RESUME.** `resolvePackProtocol`/`runGroupThinkingRequest`'s
  self-consistency check (`peeked.protocolRef.id === protocolId`) only
  verifies the CALLER's own claimed protocol id is (a) internally
  self-consistent and (b) a pack member — it never cross-references that
  claimed id against the SESSION's actual, real bound protocol
  (`manifest.definitionRef.id`) when the request resumes an EXISTING
  `coordinationId`. Live PoC: opened a session directly under a
  non-pack-member protocol (`independent-research-fan-out-fan-in`), then
  called `runGroupThinkingRequest` against the SAME `coordinationId` with
  `protocolId`/`protocolRef.id` both naming a DIFFERENT, pack-registered
  protocol (`declared-consult`) — self-consistent, gate passes — with a
  `disposition` step (which has no protocol-binding check of its own).
  Dispatch succeeded; the session's real governing definition remained
  `independent-research-fan-out-fan-in` the whole time, while the gate
  believed and reported `declared-consult` was selected. This directly
  falsifies P10.1.md §5 bypass #1's proof as literally written, and means
  ANY non-pack protocol — including `group-cognition-framework.yaml`,
  which this cell's own Do-Not-Touch section forbids ever reaching —
  could be dispatched against through the `fgos-group-thinking` surface
  today on an existing session, contradicting the surface's entire reason
  for existing. Not exploitable beyond the raw `run.mjs` door's own
  existing authority (still requires the resuming session's real
  `writerId`), but a real, undocumented failure of THIS wrapper's own
  headline promise, not a mere residual.
  **Fixer must**: make the gate cross-check the claimed protocol id
  against the session's REAL bound protocol whenever `coordinationId`
  names an EXISTING session — resolve the real manifest (same mechanism
  `run.mjs`/`session-engine.mjs` already use, e.g. `readManifest`/
  `findExistingManifest`) and refuse if `manifest.definitionRef.id` does
  not match the pack-checked `protocolId`, before forwarding anything to
  `runCoordinationUseCase`. A fresh (not-yet-existing) session has no real
  bound protocol yet, so the existing self-consistency check is
  sufficient there — only the resume path needs the new cross-check.
  Add a regression test reproducing the PoC shape (resume an existing
  session under protocol A, request protocol B via the pack gate,
  confirm refusal) plus a positive test (resume under the SAME protocol
  the session was really opened with, confirm it still succeeds).

One LOW/INFO item, not required, Fixer's judgment on whether cheap to
close while already in this code:
- **[LOW/INFO]** `requestPath` mode reads the request file twice,
  unlocked, at two different instants (once for the gate's `peekRequest`,
  once inside `runCoordinationUseCase`'s own `readRequestFile`) — a
  concurrent writer to the same path in that sub-millisecond window could
  make the gated bytes diverge from the executed bytes. Not exploited
  live; bounded by this codebase's own existing "the request file is
  operator-authored and trusted" posture (same as `schema.mjs`'s header
  already states). If cheap given the HIGH fix's own changes (e.g. if the
  fix already needs to touch this code path), consider reading once and
  forwarding the parsed object instead of the path string — otherwise
  document as a named residual in P10.1.md's Gaps, not silently dropped.

Both independent rounds' full reports preserved in this conversation's
own record.
