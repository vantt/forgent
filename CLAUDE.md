# Project Rules

The bare import below loads the project rules from AGENTS.md at
context-load time. Never wrap it in backticks; that disables it.

@AGENTS.md

## Impact-analysis capability gate

The GitNexus "Always Do" / "Never Do" rules below assume GitNexus is
present on this machine. Before treating them as binding — and before
`fgos-planning`/`fgos-validating`/`fgos-executing` decide how much
impact-analysis evidence a plan's verify/test scope needs — query the
capability instead of assuming the tool:

```bash
fgos tool query --capability impact-analysis --status present
```

- **0 providers registered** — Inactive: skip impact-analysis evidence in
  verify/test scope; note `impact-analysis: inactive` in the plan/verify
  note. Not a gap.
- **Registered but not `present`** — Degraded: run every other required
  check, mark that proof weak, and name the gap plainly (e.g. "GitNexus
  registered but not present on this machine — blast radius not
  confirmed").
- **`present`** — Full: the MUST rules below apply exactly as written.

This gate is prose the agent reads, never compiled logic — GitNexus is
the first registered provider for `impact-analysis`, not the only one
this gate can ever recognize. The block below regenerates from
GitNexus's own template on `gitnexus analyze`; edit this gate section
when the policy changes, never the rules inside the block.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **forgent** (7889 symbols, 12124 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
