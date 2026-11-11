# HARDEN T9 P22: confinement defaults and orphans

Branch `harden/t9-p22-confinement`, based on origin/main `93a74bb4b`.

## What changed
- `request.mjs` was already the single place that sets and validates `requirement.mode` (every branch sets it; a passed requirement without a valid mode is refused). The three readers (`authority.mjs` attestation builder and `assessAndPrepare`, `drivers/bwrap.mjs` `assessBwrap`) now read `request.requirement.mode` directly; the `?? 'unconfined'` fallbacks are gone. Every production caller reaches them through the constructor and `prepareConfinementForLaunch` validates first.
- `attestation-store.mjs`: `VALID_OUTCOMES` renamed `ATTESTATION_OUTCOMES` (no other module imported it; the loop outcome tables keep their own name).
- `cleanup.mjs` exports `judgeConfinementOrphans(roots)` returning `{ deadOwned, emptyShells, loose }` and `removeConfinementOrphans(judgement)` returning `{ tightened, removedHomes, removedShells }`. Liveness through `resolveHolderLiveness` (process-identity door). Roots are a parameter so cleanup does not import the backend registry. The P26 keep-step in `finalize-home` is untouched and still runs before home removal.
- The doctor row in `registrations.mjs` is unchanged: P10 points it and its `--fix` at these two functions and moves its orphan cases; until then the row still carries its private copy.

## Tests
- Owning proofs added: `test/runner/dispatch-confinement-reaper-fence.test.mjs` (judgement and removal of dead-owner home, old empty shell, loose root; live owner, young shell and attempt home untouched), `test/runner/dispatch-confinement-authority.test.mjs` (constructor refuses a mode-less requirement; a built request carries its mode).
- Focused confinement, doctor and credential tests: 203 pass; architecture, doc-health, citation-drift and the 37 tests touching authority, bwrap, attestation store, assignment runner: pass. One-door census regenerated (lines/digests only, 0 undeclared sites). Bwrap smoke through `fgos run` read-only: pass.
- No shipped default changed, so no cargo run needed. No CHANGELOG line: no user-visible behaviour.

## Authority
- Confinement mode of a request: `confinement/request.mjs` only; readers no longer re-default it.
- Orphan judgement and removal of confinement homes: now `confinement/cleanup.mjs`; the doctor row's duplicate stays until P10 switches it (then delete `looseConfinementRoots`, `emptyDispatchShells`, `deadOwnedConfinementDirs`, `EMPTY_SHELL_GRACE_MS` in `registrations.mjs`, about -70).

## Lessons
- The audit's line numbers had drifted; the fallbacks were in `authority.mjs` at `:233,:437` under double quotes, so grep both quote styles.
- The Git one-door census check refuses the first commit when a touched file is a census site; run `--write-census` before committing.
