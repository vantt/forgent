# Phase 07: the dispatch decision, the runner config check, the tool lookup and the hook in Rust

Start after: 04 and 03 landed (all non-purpose paths); **finish the purpose path and land after 06**. Wave 3, parallel
with 06 and 08. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F2, F10. Worktree `erd-p07`, report slug
`erd-p07-decide`. Effort: 4d.

## Context

`fgos dispatch decide` answers through `compileDispatchPlan` (`plan.mjs:504`): selector, executor lookup, governance,
mechanism, tool providers, purpose seat through `bindWorkSeat` (F2). Its callers besides decide are
`assignment-runner.mjs:1215` (S6a) and `fanout-batch.mjs:75` (S7), which spawn no host for the executor-id, assignment
and Work-hint selectors today (F10). D5: Rust is the decider for the native verb and for every selector that binds a
seat; Node keeps the bind-free selectors for those two callers as a declared twin read against the same vectors until
S6a. The native hook must refuse exactly where Node does, and Node refuses on semantic config rules beyond the schema
(`validateRunnerConfigShape`, F10), so that check moves too. The hook's payload rules differ from the host's mailbox
hook (unix-only, always exit 0, another root rule), so the dispatch hook gets its own normalizer.

## Requirements

1. Record `packages/execution/contracts/decide.v1.json` first, from Node on the post-03 tree (inputs by hand, `expect` recorded
   by a script of the same shape as 01's `scripts/executor-model-vectors.mjs`, with `--check`): every selector form (`executorId`, `--for` with and without `--needs-soul`/`--has-live-task-access`, a
   name with no row, a tool ability present/missing/stale, `--assignment` with a given record, `--work` with a given
   hint, the cwd/repo-root guard, the config root rule), every runner semantic refusal, and hook cases (each CLI's payload
   form, a missing `CLAUDE_PROJECT_DIR`, agy `workspacePaths`, a linked worktree with its own config, a config refusal,
   a non-config failure, in-process, out-of-process, unavailable). Commit red first.
2. `src/runner_check.rs`: the semantic validation of `validateRunnerConfigShape` (`dispatch/config.mjs:714-777`), pure,
   same `config-*` codes and texts; native `decide`, `explain` and the hook run it before deciding, and its refusals are
   the "config refusal" class. Node keeps its copy for the config load of S6a callers (declared twin, D7).
3. `src/decide.rs`: `pub fn decide(req: &DecideRequest, machine: &dyn Machine, probe: &dyn ToolProbe) -> DecideAnswer`
   with selectors `executorId | for | needsSoul | assignment (record given) | work (hint given)`, `hasLiveTaskAccess`,
   `caller`, the config root chosen by `configRootFor`'s rule (`decide.mjs:22-33`) and the default-executor merge;
   same refusals and texts as Node (usage text without the `node src/runner/dispatch.mjs` form, D13); decide's purpose
   rule unchanged (only a purpose with its own `prefer` pool binds through Seat Binding). The purpose seat calls 06's
   `bind` with the `bindWorkSeat` ask (headless, `postureAtLaunch`, no writes).
4. `src/tools.rs`: `for` entries of tool executors, normalization, served capabilities; `trait ToolProbe { fn
   present(&self, command: &str) -> bool; fn index_commit(&self, provider) -> Option<String>; fn head(&self) ->
   Option<String>; }` (the staleness rule of `tool-providers.mjs`); the posture `full/degraded/inactive` (11).
5. `src/hook.rs`: the payload normalizer ported from `normalizeHookPayload` (`src/runner/hook.mjs:28-44`), pure over
   `(payload bytes, env, format)`, cross-platform; the verdict with Node's exact texts (`dispatch/hook.mjs:44-74`); the
   exit contract of the contract doc (block = exit 2 standard or agy JSON; missing project dir or config refusal
   blocks; any other failure, a panic included, allows).
6. Node twin proof for the bind-free selectors: `test/runner/dispatch.test.mjs` gains one test that runs the
   `decide.v1.json` vectors of those selectors through `compileDispatchPlan`; its other decide cases move to the Rust
   golden in 10.
7. `tests/golden_decide.rs` over `decide.v1.json`.

## Files

- Create: `packages/execution/contracts/decide.v1.json`, `packages/execution/rust/src/{runner_check.rs,decide.rs,tools.rs,hook.rs}`,
  `packages/execution/rust/tests/golden_decide.rs`.
- Modify: `packages/execution/rust/src/lib.rs`, `test/runner/dispatch.test.mjs` (one vector test), mutation census.
- Delete: none. Tests retired: none here (Node arms go in 10, the Node plan's binding selectors in 09).
- Net size: about +1 200 Rust lines, +400 test lines, +30 Node test lines.

## Steps

1. Record vectors; red golden test. 2. Runner check, non-purpose paths, tools, hook; push. 3. After 06 lands: rebase,
   purpose path. 4. Rust gates.

## Acceptance

- The phase removes `validate` (and the `status` field of `toolProviders`) from `REPLAYED_LATER` and replays them
  from `executor-model.v1.json`; `decide.v1.json` must not re-record the `validate` vectors (two proofs of one
  behaviour). Every decide and hook vector passes in Rust; the bind-free selector vectors pass through Node `compileDispatchPlan`.

## Risks / rollback

- A semantic config rule missed (M x H): the vector set lists every `config-*` code `validateRunnerConfigShape` can
  raise (`rg -n "'config-" src/runner/dispatch/config.mjs`). Revert: one commit.
