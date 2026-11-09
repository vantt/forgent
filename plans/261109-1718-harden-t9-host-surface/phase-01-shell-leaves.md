---
phase: 01
title: "Shell leaves: error leaf, registry store and landsWork fields replace five sets, lazy entry imports with an architecture guard, hook first, dead arms deleted"
status: pending
depends_on: []
parallel: "starts now, beside P12-P15 and P02 (P02 reads no new field; P02's `main()` range `:5213-5223` is disjoint from P01's); the `version` arm step waits for packaging P04"
effort: ~1d
net_size: "Node: bin about -180, src about +45; Rust 0; tests about -10 (estimate); census of test/cli duplicates is a report, not a deletion"
---

# Phase 01 - Shell leaves (T9-04 entry part, T9-06 fields and readers, T9-14, L-4, L-6)

## Context

Four of the five jobs the shell kept (verb property sets, dead names, eager imports, native arms left in the Node switch) are mechanical and sit at the leaf of the shell, so they go first. Evidence: 207 modules load on every call, the `scripts/` import `bin/fgos.mjs:39` costs 15-16 ms (T9-04, measured); `check`, `gate-bypass`, `coordination` survive in the sets after two retirements because nothing checks the sets (`bin/fgos.mjs:4865-5020`, T9-06); `requiresExistingStore: true` is on 34 of 84 registry entries and `MUTATING_ONLY_VERBS` (22) is a subset of it (X3); the `gate-bypass` arm (`:2255-2269`) and the `version` arm (`:1001-1004`) are native routes that the Node channel cannot serve (`gate-bypass` stops at `git-addon-unavailable`, T9-14).

Reused doors: `COMMAND_REGISTRY` (`src/cli/command-registry.mjs`, kernel layer, pure data), the existing `await import()` shape of 58 arms, `test/architecture.test.mjs` and `docs/architecture-manifest.json`. Nothing new is invented except the error leaf, which is a move.

## Requirements

