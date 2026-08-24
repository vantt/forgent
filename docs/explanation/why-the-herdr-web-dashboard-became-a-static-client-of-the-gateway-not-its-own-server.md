---
type: explanation
title: Why the herdr web dashboard became a static client of the gateway, not its own server
tags: [herdr, web-dashboard, gateway, realignment, auth]
source_capture_ids: [tsk-54j, tsk-3x6, tsk-ldb]
authoritative_for: why the herdr web dashboard's architecture moved from a standalone embedded webserver to a static bundle served by the existing gateway, and the security/lifecycle decisions that survived the realignment
---
# Why the herdr web dashboard became a static client of the gateway, not its own server

`tsk-54j` (P0a of `tsk-ldb`'s cluster) — writing the tech-agnostic area
spec at `docs/specs/herdr-web-dashboard.md`, following `AGENTS.md`'s own
rule that a new product area (and a new module adding config defaults or
infra dependencies) gets a spec before it gets code. Full design:
`docs/history/herdr-web-dashboard/CONTEXT.md`, later revised by
`docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md`.

## The original design (D1, D7-D9, D14) — a standalone embedded webserver

The dashboard was first locked as a new subsystem inside the existing
`herdr-fgos` binary (not a separate process), reusing `ports.rs`'s
`WorkItemSource`/`PaneRegistry`, with its own auth stack: a mandatory
token (env `FGOS_HERDR_WEB_SECRET`, or self-generated into a gitignored,
`chmod 0600` file under `.fgos/` — never in the git-tracked
`.fgos/config.json`), two-layer auth (cookie-session first, cf-access JWT
as an alternative credential), and a real frontend toolchain (vite +
TypeScript under `herdr-plugin/web/`, bundled via `rust-embed`, with a
`build.rs` guaranteeing `cargo build`/`test`/`clippy` never depend on the
frontend having been bundled first).

## The realignment — a later pass superseded the server, kept the toolchain

A later plan-realignment pass replaced the core architecture: the web
client is now a **static bundle served by the existing API gateway**'s
`/v1` HTTP surface (see
`docs/reference/fgos-gateway-api-ctr010.md`/`docs/explanation/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`),
not a subsystem living inside `herdr-fgos` at all. Consequences cascaded
cleanly from that one change:

- **Auth simplified to one existing mechanism.** The gateway already has
  its own `Authorization: Bearer` auth (`gateway.rs:421-449`) — the web
  client now uses that directly, dropping the cookie-session/`/api/login`
  layer entirely. `FGOS_HERDR_WEB_SECRET` and its self-generated secret
  file are gone; there is no longer a separate secret to manage. The
  cf-access JWT layer (a different item, `tsk-18to`) was untouched.
- **The bind-address risk stayed real, but the fix moved.** The original
  design's default-bind-`0.0.0.0` decision (with a mandatory,
  self-generated auth token as "the thing bearing real weight, not an
  optional hardening layer" — the product owner was shown this exact
  consequence and decided anyway) was never actually implemented before
  the realignment; the gateway had already merged with a hardcoded
  loopback-only bind. That decision stays correct as written; making the
  real bind match it became its own separate item.
- **The frontend toolchain survived unchanged in shape, moved in
  destination.** Still vite + TypeScript under `herdr-plugin/web/`,
  bundled via `rust-embed` — but embedded into the *gateway* now, not a
  standalone web server, gated by a config flag rather than being its own
  process. The rationale for keeping a real toolchain (rejected in this
  same session's own first instinct toward "no toolchain, plain
  HTML/JS," then reversed once prior art proved the `cargo build`
  fragility concern false — `herdr-gateway`'s own `build.rs` already
  guarantees `static/` exists before `RustEmbed` scans it) held
  regardless of where the bundle ends up living.

## Why the UI spec gates the mechanical build steps, not the reverse (`tsk-3x6`)

`tsk-3x6` (P0b) tracks the concrete UI spec/userflow
(`docs/reference/herdr-web-dashboard-layout.md`) as its own gated,
cited artifact — even though the product owner drives its actual
authoring with their own design tooling, the same shape a prior TUI
redesign already established (`docs/reference/herdr-dashboard-layout-and-action-queues.md`,
`tsk-1d5`, itself tracked via `tsk-jo1` with a doc-existence verify).

**Why this had to gate the later build steps (P3/P4) rather than trail
them**: the acceptance criterion the product owner actually stated for
the whole cluster is *subjective readability* — questions framed so a
person with zero context can answer quickly. A later step's own verify
can only prove mechanical correctness (askHistory pairs with settlement
answers by `seq`, a `docsRef` path-traversal attempt is rejected,
gate-approve entries appear alongside `ask` entries) — none of which
touches readability at all. A build could pass every one of those checks
and still completely miss the actual point. The UI spec is the only
artifact where that subjective criterion can be pinned into something
checkable *before* any pixels exist, which is exactly why it has to come
first and gate what follows, not just document it after the fact.

The spec had to cover the full userflow (login, taskboard, opening a
task, answering a parked question, approving a gate), the task-detail
layout specifically (the three-region arrangement of question / why it's
being asked / item context, and how a multi-round question/answer
timeline renders), empty/error states, and color/typography — authored
through the `ui-spec` skill's own tooling (added mid-item, once that
skill existed) rather than hand-authored, pulling product/actor/flow
facts from `tsk-54j`'s own area spec rather than re-deriving them.

## What didn't change: why the webserver outlives the cockpit pane (D12)

The dashboard's actual motivating use case is checking/approving **from a
phone** — exactly the moment no cockpit pane is open. If the web-serving
process lived inside the TUI process, the feature would be absent exactly
when it's needed most. This is why the serving process is a long-lived
child that survives the cockpit pane closing, not an architectural
preference — unaffected by the realignment above.

## A gap named but deliberately not filled: pending gate questions aren't visible remotely (D15)

Confirmed live by actually running a 7-item cluster in one session: every
gate question (`contextApprove`/`planApprove`/`validateApprove`) gets
asked and answered *synchronously within the live session* — never
recorded as durable state. `fgos show`'s own `gates` object only ever
holds completed records, no field for a currently-pending gate question.
The `ask` channel (`awaiting-human` status) has no such gap — it's real,
durable, remotely-observable data. Making a pending gate question visible
remotely while still pending would require a real architectural change
(recording gate questions as durable state) — explicitly named as a gap
for later, not something this item's own scope was widened to fix.
