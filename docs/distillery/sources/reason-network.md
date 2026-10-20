---
name: reason-network
type: git-repo
url: https://github.com/reason-machines/reason-network
local: upstreams/reason-network
last_analyzed_commit: 19b1fbf
last_analyzed_date: 2026-10-19
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# reason-network — Feature Index

> Extracted from HEAD `19b1fbf` on 2026-10-19 (full scan, driven by the mailbox research question in `plans/reports/research-261015-1502-agent-messaging-mailbox-design.md`). Clone: `upstreams/reason-network`. Rust daemon + MCP server + per-CLI hooks/plugins that let coding agents on a team's machines message each other. Not read in depth: `src/wizard.rs`, `src/tray.rs`, `src/migrate.rs`, `src/daemon/update.rs`, `src/daemon/teamops.rs`, `src/daemon/reason.rs`, install scripts, CI. Claims taken from `DESIGN.md` prose that no code or test backs are marked "(doc only)".

## integration-contract

### delivery-tier-declaration
- **What:** Every session carries a `Tier` (`push`, `turn`, `pull`) that says how fast a message can reach its model: push = injected mid-turn and wakes an idle session, turn = injected at the next tool call or at stop but an idle session waits for its human, pull = only when the agent calls `check_inbox`. The tier is chosen per agent kind from the channel that actually works and is lowered (never raised) when a push attempt fails (`push_failed`).
- **Where:** `src/daemon/sessions.rs`, `src/daemon/mail.rs`, `src/proto.rs`, `DESIGN.md`
- **Notable:** `hook_tier` gives push to Codex (only if the `codex` binary is found), opencode, pi and Reason, turn to everything else with hooks, pull to hook-less agents. `register_quiet` keeps `min(existing, new)` so a session never claims a faster tier than its weakest proven channel. The tier is published in the directory, so senders pick recipients knowing the latency.
- **Keywords:** push/turn/pull, delivery tier, channel selection, `Channel` enum
- **Seen:** 19b1fbf

### sender-receipt-with-reason
- **What:** `send_message` returns, per recipient, a state (`pushed`, `delivered`, `queued`, `held`, `refused`, `notified`) and a one-sentence note that says when the recipient will actually see it, e.g. "queued: it sees it at its next tool call or when its turn ends", "queued as FYI: it reads it at its next natural pause", "held until alice approves it".
- **Where:** `src/daemon/mail.rs`
- **Notable:** The note is chosen from the real channel (`Channel::Hook` vs `Channel::Pull` vs socket), so the sender learns the latency class, not only that the write succeeded. Remote recipients get "queued: not connected to <machine> right now; it goes out as soon as it is".
- **Keywords:** receipt, ack state, note to sender
- **Seen:** 19b1fbf

### address-grammar-and-group-guard
- **What:** Addresses are `person/session`, optional `@machine`, `repo:<name>`, `person/*`, `*`. Messages go to agent sessions, never to a person; a person's name as address is an error that lists their sessions. Group addresses are accepted only from `<person>/terminal`; an agent that tries one is told to pick a session or ask its user, and a receiving machine also refuses a group message from a teammate's agent.
- **Where:** `src/daemon/directory.rs`, `src/daemon/mail.rs`, `tests/e2e/two_machines.py`
- **Notable:** The guard sits at both ends (sender refuses before sending, receiver refuses what an older peer sent), so a stale teammate build cannot bypass it. An agent's shell that reason-network does not know sends as `<me>/terminal`.
- **Keywords:** broadcast guard, `via`, terminal sender
- **Seen:** 19b1fbf

### stable-key-vs-display-name
- **What:** The internal session key is `<agent>:<session_id>`; the name teammates see (`<repo>-<agent>`, `-2`, `-3` on collision) is only a label. A new session in the same place with the same agent inherits a stale session's name and its unread mail; renaming moves unread mail to the new address.
- **Where:** `src/daemon/sessions.rs`, `src/store.rs`, `src/agent.rs`
- **Notable:** `pick_name` reuses the previous name for the same key if it is free, then derives `<repo>-<agent>`, then numbers. `Store::rename` rewrites `recipient` on unread messages. Names are unique across the person's other machines (`my_names_elsewhere`).
- **Keywords:** session identity, name inheritance, rename keeps mail
- **Seen:** 19b1fbf

