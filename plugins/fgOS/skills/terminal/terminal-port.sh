# fgOS terminal -- shared client of the terminal-control port for the herdr
# pane adapter. Sourced by terminal/rename.sh and terminal-close/close.sh;
# never run on its own. The port is the internal route
# `fgos internal terminal-control <op>` of the activated release (the `fgos`
# on PATH); this file only builds a request and reads the one-line answer.

# fgos_json_str <text>: <text> as a JSON string literal.
fgos_json_str() {
  printf '"%s"' "$(printf '%s' "$1" | tr -d '\000-\037' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
}

# fgos_terminal_key <project-root>: the allocation key of this session's own
# pane -- the session's writer id. FGOS_SESSION_ID, else the id fgOS resolves
# for the project, else the agent tool's session id, else the pane id. Only
# [A-Za-z0-9._-] survive and the first character is alphanumeric, so the key
# always satisfies the port's key pattern.
# fgos_writer_id <root>: this caller's fgOS writer id as the activated host
# resolves it (`fgos identity`); empty when there is no host or no answer.
fgos_writer_id() {
  [ -n "${1:-}" ] && command -v fgos >/dev/null 2>&1 && command -v node >/dev/null 2>&1 || return 0
  (cd "$1" && fgos identity --json </dev/null 2>/dev/null) | node -e "
    let s = '';
    process.stdin.on('data', (d) => { s += d; }).on('end', () => {
      try { const id = JSON.parse(s).data.id; if (id !== undefined && id !== null && id !== '') process.stdout.write(String(id)); } catch {}
    });" 2>/dev/null || true
}

fgos_terminal_key() {
  local root="${1:-}" id="${FGOS_SESSION_ID:-}"
  [ -n "$id" ] || id=$(fgos_writer_id "$root")
  [ -n "$id" ] || id="${CLAUDE_CODE_SESSION_ID:-}"
  [ -n "$id" ] || id="pane-${HERDR_PANE_ID:-}"
  id=$(printf '%s' "$id" | tr -c 'A-Za-z0-9._-' '-' | cut -c1-128)
  case "$id" in [A-Za-z0-9]*) printf '%s' "$id" ;; *) printf 'k%s' "$id" | cut -c1-128 ;; esac
}

# fgos_terminal_call <op> <request-json>: run one port operation; print its
# one-line JSON answer. Exit 1 when the route cannot be run at all.
fgos_terminal_call() {
  local op="$1" request="$2" bin herdr_bin=""
  bin=$(command -v fgos) || return 1
  [ -n "${FGOS_HERDR_BIN:-}" ] && herdr_bin="\"herdrBin\":$(fgos_json_str "$FGOS_HERDR_BIN"),"
  printf '{"v":1,%s"request":%s}' "$herdr_bin" "$request" \
    | "$bin" internal terminal-control "$op" --protocol 1 --json 2>/dev/null
}

# fgos_terminal_attach <key> <pane>: take the caller's own pane. Exit 0 when
# the port answered with a slot.
fgos_terminal_attach() {
  fgos_terminal_call attach "{\"key\":$(fgos_json_str "$1"),\"pane\":$(fgos_json_str "$2")}" | grep -q '"result":"slot"'
}
