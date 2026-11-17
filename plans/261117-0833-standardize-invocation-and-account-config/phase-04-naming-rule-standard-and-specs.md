---
phase: 4
title: "Naming rule, standard catalog and specs"
status: pending
priority: P1
effort: 6h
depends_on: [D1, D2]
parallel_with: [P1]
touches: repo only
---

# Phase 4: Naming rule, standard and specs

## The rule (to write into the standard and RUL105's successor entry)

1. An invocation id is `<cli>-<transport>[-<backend>][-<variant>]`.
   - `<cli>` is the program basename (`claude`, `codex`, `pi`, `omp`, `agy`).
   - `<transport>` is `cli` (adapter `cli-spawn`) or `herdr` (adapter `herdr-spawn`).
   - `-<backend>` (`-bwrap` today) is present **exactly when** `confinement.backend` is set (D1 option A).
   - `-<variant>` names a structural difference only (`-plan`, `-file-pointer`, ...). It never names an
     account, and it never says "bypass": permission mode follows from confinement.
2. No invocation names an account. The account comes from the lease, and a confined invocation reads
   it only through `credentialStore` (RUL105). An unconfined invocation reads the CLI's own login in
   place and is never leased (`src/runner/dispatch/config.mjs:502-508`).
3. Matrix per CLI. A cell is declared only when it has a consumer and a passing harness probe:

| CLI | `-cli` (unconfined, host login) | `-cli-bwrap` | `-herdr` (unconfined) | `-herdr-bwrap` |
|-----|------|------|------|------|
| claude | `claude-cli` (kept, D2) | `claude-cli-bwrap` | never: unreachable by `bind()` | `claude-herdr-bwrap` |
| codex | not declared (D2) | `codex-cli-bwrap` | never | `codex-herdr-bwrap` (was `codex-herdr`) |
| pi | not declared | `pi-cli-bwrap` | never | `pi-herdr-bwrap` (was `pi-herdr`) |
| omp | not declared | `omp-cli-bwrap` | never | `omp-herdr-bwrap` (was `omp-herdr`) |
| agy | not declared | `agy-cli-bwrap` | never | `agy-herdr-bwrap` (was `agy-herdr`) |

   An unconfined `herdr` is unreachable because `herdrPresent` is only set on the posture-carrying
   path (`bind.mjs:150,170-171`), and an invocation without a backend never carries the posture
   (`bind.mjs:162`).
4. Order inside an executor: the generic forms first, the family's main CLI first (openai: codex), the
   herdr form first among `herdr-spawn` entries. A variant comes after the generic forms and is
   reached only by a pin (`{executor, invocation}`). Reason: the default is the first match in
   declaration order (`policies.mjs:674-684`, `bind.mjs:170`).
5. A genuinely different structural option is declared as a variant. Example: an agy pane that must
   receive the brief as a pointer is declared `agy-herdr-bwrap-file-pointer` with
   `promptDelivery: file-pointer`, after `agy-herdr-bwrap`, and is pinned where needed. Other
   variants follow the same pattern (permission mode, args). No run-time switch exists.

If D1 picks option B (drop `-bwrap` from herdr names), rule 1 becomes "`-bwrap` only on `cli`", and
only `claude-herdr-bwrap` is renamed, to `claude-herdr`. Every step below applies the same way.

## Files

