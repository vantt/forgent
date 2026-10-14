# Installed Default And npm Compatibility

```txt
Document type: Decision
Audience: Release owner, maintainer and independent reviewer
Purpose: Record the owner-decided successor to the installed-default npm entry trigger and the owed removal obligation
Design status: Candidate
Implementation: Owner-decided successor; end-of-window removal or redirect remains owed
Provenance: dropped-010; original legacy-cli-transition.md obligation and current ownership boundary
Writer type: Human + agent coauthor
Canonical: No
Canonical for: Candidate record of the owner F6 resolution and remaining Packaging-distribution obligation
Use this when: Reading the successor window and the owed end-of-window removal or redirect
Do not use this for: Claiming removal is implemented, extending release support, or an authority cutover
Last reviewed: Owner resolution 2026-10-14; conservation representation pending independent review
Related:
- docs/platform/packaging-distribution/spec.md
Supersedes: The automatic installed-default npm bin.fgos removal trigger, by the owner F6 resolution
Superseded by: None recorded
```

## Original Obligation

`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.

## Proposed Disposition

Added in candidate — owner F6 resolution (2026-10-14): **superseded by decision**. The automatic installed-default removal or redirection trigger for npm `bin.fgos` has the 2026-09-15 coordinator decision as successor (`docs/platform/packaging-distribution/code-panel-rollout-plan.md:72`; `docs/platform/host-invocation-routing/architecture/release-boundaries.md:35`). The Rust host is the installed default from the preview; the Node fallback is deprecated and supported for 30 calendar days after preview publication, earliest removal 2026-10-18.

Removing or redirecting `bin.fgos` after the window remains an **owed obligation owned by Packaging-distribution (release-owner decision)**. Nothing is removed now. The runner mapping and source-entry ownership header stay; this resolution does not extend the support promise.

The current `package.json:9-12` maps both npm entries to the Node payload. `bin/fgos.mjs:4-10` expressly retains global npm and direct Node compatibility channels while requiring Rust host payload resolution through manifest fields. The source obligation was introduced by `4db6ee7e5d32efdd10ebfdc6aa71816e1f98754f`; the implementation header added by `c831811faaa0be93f505456aae6a134865ccbc9b` explicitly retained npm compatibility and did not remove that mapping. The candidate spec distinguishes the native public/default posture from the deprecated npm channel.

The rationale is **superseded by decision**: the same-day ownership header and the dated coordinator window show intentional coexistence. The coordinator window supersedes the automatic installed-default trigger; absence of a removal commit is not the retirement rationale. The original obligation remains preserved verbatim above and at the resolved retention anchor in `docs/platform/host-invocation-routing/architecture/release-boundaries.md`. The end-of-window removal or redirect remains owed to Packaging-distribution.
