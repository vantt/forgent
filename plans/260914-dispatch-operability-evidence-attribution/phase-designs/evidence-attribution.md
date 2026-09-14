# D03 - Evidence Attribution

**Status:** design draft
**Owner:** Dispatch evidence evaluation

## Contract

Observation states what changed; attribution states how strongly evidence ties
that change to a Run; policy decides whether the round may be accepted. These
are separate dimensions.

```json
{
  "observation": {
    "scope": "main-checkout",
    "paths": ["docs/example.md"],
    "firstObserved": "post-run",
    "baselineState": "clean"
  },
  "attribution": {
    "level": "correlated",
    "subject": null,
    "basis": ["pre-post-git-snapshot"],
    "evidenceRefs": []
  },
  "policy": {
    "disposition": "refuse",
    "code": "outside-workspace-change-correlated"
  }
}
```

## Attribution Levels

| Level | Meaning |
|---|---|
| `proven` | Positive evidence binds the write/effect to this Run's resource incarnation |
| `correlated` | The change appeared during the Run window, but causation is unproven |
| `excluded` | Evidence proves the change predates the Run or belongs to another resource |
| `unattributed` | A change exists but cannot be related reliably |

Pre/post Git dirt is at most `correlated`. `proven` requires an adapter or
confinement backend with declared positive coverage. Absence of positive proof
never silently upgrades correlation.

## Policy Separation

Safety policy may refuse a correlated outside-workspace change. The RunResult
must still preserve completed execution, worker artifacts and substantive
review findings. A refusal must say ownership was unresolved, not accuse the
worker of writing the files.

```text
execution.completed + assessment.findings
+ attribution.correlated + policy.refuse
```

is valid and is not an execution crash.

## Initial Evidence Sources

- pre-launch and post-run Git snapshots;
- dirty-before content hashes where already captured;
- immutable Run/resource incarnation;
- adapter/confinement attestations that declare their coverage;
- concurrent invocation identifiers when available.

## Non-Goals

- No daemon, eBPF or fanotify dependency.
- No universal per-process filesystem authorship claim.
- No acceptance based solely on worker-provided evidence references.
- No weakening of fail-closed policy while attribution remains uncertain.

## Required Proof

- Pre-existing dirt is `excluded` from new-change evidence.
- Unrelated concurrent dirt is `correlated` or `unattributed`, never `proven`.
- Adapter-positive evidence can produce `proven` only within declared coverage.
- A policy refusal retains the worker's actual artifacts and assessment.
