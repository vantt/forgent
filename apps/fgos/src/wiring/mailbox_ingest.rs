//! Taking mail that other machines sent (`mailbox.message-sent` in stream
//! `project:mailbox`) into this project's mailbox record, from the detached
//! sync child after its fetch. Never in the hook: verification runs
//! `ssh-keygen`.
//!
//! The stream is read whole and filtered by a cursor kept in the record, one
//! position per store origin. The first ingest takes a baseline: what the
//! stream holds then is never delivered, so an old log never replays into a
//! fresh record. Each later message is verified in the contract's order
//! (shape, the sender's session owned by its signer, signature, pin, age) and
//! only then given to the core, which applies the same caps the same-machine
//! mailbox has to each verified sender, takes it once by `(machine, id)` and
//! binds it to the recipient's current generation. A message that fails
//! verification is dropped and counted; it never stops the others.
//!
//! A version 3 message whose body cannot be judged yet is held, not settled: its origin's cursor
//! stops before it and the next ingest reads it again. A body is judged absent (expired) only after
//! a body fetch that followed this sync's event fetch; a clone without the mail-body fetch mapping,
//! a failed body fetch and a failed Git read all leave the message held. Later mail of that origin
//! is still taken now and read again later, which the core's once-per-`(machine, id)` rule makes
//! harmless; what is only counted or refused is left for that later read, so nothing is counted
//! twice. A hold ends when the message is delivered or goes stale under the age rule below.
use super::identity_log::StoreLogDoor;
use super::mailbox_body::{BodyFetch, BodyMirror, Resolved};
use super::mailbox_config::CrossMachine;
use super::mailbox_identity::{session_of, state_root};
use super::mailbox_remote::{
    settled_payload, signed_bytes, MESSAGE_SENT, MESSAGE_SETTLED, SENT_DOMAIN,
    SENT_DOMAIN_BODY_REF, SENT_DOMAIN_WAKE, STREAM, WIRE_MAX_BODY_BYTES,
};
use fgos_identity::current::machine_info;
use fgos_identity::pins::PinState;
use fgos_identity::shared::{self, EntryLog};
use fgos_identity::text::iso_utc_secs;
use fgos_identity::{signing, Signature};
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::record::{IngestBatch, Record, Reported, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{
    CounterReason, Ingested, Limits, NudgeReport, RemoteDrop, RemoteMail, RemoteWake, Settlement,
    Timestamp, WriterKey,
};
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::Path;

/// `mailbox.remote.maxAgeSec` and `mailbox.remote.clockSkewSec` of the wire contract.
const MAX_AGE_SEC: u64 = 86_400;
const CLOCK_SKEW_SEC: u64 = 300;
/// The refusal code a sender is given for mail that was in the log before this machine's first ingest.
const BEFORE_FIRST_SYNC: &str = "before-first-sync";

/// What one ingest did, for the child's stderr when something went wrong and for tests.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct Report {
    /// Messages recorded for a head of this record.
    pub taken: usize,
    /// Messages the core refused (caps, size, no such head), with the refusal code, in order.
    pub refused: Vec<(String, &'static str)>,
    /// Messages dropped before the core saw them, counted by reason.
    pub dropped: usize,
    /// Whether this run only took the baseline.
    pub baseline: bool,
    /// Verified version 3 messages held back, by local message id and the reason; their origins'
    /// cursors stop before them.
    pub held: Vec<(String, String)>,
    /// Settlement events appended to the shared log, which still have to be pushed.
    pub settled: usize,
    /// What the nudge for each recorded wake mail came to, by the local id of the message.
    pub nudges: Vec<(String, NudgeReport)>,
}

/// What a verified message says its body is: the text itself (versions 1 and 2), or the hash and
/// length of the blob that holds it in the sender's mail-body ref (version 3).
#[derive(Debug, PartialEq, Eq)]
enum Body {
    Inline(String),
    Held { hash: String, bytes: u64 },
}

/// A message that passed verification, owned so the record can borrow it.
struct Verified {
    machine: String,
    id: String,
    from: WriterKey,
    from_id: String,
    to_id: String,
    body: Body,
    /// The signed event asked for a wake and its machine's key is confirmed here.
    wake: bool,
}

fn text<'a>(object: &'a Value, key: &str) -> Option<&'a str> {
    object.get(key)?.as_str()
}

