# Phase 00: facts and measurements

Goal: numbers and answers before any design is frozen. Output: a report under `plans/reports/` and go or stop for the owner. No source change.

Questions:
1. Does a Rust append of one small event to `project:mailbox` through the Event Store fit a remote `send` budget (proposal p95 at most 200 ms; a local send is about 10 ms)? Measure on ext4 with current main; read HARDEN R13 and R14 first.
2. Can the hook start one detached child and return inside the 50 ms p95 target? Measure the real hook with a stub child.
3. Does the owner's remote accept and serve `refs/fgos/*` (ES spec 23.2 item 5)? Read-only check against the refs the machines already pushed.
4. Real end-to-end Git latency between two machines with default `eventStore.sync.intervalSec`, using an identity entry as the probe.
5. How many mailbox heads are visible in the shared directory today (expected: few, see plan "What exists" item 1), and how stale is the view.
6. Where does the Rust detached door live (host wiring or a shared crate) and what rules it must copy from `src/cli/detached-child.mjs` and `src/event-store/maintenance.mjs`? OPC decides; one-door principle: reuse, do not re-implement alongside.
7. Layering: confirm the `RemoteMail` port and host adapter satisfy `docs/architecture-manifest.json` and the spec 4 rules before code.

Verification: each number names command, machine, commit and sample count. Stop rule: question 2, 3 or 6 failing ends the plan and goes to the owner.
