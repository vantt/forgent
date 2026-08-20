# Plan — tsk-jyn

Mode: tiny

0 risk flags apply (no auth/authorization/data-model/audit-security/
external-system/public-contract/cross-platform/covered-behavior/
weak-proof/multi-domain concerns) — a couple of files, one direct,
mechanical task: split every glued `root=$(...)` + follow-on call in the
2 target files into two separate ```bash blocks and add the established
explanatory note, matching an already-verified, verbatim-confirmed
pattern from 4 sibling files.

## Approach

**Chosen path:** copy tsk-3rg's exact note shape (prose + two split
```bash blocks) into the 2 target files. Evidence for the exact wording:
`RESEARCH.md` Round 1 (2026-08-20), which quotes all 4 sibling instances
verbatim with `file:line` citations.

**Scope correction found during this Approach step (direct re-read of
both target files, full text, every `root=$(...)` occurrence — not a new
`fgos-researching` round, since this is Planning's own normal job of
citing concrete evidence, not resolving a named-library/pattern unknown):**
tsk-jyn's own description undersells the fix as "Step 1"
(`loop-mechanics.md`)/"the Orient step" (`fgos-coding-discovering`), but
a full re-read shows a materially larger true scope:

- `fgos-coding-driving/references/loop-mechanics.md` — **6 of 6**
  `root=$(...)` occurrences are glued (single shared ```bash block, no
  split, no note), not just the Step 1 one: lines 17-20 (Step 1, `fgos
  list`), 87-90 (Step 5, pane-labeling `bash rename.sh`), 107-110 (Step 6,
  `fgos pick`), 119-122 (Step 6, `fgos take`), 133-136 (Step 6,
  `resync-worktree`), 157-160 (Step 7, `handoff-return`). All 6 are real
  live-refusal risk — confirmed directly: this very drive hit the exact
  Step 1 refusal live this session (2026-08-20), forcing a manual 2-call
  split, and the other 5 blocks share the identical glued shape.
- `fgos-coding-discovering/SKILL.md` — only **1 of 3** occurrences is
  actually glued: lines 183-191 (Step 5, engine-verb block: `root=$(...)`
  followed by 3 `node` calls in one shared block). The other 2 (lines
  115-121 Orient/reclaim, 146-152 Step 3/consult-log) are **already
  split** into two separate ```bash fences — just missing the
  explanatory prose note, not the safety split itself.

**Alternatives rejected:**
- Fixing only the single occurrence each file's description names
  (Step 1 in `loop-mechanics.md`, Orient in `fgos-coding-discovering`) —
  rejected: the other 5 glued blocks in `loop-mechanics.md` carry the
  exact same live-refusal risk (same guard, same glued shape), so a
  narrower fix would leave a known-bad pattern in place in the same file
  this item is already touching, for no reason grounded in the evidence.
- Writing a fresh note from scratch, paraphrasing the intent — rejected:
  the goal is *extending tsk-3rg's exact same note*, not inventing new
  wording; a paraphrase would drift from the 4 existing instances and
  make future greps for the note's fixed phrase ("two SEPARATE tool
  calls") miss these two files.
- A single shared reference fragment (e.g.
  `.agents/skills/_shared/worktree-isolation-note.md`) all sites
  `@`-import instead of repeating prose — rejected as out of scope: the
  4 existing sibling instances already repeat the prose inline with
  per-site wording variation (duplication-by-design, not an oversight),
  so introducing a shared fragment now would be a second, unrequested
  refactor beyond what this item asks for (YAGNI).
- Repeating the prose note at every one of `loop-mechanics.md`'s 6 sites
  — rejected: the sibling convention (confirmed in `fgos-coding-
  validating`'s two reference files, where the note appears once in
  `gate-auto-approve-mechanics.md` and the sibling
  `bootstrap-and-reality-gate.md` uses the same split shape with no
  restated prose) is to state the note once per file, at the first
  occurrence, and let the same split-block shape stand unexplained at
  later occurrences in that same file.

**Risk map:**

| Component | How risky | What would prove it |
|---|---|---|
| `fgos-coding-driving/references/loop-mechanics.md` — split 6 glued blocks + note at first (Step 1) | light — doc-only structural/prose edit, no code/behavior change | verify command below |
| `fgos-coding-discovering/SKILL.md` — split 1 glued block (Step 5) + note at first occurrence (Orient, already split) | light — same | same |

No medium/high-risk item in the map.

**Impact-analysis posture:** not invoked — no proof point here leans on
blast-radius evidence (markdown-only prose/structure edit, no code path
touched), so `CLAUDE.md`'s impact-analysis gate does not apply to this
plan.

**Files touched** (independent of each other, no ordering dependency —
`fgos graph --json` critical-path not needed):
1. `.agents/skills/fgos-coding-driving/references/loop-mechanics.md` —
   split all 6 glued blocks listed above into two ```bash fences each;
   add the explanatory note once, at the first occurrence (Step 1, lines
   17-20).
2. `.agents/skills/fgos-coding-discovering/SKILL.md` — split the one
   glued block (Step 5, lines 183-191) into two ```bash fences; add the
   explanatory note once, at the file's first `root=$(...)` occurrence
   (Orient/reclaim block, lines 115-121 — already split, note-only edit
   there).

## Shape

`tiny`-mode direct note. Per occurrence: turn one shared ```bash block
(`root=$(...)` + the following `node`/`bash` call) into two separate
```bash fences, mirroring the shape already used by the 4 sibling files
and by `fgos-coding-validating`'s own reference files. At each file's
first occurrence only, add the prose note using RESEARCH.md's
already-quoted verbatim wording, adapted for grammatical fit into that
occurrence's own surrounding sentence — never for content.

Concrete case this proves: after the edit, a session invoking any of
these 7 (6+1) blocks as two separate tool calls no longer needs to
improvise the split live — exactly the friction this drive hit for real,
live, this session, at `loop-mechanics.md`'s own Step 1. Checked
mechanically by the verify command below: POSITIVE confirms the note
text exists in both files; NEGATIVE confirms no glued `root=$(...)`
block remains in either file (the actual structural fix, not just the
note's presence).

**Verify** (per `docs/how-to/write-verify-for-a-skill-prose-change.md`'s
mandatory `npm test && POSITIVE && NEGATIVE` shape for any item touching
a `SKILL.md`/skill-prose path — applied to both target files here even
though `loop-mechanics.md` is a `references/*.md` file, not itself a
`SKILL.md`, since it is the identical class of LLM-interpreted skill
prose the doc's own reasoning covers):

```bash
npm test && grep -q "two SEPARATE tool calls" .agents/skills/fgos-coding-driving/references/loop-mechanics.md && grep -q "two SEPARATE tool calls" .agents/skills/fgos-coding-discovering/SKILL.md && ! grep -A1 "root=\$(git rev-parse" .agents/skills/fgos-coding-driving/references/loop-mechanics.md | grep -qE "^[[:space:]]*(node|bash) " && ! grep -A1 "root=\$(git rev-parse" .agents/skills/fgos-coding-discovering/SKILL.md | grep -qE "^[[:space:]]*(node|bash) "
```

This has NOT yet been synced onto the item's own `work.verify` field —
discovery synced an earlier, weaker POSITIVE-only version (2 `rg -q`
checks) before this Approach step found the true scope. Execution's
first step must sync this corrected command via `fgos edit --verify`
(single-quoted at the CLI layer per
`docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md`,
so the `\$` inside the double-quoted grep patterns reaches the stored
field literally) before relying on it.

## Split decision

No split. This is one honest piece — two doc-only edits (one larger,
one smaller) that both serve the exact same fix, well under any
threshold that would call for separate work items. No child specs below.

## Outstanding questions

None
