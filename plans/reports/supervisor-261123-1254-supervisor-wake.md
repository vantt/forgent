# Supervisor wake, 2026-11-23 12:54

## Queue
- a07ffd41a16f115d, 718b982730fcf733 `question-answered` (q-klz3vkxjee, q-75yeaifwzn; successor head:lead-forgent-261121-2110-compon-e8af7). The lead is live and busy, so its hooks show the answers. Handled. Both questions are the asker's to ack or cancel.
- 2c221b895fef4b61 `session-idle` names lead:SUPERVISOR (forgent-a3), which is not a lead. Handled.
- fbeea80bf38c14aa `coordination-help` says release sha256:df57ddfc is active and asks for a Miu rotation. Miu's pane holds an unsent input ("Báo cáo tiến độ các plan đang chạy"), and rotating now would drop it. Deferred: I raised a5431fea05d98f40 and closed it with the deferral recorded. I messaged lead:SUPERVISOR (msg aa6bb1dc) to submit or clear the input. Next wake: rotate `secretary --name miu` once she is idle.

## Admission
- Live leads: 4; cap: 2. No admission. 261123-0828-head-stop-rotation-bad-measure stays `ready` and admissible.

## Running plans
- 261121-2110-component-authority-doors: the lead found that 243074c37 added the envelope version vector only to the phase table. The run door reads the frontmatter `footprint:`. Landed 1bf6a1d7a: the vector joins the frontmatter footprint, within the frame already decided. The commit also carries the relayed owner addition (model path `.fgos/authority/model/` outside fgOS), which sat uncommitted in plan.md and phase-05. The plan contract check passes. The lead is busy.
- 261122-0118-heads-stable-and-able: the lead is busy landing the phase 3 gate-restore record (0dd71aa83 is on main).
- 261123-0726-contract-check-in-confined-heads: the lead was idle since 11:15. Wait (2), the gate restore, is over. Raised 765e94c2c742d689, typed the wait check and submitted it. The lead is working again, so the event is handled. Wait (1), the full trunk `npm test`, is still with lead:SUPERVISOR.
- 261123-0821-runner-recheck-replays-account-view: the lead is polling the phase 2 unit c-84280-1795413023678. Progressing.

## Note
- The `session type` text did not submit by itself. A second `--text $'\r'` submitted it.
