# Phase 03: remote send

- Resolve local first (unchanged); only when no local head answers, fold the shared view directly (not the cache). A remote result takes the event path; notices stay local.
- Sign, pass `write_readiness`, append to `project:mailbox`, then record quota in the snapshot; start the `seal+push` child; refuse over 2 KiB with a clear message.
- Report: `recorded <id> for <name> on <machine>`, cross-machine, recorded and not delivered, with the real expected delay (sender seal and push, plus the receiver's fetch interval, longer when no fgOS process runs there).
- Rate and lifetime caps count per verified sender; spec 5.3 stands for local senders.
- Files: store crate port, host adapter, verbs and surface; census. Verification: tests for ambiguous and stale remote resolution, over-cap, unwritable store, failure between append and snapshot (repaired once, counted).
