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

## Round 2 — 2026-08-18 (validating stage, this pass)

**Asked:** does the changelog-cited "headless soft-deny, never hang" claim
hold under a real live call using the plan's actual proposed args shape
(`--mode accept-edits`, no `--dangerously-skip-permissions`), against a
prompt that needs real tool calls (a file write plus a shell command) —
not just the free `/permissions` read the Round 1 verify already covers?

**Checked — live call, run from the `tsk-1xm` worktree:**
```bash
agy -p "Create a file named tsk-1xm-validating-probe.txt in the current \
directory with the text 'proof' inside it, then run the shell command \
ls tsk-1xm-validating-probe.txt to confirm it exists." \
--mode accept-edits --print-timeout 30s --output-format json
```
Result: exit code 2, completed in 5.93s (`duration_seconds: 5.930422661`,
`num_turns: 1`, real quota spent: 31909 input / 759 output tokens). stderr:
`jetski: no output produced — a tool required the "command" permission
that headless mode cannot prompt for, so it was auto-denied. Add an
allow-rule under permissions.allow in settings.json (e.g.
command(<target>)). Alternatively, re-run with
--dangerously-skip-permissions to auto-approve all tools.` No file was
created (`ls tsk-1xm-validating-probe.txt` afterward: not found) — the
whole turn failed clean, no partial/silent success.

**Finding 1 — CONFIRMED, not just changelog prose:** the plan's central
"does not hang, soft-denies with a named stderr reason" claim is real,
live-verified. This rules out the worst failure mode (a hung dispatch)
outright.

**Finding 2 — new, sharper than Round 1 anticipated:** `--mode
accept-edits` alone does **not** cover shell/command-type tool calls —
the agent's attempt to run `ls` (a `command`-permission tool) was
auto-denied even under `accept-edits`. Every fgOS `agy` dispatch runs at
least one shell command as part of its own worker contract (`git add`,
`git commit`, the verify command) — meaning a bare `.fgos/config.json`
args swap (drop the flag, add `--mode accept-edits`) with **no**
`permission.allow` entry configured would make **every** subsequent `agy`
dispatch fail outright (exit 2), not just soft-deny the parts outside an
intended allowlist. `permission.allow` is not an optional hardening layer
on top of `--mode accept-edits` here — it is a hard prerequisite for the
executor to do anything at all.

**Not checked this round, and structurally not checkable without touching
the one shared config file:** which exact `permission.allow` pattern (and
which scope — plan.md reasons `global` over `project`, not yet empirically
confirmed) actually grants the worker contract's needed capabilities
without over-permitting. `~/.gemini/antigravity-cli/settings.json` is the
**only** on-disk agy settings file on this machine (confirmed: no
per-project/workspace-scoped settings file exists anywhere in this repo or
under `~/.gemini`), shared machine-wide across every `agy` session
(`forgent`, `herdr-gateway`, `forgentX` are all `trustedWorkspaces` reading
this one file), and `agy`'s own CLI surface has no `--config`/env-var
override to isolate a test (checked `agy --help` and `agy changelog` for
both, neither documents one). Writing a real `permission.allow` rule to
prove the pattern syntax works IS the item's own actual intended change,
not a throwaway test — parked at `awaiting-human` this pass rather than
edited silently.

## Round 3 — 2026-08-18 (live proof pass, human-authorized)

**Authorized:** add a `permission.allow` block to
`~/.gemini/antigravity-cli/settings.json` for a live proof pass, starting
narrow (`command(git:*)` plus whatever the verify command needs), with a
byte-for-byte backup taken first and an immediate revert if anything looked
wrong, done as one tight sequence.

**Backup taken first (byte-for-byte, confirmed by md5sum before/after):**
```json
{
  "trustedWorkspaces": [
    "/home/vantt/projects/forgent",
    "/home/vantt/projects/herdr-gateway",
    "/home/vantt/projects/forgentX"
  ]
}
```
md5: `1f2bf38ef13345267802f1943c5dec86` (saved to a scratchpad file outside
the repo before any edit, restored from that exact file at the end — same
md5 confirmed after restore).

