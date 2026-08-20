# Shared fragment: coding-worker-contract

tsk-2uf-2 (`docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md`):
the execution-boundary contract every WORKER follows — in
this fgOS repo, "worker" is a role, not an identity (`CONTEXT.md`'s pinned
terminology): it can be a live in-process session doing the work itself,
or an out-of-process executor (`agy`, `pi`, Codex, …) dispatched through
`dispatch.mjs execute`. Whoever is holding the pen while real edits get
made follows this contract; the **driver** — the session that claimed the
unit, decided the mechanism, and will verify/commit/return it — never
delegates that half away, and never does the driver's own job through this
file (see the negative rule at the end).

Point at this file from a consuming `SKILL.md`/dispatch prompt by relative
path (e.g. `../_shared/coding-worker-contract.md`) instead of restating any
of the rules below.

## Two layers, two different scopes — do not blend them

This contract has TWO parts that apply to DIFFERENT things. Read the
heading before applying a rule from the wrong half.

### Layer 1 — GENERIC (applies to every unit: lifecycle-bearing AND ephemeral)

Applies whether the thing you were handed is a **lifecycle-bearing unit**
(a real fgOS work item or child-work — has its own claim, worktree, verify
command, and goes through merge) or an **ephemeral unit** (an ad-hoc task
`<scope>#p<n>`, or a research fan-out branch — no claim, no state, reports
a digest straight back to whoever composed it). Neither shape changes
these four rules:

1. **You only execute. You never decide.** Read whatever you were pointed
   at (a skill file, a task's own `goal`/`inputs`/`boundary` fields, a
   prompt template) and follow it directly. Gates, product decisions,
   scope calls, and anything a person would need to sign off on belong to
   a person or to the driver that dispatched you — never to you. If the
   work in front of you turns out to need one of those, stop and report it
   (see cold-pickup refusal below); do not decide it yourself and keep
   going.
2. **Stay inside your declared boundary.** Whatever set of files you were
   told you may touch (a work item's `footprint`, an ad-hoc task's own
   `boundary` field) is the whole of your permission. A file that isn't
   named there is a SCOPE QUESTION for whoever dispatched you, not
   something to just touch because it seemed related or convenient.
