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

This repo has no automated release process by design (tsk-jtb D1/D2): no
scheduled cadence, no per-merge auto-tag, no CI job that cuts a tag for
you. Cutting a tag is always a deliberate, manual act — this doc is the
repeatable procedure for that act, not an automation to trigger.

There is no existing precedent to follow either: before this doc, the
repo had exactly one tag (`pre-tsk-3ce`, unrelated to a release) and
`package.json`'s `version` had never moved past its bootstrap value.

## Steps

1. **Confirm `main` is green.** Check the latest commit on `main` passed
   CI (`.github/workflows/ci.yml`'s `test` matrix job). This repo
   deliberately has no tag-triggered CI job of its own (`docs/history/
   tsk-jtb-pin-fgos-install-to-semver-release/CONTEXT.md` D4) — the
   push-triggered run on `main` is the only proof required, so only tag a
   commit you've already seen pass there.

2. **Decide the version number.** Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
   bump the patch version for fixes, minor for backward-compatible
   features, major for a breaking change. Check `git tag` for the
   previous release tag, or `package.json`'s current `version` field if
   this is the first real release.

3. **Bump `package.json`'s `version` field**, in the same commit that
   gets tagged (D2) — not a separate release-prep commit:

   ```bash
   git commit -am "chore: bump version to vX.Y.Z"
   ```

4. **Tag that commit and push the tag:**

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

5. **Move `CHANGELOG.md`'s `## [Unreleased]` entries** into a new
   `## [vX.Y.Z]` heading, dated today — the one step
   `docs/how-to/add-a-changelog-entry-for-a-user-visible-change.md`
   explicitly leaves out of scope for a routine entry, and the step that
   belongs here instead.

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
- `docs/how-to/add-a-changelog-entry-for-a-user-visible-change.md` — the
  routine per-change entry this procedure's step 5 finalizes into a
  version heading.
