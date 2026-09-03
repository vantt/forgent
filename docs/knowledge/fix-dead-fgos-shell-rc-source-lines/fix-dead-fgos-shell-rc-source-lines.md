---
framework: diataxis
mode: how-to
---
# Fix dead fgOS shell-rc source lines

Symptom: every interactive shell open prints one `no such file or
directory` error per stale line, e.g.:

```
/home/vantt/.zshrc:source:149: no such file or directory: /home/vantt/projects/forgentX/.claude/worktrees/tsk-5z2-xS7g7g/scripts/fgos-shell-integration.sh
```

On the machine where this was first measured, `~/.zshrc` carried 41
`source ".../fgos-shell-integration.sh"` lines — 2 pointing at files that
still exist, 39 pointing at deleted directories (roughly 15% of the file).

## Why this happens

Each dead-path prefix traces to a different piece of fgOS lifecycle that
creates and later removes a checkout copy:

| Prefix | Created by |
|---|---|
| `.claude/worktrees/tsk-*` | `pick`'d per-item worktrees |
| `/tmp/fgos-return-*` | `bin/fgos.mjs:1655` (`return`'s throwaway verify checkout) |
| `/tmp/fgos-worktrees/tsk-*` | `src/runner/worktree.mjs:250` (`createWorktree` default base) |
| `/tmp/tmp.XXXXXXXX` | bare `mktemp -d` copy — no git checkout at all |

Root cause was `src/setup/checks.mjs`'s `integrationScriptPath()` resolving
the shell-integration script from `import.meta.url` — i.e. relative to
whichever *checkout copy* was executing `fgos setup`. A linked worktree
therefore produced its own distinct absolute path, and `hasSourceLine()`
matched only that exact path, so idempotency was per-checkout-copy instead
of per-user. Running `fgos setup` from inside a worktree always reported
"not sourced" (even though the main checkout's line already worked) and
appended a new line naming that worktree's own path. When the worktree was
later removed by the normal `pick`/`return` lifecycle, the `source` line
survived — nothing pruned it.

## The fix

- The canonical sourced path is now the **main checkout**, resolved via
  `git rev-parse --git-common-dir`, never the executing copy's own
  location. One line per real project; a linked worktree never earns its
  own line.
- fgOS never edits an rc file to remove a line — deletion stays a human
  act. Instead, `fgos doctor` **reports** the dead source lines it finds,
  and returns a failed check (`passed: false`) naming each dead path.
- When the executing copy is not a resolvable git checkout at all (e.g. a
  bare `mktemp -d` copy), `fgos setup` declines the rc write and reports
  why, while still performing its other work (config, hooks).

## What to do if you hit this

1. Run `fgos doctor`. A failed shell-integration check names every dead
   `source` line found in your rc file(s).
2. Open the rc file(s) doctor named (typically `~/.zshrc` and/or
   `~/.bashrc`) and delete the dead lines yourself — fgOS will not do this
   for you, by design, since your shell profile is your own file and a
   pruning heuristic that gets one wrong destroys unrecoverable
   configuration.
3. Re-run `fgos setup` if you want the canonical main-checkout line
   re-verified/re-inserted.

If you deliberately want a worktree-local integration script, you can
still source it by hand — the fix only removes the *automatic* per-worktree
line, not the ability to source one yourself.
