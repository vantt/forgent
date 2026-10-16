# Rust callers P00: registry rows for activation, install, observe

## Result

- `packages/holder-lock/contracts/lock-registry.v1.json`: the three 4.4-owned rows (already separate rows in the 4.2 registry, not one combined row as the phase file assumed) now carry `v3Path`, `v1Shape`, `v1Path` and `fence: tombstone`. Kind/scope/rank unchanged (mutex, rank 80; install is machine scope).
- `test/holder-lock/registry-contract.test.mjs`: one test pins the three rows.
- `node --test test/holder-lock/registry-contract.test.mjs`: 12/12 pass.

## Notes for wave 1

- `v1Path` of activation and observe use the `.fgos/...` form, the form 4.2's `fences.mjs` (`v1PathsOf`) already resolves. Install uses `<stateRoot>/install.lock`; no existing placeholder covered it, so P04 adds `<stateRoot>` resolution where fences/doctor need it (the facade leaves unknown placeholders verbatim in non-strict v1 resolution).
- The facade `resolveLock` now returns a v3 path for these rows instead of `lock-not-node-owned`; no 4.2 test depends on that refusal (grep of hl-p03/hl-p04).
- 4.2 `fenceTargets` filters on `owner === '4.2'`, so 4.2's cutover does not fence these rows; 4.4a P04/P05 places them.

## Prior art

`git whatchanged -S'flock' --oneline --no-patch -- packages/distribution packages/observe`: no commits. No kernel lock ever existed in these crates.

No component-boundary change.
