---
id: p-wyxefmikmt
title: Ingest OpenTelemetry (OTLP) from agent CLIs (observe, priority low)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

Claude Code and Codex can export OpenTelemetry metrics and events (tokens, requests, cost). Observe names its token measures after the OTel GenAI conventions (`observe-names.json`, version 1.37.0) but has no OTLP receiver, so usage of interactive head sessions comes only from transcripts.

# Done when

A survey names what each CLI exports and how; an ingestion path maps it to declared kinds with the same `gen_ai.*` names and writes through the write door, fail-open; no OTel SDK or collector is linked into the core.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
