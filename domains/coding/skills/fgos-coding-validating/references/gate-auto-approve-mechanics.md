# Gate Step 2: auto-approve mechanics — full bash

The full detail behind SKILL.md's Gate Step 2.

Run the `root=$(...)` line and the `gate-check` call below as two
SEPARATE tool calls, never pasted together as one script — a
worktree-isolated session's own isolation guard refuses a single call
combining a `git`-rooted command with a following `node` invocation,
even though each command is safe alone. Resolve `root` alone first, read
its printed value, then substitute that literal path into the second,
separate call.

```bash
fgos gate-check "<item-id>" --gate validateApprove --plan "docs/history/<feature>/plan.md" --children '<the child-spec JSON array from plan.md, or []>' --cost "<REVERSIBLE|EXPENSIVE>"
```

Four axes, and every one of them can only push toward **asking**, never
toward silence. That monotone direction is what makes the self-reported
cost verdict safe alongside the mechanical gate-bypass floor: this
skill's own judgment can raise the bar, and can never talk the mechanical
floor below it down.

- the hard-gate keyword floor, over the item's text **plus the plan's
  structured fields** — footprint paths and child `title`/`verify`/
  `action`. Narrative prose is deliberately excluded: it would trip on
  the large majority of this repo's own real plan.md files, on words
  like "audit"/"auth"/"security" that are everyday vocabulary here
  rather than a danger signal.
- the tier ceiling — which measures **how much the person has
  delegated**, not how risky the work is. Size and reversibility are
  different things; do not read a covered tier as "this is safe".
- the mechanical open-items scan of plan.md.
- the cost verdict from Gate Step 1.

`gate-check` wraps the engine's own auto-approve check behind the CLI's
own static imports — the CLI resolves its own import path against its
own file location, never the caller's cwd or repo root, which is what
lets it resolve correctly from any install shape (dev checkout, global
npm install, npx) with zero special-casing.

The cost verdict is this skill's own, computed in Gate Step 1 and passed
directly — never re-derived or re-read from a file. Read the verb's
`data.canAutoApprove` field (`true`/`false`) from its JSON output; treat
anything else — `false`, a non-zero exit, a malformed response — as
`false`: fail closed, never skip the question on a check that couldn't
run cleanly.

Either branch below records a structured approve record — separate from,
and in addition to, any `fgos decision` line this session already
logged: `fgos gate-approve <item-id> --gate validateApprove --actor
<human|bypass> --verify "<verify>"`. The gate keeps the record name
`validateApprove` even though it now covers both retired predecessor
gates, so items already carrying gate history need no migration.
`verify` is the item's own current `verify` field (`fgos list --id
<item-id> --json`'s `data.work[id].verify`, read fresh) — this skill
proves the plan's existing verify still holds against reality, it does
not design a new one.

## `true` branch

Skip the question. Post the non-question line `auto-approved:
validateApprove (gate-bypass level <level>)`, log it:

```bash
fgos decision --id "<item-id>" --text "auto-approved validateApprove gate for <item-id> at level <level>" --rationale "gate-bypass level <level> permits auto-approval per the gate-bypass feature's own locked decisions (see docs/history/gate-bypass/CONTEXT.md)" --relation "touches:<the gate-bypass feature's own decision item, from docs/history/gate-bypass/CONTEXT.md>" --kind engine
```

— the text only cites the gate-bypass feature's own decision rather than
superseding it, so the relation flag says `touches`; every `fgos
decision` write still declares its relation explicitly, no default. **`--kind
engine` is required on this line, never omitted:** this is the machine
recording its own auto-approve of its own gate, not a person's design
decision, and an omitted `kind` defaults to `'design'` — which the
retrospective/cleanup gate reads as a human reflecting on the work,
satisfying that gate on an item where retrospective never ran. Omitting
`--kind` here silently reopens that hole.

Record the approve (`fgos gate-approve <item-id> --gate validateApprove
--actor bypass --verify "..."`, per above), then continue straight to the
`planning`→`executing` engine call below.

## `false` branch

Ask. **Ask to adjust the plan together, never for permission.** The
shape of that question is the point of this whole gate, so it is
prescribed, not left to taste:

- Present **only the thing you are stuck on**. Do not restate the whole
  plan and end with one closed question — that is precisely the
  empty-gate failure this design exists to remove.
- Show **your own attempt first**: which options you compared, what
  evidence you gathered, what tier A already ruled out. The person
  should be editing your reasoning, not starting from nothing.
- Ask for **the specific input you are missing** — not "approve?".
- If several things are stuck, **batch them into one round**, so one
  visit answers as much as possible.
- When the reality gate produced constraints but no trigger fired, name
  the constraints plainly in the same message — they are context for the
  question, not a question of their own.

Once the person answers, fold their answer into plan.md, record it
(`fgos gate-approve <item-id> --gate validateApprove --actor human
--verify "..."`, per above), then continue to the `planning`→`executing`
engine call below.

## The `planning`→`executing` engine call

Immediately after the gate-approve record, fire the `planning`→
`executing` engine call itself, reading the split decision straight from
plan.md's own Step 4 (never re-derived here — `fgos-coding-planning`'s
job, already done and already cited). **This is where split children
first become real** — nothing created them earlier:

```bash
# plan.md's step 4 said "one honest piece" -- no split:
fgos plan "<item-id>" --verdict pass-through --reason "<why plan.md called this one piece>"
# plan.md's step 4 wrote child specs instead -- hand that same JSON block
# through verbatim ({title, verify, action, kind?, risk?, refs?, footprint?,
# deps?}), never a re-derived or re-worded version of it:
fgos plan "<item-id>" --verdict decompose --reason "<why plan.md called for a split>" --children '<the JSON array plan.md already carries>'
```

`--verdict decompose --children` is now the **only** way a split child
is created, and it is the right one: the child normalizer re-validates
every spec (rejecting the whole verdict over a missing `verify` or an
`action` that cites no real decision id), and the engine then creates
each child at `stage: executing` carrying its `action` prose — so
children arrive ready to be built and never repeat a gate of their own.
If the verdict is rejected, that is trigger T3 speaking: fix the spec in
plan.md or take the question back to the person; never loosen the spec
to get the write through.

The verdict reached at the Gate does not, by itself, move the item
anywhere — it only informs which of the item's own already-registered
edges this session picks next; the `fgos plan` call above is what
actually validates and applies that move, never a substitute for it.
