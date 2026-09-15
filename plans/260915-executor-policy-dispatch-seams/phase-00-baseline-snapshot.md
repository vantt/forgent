# Phase 00 — baseline snapshot harness

## Cell goal

Create an automated golden snapshot for current executor/policy behavior before
any semantic migration. This phase must not change dispatch behavior.

## Scope

Build a test/helper that exercises the real resolver/transport path enough to
capture, for representative executor × legacy work-tier cases:

- resolved executor id and binding source;
- provider family;
- policy tier;
- model;
- command and argv after current templating;
- relevant env keys/resource binding targets, not secret values;
- prompt delivery mode;
- adapter;
- confinement backend/policy;
- read-only or tool-gating mechanism, if any.

Seed the expected fixture from `plans/reports/executor-policy-baseline-260915.md`
but make the test call production resolver functions instead of copying the
report's ad-hoc script.

## Likely files

- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/assignment-policy.mjs`
- `test/runner/assignment-dispatch.test.mjs`
- a new runner dispatch snapshot test file if that keeps the fixture clearer

Prefer adding a test helper over changing production code. Production code
changes in this phase should be limited to exporting an already-pure helper if
the test cannot otherwise reach the real path.

## Snapshot shape

Use a stable JSON object. Normalize:

- prompt text to `"<prompt>"`;
- secret values to env key names only;
- absolute temp paths to `"<path>"`;
- flag ordering only if the provider treats the order as irrelevant.

Recommended row shape:

```jsonc
{
  "selector": "agy-herdr",
  "workTier": "heavy",
  "bindingSource": "executor-id|capability.prefer|capability.for",
  "provider": "gemini",
  "policyTier": "creative",
  "model": "gemini-3.8-flash-high",
  "command": "agy",
  "args": ["<prompt>", "--mode", "accept-edits", "--new-project", "--model", "gemini-3.8-flash-high"],
  "envKeys": ["HOME"],
  "adapter": "herdr-spawn",
  "promptDelivery": "file-pointer?",
  "confinement": "none",
  "readOnlyMechanism": "none|tool-gating|sandbox|provider-native"
}
```

## Required cases

At minimum include:

- `claude`, `claude-reviewer`, `claude-reviewer-herdr`
- `agy-cli`, `agy-herdr`, `fgos-coding-implement`
- `codex-cli`, `codex-bwrap`, `codex-readonly`
- `pi`, `pi-herdr`, `codex-pi`
- `glm-cli`

For each, cover `light`, `standard`, and `heavy` where the legacy path supports
work-tier resolution.

## Important expected facts

- Raw `agy-cli`/`agy-herdr` heavy currently resolves to
  `creative -> gemini-3.8-flash-high`.
- `fgos-coding-implement` currently overrides heavy to
  `standard -> gemini-3.8-flash-medium`.
- `claude-reviewer*` currently includes `--effort high`.
- `codex-readonly` remains registered but is described as retired for dispatch.

## Verification

```sh
npm test -- test/runner/assignment-dispatch.test.mjs test/runner/dispatch*.test.mjs
```

If test filenames differ, run the smallest runner dispatch test subset that
contains the new snapshot test and record the exact command in the cell trace.

## Exit criteria

- Snapshot test fails if the current model/argv/env/prompt-delivery behavior
  changes unexpectedly.
- The fixture explicitly names the agy creative-column behavior and the
  `fgos-coding-implement` override behavior.
- No runtime dispatch is spawned by this test.
