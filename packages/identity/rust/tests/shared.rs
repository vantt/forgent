//! The shared directory: signed events folded into the view of other
//! machines' sessions. Runs the real `ssh-keygen` on temporary state roots;
//! never touches the real state root or machine key.

use fgos_identity::current::MachineInfo;
use fgos_identity::directory::{self, Entry, Listed};
use fgos_identity::pins::PinState;
use fgos_identity::refusal::Liveness;
use fgos_identity::shared::{
    self, ended_payload, fold, published_payload, sign_payload, verify_payload, EntryLog, MachineRef, RawEvent,
    SESSION_ENDED, SESSION_PUBLISHED,
};
use fgos_identity::signing;
use fgos_process::facts::{Record, Verdict};
use fgos_process::ProcId;
use serde_json::{json, Value};
use std::cell::RefCell;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT: AtomicU64 = AtomicU64::new(0);

/// A machine named `machine_id` with a freshly minted key and its own state root.
fn machine(machine_id: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!(
        "fgos-identity-shared-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&root).unwrap();
    fs::write(root.join("machine-id"), format!("{machine_id}\n")).unwrap();
    signing::mint_key(&root).unwrap();
    root
}

fn machine_ref(id: &str, handle: &str) -> MachineRef {
    MachineRef { id: id.into(), handle: handle.into() }
}

fn session(machine_id: &str, name: &str, roles: &[&str], registered_at: &str) -> Listed {
    Listed {
        id: format!("{machine_id}/{name}"),
        handle: format!("claude-{name}@{}", &machine_id[..machine_id.len() - 7]),
        cli: "claude".into(),
        project_id: Some("p1".into()),
        clone: None,
        registered_at: registered_at.into(),
        roles: roles.iter().map(|r| r.to_string()).collect(),
        liveness: Liveness::Alive,
        remote: None,
    }
}

fn published(signer: &Path, listed: &Listed, machine_handle: &str) -> RawEvent {
    let machine = machine_ref(listed.id.split('/').next().unwrap(), machine_handle);
    RawEvent { event_type: SESSION_PUBLISHED.into(), payload: published_payload(signer, listed, &machine).unwrap() }
}

fn ended(signer: &Path, id: &str, machine_handle: &str) -> RawEvent {
    let machine = machine_ref(id.split('/').next().unwrap(), machine_handle);
    RawEvent { event_type: SESSION_ENDED.into(), payload: ended_payload(signer, id, &machine).unwrap() }
}

const ALPHA: &str = "alpha-aaaaaa";
const BETA: &str = "beta-bbbbbb";

#[test]
fn a_signed_payload_verifies_and_pins_the_machine_and_a_changed_byte_does_not() {
    let (alpha, viewer) = (machine(ALPHA), machine("viewer-vvvvvv"));
    let event = published(&alpha, &session(ALPHA, "one", &[], "2026-10-24T01:00:00.000Z"), "alpha");
    let verified = verify_payload(&viewer, &event.payload).unwrap();
    assert_eq!((verified.machine_id.as_str(), verified.first_seen, verified.state), (ALPHA, true, PinState::Seen));

    let mut tampered = event.payload.clone();
    tampered["entry"]["roles"] = json!(["lead:MAIL"]);
    assert_eq!(verify_payload(&viewer, &tampered).unwrap_err().reason, "bad-signature");
    let view = fold(&viewer, &[RawEvent { event_type: SESSION_PUBLISHED.into(), payload: tampered }], None, None);
    assert!(view.is_empty());
    assert_eq!(view.dropped.iter().map(|d| d.reason.as_str()).collect::<Vec<_>>(), ["bad-signature"]);
}

#[test]
fn an_event_that_names_another_machine_than_its_signer_is_dropped() {
    let (alpha, viewer) = (machine(ALPHA), machine("viewer-vvvvvv"));
    // Alpha signs an entry of beta's id, and a payload that names beta as publisher.
    let beta_session = session(BETA, "one", &[], "2026-10-24T01:00:00.000Z");
    let forged = published(&alpha, &beta_session, "beta");
    let view = fold(&viewer, &[forged], None, None);
    assert!(view.is_empty());
    assert_eq!((view.dropped[0].reason.as_str(), view.dropped[0].machine_id.as_str()), ("machine-mismatch", BETA));
}

#[test]
fn a_second_key_for_a_known_machine_is_dropped_and_counted() {
    let (alpha, impostor, viewer) = (machine(ALPHA), machine(ALPHA), machine("viewer-vvvvvv"));
    let real = published(&alpha, &session(ALPHA, "one", &[], "2026-10-24T01:00:00.000Z"), "alpha");
    let fake = published(&impostor, &session(ALPHA, "two", &[], "2026-10-24T02:00:00.000Z"), "alpha");
    let view = fold(&viewer, &[real, fake], None, None);
    assert_eq!(view.len(), 1, "the first key seen stays the machine's key");
    assert!(view.resolve("alpha-aaaaaa/one").is_ok());
    assert_eq!((view.dropped[0].reason.as_str(), view.dropped[0].machine_id.as_str()), ("key-changed", ALPHA));
}

#[test]
fn the_last_event_of_a_session_wins_and_an_end_removes_it() {
    let (alpha, viewer) = (machine(ALPHA), machine("viewer-vvvvvv"));
    let first = session(ALPHA, "one", &[], "2026-10-24T01:00:00.000Z");
    let mut renamed = first.clone();
    renamed.roles = vec!["lead:MAIL".into()];
    let events = [published(&alpha, &first, "alpha"), published(&alpha, &renamed, "alpha")];
    let view = fold(&viewer, &events, Some("2026-10-24T03:00:00.000Z".into()), None);
    let found = view.resolve("lead:MAIL").unwrap();
    assert_eq!((found.id.as_str(), found.liveness), ("alpha-aaaaaa/one", Liveness::Remote));
    assert_eq!(found.clone, None);
    let remote = found.remote.clone().unwrap();
    assert_eq!((remote.machine.handle.as_str(), remote.fetched_at.as_deref(), remote.pin), ("alpha", Some("2026-10-24T03:00:00.000Z"), PinState::Seen));
    assert_eq!(serde_json::to_value(&found).unwrap()["liveness"], "remote");

    let with_end = [events[0].clone(), events[1].clone(), ended(&alpha, "alpha-aaaaaa/one", "alpha")];
    assert!(fold(&viewer, &with_end, None, None).is_empty());
}

#[test]
fn a_role_held_on_two_machines_goes_to_the_later_event() {
    let (alpha, beta, viewer) = (machine(ALPHA), machine(BETA), machine("viewer-vvvvvv"));
    let a = published(&alpha, &session(ALPHA, "one", &["lead:MAIL"], "2026-10-24T01:00:00.000Z"), "alpha");
    let b = published(&beta, &session(BETA, "two", &["lead:MAIL"], "2026-10-24T02:00:00.000Z"), "beta");
    assert_eq!(fold(&viewer, &[a.clone(), b.clone()], None, None).resolve("lead:MAIL").unwrap().id, "beta-bbbbbb/two");
    assert_eq!(fold(&viewer, &[b, a], None, None).resolve("lead:MAIL").unwrap().id, "alpha-aaaaaa/one");
}

#[test]
fn a_live_local_holder_beats_a_remote_one_and_a_remote_full_id_resolves_through_the_view() {
    let (alpha, viewer) = (machine(ALPHA), machine("viewer-vvvvvv"));
    let remote = published(&alpha, &session(ALPHA, "one", &["lead:MAIL", "lead:IDENT"], "2026-10-24T01:00:00.000Z"), "alpha");
    let view = fold(&viewer, &[remote], None, None);
    let alive = |record: &Record| if record.pid.is_some() { Verdict::Alive } else { Verdict::Unknown };
    let local = Entry::new(
        "viewer-vvvvvv/loc".into(),
        "claude-loc@viewer".into(),
        "claude".into(),
        Some("p1".into()),
        None,
        vec!["lead:MAIL".into()],
        Some(Record { pid: Some(ProcId(10)), start_time: Some("1".into()), ..Record::default() }),
    );
    directory::register(&viewer, local, false, &alive).unwrap();

    assert_eq!(directory::resolve(&viewer, "lead:MAIL", &alive, Some(&view)).unwrap().id, "viewer-vvvvvv/loc");
    assert_eq!(directory::resolve(&viewer, "lead:IDENT", &alive, Some(&view)).unwrap().id, "alpha-aaaaaa/one");
    assert_eq!(directory::resolve(&viewer, "alpha-aaaaaa/one", &alive, Some(&view)).unwrap().liveness, Liveness::Remote);
    assert_eq!(directory::resolve(&viewer, "alpha-aaaaaa/one", &alive, None).unwrap_err().reason, "not-found");

    let listed = directory::list(&viewer, None, false, &alive, Some(&view)).unwrap().sessions;
    assert_eq!(listed.iter().map(|s| s.id.as_str()).collect::<Vec<_>>(), ["viewer-vvvvvv/loc", "alpha-aaaaaa/one"]);
    assert_eq!(listed[1].roles, ["lead:IDENT"], "the role a live local session holds is not shown on the remote entry");
}

#[test]
fn unknown_fields_and_unknown_event_types_are_ignored() {
    let (alpha, viewer) = (machine(ALPHA), machine("viewer-vvvvvv"));
    let mut payload: Value = json!({
        "v": 1,
        "entry": {"id": "alpha-aaaaaa/one", "handle": "claude-one@alpha", "cli": "claude", "projectId": "p1",
                  "roles": [], "registeredAt": "2026-10-24T01:00:00.000Z", "later": true},
        "machine": {"id": ALPHA, "handle": "alpha"},
        "publishedAt": "2026-10-24T01:00:00.000Z",
        "extra": [1, 2],
    });
    payload = sign_payload(&alpha, payload).unwrap();
    let noise = RawEvent { event_type: "store.promote".into(), payload: json!({}) };
    let view = fold(&viewer, &[noise, RawEvent { event_type: SESSION_PUBLISHED.into(), payload }], None, None);
    assert_eq!(view.len(), 1);
    assert!(view.dropped.is_empty());
}

struct MemoryLog(RefCell<Vec<RawEvent>>);

impl EntryLog for MemoryLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), fgos_identity::Refusal> {
        self.0.borrow_mut().push(RawEvent { event_type: event_type.into(), payload });
        Ok(())
    }
    fn read(&self) -> Result<(Vec<RawEvent>, Option<String>), fgos_identity::Refusal> {
        Ok((self.0.borrow().clone(), None))
    }
}

