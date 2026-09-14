# D06 Red-Team

**Status:** superseded by supplemental panel

This inline red-team pass was produced before the registered supplemental
architecture panel `dispatch-operability-design-d06-panel-r2`. It remains
useful as a design attack checklist, but its `READY` conclusion is superseded by
the supplemental panel red-team verdict `REVISE`.

## Attacks

| Attack | Result |
|---|---|
| Make `ProviderOutcome` a hidden terminal authority. | Failed: D01 limits it to host invocation response. |
| Use `inspect` to clear a stale lock automatically. | Failed: D02 exposes hints only; D04 owns apply. |
| Use `reconcile` to retry a Run. | Failed: D04 explicit refusals cover retry/resume/reassign/admit. |
| Treat unrelated main-checkout dirt as proven reviewer leakage. | Failed: D03 caps Git snapshots at correlation. |
| Close implementation with direct unit tests only. | Failed: D05 production-door rule blocks it. |
| Hide unsupported capabilities by omission. | Failed: D02-D05 list negative capabilities symmetrically. |

## Residual Risk

The largest residual risk is not product ambiguity; it is implementation
discipline. The future track must keep the D05 proof matrix intact and resist
shrinking it into pure evaluator tests.

## Conclusion

Superseded. Current D06 status is `NOT READY — documentation/evidence repair
required`; see `architecture-panel/supplemental-panel-report.md` and
`reviews/d06-finding-ledger.md`.
