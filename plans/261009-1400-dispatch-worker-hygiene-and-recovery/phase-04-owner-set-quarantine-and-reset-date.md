---
phase: 4
title: "Owner-set quarantine and reset date"
status: done
budget: "<= 60 added src lines; 0 new files; no new state (reuses quarantine record)"
stop: 2026-10-14
---

# Phase 04: owner-set quarantine and reset date

## Context

- [plan.md](plan.md); `docs/specs/runner.md:1020-1024` (rotator, classifier, "Manual clear duy nhất"), `:3091` (herdr quota fallback, reset window).
- Writer exists: `quarantineProviderAccount` (`src/runner/dispatch/provider-capacity.mjs:709`); only caller `settlement.mjs:599`.
- CLI has clear only: `src/verbs/dispatch/reconcile.mjs:27-40`, `src/cli/command-registry.mjs`.
- Reset parse: `provider-capacity.mjs:919-933` ("resets in 2h"); codex phrase match `:982-986`; default 1 h.
- Why the limit was hidden: worker killed at the hook-trust dialog before any call (P01 removes that); herdr failures feed the classifier only the last screen line (`assignment-runner.mjs:2630-2637`).
- Relation to [credential rotation plan](../261007-1700-provider-credential-rotation-safety/plan.md): no shared change; it edits provisioning/leases in the same file -> run after this phase.

## Requirements

- `fgos dispatch reconcile provider-capacity quarantine --provider <p> --account <id> --until <ISO> --reason "<why>"`: unknown provider/account refused; `--until` required and in the future; writes a `temporary` quarantine with `detail.kind: 'owner'`. Clear stays the existing verb.
- Classifier also reads an absolute reset time the provider prints ("try again at <date time>") -> `until` = that time. Only if the exact codex text is obtained (step 1); otherwise drop this half and keep the 1 h default.
- Trust: no change here. Hook trust is gone for read-only seats via P01; folder trust is seeded per round (`herdr-round.mjs:650-676`). Trigger for the frozen setup fix: see plan.md prior art.

## Files

- Modify: `src/verbs/dispatch/reconcile.mjs`, `src/cli/command-registry.mjs`, `src/runner/dispatch/provider-capacity.mjs` (reset parse only).
- Tests: `test/runner/provider-capacity.test.mjs` (T4 + parse fixture), CLI test beside the existing clear-quarantine test.
- Docs: `docs/specs/runner.md:1024` sentence (manual set + clear), `CHANGELOG.md` `## [Unreleased]` (new verb). Install gate: verb only, no config/env/tool.

## Steps

1. Get the real codex limit text: `herdr-diagnosis.json` / `failure` screen of the 2026-10-09 `tetcu72` runs under `/home/vantt/projects/mcp-skill-hub/.fgos/` (read-only) or codex source. No text -> skip step 3.
2. Verb + registry, reusing `quarantineProviderAccount`.
3. Absolute reset parse, fixture from step 1.
4. T4: set via verb -> `rankProviderAccounts` skips the account before `until`, includes it after (injected `now`).

## Done

T4 green, run by Lead; one manual `fgos dispatch inspect --provider-capacity` after setting a test quarantine on a throwaway runtime dir shows it.

## Risks / rollback

- Wrong date parse -> account out too long; mitigated: owner clears with the existing verb.
- Rollback: revert; quarantine records stay valid for the old reader.
