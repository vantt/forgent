---
framework: diataxis
mode: reference
---
# herdr web dashboard: layout, userflow and visual language

The read-in-one-pass layout document for the herdr web dashboard. This is
what `tsk-5jr` (taskboard) and `tsk-4id` (task detail) open while building.

**Product source:** `docs/specs/herdr-web-dashboard.md` — the area spec.
Every screen, rule and behaviour below traces to a section of it. Where
that spec has an Open Gap, so does this document; nothing here settles a
product question it left open.

**Machine-readable companion:** `docs/ui-spec/` — surface files with
validated interaction contracts, plus a clickable wireframe. Regenerate
with the commands in `docs/ui-spec/00-overview.md`. Current state:
**10 surfaces, 42 actions, 2 flows, validation clean (0 errors, 0
warnings).**

**Precedent:** `docs/reference/herdr-dashboard-layout-and-action-queues.md`
is the equivalent document the TUI redesign produced. Same role here.

## Why this document exists at all

The acceptance criterion for this whole cluster is subjective:
*questions framed so a person with no context in their head can answer
quickly.* `tsk-4id`'s verify proves only correctness — that question
history pairs with answers by sequence, that a bad documentation path is
refused, that gate questions appear alongside ask questions. **Not one
clause touches readability.** So P4 can go fully green and still miss the
point.

This document, and the wireframe beside it, are the only place that
criterion becomes checkable before pixels exist.

## Userflow

Five surfaces, two flows. The full contracts are in `docs/ui-spec/flows/`.

### Answering a parked question (F01) — the flow this cluster exists for

```
 Sign in  ─▶  Taskboard  ─▶  Needs answer  ─▶  Task detail  ─▶  Answer
  S01          S02             S04               S03            M01
 one field   "is there      triage without    read: question   submit in
 (usually    anything       opening — each    → why → item     place, runs
 skipped)    for me?"       row carries the                    fgos answer
                            question text
```

The person arrives cold, on a phone, with no cockpit open. Each step is
designed against that: the board answers *is there anything for me* before
anything is read; the list answers *can I do this now or does it need a
laptop* without opening anything; the detail answers *what is being asked
and why*; the modal takes the answer without sending them to a terminal.

### Approving a merge (F02) — the only flow that changes trunk

```
 Taskboard  ─▶  Task detail  ─▶  Confirm  ─▶  outcome
   S02            S03              M02
                  approve is    what lands,   delivered, or
                  disabled      into which    parked blocked
                  with a        branch, which with the engine's
                  reason where  verb, on which own reason —
                  it can't run  machine        both shown
```

Approve is a separate modal rather than an inline button on purpose: a
person must never change trunk by muscle memory. Where the gateway is not
at the repository's main working tree, `fgos approve` structurally cannot
run — the control is shown **disabled with the reason**, never hidden and
never offered-then-failed.

## Taskboard

