# Phase 00 baseline — 2026-10-06

Stateful evidence for [plan.md](../plan.md) and [Phase 00](../phase-00-preconditions-and-verify-close.md), including its final red-team corrections. No implementation, config, instruction, plan-state, or runtime activation changes were made by this assignment. No builds, tests, linters, formatters, or `gitnexus analyze` were run.

## Measurement context

- Source checkout: `/home/vantt/projects/forgentX-worktrees/single-door-mechanisms`, branch `feat/single-door-mechanisms`, HEAD `b3d8fa489a70ac85048f483a4dfae7ae978f99c0` (observed with `pwd && git branch --show-current && git rev-parse HEAD`).
- Installed runtime/index inspected read-only at explicit main-checkout paths under `/home/vantt/projects/forgentX`; release store `/home/vantt/.local/state/fgos/releases`.
- Counts use raw Node filesystem reads and `git ls-files` output, not rtk-compressed output. Tracked source baseline is distinct from main's unrelated working changes.
- Links below are relative to this report's repository location. Numbers are this snapshot, not evergreen guarantees.

## 1. PC1 — instruction-file ownership

Parent supplied the already-observed result: main `AGENTS.md` and `CLAUDE.md` are clean at HEAD `b3d8fa4`. This was not rerun to confirm. `git show --no-patch --oneline 5df843bdb` independently identifies `chore(docs): refresh the GitNexus symbol counts in agent instructions`, matching the completed PC1 entry in [plan.md](../plan.md). These files and other main changes were untouched. PC1 is satisfied for this snapshot, not a permanent guarantee; Phase 06 must perform its required contemporaneous check. No new ownership decision is needed for the already-committed statistics.

## 2. Impact-analysis posture — available but degraded freshness

Read-only commands, run with cwd `/home/vantt/projects/forgentX`:

```sh
node /home/vantt/projects/forgentX/bin/fgos.mjs tool query --capability impact-analysis --status present
node /home/vantt/projects/forgentX/.gitnexus/run.cjs status
node /home/vantt/projects/forgentX/.gitnexus/run.cjs list
node /home/vantt/projects/forgentX/.gitnexus/run.cjs impact --help
node /home/vantt/projects/forgentX/.gitnexus/run.cjs impact assembleSkills --repo /home/vantt/projects/forgentX --direction upstream --summary-only
```

Observed: provider `gitnexus`, kind `mcp`, capability `impact-analysis`, status `present`. Five registered repositories include three named `forgent`; repository binding therefore uses the explicit path `/home/vantt/projects/forgentX`, never the ambiguous name. CLI impact succeeds for `Function:src/setup/skill-wrappers.mjs:assembleSkills`: 1 impacted symbol, 1 direct dependant, LOW graph risk, 0 affected processes/modules. Those are graph results, not proof that a change is safe.

Main `.gitnexus/meta.json` records indexed commit `b3346957a3a63328d3831d6f6c3ab66934219a53`, indexedAt `2026-10-06T02:59:48.595Z`, 6,834 files, 58,821 nodes, 81,138 edges. CLI explicitly reports stale versus current `b3d8fa4`; `git rev-list --count b3346957a3a63328d3831d6f6c3ab66934219a53..b3d8fa489a70ac85048f483a4dfae7ae978f99c0` returns **19**. No reindex was performed because it would change instruction statistics.

