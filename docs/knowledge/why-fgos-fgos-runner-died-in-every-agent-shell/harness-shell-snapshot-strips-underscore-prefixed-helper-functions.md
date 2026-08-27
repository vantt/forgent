---
type: explanation
title: Why fgos()/fgos-runner() died in every agent shell — the harness strips underscore-prefixed helpers
tags: []
source_capture_ids: [tsk-3k2]
framework: diataxis
mode: explanation
---
# Why `fgos()`/`fgos-runner()` died in every agent shell

`scripts/fgos-shell-integration.sh` defines two public shell functions,
`fgos()` and `fgos-runner()`, that every skill/doc/README tells a user
(or an agent) to invoke directly as `fgos <verb>`. In every actual agent
session, both were dead on arrival: `fgos list` failed with `fgos:2:
command not found: _fgos_repo_root`.

## The root cause: a private helper the harness's snapshot silently drops

Both public functions call a shared private helper,
`_fgos_repo_root()`, on their own second line. The agent harness that
snapshots a session's shell functions (a Claude Code implementation
detail, outside this repo's control) keeps `fgos`/`fgos-runner` but drops
`_fgos_repo_root` — the leading underscore is what triggers the
filtering, matching zsh's own convention of treating `_`-prefixed names
as completion functions:

> "the leading underscore is what triggers the filtering (matches zsh's
> own convention of treating `_`-prefixed names as completion functions,
> per the scan report). The two public functions survive; their one
> shared dependency does not."
> — real `docs/history/tsk-3k2-shell-fgos-function-inline-root-resolution/CONTEXT.md`

The two public functions look intact in the snapshot — only their one
shared dependency vanishes, so the failure is invisible until you
actually try to call either function.

## Why the existing fallback couldn't rescue it

The script already had a designed fallback: if the resolved git root has
no local `bin/fgos.mjs`, fall back to a real global PATH install instead
of failing (see the sibling finding,
`docs/explanation/shell-fallback-detection-needs-type-p-not-command-v.md`,
about that same fallback's `type -P` vs `command -v` trap). That fallback
never got a chance to run here: the crash happens at line 2 of each
function body (`root=$(_fgos_repo_root) || return 1`), before the
fallback branch further down the function is ever reached. A real
PATH-installed `fgos` genuinely existed the whole time — the broken
function just never lived long enough to check for it.

## Why this bug is invisible in an interactive human shell

Real interactive zsh (a human typing at a terminal) sources the script
normally and both functions and their helper survive intact — the bug
only manifests once something snapshots/replays the shell's defined
functions selectively, filtering by name convention. That's exactly what
an agent harness does and a human's own interactive shell never does —
so this defect could only ever hit the audience this repo actually
serves (agents), while looking completely fine to anyone testing it by
hand.

## Why the fix doesn't preserve the shared helper

The fix inlines `_fgos_repo_root`'s 6-line body directly into both
`fgos()` and `fgos-runner()`, removing the dependency on the
separately-named helper entirely — deliberately not treated as a DRY
violation worth avoiding:

> "the whole point of the fix is that the helper doesn't survive whatever
> mechanism filters it, so keeping the two public functions self-contained
> is the only way to make them robust to that filtering, whatever exactly
> triggers it."
> — real `docs/history/tsk-3k2-shell-fgos-function-inline-root-resolution/CONTEXT.md`

`_fgos_repo_root` itself was removed rather than left defined-but-unused,
confirmed via a repo-wide grep that nothing else calls it — an orphaned
helper that "looks load-bearing but isn't" would only mislead a future
reader.

## Why the existing tests never caught this

The script's existing test suite sources the whole file fresh in every
test and never isolates the helper — none of those tests could have
caught a bug that only appears once the helper specifically goes missing
while the callers remain. The regression test added alongside this fix
explicitly `unset -f _fgos_repo_root` after sourcing (simulating what the
harness's snapshot filtering effectively does), without needing to
reproduce Claude Code's actual harness internals, then confirms
`fgos`/`fgos-runner` still resolve and invoke correctly.

## The general lesson

Any shell function meant to be called from inside an agent harness
session should not depend on a separately-named private helper if that
helper's name could plausibly match a filtering convention the harness
applies when snapshotting functions (here, a leading underscore matching
zsh's completion-function convention). Self-contained public functions
are more robust to a filtering mechanism this repo doesn't control and
can't configure around.

## Related

- `docs/explanation/shell-fallback-detection-needs-type-p-not-command-v.md`
  — a different bug in the same script's PATH-fallback branch, the one
  this bug prevented from ever being reached.
- `docs/history/tsk-3k2-shell-fgos-function-inline-root-resolution/CONTEXT.md`
  — full decision record (D0–D3).
