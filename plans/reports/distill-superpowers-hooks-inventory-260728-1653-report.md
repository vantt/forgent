# superpowers/hooks — raw mechanical inventory

Source: `/home/vantt/projects/forgentX/upstreams/superpowers/hooks/` (cloned copy of https://github.com/obra/superpowers)
Also inspected: `/home/vantt/projects/forgentX/upstreams/superpowers/.pre-commit-config.yaml`

All files under `hooks/` were read in full (4 files, no subdirectories):

```
hooks/hooks-cursor.json   (137B)
hooks/hooks.json          (334B)
hooks/run-hook.cmd        (1.4K)
hooks/session-start       (2.2K)
```

`.pre-commit-config.yaml` (579B) was also read in full. No files were unreadable — everything above was fully accessible.

---

### session-start-context-injection
- **What:** Registers a `SessionStart` hook (Claude Code) / `sessionStart` hook (Cursor) that fires on session `startup|clear|compact`. On firing, it reads the full text of `skills/using-superpowers/SKILL.md` from the plugin root and injects it back into the conversation as additional context, wrapped in an `<EXTREMELY_IMPORTANT>` tag with the literal line "You have superpowers." This is a pure context-injection hook — it never blocks a tool call, it just guarantees the "how to use skills" bootstrap content is present in every fresh/cleared/compacted session without the user or agent having to ask for it.
- **Where:**
  - `hooks/hooks.json` (Claude Code plugin hook registration)
  - `hooks/hooks-cursor.json` (Cursor plugin hook registration)
  - `hooks/run-hook.cmd` (cross-platform dispatcher invoked by both registrations)
  - `hooks/session-start` (the actual bash script that builds and emits the JSON payload)
- **Notable:**
  - Registration matcher in `hooks.json` is `"matcher": "startup|clear|compact"` — i.e. it deliberately re-injects on `/clear` and auto-compact, not just process start, so the "you have superpowers" framing survives context resets.
  - `run-hook.cmd` is a **polyglot** file: the first ~40 lines are a `: << 'CMDBLOCK' ... CMDBLOCK` bash here-doc that Windows `cmd.exe` reads as batch (finds Git-for-Windows bash at two hardcoded paths, falls back to `bash` on `PATH`, or exits `0` silently if no bash is found — "plugin still works, just without SessionStart context injection"); the remaining lines after the here-doc terminator are what Unix shells actually execute (`: ` is a no-op in bash, so bash skips straight past the batch block to `exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"`). Comment explains hook scripts are deliberately named without a `.sh` extension because Claude Code's Windows auto-detection prepends `bash` to any command containing `.sh`, which would double-invoke it.
  - `session-start` script builds its own JSON string manually via a hand-rolled `escape_for_json()` function (backslash → quote → `\n` → `\r` → `\t` substitutions using bash `${s//old/new}` parameter expansion, commented as "orders of magnitude faster" than a char-by-char loop) rather than shelling out to `jq`, keeping the plugin dependency-free.
  - **Multi-harness output-format branching** is the core mechanism: the script detects which agent runtime it's running under via env vars and emits a *different JSON shape* per harness, because "Claude Code reads BOTH additional_context and hookSpecificOutput without deduplication, so we must emit only the field the current platform consumes":
    - Cursor (`CURSOR_PLUGIN_ROOT` set) → `{"additional_context": "..."}`  (snake_case, top-level)
    - Claude Code (`CLAUDE_PLUGIN_ROOT` set, `COPILOT_CLI` unset) → `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}` (nested)
    - Copilot CLI (`COPILOT_CLI` set) or unknown platform → `{"additionalContext": "..."}` (SDK-standard top-level)
  - Output is written via `printf ... | cat` rather than a heredoc, with an inline comment citing a bash 5.3+ heredoc-hang bug (linked issue: `github.com/obra/superpowers/issues/571`).
  - `set -euo pipefail` at the top of `session-start`; script always ends `exit 0` regardless of whether the SKILL.md read succeeded (read failure is swallowed into the injected text itself: `cat ... 2>&1 || echo "Error reading using-superpowers skill"`) — so a missing skill file degrades to a visible error message inside the injected context rather than crashing the hook or blocking the session.
  - This is a **context-injection-only** hook family — no PreToolUse/PostToolUse gating, no allow/deny decisions, no tool-call interception anywhere in `hooks/`. The entire enforcement model for "use skills" in this plugin rests on this SessionStart injection nudging the agent, not on a hard gate.
- **Keywords:** SessionStart, sessionStart, hookSpecificOutput, additionalContext, additional_context, CLAUDE_PLUGIN_ROOT, CURSOR_PLUGIN_ROOT, COPILOT_CLI, polyglot script, `run-hook.cmd`, using-superpowers, EXTREMELY_IMPORTANT, bootstrap injection, cross-harness hook.

---

### pre-commit-evals-lint-gate
- **What:** `.pre-commit-config.yaml` defines three `repo: local` pre-commit hooks, all scoped to `files: ^evals/.*\.py$` (only fire on Python files under an `evals/` directory):
  1. `evals-ruff-check` — `uv --project evals run ruff check` (lint)
  2. `evals-ruff-format-check` — `uv --project evals run ruff format --check` (format verification, no auto-fix)
  3. `evals-ty-check` — `uv --directory evals run ty check`, with `pass_filenames: false` (type check, runs on the whole `evals` project rather than per-changed-file)
- **Where:** `/home/vantt/projects/forgentX/upstreams/superpowers/.pre-commit-config.yaml`
- **Notable:**
  - All three hooks use `language: system`, meaning pre-commit does not manage an isolated environment for them — they shell out directly to the `uv` binary already on the developer's `PATH`, invoking `uv`'s project/directory flags to run tooling scoped to a separate `evals/` sub-project (a Python eval harness, per the repo's `CLAUDE.md`, cloned from `superpowers-evals` and used to drive tmux-based agent sessions for skill-compliance judging — this repo clone does not currently contain that `evals/` directory, so its contents could not be inspected: `ls evals` returned "No such file or directory").
  - This is a lint/format/type **commit gate**, not a runtime agent-behavior hook — it has no relationship to the `hooks/` SessionStart mechanism above; it only fires locally on `git commit` for staged files matching the path regex, via whatever pre-commit framework the contributor has installed.
  - No `scripts/` directory is referenced anywhere in this config — all three entries call `uv` directly with inline arguments, no wrapper scripts to trace.
- **Keywords:** pre-commit, repo: local, language: system, ruff check, ruff format --check, ty check, uv --project, uv --directory, pass_filenames, evals/.

---

## Unresolved / notes
- `evals/` directory referenced by `.pre-commit-config.yaml` and by the project `CLAUDE.md` (eval harness cloned from `superpowers-evals`) does not exist in this local clone, so its lint/type-check targets could not be directly inspected — description above is based on the config file and the project's own `CLAUDE.md` description, not direct inspection of `evals/` source.
- No other hook mechanisms exist under `hooks/` — the directory contains exactly one hook family (SessionStart context injection) expressed across a Claude Code JSON registration, a Cursor JSON registration, a shared polyglot dispatcher, and one bash payload-builder script.

Status: DONE
Covered 2 hook mechanisms total: 1 SessionStart context-injection hook (spanning 4 files under `hooks/`) and 1 pre-commit lint/format/type-check gate (`.pre-commit-config.yaml`, 3 hook entries).
