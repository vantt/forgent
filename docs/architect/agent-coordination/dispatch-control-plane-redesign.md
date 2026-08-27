# Dispatch Control Plane Redesign

Status: design target with reviewed narrow implementation candidate
Date: 2026-08-26
Scope: fgOS dispatch selection, executor governance, worker protocol, result signaling, artifact handoff, and Herdr runtime visibility

## 1. Problem Statement

fgOS dispatch already has the important pieces of a real multi-agent control plane, but the pieces are not yet explicit enough at the same layer.

The current system has:

- a runner config that maps capabilities/purposes to concrete executors;
- executor declarations with kind, carries, provider/model policy, invocation shape, and optional adapter;
- a `decide` command that chooses whether a target should run native/in-process or out-of-process (this command is the concrete result of D0026's 4 done phases, with phase 5 extending native detection to agy deliberately deferred per `docs/specs/runner.md`'s "Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào" section);
- an `execute` path that resolves an executor, spawns a process, captures output, and returns a JSON result;
- prompt contracts for work items and ad-hoc dispatches;
- legacy stdout tokens such as `[DONE]` and `[BLOCKED]`;
- an `unsignaled` fallback that compares git state before and after execution;
- an existing Herdr executor entry and Herdr-related product work around pane visibility.

The problem is that these concepts are spread across config, resolver, mechanism, transport, prompt text, and documentation. That creates five practical gaps.

1. The decision surface is not canonical. `execute --for` and `decide --for` do not use the same resolver path, so a capability `prefer` can be honored by execution while the decision command reports unavailable.
2. Governance asks the wrong question in one important place. A cross-provider gate that checks only the command name misses cases where the command is local-looking but environment/model settings route the content elsewhere.
3. Protocol is mixed with transport. Stdin/stdout is treated as the protocol boundary, while it is only one possible delivery mechanism.
4. Result truth is unclear. A structured result, a legacy token, and a git-state inference have different trust levels, but current output does not model that distinction as a first-class contract.
5. Terminal visibility is valuable, but it must not turn the terminal runtime into the semantic authority for task state.

## 2. Goals

1. Make dispatch a single explicit decision object.
2. Keep the Native-First Dispatch Doctrine as the source of dispatch mechanism selection.
3. Separate "what to run", "who runs it", "how it is delivered", and "how result truth is proven".
4. Support cross-provider execution without hidden egress.
5. Support Herdr pane visibility soon without requiring the full protocol migration first.
6. Keep worker result handling robust when third-party CLI agents do not obey a structured schema.
7. Keep large data, source diffs, reports, and datasets out of messages; pass references instead.
8. Defer full AgentMessage/mailbox/artifact-store implementation until there is a concrete reader/consumer.

## 3. Non-Goals

1. Do not make Herdr the source of truth for task state.
2. Do not require every third-party CLI worker to emit valid structured JSON from day one.
3. Do not implement a broad message bus only because it is architecturally attractive.
4. Do not create a second content-class enum beside `carries`.
5. Do not re-open the settled distinction between lifecycle work and ephemeral ad-hoc dispatch.

## 4. Current Findings

### 4.1 Config Already Has The Right Raw Material

The runner config already distinguishes these axes:

- executor kind: agent or tool;
- content carried: `user-text` or `repo-content`;
- invocation mechanism: `cli`, `task`, `mcp`, or `api`;
- adapter: default `cli-spawn`, with a registry hook already present;
- provider/model policy and rigor override;
- capability `prefer` mapping from an abstract purpose to a concrete executor.

This means the redesign should reuse the existing vocabulary rather than create parallel fields.

### 4.2 `decide --for` And `execute --for` Drift

The execution path resolves purposes through the richer resolver that understands capability `prefer`. The decision path has a narrower branch that can resolve only by scanning executors that declare `for`.

The visible failure is:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

returning unavailable even though the config declares that the `fgos-coding-implement` capability prefers `agy`.

### 4.3 Governance Can Miss Hidden Egress

The current cross-provider gate is command-shaped. It treats a non-Claude command as suspicious unless `allowCrossProvider` is true.

