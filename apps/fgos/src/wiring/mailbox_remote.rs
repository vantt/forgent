//! Mail to a session on another machine: the recipient is found in the
//! shared directory Identity folds from `project:identity`, the message is
//! counted against the sender's caps, signed with this machine's key and
//! appended to stream `project:mailbox` as `mailbox.message-sent`
//! (`packages/mailbox/contracts/remote.v1.json`), then the detached sync
//! child is started to push it. The answer says "recorded", never
//! "delivered": the message reaches the recipient after that machine's next
//! fetch. A local head always wins: this runs only for a name no head of
//! this record answers.
//!
//! With `mailbox.remote.bodyRef` on, the body is not in the event: it is pushed to this machine's
//! mail-body ref first, and the event, version 3, is appended only once the remote acknowledged
//! that push (`mailbox_body::publish`).
//!
//! Order matters. The attempt is counted (and saved) in one hold of the
//! record before anything is written to the store, so a failure between the
//! two can only over-count the sender, never let a cap be passed.
use super::identity_log::StoreLogDoor;
use super::mailbox_body;
use super::mailbox_config::CrossMachine;
use fgos_identity::current::{current_session, machine_info};
use fgos_identity::pins::{self, PinState};
use fgos_identity::shared::{self, MachineRef};
use fgos_identity::text::{iso_utc_now, iso_utc_secs};
use fgos_identity::{project, signing, Refusal, Signature};
use fgos_mailbox::record::{Paths, Record, Reported, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{
    record_error_text, refusal_text, Limits, MessageId, Refusal as MailRefusal, RemoteAck,
    RemoteOffer, RemoteRefusedAck, RemoteSend, Timestamp, WriterKey,
};
use serde_json::{json, Value};
use std::path::Path;

/// The stream of cross-machine mail and the type of the event a send appends.
pub const STREAM: &str = "project:mailbox";
pub const MESSAGE_SENT: &str = "mailbox.message-sent";
pub const MESSAGE_SETTLED: &str = "mailbox.message-settled";
/// Prefix of the signed bytes, so a mail signature is never valid for another purpose.
pub const SENT_DOMAIN: &str = "fgos-mailbox-message/1\n";
/// Only a send that asks for a wake is signed under this domain, as payload version 2; every other
/// send stays version 1, so a receiver that does not know version 2 still takes plain mail and
/// never reads a wake mail without its wake flag.
pub const SENT_DOMAIN_WAKE: &str = "fgos-mailbox-message/2\n";
/// A payload that carries the hash and length of its body instead of the body, as version 3. The
/// wake flag, when asked, is a signed field of the payload, not a second domain.
pub const SENT_DOMAIN_BODY_REF: &str = "fgos-mailbox-message/3\n";
/// The payload versions of `mailbox.message-sent` this build takes from other machines.
pub const ACCEPTED_PAYLOAD_VERSIONS: [u64; 3] = [1, 2, 3];
pub const SETTLED_DOMAIN: &str = "fgos-mailbox-settled/1\n";
/// `mailbox.remote.maxBodyBytes` of the wire contract.
pub const WIRE_MAX_BODY_BYTES: u64 = 2048;
/// The kind a message of the same-machine mailbox has.
const KIND: &str = "message";

/// A session of another machine, as the shared directory names it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Target {
    pub id: String,
    pub handle: String,
    pub machine: MachineRef,
    pub pin: PinState,
    /// When this clone last fetched the other machines' events.
    pub fetched_at: Option<String>,
}

/// What a send to a name no local head answers became.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Outcome {
    /// Nothing remote answers either (or mail cannot cross machines here):
    /// the caller keeps its own refusal.
    NotRemote,
    Recorded(String),
    Refused(String),
}

fn refusal_line(refusal: &Refusal) -> String {
    format!("{}: {}", refusal.reason, refusal.detail)
}

/// The bytes a signature of `payload` (an object without `sig`) covers.
pub fn signed_bytes(domain: &str, payload: &Value) -> Result<Vec<u8>, Refusal> {
    let canonical = fgos_canonical_json::canonical_json(payload).map_err(|e| Refusal {
        reason: "invalid-payload",
        detail: e.to_string(),
        candidates: Vec::new(),
    })?;
    Ok(format!("{domain}{canonical}").into_bytes())
}

/// `payload` with this machine's signature under `domain` added as `sig`.
pub fn sign_payload(root: &Path, domain: &str, mut payload: Value) -> Result<Value, Refusal> {
    let signature = signing::sign(root, &signed_bytes(domain, &payload)?)?;
    payload["sig"] = serde_json::to_value(signature).expect("Signature always serializes");
    Ok(payload)
}