/// Checks one `mailbox.message-sent` payload in the contract's order.
fn verify(
    root: &Path,
    payload: &Value,
    ts: &str,
    now_secs: u64,
    cross: &CrossMachine,
) -> Result<Verified, (CounterReason, String)> {
    let malformed = |machine: &str| (CounterReason::RemoteMalformed, machine.to_owned());
    let claimed = payload["from"]["machine"]
        .as_str()
        .unwrap_or("?")
        .to_owned();
    // Version 1 is a plain message; version 2 is the same with a signed `wake: true` under its own
    // domain; version 3 holds the body's hash and length instead of the body, with `wake` optional
    // (and then `true`) under its own domain. Any other version, or a flag that does not belong to
    // its version, is malformed.
    let (domain, wake_asked, held) = match payload.get("v").and_then(Value::as_u64) {
        Some(1) if payload.get("wake").is_none() => (SENT_DOMAIN, false, false),
        Some(2) if payload.get("wake") == Some(&Value::Bool(true)) => {
            (SENT_DOMAIN_WAKE, true, false)
        }
        Some(3) if matches!(payload.get("wake"), None | Some(Value::Bool(true))) => {
            (SENT_DOMAIN_BODY_REF, payload.get("wake").is_some(), true)
        }
        _ => return Err(malformed(&claimed)),
    };
    let shape = || -> Option<(String, String, String, String, Body)> {
        if text(payload, "kind")? != "message" {
            return None;
        }
        let from = payload.get("from")?;
        let to = payload.get("to")?;
        let body = if held {
            let hash = text(payload, "bodyHash")?;
            let bytes = payload.get("bodyBytes")?.as_u64()?;
            let lowercase_hex = hash.len() == 64
                && hash
                    .bytes()
                    .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c));
            if payload.get("body").is_some() || !lowercase_hex || bytes > WIRE_MAX_BODY_BYTES {
                return None;
            }
            Body::Held {
                hash: hash.to_owned(),
                bytes,
            }
        } else {
            Body::Inline(text(payload, "body")?.to_owned())
        };
        Some((
            text(payload, "id")?.to_owned(),
            text(from, "id")?.to_owned(),
            text(from, "machine")?.to_owned(),
            text(to, "id")?.to_owned(),
            body,
        ))
    };
    let Some((id, from_id, machine, to_id, body)) = shape() else {
        return Err(malformed(&claimed));
    };
    // The sender's session belongs to the machine that signed for it.
    let Some((owner, local)) = from_id.split_once('/') else {
        return Err(malformed(&machine));
    };
    if owner != machine || id.is_empty() || id.len() > 128 {
        return Err(malformed(&machine));
    }
    let Ok(from) = WriterKey::new(local.to_owned()) else {
        return Err(malformed(&machine));
    };
    let mut unsigned = payload.clone();
    let signature: Option<Signature> = unsigned
        .as_object_mut()
        .and_then(|object| object.remove("sig"))
        .and_then(|sig| serde_json::from_value(sig).ok());
    let verified = signature
        .as_ref()
        .and_then(|signature| {
            let bytes = signed_bytes(domain, &unsigned).ok()?;
            signing::verify(root, &bytes, signature).ok()
        })
        .filter(|verified| verified.machine_id == machine);
    let Some(verified) = verified else {
        return Err((CounterReason::RemoteSignature, machine));
    };
    if cross.require_confirmed && verified.state != PinState::Confirmed {
        return Err((CounterReason::RemoteUnconfirmed, machine));
    }
    let Some(sent_at) = iso_utc_secs(ts) else {
        return Err(malformed(&machine));
    };
    if now_secs.saturating_sub(sent_at) > MAX_AGE_SEC + CLOCK_SKEW_SEC {
        return Err((CounterReason::RemoteStale, machine));
    }
    // A wake never rests on a key that is only seen, even where plain mail from one is taken.
    let wake = wake_asked && verified.state == PinState::Confirmed;
    Ok(Verified {
        machine,
        id,
        from,
        from_id,
        to_id,
        body,
        wake,
    })
}

