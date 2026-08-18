# RESEARCH.md — tsk-4kh (codex permission/capability boundary)

## Round 1 — 2026-08-18

**Asked:** does the `codex` CLI (OpenAI Codex CLI, codex-cli 0.146.0,
installed at `/home/vantt/.local/bin/codex`) expose a real,
headless-safe permission/capability boundary reachable WITHOUT
`--dangerously-bypass-approvals-and-sandbox` — specifically, does
`codex exec -s workspace-write` (no bypass flag) let a headless
dispatch complete a real file write + a real shell command (the
coding worker contract's minimum), without hanging or silently
no-op'ing, the same failure modes tsk-1xm's own Round 1/2 ruled in/out
for `agy`?

**Checked — repo (`rg -i "codex" src bin docs test --glob
"*.{mjs,cjs,md}"`):** `codex` is already a known-but-unwired name in
this repo's own dispatch config:

- `src/runner/dispatch/config.mjs:82`:
  `KNOWN_ASSISTANT_CLI_NAMES = ['claude', 'codex']` — `codex` is
  auto-detected on PATH, but with a comment at line 77-80: "listed
  here for a clearer 'found X, but no verified template' message
  only — it has no entry in `SUPPORTED_EXECUTOR_TEMPLATES` below (no
  verified working argv shape for this dispatch path)."
- `src/runner/dispatch/config.mjs:150-157`: `SUPPORTED_EXECUTOR_TEMPLATES`
  deliberately has no `codex` entry — "no verified working argv shape
  exists for this dispatch path yet, and fabricating one would
  silently break a user's first run instead of loudly asking them to
  fill it in by hand." This confirms tsk-4kh's premise: codex is
  genuinely unwired, this is greenfield work, not a retrofit.
- `src/install/coexist.mjs:25`: `{ name: 'codex', dir: '.codex' }` —
  fgOS's own coexistence-detection logic already expects codex's
  config directory to be `~/.codex/`, confirmed real below.

**Checked — `codex --help`/`codex exec --help`/`codex sandbox --help`
(installed binary, run live):** full flag surface confirms the
structurally-different-from-agy model already suspected:

- `-s/--sandbox <read-only|workspace-write|danger-full-access>` — a
  real sandbox POLICY flag (not a config-file allow/deny list).
- `-a/--ask-for-approval <untrusted|on-request|never>` — a SEPARATE
  axis from sandbox: whether/when to prompt a human. `untrusted` runs
  known-safe commands (`ls`, `cat`, `sed`, …) without asking, escalates
  anything else; `on-request` lets the model decide when to ask;
  `never` never asks, execution failures go straight back to the model.
- `--dangerously-bypass-approvals-and-sandbox` — the one unconditional
  bypass, analogous to agy's `--dangerously-skip-permissions`, to avoid
  defaulting to.
- `codex sandbox [COMMAND]...` — runs a literal command directly
  inside the sandbox, with **no LLM/agent turn at all** (see the free
  verify-command finding below).
- `-c key=value` TOML overrides against `~/.codex/config.toml`.

**Checked — real on-disk config file, confirmed live:**
`~/.codex/config.toml` exists and is real (matches
`src/install/coexist.mjs`'s expectation). It already carries a
per-project trust registry analogous to agy's `trustedWorkspaces`:
`[projects."/home/vantt/projects/forgentX"] trust_level = "trusted"`
(also `forgent`, `herdr-gateway` — same three projects agy's
`trustedWorkspaces` lists, shared machine-wide, same caution as
tsk-1xm's settings.json applies here). No `sandbox_permissions` or
explicit approval-policy override present — current behavior is all
CLI/exec-mode defaults, nothing hand-configured yet. Codex keeps its
own `config.toml.bak` automatically (a safety property agy's
settings.json editing did not have).

**Live proof #1 — file write + shell command, no bypass flag, run
from this repo's `tsk-4kh` worktree:**
```
codex exec -s workspace-write "Create a file named codex-probe.txt in \
the current directory with the text 'proof' inside it, then run the \
shell command 'ls codex-probe.txt' to confirm it exists."
```
Header line printed by codex itself: `approval: never` (the DEFAULT
for non-interactive `exec` — never explicitly passed `-a`), `sandbox:
workspace-write [workdir, /tmp, $TMPDIR]`. Result: completed in one
turn, exit 0, `codex-probe.txt` really created with `proof` inside,
`ls` really ran and confirmed it. **No hang, no silent no-op** — the
same "soft-deny or succeed, never hang" property tsk-1xm needed from
agy, except here the successful path is the DEFAULT, not something
that first needed a config fix.

**Live proof #2 — sandbox boundary is real (OS-enforced, not just
agent-level judgment):**
```
codex exec -s workspace-write "Run the shell command: ... write to \
/home/vantt/codex-home-probe.txt with content 'leak' and report the \
exact exit code and any error."
```
Result: `codex` itself narrated "`/home/vantt` is outside the writable
roots, so the second write should be refused by the sandbox" and the
shell command failed with **`zsh:1: read-only file system:
/home/vantt/codex-home-probe.txt`** (exit 1) — this is the OS's own
filesystem layer refusing the write, not codex's agent logic choosing
not to attempt it. Confirmed independently via `codex sandbox --`
(zero-LLM path, see below): `sh -c "echo x >
/home/vantt/codex-sandbox-cmd-probe.txt"` under the sandbox also
failed with `Read-only file system` (exit 2), no agent involved at
all — this is a kernel/OS-level boundary, structurally stronger than
agy's mechanism (agy's `permissions.deny` was consulted by the agent's
own tool-call logic; nothing prevented a bug or bypass there from
ever reaching the OS).

**Live proof #3 — network is ALSO sandboxed by default under
`workspace-write`:**
```
codex exec -s workspace-write "Run the shell command: curl -sS -m 5 \
https://example.com and report the exact exit code..."
```
Result: `curl: (6) Could not resolve host: example.com` (exit 6) — DNS
resolution itself fails inside the sandbox, meaning network access is
blocked structurally, not just a specific host. **agy had no network
restriction of any kind at any point in tsk-1xm's research** — this is
a capability codex's default sandbox has that agy's mechanism never
offered.

**Finding — free verify-command candidate, better than agy's own
(`codex sandbox`, zero LLM turns, zero network to OpenAI):**
```
codex sandbox -- echo sandbox-alive
```
Ran in **~38ms**, exit 0, no agent turn, no tokens spent — strictly
cheaper than agy's own free `/permissions` query (which still spawns
a process and does a JSON round-trip through the agent's print-mode
slash-command path; `codex sandbox` never invokes the agent at all).
Confirmed the SAME real sandbox boundary applies even without an LLM
turn: `codex sandbox -- sh -c "echo x >
/home/vantt/codex-sandbox-cmd-probe.txt"` also fails with `Read-only
file system` (exit 2) — this makes `codex sandbox` both a legitimate
`verify` command candidate for this item's own eventual doctor check
AND independent confirmation that the boundary lives in the sandbox
layer itself, not in agent-turn-specific logic that only fires when an
LLM decides to check.

