#!/bin/sh
# A stand-in for the herdr CLI: logs argv (tab separated, one line per call) to
# $FAKE_HERDR_LOG and answers from the recorded JSON next to this script.
#   FAKE_HERDR_HANG       "<arg1> <arg2>" of a command that never answers
#   FAKE_HERDR_SOCKET     socket path reported by `status server`
#   FAKE_HERDR_PANE_GONE  set: pane commands answer pane_not_found
#   FAKE_HERDR_ON_CLOSE   shell snippet run when `pane close` is called
#   FAKE_HERDR_GARBLE     set: every command answers text that is not JSON
#   FAKE_HERDR_FDS        file that receives the list of open fds of this process
dir=$(dirname "$0")
if [ -n "$FAKE_HERDR_LOG" ]; then
  { printf '%s\t' "$@"; printf '\n'; } >> "$FAKE_HERDR_LOG"
fi
if [ -n "$FAKE_HERDR_FDS" ]; then ls /proc/$$/fd > "$FAKE_HERDR_FDS" 2>/dev/null; fi
if [ "$1" = "--session" ]; then shift 2; fi
[ "$1" = "--version" ] && { echo "herdr 0.9.1-fake"; exit 0; }
[ "$3" = "--help" ] && { echo "usage"; exit 0; }
[ -n "$FAKE_HERDR_GARBLE" ] && { echo "oops, not json"; exit 0; }
case "$FAKE_HERDR_HANG" in "$1 $2") exec sleep 30 ;; esac
if [ -n "$FAKE_HERDR_PANE_GONE" ]; then
  case "$1 $2" in "pane "*) cat "$dir/pane-close-not-found.json" >&2; exit 1 ;; esac
fi
case "$1 $2" in
  "status server") sed "s#\"socket\":\"[^\"]*\"#\"socket\":\"$FAKE_HERDR_SOCKET\"#" "$dir/status-server.json" ;;
  "tab create") cat "$dir/tab-create.json" ;;
  "tab rename"|"pane rename"|"pane run"|"pane send-text"|"pane send-keys"|"agent start") cat "$dir/pane-close-ok.json" ;;
  "pane split") cat "$dir/pane-split.json" ;;
  "pane layout") cat "$dir/pane-layout-two-panes.json" ;;
  "pane get") cat "$dir/pane-get.json" ;;
  "pane process-info") cat "$dir/pane-process-info-running.json" ;;
  "pane read") printf 'line one\nline two\n' ;;
  "pane close") [ -n "$FAKE_HERDR_ON_CLOSE" ] && sh -c "$FAKE_HERDR_ON_CLOSE"; cat "$dir/pane-close-ok.json" ;;
  *) echo '{"error":{"code":"unknown_command","message":"fake"}}' >&2; exit 2 ;;
esac
