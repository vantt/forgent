---
type: how-to
title: How to cut a fgOS release tag
tags: []
source_capture_ids: [tsk-jtb]
framework: diataxis
mode: how-to
---
# How to cut a fgOS release tag

Use this when you (the repo owner) have judged the current `main` stable
enough to become the next pinned release users install against.

## Before you start

This repo has a tag-triggered publish workflow, but it still does not
decide when a release should be cut. The repo owner deliberately prepares
release metadata, creates the tag, and pushes it; `.github/workflows/release.yml`
then builds assets, verifies the external-consumer install path, and
publishes the GitHub Release.

## Steps

1. **Confirm `main` is green.** Check the latest commit on `main` passed
   CI (`.github/workflows/ci.yml`'s `test` matrix job). Only tag a commit
   you've already seen pass there.

2. **Decide the version number.** Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
   bump the patch version for fixes, minor for backward-compatible
   features, major for a breaking change. Check `git tag` for the
   previous release tag, or `package.json`'s current `version` field if
   this is the first real release.

3. **Prepare the release metadata.** This updates `package.json`,
   `package-lock.json`, and `CHANGELOG.md`; it refuses a dirty working
   tree by default:

   ```bash
   npm run release:check -- vX.Y.Z
   npm run release:prepare -- vX.Y.Z
   ```

4. **Commit, tag, and push exactly what the script printed:**

   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore: prepare vX.Y.Z"
   git tag vX.Y.Z
   git push origin HEAD vX.Y.Z
   ```

5. **Watch the release workflow.** The `v*` tag push runs
   `.github/workflows/release.yml`, which validates the tag/package
   version match, builds `fgos-*` and `fgctl-*` tarballs, writes
   `SHA256SUMS`, runs `scripts/ci-external-consumer.sh --assets dist`, and
   publishes the GitHub Release.

## After you're done

`README.md`'s `## Install` section documents the tag-pinned command with
a placeholder version — update it to reference the new tag if you want
new installers to land on it by default, or leave it pointing at the
[releases/tags page](https://github.com/vantt/forgent/tags) so it never
goes stale between releases.

## Related

- `README.md` `## Install` — the tag-pinned install command this
  procedure feeds.
- `docs/specs/distribution.md` — the install mechanism spec (Install
  Behaviors section).
- `scripts/prepare-release.mjs` — the release metadata preparation script.
- `.github/workflows/release.yml` — the tag-triggered publish workflow.
