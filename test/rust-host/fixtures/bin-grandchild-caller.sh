#!/bin/sh
# Fixture standing in for a `bin:` entry that starts a Node grandchild by name, which then starts git.
# harness.test.mjs compares what the harness records for it with what it records for node-grandchild-caller.mjs.
node "$(dirname "$0")/git-child.mjs" >/dev/null 2>&1
printf '{"contract":"test.v1","status":"ok"}\n'
exit 0
