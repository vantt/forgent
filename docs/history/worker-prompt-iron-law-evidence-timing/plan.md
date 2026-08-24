# Plan — tsk-3ys: Iron Law evidence timing in the out-of-process worker prompt

Mode: tiny

Lane derived directly from `fgos-routing`'s own Mode-gate table (no prior
session had decided one — this item's discovery verdict was `clear`, which
skips `exploring` entirely, and `fgos-coding-driving` claimed it straight
into `planning` with no lane in context). Flag count: 1 — only "existing
covered behavior" applies (the golden byte-for-byte test in
`test/runner/prompt-templates.test.mjs` pins this template's current
content). None of the other nine flags apply: no auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
weak proof, or multi-domain concern. 0-1 flags → tiny/small; "tiny" fits —
a couple of files, one direct task (the template addition plus its own
pinned test), no gray areas.

No `exploring` round happened for this item (discovery verdict was
`clear` — RESEARCH.md's Round 1 resolved every open point directly from
the repo), so there is no `CONTEXT.md`; this plan cites RESEARCH.md's Round
1 findings instead, each with its own `file:line` citation already recorded
there.

Impact-analysis posture: **full** (GitNexus registered and `present`, per
`fgos tool query --capability impact-analysis --status present`) — but its
own index under-reported `classifyIronLaw`'s real call sites (only found
the test file, missed `src/runner/iron-law-gate.mjs:59` and its three merge-
verb callers) versus a plain `rg` cross-check, per `AGENTS.md`'s own gate
note that `present` never guarantees a fresh/complete index. `rg` was used
as the primary evidence for every citation in RESEARCH.md's Round 1; GitNexus
was consulted but not solely relied on. This item touches only a prompt
template and its own test — no blast-radius proof point is needed beyond
that cross-check.

## Approach

**Chosen path:** add one new section, `# Iron Law evidence`, to
`src/runner/prompt-templates/worker-prompt-skill-pointer.txt` only —
between the existing `# Worktree boundary` and `# How to finish` sections
(the latter landed from tsk-3km, already merged to main; this plan builds on
top of it, does not touch its text). The new section instructs the
out-of-process worker to, AFTER its own commit lands and BEFORE reporting
`[DONE]`:

1. Run `classifyIronLaw` against its own real committed diff (never before
   committing — see "Rejected: precomputing at prompt-build time" below).
2. If `required: false`, do nothing further.
3. If `required: true`, produce real failing-test-first proof following
   `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
   stash-based recipe, write `docs/history/<id>/iron-law-evidence.md`, and
   commit it as a follow-up commit — before reporting `[DONE]`.

**Rejected: precomputing `required:true/false` at prompt-build time and
injecting it as prompt data.** RESEARCH.md Round 1: `classifyIronLaw`'s
`filesChanged` comes from `changedFiles()` (`src/runner/merge.mjs:364-378`),
which diffs `trunk...branch` — meaningless before the worker has committed
anything. The item description floated this as an open option; it is
infeasible, not just unused, so the fix must teach the worker to run the
classification itself, post-commit.

**Rejected: copying the driver-side script verbatim
(`listWork('.fgos').work[id]`).** RESEARCH.md Round 1: a linked worktree
(where every out-of-process worker runs) never carries its own `.fgos/`
(ADR0020, confirmed live — `ls -la .fgos` from this item's own worktree came
back "No such file or directory"), and the template's own existing
Constraints section already forbids touching `.fgos/` at all. `changedFiles`
only actually needs `item.id` (`src/runner/merge.mjs:364` — used solely to
resolve the branch name via `branchNameFor`), so the worker-facing script
drops the `listWork`/`.fgos` dependency entirely and derives its own id from
its current branch name (`fgw/<id>`, stripped) instead — a worktree shares
the same git object database/refs as the main checkout, so `git diff
trunk...branch` run with `repoRoot: '.'` resolves correctly from inside the
worker's own worktree.

**Rejected: touching `worker-prompt-default.txt` or
`worker-prompt-discovery.txt` too.** RESEARCH.md Round 1:
`src/runner/prompt-templates.mjs:35-38` — `worker-prompt-skill-pointer.txt`
is the only template selected for `domain: 'coding'`, the only domain whose
own source (`src/evolve/iron-law.mjs:19-33`'s `MODULE_RULES`) the Iron Law
can ever flag. `worker-prompt-default.txt` serves every other domain, none
of which can touch fgOS's own self-modifying source. Matches the item's own
description, which names only `worker-prompt-skill-pointer.txt`.

**Files touched, in order:**
1. `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` — add the
   new section (below).
2. `test/runner/prompt-templates.test.mjs` — update the one golden
   byte-for-byte test that pins this template's full rendered output
   (`renderTemplate(worker-prompt-skill-pointer.txt, ...) golden output —
   no-feedback shape, byte-for-byte`, currently lines 151-228) to include the
   new section text at the right position. No other test in this file reads
   `worker-prompt-skill-pointer.txt`'s literal body (the `selectTemplate`
   tests only check which filename is chosen; the `hashTemplate` test only
   exercises `worker-prompt-default.txt`).

**Risk map:** low. A prose/template-only change plus its own pinned test —
no runtime logic in `src/evolve/iron-law.mjs`, `src/runner/merge.mjs`, or
`src/runner/dispatch/prepare.mjs` is touched (confirmed no new
`renderTemplate` var is needed — RESEARCH.md Round 1 — so `prepare.mjs`
itself does not change). Proof point: the existing golden test failing red,
then green, after the template edit — no blast-radius tool needed beyond the
`rg` cross-check already done above.

## Shape

### 1. New template section (`worker-prompt-skill-pointer.txt`)

Insert directly after the existing `# Worktree boundary` paragraph and
before the existing `# How to finish` heading, verbatim:

