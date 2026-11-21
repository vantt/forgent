---
id: p-s3wbwcczts
title: "Standardize codex for native driving: headless codex seats hang on the 'Hooks need review' dialog (runner, priority high; owner order 2026-11-17: openai through pi first, then codex)"
status: proposed
priority: P1
area: runner
created: 2026-11-17
---

# Why

On fg-server2 (rc.10) codex seats in a probe and in the council's critique step never got their brief (`delivery: not-sent`) and sat until the 35-minute ceiling. Folder trust is seeded correctly; the gap is codex's per-hook approval `[hooks.state."<hooks.json>:<event>:<group>:<index>"] trusted_hash`: `seedCodexHookTrust` (src/run-supervisor/trust-store.mjs:494) seeds only hooks it can hash, and `codexHookTrustEntries` skips every hook with `commandWindows` (trust-store.mjs:471-473) because `codexHookTrustHash` (:447) does not reproduce codex's hash for that field. The project's AgentKit `.codex/hooks.json` has 31 hooks, 25 with `commandWindows`: 6 seeded, 25 skipped, so codex asks. Second gap: the codex screen profile has no marker for this dialog (packages/agent-protocol/rust/src/terminal/codex.rs:12-17, empty setup_markers), so the seat hangs instead of ending needs-setup.

# Done when

`codexHookTrustHash` matches codex's own hash including `commandWindows`, proven by a fixture captured from a codex-written trusted_hash, and nothing is skipped silently (a skipped hook is reported by name); the codex profile recognises 'hooks need review' as a setup marker so an unseeded hook ends the seat early; a live `fgos run --provider openai` through codex-herdr-bwrap and codex-cli-bwrap reaches pass on fg-server2.

# Notes

Migrated from the legacy backlog table. Original status: in-flight.
