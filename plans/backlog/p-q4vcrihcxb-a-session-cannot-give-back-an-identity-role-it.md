---
id: p-q4vcrihcxb
title: A session cannot give back an identity role it no longer needs
status: done
priority: P2
area: ident
created: 2026-10-23
---

# Why

`fgos identity session --role lead:<LANE>` only adds roles and `--take` only moves one to another session; nothing drops a role from a live session. Observed 2026-10-23 11:35 on `fg-server`: the owner renamed the PROSE session to RULE, so `claude-6z3r@fg-server` (lead:RULE) still holds a stray `lead:PROSE` that `fgos identity resolve lead:PROSE` keeps answering until the session ends. Reported by `lead:RULE`; owner of the fix: IDENT (docs/platform/identity/spec.md section 5).

# Done when

A live session can drop one of its own roles through the identity write door (for example `fgos identity session --drop-role lead:<LANE>`); afterwards `resolve` of that role answers `not-found`; a session cannot drop another live session's role; one owning test in `packages/identity/rust/tests/directory.rs`

# Notes

Migrated from the legacy backlog table. Original status: done.
