#!/usr/bin/env bash
# fgOS terminal rename -- best-effort herdr pane label. Chrome-only (D2,
# docs/history/fgos-terminal-pane-rename/CONTEXT.md): never touches .fgos/
# state, never blocks the caller. Any missing precondition -- including the
# pane-labeling capability not being registered at all -- is a silent no-op,
# exit 0.
#
# Usage: rename.sh <task-id> <project-root>
#   <task-id>      the claimed fgOS item id (first label segment)
#   <project-root> absolute path to this repo's checkout, so the fgOS
#                  session-id fallback (fg.ssid) can be resolved even when
#                  this script itself runs from an installed plugin cache
#                  copy that doesn't carry src/ alongside it.
set -u

task_id="${1:-}"
project_root="${2:-}"

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
# bin/fgos.mjs there, node missing, CLI error -- falls through to the same
# no-op. Fail-closed is the right direction for decoration: a helper that
# cannot confirm the capability must not guess that it is present.
[ -n "$project_root" ] && [ -f "$project_root/bin/fgos.mjs" ] || exit 0
node "$project_root/bin/fgos.mjs" tool query --capability pane-labeling --dir "$project_root" 2>/dev/null \
  | grep -q '"capability" *: *"pane-labeling"' || exit 0

# herdr adapter -- today's only pane-labeling provider. Not in a
# herdr-managed pane, or herdr unavailable: no-op.
[ "${HERDR_ENV:-}" = "1" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0
[ -n "${HERDR_PANE_ID:-}" ] || exit 0

# fg.ssid (D1): fgOS's own session id. FGOS_SESSION_ID first, else
# resolveWriterIdentity()'s own env/registry/pid fallback chain
# (src/util/session-identity.mjs) -- dropped entirely if neither resolves.
fg_ssid="${FGOS_SESSION_ID:-}"
if [ -z "$fg_ssid" ] && [ -n "$project_root" ] && [ -f "$project_root/src/util/session-identity.mjs" ]; then
  fg_ssid=$(node -e "
    import(process.argv[1]).then(({ resolveWriterIdentity }) => {
      process.stdout.write(String(resolveWriterIdentity().id));
    }).catch(() => {});
  " -- "$project_root/src/util/session-identity.mjs" 2>/dev/null || true)
fi

# a.ssid (D1): the coding agent tool's own native session id. Claude Code
# exposes CLAUDE_CODE_SESSION_ID; other agent tools are not detected today
# (docs/history/fgos-terminal-pane-rename/CONTEXT.md, outstanding questions)
# and simply drop this segment (D4).
a_ssid="${CLAUDE_CODE_SESSION_ID:-}"

# resolveWriterIdentity()'s own fallback chain reads CLAUDE_CODE_SESSION_ID
# too when FGOS_SESSION_ID is unset, so fg_ssid can come back equal to
# a_ssid -- collapsing the two genuinely-distinct identities D1 requires.
# Drop the duplicate rather than show the same value twice.
if [ -n "$fg_ssid" ] && [ "$fg_ssid" = "$a_ssid" ]; then
  fg_ssid=""
fi

# D4: taskid | fg.ssid:<v> | a.ssid:<v>, unresolved segments dropped.
label="$task_id"
[ -n "$fg_ssid" ] && label="$label | fg.ssid:$fg_ssid"
[ -n "$a_ssid" ] && label="$label | a.ssid:$a_ssid"

herdr pane rename "$HERDR_PANE_ID" "$label" >/dev/null 2>&1 || true
exit 0
