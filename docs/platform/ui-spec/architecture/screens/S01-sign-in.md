---
id: S01
type: screen
name: "Sign in"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: [R3, R4, R6]
regions: [brand, form, footnote]
---

# S01 — Sign in

```txt
Document type: Architecture
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/screens/S01-sign-in.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/screens/S01-sign-in.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding.  Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.


## Purpose

The first and only door. Nothing on this client is readable before it
(`docs/specs/herdr-web-dashboard.md` §Sign in, R3). It exists to take one
credential — the machine's token — and exchange it for a session.

Designed for the origin case: a phone, one-handed, at a moment when no
cockpit terminal is open. So the form is one field, the field is the
focus, and there is nothing else to read or decide.

## Layout

```
┌──────────────────────────────────────┐
│                                      │
│              herdr                   │  brand
│         fgOS work dashboard          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Access token                   │  │  form
│  │ ┌────────────────────────────┐ │  │
│  │ │ ••••••••••••••••••••••••   │ │  │
│  │ └────────────────────────────┘ │  │
│  │                                │  │
│  │ [        Sign in         ]     │  │
│  │                                │  │
│  │  Sign-in failed.               │  │  (ERR-AUTH, one message only)
│  └────────────────────────────────┘  │
│                                      │
│  Reachable beyond this machine.      │  footnote
│                                      │
└──────────────────────────────────────┘
```

Mobile is the same layout at full width — there is nothing to reflow. The
token field uses a password-type input so a shoulder-surfer on a train
sees nothing, and so the browser does not offer to autofill it into
unrelated forms.

## States

- **ST-READY** — empty field, focused, submit disabled until non-empty.
- **ST-SUBMITTING** — submit shows progress; the field stays visible but
  read-only.
- **ERR-AUTH** — one message, always the same words, no matter the cause.
  This is R3 rendered: the screen must not become an oracle that tells an
  attacker which half of their guess was right.

Three things this screen never does, each one a rule:

- never shows the token back, never writes it anywhere but the request,
  never keeps it after the session cookie exists (R4);
- never says "open the cockpit first" — the dashboard's availability does
  not depend on a terminal being open (R6);
- never offers "remember me" as a way to skip the door.

## Interactions

```yaml herdrweb-contract
interactions:
  - id: A-S01-001
    element: token_field
    region: form
    trigger: input
    action: mutate
    effects: [enable_submit_when_non_empty]
  - id: A-S01-002
    element: sign_in_button
    region: form
    trigger: submit
    guard: "token.nonEmpty"
    action: navigate
    target: S02
    effects: [establish_session, clear_token_from_memory]
```
