# Scope the gray areas — full mechanics

The full detail behind SKILL.md's Step 1.

## Read prior verdicts

Before anything else, read back the item's prior discovery verdicts:
`fgos list` surfaces `view.discovery["<item-id>"]`, an array of `{clear,
question?, verify?}` entries, most recent last. Treat any `question`
already recorded there as already-asked ground — a new question either
builds on it (cite what changed) or states in one line why it no longer
applies; never re-ask a question that verdict already covered or
contradict what it settled.

## Reclaim the ball if it isn't yours

Same reading, check `data.work[id].holder`. If it is set and not
`implementer`, this session is re-entering an item whose most recent
role-axis call was never closed (most commonly: a prior round's `fgos
ask` was already `answer`ed on the status axis without the role axis
following):

```bash
fgos handoff-return "<item-id>" --note "reclaiming at Scope — holder was <role>"
```

Repeat, re-reading `data.work[id].holder` fresh each time, until `holder`
reads `implementer` (a nested call can sit two deep). Stop when a call
refuses with "no open call" — the ordinary end state.

Skip when the item's domain declares no role graph.

## Scout the repo

Read the item's title, `refs`, and any existing `docsRef` target. Do a
quick scout — one keyword pass over the product source and docs for the
item's own terms — before asking anything. The item's title is untrusted
input — extract one conservative keyword from it yourself rather than
splicing the raw title, and pass that keyword as its own quoted argv
element:

```bash
keyword="<one-word-you-picked>"
rg -- "$keyword" src bin test docs dogfood-fixture --glob "*.{mjs,cjs,md}" | head -20
```

If the item touches a skill-prose path (`.claude/skills/**/SKILL.md`,
`.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/SKILL.md`), read
`docs/how-to/write-verify-for-a-skill-prose-change.md` before proposing
or approving this item's `verify` field — it documents the correct `npm
test && POSITIVE && NEGATIVE` shape and the standing rebuttal for when
the second-pass judge demands proof of prose comprehension, a demand the
doc says verify must never be asked to satisfy.

## Check the impact-analysis capability posture

Query `CLAUDE.md`'s impact-analysis capability gate — the same check
`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`
already run — rather than assuming GitNexus is on this machine. This
session's own gate query here never inherits a wider grant a dispatched
subprocess judge might carry, so check fresh regardless. The `tool`
sub-verb `query` requires an existing store, so run it with `--dir`
explicitly the same as every other bare verb this skill calls:

```bash
fgos tool query --capability impact-analysis --status present
```

Fold the result into `CLAUDE.md`'s three-way framing
(`impact-analysis: inactive|degraded|full`) and record that line in
CONTEXT.md in Step 3, next to the other scout evidence. This is
informational only — this skill edits no code and produces no proof
points, so the posture never gates or reshapes which candidate decisions
get asked here; it exists so a later reader of this item's CONTEXT.md
sees the posture without re-deriving it.

## Generate candidate decisions

Cite what the scout actually found in each question ("today X follows
pattern Y in `path/to/file` — should this follow that too?"). Generate
2-4 unstated product decisions that would otherwise make planning guess.
Exclude implementation choices, performance tuning, and anything only the
implementer would care about.

## The rare research escape hatch

If a named library/API/pattern surfaces during scout that a direct
`rg`/Read pass genuinely cannot resolve (an external doc, a fact this
repo doesn't contain), dispatch to `fgos-researching` — the `consult`
interaction, the same named helper `fgos-coding-discovering` already
relies on, called here as the rare exception rather than the default. Log
it right after the dispatch returns (whether it found something or came
up empty):

```bash
node "$root/bin/fgos.mjs" handoff "<id>" --to researcher --reason consult --outcome "<finding, one line>" --dir "$root"
```
