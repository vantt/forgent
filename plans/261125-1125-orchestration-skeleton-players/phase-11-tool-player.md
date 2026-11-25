# Phase 11: Tool as a player through fgos run

Decision: OS-D15 (a `kind: tool` executor that declares a job invocation is chosen by `bind()` for a capability and
run by the runner like an agent Unit; lookup-only tools keep their old meaning; no second execution door). A new
feature the owner chose (RUL104 recorded in the discussion).

## Inputs

- `packages/execution/rust/src/tools.rs` (tool presence per first invocation: `cli`, `binary`, `mcp`, `skill`).
- `packages/execution/rust/src/bind.rs`, `executor_model.rs`, `executor_config.rs`, `unit/`, `loops/`.
- `packages/execution/contracts/executor-model.v1.json`, `bind.v1.json`.
- `AGENTS.md` "Dispatch" (`fgos run --provider` refuses a `kind: tool` executor today).
- Discussion §3 4j.

## Footprint

`packages/execution/rust/src/tools.rs`, `packages/execution/rust/src/bind.rs`,
`packages/execution/rust/src/executor_model.rs`, `packages/execution/rust/src/executor_config.rs`,
`packages/execution/rust/src/unit/`, `packages/execution/rust/src/loops/`,
`packages/execution/contracts/executor-model.v1.json`, `packages/execution/contracts/bind.v1.json`,
`packages/execution/rust/tests/tool_job.rs` (new).

## Steps

1. Add invocation kind `job` to the executor model: `{ "via": "job", "command": [..], "params": {..}, "writes": [..],
   "timeoutSec": N }`. The command is an argv list, never a shell string; parameters are passed as discrete argv
   elements.
2. `bind()` may choose a tool executor for a capability only when it has a `job` invocation; tools with only lookup
   invocations stay unbindable as players (unchanged refusal).
3. The runner runs a job Unit through the same run path as an agent Unit: bounded child through the process door,
   exit code and output captured into the run result, `writes` committed by the runner after a passing round, the Unit
   settled with the same events. Progress for the keeper is output growth; exceeding `timeoutSec` ends the run with
   reason `job-timeout`.
4. `fgos run --provider <tool>` with a lookup-only tool keeps its refusal; with a job tool it is accepted.

## Verify

`cargo test -p fgos-execution --test tool_job`. Pass: a capability binds to a job tool and the Unit settles with exit
code 0 and its `writes` committed in a fixture repo; a failing job settles as failed with its exit code; timeout gives
`job-timeout`; a lookup-only tool is still refused for `--provider`. `cargo test -p fgos-execution` stays green.

## Rollback

Revert the phase commit; no executor in shipped config declares a `job` invocation yet.
