# Phase 09 — Release Tree Builder And Doctor

Depends on: Phase 08 closed and merged (needs a real Rust `fgos` binary and
a passing P02 harness to stage and re-verify).

## Objective

Stage a real, self-contained release tree (`bin/fgos`, `bin/fgos-runner`
shim, the Node legacy payload, and a manifest) that a later `fgctl` can
consume, and make its every new binary/payload/artifact dependency visible
to `fgos doctor`. This cell builds the tree; it does not activate it — no
`fgctl`, no installer, no `.fgos/installation/` writer here.

## Requirements

- R1: `scripts/build-rust-distribution.mjs` stages into a disposable
  directory (never inside the checkout): `bin/fgos` (from
  `target/release/fgos`), `bin/fgos-runner` (a POSIX `sh` shim that execs
  `node "$(dirname "$0")/../libexec/legacy-node/bin/fgos-runner.mjs" "$@"`,
  resolved relative to its own location — never PATH, never a hardcoded
  absolute path), and `libexec/legacy-node/` staged as exactly the file set
  `package.json`'s `files` array declares (read `files` directly, or cross-
  check with `npm pack --dry-run --json`; name which one the script uses),
  keeping the source-relative layout intact.
- R2: `manifest.json` carries the §5 minimum fields from
  `runtime-identity-and-activation.md`: `schemaVersion`, `entries.fgos`,
  `entries.fgosRunner`, `components.legacyNode.{root:"libexec/legacy-node",
  entry:"bin/fgos.mjs", digest}`, `requires.node`, `target.{os,arch,libc}`,
  and `files[]` (at minimum the public entry binaries, the legacy Node
  payload, and the manifest itself — each with `path`/`kind`/`digest`/
  `mode`/`class` per the Release Tree Canonicalization table).
  `artifactDigest = sha256(canonical-json(manifest without artifactDigest))`
  over `/`-separated, UTF-8-NFC-normalized, lexicographically sorted paths;
  refuse the build if any staged entry is an absolute path or a symlink.
- R3: `test/rust-host/release-tree.test.mjs` builds the tree into a temp
  dir, independently recomputes `artifactDigest` from the emitted
  `manifest.json` and asserts it matches (proves the formula is
  reproducible, not merely self-consistent), then runs the P02 harness
  (`test/rust-host/harness.mjs`, `FGOS_HARNESS_ENTRY=bin:<staged>/bin/fgos`)
  from a working directory outside the checkout with the checkout's own
  path removed from `PATH`/`NODE_PATH`.
- R4: Register four doctor checks via `registerCheck` in
  `src/setup/registrations.mjs`: `rust-host-binary-present` (the active
  release's `entries.fgos` exists and is executable),
  `rust-host-target-supported` (current OS/arch is an approved target —
  `x86_64-unknown-linux-gnu` per `plan.md`'s Decisions table),
  `legacy-node-payload-present` (`components.legacyNode.root`/`entry`
  resolves to a real file), and `command-routes-drift` (wraps P01's
  `scripts/export-command-selectors.mjs --check`, surfaced through doctor
  rather than staying CI-only). No `registerFix` in this cell — no
  auto-download/build; `fgctl` alone owns acquisition
  (`plan.md` Non-Negotiable Boundaries).
- R5: Append the four new check ids to `docs/specs/distribution.md` row 7's
  registered-checks list, in the same one-line comma-separated format as
  the existing entries. Row 7b (fixes) is untouched — this cell registers
  no fix.

## Files

Likely touch:

- `scripts/build-rust-distribution.mjs` (new)
- `test/rust-host/release-tree.test.mjs` (new)
- `src/setup/registrations.mjs` (doctor check registrations only)
- `docs/specs/distribution.md` (row 7 only)

Do not touch:

- `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `herdr-plugin/**` (P10's `resolver` lease)
- `package.json` `bin` map (cutover track, out of scope — see `plan.md` Non-Negotiable Boundaries)
- `apps/fgos/**`, `packages/*/rust/**`, `Cargo.*` (consumed via the built binary only, not edited)
- any `.fgos/installation/` writer or `fgctl` invocation (none exists in this track)

## Verification

```sh
cargo build --release --workspace
node scripts/build-rust-distribution.mjs --out /tmp/fgos-release-<n>
node --test test/rust-host/release-tree.test.mjs
node bin/fgos.mjs doctor --json | rg "rust-host-binary-present|rust-host-target-supported|legacy-node-payload-present|command-routes-drift"
```

**Full-suite gate** — run `plan.md`'s `FULL_TEST` before merge.

- The staged tree's harness run passes from outside the checkout with no
  checkout path on `PATH`/`NODE_PATH`.
- The recomputed `artifactDigest` matches the manifest's own.
- All four new check ids appear in a live `fgos doctor --json` run.
- Capability annotation for this cell: `code:implement`.
