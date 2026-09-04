# Current Cell: P10.8 (parallel with P10.6, P10.7, P10.9 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-8`
Branch: `step-09-mvp6-to-mvp9-p10-8`
Next action: dispatch Doer

P10.5 closed and committed (`7dee3f7a`, cell-log fix `2da3f9a3`) — the
pack now has all three group-thinking-lite protocols registered. P10.8
runs in its OWN isolated worktree, parallel with P10.6 (RFC-Review-Lite
Conformance), P10.7 (Nominal-Group-Lite Conformance), and P10.9
(Isolation/Security/Authority Regression).

## P10.8 — Delphi-Feedback-Lite Conformance (Phase 10)

### Goal (plan's own cell text)
End-to-end private input, mediated aggregate feedback, bounded next
round, and replay proof without claiming strong anonymity/convergence.

### What already exists — do not re-derive from scratch
P10.4 already proved the Delphi-Feedback-Lite chain end-to-end (private
round-1 proposals, mediated non-contribution aggregate, bounded round-2
via a real engine-enforced `maxRounds` cap, round-order enforcement) via
DIRECT engine calls, including two real negative tests for two
independently-enforced properties. Read `P10.4.md` in full before
writing anything — its own tests are the mechanism precedent; do not
duplicate them wholesale.

**This cell's real job**: prove the SAME properties are reachable THROUGH
the public pack gate specifically (`runGroupThinkingRequest`), not just
via direct engine calls. Plus the property P10.4 never covered: resume.
Concretely:
- Open a Delphi-Feedback-Lite session through the pack gate, drive the
  full chain (round-1 proposals, mediated aggregate, round-2 proposals)
  through the pack gate's own request/step vocabulary, reconstruct the
  full lineage from `replaySession` alone.
- **Re-confirm the round CAP and round ORDER through the pack gate
  specifically** — P10.4's own two negative tests used direct
  `dispatchDeclaredOperation` calls; re-run at least one of them (your
  choice which, or both) through `runGroupThinkingRequest` instead, to
  confirm the pack gate doesn't accidentally provide a path around
  either enforcement (e.g. confirm a 3rd round-2 proposal attempt via
  the pack gate is STILL refused by the engine's real `maxRounds` check,
  not silently allowed because the gate's own forwarding somehow
  bypasses it).
- **Explicitly re-confirm "no strong anonymity/convergence claims"**
  through the pack gate's own request/response shape — nothing in how
  the gate reports results should imply a stronger anonymity or
  convergence guarantee than the underlying definition actually
  provides.
- **Resume through the pack**: interrupt mid-chain (e.g. after the
  mediated aggregate settles, before round-2 proposals), resume via a
  second `runGroupThinkingRequest` call naming the same `coordinationId`
  and correct protocol id — prove correct continuation and confirm the
  cross-protocol resume refusal (P10.5's generic proof) holds for this
  specific protocol too.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — this cell's own text, P10.5's text, P10.9's text (parallel, avoid
   overlap).
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.4.md`
   — the Delphi-Feedback-Lite definition, its own already-proven chain,
   the two real engine constraints it found and worked around
   (two-operation-ids-per-round; `minTier` provenance floor tie).
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.5.md`
   — the pack gate and the generic resume cross-check re-verification
   you're extending here.
4. `src/verbs/coordination/group-thinking-pack.mjs` — the real gate code.
5. `core/coordination-protocols/group-thinking-delphi-feedback-lite.yaml`
   — the real definition, read directly.

### May Touch
- New test file(s) under `test/verbs/` (preferred, matching P10.5's own
  location) or `test/runner/` proving the above.
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.8.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- `core/protocol-packs/group-thinking.json`, `src/verbs/coordination/group-thinking-pack.mjs`,
  `core/skills/fgos-group-thinking/SKILL.md` (and generated projections),
  `core/coordination-protocols/group-thinking-*.yaml` (all closed —
  consume them, don't edit), `core/coordination-protocols/group-cognition-framework.yaml`
  (never), anything under `src/runner/**` (report a genuine kernel gap as
  a blocking finding, never patch it silently). Per phase-10.md: "do not
  edit canonical contracts."
- Any file P10.6/P10.7/P10.9 would also plausibly touch — keep your
  footprint to files only THIS cell would create.

### Acceptance
- Full Delphi-Feedback-Lite chain proven end-to-end through the real
  pack gate, not direct engine calls.
- Round cap AND round order re-confirmed through the pack gate
  specifically (at least one, ideally both, of P10.4's own two negative
  properties re-run through `runGroupThinkingRequest`).
- No-strong-anonymity/convergence-claims re-confirmed through the pack
  gate's own request/response shape.
- A real resume proof through the pack gate, plus cross-protocol resume
  refusal confirmed for this specific protocol.
- Chat-history-free replay reconstruction.
- Focused suite green; full-repo sweep run from THIS worktree
  (uncommitted diff, matching this track's established precedent) shows
  no new failures beyond the standing baseline (`fgos-intake-4.test.mjs:318`)
  and known load-induced flakes/the documented `coordination-static.test.mjs`
  worktree-path false-fail.
- Write `P10.8.md` in this track's established Design Notes / Proof
  Matrix / Gaps format.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
