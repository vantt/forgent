# Integration report: foundation reverse deps and the `.fgos` root door

Phase 7, branch `fd/p07` at `43532167e` (origin/main). Phases 2-6 landed.

## What moved

- Phase 2: the StoreError leaf moved `src/state/store-error.mjs` to `src/util/store-error.mjs`; `worktree.mjs` no longer imports upward.
- Phase 3: identity rebuild takes the main `.fgos` from the rebuild door (`fgosDir` in the consumer context); `directory-store.mjs` stopped joining it.
- Phase 4: host binary lookup no longer needs a Git root.
- Phase 5: `fgosDirFromRoot` is defined once in `src/util/fgos-file-registry.mjs` (moved from `src/state/`); every project `.fgos` join goes through it; new door row "join .fgos onto a project root". The door pattern was widened in this phase to catch nested calls.
- Phase 6: `src/setup/registrations.mjs` joins through the door.
- `tierExceptions` is `[]`.

## Behaviour change (phase 4)

A Node process in a linked worktree with no `FGOS_HOST_BIN` now finds no host binary (the main-checkout step was dropped). Every host child sets `FGOS_HOST_BIN` (`apps/fgos/src/legacy_exec.rs`), and the validation report found no production path that starts the payload without the host from a linked worktree.

## Full gate

`npm test` (foreground-equivalent, one run): exit 0, `pass 8385`, `fail 0`. The text matches for `not ok` in the log are test titles only; the one `ERROR` match is the title "RECOVERY declares an entry for every ERROR_CLASSES member". No leak or clone ERROR line. Run standalone outside the runner, `node --test test/architecture.test.mjs` fails one case (A4 literal guard) with `git-addon-unavailable` because the addon is not staged outside the test runner; it is green inside the gate. No failure was red on main.

No Rust file changed in this plan's commits (`710931276 5335f327f fccb89414 c0af37308 c3b1662c7 1e2193655 691255ad0 c86aefd27 c7cb8b6ee fc24cf903 cb347b7de 351dd9cbc`: no `*.rs` or `Cargo.*` path). `cargo test --workspace` is not required. The Rust files in `git log 5fd22aa1d..HEAD` belong to other plans (questions, session verb, supervision).

## Acceptance criteria

1. `tierExceptions` is `[]` (`docs/architecture-manifest.json:83`); the tier and door tests are green in the gate. Met.
2. Join grep (`git grep -nE "path\.join\([^)]*'\.fgos'|\$\{[^}]+\}/\.fgos" -- src bin`) lists 9 files: `src/util/host-bin-path.mjs` (bootstrap exception); Work debt `src/runner/merge.mjs`, `operation-choice.mjs`, `work-dispatch.mjs`, `src/state/porting-store.mjs`, `src/state/store.mjs`; home joins `src/runner/dispatch/llm-accounts.mjs` and `src/runner/dispatch/confinement/probes/harness.mjs`; comment `src/setup/agent-hooks.mjs:8`. The leaf `src/util/fgos-file-registry.mjs` no longer matches the old pattern because it joins via `path.resolve` (`path.join(path.resolve(root), '.fgos')`). The count is 9 against 35 before. The two home joins and the comment sit outside the project-root door. Met, with the pattern as written matching the leaf by a different shape.
3. `fgosDirFromRoot` is exported once (`src/util/fgos-file-registry.mjs:25`); `git grep "state/(fgos-file-registry|store-error)"` over src, bin, test, scripts and the manifest finds nothing. Met.
4. Manifest door row "join .fgos onto a project root" exists (`docs/architecture-manifest.json:658`); the door check passed in the gate; its debt is the five Work files above. Met.
5. `npm test` green (above); no Rust in this plan's commits. Met.
6. HARDEN criterion "one door for `.fgos` lookup": met for T0-T6 and T9. Work residue: the five debt files, each `retiredBy` the Work batch (T7). The stale criterion text "`.fgos` lookup: T1" should read: the root door is T2 (`src/runner/paths.mjs`), the join leaf is T0. The closed HARDEN plan is not edited.

## Counts and size

Join files: 35 before, 9 after (1 bootstrap exception, 5 Work debt, 2 home joins, 1 comment).

This plan's 12 commits (numstat sum, `710931276` to `351dd9cbc`): Node src/bin/scripts +151 -129 (net +22); tests +72 -78 (net -6); manifest and docs +29 -27; census +91 -91. Whole-range `5fd22aa1d..HEAD` includes other plans and is not attributable to this plan.

## Docs

`docs/platform/event-store/spec.md` rebuild paragraph: added `fgosDir` to the context list, and fixed two stale sentences confirmed against `src/verbs/events/rebuild.mjs`, `src/identity/directory-store.mjs` and `consumers.v1.json` (the registry is not empty; the adapter does not remove caches, each consumer owns its own). `consumers.v1.json` is not stale. `docs/platform/component-boundary.md:1041` already names `src/util/fgos-file-registry.mjs`. Backlog row `p-zs23zde4mh` updated (35 files, done, plan and report links). No CHANGELOG line: nothing user-visible changed.
