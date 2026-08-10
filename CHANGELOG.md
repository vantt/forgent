# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Work-item `kind` and `risk` now have a per-domain vocabulary, declared by
  the domain itself (`DOMAINS.<domain>.classification`) and enforced at the
  write door alongside the existing `tier` enum. Coding declares
  `kind: bug|chore|design|docs|feature|task` and
  `risk: light|standard|heavy`. A domain that declares no vocabulary is
  unaffected — any non-empty string still passes, exactly as before.

### Changed

- `/fgOS:submit` run from a live session now continues into the item's
  `discovery` stage in the same session: it clarifies the title/description
  first, then judges `tier`/`kind`/`risk` against the cleaned-up text
  instead of the raw ask. Any question it needs to ask is asked while you
  are still in the conversation, rather than days later at a discovery
  sweep. The `fgos submit` verb itself is unchanged — still mechanical,
  still no model call — so a bare shell, cron, another agent, or the
  dogfood fixture replay all behave exactly as before.

### Fixed

- Items could be stored with a `risk` value nothing in the system reads
  (`low`/`medium`/`high`), which silently disabled two behaviors rather
  than failing: the human-confirmation gate that fires before a
  `risk: heavy` root is split, and the risk discount in the priority
  formula (which fell back to its `standard` weighting). Such a value is
  now rejected when written. Items already stored with one keep replaying
  and stay editable; only a write that actually touches the field is held
  to the vocabulary.

- Merging could fail for reasons that had nothing to do with the work being
  merged. The event-log concurrency test queued 800 serialized lock
  acquisitions against a 2s per-acquisition budget, so under the load of a
  full test run it could exceed that budget and fail — and because that run
  is what `fgos approve`/`fgos return` use to verify a merge, the merge was
  rolled back and an innocent item was parked in `blocked`. Observed three
  times in one day on two unrelated items. The test now queues an amount
  the budget was actually documented for, and still fails loudly if the
  append lock itself regresses.

### Removed

- The standalone `fgos-submit-assist` skill. Its own steps had no reason
  left to exist on their own: title derivation always lived in the
  `submit` verb itself, and its tier/kind/risk classification is now done
  automatically — on cleaner, post-clarify text — by `/fgOS:submit`'s own
  step 6 for any live session. Use `/fgOS:submit` directly; it now does
  strictly more than this skill did.

## [0.1.0]

Baseline snapshot of the public surface as of this entry.

### Added

- `fgos` CLI with 49 verbs covering the work-item lifecycle (submit,
  clarify/decompose/execute, review/merge, and maintenance operations).
- `fgos-runner` bin entry for the automated runner loop.
- Install/setup/doctor/uninstall story: `fgos setup` (global/project config
  merge), `fgos doctor` (check registry), and their uninstall counterpart.
