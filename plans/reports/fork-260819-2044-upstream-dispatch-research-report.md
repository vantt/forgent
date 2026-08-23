# Upstream dispatch/execute research — beegog, repository-harness, pi, herdr-gateway

## Identity resolution
- **"beehive" → `beegog`** (`/home/vantt/projects/beegog`). Confirmed: its skill family is literally `bee-*` (bee-swarming, bee-herding), and `~/.config/beehive/performance.jsonl` is beegog's own perf-telemetry sink (schema `bee-perf/v1`) — "beehive" is the informal name for the bee-branded orchestrator.
- **"repository-harness" → `/home/vantt/projects/research/repository-harness`**, confirmed. Two crates: `harness-cli` (docs/scaffolding installer, not dispatch) and `harness-symphony` (the real execution engine — Rust, spawns agent CLIs as subprocesses/JSON-RPC).
- **"pi"** → found: `/home/vantt/.local/bin/pi` → symlink into `~/.nvm/.../bin/pi`, a standalone lightweight AI-coding-CLI (v0.84.2, multi-provider, `--print`/`--mode json|rpc`/`--no-tools`/`--session-id` flags). It's an *executor* other tools shell out to, not an orchestrator itself — beegog's own sample config lists sibling CLIs (`agy`, `opencode`, `codex exec`) in the same slot shape, `pi` fits that same role (a cheap/fast non-interactive execution target), though no direct reference to `pi` was found inside beegog/repository-harness configs — treat this as inferred, not confirmed usage.
- `multiplexer` (`research/multiplexer`) is **not** a dispatch engine — it's a distill-style reference-learning workspace (`upstreams/{airemote,herdr,ntm,distillery}`), no own code.
- `herdr-gateway` is a mobile-facing **monitoring/remote-control gateway** in front of `herdr` (a terminal multiplexer for agents) — not a dispatch mechanism, but its "self-healing gateway that brings itself back on its own" framing is a relevant reliability idea (see below).

## beegog — dispatch mechanism
Tier-based: every dispatch carries a **tier** (`extraction` / `generation` / `review` / `ceiling`), and `modelForTier` resolves each tier to either a native model alias or an **external CLI adapter**. Config sample (`.bee/config-sample-cli-executors.json`):
- A CLI-shaped slot is declared **gather-only** by contract (`cli_tier_gather_only`): read-only fan-out (file hunts, scans, reviews) goes through it; **cell execution (mutation) never does**. Hard separation between "gather" (safe, parallelizable, cheap) and "execute" (mutating, gated).
- Prompt delivery is explicit and typed: `"promptVia": "stdin"`, command literally documents how to pipe (`"$(cat)"` vs `codex exec -` trailing dash).
- Output is a **framed digest**: stdout is wrapped in `BEE_DIGEST` delimiters per a written "Delegation contract" — the parent never re-reads a subagent's raw scrollback, only the delimited digest. This is the core token-efficiency lever.
- `ceiling` tier is explicitly "kept scarce" — it's not a fixed label at plan time, the **orchestrator judges tier per-dispatch** at dispatch time (mechanical→extraction, normal→generation, integration/high-risk→ceiling), and `bee status` **warns when too many cells sit on ceiling** (cost-lever erosion visible as a first-class health signal, not just a log line).
- Fan-out default: strong model orchestrates + dispatches "gather-altitude" steps down-tier, **collecting digests instead of verbatim output**.

