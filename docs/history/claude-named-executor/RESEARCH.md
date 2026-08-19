# RESEARCH — claude-named-executor (tsk-1cn)

## Round 1 — 2026-08-19

**Asked:** What is the current shape of `runner.executors` entries in
`.fgos/config.json` (agy/codex/pi/gitnexus/herdr), does `runner.executors.claude`
already exist, and how does the resolver (`src/runner/dispatch/resolve.mjs`)
pick between `executors.<id>` and the top-level `executor` default? Does
adding a `claude` entry require `allowCrossProvider`/`providerModel`/
`rigorOverrides` the way agy/pi do?

**Checked:**
- `.fgos/config.json` (`repo-root/.fgos/config.json:1-100`): `runner.executor`
  (top-level, unnamed) is `{command:"claude", args:["-p","{prompt}",
  "--model","{model}","--permission-mode","acceptEdits","--allowedTools",
  "Bash(git add:*),Bash(git commit:*)"]}`. `runner.executors` currently has
  keys `agy`, `codex`, `pi`, `gitnexus`, `herdr` — **no `claude` key**.
  - `agy`: `kind:"agent"`, `allowCrossProvider:true`, `invocations:[{via:"cli",
    adapter:"cli-spawn", command:"agy", args:[...]}]`, `providerModel:"gemini"`,
    `rigorOverrides:{light:"lightweight", standard:"lightweight",
    heavy:"lightweight"}`.
  - `codex`: `kind:"agent"`, `allowCrossProvider:true`, `invocations:[{via:"cli",
    adapter:"cli-spawn", command:"codex", args:[...]}]`. No `providerModel`/
    `rigorOverrides`.
  - `pi`: same shape as agy (own `providerModel:"openai-codex"`,
    `rigorOverrides` all `"lightweight"`).
- `src/runner/dispatch/resolve.mjs:187-207` (`resolveExecutorAndOverrides`):
  a literal `cfg.executors[id]` entry always wins first. `resolveExecutorConfig`
  (`resolve.mjs:214-316`): an `invocations` array with a `via:"cli"` entry
  resolves to that invocation's `{command,args,adapter,provider}`
  (`resolve.mjs:277-291`); falling through to `cfg.executor` (the top-level
  default) only happens when no named executor is passed at all, or the
  named entry declares neither `invocations`/`command`/`adapter`/`agentType`.
- `src/runner/dispatch/config.mjs:357`: `CLAUDE_CLI_COMMANDS =
  Object.freeze(['claude'])`.
- `resolve.mjs:307` (cross-provider gate): `allowCrossProvider` is only
  checked `if (... && !CLAUDE_CLI_COMMANDS.includes(executor.command) &&
  executorEntry.allowCrossProvider !== true)`. Since a `claude` entry's
  resolved `command` is literally `"claude"` (in `CLAUDE_CLI_COMMANDS`), this
  gate is skipped regardless of `allowCrossProvider` — agy/codex/pi need
  `allowCrossProvider:true` only because their commands (`agy`/`codex`/`pi`)
  are NOT in `CLAUDE_CLI_COMMANDS`. A `claude` entry does not need it.
- `modelForTier` (`resolve.mjs:33-51`) defaults `providerModel:'claude'` when
  the caller passes none — agy/pi set `providerModel` because they are
  non-Claude providers; a `claude` executor entry needs no explicit
  `providerModel` override (default already correct) and no
  `rigorOverrides` (agy/pi's overrides exist to downgrade a non-Claude
  provider's own model-policy tier; nothing forces a Claude entry to
  redeclare the same downgrade).
- `test/runner/dispatch.test.mjs` already exercises `executors.agy`/`codex`
  shape assertions — `npm test` (`node --test 'test/**/*.test.mjs'`) is the
  real, runnable verify command for this item.

