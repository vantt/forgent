//! The record under real processes contending for it (spec §11, the V2
//! Core-suite items; §8 item 7): the mailbox mutex serializes every hold,
//! so no update is lost, one remaining wake allowance is spent once, one
//! message is claimed once, two heads registering at once never share a
//! generation, and a hold that cannot get the lock within the wait cap
//! changes nothing.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_mailbox::head::judge_stored;
use fgos_mailbox::record::{Record, RecordError, Step, Wait};
use fgos_mailbox_core::{Checkpoint, Generation, MailboxState, Registered, SendRequest};
use std::collections::BTreeSet;
use std::process::Child;

/// How long a contending child waits for the lock: far above any hold, so
/// the children serialize instead of giving up.
const CHILD_WAIT: Wait = Wait::Ms(30_000);
/// The barrier file the parent installs once every child stands ready.
const START: &str = "start";

/// Re-executed by the tests below as a child process; does nothing in an
/// ordinary run. Every child announces `<name>.ready`, waits for the start
/// barrier, does its part and writes its outcome to `<name>`.
#[test]
fn child_entry() {
    let Some(role) = rec::role() else {
        return;
    };
    let arg = rec::child_arg();
    let mut parts = arg.split('|');
    let name = parts.next().unwrap().to_string();
    let scratch = rec::child_scratch();
    let record = Record::open(rec::child_fgos_dir()).unwrap();
    let limits = common::limits();
    let barrier = || {
        rec::publish(&scratch.join(format!("{name}.ready")), "ready");
        rec::child_await_file(&scratch.join(START));
    };
    let outcome = match role.as_str() {
        "send-many" => {
            let to: Vec<String> = parts.map(str::to_string).collect();
            barrier();
            let mut ids = Vec::new();
            for i in 0..limits.session.budget as usize {
                let held = record
                    .send(
                        rec::send_req(&name, &to[i % to.len()], "racing"),
                        CHILD_WAIT,
                        T0,
                        &limits,
                    )
                    .unwrap();
                ids.push(held.value.unwrap().id.to_string());
            }
            ids.join("\n")
        }
        "wake-once" => {
            let to = parts.next().unwrap().to_string();
            barrier();
            let req = SendRequest {
                wake: true,
                ..rec::send_req(&name, &to, "wake up")
            };
            let held = record.send(req, CHILD_WAIT, T0, &limits).unwrap();
            held.value.unwrap().effective_wake.to_string()
        }
        "claim" => {
            barrier();
            let held = record
                .hold(CHILD_WAIT, T0, &common::limits(), |state, ids| {
                    state.claim(
                        &rec::key("recipient"),
                        Generation::FIRST,
                        Checkpoint::Step,
                        T0,
                        &limits,
                        ids,
                    )
                })
                .unwrap();
            let claimed: Vec<String> = held
                .value
                .items
                .iter()
                .map(|item| item.id.to_string())
                .collect();
            claimed.join("\n")
        }
        "register-contested" => {
            let own = rec::own_head_record();
            barrier();
            let held = record
                .hold(CHILD_WAIT, T0, &common::limits(), |state, ids| {
                    let judged = state
                        .binding(&rec::key("contested"))
                        .map(|stored| judge_stored(stored, &own));
                    state.register(
                        rec::register_request("contested", &own),
                        judged,
                        T0,
                        &limits,
                        ids,
                    )
                })
                .unwrap();
            let outcome = match held.value {
                Ok(Registered::Replaced { generation, .. }) => {
                    format!("replaced-{}", generation.get())
                }
                other => format!("{other:?}"),
            };
            // Stay alive, so the other contender judges a live head.
            rec::publish(&scratch.join(&name), &outcome);
            rec::park_forever();
        }
        "hold-at-locked" => {
            let ready = scratch.join(format!("{name}.ready"));
            record
                .hold_observed(
                    CHILD_WAIT,
                    T0,
                    &limits,
                    |step| {
                        if step == Step::Locked {
                            rec::publish(&ready, "locked");
                            rec::child_await_byte();
                        }
                        Ok(())
                    },
                    |state, ids| rec::register(state, "head-held", T0, &limits, ids),
                )
                .unwrap();
            "done".to_string()
        }
        other => panic!("unknown role {other}"),
    };
    rec::publish(&scratch.join(&name), &outcome);
}

