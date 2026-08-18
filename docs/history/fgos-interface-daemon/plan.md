# fgOS interface daemon — plan.md

Item: `tsk-7l9`.

Mode: high-risk

Flag count (per `fgos-routing`'s Mode-gate, applied directly here — no
lane was handed off before this skill loaded, per the direct-entry
fallback): 4 hard-gate-adjacent flags apply — **auth** (D4), **audit/
security** (D7's identity-gate/audit centralization), **external systems**
(a new network-facing surface), **public contracts** (D10). 4+ flags puts
this at `high-risk`, not `standard` — matches the item's own `tier: heavy`/
`risk: heavy` classification from discovery.

## Approach

**Chosen path:** extend `herdr-fgos`'s existing hexagonal architecture
(`tsk-3t9`, done — `herdr-plugin/src/ports.rs`) with one new adapter: a
gateway that speaks REST over the SAME `WorkItemSource`/`PaneOrchestrator`
ports the TUI already calls today. No new binary, no new process (D1/D8).
Contract-first ordering: write the OpenAPI spec (D10) before implementing
against it, rather than documenting whatever routes happen to get typed —
this also gives D9's future MCP `search` tool a stable target once that
work starts (explicitly not this item's own scope — CONTEXT.md's Feature
boundary frames MCP as "later").

**Rejected alternatives** (both already argued through in `CONTEXT.md`,
cited not re-litigated):
- A separate Node.js daemon (would allow future in-process lib-linking,
  D8's own noted trade-off) — rejected: conflicts with `herdr-web-
  dashboard/CONTEXT.md`'s own D1 (TUI/gateway/dashboard all inside
  `herdr-fgos`) and the user explicitly accepted the subprocess-spawn cost
  for v1 simplicity.
- A separate Rust binary for gateway alone, still process-split from TUI —
  rejected: D1 already locked one process per machine; a second Rust
  binary would need its own local IPC to reach the SAME ports TUI already
  calls in-process, solving a problem D1 explicitly closed.

**Order:** contract doc first (no code dependency, pure spec), then the
gateway adapter built against it. `fgos graph tsk-7l9 --json` shows this
item's only real graph relationship is unblocking `tsk-54j` (its `deps`)
— no `topUnblock`/`criticalPath` signal changes the INTERNAL ordering of
the two pieces below, so contract-before-implementation is decided on the
"design before you build against it" grounds stated above, not a graph
signal.

**Impact-analysis posture:** `degraded` — `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`, but this
session's own tool hooks repeatedly flagged the index as stale (last
indexed `c0cedaa`/`79fead3` at various points this session, behind current
HEAD). Noted next to the risk map below, not blocking: this item adds new
code/files rather than modifying a large existing surface, so blast-radius
evidence matters less here than it would for a refactor.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Async runtime addition to `herdr-fgos` (`herdr-plugin/Cargo.toml` gains `tokio`+`axum`, first async dep per D8's own note — confirmed today via `Cargo.toml` scout: no async runtime present) | medium | `cargo build --release --manifest-path herdr-plugin/Cargo.toml` succeeds; `tsk-3t9`'s existing 7 tests (`fgos.rs` 2, `pick.rs` 5) still pass unchanged — same D3 convention that item already established |
| Gateway verb-chokepoint (D7) — HTTP handler calls into the SAME `WorkItemSource`/`PaneOrchestrator` ports, never a second CLI-spawn path | medium | an integration test: HTTP request → gateway → real `fgos list` subprocess → response matches what the CLI itself returns for the same query |
| Auth (D4) — one token per machine, read from `~/.fgos/config.json` (D5) | high (security-adjacent, per the auth/audit hard-gate flags) | a request with no/wrong token is rejected before it reaches any verb-spawn path; a request with the right token succeeds |
| OpenAPI contract (D10) | light | spec file parses as valid OpenAPI (existing `yaml` npm dependency already in `package.json`, no new tooling needed) |

## Split

Two independently workable, independently verifiable pieces. Written here
as specs only — `fgos-coding-validating` materializes them at its single gate,
this skill creates nothing.

```json
[
  {
    "title": "Write fgOS gateway API contract: OpenAPI spec, CTR-numbered, versioned",
    "action": "D10: gateway's API is a real, versioned, public contract (OpenAPI spec, CTR-numbered, <name>/v<N> per decision 0011) -- written before implementation so D9's future MCP search tool and any client (web dashboard, desktop) have a stable spec to build against, not reverse-engineered documentation of whatever routes happen to exist.",
    "verify": "node -e \"const {parse}=require('yaml');const fs=require('fs');const doc=parse(fs.readFileSync('docs/contracts/fgos-gateway-api-v1.yaml','utf8'));if(!doc.openapi||!doc.paths||!doc.info)throw new Error('invalid or incomplete OpenAPI spec');console.log('ok')\"",
    "footprint": ["docs/contracts/fgos-gateway-api-v1.yaml"],
    "kind": "docs",
    "risk": "light"
  },
  {
    "title": "Add gateway REST surface to herdr-fgos: async runtime, verb-chokepoint, per-machine auth",
    "action": "D1: gateway+orchestrator combine into one process inside herdr-fgos. D7: gateway is the sole internal chokepoint that spawns fgos <verb> (reads and writes) -- orchestrator's existing PaneOrchestrator-driven calls are untouched, this only adds a new external caller into the same WorkItemSource port. D8: gateway lives inside herdr-fgos reusing tsk-3t9's existing hexagonal ports rather than a new boundary. D4/D5: one auth token per machine, read from ~/.fgos/config.json.",
    "verify": "cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml",
    "footprint": ["herdr-plugin/Cargo.toml", "herdr-plugin/src/gateway.rs", "herdr-plugin/src/ports.rs", "herdr-plugin/src/main.rs"],
    "kind": "feature",
    "risk": "heavy",
    "deps": ["<id of the contract-doc piece above, once materialized>"]
  }
]
```

## Assumptions

- MCP surface (D9) is explicitly out of this item's own build scope
  (`CONTEXT.md`'s Feature boundary: "later") — not a piece here, not an
  Outstanding question, just a forward-note the OpenAPI contract (piece 1)
  should keep in mind (stable route naming/shapes a future `search` tool
  can query) without building anything for it now.
- Same-host double-launch protection (two `fgos-daemon serve`-equivalent
  processes on one machine) is an implementation detail, not designed
  here — `CONTEXT.md`'s scout evidence already points at
  `main-checkout-lock.mjs`'s PID-alive pattern as the precedent to reuse
  when piece 2 is actually implemented.
- Piece 2's exact route set (which fgOS verbs get exposed first) is an
  implementation-time decision against the contract piece 1 produces, not
  fixed in this plan.

## Outstanding questions

None
