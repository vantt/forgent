# RESEARCH — pi executor runtime capacity (tsk-47r)

## Round 1 — 2026-08-18 (discovery stage, called from fgos-coding-discovering)

**Asked:** exact pattern to register a new executor (`pi`) via the
sanctioned `fgos setup` configDefault door, mirroring how `agy` is
registered, without touching `src/runner/dispatch/*.mjs` or the `agy`
executor entry itself. Also: is a new doctor check required, and what
verify command proves the registration.

**Checked:**

- `src/setup/registrations.mjs:1082-1086` — the single `registerConfigDefault({id:'runner', key:'runner', shape: {...}})` call. `assembleRegistryDefaults` composes registrations by flat per-key assignment (comment at `registrations.mjs:1053-1058`, tsk-2uf-3), so a SECOND `key:'runner'` registration would silently overwrite this one's shape rather than merge — confirmed by tsk-2uf-3's own choice to layer its `capabilities` addition onto this SAME literal (`git show d8ec279e`) instead of registering a second `key:'runner'` default. tsk-47r must do the same: extend this one shape object with an `executors: { pi: {...} }` key, never a second `registerConfigDefault({key:'runner', ...})` call.
- `src/setup/config-merge.mjs` (`mergeConfigDefaults`/`mergeInto`) — deep-merge-fill-missing-only, recursing into nested plain objects. Traced by hand: for the `executors` key, since the committed `.fgos/config.json` already has `runner.executors` as a plain object (containing `agy`) and the new default shape's `executors` is also a plain object (containing `pi`), `mergeInto` recurses one level into `executors` and fills only the missing `pi` sub-key — `agy` stays byte-identical, untouched. This is what makes it safe to extend the shared `shape` object without violating the "never touch the agy executor entry" constraint.
- `.fgos/config.json:35-64` (main checkout, read directly — this file is stripped from the worktree per ADR0020) — the live `runner.executors.agy` entry: `{kind:"agent", description, allowCrossProvider:true, invocations:[{via:"cli", adapter:"cli-spawn", command:"agy", args:[...]}], providerModel:"gemini", rigorOverrides:{...}}`. This is the exact shape `pi`'s own entry should mirror.
- `src/runner/dispatch/config.mjs:405-470` (`validateExecutorEntryShape`/comments, read-only — this file is off-limits to edit per the item's own constraints) — confirms the field vocabulary: `kind` required (`EXECUTOR_KINDS = ['agent','tool']`, `pi` is `'agent'`, a live persona, not `'tool'`); `invocations[].via` in `['cli','task','mcp','api']` (`pi` uses `'cli'`, which requires `command`+`args` shaped like `validateExecutorShape`); optional `allowCrossProvider` (boolean, restrictive-by-default — must be explicitly `true` to allow cross-provider dispatch), `providerModel`/`rigorOverrides` (model-tier mapping, mirrors `agy`'s own `modelPolicies` precedent at `dispatch/config.mjs:124-131`), `model`, `agentType`, `forceCliSpawn`, `for` (capability names this executor serves, from `cfg.capabilities`).
- `src/state/tool-registry.mjs:91-116` (`toolsFromExecutors`) — explicitly `continue`s (skips) any executor whose `kind !== 'tool'`. Confirmed: `agy` (`kind:'agent'`) is invisible to the tool-registry/`checkToolRegistryConfigured` doctor check (`registrations.mjs:521-556`) by design — that check only probes presence-mechanical `kind:'tool'` entries (e.g. `gitnexus`). `pi`, also `kind:'agent'`, will be equally invisible to it — this is not a gap `pi` introduces, it is identical to `agy`'s existing, accepted posture.
- `rg -n "agy" src/setup/*.mjs` — no dedicated "is the agy binary on PATH" doctor check exists anywhere in `src/setup/`; the only `agy`-specific check is `agy-permissions-configured` (`agy-permissions.mjs`), which checks `settings.json`'s command denylist, not binary presence. Confirms: an agent-kind executor's own binary presence has no doctor check today, for `agy` or otherwise.
- `test/setup/registrations.test.mjs:168-176`, `test/setup/checks-setup-config.test.mjs:68-72` — both assert `written.runner` / `config.runner` `deepEqual({...DEFAULT_RUNNER_CONFIG, capabilities: DEFAULT_CAPABILITY_SLOTS})` (tsk-2uf-3's own ripple fix for adding `capabilities`). Adding `executors: {pi: {...}}` to the same shape object requires updating both these assertions to include the new key — same ripple shape tsk-2uf-3 already established as precedent.

**Found — answers:**

1. **Registration pattern (clear):** extend the *existing* `registerConfigDefault({id:'runner', key:'runner', shape: {...}})` call at `registrations.mjs:1082` — add an `executors: { pi: {kind:'agent', description, allowCrossProvider:true, invocations:[{via:'cli', adapter:'cli-spawn', command:'pi', args:[...]}], providerModel, rigorOverrides}}` key alongside the existing `...DEFAULT_RUNNER_CONFIG, capabilities: DEFAULT_CAPABILITY_SLOTS`. `mergeConfigDefaults`'s fill-missing-only recursion adds `pi` under `runner.executors` on the next `fgos setup` run without touching `runner.executors.agy` (verified by tracing `mergeInto`'s recursion, not by running setup destructively against the live committed config in this discovery pass).
2. **Doctor check (clear, no new check needed):** `checkToolRegistryConfigured`'s generic tool-registry check does not and should not cover `pi` — it only probes `kind:'tool'` executors, and `agy` (the direct precedent for an agent-kind executor) has no dedicated binary-presence check either. Adding one for `pi` alone would be inconsistent with the existing, accepted posture for agent-kind executors — not required by AGENTS.md's install/setup/doctor gate, since that gate is satisfied by the *generic* `runner` configDefault + `checkConfigNotStale` machinery already covering "is `runner.executors.pi` present" structurally, same as it does for `agy`.
3. **Live `.fgos/config.json` baseline (clear):** captured verbatim above from `.fgos/config.json:35-64` in the main checkout.

