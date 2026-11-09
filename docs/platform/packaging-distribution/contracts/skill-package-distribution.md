# Contract: Skill Package Distribution

```txt
Document type: Contract
Audience: Maintainer, skill author, distribution engineer, implementation agent
Purpose: Define how fgOS skills are authored once and distributed to agent-host surfaces
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code/test scan plus cross-host trigger design discussion
Last reviewed: 2026-11-09 (sections 3.1, 6 and 9 re-read against code)
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/platform/domainization/architecture/domainization.md
- src/setup/skill-wrappers.mjs
- scripts/build-skill-wrappers.mjs
- test/setup/skill-wrappers.test.mjs
- test/skills/fgos-mirror.test.mjs
- src/runner/worktree.mjs (skill provisioning of a new worktree)
- plans/reports/council-261109-1000-harden-t8-arbitration.md (target shapes, approved by owner decision 79)
Implementation: Original section-specific implementation statements retained; provenance does not certify current implementation
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

Skill package-distribution defines how one canonical fgOS skill source is rendered into the host-specific surfaces used by Codex/OpenAI agents, Claude, and plugin-only consumers.

It does not define the behavioral semantics of a skill. The owning component or domain owns the skill body, examples, protocols, and execution policy.

## 2. Boundary

| Concern | Owner |
| --- | --- |
| Canonical skill body and its semantics | Owning component or domain |
| Skill render targets, host adapters, wrapper generation, install packaging, stale checks | Packaging-distribution |
| Group-thinking protocol semantics | Agent coordination / group-thinking |
| Coding mutation, tests, worktree, commit, review/red-team policy | Coding domain |
| Host command invocation syntax after projection exists | Host invocation / host adapter surface |

Packaging-distribution owns the distribution layer because `.agents/skills`, `.claude/skills`, plugin skill bundles, are host-visible projections of the selected runtime.

## 3. Implemented Model

Current canonical authoring sources:

```txt
core/skills/
domains/<domain>/skills/
```

Current generated or assembled distribution targets:

```txt
.agents/skills/ (assembled portable projection)
.claude/skills/ (generated thin wrappers for canonical skills; hand-authored skills preserved)
plugins/fgOS/skills/ (mirrored fgos-* dev skills and _shared/; hand-authored plugin skills preserved)
```

Current build/proof surfaces:

| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills`; the render, the plugin mirror and `fgos setup` write only skill names assembled from fgOS sources (`ownedSkillNames`), never another kit's directory | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs`  **Status note (2026-10-14):** The retained implementation claim overstates doctor/fix coverage: `plugin-dev-skills-packaged` detects missing files only (`src/setup/registrations.mjs:3251-3276`); byte drift is checked by `test/skills/fgos-mirror.test.mjs:137`, and this check has no registered repair. |
| Generate a Gemini CLI extension package | not provided | removed; add it through the common render (`renderSkillSurfaces`) if a Gemini consumer appears |

Generated targets are not the source of truth. They may be committed for host compatibility, but edits should flow from the canonical source through the generator. Note that host trees may be mixed: `plugins/fgOS/skills/` contains hand-authored user commands (`pick`, `submit`, `cook`, `list`, etc.) alongside mirrored `fgos-*` dev skills, and `.claude/skills/` preserves hand-authored skills (`ui-spec`, `gitnexus`) without treating them as generated wrappers.

Run `npm run build:skills` in the fgOS source repo after editing canonical skill sources. Every Markdown file written by assembly carries a one-line HTML generated-from header naming its repo-relative `core/skills/...` or `domains/<domain>/skills/...` source and that rebuild command. The header follows byte-identical YAML frontmatter, or is the first line when none exists. Plugin mirrors inherit it through copying. A `.claude/skills/<skill>/` directory holds only its generated thin `SKILL.md`, which keeps its generated-wrapper marker and points to the assembled projection under `.agents/skills/<skill>/` whose header identifies the canonical source; references, scripts and other sibling files are read there, never from a copy under `.claude` (section 3.1). Non-Markdown bytes and hand-authored plugin CLI-wrapper skills are unchanged.

### 3.1 Render rules

