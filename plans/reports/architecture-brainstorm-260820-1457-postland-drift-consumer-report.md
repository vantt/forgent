# postland-drift-consumer — architecture brainstorm

tsk-1el, parked `awaiting-human` at stage `exploring`. Full research trail:
`docs/history/postland-drift-consumer/RESEARCH.md`.

## 0. A finding I nearly missed — read the item's OWN prior evidence first

The item already carries a `decision` entry (source: `session`, written by an
earlier session that filed this gap while doing real merge work — see
§4) with file:line evidence I had not fully re-derived. Two facts from it
change the shape of this brainstorm materially:

1. **The user's original symptom (`test chạy lặp đi lặp lại sau
   return/catchup` — verify re-running repeatedly after return/catchup) is
   already fixed** by tsk-2ypd's own D4 design. Not part of this gap.
2. **Only the `notify` branch is actually dead. `stale` is already covered
   by a different, existing mechanism** — see §3.3. This directly affects
   how much "all" (your answer to open question 3) should mean.

I verified fact 2 myself before trusting it (`approve.mjs:487`,
`sync-root.mjs:211` — see §3.3): it holds.

## 1. Module boundary / SRP brainstorm (your question 1)

### 1.1 What already exists, and the boundary it already follows

`tsk-2ypd`'s own detection code already splits correctly along the exact
boundary `tsk-49i` (delivered, `docs/history/` — the acyclic-module-boundary
Rust-porting design pass) locked down:

- **Pure logic (Rust-port candidate — "zero `child_process`")**:
  `classifyPostLandDrift` (`src/state/graph-harness.mjs:457-469`) — takes
  already-known file lists and session ids, returns `{notify, stale}`. No
  fs, no git, no `Date.now()`.
- **Git I/O shim (stays a shim, not portable as-is)**: `detectPostLandDrift`
  (`src/runner/merge.mjs:774-857`) — shells `git diff` via `changedFiles`,
  reads `.fgos/sessions.json` via `listSessions`.

This item's own scope (consuming the result) needs to preserve that same
split, not blur it back together.

### 1.2 The sibling precedent that already answers "where does this kind of
consumer go" — `driftStatus`/`unmergedDeliveries`

`src/state/drift-status.mjs` is the closest existing sibling to this
problem — a **different** drift concept (branch ahead/behind, stranded
deliveries) with the *same* shape (read-only, git-shelling, must stay out
of `graph-harness.mjs`'s strict purity). Its own header states the design
principle directly:

> "NOT cached... every field here is recomputed fresh from git refs on
> each call... avoids a second state-consistency surface next to
> `events.jsonl`, which is already known fragile under concurrency."

Its consumer wiring (`src/setup/registrations.mjs:824` `checkRootDrift`,
registered as a `fgos doctor` check) is a **live recompute at read time**,
not a persisted flag written once at merge time. `driftStatus` is also
consumed directly by `merge.mjs`'s own readiness ranking
(`src/verbs/merge/merge.mjs:32`) — one computation, two consumers, zero
persistence.

**This is the strongest architectural signal for this item**: fgOS's own
established pattern for "tell someone about drift" is *recompute-on-read +
doctor-check registration*, not *snapshot-at-write-time + new persisted
field*. `postLand.notify` was computed once, eagerly, at merge time — the
one existing sibling mechanism for a structurally identical problem
deliberately avoids exactly that shape.

### 1.3 SRP critique of the three options the filing session already proposed

The evidence decision on the item itself already proposes three directions
(verbatim, translated): (a) print a warning in `approve`/`sync-root` when
`notify` is non-empty; (b) `fgos-fanout`/orchestrating session reads the
field and `SendMessage`s the child session; (c) write a real notification
into `.fgos/sessions.json`.

- **(a) print-only**: cheapest, but only reaches the *merging* session's
  own terminal — never the leaf session that actually owns the drifted
  branch (a different terminal, usually a different person/pane). Doesn't
  satisfy "báo thật cho phiên sống" as I read the item title (the live
  session = the leaf owner, not the merger) — flag this reading back to
  you explicitly in §5.
- **(b) fgos-fanout SendMessage**: only works when the leaf session was
  itself launched as a fanout child of the SAME orchestrating session
  (`fgos-fanout`'s own scope). Any leaf claimed independently (a person
  running `/fgOS:pick` by hand, the common case) has no orchestrating
  parent to receive from. Not general enough as the *only* mechanism, but
  fine as an *additional* fast path when fanout topology applies.
  Ownership also feels wrong: `fgos-fanout` (whose one job is scheduling
  batches of children) would gain a permanent side responsibility of
  message delivery for an unrelated feature — SRP violation.
- **(c) write into `.fgos/sessions.json`**: `session.mjs`'s own header
  already flags that file as "read-modify-written cross-process" —
  layering a notification/mailbox concern onto a file whose single
  responsibility today is *session liveness* mixes two concerns that fail
  independently (a bad write here would corrupt session tracking, not just
  lose a notification). Also the write-door discipline conflict noted in
  RESEARCH.md still applies — `merge.mjs` never writes `.fgos/`, so this
  write would have to happen from `bin/fgos.mjs` regardless of which file
  it targets.

### 1.4 Recommended shape (SRP-clean, matches the `driftStatus` precedent,
Rust-portable)

Split into layers with one responsibility each — the same three-way split
`tsk-49i` already uses to reason about Rust-porting:

| Layer | Responsibility | Where | Portable? |
|---|---|---|---|
| **Compute** | "does open item X's branch overlap paths that just landed on its target, and is X's session still alive" | `src/state/graph-harness.mjs` (pure, already exists) + a **new**, `drift-status.mjs`-shaped function recomputing this **on demand** rather than reading a merge-time snapshot | Pure half yes; shim half no (same split `driftStatus` already has) |
| **Surface (pull, passive)** | expose it as a `fgos doctor` check, same registration shape as `checkRootDrift` | new function in `src/setup/registrations.mjs`, registered via the existing `registerCheck` | Not itself portable (doctor is a JS CLI concern today), but calls into the portable compute layer |
| **Surface (pull, in-flow)** | a leaf session naturally sees "your branch now overlaps a just-landed merge" the next time `fgos-coding-driving`'s Step 1 re-reads item state, or via `fgos show <id>` | one line added to the driving loop's existing Orient read, no new infrastructure | n/a — reuses existing loop |
| **Deliver (push, optional)** | proactively alert even an idle session | extend `scripts/herdr-cockpit-notify.mjs`'s existing poll-and-diff pattern (`detectNewAwaitingHuman`'s shape, generalized) to also watch the compute layer's output | Explicitly chrome-only already (own header) — correctly NOT a Rust-port target |

Each row is independently testable, independently portable/not-portable,
and matches an existing precedent in the repo instead of inventing a new
shape. "Giao đúng người đúng việc": compute stays with the state layer
(portable core), doctor/driving-loop/notify-script each own exactly one
delivery surface, none of them own detection logic.

## 2. "Dễ tách dễ sữa, dễ migrate qua Rust"

Recommend **not persisting a merge-time snapshot at all** if recompute-on-
read is feasible (mirrors `driftStatus`'s explicit reasoning against a
"second state-consistency surface"). If a snapshot turns out to be
required (e.g. the landed branch/commit is later deleted and can't be
diffed against retroactively — needs checking at planning time whether
`fgw/<id>` branches get deleted after merge), the fallback is the
**decision-log**, not a new field/event type: the exact "write through the
decision log, `source: <tag>`, surfaced via `fgos show <id>`, no new
schema" pattern `fgos-coding-driving`'s own closing-report mechanism
already established (`references/reclaim-and-role-graph.md` — "no new
event type, no new field"). Reusing that shape means zero new persistence
surface to port to Rust later; only the read side needs a Rust port
eventually, same timeline as everything else in `src/state`.

## 3. Investigation of related work items (your question 2)

### 3.1 Direct siblings (drift/stale detection precedents already shipped)

- **tsk-5m7** (`driftStatus` + doctor wiring) and **tsk-62y** (wire drift
  into root/milestone close-out) — the `checkRootDrift` precedent cited
  above. Both `done`.
- **tsk-1bl** (`classifyStalePostDelivery`) — a different "item forgotten"
  detector (delivered/retrospective/cleanup staleness, not branch-content
  drift). Notably its own CONTEXT explicitly rejected "notification/trigger
  tức thời lúc delivered" as a **D9-reversal disguised as notification**
  (advisor self-caught in that item's own review). Relevant caution for
  this item too: a "notify immediately" design has to justify itself
  against that same standing objection, not just be convenient.
- **tsk-4qu**/**tsk-4s0** — a related, already-fixed gap: a leaf merging
  into an already-resolved root landed nowhere and no bucket reported it.
  Confirms `driftStatus`/`mergeReadiness`'s bucket-based reporting is the
  house style for "something needs a human's attention post-merge."

### 3.2 Module-boundary / Rust precedent

- **tsk-49i** (`retrospective`) — the acyclic-boundary design pass cited
  throughout §1. Its own next step says explicitly: "a design pass
  (`fgos-coding-shaping`) to turn this into a locked layer-boundary
  decision before any refactor code is written" — not yet locked. This
  item's plan should cite tsk-49i's findings (as done above) but should
  **not** block on tsk-49i landing first; the compute/surface split above
  already respects its boundary without needing the refactor.
- **tsk-397** (`delivered`) — core-foundation vs domain-specific directory
  boundary discussion, references the `bee` upstream 3-layer model (Rust
  core / vendor payload / prose). Confirms the wider intent: fgOS is
  actively moving toward `bee`'s "port by (call-frequency × simplicity),
  not importance" strategy (ADR0025) — favors the recompute-on-read +
  small pure function shape (cheap, simple, called often) over a bespoke
  notification subsystem (rare, complex).

### 3.3 The claim I verified: D3's inbound-gate catchup already covers
`stale`

`approve.mjs:487` and `sync-root.mjs:211` both run `performCatchUp`
unconditionally as a **standard entry-gate step**, every time an item
actually reaches its own merge turn (tsk-4ax, D3) — not only as recovery.
So an item with no live session (the `stale` bucket) still gets rebased
against its target's latest state automatically the moment it merges;
nothing ships broken silently. The gap is specifically: a live session
sitting on a drifted branch has no *early* signal to react before their
own merge turn arrives (which could be a while, and a bigger conflict
later than a small one now). That's `notify`, not `stale`.

**This means "cover đúng đủ" and "3. all" may be in tension** — see §5
question 2. I'm flagging the conflict rather than either blindly
implementing both branches or silently narrowing your answer.

## 4. Confirmed: this really was filed by a live session mid-merge

The item's own `decision` log (source: `session`) is dense, cites exact
file:line evidence and 9 passing tests, and explicitly frames itself as
catch-up documentation ("submit ban đầu chỉ mang theo dòng title ngắn,
thiếu toàn bộ evidence") after an initial thin submit. This matches your
description — filed by a session that had just done real merge work and
noticed the gap live, not a hypothetical audit finding.

## 5. Recommendation + questions back to you

**Recommendation**: recompute-on-read (§1.4 table) over persist-at-write,
registered as both a `fgos doctor` check (matches `checkRootDrift`
precedent, reaches any session that runs doctor) and a
`fgos-coding-driving` Orient-time surface (reaches the leaf's own live
session automatically, zero new infra) — herdr-cockpit-notify extension
as an optional third layer, explicitly non-portable and separable.

Two things need your call before this goes to `planning`:

1. **Delivery target** — confirm "phiên sống" means the *leaf branch
   owner's* session (my reading, driving the doctor + driving-loop design
   above), not the merging session's own terminal (which the filing
   session's option (a) would satisfy far more cheaply, just printing a
   warning during `approve`/`sync-root`).
2. **Scope now that `stale` is confirmed already covered by D3's gate**
   (§3.3) — does "3. all" still mean build a `stale` consumer too (there's
   no unmet need for one today), or was that answered before this
   evidence surfaced and you'd narrow it to `notify` only now that stale's
   real gap is closed?

Answering these two turns this back into a clear `fgos discover
--verdict clear` at the next pass, no further research needed.
