---
framework: diataxis
mode: explanation
---
# Why the herdr fgOS dashboard shipped as three sequential children, and what surfaced along the way

`tsk-19y` — a herdr plugin cockpit for fgOS — was split (D6, mid-planning
user steer) into three deliberately small, sequentially dependent pieces
rather than one pass, and its execution surfaced a real multi-session
data-loss incident worth recording alongside the feature itself.

## Why three pieces, in this order

The original shape had two pieces (mock-and-real-data bundled). The user
steered mid-planning to slice mock-only rendering out as its own first
piece — "deliberately smaller than a full dashboard" — specifically to
prove the *plumbing* (manifest authoring, `herdr plugin link`, pane
launch, rendering) before any of it depended on live fgOS data:

1. **`tsk-19y-1`** — scaffold + mock/static dashboard. Fake rows, no
   `fgos` subprocess call at all. Risk: "first plugin manifest ever
   written in this repo, no local precedent to copy."
2. **`tsk-19y-2`** — wire real data (`fgos triage --json` for the
   impact-sorted list per D5, `fgos list --all --json` filtered to
   `status: doing` for D4's in-process list). Depends on piece 1's
   plumbing already working.
3. **`tsk-19y-3`** — the `pick` orchestration action (row select → new
   pane → `claude` → `/fgOS:pick <id>`). Depends on piece 2 — "there is
   nothing meaningful to 'pick' against mock rows."

Each piece's own `verify` stayed real and independently provable (a
`TestBackend` render smoke test for piece 1, fixture-based parse/ordering
tests for piece 2, argv-shape and id-validation tests for piece 3) — none
of the three depended on a live herdr session to pass `cargo test`. Each
was additionally smoke-tested live against a real local herdr 0.7.4
install before being called done, per the plan's own risk map.

## What a real, unplanned architecture question turned up

Piece 3's plan assumed a herdr `[[actions]]` manifest entry could serve as
the "pick" action. Reading herdr's own CLI source
(`upstreams/herdr/src/cli/plugin.rs`, `plugin_action_invoke`) at execution
time showed `PluginActionInvokeParams`'s `context` carries only
herdr-level invocation metadata (workspace/tab/pane ids, selected
*terminal text*) — no field through which a caller could pass which
dashboard row was selected. A manifest-level action structurally cannot
be parameterized by a `[[panes]]` process's own internal list-selection
state. The actual implementation is an in-dashboard keybinding that
shells out to `herdr pane split` + `herdr pane run` directly — see
`docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md` for the
full mechanics. This is a case where "confirmed at execution time against
herdr's own context enum" (the plan's own deferred caveat) genuinely
changed the shape of one piece without touching the feature's actual
behavior (row → new pane → `claude` → `/fgOS:pick <id>` shipped exactly
as specified).

## The event-log race this build ran into

Mid-build (during `tsk-19y-2`'s and again briefly around `tsk-19y-3`'s
merge), this repo's shared main checkout's `.fgos/events.jsonl` — the
event log every session appends to and periodically commits as `chore
(fgos): sync events/entropy state` — lost this session's own
claim/return/compound-learn events for `tsk-19y-2` (recorded seq numbers
in the 1395-1418 range at the time) between one read and the next. A
concurrent session's own commit landed on `main` and the file that came
back only went up to seq 1390, then continued with a *different*
session's seq numbering for an unrelated item — a genuine multi-session
race on a JSONL append-log shared across git commits, not a bug in this
item's own code.

The recovery, run in place rather than filed as a separate incident item
(since the actual code and docs commits were never lost — only fgOS's own
claim/return/compound bookkeeping was):

1. Confirmed the real deliverable (git commits with the feature's actual
   code and docs) was intact on the item's own branch — only the
   event-log-derived item *status* had reverted to `todo`.
2. Re-claimed via `fgos take`/`fgos pick`, discovering along the way that
   `take` (isolate: false) only uses branch-source claiming
   (`branchHeadAtTake`) when the item's status is already `blocked` —
   otherwise it falls back to a main-checkout-direct-work assumption
   (`headAtTake`) even when a real feature branch already exists. `pick`
   (isolate: true) always prefers branch-source claiming regardless of
   status (`src/runner/claim-port.mjs`'s `useBranchSource = isolate ||
   isBranchTake`). This is already a tracked, separate choke-point
   (`choke-point-take-vs-pick-claim-eligibility` in the backlog) — this
   build is one more real data point for it, not a new report.
3. Because a branch-source claim always snapshots `branchHeadAtTake` at
   the branch's *current* tip when the branch already exists, an item
   with all its real work already committed has zero fresh commits to
   prove forward progress with. Recovered with small, explicitly-labeled
   `git commit --allow-empty` markers stating exactly why (no fabricated
   work, an honest bookkeeping-only commit) — used twice, once for each
   wrong-then-right re-claim attempt.
4. The root item (`tsk-19y` itself) never hit this problem: its own
   re-claim went through `isClaimLockReclaim` (a real, different, correct
   mechanism — `latestTodoReleaseTrigger` recognizing this exact item had
   been released back to `todo` at the clarify/decompose → executing
   boundary, per claim-lock §3b) that preserved its *original*
   `branchHeadAtTake` from before any child's work started, so `fgos
   return tsk-19y` correctly counted the full 61-commit history of the
   whole three-piece build as real forward progress — no empty-commit
   workaround needed at the root.

## RUL25 in practice: how the root closed without a separate "batch done" step

Once all three children reached `status: done`, `tsk-19y` fell into
`fgos ready`'s frontier on its own — no manual rollup-completion verb
exists or was needed (`docs/specs/work-state.md`'s RUL25: a root's own
`verify`, carried since it left `clarify`, *is* the integration proof for
the whole decomposed batch). The root's own `verify` — `cargo test &&
cargo build --release && npm test` — passed clean against the branch
holding all three children's merged work, including the full project test
suite, confirming the batch as a whole didn't regress anything outside
its own new files.
