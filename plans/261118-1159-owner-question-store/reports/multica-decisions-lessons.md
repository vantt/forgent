# Lessons from the fork vantt/multica ("decision" feature)

Read 2026-11-18 from the fork, which is 44 commits ahead of `multica-ai/multica`, all of them `vantt:` patches.

The sources:
- `vantt/patches/0004-decisions.spec.md` and `.patch`: `server/internal/handler/vantt_decision.go`, migrations
  9007 and 9008, the CLI `vantt_cmd_issue_decision.go` and the web `DecisionPanel`.
- `vantt/patches/0006-inbox.spec.md`.
- `vantt/plans/phase-07-decisions.md`.
- Commits `3df3e309` (the answer mentions the asker so the asker wakes), `53156a17`, `728cb5fd`, `d8815254`
  (Telegram push), `8931b6c0`, `eb0f346d` (inbox split) and `d24529d0`.

## What it is

The table is `issue_decision`. Each row holds:
- `question`;
- `options`, 2 to 8 entries of `{id, label, description, recommended?}`, with at most one recommended;
- `due_date`;
- `asked_by_type` and `asked_by_id`, filled from the task token;
- `answer_option_id`, `answer_note`, `answered_by` and `answered_at`;
- a status of `open`, `answered` or `cancelled`, enforced by a CHECK.

How it works:
- **Ask.** The agent runs `multica issue ask <issue> --question … --option "A" --option "B|why" --recommended B`.
  The CLI validates the input before sending it, and the server validates it again.
- **Inbox.** Each new decision raises an `action_required` inbox item for the issue's member subscribers, never for
  the asker.
- **Answer.** Only a person can answer; an agent gets 403. An option outside the list gets 400, and a decision that
  is not open gets 409, which is how answer-once is enforced. The answer is a choice plus an optional note. The web
  panel preselects the recommended option, and a Telegram inline button answers and then removes the buttons.
- **Wake.** The answer is posted as an issue comment that ends with an @mention of the asker agent, and the existing
  mention trigger enqueues the agent. This was fixed after a live miss in `3df3e309`. Nothing resumes an agent that
  is gone.
- **Cancel.** `cancel` is used for real. `due_date` is never acted on, and there is no batching or dedupe.

## Taken into the plan

- QP-15: a `cancelled` record and `--supersedes`.
- QP-16: only the owner answers, and the secretary may relay for the owner.
- QP-17: a `recommended` flag on an option and an answer that is a choice and/or free text, with the recommended
  option preselected in S04.
- QP-18: the answer, the hook line and the list name the asker, and the list shows a "needs you" count.

## Not taken

- The due date, because it is never acted on.
- The 2-8 option cap, because the template says 2-4.
- Waking by posting a comment, because fgOS has its own hook and supervisor.
- A SQL table.
- Telegram buttons, because push channels are deferred.
