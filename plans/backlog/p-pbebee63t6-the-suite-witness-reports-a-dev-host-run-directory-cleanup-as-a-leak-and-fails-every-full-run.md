---
id: p-pbebee63t6
title: The suite's `.fgos` witness reports the cleanup of a `fgos:dev` run directory as a leak, so every full run exits 1 (tests; source: owner order via lead:SUPERVISOR, 2026-11-25)
status: proposed
priority: P2
area: tests
created: 2026-11-25
---

# Why

On both full `npm test` runs that were not void, on 2026-11-25 (18:23 to 18:34 and 18:56 to 19:08), `run-tests` ended with `ERROR: test suite leaked unexpected files or modifications into .fgos store: Deleted (1): .fgos/runtime/dev-host/run-<id>` (`run-csuu1U`, then `run-5sQ9EM`). The first run had all four leads held idle. A separate whole-store walk taken before and after the first run did not contain that directory at either end, so it did not exist at 18:23:32 or at 18:34:15.

The dev-host tests do not touch the real directory: `test/rust-host/dev-host.test.mjs`, `test/scripts/run-rust-dev-host-staging.test.mjs` and `test/distribution/native-addon.test.mjs` were each run alone while the real `.fgos/runtime/dev-host` was watched every 50 ms, and no entry appeared or disappeared. They stage their own temporary checkouts. `scripts/run-rust-dev-host.mjs` removes its own run directory after its child exits, prunes stale ones at the start of the next invocation, and keeps a directory while a detached child (for example `events sync`) still names its staged host, so the directory is a short-lived artifact of whichever session ran `npm run fgos:dev`, not of a test.

# Done when

A full suite run on a quiet tree reports no leak for a dev-host run directory: either the witness leaves `.fgos/runtime/dev-host/` out because the dev door owns it, or the dev door keeps its run directories out of the store the witness watches. One test states the chosen rule.

# Notes

Not proven which process created and removed the directory. The window is short (a few seconds to minutes), so a session that ran `npm run fgos:dev -- <verb>` just before or during the suite is the likely writer; the detached `events sync` child named in `dev-host.test.mjs` is a second candidate. Until the rule exists, a leak line that names only a `dev-host/run-*` path is not a test leak.
