//! Message bodies (spec §5.1, §6.4): an immutable file per accepted
//! message, installed before the snapshot that names it, read only when it
//! is a regular file of exactly its header's size, and removed once no
//! installed snapshot references it.
#![cfg(unix)]
mod common;

use common::record::{self as rec, TempFgos, T0};
use fgos_mailbox::record::{bodies, Held, Paths, Record, Reported, Step, Wait};
use fgos_mailbox_core::{
    Checkpoint, Generation, Limits, MessageId, Refusal, SendOutcome, Timestamp,
};
use std::collections::BTreeSet;
use std::os::unix::fs::PermissionsExt;
use std::path::Path;
use std::time::Duration;

const BODY: &str = "hello, head b";

/// A record with heads `head-a` and `head-b`; returns `head-b`'s name.
fn two_heads(record: &Record, limits: &Limits) -> String {
    record
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            rec::register(state, "head-a", T0, limits, ids);
            Reported::changing(rec::name_of(&rec::register(
                state, "head-b", T0, limits, ids,
            )))
        })
        .unwrap()
        .value
        .value
}

fn send(
    record: &Record,
    to: &str,
    body: &str,
    now: Timestamp,
    limits: &Limits,
) -> Held<Result<SendOutcome, Refusal>> {
    record
        .send(rec::send_req("head-a", to, body), Wait::Try, now, limits)
        .unwrap()
}

fn listing(dir: &Path) -> BTreeSet<String> {
    std::fs::read_dir(dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().into_string().unwrap())
        .collect()
}

/// An id no message has, for planted body files.
fn stray_id() -> MessageId {
    MessageId::from_text("0123456789abcdef")
}

/// Plants an unreferenced body and a temporary in each record directory,
/// and a file in the mailbox directory, which no hold may touch.
struct Plants {
    stray_body: std::path::PathBuf,
    bodies_temp: std::path::PathBuf,
    record_temp: std::path::PathBuf,
    unlocked: std::path::PathBuf,
}

impl Plants {
    fn new(paths: &Paths) -> Self {
        let plants = Self {
            stray_body: paths.body(&stray_id()).unwrap(),
            bodies_temp: paths.bodies_dir().join(".durable-file-1-0.tmp"),
            record_temp: paths.record_dir().join(".durable-file-1-0.tmp"),
            unlocked: paths.mailbox_dir().join("written-without-the-lock"),
        };
        for path in plants.all() {
            std::fs::write(path, "left behind").unwrap();
        }
        plants
    }

    fn all(&self) -> [&Path; 4] {
        [
            &self.stray_body,
            &self.bodies_temp,
            &self.record_temp,
            &self.unlocked,
        ]
    }
}

#[test]
fn an_accepted_send_installs_its_body_before_the_snapshot_that_names_it() {
    let fgos = TempFgos::new("body-first");
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let mut steps = Vec::new();
    let held = record
        .send_observed(
            rec::send_req("head-a", &to, BODY),
            Wait::Try,
            T0,
            &limits,
            |step| {
                steps.push(step);
                Ok(())
            },
        )
        .unwrap();
    let id = held.value.unwrap().id;
    let path = fgos.paths().body(&id).unwrap();
    assert_eq!(std::fs::read_to_string(&path).unwrap(), BODY);
    let mode = std::fs::metadata(&path).unwrap().permissions().mode() & 0o777;
    assert_eq!(mode, 0o600);
    let state = rec::read_state(&record);
    let header = state.message(&id).unwrap();
    assert!(header.body_kept);
    assert_eq!(header.body_bytes, BODY.len() as u64);
    let at = |step: Step| steps.iter().position(|s| *s == step).unwrap();
    assert!(at(Step::BodyInstalled) < at(Step::Written), "{steps:?}");
}

#[test]
fn a_refused_send_writes_no_body() {
    let fgos = TempFgos::new("refused-no-body");
    let record = fgos.record();
    let limits = common::limits();
    two_heads(&record, &limits);
    let held = send(&record, "nobody-claude-zz", BODY, T0, &limits);
    assert!(held.value.is_err());
    assert!(held.wrote);
    assert!(listing(&fgos.paths().bodies_dir()).is_empty());
}