/// The Identity handle the shared directory publishes for the session `full_id`.
fn handle_of(main: &Path, root: &Path, writer: &str, full_id: &str) -> Option<String> {
    let log = StoreLogDoor
        .open_stream(main, writer, shared::STREAM)
        .ok()??;
    let (events, fetched_at) = log.read().ok()?;
    let cache = shared::read_cache(&shared::cache_path(main));
    let view = shared::fold(root, &events, fetched_at, cache.as_ref());
    view.resolve(full_id).ok().map(|listed| listed.handle)
}

/// Takes the new verified mail from the shared log into the record. `Ok` with an empty report when
/// nothing is to be read (no store, cross-machine mail off).
pub fn ingest(
    fgos_dir: &Path,
    hold: &Hold<'_>,
    cross: &CrossMachine,
    body_fetch: &BodyFetch,
    nudge: &dyn Fn(&RemoteWake) -> Option<NudgeReport>,
) -> Result<Report, String> {
    let Hold {
        record,
        limits,
        wait,
        now,
    } = *hold;
    let mut report = Report::default();
    let (Some(main), Some(root)) = (fgos_dir.parent(), state_root()) else {
        return Ok(report);
    };
    if !cross.enabled {
        return Ok(report);
    }
    let refusal = |r: fgos_identity::Refusal| format!("{}: {}", r.reason, r.detail);
    let machine = machine_info(&root).map_err(refusal)?;
    let Some(log) = StoreLogDoor
        .open_store(main, &machine.id, STREAM)
        .map_err(refusal)?
    else {
        return Ok(report);
    };
    let (envelopes, own_origin) = log.envelopes().map_err(refusal)?;
    let held = record
        .hold(wait, now, limits, |state, _| {
            Reported::unchanged((state.remote_baselined(), state.remote_cursor().clone()))
        })
        .map_err(|e| e.to_string())?;
    let (baselined, cursor) = held.value.value;

    // The positions this read reaches, and the mail past the cursor that is for this machine.
    let mut reached: BTreeMap<String, u64> = BTreeMap::new();
    let mut verified = Vec::new();
    let mut drops: Vec<(CounterReason, String)> = Vec::new();
    // What the receiver tells a sender at once: a message that passed verification and was refused,
    // and one whose signature held but whose machine the owner has not confirmed here, so the
    // sender's owner can see why it did not arrive.
    let mut refusals: Vec<(String, &'static str)> = Vec::new();
    let now_secs = now.as_millis() / 1000;
    let mut bodies = BodyMirror::new(main, &cross.remote);
    // The first held sequence of each origin; each origin's events come in ascending sequence.
    let mut held_at: BTreeMap<String, u64> = BTreeMap::new();
    for event in &envelopes {
        let top = reached.entry(event.origin.clone()).or_insert(0);
        *top = (*top).max(event.seq);
        if event.origin == own_origin || event.event_type != MESSAGE_SENT {
            continue;
        }
        if !baselined {
            // The baseline delivers nothing the stream already held; a sender whose message is
            // still young is told so, instead of waiting for a fetch that will never offer it.
            let young = iso_utc_secs(&event.ts)
                .is_some_and(|at| now_secs.saturating_sub(at) <= MAX_AGE_SEC);
            if young && event.payload["to"]["machine"].as_str() == Some(machine.id.as_str()) {
                if let Some(id) = event.payload["id"].as_str() {
                    refusals.push((id.to_owned(), BEFORE_FIRST_SYNC));
                }
            }
            continue;
        }
        if event.seq <= cursor.get(&event.origin).copied().unwrap_or(0) {
            continue;
        }
        if event.payload["to"]["machine"].as_str() != Some(machine.id.as_str()) {
            continue;
        }
        // What this event adds to the counts and refusals; kept back while an earlier message of
        // its origin is held, because the next ingest reads this event again.
        let again = held_at.get(&event.origin).is_some_and(|at| event.seq > *at);
        let mut event_drops: Vec<(CounterReason, String)> = Vec::new();
        let mut event_refusals: Vec<(String, &'static str)> = Vec::new();
        match verify(&root, &event.payload, &event.ts, now_secs, cross) {
            Ok(mut mail) => {
                // A version 3 body is read from the sender's mirror only after its header verified.
                if let Body::Held { hash, bytes } = &mail.body {
                    // Absence is a verdict only after a body fetch; a failed read is never one.
                    let verdict = match (bodies.resolve(&mail.machine, hash, *bytes), body_fetch) {
                        (Err(why), _) => Err(why),
                        (Ok(Resolved::Expired), BodyFetch::NotFetched(why)) => Err(why.clone()),
                        (Ok(found), _) => Ok(found),
                    };
                    match verdict {
                        Err(why) => {
                            if !again {
                                held_at.insert(event.origin.clone(), event.seq);
                                report.held.push((mail.id.clone(), why));
                            }
                            continue;
                        }
                        Ok(Resolved::Body(text)) => mail.body = Body::Inline(text),
                        Ok(Resolved::Expired) => {
                            event_refusals
                                .push((mail.id.clone(), CounterReason::RemoteBodyExpired.code()));
                            event_drops
                                .push((CounterReason::RemoteBodyExpired, mail.machine.clone()));
                        }
                        Ok(Resolved::Malformed) => {
                            event_drops
                                .push((CounterReason::RemoteMalformed, mail.machine.clone()));
                        }
                    }
                }
                if matches!(mail.body, Body::Inline(_)) {
                    verified.push(mail);
                }
            }
            Err(drop) => {
                if drop.0 == CounterReason::RemoteUnconfirmed {
                    if let Some(id) = event.payload["id"].as_str() {
                        event_refusals
                            .push((id.to_owned(), CounterReason::RemoteUnconfirmed.code()));
                    }
                }
                event_drops.push(drop);
            }
        }
        if !again {
            drops.extend(event_drops);
            refusals.extend(event_refusals);
        }
    }
    // A held message keeps its origin's cursor just before it.
    for (origin, at) in &held_at {
        if let Some(top) = reached.get_mut(origin) {
            *top = (*top).min(at.saturating_sub(1));
        }
    }
    report.baseline = !baselined;
    report.dropped = drops.len();

    // The recipient is the head whose published session id the sender named.
    let heads = verbs::heads(fgos_dir, limits)?;
    let owners: Vec<(String, WriterKey)> = heads
        .iter()
        .filter_map(|head| {
            Some((
                session_of(&root, &head.key, &head.cli, Some(&head.head))?.id,
                head.key.clone(),
            ))
        })
        .collect();
    let (stop_drains, nudge_clis) = (
        TestedClis::embedded().stop_drains(),
        TestedClis::embedded().nudge_clis(),
    );
    let handles: Vec<Option<String>> = verified
        .iter()
        .map(|mail| handle_of(main, &root, &machine.id, &mail.from_id))
        .collect();
    let mut mails = Vec::new();
    let mut ids = Vec::new();
    for (mail, handle) in verified.iter().zip(&handles) {
        let Some((_, to)) = owners.iter().find(|(id, _)| *id == mail.to_id) else {
            drops.push((CounterReason::RemoteMisaddressed, mail.machine.clone()));
            refusals.push((mail.id.clone(), CounterReason::UnknownName.code()));
            report.dropped += 1;
            continue;
        };
        // A held body was read when its header verified; one still held has no text to give.
        let Body::Inline(body) = &mail.body else {
            drops.push((CounterReason::RemoteMalformed, mail.machine.clone()));
            report.dropped += 1;
            continue;
        };
        mails.push(RemoteMail {
            machine: &mail.machine,
            id: &mail.id,
            from: &mail.from,
            handle: handle.as_deref(),
            to,
            body,
            max_body_bytes: WIRE_MAX_BODY_BYTES,
            wake: mail.wake,
            stop_drains: &stop_drains,
            nudge_clis: &nudge_clis,
        });
        ids.push(mail.id.clone());
    }
    let counted: Vec<RemoteDrop<'_>> = drops
        .iter()
        .map(|(reason, machine)| RemoteDrop {
            reason: *reason,
            machine,
        })
        .collect();
    if !(baselined && mails.is_empty() && counted.is_empty() && reached == cursor) {
        let held = record
            .ingest(
                &IngestBatch {
                    mails: &mails,
                    drops: &counted,
                    refusals: &refusals,
                    cursor: &reached,
                },
                wait,
                now,
                limits,
            )
            .map_err(|e| e.to_string())?;
        for (id, result) in ids.into_iter().zip(held.value.value) {
            match result {
                Ok(Ingested::Recorded { id: local, wake }) => {
                    report.taken += 1;
                    if let Some(sent) = nudge(&wake) {
                        report.nudges.push((local.to_string(), sent));
                    }
                }
                Ok(Ingested::Duplicate) => {}
                Err(refused) => report.refused.push((id, refused.code())),
            }
        }
    }
    report.settled = settle(&log, &root, &machine.id, hold).map_err(|e| format!("settle: {e}"))?;
    Ok(report)
}

/// What one hold of the record is asked with.
#[derive(Clone, Copy)]
pub struct Hold<'a> {
    pub record: &'a Record,
    pub limits: &'a Limits,
    pub wait: Wait,
    pub now: Timestamp,
}

/// Tells the senders what their messages came to here: each refusal the record kept, and an offer or
/// a refusal after the fact for each recorded message not yet told. Each is a signed event of this
/// machine appended to the shared log; the record forgets one only after its event is written, so a
/// failure in between repeats an event the sender folds once, and a failed append is tried again at
/// the next ingest.
fn settle(
    log: &super::identity_log::StoreLog,
    root: &Path,
    machine: &str,
    hold: &Hold<'_>,
) -> Result<usize, String> {
    let Hold {
        record,
        limits,
        wait,
        now,
    } = *hold;
    let refusal = |r: fgos_identity::Refusal| format!("{}: {}", r.reason, r.detail);
    let held = record
        .hold(wait, now, limits, |state, _| {
            Reported::unchanged((
                state.unsettled_remote(),
                state.pending_remote_refusals().to_vec(),
            ))
        })
        .map_err(|e| e.to_string())?;
    let (unsettled, refused) = held.value.value;
    let mut told = Vec::new();
    let mut told_refusals = Vec::new();
    let mut appended = 0;
    // A failure stops at the first event it cannot write: what was written is forgotten below.
    let outcome = (|| {
        for pending in &refused {
            let payload =
                settled_payload(root, &pending.id, machine, "refused", Some(&pending.code))
                    .map_err(refusal)?;
            log.append(MESSAGE_SETTLED, payload).map_err(refusal)?;
            told_refusals.push(pending.id.clone());
            appended += 1;
        }
        for message in unsettled {
            let (outcome, reason) = match message.settlement {
                Settlement::Offered => ("offered", None),
                Settlement::Refused(code) => ("refused", Some(code)),
            };
            let payload = settled_payload(root, &message.origin.id, machine, outcome, reason)
                .map_err(refusal)?;
            log.append(MESSAGE_SETTLED, payload).map_err(refusal)?;
            told.push(message.id);
            appended += 1;
        }
        Ok::<(), String>(())
    })();
    if !told.is_empty() || !told_refusals.is_empty() {
        record
            .hold(wait, now, limits, |state, _| Reported {
                changed: state.mark_remote_settled(&told)
                    | state.clear_remote_refusals(&told_refusals),
                value: (),
            })
            .map_err(|e| e.to_string())?;
    }
    outcome.map(|()| appended)
}

#[cfg(test)]
mod tests {
    use super::{verify, Body, MAX_AGE_SEC};
    use crate::wiring::mailbox_config::CrossMachine;
    use crate::wiring::mailbox_remote::{
        sign_payload, SENT_DOMAIN, SENT_DOMAIN_BODY_REF, SENT_DOMAIN_WAKE,
    };
    use fgos_identity::{machine, pins, signing};
    use fgos_mailbox_core::CounterReason;
    use serde_json::{json, Value};
    use std::path::{Path, PathBuf};

    fn state_root(tag: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let root = std::env::temp_dir().join(format!("fgos-ingest-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
        machine::mint(&root, tag).unwrap();
        signing::mint_key(&root).unwrap();
        root
    }

    fn cross(require_confirmed: bool) -> CrossMachine {
        CrossMachine {
            enabled: true,
            require_confirmed,
            body_ref: false,
            body_lifetime_sec: 604800,
            remote: "origin".into(),
            sync_interval_sec: 60,
        }
    }

    fn signed(sender: &Path, from_id: &str, machine: &str, body: &str) -> Value {
        let payload = json!({
            "v": 1, "id": "m1", "from": { "id": from_id, "machine": machine },
            "to": { "id": "recv/abc", "machine": "recv" }, "kind": "message", "body": body,
            "sentAt": "2026-10-29T00:00:00.000Z",
        });
        sign_payload(sender, SENT_DOMAIN, payload).unwrap()
    }

    const TS: &str = "2026-10-29T12:00:00.000Z";
    const NOW: u64 = 1_793_275_200; // 2026-10-29T12:00:00Z

    #[test]
    fn only_a_message_that_passes_every_check_in_order_is_taken_and_each_failure_has_its_own_counted_reason(
    ) {
        let sender = state_root("sender");
        let receiver = state_root("receiver");
        let machine = machine::read(&sender).unwrap();
        let reason =
            |result: Result<_, (CounterReason, String)>| result.err().map(|(reason, _)| reason);

        let good = signed(&sender, &format!("{machine}/s1"), &machine, "hi");
        // Seen but not confirmed: dropped while confirmation is required, taken when it is not.
        assert_eq!(
            reason(verify(&receiver, &good, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteUnconfirmed)
        );
        assert!(verify(&receiver, &good, TS, NOW, &cross(false)).is_ok());
        let fingerprint = signing::key_fingerprint(&sender).unwrap().unwrap();
        pins::confirm(&receiver, &machine, &fingerprint).unwrap();
        let taken = verify(&receiver, &good, TS, NOW, &cross(true))
            .expect("a confirmed machine's message is taken");
        assert_eq!(
            (taken.from.as_str(), taken.machine.as_str()),
            ("s1", machine.as_str())
        );
        assert_eq!(taken.body, Body::Inline("hi".into()));

        let mut forged = good.clone();
        forged["body"] = json!("changed after signing");
        assert_eq!(
            reason(verify(&receiver, &forged, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteSignature)
        );
        let mut unsigned = good.clone();
        unsigned.as_object_mut().unwrap().remove("sig");
        assert_eq!(
            reason(verify(&receiver, &unsigned, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteSignature)
        );

        // A session its signer does not own, or a payload of the wrong shape.
        let stolen = signed(&sender, "other-machine/s1", &machine, "hi");
        assert_eq!(
            reason(verify(&receiver, &stolen, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteMalformed)
        );
        let mut shapeless = good.clone();
        shapeless["kind"] = json!("notice");
        assert_eq!(
            reason(verify(&receiver, &shapeless, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteMalformed)
        );

        // Older than the maximum age plus the clock tolerance.
        let old = NOW + MAX_AGE_SEC + 301;
        assert_eq!(
            reason(verify(&receiver, &good, TS, old, &cross(true))),
            Some(CounterReason::RemoteStale)
        );
        assert!(verify(&receiver, &good, TS, NOW + MAX_AGE_SEC, &cross(true)).is_ok());

        // Signed by another machine than the one the payload names.
        let impostor = state_root("impostor");
        let claimed = signed(&impostor, &format!("{machine}/s1"), &machine, "hi");
        assert_eq!(
            reason(verify(&receiver, &claimed, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteSignature)
        );
    }

    #[test]
    fn a_wake_is_signed_as_version_two_under_its_own_domain_and_only_a_confirmed_machine_ever_wakes(
    ) {
        let sender = state_root("wake-sender");
        let receiver = state_root("wake-receiver");
        let machine = machine::read(&sender).unwrap();
        let from_id = format!("{machine}/s1");
        let reason =
            |result: Result<_, (CounterReason, String)>| result.err().map(|(reason, _)| reason);
        let wake_payload = |v: u64, domain: &str| {
            let payload = json!({
                "v": v, "id": "w1", "from": { "id": from_id, "machine": machine },
                "to": { "id": "recv/abc", "machine": "recv" }, "kind": "message", "body": "hi",
                "sentAt": "2026-10-29T00:00:00.000Z", "wake": true,
            });
            sign_payload(&sender, domain, payload).unwrap()
        };
        let wake_v2 = wake_payload(2, SENT_DOMAIN_WAKE);

        // Seen, not confirmed, with confirmation not required: the mail is taken, its wake is not.
        let seen = verify(&receiver, &wake_v2, TS, NOW, &cross(false))
            .expect("plain mail from a seen machine is taken");
        assert!(!seen.wake);
        let fingerprint = signing::key_fingerprint(&sender).unwrap().unwrap();
        pins::confirm(&receiver, &machine, &fingerprint).unwrap();
        let confirmed = verify(&receiver, &wake_v2, TS, NOW, &cross(true))
            .expect("a confirmed machine's wake mail is taken");
        assert!(confirmed.wake);

        // Version 1 never carries a wake, and a version 2 event is signed under the wake domain only.
        let plain = signed(&sender, &from_id, &machine, "hi");
        assert!(
            !verify(&receiver, &plain, TS, NOW, &cross(true))
                .unwrap()
                .wake
        );
        let mut flagged = plain.clone();
        flagged["wake"] = json!(true);
        assert_eq!(
            reason(verify(&receiver, &flagged, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteMalformed)
        );
        let wrong_domain = wake_payload(2, SENT_DOMAIN);
        assert_eq!(
            reason(verify(&receiver, &wrong_domain, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteSignature)
        );
        let mut no_flag = wake_v2.clone();
        no_flag.as_object_mut().unwrap().remove("wake");
        assert_eq!(
            reason(verify(&receiver, &no_flag, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteMalformed)
        );
        let mut v3 = wake_payload(3, SENT_DOMAIN_WAKE);
        v3["v"] = json!(3);
        assert_eq!(
            reason(verify(&receiver, &v3, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteMalformed)
        );
    }

    #[test]
    fn a_body_reference_header_goes_stale_by_the_same_age_rule_which_ends_any_hold() {
        let sender = state_root("ref-stale-sender");
        let receiver = state_root("ref-stale-receiver");
        let machine = machine::read(&sender).unwrap();
        let payload = json!({
            "v": 3, "id": "r1", "from": { "id": format!("{machine}/s1"), "machine": machine },
            "to": { "id": "recv/abc", "machine": "recv" }, "kind": "message",
            "bodyHash": "a".repeat(64), "bodyBytes": 5, "sentAt": "2026-10-29T00:00:00.000Z",
        });
        let header = sign_payload(&sender, SENT_DOMAIN_BODY_REF, payload).unwrap();
        // Age is judged before any body is looked up, so a header held for want of its body is
        // dropped the first time it is read past the age limit.
        assert!(verify(&receiver, &header, TS, NOW + MAX_AGE_SEC, &cross(false)).is_ok());
        assert_eq!(
            verify(
                &receiver,
                &header,
                TS,
                NOW + MAX_AGE_SEC + 301,
                &cross(false)
            )
            .err()
            .map(|(reason, _)| reason),
            Some(CounterReason::RemoteStale)
        );
    }

    #[test]
    fn a_body_reference_message_is_signed_under_its_own_domain_with_an_optional_signed_wake() {
        let sender = state_root("ref-sender");
        let receiver = state_root("ref-receiver");
        let machine = machine::read(&sender).unwrap();
        let from_id = format!("{machine}/s1");
        let hash = "a".repeat(64);
        let reason =
            |result: Result<_, (CounterReason, String)>| result.err().map(|(reason, _)| reason);
        let header = |edit: &dyn Fn(&mut Value), domain: &str| {
            let mut payload = json!({
                "v": 3, "id": "r1", "from": { "id": from_id, "machine": machine },
                "to": { "id": "recv/abc", "machine": "recv" }, "kind": "message",
                "bodyHash": hash, "bodyBytes": 5, "sentAt": "2026-10-29T00:00:00.000Z",
            });
            edit(&mut payload);
            sign_payload(&sender, domain, payload).unwrap()
        };
        let plain = header(&|_| {}, SENT_DOMAIN_BODY_REF);
        let taken = verify(&receiver, &plain, TS, NOW, &cross(false)).expect(
            "a body reference from a seen machine is taken when confirmation is not required",
        );
        assert_eq!(
            taken.body,
            Body::Held {
                hash: hash.clone(),
                bytes: 5
            }
        );
        assert!(!taken.wake);
        assert_eq!(
            reason(verify(&receiver, &plain, TS, NOW, &cross(true))),
            Some(CounterReason::RemoteUnconfirmed)
        );

        // Wake rides the same domain as a signed field, and only a confirmed machine ever wakes.
        let woken = header(&|p| p["wake"] = json!(true), SENT_DOMAIN_BODY_REF);
        assert!(
            !verify(&receiver, &woken, TS, NOW, &cross(false))
                .unwrap()
                .wake
        );
        let fingerprint = signing::key_fingerprint(&sender).unwrap().unwrap();
        pins::confirm(&receiver, &machine, &fingerprint).unwrap();
        assert!(
            verify(&receiver, &woken, TS, NOW, &cross(true))
                .unwrap()
                .wake
        );

        let malformed = |edit: &dyn Fn(&mut Value)| {
            reason(verify(
                &receiver,
                &header(edit, SENT_DOMAIN_BODY_REF),
                TS,
                NOW,
                &cross(true),
            ))
        };
        let expect = Some(CounterReason::RemoteMalformed);
        assert_eq!(malformed(&|p| p["body"] = json!("inline too")), expect);
        assert_eq!(malformed(&|p| p["wake"] = json!(false)), expect);
        assert_eq!(
            malformed(&|p| p["bodyHash"] = json!("A".repeat(64))),
            expect
        );
        assert_eq!(
            malformed(&|p| p["bodyHash"] = json!("a".repeat(63))),
            expect
        );
        assert_eq!(malformed(&|p| p["bodyBytes"] = json!("5")), expect);
        assert_eq!(malformed(&|p| p["bodyBytes"] = json!(2049)), expect);
        assert_eq!(
            malformed(&|p| {
                p.as_object_mut().unwrap().remove("bodyBytes");
            }),
            expect
        );
        assert_eq!(
            reason(verify(
                &receiver,
                &header(&|_| {}, SENT_DOMAIN),
                TS,
                NOW,
                &cross(true)
            )),
            Some(CounterReason::RemoteSignature),
            "version 3 is not valid under the version 1 domain"
        );
    }
}
