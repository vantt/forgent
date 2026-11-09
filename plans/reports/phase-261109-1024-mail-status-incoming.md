# mail status shows incoming mail

- `status` (apps/fgos/src/wiring/mailbox_verbs.rs `incoming_summary`) reads the snapshot unlocked (`Record::read_existing`) and lists the caller's pending messages through `MailboxState::inbox`, the same read `inbox` uses. Notices excluded. Sender label, age, crossed-machine (header origin). Cap 5 then "and N more". No bodies. Nothing written or offered. Zero pending or no address: no output, no `incoming` key.
- Proof: extended `mailbox_list_and_status_run_natively_read_the_record_and_create_nothing` (sender+age shown, body absent, following `inbox` still lists it as recorded). Cross-machine flag has no new wiring proof (needs the two-machine fixture); it comes from `Header.origin`.
- mailbox_routes: 46/47 pass; `a_send_racing_a_hook...` failed once and in one of 3 reruns, passes on a clean tree and on reruns (lock-timing, does not call status). `mailbox_identity` omp test failed (known flake, not touched). Clippy -D warnings clean, fmt clean.
- Spec section 9 / verbs table says nothing against it; spec not edited.
