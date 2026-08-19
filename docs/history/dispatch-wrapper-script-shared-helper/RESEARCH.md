# Research log — reusable wrapper-script helper (tsk-37l)

## Round 1 — 2026-08-19 (discovery stage, fgos-researching helper)

**Asked:** what exactly trips the worktree-isolation guard, and would a
`--prompt-file <path>` flag on `dispatch.mjs execute` (removing the
`$(cat ...)` command substitution) avoid the trip — i.e. is the smallest
real fix "add a flag" or "build a reusable wrapper-generator helper"?

**Checked:**
- `docs/history/worktree-guard-compound-command-prose-fix/RESEARCH.md`
  (tsk-38w's own, full read) — direct quote: "Step B is one logical
  action (dispatch + live-tee its output via Monitor, tsk-37ij) — it
  cannot be split into two calls without breaking the live-tee
  requirement. The actual working mitigation... write the exact command
  into a small wrapper `.sh` file inside the worktree, then invoke that
  single file path through Monitor. This works because a single-file
  invocation has no compound shell syntax for the guard to flag."
- `tsk-3rg` (`fgos show tsk-3rg`, full read): a DIFFERENT compound shape
  (`root=$(git rev-parse ...)` then `node ... --dir "$root"`, no pipe, no
  `$(cat ...)`) also tripped the guard — confirms the trigger is not
  specific to `$(cat ...)` or to the literal word `git`; both a
  git-rooted two-statement resolve and a git-free `--prompt "$(cat
  ...)" | grep` pipeline tripped it independently. tsk-3rg's own fix
  (split into two separate tool calls) works there because the two steps
  are genuinely independent; it does NOT transfer to Step B's live-tee
  case, per tsk-38w's own finding above.
- `src/runner/dispatch/cli.mjs` (full read of the `execute` flag parsing,
  line 591: `prompt: flagValue('--prompt') ?? ''`) — confirmed no
  `--prompt-file` flag exists today; only `--prompt <text>` is accepted.

**Found:** the evidence from two independent real refusals (tsk-3rg's
git-rooted two-statement resolve, tsk-38w's git-free `--prompt
"$(cat...)" | grep` pipeline) both point to the guard flagging shell
SYNTAX COMPLEXITY at the top level of the command it inspects (multiple
statements, a pipe, a command substitution) rather than specifically the
presence of `git` or specifically `$(cat ...)`. Removing `$(cat ...)` via
a hypothetical `--prompt-file` flag would still leave the `| grep -E ...`
pipe (required by Monitor's own "filter the tee, never pipe it raw"
guidance) in the same single command — there is no positive evidence this
alone would avoid the trip, and tsk-38w's own already-accepted resolution
explicitly treats the SINGLE-FILE invocation (not a narrower flag) as the
one shape confirmed to satisfy the guard. A `--prompt-file` flag would
also do nothing for the OTHER observed wrapper-script cases found in the
scratchpad audit that are not prompt-related at all (e.g. `run-verify.sh`,
`run-gate-check.sh`, the `codex-*-test.sh` probing scripts, `run2a...
run2e.sh`) — those are unrelated commands hitting the same guard for
unrelated reasons, which a prompt-specific flag cannot address.

**Verdict:** clear. The originally-submitted scope is confirmed correct,
not a false premise to redirect away from: build one small, reusable
helper that performs the "write the exact command to a wrapper .sh file,
chmod it, print/return the single-file invocation" step — general enough
to cover ANY command shape a caller needs wrapped (dispatch prompts,
verify probes, gate-check calls), not scoped narrowly to `dispatch.mjs
execute`. This generalizes tsk-38w's own single-purpose fallback into a
reusable primitive instead of leaving every future session (as the
scratchpad audit already showed, 12+ times across dispatch/verify/gate-
check/probing use) to hand-author the same three-line `.sh` file pattern
from scratch each time.
