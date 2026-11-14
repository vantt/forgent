# Contract: Legacy Payload

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define legacy Node payload identity, source location, release placement, and compatibility boundaries
Design status: Draft
Canonical: Yes, after review
Owner: Host invocation
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
Implementation: Legacy-current plus implemented-preview release manifest binding
Provenance: `docs/platform/host-invocation-routing/contracts/legacy-payload.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: The stated document scope; source implementation limits remain explicit
Use this when: Define legacy Node payload identity, source location, release placement, and compatibility boundaries
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: The mapped source location; source provenance is retained
Superseded by: None recorded
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

The payload does not answer help. It has no help renderer: the host answers every help form from the generated manifest (`apps/fgos/src/help.rs`), and an exact `--help` or `-h` token that reaches `bin/fgos.mjs` directly is forwarded to the host (`runHostInherited` in `src/util/host-bin.mjs`, host from `resolveHostBin`), keeping the recursion guard in the environment so an older host that still forwards help to Node refuses the second hop. With no host found it prints one stderr line pointing at the installed `fgos` and `npm run fgos:dev -- <verb> --help`, and exits 4.

## 4. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Source payload file remains unmoved. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | Keep until zero legacy routes and removal gates pass. |
| Release manifest locates payload. | `implemented preview` | [release manifest contract](../../packaging-distribution/contracts/release-manifest.md), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Keep manifest-owned legacy payload resolution until zero legacy routes and removal gates pass. |
| `fgos-runner` remains public Node entry until migrated. | `legacy-current` | [../../../../package.json](../../../../package.json) | Include in R1 runtime inventory. |
| The payload answers no help; the host does. | `implemented preview` | [../../../../apps/fgos/src/help.rs](../../../../apps/fgos/src/help.rs), [../../../../test/rust-host/help-routes.test.mjs](../../../../test/rust-host/help-routes.test.mjs) | None. |

## 5. Related Files

| Relationship | File |
| --- | --- |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| command route descriptor | [command-route-descriptor.md](command-route-descriptor.md) |
| release manifest | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |
| source transition | `../architecture/legacy-cli-transition.md#legacy-cli-transition` |
