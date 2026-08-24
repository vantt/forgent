---
type: explanation
title: Worker slot is the engine-owned occupancy unit across every launcher
tags: [worker-slot, occupancy, herdr-plugin, fgos-runner, fgos-fanout, ceiling]
source_capture_ids: [tsk-2sj, tsk-1zq, tsk-3jk, tsk-1oz, tsk-qrs, tsk-nwz, tsk-37t]
authoritative_for: worker slot concept and engine-wide worker occupancy ceiling shared by herdr-plugin, fgos-runner, fgos-fanout
---
# Worker slot is the engine-owned occupancy unit across every launcher

fgOS has three separate launchers that can start work: a herdr pane a
person opens by hand, the headless `fgos-runner` daemon, and
`fgos-fanout`'s batch dispatch. Each used to police its own idea of "how
much work is running" instead of sharing one. This item locked the
vocabulary and shape that lets all three answer to one authority instead.

## The unit: a worker slot, not "capacity"

> D1: Khai niem la 'worker slot' — 1 worker slot = cho dung cua dung 1
> rootTask (don vi work item lon nhat). Loai bo tu 'capacity' cho khai
> niem nay.

A worker slot is the occupied seat of exactly one rootTask — the largest
work-item unit — currently running. The word "capacity" was deliberately
not reused for this: `docs/decisions/0026:73-87` had already locked
"capacity" to a narrower, already-shipped meaning (a helper like
`judge-discovery` that never carries a full rootTask lifecycle), and
mixing the two would blur a subTask running under capacity with a
rootTask occupying a slot. "Worker" stays consistent with the
`fg:workers-N` tab name a person had already proposed; "slot" names the
*seat*, kept distinct from the *thing sitting in it*.

## Occupancy is engine state, never tool/label state

> D2: Engine so huu su that ve 'dang chay gi' — occupancy la state fgOS,
> khong phai state cua tool/launcher. He qua bat buoc: nhan/label cua
> pane KHONG BAO GIO duoc ganh state cua orchestrator, nhan chi de cho
> nguoi doc.

This mirrors the existing hard rule in
`docs/operator-runbook-herdr-cockpit.md`: every real status signal comes
from the fgOS event log, one source of truth. The rule traces to a real
production bug ("idle killed an agent") caused by a tool becoming a
second source of truth. Live evidence for the same failure mode already
existed in-repo: `herdr-plugin` used a fixed label
(`fgos-auto-discover`) as a dedupe key, but `/fgOS:discover-next` step 6
made the session wait on that label, so the guard silently vanished on a
later tick and a second pane opened. The fix pattern already existed and
was reused rather than invented: session-claim-liveness (`tsk-3ni`
D1/D4) — liveness = real file-edit activity in the worktree, computed as
`max(git log -1 %ct on fgw/<id>, latest mtime in git status
--porcelain)`, the same threshold `/fgOS:stale` already reuses.

## Rename and the slot concept ship as one feature

> D3: Co che rename/label va khai niem worker slot la MOT feature, khong
> tach doi; va khong va tam bug fgos-auto-discover dang song — de thiet
> ke nuot luon.

A pane label is only trustworthy once it stops carrying orchestrator
state (D2) — and it's the slot design that decides what state actually
remains for a label to carry. Splitting the two into separate items
would have meant locking the rename mechanism first, then reopening it
once the slot design landed. The trade-off (a duplicate pane can open
mid-design) was accepted deliberately in exchange for not building twice.

## Two lanes: execution and a permanently reserved admin seat

> D4: Hai lane rieng biet — execution (discovery/plan/implement) va admin
> (merge/retro/cleanup). Lane admin co cho danh rieng, KHONG BAO GIO bi
> execution chiem cho.

This is a structural necessity, not a comfort choice:
`src/runner/claim-port.mjs:160-167` already refuses to let a leaf claim
when its parent isn't merged (`deps-not-merged`) — which puts merge
strictly upstream of every new execution claim. If admin work shared one
pool with execution, a full pool would starve merges, which would starve
every subsequent claim, while the backlog kept growing. The separate-lane
shape wasn't invented here either — it already existed in code:
`tsk-5lr` `CONTEXT.md:21` records that `fg:operation` "never counted
against the `fg:agents-N` cap", and `agents_tab_index`
(`layout.rs:170-172`) only parses the `fg:agents-` prefix, so the
operation tab was already excluded from the count. This item generalized
an existing exclusion rather than inventing a new one.

