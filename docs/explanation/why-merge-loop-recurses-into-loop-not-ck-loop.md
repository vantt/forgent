# Why `/fgOS:merge-loop` (`tsk-1sm`) recurses into `loop`, not `ck-loop`

`tsk-1sm` added `/fgOS:merge-loop`, a thin skill that repeats
`/fgOS:merge-next` until the frontier is empty or a safety condition
trips. The requester's own item description named the mechanism to
recurse into as "`/loop` (ck-loop)" — treating the two as the same thing.
They are not, and the mismatch survived all the way to `fgos-coding-validating`
before it was caught.

## The request's own wording conflated two unrelated skills

From the item's own text (`docs/history/merge-loop-skill/CONTEXT.md`):

> Skill KHÔNG được tự viết cơ chế lặp/scheduling riêng — phải recurse vào
> `/loop` (ck-loop) có sẵn... SKILL.md chỉ nên gọi `/loop` với
> `prompt=/fgOS:merge-next`, dynamic self-pace.

`fgos-coding-exploring` and `fgos-coding-planning` both carried this parenthetical
through into `CONTEXT.md` and `plan.md` unchallenged — citing
`~/.claude/skills/ck-loop/SKILL.md` as if it were the dynamic self-pacing
mechanism this item needed.

## What reading `ck-loop`'s real file actually shows

`ck-loop` is a real, separate skill — an autonomous **mechanical-metric
optimization** loop, not a generic recurring-task runner:

> `ck-loop` requires a `Goal`/`Scope`/`Verify` (a shell command that must
> print a single number)/`Guard`/`Iterations` config, git-commits each
> iteration, and auto-keeps or discards changes based on whether the
> metric improved.

There is no metric to optimize in "merge the next ready item until
nothing's left" — no number goes up or down per iteration, there is
nothing to keep-or-discard via git experiment. Had the plan gone unchecked
into implementation, the resulting `merge-loop` skill would have
instructed an agent to invoke a config shape (`Goal`/`Scope`/`Verify`-
number/`Guard`) that fundamentally does not fit this task, and the whole
skill would have failed the moment anyone tried to actually run it.

## The correct target was a different, separate skill entirely

The skill that actually matches "run a prompt repeatedly, self-pacing,
until a stop condition" is a distinct built-in Claude Code skill named
plainly `loop` — no `ck-` prefix, no on-disk `SKILL.md` of its own (it
ships with the harness rather than as a project/plugin file), described
as: "Run a prompt or slash command on a recurring interval... Omit the
interval to let the model self-pace." That description is an exact match
for the stop-rule-gated, variable-duration iteration `/fgOS:merge-loop`
needed — confirmed present in the session's own available-skills listing,
independently of `ck-loop`.

## Where this was caught, and why it matters generally

The mismatch was not caught at `fgos-coding-exploring` or `fgos-coding-planning` — both
carried the requester's own phrasing forward without independently
verifying what `ck-loop` actually does. It surfaced only at
`fgos-coding-validating`'s reality gate, whose rule against accepting
plausibility language forced an actual read of
`~/.claude/skills/ck-loop/SKILL.md` before letting the "repo fit" row pass
as evidence. `CONTEXT.md` and `plan.md` were both corrected in place
before implementation started (no locked D1/D2 decision changed — only
the citation).

The general lesson: a name that sounds like a match ("loop" appearing
inside "ck-loop") is not evidence that the two skills share a contract.
Any future item recursing into a named skill or tool should have that
skill's actual file read before the citation is trusted, not just its name
pattern-matched against the request's own wording.
