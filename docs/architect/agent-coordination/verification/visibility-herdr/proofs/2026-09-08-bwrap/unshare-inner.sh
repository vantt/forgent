#!/bin/sh
# Runs INSIDE the mount namespace, as the mapped root. Everything read-only,
# then the workspace handed back as writable -- which takes two steps, because
# a bind mount inherits the read-only flag of what it sits on.
WORKSPACE="$1"
OUTSIDE="$2"
echo "inside ns pid  : $$"
mount -o remount,bind,ro / / 2>&1 || echo "remount ro FAILED"
mount --bind "$WORKSPACE" "$WORKSPACE" 2>&1 || echo "bind FAILED"
mount -o remount,bind,rw "$WORKSPACE" "$WORKSPACE" 2>&1 || echo "remount rw FAILED"
echo "after mounts   : $$"
echo ok > "$WORKSPACE/unshare-inside.txt" 2>&1 && echo "write inside workspace: yes" || echo "write inside workspace: NO"
echo stray > "$OUTSIDE" 2>&1 && echo "write OUTSIDE         : YES -- LEAK" || echo "write OUTSIDE         : no (refused)"
head -1 /home/vantt/projects/forgentX/AGENTS.md >/dev/null 2>&1 && echo "read the repo         : yes" || echo "read the repo         : NO"
