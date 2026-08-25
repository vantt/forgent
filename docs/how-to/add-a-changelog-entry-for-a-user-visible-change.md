---
type: how-to
title: How to add a CHANGELOG.md entry for a user-visible change
tags: []
source_capture_ids: [tsk-469, tsk-3ip]
---
# How to add a CHANGELOG.md entry for a user-visible change

Use this when you've just made a change to fgOS and need to decide
whether — and how — to record it in `CHANGELOG.md`.

## Before you start

`CHANGELOG.md` was bootstrapped at the repo root (`tsk-469`) because an
install/setup/config/doctor audit on 2026-08-07 found the repo had none,
despite `package.json` sitting frozen at `0.1.0` through dozens of merged
features. Real public surface already existed at that point — a 49-verb
CLI, two bin entries (`fgos`, `fgos-runner`), and users installing
straight off `HEAD` via `npm install -g github:vantt/forgent` with no
version pin — so SemVer was, at that point, a documentation discipline
this repo owed its users, not yet a mechanism.

This bootstrap is manual only — no automation reads or writes the file
for you. A separate, parallel effort tracks how often the manual step
gets forgotten; it does not replace the step itself.

## Steps

1. **Decide if your change is user-visible.** This is already a
   standing gate in `AGENTS.md`'s "Install/setup/doctor gate" section:

   > Does this change something a user of fgOS would see? If yes, add a
   > line to `## [Unreleased]` in `CHANGELOG.md`.

   If the change is purely internal (refactor, internal test, a doc that
   doesn't describe user-facing behavior), skip the changelog — do not
   pad the file with items that don't affect anyone outside the repo.

2. **Open `CHANGELOG.md`** at the repo root. It follows
   [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
   [Semantic Versioning](https://semver.org/spec/v2.0.0.html), stated in
   the file's own header.

3. **Add your line under `## [Unreleased]`**, in the matching
   subsection — `### Added`, `### Changed`, `### Fixed`, or
   `### Removed`. Match the style already there: a short user-facing
   description of the behavior change, not an internal implementation
   narration. For example, an existing `### Changed` entry reads:

   > `/fgOS:submit` run from a live session now continues into the
   > item's `discovery` stage in the same session: it clarifies the
   > title/description first, then judges `tier`/`kind`/`risk` against
   > the cleaned-up text instead of the raw ask.

4. **Never touch the `## [Unreleased]` heading string itself.** It must
   read exactly `## [Unreleased]` — square brackets included, matching
   Keep a Changelog's own convention exactly. A separate, parallel
   tracking mechanism parses this exact string; one changed character
   silently breaks that check.

5. **Do not bump the version or cut a release.** Moving entries out of
   `## [Unreleased]` into a new version heading (e.g. `## [0.2.0]`) is a
   separate, manual release-cut step, out of scope for adding an entry.

## How you'll be reminded if you forget

Nothing blocks a merge for a missing changelog entry, and nothing decides
*for* you whether a change deserved one — but a real observe/remind
mechanism now exists so a forgotten entry doesn't go unnoticed forever:

- **`fgos doctor`** runs a `changelog-unreleased-stale` check: passes
  when `## [Unreleased]` has at least one real `- ` bullet, and when
  `CHANGELOG.md` doesn't exist at all (a project that hasn't adopted a
  changelog yet is a normal state, never an error). It fails — reminder
  only — when the section is present but empty:

  > "## [Unreleased] has no pending entries -- reminder only: add a line
  > here when your next user-visible change merges (never blocks merge)"
  > — real check message, `changelog-unreleased-stale`,
  > `src/setup/registrations.mjs`

- **`fgos check`** surfaces the same read as a `changelogNag` field
  (`{fileExists, hasEntries, deliveredCount}`), and appends one data
  point per check run to `.fgos/logs/changelog-nag-history.jsonl` — a real,
  accumulating counter, not a per-merge popup. At roughly 25 items
  reaching `delivered` per day (measured against `.fgos/events.jsonl`,
  2026-08-01 through 2026-08-08), a nag that fired per merge would be
  ~176 interruptions a week; this mechanism deliberately counts instead
  of nagging on every single merge.

This mechanism is structural only: it checks for the presence of a
bullet line, never whether a given change actually deserved one, never
writes the entry's content, and never blocks anything. Judging
changelog-worthiness and generating entry text both stay explicitly
undecided, tracked separately from this observe/remind step.

## What's out of scope here

- **Backfilling history.** The `## [0.1.0]` baseline entry lists the
  public surface as of the bootstrap date (the CLI's 49 verbs, the two
  bin entries, the install/setup/doctor/uninstall story) — it
  deliberately does not enumerate the individual merged items behind
  that surface.
- **Automating the decision or the write.** Whether a change is
  changelog-worthy, and actually writing the line, stays a human
  judgment call for now — this bootstrap only gives that judgment a
  place to land and a gate that asks the question.

## Related

- `AGENTS.md` — "Install/setup/doctor gate" section, where the
  changelog question lives.
- `docs/history/automated-changelog-compound-learn/DISCUSSION.md` — the
  fuller decision record (D-tsk12m-A/B/C) behind this bootstrap and the
  staged roadmap it's step one of.
