# Review a38 step-05 rr4 p23

## scripts/project-agents.mjs (pin 95301cb9, subBatch skills-and-support)

Verdict: rework (one outcome defect)

Items reviewed: 50 (2 references 003622/003623, 48 dynamic tuples 008495-008542). No diff, no park, no coCutPaths.

### Outcome defects

1. dynamic-008536 (source L291, `console.log(\`projected ${relPath} -> .claude/agents/${name}.md\`)`).
   - Current outcome: REJECT, nonDocumentUse `caller-data-formatting`.
   - Rule: L12-72 R6 and R7. The message prints a fixed literal document root (`.claude/agents/`) plus `.md`, so the output changes if the path moves. The same operation was admitted as a document path at L290 (008534/008535) and at L41 (008539/008540, `.claude/agents` target dir).
   - R6 says to admit a user-visible message whose printed path comes from a fixed document literal.
   - Correction: ADMIT/preserve with a pathOperand naming the `.claude/agents/${name}.md` literal. It would cite the same source construction as 008534, as the record already does for fixed-root preserved messages.
   - The alternative is to reject 008534/008535/008539/008540 as non-document infrastructure. The record explicitly treats the `.claude/agents/*.md` write as a document operation, so admitting 008536 is the smaller change.

### Checked and ok

- 003622 (L15) and 003623 (L6): ADMIT/preserve of `docs/history/agent-executor-agent-definitions/CONTEXT.md`.
  - `docs/history/**` is retained (L12-10, owner-answers L221), and existsAtPin is true.
  - No retired decision citation is involved, so no successorNote is needed.
  - Both are navigation references with no relocation claimed.
- 008495-008499, 008510-008511, 008530, 008532 and the other `agents/${name}.yaml`, `domains/.../agents` and `legacy agents/ entry` messages and joins (L100, 109, 113, 117, 124, 168, 179, 258, 265): REJECT is correct only because agent-definition YAML under core/agents, domains/*/agents and agents/ is config, not a document. The nonDocumentUse labels are acceptable under R5 (caller-data formatting).
- Scan path joins (008502-008509, L147/161/163/168/173) reject as `config-or-metadata`. This is consistent with the YAML-is-config reading.
- Accumulators and joins (008500 seenPaths, 008512, 008518, 008526), frontmatter and body line formatting (008513-008533) and `${sourcePath}` echoed into the generated body (008520): REJECT is true.
- 008528 (`repoRoot = REPO_ROOT` default) and 008537/008538/008541/008542 (REPO_ROOT resolve and main-checkout root): root-only, REJECT is right under R5.
- 008529, 008531 and 008533 (`path.relative` and `relPath` metadata only): REJECT is right.
- 008534/008535: same line, one admission, one disposition (R7 ok). The pathOperand really yields a document path.
- 008539/008540: same operation, both ADMIT/preserve with the same pathOperand (R7 ok).
- No parks exist, so there are no boilerplate blockers. There is no diff, so no source-versus-generated or rollback concerns.

### Record-text notes

- 008540 `targetSetOrConstruction` is the truncated text `TARGET_DIR = path.join(REPO_ROOT` (parityObligation current/candidate have the same truncation). The pathOperand field is correct. The truncation is cosmetic.
- 008538 `matchedExpression` and operand are likewise truncated (`REPO_ROOT = path.resolve(import.meta.dirname`). The outcome is fine.
- The 008495 `operationChain.operation` has a trailing comma, copied from the source witness line. The record text is fine.

### Lead-judgment questions

- Q1. The runtime message at L100 (`CONTEXT.md D1's own boundary`) and the comment at L25 name a bare `CONTEXT.md`, not a path. They are rejected as formatting. That is consistent with R6, which keys on a fixed document literal or root, but it does print a document name to the user. Confirm that bare basenames with no root are outside the census.
- Q2. If Lead prefers to treat agent-definition YAML roots (`core/agents`, `domains/*/agents`, `agents/`) as document roots, 008502-008509 and the `agents/${name}.yaml` messages would flip. The current reading (YAML is config, `.claude/agents/*.md` is the only document output) is internally consistent apart from 008536.

### Counts

- 50 reviewed: 49 ok, 1 outcome defect (008536).
- By admission: 4 ADMIT (008534, 008535, 008539, 008540) plus 2 reference ADMITs; 44 REJECT, of which 1 is wrong.
- Parks: 0.
- Diffs: 0.

Status: DONE_WITH_CONCERNS