```
# Iron Law evidence
This repo is self-modifying: fix any of its own runner/evolve/state modules
(`src/evolve/iron-law.mjs`'s `MODULE_RULES`) and one extra guardrail applies
— proof a fix was validated against a real failing test before it existed.
AFTER your implementation is committed on this branch (running this BEFORE
committing reads an empty diff and gives a false "not required" — see
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
"Watch out for" section), classify your own diff:

```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
const id = process.argv[1];
const description = process.argv[2];
console.log(JSON.stringify(classifyIronLaw({ filesChanged: changedFiles('.', { id }), description })));
" "<your item id — your current branch name, \`git branch --show-current\`, with the fgw/ prefix stripped>" "<your item's own Description text, verbatim, from the Description section above>"
```

If the result's \`required\` is \`false\`, do nothing further. If
\`required\` is \`true\`, you must produce real failing-test-first proof
before reporting \`[DONE]\` — see
\`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md\`
for the full recipe: identify the test file(s) covering your change, \`git
stash push --\` the IMPLEMENTATION files only (never the test files), run
the same test command and capture the real failing output (red — paste the
actual stderr/assertion text, never a paraphrase), \`git stash apply\`
(never \`pop\`, until green is reconfirmed) to restore your fix, rerun the
same command and confirm it passes (green), then write
\`docs/history/<your item id>/iron-law-evidence.md\` with the matched
flags/modules from the classification above and the real red/green
transcript excerpts, and commit it as a follow-up commit on this branch —
before reporting \`[DONE]\`. Skipping or fabricating this evidence when
\`required\` is \`true\` is not a valid way to finish.
```

Note for the implementer: the fenced block above is shown escaped
(backslash-quoted backticks) only because it sits inside this plan's own
markdown fence — write it into the `.txt` template with plain, unescaped
backticks.

Do not touch the existing `# How to finish` section's own text (tsk-3km,
already on main) — the new section's own last line already establishes the
ordering ("before reporting `[DONE]`"), so no cross-edit is needed there.

### 2. Golden test update (`test/runner/prompt-templates.test.mjs`)

In the `golden` template literal (currently lines 166-225), insert the
rendered new section's exact text between the existing `# Worktree
boundary` paragraph (ending `...another worktree. Relevant refs:
${refs}.`) and the existing `# How to finish` heading — same relative
position as the template file itself. The section is static template text
with no `{placeholder}` in it (`renderTemplate` substitution is a no-op for
it), so the golden string's added text is identical to what step 1 above
adds to the template file, verbatim (accounting for the test file's own
existing backtick-escaping convention already used elsewhere in that golden
literal, e.g. line 194's `` \`[DONE]\` ``).

Sketch of what this proves: a boundary case worth checking after the edit —
render with the same fixture vars already used by the golden test (no
`{id}`/description-dependent placeholder was added, so no new fixture var is
needed) and confirm the output is still byte-for-byte stable. `tiny` mode:
no further case sketch needed beyond the existing golden/`selectTemplate`
coverage already in this file.

### Verify

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/prompt-templates.test.mjs`
— confirmed real and runnable (ran it clean, 12/12 passing, against the
pre-change state, during discovery).

## Outstanding questions

None
