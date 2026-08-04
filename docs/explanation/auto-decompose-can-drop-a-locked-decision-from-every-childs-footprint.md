# Auto-decompose can drop a locked decision from every child's footprint

`tsk-2ta` locked two decisions in its `CONTEXT.md` during `fgos-exploring`:
D1 (global config at `~/.fgos/config.json`, project always wins), and D1
amended (move the project config file from `.fgos-runner.json` to
`.fgos/config.json` to match the global path's shape). `fgos decompose`
then split the item into four children automatically. None of the four —
`tsk-2ta-1` (global read+merge), `tsk-2ta-2` (doctor check), `tsk-2ta-3`
(shell fallback, actually D2, a separate decision), `tsk-2ta-4` (this
synthesis) — had D1 amended's file move in their declared `footprint`.

## What this meant in practice

Each child's `footprint` was implemented faithfully to what it actually
said: `tsk-2ta-1` added a module that reads a *new* global file and merges
it with *whatever the project config already is* — it never needed to
touch where the project file lives to do that. `tsk-2ta-2` added a doctor
check reporting on both levels' presence — also unaffected by which exact
path the project level uses. Both were implemented correctly, verified,
and merged. And yet the sum of "every child done" does not equal "every
locked decision implemented" — `.fgos-runner.json` is still sitting at the
project root today, not at `.fgos/config.json`, despite D1 amended being a
real, explicitly locked decision in the same `CONTEXT.md` all four
children point back to.

## Why this is worth naming, not just quietly fixing

Fixing it here — inside `tsk-2ta-4`, whose own `footprint` names only
`CONTEXT.md` — would have been scope creep into architecture no child was
built for the same way `fgos-code-implement`'s own rules already warn against
("the fix would require redesigning scope... beyond what the item
describes → stop"). The honest move was the one taken: name the gap
plainly in the synthesized `CONTEXT.md`, cite exactly which decision
didn't land and why (no child's footprint covered it), and leave doing the
actual move to a future item that can be scoped for it specifically.

## The general shape

A decision locked once, in one `CONTEXT.md`, does not automatically
propagate into every child an auto-decompose produces from that item —
each child only gets what its own generated `footprint`/`verify` actually
describes. When a locked decision changes an existing file's *location or
name* rather than adding new, self-contained behavior, it's worth an
explicit check after decompose: does at least one child's scope actually
cover moving/renaming the thing, or does every child just build *around*
the current path without ever touching it? The `compound-learn` synthesis
step — writing what actually got built, not what was originally planned —
is a natural point to catch this, because it's the first point that looks
at the finished set of children against the original decision list rather
than at any one child in isolation.
