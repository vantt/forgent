---
type: explanation
title: Why fgOS install is pinned to a semver tag instead of main HEAD
tags: [distribution, semver, release, install]
source_capture_ids: [tsk-jtb]
authoritative_for: why fgOS install moved from always pulling main HEAD to a tag-pinned semver release, and how tags get cut
---
# Why fgOS install is pinned to a semver tag instead of `main` HEAD

`tsk-jtb`. Before this item, `npm install -g github:vantt/forgent`
carried no ref at all, so it always installed the latest commit on
`main` (`docs/specs/distribution.md`'s own words: "no tagged or pinned
release exists yet") — `package.json`'s `version` had sat at `0.1.0`
since the start, and the only existing git tag (`pre-tsk-3ce`) had
nothing to do with a real release. Any broken commit that slipped past
review on `main` propagated immediately to every project installing
fgOS, with no rollback path short of manually uninstalling and
reinstalling — the suspected root cause behind reports that other
projects installing fgOS were seeing unstable behavior.

## The decisions, matched to the project's actual maturity

- **D1** — tag-cutting is a manual, repo-owner judgment call. No
  automated trigger on every merge or a schedule — there is no dedicated
  release manager, and `ci.yml` has zero existing tag/release triggers to
  build on.
- **D2** — `package.json`'s `version` is bumped manually, in the *same*
  commit that gets tagged, not a separate release-prep commit and not
  CI-automated — the simplest shape consistent with a manual process,
  nothing to keep synced across two commits.
- **D3** — `README.md`'s `## Install` section documents **both** paths
  after this lands: the tag-pinned command as the primary/default
  recommendation, and the bare `main`-HEAD command kept as a clearly
  labeled secondary option for contributors/early-adopters who
  deliberately want bleeding-edge. Neither path is removed.
- **D4** — no new CI job gates tag-cutting. `main`'s existing
  push-triggered CI (full OS matrix + `npm test`) already proves any
  commit before it could be tagged; a person manually cutting a tag is
  expected to only tag a commit they've already seen pass CI —  a second
  automated check would duplicate that proof rather than add real new
  coverage.