A follow-up research pass (not a reopening of D4/D7) sharpened *why* the
two lanes count differently:

> D9: lane hanh chinh KHONG BAO GIO claim mot work-item, nen 'dem theo
> work-item' (D7) chi co doi tuong o lane execution. Lane admin la mot
> CHO DANH RIENG co kich thuoc co dinh theo so loai loop (3 hom nay + 1
> thu san = 4), khong phai mot pool duoc dem bang work-item.

Two independent code facts back this: (1) `src/state/status-fsm.mjs`
lines 123/133/134/135 show every admin-lane edge is
`awaiting-approval->delivered`, `delivered->retrospective`,
`retrospective->cleanup`, `cleanup->done` — none of them touch `doing`
(the only edges into `doing` are `todo->doing`, `blocked->doing`,
`awaiting-human->doing`); (2) the `approve`/`retrospective`/`cleanup`
verb bodies in `bin/fgos.mjs` never mention `doing` or `claimWork`. So
what occupies an admin seat is a scanning loop process, not a claimed
work-item — the execution lane's gate belongs in `claimWork`
(`claim-port.mjs:90`, the one choke point `take`/`pick`/`runner` all
pass through), while the admin lane uses one of two already-existing
pid-liveness mechanisms (`sessions.json` + `isPidAlive`, or the
`runner.lock` shape) — both engine-side, neither reading a label, so
both already satisfy D2.

## The unifying shape is a ceiling gate, not a global ranker

> D6: Hinh dang cua 'thong nhat' la GAC TRAN, khong phai ranker toan cuc.
> Giu nguyen 6 picker theo pool [...]; engine them dung mot lop: gac tong
> tran. Launcher XIN SLOT truoc khi dung worker, het cho thi bi tu choi,
> khong tu quyet.

The user chose this option after both were presented with a cost
analysis. A single ranker spanning every pool was left out on purpose:
comparing a discovery-stage item against a merge-stage item on one
priority axis needs real occupancy data that doesn't exist yet at this
design's starting point. The six existing pickers
(`pickNextDiscoverItem`, `pickNextPlanItem`, `pickNextRetrospectiveItem`,
`pickNextCleanupItem`, `frontier`, merge ranking) keep answering
correctly and without blocking; the engine adds exactly one more layer —
a ceiling gate a launcher must ask permission from before using a
worker, refused outright when full, never a launcher's own call to make.

## Counted per work-item, with a small, non-cumulative overflow allowance

> D7: Tran dem theo WORK-ITEM — mot work-item dang chay ton dung mot
> slot, bat ke launcher nao dung no len. Va tran la MEM o mep tren: mot
> launcher duoc phep vuot tran mot bien nho de khoi phai be mot me viec
> thanh hai wave.

Counting by work-item matches D1 directly (one slot = one occupied
rootTask seat) and gives all three launchers — a herdr pane, a headless
process, and an in-session Agent, each with very different resource
footprints — one shared unit to talk about. The soft-ceiling overflow
traces to a concrete example the user gave: 3 slots free, a fanout batch
of 4 — filling all 4 rather than splitting into two waves, prioritizing
Ship Faster (`AGENTS.md` item 1) over exact headcount, as long as the
overflow stays small and predictable.

> D8: Bien du di dien dat thanh luat tu mo ta, khong them nut chinh:
> KHONG BAO GIO be mot me da tinh san — con it nhat 1 slot trong thi lay
> tron me.