## hooks

### per-cli-hook-output-adapter
- **What:** One `reason-network hook <agent> <event>` command serves Codex, Cursor, Gemini, Copilot, Grok, opencode and pi; `format_for` turns the same text into each CLI's required shape: `hookSpecificOutput.additionalContext` (Codex/Gemini/Grok), `{"decision":"block","reason":…}` at stop (Codex/Gemini/Copilot/Grok), `followup_message` at Cursor stop, `additional_context` / `additionalContext` for Cursor/Copilot, plain text for opencode and pi.
- **Where:** `src/hook.rs`, `src/setup.rs`
- **Notable:** `takes_mail` encodes per-CLI holes: prompt-submit cannot add context in Cursor/Copilot/Grok, Grok drops SessionStart output, grok runs a subagent's hooks under the subagent's own session id so `grok_ignores` drops them and the extra post-shutdown Stop. Cursor, Copilot and Devin also load Claude Code's hooks, so the handler must detect the real caller from `clientInfo.name` over environment. On Windows the JSON is forced to ASCII because PowerShell can re-encode it.
- **Keywords:** additionalContext, decision block, followup_message, grok quirks
- **Seen:** 19b1fbf

### stop-hook-continues-turn
- **What:** For turn-tier CLIs the `stop` event is a delivery point: if mail is waiting, the hook returns a "block" (or `followup_message`) carrying the framed message, which makes the agent continue instead of ending its turn.
- **Where:** `src/hook.rs`, `src/setup.rs`, `tests/e2e/hooks.py`
- **Notable:** Verified only to the output shape: `hooks.py` pipes synthetic payloads into the binary and asserts `"decision":"block"` (Gemini) and `followup_message` (Cursor) text. Nothing in the repo runs a real Codex/Gemini/Copilot/Grok/Cursor and observes that the stop is actually blocked; that behaviour is each CLI's documented hook contract. Registration sets a 10 s timeout on every hook (Grok defaults `Stop`/`PostToolUse` to 10 minutes, others to 5 s, per a comment in `setup.rs`), so a stuck daemon cannot hold a stop for long.
- **Keywords:** stop gate, continuation, O3/O4
- **Seen:** 19b1fbf

### mid-turn-wake-filter
- **What:** The hook asks the daemon for pending mail with `event`; mid-turn (`tool`) only messages flagged `wake` are returned, at a pause (`stop`, `prompt`, `start`, `poll`) all are. `--fyi` clears `wake`, so an FYI waits for the next natural pause even when the recipient is busy.
- **Where:** `src/daemon/sessions.rs`, `src/daemon/mail.rs`
- **Notable:** This is the steer-vs-queue distinction implemented as one boolean on the message plus the event type, without any interrupt level. `tests/e2e/hooks.py` asserts that an FYI is not injected at `post-tool-use` but arrives at `stop`.
- **Keywords:** wake flag, fyi, steer, queue
- **Seen:** 19b1fbf

### confirm-after-print-delivery
- **What:** The daemon never marks hook-delivered mail read itself. It marks the ids "in flight" for 90 seconds, the hook prints the text and only then calls `Delivered`; unconfirmed messages reappear in the inbox and hooks after the TTL.
- **Where:** `src/hook.rs`, `src/daemon/mail.rs`, `src/daemon/sessions.rs`
- **Notable:** At-least-once with a delivery confirmation tied to the successful write to stdout, plus in-flight suppression so two concurrent hooks (opencode 2.x can run two plugin instances) do not both get the same message. "Read" still means "handed to the agent", not "handled by the agent"; nothing re-surfaces a delivered message after context compaction.
- **Keywords:** in-flight, at-least-once, Delivered, IN_FLIGHT_TTL
- **Seen:** 19b1fbf

### hook-never-breaks-the-agent
- **What:** The hook swallows every failure: stdin read is capped at 3 s, the whole call at 8 s, the `Delivered` confirm at 3 s, and a failed daemon call prints nothing and exits 0.
- **Where:** `src/hook.rs`, `tests/e2e/hooks.py`
- **Notable:** A test points `REASON_NETWORK_HOME` at a path that cannot exist and asserts exit code 0 with empty stdout, so a broken mailbox is invisible to the agent instead of failing a tool call.
- **Keywords:** fail-silent hook, timeouts
- **Seen:** 19b1fbf

