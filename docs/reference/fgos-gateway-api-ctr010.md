---
type: reference
title: fgOS Gateway API (CTR010)
tags: [gateway, openapi, contract, interface-daemon]
source_capture_ids: [tsk-7l9-1, tsk-7l9-2, tsk-7l9-3]
authoritative_for: the fgOS gateway HTTP+JSON API contract — CTR010, its scope, and where the spec lives
---
# fgOS Gateway API (CTR010)

The OpenAPI 3.1 spec for the fgOS interface daemon's HTTP+JSON surface
lives at `docs/contracts/fgos-gateway-api-v1.yaml`, tagged
`x-contract: "CTR010 · fgos-gateway.v1"` — joining the existing numbered
CTR family (CTR001 one-door-write, CTR002 single-writer-lock, CTR006
routing-handoff, CTR008 attention envelope) per decision `0011`. See
`docs/explanation/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`
for the architecture this contract implements (decision `0014`).

## Written before the daemon exists, on purpose

The spec was written *before* the daemon's own implementation — a stable
target for D9's future MCP `search` tool and any client (web dashboard,
desktop app) to build against, rather than documentation
reverse-engineered from routes that already exist.

## Scope, locked by decision `0014`

- The daemon is a **consumer** of fgOS core, never a co-writer. Every
  write in this API is a thin wrapper over `spawn fgos <verb>`
  (CTR001/CTR002's one-door-write); every read wraps `fgos list`/`fgos
  rollup`/`fgos show` plus the `data_hash` cheap-poll field already on
  every envelope. This gateway invents no new write path into `.fgos/`.
- The daemon is the one control-plane able to drive **both** interactive
  session workflows (what herdr/TUI panes do today via `fgos session
  start/end`) and the headless runner (`fgos-runner --once`) — see
  `/v1/sessions` and `/v1/runner/tick`.
- The attention/push channel (`STR48`, contract `CTR008`, still `idea`
  status) is explicitly **out of scope** for v1 — `0014` point 6 keeps it
  a separate subsystem with its own delivery-semantics record. Clients
  poll `data_hash` on read endpoints until `CTR008` lands.
- Identity is **attribution**, not authentication — the same non-goal
  `CTR001` already states for the CLI's own `writer` field.

## Implementation: `herdr-plugin/src/gateway.rs`

The gateway's REST surface (async runtime, D7's verb chokepoint, D4's
per-machine token auth) lives in the `herdr-fgos` Rust binary at
`herdr-plugin/src/gateway.rs` — a new file, per D8's own architecture
(same hexagonal ports-and-adapters shape `herdr-plugin` already
established). Auth is enforced by a `require_token` middleware — proven
failing-test-first by temporarily short-circuiting the check to always
let a request through (no prior committed version existed to diff
against, since this is a brand-new file, so the Iron Law's
failing-before proof neutered the real check in place instead, showed
the auth test then fails, then restored the check and showed it passes
again).

## MCP surface: `search`/`execute`, Rust-native, not an embedded JS engine

Following D9's Code Mode pattern (see
`docs/explanation/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`),
the MCP surface exposes exactly two tools — `search` (queries this
contract's own OpenAPI spec) and `execute` (runs generated code that
calls the gateway's own routes/functions, still funneled through D7's
one chokepoint, never fgOS core directly).

**Locked** (`docs/history/fgos-gateway-mcp-surface/CONTEXT.md` D1):
`execute`'s generated code is **Rust-native scripting, not an embedded JS
engine** — a Rust-embeddable scripting language (e.g. `rhai` or `mlua`,
the specific crate left to `fgos-coding-planning`) bound directly to the
gateway's own Rust functions. Cloudflare's original Code Mode generates
TypeScript run inside a V8 isolate, but that choice was driven by
Cloudflare's own multi-tenant sandboxing need on Workers — the parent
item's D9 had already ruled out sandboxing as a v1 requirement here (no
untrusted third party; the same trust model direct CLI/Bash agent access
already has). With no sandbox requirement, Code Mode's actual point — two
MCP tools cutting tool-call round-trips via code generation — is
language-agnostic, so staying Rust-native avoids embedding and
maintaining an extra JS runtime layer (`rquickjs`/`boa`/`deno_core`) for
no real benefit.
