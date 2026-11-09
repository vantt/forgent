---
phase: 03
title: "Git and worktree arms: one worktree context, usage errors as StoreError, reset use case with the main-checkout policy, store admission beside isMainWorktree"
status: pending
depends_on: ["02 landed (the root door)"]
parallel: "T2 layer; alone in its layer except it may share the layer slot with nothing else"
effort: ~1.25d
net_size: "Node: bin about -60, src about +50; Rust 0; tests about -40 (estimate)"
---

# Phase 03 - Git and worktree arms (T9-15, red-team F6, store guards of `main()`)

## Context

The T2 arms hold logic the Git and worktree layer should own: `worktree` (`bin/fgos.mjs:3820-3861`) builds its context twice (3824 and 3836 in the arbitration), `session` (`:3862-3913`) projects entries inline, `resync-worktree` (`:4450-4479`) derives its branch (`:4452-4453`), `main-checkout-reset` (`:4480-4549`) builds the reset request, lists lost commits and calls SafeRestore inline, helpers at `:161-231`. The only three `throw new Error` in the whole switch are in the `worktree` arm (arbitration `3823, 3835, 3846`; now about `:3823-3850`): they exit 1 instead of 4 (T9-15). `main()` holds the store guards as inline policy: missing store, disconnected snapshot, `init` in a worktree, store-missing warning (`:5229-5293`), each setting `faultClass` by hand.

Reused doors: `src/verbs/worktree/{create,remove}` (exist, use-case pattern tsk-49i), `src/runner/session.mjs`, `resyncWorktree` (exists), `src/runner/main-checkout-reset-guard.mjs` (extend, not a new file), `isMainWorktree` (`src/runner/worktree.mjs:503`), P02's root door, P01's registry `store` field.

## Requirements

1. **`mainCheckoutResetUseCase(ctx, options)`** in `main-checkout-reset-guard.mjs`: reset request, lost-commit listing, SafeRestore call, and the policy check (the root door refuses a `--dir` that is not this repo's trusted main root; red-team F6, owner-visible: the guard no longer skips when `--dir` is given). The arm keeps flags and print.
2. **Worktree context once**; usage errors become `StoreError('validation', ...)` (exit 4, T9-15). `session` entry projection and `resync` branch derivation move into their use cases.
3. **`admitStoreAccess({ store, dir, cwd, explicitDir })`** beside `isMainWorktree` in `src/runner/worktree.mjs`, driven by the registry `store` field. Refusal is a tagged `StoreError` carrying `faultClass`, so the six `faultClass = ...` assignments in `main()` go; `main()` makes one call. The `init` guard joins it: init only at a Git top level with no store (the bounded walk keeps the phantom-store guard: a linked worktree's top level has no store, so it is still refused).
4. Red-team F12 (if P02's answer was "Inspect does not refuse"): the check is already in the door; this phase only confirms `admitStoreAccess` uses it.

## Files

**Create:** none.

**Modify:** `src/runner/main-checkout-reset-guard.mjs`, `src/runner/worktree.mjs` (`admitStoreAccess`), `src/runner/session.mjs`, `src/verbs/worktree/*` (context), the resync use case file (`rg -l resyncWorktree src`), `bin/fgos.mjs` (`:1045-1058`, `:161-231`, `:3820-3913`, `:4450-4549`, `main()` `:5198-5300` guard block), `test/runner/worktree*.test.mjs` (owner of admission), `test/cli/fgos-worktree*.test.mjs` (one case: unknown sub-verb exits 4), `test/cli/fgos-disconnected-worktree-guard.test.mjs` (keeps owning the behaviour), `CHANGELOG.md` (one line: `main-checkout-reset --dir` of another repo is refused; unknown `worktree` sub-verbs exit 4).

**Delete:** the inline reset body, the second context build, the six `faultClass` assignments, the inline admission blocks, helpers `:161-231` that only these arms used.

**Tests to retire:** `test/cli` cases that assert admission decisions through a spawned CLI (P01's census names them) move to unit cases on `admitStoreAccess`; the wiring proof stays in `fgos-disconnected-worktree-guard.test.mjs`. Each retired title names its new owner in the commit body.

## Red tests first

- `admitStoreAccess` unit table: missing store, disconnected snapshot, `init` in a worktree, `init` in a subdirectory, warning case; each returns the tagged error with its `faultClass`.
- `main-checkout-reset` with `--dir` of another repo is refused before any restore.
- Unknown `worktree` sub-verb exits 4 (today 1).

## Net size

bin about -60; src +50; tests about -40. The arbitration's `main()` ownership gap for `:5198-5290` is closed here (P01 only reads the field).

## Steps

1. Callers by `rg` of every helper in `:161-231` and of `faultClass` assignments; list with `file:line`.
2. Red tests; use cases; admission; callers; delete.
3. Smoke: the three refusal paths in a real linked worktree, and `fgos worktree create` + `remove` round trip.

## Validation (focused)

FR the tests above plus `test/cli/fgos-worktree*.test.mjs test/runner/worktree*.test.mjs test/runner/main-checkout-reset*.test.mjs`. Land gate; `lead:OPC` reviews SafeRestore and Git diffs.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `src/runner/worktree.mjs` is a board shared file (GIT G4) | M x M | board line before the edit; add one function, touch nothing else there |
| Moving the reset use case changes the SafeRestore call order | L x H | no logic change, a move: golden test of the call sequence in the unit case |
| `admitStoreAccess` changes a refusal text users parse | L x L | texts moved verbatim; only the tag is new |

## Rollback

Revert the merge commit.

## Done when

Red then green; `rg -n "faultClass = " bin/fgos.mjs` nothing; the three arms hold flags, one call, print.
