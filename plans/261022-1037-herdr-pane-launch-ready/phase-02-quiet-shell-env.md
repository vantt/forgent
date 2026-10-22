# Phase 2: Quiet shell env at allocation

Capability: `execute`. Depends on: phase 1 (same files, serial). Effort 1.5h. Plan: [plan.md](plan.md) (Decision 6).

## Context

`AllocateRequest.env` already reaches `herdr tab create/pane split/workspace create --env` (`core.rs:278,283`, `driver/herdr.rs:440-474`) via `env_pairs` (`core.rs:722`): the one door for env at pane creation.

## Requirements

<!-- Updated: Red Team 2026-10-22 -->
- `env_pairs` (or its single call path) merges a core-owned default `DISABLE_AUTO_UPDATE=true` into the env of every pane the core creates; a key the request already sets wins.
- Only `DISABLE_AUTO_UPDATE`. Never `DISABLE_UPDATE_PROMPT` (makes oh-my-zsh update the user's install silently, `check_for_upgrade.sh:18`). The code comment states that invariant, not a plan reference.
- Attached panes are untouched (the core never creates them).
- Gate answer (state in the spec, no code): this is not an fgOS config key, env var read by fgOS, file or tool dependency, so nothing registers with `fgos setup`/`fgos doctor`. Spec also states the variable reaches the pane's whole process tree (inert for anything but oh-my-zsh) and that a user `zstyle ':omz:update' mode` overrides it, where the ready-shell handshake carries correctness. Before writing "inert", record `rg -n DISABLE_AUTO_UPDATE` over `src packages core docs` in the phase result.

## Files (write paths)

- `packages/terminal-control/rust/src/core.rs`
- `packages/terminal-control/rust/tests/core_failures.rs`, `packages/terminal-control/rust/tests/common/mod.rs` (only if MemDriver must log env)
- `packages/terminal-control/rust/tests/herdr_driver_fake.rs` (extend `each_capability_runs_the_expected_command`, `:89-118`: `--env DISABLE_AUTO_UPDATE=true` on tab create and pane split)
- `docs/platform/terminal-control/spec.md` (§3 and the gate/env note above)

## Steps

1. Enumerate callers of `env_pairs` (`rg -n env_pairs packages/terminal-control/rust/src`; expected `core.rs:278,283`), then implement the merge in one place.
2. Tests, plain-words titles: a created pane gets the quiet env; a caller value for the same key wins; an attached pane is created with no env; the herdr CLI receives `--env DISABLE_AUTO_UPDATE=true`.
3. Spec text.

## Verify

- `cargo test -p fgos-terminal-control --test core_failures`
- `cargo test -p fgos-terminal-control --test herdr_driver_fake`
- `cargo test -p fgos-run-supervisor` (fakes ignore env; stays green)

## Risks and rollback

Env inherited by the agent tree (decision B, inert, reversal in plan). Revert the commit: no state impact.
