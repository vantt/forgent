---
id: coding-verification-discipline
kind: procedure
owner: coding
scope: domain
mode: append
appliesTo: ["*"]
specificity: 30
title: Coding Verification Discipline
description: Verification discipline for coding-domain agents — targeted proof per unit, full suite only at declared gates
---

# Coding Verification Discipline

A coding worker runs the verification its unit declares (a Work item's `verify`, a cell's phase `## Verification`) and reports the real outcome. The full test suite belongs to declared gates — full-suite gate phases, track close, Work verify/reverify — never to every implement or fix round. A reviewer or red-team who believes the declared verification is insufficient reports a coverage finding as an advisory; it never expands its own run. The Lead holds sole escalation authority: an accepted finding upgrades the proof requirement for the current cell only (`Proof: escalated-to-full`), or the Lead provides an evidence-backed rejection.
