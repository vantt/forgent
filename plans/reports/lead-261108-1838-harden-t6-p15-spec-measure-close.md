# HARDEN T6 phase lead report: spec, measure, close

Full numbers, acceptance table and the ideas for the owner are in the [closing report](closing-261108-1838-harden-t6-workflow.md); this file lists the items the earlier phases owed to this one and how each closed.

| Owed by | Item | Result |
|---|---|---|
| P01 | Guide tells other machines to declare `capabilities.code:implement.verify` | Done: guide block "Đổi lớn: `fgos workflow gate` không còn `--verify`". No config edited. |
| P04 | On-host smoke of the case runtime and doctor rows | Done: council-lite run left no `reservations/` directory, `workflow-case-bindings` pass, 111 doctor rows. The settled-before-release race stays a separate open item (closing report). |
| P05 | `--units` launch failure then `resume` reruns it | Done live (`PATH` without the agent CLIs gave `execution-failure`, resume ended `completed / pass`). |
| P05 | Verdict refused on resume | **Not smoked live** (needs a policy refusal the machine config cannot produce); owned by `workflow-runner-resume.test.mjs`. |
| P05 | `workflow status` shows account rows | Done for `--seats` runs (one row per seat, `account` null when unpinned); other runs print no block by design. |
| P05 | Playbook runner files 1325 vs 1300 | Now 1 309 (9 over). Reported, not reduced: no pure simplification proven. |
| P11 | `council-lite` detached, then `status` | Done: started detached, status showed `running`, ended `completed / pass`. |
| P12 | Prune dry run to forgent-6a before `--apply` | Done (message sent; empty tree). One `--apply --older-than 0d` after the coordinator's go: deleted only my own smoke case and its Unit run (assignments 18 302 788 -> 8 618 110 bytes), the 3 plain Unit runs stayed. |
| P12 | Real-tree cost and plain-run share (Q-3) | **Unmeasured**: history was wiped by the incident; 3 plain runs, 0 cases existed. Synthetic tree numbers only. |
| P12 | Review `case-close.mjs` +255 vs +130 | Kept (eight keep reasons and re-checks are red-tested rules). One duplicate helper now imported. |
| COOK | Resume rule text in `coordination-driver.md` (main `eddb2ad14`) vs decision 71 4a | Matches. |
| plan | Re-measure acceptance numbers | Done; table in the closing report. |
| plan | Specs, HARDEN plan row | Done (workflow spec rules RUL-WF-34 to 41, section 9, section 17; component boundary; lock registry note; backlog; HARDEN plan row 06b, layer row left open for forgent-6a). |
| plan | Vietnamese guide | Done: every phase, `--verify`, activation caution, prune dry run before `--apply`, auto-prune warning, rollback table. |
| plan | Owner ideas in one section | Done: eleven ideas in the closing report, each with reason and benefit. |

Gate run in the worktree: focused set (doc health, citation drift, registry contract, seat-binding dry bind, architecture, command registry and help, case-verbs, case-close) 178 and 124 tests green; one-door scan 0 undeclared.

Status: DONE_WITH_CONCERNS
Summary: Spec, guide, measurements and closing report are done; the layer's size acceptance is not met (Node +10, tests +610, four budgets over) and two live smokes have gaps (verdict refusal on resume, real-tree prune cost).
Concerns/Blockers: size gate needs the owner's call; DOC ack is not awaited by decision.
