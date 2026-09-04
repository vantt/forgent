# Current Cell: P10.6 (parallel with P10.7, P10.8, P10.9 — each its own isolated worktree)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9-p10-6`
Branch: `step-09-mvp6-to-mvp9-p10-6`
Next action: dispatch Doer

P10.5 closed and committed (`7dee3f7a`, cell-log fix `2da3f9a3`) — the
pack now has all three group-thinking-lite protocols registered. P10.6
runs in its OWN isolated worktree, parallel with P10.7
(Nominal-Group-Lite Conformance), P10.8 (Delphi-Feedback-Lite
Conformance), and P10.9 (Isolation/Security/Authority Regression).

## P10.6 — RFC-Review-Lite Conformance (Phase 10)

### Goal (plan's own cell text)
End-to-end independent review, reveal, response, disposition, replay,
and RESUME proof.

### What already exists — do not re-derive from scratch
P10.2 already proved the RFC-Review-Lite chain end-to-end (independent
objections, controlled reveal, response, disposition, chat-history-free
replay) via DIRECT engine calls (`authorizeDeclaredOperation`/
`dispatchDeclaredOperation`/`linkSessionContribution` called directly, not
through the pack). Read `P10.2.md` in full before writing anything — its
own tests are the mechanism precedent; do not duplicate them wholesale.

**This cell's real job**: prove the SAME properties are reachable THROUGH
the public pack gate specifically (`runGroupThinkingRequest`,
`src/verbs/coordination/group-thinking-pack.mjs`) — the surface an actual
user/skill invocation goes through — not just via direct engine calls a
test author has full internal access to. Plus the property P10.2 never
covered: **resume**. Concretely:
- Open an RFC-Review-Lite session through the pack gate
  (`runGroupThinkingRequest`), drive the full chain (convene, propose,
  both objections, reveal-gated response, driver disposition) through
  the pack gate's own request/step vocabulary, and reconstruct the full
  lineage from `replaySession` alone — proving the pack gate is a
  genuine, sufficient, complete surface for this protocol, not a partial
  one that happens to work for simple cases.
- **Resume through the pack**: interrupt the chain partway (e.g. after
  one objection settles, before the reveal-gated response), then RESUME
  the SAME session via a second `runGroupThinkingRequest` call naming the
  same `coordinationId` and the correct protocol id — prove it correctly
  continues from where it left off (no duplicate objection, no
  re-authorization of already-settled steps), and prove P10.1's Fix
  Round 1 resume cross-check (already re-verified generically by P10.5)
  correctly ALLOWS this legitimate same-protocol resume while still
  refusing a wrong-protocol resume attempt on the same session (a real,
  protocol-specific instance of what P10.5 proved generically).

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`
   — this cell's own text, P10.5's text (what you inherit), P10.9's text
   (the regression lane running in parallel — read to avoid overlap).
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.2.md`
   — the RFC-Review-Lite definition and its own already-proven chain.
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.5.md`
   — the pack gate, the CLI/headless parity proof, and the generic resume
   cross-check re-verification you're extending here to a real multi-step
   protocol-specific resume.
4. `src/verbs/coordination/group-thinking-pack.mjs` — the real gate code.
5. `core/coordination-protocols/group-thinking-rfc-review-lite.yaml` — the
   real definition, read directly (not from memory of P10.2.md's
   description).

### May Touch
- New test file(s) under `test/verbs/` (preferred, matching P10.5's own
  location) or `test/runner/` proving the above.
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.6.md`
  — do NOT edit `current-cell.md`/`index.md` yourself (Coordinator-owned)

### Do Not Touch
- `core/protocol-packs/group-thinking.json`, `src/verbs/coordination/group-thinking-pack.mjs`,
  `core/skills/fgos-group-thinking/SKILL.md` (and generated projections),
  `core/coordination-protocols/group-thinking-*.yaml` (all closed —
  consume them, don't edit), `core/coordination-protocols/group-cognition-framework.yaml`
  (never), anything under `src/runner/**` (report a genuine kernel gap as
  a blocking finding, never patch it silently). Per phase-10.md: "do not
  edit canonical contracts."
- Any file P10.7/P10.8/P10.9 would also plausibly touch (their own new
  test files) — keep your footprint to files only THIS cell would create.

### Acceptance
- Full RFC-Review-Lite chain proven end-to-end through the real pack
  gate (`runGroupThinkingRequest`), not direct engine calls.
- A real resume proof: interrupt mid-chain, resume via the pack gate,
  confirm correct continuation (no duplication) AND confirm the
  cross-protocol resume refusal still holds for this specific protocol.
- Chat-history-free replay reconstruction (matching this whole track's
  own discipline).
- Focused suite green; full-repo sweep run from THIS worktree
  (uncommitted diff, matching this track's established precedent) shows
  no new failures beyond the standing baseline (`fgos-intake-4.test.mjs:318`)
  and known load-induced flakes/the documented `coordination-static.test.mjs`
  worktree-path false-fail.
- Write `P10.6.md` in this track's established Design Notes / Proof
  Matrix / Gaps format.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(this exact relative path, inside THIS isolated worktree)
