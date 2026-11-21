---
id: p-vp347fcigr
title: "The lock-status report is unproven on Windows: 5 of its unit tests fail there (holder-lock, priority medium; source: lead:WINCUSTODY, 2026-11-21 21:20)"
status: proposed
priority: P2
area: holder-lock
created: 2026-11-21
---

# Why

The unit tests in `packages/holder-lock/rust/src/status.rs` had never run on Windows. In run 44912432016 (`cargo test -p fgos-holder-lock --lib`) five fail: `a_beacon_that_cannot_be_read_fails_the_report` (expects EACCES), `a_machine_row_resolves_under_the_lock_root_and_a_provider_account_nests_two_levels` (asserts a path suffix with `/`), `a_parametric_row_lists_the_files_its_template_matches_and_judges_each_by_its_holders` (Windows answers holder "unknown" where the test expects "free"), `a_predecessor_record_that_is_absent_unreadable_unknown_or_names_a_dead_domain_needs_no_person_only_the_rest_do` (expects EISDIR) and `the_answer_has_the_keys_and_order_the_node_report_printed`. The fixtures assume Unix, and nobody has checked whether `fgos lock-status` itself answers right on Windows; the "unknown" holder may be a real product gap. The Windows custody job runs only the tombstone and quiesce-scan unit tests for now (`--lib -- tombstone quiesce`).

# Done when

`fgos lock-status` gives the right answer on Windows, the five tests hold on Windows without Unix-only assumptions, and the Windows job runs the whole `fgos-holder-lock --lib` suite.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
