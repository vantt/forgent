# Why the launcher-vocabulary word guard was retired right after `tsk-1s5` fixed it

`tsk-1s5` reported that the pinned term "orchestrator" (retired in favor
of "launcher" by decision `0028`) had leaked back into
`docs/history/fgos-coding-driving-item-display/CONTEXT.md`, tripping
`test/docs/launcher-vocabulary-guard.test.mjs`'s NEGATIVE guard. The item
confirmed the leak was already fixed by an earlier commit (`10c0bed5`),
and closed itself as a verify-only confirmation — plus one small
follow-up: `fgos-coding-validating`'s reality gate found that this item's own
required `CONTEXT.md`/`RESEARCH.md`/`plan.md` files, each legitimately
*discussing* the leaked word as their own subject matter, tripped the
same guard. Fixed the established way — allowlisting the 3 new
self-referential paths in `ALLOWED_FILES`, per
`docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-guard.md`'s
own step 3 (that how-to doc and the guard test it describes have since
been removed — see below).

## What happened right after

`test/docs/launcher-vocabulary-guard.test.mjs` — the exact test
`tsk-1s5`'s own `verify` command runs — no longer exists on `main`.
Decision `0031` ("Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán
nghĩa mới") removed the entire guard mechanism, along with the how-to doc
`tsk-1s5` had just used.

The reason: decision `0029` D17 assigned "orchestrator" an official new
meaning — the N-unit, stays-engaged aggregate layer (the role
`/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop`, and `fgos-fanout` actually play) — filling the gap
`0028` had deliberately left open when it freed the word. From that point
on, the guard (a word-level grep with no way to tell the retired sense
from the newly-assigned one) was blocking fgOS's own current, official
vocabulary. Its allowlist had grown to 28 hand-written entries, four
items had been created solely to patch it (`tsk-2au`, `tsk-2lg`,
`tsk-2uo`, `tsk-4cx`) — `tsk-1s5` itself became a fifth, needing its own
allowlist fix for the very files documenting the leak it was closing.

## What this means for anyone reading `tsk-1s5`'s own history

`tsk-1s5`'s `verify` command (`node --test
test/docs/launcher-vocabulary-guard.test.mjs`) can no longer be run — the
file it names doesn't exist on current `main`. This isn't a regression in
`tsk-1s5`'s own fix; it's a downstream retirement of the mechanism the
fix was written against, landed independently and shortly after. The
allowlist entries `tsk-1s5` added became dead weight the moment the guard
they served was deleted — removed along with everything else the guard
owned, per `0031`'s own cleanup list.

The full reasoning for the retirement — including why a narrower "fix"
(exempting only the new sense) wasn't viable for a plain string-match
guard — lives in `docs/specs/runner.md` (mục "### 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới").
"Launcher" itself remains the correct, unretired name for the one-item,
fire-and-forget role `0026` originally described — only the *guard*
enforcing that was removed, not the naming decision itself.
