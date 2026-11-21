---
id: p-zyxiffe2kh
title: "The login-copies fix strands copies of a renamed or disabled account (runner, priority low; source: lead:OPC, 2026-11-19, doctor credential-copies-retained)"
status: proposed
priority: P3
area: runner
created: 2026-11-19
---

# Why

`fgos doctor --fix` judges retained login copies against the account inventory. After the openai provider rename, two pending copies under the old provider id's runtime dir (`provider-capacity/account-locks/openai-codex/tetcu72/stores/pi/pending`) matched no inventory entry, so the fix could never drop them and the row stayed red until lead:OPC removed them by hand.

# Done when

The copies fix also lets go of copies whose provider or account is absent from the inventory or disabled; an owning test renames a provider with a pending copy and shows the fix drops it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
