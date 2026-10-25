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
    // Delivered half a record TTL later, so the header that names the dead
    // head outlives the point where the binding becomes idle, whatever the
    // contract's header horizon.
    let delivered = T0.plus_secs(limits.record.ttl_sec / 2);
    record
        .hold(Wait::Try, delivered, &limits, |state, ids| {
            let claim = state.claim(
                &rec::key("peer"),
                Generation::FIRST,
                Checkpoint::Step,
                delivered,
                &limits,
                ids,
            );
            state.finish(
                &rec::key("peer"),
                Generation::FIRST,
                &claim.token.unwrap(),
                delivered,
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
    writing_hold(
        &record,
        "another",
        delivered.plus_secs(horizon + 1),
        &limits,
    );
    assert!(!has_binding(&record, DEAD));
}

/// Idle counts from the head's last drain, not only from its
/// registration: a dead head that drained a notice less than a record TTL
/// ago is kept after the header that named it retired, and pruned one
/// record TTL after that drain.
#[test]
fn a_dead_binding_idle_since_its_last_drain_is_kept_until_a_record_ttl_after_it() {
    let fgos = TempFgos::new("prune-drained");
    let record = fgos.record();
    let limits = common::limits();
    let ttl = limits.record.ttl_sec;
    dead_binding(&record, &limits);
    let peer = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            Reported::changing(rec::name_of(&rec::register(
                state, "peer", T0, &limits, ids,
            )))
        })
        .unwrap()
        .value
        .value;
    record
        .send(
            rec::send_req(DEAD, &peer, "never read"),
            Wait::Try,
            T0,
            &limits,
        )
        .unwrap()
        .value
        .unwrap();
    // The unread message is refused one record TTL later, with a notice to
    // the dead head; the dead head's key drains that notice half a TTL on.
    let refused_at = T0.plus_secs(ttl + 1);
    writing_hold(&record, "other", refused_at, &limits);
    let drained_at = refused_at.plus_secs(ttl / 2);
    let drained = record
        .hold(Wait::Try, drained_at, &limits, |state, ids| {
            let claim = state.claim(
                &rec::key(DEAD),
                Generation::FIRST,
                Checkpoint::Step,
                drained_at,
                &limits,
                ids,
            );
            let token = claim.token.clone().unwrap();
            let finished = state.finish(&rec::key(DEAD), Generation::FIRST, &token, drained_at);
            Reported::changing(finished.offered.len())
        })
        .unwrap();
    assert_eq!(drained.value.value, 1, "the notice was drained");

    // The refused header retires one horizon after its refusal; the head
    // drained less than a record TTL before that.
    let after_header = refused_at.plus_secs(limits.header_horizon_sec() + 1);
    writing_hold(&record, "another", after_header, &limits);
    assert!(
        has_binding(&record, DEAD),
        "idle counts from the last drain"
    );

    writing_hold(&record, "a-third", drained_at.plus_secs(ttl + 1), &limits);
    assert!(!has_binding(&record, DEAD));
}

/// A send prunes with the liveness it judged once for its own name
/// resolution: the dead idle head is forgotten, the live idle one kept.
#[test]
fn a_send_prunes_with_the_judgement_it_made_for_its_names() {
    let fgos = TempFgos::new("prune-send");
    let record = fgos.record();
    let limits = common::limits();
    dead_binding(&record, &limits);
    let own = rec::own_head_record();
    let peer = record
        .hold(Wait::Try, T0, &limits, |state, ids| {
            state
                .register(
                    rec::register_request("live-head", &own),
                    None,
                    T0,
                    &limits,
                    ids,
                )
                .unwrap();
            Reported::changing(rec::name_of(&rec::register(
                state, "peer", T0, &limits, ids,
            )))
        })
        .unwrap()
        .value
        .value;

    let later = T0.plus_secs(limits.record.ttl_sec + 1);
    record
        .send(
            rec::send_req("cli-sender", &peer, "hello"),
            Wait::Try,
            later,
            &limits,
        )
        .unwrap()
        .value
        .unwrap();

    assert!(!has_binding(&record, DEAD));
    assert!(has_binding(&record, "live-head"));
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
