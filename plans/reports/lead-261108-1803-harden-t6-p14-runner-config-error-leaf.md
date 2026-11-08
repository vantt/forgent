# HARDEN T6 P14 lead report: RunnerConfigError leaf

Landed `e9255a3e6` on main (rebased over an OPC board line only). OPC merged the diff.

## What changed
- New `src/runner/dispatch/runner-config-error.mjs`, no imports: `RunnerConfigError` plus `commonDottedParent` and the private `deriveSubpath` it needs. `config.mjs` imports it, no re-export.
- 77 files in `src`, `bin`, `scripts`, `test` rewritten by a script (import lines only), plus `domains/coding/harness/enrich-and-validate-contract.mjs` (outside the phase file list; found because the first full run failed 5 tests there).
- `docs/architecture-manifest.json` row, `docs/reference/dispatch-module-boundaries.md` row, one comment in `adapters.mjs`, regenerated `packages/git/contracts/mutation-census.v1.json` (line shifts).

## Proof
- Full `npm test`: 8634 tests, 1 fail (known V7n addendum), no run-tests ERROR lines.
- architecture, doc-health, decision-citation-drift green; one-door scan 0 undeclared; `node --check` clean.
- `rg` finds no `RunnerConfigError` import from `config.mjs` in `src bin scripts test domains`.

## Retired tests
None. Retired-title to owner table: empty.

## Notes
Historical verification docs under `docs/platform/agent-coordination/verification/` still name the old path; they are stateful records and were left alone.
No user-visible change; no CHANGELOG line.
