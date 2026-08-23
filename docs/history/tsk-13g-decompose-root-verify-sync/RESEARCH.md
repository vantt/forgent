# Research — tsk-13g: decompose-root item never gets a real `verify` synced

## Round 1 — 2026-08-23

**Asked:** Is the bug described in tsk-13g's own description still accurate
in the current codebase (i.e. not already fixed since 2026-08-21), and is
there already a locked decision on which of the two proposed fix directions
is correct?

**Checked:**

- `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md`
  (mirrored at `.claude/skills/`, `.agents/skills/`, `plugins/fgOS/skills/`)
  — the file `fgos-coding-planning` itself points to for verify-sync
  mechanics.
- `docs/history/tsk-14a-plan-verify-sync-gap/plan.md` and its own
  `RESEARCH.md` — the sibling item that already fixed the *pass-through*
  half of this same gap.
- `fgos list --id tsk-1vc/tsk-3ik/tsk-14a --json` — live status/verify of
  the incident item and precedent items tsk-13g's own description cites.

**Found:**

1. `verify-sync-and-gap.md:22-44` ("Sync a pass-through item's own `verify`
   field") is scoped explicitly to "a *pass-through* (non-split ...) item
   only", and explicitly states "Split children need no such step: the
   normalizer already forces a real verify onto each one at creation time."
   Neither this section nor anywhere else in the file mentions the split
   **root** item itself. `grep -n "root" domains/coding/skills/
   fgos-coding-planning/SKILL.md` finds no verify-related root handling
   either. The gap tsk-13g describes is real and still present today — not
   already fixed.

2. `docs/history/tsk-14a-plan-verify-sync-gap/plan.md:107-119` ("Cases this
   needs to hold for") explicitly scopes split roots OUT of tsk-14a's own
   fix: "A **split** item — untouched by this change; split children
   already get a real verify forced at creation time ... this item's own
   description already confirms is not the gap." tsk-14a (`fgos list --id
   tsk-14a`) is `status: retrospective`, its fix already landed (verify
   field is a real `npm test && grep ...` command, not a placeholder). This
   confirms tsk-14a's delivered fix does **not** cover tsk-13g's case — no
   overlap, no double-fix risk.

3. `tsk-1vc` (`fgos list --id tsk-1vc`) is `status: delivered` and is the
   real incident tsk-13g's description cites (`fgos sync-root tsk-1vc`
   failing with `merge-failed-unclassified` because the root's `verify` was
   still the discovery-stage placeholder). tsk-1vc's own fix was about
   detecting silent event-log loss — unrelated to the verify-sync gap
   itself, so this incident's root cause (the placeholder-verify-executed-
   literally bug) is still open.

4. `tsk-3ik` (`fgos list --id tsk-3ik`) is `status: done`, verify =
   `node --test 'test/**/*.test.mjs'` — confirms the precedent tsk-13g's
   description cites is real: a decompose root manually given a real
   `verify` by whoever planned it, informally, with no enforced convention.

5. No `docs/decisions/` entry or `CONTEXT.md` anywhere locks a choice
   between tsk-13g's two proposed fix directions (skill-prose sync in
   `fgos-coding-planning`'s split-decision step, vs. an engine-side refusal
   of the decompose-write when the root's verify is still a placeholder).
   This is a genuine open design choice, not yet decided by anyone.

**Still open:** which of the two fix directions to take. This is the same
shape tsk-14a itself was in before its own planning stage picked "skill-
prose fix, not engine change" with a stated rationale
(`tsk-14a-plan-verify-sync-gap/plan.md:64-72`) — an approach decision that
belongs to `fgos-coding-planning`'s own Shape step, not to discovery.

## Verdict

`clear` — root cause is evidence-backed and current; the sync-root incident
(tsk-1vc) and the precedent (tsk-3ik) are both real; tsk-14a's own fix is
confirmed out-of-scope for this item (no overlap). The remaining "fix
direction not locked" question is an approach choice for planning to make
and justify (same shape tsk-14a's own plan.md already used), not a gap in
understanding that needs a person in `exploring`.

Proposed `verify` (item's own field was still a custom placeholder,
`"chưa xác định — P15 bổ sung"`, not a real command): `npm test` — the
regression floor, consistent with "leave execution alone" (verify-sync-
and-gap.md:6-20): the specific proof-surface command for whichever fix
direction planning picks gets designed and synced there, same as every
other pass-through item.