/// The one session of another machine `to` names (a handle, a role alias or a
/// full id), folded directly from the project's shared log rather than read
/// from the cache; `Ok(None)` when the clone has no store to fold.
fn resolve(
    main: &Path,
    root: &Path,
    writer: &str,
    to: &str,
) -> Result<Option<Result<Target, Refusal>>, Refusal> {
    let Some(log) = StoreLogDoor.open_stream(main, writer, shared::STREAM)? else {
        return Ok(None);
    };
    let (project, _) = project::project_at(root, main)?;
    let (events, fetched_at) = log.read()?;
    let cache = shared::read_cache(&shared::cache_path(main));
    let mut view = shared::fold(root, &events, fetched_at, cache.as_ref());
    view.retain_project(&project.id);
    Ok(Some(view.resolve(to).and_then(|listed| {
        let remote = listed.remote.ok_or_else(|| Refusal {
            reason: "not-found",
            detail: format!("{to:?} names a session of this machine"),
            candidates: Vec::new(),
        })?;
        Ok(Target {
            id: listed.id,
            handle: listed.handle,
            machine: remote.machine,
            pin: remote.pin,
            fetched_at: remote.fetched_at,
        })
    })))
}

/// What one message says, apart from who it is for.
struct Outgoing<'a> {
    id: &'a str,
    /// The sender's full session id.
    from: &'a str,
    body: &'a str,
    reply_to: Option<&'a str>,
    wake: bool,
    /// The seconds the sender gives the recipient to reply, signed with the rest.
    ack_within: Option<u64>,
    /// The body is kept in this machine's mail-body ref and the event carries only its hash and
    /// length.
    body_ref: bool,
}

/// The event payload of one message, signed. A message whose body is kept in the mail-body ref is
/// version 3 under its own domain, a wake being a signed field of it; otherwise a message that
/// asks for a wake is version 2 under its own domain and any other is version 1.
fn sent_payload(
    root: &Path,
    msg: &Outgoing<'_>,
    machine: &MachineRef,
    target: &Target,
) -> Result<Value, Refusal> {
    let wake = msg.wake;
    let (version, domain) = match (msg.body_ref, wake) {
        (true, _) => (3, SENT_DOMAIN_BODY_REF),
        (false, true) => (2, SENT_DOMAIN_WAKE),
        (false, false) => (1, SENT_DOMAIN),
    };
    let mut payload = json!({
        "v": version,
        "id": msg.id,
        "from": { "id": msg.from, "machine": machine.id },
        "to": { "id": target.id, "machine": target.machine.id },
        "kind": KIND,
        "sentAt": iso_utc_now(),
    });
    if msg.body_ref {
        payload["bodyHash"] = Value::String(mailbox_body::sha256_hex(msg.body.as_bytes()));
        payload["bodyBytes"] = Value::from(msg.body.len());
    } else {
        payload["body"] = Value::String(msg.body.to_owned());
    }
    if let Some(reply_to) = msg.reply_to {
        payload["reply_to"] = Value::String(reply_to.to_owned());
    }
    if wake {
        payload["wake"] = Value::Bool(true);
    }
    // The request rides whichever version the message is, under that version's domain.
    if let Some(secs) = msg.ack_within {
        payload["ackWithinSec"] = Value::from(secs);
    }
    sign_payload(root, domain, payload)
}

/// The signed event that tells a sender what its message came to on this machine: `outcome` is
/// `offered`, or `refused` with the refusal's code.
pub fn settled_payload(
    root: &Path,
    id: &str,
    machine: &str,
    outcome: &str,
    reason: Option<&str>,
) -> Result<Value, Refusal> {
    let mut payload =
        json!({ "v": 1, "id": id, "machine": machine, "outcome": outcome, "at": iso_utc_now() });
    if let Some(reason) = reason {
        payload["reason"] = Value::String(reason.to_owned());
    }
    sign_payload(root, SETTLED_DOMAIN, payload)
}

/// What this machine's recent cross-machine sends came to, folded from the shared log: each send
/// is `waiting` until its recipient's machine signed a settlement for it.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct SentSummary {
    pub sent: usize,
    pub offered: usize,
    pub waiting: usize,
    /// Refusals by the receiver's reason code.
    pub refused: std::collections::BTreeMap<String, usize>,
    /// The most recent sends, oldest first, one per message.
    pub recent: Vec<SentRow>,
}

