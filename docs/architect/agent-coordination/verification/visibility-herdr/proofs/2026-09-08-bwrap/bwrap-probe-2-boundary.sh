#!/bin/sh
# Probe 2 — is the boundary real?
#
# Probe 1 only showed agy starts. This one asks the question the whole idea
# rests on: can a process inside the namespace write where it was not given
# permission? The subject is the namespace, so the tool is `sh` rather than
# agy -- what is being measured is the kernel's answer, not any agent's
# manners.
#
# The target outside the workspace is the exact directory yesterday's incident
# landed in.
set -u

WORKSPACE="$1"
WORKER_HOME="$2"
OUTSIDE_DIR=/home/vantt/projects/forgentX/src/setup
OUTSIDE_FILE="$OUTSIDE_DIR/bwrap-probe-must-not-exist.txt"

BASE="--ro-bind / / --dev /dev --proc /proc"
CONFINED="$BASE --bind $WORKSPACE $WORKSPACE --bind $WORKER_HOME $WORKER_HOME --setenv HOME $WORKER_HOME --tmpfs /tmp"

printf '=== inside the workspace: a write must SUCCEED\n'
# shellcheck disable=SC2086
bwrap $CONFINED -- sh -c "echo ok > $WORKSPACE/inside.txt && echo 'wrote inside: yes'" 2>&1
printf 'on the host, inside.txt exists: '
[ -f "$WORKSPACE/inside.txt" ] && echo yes || echo no

printf '\n=== outside the workspace: a write must FAIL\n'
# shellcheck disable=SC2086
bwrap $CONFINED -- sh -c "echo stray > $OUTSIDE_FILE" 2>&1
printf '(exit %s)\n' "$?"
printf 'on the host, the stray file exists: '
[ -f "$OUTSIDE_FILE" ] && echo 'YES -- THE BOUNDARY DOES NOT HOLD' || echo 'no'

printf '\n=== outside, but reading: must SUCCEED (the worker still needs the repo)\n'
# shellcheck disable=SC2086
bwrap $CONFINED -- sh -c "head -1 /home/vantt/projects/forgentX/AGENTS.md" 2>&1 | head -2

printf '\n=== the operator herdr socket: reachable?\n'
# shellcheck disable=SC2086
bwrap $CONFINED -- sh -c 'ls -la "$HOME/.config/herdr/herdr.sock" 2>&1 | head -1; echo "HOME=$HOME"'
