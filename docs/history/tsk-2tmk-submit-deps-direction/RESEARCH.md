# RESEARCH: tsk-2tmk — /fgOS:submit deps-direction ambiguity

## Round 1 — 2026-08-23 (discovery stage, fgos-coding-discovering via fgos-researching)

**Asked:** Does fgOS's work-item schema already have a non-blocking
"old item will be superseded/replaced by the new item" relation distinct
from the blocking `deps` relation? If so, how is it set, and what does
existing narrative say about its intended use?

**Checked (repo, `rg`/direct read):**

- `plugins/fgOS/skills/submit/SKILL.md:65-146` (steps 2/3/5) — the scan
  step only ever finds a candidate and asks confirm/edit/reject; every
  branch of step 5 attaches the confirmed/edited ids as `--deps` on the
  **new** item, or omits `--deps` entirely on reject. There is no branch
  that writes anything onto the **candidate's** own record.
- `src/state/work.mjs:342-363` — `supersededBy` is a real, validated
  field: directed, singular ("the id of the ONE item that replaces this
  one"), self-reference rejected (`work.mjs:360-362`). Sibling field
  `duplicates` (undirected array, `work.mjs:364-...`) is informational
  only. Comment at `work.mjs:342-355` states both mirror bd's own
  `supersedes`/`duplicates` non-blocking dependency-type split and that
  neither participates in the unified blocking-cycle graph
  (`dep-graph.mjs`) or `frontier.mjs` start-eligibility — i.e. setting
  `supersededBy` never creates a deps-style block.
- `src/state/work.mjs:777-786` — `validateSupersededBy` enforces the
  target id exists (mirrors `validateMergeAfter`), so a typo'd/deleted
  target fails loud at write time.
- `bin/fgos.mjs:1677-1691` — the `edit` verb's flag parsing:
  `patch.supersededBy = flags['superseded-by'] === '' ? null : flags['superseded-by']`.
  This flag exists ONLY on `edit`.
- `src/cli/command-registry.mjs:123-151` (`submit` verb's full parameter
  list) — no `superseded-by`/`duplicates` parameter at all; `submit` only
  accepts `deps`, `discovered-from`, plus classification/verify/docs-ref
  fields. **Confirmed: `supersededBy` cannot be set at item-creation
  time — only via a later `fgos edit <id> --superseded-by <target-id>`
  call, which requires the target id to already exist.** This matters
  directly for the reporter's scenario: the "new" item's id does not
  exist until `submit` (step 5) returns it, so any supersede-direction
  write has to happen as a follow-up `edit` call on the OLD candidate
  id(s), after the new item is created — never in the same call as
  `submit`.
- `docs/history/tsk-2ie-duplicate-superseded-guard/CONTEXT.md` (full
  file) — the locked design record for this field. Pinned term (line
  44-46): *"supersededBy — a directed, singular field: the id of the
  OTHER item that replaces this one. Presence means 'I lose, that one
  wins'."* D2 (line 38): `mergeReadiness` excludes an item carrying
  `supersededBy: B` from `ready` once B resolves or is itself about to
  merge in the same batch — i.e. today's only consumer of this field is
  merge-time exclusion, not submit-time dependency scanning. No existing
  narrative anywhere connects `supersededBy` to `/fgOS:submit`'s
  candidate-scan flow.

**Found:** The exact non-blocking relation the reporter asked for already
exists (`supersededBy`), and its semantics map directly onto the
reporter's own worked example: `tsk-1am`/`tsk-13r` (the old, stuck items)
should each have gotten `supersededBy: tsk-3me` set (an `edit` call after
`tsk-3me` was created), never `deps: [tsk-1am, tsk-13r]` on `tsk-3me`
(which reversed the direction and created the deadlock). The field, its
validation, its write path (`edit` only, target-must-exist), and its
"I lose, that one wins" semantics are all settled, cited facts — not
speculation.

**Still open (not resolvable from repo evidence — a product/scope
decision, not a research gap):**

1. Should `/fgOS:submit` step 3's prompt become a 3-way choice
   (confirm-as-deps / mark-candidate-as-superseded / reject), replacing
   today's confirm/edit/reject — or add a 4th path alongside the
   existing three? Wording/UX shape is a judgment call, not something the
   repo already answers.
2. Sequencing: the skill would need to run `fgos submit` (step 5) FIRST
   to obtain the new item's real id, THEN a follow-up
   `fgos edit <candidate-id> --superseded-by <new-id>` per confirmed
   candidate. Should this be one new step 6, and should it loop for
   multiple candidates confirmed as "superseded" in the same submit call?
3. Should step 2's textual-match scan also proactively flag "this reads
   like it replaces/consolidates an existing item" (as evidence for
   offering the supersede branch), or does the direction question only
   ever apply to whatever step 2 already found via today's blocking-deps
   heuristic?
4. Scope: is this fix confined to `plugins/fgOS/skills/submit/SKILL.md`
   (Claude Code skill prose only, no engine change — `submit`/`edit`
   verbs stay as-is), or does it also want `fgos submit` itself extended
   with a `--superseded-by` intake-time flag to avoid the two-call
   sequencing in point 2?

**Verdict: unclear.** The mechanism to use (`supersededBy`) and its
constraints are fully evidenced and clear. What remains open is the
UX/sequencing/scope shape of the fix itself — genuine product decisions
that belong to a person at `exploring`, not something this discovery pass
should self-judge.