/// What became of one send: when it left, who it went to and the receiving machine's answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SentRow {
    pub id: String,
    /// The recipient's full session id.
    pub to: String,
    pub sent_secs: u64,
    pub preview: String,
    pub answer: Answer,
    /// The seconds the send gave its recipient to reply, when it asked for a reply.
    pub ack_within_sec: Option<u64>,
}

/// The receiving machine's signed settlement of a send, with the time it signed it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Answer {
    None,
    Offered(u64),
    Refused(String, u64),
}

/// How many sends `fgos mailbox status` lists.
const RECENT_SENDS: usize = 8;
const PREVIEW_CHARS: usize = 60;
/// What a listed send shows in place of a body that is kept in the mail-body ref, not in the event.
const BODY_REF_PREVIEW: &str = "(body in the mail-body ref)";

impl SentSummary {
    pub fn text(&self) -> String {
        let refused: usize = self.refused.values().sum();
        let reasons: Vec<String> = self
            .refused
            .iter()
            .map(|(reason, n)| format!("{reason} {n}"))
            .collect();
        let tail = if reasons.is_empty() {
            String::new()
        } else {
            format!(" ({})", reasons.join(", "))
        };
        format!(
            "cross-machine: {} sent in the last 24 hours; {} offered, {} refused{tail}, {} with no answer yet from the receiving machine",
            self.sent, self.offered, refused, self.waiting
        )
    }

    /// The recent sends as the envelope carries them.
    pub fn recent_json(&self) -> Value {
        self.recent
            .iter()
            .map(|row| {
                let answer = match &row.answer {
                    Answer::None => json!({ "state": "none" }),
                    Answer::Offered(at) => json!({ "state": "offered", "at": at }),
                    Answer::Refused(reason, at) => {
                        json!({ "state": "refused", "reason": reason, "at": at })
                    }
                };
                let mut json = json!({ "id": row.id, "to": row.to, "sentSecs": row.sent_secs, "preview": row.preview, "answer": answer });
                if let Some(secs) = row.ack_within_sec {
                    json["ackWithinSec"] = Value::from(secs);
                }
                json
            })
            .collect()
    }

    /// One line per recent send: its age, the recipient, the start of the body and what the
    /// receiving machine answered, with the seconds the answer took.
    pub fn recent_lines(&self, now_secs: u64) -> Vec<String> {
        self.recent
            .iter()
            .map(|row| {
                let age = now_secs.saturating_sub(row.sent_secs);
                let took = |at: u64| at.saturating_sub(row.sent_secs);
                let answer = match &row.answer {
                    Answer::None => "no answer yet".to_owned(),
                    Answer::Offered(at) => format!("offered to the session after {} s", took(*at)),
                    Answer::Refused(reason, at) => {
                        format!("refused ({}) after {} s", printable(reason), took(*at))
                    }
                };
                let to = row.to.rsplit('/').next().unwrap_or(&row.to);
                let ack = row.ack_within_sec.map_or_else(String::new, |secs| {
                    format!(" [reply wanted within {}]", ago(secs))
                });
                format!(
                    "  sent {} ago to {} \"{}\"{ack}: {answer}",
                    ago(age),
                    printable(&to.chars().take(8).collect::<String>()),
                    printable(&row.preview)
                )
            })
            .collect()
    }
}

/// Text from a message body or a receiver's reason reaches the terminal on one row: a control
/// character (newline, escape) becomes a space so it can neither split the row nor drive the terminal.
fn printable(text: &str) -> String {
    text.chars()
        .map(|c| if c.is_control() { ' ' } else { c })
        .collect()
}

pub(super) fn ago(secs: u64) -> String {
    match secs {
        0..=119 => format!("{secs} s"),
        120..=7199 => format!("{} min", secs / 60),
        _ => format!("{} h", secs / 3600),
    }
}

/// What a receiving machine signed about one message this machine sent.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VerifiedSettlement {
    pub id: String,
    /// The machine that signed it, which is the one the message went to.
    pub machine: String,
    /// `offered` or `refused`.
    pub outcome: String,
    pub reason: Option<String>,
    /// When the receiving machine signed it, in seconds.
    pub at: u64,
}

/// The settlement `payload` carries, when `wanted(id, machine)` names a message and the machine
/// it went to and the signature verifies under the settled domain as that machine's own. The
/// signature is checked last, only for a settlement somebody asked about.
fn verified_settlement(
    root: &Path,
    payload: &Value,
    wanted: impl Fn(&str, &str) -> bool,
) -> Option<VerifiedSettlement> {
    let (id, by, outcome) = (
        payload["id"].as_str()?,
        payload["machine"].as_str()?,
        payload["outcome"].as_str()?,
    );
    if !wanted(id, by) || !signed_by(root, by, SETTLED_DOMAIN, payload) {
        return None;
    }
    Some(VerifiedSettlement {
        id: id.to_owned(),
        machine: by.to_owned(),
        outcome: outcome.to_owned(),
        reason: payload["reason"].as_str().map(str::to_owned),
        at: payload["at"].as_str().and_then(iso_utc_secs).unwrap_or(0),
    })
}