**Found:** No `runner.executors.claude` entry exists today; `runner.executor`
(top-level, unnamed) is the sole fallback for claude dispatch, confirming the
item's own premise. The resolver already supports a named `invocations:
[{via:"cli", adapter:"cli-spawn", command:"claude", args:[...]}]` entry
mirroring agy/codex's exact shape — no code change needed in
`resolve.mjs`/`transport.mjs`, this is a pure config addition. `kind:"agent"`
and `invocations` (reusing the SAME `args` array already in `runner.executor`)
are the only fields actually needed; `allowCrossProvider`/`providerModel`/
`rigorOverrides` are NOT needed for a `claude` entry (see gate details above)
— including them would be inert-but-misleading copy-paste from agy/pi, not a
real requirement.

**Still open:** none — evidence is sufficient to add the config entry
directly; no code path needs modification.

## Verdict

`clear`. Verify: `npm test` (existing `test/runner/dispatch.test.mjs`
already covers `executors.<id>` shape resolution; a new test asserting
`resolveExecutorConfig(cfg, tier, 'claude', ...)` resolves to
`runner.executor`'s own command/args should be added alongside the config
change).

## Round 4 — 2026-08-19 (tsk-1dsr, discovery stage — diagnosing tsk-1jt's RED finding)

**Note on scope:** this branch (`fgw/tsk-1dsr`) forked from `main` at
`10847668` (`tsk-1cn`'s own landed config commit) — `tsk-1jt` is still
`awaiting-approval`, unmerged, so its own Round 3 (the RED finding this
item exists to diagnose) lives only on the still-open `fgw/tsk-1jt`
branch, not yet visible here. Summarizing that finding from this same
session's own direct knowledge of it (not re-derived, not guessed): `pi`
[sic] — dispatching the named `claude` executor out-of-process wrote
`PROOF.txt` correctly but every `git add`/`git commit` was denied, and
`claude` asked a live question instead of reporting `[BLOCKED]`.

**Asked:** is the RED finding's own stated hypothesis — a `--allowedTools`
colon-vs-space PATTERN SYNTAX mismatch (`"Bash(git add:*)"` vs
`"Bash(git *)"`) — actually the cause? Or is `--permission-mode
acceptEdits` itself the blocker regardless of `--allowedTools` content?

**Checked (real, isolated `claude -p` invocations, not simulated):** built
a throwaway scratch git repo
(`/tmp/.../scratchpad/allowedtools-test`) to isolate from this real repo
entirely, then ran four real dispatches:

- **Test A** — `--allowedTools "Bash(git *)"` (the space form, matching
  `claude --help`'s own example), a COMPOUND `git add && git commit`
  directive → `[BLOCKED]`: *"This Bash command contains multiple
  operations... rtk git add FILE2.txt, rtk git commit..."* — the real
  command Claude attempted was **`rtk git add ...`**, not `git add ...`.
  `echo` (a plain, non-`git` command) succeeded.
- **Test B** — same space-form allowlist, a SINGLE non-compound `git add`
  (isolating "compound command" as a confound) → still `[BLOCKED]`:
  *"This command requires approval."* Rules out "it's only compound
  commands" — a bare single `git add` is denied too.
- **Test C** — added `Bash(rtk git *) Bash(rtk *)` to the allowlist
  (naming the ACTUAL rewritten command) → **`[DONE]`**, `git add`
  succeeded (`git status --short` showed `A  FILE3.txt`, confirmed
  directly, not from the worker's own report alone).
- **Test D** — reverted to the ORIGINAL colon-scoped SYNTAX
  (`"Bash(rtk git add:*),Bash(rtk git commit:*)"`) — same colon form the
  RED finding's own hypothesis suspected — but now naming the `rtk`
  prefix → **`[DONE]`**, both `git add` and `git commit` succeeded for
  real (`git log --oneline` showed the new commit `8b67b23`, confirmed
  directly).

**Found:** the item's own stated hypothesis (colon-vs-space syntax) is
**disproven** — Test D shows the exact original colon-scoped pattern
works FINE once it names the command that actually runs. The REAL cause
is a **machine-local `PreToolUse` hook** (this session's own global `rtk`
proxy, documented at `$HOME/.claude/RTK.md`/`$HOME/.claude/CLAUDE.md` —
"All other commands are automatically rewritten by the Claude Code hook.
Example: `git status` → `rtk git status`") — it silently rewrites every
`git ...` invocation to `rtk git ...` BEFORE the Bash tool's own
`--allowedTools` pattern match runs, so an allowlist naming bare `git`
(colon or space form, either one) never matches on THIS machine,
regardless of which syntax it uses.

**This is not a `.fgos/config.json` defect.** `runner.executors.claude`
(and the top-level `runner.executor` it mirrors) is REPO-TRACKED, shared
state — any other fgOS install/machine without this specific personal hook
installed would very likely see the ORIGINAL colon-syntax config work
exactly as written (Test D's own real evidence: the colon form is not the
problem). Baking an `rtk`-specific allowlist pattern into the shared repo
config to work around one machine's personal customization would be
wrong in the other direction — a real footgun for every OTHER fgOS
install, and dead/misleading config for one that has no `rtk` hook at
all.

**Still open — a real scope decision, not this skill's own to make:**
does this item still make a `.fgos/config.json` change at all, given the
real cause is a personal, machine-local hook rather than a shared config
defect? Or does it close as "no config change; RED was environment-caused,
not config-caused" and only correct the record (`RESEARCH.md`/
`coding-worker-contract.md`)?

## Verdict (Round 4, tsk-1dsr)

`unclear` — a real scope/product question the item's own text did not
anticipate (it assumed the syntax hypothesis would BE the fix, and
pre-committed to applying it to shared config once "confirmed" — but the
opposite got confirmed: the syntax was never broken).

## Round 5 — 2026-08-19 (tsk-1dsr, real user decision + retest + GREEN)

**Asked:** given Round 4's finding (personal `rtk` hook, not a config
defect), the user was presented the choice directly (no `CONTEXT.md`
decision recorded separately — the live conversation IS the record here,
per this item's own `awaiting-human` park): close with no config change,
or find a different scope. User's real decision: **"double config"** —
name BOTH the bare and `rtk`-wrapped `git` patterns in
`runner.executors.claude`/`runner.executor`, since that is harmless on any
install without the hook (the `rtk`-prefixed pattern simply never
matches) and correct on one that has it. Explicitly kept scoped to
`add`/`commit` only (not widened to any git subcommand, matching this
config's own original safety intent).

**Checked (real, not simulated):** dispatched `claude` out-of-process
against a FRESH throwaway item (`tsk-3i1`, same `buildPrompt`/worktree
mechanism as `tsk-1jt`'s own Round 3), using an IN-MEMORY-ONLY override of
`executors.claude`'s args (`"Bash(git add:*),Bash(git commit:*),
Bash(rtk git add:*),Bash(rtk git commit:*)"`) — proving the fix BEFORE
committing it to the real `.fgos/config.json`:

