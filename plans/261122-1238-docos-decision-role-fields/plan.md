---
type: plan
title: Decision units carry their role fields, projected from the decision events
status: done
owner: lead:DOCOS
created: 2026-11-22
---

# Decision units carry their role fields, projected from the decision events

The owner approved direction (c) on 2026-11-22 after the [pkm roles probe](../reports/research-261122-0828-docos-pkm-roles-probe-effective-decisions.md): the event store keeps the decision act, Markdown keeps the content, the decision writer writes role fields, and pkm computes the set in force. The owner then approved this build step ("cho phép em làm việc 2", 2026-11-22 12:37).

## Outcome

Every scoped `D-ADR####` decision unit in its holder document carries one machine-owned field line under its heading:

```text
[valid_from:: 2026-10-18T14:42:56.000Z] [replaces:: D-ADR0061]
```

The line is projected from the decision events. It is never written by hand, and a check fails when the documents and the events disagree. pkm `v0.5.0` then computes the right set in force over the real documents, not a copy.

## Facts (what exists, what was reused)

- `fgos decision` appends a decision event with `text`, `rationale`, `scope` and `relation` (`none`, `supersedes:<id>`, `amends:<id>`, `touches:<id>`; `amends` landed 1f7fb5ced). Scoped events start their text with `D-ADR####:`. It writes no Markdown.
- `fgos decision-index` (`src/report/decision-index.mjs`) already projects scoped events into `docs/decisions/index.md`, with a `--check` mode, and already resolves a scope to its narrative holder through `narrativeHolderResolver` (the governance holder table). **Reused:** the role fields are a second output of the same projection, through the same door and the same check. No second writer is added (design principle 1, L10).
- Headings already carry `D-ADR####` ids, D-ADR0055 to 0060 have id-led headings (bddb4fe0d), and the 12 docs-only ids have events (edd3e4486).
- The probe's run B wrote the same fields on a copy and got the right answer (3 units end, all right). Its relation classification (8 partial, 3 full, 2 unresolvable targets) was done by reading each decision and is reused here.
- The 36 migrated decisions share one event date (2026-08-17, the migration). Their original dates exist in the retired corpus: `git show 4722361ae^:docs/decisions/<n>-*.md` has a `date:` frontmatter field in each of its 35 files.

## Decisions taken in this plan

1. **The fields are a projection.** `fgos decision-index` writes them and `fgos decision-index --check` fails on drift. They are never hand-written, so they cannot drift from the events (L3: truth in the log, documents are views).
2. **A correction is a new event.** Events are append-only. For each `D-ADR` id, the latest scoped event decides the relation, so a decision whose old event says `supersedes` but is partial gets a new event that says `amends`. The latest event restates the relation in full (`none` clears it).
3. **`valid_from` is the date of the act.** It is the event's optional `validFrom` when present, otherwise the timestamp of the first event for that id. `fgos decision --valid-from <date>` sets it, for an act that predates its record (the migrated decisions).
4. **Targets are written as ids.** A `D-ADR`, `ADR####` (read as `D-ADR####`), bare decision-file number, law (`L3`) or `RUL` target is written as is. An event-hash target is not resolved: the decisions that had one got a correction event naming the unit. Any other target is a warning and is not written.
5. **A decision with no heading in its holder is a finding,** not an inserted heading: the projection never creates prose.
6. **Out of scope:** relations between `RUL` bullets that no decision event carries (RUL72 and RUL69, RUL108 and RUL101), clause targets (waiting for pkm request 2), and the `fgos doc` decisions-in-force view, which needs `pkm-core` linked (documentation build step 3).

## Phases

| # | Phase | Status | Done when |
|---|---|---|---|
| 1 | Event `validFrom` and the field projection in `decision-index`, with `--check` | done (693916070, 8cb301708, 2a3e7f2f3) | `decision-index` tests cover: field line written, rewritten in place, removed when the relation becomes `none`, hash target resolved, unresolvable target and missing heading reported; `--valid-from` round trip |
| 2 | Data: correction events for the 11 classified relations, `--valid-from` events for the migrated decisions from the retired corpus dates, then regenerate | done (74045ce23, 9e3842f21: 51 events) | `fgos decision-index --check` exits 0 on main; the diff touches only field lines and index rows |
| 3 | Acceptance with pkm `v0.5.0` over the real documents | done ([report](../reports/acceptance-261122-1359-docos-decision-role-fields-pkm-v050.md)) | `in_force --units` ends exactly the units the events say end, `--as-of 2026-10-18T14:40Z` shows D-ADR0061 in force, and the result is in a report |

## Risks

- **Hand edits to a field line** are overwritten by the next regeneration. The check catches them before a commit lands.
- **Pre-commit doc checks** read field lines as text; `[x:: y]` is plain Markdown and needs no exemption. Verified in phase 1.
- **A changed event contract** (`validFrom`): readers that ignore unknown fields are unaffected; the decision view and `decision-index` are the only readers that use it.

## Rollback

Revert the phase commits. Correction events stay in the log (append-only), and a later event can restate the old relation.