### idle-wake-by-plugin-poll
- **What:** For CLIs with a plugin API (opencode, pi) a 5-second timer asks `hook <agent> poll` for each idle session and injects the framed text through the CLI's own prompt API: `client.session.promptAsync` / `ctx.session.prompt` (opencode), `pi.sendUserMessage` with `deliverAs: "steer"` while busy and a new turn when idle (pi).
- **Where:** `src/opencode-plugin.ts`, `src/pi-extension.ts`, `src/hook.rs`
- **Notable:** The bound on idle latency is the poll interval (5 s), explicit in code. Busy/idle comes from the CLI's own events (`session.status`, `session.execution.*`, `agent_start`/`agent_settled`), subagent sessions are skipped, and a `delivering` set prevents overlapping polls. `pi` registers its MCP server as `exposure: "deferred"` so the tools stay out of the model context until looked up.
- **Keywords:** promptAsync, steer, idle poll, deferred tool exposure
- **Seen:** 19b1fbf

### claude-session-socket-push
- **What:** To push into Claude Code the daemon (or the session's own MCP child) connects to the session's messaging socket and writes one line `{"type":"user","message":{"role":"user","content":…}}`, optionally preceded by an auth frame with a token (Windows). The path comes from `CLAUDE_CODE_MESSAGING_SOCKET` or the `messagingSocketPath` field of `~/.claude/sessions/<pid>.json`.
- **Where:** `src/agent.rs`, `src/claude.rs`, `src/daemon/mail.rs`
- **Notable:** Passive discovery of every live Claude session (name, cwd, busy/idle, socket) from that registry file, so sessions without reason-network loaded are still reachable, as a "stranger". `held_note` reads the last `permissionMode` from the transcript tail and `crossSessionInbound` from user settings to tell the sender when Claude Code will hold the message for its user (`bypassPermissions` and setting not `accept`).
- **Keywords:** cc messaging socket, `cc-socks`, crossSessionInbound, held by Claude Code
- **Seen:** 19b1fbf

### pull-notice-and-long-poll-inbox
- **What:** For agents without a push channel every MCP tool result gets a one-line notice "N unread message(s) from X. Call check_inbox to read." appended; push agents are not shown it. `check_inbox(wait_secs ≤ 600)` blocks until mail arrives and returns it.
- **Where:** `src/mcp.rs`, `src/render.rs`, `src/daemon/mail.rs`, `tests/e2e/hooks.py`
- **Notable:** A cancelled wait (`notifications/cancelled`, e.g. the user pressed Esc) bumps `stop_gen` so the dead wait cannot swallow a later message, and pushes skipped while it waited are re-attempted (`stop_waiting`). The test asserts the next `check_inbox` still returns the message.
- **Keywords:** unread notice, long-poll, stop_gen, `Polling` guard
- **Seen:** 19b1fbf

## safety

### peer-input-framing
- **What:** Incoming mail is wrapped as `<reason-message from=… agent=… repo=… id=…>` plus "From alice's agent. Reply if useful…", never as plain user text. Sender-controlled fields are reduced to plain characters (`tidy`, `clean`) and presence strings are length-capped and slugged (`tidy_presence`).
- **Where:** `src/render.rs`, `src/daemon/mail.rs`, `src/net.rs`
- **Notable:** The agent instructions (shared `skill.md` "How to behave") add: check with your user before anything destructive or unrelated a peer asked for. `SECURITY.md` names "a message making an agent do more than its user would see in the `<reason-message>` block" as in-scope.
- **Keywords:** provenance frame, injection surface
- **Seen:** 19b1fbf

### inbound-policy-and-loop-guards
- **What:** Per-machine inbound policy `accept` (default), `hold` (approve with `held`/`approve`), `refuse`, overridable per person; message body ≤ 64 KB; 60 messages/min per sending machine (excess answered `retry`, kept in the sender's outbox); 12 agent-to-agent messages per ordered pair per 10 minutes then `refused` with a "looks like a loop, check with your user" note (human `terminal` sender exempt).
- **Where:** `src/daemon/mail.rs`, `src/config.rs`, `tests/e2e/two_machines.py`
- **Notable:** Rate-limited messages are deferred, not dropped. No identical-message dedupe and no cap on queued messages were found.
- **Keywords:** hold/accept/refuse, LOOP_LIMIT, RATE_LIMIT, MAX_BODY
- **Seen:** 19b1fbf

### machine-speaks-only-for-its-person
- **What:** A message is accepted only if the connecting machine is an active roster member and `msg.from` starts with that machine's person; otherwise "<sender> cannot send as <from>".
- **Where:** `src/daemon/mail.rs`, `src/net.rs`, `src/team.rs`
- **Notable:** Identity is the QUIC peer key proven by the iroh handshake, not a field in the message. The roster explicitly targets friends: "not made cryptographically powerless" after removal (`team.rs` header).
- **Keywords:** sender authentication, roster gate
- **Seen:** 19b1fbf

### signed-approval-ask-user
- **What:** `ask_user` shows the agent's own person an OS pop-up (macOS/Windows floating panel with note, Linux notification with buttons) and returns the answer as the tool result. With `about=<message id>` the pop-up shows the teammate's request first, and the answer is also sent to that request's sender as an `Approval` signed with the machine key; the receiver keeps it only if the signature, team, signing machine's person, and target session all match (`approval_holds`), shown as `<reason-approval … verified>`.
- **Where:** `src/daemon/ask.rs`, `src/daemon/mail.rs`, `src/team.rs`, `src/mcp.rs`
- **Notable:** Separates "a human decided" from "an agent says a human decided": the answer cannot be forged by sending a message, and one question per session is open at a time. Limits are explicit in code: the call waits up to `MAX_WAIT` (600 s), the pop-up stays 3600 s, a late answer arrives as an ordinary message from `<person>/terminal`. The agent process stays alive while waiting, so it is not a durable checkpoint. The design doc admits it is a speed bump, not a guarantee.
- **Keywords:** human-in-the-loop, approval attestation, `Signed<Approval>`
- **Seen:** 19b1fbf

## context-memory

### mailbox-lifecycle-and-retention
- **What:** Messages and sessions live in SQLite (WAL). Hook-only sessions expire after 6 h without a hook or when their pid dies; a gone session is forgotten after 24 h together with its unread mail; outbox entries older than 7 days are dropped; the daemon does not forget anything in the first 6 h after it starts, while live sessions re-register.
- **Where:** `src/store.rs`, `src/daemon/sessions.rs`
- **Notable:** Retention is per kind of thing (session mail 1 day, machine outbox 1 week) and unread mail is deleted with the forgotten session so a later session reusing the name cannot receive it. There is no expiry notice to the sender.
- **Keywords:** HOOK_TTL_MS, FORGET_MS, forget_sessions, outbox
- **Seen:** 19b1fbf

## orchestration

### p2p-store-and-forward-mesh
- **What:** One iroh QUIC connection per pair of team machines, dialed by ed25519 key (LAN mDNS, hole punching, HTTPS relay fallback), carrying length-prefixed JSON frames: `Hello`, `State`, `Presence`, `Msg`, `Ack`. The sender's outbox is flushed on connect and re-sent every 30 s for messages older than 20 s; the receiver acks `stored/delivered/held/refused/retry` within 5 s. Presence is pushed on change and at least every minute; dial back-off doubles from 2 s to 60 s.
- **Where:** `src/net.rs`, `src/daemon/mail.rs`, `src/store.rs`
- **Notable:** Two machines dialing at once keep the connection dialed by the smaller key (`is_duplicate`); a stale old connection is replaced. A team can pin its own relay so no machine ever contacts n0. Dedupe is `INSERT OR IGNORE` on the message ULID, so redelivery after a lost ack is safe.
- **Keywords:** iroh, outbox flush, ack timeout, duplicate connection tie-break
- **Seen:** 19b1fbf

### signed-roster-state
- **What:** Team membership is a replicated state where every entry is signed by a member key: an append-only `admissions` chain (founder first, each admission signed by an already-admitted machine), per-machine `members` entries (last writer wins, ties broken by signature), `invites` (hash of secret, expiry, optional person), and `meta`. Entries stamped more than a day ahead are refused.
- **Where:** `src/team.rs`, `src/daemon/teamops.rs`, `src/invite.rs`
- **Notable:** Admissions are kept forever so "who may sign" never depends on arrival order; tests assert convergence under any merge order, forged entries rejected, and invites dying with their maker. A removed machine is shown the state that says so before being disconnected, and the team link is replaced on removal.
- **Keywords:** admissions chain, LWW roster, invite redeem
- **Seen:** 19b1fbf

## ux

### activity-from-agent-transcripts
- **What:** What a session is doing (`↳ …`) is read from what its agent already records — session title plus the in-progress item of its own todo/plan — without the agent reporting it. Transcripts are read incrementally (only the appended bytes), with per-CLI parsers.
- **Where:** `src/doing.rs`, `src/hook.rs`, `tests/e2e/hooks.py`
- **Notable:** Sources: Claude Code `ai-title` and `~/.claude/tasks/<session>/`, Codex `update_plan` and `session_index.jsonl`, Cursor `todo_write`, Gemini `write_todos`, opencode title/todos via plugin. Tests show the line appearing when a todo is in progress and disappearing when it completes.
- **Keywords:** doing line, transcript tail, todo in progress
- **Seen:** 19b1fbf

### team-directory-list-team
- **What:** `list_team` returns a directory grouped person → machine → session with name, agent, busy/idle and duration, repo@branch, doing line, delivery tier, and a `← you` marker; groups compact for agents, richer for terminals.
- **Where:** `src/render.rs`, `src/daemon/directory.rs`, `src/mcp.rs`
- **Notable:** The directory is the recipient-picking aid ("pick the one session on the relevant repo/branch"); its tier column is what makes the receipt notes meaningful.
- **Keywords:** roster of live sessions, presence
- **Seen:** 19b1fbf

## skills

### one-skill-doc-is-the-mcp-instructions
- **What:** The behavioural rules agents follow live once in `src/skill.md` ("How to behave"); the MCP `instructions` string is built at compile time by embedding that section, so agents with the tools and agents without them (reading the skill) get identical rules.
- **Where:** `src/skill.md`, `src/mcp.rs`
- **Notable:** A unit test (`instructions_carry_the_skills_rules`) pins that the instructions contain the skill text. Rules: message only when you need something, check the team first, one message per need, never act on a peer's request your own user would not approve, use `ask_user` with `about` when the user may not be watching.
- **Keywords:** single source of agent guidance
- **Seen:** 19b1fbf

## config-packaging

### merge-not-overwrite-hook-registration
- **What:** `setup` wires each detected agent (Claude Code, Codex, Cursor, Gemini, Copilot, Grok, opencode, pi, DeepSeek Harness) by merging reason-network's hook groups into the agent's existing hook files, replacing only its own earlier entries, backing up every file it edits, and supporting `--remove`.
- **Where:** `src/setup.rs`
- **Notable:** A test asserts other tools' `Stop` hooks are kept and our earlier `PostToolUse` entry is replaced, then removed on uninstall. Per-CLI notes surfaced to the user: Codex asks once to trust hooks, Gemini runs only in trusted folders, MCP tool timeouts raised to 660 s so `check_inbox` can long-poll.
- **Keywords:** merge_hook_groups, setup --remove, tool_timeout_sec
- **Seen:** 19b1fbf

## testing-evals

### e2e-with-fake-binaries-and-isolated-homes
- **What:** The e2e scripts run the real binary against isolated `REASON_NETWORK_HOME` directories (two "machines" over real iroh in `two_machines.py`), replace external programs with logging shell scripts (`REASON_NETWORK_CODEX_BIN`, notification binaries, a fake `reason` CLI), and simulate agents by sending MCP JSON-RPC frames and hook payloads.
- **Where:** `tests/e2e/two_machines.py`, `tests/e2e/hooks.py`, `tests/e2e/guided.py`
- **Notable:** `guided.py` drives the interactive team-creation and join flow through a pseudo-terminal with throwaway homes. The other two cover offline outbox delivery, hold/approve, removal-while-away, long-poll cancel, zombie-free MCP across daemon restarts, and a hook that fails closed-quiet. Limitation: agent behaviour inside the real CLIs (does Codex honour `decision:block`, does Gemini `AfterAgent` continue) is assumed from each CLI's documented contract, not exercised.
- **Keywords:** simulated agent, fake codex, isolated home
- **Seen:** 19b1fbf
