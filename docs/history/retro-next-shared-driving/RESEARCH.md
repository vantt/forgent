# RESEARCH: tsk-3cx — route retro-next's synthesis-skill invocation through a shared driving primitive

## Round 1 — 2026-08-11 (fgos-researching, stage `discovery`)

**Asked:** Is it clear how to refactor `/fgOS:retro-next` to delegate its
synthesis-skill invocation to `fgos-coding-driving` (or an equivalent shared
driving primitive) "the way `/fgOS:pick`, `/fgOS:discover`, `/fgOS:plan`,
and `/fgOS:discover-next` all do" (item's own wording), so it inherits the
same park/anchor handling and future driving improvements?

**Checked:**

- `plugins/fgOS/skills/retro-next/SKILL.md` (full read) — today's actual
  sequence: sweep (`fgos retrospective`) → pick
  (`pickNextRetrospectiveItem`, `src/state/retro-pool.mjs`) → resolve
  synthesis skill via `skillForStage(getDomain(domain), 'retrospective')`
  → invoke that skill directly in-session → on success, `fgos move <id>
  --to cleanup` → classify outcome by the `move` subprocess's raw exit
  code (0 / 7 lock-timeout / 3 conflict / other).
- `plugins/fgOS/skills/discover-next/SKILL.md` (full read) — the actual
  precedent the item cites: claims the item, then invokes
  `fgos-coding-driving` with an explicit `ceiling: stage:<name>`, relays
  whatever the driver reports verbatim. This IS a real, working "delegate
  to fgos-coding-driving" pattern — but only for the **stage axis**
  (`clarify`/`decompose`/`executing`), items still `doing`, pre-merge.
- `.claude/skills/fgos-coding-driving/SKILL.md` (full read) — the driver's
  loop is stage-indexed (`domain.stages.indexOf(stage)`), reads `stage`/
  `status` fresh each turn, and has an unconditional stop at
  `parkReasonForStatus == 'natural-finish'` (today: `status ==
  'awaiting-approval'`): "there is no next stage-skill registered past it
  for this loop to resolve... Merge/approve past `awaiting-approval` stays
  out of this loop's reach entirely." The word `retrospective` appears in
  this file only inside the terminal-status set used for the *open-children
  anchor check* (`delivered`/`retrospective`/`cleanup`/`done`/`wontfix`
  counting as "not open") — never as a status this loop itself drives
  through.
- `src/state/workflow-stage-graphs.mjs:114-154` — confirms `skillMap` does
  carry a `retrospective` entry (`'fgos-coding-compounding'`), added by decision
  record 0027 D5 specifically so `retro-next`'s lookup matches
  `skillForStage`'s own registry — this part of the item's premise is
  correct and already true today, zero work needed.
