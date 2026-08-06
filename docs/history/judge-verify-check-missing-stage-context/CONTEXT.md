# judgeVerifySemanticCorrectness rejects doc-only verify commands

tsk-rlv

## Feature boundary

`judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs:377`, the
second-pass judge `resolveDiscovery` calls via `discovery.mjs:667`) rejects
any grep-based verify command proposed for a doc-only item (a prose edit to
a `.claude/skills/*/SKILL.md` or `docs/` file) on the ground that no
mechanical check can prove a stranger will comprehend the resulting prose.
This objection is categorically unfalsifiable for a doc-only change — no
grep-based command, however precisely targeted, can ever prove prose
readability — so it re-fires every round regardless of how the verify
command is strengthened.

Reproduced live on tsk-1x7 (a doc-only fix to `fgos-validating/SKILL.md`'s
Gate section): 3 dispute-park-retry rounds, each with the judge raising the
same unfalsifiable objection against a progressively stronger grep chain
(bare phrase match → scoped to the Gate section → two required phrases
checked). Resolved only via `fgos discover --force` (tsk-5cf D1b path).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Park tsk-rlv until tsk-3jy resolves. Both items point at the same function (`buildVerifyCheckPrompt`, `judge-executor.mjs:329`) — tsk-3jy is currently claimed by a different live session (`writer.id: 7ec38246-a1fd-4413-9b8f-8819d92f638a`), still at stage `clarify`, not yet locked. Proceeding independently risks a merge conflict or duplicate/conflicting fix to the same function. User confirmed this over proceeding independently and accepting the collision risk. |

## Scout evidence

- `src/intake/judge-executor.mjs:329-398` (`buildVerifyCheckPrompt`,
  `judgeVerifySemanticCorrectness`), read directly this session: the prompt
  passed to the second-pass judge model carries only `title`, `description`,
  `proposedVerify`, and any `priorRejection` text — no signal that this
  evaluation happens at stage `clarify` (before any code exists) or that
  the item is a doc-only prose change (where "does a stranger comprehend
  this" is not something any command can mechanically prove). This is the
  same root gap tsk-3jy's own scout (its own description, read this
  session) independently found from a different symptom (demanding
  post-implementation `git diff` evidence for a verify proposed before
  code exists) — both point at the identical missing-context problem in
  the same function.
- `tsk-3jy` (`fgos list --id tsk-3jy --json`, read this session): status
  `doing`, stage `clarify`, `docsRef:
  docs/history/tsk-3jy-judge-verify-prompt-pre-implementation-stage-context/`
  — that directory does not yet exist in this worktree (`CONTEXT.md` not
  yet committed), confirming the other session's work is still in progress,
  not yet landed.
- Impact-analysis posture: **full** — `fgos tool query --capability
  impact-analysis --status present` reports GitNexus registered and
  `present`. Informational only; no code edit happens in this session (the
  item is parked before implementation).

## Pinned terms

- **"same function collision"** — both tsk-rlv and tsk-3jy's most likely
  fix both land inside `buildVerifyCheckPrompt`/`judgeVerifySemanticCorrectness`
  (`judge-executor.mjs`), not two genuinely separate code paths; treating
  them as independently implementable in parallel would risk one session's
  edit silently invalidating or conflicting with the other's.

## Canonical references

- `src/intake/judge-executor.mjs`
- `src/intake/discovery.mjs`
- tsk-3jy (dependency, currently claimed by another session)

## Outstanding questions deferred to planning

None yet — this item is parked (D1) before reaching `fgos-planning`.
Whoever resumes this item next should re-read tsk-3jy's own resolution
first: if tsk-3jy's landed fix already adds stage/kind context to the
judge prompt, tsk-rlv's own remaining scope may shrink to just adding a
doc-only regression case, or may already be fully covered and close as a
duplicate.
