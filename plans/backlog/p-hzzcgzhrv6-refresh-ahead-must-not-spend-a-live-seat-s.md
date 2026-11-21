---
id: p-hzzcgzhrv6
title: "Refresh-ahead must not spend a live seat's single-use refresh token (S6A, priority high; source: lead:OPC review of e0134abff, 2026-11-19)"
status: proposed
priority: P1
area: execution
created: 2026-11-19
---

# Why

(1) `takeLiveSeatLogin` probes a candidate whose access token is merely ahead of now; if that token is near its own expiry the probe's CLI renews the copy and spends the live seat's refresh token, so the still-running seat fails at its next refresh. Take a candidate only when its access life exceeds the probe timeout plus a margin (about 10 min); a near-expiry seat renews first and the next refresh-ahead takes its newer pair. (2) Older than that fix but now visible: every seat starts sharing the store's refresh token, and when a seat outlives its access token (long heads such as Miu), refresh-ahead's renewInScratch spends the shared token and the seat breaks later. While a live seat shares the store's refresh token, refresh-ahead skips renewInScratch (reason `live-seat-owns-renewal`) and takes the seat's pair after the seat renews. Both in Node (`src/runner/dispatch/provider-credential-renewal.mjs`) and the engine mirror (`packages/execution/engine/src/credentials/renew.rs`).

# Done when

Owning tests on both sides: a near-expiry live pair is not probed; with a live seat sharing the refresh token, refresh-ahead does not renew in scratch and takes the seat's pair once renewed; no credential value in logs or tests.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