That misses the inverse case: an executor can run command `claude` while environment and model settings route the real request through another provider endpoint. The `glm` executor shape is the motivating example: the command can look like Claude while the effective target is OpenRouter and a GLM model.

Governance must inspect effective egress, not just argv[0].

### 4.4 CLI-Only Dispatch Is Too Narrow, But The Adapter Axis Already Exists

The resolver currently insists on a `via:"cli"` invocation for production dispatch. That blocks true `api` or `mcp` execution paths.

However, the transport layer already selects an adapter independently:

```txt
executor.adapter ?? DEFAULT_ADAPTER
```

Therefore a near-term Herdr integration does not need a new protocol layer. An executor can remain `via:"cli"` for resolver compatibility while using `adapter:"herdr-spawn"` to launch the worker in a visible Herdr pane.

### 4.5 `unsignaled` Is A Real Fallback, Not A Mistake

CLI agents are third-party workers controlled by prompt, not by hard schema enforcement. A worker may exit successfully without emitting a structured result or even a legacy status token.

The existing `unsignaled` outcome captures this reality by returning `headBefore` and `headAfter`. It should not be deleted until a replacement reader exists and provider compliance data proves it is safe.

### 4.6 Herdr Visibility Does Not Require Mailbox Yet

The near-term Herdr use case is:

```txt
agent A asks fgOS to activate agent B
fgOS launches B in a Herdr pane
Herdr owns the terminal/runtime surface
fgOS still owns dispatch result interpretation and task state
```

In this shape, A and B do not need a direct communication channel. B returns through the same worker-output path as any CLI dispatch: terminal transcript is captured by the Herdr adapter and handed back to fgOS. fgOS then applies the existing result ladder. Herdr provides visibility and process control, not semantic routing.

Therefore mailbox and AgentMessage are still design targets, not prerequisites for the current Herdr adapter.

## 5. Vocabulary

### 5.1 Dispatch Roles

- `launcher` - starts a work item or dispatch target and may step away.
- `driver` - stays attached and continues coordinating after activation.
- `orchestrator` - T0 composition layer that manages N units of work and stays attached.
- `work` - lifecycle-bearing fgOS unit with state, events, claim/return, and merge semantics.
- `child work` - a normal work item related to a parent; not a separate dispatch category.
- `capability` - an abstract behavior promise such as `fgos-coding-implement`.
- `executor` - the concrete implementation of a capability, such as `agy`, `codex`, `gitnexus`, or `herdr`.
- `ad-hoc task` / `exec packet` - an ephemeral runtime-composed unit outside the work ledger.

The old `rootTask`/`subTask` vocabulary is not part of the current dispatch model. A "subtask" is either child work with lifecycle or an ephemeral ad-hoc dispatch target. Note that the runner spec's (`docs/specs/runner.md`) historical `capacity` concept maps to `capability` for abstract behavior promises and to `executor` for concrete execution units per ADR 0034.

### 5.2 Design-Target Rename

If the protocol migration is allowed to break compatibility, the clean name for the old `exec packet` concept is:

```txt
DispatchAssignment
```

`exec packet` describes how something is sent. `DispatchAssignment` describes what it means: a bounded assignment handed to another agent.

During the narrow slice, do not rename the existing docs or prompt contract. Use `DispatchAssignment` only in the design target until the protocol migration has a real implementation consumer.

## 6. DispatchPlan

`DispatchPlan` is the canonical answer to "what should happen with this dispatch request?"

It is not a new decision beside the Native-First Dispatch Doctrine. Its `mechanism` is the named result of that doctrine applied to a concrete selector, executor, and runtime condition.

### 6.1 Shape

```json
{
  "selector": {
    "type": "work",
    "value": "tsk-123"
  },
  "target": {
    "capability": "fgos-coding-implement",
    "executorId": "agy",
    "kind": "agent"
  },
  "mechanism": "out-of-process",
  "handback": null,
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "declaredProvider": "agy",
      "command": "agy",
      "effectiveTarget": "agy"
    }
  },
  "execution": {
    "invocationVia": "cli",
    "adapter": "cli-spawn",
    "model": "gemini-...",
    "tier": "lightweight"
  },
  "reasonCodes": [
    "capability-prefer",
    "cli-spawn-shaped-executor",
    "native-first-rule-cross-provider"
  ]
}
```

### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.

### 6.3 Mechanism

Allowed mechanisms:

- `unavailable` - no configured or permitted dispatch target.
- `in-process` - use the current live agent/session facility.
- `out-of-process` - execute through an external executor/adapter.

For in-process dispatch, `handback` carries the concrete native surface:

```json
{
  "mechanism": "in-process",
  "handback": {
    "type": "native-task",
    "agentType": "fgos-coding-implement"
  }
}
```

or:

```json
{
  "mechanism": "in-process",
  "handback": {
    "type": "mcp-tool",
    "tool": "mcp__gitnexus__impact"
  }
}
```

## 7. Governance And Egress

Governance answers whether content may leave the current trusted execution boundary.

Use the existing `carries` vocabulary:

- `user-text` - user prompt or ordinary instruction content.
- `repo-content` - repository content, diffs, file paths, worktree state, or source-derived material.

There is no `secrets` content value. Secrets are never valid dispatch payload.

### 7.1 Effective Egress

The gate must classify egress from the full resolved executor shape:

- declared provider label;
- resolved model/provider policy;
- invocation command;
- invocation environment;
- base URL or endpoint variables;
- adapter;
- `allowCrossProvider`;
- `carries`.

The audit event must record at least:

```json
{
  "provider": "glm",
  "command": "claude",
  "effectiveEgressTarget": "openrouter:z-ai/glm-5.2",
  "carries": ["repo-content"]
}
```

The important rule: command is evidence, not the whole answer.

### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | union, then fail closed if unsatisfied |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
role reviewer requires minTier=standard
operation validate-plan prefers persona=code-reviewer
work risk=high raises minTier=critical
assignment prefers executor=claude
governance checks effective egress
```

The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.

### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Use these as defaults for the first team-dispatch proof, not permanent hard
bindings.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.

## 8. DispatchAssignment

`DispatchAssignment` is the design-target replacement for the current six-field ad-hoc task / exec packet.

It is for runtime-composed work that has no lifecycle row of its own. It does not get claimed, reserved, capped, merged, or moved through work-item state.

### 8.1 Design-Target Shape

```json
{
  "assignmentId": "asgn_example_001",
  "origin": {
    "type": "adhoc",
    "scope": "tsk-123",
    "sequence": 1
  },
  "objective": "Research dispatch protocol migration risks.",
  "inputs": [
    {
      "ref": "repo://forgentX/src/runner/dispatch",
      "purpose": "Read current dispatch implementation",
      "required": true
    }
  ],
  "scope": {
    "read": ["src/runner/dispatch", "docs/history"],
    "write": [],
    "forbidden": [".env", "secrets"]
  },
  "constraints": [
    "Do not modify code",
    "Return findings with evidence"
  ],
  "deliverable": {
    "type": "research_findings",
    "shape": "ordered findings with severity and file references"
  },
  "returnContract": {
    "allowedMessageTypes": ["RESULT", "BLOCKER"],
    "fallbackSignals": ["[DONE]", "[BLOCKED]"]
  }
}
```

### 8.2 Compatibility Mapping

If compatibility is required, the existing six fields map directly:

| Current field | Design-target field |
|---|---|
| `id` | `assignmentId` or `origin.scope + origin.sequence` |
| `goal` | `objective` |
| `inputs` | `inputs` |
| `boundary` | `scope` |
| `expected shape` | `deliverable.shape` |
| `return contract` | `returnContract` |

The current `<scope>#p<n>` id remains valid for old prompt contracts. In the breaking design, typed ids are clearer:

- `tsk_...` or existing `tsk-*` - lifecycle work;
- `asgn_*` - dispatch assignment;
- `msg_*` - protocol message;
- `run_*` - one execution run;
- `trace_*` - distributed trace.

Implementation note:

```txt
Only `tsk-*` work ids exist today as durable lifecycle ids.
`asgn_*`, `msg_*`, `run_*`, and `trace_*` are design-target namespaces until
the assignment, message, runtime, and observability layers add real writers.
```

