---
phase: 15
title: "Every Node write-then-rename names its temp with uniqueTmpTag; second names of the durable door go"
status: pending
effort: 0.75d
leak: "census rank 9 (Node half), plus the three private atomic writers the big lead added"
startAfter: ["F0 wave A on main", "phase 01 on main (src/setup/skill-wrappers.mjs)", "phase 12 on main (src/setup/managed-timer.mjs)"]
landAfter: ["F0 phase 08 if it is open on scripts/export-command-selectors.mjs (rebase, line-local)"]
---

# Phase 15: Node temp names and durable-door names

Rules: `phase-lead-rules.md`. pNN = `p15`; report slug `odd-p15-node-temp-names`; no Rust.
Facts: `phase-00-facts.md` "Leak 9".

## Outcome

The accepted Node convention (`docs/platform/component-boundary.md:88`: per-module no-fsync helpers, each temp named with
`uniqueTmpTag()`) holds everywhere, product and tooling. A `doors` row refuses a hand-built `pid`/`Date.now()` temp name.
The exported second name for `replaceDurably` is gone. No shared Node write helper is added (the row says "no shared write
helper"; see plan.md ideas).

## Requirements

1. Temp names through `uniqueTmpTag()` (`src/util/unique-tmp-tag.mjs`): `src/runner/main-checkout-activity.mjs:94-97`,
   `src/setup/skill-wrappers.mjs:57-64,561-575`, `src/util/capped-jsonl-log.mjs:19-22`, `src/setup/managed-timer.mjs:352-354`,
   `src/holder-lock/hold-transport.mjs:226-231` (tier 1 importing tier 0: allowed), `scripts/export-command-selectors.mjs:375-380`
   (`writeAtomic`; update the `.gitignore` pattern its comment cites to the new name), `scripts/git-one-door-scan.mjs:2706`,
   `scripts/lib/git-addon-stage.mjs:49,58,66,73`, `scripts/run-rust-dev-host.mjs:24-33`. `scripts/event-store/store-increment-worker.mjs:62`
   (bench, per-worker index): move too if the pattern catches it, else leave. Before editing each, check whether any reader or
   sweeper matches the old temp name (`rg` the old pattern), and update it in the same commit.
2. `src/runner/dispatch/provider-credential-renewal.mjs:127-129` `writeFileAtomic` (exported second name for `replaceDurably`,
   mode 0o600): callers `provider-credential-renewal.mjs:336,1110` and `src/runner/dispatch/confinement/cleanup.mjs:14,107,201`
   call `replaceDurably(path.dirname(f), path.basename(f), content, 0o600)` from `src/native/door.mjs`; delete the export.
   `src/runner/dispatch/visibility-session.mjs:84` `writeJsonAtomic` (maps errors to `VisibilityError` over
   `publishMutableProjection`) and `src/workflow/case-runtime.mjs:30-35` (adds `mkdir`) are private adapters with their own
   value: keep them; say so in the report.
3. `src/run-supervisor/run-lock.mjs:47-72` best-effort fsync helpers: the Node door has no fsync-only op; keep, name in the
   component-boundary row (one clause) as accepted until an op exists (plan.md ideas).
4. `doors` row (new, `kind: door`): `{ job: "temp file name of a Node write-then-rename", patterns: [a regex for a temp name built from `process.pid` or `Date.now()` next to `tmp`, e.g. "tmp[^\\n]*\\$\\{process\\.pid\\}", "\\$\\{process\\.pid\\}[^\\n]*\\.tmp", "\\.tmp\\.\\$\\{"], allowed: ["src/util/unique-tmp-tag.mjs" only if it matches], reason: "every temp name comes from uniqueTmpTag so two threads or two calls never share one" }`.
   Tune the patterns until they match every site of requirement 1 on the base and nothing else; record the before/after
   matches in the report.

## Files

- Modify: the files of requirements 1-2, `.gitignore` (one pattern), `docs/platform/component-boundary.md` (row :88, one clause),
  `docs/architecture-manifest.json` (row).
- Tests: no behaviour changes; owners stay (`test/util/capped-jsonl-log*.test.mjs`, `test/holder-lock/*`, `test/setup/skill-wrappers.test.mjs`,
  `test/setup/managed-timer*.test.mjs`, `test/runner/main-checkout-activity.test.mjs`, `test/rust-host/command-routes.test.mjs`,
  the confinement cleanup and credential renewal tests). A test that asserted an old temp name changes to assert none is left.
- Net size: about -15.

## Gates

`node scripts/run-tests.mjs` on every test found by `rg -l "capped-jsonl-log|hold-transport|skill-wrappers|managed-timer|main-checkout-activity|export-command-selectors|git-addon-stage|run-rust-dev-host|provider-credential-renewal|confinement/cleanup" test`,
plus `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`;
`node scripts/export-command-selectors.mjs --check`; Git one-door scan count not above base (`git-one-door-scan.mjs` itself is edited).

## Risk and rollback

- A sweeper keyed on an old temp name stops cleaning (L x L): requirement 1's `rg` check. Rollback: revert the phase.
