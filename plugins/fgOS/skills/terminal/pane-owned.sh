# fgOS terminal -- shared guard for the herdr pane adapter. Sourced by
# terminal/rename.sh and terminal-close/close.sh; never run on its own.
#
# HERDR_PANE_ID is inherited env, not proof of where this process lives. A
# shared agent daemon (observed: `codex app-server`, which outlives the pane
# that started it) hands every child the pane id of whichever pane spawned
# the daemon -- often a pane that has since closed, or worse, a live pane
# belonging to a different session. Acting on that id would rename or close
# the wrong pane. So before touching a pane, confirm two things:
#
#   1. herdr still knows the pane (`herdr pane process-info --pane <id>`
#      succeeds and reports a shell_pid), and
#   2. that shell_pid is an ancestor of this process -- i.e. the pane really
#      is the caller's own pane.
#
# fgos_pane_owned <pane-id>: exit 0 when both hold; otherwise print one line
# naming the reason to stderr and exit 1. The caller then does nothing.

fgos_pane_owned() {
  local pane_id="$1" info shell_pid pid ppid
  info=$(herdr pane process-info --pane "$pane_id" 2>/dev/null) || {
    echo "fgOS terminal: pane $pane_id (from HERDR_PANE_ID) is not a live herdr pane; leaving panes untouched." >&2
    return 1
  }
  shell_pid=$(printf '%s' "$info" | grep -o '"shell_pid" *: *[0-9]*' | grep -o '[0-9]*$')
  if [ -z "$shell_pid" ] || [ "$shell_pid" -le 1 ]; then
    echo "fgOS terminal: cannot verify that pane $pane_id belongs to this session (no shell pid); leaving panes untouched." >&2
    return 1
  fi
  pid=$$
  while [ -n "$pid" ] && [ "$pid" -gt 1 ]; do
    [ "$pid" = "$shell_pid" ] && return 0
    ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
    [ -n "$ppid" ] && [ "$ppid" != "$pid" ] || break
    pid=$ppid
  done
  echo "fgOS terminal: pane $pane_id (from HERDR_PANE_ID) is not this session's pane -- the variable was likely inherited from a shared agent daemon; leaving panes untouched." >&2
  return 1
}
