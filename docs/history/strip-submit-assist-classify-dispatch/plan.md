# Plan: strip fgos-submit-assist's cli-spawn dispatch to submit-assist-classify

Item: tsk-4ns (child of tsk-5wz, mergeAfter tsk-2ie5).
Mode: small

## Lane

One real flag applies (existing covered behavior — six other skills cite
the shared fragment this item touches) → **small**: two files, no product
gray area, but a real cross-file consequence to get right.

## Decisions this plan is built on

Inherited from `tsk-5wz`'s locked plan: evaluate, after the sibling
`tsk-3fj` rename lands, whether any of the four valid dispatch reasons
(`capacity-dispatch-fallback.md`'s own list: cheaper model / different
provider / resource isolation / parallelism) still applies to the renamed
capacity; strip the cli-spawn branch if none do.

Evaluated directly: none apply. The classify step's own input (the ask's
free text) is already in the calling session's context, and dispatching
only adds latency at the moment a person is waiting — this is the EXACT
reasoning `tsk-5wz`'s own original problem statement gave for why the
whole redesign exists. Confirmed: strip it.

## Real finding that changed this item's scope from what its own description assumed

The item's own description said "if that was `capacity-dispatch-fallback.md`'s
only remaining consumer, retire that shared fragment too." Checked with a
repo-wide grep: it is NOT the only consumer. Six other stage skills
(`fgos-coding-validating`, `fgos-coding-implement`, `fgos-fanout`, `fgos-coding-planning`,
`fgos-coding-exploring`, `fgos-researching`) cite this fragment's "Valid reasons
to dispatch" list directly, in their own never-delegate-reasoning rule.
Deleting the file would leave all six pointing at nothing.

Revised scope: `capacity-dispatch-fallback.md` stays. Only the three
literal mentions of `submit-assist-classify` inside it (an illustrative
example, a "one real live consumer" claim, and the Precedent section's
own retelling) get updated to stop asserting a live consumer that no
longer exists, while its actual reusable content (the four-reason list,
Steps A-D) is untouched.

## Approach

1. `.claude/skills/fgos-submit-assist/SKILL.md` step 2: remove the
   `capacity-dispatch-fallback.md` branch entirely (the
   `<CAPACITY_ID>`/`<PROMPT_TEMPLATE>`/response-reading paragraphs) —
   always "Classify it yourself" now, no optional dispatch. One short
   note left in its place, citing the retirement and why (tsk-4ns).
2. `.claude/skills/_shared/capacity-dispatch-fallback.md`: update its
   three `submit-assist-classify` mentions (Step A's example, Step B.5's
   "one real live consumer today" claim, and the Precedent section) to
   state plainly that no live Steps-A-D consumer remains, while the file
   itself is kept for its six other citing skills.
3. No `.fgos/config.json` change here — that already landed via `tsk-3fj`.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Stripping the dispatch branch without breaking `fgos-submit-assist`'s own flow | medium | full file re-read after edit, confirms steps 1/2/3 still read cleanly end to end (done above) |
| Leaving 6 other skills' own citations intact | medium (real, would have broken silently if the file had been deleted) | `grep -rln capacity-dispatch-fallback` across `.claude/skills/` before editing — confirmed all 6 keep valid links (unchanged paths, only prose inside the target file changed) |

Impact-analysis posture: not applicable — no code symbol touched, only
skill-prose markdown.

## Outstanding questions

None
