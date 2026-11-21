# Supervisor wake 2026-11-21 14:39

## Queue
- `8cb110ed5f09321a` session-idle (ref `3bc0ebcb-…`): handled, no action needed.

## Portfolio
- Open owner questions: none.
- Admissible plans: none (leadsLive 3/4, lanes free 3).

## Running plans
| Plan | Lead | State on screen |
|---|---|---|
| 261118-1341-s6a-execution-tier-rust | lead:S6A | Idle on purpose: phases 20–22 wait for the Windows custody plan (commit 601247a6b). It resumes when lead:WINCUSTODY reports its land commit and CI id. |
| 261120-0625-work-data-model | head:lead-forgent-261120-0625-work-d-ce9f6 | Busy: a formatting unit is running, and it lands again after the unit commits. |
| 261121-1309-git-windows-custody | lead:WINCUSTODY | Busy: rebasing phases 2, 3, 4 and 6 onto phase 1 and starting their CI runs. |

## Note
- `fgos session read head:lead-<headName>` cannot find the S6A and WINCUSTODY leads. Those two plans name their lead `lead:<ID>` in the frontmatter, so they can only be reached by that name. The `headName` that `supervisor plans` reports does not resolve for them.