Ideas worth stealing for forgentX's `src/runner/dispatch/`:
1. **Gather-only vs execute-only as a contract property of the mechanism**, not just documentation — a CLI-shaped adapter slot could carry a `readOnly`/`mutates` flag that `mechanism.mjs`/`transport.mjs` enforce (sandboxed flags required, refuse to route a mutating dispatch through a gather-only adapter).
2. **Per-tier dispatch health as a visible metric** (`bee status`'s "too many cells on ceiling" warning) — forgentX's `fgos gain`-equivalent could warn when out-of-process dispatch is landing on the most expensive tier too often, not just report totals after the fact.
3. **Digest framing over raw stdout** — a delimiter convention the transport layer parses so the caller never holds the full subprocess scrollback in context, directly serves "ít token."

## repository-harness / harness-symphony — dispatch mechanism
Rust binary, two adapters (`custom`, `codex`) behind one `run_agent()` dispatcher (`agent.rs`):
- `custom` adapter: simple `Command::new(...).output()` — blocking, fire-and-forget, only exit status + stderr matter.
- `codex` adapter: **long-lived JSON-RPC session over stdio** (`stdin`/`stdout`/`stderr` piped, a dedicated reader thread streams stdout lines into an `mpsc` channel so the main loop never blocks on I/O). Every line is durably appended to `APP_SERVER_EVENTS.jsonl` before being parsed — the raw transcript is always on disk before any interpretation happens, so a crash mid-parse never loses the audit trail.
- **Liveness reconciliation instead of a blind timeout**: instead of killing the child after N seconds of silence, it sends an explicit `thread/turns/list` state-query request and only kills if *that* also goes unanswered for `CODEX_IDLE_RECONCILE_SECONDS` (30s prod / 1s in tests). This avoids false-positive kills on turns that are legitimately still working but between events — a concrete answer to "stable/chắc chắn."
- Explicit `terminate_child()` on every exit path (success, error, unsupported request) — no leaked child processes.
- Environment contract instead of argv: `HARNESS_DB_PATH`, `HARNESS_RUN_ID`, `HARNESS_RUN_MODE` passed via `.env(...)` on the spawned `Command`, so the executed worktree process can self-locate state without parsing flags.
- Fully scripted test harness: the codex adapter's tests fake the app-server as a tiny shell script that `read`s lines and `printf`s canned JSON-RPC — the whole reconciliation/idle/failure state machine is tested without a real subprocess dependency on an LLM CLI.

Ideas worth stealing:
1. **Idle-reconciliation-before-kill** — forgentX's out-of-process `execute` path (whatever currently guards a hung executor CLI) should query real liveness before terminating, not just time out blindly; this is the single highest-value reliability idea found.
2. **Write raw transcript line-by-line before parsing** — durability of the audit trail independent of parse success.
3. **Env-var contract over argv for run identity** (`HARNESS_RUN_ID`, `HARNESS_RUN_MODE`) — keeps the command line short/stable across executor variants, cheaper to log too.
4. **Shell-script fake-server test pattern** — cheap, fast, no live CLI dependency, and it tests the actual JSON-RPC state machine, not just "did the process exit 0."

## `pi` CLI
Standalone lightweight assistant, not an orchestrator. Notable design points worth noting for any executor adapter forgentX might shell out to:
- `--mode json|rpc` for structured non-interactive output (vs plain text) — parseable without regex-scraping stdout.
- `--session-id`/`--session-dir`/`--fork` — first-class session addressing built into the CLI itself, so a caller doesn't need to invent its own session-tracking wrapper.
- `--no-tools`/`--tools <allowlist>`/`--exclude-tools <denylist>` — capability scoping is a CLI flag, not something the caller has to sandbox externally.

## beegog perf schema (`~/.config/beehive/performance.jsonl`, `bee-perf/v1`)
One JSON line per session: `session_id`, `project`/`project_name`, `branch`, `started_at`/`ended_at` (ISO) + `started_ms`/`ended_ms` (epoch, cheap to sort/diff) + `running_time_ms`, `parallel` (bool), `subagent_count`, `event_count`, `logged_at`. Token accounting is nested **per model name**, split `input`/`output`/`cache_write`/`cache_read`/`new`/`cached`/`total`, with a **separate `subagent_models` rollup** distinct from the top-level `models` — so a session's own token spend vs. its dispatched-out spend are never conflated in one number. This is a directly reusable shape for an "ít token, theo dõi đơn giản" dispatch-execute log.

## Unresolved
- Could not confirm any actual config wiring of `pi` inside beegog/repository-harness (only inferred it fits the same executor-CLI slot shape); if precision matters, would need to grep beegog's live `.bee/config.json` (not the sample) or ask the user directly.