- **`docs/history/stage-status-driving-coordination/CONTEXT.md`** (full
  read — found via directory scan, not previously known to this item) —
  this is a **locked decision record**, produced by `tsk-1bl`/`tsk-2xt`
  after "two rounds of independent advisory review" with file:line
  evidence, whose entire subject is exactly this item's question: *should
  `fgos-coding-driving`'s stage-axis loop and `retro-next`/`cleanup-next`'s
  status-axis pool-sweep become one unified driving mechanism?* Answer
  recorded there: **no**.
  - **D1**: "`awaiting-approval → delivered` (merge/approve) is reserved
    for a human decision, structurally — never automated by any driving
    loop regardless of how the loop's handler-resolution logic is
    designed... `fgos-coding-driving`'s own hard stop here... stays
    exactly as-is."
  - **D2**: even granting a human has already crossed D1 manually (item
    now `delivered`), a single loop resuming automatic drive through
    `retrospective → cleanup → done` hits four independent structural
    breaks, quoted verbatim: (a) `fgos-coding-compounding` does not self-advance
    `status` the way `discover`/`decompose`/`return` do — a caller must
    separately run `fgos move <id> --to cleanup` after it (exactly what
    `retro-next`'s own step 5 does today); (b) `fgos retrospective` sweeps
    **every item currently at `delivered`**, not the one id a per-item loop
    is driving — invoking it from a single-item loop "reverses D9 of
    `work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
    ('processed by a separate loop… never inline in return/approve') with
    no new evidence"; (c) `cleanup`'s TTL gate actively parks
    `cleanup → blocked` with a reason when not yet elapsed, which "a naive
    continuous loop would misread as a real failure"; (d) stage-axis work
    runs inside the item's own worktree, but `approve` refuses to run from
    any worktree, and `cleanup` operates on `process.cwd()` in the main
    checkout — the phases are not reachable from one continuous process
    location.
  - **D3**: the two axes already coordinate correctly "by construction"
    through the item's own shared `status`/`stage` fields — "not via one
    loop calling the other." `RESOLVED_STATUSES` already includes
    `delivered`/`retrospective`/`cleanup` so nothing downstream ever waits
    on the post-merge chain finishing.
  - Resulting design diagram in that file explicitly draws Phase 1
    (stage axis, `fgos-coding-driving`) and Phase 2 (status axis,
    `retro-next`/`cleanup-next`, "whole pool... not tied to phase 1's
    specific id or session") as two loops that "never call each other."
- `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
  D9 (cross-checked, cited by D2 above): "`retrospective` is processed by
  a **separate loop**, run once per invocation, scanning every item
  currently at `delivered` — never inline in `return`/`approve`."

**Found — the conflict:**

tsk-3cx's own stated goal — delegate `retro-next`'s synthesis-skill
invocation to `fgos-coding-driving` "the way `/fgOS:pick`, `/fgOS:discover`,
`/fgOS:plan`, and `/fgOS:discover-next` all do" — reads as exactly the
"one unified driving-loop mechanism" that
`stage-status-driving-coordination/CONTEXT.md` D1-D3 already considered and
rejected, after two rounds of independent advisory review, for four
concrete structural reasons (D2 a-d above) that are about mechanics
(pool-vs-single-item sweep semantics, TTL-park-vs-failure misclassification,
worktree-vs-main-checkout process location, non-self-advancing status),
not about whether the axis-selection *logic* could be made smart enough.
`fgos-coding-driving`'s own file confirms this on the implementation side:
its loop is literally indexed by `domain.stages` (which does not, and per
that file's own comment on `skillMap`, structurally cannot, contain
`retrospective` — it is a `status`, not a `stage`), and it hard-stops at
`awaiting-approval` by design, with `retrospective`/`cleanup`/`delivered`
appearing only as "terminal, not-open" statuses for the child-anchor check.

The item's own text checked two *adjacent* skills for scope creep
(`cleanup-next`, `merge-next`) but does not mention or account for this
locked decision record, which is precisely on-point for the mechanism this
item proposes to build. This is not a missing fact fgos-coding-planning can look
up and proceed past — it is a direct collision with a decision a prior
session locked after real review, and reversing it needs new evidence or
an explicit user call (per this repo's own review-audit-self-decision
stance: verified decisions are not reversed on an abstract concern; a
proposal to reverse one is presented with the original decision, the
concern, the trade-off, and the concrete options, then a person decides).

**Still open:** which of these the person actually wants:

1. **Narrower delegation, respecting D1-D3** — `retro-next` keeps its own
   separate status-axis loop shape (pool sweep, own `move --to cleanup`
   call, its own park/anchor handling) but reuses specific *primitives*
   `fgos-coding-driving` already has internally (e.g. its
   `parkReasonForStatus`-based park classification, or its relay-vs-
   paraphrase error-category rule) without merging the two loops into one
   mechanism — closing the "thinner park/anchor handling" gap the item
   names without touching D1-D3's boundary at all.
2. **Revisit D1-D3 with new evidence** — argue tsk-3cx's own motivating
   case (retro-next won't automatically inherit future `fgos-coding-
   driving` improvements, e.g. tsk-23z's interactive title/description
   display) is new evidence D1-D3's authors did not have, and get explicit
   sign-off to extend `fgos-coding-driving` (or build a second, differently
   -scoped driving primitive) to legitimately cover the status axis for
   this one operation (skill-invoke + move-to-cleanup), without reopening
   the human merge gate itself (D1's actual protected edge).
3. Something narrower still that doesn't fit either of the above.

This is a product/scope decision, not a fact this skill can resolve by more
searching — returned as `unclear` to the caller.

## Round 2 — 2026-08-11 (user-driven reframe, answering Round 1's park)

**Asked:** the user rejected Round 1's framing outright and supplied a
three-concept vocabulary to re-derive the question against:
*orchestrator* (chooses and coordinates across items), *launcher*
(activates one item and sets its ceiling stage), *driver* (drives the
process on one item — on start, skips every step already passed, lands on
the correct current step, stops at the ceiling). Question: what are
`retro-loop`/`retro-next` under that vocabulary, and why can a driver not
own both `stage` and `status`?

**Found — Round 1's framing was wrong, corrected here:**

- **`status` is the full-lifecycle axis, not a tail segment.**
  `src/state/status-fsm.mjs`'s `TRANSITIONS` covers `todo → doing →
  awaiting-approval → delivered → retrospective → cleanup → done`, plus
  the `blocked`/`awaiting-human`/`wontfix` branches — ten values spanning
  the entire item lifetime. **`stage` is the sub-axis**: it only carries
  meaning while `status ∈ {todo, doing, blocked, awaiting-human}`, and is
  frozen from `awaiting-approval` onward. Round 1 called status "the
  post-merge chain", which inverted the relationship.
- **`fgos-coding-driving` already reads and acts on BOTH axes.** Its own
  loop re-reads `stage` AND `status` fresh each iteration, resolves three
  stop branches through `parkReasonForStatus(domain, status)`, claims when
  `status != 'doing'`, and filters open children by `status`. It was never
  a one-axis loop. The real, narrower fact: it uses **`status` as
  stop-conditions and `stage` as the advance-axis** — and its stop at
  `awaiting-approval` is, under the user's vocabulary, simply a *default
  ceiling*, not a structural wall.

**Re-examining Round 1's four "structural breaks" (D2 a–d) under the
launcher/driver split — three dissolve, one is a table entry:**

- **(b) `fgos retrospective` sweeps the whole `delivered` pool, not one
  id** — dissolves entirely. Sweeping a pool and picking one item is the
  **launcher's** job, never a driver's. Round 1 treated a launcher
  responsibility as evidence against the driver.
- **(a) `fgos-coding-compounding` does not self-advance `status`** — not a law.
  `fgos-coding-driving` **already carries this exact documented exception**
  for stage `discovery`, where `fgos-researching` likewise refuses to write
  state and the driver applies its returned verdict via `fgos discover` on
  its behalf (that skill's own `## Discovery and exploring stages`
  section, tsk-4b2 D4). A second instance of an already-established
  pattern, not a new class of problem.
- **(c) `cleanup`'s TTL gate parks `cleanup → blocked`, which a loop would
  misread as failure** — a missing **park vocabulary**, not an
  impossibility. `parkReasonForStatus` exists precisely as the indirection
  layer for this (its own registry comment: the indirection exists so a
  future domain "could relabel them without silently breaking this loop's
  own semantics"). A `waiting-ttl` reason distinct from `system-error` is
  one table entry.
- **(d) worktree vs main checkout** — the driver **already reads
  `domain.worktreeBacked`** and branches its claim path on it. Per-phase
  run location is a readable property, not a barrier.
- **(D1) the `awaiting-approval → delivered` human merge gate** — the one
  survivor, and it survives *as a ceiling*, which the driver already
  supports as a first-class input. Never contested by this reframe.

**The decisive new evidence D1–D3 never considered:**
`src/state/workflow-stage-graphs.mjs`'s `skillMap` **has already unified
the two axes** — one frozen object holding five stage names
(`clarify`/`discovery`/`exploring`/`decompose`/`executing`) *and* one
status name (`retrospective`), side by side. Decision record 0027 D5 put
them there deliberately, recording that "the two vocabularies never
collide" and that "which lookup table a key belongs to" is the caller's
concern, not the object's. So the registry is **already** an "item's
current position → skill to run" map mixing stage and status; only the
driver has not caught up, because its advance-axis is still hardcoded to
`domain.stages`. `stage-status-driving-coordination/CONTEXT.md` D1–D3 was
reasoned before/without this observation — it argued about merging two
*loops*, never about the fact that the *registry they both read* had
already merged the two vocabularies.

**User's decision (recorded here, then applied via `fgos answer`):** take
the reframe. The item is NOT "make retro-next call fgos-coding-driving as
it stands" (correctly rejected by D1–D3) and NOT "build a second, separate
status-axis driver" (which would add a mechanism rather than remove one).
It is: **generalize the driver's advance-axis to match what `skillMap`
already is** — resolve each iteration's next step from the item's current
position (reading `stage` pre-merge, `status` post-merge), add the
`waiting-ttl` park reason, keep `awaiting-approval` as the default
ceiling — after which **`retro-next` shrinks to its true launcher role**
(sweep, pick one, set ceiling, call the driver) and its hand-rolled
invoke/move/classify-by-exit-code sequence disappears. Net effect is one
fewer hand-rolled mechanism, not one more axis.

**Verdict:** clear. The remaining work (exact shape of the position→step
resolution, where `waiting-ttl` is declared, which callers change) is
implementation shaping — `fgos-coding-planning`'s job, not a gap blocking the
item.
