# Scout: owner questions — asker, answer place, waking (2026-11-18)

This scout feeds Q11 in `docs/discussions/ops-metrics/QUESTIONS.md`. It was a read-only scan of the worktree `shape/ops-metrics` and the live main checkout.

## Where owner questions live today

| Store | Asker recorded | Asked-at | Answer |
|---|---|---|---|
| `fgos ask` / `fgos answer` (`src/cli/command-registry.mjs:769-815`, `src/state/store.mjs:1288`) | Partly: the event `writer` (Identity id, store.mjs:163), plus a `source` string. No role, plan/phase or pane. | Only the event timestamp. No `parkedAt` field, as the dashboard notes (`NeedsAnswer.tsx:30-33`). | The `answer` event on the work item. |
| `docs/discussions/*/QUESTIONS.md` rows (`src/portfolio/open-questions.mjs:25-39`) | No | No | The row is edited by hand. |
| Draft plan owner-questions section (`open-questions.mjs:63-69`) | No | No | The section is edited by hand. |
| Workflow gates (`src/workflow/store.mjs:337,345`, `case-runtime.mjs:251`) | No: the payload is `{stepId, question, header}`. | Only the ledger event. | `answeredAt` is recorded, with a round file and a `gate.answer` event. |
| Run `needs-human` attention rows (`attention-view.mjs:23`) | Run id only | Run timestamps | None. This is a stall signal, not a question. |
| AskUserQuestion hook (`src/state/decision-question.mjs`) | — | — | — It only validates the five parts. |
| `fgos questions --open` (`open-questions.mjs:98-115`) | — | — | A read-only union of discussion, plan and gate questions. `fgos ask` items are missing. |

The four stores use four key formats: `QUESTIONS.md#id`, `plan#owner-questions`, `workflow:<run>#<step>` and a work id.

## How answers reach the asker, and what can wake a session

**Head request socket** (`packages/run-supervisor/rust/src/head_request.rs`)
- It carries a head's verb requests to its supervisor.
- It is not a channel for owner answers.

**Rotation `answered.json`** (`src/session-rotation/rotate.mjs:112-133`)
- It is the successor's handshake.
- The executor polls it.

**Session Host** (`open/launch/alive/front/retire`)
- `front` brings a pane forward.
- It delivers no text.

**Terminal-control `send`** (`packages/terminal-control`, `core.rs:795`, `herdr.rs:753`)
- It types text into the pane of a held key and can submit it.
- It works only when an agent is the foreground process of that pane.
- It is the one existing piece that can wake an idle agent, but it needs the asker's pane key.

**Mailbox** (spec header: "on branch mailbox/v1-v3 only")
- Delivery is through the `Stop`/`PostToolUse` hook, with a nudge over the Claude Code socket or `codex queue`.
- The mailbox is deferred.

**Claude hooks in `.claude/settings.json`**
- `UserPromptSubmit` runs only local guardrails. It injects no fgOS state.

**Gateway dashboard** (`apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx`, MCP `answer_work` at `mcp.rs:309-321`)
- It lists and answers `fgos ask` items only.
- It has no gate, discussion or plan questions.

## What Identity can give a question

- A session can resolve its own identity in-process (`current::current_session`, `directory::resolve`, about 0.1 ms) or with `fgos identity session`. The result is a full id and a handle.
- A role exists only if the session registered one (`lead:`, `work:`, `head:<persona>-<name>`).
- Pane key, tab and plan/phase are not in Identity. The pane key lives in terminal-control and Session Host placement records.

## Gaps

1. No store records the asker's role, plan/phase or pane. Discussion, plan and gate questions record no asker at all.
2. No store has a first-class `askedAt`. Only gates have `answeredAt`.
3. There is no shared id or schema, so the asking session has no key to recognise its own answer.
4. The dashboard answers only `fgos ask` items.
5. No path takes an answer back to its asker. The existing pieces are terminal-control `send`, the hooks and the deferred mailbox.
6. A session without a registered role gets no role stamp. Pane key and plan/phase cannot be derived from Identity.