## 9. AgentMessage

`AgentMessage` is a protocol envelope. It is not a work item, not a prompt, and not an artifact.

```txt
AgentMessage = identity + routing + correlation + delivery + governance + payload refs
Artifact = heavy data or work product
State store = authoritative task/work truth
Transport = how the envelope moves
```

### 9.1 Design-Target Envelope

```json
{
  "schema": "agent-message",
  "schemaVersion": "1.0",
  "messageId": "msg_example_001",
  "messageType": "ASSIGN",
  "from": {
    "agentId": "claude.architect",
    "runId": "run_example_001"
  },
  "to": {
    "selector": {
      "type": "capability",
      "value": "code-implementation"
    },
    "agentId": null
  },
  "correlation": {
    "traceId": "trace_example_001",
    "parentWorkId": "tsk-123",
    "assignmentId": "asgn_example_001",
    "replyTo": null
  },
  "delivery": {
    "priority": "normal",
    "mode": "next_safe_point",
    "ackRequired": false,
    "idempotencyKey": "tsk-123:code-implementation:p1"
  },
  "governance": {
    "carries": ["repo-content"],
    "egress": {
      "allowed": true,
      "effectiveTarget": "codex"
    }
  },
  "payload": {
    "kind": "dispatch-assignment",
    "assignmentId": "asgn_example_001"
  },
  "artifacts": {
    "inputs": [],
    "outputsExpected": []
  },
  "observability": {
    "traceId": "trace_example_001",
    "spanId": "span_001",
    "parentSpanId": null
  }
}
```

### 9.2 Message Type Discipline

Do not implement every imaginable type before a consumer exists.

The minimal useful set for a real migration is:

- `ASSIGN` - hand a `DispatchAssignment` to an agent.
- `RESULT` - report a completed assignment or work dispatch result.
- `BLOCKER` - report that execution cannot continue without a decision/artifact.
- `ERROR` - report infrastructure or protocol failure.

These are reserved but deferred until a named consumer exists:

- `ACK`
- `PROGRESS`
- `QUESTION`
- `ANSWER`
- `REVIEW_REQUEST`
- `REVIEW_RESULT`
- `CANCEL`

This keeps the protocol expandable without committing implementation surface to unused workflow states.

## 10. Structured Result And Confidence Ladder

Structured `RESULT` is the target, but structured-only is not a correct V1 for prompt-controlled CLI agents.

Every dispatch result should eventually classify its confidence:

```txt
structured RESULT or BLOCKER  -> confidence: reported
stdout [DONE]/[BLOCKED]       -> confidence: legacy-signal
git/artifact delta inference  -> confidence: inferred
```

The result object should preserve evidence:

```json
{
  "status": "SUCCESS",
  "confidence": "legacy-signal",
  "evidence": {
    "legacySignal": "DONE",
    "headBefore": "abc123",
    "headAfter": "def456",
    "exitCode": 0,
    "structuredMessage": null
  }
}
```

Do not add confidence telemetry as a write-only field. A migration must include a reader, such as:

- dispatch compliance stats;
- an attestation warning/gate;
- provider compliance report;
- CI health check for provider result quality.

Until that reader exists, keep the current fallback behavior and avoid pretending the telemetry migration has started.

Current narrow-slice status: the implementation keeps the fallback ladder behavior but does not yet add a first-class `confidence` field. That is intentional. A `confidence` field becomes useful only when a production reader, dashboard, gate, or compliance report consumes it.

## 11. Artifact Store

Messages should carry control and references, not heavy content.

The design target is:

```txt
Message carries: intent, metadata, routing, constraints, artifact refs
Artifact store carries: diffs, reports, logs, datasets, screenshots, generated files
State store carries: authoritative lifecycle state
```

Artifact references must be stable enough for later readers:

```json
{
  "ref": "artifact://dispatch/run_456/test-report.json",
  "type": "test_report",
  "name": "tests",
  "sha256": "..."
}
```

For code work, a git commit is an artifact reference:

```json
{
  "ref": "git://forgentX/commit/abc123",
  "type": "git_commit",
  "name": "implementation"
}
```

