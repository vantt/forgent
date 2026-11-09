---
phase: 08
title: "Workflow arm: frame parse, seats split and resume refusals move into the workflow use case; slug import"
status: pending
depends_on: ["06, 20, 21, 22 landed, and 07 if approved (T5 closed; layer order; unit-handoff.mjs after 05 and 07)"]
parallel: "T6 (Workflow layer); beside P09 and P24 (file-disjoint: this phase owns index.mjs, propose.mjs and unitOverridesOf in unit-handoff.mjs; P09 owns store.mjs, case-projection.mjs, definition.mjs; P24 owns loader.mjs and the setup readers)"
effort: ~0.5d
net_size: "Node: bin about -45, src about +30; Rust 0; tests about 0 (estimate)"
---

# Phase 08 - Workflow arm (decision 77, T6 row of arbitration §1.1)

## Context

The `workflow` arm (`bin/fgos.mjs:2270-2385`) still holds three decisions that belong to the Workflow use case: the `--frame key=value` parse, the `--seats` split, and the resume refusals for `--timeout` and `--account` (a resumed case keeps its seats' pins). Its render branch (`workflow propose` text, `main()` `:5319-5321`) and exit branches (`:5331-5345`) are shell work and stay (P01 turns the exit branches into `exitOf`).

Reused doors: `src/workflow/index.mjs` (the entry the arm already calls), `src/workflow/propose.mjs` (its `slugOf`, `:41`, becomes the shared leaf P06 introduced: one import), the use-case pattern (`<verb>UseCase(ctx, options)`, no `process.cwd()`, env or argv inside).

## Requirements

1. `--frame` parse and `--seats` split become one function each in `src/workflow/index.mjs` (or the module that already owns frame handling: `src/workflow/propose-frame.mjs` / `case-frame.mjs`; step 1 picks the existing home, no new file). Usage errors are `StoreError('validation')`.
2. The resume refusals for `--timeout` and `--account` move into the resume path of the use case with their text verbatim.
3. `propose.mjs` imports the shared slug leaf (P06) and deletes its private copy.
4. The arm keeps: flags, one call per sub-verb, print. Layer rule: no new import from `src/cli` in `src/workflow`.
5. **Authority audit AU-17.** `unitOverridesOf` (`src/workflow/unit-handoff.mjs`) calls P06's run-level fold helper from `run-request.mjs` and passes `accountPin: 'where-served'` instead of `origin: 'workflow'`; it keeps only its own seat-scoped persona entries (decision L-3). Its duplicate fill rule goes. `unit-handoff.mjs` writers in order: P05, P07, this phase, P23.

## Files

**Create:** none.

**Modify:** `src/workflow/index.mjs`, `src/workflow/propose.mjs`, `src/workflow/unit-handoff.mjs` (`unitOverridesOf` only, AU-17), the frame module chosen in step 1, `bin/fgos.mjs` (`:2270-2385`), `test/workflow/*` (owners of frame parse, seats split, resume refusals: find by `rg -l "resume.*account|--seats|--frame" test`), `test/cli/` workflow wiring cases (kept, one per sub-verb).

**Delete:** the inline parse and refusal blocks; `propose.mjs`'s private `slugOf` copy.

**Tests to retire:** `test/cli` cases that assert a frame-parse or resume-refusal message through a spawned CLI move to unit cases on the moved functions; the wiring case per sub-verb stays. Each title names its new owner.

## Red tests first

Unit cases on the moved functions (frame key=value with `=` in the value, empty key, `--seats` with spaces, resume with `--timeout`, resume with `--account`); each fails today because the code is not importable.

## Net size

bin about -45; src +30; tests about 0 (moved, not added).

## Steps

1. Callers by `rg` of the arm's helpers and `slugOf`; pick the existing frame home.
2. Red tests; move; arm thin; delete.
3. Smoke: `fgos workflow start --frame k=v` and a `resume` refusal on a built host.

## Validation (focused)

FR `test/workflow` files found in step 1, `test/cli` workflow wiring cases, `test/architecture.test.mjs`. Land gate. WORK is not involved (workflow files are HARDEN's after T6 close); COOK told (Workflow consumers).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `--frame` parse differs subtly after the move | L x M | the red table includes every form the arm accepts today, taken from its code |
| Collides with P09 on `src/workflow` | L x L | disjoint files; P09 owns `store.mjs` only |

## Rollback

Revert the merge commit.

## Done when

Red then green; the arm holds flags, one call, print; `rg -n "slugOf" src/workflow` finds the import only.
