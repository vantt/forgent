# Multica integration surface (research 2026-11-18)

Repo: https://github.com/multica-ai/multica (56.5k stars, 7.4k forks, last push 2026-11-18, created 2026-01-13; GitHub API).
Stack: Go (Chi, sqlc, gorilla/websocket) + Postgres 17 + Next.js/Electron/Expo clients + local Go daemon (README).
Sources fetched raw from `main`: README, CLI_AND_DAEMON.md, VISION.md, AGENTS.md, `apps/docs/content/docs/*.mdx`
(tasks, concepts, how-multica-works, auth-tokens, security-model, daemon-runtimes, autopilots, squads, workflows,
issue-wakeups, providers, inbox), `server/cmd/server/router.go`, `server/pkg/protocol/events.go`,
`server/pkg/publicapi/v1/{README.md,openapi.yaml}`, `packages/plugin-sdk/README.md`, `examples/plugins/*`, LICENSE.
Credibility: official docs + router source (high). Public docs site multica.ai/docs not fetched directly (mirrors repo mdx). Not run, not tested live.

## 1. Data model

| Concept | Meaning | Source |
|---|---|---|
| Workspace | Tenant. All queries filter `workspace_id`; header `X-Workspace-ID` selects it; roles owner/admin/member | concepts.mdx; AGENTS.md "Backend UUID Rules" |
| Project | Groups issues; binds repos/dirs/resources; may pick a Workflow; has lead | projects.mdx, workflows.mdx, concepts.mdx |
| Issue | Unit of work. Polymorphic assignee (`assignee_type` + `assignee_id` = member / agent / squad). Parent/sub-issues, comments (threads), labels, custom properties, metadata k/v, subscribers, PR links | router.go `/api/issues/{id}/...`; CLI doc "Issues" |
| Run (internal name "task") | One agent execution against an issue/chat/autopilot. Many runs per issue; records never overwritten. API/DB still say `task`, `task_id` | developers/architecture.mdx; tasks.mdx |
| Agent | NOT a process. Reusable config: name, instructions, model, skills, access, bound runtime. Per-agent concurrency cap | concepts.mdx; daemon-runtimes.mdx |
| Runtime | One machine + one agent CLI (or custom profile) registered per workspace; private by default, shareable to members/public | daemon-runtimes.mdx |
| Daemon | Local process (`multica daemon start`) that registers runtimes, claims runs, spawns CLIs | CLI_AND_DAEMON.md |
| Squad | One leader agent + members (agents/humans). Assign to squad -> leader run only; leader delegates by @mention, records evaluation, stops | squads.mdx |
| Autopilot | Cron / webhook trigger -> create issue or direct run (`create_issue` / `run_only`) | autopilots.mdx |
| Issue wakeup | Rule on an issue (time, reply, field change, run ended, sub-issues done, PR CI/merge, other issue status) that re-runs an agent | issue-wakeups.mdx |
| Workflow | Per-project status columns + per-column handoff (to agent/member) + "when done"/"if rejected" targets. Run end does NOT move status; handler does | workflows.mdx |

Issue status: built-ins `backlog, todo, in_progress, in_review, done, blocked, cancelled`; workspace custom statuses allowed.
Four stored categories: unstarted / started / done / closed. Custom status label grants no behavior ("not a workflow engine")
(docs/issue-status-lifecycle-rollout.md; CLI doc "Change Status").

Run lifecycle (tasks.mdx): `deferred -> queued -> dispatched -> (waiting_local_directory) -> running -> completed | failed | cancelled`.
- `dispatched` > 5 min = failed. `running` has no duration cap; liveness via 15 s heartbeat; fails only after reconnect grace (3 h default, `MULTICA_RUNTIME_RECONNECT_GRACE`).
- Queued run never migrates to another machine. Auto-retry: max 2 attempts (3 for tool-network faults), only transient causes.
- `completed` != issue done. Failure moves `in_progress` issue back to `todo` if no other active run.
- Failure reasons are a closed taxonomy (`runtime_offline`, `queued_expired`, `timeout`, `agent_blocked`, `agent_error.provider_quota_limit`, ...).

## 2. How an agent is executed

