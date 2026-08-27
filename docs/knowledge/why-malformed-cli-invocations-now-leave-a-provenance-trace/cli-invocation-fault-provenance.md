---
framework: diataxis
mode: explanation
---
# Why malformed CLI invocations now leave a provenance trace

## The gap this closes

`bin/fgos.mjs` is the single CLI door for every verb. Before this, when an
invocation was *malformed* — an unknown verb, a store-missing/wrong-cwd
refusal, an arg-parse fault — the failure surfaced only as a stderr line and
an exit code at the point of call, then vanished. There was no
later-readable trace of *where the bad call came from*: which session,
which argv, which cwd. Two real incidents (`p-af05e742`, `p-4c81ca74`,
2026-07-28, dogfood `tsk-1wd`) motivated the fix — both wrong-cwd/wrong-store
faults with no record to investigate after the fact.

## What counts as recordable — and what doesn't

The item distinguishes an **invocation fault** (a malformed *call*, detected
before the verb's handler runs) from a **business refusal** (a correct
answer from a handler that ran — item not found, Iron Law trip, lock held).
Only the former is recorded. Recording business refusals would dilute the
signal with expected, correct events.

The scope actually shipped is narrower than the item's own original
description. Locked decision D1 named four fault classes: unknown verb,
missing required flag, invalid id, wrong cwd. D7 — added after
`fgos-coding-validating` proved the boundary by reading the code, not arguing it —
cut this to exactly what the single failure handler in `main()`'s `catch`
can observe: unknown verb, the `requiresExistingStore` refusal, the
`init`-inside-worktree refusal, `dataDir`/`--dir` faults, and arg-parse
faults (only once `parseArgs` moved inside the `try`).

Missing-required-flag and invalid-id faults are explicitly **not** covered,
despite D1 naming them. Why: `parseArgs(rest)` ran before the `try` opened,
so arg-parse faults never reached the `catch`; and D1's other named cases
are validated *inside* handlers below `runVerb`, across 73 hand-rolled
`StoreError('validation', ...)` sites, positionally indistinguishable from
business refusals. The two ways to separate them were both closed off:
message-string matching (rejected — would couple the log to 73 wordings)
and enforcing the command registry's `required` contract (forbidden — see
below). The log therefore cannot answer "who forgot a required flag," the
very first class the item's description named — accepted as the honest
scope rather than pretending coverage, since the originating incidents were
wrong-cwd/wrong-store faults, which *are* covered. Widening later needs no
change to the record's shape.

## Why observe-only, never enforcement

`src/cli/command-registry.mjs` already carries JSON-Schema `parameters`
with `required` per verb — deliberately left unwired into dispatch by an
earlier phase ("that is P38's job"). This item leaves it that way (D4):
every verb's existing validation and exit codes stay byte-identical, and
the registry's `required` stays advisory. Turning it into enforcement here
would be a public CLI contract change smuggled into an observability fix —
visible to every skill, slash-command, and test that shells out to `fgos`.
Consolidating the 73 hand-rolled validation sites onto the registry's
`required` stays P38's stated scope, not this item's.

## Why a side log, never `events.jsonl`

`events.jsonl` is the rebuild source — `rebuildView` derives all state from
it. Adding a new event type there would put every replay/rebuild path in
scope for what is a pure-observability change (D2). The fault record
instead lives in a separate side log under `.fgos/`, with its own lifecycle
and read path, never touched by `rebuildView`.

## Why provenance is "free" signals only

Provenance here means exactly three things, each already available at the
point of failure at zero extra cost: `resolveWriterIdentity()`'s
`{id, source}`, the argv, and the cwd (D3). No new env var, no new flag, no
caller-side change. `resolveWriterIdentity` is already documented as
best-effort and never blocks a caller, which makes it safe to call on an
error path. The tradeoff this accepts: the record can answer "which
session, what command, from where" but not "which skill called this" — a
self-declared caller label is explicitly deferred as a separate follow-up,
not folded in here.

## Why the record follows the main checkout, never a worktree

Linked worktrees never carry their own `.fgos/` (ADR0020). When the
resolved store is missing or is a linked worktree, the fault resolves and
records against the main checkout via
`git rev-parse --path-format=absolute --git-common-dir` — the same
resolution the fgOS skills' own gate checks already use. This honors
ADR0020 and does not defeat the existing `requiresExistingStore` guard that
stops a writer from silently creating a phantom `.fgos/` inside a worktree.
Outside any git repo, there is no main checkout to resolve, and the fault
falls back to stderr-only — every originating incident was inside this
repo, so this gap was accepted rather than solved.

## Why one added stderr line, decided after the fact

D6, added after `fgos-coding-planning`, makes the fault record visible
in-process: one *added* stderr line naming where it was recorded. Exit
codes and existing stderr text stay unchanged — this only appends. The
concern was measured, not assumed: 85 of 97 stderr assertions under `test/`
use substring/regex matching (`assert.match`) and are unaffected by an
appended line; only 12 use exact-match (`assert.equal`), each inspected
individually. Without this, the log's known failure mode is that nobody
reads it and the feature's own purpose — being able to "soi lại sau" (look
back later) — never materializes. A machine-readable read surface (a
`fgos faults` verb) was left as separate follow-on work, not part of this
item — landed by `tsk-1wdf`: `fgos faults [--limit N]` reads the same
`.fgos/logs/invocation-faults.jsonl` back, resolving it the same worktree-safe
way it is written (D5), so a linked worktree with no `--dir` still sees the
main checkout's real records instead of an empty view.