The artifact store is deferred in the narrow slice because no structured result reader is being shipped yet.

## 12. Transport

Transport is how messages and work activation move. It is not the protocol.

Supported or planned transport families:

- CLI subprocess spawn;
- CLI spawn through a visible Herdr pane;
- stdout/NDJSON frames;
- filesystem mailbox;
- MCP call;
- HTTP/API call.

### 12.1 Herdr Runtime Role

Herdr is runtime/orchestration/visibility:

- open or reuse a pane;
- start an agent process;
- show live output to the human;
- preserve terminal/session context;
- provide attention/liveness signals.

Herdr is not the authority for:

- whether a work item is done;
- whether a blocker is resolved;
- whether a review passed;
- whether artifacts are accepted.

Those facts come from runner state, structured agent events, artifact refs, and verification.

### 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace

Herdr's Rust implementation (`herdr-plugin/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings`/`HerdrOrchestratorToggles` structs (`settings.rs`,
`main.rs`) governing the `herdrOrchestrator` auto-launch config section
(auto-discover/auto-merge/auto-retro/auto-cleanup pane launching). These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§5.1: the T0 composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.

### 12.2 Near-Term Herdr Adapter

The near-term implementation should use:

```txt
invocation.via = "cli"
executor.adapter = "herdr-spawn"
```

This lets the resolver keep its current CLI-shaped contract while the transport layer launches the worker in Herdr instead of a hidden child process.

The later design target may add a true `protocol:"herdr"` or mailbox transport, but that should wait until a real AgentMessage consumer exists.

Implemented adapter contract for the reviewed narrow slice:

- `herdr-spawn` is selected only by the executor adapter field.
- The adapter always creates a fresh Herdr pane for the dispatched worker; it does not reuse an existing pane.
- The worker command is run through a temporary script so prompt text and shell metacharacters are not reinterpreted as a pane command.
- The temporary script removes itself at startup so a crash does not leave the full prompt behind on disk.
- The adapter injects a runner-owned completion sentinel after the real worker command exits.
- Herdr observation waits for that runner-owned sentinel, not for `[DONE]` or `[BLOCKED]`.
- The captured Herdr transcript is normalized by stripping echoed script-invocation lines before downstream result parsing.
- Missing `result.read.text`, missing sentinel evidence, or observer failure is a transport failure, not a worker success.
- Timeout belongs to the adapter: on timeout it closes the pane, kills the observer process group, releases local pipes, and rejects immediately without waiting for Herdr or descendant processes to close.
- Resolved executor environment is passed into the pane, but secret values are not included in adapter error messages.

The important protocol split:

```txt
runner-owned sentinel = proves the pane command exited and transcript is complete
[DONE]/[BLOCKED]      = optional legacy semantic signal emitted by the worker
git head delta        = fallback inference when no semantic signal appears
```

This keeps Herdr compatible with the current prompt/stdout protocol while avoiding the false conclusion that a terminal token is a full AgentMessage.

## 13. Full Design Target

The full target architecture is:

```txt
Caller
  -> DispatchPlan
  -> governance check
  -> transport adapter
  -> worker runtime
  -> structured result or fallback signal
  -> artifact refs
  -> runner-owned state update
```

Logical layers:

```txt
Semantic layer:
  DispatchPlan, DispatchAssignment, RESULT/BLOCKER, governance

Message layer:
  AgentMessage envelope, correlation, delivery, idempotency

Artifact layer:
  git refs, local artifacts, reports, datasets, logs

Execution layer:
  cli-spawn, herdr-spawn, mailbox, MCP, API

State layer:
  fgOS event log and derived state; runner remains the writer
```

## 14. Narrow Implementation Status

This is the current implementation slice. It intentionally does not implement the full design target.

Reviewed candidate branch:

```txt
fgw/tsk-5x7
```

Review outcome:

- no remaining P1/P2 findings in the committed diff;
- ready to merge by `main...HEAD` review scope;
- unrelated dirty worktree state remains outside the committed-diff scope;
- full AgentMessage, mailbox, artifact store, and structured confidence telemetry remain deferred.

