---
phase: 3
title: "Native and store declarations as data"
status: pending
effort: 1.5d
wave: B
blockedBy: [0, 1]
---

# Phase 03: Native and store declarations as data

One data source says which invocation the host serves natively, per verb or per first positional
(sub-verb or hook kind), and the store declarations (`store`, `mutatesStore`, `landsWork`,
`eventStoreChild`) become data both Node and the host can read. Today "native" lives in three places
(`nativeOnly` in the registry, `route_kind`/`native_kinds` in the annotations, `NATIVE_HOOK_KINDS` in
`src/runner/hook.mjs`) and five store declarations are JavaScript predicates the host cannot read.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p03 /home/vantt/projects/forgent-worktrees/rvm-f0-p03 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p03-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p03-declarations --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- `nativeOnly: true` on 8 registry entries (`src/cli/command-registry.mjs` 138, 266, 349, 418, 1048, 1165, 1227, 1245); read by `bin/fgos.mjs:4235, 4241`, `test/cli/fgos-manifest.test.mjs:58,65`, `test/cli/unknown-flag-rejection.test.mjs:22`, `test/cli/subcommand-flag-drift.test.mjs:196-197`.
- Annotations `packages/host-runtime/contracts/command-route-annotations.json` carry `route_kind` for the 8 native verbs and `native_kinds` for `hook`.
- `NATIVE_HOOK_KINDS` (`src/runner/hook.mjs:19`) read by `bin/fgos.mjs` `handleHook` (~4167).
- Predicates: `mutatesStore` at registry 1433 (`merge next`), 1627 (`dispatch recover --action`), 1726 (`events sync`), 2147 (`knowledge attest`), 2211 (`session start|end|gc`), 2240 (`gateway start|stop`), 2269 (`goal set`), 2469 (`lock fence`); `landsWork` 1434 (`merge next`); `eventStoreChild` 1727 (`events seal`, `events sync --opportunistic`). All other values are `true`. The only reader is `declared()` (registry:101) called from `bin/fgos.mjs:4248, 4260, 4269`.
- Generator: `scripts/export-command-selectors.mjs` (`nativeKinds` 220-228, descriptor build 319-335, `nativeFlagProjection` 240-248).

## Requirements

1. Registry: replace `nativeOnly: true` with `native: true`; `hook` gets `native: ['mailbox', 'mailbox-sync']`.
   `native` is `true` (whole verb) or a non-empty list of first positionals. Update the header comment.
2. Registry: every predicate becomes data: `true`, or a list of invocation shapes, each `'<first positional>'`
   or `'<first positional> --<flag>'` (the flag present). `declared(field, positional, flags)` keeps its
   signature and matches the data; no function values remain in any registry field.
3. Generator derives `route_kind` from `native` (`true` -> `native`; list -> `legacy-cli` + `native_subcommands`
   sorted), and refuses `route_kind`/`native_kinds` in the annotations as stale. Annotations keep
   `operation_id`, `owner_path`, `compatibility_tests`, `subcommands`.
4. Generator emits for **every** selector: `store`, and `mutates_store`, `lands_work`, `event_store_child`
   when the registry declares them (the data verbatim). It refuses a `native` declaration on an
   invocation whose `landsWork` matches (Land release has no Rust owner before S7).
5. Transitional, inside the F0 branch only: the generator still emits `native_kinds` on `hook` (same
   list as its `native_subcommands`) because the host reads it until phase 08 deletes it. Mark it with a
   one-line comment naming the reason (no phase id).
6. For native sub-verbs of a verb that has `subcommands`, emit `subcommand_flags` for those subs only
   (reuse `nativeFlagProjection`).
7. Node: one direct-channel refusal reads the registry: a whole-native verb or a native first positional
   is refused with the existing pointer text style (`bin/fgos.mjs:4241-4244` and `handleHook`'s native
   kind message merge into one); `NATIVE_HOOK_KINDS` is deleted. The refusal sits where the `nativeOnly`
   refusal sits today, after the help branch, so `node bin/fgos.mjs <native verb> --help` still prints help
   until phase 09 (the help table compares it).
8. Shared vectors: `test/rust-host/fixtures/store-declaration-vectors.json` lists `{verb, argv, mutates, landsWork, eventStoreChild}`
   rows covering every shape above; `test/cli/fgos-manifest.test.mjs` reads it through `declared()`.
   Phase 08's Rust matcher reads the same file.

## Files

- Create: `test/rust-host/fixtures/store-declaration-vectors.json`.
- Modify: `src/cli/command-registry.mjs`, `scripts/export-command-selectors.mjs`,
  `packages/host-runtime/contracts/command-route-annotations.json`, `packages/host-runtime/contracts/command-routes.json` (regenerated),
  `bin/fgos.mjs` (refusal from `native`; `nativeOnly` reads), `src/runner/hook.mjs` (delete `NATIVE_HOOK_KINDS`),
  `test/rust-host/command-routes.test.mjs` (the `native_kinds` case at 93-106 becomes the derived
  `native_subcommands` case plus the stale-annotation refusal and the lands-work refusal),
  `test/cli/fgos-manifest.test.mjs` (key list; "true or a predicate" at 94 becomes "true or shapes" over the vectors),
  `test/cli/unknown-flag-rejection.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (`nativeOnly` -> `native`),
  `test/cli/fgos-disconnected-worktree-guard.test.mjs` (see retirements).
- Regenerate: `command-manifest.json` (bytes must not change), the census.
- Delete: none.
- Tests retired: in `test/cli/fgos-disconnected-worktree-guard.test.mjs`, the per-invocation classification
  cases (158 onward: session, goal, gateway, knowledge and the other predicate verbs) whose only claim is
  "this sub-verb counts as mutating". New owner: the vector rows in `store-declaration-vectors.json`
  through `test/cli/fgos-manifest.test.mjs` (and phase 08's Rust test). Keep one CLI refusal case and the
  read-sub "unaffected" case as the CLI wiring proof. Name each retired test in the commit body.
- Net size: about -40 (predicates and duplicated cases out), +60 (vectors, generator checks).

## Gates

- `node scripts/export-command-selectors.mjs --check`
- `node scripts/run-tests.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-manifest.test.mjs test/cli/unknown-flag-rejection.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/rust-host/help-routes.test.mjs test/scripts/dispatch-decide-hook.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos --test mailbox_routes` (the hook mailbox lane still reads `native_kinds`).
- One-door scan count not above baseline.

## Risk and rollback

- A shape that does not cover a predicate's real condition (M x H): every predicate has a vector row
  for its true and its false side; run the disconnected-worktree CLI wiring cases.
- `hook` loses its native lane by accident (L x H): the transitional `native_kinds` field plus the mailbox route test.
- Rollback: revert the phase.
