# fgOS interface daemon — decision record

Item: `tsk-7l9` — "fgOS interface daemon: REST/RPC gateway orchestrating
herdr + headless runner".

## Feature boundary

**In scope (v1):** a REST/RPC gateway, living inside the existing
`herdr-fgos` Rust binary alongside its current TUI and pane-orchestration
code, exposing the fgOS core verb surface and herdr's pane-orchestration
actions to non-terminal clients (web dashboard now, MCP-based agent access
later). One gateway+orchestrator process per machine, managing every
project/repo on that machine.

**Out of scope (v1, explicitly deferred):** headless-runner integration
(D6); multi-machine orchestrator election/fleet coordination (D2 — that is
`STR27`'s own gated scope, `docs/backlog.md`, "chỉ mở khi có nhu cầu fleet
thật", not reopened here); any code-execution sandbox hardening beyond a
same-process bound-function context (D10) — the user has explicitly
deprioritized security/isolation for v1 in favor of correctness, speed,
and simplicity; the web dashboard's own screens/UI (that is `tsk-54j`,
which now depends on this item, see below).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Gateway and orchestrator combine into **one process per machine** — no `--role gateway`/`--role orchestrator` split across machines. Internally they stay separate modules with a real boundary (D7), but ship as one binary/process. |
| D2 | Scope is **per-machine**, managing multiple projects/repos on that machine. Multi-machine use is handled entirely at the CLIENT layer (a future desktop app connecting to N independent, self-contained gateway instances) — never by the daemon itself replicating or electing across machines. This is deliberately narrower than `STR27`'s fleet-registry/heartbeat/lease scope (`docs/backlog.md`, still `proposed`, gated on real fleet need) — this item does not build any part of STR27. |
| D3 | Orchestrator↔herdr keeps `docs/specs/runner.md` RUL40 unchanged: orchestrator drives herdr purely by calling its existing `PaneOrchestrator` port (`herdr-plugin/src/ports.rs`) — open/focus a pane, launch a loop — the same calls the TUI's own keypress handling already makes today. Herdr is never a decision signal; orchestrator reads real work-item state back only through the `WorkItemSource` port (→ fgOS CLI), never trusts herdr's own report. |
| D4 | Auth v1 = **one token per machine**, covering every project on that machine. No per-project token in v1 (deferred — would matter more once a desktop client juggles credentials for N machines, not needed yet). |
| D5 | Global per-machine daemon state (lock, project registry, listening port/config) lives at **`~/.fgos/config.json`** (and sibling files under `~/.fgos/`). This settles `docs/distribution-vision.md:112`'s own open question ("fgOS đọc config global ở đâu (`~/.fgos/config.json`?...)" — previously unresolved, now decided here). |
| D6 | **Headless runner integration is deferred out of v1.** Orchestrator's only real job in v1 is driving herdr/pane workflows (interactive). Headless work continues exactly as today — a person runs `fgos-runner --once` in a manual pane loop (RUL40's 4-pane cockpit). When headless integration is picked up later, the user has confirmed the orchestrator will hold and track the runner's child process directly (non-interactive `runner-once`, not fire-and-forget) — that item will need its own crash-recovery design (does the orchestrator persist a dispatched-PID table under `~/.fgos/` for reconciliation after its own restart?) before it can be built; explicitly not designed here. |
| D7 | **Gateway is the sole internal chokepoint that ever spawns `fgos <verb>`** (both reads — `list`/`rollup`/data_hash poll — and writes — `answer`/`approve`/etc.). Orchestrator never spawns a verb itself; it asks gateway (in-process call, same process per D1) to do so. This centralizes the STR38 identity-gate ("ai được nói verb nào"), audit logging, and CLI-subprocess handling in one place instead of duplicating it between gateway and orchestrator. |
| D8 | **Gateway/orchestrator/TUI all stay inside the existing `herdr-fgos` Rust binary**, organized via the SAME hexagonal ports-and-adapters architecture `herdr-plugin` already established (`tsk-3t9`, done — `herdr-plugin/src/ports.rs`, `docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md`): (a) `WorkItemSource` (fgOS data-source port, CLI-shelling only per decision `0014` — that CONTEXT.md's own D-notes already cite 0014 directly: "chỉ Node cùng-tiến-trình mới link lib... Rust binary này chỉ nói qua CLI" — gateway's own verb-execution surface extends/sits beside this port, never bypasses it, and never opens a path to link the core lib in-process); (b1) `PaneOrchestrator` (herdr pane-orchestration port — gateway's REST/RPC/MCP surface becomes a NEW caller of this SAME port, alongside the TUI's own existing keypress-driven calls); (b2) `TerminalUi` (TUI render port, untouched by this item). No new cross-cutting boundary needs inventing — tsk-3t9's seam-cutting already delivers the contract-based independence this item needs; gateway is simply a new adapter fitting into the existing hexagon, not a fourth bolted-on thing. Consequence: gateway can never cheaply link the Node fgOS core lib in-process (different language/runtime); it will always subprocess-spawn `fgos <verb>`, same cost profile as today's CLI calls — the user has explicitly accepted this trade for v1 (simplicity over that specific performance win). |
| D9 | **A future MCP surface follows the Code Mode pattern** (Cloudflare's "give agents an entire API in ~1,000 tokens" approach — see Sources below): expose exactly 2 MCP tools, `search` and `execute`, against gateway's own capability surface (D10's own OpenAPI spec is what `search` queries), rather than one MCP tool per endpoint. `execute`'s generated code calls gateway's own functions/routes, never fgOS core directly (still funnels through D7's chokepoint). Since the user has explicitly deprioritized security/isolation for v1 (same trust model as today's direct CLI/Bash agent access — no new privilege is granted), `execute` runs in a lightweight same-process bound-function context (e.g. Node's `vm`/`new Function`, or the Rust equivalent if gateway ends up needing one) — no `isolated-vm`, no `boa`/`deno_core` embedding, no container/Docker/microVM. This is deliberately the minimum viable execution context, not Cloudflare's own multi-tenant-grade isolation (their reason for V8 isolates doesn't apply here — no untrusted third party). |
| D10 | **Gateway's API is a real, versioned, public contract — an OpenAPI (or equivalent) spec checked into the repo, carrying its own CTR number and a `<name>/v<N>` version token per decision `0011`** (`docs/backlog.md`'s existing CTR family: CTR001 one-door-write, CTR002 single-writer-lock, CTR006 routing-handoff, CTR008 attention envelope — gateway's API contract joins this same numbered family, not left as undocumented route handlers). This is not just good practice — it is a mechanical prerequisite for D9: the MCP `search` tool has nothing to query without a real machine-readable spec. |