#[test]
fn a_body_is_never_overwritten() {
    let fgos = TempFgos::new("no-overwrite");
    let _record = fgos.record();
    let paths = fgos.paths();
    let path = paths.body(&stray_id()).unwrap();
    std::fs::write(&path, "first").unwrap();
    let err = bodies::install(&paths, &stray_id(), b"second").unwrap_err();
    assert_eq!(err.code(), "body-exists");
    assert_eq!(std::fs::read_to_string(&path).unwrap(), "first");
    assert!(!paths.snapshot().exists());
}

#[test]
fn a_body_whose_header_retires_is_deleted_by_the_install_that_retires_it() {
    let fgos = TempFgos::new("retire");
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let id = send(&record, &to, BODY, T0, &limits).value.unwrap().id;
    record
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            let claim = state.claim(
                &rec::key("head-b"),
                Generation::FIRST,
                Checkpoint::Step,
                T0,
                &limits,
                ids,
            );
            state.finish(
                &rec::key("head-b"),
                Generation::FIRST,
                &claim.token.unwrap(),
                T0,
            )
        })
        .unwrap();
    let plants = Plants::new(&fgos.paths());
    // With the contract's values the header horizon equals the body
    // retention, so the header and its body leave together.
    let horizon = limits
        .loop_guard
        .window_sec
        .max(limits.record.ttl_sec)
        .max(limits.record.body_retention_sec);
    assert_eq!(horizon, limits.record.body_retention_sec);
    let later = T0.plus_secs(horizon + 1);
    let held = record
        .hold(Wait::Try, later, &limits, |state, ids| {
            rec::register(state, "head-c", later, &limits, ids)
        })
        .unwrap();
    assert!(held.wrote);
    assert!(rec::read_state(&record).message(&id).is_none());
    assert!(!fgos.paths().body(&id).unwrap().exists());
    for planted in plants.all() {
        assert!(
            planted.exists(),
            "{} was swept by a hold that is not a send",
            planted.display()
        );
    }
}

#[test]
fn a_send_removes_bodies_and_temporaries_no_snapshot_names() {
    let fgos = TempFgos::new("sweep");
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let plants = Plants::new(&fgos.paths());
    let id = send(&record, &to, BODY, T0, &limits).value.unwrap().id;
    assert!(!plants.stray_body.exists());
    assert!(!plants.bodies_temp.exists());
    assert!(!plants.record_temp.exists());
    assert!(
        plants.unlocked.exists(),
        "the mailbox directory is never swept"
    );
    assert!(fgos.paths().body(&id).unwrap().exists());
}

#[test]
fn a_send_that_finds_an_entry_it_cannot_judge_deletes_nothing() {
    let fgos = TempFgos::new("sweep-abort");
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let plants = Plants::new(&fgos.paths());
    std::fs::create_dir(fgos.paths().record_dir().join("planted-dir")).unwrap();
    let held = send(&record, &to, BODY, T0, &limits);
    assert!(
        held.value.is_ok() && held.wrote,
        "the send itself is committed"
    );
    assert_eq!(held.warning.unwrap().step, Step::Collected);
    for planted in plants.all() {
        assert!(planted.exists(), "{} was deleted", planted.display());
    }
}

#[test]
fn a_hold_that_only_reads_leaves_orphans_for_the_next_send() {
    let fgos = TempFgos::new("read-only");
    let record = fgos.record();
    let limits = common::limits();
    two_heads(&record, &limits);
    let plants = Plants::new(&fgos.paths());
    let held = record
        .hold(Wait::Try, T0, &common::limits(), |state, ids| {
            state.claim(
                &rec::key("head-b"),
                Generation::FIRST,
                Checkpoint::Stop,
                T0,
                &limits,
                ids,
            )
        })
        .unwrap();
    assert!(!held.wrote);
    for planted in plants.all() {
        assert!(planted.exists());
    }
}

/// A record holding one accepted message; returns its id and size.
fn one_message(fgos: &TempFgos) -> (Record, MessageId, u64) {
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let id = send(&record, &to, BODY, T0, &limits).value.unwrap().id;
    let size = rec::read_state(&record).message(&id).unwrap().body_bytes;
    (record, id, size)
}

