# Named persona seats: implementation report

Status: DONE_WITH_CONCERNS. One test fails in the full suite and was already failing at HEAD (details below).

## Commits (branch worktree-agent-a1e334c856a9e4977, based on 30a05291e)

- f7fa2126d feat(workflow): seat named personas from workspace, domain and core folders on one panel seat each
- a second commit with specs, CHANGELOG, skills and render outputs (hash in the final message)

## What was built

- `src/runner/agent-definitions.mjs` (new, infra): the one lookup. Tiers `fgos/agents`, `domains/*/agents`, `core/agents`; whole-file replacement; same-tier duplicate error; unknown-name error listing every folder searched; `.yml` hint; shape check (`name:` equals basename, non-empty `description:`, 16 KiB cap); SHA-256 of the exact bytes. A project without its own `domains/` or `core/agents/` reads the running package's (so a consumer project sees installed core). The shape check is regex-based with no `yaml` import, because `fgos setup` from a dependency-less copy loads this module (a first attempt with `yaml` broke `test/setup/checks-setup-rc-line.test.mjs`).
- `src/workflow/seats.mjs`: `@name` accepted (`[a-z][a-z0-9-]{0,63}`), `personaNameOf`, personas injected (module stays pure), named seat gets no lens task, provenance gains `personas: [{seat,name,tier,source,digest,text}]` only when a named seat exists.
- `src/workflow/runner.mjs`: `resolveStart` resolves names before any run exists (preflight and start share it); `unitOverridesOf` emits role-scoped overrides for each named seat on every panel unit, ahead of the unit-wide persona; advance reads pins from the projected state.
- `src/runner/execution/run.mjs`: copies the pin of the override that matches role and name onto `assignment.policy.personaPin`.
- `src/runner/dispatch/assignment-runner.mjs` and `assignment.mjs`: the pin reaches `renderPersonaSection` as `options.persona.pinnedText` and is parsed by the existing `parseSimplePersonaYaml`. No second parser or renderer. `bind()` is untouched (first matching override already honours `scope.role`).
- `src/setup/registrations.mjs`: `agent-type-names-unique` is now per-tier, covers `fgos/agents`, reports which definition a workspace file replaces, flags shape problems and `.yml` files. Same-tier duplicate fails doctor.
- `src/cli/command-registry.mjs` flag text, `docs/architecture-manifest.json` entry.
- Docs: runner.md decision 0057 (written in Vietnamese to match the file) plus the `--seats` paragraph; distribution.md RUL13 status, row 5f, Open Gaps, check-list row; CHANGELOG; skills `fgos-advise` (SKILL and route reference) and `fgos-group-thinking`; `npm run build:skills` outputs committed.

Stop condition not triggered: pinned text travels through the existing assignment (`policy` object, immutable `assignment.json`) with a 3-line extension in `run.mjs` and one option in the renderer.

## Prior art

- `git log -S'fgos/agents'`: only RUL13 spec text (f82b7d8cd) and the design commits; no code ever implemented the lookup. `git log -S'renderPersonaSection'`: introduced with the run door (073c8b6fc), always read only `<root>/core/agents`.
- Reused: `parseSimplePersonaYaml`/`renderPersonaSection`, `bind()` override matching on `scope.role`, the `workflow.start` event and `seats` projection path, the doctor check registry, the three-tier convention of workflow discovery, `agent-roster.mjs` as the neighbouring home.
- Missing before: the lookup itself, the workspace tier, pinning, a doctor tier model.

## Tests added or changed

- `test/runner/agent-definitions.test.mjs` (9): shadowing, whole-file replacement, installed fallback, project-owned core, same-tier duplicate, unknown name, `.yml`, bad names, bad shape, every core persona resolves.
- `test/workflow/seats.test.mjs`: bad `@` syntax, case/duplicate rejection, named-seat expansion, delphi both rounds, unresolved name.
- `test/workflow/workflow-runner.test.mjs`: end-to-end in a consumer repo (no core/agents): lens plus workspace persona plus installed persona on separate seats, unit-wide persona unchanged on the lens seat and the synthesizer, overrides order, pins in event, projection and status, `{objective}` literal; resume after edit and after delete uses pinned text; workspace shadows core; refusals (unknown, collision, duplicate, `@`, uppercase, wrong shape, one entry) create no run and no assignments; CLI refusal exit code. The old "not supported yet" assertions were replaced.
- `test/setup/registrations.test.mjs`: the old test required core vs domain duplicates to fail, which RUL13 supersedes; replaced by same-tier failure, cross-tier replacement passes, and a workspace shape/extension test.

## Test results

- Focused: all new and changed files pass.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID node scripts/run-tests.mjs`) before the citation fix: tests 7105, pass 7030, fail 2, skipped 8. The citation-drift failure (my runner.md text cited RUL13 without a gloss) was fixed and that file now passes (31/31). Remaining failure, not mine: `test/runner/execution/bind-committed-config.test.mjs` "every capability of the committed config binds ..." asserts `bound > 10`; it gets 6. Cause: HEAD commit 30a05291e pinned `invocation` on most capability pools and the test skips pinned entries. It fails identically in the main checkout. I did not weaken it; whoever owns that config change should decide whether the threshold or the skip rule moves. A final full re-run after the fixes was not repeated; only the two failing files were re-run.

## Decisions the design left open

1. Lookup root: the working checkout (`worktree` of the start call), not the main state root, because `fgos/agents` is tracked and edited where the person works. Domain/core tiers read the project's folder when it exists, else the installed package.
2. Doctor: one existing check (`agent-type-names-unique`) changed semantics instead of adding a second check; no config default registered, since the folder is optional and read-only (AGENTS.md gate asks for registration only for defaults, env, required files).
3. Named seat has no lens sentence; it keeps the unit objective and the persona carries the posture.
4. Pin carried in `assignment.policy.personaPin` (matched by role and name) rather than in `bind()` output.
5. Only `.yaml` is read; shape check needs `name:` and `description:` only.
6. `fgos convention name` is not reachable from `node bin/fgos.mjs` (Rust-native verb), so the report name follows the harness naming pattern.

## Not done

Impact analysis via GitNexus was unavailable to me; I checked callers by grep (all touched functions are module-local or registered once). Unit-level and capability-level `persona:` names still read only `core/agents` (documented in 0057 and distribution.md). Status output now includes pinned persona text.

## Unresolved questions

- Should the stale `bound > 10` threshold in `bind-committed-config.test.mjs` be recalibrated, or should pinned-invocation capabilities be asserted too?
- Should the skill be given a way to list the installed core personas from a consumer project (today it can only use names it sees)?
