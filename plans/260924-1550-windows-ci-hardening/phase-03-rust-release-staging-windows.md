# Phase 03 — Rust-side release staging on Windows

## Context

`plan.md` § Where things stand; `phase-00-evidence-snapshot.md`'s buckets:
`quarantine/ must contain quarantined candidate` (3), `Init must succeed:
... filename syntax incorrect` (2), plus several unlabeled failures in the
same file.

All traced (this session) to `test/rust-host/fgctl-stage.test.mjs`, tests
like `R6 & R9: Corrupting one byte before staging triggers quarantine and
puts nothing in releases/`, `P6 HIGH regression: staging a candidate with an
in-root directory symlink triggers quarantine`, and `P6 HIGH regression:
staging a candidate with an unlisted payload symlink triggers quarantine`.

**Unverified hypothesis**: several of these test names mention symlinks
(`in-root directory symlink`, `unlisted payload symlink`). Creating a
symlink via Node's `fs.symlinkSync` (or the Rust equivalent, `std::os::
windows::fs::symlink_*`) requires either Administrator privileges or
Windows Developer Mode enabled — GitHub's `windows-latest` hosted runners
may or may not have Developer Mode on by default (not confirmed in this
session). If the test FIXTURE's own symlink creation fails, the test never
reaches the code path it's meant to exercise, and whatever downstream
assertion fires next is misleading. Confirm this before assuming it's the
right lead — the "filename syntax incorrect" message is a literal Windows
`os error` (`ERROR_INVALID_NAME`, typically raised for a path containing a
character `\ / : * ? " < > |` illegal in a Windows filename, OR for the
old-style `\\?\` long-path prefix mishandling), which could equally point to
something entirely different: a POSIX-only character or path shape baked
into a test fixture or the `fgctl` Rust binary's own staging code.

`fgctl` (`herdr-plugin`'s Rust workspace, or a sibling crate — confirm which)
is compiled Rust, not JS. Any real fix here may require Rust source changes,
a `cargo build`/test cycle this session never ran, and is a materially
different risk profile than every other phase in this plan (which are all
JS/test-file changes). Budget accordingly.

## Requirements

1. Read `test/rust-host/fgctl-stage.test.mjs`'s symlink-fixture setup code
   (the actual `fs.symlinkSync` or shell-out calls) and confirm/refute the
   Developer Mode hypothesis by checking what error `fs.symlinkSync` itself
   throws on a Windows CI run BEFORE `fgctl` is ever invoked (add temporary
   diagnostic logging to a CI run if the local Linux repro can't surface it
   — symlink privilege requirements don't reproduce on Linux).
2. If confirmed: either (a) skip the symlink-fixture tests specifically on
   `win32` with a named reason (matching the `mockHerdr` precedent in
   `f169978d`) if creating the symlink is fundamentally a CI-environment
   privilege gap outside this repo's control, or (b) find whether GitHub's
   `windows-latest` image can have Developer Mode enabled via a CI step
   (research needed — don't assume either way) and add that step to
   `ci.yml` if it's a one-line fix.
3. If refuted: trace `filename syntax incorrect` to its real source — likely
   inside the Rust `fgctl` binary's own path handling during staging/
   quarantine. This needs the herdr-plugin/fgctl Rust source read (not
   covered in this session at all) and a local Windows-equivalent repro
   strategy, since this JS-side investigation cannot cross into compiled
   Rust behavior without either a Windows dev machine or very careful
   remote-log-only diagnosis via temporary `eprintln!` instrumentation on a
   throwaway branch.
4. Fix, or document as an accepted gap with a named reason if it turns out
   to require Windows-specific Rust code this repo doesn't currently invest
   in (that would itself be worth surfacing back to the user as a scoped
   decision, not silently declared out-of-scope by this phase alone).

## Files

- `test/rust-host/fgctl-stage.test.mjs` (test fixture + assertions).
- Rust source: locate via `grep -rn "quarantine" <rust-crate-dirs>` once the
  crate is identified (likely under `apps/fgos/` per
  `src/setup/registrations.mjs`'s `apps/fgos/Cargo.toml` workspace marker
  reference — confirm, don't assume).
- `.github/workflows/ci.yml` only if a Developer-Mode-enabling step is the
  fix.

## Validation

The specific failing tests pass on a real Windows CI run without weakening
what they're proving (a corrupted/malicious staging candidate must still be
quarantined — don't relax the assertion to make Windows pass if the real
gap is that Windows quarantine detection is genuinely broken).

## Risks

This is the one phase in this plan most likely to need a Rust code change
and a `cargo build --release --workspace` verification cycle on Windows,
which cannot be done locally in this repo's current dev environment (Linux
only, confirmed this session). Every fix here needs a real Windows CI round
trip to verify — budget for several iterations, same as this session needed
3 real CI runs to land the JS-side fixes.
