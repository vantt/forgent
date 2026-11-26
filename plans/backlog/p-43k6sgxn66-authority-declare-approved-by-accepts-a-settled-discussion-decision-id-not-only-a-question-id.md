---
id: p-43k6sgxn66
title: "`fgos authority declare --approved-by` should accept a settled discussion decision id, not only an answered question id (authority; source: supervisor via mail, 2026-11-26)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-26
---

# Why

authority declare --kind component refuses without --approved-by naming an answered owner question. A decision settled in a discussion (a D-ID) has no question to name, so q-5sog3pzmqn re-asked the owner for ACE-D3 and ASC-D1, already settled.

# Done when

--approved-by also accepts the D-ID of a settled discussion decision, checked against the decision record; a question id still works; one lowest-layer test proves a settled D-ID is accepted and an unknown or unsettled one refused.

# Notes

Relayed by the supervisor from the when-to-ask shaper; the secretary has not read the shaper's round directly. Owner order "ghi backlog", 2026-11-26.
