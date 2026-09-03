---
type: explanation
source_capture_ids: [tsk-5t3]
framework: diataxis
mode: explanation
---

# Why the Iron Law evidence contract gathers proof but never acknowledges

When `approve` refuses a `runner`-sourced item because it trips the Iron
Law, the refusal message names the matched risk flags/modules but carries
no proof — a human operator has to go find or reconstruct the
failing-test-first evidence themselves before deciding whether to re-run
`approve --acknowledge-iron-law`. `tsk-5t3` builds the contract that lets
an item collect that proof while the work happens, and lets
`/fgOS:merge-loop` find and present it when the gate trips — but the scope
is deliberately narrower than it could have been, and the narrowing is
the actual decision worth recording.

## Why this absorbed a rejected auto-bypass ask instead of ignoring it

The item this one absorbed, `tsk-2qx`, asked for something bolder:
"upgrade merge-loop to auto-merge past Iron Law, agent searches for
evidence for merge." That framing was closed `wontfix` as a duplicate, not
because the underlying need was wrong, but because *half* of it was
right. The evidence-gathering half survived and became this item; the
auto-merge half was explicitly rejected. Folding the rejected half in
silently would have lost the record of what was asked for and why it
didn't survive — keeping the connection (`refs: [tsk-2qx]`) means a future
reader who wonders "didn't someone ask for auto-bypass already?" finds the
answer instead of re-litigating it.

## Why evidence-only, not "gather evidence and if it looks good, merge"

The locked scope (D1) is blunt: `/fgOS:merge-loop` gathers and presents
failing-test-first proof when it hits an Iron Law block, but never
self-acknowledges. RUL34/RUL37 — a real human operator must type
`--acknowledge-iron-law` themselves, no exception — stay exactly as
locked. This isn't a temporary restriction pending a smarter agent; it's
a boundary this item explicitly declines to touch, splitting the harder
question ("can that requirement ever be loosened, and if so how") into
its own not-yet-filed item (`tsk-44f`) that depends on this one. The
reasoning: better evidence makes the human's decision *faster*, not
*optional*. An agent that gathers strong-looking proof and then also
presses the button has collapsed the two into one step — exactly the
shape Iron Law exists to prevent, since the whole point of RUL34/RUL37 is
that a self-modifying diff's safety claim needs a second, independent
party actually looking at it.

## Why the trigger reuses `classifyIronLaw` at return-time instead of a separate heuristic

Evidence isn't gathered speculatively for every item "just in case." D2
ties collection to a real signal: `fgos-coding-implement` already runs its
normal before/after test cycle for a fix as a matter of course; the
contract file only gets *persisted* when the item's final diff, evaluated
with the exact same function the real gate uses
(`classifyIronLaw({filesChanged: finalDiff, description})`,
`src/evolve/iron-law.mjs`) at `fgos return` time, comes back
`required: true`. Reusing the real classifier instead of inventing an
early-prediction heuristic means the trigger can never drift out of sync
with what `approve` actually checks — and it means the ~99% of items that
never touch a self-modifying module never pay the cost of writing
evidence nobody will read.

## Why the evidence lives on the branch, not in `.fgos/`

The contract file's storage location (D3) is
`docs/history/<id>/iron-law-evidence.md`, committed on the item's own
`fgw/<id>` branch — deliberately not `.fgos/` and not the outcome
record's `docType`/`docPath` fields. Two separate constraints rule those
out: worktrees never carry their own `.fgos/` (ADR0020), so evidence
written mid-`fgos-coding-implement` inside a worktree has nowhere durable to land
in `.fgos/` even if that were otherwise desirable; and the outcome
record's `docType`/`docPath` fields are only populated at
`compound-learn`, which runs *after* `approve` already needs the evidence
— storing it there would mean the evidence doesn't exist yet at the exact
moment it's needed. `approve`/`merge-loop` read the file via `git show
fgw/<id>:docs/history/<id>/iron-law-evidence.md` from the main checkout —
reusing the same branch-ref read pattern already established elsewhere
(`tsk-56t` D1) for reading branch-local state before a merge, rather than
inventing a second way to peek at a not-yet-merged branch's content.

## Why `approve`'s own refusal message stays byte-for-byte unchanged

D4 draws the surface boundary precisely: `approve`'s thrown refusal
message is a locked gate this item never edits. `/fgOS:merge-loop` — the
chat/skill layer, not the engine — is what reads the evidence file, if
present, and prints it for the human before asking them to decide on
`--acknowledge-iron-law`. Keeping the engine's refusal untouched and
pushing the presentation into the skill layer means the hard gate's own
behavior can't be weakened by an "improvement" aimed at ergonomics —
evidence display is additive UX around a boundary that stays exactly as
strict as it was.