- Local daemon, outbound-only: WebSocket `/api/daemon/ws` for wake signals + HTTP poll fallback (30 s; WS-healthy claim poll ~3 min). Claims in batch `POST /api/daemon/tasks/claim` (router.go ~1700).
- Per run: isolated workdir under `~/multica_workspaces/`, run-scoped token, spawn CLI, stream results. Provider adapters in `server/pkg/agent` normalize start/stream/cancel/usage.
- CLIs (CLI_AND_DAEMON.md "Supported Agents", providers.mdx): 31+ auto-detected incl. `claude`, `codex`, `omp`, `pi`, `agy` (Antigravity), `cursor-agent`, `copilot`, `opencode`, `kimi`, `qwen`, `amp`, `droid`, `kiro-cli`, `grok`, `hermes`. Protocol families: claude stream-json, codex app-server, ACP (`<tool> acp`), OpenCode JSON, NDJSON. Claude runs with `--permission-mode bypassPermissions`, Codex `danger-full-access` (security-model.mdx): no sandbox, boundary = daemon OS user.
- Progress back to server via daemon routes: `/tasks/{id}/start|progress|messages|usage|complete|fail|cancel-ack|session` (router.go 1700-1735). Agent also writes comments/status itself using `multica` CLI with the run token.
- UI freshness: separate user WebSocket `/ws` (`internal/realtime`) pushes events; clients patch/invalidate TanStack cache. DB is truth; clients re-query on reconnect (architecture.mdx).
- Cloud remote runtime exists (Qoder Cloud Agents: server-supervised bridge using the same daemon task protocol, `server/cmd/qoder-runtime/README.md`). Proves a non-daemon runner can speak the daemon task protocol; protocol is internal, not documented as public.

## 3. Integration surfaces for an external system

| Surface | Status | Auth | Notes / source |
|---|---|---|---|
| App REST `/api/*` (issues, comments, agents, runtimes, projects, squads, autopilots, inbox, tasks cancel/rerun) | Exists, used by web/CLI. **No public contract/OpenAPI**; AGENTS.md says clients tolerate unknown fields, so shape drifts additively | PAT `Authorization: Bearer mul_...` + `X-Workspace-ID` (auth-tokens.mdx example `curl .../api/issues`) | router.go 2165-2720. Treat as unstable-but-practical |
| Public API v1 (OpenAPI) | Only slice: issue read/update content, comments read/create, task messages, plugin storage/context. Roadmap: projects, members, issue create/transition, agents, squads, tasks/runs, autopilots (pkg/publicapi/v1/README.md; openapi.yaml paths: `/context`, `/issues/{ref}`, `/issues/{ref}/comments`, `/tasks/{id}/messages`, `/storage/...`). Idempotency-Key + If-Match/ETag planned | Plugin tokens `mpi_`/`mpc_` only today; "user OAuth and PAT" planned | Versioned/stable, but too thin to drive scheduling today |
| CLI `multica` | Full: `issue create/assign/status/comment/runs/run-messages/rerun-task`, `agent list`, `project`, `autopilot`, `squad`, `runtime`, `inbox`; `--output json` | PAT via `multica login` (`~/.multica/config.json`, auto-renews at <7 d) | CLI_AND_DAEMON.md. Best scripting door today |
| User WebSocket `/ws` | Event stream (workspace-scoped) | session/PAT | events.go: `issue:*`, `comment:*`, `task:queued|dispatch|running|progress|completed|failed|cancelled|message|usage`, `agent:status`, `issue_status:changed`, `autopilot:run_start|run_done`, `inbox:new`, `pull_request:*`. Wire format of `/ws` not verified |
| Inbound webhooks | `POST /api/webhooks/autopilots/{token}` (URL token credential, optional HMAC signing secret -> 401, event filters, dedupe, replay, rate limits); also GitHub App, VCS (Forgejo/Gitea/GitLab) webhooks | token in URL | autopilots.mdx; router.go 1640-1653. **Easiest "fgOS tells multica / triggers an agent" door** |
| Outbound webhooks | No generic subscription found. Closest: Plugin **hooks** with `transport: {type: http, url}`, triggers `ui|manual|event|schedule|agent`, event e.g. `issue.created`, signed request, timeout_ms | HMAC-signed by server | examples/plugins/triage-notify/multica.plugin.json; `internal/scheduler/jobs_plugin_hook.go` |
| Plugins | Manifest v1: scopes (`issues:read`, `comments:write`, `net:<host>`), `contributes.surfaces` (sandboxed iframe `issue_panel`, SDK `@multica/plugin-sdk`), `hooks`, MCP servers, skills; installed per workspace by admin; Plugin API rate 120/min | `mpi_`/`mpc_` bearer | packages/plugin-sdk/README.md; router.go 1738-1750. **Official way to show external data in the UI** |
| MCP | Multica is MCP *client-side*: per-agent MCP config handed to each run; "Apps MCP gateway" `POST /api/apps/mcp` (task-scoped token); `fgos`-style MCP exposure of Multica itself: none found | task token | daemon-runtimes.mdx; router.go 1671. No Multica-as-MCP-server found (unverified) |
| GraphQL | None found | | grep of router/docs |
| A2A | One mention ("Run as an agent (inside a task, or over A2A)", CLI doc autopilot trigger). No A2A endpoint located | | **Unverified** |
| Chat channels | Slack, Feishu/Lark, DingTalk, WeCom, Telegram, Weixin bots create issues/chat | per-channel | channels.mdx (not read in depth) |

