# Phase 05: spec, CHANGELOG, doctor and explain rows

## Context

- [plan.md](plan.md); `docs/specs/runner.md` RUL80, RUL91, RUL102, RUL103, RUL105 (read each before editing); `docs/specs/reading-map.md` (no path change expected). Shared board files: small separate commits.

## Requirements

- **Spec.** Add one new RUL (next free number at write time) in `docs/specs/runner.md`: fallback order per tier and how a capability narrows it; primary stays `prefer` order; cross-family fallback on, the tier groups for doer and premium tiers; declared account order (replaces least-lease and least-recently-used); lease, state and quarantine per pool with the legacy state key rule; `pool/account` pin; `tier-cell-missing`; the transition read of `runner.providers.*.accounts` with its removal condition; the two reversal triggers from the plan. Then supersede, by reference and not in place, the sentences that are no longer true: RUL102 "the lease, account pins and credential provisioning still read `runner.providers` only" and "a cell with no entry for the family's pool ... falls back to the executor's own `model`"; RUL80 "an unpinned lease picks among all accounts"; RUL91's bare account id.
- **Settled fact in the area spec** "Lịch sử quyết định" section as the repo's L5 question 6 asks, plus one line in the data dictionary for `runner.tierFallback`.
- **Component boundary:** write `No component-boundary change` in the summary (ownership unchanged: bind decides candidates, the lease decides accounts).
- **CHANGELOG** `## [Unreleased]`: one line each for per-tier fallback order, declared account order, pool/account pin, tier-cell-missing refusal.
- **Doctor/explain rows:** `tier-fallback` (phase 01) is registered; update the message of `model-policy-pools` (no longer "cannot run until the pool has accounts" once pools route: it now names a pool with no account holding a matching store); `llm-accounts-vs-legacy` wording stays (the comparison is still needed during the transition). Both checks keep their ids. Explain output change is in phase 03; here only its description in `command-registry.mjs` is updated.
- After editing, verify every cited symbol and line against source; check links.

## Files

`docs/specs/runner.md`, `CHANGELOG.md`, `src/setup/registrations.mjs` (descriptions only), `src/cli/command-registry.mjs` (explain and `--account` descriptions if phase 04 left them).

## Tests

`test/setup/model-pool-checks.test.mjs` for the changed message; the doc-link and convention checks that run in `npm test`.

## Risk / rollback

Low x low. Revert the doc commits.
