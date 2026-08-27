# Agent Team Dispatch And Herdr Stability

Status: brainstorm synthesis and near-term implementation direction
Date: 2026-08-27
Scope: multi-provider agent dispatch, Herdr visibility, runtime evidence, AgentMessage boundaries, and a lightweight stabilization path for `agy-herdr`

## 1. Problem

fgOS wants dispatch to feel like a team of agents: different roles can be handled by different providers such as Codex, Claude, agy, pi, MCP tools, or future executors. Those agents should be able to contribute to one larger mission through discussion, review, implementation, verification, and coordination.

For the shared vocabulary behind `mission`, `work`, `assignment`, `run`,
`evidence`, `visibility`, and the coordination roles, see
`orchestration-vocabulary-map.md`.

The immediate runtime problem is narrower: Herdr-driven interactive dispatch is not deterministic enough when fgOS treats terminal state as the authority. Herdr can split a real terminal pane, run or type into it, and report coarse `agent_status` values such as `working`, `idle`, `done`, and `unknown`. This gives valuable visibility, but it is not enough proof that an agent received a prompt, did useful work, or finished correctly.

Observed failures include:

- false-idle races where a pane reports idle before the agent has started real work;
- pane status and visible pane content disagreeing;
- interactive TUIs opening an idle banner while the dispatched prompt is not acted on;
- alternate-screen behavior making scrollback/capture unreliable;
- `done` being reported without external evidence such as file changes, commits, result files, or visible prompt delivery.

Therefore Herdr should remain a visibility surface and process-control helper, not the semantic source of dispatch truth.

## 2. Core Principle

The control plane owns the dispatch contract. Individual agents should not need to understand fgOS internals.

```txt
Agent does the work.
Control plane handles lifecycle, visibility, evidence, and routing.
```

The most important rule:

```txt
Pane status may end waiting.
Pane status must not prove success.
```

`agent_status` can say "this pane looks quiet enough to inspect", but it must not say "the assignment succeeded".

## 3. Three Channels For One Dispatch

A single dispatch should be understood as three separate channels.

### 3.1 Truth Channel

The truth channel is the deterministic execution/control path for the agent.

Examples:

- `codex exec --json -o <result-file> <prompt>`;
- Claude headless or stream JSON mode;
- agy headless prompt mode if it is the stable path;
- MCP tool invocation;
- HTTP/API call;
- local mailbox/run file consumed by an executor.

The truth channel should expose at least one concrete completion signal:

- process exit code;
- structured JSON/JSONL completion event;
- result file written;
- mailbox result message;
- run state transition.

Interactive TUI text should be the truth channel only when no better channel exists.

### 3.2 Visibility Channel

The visibility channel exists so a human can watch the agent.

Examples:

- Herdr pane running the truth command;
- tmux pane;
- dashboard tailing stdout/JSONL;
- TUI attached to an existing session.

Visibility is useful for supervision, debugging, and confidence, but it is not the result authority.

### 3.3 Verification Channel

The verification channel provides evidence outside the agent's own claim.

Examples:

- git head changed;
- working tree changed;
- commit landed;
- expected artifact file exists;
- result JSON validates;
- test report was written;
- relevant command passed.

For repo-changing work, `git` and artifact deltas are the strongest near-term evidence. For consult/read-only work, the required evidence should be a written result artifact rather than a git delta.

## 4. Contracts

There are several contracts in this design. They should not be collapsed into one object.

### 4.1 Mission Contract

Defines the larger objective a team is working on.

```json
{
  "missionId": "mission_example_001",
  "objective": "Make multi-provider dispatch stable",
  "constraints": ["keep Herdr as visibility only"],
  "successCriteria": ["no pane-status false success"]
}
```

It answers: what is the team trying to accomplish?

### 4.2 Role Contract

Defines responsibilities independent of provider.

```json
{
  "role": "reviewer",
  "responsibility": "Find correctness risks and missing tests",
  "allowedActions": ["read", "review", "propose"],
  "preferredExecutors": ["codex", "claude"]
}
```

It answers: what is this role expected to do?

### 4.3 Assignment / AgentMessage Contract

Defines semantic communication between roles.

```json
{
  "type": "TASK",
  "assignmentId": "asgn_example_001",
  "missionId": "mission_example_001",
  "toRole": "implementer",
  "objective": "Stop treating Herdr pane status as completion proof",
  "contextRefs": ["src/runner/dispatch/transport.mjs"],
  "expectedOutputs": ["patch", "test", "summary"]
}
```

