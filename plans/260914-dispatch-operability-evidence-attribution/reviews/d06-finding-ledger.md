# D06 Finding Ledger

| Finding | Severity | Source | Disposition | Owner | Recheck |
|---|---|---|---|---|---|
| SR-1 planned operation labels must not imply shipped behavior. | LOW | Standalone review | accepted | D06 promotion | Manifest and canonical docs use planned/proposed wording. |
| SR-2 external panel was waived by user override. | LOW | Standalone review | superseded | D06 record | Supplemental registered session `dispatch-operability-design-d06-panel-r2` ran later; original waiver preserved only as history. |
| SP-1 staged visibility/replay is not evidenced by artifact refs/context grants. | HIGH | Supplemental panel red-team `asgn_codex_lead_op_009` | accepted; repaired by limitation label | D06 evidence repair | Evidence manifest copies/hash-binds outputs; D06 no longer claims protocol-proven staged fan-in. Rechecked by hash and wording grep. |
| SP-2 conditional READY outruns the evidence state. | HIGH | Supplemental panel red-team `asgn_codex_lead_op_009` and lead explanation `asgn_codex_lead_op_010` | accepted; repaired | D06 closure | READY restored only after evidence/proof/metadata repairs. Rechecked by verification commands. |
| SP-3 Codex-only role separation lacks cross-provider independence. | MEDIUM | Supplemental panel red-team `asgn_codex_lead_op_009` | accepted; repaired by explicit limitation | D06 governance | Final record says Codex-only role-separated review, not cross-provider independent review. Rechecked by wording grep. |
| SP-4 assignment reports are mutable references, not evidence-bound artifacts. | MEDIUM | Supplemental panel red-team `asgn_codex_lead_op_009` | accepted; repaired | D06 evidence repair | Role outputs copied into track and SHA256-bound in `architecture-panel/evidence-manifest.sha256`. Rechecked with `sha256sum -c`. |
| SP-5 negative production-route proof does not cover indirect semantic recovery paths. | MEDIUM | Supplemental architecture critic `asgn_codex_lead_op_006` | accepted; repaired | D05 proof design / D06 recheck | D05 proof matrix now requires kill/retry/resume/reassign/admit/cancel/takeover and operation-catalog/dynamic-route refusals. Rechecked by grep. |
| SP-6 promotion/traceability/closure metadata disagree with NOT READY. | MEDIUM | Supplemental context audit/synthesis/explanation | accepted; repaired | D06 promotion | Plan, lock, manifest, handoff, traceability, and closeout now agree on READY-after-repair. Rechecked by status grep. |

Current verdict: `READY` as design authority only. No source/config/test changes
or Work lifecycle actions are authorized by this ledger.