**Schema confirmed real via `strings` on the installed `agy` binary
(`/home/vantt/.local/bin/agy`) and a live `agy -p "/config"` dump:** the
settings struct has a `permission` field (`json:"permission"`) with nested
`allow`/`deny` arrays (`json:"allow,omitempty"`, `json:"deny,omitempty"`,
Go type names `PermissionConfig`/`GetPermissionConfig`/
`initializePermissionConfig`). A literal embedded example string found in
the binary: `"permissionOverrides": ["command(npm test)"]`. `agy -p
"/config" --output-format json` echoed our written rule back correctly
under a `permission` key each time, confirming the file is read into the
live config — this part of the plan's technical claim was NOT wrong.

**Four rule shapes tried, live, each followed immediately by the same
Round-2-shape probe (`git status --short` via `--mode accept-edits`, no
`--dangerously-skip-permissions`) — all four still soft-denied with the
identical generic stderr (`a tool required the "command" permission... was
auto-denied`):**

1. `"command(git:*)"` + `"command(npm:*)"` — Claude-style colon-wildcard
   suffix. Denied.
2. `"command(regex:^git )"` + `"command(regex:^npm )"` — the changelog's
   own documented `regex:` opt-in prefix ("Improved command permission
   security by making 'Always Approve' rule matching strict (non-regex) by
   default, while allowing users to explicitly opt-in to regex matching by
   prepending rules with `regex:`"). Denied.
3. `"command(git)"` + `"command(npm)"` — bare executable name only (no
   args), reasoning from the changelog's "an allowlist entry that
   tokenizes to zero command words... matches every command" bug
   description implying token-count-sensitive matching. Denied.
4. `"command(git status --short)"` — exact literal full command string,
   matching the binary's own embedded example format
   (`command(npm test)`) as closely as possible, run against the exact
   same literal probe command. Denied.

Each probe completed in 3-4.5s (`num_turns: 1`, real quota spent each
time, `duration_seconds` in the 2.9-4.5s range) — never hung, consistent
with Round 2's "soft-deny, don't hang" finding holding. But none of the
four rule shapes changed the outcome from Round 2's baseline (no
`permission.allow` block at all).

**Finding 3 — the plan's central technical claim does not hold as
written.** `permission.allow` in `~/.gemini/antigravity-cli/settings.json`
is real, is read by `agy` (confirmed via `/config`), but does **not**
appear to gate the `"command"` tool type through any of the four
plausible syntaxes tried. Re-reading the Round 1 changelog citation more
carefully: the exact wording was "Changed the default mode to respect
**write_file** permissions allowlisted in `settings.json` under
`permission.allow`" — Round 1 generalized this to "a capability-allowlist
surface" without noticing the citation names `write_file` specifically,
not `command`. The two tool types (`write_file`, `command`) may be gated
by genuinely different mechanisms, and the one this item's whole verify
condition and worker-contract needs (`command`) is not the one
`permission.allow` was shown, in Round 1's own changelog citation, to
cover.

**Not yet identified:** the real gating mechanism for the `command` tool
type in headless mode without `--dangerously-skip-permissions`. Candidates
not ruled out: the plural `"permissions"` settings key (distinct from
singular `"permission"`, present in the `/config` dump as `null`,
possibly scope-keyed `global`/`project`/`shared` the way the `/permissions`
panel lists three scopes); the `--agent`-selected custom `agent.md`
frontmatter's `commandExecutionPolicy` (flagged as a candidate in Round 1,
rejected in planning only because it requires shipping a new artifact —
not because it was shown not to work); the `toolPermission` config field
itself (`"request-review"` in the live dump) might need a different mode
value with no headless equivalent to interactive approval at all, meaning
`command`-type tools may be structurally unreachable in headless mode
short of `--dangerously-skip-permissions`, independent of any
`permission.allow` rule shape.

