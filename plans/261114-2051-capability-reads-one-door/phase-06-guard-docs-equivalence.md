---
phase: 06
title: "The door made mechanical: architecture rule, docs, final equivalence"
status: pending
effort: 2.5h
depends_on: [02, 03, 04, 05]
---

# Phase 06 — The door made mechanical

## Context

Owner concern: the one door keeps regressing because nothing enforces it (plan.md Facts, last paragraph: the
seat-binding landing left the catalog without an owner or a guard, and readers spread again). This phase turns
the rule into a failing test, extending the existing guard file rather than adding a script. All readers are
switched (02-05 merged into the integration branch), so the rule is green the moment it is added; the integration
branch lands on main once, so the rule and the last reader move reach main in the same change and it can never
start red. Read `plan.md` (Acceptance criteria, Field ownership), `test/architecture.test.mjs:470-575` (the
run-door caller guard and its self-check: the pattern to follow, reusing `lexSource`, `usesSymbol`,
`runDoorScanFiles`), `docs/platform/governance.md#decision-scope-to-holder-table`.

## Requirements

1. Rule in `test/architecture.test.mjs`, title in plain words, e.g.
   "only the capability-config port reads runner.capabilities; every other file asks it or bind()":
   - scan the `runDoorScanFiles()` set (`src`, `bin`, `scripts`, `domains`, `core` `.mjs`) with comments stripped;
   - a violation is, outside `src/runner/execution/capability-config.mjs`: a property read `<receiver>.capabilities`
     or `<receiver>?.capabilities` not followed by `(`; a computed read whose key is the string `capabilities`
     (checked on the code with strings kept, as `usesSymbol` does for `['symbol']`); a destructuring that binds
     the `capabilities` key, plain or renamed (`{ capabilities }`, `{ capabilities: x }`);
   - exemptions are receiver-level, each with its meaning in a comment (plan.md, out of scope):
     `contract.capabilities`, `payload.capabilities`, `fanOutPayload.capabilities` (execution-contract hints,
     `execution-contract.mjs`, `assignment.mjs`); `manifestWithoutDigest.capabilities` (release manifest,
     `scripts/build-rust-distribution.mjs`); the destructuring of the terminal-control `report`
     (`src/setup/terminal-control-checks.mjs:67`). Each exemption must still match somewhere (an unused one
     leaves the table, as the run-door table does);
   - the failure message names file, line and the door: "read runner.capabilities through
     src/runner/execution/capability-config.mjs (one function per field) or use bind()'s result".
   - Not covered, said in a comment: computed keys built at run time (`'cap' + 'abilities'`) and `in` tests; the
     caller table below and review cover the remaining path.
2. Caller table for `catalogOf` (the only port function that returns the raw section): used only by
   `src/runner/execution/run.mjs` (run record) and `src/setup/registrations.mjs` (presence test of two doctor
   rows). Reuse `usesSymbol` and the caller-table check; generalize `checkRunDoorCallers` to take its table if
   needed, without a second copy.
3. One self-check test: the rule flags `cfg.capabilities[x]`, `cfg?.capabilities`, `runner['capabilities']`,
   `const { capabilities } = runner`, `const { capabilities: caps } = runner`, and passes
   `terminalControl.capabilities()`, `contract.capabilities`, and a comment mentioning `cfg.capabilities`.
4. Docs (Vietnamese where the file is Vietnamese; holders through the governance table; seat-binding has its own
   §15 history):
   - `docs/platform/seat-binding/spec.md` §3: one rule line — every read of `runner.capabilities` goes through
     `bind()` (binding fields, via the crate) or `src/runner/execution/capability-config.mjs` (one function per
     field), enforced by `test/architecture.test.mjs`; §16 Pointers: the port and the rule; §15: a dated
     2026-11-14 entry "step 1 of the capability-rows decision implemented": what moved, the Intended deltas, the
     leftovers for step 2 (plan.md), evidence `plans/261114-2051-capability-reads-one-door/reports/equivalence/`.
     Cite no new D-ADR (this implements the owner decision recorded in `docs/platform/vision.md`).
   - `docs/platform/vision.md:169-182`: the bullet says step 1 landed, pointing at the spec §3 line; step 2 text unchanged.
   - No `docs/reading-map.md` edit (spec §16 carries the pointer) and no `CHANGELOG.md` line (nothing a user sees changes).
5. Final equivalence: run `compare-capability-reads.mjs --base <781537524 worktree> --head <integration branch>`
   (0 failures; commit `reports/equivalence/final.summary.json`), and `npm run fgos:dev -- doctor --json` at head:
   the seven rows listed in phase 01 req 10 print the messages saved in `doctor-base.json`; commit
   `reports/equivalence/doctor.summary.json` (digests and equal/different per row only).

## Files

- Modify: `test/architecture.test.mjs`, `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md`
- Create: `plans/261114-2051-capability-reads-one-door/reports/equivalence/final.summary.json`, `.../doctor.summary.json`
- Delete: none

## Tests

- New: the rule + its self-check (why new: no test today stops a new direct read of `runner.capabilities`; this is
  what let readers spread after the seat-binding landing).
- Retired: none.

## Gates

```
node scripts/run-tests.mjs test/architecture.test.mjs test/runner/execution/capability-config.test.mjs test/scripts/doc-health.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Then, before landing, the big lead runs `npm test` and `cargo test --workspace` on the integration branch (Rust
untouched; the cargo gate is the repo DoD, not a Rust change). Rust fmt/clippy/msvc/aarch64-apple-darwin: N/A —
confirm with `git diff --stat origin/main -- packages apps Cargo.lock` = empty.

## Net size

tests: +~80; docs: +~10 lines.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Rule false positive on an unrelated `capabilities` | M x L | receiver-level exemptions; self-check covers the method call and `contract.capabilities` |
| Rule false negative | M x M | string-key and renamed-destructuring forms checked; `catalogOf` caller table; the port never returns an entry; uncovered forms named in a comment |
| Rule lands red | L x H | written after 02-05 merged; run on the integration branch before commit |
| `test/architecture.test.mjs` collides with F0 | M x M | additive block; rebase first; plan.md Collision risk |
| Decision-citation drift from the §15 entry | L x M | `check-decision-citation-drift.mjs`; no new D-ADR cited |

## Rollback

Revert the phase merge (plan.md Rollback); the rule and docs have no runtime effect.

## Success criteria

Rule and self-check green; harness 0 failures and doctor rows equal (summaries committed); docs gates green;
`git diff --stat origin/main` shows no file under `core/config-standard`, `core/config-schema`, `packages`, `apps`,
nor `CHANGELOG.md`, `Cargo.lock`.
