# Before-bytes: what agents receive at start today

Measured on `1895c8df4f9080cd345e80fcd04560d64427a33a` (main after the rule gathering landed), 2026-11-27, by reading the files; tokens ≈ bytes/4, the same measure as the discussion's `#ambient` (plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md). The goldens are written by `packages/agent-start-context/goldens/record.mjs`.

## Always-loaded text

| Part | Bytes | ~Tokens | Writer |
|---|---:|---:|---|
| AGENTS.md hand-written (title, documentation index) | 1,746 | 436 | people/agents |
| AGENTS.md MDView block | 806 | 201 | external mdview |
| AGENTS.md GitNexus block | 2,902 | 725 | external gitnexus analyze |
| AGENTS.md fgOS projection block (rule units) | 37,016 | 9,254 | npm run build:skills from .fgos/instructions/effective/rules.json |
| AGENTS.md AgentKit block | 16,953 | 4,238 | AgentKit installer |
| AGENTS.md separators between blocks | 3 | 0 | - |
| CLAUDE.md | 505 | 126 | hand |
| .claude/rules/*.md (8 files, main checkout, read-only) | 16,867 | 4,216 | AgentKit installer |
| **Total** | **76,798** | **19,199** | |

The fgOS-owned part of AGENTS.md is now the hand-written top and the projection block: the rule gathering (plan `261125-2041`) moved every hand-written rule section into a unit, so the projection carries them all with no `when:` restriction. Phase 9 cuts that by L8.

## Goldens

| Delivery | Case | Bytes | ~Tokens |
|---|---|---:|---:|
| opening | lead-handoff | 1,985 | 496 |
| opening | lead-plain | 1,883 | 470 |
| opening | lead-question | 2,011 | 502 |
| opening | lead-task | 2,049 | 512 |
| opening | planner-handoff | 1,932 | 483 |
| opening | planner-plain | 1,830 | 457 |
| opening | planner-question | 1,958 | 489 |
| opening | planner-task | 2,062 | 515 |
| opening | secretary-handoff | 3,295 | 823 |
| opening | secretary-plain | 3,193 | 798 |
| opening | secretary-question | 3,321 | 830 |
| opening | secretary-task | 3,193 | 798 |
| opening | shaper-handoff | 1,979 | 494 |
| opening | shaper-plain | 1,877 | 469 |
| opening | shaper-question | 2,005 | 501 |
| opening | shaper-task | 2,037 | 509 |
| opening | supervisor-handoff | 2,849 | 712 |
| opening | supervisor-plain | 2,747 | 686 |
| opening | supervisor-question | 2,875 | 718 |
| opening | supervisor-task | 2,747 | 686 |
| agent-file | buyer-channel-skeptic | 1,238 | 309 |
| agent-file | code-reviewer | 1,102 | 275 |
| agent-file | council-assumptions | 1,215 | 303 |
| agent-file | council-feedback-loops | 1,315 | 328 |
| agent-file | council-ship-maintain | 1,307 | 326 |
| agent-file | debugger | 990 | 247 |
| agent-file | docs-manager | 1,107 | 276 |
| agent-file | fgos-placeholder | 1,200 | 300 |
| agent-file | fullstack-developer | 1,207 | 301 |
| agent-file | lead | 1,156 | 289 |
| agent-file | offer-pricing-critic | 1,203 | 300 |
| agent-file | planner | 1,210 | 302 |
| agent-file | researcher | 1,170 | 292 |
| agent-file | secretary | 2,834 | 708 |
| agent-file | shaper | 1,518 | 379 |
| agent-file | solo-capacity-checker | 1,264 | 316 |
| agent-file | supervisor | 2,162 | 540 |
| agent-file | value-chain-strategist | 1,311 | 327 |