Settled by owner decision 79 (2026-11-09; target shapes in the [T8 arbitration](../../../../plans/reports/council-261109-1000-harden-t8-arbitration.md#1-part-a-target-shapes-for-owner-approval), narrative in the [packaging-distribution decision history](../spec.md#lịch-sử-quyết-định)). All of it is Node in `src/setup/skill-wrappers.mjs`; `npm run build:skills` is `ensureAddonForScript()` plus one call to the render.

| Rule | What holds | Owning proof |
| --- | --- | --- |
| One render door, compute first | `renderSkillSurfaces(root)` computes the owned name set and the instruction projection, then checks every target root, and only then assembles, wraps, mirrors and projects. Any refusal leaves the tree untouched. | `test/setup/skill-wrappers.test.mjs`: a refused instruction projection leaves every skill surface untouched; `build:skills` without a staged addon either completes or exits before its first write |
| One owned-name door | `ownedSkillNames(...roots)` is every skill assembled from `core/skills` and `domains/<domain>/skills`, plus `_shared`. The render, the plugin mirror and `fgos setup` write only these names, so a skill directory another kit installed under a skill root is never read as ours or changed, whatever its name. | same file: rendering a checkout leaves a skill directory of another kit byte-identical under every skill root; setup materialisation leaves another kit skill directory in the target byte-identical |
| Same-name refusal, anchored stamp | A directory with an owned name that holds files but carries no fgOS generated stamp is refused by name before any write (remove it, or rename the other skill). The stamp is the first line after the frontmatter (the wrapper marker under `.claude`, the assembled header under `.agents` and the plugin), so a skill that quotes it lower down is not ours and is not pruned. Both wrapper forms and the one assembled-header form an earlier release wrote are accepted; an unstamped `.agents/skills/<name>` copy a first release wrote is accepted when the sibling `.claude` wrapper is stamped. | same file: a same-name directory without a generated stamp is refused by name by render and by setup; a foreign skill that quotes a generated stamp lower down is not pruned; a skill directory carrying any form an earlier release wrote is overwritten |
| Link refusal | One leaf (`lstatPlain`) is used at every copy site: a symbolic link in a skill source or target path is refused by name and never followed. | same file: a link in a skill source or target is refused by name and never followed |
| Fixed point | Per owned skill directory the target ends equal to its source (files the source lacks are removed); the plugin mirror removes stamped `fgos-*` copies whose skill is gone and keeps hand-authored plugin skills; a second render writes nothing. | same file: a second render after a source deletion is a fixed point and a third render writes nothing; the plugin mirror removes only stamped `fgos-*` copies |
| Setup copies the package only | `materializeSkillsIntoProject` copies only the package root's own skill names; a package skill never overwrites the target's own core skill of the same name. | same file: a package skill never overwrites a target own core skill |
| `.claude` wrapper holds only `SKILL.md` | The reference copies the render used to place beside each wrapper are gone. Probe of 2026-11-09 ([report](../../../../plans/reports/research-261109-1317-harden-t8-reference-copy-probe.md)): a Claude seat run read-only in a worktree with `.claude/skills/fgos-fanout/references/` deleted opened `.claude/skills/fgos-fanout/SKILL.md`, followed its redirect and opened `.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`; the control worktree with the copies opened the same three files. Limit: one skill, one seat shape, the open list is the seat's own report (its tool log was removed with its confinement home). | `test/setup/skill-wrappers.test.mjs`: a wrapper dir holds only its SKILL.md |
| Guards judge owned names | The drift guard compares `.agents/skills` with the sources; `test/skills/fgos-mirror.test.mjs` compares `.claude` and the plugin mirror over the files Git tracks, for every owned name (`distill`, `instruction-audit`, `fgos-*`), and asserts every owned skill has a tracked render under both `.agents` and `.claude`. `.gitignore` keeps its per-name allowlist (it cannot compute a set) and a test proves it names exactly the owned skills. The wide citation sweep behind `fgos decision --relation` no longer reads the rendered `.agents/skills` tree. | `test/skills/fgos-mirror.test.mjs`; `test/scripts/check-decision-citation-drift.test.mjs` |
| Gemini not provided | The Gemini package generator and adapter classifier are removed (they never had a production caller). Add a Gemini target through the common render if a consumer appears. | row removed with its tests |

**Worktree provisioning is kit-agnostic.** `provisionSkillRoots` (`src/runner/worktree.mjs`, called by `provisionWorktree`) gives a new worktree every skill directory the main checkout git-ignores under the five agent skill roots (`AGENT_SKILL_DIRS` in `src/util/agent-skill-dirs.mjs`: `.claude/skills`, `.agents/skills`, `.omp/skills`, `.pi/skills`, `.grok/skills`) that the checkout lacks. "Git-ignored" is the test for "not fgOS-owned": fgOS skills are tracked or rendered into a tracked tree, so no skill set or kit is named anywhere in fgOS code or config. Ignored status is read through the Git Inspect port (a wholly ignored parent such as `.omp/` covers its children). The copy is real, never a hardlink: the probe wrote in place through a hardlink and the main checkout's file changed (a replace-style write did not; a cross-filesystem `cp -al` fails `EXDEV`). A link root or skill directory is skipped, a link inside a skill is copied as a link, an existing target is left alone so a rerun copies nothing, and a failed copy stops the worktree creation naming the directory. The provisioning record takes the copies back on `fgos worktree remove`. The cost per worktree is measured in the HARDEN T8 closing report and is the size of the foreign skill directories the machine holds, not something fgOS can reduce without naming them. Proof: `test/runner/worktree.test.mjs`: a new checkout receives every ignored skill directory of the main checkout, byte for byte, and leaves tracked skills to Git.

**Trust line.** Setup and render refuse what they cannot prove they wrote: a stamp, an owned name and a plain (non-link) path are the proofs.

**Limit, not closed.** A foreign directory that carries fgOS's own generated marker is treated as fgOS's, and `fgos setup` is the one door that still copies into projects; the retirement of `fgos setup` (T9) removes that surface. The two link predicates that exist (`lstatPlain` here and the source collector of `scripts/build-rust-distribution.mjs`) are one decision held twice: the T9 (Packaging) owns merging them.

## 4. Source-Of-Truth Rule

Every skill has exactly one canonical source directory.

The correct canonical location is determined by component authority:

| Skill type | Canonical source |
| --- | --- |
| Cross-cutting platform skill | `core/skills/<skill>/` |
| Domain-owned skill | `domains/<domain>/skills/<skill>/` |
| Host adapter/wrapper only | Distribution target generated from canonical source |
| Plugin/extension packaging metadata | Packaging-distribution owned adapter target |

Do not create a second canonical copy in `.agents/skills`, `.claude/skills`, or `plugins/fgOS/skills`.

## 5. Host Adapter Targets

The target model is:

```txt
canonical skill source
  -> portable skill projection
  -> host adapter projections
```

| Host / consumer | Adapter target | Trigger shape | Status |
| --- | --- | --- | --- |
| Codex / OpenAI skills | `.agents/skills/<skill>/SKILL.md` | `$fgos-...` or implicit selection by skill description | implemented for current canonical skills |
| Claude | `.claude/skills/<skill>/SKILL.md` plus fgOS plugin wrappers/commands where needed | existing `/fgOS:<verb>` compatibility, target lowercase alias `/fgos:<verb>` where host allows | partial |
| Claude plugin-only consumer | `plugins/fgOS/skills/<skill>/SKILL.md` | plugin-exposed command/skill surface | implemented for current `fgos-*` dev skills |
| Gemini CLI | none | none | not provided (the unused prototype generator was removed; add through the common render if ever needed) |

Claude and Codex are adapters. None of them should own the fgOS skill semantics.

Generated adapter classification for `plugins/fgOS/skills/`: the mirror writes only `_shared/` and `fgos-*` directories that have a canonical source, so a hand-authored `plugins/fgOS/skills/fgos-custom/` with no source stays unmanaged.

## 6. Trigger Vocabulary

fgOS should keep a host-neutral intent id and map it to each host's native affordance.

Canonical intent id shape:

```txt
fgos:<verb>
fgos:<compound-verb>
```

Examples:

```txt
fgos:submit
fgos:pick
fgos:code-panel
fgos:architecture-panel
```

Adapter mapping:

| Intent id | Codex/OpenAI skill | Claude | Gemini | Status |
| --- | --- | --- | --- | --- |
| `fgos:code-panel` | `$fgos-code-panel` | `/fgos:code-panel` and compatibility `/fgOS:code-panel` if already shipped | `/fgos:code-panel` | deprecated (stubbed by Unit I29; superseded by `fgos:code-change`) |
| `fgos:code-change` | `$fgos-code-change` | `/fgos:code-change` | `/fgos:code-change` | deprecated (superseded by `fgos-run`, routing via canonical capability) |
| `fgos:architecture-panel` | `$fgos-architecture-panel` | `/fgos:architecture-panel` | `/fgos:architecture-panel` | implemented |
| `fgos:routing` | `$fgos-routing` | `/fgos:routing` | `/fgos:routing` | implemented |
| `fgos:pick` | `$fgos-routing` (alias) | `/fgos:pick` (compat `/fgOS:pick`) | `/fgos:pick` | partial (hand-authored plugin command; canonical public-intent mapping planned) |
| `fgos:submit` | `$fgos-clarifying` (target) | `/fgos:submit` (compat `/fgOS:submit`) | `/fgos:submit` | partial (hand-authored plugin command; canonical public-intent mapping planned) |

No code derives this mapping today. The intent and trigger derivation (`mapSkillIntentToHostTriggers`, the frontmatter `intent:` / `public-intent:` fields) lived inside the removed Gemini generator and never had a production caller; a trigger works because the host reads the skill's directory name (`$fgos-routing`, `/fgos-routing`) or a hand-authored plugin command. The table above is vocabulary design, not behaviour: the Gemini column describes no shipped target, and compatibility mapping for legacy `/fgOS:*` commands (e.g. `fgos:pick` vs `fgos-routing`) is planned, not implemented.

The lowercase `fgos:*` vocabulary is the desired cross-host user surface where the host supports slash commands and auto-suggest. Codex/OpenAI skills do not use slash command namespaces today, so `$fgos-*` remains the native portable trigger there.

## 7. Shared Fragments

Shared instruction fragments must not become an accidental global namespace.

Target rule:

```txt
_shared/<owner>/<fragment>.md
```

Examples:

```txt
_shared/core/executor-dispatch-fallback.md
_shared/coding/worktree-safety.md
```

Current implementation flattens shared fragments into `.agents/skills/_shared`. That is acceptable only as a compatibility shape while the generator guards against collisions and the canonical source remains component-owned.

## 8. Known Ownership Move

`fgos-code-panel` is a coding-domain application surface over coordination/group-thinking machinery. It is not a special case inside group-thinking.

Target canonical location:

```txt
domains/coding/skills/fgos-code-panel/
```

Compatibility requirements for the move:

- keep the generated public skill name `fgos-code-panel`;
- keep existing host triggers working;
- keep plugin-only consumers receiving the same skill;
- update mirror and wrapper tests in the same change;
- document any temporary alias if an old source path remains during migration.

## 9. Doctor/Fix Obligations

Any new skill adapter target must register distribution health through `fgos doctor` and safe repair through `fgos doctor --fix` before it becomes a release promise.

Minimum checks:

- missing generated target;
- stale generated target compared with canonical source;
- missing plugin/extension packaging for a shipped host adapter;
- duplicate canonical skill names across `core/skills` and `domains/*/skills`;
- shared fragment collision across component-owned sources.

Doctor rows that judge skills, after the hardening of 2026-11-09 (ids and count unchanged; each judges more than before):

| Row | Judges |
| --- | --- |
| `agent-claims-resolve` | a task-spec `requires-skill` claim passes only when an agent provides the skill **and** the name is an owned skill (an owned source under `core/skills` or `domains/<domain>/skills`); the message names the failing side |
| `executor-skills-installed` | every skill an executor declares in `supports.skills` is a non-empty `SKILL.md` in the project-level or user-level skill directory of each CLI the executor invokes (roots from `AGENT_SKILL_DIRS`); it judges the main checkout only, and a linked worktree gets foreign skills from provisioning (section 3.1) |
| `domain-registry-compiled` | the same function as `npm run build:domains -- --check` (`checkCompiledDomains`): every `compiled.json` has a `registry.yaml`, equals its compile byte for byte, and no two workflow files share a key |

`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate generated projections through the registered fix path. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.

## 10. Projection Ledger Fit

Skill distribution targets are host-visible projections. The long-term ledger should be able to answer:

- which runtime generated the projection;
- which canonical skill source produced it;
- which host adapter wrote it;
- which files are safe to repair or overwrite.

Until projection ledger behavior is implemented, docs must mark those claims as planned or partial.
