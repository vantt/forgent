# D02 - Inspection Surface And Routing

**Status:** accepted design
**Operation:** `dispatch.runtime.inspect`
**Effect:** read
**Owner:** Dispatch
**Incident drivers:** INC-01, INC-04, INC-15, INC-16, INC-17, INC-20
**Decision drivers:** DOEA-05, DOEA-06, DOEA-07, DOEA-08, DOEA-13

## Public Surface

The platform exposes one semantic read operation:

```text
dispatch.runtime.inspect
```

The CLI projection accepts exactly one typed selector:

```text
fgos dispatch inspect --run <runId>
fgos dispatch inspect --assignment <assignmentId>
fgos dispatch inspect --cwd <path>
```

Supplying zero selectors or more than one selector is a validation failure.
Selector values are Dispatch input, not Host Invocation Router input. REST,
chat, and future hosts may project the same semantic operation without shelling
out to the CLI.

## Host Routing Boundary

The Host Invocation Router sees:

```json
{
  "operationId": "dispatch.runtime.inspect",
  "effect": "read",
  "providerHint": null,
  "payload": {
    "selector": {"kind": "run", "id": "run_123"}
  }
}
```

The router may select a provider for `operationId` and effect. It must not:

- parse selector values;
- read Assignment, Run, CoordinationSession, or workspace state;
- choose between standalone and CoordinationSession recovery;
- infer whether a guard can be repaired;
- forward the call to a recovery operation.

Subject resolution belongs to Dispatch. Recovery authority discovery belongs to
Dispatch inspection as a read projection only.

## Selector Resolution

### Run Selector

The reader searches every registered Run repository layout that can own the id:
Assignment-owned runs, CoordinationSession-linked runs, and explicitly ad-hoc
dispatch runs.

| Matches | Inspection status | Behavior |
|---:|---|---|
| 0 | `not-found` | Return searched locations/classes; no recovery hint. |
| 1 | `resolved` or `partial` | Compose RunObservation and RunResult if present. |
| >1 | `ambiguous` | Return every candidate location and choose none. |

The reader collects matches before deciding. It must never use
first-directory-wins.

### Assignment Selector

Resolve the exact Assignment directory, then enumerate every historical Run.
The current Run is derived from admission and supersession facts, not numeric
attempt order.

| Condition | Result |
|---|---|
| no Assignment | `not-found` |
| Assignment with no Runs | subject resolves; `delivery = not-started` |
| exactly one current Run | inspect that Run plus history summary |
| multiple current Runs | `conflicting`, no recovery authority |
| corrupt admission/supersession facts | `partial` or `conflicting`, no mutation |

### Cwd Selector

Canonicalize the path, Git worktree root, and git-common-dir identity. The
reader returns an aggregate:

- cwd dispatch lock and holder identity, if any;
- all active Runs bound to the cwd;
- recent historical Runs and their terminal results;
- workspace dirt observations;
- guard/projection conflicts;
- owning recovery authority hints only when ownership is unique and complete.

Multiple active Runs are reported as facts. They become a conflict only when the
owning dispatch profile forbids that concurrency.

## Output Contract

```json
{
  "inspectionStatus": "resolved",
  "subject": {
    "kind": "run",
    "id": "run_123",
    "locations": []
  },
  "observations": [],
  "runObservation": null,
  "runResult": null,
  "recoveryAuthority": {
    "kind": "standalone-run",
    "id": "run_123",
    "observeCommand": "fgos dispatch recover run_123"
  },
  "reconciliation": {
    "state": "not-needed",
    "reason": "No stale local guard was observed."
  },
  "links": {
    "assignmentIds": [],
    "coordinationIds": [],
    "runIds": []
  }
}
```

Closed vocabularies:

| Field | Values |
|---|---|
| `inspectionStatus` | `resolved`, `partial`, `ambiguous`, `conflicting`, `not-found` |
| `recoveryAuthority.kind` | `standalone-run`, `coordination-session` |
| `reconciliation.state` | `not-needed`, `available`, `blocked`, `manual-required`, `unsupported` |

Recovery metadata is not a token, grant, lock, or authorization. It is omitted
when identity, ownership, or current authority is incomplete.

## Ports

Dispatch inspection composes read ports only:

| Port | Reads | Must not |
|---|---|---|
| `RunRepositoryPort` | Run directories, `run.json`, control/admission, terminal `result.json` | write result, settle, recover |
| `AssignmentRepositoryPort` | Assignment metadata, historical Run list, current admission facts | create Assignment or admit Run |
| `CoordinationReadPort` | session ownership, assignment refs, quorum/disposition facts | authorize, disposition, close, recover |
| `RuntimeResourceObservationPort` | PID/resource/incarnation/liveness facts declared by adapter profile | kill, signal, attach, retry |
| `WorkspaceEvidencePort` | Git/worktree/dirt snapshots and content hashes where available | reset, clean, add, commit |
| `DispatchGuardReadPort` | cwd locks, dispatch claims, projection markers | clear or rewrite guards |

The use case imports no adapter launch, recovery apply, process-control, or Git
mutation module. This is the structural read-only guarantee.

## Recovery Authority Hints

Inspection may say which existing door owns a follow-up:

| Owner | Hint shape |
|---|---|
| standalone Run | `fgos dispatch recover <runId>` |
| CoordinationSession-owned Run | `fgos coordination recover <coordinationId>` |
| ambiguous owner | no hint; include conflict facts |
| unsupported/corrupt owner | no hint; include manual-required reason |

Hints are generated only after subject ownership is unique. Inspection never
executes the hinted command.

## Negative Capabilities

- No unified recovery door.
- No `fgos recover <subject>` alias.
- No automatic inspect-to-recover forwarding.
- No mutation on lookup miss.
- No first-match selection for duplicate Run ids.
- No recovery hint when ownership is conflicting.
- No new Dispatch Operability component or state store.

## Required Proof

- CLI/host validation rejects zero or multiple selectors.
- Host routing test proves provider selection receives only
  `operationId/effect`, not selector ownership logic.
- Duplicate Run id fixture returns `ambiguous` with all candidates.
- Assignment fixture derives current Run from admission/supersession facts.
- Cwd fixture returns lock plus all active/history matches.
- Static import test proves inspect cannot call recovery apply, adapter launch,
  process kill, or Git mutation modules.