#[test]
fn publishing_happens_on_change_only_and_a_removed_session_is_ended() {
    let alpha = machine(ALPHA);
    let info = MachineInfo { id: ALPHA.into(), handle: "alpha".into(), alias: None };
    let log = MemoryLog(RefCell::new(Vec::new()));
    let one = session(ALPHA, "one", &["lead:MAIL"], "2026-10-24T01:00:00.000Z");
    let publish = |own: Option<&Listed>, live: &[Listed]| shared::publish_changes(&alpha, &log, &info, own, live).unwrap();

    assert_eq!(publish(Some(&one), std::slice::from_ref(&one)), 1);
    assert_eq!(publish(Some(&one), std::slice::from_ref(&one)), 0, "an unchanged registration publishes nothing");
    let mut dropped = one.clone();
    dropped.roles.clear();
    assert_eq!(publish(Some(&dropped), &[dropped.clone()]), 1, "a changed role set publishes again");
    let mut no_project = session(ALPHA, "two", &[], "2026-10-24T02:00:00.000Z");
    no_project.project_id = None;
    assert_eq!(publish(Some(&no_project), &[dropped.clone(), no_project.clone()]), 0, "no project id, no publish");

    assert_eq!(publish(None, &[]), 1, "the session that left the directory is ended");
    assert_eq!(publish(None, &[]), 0);
    let types: Vec<String> = log.0.borrow().iter().map(|e| e.event_type.clone()).collect();
    assert_eq!(types, [SESSION_PUBLISHED, SESSION_PUBLISHED, SESSION_ENDED]);
}

