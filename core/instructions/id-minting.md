---
id: id-minting
kind: procedure
owner: core
scope: repo
mode: append
appliesTo: ["*"]
specificity: 10
title: Id Minting
description: Every id that travels between machines comes from fgos identity mint, never counted or invented by hand
---

# Id Minting

Every id that travels between machines (a work item, a backlog row, a `D-ADR####` decision number, a decision file number) comes from `fgos identity mint <kind>` (`work`, `backlog`, `d-adr`, `decision-file`; `--json` for machine output). Never read the highest number and add one, never derive an id from a title. The mint door owns the rule (`docs/platform/identity/spec.md`, section 4a); a `d-adr` or `decision-file` claim needs the network and fails clearly without it, and the format never changes to work around that.