The decisive property: the overflow margin cannot accumulate. Once a
launcher has gone over, the next acquire call sees zero free slots and
is refused immediately — so the maximum possible overflow is bounded by
the largest batch any one launcher can create in one call
(`fgos-fanout`'s own cap of 5, so a maximum overflow of 4). This gave the
same flexibility the user's example called for, with no tunable
threshold to maintain.

## The label mechanism: a capability-gated helper skill, not an adapter poll loop

> D5: Co che dat nhan la mot HELPER SKILL co capability-gate, goi tu phia
> session (huong terminal/rename.sh hom nay), KHONG phai vong poll cua
> adapter ve nhan. [...] bug fgos-auto-discover duoc sua bang cach
> herdr-plugin HOI ENGINE thay vi doc nhan, chu KHONG phai bang cach cam
> session doi nhan.

An earlier proposal in the same design session — the label as a pure
projection, with the adapter re-deriving it on every poll and no skill
ever calling rename — was tried and rejected as an overgeneralization
from a single case. The common case: a person opens a session in a pane
by hand and runs `/fgOS:pick` — at that moment no orchestrator process
is necessarily running, and a dashboard may not even be open. The only
thing that knows "this pane is working item X" at that moment is the
session itself. If only the adapter ever wrote the label, that pane
would never get named. This is the reason `/fgOS:terminal` exists at
all and why `/fgOS:pick` step 3 calls it, and why `rename.sh` is
designed to exit `0` silently when not inside a herdr pane — not every
orchestrator even has a pane-label concept, so the abstraction point
needs its own capability gate.

## A finished pane is reusable without asking, and the driver's report lands on the item

> D10: Pane da xong la do bo — tai dung khong xin phep, tru pane dang
> duoc focus. Bo han nhanh delay-roi-dong (terminal-close 10s). Va cho
> bao cao cuoi cua driver mot cho ha canh tren item de nguoi doc ket qua
> bang `fgos show <id>` thay vi bang terminal phai canh.

Reframing the question — in a finished pane, what is actually the source
of truth? — the answer is: none of it lives in the pane. Code is already
committed on `fgw/<id>`; decisions are in the event log; a parked
question sits in `fgos ask --text`; documentation lives under `docs/`.
The only thing that ever existed solely inside the pane was the driver's
own final report (stop reason + summary) — and that is exactly what a
person would sit and wait to read. So rather than adding a pane-lifecycle
policy, this removes the reason to keep the pane open at all: the
"finished" signal already exists in herdr's own pane list/layout
(`focused_pane_id`), a legitimate chrome-level signal the operator
runbook does not forbid reading (unlike `agent_status`). The
delay-then-close mechanism (`terminal-close`, a 10s wait) was dropped
because it had proven unreliable by its own precedent in this same
session: `close.sh` passed all three of its guards in a real run yet
never actually ran, because it lived at the tail of a `SKILL.md` with
nothing forcing execution. Once a pane is reusable on demand, there is
no remaining reason to close it proactively.

## The herdr-plugin adapter: reuse by polling the engine, never a pane label

`tsk-1zq`, a child of this design (D5/D10 above put into practice on the
Rust side), switched `herdr-plugin` from counting worker panes for itself
to asking the engine for a slot via the `fgos slots` read verb before
opening one, and fixed the `fgos-auto-discover` bug D2 named from the
read side too — asking the engine whether an auto-discover worker is
alive instead of probing a pane label.

**Reclaim by reuse, never by closing.** Each poll, a pane whose bound
session no longer holds a `doing` item is free — the next worker runs
into that pane instead of splitting a new one, except a pane that is
currently focused (`focused_pane_id`, the same legitimate chrome-level
signal D10 already named, never the forbidden `agent_status`). This
applies only to the worker lane, which holds solely one-shot,
ceiling-bounded flows — the admin lane's loops live in the separate,
fixed `fg:operation` lane and are never subject to reuse. The
delayed-close path (`terminal-close`, the same mechanism D10 already
found unreliable in this same design session) was dropped entirely:
once a pane is reusable on demand, there is no remaining reason to close
it proactively.

**Two prior, separately-locked decisions were superseded, not extended:**

> "Supersedes tsk-5lr D2: pane identity inside fg:operation is no longer
> decided by left/right geometry (smallest x = left = merge-loop). The
> tab grows from 2 to 4 panes -- merge, retro, cleanup, plus one spare
> for a future admin loop -- and each slot is resolved by reading order,
> panes sorted by (y, x) [...] tsk-5lr's own pinned assumption, that an
> fg:operation tab without exactly 2 panes is an unsupported error state,
> stops applying with it."
> — real `work.decision` capture, id `tsk-1zq`

A binary left/right-by-x rule cannot address four slots, so the geometry
rule was replaced rather than stretched to fit — the same "migrate what
can move" instinct as the alias-vs-migrate choice
`docs/explanation/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias.md`
documents, applied here to layout logic instead of a stage name.

> "Supersedes tsk-1q3's pinned term fg:agents-N: the worker lane's tabs
> are named fg:workers-N from now on [...] A tab still carrying the old
> fg:agents-N label is deliberately NOT migrated: after the rename it is
> simply a normal tab, so herdr places no new pane in it, never reuses a
> pane inside it, and never closes it -- relabelling an operator's live
> workspace costs more than it fixes."
> — real `work.decision` capture, id `tsk-1zq`

Both supersessions follow this repo's own discipline of leaving the
original decision record untouched rather than editing it in place
(AGENTS.md's "Changing a locked law" rule, generalized here to any
locked decision, not only a platform law).

## `fgos-runner` and `fgos-fanout` close out the three-launcher set

`tsk-3jk` adopted the same D6 ask-before-standing-up rule in the two
remaining launchers, closing what its own capture calls the
"three-independent-ceilings gap": `runner.parallel.maxRoots` and
`maxLeavesPerRoot` (`src/runner/loop.mjs`) stopped being a ceiling of
their own and became inputs to the shared engine ceiling instead, and
`fgos-fanout`'s pre-existing D7 hard cap of 5 was restated in terms of
that same shared ceiling plus D7/D8's whole-batch overflow rule above —
rather than three launchers (herdr-plugin, `fgos-runner`, `fgos-fanout`)
each still policing its own separate number.

Both launchers now ask the engine for a slot before standing a worker up
and accept refusal when there is no room, the same `fgos slots`
pre-check the herdr-plugin adapter above uses. The item deliberately
consumed the config section `tsk-3dt` registered without touching
`src/setup/registrations.mjs` itself, keeping the two items' footprints
disjoint even though they share one config shape.

## What actually happened building this

The item's own outcome recorded `passed: true` reaching
`awaiting-approval` in one attempt, but its friction log shows a real
integration-drift block hit later, at merge time:

> cross-root integration drift at main@ef76f5442481ccd948e5310dec015ff10fb52806;
> git merge --no-commit --no-ff fgw/tsk-2sj conflicted; merge aborted,
> main unchanged.

The merge was aborted cleanly (main left unchanged) rather than landed
through a conflicted state — consistent with the design's own D2/D9
stance that the engine's event log, not an in-progress merge attempt, is
the single source of truth for what is actually running or landed.

## Post-merge gaps a review found after the four-way split landed (`tsk-1oz`)

A review pass after `tsk-2sj` merged to `main` found six real, verified
defects the split had left behind — none caught by the split's own
tests because each is about the boundary between the design and its
surrounding setup/doctor/skill-prose surface, not the ceiling logic
itself:

- **F0 — `fgos setup` armed a ceiling that instantly locked the
  backlog.** `registrations.mjs` registered `workerSlots` with a live
  `ceiling: 8`, and `doctor` actively nagged until a stale config ran
  `fgos setup` to pick it up. Any repo already running more than 8 items
  at `doing` — this one included, with 12 — got `ceiling-reached`
  refused on its very next `take`/`pick`/runner claim, from a setup step
  that never asked a person to choose a real number. The design had
  deliberately avoided a live in-code default for exactly this reason
  (a silent gate nobody chose) but left the identical landmine one
  `fgos setup` run away. **Fix**: the registered shape now writes
  `ceiling: null` — the config section exists (so doctor stops nagging
  about a missing key) while the gate itself stays off until a person
  sets a real number.
- **F1 — D10 shipped only half-built.** The `fgos report` verb existed,
  but zero skills actually called it, even though `plan.md`'s own A8
  assigned that prose half to the skill owning `fgos-coding-driving`.
  This call is the safety precondition for the pane-reuse behavior
  (`tsk-2sj`'s own T2) already shipped — without it, a driver's closing
  report only ever lived in a pane that pane-reuse could overwrite
  before anyone read it. **Fix**: wired the call into
  `fgos-coding-driving`'s own `SKILL.md`, in both the `.claude` and
  `.agents` copies, which this repo requires to stay byte-identical.
- **F2 — `workerSlots.adminReservation` was written and displayed, but
  never read.** `fgos setup` wrote it, `doctor` surfaced it, and
  `countWorkerSlots` ignored it entirely, returning a hardcoded constant
  instead.
- **F3 — a malformed `ceiling` silently disabled the gate while looking
  configured.** A string `"8"`, a float `8.5`, `0`, or `-1` all passed
  through with no doctor check flagging them, unlike the existing
  `checkInvariantChecksConfigured` precedent already covering this exact
  failure class for a different config section.
- **F4 — stale skill prose.** `discover`'s `SKILL.md` still claimed herdr
  always passes `--autoClose`, which `pick.rs` had already stopped doing.
- **F5 — a verb description contradicted its own output shape.** The
  `fgos slots` verb's description claimed its result was not a growing
  row set, while `execution.items` in fact grows one row per running
  item (see `docs/reference/fgos-slots-verb-output-fields.md`, the doc
  this description itself should have matched).

None of the six required reopening any of the ceiling/ask-before-
standing-up design above — every fix sits at the seam between that
design and setup/doctor/skill-prose, the class of gap a design's own
unit tests structurally cannot see because it is about what surrounds
the design, not what it computes.

## A second review round: the runner/fanout half of the same ceiling (`tsk-qrs`)

A separate review pass over the runner and `fgos-fanout` side (also
post-`tsk-2sj`) found five more real defects — this time about whether
the shared ceiling actually *covers* every launcher, not about setup/
doctor surfacing:

- **F1 — D8's whole-batch rule was documented but never actually built
  into the enforcing gate.** `hasWorkerSlotRoom` returns `granted` equal
  to the full requested `batchSize`, but `claimWork` calls it with no
  `batchSize` at all — so every claim in a batch is checked alone against
  `free`, and a batch of five against one free slot lands one and refuses
  the other four, not the documented "whole batch waits its turn"
  behavior. **Decision: retire D8 rather than rescue it.** The engine
  keeps its hard per-item ceiling (which never overshoots); a launcher
  trims its own batch down to `execution.free` before firing, instead of
  firing the whole batch and letting the engine sort it out. Per
  `AGENTS.md`'s own rule on changing a locked decision, this is recorded
  as a written supersede rather than an edit to the original — all three
  sites that had documented the never-built behavior (`worker-slots.mjs`,
  `loop.mjs`, and `fgos-fanout`'s own `SKILL.md` — including a red flag
  that had been forbidding the exact trim this decision now requires)
  were corrected to match.
- **F2 — the runner's discovery sweep bypassed the ceiling entirely.**
  It stands real worker processes up without ever requesting a slot and
  without occupying one, because it never claims (the item stays `todo`,
  and occupancy only counts `doing`). Net effect: a full execution lane
  correctly refuses its own wave, then spawns research workers anyway,
  while `fgos slots` under-reports what the machine is actually running.
- **F3 — a full lane's own log contradicted its own refusal message.**
  It printed "frontier empty, nothing to do" moments after refusing on a
  full lane, and reported outcome `idle` — giving a caller no way to
  distinguish "genuinely no work" from "work is waiting behind a full
  lane."
- **F4 — an abandoned session claim could wedge every launcher
  permanently, once a real ceiling was armed.** `startupReap`
  deliberately skips `human`/`session` claims (by design, for a different
  reason), and nothing surfaced which items were holding the occupied
  slots — even though the wave gate already had those ids in hand and was
  simply discarding them.
- **F5 — `fgos-fanout`'s own refusal branch had no loop, no wait, no
  bound, and no give-up rule.** A literal reading of the skill prose fell
  straight through the refusal into the exact dispatch line the refusal
  was supposed to prevent.

Taken together with `tsk-1oz`'s six gaps, all eleven trace to the same
root shape: the ceiling/ask-before-standing-up computation itself was
correct and well-tested, but each of the three launchers' own *use* of
it — batching, sweep-vs-execution occupancy, refusal reporting, reap, and
loop control — had its own independent gap a unit test scoped to the
shared engine code could never see.

## An unarmed ceiling (F0's own fix) silently zeroed fgos-fanout's batch (`tsk-nwz`)

`tsk-1oz`'s own F0 fix made `fgos setup` write `workerSlots.ceiling: null`
on purpose — present but unarmed, so `doctor` stops nagging while the
gate stays off until a person sets a real number. That is exactly the
state a fresh `fgos setup` ships. In that state, `fgos slots --json`
reports `execution.hasRoom: true`, `execution.free: null`, reason
`no-ceiling-configured` — correct at the engine level.

`fgos-fanout`'s own skill prose, however, computed its batch as
`min(5, execution.free)` and forbade firing more Agents than
`execution.free` — with `free` literally `null`, there is no number the
skill's own prose permits it to fire, so a launcher following it
dispatched **nothing**, on a fresh install, with the engine wide open the
entire time. No branch in the skill prose covered the unarmed case at
all.

The engine's own API never had this hole: `hasWorkerSlotRoom` already
returns `granted` equal to the full batch size when no ceiling is
configured — the correct "wide open" answer. The bug was narrower than
it looked: `fgos slots` never exposed `granted` at all, so the skill's
prose had nothing to point at except `free`, the one field that goes
`null` in exactly this state.

**Fix**: prose-only, in both `.claude/skills/fgos-fanout/SKILL.md` and
its `.agents` mirror (kept byte-identical by `test/skills/fgos-mirror.test.mjs`)
— teach the skill that `execution.free: null` means no ceiling is armed,
and the batch in that case is `min(5, batch.length)`, matching
`hasWorkerSlotRoom`'s own `granted` contract instead of a field that was
never meant to answer this question in the unarmed state.

## Two more engine gaps: stuck-past-ceiling reclaim, and a phantom report id (`tsk-37t`)

Found by a review pass after `tsk-2sj`, distinct from — and uncovered
by — the `tsk-1oz`/`tsk-qrs` fixes above:

- **The `excludeId` escape hatch stops working exactly when it is
  needed.** `worker-slots.mjs` documents `excludeId` as the reason a
  stale item sitting at the ceiling isn't permanently unreclaimable —
  true at `occupied == ceiling`, but not past it: with a ceiling of 8 and
  12 items at `doing`, excluding the target still leaves 11, `free`
  clamps to zero, and the claim is refused. `claim-port.mjs`'s ceiling
  gate runs *before* the stale-reclaim block, so the reclaim path is
  unreachable precisely when a person is trying to clear the stale
  claims that wedged the lane in the first place — the only way out was
  hand-editing config. `tsk-1oz`'s own `ceiling: null` fix means this
  can't bite a *fresh* repo, but it still bites any repo that armed a
  real ceiling and later drifted past it, whether by lowering the number
  or by accumulating abandoned claims. **Fix**: the ceiling gate now
  exempts stale-claim reclaims specifically, rather than applying
  uniformly regardless of whether occupancy is at, below, or already
  past the ceiling.
- **`fgos report` accepted an id that doesn't exist.** It exited zero
  with a success envelope and wrote a decision record that `fgos show`
  can then never retrieve, since `show` itself refuses an unknown id.
  `addDecision` validated `text`/`rationale` but never that the work item
  actually existed — every neighboring id-taking verb validates first.
  This mattered little while `report` was typed by hand; it matters now
  that `fgos-coding-driving` calls it automatically at every stop (the
  closing-report convention this same driving loop follows on every
  stop, including this one) — a wrong id in prose now silently loses the
  closing report with no error. **Fix**: `addDecision` now validates the
  work item exists before writing, matching its neighboring verbs.

## Related

- `docs/reference/fgos-slots-verb-output-fields.md` — the `fgos slots`
  CLI verb's real output shape, the read-only half of this design
- `docs/history/orchestrator-worker-slots/DISCUSSION.md` — the full
  shaping discussion this design was distilled from
- `docs/history/orchestrator-worker-slots/RESEARCH.md` — the discovery
  research backing D9's two code-fact citations
- `docs/history/orchestrator-worker-slots/plan.md` — the implementation
  plan built on these locked decisions