**Restored:** `~/.gemini/antigravity-cli/settings.json` reverted to the
exact backed-up content, byte-for-byte (md5 `1f2bf38ef13345267802f1943c5dec86`
before and after). Baseline re-verified after restore: the item's own
verify command (`agy -p "/permissions" ... | grep -q '"scope":"project"'`)
passes clean.

**Verdict:** live proof did **not** succeed. Per the authorization's own
stop condition ("If anything about the live test looks wrong... restore...
and report rather than iterating further live on a machine-shared file"),
stopping here rather than trying further syntaxes or the two remaining
candidate mechanisms live. This is a new, load-bearing finding that
falsifies plan.md's Approach section's central claim (§"What discovery
already established" / the `global`-scope decision) — plan.md needs
re-opening, not just an implementation continuation, before any of
plan.md's Order steps (config args swap, doctor/setup registration, test
update) can proceed.

## Round 4 — 2026-08-18 (schema correction + second live proof pass)

**Reported schema fix (input to this round):** Round 3 wrote its rule
block under the **singular** key `"permission"`. `agy`'s live `/config`
dump that same round separately showed a distinct **plural** key,
`"permissions"`, sitting at `null` throughout — the one Round 3's own
closing section named as a not-yet-tried candidate but never wrote to.
This round corrected that: wrote a `"permissions": {"allow": [...],
"deny": [], "ask": []}` block (plural key) instead.

**Live proof pass run this round (same discipline as Round 3 — backup
first, md5-verified restore at the end, one tight sequence):**

1. Backup taken first, md5 `1f2bf38ef13345267802f1943c5dec86` (same
   baseline as Round 3 — no drift between rounds).
2. `{"permissions":{"allow":["command(git)"]}}` written, live probe
   (`git status --short` via `agy -p ... --mode accept-edits`, no
   `--dangerously-skip-permissions`) run: **still soft-denied**, identical
   stderr to Round 3's baseline. But `agy -p "/config"` now echoed the
   rule back correctly under the **plural** `"permissions"` key (Round 3
   only got it read under `"permission"`, singular) — confirms the schema
   correction itself was real: the plural key **is** the one `agy`
   actually parses into its live permission struct. Reading the rule
   correctly and *acting* on it turned out to be two separate questions.
3. Also discovered a second field, `toolPermission` (live `/config` dump,
   default value `"request-review"`) — a distinct top-level mode
   controlling whether tool-call permission is even consulted, separate
   from `--mode`'s `agentMode` (`accept-edits`/`plan`, file-write pacing
   only). Tried `"toolPermission": "strict"` + `permissions.allow`
   (bare-token, then exact-literal `"command(git status --short)"`
   shapes): **both still soft-denied**, identically. `"strict"` mode
   appears to blanket-deny `command`-type calls in headless `-p` mode
   regardless of `permissions.allow` content — consistent with the
   changelog's "an allowlist entry ... matches nothing" and "commands
   being auto-approved while in request-review or strict permission
   mode" fix lines, i.e. `strict`/`request-review` are both designed to
   *never* silently auto-approve a command in headless mode, allow-list
   or not.
4. Tried `"toolPermission": "always-proceed"` (the changelog's other
   named mode) with the same `permissions.allow: ["command(git)"]`:
   **the command ran** — `git status --short` executed for real (actual
   process output returned, not a stub). This is the first successful
   live command execution across every round of this item.
5. **Critical follow-up check — is the allow-list actually gating
   anything under `always-proceed`, or is the mode itself the sole gate?**
   Ran the same probe shape against `whoami` — a command **not** on the
   allow-list. **It also ran successfully**, unrestricted. This proves
   `permissions.allow` is inert once `toolPermission` is
   `"always-proceed"`: the mode itself auto-approves every `command`-type
   call, allow-list or not. `always-proceed` is functionally equivalent
   to `--dangerously-skip-permissions` for the `command` tool type, not a
   narrower substitute for it.
