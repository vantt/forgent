# Phase 15: delete the legacy-only invocation and launch code (V4)

Start after: S4 on main. Wave 1, beside 01, 02, 13, 14. Never beside 05 or 09 (all edit `assignment-runner.mjs`):
whichever starts first lands first. Lands before 04 starts, so the executor model is never ported with dead rules.
Rules: [phase-lead-rules.md](phase-lead-rules.md). Worktree `erd-p15`, report slug `erd-p15-legacy-invocation`. Effort: 1.5d.
Source: owner decision 2026-11-17 10:53 (relayed by HARDEN), plan.md "Owner decisions", item V4. Line numbers below are
HARDEN's; re-verify each with `rg` first.

## Why this phase exists, and its limit

- **Why:** three legacy-only pieces would otherwise be ported into Rust by 04: a credential store inferred from
  resource bindings, executor-level launch fields that duplicate `invocation`, and an env that overrides prompt delivery.
- **Limit:** pure deletion plus moving every caller (RUL104, L10); no new key, no new mechanism. If a caller or a
  shipped config still depends on a piece and needs a data change, stop and tell the plan lead: per-machine config data
  belongs to design-lap, not here.

## Requirements

0. Red first: a test per piece that proves the old path is gone (an executor with only `resourceBindings` gets no
   credential store; the schema refuses the executor-level launch fields; the env no longer changes delivery).
1. `credentialStoreOf` (`provider-capacity.mjs` ~:263-270): stop inferring from `resourceBindings`; only an explicit
   `credentialStore` counts. Before deleting, `rg` every executor in `core/config-standard`, this repo's config and the
   fixtures: any that relies on the inference gets an explicit `credentialStore` in the same change.
2. `core/config-schema/runner.schema.yaml` (~:796-822): delete the executor-level launch fields that `invocation`
   (~:652-709) already carries, with their readers and every config or fixture that still sets them.
3. `FGOS_HERDR_PROMPT_DELIVERY` (`assignment-runner.mjs` ~:989): delete the env read; delivery comes from the resolved
   command; `rg` the whole repo (tests, docs, scripts) for the name and remove every mention.
4. If 01 has already landed, its executor-model vectors lose the inference case in this change; if not, 01 records
   vectors from the post-15 tree.

## Files

- Modify: `src/runner/dispatch/provider-capacity.mjs`, `src/runner/dispatch/assignment-runner.mjs` (one line),
  `core/config-schema/runner.schema.yaml`, the readers and fixtures `rg` finds, their tests, mutation census.
- Create/Delete: none beyond the dead code. Tests retired: those that asserted the deleted paths, each named in the
  report with the test that owns the remaining behaviour.

## Acceptance

- `rg "FGOS_HERDR_PROMPT_DELIVERY"` and the inference branch return nothing; the schema has one place for launch fields, except entry-level `confinement`, which stays as a project capability (owner decision 79 Q6c: a project file may turn `ownWorktree` on there).
- Focused tests green, one file per run; `test/architecture.test.mjs` green; census regenerated, not merged by hand.
- Report lists each caller and config moved.

## Risks / rollback

A shipped config on another machine still sets a deleted field: the schema then refuses it. Mitigation: the report names
every key removed; design-lap's per-machine move covers the data. Rollback: revert the commit.
