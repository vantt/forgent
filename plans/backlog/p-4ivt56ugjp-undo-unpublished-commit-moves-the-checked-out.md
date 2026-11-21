---
id: p-4ivt56ugjp
title: "`undo_unpublished_commit` moves the checked-out branch with a raw `git reset --mixed`, bypassing the refs door (git, priority medium; source: lead:OPC review of e7701dcfc, 2026-11-21; owner SUPERVISION, OPC reviews)"
status: proposed
priority: P2
area: git
created: 2026-11-21
---

# Why

The paths-land undo added in e7701dcfc resets the branch to the parent with `git reset --mixed <parent>`, so it has no exact-old CAS through update-ref, no WAL journal and no read-back. Today it is safe against fgOS writers: it runs under worktree-admin 40 and main-checkout 50 and checks first that the tip equals the commit, that there is a single parent, and the index. Two gaps remain: an outside git command between the check and the reset is not caught, and a crash partway through leaves no journal for `fgos git recover`.

# Done when

The undo moves the branch through the refs door (CAS update-ref with old=commit and new=parent, journalled, read back), then restores the index to the parent with read-tree, keeping the worktree bytes. An owning git test shows that a concurrent ref move makes the undo refuse, and that a crash after the ref move is settled by `fgos git recover`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
