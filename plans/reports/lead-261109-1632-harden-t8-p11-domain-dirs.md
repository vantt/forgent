# HARDEN T8 P11 lead report: domain-dirs door

Landed on main `e770bac66` (code `d6cc9ab76`).

- Leaf `src/util/domain-dirs.mjs` (kernel, manifest row): `listDomainDirs(domainsDir)` sorted, directories only, `[]` when absent or not a directory. Takes the `domains/` dir, not the project root: `checkCompiledDomains`, `compileAllDomains` and the instruction registry's `domainsRoot` option already receive that dir.
- Callers moved (12 loops, 10 files): skill-wrappers `skillSourceRoots`, instruction-registry, build-domain-registry (2), project-agents, registrations (`allTaskSpecs`, `allAgentYamlFiles`), agent-roster, agent-definitions, operation-prompt-templates (2), workflow loader. Dot-name and own-tmp filters stay at the call site.
- After: `rg -n "readdirSync\(.*domains" src scripts bin` -> `src/state/domain-registry.mjs:72` (WORK) and the leaf only.
- Sort change (RT-6): skillSourceRoots, instruction-registry domain loop, compileAllDomains, allTaskSpecs read directory order before; none of their tests assert an order, 341-test focused set green.
- WORK item `p-bxahsop7em` in `docs/backlog.md`; board line posted; WORK told via the main session; guide section added.
- Tests: new `test/util/domain-dirs.test.mjs` (3). None retired. Full npm test: 8584 pass, 2 fail, both red on origin/main without this change (V7n addendum; `active-release-drift-check` "real builder selection", the fgctl release commit left its fixture without a compiled fgctl: needs an owner).
