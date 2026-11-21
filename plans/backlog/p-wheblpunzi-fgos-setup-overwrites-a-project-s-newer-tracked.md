---
id: p-wheblpunzi
title: "`fgos setup` overwrites a project's newer tracked skill with the release's older copy"
status: done
priority: P2
area: distribution
created: 2026-10-25
---

# Why

In mcp-skill-hub, `setup` replaced six tracked `.claude/skills/distill*` files (the repo's 0.2) with the release's 0.1 (−1312 lines); SEAT restored them from HEAD and kept the patch at `.fgos/runtime/tmp/landing-261025-es/setup-skill-overwrite.patch` there (board log 2026-10-25 12:58). The next `setup` will overwrite them again. Owner 2026-10-25 16:4x: HARDEN owns it. Moot 2026-11-16: `fgos setup` is retired, so nothing copies a release skill over a project file (S4).

# Done when

`setup` never replaces a tracked project skill file that differs from HEAD or carries a newer version than the release's; it reports the skip by name; one proof in the setup render tests

# Notes

Migrated from the legacy backlog table. Original status: done.
