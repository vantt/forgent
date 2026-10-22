//! The per-identity header ceiling (spec §14 V2 row, "the size ceiling"):
//! the shared sender with no head, the one identity no lifetime cap brakes
//! (owner decision Q3), stops growing at a ceiling derived from the limits
//! contract alone. That refused sends never grow the snapshot is owned by
//! the core's bounded-counter test, not repeated here.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_mailbox::record::{Reported, Wait};
use fgos_mailbox_core::{Checkpoint, Generation, Limits};

/// `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)`: how long
/// a settled header is kept.
fn header_horizon(limits: &Limits) -> u64 {
    limits
        .loop_guard
        .window_sec
        .max(limits.record.ttl_sec)
        .max(limits.record.body_retention_sec)
}

/// `session.budget x ceil(K / human.fallbackWindowSec) + session.budget`.
fn sender_ceiling(limits: &Limits) -> usize {
    let budget = limits.session.budget as usize;
    let windows = header_horizon(limits).div_ceil(limits.human.fallback_window_sec) as usize;
    budget * windows + budget
}

#[test]
fn one_saturated_sender_stops_growing_at_the_derived_header_ceiling() {
    let fgos = TempFgos::new("ceiling");
    let record = fgos.record();
    let limits = common::limits();
    let budget = limits.session.budget;
    // Two recipients alternately, so neither the loop guard nor the
    // sender's share of one queue refuses within a window.
    assert!(budget.div_ceil(2) < limits.loop_guard.max_per_window);
    assert!(budget.div_ceil(2) <= limits.queue.per_sender);
    // A window starts once the last one is fully past: both the budget and
    // the loop guard count an attempt until more than their window passed.
    assert_eq!(
        limits.loop_guard.window_sec,
        limits.human.fallback_window_sec
    );
    let step = limits.human.fallback_window_sec + 1;
    let windows = header_horizon(&limits).div_ceil(limits.human.fallback_window_sec) + 2;
    let ceiling = sender_ceiling(&limits);

    let held = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            let names = [
                rec::name_of(&rec::register(state, "recipient-one", T0, &limits, ids)),
                rec::name_of(&rec::register(state, "recipient-two", T0, &limits, ids)),
            ];
            let mut counts = Vec::new();
            for window in 0..windows {
                let now = T0.plus_secs(window * step);
                for i in 0..budget as usize {
                    state
                        .send(
                            rec::send_req("cli-sender", &names[i % 2], "m"),
                            now,
                            &limits,
                            ids,
                        )
                        .unwrap();
                }
                for recipient in ["recipient-one", "recipient-two"] {
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
                counts.push(state.messages().count());
            }
            Reported::changing((counts, state.clone()))
        })
        .unwrap();
    let (counts, built) = held.value.value;

    let most = *counts.iter().max().unwrap();
    assert!(most <= ceiling, "{most} headers > ceiling {ceiling}");
    let last = &counts[counts.len() - 2..];
    assert_eq!(last[0], last[1], "not steady at the end: {last:?}");
    assert_eq!(rec::read_state(&record), built);
}
