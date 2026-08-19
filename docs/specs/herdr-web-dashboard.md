---
area: herdr-web-dashboard
updated: 2026-08-14
sources: [herdr-web-dashboard, fgos-interface-daemon]
decisions: []
coverage: partial
---

# Spec: herdr Web Dashboard (browser surface for fgOS work)

## Purpose

The web dashboard is a browser surface for watching fgOS work and answering
the questions it raises, from a device that is not the developer's machine.

The need it exists for is concrete, and it is the reason the design looks the
way it does: the product owner wants to **review and approve from a phone**,
and at exactly that moment there is usually no cockpit terminal open
(rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own rationale section for the child-process decision — the dashboard runs as a child process that outlives the cockpit pane, precisely so it does not vanish when the terminal closes). A surface that
only lives as long as a terminal pane is absent precisely when it is needed.

Three things bound this surface:

- It runs **alongside** the herdr TUI, never replacing it (boundary: web dashboard is a new subsystem inside the herdr-plugin Rust binary, runs alongside not instead of the TUI). A
  person at a terminal keeps the TUI; the dashboard serves the person who is
  not at one.
- It is an **independent client project**, not code inside the `herdr-fgos`
  binary (per fgos-interface-daemon — gateway/orchestrator/TUI stay inside the herdr-fgos binary via hexagonal ports; the web client is a separate adapter calling in from outside). It calls the gateway's REST/RPC API from the outside,
  which is what decision `0014` requires of any non-terminal UI. An earlier
  decision of this feature (tsk-ldb's own — web dashboard as a new subsystem inside herdr-plugin) proposed embedding an HTTP server
  directly in `herdr-fgos`; that branch is closed — cite fgos-interface-daemon's hexagonal-ports decision, not
  tsk-ldb's original one, for where the web client lives.
- It never becomes a second write path. Every change it makes goes through
  an fgOS one-door-write verb executed by the gateway (R2 below).

**Out of scope for this spec.** Question authoring quality at the source
(`tsk-539`, deliberately decoupled — tsk-ldb and tsk-539 stay scope-separated). Multi-project port/identity
mechanics (`tsk-3b0` — multi-project port/identity handling is deferred to tsk-3b0). The concrete visual layout, colour and
typography (`tsk-3x6`, `docs/reference/herdr-web-dashboard-layout.md`) — this
spec states what an actor expects to be able to do, never how it is drawn.

## Entry Points & Triggers

- **Open the dashboard.** A person opens the dashboard's address in a browser
  on any device that can reach the machine. The first interaction is always
  sign-in; there is no anonymous view (mandatory token auth from v1, not deferred to a later version).
- **Open the taskboard.** The default landing surface once signed in: every
  work item on the connected project, grouped so the person can see state at a
  glance.
- **Open one task's detail.** From the taskboard, or directly by address.
- **Open "questions needing answer".** The list of everything currently
  waiting on a person — covering **both** channels, `ask` questions and
  `gate-approve` questions (question-needing-answer covers both channels), not just the `ask` channel.
- **Availability trigger (not a person's action).** The dashboard is reachable
  whenever its own process is running. That process is started and stopped
  from the cockpit but **outlives the cockpit pane** — closing the cockpit does
  not stop the dashboard (it runs as a child process outliving the cockpit pane). It is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles), listens on the
  configured bind address (default reaches beyond loopback — binds 0.0.0.0 by default, bind address configurable, warns when non-loopback) and on port
  8788 (its config section carries a port field, defaulting to 8788).
- **No outbound trigger exists.** Nothing notifies the person that a question
  is waiting; they have to come and look. A push/attention channel is a
  different, unbuilt capability (`docs/io-contract.md` §Ranh giới — STR48).

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item | One unit of tracked work, as fgOS defines it | see `docs/specs/work-state.md` — this surface introduces no new item shape | — | — |
| 2 | Status | Where the item sits in its lifecycle | fgOS's own status set (`todo`, `doing`, `awaiting-human`, `awaiting-approval`, `blocked`, `delivered`, `retrospective`, `cleanup`, `done`, `wontfix`) | yes | — |
| 3 | Stage | Where the item sits within the front of its lifecycle | the item's own domain's stage list | no (frozen from `awaiting-approval` on) | — |
| 4 | Question needing an answer | One thing waiting on a person; the union of the two channels | an `ask` question, or a `gate-approve` question (`contextApprove`/`planApprove`/`validateApprove`) | — | — |
| 5 | Answer | The person's reply that releases a waiting item | free text | yes, to answer | — |
| 6 | Agent work history | What the agent actually did on this item | narrative from the item's own `CONTEXT.md`/`plan.md` is the primary source; the machine-side decision log is expandable detail, not shown by default | — | narrative shown, machine log collapsed |
| 7 | Question/answer timeline | Questions paired with their answers across repeated park rounds | pairing is positional — the i-th recorded question pairs with the i-th recorded answer, ordered by sequence number | — | — |
| 8 | Sign-in session | Proof that this browser may act | a session established by presenting the machine token once | yes | — |
| 9 | Machine token | The single credential guarding the surface | resolved from the environment first, otherwise from a generated local secret file that is never committed | yes | generated on first run |
| 10 | Gateway endpoint | The gateway instance this client is talking to | an address; the client is built to hold **more than one** (per fgos-interface-daemon — a future desktop client aggregates one gateway per machine) | yes | — |

## Behaviors & Operations

Each operation below states the verb it goes through. That is load-bearing,
not decoration: the dashboard never writes fgOS state itself (R2).

### Sign in

- **Blocked when:** the presented credential does not match. Every failure —
  wrong token, malformed request, unknown route — looks identical from
  outside: the surface gives back nothing that distinguishes "wrong token"
  from "nothing here" (every auth failure returns an opaque 404, never 401).
- **What changes:** a session is established for this browser.
- **Side effects:** none on work state.
- **Afterwards:** the person lands on the taskboard.

### View the taskboard

- **Blocked when:** not signed in.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees every work item on the connected project.
  **The actor-facing expectation is a board, not a flat table** — the
  reference experience is Monday.com/ClickUp: items grouped by status, state
  legible at a glance, quick actions reachable in place without opening the
  item, and controls to filter and regroup. What that looks like concretely —
  layout, colour, spacing, typography — belongs to `tsk-3x6`, not here.

### View a task's detail

- **Blocked when:** not signed in, or the item does not exist.
- **What changes:** nothing — this is a read.
- **Side effects:** none.
- **Afterwards:** the person sees, for that one item: what the agent did
  (narrative first, machine decision log available but collapsed), and
  the question/answer timeline across however many rounds the item has been
  parked. This screen is the core deliverable of the whole surface; the
  taskboard exists mainly to reach it.

### Answer a parked question

- **Blocked when:** not signed in; or the item is not actually waiting on a
  person (its own lifecycle rules refuse the change, and that refusal is what
  the person sees).
- **What changes:** the answer is recorded and the item resumes, through the
  fgOS `answer` verb.
- **Side effects:** the item leaves the "questions needing answer" list.
- **Afterwards:** the person sees the item's new state. Answering happens
  **in place, on this surface** — the person is not sent to a terminal. This
  settles the question left open when the question-needing-answer decision established only that the screen
  *surfaces* both channels: the gateway is already the component that runs
  fgOS write verbs on a client's behalf, and `answer` is named among them
  (fgos-interface-daemon's own chokepoint decision), so sending the person out to a CLI would contradict the
  contract this client is written against.

### Approve a merge

- **Blocked when:** not signed in; or the item is not at the point where a
  merge decision applies; or the gateway is not positioned to run the verb
  (see R7 — `approve` refuses to run anywhere but the repository's main
  working tree).
- **What changes:** the merge decision is recorded and the merge is performed,
  through the fgOS `approve` verb.
- **Side effects:** **this changes trunk.** It is the only operation on this
  surface that does, and it is the reason the exposure note in R8 exists.
- **Afterwards:** the person sees the outcome, including a failure that left
  the item blocked rather than merged.

### Add a work item

- **Blocked when:** not signed in, or the description is empty.
- **What changes:** a new work item is created through the fgOS intake verb.
- **Side effects:** none beyond the new item.
- **Afterwards:** the person sees the new item's id and its derived fields.

### Edit a work item

- **Blocked when:** not signed in, or the target item does not exist.
- **What changes:** the named fields are overwritten through the fgOS `edit`
  verb, which applies the same validation a terminal edit gets.
- **Side effects:** none beyond the item.
- **Afterwards:** the person sees the item's updated fields.

### Retire a work item

- **Blocked when:** not signed in; or the item is in a state its own
  lifecycle rules will not retire from.
- **What changes:** the item is moved to the terminal "valid, but never going
  to be done" state, through the fgOS `move` verb.
- **Side effects:** the item leaves the open-work lists.
- **Afterwards:** the person sees it as retired. **This is retirement, not
  deletion, and the difference is not cosmetic** — fgOS exposes no delete
  operation at all, and its history is an append-only record, so nothing this
  surface offers can erase an item or its past. A person who asks to "delete"
  an item gets retirement, and the surface should say so in those words rather
  than implying the record is gone.

## Actors & Access

| Capability | Holder of the machine's token |
|---|---|
| Read: taskboard, task detail, questions needing answer | ✓ |
| Write: answer a question, add, edit, retire an item | ✓ |
| Write: approve a merge (changes trunk) | ✓ |

**There is exactly one technical actor, and this table is the whole access
model.** That is a statement about what the system enforces, not about who is
expected to use it. Two consequences are worth naming plainly rather than
leaving a reader to discover them:

- **Product roles are not enforced roles.** "The product owner reviewing from
  a phone" is who this surface is *for*; it is not a role the system can tell
  apart from any other holder of the same credential.
- **There is no finer grain to reach for.** fgOS deliberately has no
  authorization layer — "who may call which verb" is a separate, unbuilt
  capability (`docs/io-contract.md` §Ranh giới, STR38) — and the gateway's own
  credential is one token covering the whole machine, not per project and not
  per person (one token per machine, per fgos-interface-daemon's auth decision). So read access and trunk-changing access are the
  same access. See Open Gaps.

## Business Rules

- **R1.** The surface is a client of the gateway's API, never an embedded
  server inside `herdr-fgos` (per fgos-interface-daemon's hexagonal-ports decision, decision `0014`). It is built to
  address more than one gateway, so no single fixed origin may be baked into
  it (per fgos-interface-daemon's per-machine-scope decision).
- **R2.** Every write goes through an fgOS one-door-write verb — `answer`,
  `approve`, the intake verb, `edit`, `move` — executed by the gateway, which
  is the sole component that runs those verbs on a client's behalf (per fgos-interface-daemon — gateway is the sole chokepoint that ever spawns fgos verbs). The web surface never writes fgOS state directly. No second write path
  is introduced by anything in this spec.
- **R3.** A person may not read anything before signing in (mandatory token auth from v1). Sign-in is
  token-based, and every failure is indistinguishable from "nothing here"
  (an opaque 404, never 401). A second, alternative credential path exists in the design and, if
  used, must verify its assertion's signature properly rather than trusting a
  header (the two-layer additive auth design — cookie session plus an optional cf-access JWT that must be cryptographically verified, never trusted on the header alone).
- **R4.** The token is never stored anywhere that is committed. It comes from
  the environment when set; otherwise it is generated into a local file that
  is excluded from version control and readable only by its owner.
- **R5.** The surface is enabled by default (its own config toggle defaults ON, unlike other auto-launch toggles) and its default bind reaches
  beyond loopback (binds 0.0.0.0 by default, bind address configurable), with a warning raised when the bind is not loopback.
  Its port is 8788, chosen to coexist with the neighbouring service on 8787
  (its config section carries a port field, defaulting to 8788).
- **R6.** The dashboard's lifetime is independent of the cockpit's. Closing a
  cockpit pane does not stop it (it runs as a child process outliving the cockpit pane).
- **R7.** A merge approval can only be performed where fgOS allows it: the
  `approve` verb structurally refuses to run from a linked worktree and
  requires the repository's main working tree. This is a real mechanical
  constraint on the deployment, not a UI concern — a gateway positioned
  anywhere else cannot offer this operation at all, and the surface must
  report that honestly rather than appearing to offer it.
- **R8.** The combination of R5 (on by default, bind beyond loopback) and the
  write operations above means **the first run of the cockpit exposes a
  trunk-changing surface on the network, without anyone having chosen to**.
  The token (R3/R4) is therefore not a hardening layer that can be traded away
  for convenience — it is the only thing holding the surface closed. The
  product owner decided this default having been shown this exact consequence
  (rationale: `docs/history/herdr-web-dashboard/CONTEXT.md`'s own consequences section for the on-by-default decision), and the
  write operations added later raise its weight rather than changing the
  decision.
- **R9.** Questions and answers are paired positionally, by order of
  recording, with no linking key added to the underlying records — the record
  shape is deliberately unchanged.
- **R10.** The narrative written for humans is the primary account of what an
  agent did; the machine-side decision log is secondary detail.
- **R11.** Nothing on this surface pushes to a person. Being informed is a
  pull: the person opens the dashboard and looks.

## Edge Cases Settled

- **An item that has never been parked.** Its task detail shows a work history
  and an empty question/answer timeline — the empty timeline is the normal
  case, not an error.
- **An item whose narrative source is missing.** Its documentation reference
  can point at a directory that does not exist. The detail screen shows the
  item without its narrative rather than failing; the missing narrative is
  reported as missing.
- **A narrative reference pointing outside the documentation tree.** Treated
  as invalid and refused, not followed.
- **The cockpit is closed.** The dashboard keeps serving (R6) — this is
  the whole point of the design, not a leftover process.
- **The gateway is unreachable.** The client says so plainly and offers to
  retry; it never presents stale data as current.
- **Approve is offered where it cannot run.** Covered by R7 — reported as
  unavailable with the reason, never attempted and silently failed.
- **Retire is asked for as "delete".** Covered under Retire a work item —
  the surface performs retirement and names it as such.

## Open Gaps

- **Authorization granularity for write actions — unresolved, and it is the
  significant one.** Everything under Behaviors & Operations that writes, and
  `approve` above all, is available to whoever holds the machine's single
  token. There is no per-person, per-project, or per-verb distinction to
  spec against, because neither fgOS nor the gateway has one (STR38 unbuilt;
  fgos-interface-daemon's own one-token-per-machine decision does not add one). The exposure is stated rather than mitigated. Closing this
  needs its own item and its own decision — the authorization layer's own
  scope, not this spec's, and not something to be improvised inside the web
  client.
- **The gateway's own API contract now exists** —
  `docs/contracts/fgos-gateway-api-v1.yaml`, landed by tsk-7l9, carrying 18
  paths that match `herdr-plugin/src/gateway.rs`'s registered routes 1-to-1.
  This spec still describes operations in product terms rather than
  restating endpoint shapes, but that contract — not this prose — is the
  boundary's source of truth, and any surface built against it cites it
  directly. Two facts from it constrain this spec's own surfaces and are
  recorded here rather than left to be rediscovered: there is **no edit
  route** (`/work/{id}` is `get` only), so M03's edit mode depends on a
  route that has to be added first; and there is **no SSE or WebSocket**,
  only a `GET /state/digest` cheap poll, which is why `15-system-events.md`
  describes client-derived events rather than server-pushed ones.
- **Multi-project and multi-endpoint behaviour is only half-decided.** The
  client must not assume one fixed gateway (fgos-interface-daemon's per-machine-scope decision, R1), but how a person
  chooses between projects and instances, and how the surface shows which one
  they are looking at, is deferred to `tsk-3b0` (multi-project port/identity handling is deferred there).
- **No attention channel.** R11 records that nothing notifies a person. Whether
  it should is a separate, unbuilt capability (STR48).
- **Coverage is `partial` on purpose.** The three read screens are locked by
  fourteen decisions; the six write operations were added later, outside that
  discussion, and are settled here only as far as existing mechanisms and the
  product owner's decisions at this item's own gate allow.

## Visuals

Not specified here by design. The concrete layout, userflow, empty/error
presentation, colour and typography are `tsk-3x6`'s deliverable:
`docs/reference/herdr-web-dashboard-layout.md`, which takes this spec as its
product input. The one direction this spec pins is the actor-facing
expectation recorded under "View the taskboard": a Monday.com/ClickUp-style
grouped board with in-place quick actions and filtering, not a flat table.

## Pointers (implementation)

- `docs/history/herdr-web-dashboard/CONTEXT.md` — the fourteen locked
  decisions this spec cites throughout, plus the scout evidence
  behind them.
- `docs/history/herdr-web-dashboard/DISCUSSION.md` — the five discussion
  rounds those decisions came out of.
- `docs/history/herdr-web-dashboard/plan.md` — the build shape: five pieces
  (config/doctor, server core and sign-in, taskboard, task detail, alternative
  credential path), plus this spec's own planning section.
- `docs/history/fgos-interface-daemon/CONTEXT.md` — the gateway's own locked
  decisions, in particular per-machine scope (multi-endpoint clients),
  one token per machine, gateway is the sole runner of fgOS verbs,
  where gateway lives (that web is an independent client), and the API
  contract still to be written.
- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` — why a non-terminal
  UI is a client of a network gate rather than its own server.
- `docs/io-contract.md` — the CLI's in/out contract, and the explicit boundary
  saying the authorization layer (STR38) and the attention channel (STR48) are
  outside it.
- `docs/specs/work-state.md` — the lifecycle meaning behind every status,
  stage, question and answer this surface displays.
- `docs/reference/herdr-web-dashboard-layout.md` — the UI layer (`tsk-3x6`).
