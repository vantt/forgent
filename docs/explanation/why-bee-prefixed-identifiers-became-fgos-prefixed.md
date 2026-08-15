---
type: explanation
title: Why `BEE_`-prefixed identifiers became `FGOS_`-prefixed (and some didn't)
source_capture_ids: [tsk-19z]
---
# Why `BEE_`-prefixed identifiers became `FGOS_`-prefixed (and some didn't)

`tsk-19z` asked, at face value, for a blind find-and-replace: every
`BEE_`-prefixed constant or name in the repo becomes `FGOS_`-prefixed.
The real work was in the gate question this raised before any rename
happened: several `BEE_` occurrences were (or had been) a live contract
with the real external `bee` tool, not fgOS's own naming choice — and
decision record `0017` had locked keeping the fgOS/bee naming systems
**parallel, not merged**, specifically because bee coexistence was still
live at the time `0017` was written. A mechanical rename risked both
breaking real interop and directly contradicting a locked decision.

## The real question: is the isolation actually true now, or just assumed?

The item's own gate asked the person directly rather than guessing, and
the answer confirmed a concrete state change: forgentX is now fully
isolated from bee — no live interop remains, and anything the codebase
learned from bee's own conventions has already been internalized rather
than depended on at runtime. This was checked against real evidence, not
taken on faith: this checkout has no `.bee/` directory at all, and
`test/e2e/coexistence-canary.test.mjs` is already written to skip
honestly (via `BEE_SKIP`) when no bee installation is found — meaning
the codebase already treats bee's absence as a normal, tested state, not
a gap to patch around.

## The line the scope actually drew: whose naming is it?

The rename does **not** apply uniformly to every `BEE_`/`bee` occurrence
— it applies only to identifiers **fgOS's own code defines and controls
the meaning of**, even when the original choice was made to match bee's
own convention (e.g. `BEE_SESSION_ID`, chosen specifically to match
`.bee/bin/lib/lock.mjs`'s own env-var precedence for coexistence — that
rationale no longer holds now that coexistence is confirmed dead).

It deliberately does **not** apply to occurrences where `BEE_`/`bee` is a
**proper-noun reference to the actual external tool** — a real path,
filename, delimiter, or flag whose entire semantic content IS "the bee
tool itself": `.bee/bin/hooks/bee-write-guard.mjs`, `BEE_SKIP` (a flag
meaning "skip because bee isn't installed"), or `<<<BEE_DIGEST` (a
delimiter quoted verbatim from beegog's own contract doc). Swapping
those to `FGOS_` would misdescribe what the code is actually checking
for, not modernize it — the mandate was a naming rename, not a rewrite
of the code's real semantics.

A third category stayed untouched for a different reason entirely:
historical and quoted records — `docs/history/**` (this repo's own
decision records, changed by superseding, never edited in place),
`docs/distillery/**` (factual capture of bee/beegog's real naming — 
rewriting it would falsify what was actually distilled from them), and
`plans/reports/**` (point-in-time scan snapshots). These stay
byte-identical regardless of which of the first two categories they'd
otherwise fall into, because rewriting history for a naming-hygiene gain
doesn't apply to history.

## What actually landed

The rename touched `src/runner/session-identity.mjs` (`BEE_SESSION_ID` →
`FGOS_SESSION_ID` in `resolveWriterIdentity`'s env-var priority list,
plus header comments that previously claimed a same-precedence match
with bee's own lock code — dropped, since that claim is no longer true),
its shell mirror in `plugins/fgOS/skills/terminal/rename.sh`, every test
fixture exercising that constant, the README's `<!-- BEE:BACKLOG-BADGES
-->` marker (confirmed behavior-inert first — no script or CI workflow
in the repo reads that literal string), and the two live specs
(`docs/specs/runner.md`, `docs/specs/work-state.md`) that documented the
same env-var priority in prose. It passed verify (`npm test`) on its
first attempt, with one real friction along the way: an unrelated
`goal-check` step failed once on the working branch with exit `127`
(command-not-found class, not a logic error in the rename itself) —
resolved without changing the rename's own scope or approach.

## What this item explicitly did not decide

Two real follow-on questions surfaced but were named as out of scope
rather than answered here, because they're bigger product decisions than
an identifier rename: whether `0017` itself should be formally
superseded now that the isolation it assumed coexistence would continue
under has changed, and whether `test/e2e/coexistence-canary.test.mjs`'s
bee-interop testing should be retired as a feature (kept explicitly
untouched — its `BEE_SKIP`/`.bee/` references are proper-noun-scoped and
still describe real behavior worth testing, if bee coexistence is ever
relevant to a future user again). Both are named as candidate items for
whoever picks them up next, not silently folded into this one.
