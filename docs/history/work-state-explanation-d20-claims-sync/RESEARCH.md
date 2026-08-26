# RESEARCH.md — work-state-explanation-d20-claims-sync (tsk-gli)

## Round 1 — 2026-08-26T07:40Z (stage discovery)

**Asked:** Verify the 9 factual/citation claims in tsk-gli's submission text
before judging clear/unclear — is the task's footprint and its D20/D26
citation path accurate against the current repo, or has something drifted
enough to need a person (exploring)?

**Checked:**

1. `grep -n "^claims:" core/agents/*.yaml` — 0 hits, exit code 1. **TRUE.**
2. `grep -l "^skills:" core/agents/*.yaml` — 7/7 files match
   (`planner.yaml`, `fullstack-developer.yaml`, `code-reviewer.yaml`,
   `fgos-placeholder.yaml`, `docs-manager.yaml`, `debugger.yaml`,
   `researcher.yaml`). **TRUE.**
3. `grep -l "requires-skill:" domains/coding/task-specs/*.md` — 13/13 files
   match (all task-specs in that dir). Header form confirmed via
   `judge-ambiguity.md`: `domain: coding | stage: discovery | role:
   implementer | requires-skill: fgos-coding-discovering`. **TRUE.**
4. `grep -rn "^agent:"` / `grep -rn "agent:"` on
   `domains/coding/task-specs/*.md` — 0 hits. No task-spec currently pins
   `agent:` — the field exists as a live capability in code
   (`src/runner/agent-roster.mjs` parses it, `src/runner/dispatch/cli.mjs`
   consumes it as a pin-wins rule) but no task-spec author has used it yet.
   **PARTIALLY TRUE** — task text said "hoặc pin cứng `agent:` ... khi cần
   chỉ định" (conditional/optional), which matches: the mechanism is real,
   just unused today. Not a blocker — the doc note should describe the
   field as available, not as actively used by a named file.
5. `src/runner/dispatch/cli.mjs:60` — `* 1. Task-spec declares \`agent:\`
   pin -> wins immediately, skipping skill-matching.` — exact match.
   **TRUE.**
6. `src/runner/agent-roster.mjs:121` — `if (key === 'requires-skill' ||
   key === 'agent')` — exact match. **TRUE.**
7. `src/runner/agent-roster.mjs` lines 1-9 (docstring) — line 3 reads
   `// domains/<name>/agents/ + legacy agents/) and a task-spec's own header
   // fields, for D20/D22's eligibility-inversion resolution` — bare
   "D20/D22" with zero file path, exactly as claimed. **TRUE.**
8. `docs/history/core-foundation-domain-boundary/DISCUSSION.md` D-local
   table:
   - D20 is at **line 461** (task claimed 461 — exact match). Full text:
     "Đảo hướng khai báo eligibility. Agent-type CHỈ khai role+persona
     (`soul` intent) + `skills`... KHÔNG còn `claims: [task-spec-ids]`.
     Task-spec khai `assignable-to: [tên agent cụ thể]` HOẶC tối thiểu
     `requires-skill: [...]`... Đây là ĐẢO NGƯỢC thật 1 phần D12 đã
     shipped — cần việc thực thi riêng ngoài scope discussion này."
     **TRUE**, but note: D20 itself still names the pin field
     `assignable-to`, not `agent` — the rename to `agent` happens one row
     later, at D26.
   - D26 is at **line 467**, not 466 as the task text estimated (off by
     one line — minor drift, harmless for citation purposes but the doc
     note should cite 467). Full text: "Đổi tên field eligibility trên
     task-spec từ `assignable-to` thành `agent`... `requires-skill` không
     đổi." **TRUE** (location off-by-one only).
   - Bonus finding not in the original ask: **D32** (line 473) further
     refines priority when `requires-skill` matches multiple agent-types,
     and explicitly cites "(D20/D22)" and "D26's field ghim cứng" — useful
     extra context for the doc note's pointer, not required to act.
9. `docs/specs/work-state.md` — "Position vs Agent-type" section confirmed
   at **lines 2138-2150**; the exact `claims:` frontmatter mention is at
   **line 2144** (task's ~2144 estimate — exact match), with a second bare
   "claims" mention in the same paragraph at line 2155-2156. **TRUE.**
   Bonus finding: the same passage (line 2143) says agent-type definitions
   live at `.claude/agents/*.md` — that file location itself looks stale
   too (real agent-type source today is `core/agents/*.yaml` +
   `domains/<name>/agents/*.yaml`, D24 in the same DISCUSSION.md, line
   ~485). This is outside tsk-gli's declared footprint/acceptance
   criteria (which scope only the `claims:`→`skills:`/`requires-skill:`/
   `agent:` field correction) — flagging for a person to decide whether to
   fold in or file separately, not auto-expanding scope here.
10. `docs/explanation/why-coding-domain-has-a-role-holder-axis-and-task-
    spec-ontology.md` — the D12 blockquote + narrative sits at **lines
    191-201** (task's ~188-198 estimate — close, off by a few lines), not
    a separate section. `claims:` appears at line 193 (inside the D12
    quote) and again at line 199 (narrative: "The only new surface needed
    was one `claims:` frontmatter field..."). **TRUE.**
11. Confirmed `work-state.md` is genuinely the narrative canonical for
    D-ADR0032 "Multi-role Team Harness" per `docs/decisions/index.md:49`
    (which itself says: narrative moved to `docs/specs/work-state.md`,
    tsk-1lv-4 D5; original ADR retired). **TRUE**, task's framing accurate.
12. Sweep: `rg -n "claims:\s*\[|'claims'|\"claims\"" docs/specs/
    docs/explanation/ docs/decisions/index.md` — exactly 2 hits, both
    already covered above (work-state.md:2144,
    why-coding-domain-...:193). **No other stale `claims:` location found**
    — the task's declared footprint (work-state.md,
    why-coding-domain-...md, agent-roster.mjs) is complete; no fourth file
    needs touching for this citation pattern.

**Found:** All 9 original claims verify true or true-with-harmless-drift
(D26's line number off by one: 467 not 466). No claim came back false. No
scope beyond the task's declared footprint is required by the sweep. Two
bonus/tangential drift points surfaced (the `.claude/agents/*.md` stale
path in work-state.md:2143, and D32's extra context) — both outside
acceptance criteria, noted for a person to optionally fold in, not
blocking.

**Still open:** Nothing blocking. The task's footprint, line citations, and
D20/D26 pointer are accurate enough to act on directly.