#[test]
fn a_planted_symlink_or_fifo_body_is_never_read() {
    let fgos = TempFgos::new("planted-body");
    let (record, id, size) = one_message(&fgos);
    let limits = common::limits();
    assert_eq!(record.body(&id, size, &limits).as_deref(), Some(BODY));
    let path = fgos.paths().body(&id).unwrap();

    let secret = fgos.scratch().join("secret");
    std::fs::write(&secret, BODY).unwrap();
    std::fs::remove_file(&path).unwrap();
    std::os::unix::fs::symlink(&secret, &path).unwrap();
    assert_eq!(record.body(&id, size, &limits), None);

    std::fs::remove_file(&path).unwrap();
    std::fs::write(&path, BODY).unwrap();
    let elsewhere = fgos.scratch().join("bodies-elsewhere");
    std::fs::create_dir(&elsewhere).unwrap();
    std::fs::rename(&path, elsewhere.join(path.file_name().unwrap())).unwrap();
    let bodies_dir = fgos.paths().bodies_dir();
    std::fs::remove_dir(&bodies_dir).unwrap();
    std::os::unix::fs::symlink(&elsewhere, &bodies_dir).unwrap();
    assert_eq!(
        record.body(&id, size, &limits),
        None,
        "symlinked bodies directory"
    );
    std::fs::remove_file(&bodies_dir).unwrap();
    std::fs::create_dir(&bodies_dir).unwrap();

    rec::mkfifo(&path);
    let read = rec::within(Duration::from_secs(10), move || {
        record.body(&id, size, &limits)
    });
    assert_eq!(read, None);
}

#[test]
fn a_body_longer_than_its_header_says_or_than_the_cap_is_not_read() {
    let fgos = TempFgos::new("long-body");
    let (record, id, size) = one_message(&fgos);
    let limits = common::limits();
    let path = fgos.paths().body(&id).unwrap();
    std::fs::write(&path, format!("{BODY}!")).unwrap();
    assert_eq!(record.body(&id, size, &limits), None);

    let over = limits.max_body_bytes + 1;
    std::fs::write(&path, "x".repeat(over as usize)).unwrap();
    assert_eq!(
        record.body(&id, over, &limits),
        None,
        "over mailbox.maxBodyBytes"
    );
}

#[test]
fn a_body_that_is_not_utf8_is_not_read() {
    let fgos = TempFgos::new("binary-body");
    let (record, id, size) = one_message(&fgos);
    let path = fgos.paths().body(&id).unwrap();
    std::fs::write(&path, vec![0xff; size as usize]).unwrap();
    assert_eq!(record.body(&id, size, &common::limits()), None);
}

#[test]
fn a_symlinked_bodies_directory_is_never_swept() {
    let fgos = TempFgos::new("symlink-bodies");
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let snapshot = std::fs::read(fgos.paths().snapshot()).unwrap();
    let elsewhere = fgos.scratch().join("bodies-elsewhere");
    std::fs::create_dir(&elsewhere).unwrap();
    std::fs::write(elsewhere.join("keep-me"), "not the mailbox's").unwrap();
    std::fs::remove_dir_all(fgos.paths().bodies_dir()).unwrap();
    std::os::unix::fs::symlink(&elsewhere, fgos.paths().bodies_dir()).unwrap();
    let err = record
        .send(rec::send_req("head-a", &to, BODY), Wait::Try, T0, &limits)
        .unwrap_err();
    assert_eq!(err.code(), "record-dir-untrusted");
    assert_eq!(listing(&elsewhere), BTreeSet::from(["keep-me".to_string()]));
    assert_eq!(std::fs::read(fgos.paths().snapshot()).unwrap(), snapshot);
}

#[test]
fn a_bodies_directory_swapped_during_a_hold_is_never_used_for_deletion() {
    let fgos = TempFgos::new("swapped-bodies");
    let record = fgos.record();
    let limits = common::limits();
    let to = two_heads(&record, &limits);
    let paths = fgos.paths();
    let moved = fgos.scratch().join("bodies-before");
    let mut swapped = false;
    let held = record
        .send_observed(
            rec::send_req("head-a", &to, BODY),
            Wait::Try,
            T0,
            &limits,
            |step| {
                // After the hold checked the directories, another writer
                // puts a different real directory in place.
                if step == Step::Written && !swapped {
                    swapped = true;
                    std::fs::rename(paths.bodies_dir(), &moved)?;
                    std::fs::create_dir(paths.bodies_dir())?;
                    std::fs::write(paths.body(&stray_id()).unwrap(), "not swept")?;
                }
                Ok(())
            },
        )
        .unwrap();
    assert!(held.wrote);
    assert_eq!(held.warning.unwrap().step, Step::Collected);
    assert!(paths.body(&stray_id()).unwrap().exists());
}
