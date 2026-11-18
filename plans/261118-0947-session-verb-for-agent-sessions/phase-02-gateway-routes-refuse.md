# Phase 2: Gateway session routes refuse

Decision: SV-7 (owner 2026-11-18). Evidence: scan report §1 (gateway), §8.

## Inputs (read first)
- `apps/fgos-gateway/src/gateway.rs`: `post_sessions`, `delete_session`, `get_session_slots` (~1082-1137), the router (~1282-1284), the test (~2786-2875), `GatewayError` and its HTTP mapping.
- `apps/fgos-gateway/src/mcp.rs` (~34, which mentions `/sessions*`), `apps/fgos-gateway/web/src/api/client.ts` (~150-160).
- Contract `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` (`/sessions` ~507-570, intro ~21-24).

## Files this phase may write
See the phase table footprint in plan.md.

## Steps
0. Re-read the inputs on the landed tree.
1. The three handlers answer HTTP 501 with the gateway's existing error body: a code such as `not-implemented` and a message saying the per-session worktree verb was retired and these routes return when the gateway is rebuilt on `fgos session` (head sessions). They call no verb, read no body beyond what routing needs, and keep auth and the in-flight limit as today. Add an error variant only if no existing one maps to 501.
2. Contract: the three operations keep their paths, document only the 501 response, and say why; the intro line about `fgos session start/end` is rewritten.
3. `client.ts`: the three functions stay (routes stay) with a comment that they answer 501.
4. Replace the gateway test that ran the real host for start/end with one wiring proof: each route returns 501 and no child process runs.

## Verify
- `cargo test -p fgos-gateway` green; `cargo clippy -p fgos-gateway -- -D warnings` clean.
- `rg -n '"session"' apps/fgos-gateway/src` finds no verb argv.

## Rollback
`git revert` the phase commit.
