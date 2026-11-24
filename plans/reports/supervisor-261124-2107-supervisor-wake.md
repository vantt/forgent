# Supervisor wake 2026-11-24 21:07

- Event `964ef4abe941b96c` (lead-ended, head:lead-forgent-261124-1433-author-636d2): plan 261124-1433-authority-declare-update is already `done`; the previous wake (commit 962c2b0e6) closed it with a board line, and backlog row p-2lpsdtxnrd is done. Marked handled.
- Admitted plan 261124-0004-heads-operate-without-owner (P1, the only admissible plan): status `running`, lead `head:lead-forgent-261124-0004-heads-1bb1c`, base `77d9cab4d` (commit 047d58aaa). The lead started and is live.
- Backlog: seven rows linked to that plan moved to in-flight, with the link marked (running) (commit 41478c03f).
- Running plans: only 261124-0004. Lanes 4/4 were free at admission and maxLeads is 3.
- Open owner question q-trgzaa34ua (who runs the gates for authority-declare-update) looks stale because that plan is done. The asker should cancel it; the supervisor never acks or cancels a question.
- Unreadable plans: 35 (missing frontmatter, unknown priority, or no phase table). They are older plans, and this wake did nothing about them.