3. **Cold-pickup refusal.** Before doing anything, judge whether what
   you were handed is actually enough to proceed — the goal, the files to
   read, the boundary, and (for a lifecycle-bearing unit) the verify
   command. If it is not enough, do not guess and do not improvise a
   substitute. Report `[BLOCKED]` naming EXACTLY what is missing (the
   specific field, file, or piece of context you needed and didn't get) —
   never a vague "insufficient context." This is the same discipline as a
   human new-hire refusing a task with no brief, rather than inventing
   requirements to look productive.
4. **Report through a fixed token, not free prose.** Whatever you were
   dispatched through, your caller does not parse your prose to learn what
   happened — it reads a fixed, minimal status signal. Two tokens cover
   every outcome this contract defines:
   - `[DONE]` — the work described in your boundary is complete (and, for
     a lifecycle-bearing unit, committed — see Layer 2). Your caller will
     independently re-verify; your own say-so is never trusted on its own.
   - `[BLOCKED] <exactly what's missing or what stopped you>` — cold-pickup
     refusal (rule 3), or a real mid-work stop: something you needed turned
     out to be missing, ambiguous, or outside your boundary. Never leave
     this bare — the text after it is what lets your caller act on it
     without re-deriving your reasoning from scratch.
   "Exiting is not signaling" (the same discipline
   `../_shared/executor-dispatch-fallback.md`'s own Precedent section
   cites from upstream bee): printing your work and then just stopping,
   with neither token anywhere in the output, is not a valid end state —
   your caller has nothing mechanical to read.

### Layer 2 — CODING-SPECIFIC (lifecycle-bearing units only: work + child-work)

The three rules below assume a real claimed item with its own worktree and
`verify` command. They do not apply to an ephemeral unit (no worktree, no
commit, no verify command of its own to run) — an ephemeral unit's own
`expected shape`/`return contract` fields (see
`../_shared/executor-dispatch-fallback.md`'s six-field ad-hoc task shape)
cover that case instead.

1. **Worktree boundary.** You are working inside one isolated git
   worktree, checked out on its own branch, for this one item only. Never
   touch the main working tree, another branch, or another worktree.
2. **Verify is a real shell command, run before you claim done.** The
   item's own `verify` command is the only thing that decides whether the
   work is complete — proof, never assertion. Run it once, near the end,
   when you believe the work is actually done — never as a per-edit habit.
   Run it yourself; if it fails, fix the root cause and rerun the exact
   command. Never weaken it, swap in an easier check, or report `[DONE]` on
   the strength of your own read of the diff.
3. **Commit your changes, then stop.** One commit, on the item's own
   branch, with the item's id in the message. Do not merge, push, tag, or
   approve your own work — those stay the driver's job, downstream of your
   `[DONE]`.

## The negative rule (V3 — do not violate)

**Never call a state-writing `fgos` verb yourself.** Not `fgos return`,
not `fgos discover`, not `fgos plan`, not any other verb that writes to
`.fgos/`. Advancing a claimed item's status/stage — proving your `[DONE]`
actually holds, and moving the item forward — is exclusively the driver's
job. A worker that calls one of these verbs directly is not saving the
driver a step; it is skipping the re-verification the driver exists to
perform, and it is the exact contradiction this contract was written to
close (`CONTEXT.md`'s own V3 finding: the dispatch prompt already tells
you never to call `fgos`, while the file it used to point you at told you
to call `fgos return` in the same breath). If you finish your work and
believe the item should advance, that belief is exactly what `[DONE]` is
for — report it and stop.

## Return-channel note (upstream `pi`, writing-style constraint)

The two-token vocabulary in Layer 1 rule 4 is the lowest common
denominator: the minimum any print-mode-only executor can emit reliably.
It is a floor, not a ceiling. An executor that has a real structured
return channel — for example upstream `pi`'s `--mode json`/`--mode rpc`,
which emits the same `AgentSessionEvent` shape as JSONL instead of plain
text — is not asked to throw that channel away and downgrade to the plain
token. The return channel is a property of the executor doing the work,
never a shape this contract hardcodes; nothing here forecloses a caller
that knows its executor supports a structured channel from reading that
instead, as long as the same two outcomes (done vs. blocked-with-reason)
are still recoverable from it. Upstream `beehive` goes further still — a
fenced JSON Result form (`{outcome, commit, files, tests, deviations}`)
reported ALONGSIDE the token, with the caller validating exactly those
keys and never parsing worker prose — is the natural next step once a
second consumer actually needs it; the token above is the first rung, not
the final shape.

**Live proof-test finding (tsk-47r):** dispatching real `pi`
(`openai-codex`/`gpt-5.5`) against this contract confirmed it is followed
provider-neutrally, not just claimed to be. `pi` read this file via the
same layered skill-pointer chain a coding-domain worker always follows
(`.claude/skills/fgos-coding-implement/SKILL.md` →
`.agents/skills/fgos-coding-implement/SKILL.md` → this file), natively, no
adapter or format translation. Given a genuinely insufficient brief (a
"read first" footprint file that did not exist and no directive on what to
do about it), it correctly refused per Layer 1 rule 3's cold-pickup
refusal, naming exactly what was missing. Given a real, actionable
directive, it completed the work, committed on the item's own branch
touching only its declared footprint, never called `fgos` itself, and
reported through the exact two-token vocabulary above. Full evidence:
`docs/history/pi-executor-runtime-capacity/RESEARCH.md` Round 4.

**Live proof-test finding (tsk-1jt) — RED, config-blocked, not
contract-blocked:** dispatching the named `claude` executor
(`runner.executors.claude`) out-of-process against this contract found it
read the same layered skill-pointer chain correctly and executed the
file-write step exactly as directed, but could not complete Layer 2 rule 3
(commit before return): the invocation's own `--permission-mode
acceptEdits --allowedTools "Bash(git add:*),Bash(git commit:*)"` did not
grant Bash-tool execution in this headless (`-p`, non-interactive) session
— every git command was denied, confirmed both by the worker's own report
and independently by the throwaway worktree's real `git log`/`git status`
(no commit landed, the file sat untracked). It also did not use this
file's own `[DONE]`/`[BLOCKED]` vocabulary when blocked — it asked a live
question a headless dispatch has no one to answer, a second, independent
deviation from Layer 1 rule 4. Neither finding says `claude` cannot follow
this contract; both say the CURRENT `runner.executors.claude`/
`runner.executor` invocation shape cannot complete it end-to-end yet. Full
evidence: `docs/history/claude-named-executor/RESEARCH.md` Round 3.

**Follow-up finding (tsk-1dsr) — GREEN, root cause was environment-local,
not `claude` or config as designed:** the RED finding above traced to a
personal `PreToolUse` hook on the testing machine (an `rtk` proxy that
rewrites `git ...` to `rtk git ...` before the allowlist match runs) —
not a syntax defect and not a limit of `claude`'s own comprehension.
`runner.executors.claude`/`runner.executor` now name both the bare and
`rtk`-wrapped forms (`"Bash(git add:*),Bash(git commit:*),Bash(rtk git
add:*),Bash(rtk git commit:*)"`), still scoped to `add`/`commit` only.
Retested live with this exact config: `claude` completed the full
contract — wrote the exact requested content, honored the footprint,
committed with the item id in the message, never called `fgos`, and
reported through the exact `[DONE]` token. Confirmed independently via
the throwaway worktree's real `git log`/`git show --stat`, not from the
self-report alone. Full evidence: `docs/history/claude-named-executor/
RESEARCH.md` Round 5.

**Live proof-test finding (tsk-5gd):** dispatching real `agy` with
`gemini-3.6-flash-medium` against this contract found that when the worker
printed `[DONE]` inside backtick-quoted prose describing its own feature work
without printing a standalone unquoted status line, `executeExecutorCli`'s naive
substring check was fooled into treating the item as signaled, forcing driver
git forensics. Root cause confirmed: detection evaluated raw substring match on stdout
without stripping backtick-quoted text first. `executeExecutorCli` now strips backtick-quoted
spans (`` `...` ``) before evaluating `[DONE]`/`[BLOCKED]`, ensuring quoted references
in prose are ignored and properly evaluate as `outcome:'unsignaled'`.
Full evidence: `docs/history/tsk-5gd/RESEARCH.md` Round 1.

## Precedent

- `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md` —
  the locked decisions this contract implements (the driver/worker split,
  the two-layer generic/coding-specific shape, and the per-domain registry
  seam), and the V3 finding the negative rule above closes.
- `../_shared/executor-dispatch-fallback.md` — the dispatch MECHANISM
  (`decide`/`execute`) this contract's worker is reached through; that
  fragment's own six-field ad-hoc task shape is the ephemeral-unit
  counterpart to Layer 2's lifecycle-bearing rules above.
- `.agents/skills/fgos-coding-implement/SKILL.md` — the driver half this
  contract was split out of; the file `{skillPath}` points a dispatched
  worker at today, which now redirects here before any driver-only
  instruction.
