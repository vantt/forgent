---
id: install-setup-doctor-gate
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Install/setup/doctor gate
description: Before a change is done, check config keys, runtime dependencies, incident reporting, install levels and the changelog against the distribution vision
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[definition-of-done]]"
---

# Install/setup/doctor gate

`docs/platform/packaging-distribution/history/distribution-vision.md` sets the direction for this repo's own
cài đặt/setup/doctor story. Before any change is done, check:

- A new config key goes into `core/config-standard` and `core/config-schema`;
  nothing registers a default anywhere else.
- A new runtime dependency (a tool it shells out to, a file or directory it
  expects, a platform capability) needs a row in
  `packages/distribution/contracts/doctor-registry.v1.json`, judged by its
  owning crate (a row of a layer still in Node is bridged with its step's
  label), and a registered fix only when the repair is safe and about
  readiness.
- A new runtime state or incident class must be reportable and repairable
  through its component's own verb, on that component's normal path, never
  only through doctor. Doctor may carry one read-only pointer row for it
  ("N open, run <verb>"): it warns, never repairs, and never fails except the
  cases `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
  section 3 names.
- A rule about the fgOS repo's own files goes into `npm test`, CI, pre-commit
  or the release check, never into doctor.
- Never hardcode an assumption about which install level (global vs
  project) is active — per the vision doc, project config always
  overwrites global, and fgOS stays aware of both without conflict.
- If the change touches how fgOS gets installed, upgraded, or diagnosed at
  all, read `docs/platform/packaging-distribution/vision.md` and `docs/platform/packaging-distribution/spec.md`
  first — a new module gets a spec/config-registry entry before it gets
  code, same bar as a new product area (definition-of-done, question 2).
- Does this change something a user of fgOS would see? If yes, add one file
  under `changelog.d/` (`changelog.d/README.md` names the scheme); never edit
  `CHANGELOG.md` directly.
