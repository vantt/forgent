---
id: p-n7k252st2o
title: "The code:implement route falls back from gemini (quota out) to thehive/deepseek, which fails exit 11 on credential refresh-ahead unexpected-shape (execution, priority medium; source: closing report of plan 261122-1950)"
status: proposed
priority: P2
area: execution
created: 2026-11-28
---

# Why

During plan 261122-1950 the `code:implement` route decided `gemini`, whose quota was out; its fallback through thehive/deepseek failed exit 11 with `credential refresh-ahead ... unexpected-shape`. Every unit had to run with `--provider claude`, so the route gave no working default. Evidence: `plans/261122-1950-owner-communication-standard/reports/lead-261128-2202-owner-communication-closing.md`, debt item 3. Related, not the same: p-hzzcgzhrv6 (refresh-ahead spending a live seat's token).

# Done when

A quota-out primary on `code:implement` falls back to a working executor without a hand `--provider`, or the refresh-ahead shape fault is fixed so the thehive/deepseek fallback runs; a test proves the fallback path.

# Notes

Opened by the supervisor from the lead closing report, 2026-11-28.
