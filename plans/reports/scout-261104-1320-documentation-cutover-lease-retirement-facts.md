## Documentation-cutover lease: retirement facts (scout, read-only)

Scope: main checkout, branch main @ bd687982b. No files edited except this report. Grep covered repo incl. hidden dirs (`.githooks`), excluding plans/ and .fgos/ state.

### Code sites
- `src/runner/documentation-cutover-lease.mjs` (core module): consts 19-21 (`DEFAULT_LOCK_NAME`, `DEFAULT_SIDECAR_PATH=plans/documentation-cutover-lease.json`, `DEFAULT_TOKEN_FILE=.fgos/documentation-cutover.token`), `LEASE_SCOPE_PATTERNS` 24-27 (freezes `docs/**`, AGENTS.md, CLAUDE.md, switchboard, `core/skills/**`, `.agents/skills/**`, `plugins/fgOS/skills/**`), transition/acquire/release/abandon 117-230, `leaseAdmission` ~244-266, `checkLeaseCommitGuard` ~268-272, `checkDocumentationCutoverLeaseDoctor` ~277-289. Error codes: `documentation-cutover-lease`, `-corrupt`, `stray-main-token`, `lease-already-held`, `lock-held`, `main-not-checked-out`.
- `src/runner/documentation-cutover-lease-hook.mjs` (shared hook policy): `guardCommit` (~L70-85), `guardReferenceTransaction` (~L95+), `legalTransition`; imports `DEFAULT_SIDECAR_PATH`, `checkLeaseCommitGuard`, token helpers.
- Admission consumers (`leaseAdmission`/`admitDocumentationExecution`):
  - `src/runner/merge.mjs:62` import, `:878-886` `admitLease` (landRunnerItem path)
  - `src/runner/execution/run.mjs:17` import, `:146-151` `admitDocumentationExecution`, `:655` `options.documentationAdmission` threaded into runUnit
  - `src/workflow/runner.mjs:52` import, `:628` `leaseAdmission` (mergeWorkflowBranch)
  - `src/workflow/case-start.mjs:225` `admitRecordedWorkflow`, `:315` `params.documentationAdmission`
  - `bin/fgos.mjs:122` import, `:2313-2314`, `:2803`, `:2888` (documentationAdmission passed to runUnit / start)
- CLI verb: `bin/fgos.mjs:3869-3899` (`case 'docs-lease'`, 4 sub-verbs), `:5356` (human-mode passthrough). Registry: `src/cli/command-registry.mjs:397-433`.
- Rust route table: `packages/host-runtime/contracts/command-routes.json:315-321` (`docs-lease`, route_kind legacy-cli, compat test `test/rust-host/command-routes.test.mjs`).
- No Rust crate references the lease (rg over apps/ packages/ found only JSON contracts above).

### Hooks
- `.githooks/pre-commit`: `:33` import of `guardCommit, guardReferenceTransaction`; `:551-556` `leaseGitRead` adapter (execFileSync git); `:595-598` pre-commit lease guard (runs before at-home exemption); `:685-690` argv `reference-transaction prepared` branch calling `guardReferenceTransaction`.
- `.githooks/reference-transaction` (7 lines): POSIX sh; exits unless `prepared` and a `refs/heads/main` line; then execs pre-commit. Exists only for the lease. Deleting lease => this file goes too (check `src/setup/git-hooks.mjs` wiring, not yet read).
- `core.hooksPath` = `/home/vantt/projects/forgentX/.githooks` (this checkout).

