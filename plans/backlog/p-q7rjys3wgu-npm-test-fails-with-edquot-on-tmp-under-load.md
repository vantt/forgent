---
id: p-q7rjys3wgu
title: "`npm test` fails with EDQUOT (-122) on /tmp under heavy load, because the per-user quota runs out while the filesystem still has space (test, priority P2; source: owner confirmation 2026-11-23, reported by forgent-claude-a3)"
status: proposed
priority: P2
area: test
created: 2026-11-23
---

# Why

`/tmp` is a 16 GB tmpfs with a user quota (`usrquota`). While heads and test runs share it, the quota for the user is used up although about 9.5 GB of the filesystem is still free, and `npm test` fails with EDQUOT (-122). This differs from the inode exhaustion in p-olifa4mlty: the leak fix alone may not prevent it, because concurrent runs can reach the quota without leaking.

# Done when

A full `npm test` run under the usual concurrent load of heads does not hit EDQUOT. The fix is chosen between moving the run-tests temp directory off `/tmp`, or raising the quota; the choice needs the owner or the supervisor, with the cost of each stated.

# Notes

Related: p-olifa4mlty (test suites leak temp dirs into /tmp).
