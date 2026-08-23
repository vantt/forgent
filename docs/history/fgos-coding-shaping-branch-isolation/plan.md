# Plan — fgos-coding-shaping branch isolation

Item: tsk-5qs | CONTEXT.md: same directory

## Mode

**standard** — flag count: 1 hard flag (`public contracts`: `/fgOS:coding-
shape-distill`'s own invocation signature changes from `<doc-path>` to
`<doc-path> [id]`, D3) plus story-sized behavior — 3 files change
(`.claude/skills/fgos-coding-shaping/SKILL.md` + its byte-identical mirror
`.agents/skills/fgos-coding-shaping/SKILL.md`, and
`plugins/fgOS/skills/coding-shape-distill/SKILL.md`), each getting a real
new branch of Flow logic (submit-routing, claim+worktree, doc-derived
auto-create, existing-id attach). No `fgos-routing` Orient handoff exists
in this session's context (entered via `/fgOS:cook`'s own queue-drain, not
a `/fgOS:pick` claim) — per the Bootstrap direct-entry fallback, neither
check 1 (`plan.md` pre-existing `Mode:` line) nor check 2 (an Orient-step
handoff already in context) holds, so this lane is decided directly from
`fgos-routing`'s own Mode-gate table here: 1 hard-gate-adjacent flag +
story-sized multi-file behavior lands squarely on `standard`, not
`tiny`/`small`.

`fgos graph --json` confirms tsk-5qs sits in its own size-1 component (no
deps, no children) — not on any critical path, nothing to order against.

## Approach

