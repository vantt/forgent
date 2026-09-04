# Current Cell: P10.9 (parallel with P10.6, P10.7, P10.8 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-9`
Branch: `step-09-mvp6-to-mvp9-p10-9`
Next action: dispatch Doer

P10.5 closed and committed (`7dee3f7a`, cell-log fix `2da3f9a3`) — the
pack now has all three group-thinking-lite protocols registered. P10.9
runs in its OWN isolated worktree, parallel with P10.6/P10.7/P10.8 (the
three protocol-specific conformance lanes). P10.9 is this track's own
FINAL security/regression sweep, across the WHOLE MVP6-9 mechanism this
track built (not just the three new Phase 10 protocols) — the broadest
and most consequential of the four parallel cells.

## P10.9 — Isolation, Security, And Authority Regression (Phase 10)

### Goal (plan's own cell text)
- Unchanged Group Cognition fixture.
- Foreign refs, premature visibility, unauthorized aggregation/specialist,
  over-cap/race/recovery, terminal absorption, governance-final dispatch,
  evidence confidence, CLI/headless parity, and Work/export-boundary
  checks.

### The real shape of this cell — read before assuming new tests are needed
**Most of these named properties are ALREADY proven, extensively, by
earlier cells in this exact track.** This is a REGRESSION-confirmation
cell first, and a new-test-authoring cell only where a genuine gap is
found — do not assume every named bullet needs brand-new test authorship.
Concretely, per property, what already exists (verify each yourself,
this list is a starting map, not a substitute for reading the real
files):
- **Unchanged Group Cognition fixture**: `test/runner/group-cognition-framework.test.mjs`
  and `core/coordination-protocols/group-cognition-framework.yaml`
  (never touched by this track, confirmed by every prior cell's own
  `git log` check on that file). Re-run this test file; also re-confirm
  via `git log --oneline -- core/coordination-protocols/group-cognition-framework.yaml`
  that it still shows exactly the one commit every prior phase's own
  Entry/Exit check already confirmed.
- **Foreign refs / premature visibility / unauthorized aggregation /
  unauthorized specialist**: covered extensively by P06.2 (visibility
  window bypasses, 4 fix rounds), P07.3/P07.4 (aggregation validation),
  P09.2/P09.3 (specialist authorization, 1 HIGH fixed + independently
  rechecked). Re-run the relevant existing test files; the real question
  for THIS cell is whether the NEW group-thinking pack surface
  (`runGroupThinkingRequest`) introduces any NEW path around these
  already-hardened checks — P10.1/P10.5 already proved the pack gate
  itself adds no new authority for grants/aggregation/specialist
  authorization (P10.1.md §5, re-verified P10.5.md §4) — re-confirm this
  holds, don't re-invent the original proofs.
- **Over-cap/race/recovery**: covered by P08.2's crash-recovery tests,
  P09.2's specialist maxBindings/maxAssignments caps, P09.3's
  crash-recovery tests, P10.4's engine-enforced `maxRounds` cap. Re-run;
  check whether the group-thinking pack surface specifically needs its
  own crash-recovery proof (P10.1/P10.5 didn't build one for
  `runGroupThinkingRequest` itself — if genuinely missing, this may be a
  real gap worth naming or closing here, your judgment call, document
  either way).
- **Terminal absorption**: search the codebase for this exact term or
  its likely referent (a terminal/closed session correctly refusing
  further mutation — likely already covered by `closeSessionByQuorum`'s
  own tests across multiple phases). Grep before assuming it's
  undocumented.
- **Governance-final dispatch**: this exact phrase appears in
  `docs/architect/proposals/step-09-group-thinking-substrate.md`'s own
  "Do not reopen" list — it is a PRE-EXISTING, already-settled property
  from work before this track (Step 08/MVP1-2 era), not something this
  track invented. Find its real existing test coverage (grep broadly,
  it may not use this exact string in test names) and re-confirm it
  still holds; do not attempt to redesign or re-litigate it.
- **Evidence confidence**: `classifyRunEvidence`
  (`test/runner/assignment-runresult.test.mjs`) and
  `test/runner/coordination-declared-vs-agent-led-equivalence.test.mjs`'s
  own "IDENTICAL... evidence confidence rules" test are the existing
  coverage. Re-run; confirm the group-thinking pack surface produces the
  same evidence-confidence classification as any other dispatch path
  (it should, since P10.1/P10.5 already proved it forwards requests
  unchanged into the same `runCoordinationUseCase` door).
