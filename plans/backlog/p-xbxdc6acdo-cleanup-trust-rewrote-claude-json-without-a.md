---
id: p-xbxdc6acdo
title: "`cleanup-trust` rewrote `~/.claude.json` without a lock, so a folder-trust entry another writer adde"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

`cleanup-trust` rewrote `~/.claude.json` without a lock, so a folder-trust entry another writer added between its read and its rename was lost (HARDEN T4 hand-off H-T4c; the T5 red-team lost 297 of 400 concurrent seeds)

# Done when

owner decision 66; fgOS only adds its claude entry, one seed at a time under the machine lock `agent-trust-store`, reads it back and re-adds a lost entry, and never removes one; the claude branch of `cleanup-trust` is gone (`9df771d3e`, proof `test/runner/herdr-private-home-trust.test.mjs`). The codex and agy stores keep the unlocked take-back as a known limit (run-supervisor spec section 15).

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
