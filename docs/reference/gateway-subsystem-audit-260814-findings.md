---
type: reference
title: Gateway subsystem audit findings (2026-08-14)
tags: [audit, gateway, mcp, interface-daemon, code-review]
source_capture_ids: [tsk-1zg, tsk-4uh, tsk-og6, tsk-4lf, tsk-1qe, tsk-1ah]
authoritative_for: the 9 findings from the 2026-08-14 haiku-scan + fable code-review audit of fgOS's gateway subsystem (REST/RPC + MCP surface), and which work item tracks each
---
# Gateway subsystem audit findings (2026-08-14)

`tsk-1zg` (parent/coordinator item). Full report:
`plans/reports/gateway-audit-260814-2110-fable-hidden-bugs-report.md`.
Scope: `herdr-plugin/src/gateway.rs`, `docs/contracts/fgos-gateway-api-v1.yaml`,
`docs/history/fgos-gateway-mcp-surface/`, `docs/history/fgos-interface-daemon/` —
see `docs/explanation/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`
and `docs/reference/fgos-gateway-api-ctr010.md` for the base design this
audit reviewed. Each finding below was filed as its own work item.

| id | severity | finding |
|---|---|---|
| `tsk-4uh` | high (spot-verified) | **Fixed.** Every gateway route was served without the `/v1` prefix the contract's server URL and the gateway's own startup log both advertise — a contract-compliant client 404'd on every real call. Fixed: routes now serve under `/v1`; a follow-up commit also `/v1`-prefixed three test URIs that had arrived via later-merged branches after the main fix landed. |
| `tsk-og6` | high (spot-verified) | **Fixed.** `spawn_fgos_verb` passed `--dir <root>` but never set `current_dir(root)` on the child process — some `fgos` verbs resolve their repo root from `process.cwd()` instead of the passed `--dir`, silently operating on the wrong repo. Fixed: the spawned child process now gets `current_dir(root)` explicitly. |
| `tsk-4lf` | medium | **Fixed.** No timeout, cancellation, or concurrency bound anywhere on the verb chokepoint — one wedged `fgos` subprocess pinned a blocking-pool thread indefinitely. Fixed: `spawn_fgos_verb` now bounded by a 10-minute deadline. |
| `tsk-1qe` | medium | **Fixed.** MCP `execute`'s Rhai scripting engine had no operation/time limit and an unbounded print buffer — one `loop {}` script wedged a blocking thread forever. Fixed: the Rhai engine now bounds both operations and output. |
| `tsk-1ah` | medium-low | **Fixed.** Argv flag injection: a user-supplied string beginning with `--` was reinterpreted by the CLI's own parser as a flag, since `parseArgs` had no `--` separator boundary. Fixed: the gateway now rejects dash-prefixed, argv-injection-shaped input outright rather than forwarding it into the CLI parser. |
| `tsk-5m1` | medium-low | The contract's `X-Fgos-Writer-Id`/`X-Fgos-Writer-Role` attribution headers are dead — the gateway never reads them, and the CLI has no flag to forward them into. |
| `tsk-4qf` | medium-low | Non-2xx responses aren't always the contract's `ErrorEnvelope` shape; auth failures are indistinguishable from validation errors; the yaml declares no consistent error schema. |
| `tsk-67gr` | low | The contract's `takeWork` role enum promises `runner` as a valid role; the CLI actually refuses it. |
| `tsk-4r1` | low | `gateway.token`/`gateway.port` are registered nowhere in `fgos setup`'s config-merge or `fgos doctor`'s checks — the gateway's own error message points at config a doctor pass can't verify exists. |

Findings 1-2 were spot-verified directly by the auditing session; findings
3-9 were not independently re-verified at capture time (fable's own raw
output, not re-confirmed by a second read).
