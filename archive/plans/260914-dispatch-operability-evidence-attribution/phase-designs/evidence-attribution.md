# D03 - Evidence Attribution

**Status:** accepted design
**Owner:** Dispatch evidence evaluation
**Incident drivers:** INC-07, INC-09, INC-10, INC-18, INC-19, INC-20
**Decision drivers:** DOEA-02, DOEA-09, DOEA-12

## Separation Rule

Observation states what changed. Attribution states how strongly evidence ties
that change to a Run. Policy decides whether the round may be accepted. These
dimensions are independent and must be stored/read independently.

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

The above is valid: the policy refuses the round, but the attribution does not
accuse the worker of writing the file.

## Attribution Levels

| Level | Meaning | May identify a responsible Run | Typical basis |
|---|---|---|---|
| `proven` | Positive evidence binds the effect to this Run's resource incarnation and declared coverage. | yes | adapter/confinement attestation, signed launch/result binding, per-resource write log with coverage |
| `correlated` | The effect appeared during the Run window, but causation is unproven. | no | pre/post Git snapshot, dirty-after path, concurrent timing |
| `excluded` | Evidence proves the effect predates the Run or belongs to another resource. | no | dirty-before hash match, separate committed owner, resource incarnation mismatch |
| `unattributed` | A change exists but cannot be related reliably. | no | missing baseline, corrupt observer, unsupported adapter |

Pre/post Git dirt is at most `correlated`. `proven` requires positive coverage
declared by the observing adapter or confinement backend. Absence of contrary
evidence never upgrades correlation into proof.

## Evidence Sources

| Source | Maximum level by default | Notes |
|---|---|---|
| pre-launch Git status/path list | `excluded` for pre-existing dirt | It can prove "not new in this Run window" when content hash matches. |
| post-run Git status/path list | `correlated` | It proves timing, not authorship. |
| dirty-before content hashes | `excluded` | Hash equality excludes new-change attribution. |
| immutable Run/resource incarnation | `correlated` alone; `proven` with adapter support | Incarnation prevents stale PID confusion. |
| worker claim evidenceRefs | `correlated` | Worker-provided references are claims until independently validated. |
| adapter/confinement attestation | `proven` inside declared coverage only | Coverage must name what is observed and what is not. |
| concurrent invocation identifiers | `excluded` or `correlated` | Can separate known sibling owner only when both sides carry comparable identity. |

## Policy Separation

Safety policy may refuse a correlated outside-workspace change. The RunResult
must still preserve completed execution, worker artifacts, and substantive
review findings:

```text
execution.completed
+ assessment.findings
+ attribution.correlated
+ policy.refuse
```

This is not an execution crash. It is a completed execution whose acceptance is
refused because ownership is unresolved.

Policy outcomes:

| Policy disposition | Meaning |
|---|---|
| `allow` | Evidence satisfies the operation's acceptance policy. |
| `refuse` | Evidence is unsafe or contradictory; terminal result is preserved. |
| `needs-input` | A person or owning authority must decide because the design intentionally lacks enough authority. |
| `not-applicable` | No policy decision applies to this result kind. |

## Scenario Rules

| Scenario | Attribution | Policy |
|---|---|---|
| File dirty before launch and same hash after Run | `excluded` | Do not blame this Run; report pre-existing dirt. |
| File clean before launch, dirty after Run, no positive observer | `correlated` | May refuse if outside workspace or outside write scope. |
| Unrelated session dirties main checkout during review | `correlated` or `unattributed` for this Run | Preserve review findings; refuse only the unsafe policy dimension. |
| Adapter attests exact resource write inside declared workspace coverage | `proven` | Allow or refuse according to write-scope policy. |
| Provider limit interrupts after leased files changed but before claim | `unattributed` or `correlated` workspace observation | Preserve recoverable workspace observation; no false success. |
| Worker says tests passed but independent evidence contradicts it | worker claim `correlated`; independent evidence wins | Refuse false pass; keep claim as input evidence. |

## Negative Capabilities

- No filesystem-monitoring daemon is required.
- No eBPF, fanotify, or platform-specific kernel watcher dependency is required.
- No exact authorship is inferred from Git snapshots.
- No acceptance is based solely on worker-provided evidence references.
- No fail-open downgrade when attribution is uncertain.
- No claim that fgOS prevents provider limits, OOM, or unrelated concurrent
  workspace dirt.

## Required Proof

- Pre-existing dirt is `excluded` from new-change evidence.
- Unrelated concurrent dirt is `correlated` or `unattributed`, never `proven`.
- Adapter-positive evidence can produce `proven` only within declared coverage.
- A policy refusal retains the worker's actual artifacts and assessment.
- Worker claim contradiction is preserved and refused without erasing the claim.
