# Phase 02: Rust detached door and head publication

- One Rust door starting one detached child, never waited on, bounded lock, exit 0; modes `seal+push` (sender) and `fetch+ingest` (receiver). Rules copied from the Node end trigger, placed where OPC decides in phase 00. The hook uses it only when the last fetch is older than the interval.
- Head publication: the child publishes a mailbox head's directory entry through the identity `directory` feature, from host wiring; the hook and `register_writer` never publish.
- Doctor facts for later: last publish, last fetch age.
- Files: host wiring under `apps/fgos/src/wiring/`, tests next to it; one-door census regenerated. Verification: tests for the never-wait rule and a killed child leaving no state; msvc and darwin checks (door unix-gated like the rest).
