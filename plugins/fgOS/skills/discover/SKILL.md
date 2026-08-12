---
name: discover
description: >-
  Use when the user wants to advance one fgOS work item past stage
  discovery,
  from inside a Claude Code session, invoked as /fgOS:discover <id>. Claims
  the item if needed, then dispatches it through fgos-coding-driving so the
  live session runs whichever stage-skill each stage along the way
  resolves to (fgos-coding-discovering at discovery, fgos-coding-exploring
  at exploring), supplying each stage's own verdict
  to the discover verb as it goes — never writes .fgos/ state directly,
  and never re-derives a judgment blind. For an item at stage planning,
  use /fgOS:plan instead. Examples: "/fgOS:discover build-cli",
  "/fgOS:discover tsk-3wd".
---

# fgOS discover

Claims a work item (if not already claimed) and dispatches it through
`fgos-coding-driving` so a person working inside Claude Code can advance it
past `discovery` without hand-typing the CLI. This is a real judgment call,
not a mechanical read: the live session runs whichever stage-skill each
stage along the way resolves to — `fgos-coding-discovering`'s machine-alone
pass at `discovery` (which calls the `fgos-researching` helper itself, as
many times as the open questions need), then `fgos-coding-exploring`'s
Socratic collaboration at
`exploring` — and each one supplies its own verdict to the `discover`
engine verb as the item advances, instead of leaving any of those
judgments to a later, context-blind subprocess call. Either way the item's
`stage` advances to `planning` or parks in `awaiting-human` with a
question. One-door-write, CTR001 — never writes `.fgos/` state directly
(`docs/history/discover-decompose-skill-wrapper-verdict-routing/
CONTEXT.md` D1).

tsk-2b0 D1 (hard split, no fallback): `discover` runs the `discovery` ->
`exploring` chain for an item at either of those stages
(`discoverableStages`, `src/intake/discovery.mjs`) — it no longer also
handles `planning`-stage split-work judgment (renamed from `decompose`,
tsk-403 D11). Use `/fgOS:plan <id>` for that; `discover` errors if
called on an item outside that set (e.g. an item
already at `planning`/`decompose` or `executing`) — it does **not** error
on `discovery` or `exploring`, both of which `nextDiscoveryEdge` handles
directly. `clarify` is NOT in the set for coding: `discoverableStages`
builds it from `stageForStep(domain, 'Clarify')`, which coding no longer
maps to any stage (tsk-qod D1/D2), so the entry drops out — only a domain
that still declares a Clarify-mapped stage keeps it.

## Layer

`discover` is a **launcher** (ADR 0028: picks one item, stands up, steps
out entirely once it stops — never needs a soul watching it run). Its
callers, in practice:

- `/fgOS:discover-next`, after picking an item off the discovery-shaped pool
  (tsk-lya D10 — it delegates down here rather than dispatching
  `fgos-coding-driving` itself). `herdr-plugin`'s unattended auto-discover
  launcher is one caller of `/fgOS:discover-next` itself now (it only
  knows an item exists, never which one — picking stays centralized in
  `pickNextDiscoverItem`), always passing `--autoClose` through both
  tiers.
- `herdr-plugin`'s manual per-item Discover button, which calls here
  directly with the id the person selected in the dashboard, also always
  passing `--autoClose` (`herdr-plugin/src/pick.rs`).
- Rarely, a person invoking it by hand with a specific id in mind. Most of
  the time — the two herdr-plugin paths and `discover-next` above —
  nobody is sitting watching this pane while it runs.

## Steps

1. **Read the required id argument, and the optional `--autoClose` flag.**
   `$ARGUMENTS` is the work item's id — `discover` requires it — plus an
   optional trailing `--autoClose` token
   (`docs/history/fgos-terminal-close-autoclose/CONTEXT.md` D1: opt-in
   only, never a new default). Strip a trailing `--autoClose` token before
   passing the rest through to the verb in step 2 — when absent,
   `$ARGUMENTS` is unchanged and this skill's behavior is byte-identical to
   before this option existed. Do not validate or guess the id itself; if
   it is missing or unknown, let the CLI's own error surface verbatim.
   Remember whether `--autoClose` was present — it is read again at step 4.

   If `$ARGUMENTS` (after stripping any `--autoClose` token) is empty, show
   the user the CLI's own usage string and stop:

   ```
   fgos discover <id>
   ```

