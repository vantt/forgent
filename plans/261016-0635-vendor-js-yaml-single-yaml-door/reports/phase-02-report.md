# Phase 2 report: retire hand-rolled YAML readers

Worktree /home/vantt/projects/forgent-worktrees/vendor-js-yaml, branch feat/vendor-js-yaml. No node_modules created.

## What changed
- `src/util/yaml.mjs`: added `describeYamlError(error)` -> `<reason> (line L, column C)` (mark is 0-based in js-yaml; reported 1-based).
- `src/runner/agent-definitions.mjs`: `readAgentDefinition(text,{filename})` -> `{data,error,name,skills,description}` (never throws; name `String()`-coerced; skills strings only); `agentShapeProblem` uses it (parse error -> `cannot be parsed: ...`; the two old messages unchanged); `projectPersona(data)` + `PERSONA_KEYS`/`BOUNDARY_KEYS` shared by renderer and lint.
- `src/runner/agent-roster.mjs`: `loadAgentRoster(cwd)` -> `{defs, problems}`; `loadAgentDefs` removed (only caller was work-dispatch). `work-dispatch.mjs` writes one `warning: agent roster: <file>: cannot be parsed ...` line to stderr per bad file; roster never throws.
- `src/setup/registrations.mjs`: both `extractSkillsFromYamlText` copies, name regexes and the comment block gone; shared `readAgentSkills` (agent-claims check + `findWorkflowStageOperationProblems`) reports `<file>: cannot be parsed|read` as problems. `workflowCapabilityUses` parses each file (JSON.parse / parseYaml), collects `capability` strings with an iterative BFS walk + visited set; unparsable files fail `workflow-capabilities-configured` by name.
- `src/runner/agent-listing.mjs`: `agentRenderWarnings`/`agentDescription` rewritten over parsed data; multi-line-marker warnings deleted, unrendered-key warnings kept; description shown in full (whitespace collapsed to one line).
- `src/runner/dispatch/assignment.mjs`: fresh persona file -> `parseYaml`+`projectPersona`; failure renders `Persona "<ref>" could not be parsed: <reason>`; pinned text that fails to parse uses module-private `legacyPersonaProjection` (old reader renamed, comment states why and removal condition).
- `src/setup/workflow-pool-independence.mjs`, `blind-steps-proven-pools.mjs`: dead `unavailable` branches removed; `unreadable` entries now `<rel file>: cannot be parsed: <reason> (line, column)` and make both checks FAIL (shared `unparsableDefinitionsResult`) instead of a skipped note (independence) / silent skip (blind).

## Commits
1. f96eece77 refactor(agents): read agent definitions and workflow capabilities with the YAML parser (steps 1-3, 5, 6; registrations.mjs holds steps 2 and 6 together)
2. b7eeb4bb6 refactor(persona): render persona text from parsed YAML with a legacy fallback for pinned text (step 4)
3. 26b3338a7 fix(doctor): name workflow definitions that cannot be parsed in the pool checks (step 7)

## Temporary old-vs-new comparisons (deleted, scratch only)
- Capability uses over core/workflows + domains/*/workflows: old line matcher vs new parsed walk: identical (27 capabilities, same workflow ids, no problems).
- Persona projection over all 14 tracked core/domains agent files: old reader vs `projectPersona` rendered lines: 0 differences.

## Intended behaviour differences (for CHANGELOG)
- Agent definitions (`fgos/agents`, `core/agents`, `domains/*/agents`, legacy `agents/`) and project/domain workflow files must be valid YAML. Invalid files are named in `fgos doctor` with file, line, column (agent-claims-resolve, agent-type-names-unique, workflow-capabilities-configured, workflow-pools-satisfy-independence, blind-steps-use-proven-pools). `resolveAgentDefinition` refuses a definition that does not parse (same refusal path as shape errors). Roster skips it and warns on stderr.
- A definition indented as a whole (`  name: x`) is now a valid mapping and seats (it was refused as "got null").
- `name: 123` is coerced to "123"; skills must be strings.
- Fresh persona files: block scalars render in full, inline `# comments` stripped, numbers normalise (`1e3` -> `1000`); an unparsable file shows one `Persona "<ref>" could not be parsed` line instead of silently dropping the section.
- Pinned persona text from earlier runs that the parser rejects renders as before (legacy fallback; removal condition: no run pinned before this release can resume; backlog item to be added in phase 4).
- Persona lint no longer warns about multi-line block markers (they render now); description listing is full text.
- A commented-out `capability:` line is no longer counted as a use (none exist in repo).
- Doctor checks `workflow-pools-satisfy-independence` and `blind-steps-use-proven-pools` no longer pass with "not evaluated: yaml package not installed"; and a workflow that cannot be parsed fails them (was: note / silent).

## Doctor diff (doctor --json, by check id; each env is its own git repo copy, because doctor from a linked worktree inspects the main checkout)
(A) main HEAD + scratch yaml package, (B) main HEAD without it, (C) worktree HEAD (git archive copy). 110 checks each.
- Status diff A/B/C: only `dependencies-installed`: A pass ("1 dependency installed"), B FAIL (yaml missing), C pass ("no runtime dependencies declared"). Intended.
- Message diffs B vs C (all intended): `instruction-projections-stale` (B crashed with Cannot find package 'yaml', C = A message), `workflow-pools-satisfy-independence` (B "not evaluated", C = A: 15 units evaluated), `blind-steps-use-proven-pools` (B "not evaluated", C = A: 7 units), `domain-registry-compiled` (wording, phase 3), `cli-version-visible` (commit hash only).
- C equals A on every message except `dependencies-installed`, `domain-registry-compiled` wording and commit hash.
- Running doctor directly in the worktree (not a copy) differs from the copies on omp/pi hook, readme tag, rust-host-binary and dependencies checks because it resolves the main checkout; not a regression.

## Tests
New: test/runner/agent-roster.test.mjs (3), test/setup/yaml-parse-failures.test.mjs (5: malformed agent, workspace agent, malformed project workflow in 3 checks, self-referencing doc, CLI `fgos doctor` lists every registered check), persona tests in test/runner/assignment.test.mjs (4: block scalar/comment/number, fresh unparsable line, pinned `voice: direct: no hedging` as before, pinned parseable wins), agent-definitions (name 123, indentation, invalid YAML), agent-listing (block scalar in full, unrendered keys, malformed). Updated: workflow-pool-independence-check (now fails with position), agent-definitions "indented" case.
`grep -rn "extractSkillsFromYamlText|parseSimplePersonaYaml|yaml package is not installed" src` -> nothing.

## Deviations
- `loadAgentDefs` replaced by `loadAgentRoster` (single caller updated).
- Pool/blind checks now fail on unparsable workflows (plan said "reported"; policy says named problem; failing is consistent with capabilities check).
- GitNexus not used; callers cross-checked by grep.

## Full suite
See phase-03-report.md: 7850 tests, 0 failures with release binaries present (76 binary-missing failures before they existed, none new vs baseline).
