# Phase 10 — Tier-Zero Resolver

Depends on: Phase 09 closed and merged (the fixture below models the
release tree P09 builds).

## Objective

Add one workspace-shim tier (tier 0) to each runtime's single `fgos`
resolver, so all nine inventoried call sites (P00) are ready for the
cutover track's installed-entry flip without touching them again. The
installed default and `package.json` `bin.fgos` do not change in this cell.

## Requirements

- R1: Extend `resolveFgosBin` in `src/setup/bin-discovery.mjs` with a new
  tier 0, checked before today's tier 1 (dev-checkout): when
  `<repoRoot>/.fgos/installation/activation.json` exists and its manifest's
  `entries.fgos` resolves to a real file, return `{tier: 0, path}`. When
  `.fgos/installation/` or its activation file is absent or unreadable,
  fall through to today's tier 1-3 chain unchanged — absence must be
  byte-identical to today's behavior.
- R2: Extend the `fgos()` function in `scripts/fgos-shell-integration.sh`
  with the same tier-0 check (`[ -x "$root/.fgos/installation/bin/fgos" ]`)
  before its existing `bin/fgos.mjs` branch, preserving the existing
  `--dir` auto-append behavior regardless of which tier resolves.
- R3: Add one `resolve_fgos(root: &Path) -> Result<PathBuf, ...>` in
  `herdr-plugin/src/fgos.rs` implementing the same tier-0-then-fallback
  chain (tier 0: `<root>/.fgos/installation/bin/fgos` if present and
  executable; fallback: today's `root.join("bin/fgos.mjs")` run via
  `node`). Change all three existing Herdr call sites
  (`herdr-plugin/src/fgos.rs::run_fgos`,
  `herdr-plugin/src/gateway.rs::build_fgos_command`,
  `herdr-plugin/src/main.rs::fetch_worker_slots`) to call it instead of
  each independently hardcoding `root.join("bin/fgos.mjs")`. When tier 0
  resolves, invoke the resolved binary directly (no `node` prefix); when it
  doesn't, keep spawning `node <root>/bin/fgos.mjs` exactly as today.
- R4: Route `src/runner/dispatch/cli.mjs`'s `BIN_FGOS_PATH` constant through
  `resolveFgosBin` (R1) rather than a fixed `fileURLToPath` join, preferring
  a tier-0 resolution when present with the same fallback as R1. Update
  `checkPluginSkillCliReachable`'s tier-label branch in
  `src/setup/registrations.mjs` (~line 2338) to add a `tier === 0` label
  distinct from today's tier-1/tier-2/tier-3-or-other branches.
- R5: `src/evolve/iron-law.mjs`'s `MODULE_RULES` self-modifying-capable list
  gets one new `{kind:'equals', value:'src/setup/bin-discovery.mjs'}`
  entry, so a diff touching the tier-0 resolver is flagged the same way a
  `bin/fgos.mjs` diff already is (over-reporting is this list's documented
  safe direction). This is `iron-law.mjs`'s only change in this cell — it
  is a static risk classifier, not a runtime caller, and is not wired to
  call `resolveFgosBin`.
- R6: Update `core/skills/_shared/fgos-cli-fallback.md`'s shell snippet to
  check `.fgos/installation/bin/fgos` before `bin/fgos.mjs`, matching R2's
  precedence; run `npm run build:skills` afterward so the `.agents`/
  `plugins`/`.claude` mirrors regenerate — never hand-edit those copies.
- R7: `package.json`'s `bin.fgos` stays `bin/fgos.mjs`, unchanged, in this
  cell — the installed-entry flip is out of this track's scope (`plan.md`
  Non-Negotiable Boundaries).
- R8: One fixture with a synthetic `.fgos/installation/activation.json` +
  `manifest.json` proves tier-0 resolution end to end for R1 (Node), R2
  (shell), and R3 (Herdr). A second fixture with no `.fgos/installation/`
  at all proves byte-identical fallback against the existing bin-discovery
  test suite — no existing assertion in that suite changes.

## Files

Likely touch:

- `src/setup/bin-discovery.mjs`
- `src/setup/registrations.mjs` (reachability-check tier label only)
- `scripts/fgos-shell-integration.sh`
- `herdr-plugin/src/fgos.rs`, `herdr-plugin/src/gateway.rs`, `herdr-plugin/src/main.rs`
- `src/runner/dispatch/cli.mjs`
- `src/evolve/iron-law.mjs`
- `core/skills/_shared/fgos-cli-fallback.md` (then regenerate mirrors via `npm run build:skills`)
- test fixtures under `test/setup/**` and the corresponding Herdr test module

Do not touch:

- `package.json` (`bin` map unchanged this cell — R7)
- `scripts/build-rust-distribution.mjs` (P09's file)
- `apps/fgos/**`, `packages/*/rust/**`, `Cargo.*` (Rust-lane crates)
- any real content under this repo's own `.fgos/installation/` (fixtures only, never this checkout's own activation state)

## Verification

```sh
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
cargo test --manifest-path herdr-plugin/Cargo.toml
npm run build:skills && git diff --stat .agents/skills .claude/skills plugins/fgOS/skills
```

- Full Node suite and the independent Herdr suite are green.
- The tier-0 fixture resolves through Node, shell, and Herdr; the
  no-`.fgos/installation/` fixture reproduces today's behavior unchanged.
- The mirror regeneration diff contains only the fallback-doc change
  propagated forward, nothing stray.
- Capability annotation for this cell: `code:implement`.