/// What the machines `watched` messages went to signed for them.
#[derive(Debug, Default)]
pub struct SignedSettlements {
    pub offers: Vec<RemoteOffer>,
    pub refusals: Vec<RemoteRefusedAck>,
}

/// The settlements the machines `watched` messages went to signed for them, read from the shared
/// log: each `(id, machine)` of `watched` that the machine itself reported offered (with the time
/// it signed) or refused. Only a verified settlement under the settled domain counts.
pub fn signed_settlements(
    main: &Path,
    root: &Path,
    watched: &[(MessageId, String)],
) -> Result<SignedSettlements, String> {
    let refusal = |r: Refusal| format!("{}: {}", r.reason, r.detail);
    let machine = machine_info(root).map_err(refusal)?.id;
    let Some(log) = StoreLogDoor
        .open_store(main, &machine, STREAM)
        .map_err(refusal)?
    else {
        return Ok(SignedSettlements::default());
    };
    let (events, _) = log.envelopes().map_err(refusal)?;
    let wanted = |id: &str, by: &str| {
        watched
            .iter()
            .any(|(watched_id, to)| watched_id.as_str() == id && to == by)
    };
    let mut found = SignedSettlements::default();
    for event in events.iter().filter(|e| e.event_type == MESSAGE_SETTLED) {
        let Some(settlement) = verified_settlement(root, &event.payload, wanted) else {
            continue;
        };
        let id = MessageId::from_text(&settlement.id);
        if settlement.outcome == "refused" {
            found.refusals.push(RemoteRefusedAck {
                id,
                machine: settlement.machine,
            });
            continue;
        }
        if settlement.outcome != "offered" || settlement.at == 0 {
            continue;
        }
        // The earliest offer a machine signed for a message is when it was first offered.
        let at = Timestamp::from_millis(settlement.at.saturating_mul(1000));
        match found
            .offers
            .iter_mut()
            .find(|o| o.id == id && o.machine == settlement.machine)
        {
            Some(held) => held.at = held.at.min(at),
            None => found.offers.push(RemoteOffer {
                id,
                machine: settlement.machine,
                at,
            }),
        }
    }
    Ok(found)
}

/// This machine's sends of the last day and their settlements, read from the shared log. A send
/// counts only when it is in this machine's own origin; a settlement counts only when it verifies
/// under the settled domain and its signer is the machine the send went to. The latest settlement
/// of a message in the store's order decides.
pub fn sent_summary(main: &Path, root: &Path, now_secs: u64) -> Result<SentSummary, String> {
    let refusal = |r: Refusal| format!("{}: {}", r.reason, r.detail);
    let machine = machine_info(root).map_err(refusal)?.id;
    let Some(log) = StoreLogDoor
        .open_store(main, &machine, STREAM)
        .map_err(refusal)?
    else {
        return Ok(SentSummary::default());
    };
    let (events, own_origin) = log.envelopes().map_err(refusal)?;
    let recent =
        |ts: &str| iso_utc_secs(ts).is_some_and(|at| now_secs.saturating_sub(at) <= 86_400);
    // id -> the machine it went to, and what the latest settlement of it says.
    let mut sent: std::collections::BTreeMap<String, (String, Option<Result<(), String>>)> =
        Default::default();
    let mut rows: Vec<SentRow> = Vec::new();
    let mut answered_at: std::collections::BTreeMap<String, u64> = Default::default();
    for event in events
        .iter()
        .filter(|e| e.event_type == MESSAGE_SENT && e.origin == own_origin && recent(&e.ts))
    {
        let payload = &event.payload;
        if let (Some(id), Some(to)) = (payload["id"].as_str(), payload["to"]["machine"].as_str()) {
            sent.insert(id.to_owned(), (to.to_owned(), None));
            rows.push(SentRow {
                id: id.to_owned(),
                to: payload["to"]["id"].as_str().unwrap_or_default().to_owned(),
                sent_secs: iso_utc_secs(&event.ts).unwrap_or(0),
                preview: payload["body"]
                    .as_str()
                    .unwrap_or(BODY_REF_PREVIEW)
                    .chars()
                    .take(PREVIEW_CHARS)
                    .collect(),
                answer: Answer::None,
                ack_within_sec: payload["ackWithinSec"].as_u64(),
            });
        }
    }
    for event in events.iter().filter(|e| e.event_type == MESSAGE_SETTLED) {
        let wanted = |id: &str, by: &str| sent.get(id).is_some_and(|(to, _)| to == by);
        let Some(settlement) = verified_settlement(root, &event.payload, wanted) else {
            continue;
        };
        let settled = match settlement.outcome.as_str() {
            "offered" => Ok(()),
            "refused" => Err(settlement.reason.unwrap_or_else(|| "unknown".to_owned())),
            _ => continue,
        };
        answered_at.insert(settlement.id.clone(), settlement.at);
        if let Some((_, state)) = sent.get_mut(&settlement.id) {
            *state = Some(settled);
        }
    }
    let mut summary = SentSummary {
        sent: sent.len(),
        ..Default::default()
    };
    for row in &mut rows {
        let at = answered_at.get(&row.id).copied().unwrap_or(0);
        row.answer = match sent.get(&row.id).and_then(|(_, settled)| settled.as_ref()) {
            None => Answer::None,
            Some(Ok(())) => Answer::Offered(at),
            Some(Err(reason)) => Answer::Refused(reason.clone(), at),
        };
    }
    for (_, settled) in sent.into_values() {
        match settled {
            None => summary.waiting += 1,
            Some(Ok(())) => summary.offered += 1,
            Some(Err(reason)) => *summary.refused.entry(reason).or_default() += 1,
        }
    }
    let skip = rows.len().saturating_sub(RECENT_SENDS);
    summary.recent = rows.split_off(skip);
    Ok(summary)
}

