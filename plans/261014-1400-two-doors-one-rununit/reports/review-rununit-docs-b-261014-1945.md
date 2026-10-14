# Review: feat/rununit-docs-b (phase 07b, doctrine + spec)

Scope: `git diff main...feat/rununit-docs-b` (5a9070e91, 5d9d253cd), 38 files (14 source, the rest renders). I checked it against phase-07b and phase-06. Phase 06 is not merged yet, so I judged the doctrine against the code 06 will leave.

## Gate checks (run in this worktree)

- `npm run build:skills` exit 0. `git status --short .agents plugins .claude/skills` is empty, so the renders are in sync.
- `node --test test/docs/run-doors-doctrine.test.mjs`: 13/13 pass (run with `CLAUDE_CODE_SESSION_ID` unset).
- The removed-door regex across `AGENTS.md core domains .agents plugins .claude/skills`, including non-`.md` files and commands split across lines: 0 hits. Prose searches for `execute --for`, `--assignment`, `Step B.5` and `execute door` also found 0 hits.
- `fgos decision-index --check`: not stale, `changed: false`.
- Every flag the new doctrine teaches exists today: `--provider`, `--writes`, `--worktree`, `--capability`, `--rigor`, `--effort`, `--unit`, `--json` (`src/cli/command-registry.mjs:909-931`, `bin/fgos.mjs:2710-2800`). `code:implement` is a registered capability. `--writes '**'` is accepted (`write-scope.mjs:25-50`). The commit statuses `committed`/`no-changes`/`failed` and the `outOfScope`/`needsWrites` fields match `commit-unit-work.mjs:182,212,258`. With the default `solo` pattern, `results[-1]` is the producer (`run.mjs:702`, `patterns/solo.mjs`).

No High findings.

## Medium

**M1. The `out-of-process` bullet in AGENTS.md drops the capability that `decide` resolved.**
- Where: `AGENTS.md:170`. `core/skills/_shared/executor-dispatch-fallback.md` Step B (first command) marks `--capability` as optional.
- Scenario: an agent runs `decide --for code:review`, then follows the bullet: `fgos run "<prompt>" --provider <id>`. `--capability` defaults to `execute` (`bin/fgos.mjs:475`), a mutating capability with a different prefer pool, persona, rigor and confinement. The Unit binds under the wrong capability. A required-confinement purpose silently runs under `execute`'s posture, and only `--provider` keeps it near the executor `decide` picked.
- Fix: in both places, require `--capability <PURPOSE>` whenever `decide --for`/`--work` resolved one, e.g. `fgos run "<prompt>" --provider <executorId> --capability <purpose> [--writes …]`.

**M2. The result path skips the `fgos.v1` envelope.**
- Where: `AGENTS.md:170`; the `executor-dispatch-fallback.md` Step B "Read the result JSON" paragraph; `implement-and-collaboration.md:23-28`; `verify-commit-and-iron-law.md:39`; `CHANGELOG.md`.
- Scenario: CLI output goes through `wrapEnvelope` (`bin/fgos.mjs:4924`); `fgos dispatch decide` output in this worktree came out as `{contract, data:{…}}`. The real path is therefore `data.results[-1].runResult.agentClaim.summary`. A scripted read (`jq '.results[-1]'`) gets `null`, and a reader treats a committed run as "no result".
- Fix: write `data.results[-1]…` once, or say "inside the envelope's `data`". The phase text gave the bare path, so this is a plan-text defect carried over; fix it here.

**M3. coding-implement says the worker "already ran verify", but nothing makes the worker do it.**
- Where: `domains/coding/skills/fgos-coding-implement/SKILL.md:126`; `references/verify-commit-and-iron-law.md:7`; `references/implement-and-collaboration.md:19-35`.
- Scenario: the driver builds a free-form `fgos run "<prompt>"`. The doctrine never says the prompt must carry the item's `verify` command or point at `../_shared/coding-worker-contract.md`. The RUL87 brief covers scope and commit, not verify. Step 3 is skipped, the runner commits work nobody verified, and only `fgos return`'s own verify catches a red result, as `blocked` rather than in a fix loop.
- Extra point: `--writes '**'` as the default contradicts worker-contract Layer 1 rule 2 (stay inside the footprint).
- Fix:
  - Say the prompt must include the item's verify command and the contract path.
  - Make Step 3 conditional: "skip only if the prompt carried verify; `fgos return` verifies anyway".
  - Default `--writes` to the item footprint; use `'**'` only when there is no footprint.

