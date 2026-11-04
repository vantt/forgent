# Retire the documentation-cutover lease

Status: closed (landed on main `ad72e3a46`, 2026-11-04; review [report](../reports/review-261104-1355-retire-cutover-lease-branch.md) REWORK fixed in `93c5aabe4`)
Owner: `lead:DOC`
Parent: [plan 260925](../260925-documentation-authority-unification/plan.md) (closed; Phase 10 landed `97cc4b432`, release `a454e189`)
Facts: [scout report](../reports/scout-261104-1320-documentation-cutover-lease-retirement-facts.md)

## Outcome

The documentation-cutover write lease protected `docs/**`, `AGENTS.md`, `CLAUDE.md` and the skill trees while the documentation cutover ran. The cutover landed on 2026-11-03 (`97dd62aa7`), no lease is held, and no sidecar, token or lock file exists. Retire the mechanism whole (L10, design principle 1): every consumer moves, the old path and its owning tests go in the same change.

## Non-goals

- No replacement guard. The Phase 9 guards (no legacy roots, placement, platform links) and `scripts/doc-health.mjs` stay as they are.
- No edit to provenance mentions of "the documentation cutover (`97dd62aa7`)"; those describe the docs move, not the lease.

## Change list

1. Delete `src/runner/documentation-cutover-lease.mjs`, `src/runner/documentation-cutover-lease-hook.mjs`, `.githooks/reference-transaction`, and their owning tests `test/runner/documentation-cutover-lease.test.mjs`, `test/e2e/documentation-cutover-lease-hooks.test.mjs`.
2. Remove the `docs-lease` verb: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json`, `test/cli/subcommand-flag-drift.test.mjs`; regenerate the envelope vectors through their tool.
3. Remove the admission plumbing (`documentationAdmission`, `leaseAdmission`, `admitDocumentationExecution`) from `src/runner/merge.mjs`, `src/runner/execution/run.mjs`, `src/workflow/runner.mjs`, `src/workflow/case-start.mjs`, `bin/fgos.mjs`, and the lease fixtures in the seven referencing tests; their non-lease cases keep their owning proofs.
4. `.githooks/pre-commit`: drop the lease import, `leaseGitRead`, the pre-commit lease guard and the `reference-transaction` argv branch; keep the order of every other guard.
5. Doctor: drop the `documentation-cutover-lease` check (`src/setup/registrations.mjs`), the `documentation-cutover` lock-scan entry (`src/setup/holder-lock-checks.mjs`), `test/setup/checks.test.mjs`, and the registry enumerations in `setup-doctor-registry.md`.
6. Lock registry: drop the `documentation-cutover` row and band-10 note (`packages/holder-lock/contracts/lock-registry.v1.json`, `docs/platform/holder-lock/spec.md`).
7. Generated: regenerate `packages/git/contracts/mutation-census.v1.json`; remove the `leaseGitRead` entry in `scripts/lib/git-one-door-declarations.v1.json` (its `retireWhen` is met); update `docs/architecture-manifest.json`.
8. Docs: `docs/platform/holder-lock/spec.md` and `docs/platform/git/spec.md` lease sections become one retired note each; decision history gets a 2026-11-04 retirement entry; `CHANGELOG.md` `[Unreleased]` gets one line (`fgos docs-lease` removed).

## Coordination

- Git lane: pre-commit guard order, `.githooks/reference-transaction`, the one-door declaration, census. Ack asked on the board.
- HARDEN lane: lock-registry row and band note. Ack asked on the board.
- LAND: heavy IO window for the gate; new release afterwards.

## Acceptance

- `rg -n 'documentation-cutover-lease|docs-lease|documentationAdmission|leaseAdmission' src bin scripts packages apps .githooks test docs/platform` returns only the retirement notes.
- Full `npm test` and `cargo test --workspace` in a plain clone: no new red against the list already red on main.
- `fgos doctor` through a release built from the change: no `documentation-cutover-lease` row, no new red.

## Risk and rollback

Removing `runUnit`/`prepareWorkflowRun` options is an internal contract change; all callers are in this repo (no backward compatibility, one user). Rollback is a revert of the single product commit.
