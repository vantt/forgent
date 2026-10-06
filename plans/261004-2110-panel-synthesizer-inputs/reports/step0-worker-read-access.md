# Step 0: can a real worker read a sibling run's report under `.fgos`?

Date 2026-10-04. Unit: solo, read-only, objective = read one absolute path and report its first line and word count.

| Executor | Result |
|---|---|
| openai (herdr pane, read-only posture) | Read the file. First line and word count (363) match the real file exactly. |
| claude-herdr, two attempts | Not briefed both times: the pane showed a dialog waiting for an answer ("Enter to confirm · Esc to cancel"). No worker ran. Same executor ran fine 30 minutes earlier. |

Conclusion: read access to an absolute `.fgos/assignments/.../outbox/report-N.md` works for a real herdr worker, so
the contextRefs design stands for openai. Not shown for claude-herdr (blocked by the dialog, unrelated to read
access). The comment in `src/workflow/runner.mjs:31` ("`.fgos` is closed to workers") is not true for this path.

Open: what the claude-herdr dialog was (pane closed by the runner before it could be read). Separate infra item.
