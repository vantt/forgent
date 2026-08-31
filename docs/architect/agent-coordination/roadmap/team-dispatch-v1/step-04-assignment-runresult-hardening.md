# Step 04 - Assignment RunResult Evidence Hardening

Document type: Roadmap
Design status: Superseded
Superseded by: `../../architecture/evidence-and-results.md` and `../../contracts/assignment-run-runresult.md`
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: hardening history only
Original date: 2026-08-28
Scope: harden Assignment execution, worker result artifacts, evidence snapshots, confidence classification, and tests before the coding driver relies on Assignment results

## 1. Goal

Prevent Assignment runs from producing false success.

Current V1 can execute an Assignment and write run files. The next increment
must make the evidence contract strict enough that a driver can safely decide
what to do next.

The target invariant:

```txt
No Work lifecycle decision may be made from an Assignment RunResult unless the
RunResult has evidence produced during that run.
```

## 2. Current Implementation Baseline

Code already exists for:

- assignment id generation and Assignment builder;
- assignment prompt rendering;
- effective assignment policy resolution;
- `dispatch decide --assignment`;
- `dispatch execute --assignment`;
- `.fgos/assignments/<assignmentId>/runs/<attempt>/` storage;
- `run.json`, stdout/stderr logs, `exit.json`, `evidence.json`, and
  `result.json`;
- confidence labels: `verified`, `reported`, `inferred`, `no-evidence`,
  `failed`.

Known gaps:

- changed files are measured after the run, but dirty-before state is not
  subtracted;
- the worker is not told where to write `agent-result.json` or
  `agent-report.md`;
- `agent-result.json` has no strict schema;
- malformed structured output is treated as absent instead of invalid;
- read-only result artifacts are detected only in the run directory, but the
  run directory is not part of the prompt contract;
- fallback executors are stored in policy but not attempted;
- synthetic compatibility operations can be built as if runtime-ready.

## 3. Non-Goals

- Do not wire the coding driver to choose operations yet.
- Do not add mission lifecycle.
- Do not add a queue, scheduler, or `Job`.
- Do not make Herdr a truth source.
- Do not require all third-party agents to obey schema before the control plane
  can classify `no-evidence`.

## 4. Files To Touch

Expected code files:

- `src/runner/dispatch/assignment.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/assignment-policy.mjs` only if policy fields need minor
  threading
- `src/runner/dispatch/cli.mjs` only if CLI output or flags need to expose the
  run artifact directory

Expected tests:

- `test/runner/assignment.test.mjs`
- `test/runner/assignment-runresult.test.mjs`
- `test/runner/assignment-dispatch.test.mjs`

Expected docs:

- `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md`
- `docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md`

## 5. Implementation Tasks

### 5.1 Pass The Run Artifact Contract To The Worker

Before spawning the executor, compute:

```txt
runDir
agentResultPath = <runDir>/agent-result.json
agentReportPath = <runDir>/agent-report.md
```

The assignment prompt must include both paths. Keep paths concrete and
writeable from the worker's cwd. Prefer absolute paths in the runtime prompt to
avoid ambiguity across worktrees.

Prompt addition:

```txt
Result artifact:
- Write structured JSON to <absolute-run-dir>/agent-result.json
- Optional human-readable report: <absolute-run-dir>/agent-report.md
- Do not call Work lifecycle verbs unless the task-spec explicitly says this
  Assignment is the lifecycle driver.
```

Tests:

- `renderAssignmentPrompt` includes both result artifact paths when supplied.
- `executeAssignment` passes paths into prompt rendering.
- A fake executor can read the prompt and write the expected artifact.

### 5.2 Validate `agent-result.json`

Add a small validator near `assignment-runner.mjs` or in a sibling module if it
grows:

```js
validateAgentResultClaim(value)
```

Allowed statuses:

```txt
done
blocked
failed
no-evidence
```

Required common fields:

- `status`: allowed status string;
- `summary`: non-empty string.

Additional required fields:

- `blocked`: requires `blocker`, non-empty string;
- `failed`: requires `error`, non-empty string;
- `done`: requires at least one of:
  - non-empty `evidenceRefs`;
  - companion `agent-report.md` for read-only operation;
  - post-run changed files for mutating operation.

Malformed JSON or invalid schema must produce:

```json
{
  "status": "failed",
  "confidence": "failed"
}
```

It must not silently degrade to `no-evidence` if the worker attempted a
structured claim and got it wrong.

Tests:

- invalid JSON claim fails the run result;
- unknown status fails;
- missing summary fails;
- `blocked` without blocker fails;
- `failed` without error fails;
- valid read-only done with report is `reported`;
- valid mutating done without delta is `no-evidence`.

### 5.3 Snapshot Dirty State Before And After

Capture three states:

