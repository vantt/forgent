# RESEARCH — tsk-4iz: herdr-plugin claude launch missing `--model`

## Round 1 (2026-08-11, fgos-researching, stage `discovery`)

**Asked:** Is `claude --model <name>` a real, supported invocation shape,
and what pattern does this repo already use for it? (goal: confirm the
requested fix — add `--model` to herdr-plugin's own `claude` spawns — is
buildable against a real CLI contract, not an assumption.)

**Checked (repo):**
- `herdr-plugin/src/pick.rs:92-108` (`run_argv_for_command`) and
  `:140-147` (`loop_run_argv`) — confirmed neither builds a `--model` arg
  anywhere; both only conditionally add `--dangerously-skip-permissions`
  before the single-quoted slash-command string. `grep -n "model" herdr-
  plugin/src/*.rs` returns zero hits outside this research.
- `herdr-plugin/src/pick.rs:75-80` (`skip_permissions_enabled`) — the
  precedent pattern to mirror: reads `FGOS_HERDR_SKIP_PERMISSIONS` from
  env once per call (never cached), returns a plain `bool` threaded
  explicitly into the pure argv builders (never read from env *inside*
  them, for testability).
- `.fgos/config.json` (repo root, `runner.executor.args` and every
  `capacities.*.args` entry) — every `claude` invocation fgOS's own runner
  already builds uses the shape `["-p", "{prompt}", "--model", "{model}",
  "--permission-mode", "acceptEdits", ...]`, where `{model}` is a
  placeholder later resolved to a name like `sonnet`/`haiku`/`opus`. This
  confirms `claude ... --model <name>` is the real, already-in-use
  invocation contract in this exact codebase — not an external unknown.
- `.fgos/events.jsonl` (grep `--model`) — live dispatch log lines confirm
  the same `--model {model}` shape actually executed (e.g. `claude -p
  '...' --model haiku ...`).

**Found:** No external lookup needed — this is a same-repo, already-
established CLI contract. The fix is mechanical: add a `--model <name>`
segment to the `format!()` strings in `run_argv_for_command` and
`loop_run_argv`, sourced from a new env var (e.g. `FGOS_HERDR_MODEL`,
default `"sonnet"`) resolved the same way `skip_permissions_enabled()`
resolves `FGOS_HERDR_SKIP_PERMISSIONS` — read once per launch, passed as a
plain argument into the pure argv builders, never read from env inside
them.

**Still open:** None for intent/feasibility. Naming detail deferred to
`fgos-planning` (exact env var name, default value literal, and whether it
sits before or after `--dangerously-skip-permissions` in the built
command string are implementation choices, not scope gaps).

**Verdict:** `clear` — verify: `cargo test --manifest-path herdr-plugin/Cargo.toml pick::`
