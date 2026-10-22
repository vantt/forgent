//! The record at its contract ceiling (spec §14 V2 row, "the size
//! ceiling"): the shared sender's full ceiling population, with every
//! writer key at its maximum length, is installed and read back under the
//! snapshot cap derived from the same contract. The header count itself is
//! owned by the core's `one_saturated_sender_stops_growing_at_the_derived_header_ceiling`.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_mailbox::record::{snapshot_byte_cap, Reported, Wait};
use fgos_mailbox_core::{Checkpoint, Generation};

#[test]
fn the_shared_senders_full_ceiling_population_reads_under_the_snapshot_cap() {
    let fgos = TempFgos::new("ceiling");
    let record = fgos.record();
    let limits = common::limits();
    let long = |first: char| {
        let mut key = first.to_string();
        key.push_str(&"k".repeat(limits.frame.max_header_chars as usize - 1));
        key
    };
    let (one, two, sender) = (long('a'), long('b'), long('s'));
    let step = limits.human.fallback_window_sec + 1;
    let windows = limits
        .header_horizon_sec()
        .div_ceil(limits.human.fallback_window_sec)
        + 2;

    let built = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            let names = [
                rec::name_of(&rec::register(state, &one, T0, &limits, ids)),
                rec::name_of(&rec::register(state, &two, T0, &limits, ids)),
            ];
            for window in 0..windows {
                let now = T0.plus_secs(window * step);
                for i in 0..limits.session.budget as usize {
                    state
                        .send(
                            rec::send_req(&sender, &names[i % 2], "m"),
                            now,
                            &limits,
                            ids,
                        )
                        .unwrap();
                }
                for recipient in [&one, &two] {
                    let claim = state.claim(
                        &rec::key(recipient),
                        Generation::FIRST,
                        Checkpoint::Step,
                        now,
                        &limits,
                        ids,
                    );
                    state.finish(
                        &rec::key(recipient),
                        Generation::FIRST,
                        &claim.token.unwrap(),
                        now,
                    );
                }
            }
            Reported::changing(state.clone())
        })
        .unwrap()
        .value
        .value;

    assert_eq!(
        built.messages().count() as u64,
        limits.sender_header_ceiling(),
        "the population is the full ceiling's steady state"
    );
    let size = std::fs::metadata(fgos.paths().snapshot()).unwrap().len();
    assert!(
        size <= snapshot_byte_cap(&limits),
        "{size} > cap {}",
        snapshot_byte_cap(&limits)
    );
    assert_eq!(rec::read_state(&record), built);
}
