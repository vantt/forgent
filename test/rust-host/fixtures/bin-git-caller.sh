#!/bin/sh
# Fixture standing in for a `bin:` (compiled) entry that spawns git, the way
# a real fgos invocation does. Used by harness.test.mjs to prove the PATH
# shim (buildPathShim) gives a bin: entry child-process evidence, since
# there is no in-process monkeypatch hook for a compiled binary the way
# there is for node:child_process.
git rev-parse --show-toplevel >/dev/null 2>&1
printf '{"contract":"test.v1","status":"ok"}\n'
exit 0
