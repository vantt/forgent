---
phase: 06
title: "Guard, docs, final equivalence"
status: pending
effort: 2h
depends_on: [02, 03, 04, 05]
---

# Phase 06 — Guard, docs, final equivalence

## Context

All readers are switched (02-05 merged into the integration branch). This phase makes the rule mechanical,
records the settled fact, and proves equivalence of the whole change. Read `plan.md` (Acceptance criteria,
Field ownership), `test/architecture.test.mjs:470-575` (the run-door caller guard and its self-check: the
pattern to follow, reusing `lexSource`/`usesSymbol`), `docs/platform/governance.md#decision-scope-to-holder-table`.

## Requirements

1. Guard test in `test/architecture.test.mjs`, title in plain words, e.g.
   "runner.capabilities is read only through the capability-config port":
   scan `src`, `bin`, `scripts`, `domains`, `core` `.mjs` (same file set as `runDoorScanFiles`), comments and
   strings stripped, and refuse outside `src/runner/execution/capability-config.mjs`:
   a property read `.capabilities` not followed by `(`; a computed read `['capabilities']`; a destructuring that
   binds `capabilities`. Named exceptions, each with its meaning in a comment (out of scope, plan.md):
   `src/runner/dispatch/execution-contract.mjs`, `src/runner/dispatch/assignment.mjs` (contract hints),
   `src/setup/terminal-control-checks.mjs` (terminal-control report), `scripts/build-rust-distribution.mjs`
   (release manifest). Each exception must still match (an exception nobody needs leaves the table, as the
   run-door table does).
2. Caller table for `catalogOf`: used only by `src/runner/dispatch/config.mjs` and `src/runner/execution/run.mjs`
   (reuse the `usesSymbol` caller-table check; generalize `checkRunDoorCallers` to take its table if needed,
   without a second copy).
3. One self-check test: the guard catches `cfg.capabilities[x]`, `cfg?.capabilities`, `runner['capabilities']`,
   `const { capabilities } = runner`, and passes `terminalControl.capabilities()` and a comment mentioning
   `cfg.capabilities`.
4. Docs (Vietnamese where the file is Vietnamese; resolve holders through the governance table):
   - `docs/platform/seat-binding/spec.md` §3: one rule line — every read of `runner.capabilities` goes through
     `bind()` (binding fields, via the crate) or the port `src/runner/execution/capability-config.mjs` (one
     function per field); §16 Pointers: the port and its guard; §15: a dated 2026-11-14 entry "step 1 of the
     capability-rows decision implemented" with what was moved, the leftovers for step 2 (plan.md), and the
     evidence path `plans/261114-2051-capability-reads-one-door/reports/equivalence/`.
   - `docs/platform/vision.md:169-182`: the bullet says step 1 landed (pointer to the spec §3 line); step 2 text
     unchanged.
   - `docs/reading-map.md:158` (seat-binding row): add the port to the implementation pointers.
   - No `CHANGELOG.md` line: nothing a user of fgOS sees changes.
5. Final equivalence: run `compare-capability-reads.mjs --base <781537524 worktree> --head <integration branch>`
   and `npm run fgos:dev -- doctor --json` at base and head; diff count 0 and identical messages for rows
   `runner-patterns-config`, `workflow-capabilities-configured`, `capability-serves-valid`,
   `confinement-policies-declared`, `confinement-strict-readiness`, `seat-binding-dry-bind`, `seat-binding-route`.
   Save `reports/equivalence/final.json` and `reports/equivalence/doctor-diff.txt`.

## Files

- Modify: `test/architecture.test.mjs`, `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md`, `docs/reading-map.md`
- Create: `plans/261114-2051-capability-reads-one-door/reports/equivalence/final.json`, `.../doctor-diff.txt` (evidence)
- Delete: none

## Tests

- New: guard test + self-check (why new: no test today stops a new direct read of `runner.capabilities`).
- Retired: none.

## Gates

```
node scripts/run-tests.mjs test/architecture.test.mjs test/runner/execution/capability-config.test.mjs test/scripts/doc-health.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Then the big lead, before landing: `npm test` and `cargo test --workspace` on the integration branch (Rust
untouched; cargo gate is the repo DoD, not a Rust change). Rust fmt/clippy/msvc/aarch64-apple-darwin: N/A
(no Rust file touched; confirm with `git diff --stat origin/main -- packages apps Cargo.lock` = empty).

## Net size

tests: +~70; docs: +~10 lines.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Guard false positive on an unrelated `capabilities` | M x L | named exceptions with meaning; self-check covers the method-call case |
| Guard false negative (alias variable of the section) | M x M | `catalogOf` caller table; the section is only reachable through the port after 02-05 |
| `test/architecture.test.mjs` / `docs/reading-map.md` collide with F0 | M x M | additive blocks only; rebase first; plan.md Collision risk |
| Decision-citation drift from the new §15 entry | L x M | `check-decision-citation-drift.mjs`; cite no new D-ADR (this implements the recorded owner decision) |

## Rollback

Revert the phase commit; the guard and docs have no runtime effect.

## Success criteria

Guard green and self-check green; equivalence diff 0 and doctor rows identical (evidence saved); docs gates green;
`git diff --stat origin/main` shows no file under `core/config-standard`, `core/config-schema`, `packages`, `apps`,
`CHANGELOG.md`, `Cargo.lock`.
