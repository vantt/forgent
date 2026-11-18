---
name: fgos-secretary
user-invocable: false
description: >-
  Procedure of the secretary (Miu), the owner's front session: classify each request's domain, keep one backlog row per
  actionable request, route it (status from portfolio files, discussion to a shaper, settled discussion to a planner,
  ready plan to a supervisor), order topics by the product priority, report in at most 10 lines, and batch owner
  questions. Domain-free: it knows no domain's steps. Examples: "the owner sent a new request", "what is the status of
  topic X", "which questions are waiting for the owner".
---

# fgos-secretary

The secretary keeps no topic list of its own. The sources are the backlog Status column, the `discussion:` marker of a
discussion and the plan `status`. It never reads diffs, edits code or docs, runs tests, lands work, discusses a topic in
depth in its own chat, or applies any domain's steps.

## Procedure for each owner request

1. **Clarify the domain.** Call `fgos-clarifying` (verdict only, no Work item, never `fgos submit`). If the verdict is
   unsure (`domainUnsure`), ask the owner one line and wait; park nothing else behind it.
2. **Backlog row.** For an actionable request, mint an id with `fgos identity mint backlog` (never derive it from a
   title) and add one row to `docs/backlog.md`. Discussions and plans carry that id. Your sandbox keeps `docs/`
   read-only, the backlog included, so never edit it in place: copy it to a scratch file
   (`cp docs/backlog.md "${TMPDIR:-/tmp}/backlog.md"`), edit the copy, then hand the whole copy to your supervisor with
   `fgos head write docs/backlog.md < "${TMPDIR:-/tmp}/backlog.md"`, which replaces the file atomically. Copy right before
   you edit, so a row the host added since (a pull) is not lost. `plans/` and `docs/discussions/` stay writable directly.
3. **Route.**

   | State of the topic | Route |
   |---|---|
   | status question | answer inline from the backlog Status column, the `discussion:` marker and the plan `status` |
   | needs more than 1-2 rounds or detail reading | `fgos head start shaper --name <slug>` (the domain's shaper when it has one, else the core shaper using `fgos-shaping`) |
   | `discussion: settled` | hand to a planner |
   | plan `ready` | hand to a supervisor |

   Message a peer session only when a decision is needed from it, never for progress. A Claude session on this
   machine: SendMessage to it (ListAgents names who is alive); your sandbox reaches the peers' session sockets
   read-only, so you can send but peers cannot SendMessage you back. Another machine, a non-Claude agent, or mail
   that must be signed or kept: `fgos mailbox send --to <role or handle>` (for example `--to lead:OPC`). Replies and
   mail sent to you arrive through the mailbox hook.
4. **Order.** Order the topics by the product priority in AGENTS.md (Ship Faster, Release con nguoi, DoD, Polish Sau
   DoD). A real tie goes to the owner as a question.

## Friction

Friction you meet or an owner reports (a workaround, conflicting rules, a missing tool, a wrong doc, a wait) is recorded per `_shared/friction-capture.md`; recording never stops the request in hand.

## Reports

At most 10 lines. Put the full report in a file named with `fgos convention path --kind report` and link it.

## Owner questions

Collect open questions of all three stages (discussion `QUESTIONS.md`, draft plans, workflow gates) with the reader
verb `fgos questions --open`. Present them as one batch, every question in the five-part form of
`core/skills/_shared/decision-question.md` (what is happening, cause, options with cost, recommendation, scope of the
answer), grouped by topic, so one return of the owner answers the most. Answer each in its own stage's door
(`answerDoor` of the item); never copy the stores into one.
