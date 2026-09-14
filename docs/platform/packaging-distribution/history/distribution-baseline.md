# History: Distribution Baseline

```txt
Document type: History
Audience: Maintainer, architecture reviewer, documentation agent
Purpose: Preserve old distribution baseline and rationale while new packaging-distribution docs become canonical
Design status: Draft
Implementation status: Historical source
Canonical: Yes, after review
Owner: Platform documentation
Source type: Condensed from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/history/distribution-baseline.md
Last reviewed: 2026-09-13
Related:
- docs/specs/distribution.md
- docs/distribution-vision.md
- docs/platform/packaging-distribution/vision.md
- docs/architect/packaging-distribution/history/distribution-baseline.md
```

## 1. Purpose

This history keeps the old baseline visible without letting it masquerade as current target design.

## 2. Legacy Baseline

The older distribution model centered on:

- GitHub npm install;
- `package.json` `bin.fgos` and `bin.fgos-runner`;
- package allowlist through `package.json` `files`;
- dev checkout shell helper;
- setup/doctor for shell/config readiness;
- no npm registry publish;
- no lifecycle install script.

Those facts remain useful, especially for compatibility behavior.

## 3. Vision Source

`docs/distribution-vision.md` introduced a stronger direction that now lives in `../vision.md`:

- install should not require cloning;
- setup/doctor should self-repair where possible;
- setup/doctor registries should be extensible;
- global/project/dev-checkout contexts should not conflict;
- CI should become part of setup confidence.

History keeps the old source trace. It is not the current authority for the living direction.

Several items that were open in that document have since been implemented or partially implemented. Do not copy its dated “not yet present” claims into current docs without checking code.

## 4. Architecture Shift

The packaging-distribution architecture stream reframed the area around:

- `fgctl` as machine/global bootstrap;
- project-local `fgos` as workflow authority;
- release tree identity through `artifactDigest`;
- workspace-local activation binding;
- stable `.fgos/installation/bin/` command surface;
- legacy Node payload as compatibility layer.

## 5. Supersession Guidance

Use old docs as source material, not final authority:

| Old source | Use |
| --- | --- |
| `docs/specs/distribution.md` | Extract implemented behavior and setup/doctor rules. |
| `docs/distribution-vision.md` | Historical source for `../vision.md`; preserve old context and supersession trail. |
| `docs/architect/packaging-distribution/**` | Promote architecture after implementation alignment is explicit. |

## 6. Do Not Lose

These old facts must stay traceable:

- setup/doctor default read-only versus fix behavior;
- global config and project config precedence;
- npm/Node compatibility;
- plugin/dev-skill distribution;
- package allowlist and end-user docs packaging;
- no lifecycle install script;
- dev checkout helper behavior;
- reason for moving from global PATH selection to workspace activation.
