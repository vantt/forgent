#!/bin/sh
# Probe 1 — can agy start at all inside a bubblewrap namespace?
#
# Measures, in order of increasing permissiveness, so the ANSWER is which
# mounts are actually required rather than a guess that happens to work.
# Nothing here dispatches work: every invocation is `--version`, which does no
# filesystem writing of its own beyond whatever the binary insists on at boot.
#
# Shape under test, from the executor entries already in .fgos/config.json:
#   --ro-bind / /      the whole system readable, nothing writable
#   --bind <path>      the exceptions, named one at a time
set -u

WORKSPACE="$1"
WORKER_HOME="$2"
AGY="$(command -v agy)"

run_case() {
  label="$1"
  shift
  printf '\n=== %s\n' "$label"
  # shellcheck disable=SC2068
  timeout 60 bwrap $@ -- "$AGY" --version 2>&1 | head -5
  printf '(exit %s)\n' "$?"
}

BASE="--ro-bind / / --dev /dev --proc /proc"

run_case "A: everything read-only, no writable path at all" \
  $BASE

run_case "B: + writable workspace" \
  $BASE --bind "$WORKSPACE" "$WORKSPACE"

run_case "C: + writable workspace + private HOME" \
  $BASE --bind "$WORKSPACE" "$WORKSPACE" --bind "$WORKER_HOME" "$WORKER_HOME" --setenv HOME "$WORKER_HOME"

run_case "D: + tmpfs on /tmp as well" \
  $BASE --bind "$WORKSPACE" "$WORKSPACE" --bind "$WORKER_HOME" "$WORKER_HOME" --setenv HOME "$WORKER_HOME" --tmpfs /tmp
