# RESEARCH.md — tsk-3tkc: wire codex CLI as an executor via bypass-all

## Round 1 — 2026-08-18 (discovery, tsk-3tkc)

**Asked:** four live facts needed to judge this item clear/unclear and to
size `tier`/`kind`/`risk`, carrying forward tsk-4kh's already-complete
research (`docs/history/codex-permission-capability-boundary/RESEARCH.md`
+ `plan.md`, unmerged branch `fgw/tsk-4kh`, all 4 rounds). tsk-4kh proved
`-s workspace-write` (real OS sandbox) blocks `git commit` in this repo
because `.githooks/pre-commit` is a Node script that spawns a nested `git`
subprocess (EPERM under sandbox), and separately live-tested that
`--dangerously-bypass-approvals-and-sandbox` lets the full worker contract
(write, `git add`, `git commit`) succeed end to end (tsk-4kh Round 4). This
item exists because the user, after reviewing that record in this same
session, explicitly chose to accept the bypass-all trade-off rather than
leave `codex` unwired — reversing tsk-4kh's Round 3/4 "keep wontfix"
decision.

1. **`agy`'s executor entry shape (`.fgos/config.json`, current main),
   the template to mirror:**
   ```json
   "agy": {
     "kind": "agent",
     "description": "Antigravity Cli",
     "allowCrossProvider": true,
     "invocations": [{
       "via": "cli", "adapter": "cli-spawn", "command": "agy",
       "args": ["-p", "{prompt}", "--mode", "accept-edits",
                "--new-project", "--print-timeout", "10m",
                "--model", "{model}"]
     }],
     "providerModel": "gemini",
     "rigorOverrides": { "light": "lightweight", "standard": "lightweight", "heavy": "lightweight" }
   }
   ```
   `codex`'s own entry mirrors this shape: `command: "codex"`, args built
   from `exec --dangerously-bypass-approvals-and-sandbox "{prompt}"` (no
   `-s`/sandbox flag needed once bypass is unconditional — tsk-4kh Round 1
   confirmed `-a never` is already `codex exec`'s own headless default, no
   flag needed to reach it).

2. **`runner.modelPolicies` today** has `claude` (5-tier: lightweight/
   standard/creative/analytical/critical) and `gemini` (`lightweight` only,
   the one tier `agy`'s own `rigorOverrides` ever asks for). No `openai`
   entry exists. Whether a new `openai` entry is needed depends on whether
   the concrete invocation passes `--model {model}` at all — `codex --help`
   (tsk-4kh Round 1) never showed a required-model flag the way `agy`'s `-p
   ... --model {model}` shape does; `codex exec` may run against whatever
   model `~/.codex/config.toml`/the account already defaults to with no
   flag passed. **Left open for planning** (this is an invocation-shape
   decision, not a discovery blocker — the fallback of "no `--model` flag,
   no new `modelPolicies` entry" is a legitimate, simpler answer planning
   can just choose).

3. **`.githooks/pre-commit`'s nested subprocess spawn — still present,
   unchanged, confirmed live on current `main`.** `execFileSync('git',
   ['rev-parse', '--path-format=absolute', '--show-toplevel'], ...)` still
   sits at `.githooks/pre-commit:227` (the exact line tsk-4kh's Round 2
   `EPERM` trace cited), alongside two more `execFileSync('git', ['rev-
   parse', ...])` calls at lines 148-149 and 201. tsk-4kh's finding is
   current, not stale — same trigger, same repo shape.

4. **`SUPPORTED_EXECUTOR_TEMPLATES` (`src/runner/dispatch/config.mjs:159`)
   — still `{ claude: DEFAULT_RUNNER_CONFIG.executor }` only, no `codex`
   entry, confirmed live on current `main`.** The file's own comment
   (line 154) still reads "deliberately no `codex` (or other) entry: no
   verified working argv shape" — that premise is now stale for THIS
   item's own scope (a verified bypass-all shape exists, tsk-4kh Round 4),
   but whether to also register a bootstrap template for OTHER projects
   auto-detecting `codex` on PATH is a separate scope decision (tsk-4kh's
   own plan.md treated it as a "light" risk, additive-only addition) —
   **left to planning**, not required to judge this item's own core goal
   (wiring `codex` as this repo's own dispatch executor) clear.

**Verdict: clear.** The core goal — add a `codex` executor entry to THIS
repo's `.fgos/config.json` using the bypass-all invocation shape tsk-4kh
already live-proved — has no remaining ambiguity: the config template to
mirror is confirmed (point 1), the blocking mechanism the bypass exists to
route around is confirmed still real (point 3), and the two remaining
open questions (points 2, 4) are invocation-shape/scope decisions with a
legitimate default answer each, properly planning's job, not a gap that
blocks moving forward.

**Verify (smoke test for the wired executor):**
```
codex exec --dangerously-bypass-approvals-and-sandbox "Run: echo codex-bypass-smoke-test. Then run: git rev-parse --show-toplevel." ; test $? -eq 0
```
Confirms the exact worker-contract shape tsk-4kh Round 4 already live-
tested (a directly-invoked shell command plus a nested `git` subprocess
call, unsandboxed) still succeeds, without repeating the full sandbox-vs-
bypass comparison tsk-4kh's own Rounds 1-2 already settled.
