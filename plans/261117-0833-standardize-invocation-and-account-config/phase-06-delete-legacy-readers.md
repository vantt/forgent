---
phase: 6
title: "Delete the readers that only served the legacy shapes"
status: pending
priority: P2
effort: 8h
depends_on: [P3, P5, D5, gates G1-G2]
touches: repo only
---

# Phase 6: Delete legacy readers (L10, RUL104)

## Gates

- **G1:** the global config and accounts file on this machine hold no `resourceBindings` and no
  `runner.providers` (after P3 and P5).
- **G2:** design-lap and every other machine that will take this release confirm the same as G1.
  Ask through the board log on origin/main (U5).

## Deletions

| What | Where | Owning proof after |
|------|-------|--------------------|
| `resourceBindings` inference in `credentialStoreOf` | `src/runner/dispatch/provider-capacity.mjs:257-269` (and its doc line 261) | `test/runner/credential-store.test.mjs`: the case "infers from resourceBindings" is retired, and the declared-store cases stay |
| `resourceBindings` schema node | `core/config-schema/runner.schema.yaml:725-727` | `packages/config` golden validate: an unknown key is reported |
| `inPlaceLoginCli` fallback through `commandCli` when no store (keep only if an unconfined invocation still needs it: `claude-cli` does) | `src/runner/dispatch/confinement/drivers/bwrap.mjs:463` | review and decide on reading; keep if `claude-cli` uses it |
| `runner.providers` transition read and legacy account validation | `providerAccountInventory`, `validateProviderAccountInventory` (`provider-capacity.mjs:57-141, 284-296`), `compareWithLegacyInventory` (`llm-accounts.mjs:169`) | lease, probe and renewal tests read `llmAccounts` only |
| Singular `credentialSource` and `credentialSources` as config shapes (the internal lease shape from `deriveLegacyInventory` stays) | schema `runner.providers` node (`runner.schema.yaml:314`), `accountSource` def | schema golden |
| Doctor row `llm-accounts-vs-legacy` | `src/setup/registrations.mjs:1093` | row removed; `llm-accounts-shape` remains the owner |
| Env override `FGOS_HERDR_PROMPT_DELIVERY` and `opts.promptDelivery` if it has no caller | `src/runner/dispatch/assignment-runner.mjs:989` | `test/runner/dispatch-executor-profile.test.mjs` keeps the invocation field cases |
| (D5) executor-level launch fields `command, args, adapter, env, permissionMode, promptDelivery, confinement, interactiveMode` on `executorEntry`, and their `?? executorEntry.x` fallbacks | schema `executorEntry` (about `runner.schema.yaml:760-860`); readers `resolve.mjs:289-293`, `policies.mjs:672,681,684-685`, `config.mjs:473-489` (`checkBypassIsConfined` reads executor level; move to invocation), doctor bypass rows (`registrations.mjs:2185-2194`, `:3563-3570`) | config door refuses an executor-level launch field, with a message pointing to `invocations[]`; bypass rule owned on the invocation in `authority.mjs:455-468` plus its test |

The default executor `runner.executor` (flat `command/args`, `resolve.mjs:177-190`) is a separate
shape. D5 asks whether to convert it to `{invocations: [...]}` in the same pass. Recommended: yes,
with one `claude-cli`-shaped invocation.

## Steps

1. **Worktree:** `fgos worktree create ../forgentX-wt-legacy-readers --branch refactor/legacy-readers --base main`.
   Reindex GitNexus there, because the index is stale. Run `impact` on `credentialStoreOf`,
   `providerAccountInventory`, `validateProviderAccountInventory`, `resolveExecutorConfig` and
   `pickConfinedInvocation`, and report the blast radius. Cross-check each with
   `rg -n "<symbol>" src bin test`.
2. Per deletion row: delete the code, then retire or move the tests in the same commit, naming the
   test that now owns the behaviour (principle 8).
3. Docs: in agent-confinement §13.1 point 1, delete the `resourceBindings` sentence. Update RUL105's
   successor entry ("the inference is deleted, 2026-11-xx"). In RUL102, delete "the transition read".
   In config spec line 63, change accounts to `runner.llmAccounts` only. Component-boundary: **No
   component-boundary change**.
4. CHANGELOG `[Unreleased]` (user-visible): "`resourceBindings`, `runner.providers.<p>.accounts` and
   the `FGOS_HERDR_PROMPT_DELIVERY` variable are no longer read; declare `credentialStore` on the
   invocation and accounts under `runner.llmAccounts`." With D5, add executor-level launch fields.
5. Install/setup/doctor gate: no new dependency, so no new doctor row. The removed doctor row is listed in CHANGELOG.
6. Tests, one at a time: narrow `node --test` per touched file, `cargo test -p fgos-config`, then
   `npm test` and `cargo test --workspace`. Run `detect_changes({scope: "compare", base_ref: "main"})`
   before commit.
7. Commit with a pathspec. Review with an independent reviewer, because this phase touches public
   config contracts. ff-merge with the owner.

## Validation

Acceptance criterion 7: `rg resourceBindings src core` and `rg FGOS_HERDR_PROMPT_DELIVERY src` are
empty, and the suites are green.

## Risk

| Risk | L x I | Mitigation |
|------|-------|------------|
| Another project or machine still carries a legacy shape | M x H | gates G1 and G2; the config door then reports the key by name instead of silently inferring |
| D5 removal breaks a test fixture using executor-level fields | H x L | fixtures move to `invocations[]` in the same commit |
| Lease regression from the inventory read change | L x H | lease, probe and renewal suites are the owning proofs; explain before/after on this machine |

## Rollback

Revert the merge commit. The config on this machine already uses the new shapes, so it stays valid
under the old code.
