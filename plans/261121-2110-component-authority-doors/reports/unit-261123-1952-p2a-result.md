# Phase 2a result — BLOCKED at step 3 (nothing changed)

Owner answer q-bioobcr52m widened the scope by six files. Step 3 of the phase says to confirm first that `fgos wire-agents`
can target the confined workspace, and to stop with BLOCKED, naming the option, if that needs a new flag. It cannot, so no file
was changed except this report.

## What `fgos wire-agents` does (read from source, nothing run)
- `apps/fgos/src/wiring/wire_agents.rs` is the verb for a person's own global agent config. Its plan is
  `plan_agent_wiring(project, env, home, runner)` (`packages/distribution/rust/src/agent_config.rs:772`). It reads only
  `claude` (a `claude plugin ...` step run through the process runner) and `agy` (settings under `$HOME`).
- Its request has three fields: `project`, `apply` (`--yes`) and `json` (`wire_agents.rs:48-56`). `project` is the main
  checkout of the caller's directory and is used only to read the mailbox opt-in. The shared door takes `--dir` and never acts on it.
- It never writes the project hook rows of Claude Code (`.claude/settings.json`), Codex (`.codex/hooks.json`), omp or pi
  (`.<cli>/extensions/fgos-hooks.ts`). It has no pi, omp or codex path at all.
- `invokeHost` (`src/util/host-bin.mjs`) adds `--dir <dir>` and may set the child's `cwd`. Neither changes what the verb installs.

So `scripts/lib/mailbox-live-confined.mjs` `installRunRows` (installClaudeHook / installCodexHook / installOmpHook /
installPiHook into `paths.ws`) and the two live scripts have no `wire-agents` equivalent.

## Option to unblock (decision for the owner; no flag was added)
The Rust door that does write those four hook files into a project directory is the registered doctor fix of the rows
`claude-hook-wired`, `codex-hook-wired`, `omp-hook-wired` and `pi-hook-wired`
(`apps/fgos/src/wiring/doctor/packaging.rs:244 agent_hook_fix` -> `fgos_distribution::agent_hooks::install_hook`).
Options:
1. **Re-point to the doctor fix** through `invokeHost` (`fgos doctor --fix <row>`, aimed at the workspace with `dir`). This needs
   no new flag if `fgos doctor` already accepts a fix by row id and a project `--dir`; I did not run it to confirm. It
   replaces the instruction "use wire-agents" and needs the owner's word, because the order named wire-agents.
2. **Add a project-hooks target to `wire-agents`** (for example `--project-hooks <cli>`): a new flag, so not mine to add.
3. **Add a dedicated `fgos` verb or an `install_hook` binding** for harnesses: a new surface.

Recommendation: option 1, if a dry run shows `fgos doctor --fix claude-hook-wired --dir <ws>` writes the same rows as the Node
`installClaudeHook` (the confined module already deletes `PreToolUse` after the install, so that post-step stays).

## Still true from the first run
Live importers of `src/setup/agent-hooks.mjs` outside the original scope: `test/live/mailbox-claude.live.mjs:79` (+ `:576`
`checkClaudeHook`), `test/live/mailbox-behaviour.live.mjs:70`. The scope now covers both. `mailbox-claude.live.mjs:576` uses
`checkClaudeHook`, which also needs a survivor path (`fgos doctor` row `claude-hook-wired` reads it).
Other names of the file (all in the widened scope): `test/architecture.test.mjs:2142`, the door rows
`retired-node-s5-hook-script.yaml`, `writer-and-session-id-environment.yaml`, `delete-guard-keyword-list.yaml`.
Docs for phase 11: `docs/platform/agent-mailbox/spec.md`, `docs/platform/packaging-distribution/spec.md`, `docs/reading-map.md`.

## Retired or narrowed (none done yet; plan for when unblocked)
Last SHA touching `src/setup/agent-hooks.mjs`: 871a7707493947636691a5ad6cd050c8180a51d1. Addenda v7e, v7h, v7i, v7j (retire),
v7k, v7m, v7n (retire or re-point), the matching `test/scripts/mailbox-behaviour-v7{e,h,i,j}.test.mjs` freeze cases, and
`test/setup/agent-hooks.test.mjs` are untouched, so no per-file last SHA is listed. Mailbox re-measurement owner: backlog `p-irt4weqipe`.

## Not run
No cargo, node or fgos command was run; only `rg`, `sed` and `git` reads.

Status: BLOCKED
Summary: `fgos wire-agents` plans a person's global agent config and cannot install a workspace's hook rows; no change made.
Concerns/Blockers: owner to choose option 1 (doctor fix `claude-hook-wired` etc. via invokeHost), 2 (new wire-agents flag) or 3 (new verb).
