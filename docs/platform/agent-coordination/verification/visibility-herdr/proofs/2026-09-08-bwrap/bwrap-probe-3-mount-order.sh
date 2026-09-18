#!/bin/sh
# Probe 3 — mount order, and where the writable paths may live.
#
# Probe 2 proved the boundary holds, and tripped over a real constraint while
# doing it: `--tmpfs /tmp` shadows anything bound underneath it. That matters
# in production, because `createWorkerHome` provisions the private HOME under
# `os.tmpdir()` -- so a naive `--tmpfs /tmp` would delete the worker's own
# HOME out from under it.
#
# bwrap applies mount arguments IN ORDER, so the question is answerable.
set -u

WORKSPACE="$1"     # under /tmp, exactly like a provisioned worker HOME is
WORKER_HOME="$2"
BASE="--ro-bind / / --dev /dev --proc /proc"

try() {
  label="$1"
  shift
  printf '\n=== %s\n' "$label"
  # shellcheck disable=SC2068
  bwrap $@ -- sh -c "
    echo ok > $WORKSPACE/inside.txt 2>&1 && echo 'write inside workspace: yes' || echo 'write inside workspace: NO'
    echo ok > $WORKER_HOME/home-write.txt 2>&1 && echo 'write inside HOME:      yes' || echo 'write inside HOME:      NO'
    echo ok > /tmp/anywhere.txt 2>&1 && echo 'write to bare /tmp:     yes' || echo 'write to bare /tmp:     NO'
    echo stray > /home/vantt/projects/forgentX/src/setup/stray.txt 2>&1 && echo 'write OUTSIDE:          YES -- LEAK' || echo 'write OUTSIDE:          no (refused)'
  " 2>&1
  rm -f "$WORKSPACE/inside.txt" "$WORKER_HOME/home-write.txt"
}

try "no tmpfs at all -- /tmp stays read-only except what is bound" \
  $BASE --bind "$WORKSPACE" "$WORKSPACE" --bind "$WORKER_HOME" "$WORKER_HOME" --setenv HOME "$WORKER_HOME"

try "tmpfs FIRST, binds after -- the binds should win" \
  $BASE --tmpfs /tmp --bind "$WORKSPACE" "$WORKSPACE" --bind "$WORKER_HOME" "$WORKER_HOME" --setenv HOME "$WORKER_HOME"

try "binds FIRST, tmpfs after -- the tmpfs should shadow them (probe 2's mistake)" \
  $BASE --bind "$WORKSPACE" "$WORKSPACE" --bind "$WORKER_HOME" "$WORKER_HOME" --setenv HOME "$WORKER_HOME" --tmpfs /tmp
