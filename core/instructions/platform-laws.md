---
id: platform-operating-laws
kind: law
owner: core
scope: repo
mode: append
appliesTo: ["*"]
specificity: 10
title: Platform Operating Laws
description: Core platform operating laws L1-L8 defining immutable platform invariants
---

# Platform Operating Laws

Platform laws L1-L8 locked in `docs/platform-foundations.md` define immutable invariants for all fgOS agents:

1. L1: Dogfood without compromise — fgOS runs on its own foundation.
2. L2: One-door mutation — state mutation only happens through registered state-bearing verbs.
3. L3: Evidence over assertion — no claim without machine-reproducible proof.
4. L4: Explicit boundaries — clear contract between components, domains, and runners.
5. L5: Definition of Done — six questions answered before code lands.
6. L6: Separation of mechanism from policy — policy lives in contracts, mechanism in engine.
7. L7: Replay and auditability — all events recorded and replayable.
8. L8: Bounded autonomy — agents operate within explicit permission boundaries.
