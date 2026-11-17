# Research: agent session handoff / rotation (prior art + Claude Code mechanics)

Date 2026-11-17. Read-only. Evidence tags: [V] verified by me (doc fetched / local file / local run), [S] secondary source (blog/directory), [U] unverified.

## 1. Local prior art: ak-handoff

Path: `.agents/skills/ak-handoff/SKILL.md` (v2.1.1, read fully) + `references/{artifact-schema,capture-scenarios,redaction-patterns,dispatch-*}.md` [V].

- Trigger: manual only (`/ak-handoff [focus] [--output] [--include-diff] [--include-status] [--force] [--dispatch --agent X]`).
- Writer: the model, in-session. Output `plans/handoffs/<slug>-<YYYYMMDD-HHmm>.md`, redacted (regex catalog), collision guard (`--force`).
- 9 fixed H2 sections: Mission+status, Scope+guardrails, Current state (branch/HEAD/status from git probes), Decisions+rationale, Work performed, Verification, Open risks/blockers, Exact next actions (first = `**First safe step**`), Source pointers. Empty -> literal `Not captured in this session`. Optional frontmatter `handoff-version: 1`.
- Load: prints one line `Read <path> and verify the Current state section against the repo before acting.` User pastes into new session. `--dispatch` instead builds an orchestrate job spec (worktree isolation, approval:require) and launches another runtime; schema validated first.
- Never launches runtime in capture mode; never dumps transcript/CoT.
- Fit for us: schema is coding-task-shaped (git state, verification, diff). 9 sections is too heavy for a secretary whose state lives in repo files. Reusable parts: redaction, "verify before acting", "Not captured" literal, collision guard, one-line resume instruction.
- Upstream: `davidondrej/skills`, pinned commit `ce70edaa…` exists (message "Publish sanitized skills snapshot", 2026-07-06), file at that commit = `skills/agent-orchestration/handoff/SKILL.md` (tree API) [V]. Repo license MIT per GitHub API [V]; local LICENSE.txt = MIT, (c) 2026 David Ondrej [V]. Raw file fetch at the pinned sha returned 404 (raw URL quirk); current `main` path is `skills/handoff/SKILL.md` and I read it [V]: `disable-model-invocation: true`, 6 principles (describe state not actions; link artifacts not copy; preserve why; require verification; redact; keep only non-recoverable context), 7+ section template: Goal, Why/Background, Current State (DONE/PARTIAL/NOT STARTED), Key Decisions, Traps & Dead Ends, Relevant Files & Pointers, Open Work (status, not commands). Procedure: read AGENTS.md first, update prior handoff instead of rewriting, args = next focus. Output in one code block + file save.
- Contrast: upstream says "describe state, not actions"; ak-handoff rewrote to "Exact next actions". For a secretary with a pending owner question, state-description is the safer wording (a verbatim question is state).

## 2-3. Methods by tool

