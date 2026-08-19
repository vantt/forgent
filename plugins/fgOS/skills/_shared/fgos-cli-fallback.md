# fgos CLI fallback

Standard fallback for invoking the `fgos` CLI from a skill that has no
guaranteed project-relative path to `bin/fgos.mjs` — an installed plugin's
files run from a copied cache location, not from a checkout, so this
resolves the real binary or falls back to a global install before giving
up. Every CLI-wrapper skill under `plugins/fgOS/skills/` points here
instead of repeating this block; substitute `<verb-cmd>` with the exact
`fgos` subcommand and its own flags (including that call's own `--dir`
value) this call needs — e.g. `list --json --dir
"${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"`, or
`move <id> --to <status> --dir "$root"` when the calling skill already
resolved `$root` in an earlier step:

```bash
FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
if [ -f "$FGOS_BIN" ]; then
  node "$FGOS_BIN" <verb-cmd>
elif command -v fgos >/dev/null 2>&1; then
  fgos <verb-cmd>
else
  echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
  exit 1
fi
```

Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
never a relative path, in both `FGOS_BIN` and in `<verb-cmd>`'s own
`--dir` value when it uses this same resolution rather than an
already-resolved `$root`.