2. **Claim if not already claimed.** Resolve the main checkout root (every
   verb below is `requiresExistingStore: true`, same as every other fgOS
   skill):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   Read the item's live status:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" list --id $ARGUMENTS --json --dir "$root"
   elif command -v fgos >/dev/null 2>&1; then
     fgos list --id $ARGUMENTS --json --dir "$root"
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   If `data.work["$ARGUMENTS"].status` already reads `doing`, skip straight
   to step 3 — the caller (or an earlier iteration of this same command)
   already holds the claim. Otherwise claim it, the same way `/fgOS:pick`'s
   own step 2 does:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" take $ARGUMENTS --role session --dir "$root"
   elif command -v fgos >/dev/null 2>&1; then
     fgos take $ARGUMENTS --role session --dir "$root"
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   If the item already carries its own branch (`fgw/<id>` from an earlier
   claim), `take` refuses and names `pick` instead — fall back to:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" pick $ARGUMENTS --dir "$root"
   elif command -v fgos >/dev/null 2>&1; then
     fgos pick $ARGUMENTS --dir "$root"
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   Any other failure (the id doesn't exist, lock contention) shows the
   real error to the user and stops — do not retry with a guessed id and
   do not fall back to a hand-written state change.

3. **Dispatch through `fgos-coding-driving`.** Invoke the
   `fgos-coding-driving` skill for `$ARGUMENTS` with `ceiling:
   stage:planning`. Never invoke `fgos-coding-discovering`/
   `fgos-coding-exploring` (or any other stage-skill) by name directly
   here — the driver resolves which skill each stage maps to through its
   own registry lookup, the one place that mapping is allowed to live
   (`fgos-coding-driving`'s own red-flag rule against a caller inventing a
   stage-to-skill mapping). The ceiling stops the loop the instant the
   item's stage reaches `planning` — it never lets the loop drift onward
   into `fgos-coding-planning` in the same call
   (`docs/history/discover-decompose-skill-wrapper-verdict-routing/
   CONTEXT.md` D1, D6), and it never crosses into `planning`'s own
   split-work judgment, which stays `/fgOS:plan`'s exclusive job (D1).
   Along the way, whichever stage-skill each stage resolves to does its
   own real reasoning and supplies that stage's verdict to the `discover`
   engine verb directly — no context-blind subprocess judge runs for
   either of the two stages this call may pass through.

4. **Re-read the item's live state, then report it — never relay bare
   narration.** Before reporting anything, re-read `$ARGUMENTS`'s current
   `stage`/`status` fresh (`fgos list --id $ARGUMENTS --json --dir
   "$root"`) and report what the state actually shows, cross-checked
   against what `fgos-coding-driving` reported. This is the one guard
   against a real class of bug already caught once: a session reported
   "reached ceiling at decompose" while the item's real state was
   `discovery` — narration and reality had drifted apart, and nothing
   caught it before this step existed. Relay `fgos-coding-driving`'s stop
   reason, verified against this fresh read, not blind narration; do not
   add a separate report of your own beyond it:

   - **reached ceiling at stage `planning`** — the item cleared `discovery`
     (and `exploring` too, if its discovery verdict sent it there) with a
     real verify command now attached. Tell the user `/fgOS:plan <id>` is the
     next step for this item.
   - **`awaiting-human`** — relay the parked question exactly and tell the
     user to resolve it via `/fgOS:answer <id> <answer text>`.
   - **`blocked`** — relay the block exactly; never guess an answer or
     retry blind on this skill's own authority.
   - **no-progress** — relay it plainly; this is a real stop that needs a
     person's look, not a silent retry.

   A parked or blocked outcome is a valid, expected result of this
   command, not a failure — say so plainly rather than treating it as one.

   **If `--autoClose` was passed (step 1) and the driver's stop is one of
   reached ceiling at stage `planning`, or `awaiting-human`** — an advance
   or a legitimate park, per
   `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` D2 — call
   `/fgOS:terminal-close` as the literal last action of this skill's own
   flow, invoked directly here rather than through a second slash-command
   round trip:

   ```
   bash ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/plugins/fgOS/skills/terminal-close/close.sh
   ```

   Never call this on `blocked` or no-progress — the pane must stay open
   for a person to debug (D2). Never call it if `--autoClose` was not
   passed. Nothing runs after this call — it is unconditionally the final
   statement of this skill's flow when it fires, with no delay before it.
