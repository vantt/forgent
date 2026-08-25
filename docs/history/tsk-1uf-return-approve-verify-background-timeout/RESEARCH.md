# RESEARCH: fgos return / fgos approve verify runs need proactive background-execution guidance

## Round 1 (tsk-1uf, stage discovery)

**Goal:** find the exact background-execution guidance pattern tsk-vuj
already landed for the identical Bash-tool 120s-timeout problem in
`plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md`
(the real source lives at
`.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`), so it
can be mirrored consistently onto the two files this item names, and
confirm neither target file already has it.

**Checked:** `.agents/skills/fgos-fanout/references/wave-dispatch-
mechanics.md:45-60`, `.agents/skills/fgos-coding-implement/references/
return-mechanics.md` (full file, 52 lines), `plugins/fgOS/skills/approve/
SKILL.md` (full file, 220 lines).

**Found — the pattern to mirror** (`wave-dispatch-mechanics.md:51-55`):

> **Execution rule — background execution required:**
> Always run this backgrounded (`run_in_background: true`) from the start,
> never foreground. `fanout-batch` sequentially awaits `pick` -> `execute`
> -> `return` per candidate in a synchronous loop; running in foreground
> routinely exceeds the Bash tool's 2-minute default timeout (exit 143 for
> multi-item batches).
>
> **Waiting rule:**
> Wait for the harness's own background-completion notification before
> proceeding to gather results. Do NOT use `ScheduleWakeup` or polling —
> `ScheduleWakeup` is for `/loop` dynamic pacing only (requires `prompt`
> unless `stop:true`) and fails immediately in this context.

This sits directly above the file's own bash block (`root=$(git rev-parse
...)`, then the `fanout-batch` invocation) — a callout block immediately
before the command, not folded into prose elsewhere.

**Found — neither target file has this guidance today, confirming the
item's own claim:**

- `.agents/skills/fgos-coding-implement/references/return-mechanics.md:5-7`
  — the entire guidance around the `fgos return <id>` bash block is:
  ````
  ```
  fgos return <id>
  ```
  ````
  No execution-rule callout, no mention of `run_in_background` or the
  Bash tool's timeout, anywhere in the file (grep for `run_in_background`,
  `background`, `timeout` all empty).

- `plugins/fgOS/skills/approve/SKILL.md:130-142` (Step 6, "Run the verb
  yourself") — points to `../_shared/fgos-cli-fallback.md` and shows:
  ```
  <verb> <id> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
  ```
  Same absence — no execution-rule callout anywhere in the 220-line file.

**Verify-shape check:** `docs/how-to/write-verify-for-a-skill-prose-
change.md` governs verify shape for changes to `.claude/skills/**/
SKILL.md`, `.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/
SKILL.md` prose — `plugins/fgOS/skills/approve/SKILL.md` is directly in
that scope; `return-mechanics.md` is a reference doc a SKILL.md includes
by pointer (same "LLM-interpreted prose, no static assertion of runtime
behavior" reasoning applies) and gets the same discipline. Required
shape: `npm test && <POSITIVE> && <NEGATIVE>`, POSITIVE proving the new
deliverable text exists (a long enough pinned phrase, not a single weak
word — pitfall #5), NEGATIVE proving old behavior/pattern is gone or, for
a purely additive doc change (no old string to retire), a scope guard
proving the diff stayed doc-only (`tsk-4l9`'s own self-illustration for
exactly this additive case: `! git diff --name-only main...HEAD | grep
-q '^src/'`).

**Both files are otherwise unrelated to each other's content** — no
cross-reference, no shared code path — so the fix is two independent,
additive doc edits, not a refactor. No open question remains: the exact
wording to mirror is confirmed above, both target locations and their
current (guidance-free) content are confirmed, and the edit is a clean
prose-only addition with no ambiguity about scope or shape.

**Verdict:** `{clear: true, verify: "npm test && grep -q 'run_in_background: true' .agents/skills/fgos-coding-implement/references/return-mechanics.md && grep -q 'run_in_background: true' plugins/fgOS/skills/approve/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'"}`