### Amp (Sourcegraph) - handoff, now removed
- Introduced 2025-10-23 to replace compaction ("lossy", encourages stacking summaries) [S: tessl/havoptic; V: https://ampcode.com/news/handoff said by fetch: "Instead of summarizing a thread, you're extracting from it what matters for your next task"].
- Trigger: manual `/handoff <goal>` (CLI) or token-usage hover (editor). 2026-01-13: "ask the agent" (`Handoff and implement the plan`) https://ampcode.com/news/ask-to-handoff [V].
- Content: model generates (a) a starting prompt for the new thread, (b) list of relevant files; shown as editable draft; user sends. Goal-conditioned, not a full summary. No script writer; no threshold; no state-loss protection beyond user editing.
- Fate: handoff removed; "Amp, Rebuilt" 2026-05-06: "handoff is out. Compaction is in" (auto compaction) https://ampcode.com/news/neo [V]. Fork post (2026-01-13) carries update "we removed handoff" [V]. No reason given. Lesson: manual/goal-conditioned handoff was abandoned by its inventor for automatic compaction; but it targeted human-driven coding, not a long-lived resident agent.

### Claude Code built-ins [V unless noted, https://code.claude.com/docs/en/{commands,hooks,statusline,cli-reference,skills}]
- `/compact [instructions]` same session, summary; `/clear [name]` new empty conversation (old kept in `/resume`); `/resume`, `--continue`, `--resume <id|name|jsonl path>`; `/branch`, `/fork`; `/context`; `/recap`. No built-in `/handoff`.
- Hooks: `SessionStart` matcher `startup|resume|clear|compact|fork`; input has `source`, `agent_type` (set under `claude --agent <name>`), `model`; output `hookSpecificOutput.additionalContext` (cap 10,000 chars, wrapped in system-reminder), `initialUserMessage` (only `-p` mode), `sessionTitle`. `PreCompact` matcher `manual|auto`, exit 2 blocks compaction, stdout = instructions for summary. `Stop`: input `session_id, transcript_path, stop_hook_active, last_assistant_message, background_tasks, session_crons`; does not fire on user interrupt; API errors fire `StopFailure`. `SessionEnd`: cannot block, default timeout 1.5 s.
- Statusline JSON: `context_window.used_percentage`, `context_window_size`, `total_input_tokens`, `current_usage{input_tokens,cache_creation_input_tokens,cache_read_input_tokens,output_tokens}`. `used_percentage` = input + cache_creation + cache_read only (no output). `current_usage` null before first API call and after `/compact` until next call.
- Gap: Stop/SessionEnd payload has NO context metric. Feature requests anthropics/claude-code #54580 (expose context usage to hooks for autonomous handoff) closed NOT_PLANNED (stale-closed); #24320 (threshold hooks -> handoff at 70%) closed COMPLETED but a bot dup flag preceded it; what shipped is unclear [V via gh; shipped scope U]. Treat transcript/statusline as the only sources.

### Community Claude Code skills [S unless noted]
- `davidondrej/handoff`, `mattpocock/skills` handoff [V, MIT, 326k stars, raw file read]: ~10-line skill, `disable-model-invocation: true`, writes to `$TMPDIR` (not workspace), "suggested skills" section, do not duplicate specs/plans/ADRs/commits - reference by path, redact, args = next focus. Smallest viable handoff.
- `parcadei/Continuous-Claude-v3`: `/create_handoff` (compact YAML), `/resume_handoff`; PreCompact hook writes auto-handoff; SessionStart loads ledger + latest handoff; manual compact blocked [S, directory listings; repo not read; 90% figure is advice not code].
- `robertguss/claude-code-toolkit`: 7 slash commands to save/resume/switch workstreams across `/clear`, state in `.claude/handoffs/` [S]. `EveryInc/compound-engineering-plugin ce-handoff`: honors user destination, no managed-store copy unless asked [S]. `petekp/claude-code-setup`, `shrwnsan/handoff-context`, `claude-code-handoff` npm: various; one runs on every Stop to autosave [S]. One notes `/handoff auto` since `:` is plugin namespacing [S].
- Blogs: threshold ladders via statusline `used_percentage` (suggest /flush at 60, auto non-interactive flush at 85, dump >90) https://dev.to/ianlpaterson/stop-claude-code-from-lobotomizing-itself-mid-task-15fl [V fetched]. Others use transcript byte size as proxy and "NEVER auto-restart, only suggest" [S, search snippet].
- Common failure modes in these: handoff written too late (at 90%+ model quality already degraded, or hits auto-compact mid-write); model writes actions as facts; secrets in handoff; stale handoff overwritten silently; no one verifies the file loaded; PreCompact-only designs fire after the damage.

### Anthropic harness pattern (long-running agents) https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents [V]
- State in files, not chat: `claude-progress.txt`, JSON feature list (agent may only flip `passes`), `init.sh`, git commits. New session start ritual: pwd, read git log + progress, read feature list, run init/smoke test. Failure modes named: premature victory, messy handoffs, premature completion marks. This is closest to our "state in repo files" design: handoff = pointer + delta, truth in files.

### Cline
- `new_task` tool: model proposes, user approves, current task ends, new task preloaded with `<context>` block https://cline.bot/blog/unlocking-persistent-memory-how-clines-new_task-tool-eliminates-context-window-limitations [S]. `/newtask` manual; content = overall plan, work done, relevant files, next steps, excludes tool-call noise https://docs.cline.bot/features/slash-commands/new-task [V]. No automatic threshold by default; `.clinerules` can instruct "propose handoff at >50% context" (model self-monitors) [S]. `/smol` = in-place condense. Failure: relies on model noticing usage; approval gate blocks full autonomy.
- Kilo Code `/newtask` same idea; claims 1-3k tokens fresh start [S].

### OpenHands (condenser) https://docs.openhands.dev/sdk/arch/condenser [V]
- Auto, in-process: when event count > `max_size` (120) drop middle, keep `keep_first` (4) verbatim + LLM summary + recent tail; forced via `CondensationRequest` on context error. No new session; summary is the "handoff". Cheaper summarizer model allowed. Different category (compaction), shows head-pinned + tail-kept pattern, which maps to our "carry last assistant message verbatim".

### Codex CLI / Aider / Cursor
- Codex: `model_auto_compact_token_limit` in config.toml; auto-compaction in-session; blogs recommend ~60% of window and report mid-task context loss (openai/codex#4106) [S, thresholds unverified]. No handoff-to-new-session primitive found.
- Aider: `--max-chat-history-tokens` (default 8k) summarizes old turns in-process [S]; AiderDesk has a "handoff and compaction" doc (URL 404 on fetch, unread) [U].
- Cursor: not researched beyond directory hits; no evidence either way [U].

## 4. Claude Code mechanics for us

### 4a. Context usage from a Stop hook
- Transcript path available (`transcript_path`) [V]. Docs warn the file "is written asynchronously and may lag" and may not include the last message at Stop time [V: hooks doc]; use `last_assistant_message` for text.
- Which field [V locally, this session's JSONL]: entries `type:"assistant"` carry `message.usage{input_tokens,cache_creation_input_tokens,cache_read_input_tokens,output_tokens,…}`. Last main-chain assistant entry: 2 + 1709 + 126297 = 128,008 = context size (same formula as docs' `used_percentage`, input-only). Pitfalls seen locally: 19 of 27 assistant message ids appear on multiple lines (content blocks split) -> dedupe by `message.id`, take last; filter `isSidechain == true` (subagents); `usage` absent on some entries; after `/compact` no usage until next call.
- Denominator is NOT in the transcript: model id `claude-opus-5-5` has no window-size suffix [V locally]. Window (200k vs 1M) must come from statusline `context_window_size` or config. Recommended: statusline script (stdin has `used_percentage`, `context_window_size`, `session_id` [V]) writes a small sidecar file per session; Stop hook reads it, falls back to transcript sum / configured size. Whether the statusline has refreshed before Stop fires: [U] -> stamp sidecar with time, accept if fresh, else use transcript.
- Also use `last_assistant_message` + `background_tasks`/`session_crons` (empty = truly idle) as the "at rest" signal [V]. "At rest" semantic (no pending owner question) must come from our repo state files, not from the hook.
- `stop_hook_active` guard + 8-continuation cap exist [V]; a rotation hook should not use `decision:block` at all (that continues the turn).

### 4b. Replacing the claude process in a pane
- No documented hook/CLI primitive to terminate or restart a session: hooks are side-effect scripts; SessionEnd cannot block, 1.5 s timeout; `continue:false` ends the turn, not the process [V hooks doc]. #57306 "warm-reset primitive" snippet says the same [S, issue site unreachable]. I found no tested public example of an auto-rotating claude in a terminal pane [searched; absence not proof].
- herdr CLI on this machine [V, `herdr --help`]: `pane split|close|run|send-text|send-keys|wait-output|read`, `agent start <NAME> --kind claude --pane <ID> [-- AGENT_ARG…]` (pane must be at an interactive shell prompt), `agent prompt`, `agent wait`. So:
  1. new+close: hook (or supervisor) does `pane split` -> `agent start secretary --kind claude --pane NEW -- --agent secretary "<resume prompt>"` (`claude "query"` starts with an initial prompt [V cli-reference]) -> verify new agent ready -> `pane close OLD`. Safest: old session stays alive until new one is confirmed; failure leaves old running.
  2. in-place: pane runs a wrapper loop `while :; do claude --agent secretary "$(resume prompt)"; [ -e rotate.flag ] || break; rm rotate.flag; done`; hook writes flag then asks claude to exit (`herdr agent send-keys`/`send-text "/exit"` once idle; `kill -TERM $PPID` is [U], hook parent identity not verified). Riskier: if the loop dies the pane is a dead shell; exit during an unfinished write loses state.
  3. same-process variant (not requested, worth costing): `herdr pane send-text "/clear"` after Stop, then `SessionStart` hook with `source:"clear"` (and `agent_type:"secretary"`) injects the handoff via `additionalContext` (10k cap) [V doc semantics; end-to-end send-text timing U]. No process replacement, `/resume` keeps the old conversation. Weakness: same process, same env, accumulating process memory; `/clear` keeps the Stop hook/statusline wiring, which is a plus.
- Never SIGKILL (project rule); a hook must not block the Stop for long.

### 4c. `/handoff` as skill vs command
- Docs [V https://code.claude.com/docs/en/skills]: "Custom commands have been merged into skills"; `.claude/commands/x.md` and `.claude/skills/x/SKILL.md` both create `/x`; skills recommended; `disable-model-invocation: true` = user-only (what Pocock/Ondrej use). So: a skill `secretary-handoff` (or `handoff`) with `disable-model-invocation: true`. Name collision: repo already ships `ak-handoff` (`/ak-handoff`); a bare `/handoff` would not collide but two handoff skills confuse routing - make ours explicitly scoped (secretary rotation) and have it call the same script the Stop hook uses (one door: DRY).
- Skill can only instruct the model; actual rotation must be done by a script the skill calls (`fgos …`) or by the supervisor watching a request file.

## 5. Comparison table

| Tool | Trigger | Writer | Content | Load into new | State-loss guard | Known failure |
|---|---|---|---|---|---|---|
| ak-handoff (local) | manual | model | 9 sections, git probes, redacted | paste one-line instr / orchestrate dispatch | collision guard, validate, "verify vs repo" | heavy; manual only; coding-shaped |
| davidondrej/Pocock handoff | manual | model | goal/state/decisions/traps/pointers; link-not-copy | paste path | redaction, link artifacts | model writes actions as facts; late |
| Amp handoff | manual -> "ask agent" | model | goal prompt + file list, editable | new thread draft | user edit | removed 2026 for auto-compaction |
| Cline new_task | model proposes (rule: >50%) or /newtask | model | plan, done, files, next steps | new task preloaded, user approves | approval | model self-monitoring; approval blocks autonomy |
| OpenHands condenser | auto, event count | LLM summarizer | head + summary + tail | in-session | keep_first pinned | summary lossy; not a new session |
| Codex / Aider | auto token limit | LLM | summary | in-session | none | mid-task loss (#4106) |
| Continuous-Claude-v3 | PreCompact + manual | model/hook | YAML ledger | SessionStart hook injects | auto-handoff before compaction | fires only at compaction [S] |
| Anthropic harness | each session end | agent + git | progress file, feature JSON, commits | start ritual reads files | commits, smoke test | premature victory |
| Claude Code built-ins | manual/auto compact | model | summary | in-session or /resume | PreCompact hook | no context metric in hooks |

## Recommended method for us

1. Keep truth in repo files (topics, pending questions). Handoff = small pointer file: pointers to those files + delta since last write + (hard only) last assistant message + pending question, verbatim. Describe state, not actions (Ondrej/Pocock/Anthropic harness).
2. Writer = script, not model, for the rotation path: topics/questions already in files; verbatim fields come from hook's `last_assistant_message`. Model writes only a short "why/traps" note, at soft threshold when at rest. Avoids asking a 70%-full model to write well.
3. Measure: statusline script drops `{session_id, used_percentage, context_window_size, ts}` sidecar; Stop hook reads it, falls back to transcript (last non-sidechain assistant, dedupe by `message.id`, sum input+cache_creation+cache_read). Verified formula matches docs.
4. Stop hook never uses `decision:block`; it writes a rotation request file (atomic) and exits. Soft 40% only if state files say no pending question and `background_tasks` empty; hard 70% always.
5. Rotation executor = separate supervisor (fgos, herdr driver): new+close. Split pane, `agent start … --kind claude -- --agent secretary "<prompt reading handoff>"`, wait ready, verify first reply, then close old. Old session stays alive if anything fails. Prefer this over wrapper-loop in-place (dead-shell risk).
6. New session start also via SessionStart `agent_type=secretary` hook as fallback loader (`additionalContext`, <10k chars) so a manual `claude --agent secretary` still sees the latest handoff.
7. `/handoff` = skill with `disable-model-invocation: true` that calls the same script as the hook (one door), then requests rotation. Do not reuse `ak-handoff` schema; reuse its redaction and "verify before acting" line.
8. Start-of-session ritual (Anthropic): read handoff -> read state files -> reconcile, state which pending question it resumed. Redact secrets before write; never overwrite an unread handoff (timestamped files + `latest` pointer).
9. Cheap spike before building: test `/clear` + SessionStart(`source:clear`) via `herdr pane send-text` as the in-process variant; if it works it removes the whole executor.

## Limitations / unverified
- Statusline refresh timing vs Stop hook ordering: unverified. Transcript lag at Stop: documented, not measured.
- `kill -TERM $PPID` from hook, `/exit` via herdr send-text when idle, and `/clear` via send-text then SessionStart injection: not tested.
- Continuous-Claude-v3, robertguss, EveryInc, parcadei details come from directory listings only. claudeissues.com mirror unreachable; issue facts re-read via `gh` for #54580 and #24320 only. Cursor, AiderDesk handoff, Codex thresholds not verified from primary docs.
- Compaction quality claims (Amp) are vendor assertions; no independent benchmark consulted.

## Unresolved questions
- Does 40%/70% mean of 200k or of the 1M window for the secretary's model? (changes sidecar vs transcript choice)
- Should rotation be allowed while a herdr-dispatched worker the secretary awaits is in flight (`background_tasks` only sees Claude-internal tasks)?
- Who owns the handoff file path/naming: `fgos convention name|path` per AGENTS.md, not checked here.
