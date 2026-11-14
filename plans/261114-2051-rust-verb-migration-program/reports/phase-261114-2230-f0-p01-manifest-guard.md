# F0 phase 01: manifest artifact and one-door guard

Branch `rust-verb-migration-program/f0-p01`, based on `origin/rust-verb-migration-program/f0` (6b4d2dcb4).

## Done

- `publicManifest()` lives in `src/cli/command-registry.mjs`; `bin/fgos.mjs` imports it and keeps no copy.
- The generator writes and `--check`s `packages/host-runtime/contracts/command-manifest.json` through one atomic writer local to the generator. Drift names the file ("Command manifest drift detected").
- Bytes equal the pre-change `node bin/fgos.mjs --help --json`: SHA-256 `5d9c41f8e4f41d4e610a3f1f9702148c685ccca049ad7f57ef26ad5194e9ade7` before and after (231844 bytes).
- Drift guard in `test/cli/fgos-manifest.test.mjs` now ends at `renderPlanLintReport`, the next top-level non-help function.
- `doors` table with the "verb manifest projection" row; `checkDoors` plus eight cases in `test/architecture.test.mjs`.
- Rust helpers `lexRust` and `rustTestRanges` moved from the scan into `scripts/lib/rust-source.mjs`, used by the scan and the check (one brace counter).
- OPC pre-review items 1-7 applied; the phase file is amended to match. Census regenerated: hash lines and digest only.

## Gates

- `export-command-selectors.mjs --check`: clean.
- Focused run (the phase's gate list plus one-door, declarations, census-drift and event-store door tests): 225 pass, 0 fail (needs a release build in the CARGO_TARGET_DIR; built once).
- `git-one-door-scan --root .`: 0 undeclared, class counts identical to the baseline; `packages` outside-product count 280 to 281 is the new JSON file.

## Deviation to confirm

OPC item 1 said to strip "comments and strings" with `lexSource`. I used its `code` view (comments blanked, string contents kept), the same as the existing custody guard: blanking strings would make `child_process` import-specifier patterns for ratchet rows impossible. Stated in the check header and the phase file.

## Debt note for the one-door-debt plan (item 7)

Three private atomic writers (tmp file, then rename) exist: the generator's own `writeAtomic` in `scripts/export-command-selectors.mjs` (factored from two copies in this phase, kept local by instruction), `writeFileAtomic` in `src/runner/dispatch/provider-credential-renewal.mjs:127`, and the generator's earlier inline copy (now merged into the first). Moving them behind one shared door is left to that plan; no `doors` row covers it yet.

## Authority

None found.

## Lessons

- A fresh worktree has no built addon; host help tests need `cargo build --locked --release --workspace` in the lane's CARGO_TARGET_DIR before the focused gate.
- `fgos convention path` only runs from the main checkout (no `.fgos/installation` in a linked worktree).
- Recording the SHA-256 of `--help --json` before touching the projection made requirement 3 a one-line check.

Status: DONE
Summary: Manifest artifact, drift check and the `doors` guard with its first row are in and green; branch pushed, not landed.