/// When each body this machine sent through its mail-body ref was sent: the body's hash to the time,
/// in seconds, of the newest `mailbox.message-sent` event that names it. Every clone of a machine
/// shares its state root and key but has its own store origin, so an event counts whatever origin
/// holds it, provided its payload names this machine as the sender and its signature verifies under
/// this machine's key: a header another machine or a forger wrote keeps no body alive. The time is
/// the event's signed `sentAt`; an event that lacks one falls back to the store's timestamp. A hash
/// no such event names is absent. The newest send decides because the same text sent twice is one
/// blob that both messages need.
pub fn body_sent_times(
    main: &Path,
    root: &Path,
) -> Result<std::collections::BTreeMap<String, u64>, String> {
    let refusal = |r: Refusal| format!("{}: {}", r.reason, r.detail);
    let machine = machine_info(root).map_err(refusal)?.id;
    let mut times = std::collections::BTreeMap::new();
    let Some(log) = StoreLogDoor
        .open_store(main, &machine, STREAM)
        .map_err(refusal)?
    else {
        return Ok(times);
    };
    let (events, _) = log.envelopes().map_err(refusal)?;
    for event in events.iter().filter(|e| e.event_type == MESSAGE_SENT) {
        let payload = &event.payload;
        let Some(hash) = payload["bodyHash"].as_str() else {
            continue;
        };
        if payload["from"]["machine"].as_str() != Some(machine.as_str())
            || !signed_by(root, &machine, SENT_DOMAIN_BODY_REF, payload)
        {
            continue;
        }
        let sent = payload["sentAt"]
            .as_str()
            .and_then(iso_utc_secs)
            .or_else(|| iso_utc_secs(&event.ts));
        // A header whose time cannot be read has no age to expire by; it is read as sent now.
        let sent = sent.unwrap_or(u64::MAX);
        let newest = times.entry(hash.to_owned()).or_insert(sent);
        *newest = (*newest).max(sent);
    }
    Ok(times)
}

/// Whether `payload` carries a signature under `domain` made by the key of `machine`. The key of
/// another machine is never looked at, so nothing is pinned by this check.
fn signed_by(root: &Path, machine: &str, domain: &str, payload: &Value) -> bool {
    let mut unsigned = payload.clone();
    let signature: Option<Signature> = unsigned
        .as_object_mut()
        .and_then(|o| o.remove("sig"))
        .and_then(|sig| serde_json::from_value(sig).ok());
    signature
        .filter(|sig| sig.machine_id == machine)
        .and_then(|sig| {
            let bytes = signed_bytes(domain, &unsigned).ok()?;
            signing::verify(root, &bytes, &sig).ok()
        })
        .is_some_and(|verified| verified.machine_id == machine)
}

