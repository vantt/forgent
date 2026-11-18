# Validate and red team: foundation plan 261118-2048

Kind of record: stateful. Writer: `lead:FOUNDATION-PLAN`, 2026-11-18 21:04, on `origin/main` `8222ca0c6`. Read-only
checks against code; no test was run.

## Verdict

The plan holds. Validating confirmed four of the five proof points and lowered phase 4's risk from medium to low.
Red team found three gaps, all mechanical, and the plan files are patched for each:
- the Git mutation census pins a digest of every edited file;
- the manifest's `files` map and one more door row name the moved leaves;
- the Event Store spec lists the rebuild context fields.

No owner question.

## Proof points (plan risk map)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Does any production start of the payload reach `resolveHostBin` without `FGOS_HOST_BIN`? | **No.** Risk lowered to low; phase 4 takes the walk-up form, so the `nativeHelperExe` fallback is not needed | The host sets the variable for its Node child (`apps/fgos/src/legacy_exec.rs:258-265`). The payload's own children inherit `process.env` (`src/util/spawn-detached-fgos.mjs:25`, `src/session-rotation/rotate.mjs:316`, `bin/fgos.mjs:3623`). The one direct `node` entry, the SessionStart hook (`.claude/settings.json:162` -> `scripts/fgos-session-start-hook.mjs`), imports `resolveMainCheckoutRoot` and `fgosDirFromRoot`, never `resolveHostBin`; phase 5 already moves its import |
| 2 | Does `path.resolve` inside `fgosDirFromRoot` change any answer? | No for fs use: an undefined root throws in both forms, and `''` resolves to the cwd in both. One display-only site (`src/runner/dispatch/config.mjs:160`) may print an absolute path where it printed the given one; acceptable, the implementer keeps the old text if a test pins it | code reading |
| 3 | Does the door pattern see the right hits? | Yes. A dry run of both patterns over the `checkDoors` roots finds 35 `src` files (exactly phase 01 F3, with `llm-accounts.mjs` and the home line of `harness.mjs` excluded by the look-ahead) and 16 `scripts/` files; none in `apps/`, `packages/`, shell or `core/` | node one-off over `bin src scripts apps packages .githooks core domains` |
| 4 | Is the A4 guard the reason the leaf must leave `src/state`? | Yes (`test/architecture.test.mjs:948-985`) | phase 01 F4 |
| 5 | Does the rebuild test fixture support a linked-worktree cwd? | Yes: `test/event-store/verbs.test.mjs:24` already creates a linked worktree | test file |

## Red team

| # | Attack | Finding | Fix in the plan |
|---|---|---|---|
| R1 | Footprint misses a file every edit touches | `packages/git/contracts/mutation-census.v1.json` pins a sha256 for every scanned file (for example `src/runner/paths.mjs`, `src/identity/directory-store.mjs`, `src/state/fgos-file-registry.mjs`, `src/state/store-error.mjs`, `src/util/host-bin.mjs`); each phase changes it. It is a generated file, which plans 1341 and 1847 treat the same way: regenerated on every rebase, never hand-merged, not counted as footprint overlap | new section "Generated files" in plan.md: each code phase regenerates it with `node scripts/git-one-door-scan.mjs --write-census` and commits it with the phase; same for `test/suite-baseline.json` when a test is added |
| R2 | Moving a file leaves a stale manifest path | `docs/architecture-manifest.json` also names the leaves in the `files` layer map (`:1686` `src/state/store-error.mjs: kernel`, `:1841` `src/state/fgos-file-registry.mjs: kernel`) and in the door row "record a malformed call (twin)" `allowed` (`:711`) | phase 2 and phase 5 requirements now rename those keys and entries |
| R3 | A changed contract left undocumented | `docs/platform/event-store/spec.md:970-971` lists the rebuild context fields (`store`, `heldRanks`, `maxAttempts`); phase 3 adds `fgosDir` | phase 7 already targets that spec; the line is now named |
| R4 | The plan races the session verb plan | The supervisor ruled at 21:01 (board log): 0947 is not interrupted, and phases 2-7 start when 0947 is done | collision row updated; no wait inside phase 1, which was done during planning |
| R5 | Scope creep: is moving the registry needed? | Yes. Without the move, T5/T6 files cannot import the join leaf (A4), so 20 of the 36 would stay hand-joined. The move is a rename plus import edits, no new code | none |
| R6 | Hidden second root decision | `src/git/main-checkout-delete-guard.mjs:231-248` walks gitfiles itself; it is already listed as an idea for the owner, outside scope | none |
| R7 | A stale fact in a spec the plan reads | The same spec section says "The shipped registry remains empty until cutover", but three consumers are registered (`packages/event-store/contracts/consumers.v1.json`). The spec also says the adapter removes the cache, while `directory-store.mjs` removes its own | phase 7 fixes the field list only. The two stale sentences are recorded here for the Event Store spec owner; correcting them is a docs fix inside RUL104 that the phase 7 implementer may make while touching the paragraph |
| R8 | Lead-days | Unchanged: 2.35 remaining. Census regeneration adds minutes per phase | none |

## Status

Status: DONE
Summary: Validating confirmed the plan's proof points and lowered phase 4 to low risk; red team found three mechanical gaps (census, manifest file map and door row, spec field list), each patched into the plan.
