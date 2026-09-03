---
framework: diataxis
mode: how-to
---
# Reverse `fgos setup`'s wiring with `fgos uninstall`

Goal: undo what `fgos setup` wired into a project — the git hooks
integration and the shell-rc source line — without touching any fgOS
data or config, and without a package manager step (that part is a
separate, unproven spike, see the note at the end).

## Run it

```
fgos uninstall --yes
```

`--yes` is required. Omitting it refuses before touching anything:

```
fgos uninstall requires --yes to confirm — it unwires git hooks
(core.hooksPath/.githooks) and reports (never deletes) the shell-rc
source line. Rerun with --yes once ready.
```

## What it does

- **Git hooks**: unwires `core.hooksPath` and deletes
  `.githooks/pre-commit` (plus the `.githooks/` dir, if left empty) —
  but only when `core.hooksPath` is still exactly `.githooks`. If you
  (or another tool) already repointed it somewhere else, `fgos uninstall`
  leaves that value completely untouched, the same fill-only rule
  `installGitHooks` already uses in the opposite direction.
- **Shell-rc source line**: never deletes it. It reports which rc file(s)
  still carry the fgOS source line, then tells you to remove it by hand —
  fgOS never edits a shell profile to remove a line, the same rule
  `fgos doctor`'s dead-source-line reporting already follows.
- **fgOS data and config**: never touched. `.fgos/` data,
  `~/.fgos/config.json`, and the project's `.fgos/config.json` are
  structurally out of reach — `fgos uninstall`'s code never imports or
  calls any config-writing function.

## What it does not do (yet)

`fgos uninstall` does not remove the installed fgOS package itself — that
piece is a separate, still-unproven spike (whether a process can reliably
delete its own installed npm package, on Linux/macOS, without corruption
or a stuck file lock). Until that spike lands, `fgos uninstall --yes`
only reverses the wiring described above.

## Example result

```json
{
  "shellRcSourceLinesFound": [
    { "rcFile": "/home/you/.bashrc", "sourceLine": "source \"...fgos-shell-integration.sh\"" }
  ],
  "shellRcRemovalInstructions": "fgOS never edits your shell profile — remove the line(s) above by hand.",
  "hooksUnwired": true,
  "hooksSkippedExisting": null
}
```

`hooksSkippedExisting` carries the untouched custom value when
`core.hooksPath` pointed somewhere other than `.githooks` — `null` when
there was nothing to skip.
