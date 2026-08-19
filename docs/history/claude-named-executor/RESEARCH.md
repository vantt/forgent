# RESEARCH — claude-named-executor (tsk-1cn, tsk-1jt, tsk-1dsr)

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

## Round 2 — 2026-08-19 (tsk-1jt, discovery stage)

**Asked:** what does `pi`'s own D4 proof-test precedent (tsk-47r,
`docs/history/pi-executor-runtime-capacity/{plan.md,RESEARCH.md}`) look
like mechanically, so tsk-1jt can mirror it for the named `claude`
executor? And is there any existing guard against dispatching `claude`
itself as an out-of-process CLI target (as opposed to in-process/native)?

**Checked:**
- `docs/history/pi-executor-runtime-capacity/plan.md` step 2, and
  `RESEARCH.md` Rounds 3-4 (real evidence, `tsk-1nif`/`tsk-1o8j` throwaway
  items): the proven mechanical pattern is (1) create a genuinely
  disposable `fgos submit`/`fgos take --role session` work item
  (`kind: chore`, small `verify`, a `footprint` naming one file), (2) claim
  its worktree the same way `/fgOS:pick` does
  (`createClaimWorktree`/`fgos pick`), (3) build the real dispatch prompt
  with `buildPrompt` (`src/runner/dispatch/prepare.mjs`) against that
  item's own work object at `stage: 'executing'` — never a hand-written
  approximation, (4) run the executor CLI from inside that worktree with
  the prompt, (5) read the real JSON event stream plus `.fgos/events.jsonl`
  and `git log`/`git show --stat` on the worktree as evidence — never the
  worker's own self-report alone, (6) `wontfix` the throwaway item and
  remove its worktree/branch afterward, never left dangling.
- `RESEARCH.md` Round 3 (`pi --provider anthropic`, real attempt):
  produced a `400 ... "You're out of extra usage"` from the SAME Anthropic
  account the session's own OAuth draws from — an account-level usage cap,
  not a mechanism/contract defect. `pi --provider openai-codex --model
  gpt-5.5` (Round 4, different provider/account) got real evidence instead.
  **Relevant to tsk-1jt:** dispatching `claude` itself as an out-of-process
  worker draws on the SAME account/usage pool this very session already
  uses — a real, foreseeable risk of hitting the identical "out of extra
  usage" block Round 3 hit, unrelated to whether the worker-contract claim
  holds. If it happens, that is the honest `BLOCKED` outcome Round 3
  recorded (neither GREEN nor RED) — not a reason to fabricate a verdict.
- `docs/specs/runner.md:1662-1751` (D-ADR0026, Native-First Dispatch
  Doctrine): explicitly names this exact case as anticipated, not
  forbidden — "1 `claude` bị spawn qua cli/spawn, một khi đã chạy, chính
  nó lại là 1 Claude Code agent loop thật" (line ~1712-1714, quoting
  `tsk-53h`'s own pinned nesting rule) — a `claude` process spawned via
  cli/spawn is itself a real rootTask, fractal/recursive by design.
  Rule 2 of the doctrine's own dispatch-mechanism table (line ~1742) says a
  same-provider, soul-needing target should PREFER native (in-process)
  dispatch over cli-spawn — which is exactly why `dispatch.mjs decide`
  resolved `in-process` for `fgos-coding-implement` during tsk-1cn's own
  drive. This means tsk-1jt's own proof must go through the literal
  `executorId`-named path (`dispatch.mjs execute claude --prompt ...`),
  bypassing the purpose-based `decide` step entirely — matching exactly
  what the item's own description already specifies, not a gap to close.
- `src/runner/dispatch/cli.mjs:536` (`execute` subcommand) →
  `executeExecutorCli` → `resolveExecutorConfig`/`transport.mjs`'s
  `cliSpawnAdapter`: no special-casing anywhere that excludes
  `command === 'claude'` from the ordinary CLI-spawn path agy/codex/pi
  already use — `runner.executors.claude` (landed on `main`,
  `10847668`) resolves and spawns through the identical mechanism.

**Found:** the mechanical pattern to mirror is fully specified by tsk-47r's
own precedent; no new mechanism needs inventing. The one real, honest risk
carried into tsk-1jt (not a gap in the plan, a property of the test itself)
is the shared-account usage cap Round 3 hit — the test's own real outcome
this session cannot control in advance.

