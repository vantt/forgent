---
id: p-olifa4mlty
title: "Test suites leak temp dirs into the shared /tmp until it runs out of inodes (test, priority high; source: lead:S6A and the supervisor, 2026-11-19 23:30, machine incident on fg-server2)"
status: proposed
priority: P1
area: test
created: 2026-11-19
---

# Why

/tmp is a 16 GB tmpfs with 1,048,576 inodes shared by every session. Node and Rust tests left about 65,000 top-level `/tmp/fgos-*` and `/tmp/fgos_*` dirs (largest groups `fgos_test_*_manifest_*`, `fgos-ingest-*`, `fgos-cd-*`, `fgos-adopt-*`, `fgos-gate-attempt-*`, `fgos-doctor-es-*`). The inodes ran out, no Claude session could start a shell command for about 5 hours, and the supervisor removed them by hand once a shell was free.

# Done when

Every test that creates a temp dir removes it on success and on failure, and the suite fails on a temp-dir leak the way it fails on a .fgos leak; an owning check shows a full run leaves no new top-level /tmp entry.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
