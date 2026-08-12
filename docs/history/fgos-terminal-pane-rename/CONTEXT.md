# CONTEXT: fgOS terminal pane rename + pick show-description (tsk-62x)

## Feature boundary

Two child pieces, both scoped to a session already running inside a
herdr-managed pane:

1. A new `/fgOS:terminal` skill whose first verb is `rename`: detects
   whether the session is running inside herdr (`test "${HERDR_ENV:-}" =
   1`, per `upstreams/herdr/SKILL.md` and the existing
   `docs/operator-runbook-herdr-cockpit.md` gate), and if so renames the
   current herdr pane to a label built from the claimed task id and two
   session identities.
2. `/fgOS:pick` (`plugins/fgOS/skills/pick/SKILL.md`) calls that new skill
   right after claiming an item, then shows the claimed item's task
   description, before proceeding to its existing `EnterWorktree` /
   `fgos-routing` handoff steps.

Out of scope: any other `/fgOS:<verb>` skill besides `pick` calling
`/fgOS:terminal`; any herdr verb besides `pane rename` (no `agent start`,
no reading `agent_status` — STR40's chrome-only hard rule stays intact,
see `docs/operator-runbook-herdr-cockpit.md`); a new `fgos` CLI verb (D2
below rules this out explicitly).

## Pinned terms

- **fg.ssid** — fgOS/bee's own session identity: `BEE_SESSION_ID` env var
  if set, otherwise whatever `resolveWriterIdentity()`
  (`src/runner/session-identity.mjs`) resolves for the current process
  (env-confirmed-by-registry, env-unconfirmed, or pid-ancestor fallback).
- **a.ssid** — the concrete coding-agent tool's own native session id
  (e.g. `CLAUDE_CODE_SESSION_ID` for Claude Code). A different env var per
  agent tool; which var to check for which agent is an implementation
  detail for `fgos-coding-planning`, not pinned here.
- **chrome-only** — STR40's hard rule (`docs/operator-runbook-herdr-cockpit.md`):
  herdr commands only arrange/label panes and never become a second
  source of truth for fgOS state or agent status.

## Locked decisions

| ID | Decision |
| --- | --- |
| D1 | The pane label's three segments are taskid, `fg.ssid` (fgOS/bee's own session id), and `a.ssid` (the coding agent tool's own native session id) — two genuinely different identities, not the same value shown twice. Scout evidence: `resolveWriterIdentity()` already reads `BEE_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`/pid as one fgOS-side identity; herdr separately tracks a per-agent native session id (`pane report-agent-session --agent-session-id`, used for native-resume in `docs/distillery/deep-dives/how-to-use-herdr.md` B1). User confirmed explicitly: "tôi thấy fgos có tự tạo ra một session-id riêng ... còn claude hoặc codex ... lại có session-id riêng. tôi muốn cả 3 thứ." |
| D2 | No new `fgos` CLI verb. `/fgOS:terminal rename` calls `herdr pane rename <pane_id> <label>` directly — it never touches `.fgos/` state, so it does not need CTR001's one-door-write pattern the way `pick`/`ask`/`answer` do. Matches STR40: "herdr chỉ làm chrome". |
| D3 | Rename + show-description run **after** `/fgOS:pick`'s existing claim call (`pick` verb, step 2 of `plugins/fgOS/skills/pick/SKILL.md`), and before step 3's `EnterWorktree` switch / `fgos-routing` handoff. This guarantees the taskid segment is always the real claimed id, including the frontier-default case (`/fgOS:pick` with no id argument) where the id isn't known until the claim call returns. "Before doing the main work" in the source request means before the worktree switch/routing handoff, not before claiming. |
| D4 | Label format: `<taskid> \| fg.ssid:<value> \| a.ssid:<value>`, joined with `" | "`. Any segment whose value cannot be resolved is **dropped entirely** (not rendered as a literal `"unknown"`) — e.g. if `a.ssid` can't be determined, the label is just `<taskid> | fg.ssid:<value>`. taskid itself is always present (D3 guarantees it's known before rename runs). User confirmed: "bỏ segment thiếu, thêm prefix cho dễ nhận. ví dụ fg.ssid và a.ssid." |

## Scout evidence cited

- `src/runner/session-identity.mjs` — `resolveWriterIdentity()`, the
  existing fgOS session-id resolution (env var precedence
  `BEE_SESSION_ID` > `CLAUDE_CODE_SESSION_ID`, registry-confirm vs. plain
  env vs. pid-ancestor fallback).
- `docs/distillery/deep-dives/how-to-use-herdr.md` §B1, §B3 — herdr's own
  agent-session tracking (`pane report-agent-session
  --agent-session-id`), the `HERDR_ENV=1` / `HERDR_PANE_ID` gate and env
  contract for driving herdr from inside a managed pane, and `herdr pane
  rename <id> <label>`.
- `docs/operator-runbook-herdr-cockpit.md` — STR40's chrome-only hard
  rule (no `agent start`, no reading `agent_status`), and the existing
  `test "${HERDR_ENV:-}" = 1` detection gate pattern this feature reuses
  unchanged.
- `plugins/fgOS/skills/pick/SKILL.md` — the existing 5-step pick flow
  (claim, hand off to worktree, load `fgos-routing`, report) this feature
  inserts into between steps 2 and 3.
- Existing `/fgOS:<verb>` skills (`pick`, `ask`, `answer`, `move`, ...)
  each wrap exactly one `fgos <verb>` CLI command through
  `src/cli/command-registry.mjs`, per CTR001 one-door-write — the pattern
  D2 explicitly departs from, with reasoning.

## Outstanding questions deferred to planning

- Which env var (or other source) supplies `a.ssid` for coding agents
  other than Claude Code (Codex, etc.) — an implementation detail, not a
  product decision.
- Exact herdr pane-id resolution for the rename call (`$HERDR_PANE_ID` vs
  `herdr pane current`) and error handling when the `herdr` binary itself
  is missing vs. present-but-not-managing-this-pane.
- Whether `/fgOS:terminal` should be shaped as a single-verb skill
  (mirroring `pick`/`ask`) or a multi-verb skill directory anticipating
  future verbs beyond `rename` — the item text says "verb đầu tiên là
  rename" (first verb is rename), implying more may follow, but no second
  verb was named or requested.
