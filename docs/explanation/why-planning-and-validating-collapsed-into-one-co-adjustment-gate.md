---
type: explanation
title: Why planning and validating collapsed into one co-adjustment gate
tags: [fgos-coding-planning, fgos-coding-validating, gate, gate-bypass, human-release]
source_capture_ids: [tsk-224]
authoritative_for: why fgos-coding-planning and fgos-coding-validating merged their two approval gates into one, and how that one gate decides when to ask a person versus proceed
---
# Why planning and validating collapsed into one co-adjustment gate

`tsk-224`. Full design: `docs/history/coding-planning-validating-gate-redesign/`.
Grounded in a real case study (`tsk-5wr`, the backlog-status feature —
see `docs/reference/backlog-status-schema.md`).

## The problem, observed live

`fgos-coding-planning` and `fgos-coding-validating` each asked their own
closed yes/no question — "Work shape is ready. Approve before
execution?" and "Feasibility validated. Approve moving to executing?"
Both times, on the real `tsk-5wr` session, the person typed only
`"approve"` with no engagement with any specific content — because
neither question had a distinct "this is where the agent is least
confident, here is where you can actually help" section inviting a real
answer. One gate carried real weight (choosing an approach); the other
was nearly empty (the agent grading its own plan, then asking permission
for its own grade).

## D1: exactly one gate, moved to validating, right before materialize

`planApprove` and `validateApprove` merge into a single question point,
placed in `fgos-coding-validating`, immediately before materialize.
`fgos-coding-planning` no longer gates at all — it writes `plan.md` and
hands off. (D2: `contextApprove` in `fgos-coding-exploring` is untouched
and correctly scoped already — it only fires when a `discover --verdict
unclear` verdict genuinely pushes an item into `exploring` for real
Socratic brainstorming; "exactly one gate" means one gate *within*
`planning`, not one gate for the whole lifecycle.)

## The two-tier default-to-silence criterion (D3/D4/D5)

Rather than a vague "ask when unsure," the design pins a mechanical,
ordered test — Tier A always runs before Tier B, never the reverse:

- **Tier A — can this gap be closed by a real, available action** (run a
  command, read a file, call `fgos-researching`, run `fgos graph
  --what-if`)? If yes: do it, then re-run the test from the top. Never
  ask a person. Tier A is only exited when no such action exists, one was
  tried and failed, or a locked `CONTEXT.md` decision forbids reopening
  it (structurally un-resolvable by the agent itself).
- **Tier B — for what survives Tier A, what does it cost to fix if
  wrong?** Cheap → pin it as a labeled assumption in `plan.md` and
  proceed. Expensive → ask.

**Why A must come before B**: Tier B prices the cost of *guessing*, but
until Tier A is exhausted, guessing was never the real alternative — so
pricing the cost first is just a rationalized way to be lazy. This is
literally the mistake `tsk-5wr` made in the case study: assuming a cost
instead of running `cargo test`, which was available the whole time.

**What Tier B actually measures (D4)**: the cost to *fix* a wrong guess
(not the cost to *build* it — a 3-day reversible choice is safer to guess
than a 1-hour irreversible one), measured at the moment the mistake would
surface (mid/post-execute, never at gate time — because D7 moves
materialize after the gate, so everything looks cheap right at the gate
by construction; pricing it there would make Tier B always answer
"cheap" and collapse the whole design). The cost includes real damage
accrued during the undetected window, not just the size of the eventual
fix-diff — and it is priced per decision, never per option (one gap gets
one number, not an option × cost matrix).

**The reversibility exception (D5)**: when options differ mainly in how
reversible they are, take the reversible path and proceed — never ask.
Only ask when every live option is hard to reverse, or the reversible
path is clearly wrong. This is the mechanism that converts what would
have been a question into a ship, in service of `AGENTS.md`'s priority
#2.

## D6: exactly three mechanical ask-triggers, nothing softer

- **T1** — at least two options still survive after a real comparison.
- **T2** — the plan needs something a locked `CONTEXT.md` decision
  contradicts, and cannot be resolved by citation alone.
- **T3** — a piece cannot be written with an `action` citing a real
  decision id, or has no real runnable verify (already enforced
  mechanically at `src/intake/plan.mjs:197-201` — an unwritable piece
  *is* the signal, never a reason to fabricate an `action` just to pass).

A fourth candidate trigger — "high risk with insufficient proof-surface"
— was explicitly dropped: `fgos-coding-validating`'s own feasibility
matrix already handles it (a row with no accepted evidence is
automatically `NOT READY`, which routes back to planning, not to a
person). Adding a duplicate trigger would turn a legitimate self-correct
loop into an unnecessary stop-and-wait.

## D7: materialize moves after the gate, through the existing engine door