`AgentMessage` is the semantic contract. It says what work means, who is asking, who should answer, which context refs matter, and what kind of response is expected.

It is not proof that anything ran.

### 4.4 Runtime Execution Contract

Defines how one assignment is actually executed.

```json
{
  "runId": "run_asgn_example_001_01",
  "assignmentId": "asgn_example_001",
  "executorId": "codex",
  "command": ["codex", "exec", "--json", "-o", ".fgos/results/asgn_example_001.txt", "{prompt}"],
  "cwd": "/repo/worktree",
  "timeoutMs": 1800000,
  "visibility": {
    "kind": "herdr-pane"
  }
}
```

It answers: which process or tool runs, where, with what timeout, logs, environment, and visibility surface?

The runtime execution contract is still required. It is just not the semantic team contract.

### 4.5 Evidence / Result Contract

Defines the normalized outcome and why fgOS trusts it.

```json
{
  "assignmentId": "asgn_example_001",
  "status": "done",
  "confidence": "reported+verified",
  "agentClaim": {
    "status": "done",
    "summary": "Changed status handling and added regression tests."
  },
  "runtime": {
    "exitCode": 0
  },
  "evidence": {
    "gitBefore": "abc",
    "gitAfter": "def",
    "changedFiles": ["src/runner/dispatch/transport.mjs"],
    "tests": ["node --test test/runner/dispatch.test.mjs"]
  }
}
```

It answers: what happened, what did the agent claim, what did the runtime observe, and what external evidence confirms it?

## 5. Relationship Between Contracts

```txt
Mission
  -> creates Assignment / AgentMessage
    -> dispatcher selects Role + Executor
      -> Runtime Execution Contract runs one run
        -> Visibility Channel lets a human watch
        -> Verification Channel gathers evidence
          -> Evidence / Result Contract is appended back to the mission thread
```

Short form:

```txt
AgentMessage = meaning
Runtime run  = execution
Herdr        = visibility
Evidence     = proof
```

`AgentMessage RESULT` is still only an agent claim. It becomes trustworthy only after runtime and verification evidence are attached.

## 6. Agent Team Model

The desired team behavior should be built above single-dispatch execution.

Core team objects:

```txt
Mission
Thread
Assignment
Result
Evidence
```

Common modes:

- `consult` - ask an agent for advice; no repo mutation; requires a written result/report artifact.
- `work` - let an agent modify repo state; requires git/artifact evidence.
- `review` - ask another role to inspect a result, patch, branch, or commit.
- `coordinate` - decide the next assignment; should be limited to the orchestrator or a trusted coordination role.
- `debate` - ask multiple agents the same question and synthesize; should not mutate repo state directly.

Roles should not be hardcoded to providers:

```json
{
  "role": "implementer",
  "provider": "agy",
  "executor": "agy-headless-visible"
}
```

```json
{
  "role": "reviewer",
  "provider": "codex",
  "executor": "codex-exec-json"
}
```

This keeps the system flexible: the same role can move between providers based on availability, capability, cost, model policy, or task type.

Agents may discuss by writing messages into the mission thread, but real dispatch should still go through the control plane. An agent should propose follow-up work rather than directly spawning another agent outside fgOS.

## 7. Avoiding Framework Weight

The system becomes heavy if every agent must know all layers. It stays light if fgOS keeps the machinery outside the agent.

Agents should see only:

```txt
You are acting as <role> for mission <id>.
Read these context refs.
Do this bounded assignment.
Return this response shape.
Do not dispatch directly; propose follow-up work if needed.
```

The control plane handles:

- executor selection;
- process spawning;
- Herdr/tmux/dashboard visibility;
- timeout/cancel;
- stdout/result capture;
- git/artifact snapshots;
- confidence classification;
- appending results back to mission state.

For V1, the physical storage can be small:

```txt
.fgos/missions/<mission-id>/
  mission.json
  thread.jsonl
  assignments/
    <assignment-id>.json
  results/
    <assignment-id>.json

.fgos/assignments/<assignment-id>/
  assignment.json
  runs/
    01/
      run.json
      stdout.log
      stderr.log
      exit.json
      result.json
      evidence.json
```

This does not require a daemon or mailbox on day one.

## 8. Best Architecture Target

The long-term stable model is:

```txt
Universal run wrapper + result directory + external verification.
Visibility surface optional.
Per-agent adapter chooses the best truth command.
```

The run wrapper should:

