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
