---
id: p-c3a41d07
title: Bind the confinement ownership marker to its herdr pane when the pane is created, not only on failur
status: proposed
priority: P2
area: dispatch-worker-hygiene-and-recovery
created: 2026-11-21
---

# Why

Bind the confinement ownership marker to its herdr pane when the pane is created, not only on failure. Today the marker gets `paneId` and `herdrSession` late (`src/runner/dispatch/confinement/cleanup.mjs:72-81`, `confinement/authority.mjs:1172`), so a controller that dies between pane creation and the late write leaves a live worker's private home looking like an orphan to the reaper. Left out of dispatch-worker-hygiene-and-recovery phase 03 under its descope rule (more than 25 lines of plumbing to reach the bind handle from the round). Open it when a reaper deletion of a live worker's home is observed, or when that plumbing is touched anyway.

# Done when

A worker's ownership marker carries its pane and session from the moment the pane exists; a test kills the controller after the split and shows the reaper keeps the home until the pane closes

# Notes

Migrated from the legacy backlog table. Original status: proposed.
