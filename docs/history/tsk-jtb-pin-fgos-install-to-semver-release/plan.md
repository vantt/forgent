# Plan — tsk-jtb: Pin fgOS install to a semver release

Mode: **standard**

Flag count (per `fgos-routing`'s Mode-gate, applied directly — no lane was
handed off before this skill loaded, direct-entry fallback): **2 flags**
— `public contracts` (this changes the documented `## Install` command,
the first thing a new user runs) and `existing covered behavior`
(`test/install-packaging.test.mjs` already proves the current bare-`main`
install path end to end; this item must not silently break what that test
covers). No hard-gate flag applies (no auth/data-loss/audit-security/
external-provider/validation-removal). 2 flags → `standard` per the table.

## Approach

**Chosen path:** this item ships the *preparation* for pin-release, not
the act of cutting the first tag itself — per D1/D2 (`CONTEXT.md`),
tag-cutting and version-bumping are deliberately manual, repo-owner
judgment calls, not something this coding item automates or performs on
its own authority. What IS in scope, and fully specifiable now:

1. **A release runbook** (`docs/how-to/cut-a-fgos-release-tag.md`) — the
   manual steps D1/D2 describe (bump `package.json` version, commit, tag,
   push the tag), written down so the repo owner has a repeatable
   procedure instead of re-deriving it each time. This operationalizes
   D1/D2 without automating the judgment call itself.
2. **`README.md` `## Install`** — per D3, document BOTH paths: the
   tag-pinned command as the primary/recommended example, and the
   existing bare-`main` command kept as a clearly-labeled secondary
   "bleeding-edge" option. Since no tag exists yet at merge time, the
   tag-pinned example uses a placeholder (`vX.Y.Z`) with a one-line
   pointer to GitHub's releases/tags page, rather than a fake concrete
   version number that would be wrong the moment it's written.
3. **`docs/specs/distribution.md`** — surgical edit only, not a rewrite:
   the "Install" Behaviors section's existing sentence ("The install
   always resolves against the source repository's default branch — no
   tagged or pinned release exists yet") is now only half-true once this
   item ships a documented tag-pinned path — update that one sentence to
   describe both paths, matching README's own D3 wording, without
   touching any RUL numbering or the rest of the spec's structure.
4. **`CHANGELOG.md`** — one `### Added` line under `## [Unreleased]`, per
   `docs/how-to/add-a-changelog-entry-for-a-user-visible-change.md`'s own
   convention (this changes what a user sees in `## Install`).

**Rejected alternative:** cut a real first tag (e.g. `v0.1.0`) as part of
this item's own delivery, so the README's tag-pinned example could point
at something concrete immediately. Rejected because D1 explicitly reserves
*when* to cut a tag to the repo owner's own judgment — an agent unilaterally
deciding "now is the right moment" inside an `executing` item would
override that decision, not honor it. The repo owner cuts the first real
tag whenever they judge it's time, using the runbook this item ships.

**Order:** the runbook (1) has no dependency on the others and can be
written first; README (2) and the spec edit (3) both reference the runbook
by path, so they follow it; CHANGELOG (4) is always last, describing the
finished change. No `fgos graph --what-if` run — this is a single
non-split piece with a small, linearly-dependent file set, not a
multi-piece ordering decision.

**Impact-analysis posture:** `full` (gitnexus present, confirmed at
`fgos-coding-exploring`, `CONTEXT.md`). Informational only — every file
this item touches is documentation/config prose, not a code symbol, so no
blast-radius proof point applies.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `README.md` Install section keeps BOTH paths (D3) | Low — text-only, but a regression here would silently drop the bleeding-edge path D3 explicitly requires kept | Verify greps for both the tag-pinned example AND the existing bare-`main` command still being present |
| `docs/specs/distribution.md` edit | Low — single-sentence surgical edit, but must not silently invalidate the sentence's own surrounding claims (e.g. RUL2's "no registry publish" framing, which this item does not touch) | Verify greps that the edited sentence no longer asserts "no tagged or pinned release exists yet" as an unqualified fact, while the file's untouched RULs are unaffected by construction (no RUL text is touched by this item) |
| `test/install-packaging.test.mjs` (existing, untouched) | Low — this item's own D1-D4 don't change install *mechanics*, only documentation; the existing e2e test should need no change | Verify re-runs it unmodified — passing unchanged is itself part of the proof that D1-D4 didn't regress the mechanical install path |

## Verify

```
npm test \
  && grep -q 'github:vantt/forgent#v' README.md \
  && grep -q 'npm install -g github:vantt/forgent$' README.md \
  && grep -q 'cut-a-fgos-release-tag' README.md \
  && test -f docs/how-to/cut-a-fgos-release-tag.md \
  && grep -q '^type: how-to$' docs/how-to/cut-a-fgos-release-tag.md \
  && ! grep -q 'no tagged or pinned release exists yet' docs/specs/distribution.md \
  && grep -q 'Unreleased' CHANGELOG.md
```

## Split decision

No split. One coherent piece of documentation/process work: a new
how-to doc, a README edit, a spec-sentence edit, and a changelog line, all
serving the same D1-D4 decision set. `fgos-coding-validating` should read
this as `pass-through`.

## Outstanding questions

None
