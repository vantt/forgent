---
id: STR77
title: "[MVP doc gap · P2] `fgos submit --help` mâu thuẫn hành vi shipped"
status: done
priority: P2
area: general
created: 2026-07-21
---

# Why

(đo gap MVP 2026-07-21) — help ghi `required: --text` (một flag) nhưng arg thật là POSITIONAL (`fgos submit "<description>"`) — `src/cli/command-registry.mjs:69,74`, `bin/fgos.mjs:610,1897`. Người mới tự sửa qua error string, nhưng doc-shipped vẫn sai.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
