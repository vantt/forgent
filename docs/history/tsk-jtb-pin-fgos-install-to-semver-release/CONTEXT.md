# tsk-jtb — Pin fgOS install to a semver release

**Stage:** exploring (fgos-coding-exploring). **Date:** 2026-08-13.

## Feature boundary

Give fgOS a real release process — semver tags cut on `main`, with
`package.json`'s `version` field bumped to match — and re-point the
README's `## Install` instructions at that tag instead of always
resolving to whatever commit is currently on `main`. This closes the
biggest single risk identified in a review of fgOS's install/setup
reliability (`docs/specs/distribution.md`'s own admission: "no tagged or
pinned release exists yet"): a broken commit on `main` today breaks every
downstream project's install simultaneously, with no way to pin to a
known-good version and no way to roll back short of a manual
uninstall/reinstall.

Scope is deliberately narrow: release **process** + `package.json` +
`README.md` + (per D4 below) no CI change. It does not touch runtime logic
in `bin/`/`src/` at all.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Tag-cut criteria is manual, at the repo owner's own judgment — no automated trigger (not every merge, not scheduled). Matches the project's current maturity: no dedicated release manager, no existing automation anywhere in `.github/` to build on (RESEARCH.md Round 1 confirmed `ci.yml` has zero tag/release triggers). |
| D2 | `package.json`'s `version` field is bumped manually, in the SAME commit that gets tagged — not a separate release-prep commit, not CI-automated. Simplest shape consistent with D1's manual process; nothing to keep in sync across two commits. |
| D3 | `README.md`'s `## Install` section, after this lands, documents BOTH install paths: the tag-pinned command as the primary/default recommendation (what most users should use), and the bare `main`-HEAD command kept as a clearly-labeled secondary option for contributors/early-adopters who deliberately want bleeding-edge. Neither path is removed. |
| D4 | No new CI job gates tag-cutting. `main`'s own existing push-triggered CI (`.github/workflows/ci.yml`, full OS matrix + `npm test`) already proves any commit before it could be tagged — a person manually cutting a tag (per D1) is expected to only tag a commit they've already seen pass CI on `main`, so a second automated check would duplicate that proof rather than add new coverage. |

## Pinned terms

- **"pin release"** — the install command resolves to a fixed, tagged
  commit (`github:vantt/forgent#v0.2.0` or `#semver:^0.2.0`), not the
  moving `main` branch HEAD.
- **"tag-pinned" vs "main-HEAD" install path** — the two README-documented
  commands per D3: the former points at the latest cut tag (or a semver
  range), the latter has no ref qualifier and always resolves to whatever
  commit is currently on `main`.

## Scout evidence

`docs/history/tsk-jtb-pin-fgos-install-to-semver-release/RESEARCH.md`
Round 1 (2026-08-13):

- `.github/workflows/ci.yml` — only `push: branches: [main]` and
  `pull_request: branches: [main]` triggers exist; no tag trigger, no
  release/publish job.
- `package.json` — `"private": true` (blocks accidental npm-registry
  publish, consistent with `docs/specs/distribution.md` RUL2), no
  version/release/publish script in `scripts{}`.
- `git tag` — exactly one tag, `pre-tsk-3ce`, unrelated to a release;
  confirms no semver-tagged release has ever been cut.
- `README.md:11-21` `## Install` — currently just
  `npm install -g github:vantt/forgent`, no ref qualifier.

**Impact-analysis posture:** `full` (gitnexus present,
`fgos tool query --capability impact-analysis --status present`,
2026-08-13). Informational only here — this item's scope (release
process, `package.json`, `README.md`) touches no code symbol, so no
blast-radius proof point is needed for `fgos-coding-planning`'s own risk
map.

## Canonical references

- `docs/specs/distribution.md` — the install spec this item's D3 extends
  (currently documents only the bare `main`-HEAD command).
- `docs/distribution-vision.md` §3 — the vision doc's own note that no
  tagged/pinned release exists yet, the root finding this item addresses.

## Outstanding questions

None
