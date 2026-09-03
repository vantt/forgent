---
authoritative_for: coding-worker-contract.md shape, driver/worker split, worker return tokens, cross-provider proof-test history
---

# `coding-worker-contract.md` — shape and what proved it

`tsk-2uf-2` split `fgos-coding-implement` into a **driver** half (claim,
decide, dispatch, verify, return, Iron Law — stays exclusively the
claiming session's job) and a **worker** half, and pulled the worker half
out into its own shared fragment:
`.agents/skills/_shared/coding-worker-contract.md`. The point: in-process
execution (a live session doing the work itself) and out-of-process
execution (`agy`, `pi`, a named `claude` executor, …) now follow the exact
same contract, instead of the driver's own skill file quietly assuming
whoever reads it is the same session that claimed the item.

## Two layers, do not blend them

- **Layer 1 (generic — every unit, lifecycle-bearing or ephemeral):** you
  only execute, never decide; stay inside your declared boundary
  (`footprint` for a work item, `boundary` for an ad-hoc task); **cold-pickup
  refusal** — judge before starting whether what you were handed is
  actually enough, and if not, report `[BLOCKED] <exactly what's
  missing>` rather than guess; report through a fixed token
  (`[DONE]`/`[BLOCKED] <reason>`) — printing output and stopping with
  neither token is not a valid end state ("exiting is not signaling").
- **Layer 2 (coding-specific — lifecycle-bearing units only):** stay
  inside the one isolated worktree you were given; the item's own
  `verify` command is the only thing that decides completion — run it
  yourself, once, near the end, never weaken it; commit once on the
  item's own branch with the item id, then stop — never merge, push, tag,
  or approve your own work.

## The negative rule (V3)

**A worker never calls a state-writing `fgos` verb itself** — not
`return`, `discover`, `plan`, nor anything else that writes to `.fgos/`.
This closes the exact contradiction `tsk-2uf`'s own research found: the
dispatch prompt told a worker never to call `fgos`, while the file it
pointed to in the same breath told it to call `fgos return`. Advancing a
claimed item is exclusively the driver's job, downstream of a worker's own
`[DONE]`.

## Return channel is a floor, not a ceiling

The two-token vocabulary is the lowest common denominator for a
print-mode-only executor. An executor with a real structured channel
(upstream `pi`'s `--mode json`/`--mode rpc`, emitting `AgentSessionEvent`
JSONL) is not asked to downgrade to plain tokens — the contract never
hardcodes the channel shape, only the two recoverable outcomes
(done / blocked-with-reason).

## Cross-provider proof history (accumulated in the fragment itself)

The contract's provider-neutrality claim is not just asserted — every
dispatch since has logged its result directly into the fragment:

- **`tsk-47r` (GREEN, `pi`/`openai-codex`):** followed the contract
  natively through the same layered skill-pointer chain, correctly
  cold-pickup-refused an insufficient brief, and completed a real
  directive end-to-end with the exact token vocabulary.
- **`tsk-1jt` (RED, named `claude` executor):** read the contract and
  executed correctly, but could not complete Layer 2's commit step — the
  headless invocation's own `--allowedTools` config didn't grant Bash
  execution. Root-caused as a config gap, not a contract or comprehension
  failure.
- **`tsk-1dsr` (follow-up GREEN):** traced the RED result to a
  machine-local `PreToolUse` hook rewriting `git ...` to `rtk git ...`
  before the allowlist matched — widened `runner.executors.claude`'s
  allowlist to cover both forms, retested, full contract completed and
  independently confirmed via `git log`/`git show --stat`.
- **`tsk-5gd` (bug found and fixed):** a worker's `[DONE]` inside
  backtick-quoted prose (describing its own feature work, not signaling
  status) fooled the naive substring detector in `executeExecutorCli`.
  Fixed by stripping backtick-quoted spans before evaluating the token.

## Where to read the real thing

This page is a map, not a substitute — the fragment
(`.agents/skills/_shared/coding-worker-contract.md`) is the authoritative,
continuously-updated source; point a consuming `SKILL.md` at it by
relative path rather than restating its rules. `docs/history/dispatch-
activation-and-handoff-redesign/CONTEXT.md` carries the locked decisions
(D3/D4) this contract implements.
