# Phase 7: Docs, spec corrections, changelog

## Context

L5 question 6 and the documentation rule: settled facts go to the owning spec, decisions to the decision-history
section; the component boundary is updated when ownership changes. F25 lists the stale text.

## Files it writes

`docs/platform/documentation/spec.md`, `docs/platform/documentation/subcomponents/document-identity/spec.md`,
`docs/platform/packaging-distribution/spec.md`,
`docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`,
`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/platform/component-boundary.md`,
`CHANGELOG.md`.

## Steps

1. Documentation spec section 4 step 1: pin `v0.7.0`; status line "step 1 built"; history line (2026-11-22, pin moved to
   v0.7.0 before any code linked pkm).
2. Document-identity spec:
   - 8.2: pin `v0.7.0` with a history line naming the v0.7.0 breaking changes and that step 1 uses none of them;
   - line ~436: "build step 3 ... starts on `v0.4.0`" becomes step 1 on `v0.7.0`;
   - line ~634 (section 14 row): pin `v0.7.0`, status built;
   - correct F7 (fgOS derives `partial`; pkm's locate drops it), F16 (Windows static CRT is pkm's need; fgOS uses the
     dynamic CRT; unverified), F12 (Linux uses a self-built static ORT because of the glibc 2.35 ceiling), F11 and
     decision 1 (vault is `docs/`), decision 2 (machine model folder), the single best section per candidate (F8);
   - section 14 rows and section 15 "after implementation": the measured numbers from phase 6 and the owning proofs.
3. Packaging spec: release binary size growth, the model folder, the doctor rows and fix, building from source needs
   pkm access (dev checkout channel 3.3), the static ORT asset. Layout contract: `<machineReleaseStore>/models/`.
   Setup-doctor registry: the new pointer row in the pointer table and the inventory.
4. Component boundary: the rows in plan.md "Component boundary".
5. `CHANGELOG.md` `## [Unreleased]`: "Added: `fgos doc locate` returns the ten documents most likely to already hold a
   draft's claim ...; `fgos doc index status|stop|reset`; doctor rows `doc-locate-model` and `doc-locate-index`;
   `fgctl init` fetches the embedding model (about 130 MB) once per machine; config `docLocate.modelSource` for a mirror
   or an offline folder."

## Validation

```sh
node scripts/doc-health.mjs -- <each changed doc>
npm run fgos:dev -- convention check -- <each changed doc>
git diff --stat   # only the files above
```

## Risk

`component-boundary.md` is also in the draft component-authority plan's footprint: land serially and note it on the
program board's shared-file list.

## Rollback

Revert the commit.
