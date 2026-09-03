---
framework: diataxis
mode: explanation
---
# Shell fallback detection needs `type -P`, not `command -v`

`tsk-2ta-3` added a fallback to `scripts/fgos-shell-integration.sh`'s
`fgos()`/`fgos-runner()` functions: when the resolved git root has no
`bin/fgos.mjs` (or `bin/fgos-runner.mjs`), fall back to a real global
install of the same name instead of failing with a raw Node
`Cannot find module` error. Detecting whether that real global install
actually exists turned out to have a sharp edge.

## The obvious check is wrong

The obvious way to check "does a real `fgos` binary exist on PATH" is
`command -v fgos`. It doesn't work here, because `fgos` is itself a shell
function defined in the very file doing the checking. A quick empirical
check inside a shell with that function already defined:

```
$ bash -c '
fgos() { echo "shell function called"; }
echo "type -P result: [$(type -P fgos)]"
echo "command -v result: [$(command -v fgos)]"
'
type -P result: [/home/vantt/.local/share/pnpm/bin/fgos]
command -v result: [fgos]
```

`command -v fgos` returns `fgos` — the name of the shell function itself,
not a real path. It reports success (and looks like "yes, something named
fgos exists") for exactly the case that must be told apart from a real
install: the function shadowing itself. Using it as the fallback-exists
check would have made the fallback logic report a phantom install and
either loop back into the same function or produce a confusing "found" for
nothing real.

`type -P fgos`, by contrast, forces a PATH-only search and explicitly
ignores functions, aliases, and builtins of the same name — it returned
the actual pnpm-installed binary's real path. That is the correct primitive
for "is there a real external command by this name," which is exactly what
the fallback needs to decide whether to invoke `command fgos "$@"` or
print a clear "no install found" error instead.

## The general shape

When a bash function needs to detect whether a real external command with
its own name exists — most commonly to decide whether to delegate to it —
`command -v` is not that check if the calling context might itself define
a function, alias, or builtin of the same name. `type -P` (bash-specific)
is the one that actually restricts the search to PATH executables. The gap
between the two is invisible until tested in a shell where the shadowing
function is actually loaded, which is exactly the situation this fallback
runs in.