### 14.1 Item 0 - Fix `decide --for` And Add Minimal DispatchPlan

Status: implemented in the reviewed candidate.

Implemented behavior:

- `decide --for <purpose>` uses the same capability-aware resolution as `execute --for`;
- the selected `executorId` is visible when a capability `prefer` maps the purpose to a concrete executor;
- `compileDispatchPlan()` centralizes selector handling and returns a consistent governance/invocation shape;
- explicit executor selector wins over work/purpose selector when both are present;
- governance-blocked executors are not reported as dispatchable.

Proof command:

```txt
node src/runner/dispatch.mjs decide --for fgos-coding-implement --has-live-task-access
```

Observed proof:

```json
{"mechanism":"out-of-process","configured":true,"executorId":"agy"}
```

### 14.2 Item 1 - Governance Egress

Status: implemented in the reviewed candidate.

Implemented behavior:

- command-only cross-provider judgment is replaced with effective egress judgment;
- `carries` remains the content-class vocabulary;
- egress classification records provider family, target, content class, command, and adapter context through the resolved executor path;
- a Claude-looking command with `ANTHROPIC_BASE_URL` routed to OpenRouter is cross-provider egress and fails closed unless explicitly allowed;
- malformed or deceptive endpoint overrides fail closed;
- same-provider Claude resolves as same-provider governance;
- non-Claude executors must explicitly allow cross-provider egress when carrying repo content.

Proof:

- an executor that routes to another provider through env/model is not allowed merely because its command is `claude`;
- governance tests cover allowed and blocked cross-provider cases.

### 14.3 Item 2 - `herdr-spawn` Adapter

Status: implemented in the reviewed candidate.

Implemented behavior:

- a configured executor with `adapter:"herdr-spawn"` routes through the Herdr adapter;
- `invocation.via:"cli"` remains the resolver-compatible invocation type;
- every dispatch creates a fresh pane;
- pane output is captured and normalized before the existing result parser sees it;
- worker completion is detected by the runner-owned sentinel after real command exit, not by `[DONE]`/`[BLOCKED]`;
- prompts that mention `[DONE]` as instructional prose do not trigger false success;
- workers that emit no semantic token still resolve through the existing `unsignaled`/git-state fallback path;
- timeouts close the Herdr pane and do not wait on observer descendants that keep pipes open;
- observer failures surface as transport failures.

Proof:

- a configured executor with `adapter:"herdr-spawn"` routes through the adapter;
- Herdr starts a fresh pane and runs the intended command;
- Herdr does not write or decide fgOS task state;
- result handling still accepts structured output if present, then `[DONE]`/`[BLOCKED]`, then git-state inference.

Review verification:

- `node --test test/runner/herdr-spawn-adapter.test.mjs` - 20/20 pass.
- `node --test test/runner/egress-governance.test.mjs` - 6/6 pass.
- `node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs` - 401/401 pass.
- `git diff --check main...HEAD` - clean.
- Live timeout probes reject around 104-112ms instead of the earlier 1000-10000ms delayed failure shape.

## 15. Deferred Until A Consumer Exists

These remain part of the architecture target but are not part of the narrow slice:

- full AgentMessage envelope implementation;
- DispatchAssignment rename/migration from exec packet/ad-hoc task;
- artifact store V1;
- mailbox;
- protocol registry beyond the existing adapter registry;
- structured RESULT migration with confidence telemetry;
- ACK/PROGRESS/QUESTION/ANSWER/REVIEW/CANCEL message types.

Entry criteria to pull one of these forward:

- a production reader needs the data;
- Herdr/CLI usage shows fallback result quality is insufficient;
- multiple agents need async QUESTION/BLOCKER/ANSWER flow;
- artifact references are needed to avoid passing large data through conversation;
- provider compliance telemetry has a concrete dashboard/gate/report consumer.

## 16. Implementation Pointers

Current dispatch files:

- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/result-ladder.mjs` — confidence-ladder result normalization, extracted from `cli.mjs` by `tsk-2tr` (§17.2/§17.3), consumed by `src/report/dispatch-confidence.mjs`.
- `src/runner/dispatch.mjs`

Result-confidence reader (§10/§15 entry criterion pulled forward by `tsk-1g6`, §17.2/§17.3):

- `src/report/dispatch-confidence.mjs`
- wired into `bin/fgos.mjs` and `src/cli/command-registry.mjs`

Current prompt/protocol references:

- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/coding-worker-contract.md`
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`

Current focused tests for the narrow slice:

- `test/runner/dispatch.test.mjs`
- `test/runner/egress-governance.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`

Decision/history anchors:

- `docs/specs/runner.md` sections for Native-First Dispatch Doctrine and executor/capability rename;
- `docs/history/two-layer-dispatch/`;
- `docs/history/dispatch-concept-boundary/`;
- `docs/history/task-dispatch-unification/`.
- `docs/history/tsk-5x7/`.

## 17. Task Sets That Implemented This Plan (2026-08-25 → 2026-08-26)

Found by scanning git log on `src/runner/dispatch*` and this doc over the
last 2-3 days. Root item is `tsk-5x7`; everything else is a follow-on task
that either landed a deferred/reviewed piece of the design or fixed a
regression the redesign introduced.

### 17.1 `tsk-5x7` — Dispatch semantic control plane + Herdr-ready orchestration (root)

Plan: `docs/history/dispatch-plan-protocol-redesign/plan.md`. Split into
three dep-free children per D6 (2026-08-25):

- **`tsk-5x7-1`** — piece 0: fix `decide --for` to read `capabilities.prefer`,
  add minimal `DispatchPlan`, hoist the audit-event write.
  Plan: `docs/history/tsk-5x7-1/plan.md`. → §14.1 above.
- **`tsk-5x7-2`** — piece 1: declared-egress governance (replaces the
  `command !== claude` substring check).
  Plan: `docs/history/tsk-5x7-2/plan.md`. → §14.2 above.
- **`tsk-5x7-3`** — piece 2: `herdr-spawn` adapter, protocol untouched.
  Plan: `docs/history/tsk-5x7-3/plan.md`. → §14.3 above.

The root `tsk-5x7` branch then absorbed a long self-review/hardening pass
(governance-descriptor discard, shell-injection in the pane run, timeout
waiting on descendants, echo-stripping gaps, secret-env passthrough,
`plan.mjs`↔`cli.mjs` import cycle, whitespace hygiene) before merge —
commits `580fe09e` .. `76d8539d`, 2026-08-25 18:43–23:02. This doc's own
§14 status section and the "reviewed narrow implementation candidate"
framing in the header were written from that merged state
(`8e835dc1` / `ebdf69d5`, 2026-08-25 22:18 / 2026-08-26 13:20).

### 17.2 Follow-on task sets (2026-08-26), each pulling one §15 "deferred" item forward or fixing a redesign regression

| Task | Title | Plan doc | Relation to this design |
|---|---|---|---|
| `tsk-17m` | D0026 native-dispatch-doctrine narrative reconciliation | `docs/history/d0026-narrative-reconciliation/plan.md` | Doc-only; reconciles the Native-First Dispatch Doctrine narrative this plan depends on (§4.2, §6.3). |
| `tsk-5jl` | Generalize `herdr-spawn` executor adapter for live visibility (config-driven, correct result) | `docs/history/herdr-spawn-generalize-live-visibility/plan.md` | Extends §12.2's near-term Herdr adapter beyond the tsk-5x7-3 slice. |
| `tsk-10j` | agy-herdr interactive-mode redesign — real TUI visibility | `docs/history/herdr-spawn-agy-interactive-mode/plan.md` | Builds on the `herdr-spawn` adapter (§12.2) for the `agy` executor specifically. |
| `tsk-10n` | Herdr runtime boundary and orchestrator terminology | `docs/history/herdr-orchestrator-terminology-boundary/plan.md` | Landed as this doc's own §12.1a (Herdr Rust vocabulary is a separate namespace from §5.1's `orchestrator`). |
| `tsk-2tr` | Extract dispatch result normalization ladder | `docs/history/extract-dispatch-result-normalization-ladder/plan.md` | Refactors the §10 confidence-ladder result handling into a shared helper, ahead of tsk-1g6. |
| `tsk-1g6` | Dispatch result confidence — production reader | `docs/history/dispatch-result-confidence-reader/plan.md` | Pulls forward the §10/§15 "confidence telemetry needs a reader" entry criterion — first production consumer of result confidence, reusing tsk-2tr's ladder helper. |
| `tsk-2rr` | Fix false-idle polling race in `herdrSpawnInteractiveAdapter` | `docs/history/agy-herdr-false-idle-polling-race/plan.md` | Regression fix in the §12.2 Herdr adapter's idle/completion detection (decouple `done` from `sawWorking`, 3-poll debounce). |
| `tsk-by0` | Remove `herdr-spawn`'s non-interactive dispatch paths | `docs/history/herdr-spawn-remove-noninteractive-paths/plan.md` | Narrows §12.2's adapter to interactive-only after tsk-5jl/tsk-10j generalized it. |

Also same-window but only tangential to this doc: `tsk-2ii` (rename `agy`
executor id), `tsk-3vz` (flip `executors.agy-herdr` config default),
`tsk-1dd` (D0026 gap/duplicate check, mode tiny) — these touch dispatch
config/executors but don't implement a numbered item or §15 deferred entry
from this design.

### 17.3 Implementation Pointers Per Task Set

Real source/test files each task set actually touched (`git diff --stat`
per task's commit range), scoped to code — not the `docs/history/<task>/`
plan/research/iron-law-evidence files every task also writes. Doc-only
tasks are noted as such rather than listing their own plan doc again.

| Task | Files touched |
|---|---|
| `tsk-5x7-1` | none yet — piece lands its `decide --for`/`DispatchPlan` code in the root's later hardening pass below, not in its own commit range. |
| `tsk-5x7-2` | `docs/architecture-manifest.json` (registration only; governance code landed with the root). |
| `tsk-5x7-3` | none of its own — adapter code lands with the root's hardening pass below. |
| `tsk-5x7` (root hardening pass, `580fe09e..76d8539d`) | `src/runner/dispatch.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `src/runner/loop.mjs`, `test/runner/dispatch.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/loop.test.mjs` |
| `tsk-17m` | doc-only: `docs/specs/runner.md`, this doc's own header/status text — no source/test files. |
| `tsk-5jl` | `src/runner/dispatch/config.mjs`, `src/runner/dispatch/live-renderers/claude-stream-json.mjs` (new), `src/runner/dispatch/live-renderers/pi-agent-session.mjs` (new), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `docs/architecture-manifest.json`, `docs/enduser-docs-index.json` |
| `tsk-10j` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-10n` | doc-only: this doc's own §12.1a — no source/test files. |
| `tsk-2tr` | `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/result-ladder.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-1g6` | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/report/dispatch-confidence.mjs` (new), `test/runner/dispatch.test.mjs`, `docs/architecture-manifest.json` |
| `tsk-2rr` | `src/runner/dispatch/transport.mjs`, `test/runner/herdr-spawn-adapter.test.mjs` |
| `tsk-by0` | `src/runner/dispatch/transport.mjs` (shrunk), `test/runner/herdr-spawn-adapter.test.mjs` (shrunk), `CHANGELOG.md`, `docs/architecture-manifest.json` (entries removed); deleted `src/runner/dispatch/live-renderers/claude-stream-json.mjs` and `pi-agent-session.mjs` (the two live-renderer files `tsk-5jl` had added) |

Net effect on §16's file list: `src/runner/dispatch/result-ladder.mjs` and
`src/report/dispatch-confidence.mjs` are new files this window added and
belong in §16's pointer list; `src/runner/dispatch/live-renderers/` was
added by `tsk-5jl` and removed again by `tsk-by0` — it no longer exists on
`main` and should not be added to §16.

## 18. Broader Orchestration Vocabulary

This document defines the dispatch-control-plane slice: how one selected
target resolves to an executor, mechanism, governance decision, adapter, and
result signal.

For the broader orchestration map around this slice, including the distinction
between mission, work, workflow, assignment, dispatch, runtime, evidence, and
visibility, see `orchestration-vocabulary-map.md`.
