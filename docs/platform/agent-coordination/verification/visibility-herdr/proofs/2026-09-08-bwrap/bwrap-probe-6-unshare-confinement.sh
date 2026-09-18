#!/bin/sh
# Probe 6 — does the pid-preserving mechanism actually confine?
#
# Probe 5 found that `unshare --mount --map-root-user` keeps the pid while
# bwrap does not, and pid identity is exactly what herdr's "available shell"
# check turns on. Keeping the pid is worthless if nothing is restricted, so
# this asks of unshare what probe 2 asked of bwrap:
#
#   - write inside the workspace?   must be yes
#   - write outside?                must be no
#   - read the repo?                must be yes
#   - same pid all the way through? must be yes
#
# A mount namespace begins as a copy of the parent's mounts, so unlike bwrap
# NOTHING is restricted until something is remounted read-only inside it.
# `--map-root-user` is what permits those mounts without real root.
#
# The mount work lives in `unshare-inner.sh` beside this file rather than in a
# nested quoted string: a first attempt buried it three quoting levels deep,
# and the shell ate the remount that makes the workspace writable -- which
# then read as "confinement works" when in fact everything was read-only.
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
WORKSPACE="$1"
OUTSIDE=/home/vantt/projects/forgentX/src/setup/probe6-must-not-exist.txt

printf '=== pid through the whole chain, and what the confined shell can do\n'
exec 3>&1
sh -c 'echo "outer shell pid: $$"; exec unshare --mount --map-root-user -- "$0" "$1" "$2"' \
  "$HERE/unshare-inner.sh" "$WORKSPACE" "$OUTSIDE" 2>&1

printf '\non the host: stray file exists: '
[ -f "$OUTSIDE" ] && echo 'YES -- THE BOUNDARY DOES NOT HOLD' || echo 'no'
printf 'on the host: workspace file exists: '
[ -f "$WORKSPACE/unshare-inside.txt" ] && echo 'yes' || echo 'no'
rm -f "$WORKSPACE/unshare-inside.txt"
