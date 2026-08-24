# Return — full mechanics

The full detail behind SKILL.md's Step 5.

> **Execution rule — background execution required:**
> Always run this backgrounded (`run_in_background: true`) from the start, never foreground. `fgos return` re-runs the item's own full verify command (often `npm test && ...`), routinely 224-386 seconds, well past the Bash tool's 120s default foreground timeout.
>
> **Waiting rule:**
> Wait for the harness's own background-completion notification before proceeding to gather results (end the turn with no further tool call once background execution is started; the harness delivers a task-notification automatically and resumes the session with the output in context). Do NOT use `ScheduleWakeup` or polling — `ScheduleWakeup` is for `/loop` dynamic pacing only (requires `prompt` unless `stop:true`) and fails immediately in this context.

```
fgos return <id>
```

This is the fgOS equivalent of a bee cell's cap: `return` re-runs the
item's `verify` itself, checks for a clean working tree and an advanced
commit history, and only then moves the item to `awaiting-approval`
(verify red moves it to `blocked` instead) — it never takes the caller's
word for it, the same "proof, not assertion" discipline bee's
cap-with-evidence rule enforces, just applied by the engine instead of a
recorded trace field.

## The engine-fired review handoff

**Only on success** (item now reads `awaiting-approval`) does the
**review** interaction actually happen — hand the ball to `reviewer`.
You do not fire this yourself: `return` reaching `awaiting-approval`
fires it FOR you, as an engine-level side effect of that exact
transition. This is a deliberate relocation, not a shortcut — a real
end-to-end run found this instruction, when it depended on an agent
reading and acting on it, went unfired on a genuinely successful return
with nothing to signal the miss (no error, no red test). Every door into
`awaiting-approval` (`return`, `catchup`, any future one) converges on
that one engine call, so the guarantee now holds regardless of which
door an item took, without needing this skill's own prose to remember,
or to repeat itself once per door.

If `return` itself just moved the item to `blocked` instead (a verify
failure caught while `status` was still `doing`), nothing fires — the
engine's own side effect is conditioned on the SAME `to ===
'awaiting-approval'` transition. Treat a `blocked` outcome exactly like a
failed verify: diagnose, fix, and return again — never re-run `return`
hoping the same red state passes on a retry without a real change
underneath it.

## Recovery when the item is already `blocked` at call time

If the item is instead ALREADY `blocked` when you go to call `return`
(e.g. `approve`'s post-merge verify-fail rollback left it `reason:
verify-fail-post-merge`), `return` structurally refuses — it requires
`status: doing`, and this item's `blocked → awaiting-approval` edge
never passes through `doing`. The correct recovery verb there is `fgos
catchup <id>`, not another `return` call: it re-runs `verify` on a
staged merge into the item's target branch and, on green, moves it
straight to `awaiting-approval` — the same engine transition, so the
same engine-fired review handoff applies on THIS success too, no
separate call needed.
