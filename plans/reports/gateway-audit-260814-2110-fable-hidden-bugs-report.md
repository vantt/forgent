# fgOS Gateway Subsystem Audit — Hidden Bugs (fable review)

**Parent task:** tsk-1zg | **Date:** 2026-08-14 | **HEAD at review:** f8c9f135

## Method

1. `haiku`-model agent scanned all fgOS work items (`fgos list --all --json`), source
   (`herdr-plugin/src/gateway.rs`, `mcp.rs`, `ports.rs`, `lib.rs`, `main.rs` gateway
   wiring), the OpenAPI contract (`docs/contracts/fgos-gateway-api-v1.yaml`), and
   `docs/history/fgos-interface-daemon/`, `docs/history/fgos-gateway-mcp-surface/`,
   `docs/history/herdr-web-dashboard/` for everything already touching the gateway
   subsystem. Full inventory:
   `/tmp/claude-1000/-home-vantt-projects-forgentX/92186483-f1b6-4890-9502-f3e64e38bcdf/scratchpad/gateway-scan.md`
   (not committed — scratch only).
2. `fable`-model agent read the core mechanics in full (`gateway.rs`, `mcp.rs`,
   `ports.rs`, `lib.rs`, the gateway-wiring sections of `main.rs`, the OpenAPI
   contract) looking for NEW hidden issues not already in the scan's inventory
   (e.g. tsk-7l9-3's known footprint-conflict decompose gate, the documented
   `sessionSlots` scope gap, STR38/STR48, D9's deliberate sandbox deprioritization
   were all excluded as already-tracked).