- **CLI/headless parity**: already proven generically by P10.5 for the
  group-thinking pack specifically. This bullet here likely asks for the
  SAME property re-confirmed at the WHOLE-TRACK level (not just
  group-thinking) — i.e., that MVP6-9's own mechanisms (visibility
  windows, aggregation, contribution ledger, specialist binding) still
  show CLI/headless parity after the full Phase 10 build. Find and
  re-run the existing parity test(s) from earlier phases (search for
  "headless" across `test/runner/coordination-*.test.mjs`).
- **Work/export-boundary checks**: `test/runner/coordination-r7-work-isolation.test.mjs`
  (extended by P08.3 and P09.3, both of which added static-scan coverage
  for their own new modules). This cell's own job: extend the SAME
  static-scan methodology (matching P08.3/P09.3's own precedent) to
  cover `src/verbs/coordination/group-thinking-pack.mjs` and
  `core/skills/fgos-group-thinking/` if they aren't already covered by
  the existing scan's directory walk — check first, the scan may already
  be broad enough (e.g. if it walks `src/verbs/coordination/**`
  generally rather than a hardcoded file list).

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — this cell's own text plus P10.6/P10.7/P10.8's text (parallel lanes,
   read to avoid overlap — they each own their protocol's own
   conformance, you own the cross-cutting regression).
2. `docs/architect/proposals/step-09-group-thinking-substrate.md` — the
   original substrate proposal; several of this cell's named properties
   trace back to its own "Do not reopen" list.
3. `test/runner/group-cognition-framework.test.mjs`,
   `test/runner/coordination-r7-work-isolation.test.mjs` — the two
   existing test files most directly relevant to this cell's own
   bullets; read both in full before deciding what (if anything) needs
   extending.
4. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.1.md`
   §5, `P10.5.md` §4 — the pack gate's own bypass-freedom proofs you're
   re-confirming still hold at the whole-track level.
5. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md`
   — file-ownership map.

### May Touch
- `test/runner/coordination-r7-work-isolation.test.mjs` IF a genuine
  coverage gap is found for the new group-thinking pack surface
  (extend, matching P08.3/P09.3's own precedent — don't fork)
- New test file(s) under `test/verbs/` or `test/runner/` for any
  genuinely missing regression proof (e.g. group-thinking-pack-specific
  crash-recovery, if judged missing and worth closing here)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.9.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- `core/protocol-packs/group-thinking.json`, `src/verbs/coordination/group-thinking-pack.mjs`,
  `core/skills/fgos-group-thinking/SKILL.md` (and generated projections),
  `core/coordination-protocols/group-thinking-*.yaml`,
  `core/coordination-protocols/group-cognition-framework.yaml` (never —
  this cell's whole first bullet is proving it's STILL unchanged),
  anything under `src/runner/**` (report a genuine kernel gap as a
  blocking finding, never patch it silently). Per phase-10.md: "do not
  edit canonical contracts."
- Any file P10.6/P10.7/P10.8 would also plausibly touch (their own new
  test files) — keep your footprint to files only THIS cell would
  create.

### Acceptance
- For each of the 9 named properties in this cell's Goal, either (a)
  cite the existing test(s) that already cover it, confirmed still
  passing, or (b) build genuinely new coverage where a real gap is
  found, naming the gap explicitly.
- `group-cognition-framework.yaml` re-confirmed byte-unchanged (git log,
  one commit) and its own test suite green.
- The pack gate's own bypass-freedom (P10.1/P10.5) re-confirmed to still
  hold at this cell's own whole-track vantage point — not a re-derivation
  from scratch, a confirmation.
- Focused suite green; full-repo sweep run from THIS worktree
  (uncommitted diff, matching this track's established precedent) shows
  no new failures beyond the standing baseline (`fgos-intake-4.test.mjs:318`)
  and known load-induced flakes/the documented `coordination-static.test.mjs`
  worktree-path false-fail — given this cell's breadth, this full-sweep
  confirmation matters more here than for any other single cell in this
  track.
- Write `P10.9.md` in this track's established Design Notes / Proof
  Matrix / Gaps format, with an explicit per-property checklist (9 rows,
  one per Goal bullet) as its own Proof Matrix.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
