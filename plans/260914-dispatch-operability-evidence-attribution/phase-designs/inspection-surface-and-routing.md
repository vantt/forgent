# D02 - Inspection Surface And Routing

**Status:** design draft
**Operation:** `dispatch.runtime.inspect`
**Effect:** read
**Owner:** Dispatch

## Public Surface

The CLI projects one public door with exactly one typed selector:

```text
fgos dispatch inspect --run <runId>
fgos dispatch inspect --assignment <assignmentId>
fgos dispatch inspect --cwd <path>
```

Supplying zero or multiple selectors is validation failure. REST and chat hosts
may project the same semantic operation without calling the CLI.

The Host Invocation Router selects a provider for
`dispatch.runtime.inspect`. It never examines selector values, reads domain
state or chooses a recovery authority. Resource resolution belongs to the
Dispatch inspection use case.

## Selector Resolution

### Run

- Zero matches: `not-found`.
- One match: inspect it.
- More than one match: `identity-conflict`; return every location and choose
  none.

Both Assignment-owned and ad-hoc dispatch Run layouts are searched. A reader
must collect matches rather than return the first directory encountered.

### Assignment

Resolve the exact Assignment directory, list every historical Run, and derive
the current Run only from admission/supersession facts. The numerically latest
attempt is not authority. No Runs is valid `not-dispatched`; multiple current
Runs is `authority-conflict`.

### Cwd

Canonicalize the path and its Git worktree/common identity. Return an aggregate
containing the cwd dispatch lock, all active Runs, relevant history and
conflicts. Multiple active Runs are reported, and are a conflict only where the
owning dispatch profile forbids that concurrency. JSON is complete; a human
presenter may summarize without discarding links to the full set.

## Output

```json
{
  "inspectionStatus": "resolved | partial | ambiguous | conflicting | not-found",
  "subject": {},
  "observations": [],
  "runResult": null,
  "recoveryAuthority": {
    "kind": "standalone-run | coordination-session",
    "id": "...",
    "observeCommand": "..."
  },
  "reconciliation": {
    "state": "not-needed | available | blocked | manual-required | unsupported",
    "reason": "..."
  }
}
```

Recovery metadata is a read projection, not a token or authorization. It is
omitted when ownership is conflicting or incomplete. Inspection never accepts
`--action` and has no imports capable of contacting an adapter or mutating
state.

## Ports

- `RunRepositoryPort`
- `AssignmentRepositoryPort`
- `CoordinationReadPort`
- `RuntimeResourceObservationPort`
- `WorkspaceEvidencePort`
- `DispatchGuardReadPort`

Adapters gather facts. Pure evaluators derive liveness, completeness,
attribution and legal hints. Adapters do not declare semantic success.

## Non-Goals

- No unified recovery door.
- No automatic forwarding to `dispatch recover` or `coordination recover`.
- No mutation based on a lookup miss.
- No new operability component or state store.
