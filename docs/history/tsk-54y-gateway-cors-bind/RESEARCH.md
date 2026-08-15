# RESEARCH — tsk-54y: gateway CORS layer + configurable bind address

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** does CORS support already exist on `herdr-plugin/src/gateway.rs`?
Is `tower-http` already a dependency? Where is the hardcoded bind address,
and what struct holds gateway config today? What precedent does the
reference implementation `herdr-gateway` (crate `herdr-go`) set for a
configurable, non-loopback-warning bind?

**Checked — repo (`herdr-plugin/`):**

- `rg 'Cors|CorsLayer' herdr-plugin/src/gateway.rs` → 0 hits. Confirmed: no
  CORS layer exists today.
- `herdr-plugin/Cargo.toml` → no `tower-http` dependency line at all (only
  `axum = "0.8"` line 28, `tower = { version = "0.4", features = ["util"] }`
  line 51). `herdr-plugin/Cargo.lock` confirms axum resolves to `0.8.9`,
  pulling in `tower 0.5.3` transitively — no `tower-http` entry present.
  `tower-http` must be added as a new direct dependency; version `0.6` is
  the release line compatible with axum 0.8 / http 1.x (matches this
  lockfile's `tower 0.5.3`, the same major line `tower-http 0.6.x` depends
  on upstream). Feature needed: `cors`.
- `herdr-plugin/src/gateway.rs:933` — confirmed hardcoded:
  `let addr: SocketAddr = ([127, 0, 0, 1], config.port).into();` inside
  `pub fn run(...)`.
- Config struct: `herdr-plugin/src/gateway.rs:52-62` —
  `GatewaySection { token: Option<String>, port: Option<u16> }` (the
  on-disk `~/.fgos/config.json` shape, parsed by `GlobalConfigFile`) and
  `GatewayConfig { pub port: u16, pub token: String }` (the resolved
  runtime shape `load_gateway_config` returns, `gateway.rs:58-62`). No
  `bind`/`host` field exists on either struct today — `load_gateway_config`
  (gateway.rs:102-126) only ever resolves `port` (default `DEFAULT_PORT =
  4170`, line 40) and `token`.
- Router assembly entry point: `build_router` (`gateway.rs:875`), called
  from `run` (`gateway.rs:935`) — this is where a `CorsLayer` would attach
  via `.layer(...)`, consistent with axum's tower `Layer` convention
  already used elsewhere in this file (`tower::util`).

**Checked — external precedent (`/home/vantt/projects/herdr-gateway`,
crate `herdr-go`, cited per this cluster's own D8/D14 "port the reference
implementation's idiom" precedent):**

- `config.example.json:2` — `"bind_addr": "0.0.0.0:8787"` — the config
  shape carries a full `host:port` socket-address string, not a separate
  host field alongside a port field.
- `src/main.rs:21,76,91,121,235-239` — a `--bind`/`-b` CLI flag can
  override `config.bind_addr` for any run mode, parsed as a
  `SocketAddr` (typed error on a bad value, `main.rs:239`).
- `src/main.rs:242-248` — non-loopback warning, exact idiom:
  ```rust
  if !config.bind_addr.ip().is_loopback() {
      tracing::warn!(addr = %config.bind_addr, "binding to a non-loopback address");
      // (also surfaces a `doctor::non_loopback_bind_warning` — herdr-go-specific, N/A here)
  }
  ```
- `src/main.rs:367` — `tokio::net::TcpListener::bind(config.bind_addr)`.
- `src/main.rs:379-383` — a demo/test config path defaults to
  `127.0.0.1:8787` (loopback), distinct from the real default
  (`0.0.0.0:8787`) — the non-loopback warning only fires for the real
  default, matching this cluster's own D7 ("warning when bind address is
  not loopback").
- No CORS precedent found in `herdr-gateway` (`rg 'tower-http|CorsLayer|cors'`
  → only the `tower-http` Cargo.toml line, features `["fs", "trace"]`, no
  `"cors"` feature and no `CorsLayer` usage) — herdr-gateway apparently
  serves its own frontend same-origin, so it never needed CORS. This
  cluster's D7/plan-realignment CONTEXT.md already establishes tsk-54y's
  CORS need independently (web client is a separate static bundle that
  may not share origin with the gateway) — no external idiom to copy for
  this half, only the bind-address half has a reference to port.

**Open:** none — both points (CORS absence + no crate, bind hardcoded +
config struct shape) are directly confirmed by repo evidence, and the bind
half has a concrete, working precedent to copy the shape of (full
`SocketAddr`-typed config field, not a separate host string + reuse of
existing `port`).

**Verdict:** `clear`. Verify: existing item verify
(`cd herdr-plugin && cargo test --lib gateway`) already targets this exact
module and is real/runnable — no better candidate surfaced.