**Still open:** none for discovery purposes — the D4 test itself is the
open question the item exists to answer; nothing here blocks proceeding.

## Verdict (Round 2, tsk-1jt)

`clear`. Verify: not automatable (a live agent dispatch cannot be asserted
by a CI-style command, per tsk-47r's own precedent) — proof lives in this
file's own Round 3 below (once run), read by the human approver at
`awaiting-approval`.

## Round 3 — 2026-08-19 (tsk-1jt, D4 proof-test, real dispatch)

**Asked:** does the named `claude` executor (`runner.executors.claude`,
landed `10847668`), dispatched out-of-process via the literal
`executorId`-named path, actually follow `.agents/skills/_shared/
coding-worker-contract.md` on a real throwaway work item?

**Setup (real, not simulated):**

- Confirmed `decideExecutorDispatchMechanism` resolves `claude` to
  `out-of-process` unconditionally regardless of `--has-live-task-access`
  (D-ADR0033: config wins — `runner.executors.claude` is
  `invocations[].via === 'cli'`-shaped, `src/runner/dispatch/
  mechanism.mjs:82-96`) — confirmed live, not just read: the actual
  `executeExecutorCli('claude', {hasLiveTaskAccess: true, ...})` call
  below printed `mechanism=out-of-process ... via=cli-spawn
  provider=claude model=sonnet tier=standard` to stderr.
- Created a genuinely disposable fgOS work item via the real
  `fgos submit`/`fgos edit`/`fgos pick` doors: `tsk-4l8p` (`kind: chore`,
  `tier: light`, `risk: light`, `domain: coding`, `verify: "test -f
  PROOF.txt"`, `footprint: ["PROOF.txt"]`, `description`: a concrete,
  actionable directive — "create PROOF.txt containing the line 'tsk-1jt
  proof written by claude', then commit it referencing this item's own
  id" — mirroring `pi`'s own Round 4b shape directly (the concrete-directive
  version), skipping the ambiguous-description round since that specific
  scenario (cold-pickup refusal on a vague brief) was already proven
  provider-neutral once by `pi`'s own Round 4a and is not this round's own
  open question).
- `fgos pick tsk-4l8p` provisioned `fgw/tsk-4l8p` at
  `.claude/worktrees/tsk-4l8p-8Jlm9T` — confirmed clean (only the expected
  ADR0020 `.fgos/` strip-deletions) before dispatch.
- Built the real dispatch prompt with the REAL `buildPrompt`
  (`src/runner/dispatch/prepare.mjs`), called directly against `tsk-4l8p`'s
  actual work object, `stage: 'executing'` (the same call `dispatch/cli.mjs`
  makes internally) — not a hand-written approximation. Saved verbatim:
  `evidence/round3-dispatch-prompt.txt`.
- Ran, from inside `tsk-4l8p`'s own worktree, via a one-off script
  calling `executeExecutorCli('claude', {prompt, cwd: <tsk-4l8p worktree>,
  hasLiveTaskAccess: true})` directly (the exact function `dispatch.mjs
  execute claude --prompt ... --has-live-task-access` runs under the hood
  — used the direct import instead of the CLI's own shell-argv parsing
  only because this session's own worktree-isolation guard refuses a
  single Bash call combining command substitution with a multi-line prompt
  string; the dispatch call itself is byte-identical either way). Full
  result saved: `evidence/round3-d4-attempt-claude-result.json`.

**Found (real event stream + real worktree state, both confirmed
independently):**

- `status: 0`, `signal: null` — the process exited cleanly, no crash/hang.
- Real stdout (741 chars, not fabricated): claude reports it wrote
  `PROOF.txt` successfully, but that **every git command (`git status`,
  `git add`, `git commit`) was denied by the permission-approval gate in
  this session — even with `dangerouslyDisableSandbox`, and even a plain
  `git status` read** — and asks the (nonexistent, headless) human to
  approve a pending git permission prompt.
- **Cross-checked against real worktree state, not just the self-report**:
  `PROOF.txt` exists, content is EXACTLY `tsk-1jt proof written by claude`
  (matches the directive precisely) — `git status --short` in
  `tsk-4l8p`'s own worktree shows it `??` (untracked). `git log --oneline`
  shows NO new commit on top of `10847668` — the commit never happened,
  confirming the self-report rather than contradicting it.