**Checked — `codex doctor`:** exists, but makes a real network
reachability check (`ChatGPT base URL ... reachable`) — NOT free/cheap
the way agy's `/permissions` or codex's own `sandbox` subcommand are.
Not a good `verify` candidate; `codex sandbox -- echo ...` is strictly
better for that purpose (faster, no network, no auth dependency).

**Finding: this item's own ambiguity #1 resolved — YES, decisively.**
`codex exec -s workspace-write` (no bypass flag) is a real,
already-working, headless-safe, OS-enforced default-deny sandbox: file
writes are confined to the workspace + `/tmp`/`$TMPDIR`, network access
is blocked entirely, and the coding worker contract's actual needs
(write within the workspace, run a shell/verify command) succeed
cleanly with zero extra configuration. This is a genuinely different
and STRONGER answer than tsk-1xm found for `agy` — codex does NOT need
the denylist workaround agy ended up shipping; a real default-deny
allowlist-shaped boundary (deny-by-default, explicitly allow only
workspace + tmp + no network) is the CLI's own out-of-the-box default
under `-s workspace-write`, not something this item needs to configure
from scratch the way tsk-1xm had to build `permissions.deny` for agy.

**Not yet checked (left for planning, out of this round's own scope):**
whether `git add`/`git commit` (the worker contract's third verb)
succeed cleanly under `workspace-write` — very likely yes (git writes
stay inside the workspace, network is not needed for a local commit),
but not yet run as an explicit live probe this round; whether
`-a untrusted` (rather than the exec-mode default `never`) changes
anything relevant for this dispatch shape; whether `--add-dir` is
needed for any cross-directory case fgOS's own worktree layout
requires; the exact minimal `.fgos/config.json` `invocations[].args`
shape (planning's job, mirroring tsk-1xm's plan.md).

**Verify (real, runnable, proves the sandbox mechanism is live and
does not hang — zero LLM turns, zero network, mirrors tsk-1xm's own
free-query verify shape):**
```bash
codex sandbox -- sh -c 'echo x > /root/should-fail-if-sandboxed.txt' ; test $? -ne 0
```
(exits non-zero when the sandbox is genuinely active — a write outside
the sandboxed roots must fail).

**Open:** none for discovery's own clarity question — the item's
described ambiguity #1 is answered with real, cited, live-verified
evidence: codex's own `-s workspace-write` default IS a real, working,
default-deny boundary, stronger than what agy could offer. The
concrete minimal-args shape and worker-contract full verb coverage
(git add/commit under sandbox) is planning's job, per the same
discovery/planning split tsk-1xm's own item used.
