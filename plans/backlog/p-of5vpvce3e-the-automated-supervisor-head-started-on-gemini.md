---
id: p-of5vpvce3e
title: "The automated supervisor head started on Gemini, which is too weak to coordinate (supervisor, priority high; source: owner via Miu, 2026-11-21)"
status: done
priority: P1
area: supervisor
created: 2026-11-21
---

# Why

`supervisor-forgent` generation 41 (started 2026-11-21 01:22Z, run `.fgos/assignments/head-supervisor-forgent-41/runs/01`) was bound by provider capacity selection to `gemini`, account `tetnu`, launched through `agy`, while the secretary head runs `claude --model sonnet`. The owner's rule: a head that coordinates others runs on Claude: the secretary on Sonnet, the supervisor, the leads and the planners on Opus (owner corrections 2026-11-21; planners added 15:51 after the workflow-engine planner ran on agy/Gemini 3.8 Flash); a weaker model must never be chosen for it, even when it is the freest account. Not yet found: where a head persona's provider is chosen and why the supervisor persona accepts any provider.

# Done when

A head persona declares the providers and minimum model it may run on and the start door refuses or skips an account that does not meet it; covers every coordinating head persona (supervisor, lead, planner); an owning test starts the supervisor persona with only a Gemini account free and expects a refusal or a wait, not a Gemini head.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
