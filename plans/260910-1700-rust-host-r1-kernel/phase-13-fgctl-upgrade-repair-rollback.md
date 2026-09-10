# Phase 13 — fgctl Upgrade, Repair, Rollback

Depends on: Phase 12 closed and merged.

## Objective

Add `fgctl upgrade --from <source>`, `fgctl repair`, and `fgctl verify`, and
extend `fgctl status` to show active/previous/quarantined state — all
reusing Phase 12's preflight/publish/tail pipeline rather than a second one.
This closes the fgctl lane; it is a full-suite gate.

## Requirements

- R1: `fgctl upgrade --from <source>` stages a second release (Phase 11's
  `stage`) and re-runs Phase 12's preflight → publish → tail pipeline
  against it, with one added refusal before publish: read the workspace's
  `<workHistoryRoot>/schema.json` `currentStateSchema` (missing file ⇒
  `"1"`, the §10 adoption rule); refuse `state-schema-incompatible` unless
  the candidate's `stateSchemas.read` includes it, or
  `state-schema-write-incompatible` unless `stateSchemas.write` also
  includes it — refuse the upgrade outright in this cell, no `--read-only`
  activation path yet (explicitly deferred per §11).
- R2: On a successful upgrade, `activation.json` gets a new `activationId`,
  its `artifactDigest` becomes the new digest, and `previousArtifactDigest`
  is set to the digest that was active immediately before (not further
  back). The previous release directory under `releases/` is never deleted
  (Retention decision).
- R3: `fgctl repair`: if `activation.json.previousArtifactDigest` is set,
  re-run the publish pipeline against that already-staged directory (no
  download, no re-stage — Phase 11's `stage` is a no-op since the digest
  already exists); if it is `null`, re-verify the currently active release's
  files against its own manifest and re-publish the same digest (heals a
  corrupted/quarantined capsule without changing identity). Both paths run
  R1's schema check before publishing — rolling back to an older runtime
  that cannot write the current schema must not silently touch state.
- R4: `fgctl verify` (new, read-only unless it finds drift): recomputes the
  active release's `artifactDigest` and re-checks every `files[]` digest
  under `releases/<digest>/`; on any mismatch it moves that directory to
  `quarantine/<digest>-<timestamp>/` (Phase 11's quarantine path, reused)
  and sets `activation.json.status` to `"quarantined"` in place (a targeted
  field update, not a full republish) — every reader must treat a
  `quarantined` status the same as a missing binding.
- R5: `fgctl status` output gains `previousArtifactDigest` and, when the
  active release is quarantined, a `quarantined: true` marker, alongside
  Phase 11's per-release list.
- R6: `test/rust-host/fgctl-upgrade.test.mjs`: stage tree A → `fgctl init` →
  build tree B (bumped `releaseVersion`, different digest) → `fgctl upgrade
  --from B` → `version --runtime-json` shows B's digest and
  `previousArtifactDigest` = A's digest → `fgctl repair` → shows A's digest
  again; hash every file under the fixture's work-history root before and
  after the whole sequence and assert byte-identical (upgrade/repair never
  touch work-state). Separately: corrupt one byte in the active release's
  staged file → `fgctl verify` quarantines it and `status` reflects
  `quarantined`. Separately: an upgrade candidate whose `stateSchemas.write`
  omits the workspace's current schema is refused before publish, leaving
  the previous `activation.json` byte-for-byte unchanged.

## Files

Likely touch:

- `apps/fgctl/src/**` (`upgrade`/`repair`/`verify` subcommands, `status`
  extension)
- `packages/distribution/rust/src/**` (schema-compatibility check,
  quarantine-in-place status update — additive to Phase 11/12 modules)
- `test/rust-host/fgctl-upgrade.test.mjs` (new)

Do not touch:

- Everything Phase 12's Do-Not-Touch list names
- `apps/fgctl/src/`'s `init`-only modules beyond what `upgrade`/`repair`/
  `verify` genuinely share (do not restructure Phase 12's `init` path)

## Verification

```sh
cargo test --workspace
node --test test/rust-host/fgctl-upgrade.test.mjs
```

**Full-suite gate** — run `plan.md`'s `FULL_TEST` before merge.

- The A→B upgrade then repair round-trips the reported digest with zero
  work-state file changes (hash comparison).
- A corrupted active release quarantines and `status` reflects it.
- A schema-incompatible candidate is refused; the previous binding is
  untouched.
- The alias-ban grep from `plan.md`'s Constraints, run over the new
  `apps/fgctl`/`packages/distribution/rust` modules, returns nothing.
- Capability annotation for this cell: `code:implement`.