### Doctor / setup
- `src/setup/registrations.mjs:143` import; `:2055-2059` `registerCheck({ id: 'documentation-cutover-lease' ... })`.
- `src/setup/holder-lock-checks.mjs:224` lock-scan entry `'documentation-cutover'`.
- `test/setup/checks.test.mjs:149` expected-id list.
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:93-95` (row + explanation), `:147` "today's registered checks" list.

### Locks
- `packages/holder-lock/contracts/lock-registry.v1.json:5` (band 10 note "runner, gateway, documentation-cutover"), `:37-43` row (`kind: lease`, `v3Path <fgosDir>/locks/documentation-cutover.lock`, note "D8").
- `docs/platform/holder-lock/spec.md:154` (band 10 list), `:182` (registry table row).
- Scope name `documentation-cutover-transition` (`documentation-cutover-lease.mjs:117`) is a LockScope label.

### Tests (owning and referencing)
- Owning: `test/e2e/documentation-cutover-lease-hooks.test.mjs` (whole file, incl. hook wiring, human-mode messages ~458-484); `test/runner/documentation-cutover-lease.test.mjs` (whole file; imports hook at :9; `FGOS_DOCS_LEASE_TOKEN` at :203-209; corrupt at :232).
- Referencing (acquire/hold fixtures or error-code asserts): `test/runner/merge-land.test.mjs` (8, 51, 72, 96, 139); `test/runner/execution/run-case-admission.test.mjs` (15, 166, 178, 191, 196, 215, 221); `test/runner/execution/bind.test.mjs:12`; `test/workflow/case-admission-port.test.mjs` (11, 36-37); `test/workflow/units-runner.test.mjs` (14, 161, 165, 187, 199, 243); `test/workflow/case-verbs.test.mjs` (9, 87-100); `test/runner/promote-engine.test.mjs` (9, 97).
- CLI/contract: `test/cli/subcommand-flag-drift.test.mjs:200` (MULTI list includes `docs-lease`); `test/rust-host/vectors/envelope/version.json` lines 29, 90, 121, 183 (verb list baked into hash input + envelope bytes; regenerate, do not hand-edit).

### Docs / specs
- `docs/platform/holder-lock/spec.md`: section "Documentation-cutover write lease" 360-411 (commands table 366-369, scope 372-383, token 397, doctor 403, owning proofs 411); decision history 415 (2026-10-22 HARDEN registration).
- `docs/platform/git/spec.md`: 341 (hook ordering), 351-369 "Documentation-cutover hook contract" incl. decision entries 365 (2026-10-22) and the 2026-10-26 hook-review entry.
- `CHANGELOG.md:72, 76, 80` (Unreleased-era entries; confirm section placement before editing).
- Provenance-only mentions of "documentation cutover (97dd62aa7)" in `docs/platform/**/contracts|decisions|history` are about the 2026-11-03 docs move, NOT the lease. Leave them.

### Runtime state (main checkout)
- `plans/documentation-cutover-lease.json`: absent on disk and absent on `main` (`git show main:...` fails). No lease is held.
- `.fgos/documentation-cutover.token`: absent. `.fgos/locks/documentation-cutover.lock`: absent. `.fgos/locks/` shows no doc-cutover entry.
- Since no committed sidecar exists on main, no committed-state purge is needed.
- The sidecar path is committed-only (main ref); a future `git log` of it is the only trace.

### Generated / derived artifacts
- `packages/git/contracts/mutation-census.v1.json:1042-1043` (sha256 of both `.mjs` files). Pre-commit runs `censusDriftRefusal`; regenerate via the repo's census tool (command not yet identified). Removing files removes entries.
- `docs/architecture-manifest.json:106-107` (`infra` entries for both modules). `test/architecture.test.mjs` checks this.
- `scripts/lib/git-one-door-declarations.v1.json` lines ~3-9: declaration `leaseGitRead:fde3f196...`, `retireWhen` = "The lease reader retires..." Retirement satisfies this; the entry must be deleted in the same change (siteId changes if the function is removed or renamed).
- `scripts/check-decision-citation-drift.baseline.json:360` (baseline string citing the D8 registration). Decide whether to update or leave.
- `test/rust-host/vectors/envelope/version.json` (see above). Skill renders: none (lease not in core/skills text; `.agents/skills` and `plugins/` have no lease refs per grep).

### Prior art (git log -S)
- `97dd62aa7` (2026-11-03): `--diff-filter=A` for `src/runner/documentation-cutover-lease.mjs` and `documentation-cutover-lease-hook.mjs` and `.githooks/reference-transaction`; this is the cutover commit that brought the lease into main. It also changed `.githooks/pre-commit`, `docs-lease` CLI, and tests.
- Pre-cutover implementation history (`git log -S'docs-lease'`, reachable via plan branch): `379e44239 feat(runner): implement documentation-cutover write lease core`, `6aa3d5c19 fix(runner): rework documentation cutover write lease after review`, `8b20f5185 fix(runner): commit documentation lease transitions through ScopedCommit`, `e8c1df31c feat(runner): gate dispatch and scoped lands on documentation leases`, `83a331410 fix(runner): tighten documentation lease hooks and recovery`, `4e49c3008`/`25aa41510`/`c94545de5` (records census). Land-side: `d7433e505 fix(setup): scan the documentation-cutover lock fi...` on `land/260925-main-merge`.
- `2085d88fe` (plan establish), `b410c92b0`/`9353cded3`/`5371ca46d` (board questions to HARDEN about the lock row), `51e36b06b refactor(holder-lock): remove the Node fence mechanism` (removed fence; the lease row is "fence none"), `26db57f46` (HARDEN T1 sub-plan), `28127bc15`/`f3601a833`/`d7a505143`/`48ff6ee8a` (board: Git one-door declarations, hook review; DOC/OPC/HARDEN lanes).
- Lanes touching it: HARDEN (lock row, D8, fence none, 2026-10-22 registration), Git (hooks, one-door declaration, census, spec section), DOC (owner of lease, cutover).
- MAIL: no lease references found in grep (no mailbox/mail code touches the lease).

### Proposed deletion/edit list (for the retirement item)
Delete:
1. `src/runner/documentation-cutover-lease.mjs`, `src/runner/documentation-cutover-lease-hook.mjs`
2. `.githooks/reference-transaction` (only lease consumer); its wiring check in setup (verify `src/setup/git-hooks.mjs`, not yet read)
3. `test/e2e/documentation-cutover-lease-hooks.test.mjs`, `test/runner/documentation-cutover-lease.test.mjs`
4. `docs-lease` verb: `bin/fgos.mjs` 122, 2313-2314, 3869-3899, 5356; `src/cli/command-registry.mjs` 397-433; `command-routes.json` 315-321; `test/cli/subcommand-flag-drift.test.mjs:200` entry; envelope vectors (regen)
5. Doctor: `registrations.mjs:143, 2055-2059`; `holder-lock-checks.mjs:224`; `checks.test.mjs:149`; `setup-doctor-registry.md:93-95, 147`
6. Admission plumbing: `merge.mjs` 62, 878-886; `run.mjs` 17, 146-151, 655 (`documentationAdmission` option); `workflow/runner.mjs` 52, 628; `case-start.mjs` 225, 315; `bin/fgos.mjs` 2803, 2888 (and any `documentationAdmission` param plumbing)
7. Hook: `.githooks/pre-commit` 33, 551-556, 595-598, 685-690 (and the `reference-transaction` argv branch)
8. Lock: `lock-registry.v1.json` 37-43 + band-10 note at 5; `holder-lock/spec.md` 154, 182; `holder-lock-checks` entry
9. Generated: `mutation-census.v1.json` 1042-1043; `architecture-manifest.json` 106-107; `git-one-door-declarations.v1.json` entry; `check-decision-citation-drift.baseline.json:360` (or leave, see questions)
10. Tests fixtures: remove `acquireDocumentationCutoverLease` setup and `documentation-cutover-lease*` assertions in the 9 referencing test files listed above; their non-lease behaviour must keep owning proofs (per design principle 8, do not weaken).
Docs: `holder-lock/spec.md` 360-415 (keep decision history entry as settled narrative, mark retired); `git/spec.md` 351-369 + 341; `CHANGELOG.md` 72, 76, 80 (add retirement line under Unreleased); `docs/platform/git/spec.md` decision history; `setup-doctor-registry.md`.

### Risks / cross-lane touchpoints
- Git lane: pre-commit hook order changes (lease guard runs before at-home exemption and before census/config checks). Removing it must not reorder others. Git one-door declaration removal is a Git-owned contract; get Git owner ack per its `retireWhen`.
- HARDEN lane: lock registry band 10 and D8 row. Retiring the row changes lock counts; check `test/holder-lock/registry-contract.test.mjs` and `hot-lock-contract.test.mjs` (grep for "documentation" in them returned nothing, so they may count rows generically; verify).
- Admission threads through runUnit/startWorkflow/mergeWorkflowBranch; removing the `documentationAdmission` option changes public-ish params of `runUnit` and `prepareWorkflowRun`. Grep callers before removal (e.g. `test/helpers/run-unit-with-port.mjs`).
- `.fgos/` state: none present for the lease, so no migration of runtime files.
- Retirement removes the `docs/**` write freeze. Confirm owner intent (the migration is over per task brief).
- Mutation census and envelope vectors must be regenerated by their owners, not hand-edited.
- Do not run `git clean -fdX` in a holder checkout while the lease exists (not applicable now).

### Unresolved questions
1. Does `src/setup/git-hooks.mjs` (`mainCheckoutHookWired`) or any installer expect `.githooks/reference-transaction` to exist? Not read yet.
2. Which command regenerates `mutation-census.v1.json` and `envelope/version.json`? Not identified; check `package.json` scripts.
3. Does `test/holder-lock/registry-contract.test.mjs` assert exact row count or names including `documentation-cutover`? Grep found no literal match; needs a read.
4. Is CHANGELOG lines 72-80 under `[Unreleased]` or an older release section? Affects where the retirement note goes.
5. `scripts/check-decision-citation-drift.baseline.json:360` — keep as historical baseline or regenerate?
6. Should `docs/platform/holder-lock/spec.md` section 19/20 be deleted or kept as retired history? Governance says decision narratives stay; confirm.
7. Are the `fgos docs-lease` verb and `docs-lease` route used by any agent skill or doc outside this repo (global fgos install)? Not checked; the CLAUDE.md note says fgOS is installed globally on other projects.

Status: DONE_WITH_CONCERNS
Summary: Lease touches ~60 sites across src/bin/hooks/tests/docs/contracts; no committed sidecar, token or lock exists on main, so retirement has no runtime state to purge. Unresolved items are the setup/git-hooks wiring, census and vector regeneration commands, and whether the global fgOS install depends on `docs-lease`.
