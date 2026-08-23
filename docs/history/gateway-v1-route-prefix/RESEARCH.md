# Research — gateway `/v1` route prefix (tsk-4uh)

## Round 1 — 2026-08-14

**Asked:** for a fix that wraps `herdr-plugin/src/gateway.rs`'s router in
`.nest("/v1", ...)`, does anything else in this repo call the gateway's REST
routes WITHOUT the `/v1` prefix in a way that would break once the prefix
becomes mandatory? What test-module convention should a new `/v1`-prefixed
test follow?

**Checked:**
- `rg -n "reqwest|http::Client|hyper::Client" herdr-plugin/src/` — no hits.
  The TUI (`ports.rs`'s `VerbGateway` trait) calls `spawn_fgos_verb`
  in-process, never over HTTP — the HTTP gateway path has no internal
  caller in this repo to break.
- `rg -n "localhost:|127.0.0.1:|http://"` across `docs/history/fgos-
  interface-daemon/`, `docs/history/fgos-gateway-mcp-surface/`, `docs/
  history/tsk-7l9-2/` — no hits outside the OpenAPI yaml itself (which
  already declares `/v1` as the server URL, so it agrees with the fix, not
  against it).
- `rg -ln "gateway" --glob '*.md'` at repo root — only mentions the word
  "gateway" in passing (`docs/backlog.md`, `docs/architecture-map.md`), no
  hardcoded route paths to update.
- `rg -n "\.uri\(" herdr-plugin/src/gateway.rs herdr-plugin/src/mcp.rs` —
  **6 call sites, all in `gateway.rs`'s own `#[cfg(test)] mod tests`**:
  `:802` `/ready`, `:820` `/ready`, `:842` `/ready`, `:865` `/contract`,
  `:885` `/mcp`, `:900` `/mcp`. `mcp.rs` has none of its own (its tests, if
  any, don't build HTTP requests directly).

**Found:** the fix is NOT just "add `.nest(\"/v1\", ...)` and one new test"
(fable's raw suggested direction) — the 6 existing inline tests above build
requests against the CURRENT unprefixed paths. Once the router is wrapped in
`.nest("/v1", ...)`, all 6 return 404 against their un-prefixed `.uri(...)`
calls and start failing. The honest fix updates those 6 call sites to
`/v1/ready` / `/v1/contract` / `/v1/mcp` in the same change, not as a
follow-up. No other internal caller (TUI, docs, scripts) needs updating —
none exist.

**Still open:** none — this fully resolves the ambiguity for this item.
