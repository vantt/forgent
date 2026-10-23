#!/usr/bin/env bash
# fgOS terminal rename -- best-effort herdr pane label, through the
# terminal-control port (attach, then label). Chrome-only (D2,
# docs/history/fgos-terminal-pane-rename/CONTEXT.md): never touches .fgos/
# state, never blocks the caller. Any missing precondition -- including the
# pane-labeling capability not being registered at all -- is a silent no-op,
# exit 0.
#
# Usage: rename.sh <task-id> <project-root> [<title>]
#   <task-id>      the claimed fgOS item id (shown by its first 8 characters)
#   <title>        optional: what the task is called, when the caller knows it
#   <project-root> absolute path to this repo's checkout, so the fgOS
#                  session-id fallback (fg.ssid) can be resolved even when
#                  this script itself runs from an installed plugin cache
#                  copy that doesn't carry src/ alongside it.
set -u

task_id="${1:-}"
project_root="${2:-}"
title="${3:-}"

[ -n "$task_id" ] || exit 0

# Capability gate (D5, docs/history/orchestrator-worker-slots/DISCUSSION.md
# §6 "Nhãn: session tự đặt qua helper skill có gate"). Pane labeling is an
# adapter-swappable capability declared through the tool registry:
#
#   fgos tool register --name herdr --kind cli --capability pane-labeling \
#     --command herdr
#
# Zero registered providers means this environment has no pane-label concept
# at all, so labeling is skipped silently -- the same shape this script
# already had outside a herdr pane, never a failure ("absent capability =
# clean skip", src/state/tool-registry.mjs's own header). Swapping herdr for
# tmux/cmux later means registering a different provider here, not editing
# every caller: this query is the hexagon seam, and it sits ahead of the
# herdr-specific guards below precisely so those guards read as one
# adapter's implementation detail rather than as the gate itself.
#
# Gated on REGISTERED, not on `--status present`: `present` only becomes true
# once someone has run `fgos tool check` on this machine (bin/fgos.mjs's
# `tool query`, resolvedStatus), so gating on it would switch labeling off on
# every fresh clone with no signal. The registry answers "does this
# environment have the concept"; the adapter guards below answer "and is it
# usable right now", which for herdr is a strictly sharper question than a
# PATH probe -- herdr being installed says nothing about this session running
# inside one of its panes.
#
# Any failure to answer the question at all -- no <project-root>, no
# .fgos/installation/bin/fgos or bin/fgos.mjs there, node missing, CLI error --
# falls through to the same no-op. Fail-closed is the right direction for
# decoration: a helper that cannot confirm the capability must not guess
# that it is present.
[ -n "$project_root" ] || exit 0
if [ -x "$project_root/.fgos/installation/bin/fgos" ]; then
  "$project_root/.fgos/installation/bin/fgos" tool query --capability pane-labeling --dir "$project_root" 2>/dev/null \
    | grep -q '"capability" *: *"pane-labeling"' || exit 0
elif [ -f "$project_root/bin/fgos.mjs" ]; then
  node "$project_root/bin/fgos.mjs" tool query --capability pane-labeling --dir "$project_root" 2>/dev/null \
    | grep -q '"capability" *: *"pane-labeling"' || exit 0
else
  exit 0
fi

# herdr adapter -- today's only pane-labeling provider. Not in a
# herdr-managed pane, or herdr unavailable: no-op.
[ "${HERDR_ENV:-}" = "1" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0
command -v fgos >/dev/null 2>&1 || exit 0
[ -n "${HERDR_PANE_ID:-}" ] || exit 0
# HERDR_PANE_ID can be inherited from a shared agent daemon and name a dead
# pane or another session's pane. The port's attach takes only a pane whose
# shell is an ancestor of this process, so a foreign pane stops at the attach
# below.
. "$(dirname "$0")/terminal-port.sh"

# fgOS's own session id. FGOS_SESSION_ID first, else the
# activated host's writer identity (`fgos identity`: its env/registry/pid
# chain) -- dropped entirely if neither resolves.
fg_ssid="${FGOS_SESSION_ID:-}"
[ -n "$fg_ssid" ] || fg_ssid=$(fgos_writer_id "$project_root")

# The label is `<short id> · <title> | fg.ssid:<first 8>`: the port builds it from
# these fields, so shell and Node share one format and one truncation rule. The
# coding agent's own session id is not shown; full ids stay in the record.
display="{\"id\":$(fgos_json_str "$task_id")"
[ -n "$title" ] && display="$display,\"title\":$(fgos_json_str "$title")"
[ -n "$fg_ssid" ] && display="$display,\"session\":$(fgos_json_str "$fg_ssid")"
display="$display}"

# The terminal-control port takes the pane (attach with the display facts, keyed by
# this session's writer id; idempotent; refused unless the pane is this caller's own) and then
# writes the label. Either step failing is the same silent no-op as every
# guard above.
key=$(fgos_terminal_key "$project_root")
fgos_terminal_attach "$key" "$HERDR_PANE_ID" "$display" || exit 0
fgos_terminal_call label "{\"key\":$(fgos_json_str "$key"),\"display\":$display}" >/dev/null || true
exit 0