Auth model summary (auth-tokens.mdx): browser JWT cookie `multica_auth` (30 d); PAT `mul_` (acts as the user, all workspaces, hashed, 30d/90d/1y/never);
run token `mat_` (user+workspace+agent+run bound, <=24 h, agent actions attributed to agent, human-only ops denied);
`mcn_` cloud node, `mdt_` workspace daemon (internal). Agent never receives the user's PAT.

## 4. Concepts matching ours

| fgOS concept | Multica equivalent | Gap |
|---|---|---|
| Supervisor (LLM picks next plan, starts leads) | **Squad leader** (LLM agent routes by @mention, "stop after dispatching", re-triggered on updates) + **Workflow handoff** (static column->assignee) | No portfolio/priority scheduler across issues; squads route within an issue. Closest to a supervisor is a "Chief of Staff" built-in agent (`POST /api/agents/mika`, router.go; purpose not read, unverified) |
| Watcher (no-LLM timer -> wake supervisor) | **Scheduler jobs** (`internal/scheduler`: autopilot, issue wakeup, child_done, plugin_hook), **issue wakeups** (server checks field/sub-issue/PR conditions every ~30 s), runtime sweeper, autopilot cron | Wakeup targets a specific agent on a specific issue; no "wake one global supervisor on any event" except an autopilot/schedule |
| Concurrency limits | Daemon max 20 runs (`MULTICA_DAEMON_MAX_CONCURRENT_TASKS`), **per-agent max 6**, effective = min; excess stays queued; Qoder remote default 3 (max 10); `MULTICA_TASK_SLOT` slot index | Per-agent/runtime only; no per-project or per-plan cap. Claude/Codex plan-limit windows (5 h/weekly) displayed per runtime |
| Human questions/approvals | Agent comment + status `blocked` / `in_review`; failure `agent_blocked`; inbox notification for statuses "that need a person"; `@mention` member notifies; Workflow hands step to a member; Chat | Free-text comments, no structured question objects, no batching of questions, no answer schema |
| Notifications | Inbox (per member, merged per issue, subscribe/unsubscribe, snooze, archive), channel bots, WS `inbox:new` | OK |
| Plans / multi-step lead | Parent issue + sub-issues + "stage barrier", `child_done` job, wakeup "sub-issues finish" | No plan file concept; plan = issue tree |
| Execution record | Run record + transcript (`task:message`), token/cost usage per run | Good for display |

Multica deliberately does not sandbox, does not fail over a queued run across machines, and "completed run != done issue". Status is agent-managed by contract (squads.mdx step 5).

## 5. What a third-party engine needs (fgOS)

Three directions, each with minimum contract:

