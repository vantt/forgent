# tsk-52g-2 — Iron Law evidence

Gate result (`classifyIronLaw`, run against the branch diff):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/intake/classify.mjs","src/runner/loop.mjs","src/state/store.mjs"]}
```

## The matched modules are not this item's own change

`classifyIronLaw` (`src/evolve/iron-law.mjs`) tests `changedFiles`
(`src/runner/merge.mjs`), which diffs `trunk...fgw/tsk-52g-2`. This item's
branch was taken from `fgw/tsk-52g` at `b1aba62` — the point after the
sibling item `tsk-52g-1` had already merged into it — so the trunk diff
necessarily carries `tsk-52g-1`'s own commits along with this item's.

This item's own commit, isolated:

```
git diff --name-only b1aba62..HEAD
```
```
.claude/skills/fgos-submit-assist/SKILL.md
plugins/fgOS/skills/submit/SKILL.md
src/intake/plan.mjs
```

None of these three paths match any `MODULE_RULES` entry in
`src/evolve/iron-law.mjs`. All three matched modules
(`src/intake/classify.mjs`, `src/runner/loop.mjs`, `src/state/store.mjs`)
are `tsk-52g-1`'s changes, already carrying their own failing-test-first
proof at `docs/history/tsk-52g-1/iron-law-evidence.md` (committed on this
same branch's ancestry, commit `47ac65b`). This file does not repeat that
proof; it points at it.

## This item's own change has no applicable failing-test-first proof

`tsk-52g-2`'s diff is prose and prompt-instruction text: two `SKILL.md`
files and one string literal inside `buildDecomposePrompt`
(`src/intake/plan.mjs`). It adds guidance for whoever writes the free
text a title gets derived from, and for the LLM composing a child item's
title at `decompose` — neither is asserted by any test. Confirmed before
editing: no test in `test/intake/plan.test.mjs` snapshots or asserts
on the prompt's literal text (the file's own comment at line 325 notes
exactly this — no test asserts on the actual prompt string sent to the
executor).

Fabricating a failing test for a prose change would misrepresent what
"failing-test-first" means here. Instead: the item's own `verify` command
was run and confirmed failing before the edit and passing after, which is
the closest real analogue available for a documentation-shaped change.

```
grep -q 'đối tượng.*hành động.*phạm vi\|object.*action.*scope' plugins/fgOS/skills/submit/SKILL.md
```

Before this item's edit, `plugins/fgOS/skills/submit/SKILL.md` contained
no such phrase (confirmed by reading the file prior to editing — the skill
covered dependency-confirmation steps only, no title guidance). After the
edit: exit 0.

The full suite this item's diff could plausibly affect stayed green
throughout:

```
node --test test/intake/plan.test.mjs test/state/store.test.mjs test/runner/loop.test.mjs
ℹ pass 132
ℹ fail 0
```

## Flag for a follow-up item

Every leaf item branching from an unmerged parent branch will trip
`required: true` on its parent siblings' already-evidenced modules, purely
from `changedFiles`' trunk-diff semantics, regardless of what the leaf's
own commit touches. The evidence-consumer read path is keyed per-item-id
(`docs/history/<id>/iron-law-evidence.md`, per
`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D3), so it
cannot find a sibling's differently-named evidence file even when the
matched modules are entirely that sibling's. Filed separately rather than
fixed here — an `executing`-stage item does not redesign the gate it is
being asked to satisfy.
