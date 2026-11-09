---
phase: 07
title: "First-contact docs: README promise and three-command quick start, Node note, the npm channel retired (H14), docs agree with the code"
status: pending
depends_on: ["P04, P06, P08, P10 landed (the text must match what the tools print)"]
parallel: "group G5 with P12"
effort: ~0.5d
net_size: "docs about -5 net (npm sections about -20, new lines about +15); Node about +2 (one message)"
---

# Phase 07 - First-contact docs and the npm channel (F16, F17, H14)

## Context

ONB-06, ONB-08, ONB-12, NODE-02 (and ONB-01/04/07 partials). `README.md:20-29` is a 4-command path with `fgos setup` and a tag typed twice; no promise line; Node >= 18 is required (`requires.node`, `scripts/build-rust-distribution.mjs:472` `[AUDIT]`; `init.rs:371`) and never stated. `README.md:102-122` still advertises `npm install -g github:vantt/forgent` and a bleeding-edge form, after spec section 3's window ended 2026-10-18; owner H14 (HARDEN plan, line 316) already decided to retire the channel formally. On that channel the Node CLI answers `fgos: "config" chỉ có ở Rust host` (`bin/fgos.mjs:5216`) and doctor reports `git-addon-unavailable` (`src/native/door.mjs:14`). `README.md:157` and `spec.md` say doctor exits 0 whatever the checks say; `spec.md:62` recommends the raw `main` install.sh; README and the `setup` text say `doctor --fix` does not wire hooks, which the live run contradicts.

## Requirements

1. README first screen: tagline unchanged (the owner's wording), then the promise: "From nothing to your first agent run in about 3 minutes. You need Node >= 18, git, curl and one agent CLI (claude, codex or omp)." Quick start is exactly: the one-line install, `fgctl init`, `fgos run "<prompt>"`, each with one sentence on what it achieves; the tag appears once.
2. Remove the npm and bleeding-edge sections and the `fgos setup` step; the doctor section describes `ok` and `next` and states, true to Q-B, the exit-code rule.
3. `bin/fgos.mjs:5216`: English message that names the supported install (`fgctl init` from a release) instead of Vietnamese text. The doctor message that names the npm channel (`registrations.mjs:371` region, step 1 greps `rg "github:vantt/forgent" src bin`) points to the same install. A call-site edit only; no logic.
4. `spec.md` section 3.1 line 62 uses the release URL; section 3.2 states the channel is retired; section 6 states `fgctl init` wires hooks. `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` agrees. Decision-history text is P13's.
5. Every code block in the README is run once by hand in scratch HOME and pasted into the phase report (the CI extraction is an Owner idea, ONB-09).

## Files

**Modify:** `README.md`, `docs/platform/packaging-distribution/spec.md` (sections 3 and 6 only), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `bin/fgos.mjs` (one message), `src/setup/registrations.mjs` (one message, after P10), `CHANGELOG.md`.
**Create:** none. **Delete:** README npm and bleeding-edge sections; `README.md` text about `fgos setup`.
**Tests to retire:** any docs test that asserts the npm section (step 1 greps `rg "npm install -g github" test`).

## Red tests first

If a docs-lint test exists for README commands (`test/docs/`), extend it: the README's quick start names `fgctl init` and not `fgos setup`. Otherwise the by-hand run is the proof.

## Net size

About -5 docs net; Node +2.

## Steps

1. Read README and spec sections; collect every claim about exit codes and setup. 2. Edit docs. 3. Message edits. 4. Hand-run the quick start; paste.

## Validation

`fgos doc-health` or the repo's doc check (`scripts/doc-health.mjs`), link check on touched docs; the hand run.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Docs describe behaviour of a phase that has not landed | Med x Med | depends_on above; the lead reads the landed tools' real output |
| README edits collide with the DOC lane | Low x Low | message the DOC lead with paths before merging |

## Rollback

Revert the merge.

## Closes

ONB-06; ONB-08, ONB-12 (README half); NODE-02; INS-01 partial (spec line 62); the F17 doc drifts.