**Posture: degraded**, because the graph is usable but stale and main-bound rather than an independent worktree index. Before edits, use explicit-repo impact plus current-source search; never treat 0 callers as sufficient, especially for [registrations.mjs](../../../src/setup/registrations.mjs). Current source search finds `assembleSkills` definition at [skill-wrappers.mjs:1093](../../../src/setup/skill-wrappers.mjs#L1093) and calls at lines 1195 and 1220. Graph functionality was exercised; accuracy/completeness for every planned symbol was not measured. MCP resources themselves were not accessed in this worker.

## 3. H1a — exact roster/model baseline and confinement gate

Tracked `core/skills/**` and `domains/*/skills/**` were scanned line-by-line with Node. All **28** retired executor token occurrences are in [fgos-architecture-panel/SKILL.md](../../../core/skills/fgos-architecture-panel/SKILL.md):

| ID | Occurrences | Lines (one occurrence per listed line) |
|---|---:|---|
| `claude-bwrap` | 9 | 134, 137, 163, 191, 223, 224, 225, 229, 606 |
| `agy-bwrap` | 10 | 134, 163, 168, 191, 226, 228, 230, 606, 613, 682 |
| `codex-bwrap` | 9 | 134, 159, 171, 191, 194, 227, 230, 231, 607 |

This includes the previously omitted lines 134, 137, 159, 163, 168, 171. Model-policy values were flattened across all provider/tier maps in [.fgos/config.json](../../../.fgos/config.json), then digit-containing values searched literally. **3** configured model occurrences: `gemini-3.1-pro-low` at 226, `gpt-5.6-terra` at 227, `gemini-3.1-pro-high` at 228. Additional nonconfigured `gpt-5.6-sol` occurs at 230.

The corrected shape scan (`\b(?:gpt|gemini|grok|glm|deepseek|claude)-[A-Za-z0-9./_-]*\d[A-Za-z0-9./_-]*`) finds **6** total source occurrences: those four panel tokens plus historical `gpt-5.5` at [_shared/coding-worker-contract.md:135](../../../core/skills/_shared/coding-worker-contract.md#L135) and `gemini-3.6-flash-medium` at line 164. The latter two need the corrected phase's historical path allowlist; they are not a reason to silently expand roster-only implementation scope.

`runner.pools` is absent. Current roster ownership is `runner.executors` and `runner.capabilities[*].prefer`; model ownership is nested `runner.modelPolicies` values, not its provider keys. Historical command `git log --diff-filter=D --oneline -- '*fgos-plan-loop/SKILL.md' '*fgos-code-panel/SKILL.md'` identifies deletion commit **6527596eb**. `git show --no-patch --format='%h %s' 8eff54d0f 6527596eb` confirms **8eff54d0f only converted the skills to deprecated stubs**. M10's former skill source is retired; do not misattribute deletion to the stub commit.

### Confinement: direct dispatch versus Workflow binding

All five configured `architecture:frame|shape|critique|synthesize|explain` entries have no explicit `confinement`. `runner.confinement.strict` is **false**; `advise.confinement` is `{mode: required, policy: host-write-denied}`. Their first preference is `claude-herdr`; its `claude-herdr-bwrap` invocation declares backend `bwrap`. Invocation backend naming alone is not a policy guarantee: [buildConfinementRequest](../../../src/runner/dispatch/confinement/request.mjs#L300) defaults an omitted capability/skill/anchor requirement to `mode: unconfined, omitted: true` at lines 352–364, retaining invocation confinement only as legacy information.

Parent's five `dispatch decide` observations returned `claude-herdr`, out-of-process, with no resolved confinement in output. This is **insufficient to establish enforced host-write-denied**, but also insufficient to conclude the real Workflow is merely instructed.

Important counterevidence, measured by parent in this same isolated worktree without launching workers: `bind()` + `resolvePosture()` for all five capabilities returned `openai`, invocation `codex-cli-bwrap`, posture `read-only`, requirement `required`, policy `host-write-denied`, despite explicit capability confinement being null. Source corroborates this: [resolvePosture:656–665](../../../src/runner/dispatch/confinement/policies.mjs#L656) always maps read-only binding to required `host-write-denied`; [bind:216–223](../../../src/runner/execution/bind.mjs#L216) checks that the selected invocation can carry the posture.

**Conclusion:** a required, mechanically bound read-only policy can be established at the Workflow binding seam; actual live sandbox enforcement for these five steps was **not measured**. Missing capability policy must not be equated with instructed-only Workflow posture. Do not change config or relax the [Phase 01 final confinement gate](../phase-01-architecture-panel-roster-single-source.md#hiệu-chỉnh-sau-red-team-2026-10-06) based on `dispatch decide` output alone.

**Separate R1 blocker:** the current skill's [lines 211–244](../../../core/skills/fgos-architecture-panel/SKILL.md#L211) still require eight static `<role>-actor` IDs, `actors[]` overrides and a specialist-slot mechanism from the retired coordination engine. Parent verified retirement commit `2180b4e72` deleted coordination schema/run/protocols; current Workflow has five step capabilities and pattern roles. Its old-role mapping is not established. Phase 01 R1 explicitly says stop and report when the roles cannot map without going beyond roster scope. Preserve that stop for an owner scope decision; no implementation was attempted. Parent's attempted old coordination command was refused before verb parsing due to detached snapshot, so it is **not** evidence of unknown-verb handling.

## 4. H1d / M06 — verified closed by history and current callers

`git show --format=fuller --stat e92cfe66f d74dfea58` confirms both historical commits, dated 2026-08-21:

- `e92cfe66f126a333dd859b5cdd8e8fff2c0f3900`: added the shared source and renders of `catchup-self-recovery.md`, replacing duplicated approve/merge-next decision content.
- `d74dfea580580cc24227e3392c21399eb2524647`: consolidated recovery into approve and thinned merge-next/merge-loop, reconciled with the preceding commit.

Current **3** caller skills refer to the same playbook: [approve:163–164,221](../../../plugins/fgOS/skills/approve/SKILL.md#L163), [merge-next:69–78](../../../plugins/fgOS/skills/merge-next/SKILL.md#L69), [merge-loop:85–88](../../../plugins/fgOS/skills/merge-loop/SKILL.md#L85). Approve's red flag is retries beyond the ceiling or skipping the evidence bar, not a prohibition on shared recovery. Canonical owner is [core/skills/_shared/catchup-self-recovery.md](../../../core/skills/_shared/catchup-self-recovery.md); existing mirror protection is [test/skills/fgos-mirror.test.mjs](../../../test/skills/fgos-mirror.test.mjs). **H1d closed by evidence; no new check needed.** Mirror tests were not run.

## 5. T03 — backdoor absent

Node literal scan of tracked files under `src/`, `bin/`, `test/`, `scripts/` finds **0 files / 0 occurrences** of `FGOS_TEST_SUITE`. This confirms absence in the assigned source snapshot; it is not a claim about untracked files or archived prose. Phase 06 owns the anti-recurrence instruction. No code change or test was necessary for this investigation.

## 6. Render baseline — distinguish wrappers from copied references

Tracked `.md` counts, with generated-header detection `<!--[^\n]*(?:GENERATED|generated)` and exact wrapper marker from [skill-wrappers.mjs:106](../../../src/setup/skill-wrappers.mjs#L106):

| Target | All `.md` files | Generated headers | Exact wrapper marker | Missing both |
|---|---:|---:|---:|---:|
| `.agents/skills/**` | 53 | 0 | 0 | **53** |
| `plugins/fgOS/skills/{fgos-*,_shared}/**` | 48 | 0 | 0 | **48** |
| `.claude/skills/fgos-*/**` | 37 | 0 | 18 | **19** |

There are 19 `.agents` SKILL.md files and 18 SKILL.md files in each of the other two target sets. The plan's “18 wrappers” is correct for `.claude` SKILL.md, **not** the entire 37-file recursive render target: its 19 reference `.md` files lack both markers. Total target files **138**, missing both markers **120**. The 18 wrapper bodies still say `.agents` is the canonical skill source, as generated by [skill-wrappers.mjs:131](../../../src/setup/skill-wrappers.mjs#L131). Drift guard at [test/setup/skill-wrappers.test.mjs](../../../test/setup/skill-wrappers.test.mjs) was inspected as a prior-art pointer, not executed.

## 7. Root baseline — inventory and gated cleanup

`git ls-files` filtered in Node to paths without `/` yields **45 tracked root files**:

```text
.gitattributes .gitignore AGENTS.md CHANGELOG.md CLAUDE.md Cargo.lock Cargo.toml
LICENSE README.md clippy.toml count.cjs debug_args.cjs debug_spec.cjs dump.cjs
fix_assignment.cjs fix_herdr.cjs fix_herdr2.cjs fix_openSession.cjs
fix_openSession2.cjs fix_openSession3.cjs fix_openSession4.cjs
fix_openSession5.cjs fix_openSession6.cjs fix_openSession_safe.cjs
fix_test_legacy.cjs fix_tests.cjs install.sh openSession.txt original.txt
package-lock.json package.json reverse.patch rewrite_store.cjs rustfmt.toml
store_refactor.cjs test_atomics.mjs test_concurrency.cjs test_concurrency.log
test_concurrency2.cjs test_concurrency2.log test_herdr.cjs test_regex.cjs
timed-executor.mjs timed-executor2.mjs tsk-1op-case-study-note.md
```

`git diff-tree --no-commit-id --name-only --diff-filter=A -r ca854f443` contains **32** root additions historically; intersecting those with current tracked paths leaves **30**. `patch_cli.cjs` and `patch_dispatch_test.cjs` are no longer tracked, explaining the difference. Current count arithmetic after authorized deletion and the chosen note move is `45 - 30 - 1 = 14`; neither deletion nor move happened here.

Main-only `output.txt` is **19 bytes**, exactly `produced by worker\n`; it is not present in this isolated worktree. `git check-ignore -v output.txt` in main reports `.gitignore:33:output.txt`. It is outside the tracked inventory. G1's tag and final confirmation gate remain required; no tag or cleanup occurred. Existing [pre-commit hook](../../../.githooks/pre-commit) and hook consumers are inventoried below, not exercised.

## 8. H6 ownership — no authorization inferred

Reading [plans/260925-documentation-authority-unification/plan.md](../../260925-documentation-authority-unification/plan.md) confirms literal **“Plan status: Proposed — not authorized for execution”** and **“Execution authority: None until a person explicitly authorizes this plan or a named phase”**. Its review prose discussing Phase 00 does not authorize later phases. This assignment changed **0 H6 files**; [docs/specs/reading-map.md](../../../docs/specs/reading-map.md) remains outside this plan's implementation scope.

## Red-team extra measurement A — staged dependency payload

Read main `.fgos/installation/activation.json` and every `/home/vantt/.local/state/fgos/releases/*/manifest.json` with Node. Count **`manifest.files` entries**, not top-level `manifest.entries` (the latter is entrypoint metadata). Predicate: `file.path.includes('/node_modules/')`.

| Release directory digest (`sha256:` prefix) | Manifest files | `node_modules` entries |
|---|---:|---:|
| `08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4` | 532 | 0 |
| `060b8165de0f039f836910e5bb398702e265d9e9925fb15f1c51cdfa11ed89e8` | 848 | **233** |
| `40b59fd815bb980db141fda95580093626e9b1df2a62ad22eee3025a67484989` | 643 | 0 |
| `79494e7c4ce21f208140849bf477833bf32cb4c4d51afff50c68ab2729a640ac` | 848 | **233** |
| `da2d107b66cc044354ab8a4054fb90e053e9714e58891f821055c5af3097ebb5` | 642 | 0 |
| `358827811ad26b99453de9be3d38461b1cb4f2356ed4e285ccb523c40e825dca` | 567 | 0 |
| `a1ba0d0682a7c00598a9873cd13dbe9bb9500b0a7f6b8260a776a5de0e407c4c` (**active**) | 614 | **0** |
| `aef611e01914d528a01667fbcfad9f84af873fea5081c61986899bcc593db311` | 615 | 0 |

**8** staged manifests inspected, **2** with 233 dependency entries each; active release has 0. Activation is `ready`, active digest matches the project's exact-digest pin and was activated `2026-10-04T08:31:40.901Z`. Manifests do not expose a source commit field; their build's association with `dbaf4ce0f` was not independently established. These are manifest counts, not a filesystem integrity verification or a release-vs-checkout drift measurement. Phase 04 must exclude dependency payload from workshop-source comparison per its correction.

## Red-team extra measurement B — hook test consumers

Node scan of tracked `test/**/*.test.mjs` matching `\.githooks|core\.hooksPath|installGitHooks|uninstallGitHooks` returns **16 distinct files** (including comments; this is the change-risk inventory, not 16 independently executing real hooks):

- `test/cli/fgos-claim-2.test.mjs`
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`
- `test/e2e/main-checkout-lock-hook.test.mjs`
- `test/e2e/resync-worktree-bare-invocation.test.mjs`
- `test/runner/claim-port.test.mjs`
- `test/runner/main-checkout-lock.test.mjs`
- `test/runner/merge.test.mjs`
- `test/scripts/install-git-hooks.test.mjs`
- `test/setup/checks-doctor-config.test.mjs`
- `test/setup/checks-setup-config.test.mjs`
- `test/setup/checks-setup-hookspath.test.mjs`
- `test/setup/checks.test.mjs`
- `test/setup/dir-resolution.test.mjs`
- `test/setup/uninstall-wiring-2.test.mjs`
- `test/setup/uninstall-wiring-3.test.mjs`
- `test/setup/uninstall-wiring.test.mjs`

Paths are the measured consumer set for Phase 05. No tests were executed.

## Red-team extra measurement C — distribution builder consumers

Literal `build-rust-distribution` scan of tracked executable source/test/CI files, excluding the builder itself and prose/history, returns **7 distinct consumers**:

1. [.github/workflows/ci.yml:317](../../../.github/workflows/ci.yml#L317)
2. [.github/workflows/release.yml:47](../../../.github/workflows/release.yml#L47)
3. [scripts/run-rust-dev-host.mjs](../../../scripts/run-rust-dev-host.mjs)
4. [test/rust-host/fgctl-init.test.mjs:15](../../../test/rust-host/fgctl-init.test.mjs#L15)
5. [test/rust-host/fgctl-stage.test.mjs:15](../../../test/rust-host/fgctl-stage.test.mjs#L15)
6. [test/rust-host/fgctl-upgrade.test.mjs:14](../../../test/rust-host/fgctl-upgrade.test.mjs#L14)
7. [test/rust-host/release-tree.test.mjs:16](../../../test/rust-host/release-tree.test.mjs#L16)

The five code/test consumers alone would undercount by omitting both CI workflows. None was built or executed.

## Handoff / blockers

- Baseline collection complete; H1d closed, T03 absent, PC1 supplied clean, impact analysis available with stale-index degradation.
- Preserve **Phase 01 R1 stop**: old eight-role/actors/specialist protocol cannot be silently replaced by the five-capability Workflow within roster-only scope. Owner scope decision is required before implementation.
- The Workflow binding seam establishes a required `host-write-denied` policy, but no actual advisory sandbox run was observed. Direct `dispatch decide` output does not settle the corrected confinement gate. Do not modify config to force a result.
- No implementation acceptance tests, final `npm test`, live confinement probe, release content verification, or doctor drift check were run. No acceptance criterion is reported green solely from this report.
