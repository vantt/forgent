# forgent

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

- README.md — product description + documentation index
- docs/platform-foundations.md — L1-L8 locked design laws; L5 is this repo's definition of done (six questions, below)
- docs/specs/system-overview.md — area map, shared entities, cross-area flows
- docs/specs/reading-map.md — where every doc and source path in this repo lives
- docs/backlog.md — product backlog (PBI rows: proposed / in-flight / done)
- docs/routing-handoff-contract.md — agent-to-agent handoff contract + trust boundary
- docs/decisions/ — long-form decision records

## Before touching code

Read `docs/specs/reading-map.md`, then the area spec under `docs/specs/` for whatever
you're about to change. Specs are the state layer — BA-grade, tech-agnostic — read
the spec before the code.

## Definition of done (platform-foundations L5)

A stranger agent with no chat history should be able to answer, for any change:

1. **What to read first?** `docs/specs/reading-map.md`, then the relevant area spec.
2. **What kind of work is this?** Check it against the area's spec and
   `docs/backlog.md`; a new product area gets a spec before it gets code.
3. **What contract does it touch?** `docs/routing-handoff-contract.md` for
   agent-to-agent boundaries; the area spec's Shared Entities table for
   in-process contracts.
4. **How much risk?** Does it change a locked law in `docs/platform-foundations.md`,
   or existing covered behavior in the test suite? Either raises the bar.
5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) green;
   new or changed behavior gets a matching test.
6. **What learning gets left behind?** A settled decision goes into
   `docs/decisions/`; a settled spec fact goes into the relevant
   `docs/specs/<area>.md`.

## Changing a locked law

Laws in `docs/platform-foundations.md` are fixed until their named review
threshold is hit. Changing one supersedes its decision ID — never edit it in place.
