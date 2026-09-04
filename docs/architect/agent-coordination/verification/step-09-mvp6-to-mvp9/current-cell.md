# Current Cell: P10.7 (parallel with P10.6, P10.8, P10.9 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-7`
Branch: `step-09-mvp6-to-mvp9-p10-7`
Next action: dispatch Doer

P10.5 closed and committed (`7dee3f7a`, cell-log fix `2da3f9a3`) — the
pack now has all three group-thinking-lite protocols registered. P10.7
runs in its OWN isolated worktree, parallel with P10.6 (RFC-Review-Lite
Conformance), P10.8 (Delphi-Feedback-Lite Conformance), and P10.9
(Isolation/Security/Authority Regression).

## P10.7 — Nominal-Group-Lite Conformance (Phase 10)

### Goal (plan's own cell text)
End-to-end private proposal, reveal, clarification, private rank
capture, and replay proof without claiming tally semantics.

### What already exists — do not re-derive from scratch
P10.3 already proved the Nominal-Group-Lite chain end-to-end (private
proposals from a 3-participant cohort, explicit `share` operation,
clarification, private rank) via DIRECT engine calls, and ALSO already
built a live per-actor different-CLI-provider proof. Read `P10.3.md` in
full before writing anything — its own tests are the mechanism
precedent; do not duplicate them wholesale.

**This cell's real job**: prove the SAME properties are reachable THROUGH
the public pack gate specifically (`runGroupThinkingRequest`), not just
via direct engine calls. Plus the property P10.3 never covered: resume.
Concretely:
- Open a Nominal-Group-Lite session through the pack gate, drive the
  full chain (private proposals from all three participants, `share`,
  `clarify`, private ranks) through the pack gate's own request/step
  vocabulary, reconstruct the full lineage from `replaySession` alone.
- **Explicitly re-confirm "no tally semantics"** at this cell's own
  layer too — the pack gate must not introduce any aggregate/winner
  computation P10.3's definition itself didn't have (it doesn't, but
  prove the gate doesn't ADD one either — e.g. assert
  `replaySession(...).aggregations` is still empty when driven through
  the pack, same discipline P10.3's own test used directly).
- **Resume through the pack**: interrupt mid-chain (e.g. after `share`
  settles, before `clarify`), resume via a second `runGroupThinkingRequest`
  call naming the same `coordinationId` and correct protocol id — prove
  correct continuation (no duplicate proposals, no re-grant of context
  already granted) and prove the cross-protocol resume refusal
  (P10.5's generic proof) holds for this specific protocol too.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — this cell's own text, P10.5's text, P10.9's text (parallel, avoid
   overlap).
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.3.md`
   — the Nominal-Group-Lite definition, its own already-proven chain, and
   its per-actor provider proof (already satisfies the user's requirement
   — you do not need to re-prove this, just don't accidentally weaken it
   if your own tests happen to touch the same actors).
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.5.md`
   — the pack gate and the generic resume cross-check re-verification
   you're extending here.
4. `src/verbs/coordination/group-thinking-pack.mjs` — the real gate code.
5. `core/coordination-protocols/group-thinking-nominal-group-lite.yaml` —
   the real definition, read directly.

### May Touch
- New test file(s) under `test/verbs/` (preferred, matching P10.5's own
  location) or `test/runner/` proving the above.
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.7.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- `core/protocol-packs/group-thinking.json`, `src/verbs/coordination/group-thinking-pack.mjs`,
  `core/skills/fgos-group-thinking/SKILL.md` (and generated projections),
  `core/coordination-protocols/group-thinking-*.yaml` (all closed —
  consume them, don't edit), `core/coordination-protocols/group-cognition-framework.yaml`
  (never), anything under `src/runner/**` (report a genuine kernel gap as
  a blocking finding, never patch it silently). Per phase-10.md: "do not
  edit canonical contracts."
- Any file P10.6/P10.8/P10.9 would also plausibly touch — keep your
  footprint to files only THIS cell would create.

### Acceptance
- Full Nominal-Group-Lite chain proven end-to-end through the real pack
  gate, not direct engine calls.
- No-tally-semantics re-confirmed through the pack gate specifically.
- A real resume proof through the pack gate, plus cross-protocol resume
  refusal confirmed for this specific protocol.
- Chat-history-free replay reconstruction.
- Focused suite green; full-repo sweep run from THIS worktree
  (uncommitted diff, matching this track's established precedent) shows
  no new failures beyond the standing baseline (`fgos-intake-4.test.mjs:318`)
  and known load-induced flakes/the documented `coordination-static.test.mjs`
  worktree-path false-fail.
- Write `P10.7.md` in this track's established Design Notes / Proof
  Matrix / Gaps format.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