/// Starts one child per `(name, arg)`, waits until all stand at the
/// barrier, then opens it.
fn start_together(fgos: &TempFgos, role: &str, children: &[(&str, String)]) -> Vec<Child> {
    let mut started: Vec<Child> = children
        .iter()
        .map(|(name, arg)| rec::spawn(role, fgos, &format!("{name}|{arg}")))
        .collect();
    for (child, (name, _)) in started.iter_mut().zip(children) {
        rec::wait_for(child, &fgos.scratch().join(format!("{name}.ready")));
    }
    rec::publish(&fgos.scratch().join(START), "go");
    started
}

fn outcome(fgos: &TempFgos, name: &str) -> String {
    std::fs::read_to_string(fgos.scratch().join(name)).unwrap()
}

fn finish(children: &mut [Child]) {
    for child in children {
        assert!(rec::wait_exit(child).success());
    }
}

fn kill(children: &mut [Child]) {
    for child in children {
        let _ = child.kill();
        let _ = child.wait();
    }
}

/// A record with the given heads; returns their names in order.
fn heads(record: &Record, keys: &[&str]) -> Vec<String> {
    let limits = common::limits();
    record
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            keys.iter()
                .map(|k| rec::name_of(&rec::register(state, k, T0, &limits, ids)))
                .collect()
        })
        .unwrap()
        .value
}

#[test]
fn two_senders_racing_lose_no_update() {
    let fgos = TempFgos::new("race-send");
    let record = fgos.record();
    let limits = common::limits();
    let budget = limits.session.budget;
    // Each sender alternates two recipients, so neither the loop guard nor
    // its share of one recipient's queue can refuse it.
    let per_recipient = budget.div_ceil(2);
    assert!(per_recipient < limits.loop_guard.max_per_window);
    assert!(per_recipient <= limits.queue.per_sender);
    assert!(2 * per_recipient <= limits.queue.cap);
    let names = heads(&record, &["r-one", "r-two", "s-one", "s-two"]);
    let to = format!("{}|{}", names[0], names[1]);

    let mut children = start_together(&fgos, "send-many", &[("s-one", to.clone()), ("s-two", to)]);
    finish(&mut children);

    let mut sent: Vec<String> = Vec::new();
    for name in ["s-one", "s-two"] {
        sent.extend(outcome(&fgos, name).lines().map(str::to_string));
    }
    assert_eq!(sent.len(), 2 * budget as usize);
    let state = rec::read_state(&record);
    let stored: BTreeSet<String> = state.messages().map(|h| h.id.to_string()).collect();
    assert_eq!(stored.len(), 2 * budget as usize, "an update was lost");
    assert_eq!(stored, sent.iter().cloned().collect::<BTreeSet<_>>());
    for header in state.messages() {
        assert!(record
            .body(&header.id, header.body_bytes, &limits)
            .is_some());
    }
}

fn wakes_spent(state: &MailboxState) -> u64 {
    let value = serde_json::to_value(state).unwrap();
    let exchanges = value["exchanges"].as_object().unwrap();
    assert_eq!(exchanges.len(), 1);
    exchanges.values().next().unwrap()["wakes_spent"]
        .as_u64()
        .unwrap()
}

#[test]
fn two_senders_never_spend_one_remaining_wake_allowance() {
    let fgos = TempFgos::new("race-wake");
    let record = fgos.record();
    let limits = common::limits();
    let names = heads(&record, &["head-a", "head-b"]);
    let max = limits.wake.max_per_exchange;
    for i in 0..max - 1 {
        let (from, to) = if i % 2 == 0 {
            ("head-a", &names[1])
        } else {
            ("head-b", &names[0])
        };
        let req = SendRequest {
            wake: true,
            ..rec::send_req(from, to, "wake")
        };
        let sent = record.send(req, Wait::Try, T0, &limits).unwrap();
        assert!(sent.value.unwrap().effective_wake);
    }
    assert_eq!(wakes_spent(&rec::read_state(&record)), u64::from(max - 1));

    let mut children = start_together(
        &fgos,
        "wake-once",
        &[("head-a", names[1].clone()), ("head-b", names[0].clone())],
    );
    finish(&mut children);

    let effective: Vec<String> = ["head-a", "head-b"]
        .iter()
        .map(|name| outcome(&fgos, name))
        .collect();
    assert_eq!(
        effective.iter().filter(|e| *e == "true").count(),
        1,
        "{effective:?}"
    );
    assert_eq!(wakes_spent(&rec::read_state(&record)), u64::from(max));
}

