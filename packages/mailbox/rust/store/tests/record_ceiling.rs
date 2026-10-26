//! The record at its contract ceiling (spec §14 V2 row, "the size
//! ceiling"): the shared sender's full ceiling population, with every
//! writer key at its maximum length, is installed and read back under the
//! write cap derived from the same contract, so one saturated sender is
//! never refused as full. When many heads fill the record, a send is
//! refused at the write cap and the record keeps draining. The header count itself is
//! owned by the core's `one_saturated_sender_stops_growing_at_the_derived_header_ceiling`.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_mailbox::record::{snapshot_read_cap, snapshot_write_cap, Reported, Wait};
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
        size <= snapshot_write_cap(&limits),
        "{size} > cap {}",
        snapshot_write_cap(&limits)
    );
    assert_eq!(rec::read_state(&record), built);
}

/// A hundred registered heads, each sending at its budget, fill the record:
/// a send that would take the snapshot past the write cap is refused as
/// `record-full` and changes nothing on disk, while drains, finishes and a
/// registration still write, and the snapshot stays under the read cap, so
/// the hook keeps draining.
#[test]
fn a_full_record_refuses_sends_and_keeps_draining() {
    let fgos = TempFgos::new("record-full");
    let record = fgos.record();
    let limits = common::limits();
    let write_cap = snapshot_write_cap(&limits) as usize;
    let long = |prefix: &str, i: usize| {
        let mut key = format!("{prefix}{i:03}-");
        let max = limits.frame.max_header_chars as usize;
        key.push_str(&"k".repeat(max - key.len()));
        key
    };
    let recipients = [long("r", 0), long("r", 1)];
    let heads: Vec<String> = (0..100).map(|i| long("h", i)).collect();
    let budget = limits.session.budget as usize;
    let step = limits.human.fallback_window_sec + 1;

    // Fill the record with core calls until the next head's window would
    // pass the write cap.
    let (names, now) = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            let names: Vec<String> = recipients
                .iter()
                .map(|r| rec::name_of(&rec::register(state, r, T0, &limits, ids)))
                .collect();
            for head in &heads {
                rec::register(state, head, T0, &limits, ids);
            }
            let mut now = T0;
            // What one head's window of sends adds: the larger of a floor
            // (two writer keys per send) and what the record actually grew
            // by, so the fill stops short of the cap however large a header
            // is.
            let mut window_growth = budget * 2 * limits.frame.max_header_chars as usize;
            let mut previous = None::<usize>;
            'fill: for window in 0..u64::from(limits.session.lifetime_cap) {
                now = T0.plus_secs(window * step);
                for head in &heads {
                    let size = serde_json::to_vec(&*state).unwrap().len();
                    if let Some(previous) = previous {
                        window_growth = window_growth.max(size.saturating_sub(previous));
                    }
                    previous = Some(size);
                    if size + window_growth > write_cap {
                        break 'fill;
                    }
                    for i in 0..budget {
                        state
                            .send(rec::send_req(head, &names[i % 2], "m"), now, &limits, ids)
                            .unwrap();
                    }
                    for r in &recipients {
                        let claim = state.claim(
                            &rec::key(r),
                            Generation::FIRST,
                            Checkpoint::Step,
                            now,
                            &limits,
                            ids,
                        );
                        if let Some(token) = claim.token {
                            state.finish(&rec::key(r), Generation::FIRST, &token, now);
                        }
                    }
                }
            }
            Reported::changing((names, now))
        })
        .unwrap()
        .value
        .value;

    // Sends through the record until one is refused as full.
    let sender = &heads[heads.len() - 1];
    let later = now.plus_secs(step);
    let mut accepted = 0;
    let refused = loop {
        let before = std::fs::read(fgos.paths().snapshot()).unwrap();
        match record.send(
            rec::send_req(sender, &names[accepted % 2], "m"),
            Wait::Try,
            later,
            &limits,
        ) {
            Ok(held) => {
                held.value.unwrap();
                accepted += 1;
                assert!(accepted < budget, "the write cap never refused a send");
            }
            Err(err) => break (err, before),
        }
    };
    let (err, before) = refused;
    assert_eq!(err.code(), "record-full");
    assert_eq!(
        std::fs::read(fgos.paths().snapshot()).unwrap(),
        before,
        "a full send wrote"
    );

    // The hook keeps draining: claims and finishes write, a registration
    // writes, and the snapshot stays readable.
    for r in &recipients {
        let claim = record
            .hold(Wait::Try, later, &limits, |state, ids| {
                state.claim(
                    &rec::key(r),
                    Generation::FIRST,
                    Checkpoint::Step,
                    later,
                    &limits,
                    ids,
                )
            })
            .unwrap();
        assert!(claim.wrote, "a drain of a full record wrote nothing");
        let token = claim.value.token.unwrap();
        let finished = record
            .hold(Wait::Try, later, &limits, |state, _| {
                state.finish(&rec::key(r), Generation::FIRST, &token, later)
            })
            .unwrap();
        assert!(finished.wrote);
    }
    let registered = record
        .hold(Wait::Try, later, &limits, |state, ids| {
            rec::register(state, "a-new-head", later, &limits, ids)
        })
        .unwrap();
    assert!(registered.wrote);
    let size = std::fs::metadata(fgos.paths().snapshot()).unwrap().len();
    assert!(
        size > write_cap as u64,
        "the drains grew the record past the write cap"
    );
    assert!(size <= snapshot_read_cap(&limits));
    rec::read_state(&record);
}
