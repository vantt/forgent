# Auto-decompose can drop a locked decision from every child's footprint

`tsk-2ta` locked two decisions in its `CONTEXT.md` during `fgos-exploring`:
D1 (global config at `~/.fgos/config.json`, project always wins), and D1
amended (move the project config file from its old legacy flat filename to
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
locked decision implemented" — the legacy flat config file sat at the
project root for a long time afterward, never actually moved to
`.fgos/config.json`, despite D1 amended being a real, explicitly locked
decision in the same `CONTEXT.md` all four children point back to. (The
gap was eventually closed — the legacy file was retired outright, not just
moved — by `tsk-5hv`.)

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

## The gap now has a check, at decompose time

`tsk-1gr` closed the "never actually detected" half of this: `fgos
decompose` now cross-references every locked decision in the parent's
`CONTEXT.md` against the combined `footprint` of every child it just
generated, right when the children are created — not only after the fact
in a synthesis document like this one. `findUncoveredLockedDecisions`
(`src/intake/decompose.mjs`) is the mechanism.

This check is deliberately narrower than "does every decision get done":
it flags only decisions whose own text names a **path-shaped token** —
a substring that looks like a file path and resolves via
`fs.existsSync` to a real file already in the repo at decompose time.
Exactly the `tsk-2ta` shape above: "move `.fgos-runner.json` to
`.fgos/config.json`" names two real paths, and no child's footprint
touched either one. A decision that describes new, self-contained
behavior with no existing-file reference (like `tsk-2ta-1`'s "read and
merge a global config") is out of scope for this check by construction —
there's no path to look for, so nothing is flagged.

The check is **advisory, not blocking**. This is a deliberate asymmetry
with the sibling collision gate (`footprintOverlapAmong`, which checks
two children's footprints against *each other* and blocks outright on a
real overlap): that gate is purely mechanical with zero false-positive
risk, because two children's declared footprints either share a file or
they don't. This completeness check has to match a decision's *prose*
against a footprint, which carries real false-positive risk — blocking
decompose on a wrong guess costs more than the value of catching the gap
a little earlier. Flagging it advisory, right at decompose instead of
only ever showing up (or never showing up) in a much later synthesis
document, is already the improvement; blocking is left as a future
option if the advisory signal proves trustworthy in practice.

## Follow-up fixes (`tsk-gio`): the check itself had gaps

An independent code review after `tsk-1gr` merged found three real bugs
in `findUncoveredLockedDecisions`'s own implementation — none of them
changed the advisory-vs-blocking design above, all of them made the check
actually catch what it was built to catch:

- **Repo-root dotfiles were silently exempted.** `PATH_TOKEN_PATTERN`
  (the regex that spots a path-shaped token in a decision's prose) missed
  a leading dot on a bare repo-root filename — exactly the `tsk-2ta` case
  this check exists for: `.fgos-runner.json` lost its leading `.` when
  matched, `fs.existsSync` then failed to find the (differently-named)
  file, and the decision was silently treated as "no path referenced" —
  the exact silent-miss failure mode this whole mechanism exists to
  prevent, reproduced inside the mechanism itself.
- **No `try/catch` around the new advisory `addDecision` call.** Every
  other write in `decompose.mjs` around this area (`:685-699`) already
  follows a try/catch convention specifically so a write-time failure
  degrades gracefully instead of aborting the whole decompose — the
  never-blocks stance (D1 above) has to hold even when *recording* the
  advisory itself fails, not just when the detection logic runs cleanly.
  An unguarded `addDecision` call risked turning an advisory-only check
  into an accidental hard failure of decompose.
- **Directory-shaped footprints weren't recognized as covering their own
  contents.** A footprint entry like `src/` or `test/` is meant to cover
  every path underneath it, but the coverage check only did exact string
  matching — a decision naming `src/foo.js` wasn't recognized as covered
  by a child footprint that declared `src/` rather than the exact file.

Verified with a real command
(`node --test test/intake/decompose.test.mjs`), not just code review.
Source: `tsk-gio`, filed as an independent code-review finding after
`tsk-1gr` merged — `fgos show tsk-gio` has the full record.
