# Phase 03 report: persona and role taste tables

Branch `execution-read-door/p03`, base integration `cdd42fe6b` plus origin/main merged (HARDEN's agy-stub fix is in).

## What changed
- Seat Binding crate: `Config` gains top-level `roles` and `personas` (`Scope {tier?, prefer?}`); `CapabilityEntry` loses `roles`, `personas`, `seats`; the unused `seat_tier_path` output field is gone (tier-cell-missing now names `prefer` source and the tier source). Validation: role names limited to the five roles, empty `prefer` refused naming `roles.x.prefer` / `personas.x.prefer`. Sources print as `roles.red-team.prefer` (no `runner.` prefix, like every other source path).
- Golden: one case per precedence column (persona > role > workflow > capability > prefix > default; prefer: persona > role > exact capability > prefix > tierFallback), refusal cases for a bad role and an empty persona prefer.
- Schema: top-level `roles` (five names) and `personas`, `project-only`; `$defs.capability` drops the three keys; `seatTaste` renamed `taste`. Standard: `runner.roles.red-team [xai, claude, openai]`; marketing block and both architecture `seats` blocks deleted.
- Config crate fixtures: pinned authoring source moved to the new shape (sha updated; the two red-team differences became one), validate rows, migrate counts (kept 37 to 36, redundant 237 to 234), scope test.
- Node: `bindingTasteOf` returns `{capabilities, roles, personas}`; new `preferSitesOf`; `seat-policy` passes all three; `dispatch/config.mjs` validates persona names and executors named in role/persona prefer; `run.mjs` snapshot hash now covers `roles` and `personas` (needed, otherwise a taste change would not change the hash); persona refusal message points at `runner.personas.<name>`.
- Spec: `docs/platform/seat-binding/spec.md` 5.4, 6.1-6.4, 10.1/10.2/10.4 rewritten; decision D-ADR0080 in section 15; `docs/platform/vision.md` one line.
- This repo's `.fgos/config.yaml`: marketing block removed by hand (the repair refuses while two red-team values disagree and the write door refuses an invalid file), then `fgos doctor --fix --dir <worktree>` moved `code:*` red-team `[openai, xai]` and `reviewer [xai, openai]` to `runner.roles` with their reasons. `config refresh-docs` fixed an unrelated pre-existing doc drift on `mailbox.enabled`. `fgos config check` exits 0.

## Scope change (must be read)
The two orders now apply to every capability, councils included. With only two families each, the architecture critique and synthesize seats were refused `independence-unsatisfiable` in `seat-binding-dry-bind`. I appended `claude, gemini` to both orders in this repo's config (original order and original `@fgos:why` kept, one sentence added). This is a taste decision the plan did not carry: revert that commit hunk if the owner prefers a different fix (Q2's real home is p-bjmoxexuwi). The standard's red-team order has three families and needs nothing.

## Retired test -> owner now
| Retired | Owner now |
|---|---|
| golden "critique producer takes the seat tier key" (seat taste removed) | behaviour removed; workflow seat tier owned by shape-system golden case and phase 14 |
| per-capability roles/personas/seats cases in tier-fallback-config.test.mjs | same file, now on `runner.roles`/`runner.personas`; seat cases removed (behaviour gone); schema refusal of the old keys owned by golden_validate row "persona and role taste are not capability keys" |
| capability-config seat/roles slice cases | same test, new slice shape |

## Gates
- cargo fmt --check, clippy -D warnings, `cargo test -p fgos-seat-binding -p fgos-config`: green. `cargo check` for x86_64-pc-windows-msvc and aarch64-apple-darwin: green.
- Node one file per run, all green: capability-config, seat-policy, config-snapshot-hash, runner-schema-vocabulary, agent-definitions, tier-fallback-config, dispatch (223), dispatch-executor-profile, explain, run-verify-pin, run-summary-resume, run-verb, seat-binding-dry-bind, unit-handoff-raise-door, bind-committed-config, architecture, git-mutation-census, doc-health, decision-citation-drift (the last three before the final merge; census and architecture re-run after it). Full sweep of 49 importing test files done once, failures fixed.
- Tests I edited that others also touch: `bind-committed-config.test.mjs` (lines 33 and 125 only: role `producer`, since the reviewer order now overrides the pool); HARDEN's `seedStubAgentClis` line untouched. Fixture `test/fixtures/committed-config.yaml` moved to the new shape; `reviewedConfig` helper sets `roles.red-team` for its fixture executors.
- Not run: full `npm test`, `cargo test --workspace`, `fgos dispatch explain` with a red-team seat (the verb has no role flag; the crate golden case asserts `prefer: roles.red-team.prefer = [xai]`). GitNexus impact analysis not run; readers were found with rg and the architecture door rows.

## Landing guide must reconcile
- Main checkout's uncommitted `.fgos/config.yaml` still has `capabilities.code:*.roles` and `marketing:*`: after pulling, run `fgos doctor --fix` there (it refuses while the two red-team values disagree: unset the marketing block first, set `runner.roles.red-team`), then the appended families. Until then `fgos config check` fails on main.
- 03 and 13 share one activation. `doctor --fix` also rewires hook files; use `--dir`.
- Running `fgos` verbs from this worktree wrote an invocation-fault log line into the main checkout's ignored `.fgos/logs`.

## Unresolved
- Is appending `claude, gemini` to the role orders acceptable, or should the repo's red-team/reviewer orders shrink to the standard's?
- CHANGELOG line (phase 12): "persona and role preferences moved from capability rows to `runner.personas` and `runner.roles`; run `fgos doctor --fix`."