A board, not a flat table. Monday.com and ClickUp are the reference, and
the three things taken from them are: **status groups**, **colour-coded
status pills**, and **quick actions in place**.

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ herdr   [project ▾]  [gateway: dev-box ▾]      ⚠ reachable on network  │
├ CONTROLS ──────────────────────────────────────────────────────────────┤
│ [search…]  Group by: [Status ▾]  Filter: [Stage ▾][Risk ▾]  [+ Add]    │
├ BOARD ──────────────────────────────────┬ NEEDS ANSWER ────────────────┤
│ ▾ NEEDS ANSWER · 2          ● amber     │  tsk-4id                     │
│  ┌────────────────────────────────────┐ │  "Which pairing key…"        │
│  │ tsk-4id  Task detail pairing    ⋯ │ │  parked 2h ago               │
│  │ ● awaiting-human · executing      │ │  [ Answer ]                  │
│  └────────────────────────────────────┘ │                              │
│ ▾ IN PROGRESS · 3           ● blue      │  tsk-k4v                     │
│ ▸ TODO · 11                 ● slate     │  gate: validateApprove       │
│ ▸ DONE · 48                 ● green     │  [ Review ]                  │
└─────────────────────────────────────────┴──────────────────────────────┘
```

On mobile the rail becomes the first group, because on a phone the whole
question is *does anything need me*.

Three decisions worth keeping:

- **Groups collapse and remember.** `DONE · 48` is noise on a phone.
- **The exposure indicator is permanent, in the topbar.** The surface is
  on by default and reachable beyond loopback — a standing fact, so a
  standing indicator, never a dismissable toast.
- **The gateway picker sits next to it.** The client must not assume one
  fixed origin, and a person aggregating machines needs to know which one
  they are reading before they trust a number.

The item card carries status in colour and stage as plain text beside it.
Status is what people triage on; stage is detail. Equal visual weight
would defeat the glance.

`Retire` — never `Delete`. fgOS has no delete verb and its history is
append-only, so the word would promise something the system cannot do.

## Task detail

**The core deliverable.** The taskboard mostly exists to reach this.

Three regions in a fixed reading order, and the order *is* the design:
**what is being asked → why it is being asked → what it is about.**

```
┌ TOPBAR ────────────────────────────────────────────────────────────────┐
│ ← Board    tsk-4id · Task detail pairing        ⚠ reachable on network │
├ QUESTION ──────────────────────────────────────────────────────────────┤
│  NEEDS YOUR ANSWER · parked 2h ago · round 3 of 3                      │
│                                                                        │
│  Which pairing key should the timeline use when askHistory and         │
│  settlements have drifted by one?                                      │
│                                                                        │
│  [ Answer this ]                                                       │
├ WHY ───────────────────────────────────────────────────────────────────┤
│  Why you're being asked                                                │
│  Two options are still standing after a real comparison, and the       │
│  locked decision (D2) deliberately added no linking key.               │
│  Tried already: read D2, ran the pairing on tsk-48i's 23/23 records.   │
├ CONTEXT ───────────────────────────────────┬ TIMELINE ─────────────────┤
│  What this item is                         │  round 1 · 4d ago         │
│  tsk-4id · P4 task detail                  │  Q  Show machine log?     │
│  ● awaiting-human · executing · high-risk  │  A  No — narrative first. │
│                                            │                          │
│  What the agent did                        │  round 2 · 2d ago         │
│  Read ports.rs, confirmed WorkItemSource   │  Q  Collapse or omit?     │
│  has 5 fetch_* methods. Wrote the pairing  │  A  Collapse.             │
│  read on settlements[] ordered by seq,     │                          │
│  no schema change (D2).                    │  round 3 · 2h ago         │
│                                            │  Q  Which pairing key…    │
│  ▸ Machine decision log (12)               │  A  — waiting             │
├ ACTIONS ───────────────────────────────────┴──────────────────────────┤
│  [ Answer this ]   [ Edit ]   [ Retire ]      [ Approve merge ⓘ ]     │
└────────────────────────────────────────────────────────────────────────┘
```

Mobile stacks the same order. The value is the sequence, not the columns.

### Why the regions sit in this order

- **QUESTION first, alone, large.** Someone arriving cold reads one thing.
  Putting item metadata above it makes them scroll past bookkeeping to
  reach the only thing that needs them.
- **WHY second, carrying what was already tried.** This is the whole
  difference between a ten-second answer and an investigation. It names
  the options still standing and the work already done, so the person
  edits reasoning instead of starting from nothing.
- **CONTEXT third, narrative before machine log.** The human narrative is
  the primary account; the machine decision log renders collapsed behind a
  disclosure showing its count.

### The question/answer timeline across rounds

Pairing is **positional** — the i-th question with the i-th answer, in
recorded order, because the underlying records carry no linking key by
deliberate decision. So the timeline renders as an ordered list of rounds
and **never draws a link the data does not carry**: no arrows implying
that a particular answer caused a particular later question. Order and
timestamps only.

The open round shows its answer slot visibly empty (`— waiting`) rather
than omitted, so it is obvious at a glance that exactly one round is
outstanding, and which.

### Write controls

The three actions are visually distinct from everything above them, and
`Approve merge` is distinct again — it is the only control on this client
that changes trunk.

## Empty and error states

Full catalogue in `docs/ui-spec/30-states-and-errors.md`. The ones that
matter most:

| Situation | What the person sees |
|---|---|
| **Item never parked** | "This item has never needed a person." The empty timeline is normal — not an error, and not a bare empty box. |
| **Board genuinely empty** vs **filter matches nothing** | Two different screens on purpose. The filter case always names the active filter and offers to clear it, so nobody is left guessing why the board looks empty. |
| **Nothing waiting on you** | Reads as the good outcome. No error styling, no call to action. |
| **Documentation path missing** | The item still renders; the narrative region says the narrative was not found and names the path it looked for. |
| **Documentation path outside the docs tree** | Refused, and said so in that same region — not a page-level failure. |
| **Approve can't run here** | The control is disabled *before* the click, with the reason attached. |
| **Gateway unreachable** | Content marked stale explicitly, writes disabled, retry offered. Stale data is never presented as current. |
| **A write is refused by fgOS** | The engine's own message, verbatim. Anything typed is preserved, never cleared. The UI does not paraphrase a refusal into something friendlier and less true. |
| **Sign-in failed** | One message, always the same words, whatever the cause. The screen must not become an oracle telling an attacker which half of their guess was right. |

## Colour and typography

Implementation stack, settled at this item's gate: **Tailwind**, with
**stitch** used to generate the initial layouts and export Tailwind/HTML
as a starting point (cleaned up, not used raw). This fills a gap the
frontend toolchain decision left open — that decision locked vite and
TypeScript and said nothing about CSS. Every frontend piece downstream
writes styles in Tailwind rather than choosing again.

### Status colours

Status is the one thing carrying colour meaning. Everything else is
neutral, so colour never competes with itself.

| Status | Token | Reads as |
|---|---|---|
| `awaiting-human`, `awaiting-approval` | amber 500 | needs a person — the only warm colour on the board |
| `doing` | blue 500 | in flight |
| `todo` | slate 400 | queued |
| `blocked` | red 500 | stopped, needs a look |
| `delivered`, `retrospective`, `cleanup` | emerald 400 | landed, winding down |
| `done` | emerald 600 | finished |
| `wontfix` | slate 300, struck | retired |

Colour is never the only signal: every pill carries its status word too.
A colour-blind reader loses nothing, and so does anyone on a washed-out
phone screen in sunlight — which is the actual use case.

### Typography

| Role | Treatment |
|---|---|
| The question on task detail | largest text on the page — larger than the item title, deliberately |
| Item titles, group headers | semibold, base size |
| Status words, stage, timestamps | small, medium weight, muted |
| Narrative body | regular, generous line height, measure capped around 70 characters |
| Ids (`tsk-4id`), branch names, verbs | monospace, so they are recognisably machine tokens |

The single typographic rule worth stating: **the question outranks the
item's own name.** Everything else follows from that.

### Density

Comfortable on mobile, compact on desktop. The board is scanned; the task
detail is read. Different jobs, different densities — but one type scale
for both, so nothing looks like a different product.

## Deliberately left open

- **Motion and transitions** — implementer's call.
- **Exact Tailwind token values** — the table above names roles and the
  standard palette steps; a build-time theme file pins the literals.
- **The gateway's own API contract** — not yet written. Where this
  document says "runs `fgos answer`", the transport is whatever that
  contract lands on. See the area spec's Open Gaps.
- **Multi-endpoint switching UX** — the topbar carries a gateway picker
  because the client must not assume one fixed origin, but how a person
  manages several endpoints is deferred, per the area spec.
