#!/bin/sh
# Runs as the mapped root inside a fresh mount namespace, applies the
# restrictions, then EXECS an interactive shell -- exec, so the pid herdr
# recorded for this pane is still the pid of the shell it is looking at.
WORKSPACE="$1"
mount -o remount,bind,ro / / 2>/dev/null
mount --bind "$WORKSPACE" "$WORKSPACE" 2>/dev/null
mount -o remount,bind,rw "$WORKSPACE" "$WORKSPACE" 2>/dev/null
cd "$WORKSPACE" 2>/dev/null || cd /
exec /bin/bash --norc
