# Doctor readiness only, packaged definitions: lead report

Branch `harden/doctor-p08-packaged-definitions` from origin/main `478b6695d`, worktree `/home/vantt/projects/forgent-worktrees/harden-doctor-p08`. No Git, Event Store, mailbox, process or Rust file touched, so no OPC/MAIL review was needed.

## What changed

- **Two rows leave doctor.** `task-specs-resolve` and `domain-workflow-operations-coverage` read only the packaged domains of the install root; they are now `npm test` cases. Their bodies (`checkTaskSpecsResolve`, `findWorkflowStageOperationProblems`, `checkDomainWorkflowOperationsCoverage`, about 250 lines) had no product caller left, so they moved out of `src/setup/registrations.mjs` into `test/helpers/packaged-definitions.mjs`; the existing operation-validation cases import them from there.
- **Four rows keep a project tier, one body each.**
  - `agent-claims-resolve` and `domain-registry-compiled`: the exported body takes the directory; the row skips when that directory is the release source itself (`isReleaseSource`: install root and cwd resolve to the same tree) and the release-tier test passes the install root.
  - `agent-type-names-unique`: `checkAgentTypeNamesUnique(cwd, { projectTiersOnly })`. The row drops every tier whose directories lie inside the install root (a project without its own `domains/` or `core/agents/` reads the installed ones); the test calls it with the option off on the install root. The "replaces" note still reads every tier.
  - `operation-prompt-templates-valid`: new `discoverProjectPromptTemplates` (project tier `.fgos/prompt-templates` only) in `operation-prompt-templates.mjs`; `discoverOperationPromptTemplates` now calls it for its first tier, so there is one scan body. The row uses it; the test discovers the packaged tiers with an empty project.
- New `test/setup/packaged-definitions.test.mjs`: 5 release-tier cases (task specs, claims, compiled domains, agent tiers, templates) and 3 row-boundary cases (release source skipped; plain project judges no installed agent tier; template row reads only the project tier).
- Docs: setup-doctor-registry contract (row inventory), packaging-distribution spec row 7, doctor how-to table, write-a-task-spec step 3 (now points at `npm test`), CHANGELOG `[Unreleased]`. Inventory pin in `checks.test.mjs`.
- Unused imports dropped from `registrations.mjs` (`DOMAINS`, `RIGOR_VALUES`, `resolveTaskSpecPath`, `stepById`, `POLICY_PATCH_FIELDS`, `discoverOperationPromptTemplates`); `INSTALL_ROOT` from `agent-definitions.mjs` replaces the private `FGOS_INSTALL_ROOT` (one door); `isWithinDir` from `assignment-layout.mjs` for the path test.

## Tier list per row (release tiers = everything under the install root)

| Row | Release tiers, judged by npm test | Project tiers, judged by doctor |
|---|---|---|
| `task-specs-resolve` (gone) | `domains/*/task-specs`, `core/task-specs` named by the domain registry | none |
| `domain-workflow-operations-coverage` (gone) | every packaged domain workflow's stage operations, task specs, `core/agents`, `domains/*/agents` | none |
| `agent-claims-resolve` | `core/agents`, `domains/*/agents`, `agents/`, task specs of the release source | same folders of a project directory other than the release source |
| `domain-registry-compiled` | `domains/*/compiled.json` of the release source | same of a project directory other than the release source |
| `agent-type-names-unique` | workspace, domain and core tiers whose directories lie under the install root | tiers whose directories lie outside it (`fgos/agents` of the project, its own `domains/`, `core/agents/`) |
| `operation-prompt-templates-valid` | `domains/*/prompt-templates`, `core` templates | `.fgos/prompt-templates` of the project |

In the fgOS repo run through its own dev host the row prints "this directory is the release source; npm test judges its ...", so nothing is judged twice. An activated release run in a checkout is a different tree from the install root, so that checkout's tiers count as project tiers there and are judged by the row.

## Retired tests and owners

| Retired | Owner now |
|---|---|
| registrations "task-specs-resolve doctor check passes when core/task-specs/ and domain task-specs exist" | packaged-definitions "every task-spec file a packaged domain operation or core skill names exists in the release source" |
| registrations "task-spec and workflow-operation checks pass on a plain target project that carries no fgOS trees" | behaviour removed (rows deleted) |
| registrations "agent-type-names-unique doctor check passes when agent-type names are unique within each tier" | packaged-definitions "agent-type names are unique in every tier of the release source, including its own fgos/agents" |
| registrations "domain-workflow-operations-coverage doctor check is registered and passes on clean repo" | registrations "findWorkflowStageOperationProblems passes on the live repository setup" |
| operation-prompt-templates "operation-prompt-templates-valid doctor check is registered and passes on repository" | packaged-definitions "the packaged domain and core operation prompt templates validate" |

Kept unchanged: duplicate/shape/malformed project cases, compiled.json stale/missing/unparsable, yaml-parse-failures, every `findWorkflowStageOperationProblems` case, and "still fail when the install root lacks its own task-specs" (now on the helper).

## Net size

| | Estimate | Measured |
|---|---|---|
| Node (`src`, `bin`) | -150 | -247 (+46 / -293) |
| Rust | 0 | 0 |
| Tests (excluding the moved bodies) | -50 | -22 (+84 new file, -106 retired or trimmed) |

The ~250 moved lines now sit in `test/helpers/packaged-definitions.mjs` (269 lines including imports and header); counted with them tests are +247. The census file also changed (regenerated digests and line numbers).

## Doctor rows and time

Rows: 111 on the previous landing, 109 here. Time: the six bodies together cost about 20 ms on a warm checkout (task-specs 0 ms, claims 9 ms, compiled 1 ms, agent tiers 3 ms, templates 4 ms, coverage not measured outside the test runner because it needs the staged addon), so the saving is rows and ownership, not wall time.

## Red proofs

- Packaged tier breaks: the existing "still fail when the install root lacks its own task-specs" case (empty root) fails both bodies with "missing task-spec file" and "not found"; the release-tier cases run the same bodies on this checkout.
- Project tier breaks: the retained cases write a duplicate agent name in two project domains, a wrong-shape `fgos/agents` file, a malformed `.fgos/prompt-templates` file, a stale and an unparsable project `compiled.json`; each fails its row.

## Gate

- Focused: packaged-definitions, registrations, checks, yaml-parse-failures, domain-registry-compiled, operation-prompt-templates, architecture, doc-health, doctor-strict-exit: green.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared, census unchanged (no Git call site touched).
- No Rust change; clippy, fmt, msvc and darwin checks not applicable.
- Full `node scripts/run-tests.mjs` through the queue (HERDR and CLAUDE variables unset, private ext4 target, no COOK HOLD): tests 8662, pass 8628, fail 3, skipped 31, no `run-tests: ERROR` lines. Fails: the frozen V7n addendum (known), decision-citation-drift real-repo and skills drift (known: ignored `.agents/skills/ak-*` dirs in a fresh worktree; not from this change).

## Items for HARDEN

1. The owner-machine guide `plans/reports/guide-*-owner-machine-doctor-readiness-only.md` does not exist on origin/main yet (no section from earlier phases). Not created here; phase 10 owns it. This phase's section: rows `task-specs-resolve` and `domain-workflow-operations-coverage` gone, four rows judge project tiers only; after activating, `fgos doctor --json` answers 109 rows; rollback is revert plus re-activate.
2. GitNexus impact analysis was not run (no MCP tool in this delegate); blast radius checked by `git grep` of every moved or renamed symbol across `src`, `test`, `scripts`, `docs`: callers were only `registrations.mjs` and the tests named above.
