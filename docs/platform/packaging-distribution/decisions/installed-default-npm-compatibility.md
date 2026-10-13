# Installed Default And npm Compatibility

```txt
Document type: Decision
Audience: Release owner, maintainer and independent reviewer
Purpose: Propose the disposition of the retained installed-default npm entry obligation
Design status: Candidate
Implementation: Proposed retirement of a dated trigger clause; no retirement is approved here
Provenance: dropped-010; original legacy-cli-transition.md obligation and current ownership boundary
Writer type: Human + agent coauthor
Canonical: No
Canonical for: The pending decision proposal only
Use this when: Reviewing the original installed-default trigger against the retained npm compatibility channel
Do not use this for: Removing npm entries, changing release support, or treating the proposal as accepted
Last reviewed: Pending independent review
Related:
- docs/platform/packaging-distribution/spec.md
Supersedes: None until independent verdict
Superseded by: None recorded
```

## Original Obligation

`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.

## Proposed Disposition

Added in candidate — propose retirement of the automatic installed-default removal or redirection trigger. Keep the npm compatibility mapping, runner mapping and source-entry ownership header under their existing support and release policy. This does not decide when the npm fallback channel ends, extend its support promise, or remove a payload.

The current `package.json:9-12` maps both npm entries to the Node payload. `bin/fgos.mjs:4-10` expressly retains global npm and direct Node compatibility channels while requiring Rust host payload resolution through manifest fields. The source obligation was introduced by `4db6ee7e5d32efdd10ebfdc6aa71816e1f98754f`; the implementation header added by `c831811faaa0be93f505456aae6a134865ccbc9b` explicitly retained npm compatibility and did not remove that mapping. The candidate spec distinguishes the native public/default posture from the deprecated npm channel.

The current code proves coexistence, not intentional retirement of the original obligation. No commit explicitly retiring the trigger was found by the recorded symbol/history search. Independent review must decide whether this proposal becomes a retirement verdict or whether a restoration remains owed. Until that verdict, dropped-010 stays deferred to Packaging-distribution and its FLAGGED-obsolete literal retention is unchanged.