`fgos-coding-planning`'s own step 4 now writes each child's full spec
(title, verify, a D-ID-citing `action`, footprint) as prose/JSON *inside*
`plan.md` — it no longer calls `fgos add --parent` directly. Real state
is written exactly once, at `fgos-coding-validating`'s own gate, via
`fgos plan <id> --verdict decompose --children '<JSON>'` (a branch that
already existed in the Gate section but had never actually been reached,
because planning's step 4 always created children by hand first). Two
consequences: a wrong split before the gate costs nothing, since nothing
was written yet; and children are born directly at `stage: executing`
(`src/intake/plan.mjs:866`), so they carry no gate of their own to skip
past — the same shape `fgos-coding-implement` already has zero gates.

## D8-D11: what this supersedes in `gate-bypass`

Recorded as appended rows in `docs/history/gate-bypass/CONTEXT.md`
(D13's own rule: supersede by appending a new row, never edit the
original row's body) — see `docs/explanation/gate-bypass-design.md` for
the base mechanism these rows modify:

- **`gate-bypass D6`** (bypassing `validateApprove` on a READY verdict) —
  fully superseded; the gate it served no longer exists standalone
  after D1.
- **`gate-bypass D2`** — superseded only on the clause "never the
  session's own confidence/vibe read," replaced by the monotone
  invariant D9 below. The "mechanical completeness / zero open items"
  half is untouched — still a valid mechanical input read fresh from
  `plan.md` at gate time.
- **`gate-bypass D4`** (the hard-gate floor) — folded into Tier B as its
  mechanical floor (D10 below), not simply dropped.
- **`gate-bypass D5`** (both halves — the `tier` axis and the human-set
  `level` ceiling) — kept unchanged (D11 below).

**D9 — the monotone invariant**: an agent's own self-judgment may only
move a decision *toward* asking, never below the mechanical floor. Every
check can only push toward a question, never toward silence. This is the
direct answer to `gate-bypass D2`'s own original worry (self-grading is
dangerous when it can *lower* the bar) — under D9 it structurally cannot.
The code already behaved this way (`canAutoApprove` returns `false` the
moment any check fails, `gate-bypass.mjs:130-138`); D9 locks that as a
deliberate decision instead of an incidental property.

**D10 — the risk-keyword floor becomes Tier B's mechanical floor, with a
wider read**: the 34-keyword list (`irreversible`, `data loss`,
`migration`, `breaking change`, `payment`, etc.,
`src/intake/risk-keywords.mjs:18-26`) is effectively already asking Tier
B's own question — it just used to answer it by grepping only the
frozen submit-time `title`/`description`, never `plan.md`. The fix keeps
the non-negotiable behavior (hitting the floor is always expensive, an
agent can never talk itself down — per D9) but widens the read to the
**union** of submit text *and* `plan.md`/footprint/child specs — strictly
additive, no coverage lost.

**D11 — the `tier` axis answers a different question than reversibility
and stays untouched**: size is not reversibility (a `heavy` refactor
contained to one branch reverts in one command; a one-line `light`
migration edit may not revert at all), so this axis was never in
conflict with Tier B and needed no change — only a clearer restatement
of what it actually means: how far a person delegates autonomous
execution, a different axis entirely. The human-set `level` ceiling
survives for the same reason: it is the one place in the whole system a
person can say "stop auto-approving, I want to look," and it is the
exact human-set ceiling `gate-bypass D2`'s original objection leaned on —
removing it would remove the argument protecting Tier B/D9 in the first
place.

## D12: the shape of a question, when one is actually needed

Present only the specific stuck point (never paste the whole plan and
end with one closing question); include the agent's own comparison work
(which options, on what evidence) so the person **edits** rather than
starts from zero; ask for the specific missing input, never a bare
approve/deny; batch every stuck point into one combined ask when there is
more than one (`AGENTS.md` priority #2 — a person's return trip should
resolve as much as possible at once); and when nothing is genuinely
stuck, ask nothing at all — post a single non-blocking notice line
instead, reusing the existing `auto-approved:` pattern from `gate-bypass
D3`.

## D14: a hand-back from planning to exploring must leave a real trail

Today, `fgos-coding-planning`'s own step 6 "Material" branch
(`SKILL.md:263-274`) records nothing when it hands an item back to
`exploring` — no `fgos decision`, no field, no event — so a session death
loses the context entirely, and re-entry re-runs `fgos-coding-exploring`'s
full step 1 scan and fires `contextApprove` again, becoming a second gate
inside `planning` (exactly the empty-gate complaint `tsk-5wr` raised).
The fix is prose-only, in both skill files, no new field, no engine
change: planning records a `fgos decision` naming the gap, why it is
material, and what Tier A already tried before hand-back; exploring's
re-entry reads that decision and resolves *only* that gap (no full
re-scan), closing with a new D-ID and an unchanged "Outstanding
questions: None"; and re-entry never re-asks `contextApprove` — that
hand-back already happened *because* a Socratic question was just asked,
so asking "approve CONTEXT.md?" immediately after is exactly the empty
gate this whole redesign exists to remove. `planning -> exploring` is
explicitly not a stage move (the `coding` domain's 8 edges never go
backward, `workflow-stage-graphs.mjs:125-160`) — it stays a same-session
skill call, and every patch here must preserve that.
