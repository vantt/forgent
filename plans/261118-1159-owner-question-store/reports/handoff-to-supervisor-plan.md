# Hand-off to plan 261118-1045-project-supervisor (owner-question boundary)

On 2026-11-18 the supervisor planner (session `plan-supervisor-b9`) agreed to the first four points below and recorded
them in local commit `31acf2896` on branch `plan/supervisor`. That commit had not been pushed when this note was
written. After the second red team of the owner-question plan (`cef0d83c7`), the following must hold in the
supervisor plan. The planner session had already closed, so this note is the delivery: whoever leads or edits that
plan reads it.

1. The supervisor plan lists `blockedBy: 261118-1159-owner-question-store`.
2. It lists questions with the bare `fgos questions`. The `--open` flag no longer exists.
3. The watcher reads `core/questions/definitions/question-answered.query.json`. Its rows carry `asker.machine`, and
   the watcher acts only on rows for its own machine.
4. When the asker is gone, the supervisor starts a successor **under the asker's own `head:` role**. There is no
   `answers:<id>` role, because Identity accepts only `lead:`, `work:` and `head:` roles. A session with the same
   head role may ack the question. For an asker that held no head role, any head may ack. The supervisor itself never
   acks or cancels.
5. Each watcher tick runs `fgos questions --json` once. That refreshes the per-machine view
   `.fgos/cache/questions.json`, which the receipt hook reads.