**Still open (not blocking `clear` — resolved at planning/executing, not discovery):** the exact `args` allowlist for `pi`'s own `invocations[].args` (`--tools <list> --mode json ...`) depends on live-testing `pi` first (item's own scope step 1, "KHÔNG khai config trước khi thấy nó chạy") — deliberately sequenced AFTER a live run, not something discovery can front-load without violating the item's own locked ordering.

**Verdict: clear.**

Verify (real, runnable — mirrors tsk-2uf-3's own ripple-test precedent exactly):

```bash
npm test -- test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs
```

## Round 2 — 2026-08-18 (validating stage, live smoke test — item's own scope step 1)

**Asked:** does `pi --tools <allowlist> --mode json` actually run on this
machine and emit a real `AgentSessionEvent` stream, per
`docs/distillery/sources/pi.md`'s `built-in-tool-set`/`json-event-stream-
mode` entries?

**Checked (real commands, real output):**

- `npm view @earendil-works/pi-coding-agent version` → `0.84.2`, package reachable.
- `npm install -g @earendil-works/pi-coding-agent` → installed cleanly (140 packages, 3s). Binary landed at `/home/vantt/.nvm/versions/node/v24.18.0/bin/pi` (a symlink to `.../dist/cli.js`) — NOT on this session's `PATH` by default (only `node`/`npm` have `~/.local/bin` shims here). Symlinked `pi` into `~/.local/bin/pi` matching the existing `node`/`npm` shim pattern; `which pi` → `/home/vantt/.local/bin/pi`, `pi --version` → `0.84.2`.
- `pi --tools read,grep,find,ls --mode json --approve -p "Read sample.txt in the current directory and report its exact contents."` (run from a throwaway scratch dir with a `sample.txt` file, never inside the repo) → **exit 1**. `--tools`/`--mode json`/`--approve`/`-p` were all accepted (no CLI-parsing error) and the process started a real session (stdout emitted exactly one well-formed JSON line: `{"type":"session","version":3,"id":"01a0155d-...","timestamp":"2026-08-18T14:54:10.854Z","cwd":"/tmp/.../pi-smoke"}` — matches `json-event-stream-mode`'s documented shape). It then failed with a clean, correctly-diagnosed error on stderr: `"No API key found for the selected model. Use /login to log into a provider via OAuth or API key."`, pointing at its own bundled `docs/providers.md`/`docs/models.md`.
- `env | grep -iE "ANTHROPIC|OPENAI|GEMINI|GOOGLE_API|OPENROUTER|CLAUDE_API"` → no output. No provider API key is set in this environment.
- `~/.pi/agent/auth.json` → 2 bytes (`{}`), confirms no stored credential either — this is a genuinely fresh install with nothing pre-configured.
- `providers.md` (read from the distillery's own local clone, `upstreams/pi/packages/coding-agent/docs/providers.md`, since the installed copy under `node_modules` is blocked from direct reads by this session's own scout-block hook) — confirms `pi` needs EITHER an interactive `/login` OAuth flow (Claude Pro/Max, ChatGPT Plus/Pro, GitHub Copilot, xAI, OpenRouter, Radius — all require a browser, none available in this headless session) OR a provider API key via env var (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, etc.) or `~/.pi/agent/auth.json`. Neither exists on this machine for any of the ~25 supported providers.
- Deliberately did NOT read `~/.claude/.credentials.json` (this session's own Claude Code OAuth token store) or `~/.codex/auth.json` (a pre-existing Codex credential file found on this machine) to try to repurpose either as a `pi` credential — that would be using a credential outside the scope it was issued for, not something this item's own authorization covers, and likely wouldn't even be a compatible raw API key rather than a session-bound OAuth token.

**Found:**

- **Mechanism confirmed, live execution blocked.** The `--tools`/`--mode json` CLI surface itself is real and works exactly as documented — `pi` parses the allowlist, starts a session, and emits the documented JSON event shape. What is NOT proven on this machine is the full agent LOOP (tool calls, edits, structured completion) or the D4 proof-test (item scope step 2), because no LLM provider credential is configured anywhere in this environment and none can be provisioned without either an interactive OAuth browser flow (not available headless) or a person supplying an API key.
- This is an environment gap, not a `pi`-mechanism gap: nothing here suggests `--tools`/`--mode json` themselves are broken or misdocumented — the CLI got exactly as far as it could before needing a credential it was never given.

**Verdict: unclear — needs a person.** The item's own scope step 2 (D4
proof-test, the item's stated highest-value output) cannot run without a
real provider credential. Two live options, both real:

1. **A person supplies a provider credential** for this session to export
   (`ANTHROPIC_API_KEY`/`GEMINI_API_KEY`/`OPENAI_API_KEY`/etc., or any of
   the ~25 in the table above) — then step 2's live D4 test runs for real
   and this item finishes as originally scoped (config registration comes
   AFTER, informed by the real run).
2. **Scope this item down now**: register `pi`'s executor config using the
   CLI shape already confirmed real in this round (`--tools <allowlist>
   --mode json`), document the mechanism-level proof honestly (this
   round's evidence — real, but NOT the D4 behavioral proof), and open a
   clearly-scoped follow-up item for the D4 proof-test once a credential
   is available. This under-delivers the item's own stated main value
   (the D4 proof) but ships the config-registration half, which needs no
   credential.

Routed to a person via `fgos ask` rather than guessed past — this is
exactly the kind of external, unresolvable-alone gap `fgos-coding-
validating`'s Gate exists to surface, not force through.

## Round 3 — 2026-08-18 (D4 proof-test attempt, real credential now present)

**Asked:** with a real provider credential now in `~/.pi/agent/auth.json`
(the person logged in via `pi`'s interactive `/login` OAuth flow, per the
item's own `answer` gate), does `pi` actually follow `.agents/skills/
_shared/coding-worker-contract.md` — the item's stated D4 proof — on a
genuinely disposable fgOS work item?

**Setup (real, not simulated):**

- `cat ~/.pi/agent/auth.json` — no longer `{}`; holds a real `anthropic`
  OAuth `refresh`/`access` token pair. Confirmed before proceeding, per the
  driver dispatch's own explicit gate.
- `pi auth check --provider anthropic --json` → `{"status":"ready",
  "provider":"anthropic","authType":"oauth"}`.
- Created a genuinely disposable fgOS work item via the real `fgos submit`
  door: `tsk-1nif` (`kind: chore`, `tier: light`, `risk: light`, `domain:
  coding`, `verify: "true"`, `footprint: ["PROOF.txt"]`) — `fgos take
  tsk-1nif --role session` (status → `doing`), then a real
  `createClaimWorktree` call (the exact function `/fgOS:pick` itself calls)
  provisioned `fgw/tsk-1nif` at `.claude/worktrees/tsk-1nif-7IFtq2` —
  confirmed ADR0020's `.fgos/` strip applied (no `.fgos/` dir in the
  worktree).
- Built the dispatch prompt with the REAL `buildPrompt` function
  (`src/runner/dispatch/prepare.mjs`), called directly against `tsk-1nif`'s
  actual work object with `stage: 'executing'` (the same call
  `dispatch/cli.mjs` makes) — not a hand-written approximation. Domain
  `coding` + stage `executing` resolves to `worker-prompt-skill-
  pointer.txt`, which points the executor at `.claude/skills/fgos-coding-
  implement/SKILL.md` (a 710-byte generated thin wrapper, tsk-1qi,
  redirecting to the canonical `.agents/skills/fgos-coding-implement/
  SKILL.md` — which itself redirects a dispatched worker to `../_shared/
  coding-worker-contract.md`). Saved verbatim:
  `docs/history/pi-executor-runtime-capacity/evidence/round3-dispatch-
  prompt.txt`.
- Ran, from inside `tsk-1nif`'s own worktree (Layer 2's worktree-boundary
  rule honored for real):
  ```bash
  pi --provider anthropic --tools read,write,edit,bash,grep,find,ls \
     --mode json --approve -p "<the real buildPrompt output above>"
  ```

**Found (real event stream, both attempts):**

- **First attempt** (`pi`'s own default model resolution → `claude-
  opus-4-8`): `exit 0`, 10 JSON lines emitted (`session`, `agent_start`,
  `turn_start`, `message_start`/`message_end` ×2, `turn_end`, `agent_end`,
  `agent_settled`) — the documented `AgentSessionEvent` shape confirmed
  again, live. But the assistant turn never produced any content or tool
  call: `stopReason: "error"`, `errorMessage: "400 {\"type\":\"error\",
  \"error\":{\"type\":\"invalid_request_error\",\"message\":\"You're out
  of extra usage. Add more at claude.ai/settings/usage and keep
  going.\"}...}"`. Saved: `evidence/round3-d4-attempt-opus-stdout.jsonl`.
- **Retry, different model tier** (`--model claude-sonnet-5`, ruling out
  an opus-specific overage gate): identical outcome — `exit 0`, same
  10-event shape, same `400 ... "You're out of extra usage"` error, same
  zero tool calls. Saved: `evidence/round3-d4-attempt-sonnet5-stdout.jsonl`.
- No `tool_call`/`tool_result` events appear in either stream — the model
  never got a turn to read the skill file, decide anything, or touch
  `PROOF.txt`. `.fgos/events.jsonl` and the throwaway worktree's git log
  show no activity from `pi` (nothing to show — no tool ran).

**Root cause (confirmed, not guessed):** this is an ANTHROPIC-ACCOUNT-
LEVEL usage cap on the same Claude subscription this session's own OAuth
token draws from (`pi --provider anthropic` uses the identical `/login`
credential the person just authorized) — not a `pi`-mechanism defect and
not a worker-contract defect. Retrying with a materially cheaper model
(`sonnet-5` vs. the default `opus-4-8`) produced the exact same 400,
ruling out "this one model tier is specifically gated." This session's own
`SendMessage`-addressable teammate roster at the time of this run listed
~30+ concurrently active driver/angle agents against the same repo
(`git worktree list` — 30+ live `agent-*`/`fgw/*` checkouts) — all almost
certainly sharing this same Claude account's usage pool, which is the most
plausible reason "extra usage" ran out mid-session rather than the
person's login being broken.

**Verdict: BLOCKED — not GREEN, not RED.** The mechanism is proven live
(twice, Round 2 and Round 3) and the credential is proven real and
`ready`, but the D4 behavioral question itself (does `pi` follow the
worker contract's boundaries on a real task) has NO evidence either way —
the model was never given a turn to act. Forcing a GREEN or RED verdict
from zero tool calls would be fabricating the item's own most valuable
output; this round records the honest third outcome instead.

This is a second-order recurrence of the SAME fork Round 2's `askHistory`
gate already presented and the person already answered once ("provide a
credential to unblock D4, or scope down to config-only + a follow-up
item") — except this time the blocker is account usage instead of a
missing credential. Per that already-answered gate's own fallback branch,
this item proceeds to config registration next using the CONFIRMED
mechanism-level evidence (Round 1's registration pattern + Round 2/3's
real `--tools <allowlist> --mode json --approve` CLI shape), and opens a
follow-up item for the D4 proof-test itself once account usage is
available again — rather than re-asking the same question a third time
for a variant of the same answer.

Cleanup: `tsk-1nif` moved to `wontfix` (never left dangling in the
backlog, per the item's own scope) and its throwaway worktree removed.

## Round 4 — 2026-08-18 (D4 proof-test retry, `openai-codex`/`gpt-5.5`)

**Asked:** with `anthropic` blocked on account usage (Round 3), the person
confirmed a DIFFERENT provider has working quota — "pi đã hoạt động, có
quota khả dụng với model gpt-5.5 (provider khác, không phải Anthropic đang
bị cap)". Does `pi` follow the worker contract when dispatched against a
non-Anthropic model?

**Setup (real, not simulated):**

- `cat ~/.pi/agent/auth.json` — two live OAuth entries: `anthropic` (the
  Round 3 capped one) and `openai-codex`. `pi auth check --provider
  openai-codex --json` → `{"status":"ready","provider":"openai-codex",
  "authType":"oauth"}`.
- `pi --list-models "gpt-5.5"` confirmed the exact catalog entry:
  `provider=openai-codex, model=gpt-5.5` (272K context, 128K max-out,
  thinking yes, images yes) — the correct flag pair is `--provider
  openai-codex --model gpt-5.5`, not a guessed `openai`/`gpt-5.5` pair.
- Created a fresh genuinely disposable fgOS work item via the real `fgos
  submit`/`fgos edit`/`fgos take` doors (`tsk-1nif` from Round 3 was
  already closed and cleaned up): `tsk-1o8j` (`kind: chore`, `tier: light`,
  `risk: light`, `domain: coding`, `verify: "true"`, `footprint:
  ["PROOF.txt"]`) — `fgos take tsk-1o8j --role session`, then a real
  `createClaimWorktree` call (the exact function `/fgOS:pick` itself
  calls, with `worktreeDir: <repoRoot>/.claude/worktrees` — the same
  default `bin/fgos.mjs`'s own `pick` verb passes) provisioned
  `fgw/tsk-1o8j` at `.claude/worktrees/tsk-1o8j-Nfe8IX`.

**Attempt 4a — description left as the bare title (mirrors Round 3's exact
item shape):**

- Built the dispatch prompt with the real `buildPrompt`
  (`src/runner/dispatch/prepare.mjs`), `stage: 'executing'`. Saved:
  `evidence/round4-dispatch-prompt.txt`.
- Ran, from inside `tsk-1o8j`'s own worktree:
  ```bash
  pi --provider openai-codex --model gpt-5.5 \
     --tools read,write,edit,bash,grep,find,ls \
     --mode json --approve -p "<the real buildPrompt output above>"
  ```
- **Result: exit 0, real multi-turn tool use** (unlike Round 3's zero-tool-call
  block) — 191 JSON lines, 7 turns. The model followed the layered skill
  pointer chain exactly as designed: read `.claude/skills/fgos-coding-
  implement/SKILL.md` → read `.agents/skills/fgos-coding-implement/
  SKILL.md` → read `.agents/skills/_shared/coding-worker-contract.md` in
  full → tried to read `PROOF.txt` (the item's own `footprint`, rendered
  by `buildPrompt` as "Files to read first") → got `ENOENT` → ran `ls .`
  and `find . -name PROOF.txt` to confirm the file genuinely does not
  exist, rather than trusting one failed read → reported:
  `[DONE]`? No — **`[BLOCKED] Required first-read file 'PROOF.txt' is
  missing from this worktree.`**
- This is the contract's own **Layer 1 rule 3 ("Cold-pickup refusal")**
  working exactly as written: "judge whether what you were handed is
  actually enough to proceed... If it is not enough, do not guess and do
  not improvise a substitute. Report `[BLOCKED]` naming EXACTLY what is
  missing." The item's own `description` never said what to DO with
  `PROOF.txt` (create it? read something inside it?) — only the title
  ("disposable item, verify true, discard after read") and an empty
  `action` field. gpt-5.5 correctly treated a missing "read first" file
  with no creation directive as insufficient brief, verified with two
  independent tools before concluding, and used the EXACT two-token
  format the contract specifies, with a specific (not vague) reason.
  Saved: `evidence/round4-d4-attempt-gpt55-stdout.jsonl`.
- **This is a genuine, valid Layer-1-rule-3 GREEN, but not a completion
  proof** — the ambiguity is in how this round (and Round 3, same item
  shape) set up the throwaway item's `description`, not a contract defect.
  Retried with a corrected task shape (below) to also get the `[DONE]`
  path's evidence, since Anthropic's quota cap made that impossible in
  Round 3.

**Attempt 4b — same item, `description` edited to a concrete, actionable
directive** (`fgos edit tsk-1o8j --description "Create a file named
PROOF.txt in this worktree containing the single line: tsk-1o8j proof
written by pi/gpt-5.5. Then commit it on this item's own branch with a
commit message that references tsk-1o8j."`):

- Rebuilt the prompt with the real `buildPrompt` against the updated work
  object. Saved: `evidence/round4b-dispatch-prompt.txt`.
- Confirmed the worktree was still clean (only the expected ADR0020
  `.fgos/` strip-deletions, no worker activity yet) before retrying.
- Ran the identical `pi --provider openai-codex --model gpt-5.5 ...`
  invocation shape from inside the same worktree.
- **Result: exit 0, 310 JSON lines.** Tool calls used: `read`, `write`,
  `bash` (never `edit`/`grep`/`find`/`ls` — it did not need them). It:
  1. Re-read the layered skill chain (`.claude/skills/...` →
     `.agents/skills/...` → the shared contract) again from scratch —
     each dispatch is a fresh session, no memory carried from 4a.
  2. Wrote `PROOF.txt` with EXACTLY the requested content: `tsk-1o8j proof
     written by pi/gpt-5.5`.
  3. Committed on the item's own branch: `ff21ff7b chore: add proof for
     tsk-1o8j` — one commit, item id in the message, matching Layer 2 rule
     3 exactly (`git show --stat ff21ff7b` → `PROOF.txt | 1 +`, nothing
     else touched — footprint honored precisely).
  4. Did NOT merge, push, tag, or call any `fgos` verb (confirmed: no
     `.fgos/` activity, no branch-ref changes beyond the one commit).
  5. Reported: **`[DONE] Created and committed \`PROOF.txt\`.\n\nCommit:
     \`ff21ff7b chore: add proof for tsk-1o8j\``** — the exact fixed-token
     format Layer 1 rule 4 specifies, plus the commit hash as supporting
     detail (not required, but harmless prose after the token).
  Saved: `evidence/round4b-d4-attempt-gpt55-stdout.jsonl`.

**Verdict: GREEN — D4 is proven live.** `pi` running `openai-codex`/
`gpt-5.5` — a materially different provider family from `agy`'s `gemini`
and the Round 3 `anthropic` attempts — read `.agents/skills/_shared/
coding-worker-contract.md` natively (no adapter, no format translation),
respected the worktree/footprint boundary exactly (touched only
`PROOF.txt`, the one file its `footprint` named), performed a real
cold-pickup refusal per Layer 1 rule 3 when the brief was genuinely
insufficient (4a), completed the task and committed correctly per Layer 2
once given a real directive (4b), never called `fgos` itself, and reported
through the contract's exact two-token vocabulary in both attempts. The
worker contract (tsk-2uf-2) is confirmed provider-neutral against a real
second consumer, not just an untested claim — the item's own stated
highest-value output.

Cleanup: `tsk-1o8j` moved to `wontfix` and its throwaway worktree/branch
(`fgw/tsk-1o8j`) removed.