## Pinned terms

- **"Gateway"** — the sole internal chokepoint that spawns `fgos <verb>` (D7) and exposes that capability over REST/RPC/MCP to external clients. Not a separate binary from orchestrator/TUI (D1/D8).
- **"Orchestrator"** — the component that drives herdr's `PaneOrchestrator` port to open/manage interactive panes (D3), asking gateway (not fgOS directly) for any state it needs (D7). Does not (v1) manage headless runner processes (D6).
- **"Dashboard"** — explicitly NOT a single project spanning both TUI and web (an earlier round of this discussion proposed and then corrected this); TUI stays inside `herdr-fgos` (D8), web is its own independent client project (tsk-54j/tsk-ldb's own scope, not this item's).
- **"Port" / "Adapter"** — per `tsk-3t9`'s own pinned terms, reused verbatim here (`docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md`): a port is a Rust trait the domain defines expressing what it needs from the outside world; an adapter is a concrete implementation of a port against one real external system.

## Scout evidence

- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md:56-71` — locked model (3): CLI = local standalone adapter; daemon = consumer outside core, talks only via CLI spawn, never links lib; any non-terminal UI is a client of the daemon's network gate.
- `docs/backlog.md` STR38 (row 26) — Human-UI listener: translator receives transport → dispatches to verb → spawns `fgos <verb>` → reads envelope/exit code; identity gate before dispatch. STR48 (row 27) — attention/push channel, lives at the consumer daemon, core stays passive. `p-09351985` (row 14) — core/lib split prerequisite; explicitly notes daemon does NOT get to link the lib even after this split, per 0014. STR27 (row 24) — fleet orchestrator service (registry/heartbeat/lease/liveness for remote workers), explicitly gated "chỉ mở khi có nhu cầu fleet thật" — this item's D2 deliberately stays narrower than STR27's scope. `p-51f4eb7e` (row 17) — decision 0011 requires every contract to carry a `<name>/v<N>` version token (grounds D10).
- `docs/history/herdr-web-dashboard/CONTEXT.md` D1 — the web dashboard's own earlier decision to embed an HTTP server directly inside `herdr-fgos`, citing "không chờ launcher tổng"; this item's D8 keeps gateway inside `herdr-fgos` too (so no conflict on THAT point), but the earlier open tension was really about where the WEB CLIENT lives — resolved in this conversation (not formally in this item's own scope, but worth citing for `tsk-54j`/`tsk-ldb` to pick up): web should be an independent client of gateway's API, never embedded, consistent with 0014.
- `herdr-plugin/Cargo.toml:14-17` — current deps (`ratatui`, `crossterm`, `serde`, `serde_json`) carry no async runtime and no HTTP crate; confirms D8's noted consequence that gateway's network surface is herdr-plugin's first need for one (e.g. `tokio`+`axum`, matching `herdr-gateway`'s own prior art: `axum 0.7`, `jsonwebtoken 9`, `rust-embed 8`+`axum-embed 0.1`, already cited in `docs/history/herdr-web-dashboard/CONTEXT.md`'s own scout evidence).
- `herdr-plugin/src/ports.rs:8-177` — the existing hexagonal seams this item reuses: `WorkItemSource` (a), `PaneRegistry`+`PaneOrchestrator` (b1), `TerminalUi` (b2).
- `docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md` (`tsk-3t9`, done) — the decision record that cut these seams; D1-D3 there lock the two-seam split and the CLI-only (a) boundary, explicitly citing 0014 itself (line 83-87).
- `docs/specs/runner.md` RUL40 — herdr is chrome-only, never a decision signal; grounds D3.
- `src/runner/claim-liveness.mjs`, `src/runner/main-checkout-lock.mjs` — considered and explicitly NOT reused for cross-machine liveness (that would be STR27's scope, D2); same-host double-launch protection (a narrower, still-open implementation question) can reuse `main-checkout-lock.mjs`'s PID-alive pattern, left to `fgos-coding-planning`.
- `tsk-5nj` (`fgos ready`) — measured `.fgos/state.json` write/rebuild cost (~85ms/call, `rebuildView` from the full event log) — grounds D8's note that gateway's subprocess-spawn cost profile is unchanged from today's CLI calls.
- Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query --capability impact-analysis --status present` reports GitNexus registered and `present`, but repeated hook notices this session report the index stale (last indexed `79fead3`, behind current HEAD) — `impact-analysis: degraded`. Informational only: this item is pure decision documentation, no code touched.

## Sources (external)

- [Code Mode: give agents an entire API in 1,000 tokens | Cloudflare Blog](https://blog.cloudflare.com/code-mode-mcp/)
- [Code Mode: the better way to use MCP | Cloudflare Blog](https://blog.cloudflare.com/code-mode/)
- [Code Mode MCP server patterns · Cloudflare Agents docs](https://developers.cloudflare.com/agents/model-context-protocol/codemode/)

## Canonical references

- `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`
- `docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md` (`tsk-3t9`)
- `docs/history/herdr-web-dashboard/CONTEXT.md` (`tsk-ldb`) — sibling item, `tsk-54j` depends on this one
- `docs/backlog.md` — STR27, STR38, STR48, `p-09351985`, `p-51f4eb7e`
- `docs/distribution-vision.md:112`
- `docs/specs/runner.md` RUL40

## Outstanding questions

None
