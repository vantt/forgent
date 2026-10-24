# Gateway Readiness Contracts

```txt
Document type: Contract
Audience: Gateway and packaging-distribution maintainers, implementation agents, conservation reviewers
Purpose: Preserve machine-token startup refusal and the web client's baseUrl-only reachability interpretation
Design status: Candidate conservation of existing behavior; no new startup path or authority promotion
Last reviewed: 2026-10-24
Related:
- docs/platform/herdr-web-dashboard/spec.md
- docs/platform/packaging-distribution/spec.md
```

Owner: Gateway / packaging-distribution
Status: Candidate conservation; existing behavior, no new startup path.
Related links: [Gateway spec](../spec.md), [Packaging-distribution spec](../../packaging-distribution/spec.md).

## Machine Token And Startup Refusal

The gateway reads `~/.fgos/config.json` and its `gateway.token`; it never creates the global file or self-provisions a token. A missing file, missing token or blank token refuses startup. The original distribution row 5b is conserved verbatim:

| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |

The exclusive-creator sentence is the historical setup contract, not a restriction on the subsequently registered token fix: `fgos setup` creates/fills the global config, and the `gateway-token-configured` fix also creates it when absent and writes a real token (`fixGatewayTokenConfigured` in `src/setup/registrations.mjs`). Both setup and `doctor --fix` run this same registered fix. The gateway itself remains read-only. This explicitly supersedes the old “only setup” creator claim to the extent it would exclude the fix; it does not authorize gateway startup to write.

## Reachable On Network

The old R5 client contract is independent of static-serving and lifecycle/bind defaults: “reachable on network” has no dedicated contract field. The web client derives that observation only from its configured gateway `baseUrl`, not by probing reachability or reading a server-owned reachability flag. `apps/fgos-gateway/web/src/lib/network.ts` owns that interpretation for Taskboard and TaskDetail; the current static-serving R5 does not remove it.
