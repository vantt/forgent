# RESEARCH.md — tsk-1xm (agy permission/capability-allowlist surface)

## Round 1 — 2026-08-18

**Asked:** does the `agy` CLI (Antigravity Cli, `.fgos/config.json`'s
`runner.executors.agy`, installed at `/home/vantt/.local/bin/agy`, currently
dispatched with `--dangerously-skip-permissions`) expose any real
permission/capability-allowlist surface reachable WITHOUT that flag — one a
headless out-of-process dispatch (`-p`/print mode, no human to answer a
prompt) could actually use, as opposed to hanging on an interactive
permission prompt?

**Checked — repo (`rg -- "dangerously-skip-permissions|agy " src bin docs
test --glob "*.{mjs,cjs,md}"`):** confirms `.fgos/config.json`'s own
default `runner.executor` (the in-process `claude` executor, distinct from
`executors.agy`) already expresses a real allowlist via CLI flags:
`--permission-mode acceptEdits --allowedTools "Bash(git add:*),Bash(git
commit:*)"`. No existing repo doc records agy's own equivalent surface —
`docs/history/agy-dispatch-reliability/RESEARCH.md` (tsk-1up) checked
`agy --help` but only for the unrelated `--print-timeout` question;
`docs/history/task-dispatch-unification/DISCUSSION.md` §Vòng 5 verified
`--dangerously-skip-permissions` itself is real via `agy --help` but never
investigated an alternative.

**Checked — `agy --help` (installed binary, `/home/vantt/.local/bin/agy`,
run live):** full flag surface has `--dangerously-skip-permissions`
("Auto-approve all tool permission requests without prompting"), `--mode`
("Set the agent execution mode for this session (accept-edits, plan)"),
`--sandbox` ("Run in a sandbox with terminal restrictions enabled"),
`--agent` ("Agent for the current CLI session"). No `--allowedTools`-shaped
flag exists — a capability allowlist is NOT expressed as a single CLI flag
the way Claude's `--allowedTools` is.

**Checked — `agy changelog` (installed binary's own release notes, run
live, cited by version):**

- **v1.1.1**: "Changed the default mode to respect write_file permissions
  allowlisted in `settings.json` under `permission.allow`, so pre-approved
  file writes no longer prompt for review." — confirms a real, versioned
  allowlist schema: `settings.json`'s `permission.allow`, not a CLI flag.
- **v1.1.4-ish** (headless-mode line): "Fixed headless (`-p`) runs so they
  now honor persisted `settings.json` policies, including `permissions`,
  file access, sandbox mode, auto-execution, and artifact review." —
  confirms this mechanism is reachable from print/headless mode, the exact
  mode fgOS's `agy` executor dispatches through.
- **Same era**: "Fixed headless (`-p`) runs hanging or silently
  auto-approving tools that require a permission confirmation, so the CLI
  now soft-denies such tools and prints a stderr notice naming the
  allow-rule needed to permit them." — this is the critical finding: a
  headless `agy -p` run WITHOUT `--dangerously-skip-permissions` does NOT
  hang waiting for a human (the failure mode this discovery round set out
  to rule in/out) — it soft-denies the specific tool call and names the
  exact allow-rule that would have permitted it, in stderr.
- **v1.1.6**: "Custom Agents (Markdown Format)... Markdown agents support
  `mainAgent`, `subagent`, `hidden`, `inheritMcp`, and
  `commandExecutionPolicy` frontmatter fields for fine-grained control over
  agent behavior." — a second, agent-scoped mechanism (`agent.md`
  frontmatter's `commandExecutionPolicy`), selectable via the existing
  `--agent <name>` CLI flag. Not investigated further this round — the
  `settings.json` `permission.allow` path alone already answers the
  ambiguity; `commandExecutionPolicy` is a candidate for planning to weigh
  against it, not something discovery needs to resolve.
- Confirms `permission.allow` uses a per-command pattern syntax
  (`command(pattern)` shape), same family as Claude's `Bash(git add:*)`:
  a later entry fixes "an allowlist entry that tokenizes to zero command
  words — `command(time)`, a comment-only entry, or an empty compound such
  as `()` — matching every command and silently auto-approving anything the
  agent ran."
