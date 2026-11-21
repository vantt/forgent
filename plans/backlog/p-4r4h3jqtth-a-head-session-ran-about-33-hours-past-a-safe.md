---
id: p-4r4h3jqtth
title: "A head session ran about 33 hours past a safe context size without rotating, and nothing recorded why (session rotation, priority high; source: owner via Miu, 2026-11-21)"
status: done
priority: P1
area: session-rotation
created: 2026-11-21
---

# Why

The secretary head generation 17 started 2026-11-19 14:52Z and the owner rotated it by hand at 2026-11-21 00:19Z; in between `rotation.log` and `incidents.jsonl` hold no line, not even a refusal, while the owner saw its work get less precise. Not proven: whether the stop hook ran, whether it measured the real context (no status-line sidecar ships, so it uses the transcript one turn stale), or whether it asked and was refused. Known gaps: the hook's failures go only to stderr under `|| true` (`apps/fgos/src/wiring/session_rotation_hook.rs`, `.claude/settings.json`), so a failure leaves no trace; the hook runs the activated release the head started with (see p-ycausep3zs). Evidence: `.fgos/runtime/session-rotation/secretary-miu/`. Owner decision 2026-11-21 (option a, via Miu): automatic rotation soft is 0.15 (about 150k of the 1M window) for the secretary and supervisor personas only, set through `sessionRotation.personas` in core/config-standard; every other persona keeps 0.4; hard stays 0.7 (at least soft).

# Done when

Prove the cause from the generation 17 transcript and the hook path; every stop decision (measured fraction, level, request outcome) and every hook failure leaves one line in a rotation record the owner can read; an owning test covers a head that stays above soft across many stops.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0745-head-rotation-trace, commit 65ad518d5).
