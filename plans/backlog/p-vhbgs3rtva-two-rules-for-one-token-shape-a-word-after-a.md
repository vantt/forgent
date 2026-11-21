---
id: p-vhbgs3rtva
title: "Two rules for one token shape: a word after a switch (host routing, priority low; co-owner MAIL for the mailbox verbs; needs OPC review)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`config set --global a v` is refused (`--global takes no value`, Node's rule) while `mailbox send --wake "body"` keeps the word as an argument (`mailbox_verbs.rs` `switch()` turns the parser's value back into a positional, and the Observe verbs do the same). `switch()` also appends the captured word after `call.arguments()`, so a word taken from the middle of a multi-word positional list would move to the end (moot today: single-word bodies).

# Done when

The route projection declares which flags are switches, so the shared parser itself never gives a switch a value; config's refusal and mailbox's `switch()` collapse into one rule. Which behaviour wins (Node's refusal or keep-the-word) is a user-visible choice for the owner or MAIL.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
