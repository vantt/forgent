---
id: p-afwjbaupv7
title: "`RouterPolicy` is an empty placeholder struct that selection never reads (host-runtime, priority low; found by the T9 close check 2026-11-18)"
status: done
priority: P3
area: host-runtime
created: 2026-11-18
---

# Why

`operation_provider_router.rs:29`. Delete it and move every caller in the same change. Plan `plans/261118-1818-harden-t9-leftovers` phase 4.

# Done when

...

# Notes

Migrated from the legacy backlog table. Original status: done.