- Logged the real `executor.dispatch` event:
  `{"seq":20273,"type":"executor.dispatch","payload":{"id":"tsk-4l8p",
  "executorId":"claude","provider":"claude","command":"claude",
  "model":"sonnet",...}}` (`.fgos/events.jsonl`).

**Root cause (diagnosed, not guessed):** `runner.executors.claude`'s
invocation args are `--permission-mode acceptEdits --allowedTools
"Bash(git add:*),Bash(git commit:*)"` — identical to the top-level
`runner.executor` default. `claude --help` confirms both flags exist with
this exact spelling, and its own `--allowedTools` example uses a
SPACE-separated pattern (`"Bash(git *)"`), not the colon-scoped
subcommand form (`"Bash(git add:*)"`) this config uses — a plausible,
though not confirmed without a further isolated retry, syntax mismatch.
Independently of that specific syntax question, `PROOF.txt`'s successful
write (an Edit-class tool) against total Bash denial (git-add/git-commit,
Bash-class tools) is consistent with `acceptEdits` auto-approving only
edit-class tools and leaving Bash-class tools gated regardless of
`--allowedTools` content in a headless (`-p`, no TTY) session — this repo's
own `.fgos/events.jsonl` carries ZERO prior `executor.dispatch` events for
provider `claude` (checked: `grep -c executor.dispatch` → 33 total events,
none naming `claude`), so this is the FIRST real out-of-process `claude`
dispatch in this repo's history — there is no prior successful precedent
to compare against, and no evidence either reading is wrong.

**A second, independent contract deviation**, worth naming separately
from the git-permission finding: claude's report did not use the
contract's fixed two-token vocabulary (`[DONE]`/`[BLOCKED]`) at all — it
asked a live question to a human ("Could you approve the pending git
permission prompt...?"), which a genuinely headless dispatch (no one to
answer) cannot resolve. Layer 1 rule 4 calls for `[BLOCKED] <precise
reason>` in exactly this situation; the contract's own vocabulary was
available and was not used.

**Verdict: RED — the D4 claim is disproven for the CURRENT config, with
two precisely-named findings**, not a vague failure:
1. `runner.executors.claude`'s (and, since the args are byte-identical,
   the top-level `runner.executor`'s own) `--permission-mode acceptEdits
   --allowedTools "Bash(git add:*),Bash(git commit:*)"` does not grant
   Bash-tool execution in a headless (`-p`) non-interactive session —
   Layer 2 rule 3 ("commit before return") cannot be satisfied with this
   invocation shape as configured today.
2. When genuinely blocked, `claude` asked a live question instead of
   reporting `[BLOCKED] <reason>` per Layer 1 rule 4's exact fixed-token
   contract — a second, independent deviation from a headless worker's
   required behavior.

Both findings are about `claude`'s CURRENT invocation config and CLI
behavior, not about whether `claude` can comprehend or attempt the
contract — it read the layered skill-pointer chain correctly and executed
the file-write step exactly as directed, which is real positive signal
the config/permission gap sits on top of.

**Not retried with an adjusted permission mode this round** — deliberately:
the config under test IS `runner.executors.claude` as it actually landed
(`10847668`); testing a hypothetical fixed config would answer a different
question than this item's own scope (prove/disprove the CURRENT config's
D4 compliance) and would spend more of this session's own shared-account
usage chasing a root-cause diagnosis that belongs in a dedicated follow-up
item, not this proof-test.

Cleanup: `tsk-4l8p` moved to `wontfix` (see below) and its throwaway
worktree/branch removed — never left dangling in the backlog.

## Verdict (Round 3, tsk-1jt)

**RED.** Two precisely-named findings recorded above:
`.agents/skills/_shared/coding-worker-contract.md`'s own "Return-channel
note" section gets the same append `pi`'s own GREEN got — the honest
negative result, not skipped, per this item's own plan.md step 6.

## Round 4 — 2026-08-19 (tsk-1dsr, discovery stage — diagnosing tsk-1jt's RED finding)

**Note on scope:** this round ran while `fgw/tsk-1dsr` had forked before
`tsk-1jt` merged, so this round's own text summarized Round 3 from this
same session's direct knowledge of it rather than reading it off disk —
Round 3 above is now the real, landed text (post-merge reconciliation).

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
