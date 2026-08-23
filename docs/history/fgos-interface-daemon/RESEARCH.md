# fgOS interface daemon — RESEARCH.md

Accumulating research log for `tsk-7l9`'s MCP-surface follow-on item(s),
starting with `tsk-7l9-3` ("fgOS gateway MCP surface: Code Mode
search/execute tools"). Each round is appended, never overwritten.

## Round 1 — 2026-08-13 (tsk-7l9-3 discovery)

**Asked:** Two ambiguities surfaced from `tsk-7l9-3`'s description and
`docs/history/fgos-interface-daemon/CONTEXT.md` D8/D9 (gateway/orchestrator/
TUI all stay inside the existing `herdr-fgos` Rust binary; MCP `search`/
`execute` follow the Code Mode pattern; `execute` runs generated code in a
"lightweight same-process bound-function context... no `isolated-vm`, no
`boa`/`deno_core` embedding, no container/Docker/microVM"):

1. Does a currently-maintained Rust MCP server crate exist, and does it
   integrate with the existing `axum` 0.7 + `tokio` stack already added to
   `herdr-plugin/Cargo.toml` by `tsk-7l9-2`?
2. D9 names two Rust JS-embedding approaches as explicitly excluded
   (`boa`, `deno_core`) but never names what SHOULD be used instead for
   `execute`'s bound-function context — is there a settled answer, or is
   this a genuine open gap?

**Checked (repo, mechanical):**
- `rg -il "rmcp|mcp-sdk|modelcontextprotocol|mcp_server|mcp-server"` across
  the repo (excluding `node_modules`/lockfiles) — only two unrelated hits
  (a plans report about the *Node* GitNexus MCP integration, and
  `docs/history/fgos-skill-discovery-gap/CONTEXT.md`'s reference to
  GitNexus's own MCP-server integration). **No Rust MCP crate reference
  anywhere in the repo.**
- `herdr-plugin/Cargo.toml` (current, post `tsk-7l9-2` merge into this
  worktree) — deps are `ratatui`, `crossterm`, `serde`, `serde_json`,
  `tokio` (`rt-multi-thread, macros, process, net, time, fs` features),
  `axum` 0.7. No MCP crate, no JS-engine crate (`boa`, `rquickjs`,
  `deno_core`, `rhai`, `mlua`, etc.) present.
- `herdr-plugin/Cargo.lock` — `rg -i rmcp` — no hit, confirms nothing
  transitively pulls in an MCP crate today either.

**Checked (external, cited):**
- [rmcp on crates.io](https://crates.io/crates/rmcp) / [modelcontextprotocol/rust-sdk on GitHub](https://github.com/modelcontextprotocol/rust-sdk)
  — `rmcp` is the official Rust MCP SDK, tokio-async, implements the
  current MCP spec (2026-07-28, backward compatible to 2025-11-25).
  Actively maintained.
- [mcpkit-axum on docs.rs](https://docs.rs/mcpkit-axum) / [crates.io](https://crates.io/crates/mcpkit-axum/0.3.0)
  — a crate specifically for exposing an MCP server over HTTP through
  Axum, i.e. designed to sit next to an existing `axum` app the way
  `herdr-fgos`'s gateway already is.
  → **Finding 1 resolved: `clear`.** A maintained, axum-compatible Rust
  MCP server path exists (`rmcp` + `mcpkit-axum`, or `rust-mcp-sdk`'s own
  axum integration as an alternative). This is not a blocking gap.

- [boa-dev/boa on GitHub](https://github.com/boa-dev/boa) — an embeddable
  JS engine/interpreter written in pure Rust (no sandboxing built in) —
  one of D9's two named exclusions.
- `deno_core` — integrates the V8 engine + tokio into Rust; the mechanism
  behind Deno's own runtime — the other of D9's two named exclusions.
- `rquickjs` — QuickJS bindings for Rust, "heavily inspired by Deno" per
  search results; lighter-weight than `boa`/`deno_core` but its
  relationship to D9's exclusion boundary (is it "embedding a JS engine"
  in the sense D9 meant to rule out, or the "lightweight... equivalent"
  D9 left open?) is **not settled by anything in `CONTEXT.md` or this
  research round** — D9's own text only ever says "or the Rust equivalent
  **if** gateway ends up needing one", i.e. explicitly deferred, not
  decided.
  → **Finding 2: still open.** No named Rust crate/approach is locked for
  `execute`'s bound-function execution context. This also surfaces a
  layer above the crate choice that CONTEXT.md never answers either: what
  LANGUAGE is the LLM-generated "code" for `execute` even written in?
  Cloudflare's own Code Mode generates TypeScript run inside a V8
  isolate — a Rust host with no JS engine embedded has no way to run that
  same generated code as-is. The alternatives (embed a JS engine anyway
  despite D9's boa/deno_core exclusions being narrower than "any JS
  engine", e.g. `rquickjs`; or have `execute` accept a Rust-native
  embeddable scripting language instead, e.g. `rhai`/`mlua`, which changes
  what "generated code" the MCP client/LLM needs to produce) are a real
  product/architecture fork, not a research gap that more searching would
  close.

**Still open:** which execution-context approach `execute` uses (crate +
implied generated-code language) — this is a product decision, not a
missing fact. `tsk-7l9-3`'s own description already flags "Rust vs Node
execution-context mechanics" as open; this round confirms it is still
open and additionally surfaces that the *generated-code language* is an
unstated sub-decision inside it.
