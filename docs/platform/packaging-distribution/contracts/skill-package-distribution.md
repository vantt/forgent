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
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/architect/domainization/README.md
- src/setup/skill-wrappers.mjs
- scripts/build-skill-wrappers.mjs
- test/setup/skill-wrappers.test.mjs
- test/skills/fgos-mirror.test.mjs
```

## 1. Purpose

Skill package-distribution defines how one canonical fgOS skill source is rendered into the host-specific surfaces used by Codex/OpenAI agents, Claude, Gemini, and plugin-only consumers.

It does not define the behavioral semantics of a skill. The owning component or domain owns the skill body, examples, protocols, and execution policy.

## 2. Boundary

| Concern | Owner |
| --- | --- |
| Canonical skill body and its semantics | Owning component or domain |
| Skill render targets, host adapters, wrapper generation, install packaging, stale checks | Packaging-distribution |
| Group-thinking protocol semantics | Agent coordination / group-thinking |
| Coding mutation, tests, worktree, commit, review/red-team policy | Coding domain |
| Host command invocation syntax after projection exists | Host invocation / host adapter surface |

Packaging-distribution owns the distribution layer because `.agents/skills`, `.claude/skills`, plugin skill bundles, and future Gemini extension files are host-visible projections of the selected runtime.

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
.gemini/extensions/fgos/ (prototype extension package generator; partial/planned)
```

Current build/proof surfaces:

| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |

Generated targets are not the source of truth. They may be committed for host compatibility, but edits should flow from the canonical source through the generator. Note that host trees may be mixed: `plugins/fgOS/skills/` contains hand-authored user commands (`pick`, `submit`, `cook`, `list`, etc.) alongside mirrored `fgos-*` dev skills, and `.claude/skills/` preserves hand-authored skills (`ui-spec`, `gitnexus`) without treating them as generated wrappers.

## 4. Source-Of-Truth Rule

Every skill has exactly one canonical source directory.

The correct canonical location is determined by component authority:

| Skill type | Canonical source |
| --- | --- |
| Cross-cutting platform skill | `core/skills/<skill>/` |
| Domain-owned skill | `domains/<domain>/skills/<skill>/` |
| Host adapter/wrapper only | Distribution target generated from canonical source |
| Plugin/extension packaging metadata | Packaging-distribution owned adapter target |

Do not create a second canonical copy in `.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`, or a Gemini extension package.

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
| Gemini CLI | extension package with `gemini-extension.json`, `GEMINI.md`, and `commands/fgos/<verb>.toml` | `/fgos:<verb>` via command directory namespace | partial (prototype generator only; release/doctor wiring planned) |

Claude, Gemini, and Codex are adapters. None of them should own the fgOS skill semantics.

Self-containment rule for the Gemini package (and any future installable extension): the package must run with the fgOS source repo absent. Every `commands/fgos/<verb>.toml` names only its packaged copy (`packaged_source = "skills/<skill>/SKILL.md"`) as the thing the host reads; the canonical directory it was rendered from is recorded in `provenance` as ledger metadata only, never as a runnable reference. Shared fragments ship inside the package under `skills/_shared/`. Generated adapter classification for `plugins/fgOS/skills/` follows the mirror's own write rule plus provenance (`_shared/` or `fgos-*` **and** a canonical/assembled source), so a hand-authored `plugins/fgOS/skills/fgos-custom/` with no source stays unmanaged.

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
| `fgos:code-panel` | `$fgos-code-panel` | `/fgos:code-panel` and compatibility `/fgOS:code-panel` if already shipped | `/fgos:code-panel` | implemented |
| `fgos:architecture-panel` | `$fgos-architecture-panel` | `/fgos:architecture-panel` | `/fgos:architecture-panel` | implemented |
| `fgos:routing` | `$fgos-routing` | `/fgos:routing` | `/fgos:routing` | implemented |
| `fgos:pick` | `$fgos-routing` (alias) | `/fgos:pick` (compat `/fgOS:pick`) | `/fgos:pick` | partial (hand-authored plugin command; canonical public-intent mapping planned) |
| `fgos:submit` | `$fgos-clarifying` (target) | `/fgos:submit` (compat `/fgOS:submit`) | `/fgos:submit` | partial (hand-authored plugin command; canonical public-intent mapping planned) |

Direct 1:1 intent-to-trigger mapping is implemented for canonical skills whose intent matches their canonical name or frontmatter `intent:` / `public-intent:`. Compatibility mapping for legacy `/fgOS:*` commands where discovery does not yet produce explicit intent aliases (e.g. `fgos:pick` vs `fgos-routing`) is partial and tracked for subsequent instruction/routing phases.

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

`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate generated projections through the registered fix path. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.

## 10. Projection Ledger Fit

Skill distribution targets are host-visible projections. The long-term ledger should be able to answer:

- which runtime generated the projection;
- which canonical skill source produced it;
- which host adapter wrote it;
- which files are safe to repair or overwrite.

Until projection ledger behavior is implemented, docs must mark those claims as planned or partial.