- create a run directory;
- write started metadata;
- snapshot git/artifact state before execution;
- run the selected executor command;
- tee stdout/stderr;
- collect exit code;
- collect structured result if available;
- snapshot git/artifact state after execution;
- classify confidence;
- write the normalized result.

Herdr then runs or displays that run, but does not own result semantics.

## 9. Near-Term Stabilization For `agy-herdr`

Before building the full architecture, `agy-herdr` can be stabilized by adding a thin evidence layer around the current adapter.

### 9.1 Do Not Trust `done` More Than `idle`

The current danger is treating Herdr `done` as terminal without enough corroboration. `done` should not bypass evidence checks.

Near-term rule:

```txt
idle requires sawWorking + debounce.
done requires sawWorking or another concrete evidence signal.
```

Concrete evidence signals can include:

- pane content changed since launch;
- prompt nonce appeared in captured output;
- git status/head changed;
- expected artifact/result file appeared;
- recognized completion token or structured result appeared.

### 9.2 Add A Dispatch Nonce

Wrap prompts with a unique assignment id and nonce.

```txt
Assignment id: asgn_<token>
Nonce: nonce_<token>

When you start, mention: fgos-started-<nonce_token>
When finished, mention: fgos-finished-<nonce_token>
```

The assignment id identifies the semantic request. The nonce is only a
runtime-correlation guard used to prove the prompt reached the worker output
surface. Do not use the nonce as a lifecycle id.

This is not a hard proof of correctness, but it helps diagnose prompt delivery
and pane-capture mismatches.

### 9.3 Snapshot Git Before And After

For repo-changing work, the Herdr adapter should record:

- `headBefore`;
- `statusBefore`;
- `headAfter`;
- `statusAfter`.

If the agent reports completion but there is no recognized signal and no external delta, the outcome should be `unsignaled` or `no-evidence`, not success.

### 9.4 Separate Waiting From Trust

Use `agent_status` only to decide when to inspect or exit the pane.

```txt
agent_status = when to inspect
evidence     = whether to trust
```

This preserves the useful part of Herdr polling while removing the false-success path.

### 9.5 Prefer Stable Headless Mode When Interactive TUI Is Not Reliable

If live testing proves `agy -p <prompt>` is stable while `agy -i <prompt>` or bare interactive injection is not, then `agy-herdr` should become:

```txt
Herdr-visible headless agy execution
```

rather than:

```txt
TUI injection through an interactive REPL
```

The human still gets a visible pane, but the dispatcher gets a more deterministic truth channel.

## 10. Suggested Implementation Order

Near-term:

1. Harden `herdrSpawnInteractiveAdapter` so `done` cannot imply completion without `sawWorking` or evidence.
2. Add git before/after evidence to Herdr dispatch results.
3. Return `unsignaled` or `no-evidence` when pane status settles but no work evidence exists.
4. Add nonce wrapping for interactive dispatch prompts.
5. Run a live matrix for agy:
   - `agy -i "<prompt>"`;
   - bare `agy -i`, then follow-up prompt;
   - `agy -p "<prompt>"` inside a Herdr pane.
6. If `-p` is more stable, reframe `agy-herdr` as visible headless execution.

Next:

1. Add a minimal run directory/result wrapper.
2. Run Codex through `codex exec --json -o <result-file>` inside Herdr.
3. Classify result confidence from structured result, process exit, and git/artifact evidence.
4. Introduce Assignment/AgentMessage only as the semantic payload once run evidence is stable.

Later:

1. Add mission/thread state.
2. Add role registry.
3. Add orchestrator loop for consult/work/review/debate/coordinate.
4. Add mailbox or daemon only if async multi-agent coordination needs it.

## 11. Non-Goals For The Near Term

- Do not make Herdr pane status the source of task truth.
- Do not require every provider to implement a bespoke deep integration before it can run.
- Do not require full AgentMessage/mailbox infrastructure to stabilize `agy-herdr`.
- Do not let agent-to-agent dispatch bypass fgOS control-plane selection and evidence checks.
- Do not treat git delta alone as proof of correctness; it is evidence of effect, not quality.

## 12. Summary

The stable shape is not "Herdr dispatches agents". The stable shape is:

```txt
fgOS dispatches runs.
Executors perform assignments.
Herdr shows the run.
Evidence proves the outcome.
AgentMessage carries meaning between roles.
```

For `agy-herdr` specifically, the smallest useful step is to stop trusting pane status as success and attach external evidence to every dispatch result. That gives fgOS a practical bridge from today's Herdr adapter toward a future team-agent runtime without requiring the whole architecture to land at once.
