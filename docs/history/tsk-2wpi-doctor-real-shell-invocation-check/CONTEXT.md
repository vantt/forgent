# CONTEXT: doctor's shell-integration-sourced check tests text, not reality

Item: `tsk-2wpi`. Written retroactively (same structural gap noted across
this scan's other items — `clarify` jumps straight to `decompose`).

## Locked decisions

- **D0.** Root cause confirmed by reading `src/setup/registrations.mjs`'s
  `checkShellIntegrationSourced` (:241-282) and `hasSourceLine`
  (`src/setup/shell-rc.mjs:41-47`): both only regex the rc file's TEXT for
  a `source`/`.` line naming the integration script's path. Neither ever
  invokes the resulting shell function. A source line can be textually
  present and correct while the function it defines is dead for any
  reason (this scan's sibling item `tsk-3k2`: a harness snapshot dropping
  an underscore-prefixed helper) — the check cannot tell the difference.
  `checkPluginSkillCliReachable` (:712-724) is a second, independent green
  signal that doesn't help either: it checks `bin/fgos.mjs`'s existence or
  a plain `command -v fgos` PATH lookup in a fresh `sh -c` subprocess —
  neither exercises the actual sourced shell FUNCTION at all, so its
  "local bin/fgos.mjs found" message is true of the FILE and silent about
  the function.
- **D1.** Considered testing real invocation via a naive "spawn bash,
  source the script, call `fgos --help`" probe. Verified empirically this
  would NOT catch the tsk-3k2-class bug at all: a plain subprocess never
  strips underscore-prefixed functions (only the harness's own snapshot
  mechanism does that, and this repo has no way to reproduce that
  mechanism exactly) — `bash -c 'source scripts/fgos-shell-integration.sh;
  fgos --help'` exits 0 today even against the still-unfixed (pre-`tsk-
  3k2`) script.
- **D2.** Fix chosen instead: after sourcing the integration script in a
  disposable subshell, diff the function table before/after to find
  exactly which functions sourcing introduced, unset any of THOSE whose
  name starts with `_` (simulating the harness's own filtering, generalized
  rather than hardcoding `_fgos_repo_root`'s name — durable against a
  future underscore-prefixed helper this script might grow), then call
  `fgos --help` and check its exit code. Verified empirically against the
  current, still-unfixed script (this worktree's own copy, branched before
  `tsk-3k2` merged): correctly identifies `_fgos_repo_root` as the
  introduced underscore function, strips it, and reproduces the exact
  live failure (`exit 1`) — while the naive probe from D1 stays green
  throughout. Once `tsk-3k2` merges, nothing is left to strip, and this
  same probe passes cleanly — no coordination needed between the two
  items; each reads whatever `scripts/fgos-shell-integration.sh` is
  actually on disk.
- **D3.** Scope, named honestly: this makes doctor detect "does this
  integration survive its OWN underscore-prefixed helpers being stripped"
  — the exact, specific failure class this scan actually found and
  evidenced. It does not, and cannot, guarantee detection of every
  hypothetical way a downstream harness might filter shell state; that
  would require reproducing Claude Code's own harness internals, which
  are outside this repo's knowledge or control. This is a real, grounded
  improvement over pure text-matching, not a claim of total coverage.

## Outstanding questions

None
