---
id: p-syd72acyow
title: "`fgos doctor --json` has no per-row timing (doctor, priority medium; owner pick 2b of 2026-10-21, still open at the T9 close)"
status: done
priority: P2
area: doctor
created: 2026-10-21
---

# Why

Doctor takes about 15 s against a 12 s target and nobody can tell which row is slow. Each row reports its own elapsed milliseconds, measured where the row runs. Plan `plans/261118-1818-harden-t9-leftovers` phase 1.

# Done when

...

# Notes

Migrated from the legacy backlog table. Original status: done.
