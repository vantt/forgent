# HARDEN T9 P25 — one domain catalog

Branch `harden/t9-p25`, stacked on `harden/t9-p10` (P25 depends on P10's `registrations.mjs` and main is frozen until rc.8). Not landed.

## What changed
- `domainCatalog({ payloadRoot })` in `src/util/domain-dirs.mjs` (no new file for the catalog): the running payload's domains with each domain's registry, compiled, agents, workflows, skills, task-specs and prompt-templates paths. `PAYLOAD_ROOT` is the one payload root. `payloadRoot` is a seam for tests and builds, never chosen by a doctrine reader.
- `compiled.json` carries `contract: { id: 'domain-compiled', version: 1 }`; `readCompiledDomain` refuses a missing or other contract by name; the Work registry reads through it; `domains/coding/compiled.json` regenerated, a second `npm run build:domains` writes nothing.
- The compile and judge moved from `scripts/build-domain-registry.mjs` into `src/util/domain-compile.mjs`; the script is thin; the doctor row imports from `src`, not from `scripts`. The judge also names a file without the contract.
- Doctrine readers now read the payload with no root choice: operation prompt templates, agent definitions' domain tier, the agent roster (payload core and domains, the project's legacy `agents/`), the Work registry, and the doctor row `domain-registry-compiled` (it now judges the running fgOS's registries, also inside the release source).
- Walkers that take an explicit root by their own API now use the one catalog walk instead of their own: the workflow loader (P24's project-first workflow tiers unchanged), skill source roots, `allTaskSpecs`, `allAgentYamlFiles`, `scripts/project-agents.mjs`.

## Tests
Added: catalog shape and root, the payload (not cwd) default, contract refusal by name, a project's own `domains/` is not read by agent definitions or the roster, the doctor row names a pre-contract file. Moved to the new seam: agent definition, persona scope, roster, packaged definitions, registrations and compiled-registry cases that built a project with domains now name the fixture as the payload. Retired: `fgos doctor lists every check when a domain workflow cannot be parsed` (a project's own domain workflow is no longer judged; the parse naming is owned by `the doctor check names a domain workflow that cannot be parsed, with line and column`).

## Gates
Full `npm test`: 8864 tests, 0 fail. The first full run had 5 real reds, all fixed: agent-listing hid project domain personas (a behaviour decision 79 Q4 removes; `masked` now covers core only, `fgos-advise` text updated and skills rebuilt), and the roster lookup of `resolveAgentTypeForWork` now takes the payload-root seam; one load flake (`closing-block` ENOTEMPTY) passed alone. Architecture, doc-health, citation drift, skills tests and the census scan are green; a second `npm run build:domains` writes nothing.

## Open for the owner (honest gap)
The rows `agent-claims-resolve` and `agent-type-names-unique` (project tiers only) and `instruction-registry` still take a root from their callers: they judge what a project supplies, and decision 79 Q4 says a project supplies no domain doctrine, so their domain half now has nothing to judge in a plain project. Either retire the project-domain half of those rows or keep them for forks; this phase did not decide that. `src/setup/instruction-registry.mjs` walks the repository's own `domains/` as build input and was left on `listDomainDirs`.

## Lessons
- A phase table of callers hides that some callers are rows whose purpose is the very thing the decision forbids; read each row's description before calling it a root choice.
- Stack on the unlanded predecessor branch explicitly when main is frozen; the base is `origin/<branch>`, not main.

Status: DONE_WITH_CONCERNS