3. I (orchestrator) spot-verified Findings 1 and 2 (both `high`) directly against
   current source (quoted lines below match `git show HEAD:<file>` at review time)
   before turning any finding into a work item — same standard as the prior
   worktree/merge audit (`worktree-merge-audit-260814-1809-fable-hidden-bugs-report.md`).
   Findings 3–9 carry the same evidence-with-line-numbers standard but were not
   independently re-read line-by-line by me; findings 3, 4, 7 additionally rest on
   documented library defaults (std `.output()` has no timeout; Rhai's default
   `max_operations` is unlimited; axum 0.8's rejection-body behavior) not re-proven
   by live experiment in this pass.

Each finding below became a child work item under **tsk-1zg** (`fgos submit --parent
tsk-1zg`). None have been fixed yet at report time — this report is the "what to
change" record; the child items are where implementation gets tracked.

---

## Finding 1 — tsk-4uh (severity: high) — spot-verified

**Every gateway route is served WITHOUT the `/v1` prefix the contract's server URL
and the gateway's own startup log both advertise — a contract-compliant client 404s
on every call.**

`herdr-plugin/src/gateway.rs:699-724` mounts bare paths (`Router::new().route("/work", ...)`
etc.), no `.nest("/v1", ...)` exists anywhere in the crate (confirmed: `rg -n
'\.nest\(' herdr-plugin/src/gateway.rs` returns zero matches). Yet `gateway.rs:739`
logs `"fgOS gateway listening on http://{addr}/v1 ..."`, and
`docs/contracts/fgos-gateway-api-v1.yaml:54-59` declares `servers: - url:
http://localhost:{port}/v1`.

**Failure scenario:** any client that follows the contract (reads `servers.url`,
appends a `paths` key, e.g. `GET http://localhost:4170/v1/work`) gets 404 on every
route, including the unauthenticated `/v1/contract` URL printed at startup. The
152-test suite never catches it because every inline test requests unprefixed URIs.
The first real external client (tsk-54j's web dashboard, spec'd as "an independent
client calling gateway's REST API") hits this immediately.

**Suggested direction (fable's raw output):** wrap the whole router in
`.nest("/v1", ...)`, add a test that requests a `/v1/...` path.

---

## Finding 2 — tsk-og6 (severity: high) — spot-verified

**`spawn_fgos_verb` passes `--dir <root>` but never sets `current_dir(root)` on the
child process — two fgos verbs resolve their repo root from `process.cwd()` instead
of `--dir`, so they silently act on whatever directory the gateway process happens
to be launched from.**

`herdr-plugin/src/gateway.rs:257-261` spawns `node bin/fgos.mjs ... --dir <root>`
with no `.current_dir()` call. Contrast `post_runner_tick` (`gateway.rs:616-623`),
which DOES set `.current_dir(&root)` because "fgos-runner resolves its own repo
root from the process's current working directory" — proving the hazard was already
known for that call site, just not generalized. Confirmed by direct read:

- `bin/fgos.mjs:4559` (`session` verb): `const repoRoot = process.cwd();` — `--dir`
  is ignored entirely by `session start/end/list/gc`.
- `bin/fgos.mjs:1497` (`move --to delivered`'s unmerged-branch guard, tsk-5dk):
  `const repoRoot = process.cwd();` — branch-reachability is checked against the
  gateway's launch dir, not `--dir`.

**Failure scenario:** `herdr-fgos gateway` launched from
`/home/vantt/projects/forgentX/herdr-plugin` (a subdir — `root` still resolves
correctly via git-common-dir, so every `--dir`-aware route looks fine). A client
calls `POST /sessions` → `fgos session start` runs with cwd = `herdr-plugin/` →
writes its sessions registry under `herdr-plugin/.fgos/`, a store path nothing else
reads — the worktree gets created and registered invisibly, `session list`/`session
gc` against the real root never see or reclaim it. Same class: `POST
/work/{id}/move {"to":"delivered"}` runs the tsk-5dk unmerged-branch guard against
the wrong repo.

**Suggested direction (fable's raw output):** add `.current_dir(root)` to
`spawn_fgos_verb` — one line, makes the chokepoint's "no call site can forget
`--dir`" guarantee actually cover the cwd-resolving verbs too.

---

## Finding 3 — tsk-4lf (severity: medium) — not independently re-verified

**No timeout, cancellation, or concurrency bound anywhere on the verb chokepoint —
one wedged `fgos` subprocess pins a blocking-pool thread and a node process
forever; a client disconnect cancels nothing.**

`gateway.rs:257-261` uses blocking `.output()` with no timeout; `run_verb_blocking`
(`gateway.rs:301-308`) is a bare `spawn_blocking` with no deadline; nothing kills
the child if the HTTP request is dropped.

**Failure scenario:** `POST /work/{id}/approve` wraps `fgos approve`, which per the
worktree/merge audit (tsk-1mn evidence) can run `npm ci` twice and legitimately
exceed 3 minutes on a cold cache. A dashboard client with a 30s HTTP timeout gives
up and retries, stacking racing approves. Worse, a genuinely wedged verb pins its
blocking thread permanently; tokio's blocking pool caps at 512, after which every
route (including cheap reads) queues behind dead threads.

**Suggested direction:** per-spawn deadline (`tokio::process::Command` +
`tokio::time::timeout` + `kill_on_drop`) mapped to existing error categories, plus
optionally a semaphore capping concurrent verb spawns.

---

## Finding 4 — tsk-1qe (severity: medium) — not independently re-verified

**MCP `execute`'s Rhai engine has no operation/time limit and an unbounded print
buffer — one `loop {}` script wedges a blocking thread forever.**

`mcp.rs:179-186`: `Engine::new()` never calls `set_max_operations`/`on_progress`
(Rhai's default is unlimited operations); captured print output is an uncapped
`Vec<String>`. `mcp.rs:376-380` runs the script via `spawn_blocking` with no
timeout.

**Explicitly NOT reopening D9** (which deprioritizes sandbox *privilege* hardening
for v1) — this is an availability gap (an ordinary LLM generation bug, e.g. `let x
= 0; loop { x += 1; }`), not a privilege escape. Same root cause class as Finding 3
(unbounded blocking-pool consumption) but a different fix lever (engine limits, not
subprocess timeouts).

**Suggested direction:** `engine.set_max_operations(...)` or `on_progress` with a
wall-clock deadline, plus a cap on the print-buffer size.

---

## Finding 5 — tsk-1ah (severity: medium-low) — not independently re-verified

**Argv flag injection: any user-supplied string beginning with `--` is
reinterpreted by the CLI's parser as a flag — `parseArgs` has no `--`
end-of-flags sentinel.**

Gateway passes user strings as bare argv elements (submit text, ids,
`body.to`/`expect`/`reason`/`role`, query params — `gateway.rs:373-503`,
`mcp.rs:189-298`). `bin/fgos.mjs:358-377`: any leading-`--` element becomes a flag
regardless of position.

**Failure scenario:** `POST /v1/work {"text": "--force"}` → argv `["submit",
"--force", "--json", "--dir", root]` — the "text" silently becomes a boolean
`force` flag. Mitigating accident: gateway appends `--dir <root>` LAST and
`parseArgs` last-wins, so an injected `--dir` can't redirect the store. Severity
tempered today by per-machine token trust, but tsk-54j's web dashboard is about to
front browser-mediated input through this boundary.

**Suggested direction:** reject leading-`-` values at the gateway for
id/enum-shaped fields, and/or teach `parseArgs` a `--` sentinel the gateway always
emits before positional user text.

---

## Finding 6 — tsk-5m1 (severity: medium-low) — not independently re-verified

**The contract's `X-Fgos-Writer-Id`/`X-Fgos-Writer-Role` attribution headers are
dead: the gateway never reads them, and the CLI has no flag to forward them into —
every gateway write is attributed to the daemon process itself.**

`fgos-gateway-api-v1.yaml:586-604` declares both headers on every write op
("Forwarded into the underlying CLI call's `writer.id`"). No read of either header
anywhere in `herdr-plugin/src/*.rs`; `bin/fgos.mjs` exposes no writer-id override
flag.

**Cross-check:** NOT the STR38 identity/authentication gate (tracked, out of
scope) — the contract itself pins these headers as "attribution only"; that
promise is the part that silently doesn't exist.

**Failure scenario:** a human approves an item from the future dashboard; another
item is approved by an automated MCP script. The event log records the same
daemon-process writer for both — "who approved this" becomes unanswerable exactly
where it matters most.

**Suggested direction:** implement end-to-end (read headers → new CLI
`--writer-id`/`--writer-role` flags, same validation `take --role` does) or delete
the parameters from the contract.

---

## Finding 7 — tsk-4qf (severity: medium-low) — not independently re-verified

**Non-2xx responses aren't always the contract's `ErrorEnvelope`, auth failures are
indistinguishable from validation errors, and the yaml declares no
`securitySchemes` while contradicting its own auth description.**

Three related drifts: (1) axum extractor rejections (malformed JSON, bad
content-type/query) return plain-text bodies, not `ErrorEnvelope` JSON; (2)
`require_token` (`gateway.rs:328-334`) fails auth as category
`"validation"`/HTTP 400, indistinguishable from a real validation error; (3) the
yaml declares no `securitySchemes`/`security` and its top-level description
(`yaml:29-32`) still says the gateway doesn't gate callers — contradicting D4 and
the yaml's own `/contract` section (`yaml:82-84`).

**Failure scenario:** dashboard sends a request with a stale token → 400 +
category `validation` → its error UI tells the user their submission text is
invalid; user retries forever instead of re-authenticating.

**Suggested direction:** custom extractor-rejection mapping into `ErrorEnvelope`;
a distinct auth signal; add `securitySchemes: bearerAuth` + `security` to the yaml
and fix the contradictory sentence.

---

## Finding 8 — tsk-67gr (severity: low) — not independently re-verified

**Contract's `takeWork` role enum promises `runner`; the CLI refuses it.**

`yaml:280-286` declares `enum: [human, runner, session]`; `bin/fgos.mjs:2707-2710`
throws a validation error for anything but `human`/`session`.

**Suggested direction:** drop `runner` from the contract enum (the pull door
deliberately excludes the runner role today) or teach `take` to accept it —
whichever way, spec and CLI must agree.

---

## Finding 9 — tsk-4r1 (severity: low) — not independently re-verified

**`gateway.token`/`gateway.port` are registered nowhere in `fgos setup`'s
config-merge or `fgos doctor`'s checks — the gateway's own error message tells
users to run `fgos setup`, which will not provision the token.**

`gateway.rs:76-79` tells users to run `fgos setup`; `src/setup/registrations.mjs`
has zero `gateway` entries, so the config file is created WITHOUT a `gateway`
section and `fgos doctor` has no check for it — violates AGENTS.md's install/
setup/doctor gate (a new config default "must register into `fgos setup`'s
config-merge and `fgos doctor`'s check registry").

**Failure scenario:** fresh machine → user follows the gateway's own error message
→ runs `fgos setup` → starts the gateway again → identical `MissingToken`
refusal, no tool can diagnose or fix it. Users hand-type low-entropy tokens on a
boundary tsk-ldb plans to extend beyond localhost.

**Suggested direction:** register a `gateway` default section (port; token
generated with crypto randomness at setup time) into the setup registry plus a
doctor check; update the error message to match.

---

## Minor notes (not filed as work items)

- `ports.rs:127-131` — `VerbGateway::run_verb`'s doc comment is stale (says it
  "returns its `data` field on exit 0"; the real adapter returns the full
  envelope per CTR001).
- `get_state_digest` (`gateway.rs:547`) fabricates `"contract": "fgos.v1"` when the
  envelope lacks the field — masks a corrupt CLI response as healthy.
- Gateway accepts and forwards `limit=0` even though the contract says
  `minimum: 1` — harmless, but the resulting 400 blames the CLI, not the request.
- `require_token`'s `strip_prefix("Bearer ")` is case/space-exact, stricter than
  RFC 7235 — fine for a machine token, worth one doc line.
- rmcp's `LocalSessionManager` abandoned-session reaping was NOT verified in this
  pass — flagged as unverified, not asserted.

## Verification status

Findings 1, 2, 5, 6, 8, 9 verified directly against current source with the quoted
lines (1 and 2 additionally spot-verified independently by the orchestrator).
Findings 3, 4 rest on the quoted code plus documented library defaults (std
`.output()` has no timeout; Rhai's default `max_operations` is unlimited; tokio's
blocking pool default cap is 512) — not re-proven by experiment in this pass.
Finding 7's extractor-rejection body shape follows from axum 0.8's documented
rejection behavior, also not re-proven by a live request.
