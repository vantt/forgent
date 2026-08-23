# Research — tsk-224 gate redesign (fgos-coding-planning / fgos-coding-validating)

## Round 1 — 2026-08-13 (discovery stage, via fgos-researching)

**Asked:** Verify the technical claims in tsk-224's description (point 4,
the native children-creation mechanism) against real repo state, and check
whether points 1-3 (confidence criterion, single gate, question wording)
have an existing mechanical/repo-level answer or are genuinely open product
decisions.

### Checked — point 4 claims (all confirmed exact)

- `src/intake/plan.mjs:184-201` (`normalizeChild`) — `action` is mandatory
  for a decompose child (`if (typeof child.action !== 'string' ||
  !child.action.trim()) return null;`, line 197) and must cite at least one
  real D-ID from the parent's own `## Locked decisions` table
  (`extractLockedDecisionIds`, lines 157-169; citation check lines
  198-201), exempted only when the parent carries no locked decisions at
  all. Confirmed exactly as described.
- `src/intake/plan.mjs:845-871` (`addWork` loop inside the decompose
  branch) — every child is created with `stage: stageForStep(domain,
  'Execute')` (line 866), i.e. straight into `executing`, never a
  separate `planning` stage of its own. Confirmed.
- `.claude/skills/fgos-coding-planning/SKILL.md` step 4 "Decide the split"
  (lines 191-231) — currently creates split children via a direct `fgos
  add --title ... --parent <id> --footprint ... --stage planning` call
  (line 211), with no `action` field at all, NOT via `fgos plan --verdict
  decompose --children`. Confirmed exactly as described.
- `.claude/skills/fgos-coding-validating/SKILL.md` Gate section (lines
  239-250) — already contains three branches: (a) no split → `--verdict
  pass-through`; (b) plan.md listed child pieces not yet materialized →
  `--verdict decompose --children '<JSON>'` (line 247); (c) — the branch
  actually forced today — "plan.md's step 4's listed child pieces were
  already created as real work items during fgos-coding-planning's own
  step 4 ... cite them by id, never `--verdict decompose --children` here:
  that write is unconditional ... and would create duplicate positional-id
  children while orphaning the real ones" (lines 248-249). Confirmed
  exactly as described — branch (b) exists in prose today but is
  structurally unreachable because planning's step 4 always pre-empts it
  via branch (a)'s manual `fgos add`.
- Gate wording — exact match: `fgos-coding-planning` line 334 `"Work shape
  is ready. Approve before execution?"`; `fgos-coding-validating` line 229
  `"Feasibility validated. Approve moving to executing?"`.

**Verdict on point 4:** technically clear. The fix described (move step 4
of `fgos-coding-planning` to writing per-child prose specs in `plan.md`
only, no `fgos add --parent` call; materialize via `fgos plan --verdict
decompose --children` at `fgos-coding-validating`'s existing branch (b))
is directly actionable against real, cited code paths. No repo-evidence
gap here.

### Checked — points 1-3 (confidence criterion / single gate / question wording)

- `.claude/skills/fgos-clarifying/SKILL.md` (the cited design precedent,
  "silent by default, only speak when the goal itself is genuinely
  unclear") — its own criterion is scoped to *intent* at Init, before any
  item exists ("What does the person want built" unclear → ask; "which
  library" unclear → not this skill's concern, lines 57-65). This is not
  directly transferable to `planning`/`validating`'s question ("is this
  plan/feasibility check good enough") — no existing mechanical criterion
  in the repo answers "when should planning/validating stay silent vs.
  ask" the way `fgos-clarifying` answers it for intent. Point 1's
  confidence criterion is a genuine open product decision, not a scouting
  gap.
- **Directly relevant prior art found, NOT cited in tsk-224's own
  description:** `docs/history/gate-question-quality-and-routing/
  DISCUSSION.md` (items `tsk-65i`/`tsk-539`, 12 rounds, ~1580 lines,
  most recent round 2026-08-08) covers the same problem space — gate
  question quality and when a gate should ask a person at all. Two
  **locked** decisions from that discussion are directly load-bearing here:
  - **D6** (line 734, shipped, seq 9891, `tsk-539`): `validateApprove`
    already auto-bypasses when the reality gate produced NO constraints,
    and asks a person only when a constraint exists (measured 94/108 =
    87% no-constraint, 13/108 constrained cases were the only ones worth
    asking, 0 need-to-ask-again). This is the exact `gate-bypass.mjs`
    `canAutoApproveValidate` mechanism `fgos-coding-validating`'s own
    SKILL.md already calls (cites `docs/history/gate-bypass/CONTEXT.md
    D6` — same D6, promoted into the canonical gate-bypass CONTEXT.md).
  - **D7** (line 736, shipped, seq 10187, `tsk-539`): "two storage zones
    for two readers" — `state.decisions` is the agent-authoritative
    channel (short, evidence-bearing), `CONTEXT.md` is free to optimize
    for a human reader (narrative). A related child item (`tsk-3uw`,
    "Nối skill vào vùng máy") is still open/in-progress under that same
    discussion as of this research round.
  - tsk-224's own description names `tsk-539` once, explicitly as "liên
    quan nhưng phạm vi khác — chỉ về wording câu hỏi — không gắn
    dependency, chỉ tham khảo". Based on this discussion's actual content
    (D6 already redesigns exactly *when* `validateApprove` asks vs.
    auto-bypasses — the same axis as tsk-224's point 1/2), that scope
    characterization looks narrower than what the discussion actually
    settled. This is not confirmed as a conflict — D6 is scoped to
    `validateApprove`'s bypass-on-no-constraint condition, not a general
    "should the agent ask" criterion, and tsk-224's point 2 proposes
    merging `planApprove`+`validateApprove` into one gate, which D6 never
    addressed (D6 assumed two separate gates still exist) — but it is
    real, cited, unresolved overlap a person needs to reconcile before
    planning starts, not something more repo-scouting can settle.

**Verdict on points 1-3:** unclear. The confidence criterion (point 1) is
a genuine product-design gap with no mechanical repo precedent to lift
directly. The single-gate merge (point 2) has real, locked, shipped
precedent (D6/D7 in `docs/history/gate-question-quality-and-routing/
DISCUSSION.md`) that a person needs to reconcile against tsk-224's own
scope before `fgos-coding-planning` can write an honest plan — proceeding
straight to `planning` risks re-deriving or silently duplicating/
conflicting with an already-shipped mechanism.
