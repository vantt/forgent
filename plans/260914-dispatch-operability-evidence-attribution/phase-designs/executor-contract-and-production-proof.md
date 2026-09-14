# D05 - Executor Contract And Production Proof

**Status:** design draft
**Owner:** Dispatch contract compiler and Run Result Evaluation

## Worker Claim

`agent-result.json` is a worker claim, never independent evidence and never the
RunResult itself.

```json
{
  "contract": {"id": "agent-result-claim", "version": 2},
  "status": "done | blocked | failed | no-evidence",
  "summary": "...",
  "blocker": null,
  "error": null,
  "assessment": {
    "verdict": "pass | findings | inconclusive | not-applicable"
  },
  "evidenceRefs": []
}
```

`blocked` requires `blocker`; `failed` requires `error`; reviewer/red-team
operations require an assessment verdict. Prompt text and validation derive
from one contract definition.

## Effective Execution Contract

Before launch, persist a secret-free projection of the effective contract:

```json
{
  "mutation": "read-only | mutating",
  "workspace": {"cwd": "...", "writeScope": []},
  "tools": {
    "shell": {"mode": "restricted", "allowedCommands": ["git add", "git commit"]}
  },
  "limits": {
    "executorTimeoutMs": 2100000,
    "sessionWallTimeExpiresAt": "..."
  },
  "resultClaim": {
    "contract": {"id": "agent-result-claim", "version": 2},
    "path": "..."
  },
  "provenance": {}
}
```

This may be a projection of the immutable DispatchPlan/launch envelope rather
than a new entity. It must be persisted before launch, rendered into the
worker brief, returned by inspection and traceable to resolved config/policy.
It never contains secrets or claims a permission that confinement does not
enforce.

## Production-Door Rule

Unit tests for pure evaluators are necessary but insufficient. Each committed
capability needs a proof following the real path:

```text
config or Assignment -> DispatchPlan -> Confinement Authority
-> selected adapter -> worker claim -> RunResult normalizer
-> result.json -> dispatch inspect
```

Required scenarios:

| Scenario | Required starting door | Required observation |
|---|---|---|
| Reviewer reports HIGH findings | Coordination operation | completed execution plus findings assessment |
| Invalid blocked claim | Assignment dispatch | typed contract failure and preserved artifacts |
| Executor timeout/crash | Dispatch production door | distinct failure family and evidence |
| Same task replay | Coordination run | replay delivery mode; no claimed new execution |
| Concurrent outside dirt | Real isolated-worktree dispatch | correlation without false attribution |
| Dead guard | Inspect then reconcile apply | CAS single winner and no TTL deletion |
| Config field forwarding | Config through selected adapter | test fails if the field is dropped |
| Historical RunResult | Inspect legacy result | `legacy-derived`; bytes unchanged |

## Non-Goals

- No universal executor tool surface.
- No guarantee that prose alone enforces permissions.
- No automatic command generation for the worker.
- No full-suite run inside every worker.
- No conflation of executor timeout with session wall-time.