#[test]
fn a_cached_fold_skips_the_signature_checks_that_held_and_still_catches_a_re_keyed_machine() {
    let (alpha, impostor, viewer) = (machine(ALPHA), machine(ALPHA), machine("viewer-vvvvvv"));
    let events: Vec<RawEvent> = (0..12)
        .map(|n| published(&alpha, &session(ALPHA, &format!("s{n}"), &[], "2026-10-24T01:00:00.000Z"), "alpha"))
        .collect();
    let started = std::time::Instant::now();
    let cold = fold(&viewer, &events, Some("2026-10-24T03:00:00.000Z".into()), None);
    let cold_time = started.elapsed();
    assert_eq!(cold.len(), 12);

    let path = shared::cache_path(&viewer);
    shared::write_cache(&path, &cold.cache()).unwrap();
    let cache = shared::read_cache(&path).unwrap();
    assert_eq!(cache, cold.cache(), "the file reads back as written");
    shared::write_cache(&path, &cache).unwrap();

    let started = std::time::Instant::now();
    let warm = fold(&viewer, &events, Some("2026-10-24T03:00:00.000Z".into()), Some(&cache));
    let warm_time = started.elapsed();
    assert_eq!(warm.cache(), cold.cache(), "the same view, without a check per session");
    assert!(warm_time * 5 < cold_time, "warm {warm_time:?} against cold {cold_time:?}");
    assert_eq!(shared::read_cache(&viewer.join("missing.json")), None);

    // The machine is re-keyed on purpose: what its old key signed is no longer vouched for.
    signing::mint_key(&impostor).unwrap();
    fgos_identity::pins::forget(&viewer, ALPHA).unwrap();
    let rekeyed = published(&impostor, &session(ALPHA, "new", &[], "2026-10-24T02:00:00.000Z"), "alpha");
    verify_payload(&viewer, &rekeyed.payload).unwrap();
    let after = fold(&viewer, &events, None, Some(&cache));
    assert!(after.is_empty());
    assert_eq!(after.dropped.iter().filter(|d| d.reason == "key-changed").count(), 12);
}