```txt
gitBefore
dirtyBefore
gitAfter
dirtyAfter
```

Post-run evidence files are:

```txt
newDirtyFiles = dirtyAfter - dirtyBefore
committedFiles = diff(gitBefore..gitAfter)
changedFiles = union(newDirtyFiles, committedFiles)
```

Do not count paths that were already dirty before the run. If a path was dirty
before and changed again during the run, V1 may conservatively classify it as
ambiguous rather than verified unless a future patch records file hashes.

Recommended Step 04 behavior:

```txt
dirty-before path still dirty after run -> not evidence
clean-before path dirty after run       -> evidence
HEAD advanced                           -> committed diff evidence
```

Tests:

- a pre-existing dirty file does not produce `verified` or `inferred`;
- a new dirty file produced by the fake executor is evidence;
- a committed file between `gitBefore` and `gitAfter` is evidence;
- `.fgos/` internal files are excluded.

### 5.4 Distinguish Read-Only And Mutating Operations

V1 can infer read-only from role as a fallback, but role alone is not enough.

Add a small helper:

```js
isReadOnlyAssignment(assignment)
```

Initial rule:

```txt
reviewer/researcher/advisor => read-only unless operation id is explicitly
known mutating
implementer/helper          => mutating unless taskSpec/operation declares
read-only later
```

Do not add a broad YAML schema field unless Step 04 actually needs it. If a
field is added, use a narrow `effects: read-only | mutates-repo` operation hint
and validate it in doctor.

Tests:

- `validate-plan`, `review-item`, `scout-blast-radius`, `resolve-question`
  classify read-only;
- `implement-item`, `fix-verify-red`, `scoped-subtask` classify mutating.

### 5.5 Store Evidence With Provenance

`evidence.json` should record not just `changedFiles`, but why each file counts.

Suggested shape:

```json
{
  "gitBefore": "abc",
  "gitAfter": "def",
  "dirtyBefore": ["preexisting.md"],
  "dirtyAfter": ["preexisting.md", "new.md"],
  "changedFiles": ["new.md"],
  "changedFileReasons": {
    "new.md": "new-dirty-after-run"
  },
  "artifacts": [
    {
      "path": ".fgos/assignments/asgn_x/runs/01/agent-result.json",
      "kind": "agent-result",
      "valid": true
    }
  ],
  "tests": []
}
```

Keep `changedFiles` for compatibility. Add richer fields beside it.

### 5.6 Refuse Runtime Dispatch For Non-Resolving TaskSpec

`buildAssignment()` should reject runtime-ready assignments whose taskSpec file
does not exist.

Compatibility requirement:

- `operationsForStage()` may still synthesize read-only compatibility
  operations.
- `buildAssignment()` must not turn a synthetic missing-taskSpec operation into
  a dispatchable assignment by accident.

Implementation options:

1. Check `resolveTaskSpecPath()` in `buildAssignment()` and throw if missing.
2. Or add an option `allowSyntheticCompatibilityOperation: true` and default it
   to false.

Preferred: option 1 for V1, because runtime dispatch should be conservative.

Tests:

- `buildAssignment({ stage: 'decompose', operation: 'decompose' })` refuses
  until a real task-spec exists.
- existing declared operations still build.

### 5.7 Preserve Existing Work Path

No changes to `spawnWorker()` or `loop.mjs` should be required. Existing
`stage.skill/taskSpec` dispatch path must stay green.

Regression tests to run:

```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/loop.test.mjs
node --test test/cli/fgos-workflow.test.mjs
```

## 6. Acceptance Criteria

Step 04 is done when:

- assignment prompt names concrete result artifact paths;
- fake executor can write a valid `agent-result.json` and get `reported`;
- malformed `agent-result.json` produces failed RunResult;
- dirty-before files do not count as run evidence;
- new post-run dirty files or committed diffs count as evidence;
- mutating assignment cannot be `verified` without post-run external evidence;
- read-only assignment cannot be `reported` without a valid claim and artifact;
- missing task-spec assignment is refused before spawn;
- existing Work dispatch tests still pass.

## 7. Manual Smoke Scenario

Create a temporary assignment for `planning.validate-plan` attached to an
existing planning-stage Work item.

Expected:

1. `assignment.json` is written.
2. `run.json` is written before spawn.
3. Worker prompt contains `agent-result.json` path.
4. Fake or real worker writes `agent-result.json`.
5. `result.json` returns `status: done`, `confidence: reported` only for a
   valid read-only report.
6. If the worker exits zero but writes nothing, `result.json` returns
   `status: no-evidence`, `confidence: no-evidence`.

## 8. Rollback

Rollback only the Step 04 hardening helpers and tests. Keep Step 01-03
Assignment surfaces, because they remain useful as read-only and fake-executor
validated infrastructure.