/// The machines whose key this machine pinned as seen and never confirmed: mail from them is
/// refused while `mailbox.remote.requireConfirmed` holds, so the owner has to confirm each one
/// (after comparing the fingerprint the machine itself reports) or leave it out.
pub fn unconfirmed_machines(root: &Path) -> Vec<(String, String)> {
    pins::list(root)
        .unwrap_or_default()
        .into_iter()
        .filter(|pin| pin.state == PinState::Seen)
        .map(|pin| (pin.machine_id, pin.fingerprint))
        .collect()
}

/// The text a recorded cross-machine send answers with.
fn recorded_text(
    id: &str,
    target: &Target,
    cross: &CrossMachine,
    wake: bool,
    need_ack: Option<u64>,
) -> String {
    let pin = match target.pin {
        PinState::Confirmed => String::new(),
        PinState::Seen => " That machine's key is only seen, not confirmed here; the owner confirms it with `fgos identity pins`, and a receiver that requires confirmed keys drops mail from an unconfirmed machine.".to_owned(),
    };
    let wake = if wake {
        " Wake requested: that machine decides whether to nudge the session when the mail arrives, within its own wake limits; if not, the session sees the mail at its next tool call."
    } else {
        ""
    };
    let ack = need_ack.map_or_else(String::new, |secs| {
        format!(
            " Reply wanted within {}: you are told if it is not acknowledged; that is judged after a sync of this machine fetched the answer, not at the second.",
            ago(secs)
        )
    });
    format!(
        "recorded {id} for {} on {}. It crosses machines: written to the project's shared log and pushed in the background, so it is recorded, not delivered. It reaches {} after that machine's next fetch, about every {} seconds while an fgOS process runs there and later when none does.{wake}{ack}{pin}",
        target.handle, target.machine.handle, target.handle, cross.sync_interval_sec
    )
}

/// What a send runs against: the project, its record and limits, the
/// cross-machine config, and the clock and lock wait of this call.
pub struct Context<'a> {
    pub fgos_dir: &'a Path,
    pub record: &'a Record,
    pub limits: &'a Limits,
    pub cross: &'a CrossMachine,
    pub wait: Wait,
    pub now: Timestamp,
}

/// The id `machine` gave the message that `hint` names in this record, when `from` was offered it
/// from that machine; nothing is marked. A hint that names nothing of the kind is refused like a
/// same-machine hint is.
fn reply_parent(
    ctx: &Context<'_>,
    from: &WriterKey,
    hint: &str,
    machine: &str,
) -> Result<String, String> {
    let held = ctx
        .record
        .hold(ctx.wait, ctx.now, ctx.limits, |state, _| {
            let generation = state.binding(from).map(|binding| binding.generation);
            Reported::unchanged(state.remote_reply_parent(
                from,
                generation,
                &MessageId::from_text(hint),
                machine,
            ))
        })
        .map_err(|error| record_error_text(error.code()))?;
    held.value
        .value
        .ok_or_else(|| refusal_text(&MailRefusal::ReplyToNotOffered, ctx.limits))
}

/// Marks the message `hint` names answered, after the reply has left. A failure to record the mark
/// does not undo the sent reply; the original then stays unanswered, as before.
fn mark_answered(ctx: &Context<'_>, hint: &str) {
    let _ = ctx
        .record
        .hold(ctx.wait, ctx.now, ctx.limits, |state, _| Reported {
            changed: state.mark_answered(&MessageId::from_text(hint)),
            value: (),
        });
}

