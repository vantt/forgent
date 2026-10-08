# Advisory path M: owner decisions and parked questions (2026-10-08)

Source: owner replies after the chair verdict in `kongming-advisory-chair-verdict-261008.md`. Parked items are not scheduled; they are written down so they are not lost.

## Decided by the owner

1. **Specialist need is a required field.** The final packet of the registered advisory flow carries a structured field "missing expertise X" (empty when none). It is not free text. The close gate reads it and asks one batched question: bring in X or not. Reason: without a required field a gap can slip through silently, which is the real loss of dropping the automatic specialist.

2. **Live-run target stays `mcp-skill-hub`** (`/home/vantt/projects/mcp-skill-hub`, the Skill Hub project; operator trust entry already exists). Known limit: the advisory agent already used it for its own live gates and the comparison packet `bab4742a` came from it, so the owner's rating is not fully independent. One run answers whether M completes, not how good its advice is. After M completes, rate quality on a fresh topic.

## Parked: return to the automatic specialist

- Path M hands an unfilled specialist need to the owner at the close gate instead of continuing automatically. One of two real observed cases was triggered by the advisors alone, so the automatic path has real use.
- Return to it only after M's live run is rated and the separate dispatch item has landed (Unit association first).
- Evidence that should trigger the return: named expertise gaps keep appearing and the owner finds the extra round-trip worse than automatic continuation; or reopen reruns prove too slow.
- Shape to reuse when it returns: a reopen with `--context-ref` from the parent run, not a new driver.

## Parked: can the lead compose the panel before it opens

Owner question: before the panel opens, why can the lead not build a panel that already has the right experts?

What exists today (`core/workflows/architecture-advisory.yaml`):
- A `framing` step (solo, persona `advisor`) already runs before `shaping`.
- The `shaping` panel has three fixed viewpoints (system, alternative, constraint) written into the objective. They are the same for every topic. Nothing carries framing's finding of what expertise the question needs into the seats.

What an upfront composition would give: fewer gaps found late. What it cannot give: gaps only visible after the analysis (unknown unknowns), so the close-gate field above stays needed. The two complement each other.

Options to weigh later (none chosen):
- A. Framing outputs a required "expertise needed" field; the owner confirms it at a gate before shaping. Cheap, but adds a human round trip at the start, against the "release the human" priority.
- B. The skill (lead) picks one of a few registered definitions or panelist params before starting the workflow. No runtime change, but it conflicts with M's kill rule "a third definition appears".
- C. Seat params are taken from framing's output. Most flexible, but needs a new contract (a step output feeding seat params) and risks becoming a sequencer.

Unresolved: whether the seat set differs enough between topics to justify any of A to C, or whether three fixed viewpoints plus the close-gate field is enough. Test this with the first M live run on `mcp-skill-hub`.

## Parked: the registered flow is a domain-neutral core in a software-architecture shell

- `core/skills/fgos-architecture-panel/SKILL.md:16` calls it the specialist surface for software-architecture advice and sends generic business, product and policy panels to another skill.
- `core/workflows/architecture-advisory.yaml` is domain-neutral: only the `architecture:*` capability names and one mention of "architectural constraints"; the three seats are system, alternative and constraint viewpoints.
- Consequence: topic-specific expertise has to come from the seats, which are fixed, which is why the missing-expertise field and the panel-composition options above matter. No rename or split now.
- Check after the first M run: run the same flow on a non-software topic (business or policy). If the advice is still good the core is truly shared; if not, it is neutral only on paper.
- Not checked: the rest of the 390-line skill for software-specific constraints on the seats.
