# Research log — tsk-3f9k

## Round 1 — 2026-08-20 (discovery)

**Asked:** Which dispatch-adjacent skill docs carry the "wait for backgrounded
dispatch's harness-completion notification, do not use `ScheduleWakeup`"
pattern, do they all state the concrete required action (not just the
prohibition), and is anything in this repo auto-injecting a `ScheduleWakeup`
call (vs. the model choosing to call it on its own)?

**Checked (repo search, canonical `plugins/fgOS/skills/` source only — the
`.agents/skills`, `.claude/skills`, `domains/coding/skills`, `core/skills`
trees are generated mirrors of the same three files, confirmed identical by
the earlier `grep -rl` sweep):**

```
grep -rln "background-completion notification\|run_in_background: true\|ScheduleWakeup" plugins/fgOS/skills/
```

**Found — exactly 3 canonical files carry the Waiting-rule pattern:**

1. `plugins/fgOS/skills/fgos-coding-implement/references/return-mechanics.md:9`
   — has the prohibition: `Do NOT use ScheduleWakeup or polling —
   ScheduleWakeup is for /loop dynamic pacing only (requires prompt unless
   stop:true) and fails immediately in this context.` (landed tsk-1uf,
   commit 90ada78e)
2. `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md:55`
   — same prohibition, same wording (landed tsk-vuj, earlier).
3. `plugins/fgOS/skills/approve/SKILL.md:137` — same prohibition, same
   wording (landed tsk-1uf, commit 90ada78e).

All three: **prohibition only.** None of the three states the positive
required action — none says "end the turn / stop issuing tool calls; the
harness delivers the notification automatically and resumes the session
with it in context." A reader is told what NOT to do but not what TO do
while genuinely waiting.

**Gap found — the shared fragment these three docs' patterns descend from
does not carry the fix at all:**

`plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` Step B is the
canonical Monitor-based out-of-process dispatch pattern, explicitly cited by
its own "Precedent" section as the pattern six other stage skills reuse for
their own never-delegate-reasoning rule (`fgos-coding-validating`,
`fgos-coding-implement`, `fgos-fanout`, `fgos-coding-planning`,
`fgos-coding-exploring`, `fgos-researching`). Its own Step B text
(`plugins/fgOS/skills/_shared/executor-dispatch-fallback.md:88-136`) instructs
running the dispatch through Monitor, then: "Once Monitor reports the command
exited, read its final line" — with **zero mention of `ScheduleWakeup`, zero
prohibition, zero "what to do while waiting" instruction.** A consuming skill
that follows Step B directly (rather than a doc that separately restates the
Waiting-rule callout, like `return-mechanics.md` and
`wave-dispatch-mechanics.md` do) sees no warning at all.

This is consistent with the bug report's own evidence: 3 transcripts,
captured after tsk-1uf's fix landed (08:42 today), still show the model
narrating a wait ("I'll wait for the harness's completion notification
rather than polling") immediately followed by the `ScheduleWakeup`
required-param error. The fix so far only touched 2 of the (at least) 4
places a session can arrive at this exact wait-state from, and even in the
2 it did touch, it only ever states the prohibition, not the required
positive action.

**Auto-injection check:** searched for any code path that could call
`ScheduleWakeup` on the model's behalf:

```
grep -rl "ScheduleWakeup" .claude/hooks/ .claude/settings*.json   → no hits
grep -rln "ScheduleWakeup" src/runner/ src/state/ bin/            → no hits
```

Nothing in this repo's hooks, settings, or runner/state code references
`ScheduleWakeup` at all. **Confirmed: this is exclusively the model's own
tool choice** at the point it needs to signal "now I wait" — never something
this repo's automation injects. The only lever this repo has is the prose a
session reads before/at that decision point.

## Verdict

**Clear.** Evidence: the exact scope of the fix gap is now concrete —
(a) `_shared/executor-dispatch-fallback.md` Step B lacks the Waiting-rule
callout entirely, the most likely real cause of the reported recurrence
since it is the most-cited dispatch pattern in the repo; (b) all 3 docs that
DO have the callout state only the prohibition, never the required
positive action (end turn, no tool call, harness auto-notifies). Both are
mechanical prose-only edits, same shape as tsk-1uf's own fix — no
architectural ambiguity, no product decision needed.

**Verify (real, runnable):**

```
npm test && grep -q 'end the turn' plugins/fgOS/skills/_shared/executor-dispatch-fallback.md && grep -q 'ScheduleWakeup' plugins/fgOS/skills/_shared/executor-dispatch-fallback.md && grep -q 'end the turn' plugins/fgOS/skills/fgos-coding-implement/references/return-mechanics.md && grep -q 'end the turn' plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md && grep -q 'end the turn' plugins/fgOS/skills/approve/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```
