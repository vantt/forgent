# Current Cell: P10.5 (solo)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

P10.2/P10.3/P10.4 closed and merged (`a7741d00`). This track has now
closed P00, P06, P07, P08, P09, and P10.1-P10.4. P10.5 runs solo in this
shared worktree (no parallel sibling this round) — it's the gating cell
before P10.6-P10.9's own four parallel conformance lanes can start.

## P10.5 — Integration And Usability Proof (Phase 10)

### Goal (plan's own cell text, phase-10-group-thinking-protocol-pack-conformance-and-closeout.md)
- Register all three definitions through one writer.
- Prove the same request path works through CLI and headless entry
  points.
- Prove the skill cannot switch protocols silently, bypass grants,
  validate its own aggregate, authorize a specialist, or close a session
  directly.

### Current real state — read before assuming anything
- `core/protocol-packs/group-thinking.json` ships with `members: []` — a
  static, hand-edited JSON file (`{apiVersion, kind, metadata: {id},
  members: [{id, version}]}`). There is no registration API/verb
  anywhere in this codebase — confirmed by reading
  `src/verbs/coordination/group-thinking-pack.mjs`'s `loadProtocolPack`
  in full. "Register all three definitions through one writer" almost
  certainly means: edit this ONE file, in ONE commit/cell (this one),
  adding all three `{id, version}` pairs — not building a new
  registration mechanism. The three real ids, already merged and
  present in `core/coordination-protocols/`:
  - `core.coordination-protocol.group-thinking-rfc-review-lite` (v1.0.0,
    P10.2)
  - `core.coordination-protocol.group-thinking-nominal-group-lite`
    (v1.0.0, P10.3)
  - `core.coordination-protocol.group-thinking-delphi-feedback-lite`
    (v1.0.0, P10.4)
  Confirm each definition's real `metadata.version` by reading the files
  directly rather than trusting this list — a version bump between when
  this was written and when you read it is possible.
- **No CLI subcommand for group-thinking exists yet** — grepped
  `bin/fgos.mjs` for "group-thinking", zero hits. The skill
  (`core/skills/fgos-group-thinking/SKILL.md`, P10.1) invokes
  `runGroupThinkingRequest` directly via a `node -e "import(...)"`
  pattern (matching `fgos-routing/SKILL.md`'s own convention), not
  through a `bin/fgos.mjs` subcommand. Before assuming a new CLI
  subcommand is required, read P10.1.md in full (especially its §5
  bypass reasoning and its Design Notes on why the gate is a thin
  library function, not a CLI command) and decide: does "prove the same
  request path works through CLI and headless entry points" mean (a)
  proving the skill's own node-invocation pattern IS the CLI-equivalent
  path, and it produces identical behavior/results whether driven
  interactively or from `src/runner/coordination/headless-adapter.mjs`'s
  own headless driver (both ultimately call the same
  `runCoordinationUseCase` door `run.mjs` already proves works both
  ways) — or (b) a real, new `fgos group-thinking ...` subcommand is
  genuinely needed. Current-cell.md's own judgment: (a) is the more
  likely correct reading, matching P10.1's "thin, no new authority"
  design — but this is your call to make and document, not assumed for
  you. If you conclude a new CLI subcommand is required, that changes
  this cell's Do-Not-Touch scope (bin/fgos.mjs would move from
  off-limits to in-scope) — name that decision explicitly in P10.5.md
  before doing it, don't silently expand scope.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — full phase spec, this cell's own text, and P10.6-P10.9's own text
   (the conformance lanes this cell's registration unblocks).
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`
   in full — the gate/skill this cell proves end-to-end, especially §5
   (the 5-bypass structural proof against an EMPTY pack) and §3a (the
   per-actor provider/tier live proof).
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.2.md`,
   `P10.3.md`, `P10.4.md` — the three definitions you're registering; read
   each for its real `metadata.id@version` and its own already-proven
   properties (don't re-prove what they already established).
4. `src/verbs/coordination/group-thinking-pack.mjs` — `loadProtocolPack`,
   `resolvePackProtocol`, `runGroupThinkingRequest` — the real code, not
   just the doc summary above.
5. `src/runner/coordination/headless-adapter.mjs` and
   `src/verbs/coordination/run.mjs` — the CLI/headless parity precedent
   this cell's own "same request path" proof should reuse, not
   reinvent.
6. `core/skills/fgos-group-thinking/SKILL.md` — the real skill text
   (source of truth is `core/skills/`, not the generated projections
   under `.agents/skills/`/`.claude/skills/`/`plugins/fgOS/skills/` —
   read P10.1.md §3b if you need the full explanation of why).
7. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md`
   — file-ownership map.

### May Touch
- `core/protocol-packs/group-thinking.json` (the ONE registration edit —
  this cell owns it now, P10.1 deliberately left it empty for this cell)
- New test file(s) under `test/verbs/` or `test/runner/` proving:
  registration is correct (all three ids/versions resolvable through the
  pack), CLI/headless parity for at least one registered protocol, and
  the 5-bypass proof re-run against the now-populated pack (extending
  P10.1's own tests, not duplicating them wholesale)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.5.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)
- `bin/fgos.mjs` ONLY if you conclude (and explicitly document why) a new
  CLI subcommand is genuinely required — not assumed in scope by default

### Do Not Touch
- `core/coordination-protocols/group-thinking-*.yaml` (P10.2/P10.3/P10.4,
  closed — register them, don't edit them)
- `src/verbs/coordination/group-thinking-pack.mjs`, `core/skills/
  fgos-group-thinking/SKILL.md` and its generated projections — UNLESS a
  genuine defect is found (in which case treat it with the same rigor as
  a Fix Round: name it loudly, don't patch silently)
- `core/coordination-protocols/group-cognition-framework.yaml` (never)
- Anything under `src/runner/**` — if a genuine kernel gap is found, STOP
  and report it as a blocking finding (a shared missing primitive) rather
  than reaching into the kernel

### Acceptance
- All three protocols registered in `core/protocol-packs/group-thinking.json`
  with correct, current `{id, version}` pairs, in one commit.
- A real test proves `resolvePackProtocol` resolves all three now (not
  just refuses correctly against an empty pack, which P10.1 already
  proved).
- CLI/headless request-path parity proven for at least one registered
  protocol — real evidence, not narrative (e.g. dispatching the SAME
  request through both `runCoordinationUseCase` directly and through
  whatever `headless-adapter.mjs` path a headless caller would use, and
  confirming identical resulting session state).
- P10.1's own 5-bypass proof re-run against the populated pack — in
  particular, prove P10.1's Fix Round 1 HIGH-finding fix (the resume-path
  protocol cross-check against `manifest.definitionRef.id`) still holds
  now that real, resumable sessions under real registered protocols
  exist, not just the synthetic non-pack-protocol PoC Red-Team used to
  find the original bug.
- Focused suite green; combined regression across `coordination-*`/
  `flow-definition*`/`verbs/coordination-*` green; full-repo sweep run
  from the MAIN CHECKOUT if a fresh clean checkout is convenient, or
  from this worktree with the known `coordination-static.test.mjs`
  false-fail named explicitly — no new failures beyond the standing
  baseline (`fgos-intake-4.test.mjs:318`).
- Write `P10.5.md` in this track's established Design Notes / Proof
  Matrix / Gaps format.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
