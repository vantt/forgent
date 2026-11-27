---
id: p-qu6inz54uz
title: "Rename the overloaded `kind` fields by subject: `workType` for the kind of work, and ACE's start `kind` split into `sessionType` and `agentLifecycle` (ACE, domain registry, Work; source: owner via shaper of ds-que32ftgg6, 2026-11-26 16:29 and 16:40)"
status: proposed
priority: P1
area: agent-context-engine
created: 2026-11-26
---

# Why

`kind` names many different things across the repo (136 contract files: executor, path, event, observation and start kinds), so a reader cannot tell which meaning a `kind` carries. The owner set the direction in discussion `ds-que32ftgg6` round 11:

- `workType` (agreed) names the kind of work: the ACE `when:` key and the Work item / initiative field.
- ACE's start `kind` (`head`, `worker`, `setup`, `hook`) mixes two categories and splits into `agentRole` (`head`, `worker`) and `agentLifecycle` (the moment: `setup`, `hook`, and presumably the session start). `launch` was rejected as unclear.
- `agentFamily` (owner, round 12, 17:00) replaces ACE's `cli` key (claude, codex, agy, pi, omp), matching the runner's existing word "family". Three levels stay apart: agentFamily (which agent CLI), executor (one concrete way to run that family, e.g. `claude-cli-bwrap`), model (the model the family uses at a tier).

`type` and `job` are taken (pkm `type`, JSON-schema `type`; authority door rows `job:` in 83 files), and `task` is a work-kind value and the `tsk-` prefix.

# Key set (settled; supersedes the bullets above where they differ)

Use the 11-key set at the end of `plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md` §6 ("Hình dạng mới của bộ nhãn `when:`"), not the round 11-12 names above:

- What the work is: `domain`, `workType` (new; replaces the Work item / initiative `kind`), `workflow`, `stage`, `project`.
- Who the agent is: `persona` (the charter), `role` (narrowed to the part in a workflow step), `sessionType` (head, worker; half of today's start `kind`, replacing the earlier `agentRole`), `agentFamily` (the model family: claude, openai, gemini), `agentCli` (claude-code, codex, pi, omp, agy; replaces `cli`).
- When in the agent's life: `agentLifecycle` (setup, start, hook, ...; the other half of today's `kind`).

The same item also renames the free-text `role:` line in `core/agents/*.yaml` to something like `summary`. Every caller moves in the same change and the old names are deleted (the platform rule that a change moves every caller and deletes the old path in the same change, and the rule that an audit makes what exists better, not bigger). Source of this correction: supervisor event e3ed5bd4d7c27190 from the shaper of ds-que32ftgg6.

# Owner order 2026-11-27 (ds-3in4yb5thk D11): Work item field now

The owner ordered the Work item field `kind` renamed `workType` now, not later (discussion `ds-3in4yb5thk` D11, owner 11:2x; raised to the supervisor as event 6d6c8d74b70dfd53). This slice is planned and run first, on its own:

- Only the Work item field (work-state Data Dictionary row 3) and its readers. The word `kind` sits in about 824 files under `src`, `bin` and `packages` with other meanings (executor `kind: tool`, workflow `kind: guide`/`playbook`, settlement kind, event kinds, `classification.kind`); none of those change.
- Past events in the append-only log carry `kind`, so replay needs a one-time migration (precedent `scripts/migrate-status-proposed-to-awaiting-approval.mjs`, L3).
- `--json` envelopes change, so the change carries a CHANGELOG line.
- Scope owner of the label set is `ds-que32ftgg6` (`ds-k435vz65l2` D2); the ACE `when:` key `workType` already shipped in plan `261126-1851-ace-when-keys-v2`.

The rest of this item (the ACE start `kind` split, the `role:` line rename) keeps its earlier status.

# Done when

A shaped decision fixes the new names and how `agentRole` sits beside ACE's existing `role` key (lead, producer, reviewer) and `persona` key, which may already cover it; then one change renames each field in its contract and moves every reader (L10).

# Notes

Source: `plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md` §3 rows 15 and 17. It crosses ACE, the domain registry and the Work layer, so it is outside that discussion's scope and goes in its own item (RUL11 (mess seen outside the work in hand becomes a separate item)). The shaper raised it as a coordination-help event because it cannot write the backlog and could not reach the secretary.
