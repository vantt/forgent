# herdr Control Surface & fgOS Plugin Inventory

**Scouted**: Part A (herdr CLI), Part B (distillery notes), Part C (plugin code)
**herdr version baseline**: 0.8.2 (installed); distillery notes from commit a0678a3 (2026-07-15)
**Unverified**: herdr version mentioned in distillery notes not explicitly stated; assumed contemporary with notes

---

## Part A: herdr CLI Control Surface

### (1) Agent States
Five semantic states (herdr agent wait --help):
- `idle` — agent at prompt, ready for input
- `working` — agent processing
- `blocked` — user intervention needed  
- `done` — completed but unseen (background pane)
- `unknown` — detection failed or ambiguous

**Note**: From distillery (L31-36), idle/done are the same underlying state distinguished by "seen" flag (tab focus). A working agent becomes `done` when backgrounded; focusing the tab marks it `idle`.

### (2) Status Authority Arbitration
Two-layer design (distillery L24-29):
- **Full-lifecycle agents** (Pi, OMP, Kimi, OpenCode, Kilo, Hermes, MastraCode): Hook reports override screen manifest
- **Partial agents** (Claude Code, Codex, Copilot, Devin, Droid, Qoder, Cursor): Screen manifest detection always active (hooks don't cover every transition)

**Arbitration command**: `herdr agent explain [--file PATH] [--agent LABEL] [--json] [-v]` (agent explain --help) — shows both detected and reported state with reason codes.

**Metadata vs Semantic**: `pane report-agent` sets lifecycle state; `pane report-metadata` is display-only and cannot override state (docs/socket-api.mdx per distillery L253).

### (3) Wait Primitives
Two first-class blocking commands (distillery L75-80):
- `herdr agent wait <TARGET> --until <STATUS> [--timeout <MS>]` — blocks until agent state matches (default: idle/done/blocked)
- `herdr pane wait-output <PANE_ID> --match <TEXT> | --regex <PATTERN> [--timeout <MS>]` — blocks until output contains match

No timeout → indefinite block.

### (4) Agent Prompt (Text Submission)
`herdr agent prompt <TARGET> <TEXT> --wait --until <STATUS> [--timeout <MS>]`
- **Does submit**: Yes, sends text via socket API to the agent
- **Does wait**: Yes, blocks for state transition (requires state change within 5000ms or returns `agent_prompt_stalled`)
- **Not separate**: `send-text` is lower-level (pane send-text <PANE_ID> <TEXT>); `agent prompt` combines send + wait

### (5) Session Persistence & Restore
- **Bootstrap**: `session.snapshot` RPC returns full workspace/tab/pane/agent state (distillery L133-138)
- **Refresh**: Clients subscribe to `events.subscribe` (socket API) and keep local cache current
- **Native Resume**: `pane report-agent-session --session-id <ID> --session-path <PATH>` stores native session refs (e.g., Claude Code's session token); on restart, `herdr` relaunches with `claude --resume <id>` (distillery L119-124)
- **Pane History**: Opt-in `[experimental] pane_history = true` replays terminal contents across restart

### (6) Pane/Agent Identity
`herdr pane get <pane_id>` JSON includes:
- `id` (stable, never reused)
- `agent` (detected agent name or hook-reported label)
- `agent_status` (current lifecycle state)
- `terminal_title` (may be missing or hook-reported)

Opaque IDs (`w1`, `w1:t1`, `w1:p1`) never retarget after closure (SKILL.md per distillery L57).

### (7) Socket API & Events
- **Protocol**: Newline-delimited JSON RPC on local Unix socket (macOS/Linux) or named pipe (Windows)
- **Self-describing**: `herdr api schema [--json]` prints full OpenAPI 3.1 spec for all requests/responses/errors/events
- **Subscription**: `events.subscribe` (socket API) pushes real-time lifecycle events to subscribers
- **Session state**: `session.snapshot` (one-time RPC, not subscription) — call once, then subscribe

### (8) Direct Terminal Ownership
`terminal session observe` / `control --takeover` (distillery L281-286):
- Single writable owner at a time; second writer must pass `--takeover`
- Read-only observers unlimited, no takeover needed

---

## Part B: Distillery Notes Summary (commit a0678a3, 2026-07-15)

| Concept | Location | Key Finding |
|---------|----------|-------------|
| **agent-state-machine** | L31-36 | idle/done unified, seen transition on tab focus |
| **status-authority** | L24-29 | Full lifecycle agents override screen; others always screen-detected |
| **wait-primitives** | L75-80 | Two verbs: `wait output` (text), `wait agent-status` (state) |
| **native-agent-restore** | L119-124 | Per-agent resume cmd, 14 agents supported, integration-version gate |
| **session-snapshot-bootstrap** | L133-138 | One-time RPC, then event subscription for live updates |
| **direct-attach-ownership** | L281-286 | Single writer, `--takeover`, read-only observers free |
| **socket-api-surface** | L61-66 | NL-delimited JSON RPC, JSON Schema, no separate SDK |
| **plugin-trust-gate** | L260-265 | Interactive preview before install, `--yes` to skip, `min_herdr_version` check |

**Caveats identified**:
- Idle/done distinction only visible externally (seen flag is presentation, not state)
- No explicit "idle kills agent" rule in distillery (but herdr docs reference it for inactive panes)
- `HERDR_SESSION` env var — NOT found in distillery; session refs are hook-reported only
- Codex trust prompt — integration-scoped, not universal herdr behavior

---

## Part C: fgOS herdr Plugin Surface

### REST Routes (`/v1/` prefix, gateway.rs:1176–1193)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/work` | GET, POST | List/submit work items |
| `/work/{id}` | GET, PATCH | Get/update item |
| `/work/{id}/docs` | GET | Item documentation |
| `/work/{id}/move` | POST | Change pool/stage |
| `/work/{id}/ask` | POST | Pose internal question |
| `/work/{id}/answer` | POST | Answer internal question |
| `/work/{id}/take` | POST | Claim item |
| `/work/{id}/return` | POST | Return item to pool |
| `/work/{id}/approve` | POST | Approve item completion |
| `/work/{id}/reject` | POST | Reject with reason |
| `/ready` | GET | Ready frontier (pending items) |
| `/rollup/{id}` | GET | Hierarchical state rollup |
| `/graph` | GET | Work graph topology |
| `/state/digest` | GET | State summary |
| `/sessions` | POST | Create session |
| `/sessions/{id}` | DELETE | Delete session |
| `/sessions/{id}/slots` | GET | Worker slot panes |
| `/runner/tick` | POST | Poll runner state |
| `/mcp` | * | MCP service (search, execute) |
| `/contract` | GET | OpenAPI spec (no auth) |

**NOT exposed**: No route to send text/keys/prompts to running panes; no agent lifecycle hooks; no pane rename (0.8.2 removed `herdr pane rename`).

### MCP Tools (mcp.rs:439–437)
Exactly 2 tools, all via single `VerbGateway` chokepoint:

**`search`** (L414–422)
- Description: Query gateway's OpenAPI contract
- Input: `query` (optional substring, case-insensitive)
- Output: JSON array of `{path, method, operationId, summary}` matching operations
- Source: Parses `/contract` (gateway's own OpenAPI spec, same data REST handlers serve)

**`execute`** (L424–436)
- Description: Run Rhai script against 13 bound work-item functions
- Input: `script` (Rhai source)
- Bound functions: `list_work`, `submit_work`, `get_work`, `move_work`, `ask_work`, `answer_work`, `take_work`, `return_work`, `approve_work`, `reject_work`, `ready_work`, `rollup`, `graph`
- Safety: Rhai engine limits operations to 500,000 (L216), no filesystem/process/network access beyond bound functions
- Output: Script's final expression + captured `print()` output (capped at 256 KB per L179)

### Pane Interactions (pick.rs)

**What it does**:
- Opens worker panes: `layout::acquire_worker_slot_pane()` splits or reuses pane (L240–248)
- Launches agents: `herdr pane run <pane_id> '<command>'` with piped slash command (L137, 190, 206)
- Focuses panes: `herdr pane zoom <pane_id> --on` (L364)
- Examples:
  - `/fgOS:pick <id>`: `herdr pane run $p1 "claude --model sonnet --dangerously-skip-permissions '/fgOS:pick tsk-xyz'"`
  - `/fgOS:merge-next`: `herdr pane run $merge_pane "claude --model sonnet '/fgOS:merge-next'"`

**What it does NOT do**:
- No `send-text` or `send-keys` after launch
- No `agent prompt` to submit text at runtime
- No `wait agent-status` or polling for completion
- No `pane read` to capture output
- No agent lifecycle hooks or state reporting
- **Fire-and-forget pattern** (L252–253): Spawns command, never waits on launched session lifetime

**Terminal Skill** (`/fgOS:terminal`):
- SKILL.md calls `herdr pane rename <pane_id> <label>` to set pane label with task id + session ids
- **0.8.2 note**: `herdr pane rename` is no longer supported (herdr removes raw pane mutations); skill should use `herdr pane report-metadata` instead (distillery L251–256)

### Agent Contact Surface — NOT EXPOSED

| Capability | herdr CLI | Plugin REST | Plugin MCP | Status |
|------------|-----------|------------|-----------|--------|
| Submit text/prompt to running agent | `agent prompt` | ✗ | ✗ | Available in herdr, unused by plugin |
| Wait for agent state | `agent wait` | ✗ | ✗ | Available in herdr, unused by plugin |
| Read pane output | `pane read` | ✗ | ✗ | Available in herdr, unused by plugin |
| Report agent state (hook) | `pane report-agent` | ✗ | ✗ | Available in herdr, unused by plugin |
| Send key presses | `pane send-keys` | ✗ | ✗ | Available in herdr, unused by plugin |
| Work-item `ask`/`answer` | ✗ | `/work/{id}/ask`, `/work/{id}/answer` | `ask_work()`, `answer_work()` | Internal coordination only, not agent contact |

**Asymmetry**: herdr's full control surface (prompt, wait, read, report) exists but plugin never uses it. Plugin relationship to herdr is **launch-only** (fire-and-forget pane run).

---

## Summary

**herdr exposes for agent lifecycle**:
- Complete state machine (5 states, seen/unseen)
- Blocking waits (status, output)
- Bidirectional prompt/response (`agent prompt` with return state)
- Session restore (native resume commands)
- Real-time events (socket subscription)
- Pane read/write primitives

**fgOS plugin uses of herdr**:
- Pane layout management (`pane split`, slot acquisition)
- Fire-and-forget agent launch (`pane run` with piped stdin)
- Pane focusing (`pane zoom`)
- Nothing else: no prompting, no state polling, no output reading

**Gap for interactive agent's full lifecycle**:
- herdr has the control surface; plugin doesn't call it
- Missing from both: direct agent-to-gateway messaging channel (ask/answer are work-item state, not agent contact)
- No "reconnect after server restart" capability for a long-running agent session

**Unresolved Questions**:
- Does herdr 0.8.2 still support `pane rename`, or has it been fully removed per STR40 docs?
- Are there integration hooks for Claude Code's session ID reporting when running inside herdr?
- What is the minimum herdr version the plugin requires (no version constraint found in gateway.rs)?

