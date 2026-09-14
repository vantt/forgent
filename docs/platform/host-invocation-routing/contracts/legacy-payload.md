# Contract: Legacy Payload

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define legacy Node payload identity, source location, release placement, and compatibility boundaries
Design status: Draft
Implementation status: Legacy-current plus accepted-not-implemented release manifest binding
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
```

## 1. Contract

The legacy payload identity is `legacy-node`. The source file [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) remains unmoved and unrenamed while it exists. The payload is the current npm package as `package.json` `files` defines it and includes `bin/fgos.mjs` and `bin/fgos-runner.mjs`.

In a staged release, packaging stages the payload whole under the release manifest's `components.legacyNode.root`, with entry `components.legacyNode.entry`.

## 2. Resolution Rule

The Rust host resolves:

```txt
join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)
```

It must not resolve the payload through PATH, caller cwd, a hardcoded source path, or an alternate package-manager bin entry.

## 3. Compatibility Rule

Node payload tests may spawn `bin/fgos.mjs` directly because they test the payload. Production runtime call sites should route through their single resolver and, after R1, prefer workspace shim tier 0.

## 4. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Source payload file remains unmoved. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | Keep until zero legacy routes and removal gates pass. |
| Release manifest locates payload. | `accepted-not-implemented` | [release manifest contract](../../packaging-distribution/contracts/release-manifest.md) | P6 staged release proof. |
| `fgos-runner` remains public Node entry until migrated. | `legacy-current` | [../../../../package.json](../../../../package.json) | Include in R1 runtime inventory. |

## 5. Related Files

| Relationship | File |
| --- | --- |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| command route descriptor | [command-route-descriptor.md](command-route-descriptor.md) |
| release manifest | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |
| source transition | [../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) |