- Confirms `--mode` (`accept-edits`/`plan`) is honored in headless `-p` runs
  as of a later fix: "Fixed `--mode` being ignored in headless `-p` runs,
  where a valid value such as `accept-edits` or `plan` was never applied."

**Checked — live, no-quota `/permissions` query (confirms the schema is
real and queryable today, not just changelog prose):**
```bash
cd /home/vantt/projects/forgentX
agy -p "/permissions" --print-timeout 15s --output-format json
```
```json
{"conversation_id":"","status":"SUCCESS","response":"","duration_seconds":0,"num_turns":0,"usage":{"input_tokens":0,"output_tokens":0,"thinking_tokens":0,"cache_read_tokens":0,"total_tokens":0},"command":{"name":"permissions","data":{"permissions":[{"scope":"project"},{"scope":"shared"},{"scope":"global"}]}}}
```
Confirmed free (per changelog: print-mode slash commands like `/permissions`
answer "without starting an agent turn, spending quota" — `num_turns:0`,
all token counts `0` here). Shows the real scope model: `project` / `shared`
/ `global` permission records, currently all empty (this machine has always
dispatched agy with `--dangerously-skip-permissions`, so no allow-rule was
ever persisted).

**Checked — on-disk settings (`/home/vantt/.gemini/antigravity-cli/
settings.json`, agy's real config file, read live):**
```json
{
  "trustedWorkspaces": [
    "/home/vantt/projects/forgent",
    "/home/vantt/projects/herdr-gateway",
    "/home/vantt/projects/forgentX"
  ]
}
```
No `permission.allow` block present yet — confirms the schema is real but
unconfigured today; `forgentX` is already a trusted workspace, which the
changelog separately ties to a distinct, coarser gate ("access outside your
workspace... grants only read access; writes are auto approved according to
the cycle mode setting") — trust and the fine-grained `permission.allow`
allowlist are two different, stacked layers.

**Finding: ambiguity #1 resolved — YES, agy exposes a real
capability-allowlist surface, reachable without `--dangerously-skip-
permissions`, headless-safe.** It is not a single CLI flag like Claude's
`--allowedTools` — it is a config-file mechanism (`settings.json`'s
`permission.allow`, per-command pattern rules, `project`/`shared`/`global`
scoped) combined with the `--mode accept-edits` CLI flag (now honored in
headless mode) and the `--agent` flag selecting a markdown agent whose own
`commandExecutionPolicy` frontmatter is a second, more specific candidate
mechanism. A dispatch that drops `--dangerously-skip-permissions` and
instead relies on a pre-populated `permission.allow` allowlist does NOT
hang in headless mode — it soft-denies out-of-allowlist calls with a named
stderr reason, which is exactly the behavior a machine-driven worker needs
(fail loud and specific, never hang waiting on a human that isn't there).

**Not yet checked (left for planning, out of discovery's own scope):** the
exact `permission.allow` pattern syntax needed to cover the worker
contract's three verbs (read/write within the assigned worktree footprint,
run verify/shell commands, `git add`/`git commit`) precisely — whether
patterns are path-scoped, command-scoped, or both; whether `commandExecutionPolicy`
in a custom `agent.md` (selected via `--agent`) is a cleaner mechanism than
`settings.json`'s global/project rules for a per-dispatch scoped worker;
which of `project`/`shared`/`global` scope fgOS's own dispatch should write
into (project scope, keyed to this repo, is the obvious first candidate but
not yet confirmed against agy's own scope-resolution order); whether
`--sandbox` ("terminal restrictions") is a complementary or redundant
control alongside `permission.allow`.

**Open:** none for discovery's own clarity question — the item's own
described ambiguity #1 ("does agy have a permission surface that can
express an allowlist") is answered with real, cited, live-verified evidence:
yes. The concrete allowlist shape (item's ambiguity #2) is planning's job,
per the item's own text ("nếu có thì allowlist tối thiểu đủ cho một worker
... là gì").

**Verify (real, runnable, proves the headless soft-deny path — not the
item's eventual fix — is real and does not hang):**
```bash
cd /home/vantt/projects/forgentX && agy -p "/permissions" --print-timeout 15s --output-format json | grep -q '"scope":"project"'
```
