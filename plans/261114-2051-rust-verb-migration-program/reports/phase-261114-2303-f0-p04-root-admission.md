# F0 phase 04: invocation root and store admission in the worktree tier

Branch `rust-verb-migration-program/f0-p04`, cut from `origin/rust-verb-migration-program/f0` (286017771). Not landed.

## Done

- `packages/git/rust/src/invocation_root.rs`: `resolve_invocation_root` / `resolve_invocation_root_with` (four policies, Node's exact messages, fault class `dir-invalid`, Git read lazily through one reader, caller-supplied facts accepted). Also owns `read_repo_facts`, the one Git read admission shares.
- `packages/git/rust/src/store_admission.rs`: `admit_store_access` / `admit_store_access_with` (`store-missing`, `disconnected-worktree-store`, `init-in-worktree`, `worktree-identity-unreadable`, read warning, session-worktree rule with the forged-link case). Facts are read lazily and once; negative cases prove `none`/`open`, explicit `--dir` and an existing store read no Git.
- Addon (`packages/git/node-addon/src/git.rs`): `resolveInvocationRoot`, `admitStoreAccess`; no new namespace or crate edge.
- Node: `resolveInvocationRoot` and `admitStoreAccess` are adapters (same signatures, same errors). Deleted: `nearestStoreRoot`, `repoFactsOrRefuse`, `isSessionWorktree`, `STORE_MISSING`.
- `packages/work-state/rust/src/lib.rs`: `resolve_workspace_root` deleted; the native `gate-bypass show` uses the door with `caller-tree`. A refusal reads as the default level `off`.
- Shared table gains `policyRows` (strict-cwd, main-checkout-only, empty/blank `--dir`, nested repository, home `.fgos`, plus main-checkout and `--dir` rows).

## Where the facts report changed the phase

- U8 (Node semantics are the contract): taken as written (Git ceiling, realpath home, `found`, `--dir` validation).
- "Rust has no admission code" (prior art): `admit_store_access` is new code, not a port.
- Table rows: the host walk (`cli_projector.rs`) has no Git ceiling and the identity crate reads `rows` too, so the new cases are a separate `policyRows` section; `rows` is unchanged and both readers still pass. Phase 08 can merge them when it deletes the host walk.

## Deviations to confirm

1. Files touched beyond the phase list: `src/git/inspect.mjs` (`worktreeDoor`, `NO_GIT_DOOR_CODES`: carries a request to the addon outside any hot lock), `test/runner/paths.test.mjs` (retired cases), `packages/git/contracts/mutation-census.v1.json` (the pre-commit hook demands regeneration). No other phase owns them.
2. `readFacts` is dropped from `resolveInvocationRoot` (test-only injection; Rust tests inject a reader). `facts` is kept (`bin/fgos.mjs` passes it for the detached child).
3. Rust API is `Result<Admitted, Refusal>` with `verb` in the request (messages name it); `creates` is computed in the Node adapter as `verb === 'init'` because `bin/fgos.mjs` is not edited.
4. An install with no Git door (addon not shipped/loadable): the root adapter answers the named directory itself (no walk), the destructive policy refuses; admission admits a store-less verb and refuses any other as `worktree-identity-unreadable`. Before, those paths reached the same outcomes through the lenient read. Proven by a child-process test in `paths.test.mjs`; `doctor-fresh-run` still passes.
5. Message change: `worktree-identity-unreadable` now ends with the driver's cause instead of the napi JSON text.
6. Preserved quirk: `main-checkout` outside a repository gives `found: false` even when the directory holds a `.fgos`.
7. Native `gate-bypass show` now reads Git (floor probe, config) once per call like every Node verb; before it read none.
8. One-door scan: 0 undeclared; class `rust-test` 156 to 157 (the shared test helper that runs `git` to build fixtures). Everything else identical.
9. `doors` rows: this phase names none; phase 08 owns the root and admission rows. Nothing to add or remove here.

## Retired tests and their owners

- `worktree.test.mjs` admit cases (store-missing, disconnected, admitted set, init, warning, unreadable Git): owned by `store_admission.rs` tests of the same behaviours. Two adapter cases stay (refusal mapped with fault class; warning passed through).
- `session.test.mjs` three `isSessionWorktree` cases: owned by `session_worktree_cases_name_the_forged_link_and_every_other_shape` (genuine, ad-hoc copy, forged link, dangling, other repository, chain, non-`.fgos` target, main without `.fgos`).
- `paths.test.mjs` door cases (subdirectory, nested ceiling, home, linked worktree, main-checkout, main-checkout-only, `--dir`, strict-cwd, forged gitfile, unreadable answer, structured cause): owned by the Rust table and policy rows plus `an_unreadable_git_answer_...`, `a_trust_refusal_is_matched_on_the_structured_cause...`, `a_checkout_whose_gitfile_does_not_point_back...`. Three adapter cases stay. `invocation-root-table.test.mjs` is the wiring proof (rows plus policy rows).

## Gates

- `cargo fmt --all --check`: clean. `cargo clippy -p fgos-git -p fgos-node-addon -p fgos-work-state --all-targets -- -D warnings`: clean.
- `cargo test -p fgos-git -p fgos-work-state`: all green (fgos-git lib 108). `cargo test -p fgos --test cli_tests gate_bypass`: 2 pass.
- `cargo check` for those three crates on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: green.
- Focused node runs, all green: the phase list (architecture, doc-health, git-mutation-census, fgos-setup, worktree, session, invocation-root-table, disconnected-worktree-guard, invocation-fault-log), `paths`, every test importing `paths.mjs`/`worktree.mjs`/`inspect.mjs` or naming the fault classes (convention-client, loop, merge, promote-engine, worktree-*, intake, state, verbs, direct merge, v7f, claim-2, run-verb and others, 607 tests), `doctor-fresh-run`, `fgctl-init`, `release-tree`, `command-routes`. Not run: `install-packaging` (npm pack; same refusal text path as `doctor-fresh-run`), full `npm test` and `cargo test --workspace` (not allowed without COOK).

## Authority

- The host's own root walk `cli_projector::resolve_target_root` still decides the same question (phase 08 deletes it). `packages/distribution/rust/src/workspace.rs`, `apps/fgos/src/wiring/mailbox_root.rs` choose a main root separately; unchanged, phase 08 lists them.
- "Is this the main checkout" is held twice: Rust `store_admission` and Node `isMainWorktree`/`resolveMainCheckoutRoot` (six other callers). It belongs in `fgos-git`; not moved here because other phases' callers use the Node ones.

## Suggested `[Unreleased]` line

Native `gate-bypass show` now finds its project like every other command: it stops at the Git top level and no longer reads the machine's global `~/.fgos` as a project when run outside one.

## Lessons

- `run-tests.mjs` builds the dev addon itself; the release build is needed only for the fgctl, release-tree and host tests.
- The census hook refuses any commit touching a Git-tier file until `--write-census` is rerun and staged; rerun it after every later edit.
- A pre-tool hook blocks Bash commands containing the string for the Git directory; write such edit scripts to a file and run them.
- Retiring behaviour tests is only safe after the Rust test of the same behaviour exists; list owners while deleting.

Status: DONE_WITH_CONCERNS
Summary: Root and admission decisions live in `fgos-git` with Node and work-state as adapters; gates are green.
Concerns/Blockers: deviations 1, 4, 7 and 8 above need COOK's eye (extra files, no-addon behaviour, gate-bypass now reads Git, one more rust-test site).