`core/config-standard/runner.yaml`, `packages/seat-binding/contracts/seat-binding.golden.v1.json`,
`packages/config/contracts/fixtures/authoring-source.config.json`, `test/fixtures/committed-config.yaml`,
the tests listed in `plan.md` P4 footprint, `docs/platform/agent-confinement/spec.md` §13.1,
`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (RUL105 entry plus a new decision entry),
`docs/platform/seat-binding/spec.md` (examples at lines 301 and 384), `CHANGELOG.md`.

## Steps

1. **Worktree:** `fgos worktree create ../forgentX-wt-invocation-naming --branch feat/invocation-naming --base main`.
   Use its own `CARGO_TARGET_DIR` and `node_modules` copied with `cp -al`.
2. **Find each behaviour's owning proof before editing tests.** The default invocation per executor
   is owned by `test/runner/execution/bind.test.mjs` (executorFacts / transport default). The
   committed config binding is owned by `test/runner/execution/bind-committed-config.test.mjs`.
   herdr invocation shape is owned by `test/runner/herdr-provider-invocations.test.mjs`. Extend those
   files and do not add new ones.
3. **Standard edits** (`core/config-standard/runner.yaml`):
   - gemini: replace `omp-herdr` and `omp-cli-bwrap` (lines 191 and 215) with `agy-cli-bwrap` (args
     per P2) and `agy-herdr-bwrap` (`interactiveMode {kind: agy, exitCommand: /exit, trustStore {kind:
     agy}}`), both with `credentialStore {use: agy, homeEnv: HOME, files: [<agy login file names>]}`.
     Take the file names from the gemini accounts' `credentialSources.agy.files` (names only). P5
     needs them, because `declaredStoreFiles` gives `llmAccounts` its file list
     (`llm-accounts.mjs:205-224`). Update the gemini description.
   - Drop the `{gemini, omp-herdr}` pins of `fgos-coding-implement`, `code:implement` and
     `coding:implement`, keeping `{executor: gemini}` unpinned. Update their descriptions ("through omp").
   - openai: reorder to `codex-cli-bwrap, codex-herdr-bwrap, pi-cli-bwrap, pi-herdr-bwrap` (today
     `pi-herdr` at line 118 comes before `codex-herdr` at line 140).
   - Rename herdr ids per D1 in openai, xai and deepseek.
   - Put the rule from this phase into the executor registry's `@fgos:doc` lines, so `fgos config standard` prints it.
4. **Owning test for the rule.** In `bind-committed-config.test.mjs`, add one test titled "every
   standard invocation is named by its transport and confinement, and each executor's default is its
   generic form". It walks the shipped standard and asserts: `-bwrap` present ⟺ `confinement.backend`;
   `cli`/`herdr` matches the adapter; no id contains an account id or `bypass`; the default
   invocation inside and outside herdr (computed through the real `executorFacts` path) is the
   generic form. It sits in the existing file because that file owns the shipped config's bindings.
5. **Mechanical rename** across fixtures and tests. Run `rg -l --fixed-strings` per old id. Today's
   counts outside history: `codex-herdr` 36 files, `pi-herdr` 20, `omp-herdr` 9, `agy-herdr` 51,
   most of them docs. History and decision records are not edited (they record past facts). Spec
   narrative gets "(from 2026-11-xx: `<new id>`)" where it names a current id. The seat-binding golden
   and config authoring fixture are regenerated through their own test commands, never by hand. Read
   `git diff --stat` before staging.
6. **pi `files` lists (question U4).** Global and standard openai `pi-cli-bwrap` leave out
   `models.json`, while `pi-herdr` and the deepseek/glm forms include it. `declaredStoreFiles` takes
   the union per store anyway. Ask whether to unify. Default: unify to the longer list, because the
   copy rule skips absent files (RUL105).
7. **Specs.** agent-confinement §13.1 point 1 (line 763): `use` becomes "a lowercase store key; today
   codex, pi, omp, claude, agy"; `homeEnv` becomes "CODEX_HOME, PI_CODING_AGENT_DIR,
   CLAUDE_CONFIG_DIR, or HOME for agy (agy keeps its login under `~/.gemini`)". Add the naming rule
   as a new runner decision entry ("an invocation id names its CLI, transport and confinement, never
   an account", 2026-11-xx) that supersedes the id part of RUL105 without editing it in place. Seat
   Binding examples: rename. Component-boundary check: **No component-boundary change** (no
   ownership, authority or parent/child change).
8. **CHANGELOG `[Unreleased]`**: "Invocation ids follow one rule (`<cli>-<transport>[-bwrap]`); the
   standard runs gemini through agy and lists codex before pi for openai."
9. **Tests**, narrow then broad, one at a time: the named `node --test` files,
   `cargo test -p fgos-seat-binding`, `cargo test -p fgos-config`, then `npm test` and
   `cargo test --workspace`.
10. **Commit** with a pathspec in the worktree. ff-merge after review. Stage and activate the release
    only with the owner (D4 follow-up in P7).

## Validation

The new rule test is green. No other test is weakened: a renamed id only changes expected strings.
`npm run fgos:dev -- dispatch explain --for code:implement`, run from the worktree with a temp
global config, is not needed, because the bind test covers the default.

## Risk

| Risk | L x I | Mitigation |
|------|-------|------------|
| A golden or contract file regenerated with unrelated drift | M x M | regenerate through the suite's own command, then `git diff --stat` |
| Other projects pin `omp-herdr` from the standard | L x M | P3 pre-flight grep; the pin was gemini-only |
| Shipping agy in the standard to machines without agy | M x L | `missingCli` facts skip executors whose CLI is absent (`bind.mjs:180`); doctor already reports absent CLIs |

## Rollback

Revert the commit. Nothing in this phase touches live config.
