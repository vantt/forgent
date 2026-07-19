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

## fgOS Workflow

A session opening in this repo to work an item through its lifecycle loads
`fgos-routing` first (`.claude/skills/fgos/fgos-routing/SKILL.md`): it orients
on open work, claims one item through the pull door, then points to
`fgos-exploring`, `fgos-planning`, or `fgos-validating` based on where that
item's `stage` puts it.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **forgent** (1228 symbols, 2958 relationships, 101 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/forgent/context` | Codebase overview, check index freshness |
| `gitnexus://repo/forgent/clusters` | All functional areas |
| `gitnexus://repo/forgent/processes` | All execution flows |
| `gitnexus://repo/forgent/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