A. **Multica shows/drives fgOS (mirror, fgOS stays authority).**
   fgOS-side adapter maps plan -> issue (or issue + sub-issues per phase), run -> comment/status, using `multica` CLI or `/api/*` with a PAT.
   Needs from fgOS: stable plan id, status vocabulary (map to `backlog/todo/in_progress/in_review/blocked/done/cancelled` or custom statuses), event feed (so adapter can push), a way to ingest human actions (assign, reprioritize, comment) = poll `/ws` or CLI `issue list --output json` and translate to fgOS verbs.
   Reprioritize: issue has position/priority fields (router `/api/issues/{id}/move`, CLI "Reorder Issue"); fgOS must treat it as advisory input to supervisor, not a command.

B. **Multica dispatches to fgOS (fgOS as runner).**
   Register a **custom runtime profile** whose command is a wrapper around `fgos run` and that speaks a supported family (claude stream-json or ACP are simplest; daemon-runtimes.mdx "Custom runtime profiles": "does not add a new protocol"). Wrapper reads `MULTICA_TASK_ID`, `MULTICA_TOKEN`, `MULTICA_SERVER_URL`, `MULTICA_WORKSPACE_ID`, `MULTICA_AGENT_ID` (the five documented integration-contract env vars) and reports via `multica issue comment/status`. Cost: fgOS must emit the chosen protocol; Multica will start a CLI per run, bypassing fgOS supervisor admission unless the wrapper calls `fgos dispatch decide` first.
   Alternative: agent = "fgOS bridge" that only runs `multica`-side CLI and calls `fgos workflow start`.

C. **Plugin in Multica UI.** Manifest + iframe `issue_panel` surface showing fgOS plan/run state; hook with `transport: http` and `events: [issue.created, ...]` calling an fgOS endpoint; scopes `issues:read`, `comments:write`, `net:<fgos-host>`. Official, versioned, admin-approved, sandboxed, but Public API v1 is thin (no issue create/transition yet).

Engine-side requirements common to all: stable ids for plan/run (idempotent re-sync; Public API will use `Idempotency-Key`, so design ours to be idempotent), read-only status/event endpoint, a one-shot "start plan" verb, an "ask human" record that can be projected to a comment + `blocked`/`in_review` + inbox, per-run attribution, and a token scheme (Multica uses user PAT vs run-scoped token; copy that split).

## Recommendation (ranked)

1. **Direction A through the CLI/webhook door**, with fgOS keeping scheduling authority. Reasons: only door that works today without Multica changes (CLI documented, `--output json`, PAT); keeps supervisor/watcher semantics intact; Multica reprioritize/assign becomes an input event. Make fgOS expose an event log + status mapping; watcher can poll Multica or consume `/ws`.
2. **Direction C (plugin)** for display inside Multica, after Public API v1 grows issue create/transition. Medium effort, only stable surface.
3. **Direction B (fgOS as runtime)** last: protocol shim burden, double scheduling (Multica per-agent cap 6 + our admission), no failover. Use only if a user wants Multica to be the front door for execution.

Do not design around Multica's squad leader as our supervisor: it routes within one issue, not across a portfolio.

## Risks / limits

- License: Apache-2.0 + conditions; hosted/embedded commercial use of Multica source needs a commercial license; internal single-org use free; branding must stay (LICENSE Part I). Integrating *against* it (CLI/API) is not embedding, but shipping it inside fgOS would be.
- API churn: App REST has no contract; Public API v1 is intentionally a slice; project is 10 months old with ~1.9k open issues and migrations numbered >284 (AGENTS.md mentions migration 284).
- Run != issue state; status written by agents; ours must tolerate drift.
- Not verified: `/ws` frame format; whether CLI can create webhook triggers with signing secret via CLI (doc says secret mentioned in responses); "Mika" Chief of Staff behavior; A2A; Linear/GitHub-style two-way sync; exact limits on API rate for PAT; `priority` field set on issues; channels doc details; whether multica.ai/docs differs from repo mdx.

## Unresolved questions

- Does fgOS want plan = issue or plan = project (phases = issues)? Drives status mapping and sub-issue barrier use.
- Is Multica to be the human front door (needs B or webhook-in) or only a viewer (A/C)?
- Which agent protocol could `fgos run` wrap cheaply (claude stream-json vs ACP)? Needs a spike if B is wanted.