**M4. The doctrine test has gaps a future edit can slip through.**
- Where: `test/docs/run-doors-doctrine.test.mjs:179-210`. Its patterns and scan miss:
  - `fgos dispatch fanout-batch`: `\bdispatch (execute|log)\b` omits `fanout-batch` for the `fgos` form.
  - `execute openai --for …` and other concrete executor ids: only `<placeholder>` forms are matched.
  - A command split across a line break: the scan is line-by-line.
  - Non-`.md` files under skill dirs, and `core/instructions` / `core/prompt-templates`, which feed rendered AGENTS fragments and worker prompts.
- Today all of these are clean (I checked with grep), so this is coverage, not a live leak.
- Fix:
  - Patterns: add `fanout-batch` to the second pattern; add `/\bexecute [a-z][\w-]* --for\b/`.
  - Scan: cover `core/instructions` and `core/prompt-templates`, and test the whole file text with `\s+` across newlines.
- The changed capability-matching assertion (`:164-171`) is still meaningful. The old "one-liner before `execute <executor>`" check became vacuous. The new one asserts `--writes` and `--provider … soft preference`, and both match the real text at `capability-matching.md:46-49`.

**M5. The spec says more than phase 06 delivers.**
- Where: `docs/specs/runner.md` RUL90 (line 1111) and 0062 decision items 1-2.
- Scenario: RUL90 says that calling any removed door, `dispatch fanout-batch` included, returns a `validation` error naming the replacement. Phase 06 Req 2 lists pointers only for `execute`, `--assignment` and `log`, and gate G2 step 1 tests only those two. 0062 item 1 also says `executeExecutorCli` is "chỉ là bước transport của Assignment", while 06 Req 6 keeps `fanout-batch.mjs` as an allowlisted `executeExecutorCli` caller until 09.
- Fix: add a `fanout-batch` pointer to 06 Req 2 and G2, or narrow RUL90. In 0062 item 1, add "ngoài các caller trong `R3_PENDING_WORK_CALLERS`".

## Low

- **L1.** `CHANGELOG.md` Unreleased still describes a removed door as live at `:13` (`fgos dispatch execute` returns … `modelWarnings`) and `:46` (`execute --contract` moves to another account). Fix: drop or rephrase both.
- **L2.** `core/skills/_shared/coding-worker-contract.md` has two stale lines:
  - `:181` still calls the mechanism "`decide`/`execute`".
  - `:10` says the driver "will verify/commit/return"; on the `fgos run` path the runner commits.
- **L3.** `--provider` accepts only `kind: agent` ids (`bin/fgos.mjs:453`). Doctrine passes whatever `executorId` `decide` returned, so a project with a CLI tool executor that resolves out-of-process gets "unknown --provider" and has no door. No such executor resolves out-of-process in this repo (gitnexus resolves in-process MCP; herdr resolves `unavailable`). Fix: one sentence covering the tool-executor case, or a G2 check.
- **L4.** Phase "Xong khi" says 0062 must be in `docs/decisions/index.md`. The generator does not project 006x spec decisions (0060 and 0061 are absent too), and `--check` reports the index fresh. That criterion cannot be met as written. Fix: the Lead amends the criterion or files an item for the generator.
- **L5.** In the `fgos run` coding path, files already dirty in scope at launch are excluded from the runner commit (`run.mjs` `preExistingInScope`). They then make `fgos return`'s clean-tree check fail. Fix: one line in `implement-and-collaboration.md` telling the driver to start the run from a clean worktree.
- **L6.** The 0062 dissent is accurate on the point that matters: "owner bác … không bị bác bỏ về lý", with panelist-2's ingress-count risk kept. Two wording points:
  - The title adds "/ xoá cửa cũ", but r4 §4.1 is "measure before building the short door".
  - "quyết xoá ở hội đồng mở lại r4" reads as if the council decided; owner decision 4 was an input to r4.
  - Also, r4 §4 items 3-5 are not carried. The phase did not require them, but item 4 (commit scope) ties to 0060.

## Plan follow-ups

- 07b steps 1-3: done (test, sources, build, regex clean).
- Step 4: spec and CHANGELOG are present. I did not run `npm test` (the suite is not hermetic inside an agent session).
- Gate G2: pending the 06 merge.
- Before ff, fix M1, M2 and M5 here: each is a doctrine/spec text change.

Status: DONE_WITH_CONCERNS
Summary: The renders are in sync, every taught flag exists, and no removed door survives in AGENTS, skills or renders. Five medium issues remain: the out-of-process bullet drops `--capability`, the result path skips the envelope's `data.`, the coding-implement verify claim is unbacked, the test patterns miss some forms, and the spec claims more than phase 06 delivers.