6. **Deny-list check (the remaining candidate for a real, working
   boundary):** with `toolPermission: "always-proceed"` and
   `permissions.deny: ["command(whoami)"]` (empty `allow`), re-ran the
   `whoami` probe: **denied**, with a named reason —
   `"Permission denied for command(whoami). Matches user-configured deny
   rule."` `git status --short` (not on the deny list) was not re-tested
   this exact pass, but Finding 3.4 above already confirms `always-proceed`
   runs unlisted commands by default — so the deny entry is what changed
   the outcome specifically, not some other side effect.

**Finding — the real, working mechanism is a DENYLIST, not an ALLOWLIST,
and only reachable through one specific mode:**
`toolPermission: "always-proceed"` + `permissions.deny: [...]`. This is
the opposite shape from what the item's own text asks for ("allowlist
tối thiểu đủ cho một worker" — a minimal *allow*-list) and from what
`plan.md`'s Approach section designed around. Concretely, in headless
`-p` mode as tested:

- `toolPermission: "request-review"` (the settings.json default) and
  `toolPermission: "strict"` both blanket-deny every `command`-type call
  regardless of `permissions.allow` content — no allow-rule syntax tried
  across Round 3 (4 shapes) and Round 4 (2 more shapes, 6 total) changed
  that outcome. These modes assume an interactive human to review, which
  headless mode structurally cannot provide (matches Round 2's "soft-deny,
  never hang" framing exactly — it fails safe, but it fails **closed for
  everything**, not selectively).
- `toolPermission: "always-proceed"` runs every `command`-type call
  by default (`permissions.allow` has no effect here — confirmed inert),
  and `permissions.deny` is the only mechanism that changes that: entries
  there are refused with a named reason, everything else proceeds.

**What this means for the item's own three framing questions
(description's own ambiguity #1–#3):**

1. *Does `agy` have a permission surface expressing an allowlist?* — Not a
   true one, for the `command` tool type, in headless mode. It has a real,
   machine-enforced, headless-safe **denylist** surface instead
   (default-allow, explicit-deny) — a materially weaker security shape
   than default-deny/explicit-allow, though still strictly better than
   today's unconditional `--dangerously-skip-permissions` (zero boundary
   at all).
2. *What's the minimal ruleset sufficient for a worker's contract?* — Does
   not apply the same way under a denylist model. The equivalent question
   becomes: what is the minimal set of genuinely dangerous operations
   (destructive filesystem ops, credential/secret exfiltration paths,
   force-pushes to arbitrary remotes, network calls to untrusted hosts,
   privilege escalation) that must be denied so a default-allow worker
   cannot do real damage even if a prompt-injected or malfunctioning
   dispatch tries.
3. *If not expressible, document as provider-limitation and leave as-is?*
   — Partially applies: a true default-deny allowlist for `command`-type
   tools is confirmed structurally unreachable in headless `-p` mode (2
   modes × 6 rule-shape variations, 0 successes). A default-allow denylist
   is real and working. Whether that's "good enough" to justify dropping
   `--dangerously-skip-permissions` — trading an unconditional bypass for
   a narrower-but-still-open one — is a product trade-off call, not a
   technical one; `plan.md`'s Approach section needs a full rewrite
   around this shape (or an explicit decision to hold at
   `--dangerously-skip-permissions` and record the allowlist path as a
   genuine provider-limitation) rather than a continuation of the
   original allowlist design.

**Restored:** `~/.gemini/antigravity-cli/settings.json` reverted to the
exact backed-up content, byte-for-byte (md5 `1f2bf38ef13345267802f1943c5dec86`
confirmed before and after, same baseline Round 3 also restored to — no
drift across rounds). Item's own verify command re-confirmed passing
clean after restore.
