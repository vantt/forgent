# Closing report: fgos session type submits what it types, or refuses by name

Plan status: **done**. All six criteria are `[core]` and all six are met. No criterion is carried as debt.

## Criteria

| # | criterion | met by | proof |
|---|---|---|---|
| 1 | Per-profile submit proof and every named answer | phase 2 (`00c7708f55`, `f41d1f61a1`), omp added in phase 1 (`e8841a4eb4`) | `cargo test -p fgos-session-host --test typed_wake` |
| 2 | Verb JSON says `submitted: true` or the refusal, never `typed: true` | phase 2, extended by p04c (`70e53c73a2`) | `cargo test -p fgos --test supervision_verbs` |
| 3 | `--no-enter` keeps the type-only path and answers `held: true` | phase 2 | same `supervision_verbs` run; `type_text_sends_text_exactly_once_via_pane_send_text` kept |
| 4 | Live check on a real Claude Code head | phase 4, third run | `live-check.md`: `submitted: true`, the head replied `ok`, no second `\r` |
| 5 | Full gate green, changelog fragment, supervisor skill wake step | phase 3 (`e27d61b6cd`), phase 4 gate | `integration.md`: gate ticket c-6197-1795873280492 fully green on main tip `70e53c73a2` |
| 6 | Profiles pinned to the installed CLIs, pi and omp get a real `composer_state` | phase 1 (`f2279f8484`, `e8841a4eb4`) | `cargo test -p fgos-agent-protocol --test terminal_vectors` |

The live check found two gaps that no fake could show, and both were fixed inside the plan's widened footprint
before the passing run: the version of a confined Claude head is now read from its process binary (p04b,
`a27546744d`), and `session type` versions the process in the pane it types into (p04c, `70e53c73a2`). Heads now
start with Claude's prompt suggestion off, because herdr read the faint suggestion as a draft.

## Debt for backlog rows

None of these blocks a criterion. Each needs its own backlog row, which the secretary opens.

1. **Flaky `git_recover_confirm_dead`** (`apps/fgos/tests/git_recover_confirm_dead.rs:141`): fails with `ETXTBSY`
   under load. Passed 3/3 alone. It also failed another plan's gate today (ticket c-73499-1795849237133). Likely fix:
   the `spawn_named_copy` pattern (`install` in its own process) that `packages/mailbox/rust/store/tests/verbs.rs`
   uses.
2. **Flaky `transport_round`** (`packages/execution/engine/tests/transport_round.rs:1748`): a wall-clock bound on
   the handover (579.9 ms observed) fails under load average 20+.
3. **Slow `test/runner/loop.test.mjs`**: hit the 600 s per-file watchdog at 604 s under load.
4. **No version source for pi and omp heads**: `recipient_version` in
   `packages/mailbox/rust/store/src/adapters/version.rs` serves only claude, codex and agy. A live pi or omp head
   is therefore refused `unknown` by `session type` and by the mailbox typed wake, although its profile can now judge
   the composer. Reading the version from the pane's process, as p04c does for claude, is the likely route.
5. **O1 is unanswered**: no capture shows herdr `pane send-text` meeting text already in the composer. Safe today
   because the gate refuses `composer-not-empty` before typing (D4). Answering it needs one capture on a throwaway
   head with a draft in place.
6. **The `supervision_verbs` wiring proof confirms on a static fake screen** (`brief_echoed`). The live check covers
   the real confirm timing once; no automated proof watches a screen change.
7. **No 2.1.332 multi-line draft vector** whose `promptText` is cut off with `...`.
8. **Untested inline `--settings=<json>` branch** in `src/session-host/head-start.mjs:316`. The merge of
   `statusLine` and `promptSuggestionEnabled: false` is proven only for the two-argument form `--settings <json>`
   (`test/session-host/head-start.test.mjs:312`). A binding that passes `--settings=<json>` runs unproven code.
9. **`fgos run` does not commit a file that was already dirty in the worktree.** The runner commits only changes the
   worker makes in its own round. An edit left uncommitted by an earlier unit in the same worktree is never committed,
   and the run is judged inconclusive (lead notes, "Friction"). The `p04` worktree's leftover `version.rs` edit is
   one instance. Workaround used here: a fresh worktree off the branch tip with the diff in the prompt.
10. **`decide` and the seat binding disagree about gemini** (reported by the supervisor during this plan): the
   executor that `fgos dispatch decide` answers does not match the CLI that the head's seat binding launches for
   gemini. The row should record the exact `decide` answer and the seat-binding entry side by side.

## Cleanup

All eleven plan branches (`session-type-submits-enter/{p01,p01b,p01c,p02,p02b,p02c,p03,p04,p04b,p04c,gate}`) are
merged into main. The supervisor owns worktree cleanup. Superseded worktrees, removable with
`fgos worktree remove --delivered-to main`:

- `forgent-worktrees/261128-0942-session-type-submits-enter-p01` (clean)
- `forgent-worktrees/261128-0942-session-type-submits-enter-gate` (clean, after the final gate)

Dirty worktrees, left in place and not deleted:

- `...-p01b`: uncommitted edits to the claude and pi vectors and `pi.rs`. Superseded by p01c, which landed.
- `...-p04`: an uncommitted edit to `version.rs`. Superseded by p04b, which landed.

Both live-check heads, `head:shaper-probe-0853-check` and `head:shaper-probe-0853-check2`, are retired
(`fgos session list`, retired 12:44 and 13:18 UTC).
