---
id: p-a189ff31
title: A confined worker can read the gateway bearer token
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

A confined worker can read the gateway bearer token

# Done when

the token lives in `~/.fgos/private/gateway-token`, a machine-private root hidden from every confined worker (agent-confinement spec §9.3); the HARDEN T5 red-team read the real file from a confined worker under both built-in policies, blind and not, and got `ENOENT` ([report](../plans/reports/council-261104-1840-harden-t5-seat-redteam.md), received items).

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
