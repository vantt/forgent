---
phase: 25
title: "PROPOSED - AWAITING OWNER APPROVAL: T8 fix: one domain catalog on the payload root; callers stop choosing their own root; compiled.json gets a version"
status: pending
depends_on: ["owner approval (a new door, RUL104; T8 closing report 2026-11-09 17:52, open items)", "24 landed (loader.mjs)", "10 landed (registrations.mjs chain)", "15 landed (skill-wrappers.mjs)"]
parallel: "T8 slot, after P10; touches no bin/fgos.mjs range"
effort: ~0.75d
net_size: "Node about -30; compiled.json version +1 field per domain; Rust 0; tests about 0 (estimate)"
---

# Phase 25 - T8 fix: domain catalog (authority audit AU-22) - proposed - awaiting owner approval

**Not started and not gating** until the owner approves. If it is not approved when the other phases land, it moves to the close's hand-off with its text intact.

**Authority moved:** "which domains exist and where their directories and compiled registry are" is answered once, by T8 Domain, from the running payload (decision 79 Q4); callers stop picking a root.

## Context

`listDomainDirs` (`src/util/domain-dirs.mjs:10`) is the one walker (decision 79 Q7), but each caller picks the root:

| Caller | Root it picks |
|---|---|
| `src/runner/dispatch/operation-prompt-templates.mjs:221,290` | payload |
| `src/setup/skill-wrappers.mjs:405` | project root |
| `src/setup/registrations.mjs:706,779,1123` | cwd |
| `src/runner/agent-roster.mjs:47` | cwd |
| `src/runner/agent-definitions.mjs:41-45` | the project when it has `domains/`, else the install root |
| `src/workflow/loader.mjs:29` | the caller's root |

The cwd- and project-rooted callers contradict decision 79 Q4 for any project that has a `domains/` directory. `compiled.json` has no version field. The compiled-domain judge (`checkCompiledDomains`, `scripts/build-domain-registry.mjs`) is imported by a `src/setup` doctor row (a lower layer knowing a script). Work's own walk (`src/state/domain-registry.mjs:67-89`) is Work later (backlog `p-bxahsop7em`).

## Requirements

1. `domainCatalog()` in `src/util/domain-dirs.mjs` (extend the existing leaf; no new file) resolves the payload root once (the running release) and returns each domain's directories and compiled registry.
2. Every caller in the table moves to the catalog in this change (L10); their root choice goes. Workflow's loader reads domain data through it; workflow definitions keep P24's project-first catalog (owner 83: workflows may be project-defined, doctrine may not).
3. `compiled.json` gets `contract: { id: 'domain-compiled', version: 1 }` (COOK §2 shape); the reader refuses an unknown major version by name; `build-domain-registry` writes it and the regenerated files land in the same change.
4. `checkCompiledDomains` moves from `scripts/` into `src` beside the catalog; the script and the doctor row both import it from there.

## Files

**Modify:** `src/util/domain-dirs.mjs`, the six callers above, `scripts/build-domain-registry.mjs` (thin over the moved judge), `domains/*/compiled.json` (regenerated), `docs/architecture-manifest.json`, `test/util/domain-dirs*.test.mjs` (owner), callers' wiring cases, `CHANGELOG.md` (one line: domain doctrine is read only from the installed fgOS, also by doctor and the agent roster).

**Delete:** each caller's own root resolution; the script-side copy of the judge.

**Tests to retire:** caller cases that asserted a cwd-rooted domain read (behaviour removed by decision 79 Q4) are named in the commit body; the catalog test owns the root rule.

## Steps

1. `rg -n "listDomainDirs|compiled\.json|checkCompiledDomains" src scripts test`; list every caller with `file:line`.
2. Red: a project with its own `domains/` directory; every caller reads the payload's domains (fails today for the cwd- and project-rooted callers); a `compiled.json` without the version is refused by name.
3. Catalog; callers; version; judge move; regenerate.

## Validation (focused)

FR `test/util/domain-dirs*`, `test/scripts/*build-domain-registry*`, the doctor row `domain-registry-compiled`, `test/runner/agent-roster*`, `test/workflow/loader*`; `npm run build:skills` writes nothing on a second run. Land gate; WORK told (its item stays theirs).

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A project relied on its own `domains/` being read by doctor or the roster | L x M | decision 79 Q4 already forbids it; CHANGELOG and guide line |

Rollback: revert the merge commit.
