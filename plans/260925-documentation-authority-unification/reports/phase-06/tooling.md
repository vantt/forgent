# Tooling execution record

Executor: codex-session:1@2026-10-07
Date: 2026-10-07
State: authoring; independent review not performed.

## Repeatable decision input

CLI contract: `node scripts/check-doc-inventory-gates.mjs --decisions <file-or-directory> [--decisions <file-or-directory> ...]`. Every supplied path is loaded in argument order; directory shards remain sorted by file name. Each path must be readable; each directory must hold at least one JSON shard. A missing value or option-looking value is rejected with an error naming `--decisions`. Decisions from all paths go through the existing combined duplicate and disposition validation. No flag means the same default as before; one flag keeps its existing behavior.

Scope: `runCli` only; existing `loadDecisionShards` reused unchanged. Tests added to the existing conservation CLI fixtures; no schema extension needed for this input-only tool.

Prior art: the single-input CLI and shard loader already exist. The phase explicitly authorizes extending the input cardinality, not replacing the loader or decision semantics.

Impact: GitNexus bound to `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, index `738a3fc` (stale). Disambiguated upstream impact of `runCli` in `scripts/check-doc-inventory-gates.mjs`: LOW, 1 direct caller (the same script's entry), 0 affected processes/modules. The first ambiguous call was not used as proof. `detect-changes --scope all --repo <worktree>` reported no changes despite the added tests; that result is UNPROVEN as a scope certificate and was reported to the tool issue device. No JavaScript LSP server is available (only Rust configured).

## Verification

- Red commit: `73416e048`, tests only. `env -u CLAUDE_CODE_SESSION_ID node --test --test-name-pattern="gates CLI (combines repeated|rejects each)" test/scripts/check-doc-conservation.test.mjs`: 2 tests, 0 pass, 2 fail. Actual failure: later `--decisions` silently ignored.
- After implementation: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/check-doc-conservation.test.mjs`: 34 pass, 0 fail.
- Full scripts suite: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` (42 filenames expanded by Node): 786 pass, 0 fail, exit 0. Output retained in `/tmp/phase06/tooling-suite.log`; counts from the node:test footer, not shell text counting.
- Working-tree CLI smoke against the real scratch inventory: `node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json --decisions plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json --json`: exit 0, 0 fatal findings, 87,061 not-reviewed rows. Both separate files contribute to the reviewed count; fixture probes additionally show that duplicates across inputs and later missing/empty inputs are rejected.
- D on the frozen Step 0 scratch inventory with the whole pilot directory: exit 0; parsed JSON exactly equal to `/tmp/phase06/gate-baseline.json` (no normalization needed).

No target, extractor, authority status or legacy-root content changed. Tests/code remain subject to the separate committed tooling review. Remaining tools, sensitivity mutations and area maps are UNPROVEN and not complete. The allowed report is the documentation of this repository-only CLI change; CHANGELOG.md is outside the phase's allowed paths and was not changed.

## Evidence mirror entries

Contract: shard version 1 adds `mirrors: [{path, target, blobSha}]`. Both paths must be inventory documents with the same full 40-character pinned blob id; the source must be legacy evidence under `docs/architect/<area>/verification/<collection>/`, listed in shard sources, and the target must be evidence in the same platform area. Every source unit must match a target unit at the same anchor and digest. The existing commit-blob integrity check rechecks inventory blob ids and content on every gate run. Normal claim/file duplicate checks also apply to expanded entries.

Expansion: every source row becomes `delete-as-duplicate`, `reviewed`, with the verified platform copy as owner, the corresponding unit anchor/digest, its own proof rationale and searched paths. Identities are `script:propose-doc-decisions` and `script:check-doc-inventory-gates`. The source file gets the matching disposition. Target rows are not implicitly reviewed. This channel implements Q1 a and Q2b yes, not a permission to hand-write script-reviewed claims.

Existing target lookup functions reuse the frozen mixed-file extractor for non-Markdown payloads, including the `file-block` anchor and digest. Markdown behavior is unchanged. No extractor function was edited. Mirror owners are registered through the same candidate/promoted inventory-owner rule as manual claim owners.

Prior art: `git log -S 'mirrors' -- scripts/check-doc-inventory-gates.mjs` returned no earlier mirror channel; the existing loader, normal claim validation, duplicate validation and committed blob verification were reused. GitNexus upstream calls for applyDecisions, both target lookup functions, loadDecisionShards and decidedPlatformOwners returned UNKNOWN/not-found from the old index. Scoped callsite evidence identifies checkInventory/CLI and the conservation tests. No graph result is claimed as a complete blast-radius certificate.

Verification:

- Red commit `abc229123`: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-mirrors.test.mjs`: 1 pass, 4 fail, proving missing mirror expansion/proof and missing mixed-file target anchor support.
- After implementation: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-decision-mirrors.test.mjs test/scripts/check-doc-conservation.test.mjs`: 39 pass, 0 fail.
- Real working-tree smoke: D with both the pilot directory and `/tmp/phase06/mirror-smoke.json`, against the byte-identical `docs/architect/agent-coordination/verification/architecture-advisory-panel/current-cell.md` / platform copy, and `--previous-registry reports/identity-registry.json`: exit 0, 0 fatal findings. An initial smoke caught missing expanded-owner registration; the in-scope fix was verified by the passing smoke. No mirror decision shard is committed during this tooling step.
- D without the throwaway mirror shard, once per A1 prior-registry path: both exit 0, and both parsed results exactly equal the Step 0 baseline JSON.
- Full scripts suite at default concurrency: 791 tests, 790 pass, 1 fail. The existing canary-overhead test measured median 509.73 ms against its 250 ms limit. The failed test does not import the changed gate; its threshold and implementation were not edited.
- Scheduling-isolation run: `env -u CLAUDE_CODE_SESSION_ID node --test --test-concurrency=1 test/scripts/*.test.mjs` (43 paths expanded by Node): 791 pass, 0 fail, 35.63 seconds. This exercises every test without changing the threshold or excluding any path. Concurrency contention is an inference from this comparison, not a proven cause. Logs: `/tmp/phase06/mirror-suite.log`, `/tmp/phase06/mirror-suite-serial.log`.

Full tooling independent review, all later tools and the final mutation run remain UNPROVEN.
