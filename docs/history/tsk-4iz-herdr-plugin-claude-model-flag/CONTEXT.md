# CONTEXT — tsk-4iz: herdr-plugin claude launch missing `--model`

Item: `tsk-4iz`. Source request (raw, untrusted per RUL45): "'herdr-plugin'
khi làm việc orchestration (kích hoạt các skill của fgos) khi bật claude đã
không set model, cần set model thành sonnet trong lời gọi claude."

## Feature boundary

Every place `herdr-plugin` spawns a `claude` process into a pane — the
single-id launches (`run_argv_for_command`, used by `/fgOS:pick` and
`/fgOS:discover` via `run_argv`/`discover_run_argv`) and the no-id pool-sweep
launches (`loop_run_argv`, used by `/fgOS:merge-loop`/`/fgOS:retro-loop`/
`/fgOS:cleanup-loop`) — currently builds the command string with no
`--model` segment at all (`herdr-plugin/src/pick.rs:92-108`, `:140-147`).
This item adds one, so every herdr-plugin-launched `claude` session is
pinned to a known model instead of whatever the bare `claude` CLI resolves
as its own default. Out of scope: any invocation NOT built by this file
(a person typing `claude` by hand in a shell keeps using their own default).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is every `claude` invocation herdr-plugin's own argv builders construct — both `run_argv_for_command` (pick/discover) and `loop_run_argv` (merge/retro/cleanup-loop) — not a subset. Locked during submit-time confirmation with the user (this session, pre-`fgos submit`): user picked "Confirm as-is" over a narrower/hardcoded alternative. |
| D2 | Configurable via a new env var mirroring the existing `FGOS_HERDR_SKIP_PERMISSIONS` precedent (`pick.rs:75-80`, `skip_permissions_enabled()`) — read once per launch, never cached, threaded as a plain argument into the pure argv builders (never read from env inside them, so they stay unit-testable the same way `skip_permissions_enabled` already is tested via its plain-bool parameter). Same user confirmation as D1. |
| D3 | Default value is the short alias `sonnet`, not a full model id (`claude-sonnet-5`) — matches this exact repo's own already-established `--model` usage: `.fgos/config.json`'s `runner.executor.args`/`capacities.*.args` all use `["--model", "{model}"]` with alias-shaped literals, and `.fgos/events.jsonl` shows a real executed invocation `claude -p '...' --model haiku ...` (short alias, not a full id). No new naming convention introduced. |

## Pinned terms

- "herdr-plugin's claude launch" = the `Command::new(herdr_bin).args(run_args)` calls in `herdr-plugin/src/pick.rs` that spawn a NEW `claude` process (via `herdr pane run <pane_id> "claude ..."`), not `herdr_bin` itself (that's the `herdr` binary, unrelated).

## Scout evidence cited

- `herdr-plugin/src/pick.rs:92-108` (`run_argv_for_command`) and `:140-147`
  (`loop_run_argv`) — both `format!()` calls confirmed to omit `--model`
  entirely; `grep -n "model" herdr-plugin/src/*.rs` returns zero hits
  outside this item's own research/context docs.
- `herdr-plugin/src/pick.rs:75-80` (`skip_permissions_enabled`) — precedent
  pattern for env-var-driven, plain-bool-threaded flag construction, to be
  mirrored for `--model`.
- `.fgos/config.json` (repo root) — every `claude` spawn fgOS's own runner
  builds already uses `["-p", "{prompt}", "--model", "{model}", ...]`,
  confirming `--model <alias>` is this repo's own established, real
  invocation contract, not an external unknown.
- `.fgos/events.jsonl` — live dispatch log confirms the same shape actually
  executed (`claude -p '...' --model haiku ...`).
- Full round recorded in `docs/history/tsk-4iz-herdr-plugin-claude-model-flag/RESEARCH.md`
  (`fgos-researching`, stage `discovery`, 2026-08-11).

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` returned
`gitnexus` as `present` — ran `mcp__gitnexus__impact(target:
"run_argv_for_command", direction: "upstream")` against repo
`/home/vantt/projects/forgentX`. Result: 10 impacted symbols, risk label
`HIGH` (GitNexus's own heuristic — driven by fan-out count: `run_argv` /
`discover_run_argv` (depth 1) → `open_pick_pane` / `open_discover_pane` +
4 existing unit tests (depth 2) → 2 more existing tests (depth 3)). Every
depth-1/2/3 hit is either a thin wrapper that already forwards a
`skip_permissions: bool` parameter the same shape a new `model: &str`
parameter would take, or an existing test in this same file that a
signature change would need updating — no caller outside `pick.rs` itself.
**Caveat (CLAUDE.md's degraded posture):** this workspace's GitNexus index
(`/home/vantt/projects/forgentX`) is reported **625 commits behind HEAD** —
`impact-analysis: degraded`. The blast-radius shape above (contained to
`pick.rs`'s own callers/tests, no external caller) is corroborated
independently by the `grep`-based scout above, which is current — both
agree, so the finding is trusted, but the staleness gap is named per the
project gate rather than silently assumed fresh.

## Outstanding questions

None
