# fgOS gateway MCP surface — decision record

Item: `tsk-7l9-3` — "fgOS gateway MCP surface: Code Mode search/execute
tools", child of `tsk-7l9` ("fgOS interface daemon").

## Feature boundary

**In scope (this item):** the MCP surface itself — exactly 2 MCP tools,
`search` and `execute` — exposed by the gateway (inside `herdr-fgos`, per
the parent item's D8), against the gateway's own already-shipped OpenAPI
contract (`docs/contracts/fgos-gateway-api-v1.yaml`, `tsk-7l9-1`,
delivered) and REST implementation (`herdr-plugin/src/gateway.rs`,
`tsk-7l9-2`, delivered). `search` queries that contract; `execute` runs
LLM-generated code that calls the gateway's own functions/routes, never
fgOS core directly (still funnels through the parent's D7 chokepoint).

**Out of scope (deferred to `fgos-coding-planning` or later):** the exact
Rust crate/binding used to embed the scripting engine (D1 below only locks
the *language family*, not the crate); the MCP-server crate wiring itself
(already resolved *clear* during discovery — `rmcp` + `mcpkit-axum`, see
Scout evidence — a technical fact, not a product decision, so it is not
re-litigated here as a D-ID); any sandbox/isolation hardening beyond the
parent's D9 same-process bound-function context (still explicitly out of
scope for v1, same trust model as today's CLI/Bash access).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | **`execute`'s generated code is Rust-native scripting, not an embedded JS engine.** The MCP client/LLM writes code in a Rust-embeddable scripting language (e.g. `rhai` or `mlua` — the specific crate is picked during `fgos-coding-planning`, not locked here), bound to the gateway's own Rust functions. Cloudflare's own Code Mode generates TypeScript run inside a V8 isolate, but that choice was driven by Cloudflare's multi-tenant sandboxing need on Workers — the parent item's D9 already ruled out sandboxing as a v1 requirement for this gateway (no untrusted third party; same trust model as today's direct CLI/Bash agent access). Since there is no sandbox requirement, Code Mode's actual point — 2 MCP tools, `search`+`execute`, code-generation to cut tool-call round-trips — is language-agnostic, so this item stays Rust-native: simpler binding to the gateway's own Rust functions, no extra JS runtime layer (`rquickjs`/`boa`/`deno_core`) to embed or maintain. |

## Pinned terms

- **"search"** — the MCP tool that queries the gateway's own OpenAPI
  contract (`docs/contracts/fgos-gateway-api-v1.yaml`, `CTR010 ·
  fgos-gateway.v1`) so an agent can discover what the gateway exposes,
  per the parent item's D9.
- **"execute"** — the MCP tool that runs LLM-generated Rust-native
  scripting-language code (D1) against bound functions that call the
  gateway's own routes/handlers (`herdr-plugin/src/gateway.rs`), never
  fgOS core directly (parent D7).

## Scout evidence

- `docs/history/fgos-interface-daemon/CONTEXT.md` D7-D10 — the parent
  item's locked decisions this item builds on directly: D7 (gateway is
  the sole chokepoint that spawns `fgos <verb>`), D8 (gateway/orchestrator/
  TUI all stay inside `herdr-fgos`), D9 (Code Mode pattern: 2 MCP tools,
  same-process bound-function context, explicit exclusions —
  `isolated-vm`, `boa`/`deno_core` embedding, containers/microVM), D10
  (gateway's API is a real versioned OpenAPI contract, `CTR010`).
- `docs/contracts/fgos-gateway-api-v1.yaml` — the OpenAPI contract `search`
  queries (`tsk-7l9-1`, delivered): `openapi: 3.1.0`, `x-contract: "CTR010
  · fgos-gateway.v1"`.
- `herdr-plugin/src/gateway.rs:692-708` (`build_router`) — the gateway's
  real REST route surface `execute`'s generated code calls into
  (`tsk-7l9-2`, delivered): `/work`, `/work/:id`, `/work/:id/move`,
  `/work/:id/ask`, `/work/:id/answer`, `/work/:id/take`,
  `/work/:id/return`, `/work/:id/approve`, `/work/:id/reject`, `/ready`,
  `/rollup/:id`, `/graph`, `/state/digest`, `/sessions`, plus more below
  the read window — confirms the route list `search` will expose already
  exists; nothing new to design here.
- `docs/history/fgos-interface-daemon/RESEARCH.md` Round 1
  (`tsk-7l9-3` discovery, 2026-08-13) — `rg -il
  "rmcp|mcp-sdk|modelcontextprotocol|mcp_server|mcp-server"` found no
  Rust MCP crate reference anywhere in the repo; `herdr-plugin/Cargo.toml`
  carries no MCP crate and no JS-engine crate today. External check:
  `rmcp` (official Rust MCP SDK, tokio-async, actively maintained) +
  `mcpkit-axum` (MCP-over-HTTP via Axum, matching the gateway's existing
  `axum` 0.7 stack) is a maintained, axum-compatible path — **resolved
  clear**, not a blocking gap, not re-asked here.
- `CLAUDE.md` impact-analysis capability gate:
  `fgos tool query --capability impact-analysis --status present`
  reports GitNexus registered and `present` (checked fresh this session,
  2026-08-13T11:04Z) — `impact-analysis: full`. Informational only: this
  item is pure decision documentation, no code touched during exploring.

## Sources (external)

- [Code Mode: give agents an entire API in 1,000 tokens | Cloudflare Blog](https://blog.cloudflare.com/code-mode-mcp/)
- [Code Mode: the better way to use MCP | Cloudflare Blog](https://blog.cloudflare.com/code-mode/)
- [Code Mode MCP server patterns · Cloudflare Agents docs](https://developers.cloudflare.com/agents/model-context-protocol/codemode/)
- [rmcp on crates.io](https://crates.io/crates/rmcp) / [modelcontextprotocol/rust-sdk on GitHub](https://github.com/modelcontextprotocol/rust-sdk)
- [mcpkit-axum on docs.rs](https://docs.rs/mcpkit-axum) / [crates.io](https://crates.io/crates/mcpkit-axum/0.3.0)

## Canonical references

- `docs/history/fgos-interface-daemon/CONTEXT.md` (`tsk-7l9`) — parent
  item's D7-D10, this item's own starting brief
- `docs/history/fgos-interface-daemon/RESEARCH.md` — Round 1, this item's
  own discovery research
- `docs/contracts/fgos-gateway-api-v1.yaml` — `CTR010 · fgos-gateway.v1`
  (`tsk-7l9-1`)
- `herdr-plugin/src/gateway.rs` — gateway REST implementation (`tsk-7l9-2`)

## Outstanding questions

None
