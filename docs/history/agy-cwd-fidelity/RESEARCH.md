# RESEARCH: tsk-it0 — agy ignores spawn cwd

## Round 1 — 2026-08-17T07:34Z

**Asked:** does `EXECUTOR_ADAPTERS.cli-spawn` (`src/runner/dispatch.mjs`) fail
to pass/respect `cwd` when spawning `agy`, or does the `agy` binary itself
ignore the `cwd` it was spawned with?

**Checked — repo, `src/runner/dispatch.mjs`:**
- `cliSpawnAdapter` (`src/runner/dispatch.mjs:1481-1486`): reads
  `{ cwd, timeoutMs, maxBuffer, onChunk, workId, tier, model }` from `opts`
  and calls `spawn(command, args, { cwd, shell: false })` directly — `cwd`
  is passed through unmodified to Node's `child_process.spawn`.
- `spawnWorker` (`src/runner/dispatch.mjs:1693-1770`): takes `cwd` as its
  3rd positional argument and forwards it straight into `adapterFn({ command,
  args }, { cwd, timeoutMs, maxBuffer, ... })` (`dispatch.mjs:1749-1756`) —
  no transformation, no fallback, no alternate cwd source.
- Verdict on this half: **the adapter and `spawnWorker` are correct.** `cwd`
  is threaded through faithfully from caller to `child_process.spawn`'s own
  `cwd` option, exactly per Node's documented `spawn(command, args, options)`
  contract.

**Checked — `.fgos/config.json` `runner.executors.agy`:**
```json
{
  "kind": "agent",
  "invocations": [{
    "via": "cli", "adapter": "cli-spawn", "command": "agy",
    "args": ["-p", "{prompt}", "--dangerously-skip-permissions", "--model", "{model}"]
  }]
}
```
No `--project`/`--new-project`/`--add-dir` flag is configured — only
`-p`/`--dangerously-skip-permissions`/`--model`.

**Checked — `agy --help` (v1.1.13):** relevant flags —
`--continue`/`-c` ("Continue the most recent conversation"), `--conversation`
("Resume a previous conversation by ID"), `--project` ("Project ID for the
current CLI session"), `--new-project` ("Create a new project for this
session"), `--add-dir` ("Add a directory to the workspace"). This vocabulary
implies `agy` tracks an internal "current project"/"most recent conversation"
concept, separate from — and not automatically synced to — the OS process
`cwd` it was spawned with.

**Live repro (direct, not through the adapter — isolates the binary):**
```bash
cd /tmp/agy-repro-a && agy -p "Run pwd — reply with ONLY that output." \
  --dangerously-skip-permissions --effort low
# → /home/vantt/.gemini/antigravity-cli/scratch   (WRONG: spawned from /tmp/agy-repro-a)

cd /tmp/agy-repro-b && agy -p "Run pwd — reply with ONLY that output." \
  --dangerously-skip-permissions --effort low --new-project
# → /tmp/agy-repro-b   (CORRECT: matches the actual spawn cwd)
```

**Finding:** `agy`, invoked in print mode (`-p`) WITHOUT `--new-project`,
does not operate in the process's actual `cwd` — it resumes/continues its
own internally-tracked "current project" (observed default: an internal
scratch dir, `~/.gemini/antigravity-cli/scratch`; in the original incident,
apparently a stale prior project pointing at `fgw/tsk-1lv`'s worktree),
regardless of what `cwd` the OS process was spawned with. Adding
`--new-project` to the invocation forces `agy` to operate in the actual
spawn `cwd`, confirmed by direct repro.

**Root cause: the `agy` binary itself, not the `cli-spawn` adapter.** The
adapter/`spawnWorker` pass `cwd` correctly per Node's own `spawn()` contract;
`agy` simply does not consult `cwd` for its own workspace resolution unless
told to start fresh via `--new-project`.

**Open:** none — this fully resolves the discovery question. The fix is
config-only: add `"--new-project"` to `runner.executors.agy.invocations[0].args`
in `.fgos/config.json`.

**Verify:** re-run the two live repro commands above (or their equivalent
through `spawnWorker`) — with `--new-project` present, `agy`'s reported `pwd`
must equal the `cwd` it was spawned with, in two independently-named temp
dirs run back-to-back (proving no cross-invocation state leak).
