---
authoritative_for: pi executor runtime capacity, why pi was added as a second executor, pi anthropic account usage cap finding
---

# Why `pi` was registered as a runtime capacity, not just another provider

`tsk-47r` registered `pi` (`@earendil-works/pi-coding-agent`) as a second
`agent`-kind executor. The framing matters: `pi` isn't "one more provider
in the list" — it's the first provider that can satisfy three things
fgOS's dispatch design had already locked in (`tsk-2uf`) but had no
working executor for:

1. **Loads fgOS's worker contract natively, no translation.** `pi` reads
   project skills from `.agents/skills/`, walking up to git root, and
   explicitly supports pulling in Claude Code or OpenAI Codex skill
   directories unmodified via its own `settings.json` — no format
   conversion step.
2. **Accepts a capability allowlist via CLI flag.** `pi --tools
   read,grep,find,ls -p "..."` enforces the boundary at the process level,
   not through a prompt's prose — the same "boundary enforced by
   capability" principle the worker contract was written around but that
   `agy` could only approximate with a denylist (see
   `docs/explanation/agy-permission-denylist-not-allowlist.md`).
3. **Emits a structured return channel.** `--mode json` streams
   `AgentSessionEvent` JSONL instead of leaving a caller to grep for a
   token inside free-form prose.

So registering `pi` "injects capability" into the existing design rather
than changing it: the dispatch unit is still a work item or ad-hoc task,
the worker contract is still one contract — only the runtime underneath
gained capabilities `agy` doesn't have.

## The D4 proof test's real result lives in the worker-contract doc

`tsk-47r`'s dispatched-against-a-disposable-item proof run (does `pi`
actually follow `.agents/skills/_shared/coding-worker-contract.md`?) came
back GREEN — full detail already captured in
`docs/reference/coding-worker-contract-shape.md`'s cross-provider proof
history section, not repeated here.

## A finding worth keeping separate: `pi --provider anthropic` hit an account-level usage cap, not a contract failure

Before the GREEN result (which used `--provider openai-codex --model
gpt-5.5`), an earlier attempt through `--provider anthropic` came back
**BLOCKED, not RED** — a distinct verdict worth keeping distinct from
"the contract failed":

- Two attempts, `claude-opus-4-8` then `claude-sonnet-5` (ruling out a
  model-tier-specific gate) — both returned `exit 0` with the correct
  10-event `AgentSessionEvent` shape, but the assistant turn itself
  errored: `400 ... "You're out of extra usage. Add more at
  claude.ai/settings/usage and keep going."` Zero tool calls in either
  stream — the model never got a turn to even read the skill file.
- Root cause, confirmed not guessed: `pi --provider anthropic` draws on
  the *same* Claude subscription/OAuth token the operating session's own
  login used — an account-level usage cap, not a `pi`-mechanism defect
  and not a worker-contract defect. At the time of this run, ~30+
  concurrently active driver/angle agent worktrees existed against the
  same repo, almost certainly sharing the same account's usage pool.

**Why this matters for a future dispatcher:** a `pi --provider anthropic`
dispatch failing with a 400 "out of extra usage" error is not evidence the
worker contract or `pi` mechanism is broken — it's an account-level
capacity signal, resolved here by switching provider (`openai-codex`) for
the actual proof run, not by debugging `pi` further. If `anthropic` is the
desired provider for a future dispatch, check account usage headroom
first, especially under heavy concurrent-agent load.

## Where the config landed

`PI_EXECUTOR_DEFAULT` (`src/setup/registrations.mjs`) — see
`docs/reference/runner-capabilities-advise-execute-slots.md`'s own
"Related: `pi` as the second executor" section for the exact shape and
where it's wired into the shared `runner` config-default.