#[test]
fn two_drains_never_claim_the_same_message() {
    let fgos = TempFgos::new("race-claim");
    let record = fgos.record();
    let limits = common::limits();
    let share = limits.queue.per_sender;
    let senders = limits.queue.cap.div_ceil(share);
    let mut keys = vec!["recipient".to_string()];
    keys.extend((0..senders).map(|i| format!("sender-{i}")));
    let key_refs: Vec<&str> = keys.iter().map(String::as_str).collect();
    let names = heads(&record, &key_refs);
    let mut pending = BTreeSet::new();
    for i in 0..limits.queue.cap {
        let from = &keys[1 + (i / share) as usize];
        let sent = record
            .send(
                rec::send_req(from, &names[0], "queued"),
                Wait::Try,
                T0,
                &limits,
            )
            .unwrap();
        pending.insert(sent.value.unwrap().id.to_string());
    }

    let mut children = start_together(
        &fgos,
        "claim",
        &[("drain-one", String::new()), ("drain-two", String::new())],
    );
    finish(&mut children);

    let one: BTreeSet<String> = outcome(&fgos, "drain-one")
        .lines()
        .map(str::to_string)
        .collect();
    let two: BTreeSet<String> = outcome(&fgos, "drain-two")
        .lines()
        .map(str::to_string)
        .collect();
    assert!(one.is_disjoint(&two), "a message was claimed twice");
    assert_eq!(&one | &two, pending);
}

#[test]
fn two_heads_registering_at_once_get_distinct_generations() {
    let fgos = TempFgos::new("race-register");
    let record = fgos.record();
    let limits = common::limits();
    let dead = rec::dead_head_record();
    record
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            state
                .register(
                    rec::register_request("contested", &dead),
                    None,
                    T0,
                    &limits,
                    ids,
                )
                .unwrap()
        })
        .unwrap();

    let mut children = start_together(
        &fgos,
        "register-contested",
        &[("one", String::new()), ("two", String::new())],
    );
    for (child, name) in children.iter_mut().zip(["one", "two"]) {
        rec::wait_for(child, &fgos.scratch().join(name));
    }
    let outcomes: BTreeSet<String> = ["one", "two"].iter().map(|n| outcome(&fgos, n)).collect();
    let state = rec::read_state(&record);
    kill(&mut children);

    assert_eq!(
        outcomes,
        BTreeSet::from(["replaced-2".to_string(), "Err(Conflict)".to_string()])
    );
    assert_eq!(state.bindings().count(), 1);
    assert_eq!(
        state
            .binding(&rec::key("contested"))
            .unwrap()
            .generation
            .get(),
        2
    );
}

#[test]
fn a_hold_that_cannot_get_the_lock_within_the_wait_cap_changes_nothing() {
    let fgos = TempFgos::new("wait-cap");
    let record = fgos.record();
    let limits = common::limits();
    let wait_ms = common::hook_limits().hook.lock_wait_ms;
    heads(&record, &["head-a"]);
    let before = std::fs::read(fgos.paths().snapshot()).unwrap();
    let mut holder = rec::spawn("hold-at-locked", &fgos, "holder");
    rec::wait_for(&mut holder, &fgos.scratch().join("holder.ready"));

    let err = record
        .hold(Wait::Ms(wait_ms), T0, &common::limits(), |state, ids| {
            rec::register(state, "head-parent", T0, &limits, ids)
        })
        .unwrap_err();

    match err {
        RecordError::LockBusy {
            waited_ms: Some(waited),
        } => assert!(waited >= wait_ms, "waited {waited} ms < {wait_ms} ms"),
        other => panic!("expected lock-busy with its wait, got {other}"),
    }
    assert_eq!(std::fs::read(fgos.paths().snapshot()).unwrap(), before);

    rec::release(&mut holder);
    assert!(rec::wait_exit(&mut holder).success());
    let state = rec::read_state(&record);
    assert!(state.binding(&rec::key("head-held")).is_some());
    assert!(state.binding(&rec::key("head-parent")).is_none());
    assert_eq!(state.bindings().count(), 2);
}
