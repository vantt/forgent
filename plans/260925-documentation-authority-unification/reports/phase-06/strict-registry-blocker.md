# Strict scratch-registry command blocker

Date: 2026-10-07
Executor: codex-session:1@2026-10-07
State: stopped for owner decision, not ready for full tooling review.
Verified implementation commit: `8dcf162c4b0f357972187b8cca7c2d46dd1fc96a`

## Problem

The prescribed check D uses `--identity-registry /tmp/phase06/identity-registry.json`. `runCli` passes that file's repository-relative path to `loadPreviousRegistries`. Without `--previous-registry`, the latter tries `git show HEAD:../../../../tmp/phase06/identity-registry.json` instead of the committed plan registry. The scratch file cannot be a committed repository path. D warns and skips that comparison; E makes the missing comparison a fatal `conservation-input-missing`, regardless of how completely a batch is reviewed.

Source evidence: `scripts/check-doc-inventory-gates.mjs`, `runCli` lines 976-980 after the input-only change, `loadPreviousRegistries` lines 913-925, `checkInventory` lines 794-796. Exact line positions are incidental; the symbols and behavior are the contract.

This is pre-existing: the same warning occurred in the Step 0 baseline before the repeatable-input change. No extractor or source unit changed. All non-strict baseline JSON remains identical after that tool.

## Executed reproduction

After the implementation commit, refresh:

```sh
node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry /tmp/phase06/identity-registry.json --json-out /tmp/phase06/doc-inventory.json --md-out /tmp/phase06/doc-inventory.md
```

Exit 0; registry bound, no carry-forward needed.

Strict preflight using the available reviewed pilot scope (not a later batch execution or a promotion rehearsal):

```sh
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --strict --scope docs/specs/work-state.md --scope docs/io-contract.md --json
```

Exit 1. Parsed JSON: exactly 2 fatal finding records:

1. `claims-not-reviewed`: 2 pending SC-1 rows (expected from the closed pilot).
2. `conservation-input-missing`: `strict mode needs the registry committed at HEAD (../../../../tmp/phase06/identity-registry.json)` (not one of check E's allowed open types).

Saved JSON: `/tmp/phase06/strict-preflight.json`.

One diagnostic with the existing supported override, not adopted as the phase command:

```sh
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --strict --scope docs/specs/work-state.md --scope docs/io-contract.md --json --previous-registry plans/260925-documentation-authority-unification/reports/identity-registry.json
```

Exit 1. Exactly 1 fatal finding record: `claims-not-reviewed`, 2 SC-1 rows. Missing-input finding removed; no new invariant findings. Saved JSON: `/tmp/phase06/strict-explicit-registry.json`. This proves the existing override is reachable. It does not prove a reviewed batch can pass E; no new batch has been authored.

Post-commit scripts suite: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` (42 paths expanded by Node), 786 pass, 0 fail. Output `/tmp/phase06/tooling-suite-after-commit.log`. Frozen Step 0 inventory D: exit 0 and parsed JSON exactly equal to the baseline.

## Decision needed

The phase says its check commands run as written and forbids tool changes outside the Step 1 table. The input-only tool does not authorize altering `loadPreviousRegistries` or the meaning of missing conservation inputs. Therefore neither silently rewriting the official checks nor changing that loader is adopted here.

Recommended: authorize an invocation-only amendment to D and E with the existing `--previous-registry` flag against the committed current registry, plus a second invocation against `reports/phase-02-identity-registry.json` to retain the sealed-first-generation comparison. A single explicit flag replaces the default pair; the second invocation is necessary to preserve both proof obligations. Do not weaken `conservation-input-missing` and do not commit scratch shards.

Alternative: explicitly authorize a narrowly tested loader fix that always reads the committed current registry at its canonical repository path while still reading the supplied scratch registry as the current candidate. This changes a function outside the named tool operations and needs a new owner authorization before implementation.

The tooling table and official phase checks were not edited. No later tool, area map, candidate row, corpus rule, sensitivity test or promotion rehearsal has been executed. Their acceptance remains UNPROVEN. This is an early contract-command blocker, not a completed Step 2 rehearsal or a claim that stop condition 12 has run.

## Owner and reviewer routes

- Archive/delete decisions: none authored.
- Real content conflicts: none newly adjudicated; existing SC-1 remains pending.
- Claim holds: none authored. This is a command-level blocker, not a claim hold.
- Promoted-doc edits: none.
- If an independent reviewer checks the completed input tool now, review `scripts/check-doc-inventory-gates.mjs`, `test/scripts/check-doc-conservation.test.mjs`, `reports/phase-06/tooling.md`, and this reproduction. Do not mark the whole tooling step approved: remaining tools/maps have not been authored. No decision rows may become reviewed in this author session.

Exact next action after a committed owner decision: apply the authorized command amendment or loader fix (only if separately authorized), rerun D/E with both prior-registry proofs and current scratch state, record results in progress, then continue Step 1 with mirror entries. Before Step 2, complete all tooling, tests, mutation probes, frozen maps and the independent committed tooling review.
