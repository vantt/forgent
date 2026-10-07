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
