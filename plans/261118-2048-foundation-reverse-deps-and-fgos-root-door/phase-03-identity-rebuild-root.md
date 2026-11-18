# Phase 03: identity rebuild takes the main .fgos from the rebuild door

Wave 3. Depends on 2. Capability `code:implement`. Effort 0.25d. Removes exception E2 (phase 01 F1).

## Context

`rebuildFromStore` in `src/identity/directory-store.mjs` (T1) finds the main checkout's `.fgos` itself through the Work
helper `getMainFgosDir`. Its only caller, `rebuildStoreUseCase` (`src/verbs/events/rebuild.mjs`, T9), already holds
the authenticated main checkout (`facts.trustedMain`) from `eventsContext`. A lower layer should be handed the answer,
not look it up (design principle 2).

## Requirements

- `rebuildStoreUseCase` passes the main checkout's `.fgos` into every consumer's rebuild context as `fgosDir`,
  computed once with `fgosDirFromRoot(facts.trustedMain)` (still imported from `src/runner/paths.mjs` in this phase;
  phase 5 moves the import).
- `directory-store.mjs` `rebuildFromStore({ fgosDir })` removes `resolveFgosFile(fgosDir, IDENTITY_DIRECTORY)` and
  no longer imports `runtime-coordination.mjs` or joins `.fgos`. It refuses (throws) when `fgosDir` is missing, so a
  caller that forgets it fails loudly instead of deleting a cache in the wrong tree.
- The Work consumers (`src/state/store.mjs`, `src/state/porting-store.mjs`) are not edited; the extra context field is
  ignored by them.
- Manifest: delete the `tierExceptions` row `directory-store.mjs -> runtime-coordination.mjs`.
- `docs/platform/event-store/spec.md:970-971` lists the rebuild context fields (checked at validation); phase 7 adds
  `fgosDir` there. The consumers contract carries no context fields.
- Regenerate the Git mutation census and commit it with the phase.

## Proof

Owning proof: the rebuild test in `test/event-store/verbs.test.mjs` (it already asserts the identity consumer's
counts and its dropped cache). Extend it with one case: a rebuild run from a linked worktree (or subdirectory) cwd
drops the identity cache of the main checkout, not of the cwd tree. Say in the test title why no existing case proves
it (the current cases run from the main checkout).

## Validation

- `node --test test/event-store/verbs.test.mjs test/architecture.test.mjs` through the repo test runner.
- `git grep -n "getMainFgosDir" -- src/identity` is empty.

## Risk and rollback

Low. Rollback: revert the commit.
