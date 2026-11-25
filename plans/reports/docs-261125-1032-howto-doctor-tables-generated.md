# How-to doctor tables generated from the registry

## Reused
- `packages/distribution/contracts/doctor-registry.v1.json` and the config group expansion (`groups.config`, `packages/config/contracts/doctor-rows.v1.json`), same expansion as `registryEntries()` in `test/setup/helpers/setup-checks-harness.mjs`.
- Owning test file `test/setup/registrations.test.mjs` (already pins the registry contract); two tests appended there.
- No existing docs generated-section mechanism fit (rg found none for how-to docs), so one small script was added: `scripts/render-doctor-howto-tables.mjs` (write, or `--check`).

## Generated
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` section 4.7: 119 rows in run order (Id, Checks, Fix). Fix is `fgos doctor --fix --only <fix-id>` for the 28 rows a registered fix repairs (own id, `repairs`, or the config row's `fix`); "none registered" otherwise.
- Hand-written 4.1 to 4.6 kept (typical failing messages, manual steps); numbering unchanged so section links in README, CI and scripts stay valid.

## Drift found
- Removed stale rows: bin-discovery-cache (a fix, not a row), config-awareness, worktree-setup-configured, gate-bypass-configured, iron-law-configured, runner-coordination-orgPolicy-shape. `gateway-token-configured` is live (config group idMap); its description updated to the registry's.
- Empty id: the single registry row `{ "group": "config" }` is the config group placeholder, not a defect; it expands to the config crate's rows. No contract change.
- Registry rows (103 incl. placeholder) expand to 119 doctor rows.

## Tests
- `env -u CLAUDE_CODE_SESSION_ID node scripts/run-tests.mjs test/setup/registrations.test.mjs`: 54 pass, 0 fail (incl. generated-block-current and no-unknown-id-in-hand-tables).
- `node scripts/doc-health.mjs <how-to>`: 0 findings.
- CHANGELOG `[Unreleased]` line added.

## Open
- Hand-written rows' fix text is checked for id existence only, not for wording vs the registry.
