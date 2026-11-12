# HARDEN lessons fold: release gate (2026-11-12)

Ledger: `plans/261021-1118-harden-low-layers-bottom-up/lessons.md`. Sources: the release gate notes of the big lead, the `## Lessons` sections of every `lead-261112-*harden*` report, and the seven gate lessons passed in the brief.

## New HL rules (HL-21 to HL-28)

- HL-21 MUST: CI on the candidate commit before any tag; reproduce the clean runner before pushing a CI fix (rc.6 tagged on a red main, 54+ red runs).
- HL-22 MUST: one internal path spelling, convert only at exits, source-scan guard over every exit file.
- HL-23 MUST: clear known reds at once or ask the owner the same day.
- HL-24 SHOULD: read the real code and result before scoping from phase wording.
- HL-25 SHOULD: when a rule applies to every caller, fix fixtures, not the rule; no hedging fixtures.
- HL-26 SHOULD: prove install, upgrade, rollback and first-contact paths live from the real previous asset.
- HL-27 SHOULD: bounded wait instead of a fixed sleep; failed steps report exit code, signal, stderr.
- HL-28 SHOULD: path-removal tests put a link above the leaf.

## New OL rules (OL-25 to OL-29)

OL-25 no `git stash` (rule at the top of the brief), OL-26 stale release binaries under focused runs, OL-27 shared CI runner cycles, OL-28 scratch HOME fixtures, OL-29 shell and tooling traps.

## Merged into existing rows

HL-02 (delete stop-gaps with fixtures, move rules with their tests), HL-03 (widen the one reader, grep readers' use), HL-05 (read layer guards and tiers first), HL-08 (red inside the full lib run for a process-wide `OnceLock`; run each new test against a stub first), HL-12 (interleave, quote quiet baseline), HL-16 (size tests at 1.5 to 2 times the code; +700 to +900 estimated, +5 900 real), OL-07 (census order, no amend after refusal), OL-12 (review relay and timing), OL-16 (no edits during a full suite, rebase first, background start), OL-19 (pkill self-match, done marker), OL-24 (scout hook words).

Section 6 (brief rules), Q-07 and Sources are updated.

Status: DONE
Summary: 8 new HL rules, 5 new OL rules and 12 merges added to the ledger.
