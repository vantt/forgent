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

Reproduced live on tsk-1x7 (a doc-only fix to `fgos-coding-validating/SKILL.md`'s
Gate section): 3 dispute-park-retry rounds, each with the judge raising the
same unfalsifiable objection against a progressively stronger grep chain
(bare phrase match → scoped to the Gate section → two required phrases
checked). Resolved only via `fgos discover --force` (tsk-5cf D1b path).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Park tsk-rlv until tsk-3jy resolves. Both items point at the same function (`buildVerifyCheckPrompt`, `judge-executor.mjs:329`) — tsk-3jy is currently claimed by a different live session (`writer.id: 7ec38246-a1fd-4413-9b8f-8819d92f638a`), still at stage `clarify`, not yet locked. Proceeding independently risks a merge conflict or duplicate/conflicting fix to the same function. User confirmed this over proceeding independently and accepting the collision risk. |
| D2 | Scope narrows, after resume, to: link `docs/how-to/write-verify-for-a-skill-prose-change.md` (tsk-4l9, already merged before tsk-1x7/tsk-rlv existed) from `fgos-coding-exploring`'s and/or `fgos-coding-planning`'s `SKILL.md`, so a session writing `verify` for an item touching `.claude/skills/**/SKILL.md` / `.agents/skills/**/SKILL.md` / `plugins/fgOS/skills/**/SKILL.md` is pointed at the `npm test && <POSITIVE> && <NEGATIVE>` standard — and the doc's own pre-written rebuttal for a comprehension-style second-pass objection — before writing a verify command that gets disputed. No change to `judge-executor.mjs`/`discovery.mjs`/`decompose.mjs`. User confirmed this over closing tsk-rlv outright or still modifying judge code. |

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
- `docs/how-to/write-verify-for-a-skill-prose-change.md` (tsk-4l9)
- tsk-3jy (dependency, delivered — `45b21f6e0150727dfc903a81dee59d2469a949f9`, merged into main as `426cebe`)

## Resolution (post-park)

tsk-3jy delivered while tsk-rlv was parked (D1). Its landed fix
(`src/intake/judge-executor.mjs`, `buildVerifyCheckPrompt`) adds two
things to the second-pass judge's prompt: (1) explicit pre-implementation
stage context, and (2) a requirement that a disagreement name a CONCRETE
NEW criterion, never repeat a prior round's complaint reworded (tsk-3jy's
own D2). This is a general anti-repeat mechanism — it reduces, but does
not structurally eliminate, the risk of a doc-only item cycling through
many differently-worded-but-still-unfalsifiable comprehension objections.

Separately, re-scouting this session found
`docs/how-to/write-verify-for-a-skill-prose-change.md` (tsk-4l9, delivered
before tsk-1x7/tsk-rlv existed) already documents: the correct verify shape
for a skill-prose item is `npm test && <POSITIVE> && <NEGATIVE>` (never a
bare grep chain), and — critically — the doc explicitly states verify must
never be asked to prove "prose có mạch lạc không" / "LLM diễn giải đúng ý
lúc chạy không", naming that doc as "the answer to cite" when the
second-pass judge demands exactly that. tsk-1x7's own verify (2 grep
checks, no `npm test`, not POSITIVE/NEGATIVE shaped) did not follow this
existing standard — part of why it kept getting disputed was a real,
self-inflicted verify-shape gap, not solely judge overreach.

D2 (above) locks the real remaining gap: neither `fgos-coding-exploring` nor
`fgos-coding-planning`'s own `SKILL.md` points a session at this how-to doc when
an item touches a skill-prose file, so the standard existed but was never
surfaced at the point a session actually writes the verify command.

## Outstanding questions deferred to planning

None — D2 fully scopes the remaining work: add one pointer line to
`docs/how-to/write-verify-for-a-skill-prose-change.md` in
`fgos-coding-exploring`'s and/or `fgos-coding-planning`'s `SKILL.md`, conditioned on the
item touching a skill-prose path. `fgos-coding-planning` still owns exactly where
in each file's flow the pointer belongs and its precise wording.
