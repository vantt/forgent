# Mail baseline: deliver young addressed mail at first ingest

Change (apps/fgos/src/wiring/mailbox_ingest.rs): a record with `baselined == false` no longer refuses young mail as `before-first-sync`. Events older than MAX_AGE_SEC + CLOCK_SKEW_SEC (by event ts, new `within_age_window`) are skipped uncounted; the rest fall through the normal path (recipient filter, verify incl. signed sentAt/skew, body-ref, dedup in record.ingest). Baseline flag and per-origin cursor are set as before. `BEFORE_FIRST_SYNC` removed (nothing else produced it). remote.v1.json keeps the reason, meaning now says not produced by this build.

Tests: retired `mail_sent_before_the_receivers_first_sync_is_refused_to_its_sender_by_name`; now owned by `a_record_with_no_baseline_delivers_young_mail_addressed_to_it_once` (mailbox_routes.rs: delivered once, not twice after baseline reset, no before-first-sync refusal) plus unit `a_baseline_less_record_reads_only_events_inside_the_age_window` (age bound). Other-machine case: no e2e (needs a third machine); it stays the unchanged recipient filter below the baseline block.

Gates: mailbox_routes 47, mailbox_sync_child 2, wiring::mailbox 19, fgos-config, fgos-mailbox-core, fgos-mailbox all green first run; clippy -D warnings, fmt, msvc and aarch64-apple-darwin check clean (vendored arraydeque warnings only); census regenerated, 0 undeclared.

Note: a recreated record loses dedup history, so mail already delivered earlier and still under 24h old can be delivered again once.
