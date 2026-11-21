---
id: p-3u7ntmlhyz
title: A case of a conductor-driven workflow cannot be checked for freshness, because `readCase` supplies no current digests and a workflow whose `subject` is prose has no locator
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

`readCase` must supply `currentDigests` for such cases; a locator is needed for subjects whose workflow `subject` is prose; `current-digest-unknown` fails closed; nothing is restamped. Open: who owns locator validation (unresolved question of the contracts reviewer). Review findings: A-F2, packet F3. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B5; owner 2026-10-24 18:09 opened item by item. Dependencies: after p-3ydqquajy2; reads the digest recorded by p-xtwobjzl2i.

# Done when

For a case of the one shipped conductor-driven workflow (`domains/coding/workflows/feature.yaml`), `readCase` returns `currentDigests` and a changed subject marks its milestone stale; a subject with no resolvable locator refuses with `current-digest-unknown`; the owner of locator validation is named in the item before code starts

# Notes

Migrated from the legacy backlog table. Original status: proposed.
