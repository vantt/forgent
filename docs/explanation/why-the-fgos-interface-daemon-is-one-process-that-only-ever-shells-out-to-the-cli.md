---
type: explanation
title: Why the fgOS interface daemon is one process that only ever shells out to the CLI
tags: [interface-daemon, gateway, orchestrator, herdr, mcp, distribution]
source_capture_ids: [tsk-7l9]
authoritative_for: why the fgOS interface daemon combines gateway and orchestrator into one process, why it never links the core lib in-process, and how its REST/RPC and future MCP surfaces are scoped
---
# Why the fgOS interface daemon is one process that only ever shells out to the CLI

`tsk-7l9`. Implements the architecture decision `0014`
(`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`, "model 3:
core-library + thin adapters") that had been locked but never built —
`STR38`/`STR48` (human-UI listener, attention/push channel) sat
`proposed` in `docs/backlog.md`, and the prerequisite core/lib split
(`p-09351985`) is also still `proposed`. Full design:
`docs/history/fgos-interface-daemon/CONTEXT.md`.

## The shape: one process, two internal modules, per machine

**D1** — gateway and orchestrator ship as **one process per machine**,
never split across machines with a `--role gateway`/`--role
orchestrator` flag. Internally they stay separate modules with a real
boundary (D7), but the deployment unit is one binary. **D2** — scope is
per-machine, managing multiple projects/repos on that one machine;
multi-machine use lives entirely at the client layer (a future desktop
app connecting to N independent gateway instances), never as replication
or leader-election the daemon itself performs. This is deliberately
narrower than `STR27`'s fleet-registry scope (still `proposed`, gated on
real fleet need) — this item builds none of that.

## Why it never links the fgOS core lib, even though that would be faster

The daemon talks to fgOS core **only through the CLI** — spawning `fgos
<verb>` for writes, polling `fgos list`/`rollup`/`data_hash` for reads.
It never links the core lib directly. `p-09351985`'s lib split staying
`proposed` is not incidental to this — decision `0014` deliberately
keeps that door shut until (a) the lib split actually lands, **and** (b)
a later, separate, explicit decision opts the daemon into linking it.

The concrete reason this isn't just caution: the daemon lives inside the
existing `herdr-fgos` Rust binary (**D8**), reusing the same hexagonal
ports-and-adapters architecture `herdr-plugin` already established
(`tsk-3t9`) — `WorkItemSource` (the fgOS data-source port, CLI-shelling
only, per `0014`'s own words: "only Node in the same process may link
the lib... this Rust binary only talks through CLI"), and
`PaneOrchestrator` (the same herdr pane-orchestration port the TUI's own
keypress handling already calls — gateway's REST/RPC surface becomes a
*new caller* of that same port, not a new mechanism). Rust and Node are
different languages/runtimes — an in-process link was never on the table
architecturally, so the daemon always subprocess-spawns `fgos <verb>`,
the same cost profile ordinary CLI calls already have today. The user
explicitly accepted this trade for v1: simplicity over that specific
performance win.

## D7: gateway is the one internal chokepoint that ever spawns a verb

Both reads (`list`/`rollup`/`data_hash` polling) and writes
(`answer`/`approve`/etc.) go through gateway. The orchestrator never
spawns a verb itself — it asks gateway, in-process (same process per
D1), to do so. This centralizes three things in one place instead of
duplicating them between gateway and orchestrator: the `STR38`
identity-gate ("who is allowed to say which verb"), audit logging, and
CLI-subprocess handling.

## What v1 deliberately does not cover

- **D3** — the orchestrator-to-herdr relationship is unchanged:
  `docs/specs/runner.md` RUL40 stays as-is, driving herdr purely through
  its existing `PaneOrchestrator` port. Herdr is never trusted as a
  decision signal; the orchestrator reads real work-item state back only
  through `WorkItemSource` (the fgOS CLI), never from herdr's own report.
- **D4** — auth v1 is one token per machine, covering every project on
  it. No per-project token yet — that matters more once a desktop client
  is juggling credentials for N machines, which isn't the case yet.
- **D6** — headless runner integration is deferred entirely out of v1.
  The orchestrator's only real v1 job is driving interactive herdr/pane
  workflows; headless work stays exactly as it is today (a person running
  `fgos-runner --once` in a manual pane loop, RUL40's 4-pane cockpit).
  When headless integration is eventually built, the orchestrator will
  need to hold and track the runner's child process directly (not
  fire-and-forget) and will need its own crash-recovery design first —
  explicitly not designed by this item.

## D5: where per-machine daemon state lives

Global daemon state (lock, project registry, listening port/config)
lives at `~/.fgos/config.json` and sibling files under `~/.fgos/` — this
settles a previously open question in `docs/distribution-vision.md:112`
("where does fgOS read global config from?"), now decided here.

## D10 then D9: a real versioned API contract first, an MCP surface after

**D10** — gateway's API is a real, versioned, public contract: an
OpenAPI (or equivalent) spec checked into the repo, carrying its own CTR
number and a `<name>/v<N>` version token per decision `0011` — joining
the existing numbered CTR family (CTR001 one-door-write, CTR002
single-writer-lock, CTR006 routing-handoff, CTR008 attention envelope)
rather than being left as undocumented route handlers.

**D9** — a *future* MCP surface (not v1 itself) follows the "Code Mode"
pattern (Cloudflare's "give agents an entire API in ~1,000 tokens"
approach): exactly two MCP tools, `search` and `execute`, against
gateway's own capability surface — `search` queries D10's own OpenAPI
spec, which is precisely why D10 has to exist first. `execute`'s
generated code calls gateway's own functions/routes, never fgOS core
directly — still funneled through D7's one chokepoint. Since the user
explicitly deprioritized security/isolation for v1 (same trust model as
today's direct CLI/Bash agent access — no new privilege is granted),
`execute` runs in a lightweight same-process bound-function context
(Node's `vm`/`new Function`, or a Rust equivalent) rather than any real
sandboxing (`isolated-vm`, `boa`/`deno_core`, a container/microVM) —
deliberately the minimum viable execution context, not Cloudflare's own
multi-tenant-grade isolation, because Cloudflare's reason for full V8
isolates (untrusted third-party code) doesn't apply here.

## Why this belongs to mission #1/#2

This is platform-layer infrastructure other tools connect to (a future
desktop client, an MCP-speaking agent) rather than fgOS improving its own
contributor experience — squarely the same mission boundary
`docs/explanation/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md`
already names for a different item: fgOS exists to be the platform layer
other projects and workflows build on, not to develop itself for its own
sake.