/// Sends `body` to the session `to` names on another machine, when one
/// does; see the module's comment. `from` is the caller's full session id.
pub fn send(
    ctx: &Context<'_>,
    from: &WriterKey,
    to: &str,
    body: &str,
    reply_to: Option<&str>,
    wake: bool,
    need_ack: Option<u64>,
) -> Outcome {
    let Context {
        fgos_dir,
        record,
        limits,
        cross,
        wait,
        now,
    } = *ctx;
    if !cross.enabled {
        return Outcome::NotRemote;
    }
    let (Some(main), Some(root)) = (fgos_dir.parent(), super::mailbox_identity::state_root())
    else {
        return Outcome::NotRemote;
    };
    let target = match resolve(main, &root, from.as_str(), to) {
        Ok(Some(Ok(target))) => target,
        Ok(Some(Err(refusal))) if refusal.reason == "ambiguous" => {
            return Outcome::Refused(format!("not recorded: {}", refusal_line(&refusal)));
        }
        Ok(None) | Ok(Some(Err(_))) => return Outcome::NotRemote,
        Err(refusal) => {
            return Outcome::Refused(format!("not recorded: {}", refusal_line(&refusal)))
        }
    };
    // A reply names the message it answers by this record's id; the recipient's machine knows it by
    // the id that machine gave it, which is what goes on the wire.
    let hint = reply_to;
    let reply_to = match hint {
        None => None,
        Some(hint) => match reply_parent(ctx, from, hint, &target.machine.id) {
            Ok(origin_id) => Some(origin_id),
            Err(text) => return Outcome::Refused(text),
        },
    };
    // The receiver drops a request longer than the age it accepts mail at, so the sender refuses
    // one that long instead of sending mail whose request nobody would read.
    if let Some(secs) = need_ack.filter(|secs| *secs > super::mailbox_ingest::MAX_AGE_SEC) {
        return Outcome::Refused(format!(
            "not recorded: --reply-by {secs}s is longer than mail to another machine can wait: at most {}s",
            super::mailbox_ingest::MAX_AGE_SEC
        ));
    }
    let label = format!("{}@{}", target.handle, target.machine.id);
    let to_key = target
        .id
        .split_once('/')
        .and_then(|(_, local)| WriterKey::new(local).ok());
    let hint_id = hint.map(MessageId::from_text);
    let ack = match (need_ack, to_key.as_ref()) {
        (None, _) => None,
        (Some(within_sec), Some(to)) => Some(RemoteAck {
            within_sec,
            to,
            machine: &target.machine.id,
            reply_to: hint_id.as_ref(),
        }),
        (Some(_), None) => {
            return Outcome::Refused(format!(
                "not recorded: {} has a session id this mailbox cannot watch for a reply",
                target.handle
            ))
        }
    };
    let req = RemoteSend {
        from,
        body_bytes: body.len() as u64,
        max_body_bytes: WIRE_MAX_BODY_BYTES,
        to: &label,
        ack,
    };
    let id = match verbs::admit_remote(record, &req, wait, now, limits) {
        Ok(id) => id,
        Err(text) => return Outcome::Refused(text),
    };
    let appended = (|| {
        let machine = MachineRef::from(&machine_info(&root)?);
        // The writer key attributes the append; the event names the sender by its full session id,
        // which the receiver checks against the signer's machine.
        let session = current_session(&root, std::process::id(), Some(fgos_dir))?;
        let msg = Outgoing {
            id: id.as_str(),
            from: &session.info.id,
            body,
            reply_to: reply_to.as_deref(),
            wake,
            ack_within: need_ack,
            body_ref: cross.body_ref,
        };
        let payload = sent_payload(&root, &msg, &machine, &target)?;
        // The event names a body that has to be readable by the time any machine can read the
        // event, so the body is on the remote, acknowledged, before the event exists: a push that
        // fails or is refused records nothing, and no later sync can publish a header whose body
        // was never published.
        if cross.body_ref {
            mailbox_body::publish(main, &cross.remote, &machine.id, body).map_err(|why| {
                Refusal {
                    reason: "body-not-published",
                    detail: format!(
                        "{why}; retry when the remote is reachable, or set mailbox.remote.bodyRef to false to send the body inside the event"
                    ),
                    candidates: Vec::new(),
                }
            })?;
        }
        let log = StoreLogDoor
            .open_stream(main, from.as_str(), STREAM)?
            .ok_or_else(|| Refusal {
                reason: "event-store-unavailable",
                detail: "this clone has no Event Store".into(),
                candidates: Vec::new(),
            })?;
        log.append(MESSAGE_SENT, payload)
    })();
    match appended {
        Ok(()) => {
            if let Some(hint) = hint {
                mark_answered(ctx, hint);
            }
            super::mailbox_sync::spawn(main, &Paths::new(fgos_dir), &cross.remote);
            Outcome::Recorded(recorded_text(id.as_str(), &target, cross, wake, need_ack))
        }
        Err(refusal) => Outcome::Refused(format!("not recorded: {}", refusal_line(&refusal))),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        printable, sent_payload, signed_bytes, Outgoing, Target, ACCEPTED_PAYLOAD_VERSIONS,
        SENT_DOMAIN, SENT_DOMAIN_BODY_REF, SENT_DOMAIN_WAKE, SETTLED_DOMAIN, WIRE_MAX_BODY_BYTES,
    };
    use fgos_identity::pins::PinState;
    use fgos_identity::shared::MachineRef;
    use fgos_identity::{machine, signing, Signature};
    use serde_json::Value;

    #[test]
    fn a_flagged_send_signs_ack_within_sec_under_its_versions_domain_and_an_unflagged_send_is_unchanged(
    ) {
        use std::os::unix::fs::PermissionsExt;
        let root = std::env::temp_dir().join(format!("fgos-remote-send-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
        machine::mint(&root, "sender").unwrap();
        signing::mint_key(&root).unwrap();
        let machine = MachineRef {
            id: machine::read(&root).unwrap(),
            handle: "sender".into(),
        };
        let target = Target {
            id: "peer/abc".into(),
            handle: "claude-ab12@peer".into(),
            machine: MachineRef {
                id: "peer".into(),
                handle: "peer".into(),
            },
            pin: PinState::Confirmed,
            fetched_at: None,
        };
        let payload = |wake: bool, body_ref: bool, ack_within: Option<u64>| {
            let msg = Outgoing {
                id: "m1",
                from: "sender/s1",
                body: "hello",
                reply_to: None,
                wake,
                ack_within,
                body_ref,
            };
            sent_payload(&root, &msg, &machine, &target).unwrap()
        };
        let signed_under = |payload: &Value, domain: &str| {
            let mut unsigned = payload.clone();
            let sig: Signature =
                serde_json::from_value(unsigned.as_object_mut().unwrap().remove("sig").unwrap())
                    .unwrap();
            let bytes = signed_bytes(domain, &unsigned).unwrap();
            signing::verify(&root, &bytes, &sig).is_ok()
        };
        // Plain mail is version 1, a wake version 2, a body in the mail-body ref version 3.
        for (wake, body_ref, version, domain) in [
            (false, false, 1, SENT_DOMAIN),
            (true, false, 2, SENT_DOMAIN_WAKE),
            (false, true, 3, SENT_DOMAIN_BODY_REF),
        ] {
            let flagged = payload(wake, body_ref, Some(600));
            assert_eq!(flagged["v"], version);
            assert_eq!(flagged["ackWithinSec"], 600);
            assert!(signed_under(&flagged, domain), "version {version}");
            let mut forged = flagged.clone();
            forged["ackWithinSec"] = Value::from(60);
            assert!(!signed_under(&forged, domain), "the request is signed");

            let plain = payload(wake, body_ref, None);
            assert_eq!(plain["v"], version);
            assert!(plain.get("ackWithinSec").is_none());
            assert!(signed_under(&plain, domain));
            let keys = |payload: &Value| -> Vec<String> {
                payload.as_object().unwrap().keys().cloned().collect()
            };
            let mut flagged_keys = keys(&flagged);
            flagged_keys.retain(|key| key != "ackWithinSec");
            assert_eq!(flagged_keys, keys(&plain));
        }
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn a_listed_send_keeps_to_one_row_with_no_terminal_control_characters() {
        assert_eq!(printable("a\nb\u{1b}[31mc"), "a b [31mc");
    }

    #[test]
    fn the_wire_cap_and_signing_domain_equal_the_remote_contract() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/mailbox/contracts/remote.v1.json");
        let contract: serde_json::Value =
            serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
        let cap = contract["limits"]
            .as_array()
            .unwrap()
            .iter()
            .find(|limit| limit["key"] == "mailbox.remote.maxBodyBytes")
            .expect("the contract names the wire cap");
        assert_eq!(cap["default"], WIRE_MAX_BODY_BYTES);
        let domain = contract["types"]
            .as_array()
            .unwrap()
            .iter()
            .find(|t| t["type"] == "mailbox.message-sent")
            .unwrap();
        assert_eq!(domain["signingDomain"], SENT_DOMAIN);
        assert_eq!(domain["wakeVersion"]["signingDomain"], SENT_DOMAIN_WAKE);
        assert_eq!(domain["wakeVersion"]["v"], 2);
        assert_eq!(
            domain["bodyRefVersion"]["signingDomain"],
            SENT_DOMAIN_BODY_REF
        );
        assert_eq!(domain["bodyRefVersion"]["v"], 3);
        // The acknowledgement request rides every version already accepted, adds no domain, and
        // is bounded by the age the receiver accepts.
        let request = &domain["ackRequest"];
        assert_eq!(request["field"], "ackWithinSec");
        assert_eq!(
            request["versions"],
            serde_json::json!(ACCEPTED_PAYLOAD_VERSIONS)
        );
        assert_eq!(request["minimum"], 1);
        assert_eq!(
            request["maximum"],
            crate::wiring::mailbox_ingest::MAX_AGE_SEC
        );
        assert!(request.get("signingDomain").is_none());
        assert!(domain["payload"]
            .as_array()
            .unwrap()
            .iter()
            .any(|field| field["field"] == "ackWithinSec"));
        let settled = contract["types"]
            .as_array()
            .unwrap()
            .iter()
            .find(|t| t["type"] == "mailbox.message-settled")
            .unwrap();
        assert_eq!(settled["signingDomain"], SETTLED_DOMAIN);
    }
}
