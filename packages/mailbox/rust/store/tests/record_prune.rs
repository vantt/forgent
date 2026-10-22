//! Retiring dead bindings (owner decision Q2, spec §17): a binding is
//! forgotten only when the store judges its head `Dead`, it has been idle
//! past `record.ttlSec`, and no header or notice names it; only a hold that
//! writes anyway prunes. A send never resolves a name to a binding the
//! store judges dead (Q2 option B). Every head here is a real process's
//! record.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_mailbox::record::{Record, Reported, Wait};
use fgos_mailbox_core::{Checkpoint, Generation, Limits, Refusal, Registered, Timestamp};

const DEAD: &str = "dead-head";

/// Registers `DEAD` with the record of a process that has exited, and
/// returns its name.
fn dead_binding(record: &Record, limits: &Limits) -> String {
    let dead = rec::dead_head_record();
    record
        .hold(Wait::Try, T0, limits, |state, ids| {
            Reported::changing(rec::name_of(
                &state
                    .register(rec::register_request(DEAD, &dead), None, T0, limits, ids)
                    .unwrap(),
            ))
        })
        .unwrap()
        .value
        .value
}

/// A hold that writes: another head registers at `now`.
fn writing_hold(record: &Record, writer: &str, now: Timestamp, limits: &Limits) {
    let held = record
        .hold(Wait::Try, now, limits, |state, ids| {
            rec::register(state, writer, now, limits, ids)
        })
        .unwrap();
    assert!(held.wrote);
}

fn has_binding(record: &Record, writer: &str) -> bool {
    rec::read_state(record).binding(&rec::key(writer)).is_some()
}

#[test]
fn a_dead_idle_binding_that_nothing_names_is_forgotten_by_the_next_writing_hold() {
    let fgos = TempFgos::new("prune");
    let record = fgos.record();
    let limits = common::limits();
    dead_binding(&record, &limits);
    let later = T0.plus_secs(limits.record.ttl_sec + 1);

    writing_hold(&record, "other", later, &limits);

    assert!(!has_binding(&record, DEAD));
    let again = record
        .hold(Wait::Try, later, &limits, |state, ids| {
            state.register(
                rec::register_request(DEAD, &rec::own_head_record()),
                None,
                later,
                &limits,
                ids,
            )
        })
        .unwrap()
        .value
        .unwrap();
    assert!(
        matches!(again, Registered::Created { generation, .. } if generation == Generation::FIRST),
        "{again:?}"
    );
}

#[test]
fn a_live_binding_is_never_pruned_however_idle() {
    let fgos = TempFgos::new("prune-live");
    let record = fgos.record();
    let limits = common::limits();
    let own = rec::own_head_record();
    record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            state
                .register(
                    rec::register_request("live-head", &own),
                    None,
                    T0,
                    &limits,
                    ids,
                )
                .unwrap()
        })
        .unwrap();

    writing_hold(
        &record,
        "other",
        T0.plus_secs(10 * limits.record.ttl_sec),
        &limits,
    );

    assert!(has_binding(&record, "live-head"));
}

#[test]
fn a_dead_binding_still_named_by_a_header_is_kept_until_the_header_retires() {
    let fgos = TempFgos::new("prune-named");
    let record = fgos.record();
    let limits = common::limits();
    dead_binding(&record, &limits);
    let peer = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            Reported::changing(rec::name_of(
                &state
                    .register(
                        rec::register_request("peer", &rec::own_head_record()),
                        None,
                        T0,
                        &limits,
                        ids,
                    )
                    .unwrap(),
            ))
        })
        .unwrap()
        .value
        .value;
    // The dead head's last message, sent while it lived, delivered.
    record
        .send(
            rec::send_req(DEAD, &peer, "my last words"),
            Wait::Try,
            T0,
            &limits,
        )
        .unwrap()
        .value
        .unwrap();
    record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            let claim = state.claim(
                &rec::key("peer"),
                Generation::FIRST,
                Checkpoint::Step,
                T0,
                &limits,
                ids,
            );
            state.finish(
                &rec::key("peer"),
                Generation::FIRST,
                &claim.token.unwrap(),
                T0,
            )
        })
        .unwrap();

    writing_hold(
        &record,
        "other",
        T0.plus_secs(limits.record.ttl_sec + 1),
        &limits,
    );
    assert!(has_binding(&record, DEAD), "a header still names it");

    let horizon = limits
        .loop_guard
        .window_sec
        .max(limits.record.ttl_sec)
        .max(limits.record.body_retention_sec);
    writing_hold(&record, "another", T0.plus_secs(horizon + 1), &limits);
    assert!(!has_binding(&record, DEAD));
}

#[test]
fn a_dead_binding_not_yet_idle_is_kept() {
    let fgos = TempFgos::new("prune-recent");
    let record = fgos.record();
    let limits = common::limits();
    dead_binding(&record, &limits);

    writing_hold(
        &record,
        "other",
        T0.plus_secs(limits.record.ttl_sec),
        &limits,
    );

    assert!(has_binding(&record, DEAD));
}

#[test]
fn a_hold_that_writes_nothing_prunes_nothing() {
    let fgos = TempFgos::new("prune-read");
    let record = fgos.record();
    let limits = common::limits();
    dead_binding(&record, &limits);
    let before = std::fs::read(fgos.paths().snapshot()).unwrap();
    let later = T0.plus_secs(limits.record.ttl_sec + 1);

    let held = record
        .hold(Wait::Try, later, &limits, |state, ids| {
            state.claim(
                &rec::key("nobody-here"),
                Generation::FIRST,
                Checkpoint::Stop,
                later,
                &limits,
                ids,
            )
        })
        .unwrap();

    assert!(!held.wrote);
    assert_eq!(std::fs::read(fgos.paths().snapshot()).unwrap(), before);
}

#[test]
fn a_send_never_resolves_a_name_to_a_binding_the_store_judges_dead() {
    let fgos = TempFgos::new("dead-name");
    let record = fgos.record();
    let limits = common::limits();
    let name = dead_binding(&record, &limits);
    writing_hold(&record, "sender", T0, &limits);

    let held = record
        .send(
            rec::send_req("sender", &name, "are you there"),
            Wait::Try,
            T0,
            &limits,
        )
        .unwrap();

    assert!(
        matches!(held.value, Err(Refusal::UnknownName { .. })),
        "{:?}",
        held.value
    );
    assert!(has_binding(&record, DEAD), "not idle yet, so still stored");
}
