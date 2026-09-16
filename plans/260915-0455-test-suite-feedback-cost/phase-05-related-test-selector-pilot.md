# P05 - Related Test Selector Pilot

**Capability:** `code:implement`

**Depends on:** P04

## Purpose

Build a conservative repository-local inner-loop selector and evaluate it in
shadow mode against the unchanged full-suite gate, per TFC-D01, TFC-D07, and
TFC-D08.

## Read First

`decision-lock.md`, `reports/green-baseline.md`, `scripts/run-tests.mjs`,
`docs/specs/reading-map.md`, command/registry and generated-projection sources,
and the selector sections of both reviewer recommendations.

## File Lease

- Add: `scripts/test-select.mjs`, `test/test-ownership.mjs`, selector tests
  under `test/scripts/`, and `reports/related-selector-pilot.md`
- Edit: `scripts/run-tests.mjs`, `package.json`, `CHANGELOG.md`
- Add/edit user guidance: `docs/how-to/run-the-right-tests.md` and the matching
  `docs/specs/reading-map.md` entry
- Must not edit: production runtime, Work verify behavior, CI full-suite command,
  skills, or test tier taxonomy

## Requirements

R1. Manifest rules carry `id`, `ownerArea`, `sourcePatterns`, `directTests`,
   `boundaryTests`, `reason`, and `escalationPolicy`.
R2. Start with a few clearly owned source regions. Unmapped or only partially
   explained changed paths force full selection.
R3. Full triggers include the selector/runner/manifest, shared harnesses, package
   and lock files, CLI entry/registry, shared state/event/replay core, CI/hooks,
   generated skill sources/targets, and dynamic config/schema/template surfaces.
R4. Compute tracked changes from resolved trunk merge-base through the current
   working tree; add untracked files; normalize/de-duplicate; preserve old/new
   rename paths and deleted old paths.
R5. `--base` is an explicit diagnostic/CI override. It prints base, resolved
   trunk and merge-base SHAs and may not silently narrow default changes.
R6. `--explain` reports changed paths, matched rules, selected tests, reasons,
   escalation, and final `related|full` decision.
R7. Validate schema, containment, stale/empty patterns, missing required tests,
   traversal, and symlink escape. Unsafe resolution forces full at runtime.
R8. Reuse P01's test execution function and argument arrays; zero selected files
   never passes.
R9. Static import analysis, if included, may add tests only and dynamic imports
   force escalation unless explicitly owned.
R10. Shadow-evaluate representative patches and reproducible historical
    regressions against full suite results. Classify patch-related misses,
    existing failures, and flakes separately.

## Adversarial Checks

- Staged-only, unstaged-only, mixed, untracked, rename, delete, and missing base.
- Helper/config/Markdown/JSON changes escaping ownership.
- Path traversal and symlink outside repo root.
- A test path disappearing while the selector returns success.
- Related green/full red incorrectly labelled a selector miss without causal
  analysis, or a real miss dismissed as flake.

## Verification

```sh
node --test test/scripts/test-select.test.mjs
npm run test:related -- --explain
npm test
```

## Acceptance

Focused tests cover every adversarial case; full suite remains the gate; shadow
report includes selection overhead, selected-file ratio, fallback-full rate,
sample definition, and miss analysis. Any unresolved patch-related false
negative yields `revise` or `stop`, never default adoption.

## Risks And Rollback

Risk is false confidence from an incomplete ownership map. On any unresolved
patch-related miss, remove default-adoption guidance while retaining the
selector behind explicit experimental use, or remove the command entirely if
fail-safe behavior itself is unsound.

## Handoff

Publish an `adopt-inner-loop`, `revise`, or `stop` verdict. Adoption remains
repo-local and does not authorize changing item verify strings.
