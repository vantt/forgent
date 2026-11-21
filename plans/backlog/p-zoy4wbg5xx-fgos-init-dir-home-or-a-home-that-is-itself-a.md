---
id: p-zoy4wbg5xx
title: "`fgos init --dir $HOME`, or a HOME that is itself a Git repository, creates `$HOME/.fgos` (init, priority low; needs the owner's decision)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

The base release does the same; it pairs with the S4 close's refusal of `/`, `$HOME` and their ancestors in `fgos uninstall`.

# Done when

`fgos init` either refuses `$HOME` and `/` as a project root (a precondition refusal, exit 2, as `uninstall` does) or the behaviour is stated and tested as intended.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
