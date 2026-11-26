---
id: domain-doctrine-read
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Domain Doctrine Read
description: Read domains/<domain>/AGENTS.md for the domain in play before working in it
lifecycle: live
valid_from: 2026-11-26
---

# Domain Doctrine Read

Once the domain resolves, read `domains/<domain>/AGENTS.md` (e.g. `domains/coding/AGENTS.md` when domain is `coding`) to load domain-specific standing doctrine before the first round, and before handing off to driving or loading the resolved stage skill; it states what the domain treats as settled, its constraints and its exits. An unknown domain is settled by `fgos-clarifying` first (`core/skills/fgos-clarifying/SKILL.md`).