- **Result: exit 0.** stdout: `"Commit \`023431b\` created on branch
  \`fgw/tsk-3i1\`... Verify passed (\`test -f PROOF2.txt\`).\n\n[DONE]"`
  — the CORRECT two-token vocabulary this time, unlike Round 3's live
  question.
- **Cross-checked independently, not from the self-report alone**: real
  `git log --oneline` in `tsk-3i1`'s own worktree showed the new commit
  `023431b3 chore(tsk-3i1): add PROOF2.txt retest proof for tsk-1dsr` on
  top of `10847668`; `git show --stat HEAD` showed exactly `PROOF2.txt |
  1 +` — footprint honored precisely, nothing else touched. `PROOF2.txt`'s
  content matched the directive exactly.
- Logged the real `executor.dispatch` event (`.fgos/events.jsonl` seq
  20298).
- Cleanup: `tsk-3i1` moved to `wontfix`, worktree/branch removed.

**Verdict: GREEN.** Once the environment interference (this machine's
`rtk` hook) is accounted for in the allowlist, `claude` completes the
FULL worker contract out-of-process: reads the layered skill-pointer
chain, writes the exact requested content, honors the footprint boundary,
commits with the item id in the message, never calls `fgos`, and reports
through the exact `[DONE]`/`[BLOCKED]` vocabulary. Applied to the real
`.fgos/config.json` as a direct main-checkout commit (`daabebfe`, per
ADR0020 — see `docs/how-to/fix-fgos-write-rejected-merge-block.md`).
`test/runner/dispatch.test.mjs`'s own "no wider (per spike B)" assertion
updated to the new exact string, plus explicit assertions it never widens
past `add`/`commit` for either form.

**Corrected finding for `coding-worker-contract.md`:** Round 3's RED
verdict stands as an accurate record of what that specific run found, but
the ROOT CAUSE was this machine's personal `rtk` hook, not a defect in
`claude`'s comprehension of the contract or in `runner.executors.claude`'s
config as designed. Round 5's GREEN is the real, final answer to the D4
question the contract's own Return-channel note asks: does `claude`
follow this contract out-of-process? Yes.