1. **Error leaf.** New `src/state/store-error.mjs`, no imports: `StoreError`, `EXIT_CODES`, `OUTCOME_EXIT_CODES`, `categoryOf`, `exitCodeForOutcome` (today `src/state/store.mjs:32,52,74,90,104`). `store.mjs` re-exports them once, so every caller is untouched and there is one definition.
2. **Registry fields (L-4).** `requiresExistingStore` is **replaced** by `store: 'none' | 'read' | 'require' | 'write' | (positional, flags) => ...` and `landsWork: true | (positional) => boolean`. `touchesState` stays (public help manifest, `bin/fgos.mjs:4550-4582`). Work entries get values that reproduce today's behaviour exactly. The five sets and the predicate table (`STORE_MISSING_WARNING_VERBS` `:4865`, `EVENT_STORE_LIFECYCLE_VERBS` `:4872`, `MUTATING_ONLY_VERBS` `:4983`, `MUTATING_SUBCOMMAND_PREDICATES` `:4989`, the verb test in `landsWork` `:4876`) are derived from the field, then deleted; their readers in `main()` (`:5230`, `:5289`, `:5303-5305`) read the field. `requireSubVerb` reads the registry `subcommands` and replaces the hand-written lists in `KNOWN_DISPATCH_SUBVERBS` (`:2643-2652`) and the eight others (each later layer phase converts the lists of its own arms).
3. **Dead names and arms.** Delete the dead set members `check`, `gate-bypass`, `coordination`, the double classification of `lock`, the `gate-bypass` arm and its imports (`:54`, `:72` region), and the 65-line history comment above the sets down to the invariant. The `version` arm goes in the last step (see Steps 7).
4. **Lazy entry (L-6).** Static imports of `bin/fgos.mjs` shrink to: parser, registry, envelope, error leaf. Every shell-level cross-cutting import becomes `await import()` inside its use: `currentDispatchDepth` (`:84`, drags `transport.mjs`'s 38-module closure), `releaseRecordedLand` (`:90`, drags `merge.mjs`), `check-decision-citation-drift.mjs` (`:39`, 11 `scripts/` modules) into the `decision` arm (Work: one import line, no behaviour change, WORK told; precedent T8 L-7) and into the `preflight` arm (removed in P10). `hook` is handled before the registry loads (`main()` `:5167-5174` already branches first; the registry and the other imports must not load before it).
5. **Exit map.** The four verb-keyed branches (`:5330-5347`) become a registry `exitOf(data)` per entry (or `{ data, exitCode }` from the use case): `main()` stops naming `run`, `workflow`, `plan-lint`, `doctor`, `wire-agents`. The exit-code table itself stays in the shell.
6. **Guard.** One case in `test/architecture.test.mjs` names the entry's allowed static imports. The allowlist carries the Work-only static imports as a named list that shrinks at the Work phase; say so in the test.
7. **Census (report only).** Walk `test/cli` (14 712 lines) and list the cases that assert a decision through a spawned CLI that a lower unit test already owns or can own. The table (case, owning proof, layer phase that retires it) goes in the phase report; P02-P10 retire the cases of the arms they own. This answers the arbitration's open question 4.

## Files

**Create:** `src/state/store-error.mjs`.

**Modify:** `bin/fgos.mjs` (imports `:1-144`, `:999-1004` last, `:2255-2269`, `:4865-5020`, `main()` `:5162-5197` and the exit map `:5325-5350`), `src/cli/command-registry.mjs` (field change across 84 entries; `exitOf` where needed), `src/state/store.mjs` (one re-export block), `docs/architecture-manifest.json` (row for the leaf), `test/architecture.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/rust-host/command-routes.test.mjs` (`:80-81`), `test/cli/fgos-version.test.mjs` (re-pointed at the host like `unknown-flag-rejection.test.mjs:100`), `test/cli/fgos-setup.test.mjs` (`:114-117`: uses `lock-status` as its probe verb), `CHANGELOG.md` (none expected: no user-visible change; if the direct-node channel's refusal text changes, one line).

**Delete:** the five sets and the predicate table, the `gate-bypass` arm, the `version` arm (Step 7), the dead imports, the history comment body.

**Cross-lane one-liners (WORK told):** the `decision` arm's import line; the `store` values of Work entries in the registry.

**Tests to retire:** none outright. Cases of `test/cli/fgos-version.test.mjs` and the `gate-bypass`-through-Node cases that exercise the deleted Node arms are re-pointed at the host route, whose owner is `test/rust-host/command-routes.test.mjs:80-81`; any case that only asserted the Node arm's own output is removed (behaviour removed: the Node channel is unsupported for these verbs, `AGENTS.md` ownership boundary).

## Red tests first

- `test/cli/subcommand-flag-drift.test.mjs`: one row, "every state-touching entry states its `store`; every `landsWork` verb exists in the registry" (fails today: no `store` field; `check` is in a set with no entry).
- `test/architecture.test.mjs`: the entry's static imports are exactly the allowlist (fails today: 100+ static imports).
- Behaviour stays owned by `test/cli/fgos-disconnected-worktree-guard.test.mjs` and the existing store-missing cases; run them before and after, unchanged.

## Net size

bin about -180 (dead arms and names -100, registry sets -45, sub-verb lists -25, history comment folded in, exit map -10; imports move, ~0); src +45 (registry field and `exitOf`, leaf 0 as a move); tests about -10 plus the census report. Honest note: the entry import target (at most 10 ms of CPU above node, 73 today) is not reachable here because the Work arms keep static imports; this phase reports the measured partial figure and the allowlist names what remains.

## Steps

1. Facts: `rg -n "requiresExistingStore|MUTATING_ONLY_VERBS|STORE_MISSING_WARNING_VERBS|EVENT_STORE_LIFECYCLE_VERBS|landsWork" bin src test scripts` with `file:line`; list every reader (expected: `bin/fgos.mjs:4897,5230,5289`, `src/cli/invocation-fault-log.mjs`, six tests). Compute, from the registry, the verbs each old set held, and the Work entries' values that reproduce them (a one-off script in `.fgos/runtime/tmp/`, not committed).
2. Red tests; error leaf and re-export; manifest row.
3. Registry codemod as one atomic commit (board line first, rebase rule: if a packaging phase touched the registry, re-run the codemod); readers switched; sets deleted; `store` guard test green.
4. Lazy imports: measure `node --cpu-prof` or `performance.now()` around the entry import before and after on a quiet machine; record in the report.
5. `exitOf`; `main()` stops naming verbs.
6. Delete dead arms (`gate-bypass`); route tests re-pointed.
7. **Wait step.** `version` arm: if packaging P04 has landed, delete the arm or its call; if not, land P01 without it and open a follow-up commit of this phase when P04 lands. Never edit `:999-1004` before P04.
8. Census report.

## Validation (focused)

FR `test/architecture.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/cli/fgos-version.test.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-setup.test.mjs test/cli/unknown-flag-rejection.test.mjs`; `fgos --help --json` byte-identical before and after (the public manifest); a `store`-keyed refusal case run in a linked worktree. Land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A Work verb's store behaviour changes silently | M x H | the codemod derives each Work value from the old sets and the drift test compares the derived sets to the old ones, printed in the report before the old sets are deleted |
| Lazy import changes error ordering (a failing import now fails inside the arm) | L x M | every arm already catches into the fault record; one case runs a verb whose import fails |
| Registry collision with packaging | H x M | see plan risks |

## Rollback

Revert the merge commit. The re-export keeps `store.mjs` callers valid either way.

## Done when

Red then green; `--help --json` identical; the guard allowlist printed; census table in the report; `rg` of Requirement 3's names returns nothing.
