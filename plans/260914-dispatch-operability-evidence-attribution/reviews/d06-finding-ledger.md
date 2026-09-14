# D06 Finding Ledger

| Finding | Severity | Source | Disposition | Owner | Recheck |
|---|---|---|---|---|---|
| SR-1 planned operation labels must not imply shipped behavior. | LOW | Standalone review | accepted | D06 promotion | Manifest and canonical docs use planned/proposed wording. |
| SR-2 external panel was waived by user override. | LOW | Standalone review | superseded | D06 record | Supplemental registered session `dispatch-operability-design-d06-panel-r2` ran later; original waiver preserved only as history. |
| SP-1 staged visibility/replay is not evidenced by artifact refs/context grants. | HIGH | Supplemental panel red-team `asgn_codex_lead_op_009` | accepted; blocks READY | D06 evidence repair | Needs immutable artifact refs/digests and lawful downstream grants, or explicit non-isolated procedure label. Not rechecked. |
| SP-2 conditional READY outruns the evidence state. | HIGH | Supplemental panel red-team `asgn_codex_lead_op_009` and lead explanation `asgn_codex_lead_op_010` | accepted; blocks READY | D06 closure | Current verdict changed to `NOT READY`. Not rechecked. |
| SP-3 Codex-only role separation lacks cross-provider independence. | MEDIUM | Supplemental panel red-team `asgn_codex_lead_op_009` | accepted; blocks any "independent/cross-provider" claim | D06 governance | Needs durable waiver/criterion change or genuinely independent review. Not rechecked. |
| SP-4 assignment reports are mutable references, not evidence-bound artifacts. | MEDIUM | Supplemental panel red-team `asgn_codex_lead_op_009` | accepted; blocks READY | D06 evidence repair | Needs report hash/revision binding before downstream reliance. Not rechecked. |
| SP-5 negative production-route proof does not cover indirect semantic recovery paths. | MEDIUM | Supplemental architecture critic `asgn_codex_lead_op_006` | accepted; blocks READY | D05 proof design / D06 recheck | Extend proof matrix for kill/retry/resume/reassign/admit/cancel/takeover through reconcile and host/CLI/operation catalog. Not rechecked. |
| SP-6 promotion/traceability/closure metadata disagree with NOT READY. | MEDIUM | Supplemental context audit/synthesis/explanation | accepted; partially repaired | D06 promotion | Canonical promotion paused and status docs updated here; full traceability/source-anchor repair remains unrechecked. |

Current verdict: `NOT READY`. HIGH and MEDIUM supplemental findings remain
unrechecked. No source/config/test changes or Work lifecycle actions are
authorized by this ledger.
