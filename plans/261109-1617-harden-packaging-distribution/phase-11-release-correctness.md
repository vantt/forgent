---
phase: 11
title: "Release correctness: plugin version follows the product, a release needs the whole test suite, the consumer proof upgrades from the previous tag and runs doctor and uninstall"
status: completed
depends_on: ["P09 landed (consumer script variable lines)", "P06 landed (consumer init expectations)", "P08 landed for the uninstall smoke step only"]
parallel: "group G4 with P08 and P10; sole writer of release.yml, prepare-release.mjs and the consumer scripts from here"
effort: ~1d
net_size: "Node about +20 / YAML about +10 / shell and PowerShell about +90 / tests about +25 (estimate)"
---

# Phase 11 - Release correctness (F13, F14)

## Context

VER-03, POLY-02, CH-PLUGIN-01, REL-03, TST-03, TST-02. Evidence:
- `plugins/fgOS/.claude-plugin/plugin.json` is `1.2.0` while the product is 0.2.0; `scripts/prepare-release.mjs` rewrites `package.json`, `package-lock.json` and the Rust manifests (`:33-41`, `:52-86`, `:112-118`) but never plugin manifests; no drift test. `plugins/` holds `fgOS` and `dogfood-fixture`.
- `.github/workflows/release.yml` (103 lines) runs `check-version -> assets -> publish` (`:11-38`); the suite in `ci.yml` is not required. `ci.yml` has no `workflow_call` trigger.
- The consumer proof tests install, init, version, ready and a same-asset upgrade only.

## Requirements

1. **Plugin version.** `prepare-release.mjs` also rewrites every `plugins/*/.claude-plugin/plugin.json` `version` to the release base version. `plugin.json` is set to the current product version now. A test fails when any plugin manifest version differs from `package.json`. Q-C: the product (0.2.x) sorts below the installed 1.2.0, so installed plugins may not see updates; default is accept and add one line to the release note ("reinstall the plugin once").
2. **Gate.** `ci.yml` gains `workflow_call`; `release.yml` runs it and `publish` needs it (REL-03).
3. **Upgrade from the previous tag (TST-03).** The consumer proof resolves the previous release tag dynamically, installs its real assets, upgrades to the candidate built in this run, and asserts the activation digest changed and the project's config survived. Assertion by digest through `fgctl status`, because the previous tag's `fgctl` has no `--version`; once both sides have it, a version assertion is added.
4. **Smoke (TST-02).** After init the proof runs `fgos doctor --json` and requires `ok: true` (a clean runner has no agent CLI; after P01 and P02 that row is `warn`), and after P08 runs `fgctl uninstall --yes` and checks the tree.
5. The `dogfood-fixture` marketplace entry, SHA-pinned actions, draft-publish and the runbook are Owner ideas, not here.

## Files

**Modify:** `.github/workflows/release.yml`, `.github/workflows/ci.yml` (trigger only), `scripts/prepare-release.mjs`, `plugins/fgOS/.claude-plugin/plugin.json`, `scripts/ci-external-consumer.{sh,ps1}`, `test/scripts/prepare-release.test.mjs`, `CHANGELOG.md`.
**Create:** none. **Delete:** none.
**Tests to retire:** none.

## Red tests first

`test/scripts/prepare-release.test.mjs`: after a prepare run every plugin manifest equals the new version; a standalone assertion that fails on today's tree (1.2.0 vs 0.2.0). Workflow edits are proven by the consumer proof run on a PR (`release-assets-check.yml` calls the same script) and by a dry read of `release.yml` in the report.

## Net size

Node about +20, YAML about +10, shell and PowerShell about +90 (upgrade step 40 each side, smoke 10), tests about +25.

## Steps

1. Enumerate plugin manifests and the previous-tag resolution (the consumer already has GitHub access in CI; local runs skip with a message). 2. Red test. 3. Script, workflow, proof. 4. Uninstall smoke after P08.

## Validation

FR `test/scripts/prepare-release.test.mjs test/scripts/release-packaging.test.mjs`; the consumer proof on a PR; `act`-free: read the workflow graph (`needs`) in the report.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Release now also runs the whole CI matrix and takes longer | High x Low | accepted: a red main must not publish |
| Previous-tag fetch fails offline or on the first release | Med x Low | the step skips with a message when no previous tag exists; CI has network |
| Plugin version drops below installed 1.2.0 | Med x Med | Q-C, release note line |

## Rollback

Revert the merge; a published release is untouched.

## Closes

VER-03, POLY-02, CH-PLUGIN-01, REL-03, TST-03; TST-02 partial -> done; VER-05 follow-through.
