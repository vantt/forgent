---
phase: 15
title: "Every ranked Node write-then-rename names its temp with uniqueTmpTag"
status: pending
effort: 0.75d
leak: "census rank 9 (Node half), plus the generator writeAtomic the big lead added (his other two finds are adapters, kept)"
startAfter: ["F0 wave A on main", "phase 01 on main (src/setup/skill-wrappers.mjs)", "phase 12 on main (src/setup/managed-timer.mjs)"]
landAfter: ["F0 phase 08 if it is open on scripts/export-command-selectors.mjs (rebase, line-local)"]
---

# Phase 15: Node temp names

<!-- Red team 2026-11-14: scope back to the ranked product helpers plus the lead's generator writeAtomic; writeFileAtomic kept (one place for 0600); skill-wrappers temp filter updated; patterns target exact forms. -->

Rules: `phase-lead-rules.md`. pNN = `p15`; report slug `odd-p15-node-temp-names`; no Rust.
Facts: `phase-00-facts.md` "Leak 9".

## Outcome

The accepted Node convention (`docs/platform/component-boundary.md:88`: per-module no-fsync helpers, each temp named with
`uniqueTmpTag()`) holds in every product helper the census ranked and in the generator's `writeAtomic` the big lead added. A
`doors` row refuses the hand-built temp-name forms. No shared Node write helper is added (the row says "no shared write
helper"; see plan.md Ideas).

## Requirements

1. Temp names through `uniqueTmpTag()` (`src/util/unique-tmp-tag.mjs`): `src/runner/main-checkout-activity.mjs:94-97`,
   `src/setup/skill-wrappers.mjs:57-64,561-575`, `src/util/capped-jsonl-log.mjs:19-22`, `src/setup/managed-timer.mjs:352-354`,
   `src/holder-lock/hold-transport.mjs:226-231` (tier 1 importing tier 0: allowed), `scripts/export-command-selectors.mjs:375-380`
   (`writeAtomic`; update the `.gitignore` pattern its comment cites to the new name).
   - Readers of the old names move in the same commit. Known one: `skill-wrappers.mjs:31` `ATOMIC_TMP_SUFFIX_PATTERN`
     (`/\.tmp-\d+-\d+-[a-z0-9]+$/`) hides other writers' in-flight temps (`:71-75`); it must accept both the old form (temps of
     older releases on disk) and the `uniqueTmpTag()` form (`pid-threadId-ts-hex`). Search for every other reader by name shape,
     not only by the old template (`rg -n "\.tmp" src scripts` near each site), and list what you found.
2. Other tooling temps (`scripts/git-one-door-scan.mjs:2706`, `scripts/lib/git-addon-stage.mjs:49-73`, `scripts/run-rust-dev-host.mjs:24-33`,
   `scripts/event-store/store-increment-worker.mjs:62`): census 4.5 called them legitimate tooling; leave them, named in the row's
   `allowed` with that reason if the patterns catch them.
3. `src/runner/dispatch/provider-credential-renewal.mjs:127-129` `writeFileAtomic`: keep. It is an adapter over `replaceDurably`
   and the one place that fixes `0o600` for credentials, the cooldown file and confinement cleanup markers (callers `:336,1110`,
   `confinement/cleanup.mjs:107,201`); inlining would spread the mode over five sites with one test. Same verdict for
   `visibility-session.mjs:84` (maps errors) and `case-runtime.mjs:30-35` (adds mkdir). Record all three in the report.
4. `src/run-supervisor/run-lock.mjs:47-72` best-effort fsync helpers: the Node door has no fsync-only op; keep, named in the
   component-boundary row (one clause) as accepted until an op exists (plan.md Ideas).
5. `doors` row (new, `kind: door`): `{ job: "temp file name of a Node write-then-rename", patterns: [...], allowed: [...], reason: "every temp name comes from uniqueTmpTag so two threads or two calls never share one" }`.
   Write patterns for the exact bad forms found on the base (for example `\.tmp-\$\{process\.pid\}`, `\$\{process\.pid\}\.tmp`,
   `\.tmp\.\$\{process\.pid\}`, `req-\$\{[^}]+\}\.json\.tmp`), each matching at least one site of requirement 1 before the
   change and none after. Do not allow a requirement-1 file for an unrelated match (that would switch its guard off): narrow the
   pattern instead (`hold-transport.mjs:98` is an `mkdtemp` prefix, renewal's directory staging is a different job). Record
   before/after matches in the report.

## Files

- Modify: the files of requirement 1, `.gitignore` (one pattern), `docs/platform/component-boundary.md` (row :88, one clause),
  `docs/architecture-manifest.json` (row).
- Tests: no behaviour changes; owners stay (`test/util/capped-jsonl-log*.test.mjs`, `test/holder-lock/*`, `test/setup/skill-wrappers.test.mjs`,
  `test/setup/managed-timer*.test.mjs`, `test/runner/main-checkout-activity.test.mjs`, `test/rust-host/command-routes.test.mjs`). A test that asserted an old temp name changes to assert none is left; `test/setup/skill-wrappers.test.mjs` gains one case
  that a `uniqueTmpTag()`-shaped in-flight temp is hidden (why new: the filter's input form changes).
- Net size: about -15.

## Gates

`node scripts/run-tests.mjs` on every test found by `rg -l "capped-jsonl-log|hold-transport|skill-wrappers|managed-timer|main-checkout-activity|export-command-selectors" test`,
plus `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`;
`node scripts/export-command-selectors.mjs --check`; Git one-door scan count not above base.

## Risk and rollback

- A sweeper keyed on an old temp name stops cleaning (L x L): requirement 1's `rg` check. Rollback: revert the phase.
