# Phase 16: delete the `runner.providers.<p>.accounts` reader (V3, code part)

Start after: the board line from design-lap (forgentx-46) that says every machine's accounts are on `runner.llmAccounts`,
and 06 landed (so its account view is known). Never beside 09 (`account-pin.mjs`, `provider-capacity.mjs`). Rules:
[phase-lead-rules.md](phase-lead-rules.md). Worktree `erd-p16`, report slug `erd-p16-llm-accounts`. Effort: 1d.
Source: owner decision 2026-11-17 10:53 (relayed by HARDEN), plan.md "Owner decisions", item V3. Line numbers are HARDEN's;
re-verify with `rg`.

## Limit

Code only. Moving each machine's accounts is design-lap's data work; this phase does not start, and does not edit any
machine's config, before the gate line is on the board. Do not guess the gate: read the line and quote it in the report.

## Requirements

0. Red first: a config that sets `runner.providers.<p>.accounts` is refused by name; accounts read only from
   `runner.llmAccounts`.
1. Delete the reader in `provider-capacity.mjs` (~:92-118, `providerAccountInventory`'s provider branch) and
   `src/runner/dispatch/llm-accounts.mjs` if nothing else of it remains (`rg` first); move every caller.
2. Delete the schema entry (`core/config-schema/runner.schema.yaml` ~:313-316, "Older account inventory by provider").
3. If 06 or 09 left a Rust twin of the old reader (`legacyStateKey` is the state key, not the reader; check), delete it
   in the same change.
4. Move the agy sub-HOME doctor row (`src/setup/agy-permissions.mjs` ~:160, `checkAgySubHomesConfigured`) to read the
   `gemini` pool of `runner.llmAccounts`, and drop its demand for `toolPermission: "always-proceed"` in each sub-HOME's
   settings.json: both agy invocations already pass a session-only `--settings` with always-proceed and the deny list
   (`core/config-standard/runner.yaml` ~:211, ~:234), so the file is never read on a run. Owner 2026-11-18: fix it
   here, not by hand-editing the tetnu/mucdong homes. Retire the test cases that assert the file demand.

## Files

- Modify: `src/runner/dispatch/provider-capacity.mjs`, `src/runner/dispatch/llm-accounts.mjs` (delete if emptied),
  `core/config-schema/runner.schema.yaml`, `src/setup/agy-permissions.mjs`, `packages/execution/rust/src/accounts.rs` (only if a twin exists), tests,
  `docs/platform/runner/**` mention if any, mutation census.

## Acceptance

- No reader or schema entry for `providers.<p>.accounts`; the refusal test is green; focused tests one file per run.
- The report quotes the design-lap board line that opened the phase.

## Risks / rollback

A machine not yet moved is refused by name: that is why the gate line is required. Rollback: revert the commit.
