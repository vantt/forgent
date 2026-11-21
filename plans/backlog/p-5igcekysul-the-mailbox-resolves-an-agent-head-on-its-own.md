---
id: p-5igcekysul
title: The mailbox resolves an agent head on its own, beside Identity (mailbox and identity, priority medium; found 2026-11-17 in `docs/discussions/secretary-miu/DISCUSSION.md`, needs OPC review)
status: proposed
priority: P2
area: agent-mailbox
created: 2026-11-17
---

# Why

Identity is the only authority deriving session ids, handles and liveness, including the agent head (`docs/platform/identity/spec.md` section 3, local directory: "the highest ancestor holding a terminal"). The mailbox keeps its own per-CLI head finder (`adapters::claude_head::find_head` reading `~/.claude/sessions/<pid>.json`) and caller check (`head::caller_is_head`, `hookFacts` in `adapters.v1.json`) in `packages/mailbox/rust`. Owner 2026-11-17: "identity mới là nơi cung cấp, mailbox chỉ dùng". Part of it may be the mailbox's own caller check (is this hook process the head), which is not identity; the overlap is not yet measured.

# Done when

Each head-related fact the mailbox uses is named as Identity's (consumed through an Identity door) or the mailbox's own (with the reason); any duplicate derivation is moved behind Identity and the old path deleted in the same change (L10); the mailbox hook tests still pass.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