Chosen path: apply D1-D4 (all locked in `CONTEXT.md`) as edits to
`fgos-coding-shaping`'s own Flow (the substance) plus a narrow signature
change to the `coding-shape-distill` wrapper (D3's own contract). The
`coding-shape` (live) wrapper needs no edit — D2's free-text-auto-submit
logic lives entirely inside `fgos-coding-shaping` itself, and the wrapper
already "passes the argument through unexamined" (its own SKILL.md,
step 1), which is already compatible with `fgos-coding-shaping` doing more
with that argument.

Alternatives considered and rejected:
- **Reopen `fgos-coding-driving`'s claim-timing rule** — rejected per D1.
  Real, but a separate, wider architectural question; the user chose the
  narrow fix now over waiting on that.
- **Wait on `tsk-5wr`'s backlog-status work** — rejected per D1. That item
  is unresolved and, per its own `RESEARCH.md`, orthogonal to branch/
  worktree placement even once built.
- **Keep `coding-shape-distill`'s signature as bare `<doc-path>`, always
  auto-create** — rejected per D3. User: real use cases want to distill
  into an already-existing item sometimes.
- **Design a new multi-worktree mechanism for a cluster of related
  items** — rejected per D4. The premise doesn't arise: `fgos-coding-
  shaping` never creates child items itself, so at most one real item is
  ever claimed during a live session.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `fgos-coding-shaping/SKILL.md` Flow step 1 (+ mirror): add submit-routing (free-text → `submit`, D2) and claim+`EnterWorktree` (before any `DISCUSSION.md` write) branches | Medium — this is the actual behavior fix; getting the id-vs-free-text branch wrong (e.g. re-submitting an existing id) would recreate the bug in a new shape | Verify command below: grep-based POSITIVE/NEGATIVE against both mirror files, per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item touches `.claude/skills/**/SKILL.md`) |
| `.claude/skills/fgos-coding-shaping/SKILL.md` vs. `.agents/skills/fgos-coding-shaping/SKILL.md` staying byte-identical | Low — mechanical, same "edit both together" discipline `tsk-5y5` already used for `fgos-coding-driving`'s own mirror pair | `diff` between the two files exits 0 after the edit |
| `coding-shape-distill/SKILL.md` signature change (`<doc-path>` → `<doc-path> [id]`, D3) | Low — additive, optional trailing arg; existing bare-`<doc-path>` invocations keep working (falls into the "no id" auto-create branch, same as today's only behavior) | Verify command below: grep for the new signature string and the `[id]`-branch description |
| Existing hard rule "Commit `DISCUSSION.md` to the item's `fgw/<id>` branch" | Low — already correct prose; becomes actually true once claim+worktree precedes it, no wording change needed there | Covered by the Flow-step verify above; no separate proof point |

Impact-analysis capability gate (`CLAUDE.md`): checked in `fgos-coding-
exploring` (GitNexus present, freshly checked → **full** posture) — moot
for this item regardless, since no symbol/function is edited, only skill
prose; no blast-radius proof point applies.

Files touched:
- `.claude/skills/fgos-coding-shaping/SKILL.md`
- `.agents/skills/fgos-coding-shaping/SKILL.md` (mirror, edited together)
- `plugins/fgOS/skills/coding-shape-distill/SKILL.md`

Order: single atomic change across all three files in one commit — the
mirror-pair invariant and the Flow/wrapper consistency both require it;
no partial-landing state is meaningful here.

## Shape

Phased plan (standard mode):

1. **`fgos-coding-shaping/SKILL.md` Flow step 1** ("Locate or create
   `DISCUSSION.md`"): before ever writing the file, add:
   - If invoked with free text and no existing item (`coding-shape`'s own
     free-text case) or with a `<doc-path>` and no `id` (`coding-shape-
     distill`'s new no-`id` case, D3): call `fgos submit` (or the doc-
     derived-text variant for distill) to create the item, per D2/D3.
   - If invoked with an existing id (either wrapper): skip `submit`
     entirely.
   - Either way, before creating/opening `DISCUSSION.md`: claim the item
     (`fgos pick <id> --dir "$root"`) and `EnterWorktree` into
     `data.worktree.path` — the same pattern `fgos-coding-driving`'s own
     claim hard rule and `/fgOS:pick` steps 2/4 already use. Only then
     create/open `docs/history/<feature>/DISCUSSION.md`.
   - If the session is resuming an empty-argument call (`coding-shape`'s
     "resume" case) and is already inside a worktree from an earlier
     claim in this same thread, skip claiming again — same
     already-claimed short-circuit `fgos-coding-driving`'s own claim rule
     uses ("If it is already `doing`... skip claiming").
2. **Mirror the same edit into `.agents/skills/fgos-coding-shaping/
   SKILL.md`** in the same commit; confirm `diff` exits 0 afterward.
3. **`coding-shape-distill/SKILL.md`**: update the frontmatter
   `description` and step 1 to the new `<doc-path> [id]` signature (D3):
   with `id`, pass it through to `fgos-coding-shaping`'s distill entry as
   the target item; without `id`, note the doc-derived-auto-create
   behavior now happens downstream (in `fgos-coding-shaping` itself, per
   step 1 above) — this wrapper still carries no logic of its own, only
   the updated argument-reading description.
4. No change needed to `coding-shape/SKILL.md` (the live wrapper) — its
   existing "pass the argument through unexamined" step 1 already covers
   D2 without modification.

Concrete cases worth being able to point to afterward (standard-mode
depth):
- Free-text `/fgos:coding-shape <mô tả>` with no existing item: item gets
  created via `submit`, claimed, worktree entered, THEN `DISCUSSION.md`
  written — never before.
- Existing-id `/fgOS:coding-shape tsk-xyz`: no `submit` call; claim +
  worktree happens directly.
- `/fgOS:coding-shape-distill some-report.md` (no `id`, today's only
  form): auto-creates an item from the doc's own title/first line, same
  claim+worktree sequencing.
- `/fgOS:coding-shape-distill some-report.md tsk-xyz` (new `[id]` form):
  distills into the existing `tsk-xyz`, no `submit` call.
- Empty-argument resume mid-thread, session already in a worktree from an
  earlier claim: no duplicate claim attempted.
- A reader of the mirror files after the edit sees byte-identical content
  (`diff` exits 0).

End `plan.md`'s own outstanding-questions section:

## Outstanding questions

None

## Split

No split. One honest piece of work — all three files edited together in a
single commit, no child items created (D4 already rules out `fgos-coding-
shaping` itself ever creating children; this plan does not either, since
the fix is one coherent skill-prose change, not several independently
workable pieces).

## Proof surface (for the gate below and for `fgos-coding-validating`)

Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item
touches `.claude/skills/**/SKILL.md`, `.agents/skills/**/SKILL.md`, and
`plugins/fgOS/skills/**/SKILL.md`):

```
npm test \
  && grep -q 'claim (`fgos pick <id>`)' .claude/skills/fgos-coding-shaping/SKILL.md \
  && grep -q 'claim (`fgos pick <id>`)' .agents/skills/fgos-coding-shaping/SKILL.md \
  && grep -q 'coding-shape-distill <doc-path> \[id\]' plugins/fgOS/skills/coding-shape-distill/SKILL.md \
  && diff .claude/skills/fgos-coding-shaping/SKILL.md .agents/skills/fgos-coding-shaping/SKILL.md \
  && ! grep -q '/fgOS:coding-shape-distill <doc-path>\.' plugins/fgOS/skills/coding-shape-distill/SKILL.md
```

(The exact grepped phrases above are placeholders for the real prose
`fgos-coding-implement` will write — pin them to whatever exact phrasing
lands, per the "grep from đơn quá yếu" trap in the how-to doc; the shape
— `npm test && POSITIVE && POSITIVE && POSITIVE && diff (mirror invariant)
&& NEGATIVE` — is what's locked here, not the literal strings.)

This is the item's own real `verify` field going into the gate below,
recorded via `gate-approve` — no medium/high risk entries beyond what the
risk map above already carries, so no additional `fgos-coding-validating`
proof point is needed beyond re-confirming this command is runnable and
matches what actually got written.
