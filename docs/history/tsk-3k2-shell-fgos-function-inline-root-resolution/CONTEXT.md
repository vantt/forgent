# CONTEXT: fgos/fgos-runner shell functions dead in every agent shell

Item: `tsk-3k2`. Written retroactively (same structural gap noted in
`tsk-49u`/`tsk-1d9`'s own CONTEXT.md files — `clarify` jumps straight to
`decompose`).

## Locked decisions

- **D0.** Root cause confirmed by reading `scripts/fgos-shell-
  integration.sh` in full: `fgos()` (:28) and `fgos-runner()` (:48) both
  call a shared private helper, `_fgos_repo_root()` (:19), on their own
  second line. The harness that snapshots an agent session's shell
  functions (out of this repo's control — a Claude Code implementation
  detail, not something `scripts/fgos-shell-integration.sh` can configure)
  keeps `fgos`/`fgos-runner` but drops `_fgos_repo_root` — the leading
  underscore is what triggers the filtering (matches zsh's own convention
  of treating `_`-prefixed names as completion functions, per the scan
  report). The two public functions survive; their one shared dependency
  does not.
- **D1.** The designed fallback (real PATH install when no local
  `bin/fgos.mjs`) cannot rescue this: death happens at line 2 of each
  function body (`root=$(_fgos_repo_root) || return 1`), before the
  fallback branch further down is ever reached.
- **D2.** Fix chosen: inline `_fgos_repo_root`'s 6-line body directly into
  both `fgos()` and `fgos-runner()`, removing their dependency on the
  separately-named helper entirely. This is deliberately NOT a DRY
  violation worth avoiding here — the whole point of the fix is that the
  helper doesn't survive whatever mechanism filters it, so keeping the two
  public functions self-contained is the only way to make them robust to
  that filtering, whatever exactly triggers it. Removed `_fgos_repo_root`
  itself rather than leaving it defined-but-now-unused: confirmed via
  `grep -rln "_fgos_repo_root" src bin scripts test .claude .agents
  plugins docs` that nothing else in the repo calls it (only mentions in
  historical docs and this scan report), so an orphaned "looks
  load-bearing but isn't" helper would only mislead a future reader.
- **D3.** `test/scripts/fgos-shell-integration.test.mjs`'s existing 9
  tests all `source` the whole script fresh and never isolate
  `_fgos_repo_root` — none of them would have caught this bug, which is
  exactly why it shipped undetected. New test: after sourcing, explicitly
  `unset -f _fgos_repo_root` (simulating what the harness's snapshot
  filtering effectively does to a real agent shell, without needing to
  reproduce Claude Code's actual harness internals) and confirm `fgos`/
  `fgos-runner` still resolve and invoke correctly.

## Outstanding questions

None
