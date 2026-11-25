---
id: ds-zfqskcns7j
title: "Component authority: what it covers and whether the model needs a module level"
status: open
source:
  - p-adv35azsca
created: 2026-11-25
---

discussion: open

Opened by the owner on 2026-11-25 through the secretary.

## Starting point (from the model files, not yet checked against the spec)

- `packages/component-authority/model/` holds layers (entry, use-case, infra, domain, kernel, with three rules), components, decision kinds, doors and the contract index.
- A subcomponent is a component row whose spec sits under `docs/platform/<area>/subcomponents/`; there is no separate subcomponent file.
- The authority owns the contract index, not contract contents (its `mustNotOwn` says so).
- The words "module" and "submodule" do not appear in `components.yaml`, `layers.yaml` or `contracts.yaml`.

## Open questions for the owner

1. Is a module (or submodule) a level the model should know, or is a component row enough?
2. Is the current boundary of what component-authority owns right?
