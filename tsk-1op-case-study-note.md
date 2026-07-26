# Case study — live /fgOS:pick claim (tsk-1op)

Real work item tsk-1op (domain unset -> folds to coding, stage executing)
was submitted, clarified, decomposed (pass-through), then claimed via
`node bin/fgos.mjs pick tsk-1op` -- the exact CLI /fgOS:pick shells to
(STR90). Per STR90, an interactive session loads fgos-routing right after
claim, which resolves this item's skill via skillForStage(DOMAINS.coding,
'executing') -> fgos-executing.

The same item's real fields, run through buildPrompt (the headless
fgos-runner path, STR91), render a # Agent skill section naming the
identical path: .claude/skills/fgos/fgos-executing/SKILL.md.

Both paths -- one interactive claim, one headless render -- resolve to the
same file for the same real item. This is the item's own trivial
deliverable (a note, since the item's own description states no
implementation was needed) so fgos return/approve has a real diff to
close on. Delete this file after the item is closed -- it is proof
scratch, not a durable product doc.
