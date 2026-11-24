# Phase 5c result

Changes:
- test/setup/instruction-registry.test.mjs:44-48 — writeModel also copies the real packages/component-authority/contracts/model.v1.json into the temp repo.
- test/report/decision-index.test.mjs:~248-256 — the holder-resolver fixture copies the same contract file.
- src/setup/instruction-registry.mjs:469-474 — `model.components ?? []` and `model.layers?.domains ?? []`: an inactive answer leaves only the default owners.
- src/report/decision-index.mjs:40-41 — `decisionKinds = []` default: an inactive answer behaves like an absent model directory.

- Finishing unit: test/report/decision-index.test.mjs:254 now uses the file's existing `__dirname` instead of `path.dirname(fileURLToPath(import.meta.url))`.

Not run: `node --test` was refused in this session. The lead runs `node --test test/setup/instruction-registry.test.mjs test/report/decision-index.test.mjs`.

Status: DONE_WITH_CONCERNS
Summary: fixtures carry the contract file; both readers treat an inactive authority answer as no model.
Concerns: tests unverified here (node --test refused).
Lead verification: the two test files pass 65/65 with the fix and fail 8 without it.
