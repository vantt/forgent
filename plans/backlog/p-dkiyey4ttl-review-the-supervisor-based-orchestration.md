---
id: p-dkiyey4ttl
title: Review the supervisor-based orchestration against other people's published experience (owner 2026-11-19)
status: proposed
priority: P2
area: supervisor
created: 2026-11-19
---

# Why

The owner asked whether the supervisor design (a no-LLM watcher wakes a stateless supervisor head that admits ready plans, starts one lead per plan, restarts or parks gone leads, closes done plans, starts planners and resumes askers) is sound and what it should do differently from other systems. Two live-run windows of the supervisor plan stopped on confined-sandbox failures (a confined supervisor could not read its own queue and plans; its start-ritual commands failed).

# Done when

A shaper discussion with the owner, then a written advice (strengths, differences from other orchestrators, gaps with evidence and source, failure modes others hit), each claim marked verified or inference; any follow-up work becomes its own row.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
