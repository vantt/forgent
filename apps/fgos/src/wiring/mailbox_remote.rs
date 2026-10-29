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
//! Order matters. The attempt is counted (and saved) in one hold of the
//! record before anything is written to the store, so a failure between the
//! two can only over-count the sender, never let a cap be passed.
use super::identity_log::StoreLogDoor;
use super::mailbox_config::CrossMachine;
use fgos_identity::current::{current_session, machine_info};
use fgos_identity::pins::{self, PinState};
use fgos_identity::shared::{self, MachineRef};
use fgos_identity::text::{iso_utc_now, iso_utc_secs};
use fgos_identity::{project, signing, Refusal, Signature};
use fgos_mailbox::record::{Paths, Record, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{Limits, RemoteSend, Timestamp, WriterKey};
use serde_json::{json, Value};
use std::path::Path;

/// The stream of cross-machine mail and the type of the event a send appends.
pub const STREAM: &str = "project:mailbox";
pub const MESSAGE_SENT: &str = "mailbox.message-sent";
pub const MESSAGE_SETTLED: &str = "mailbox.message-settled";
/// Prefix of the signed bytes, so a mail signature is never valid for another purpose.
pub const SENT_DOMAIN: &str = "fgos-mailbox-message/1\n";
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
fn resolve(main: &Path, root: &Path, writer: &str, to: &str) -> Result<Option<Result<Target, Refusal>>, Refusal> {
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
        Ok(Target { id: listed.id, handle: listed.handle, machine: remote.machine, pin: remote.pin, fetched_at: remote.fetched_at })
    })))
}

/// The event payload of one message, signed.
fn sent_payload(root: &Path, id: &str, from: &str, machine: &MachineRef, target: &Target, body: &str, reply_to: Option<&str>) -> Result<Value, Refusal> {
    let mut payload = json!({
        "v": 1,
        "id": id,
        "from": { "id": from, "machine": machine.id },
        "to": { "id": target.id, "machine": target.machine.id },
        "kind": KIND,
        "body": body,
        "sentAt": iso_utc_now(),
    });
    if let Some(reply_to) = reply_to {
        payload["reply_to"] = Value::String(reply_to.to_owned());
    }
    sign_payload(root, SENT_DOMAIN, payload)
}

/// The signed event that tells a sender what its message came to on this machine: `outcome` is
/// `offered`, or `refused` with the refusal's code.
pub fn settled_payload(root: &Path, id: &str, machine: &str, outcome: &str, reason: Option<&str>) -> Result<Value, Refusal> {
    let mut payload = json!({ "v": 1, "id": id, "machine": machine, "outcome": outcome, "at": iso_utc_now() });
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
}

impl SentSummary {
    pub fn text(&self) -> String {
        let refused: usize = self.refused.values().sum();
        let reasons: Vec<String> = self.refused.iter().map(|(reason, n)| format!("{reason} {n}")).collect();
        let tail = if reasons.is_empty() { String::new() } else { format!(" ({})", reasons.join(", ")) };
        format!(
            "cross-machine: {} sent in the last 24 hours; {} offered, {} refused{tail}, {} waiting for the receiver's fetch",
            self.sent, self.offered, refused, self.waiting
        )
    }
}

/// This machine's sends of the last day and their settlements, read from the shared log. A send
/// counts only when it is in this machine's own origin; a settlement counts only when it verifies
/// under the settled domain and its signer is the machine the send went to. The latest settlement
/// of a message in the store's order decides.
pub fn sent_summary(main: &Path, root: &Path, now_secs: u64) -> Result<SentSummary, String> {
    let refusal = |r: Refusal| format!("{}: {}", r.reason, r.detail);
    let machine = machine_info(root).map_err(refusal)?.id;
    let Some(log) = StoreLogDoor.open_store(main, &machine, STREAM).map_err(refusal)? else {
        return Ok(SentSummary::default());
    };
    let (events, own_origin) = log.envelopes().map_err(refusal)?;
    let recent = |ts: &str| iso_utc_secs(ts).is_some_and(|at| now_secs.saturating_sub(at) <= 86_400);
    // id -> the machine it went to, and what the latest settlement of it says.
    let mut sent: std::collections::BTreeMap<String, (String, Option<Result<(), String>>)> = Default::default();
    for event in events.iter().filter(|e| e.event_type == MESSAGE_SENT && e.origin == own_origin && recent(&e.ts)) {
        let payload = &event.payload;
        if let (Some(id), Some(to)) = (payload["id"].as_str(), payload["to"]["machine"].as_str()) {
            sent.insert(id.to_owned(), (to.to_owned(), None));
        }
    }
    for event in events.iter().filter(|e| e.event_type == MESSAGE_SETTLED) {
        let payload = &event.payload;
        let (Some(id), Some(by), Some(outcome)) = (payload["id"].as_str(), payload["machine"].as_str(), payload["outcome"].as_str()) else {
            continue;
        };
        let Some((to, settled)) = sent.get_mut(id) else { continue };
        if to != by {
            continue;
        }
        let mut unsigned = payload.clone();
        let signature: Option<Signature> =
            unsigned.as_object_mut().and_then(|o| o.remove("sig")).and_then(|sig| serde_json::from_value(sig).ok());
        let verified = signature.as_ref().and_then(|sig| signed_bytes(SETTLED_DOMAIN, &unsigned).ok().and_then(|bytes| signing::verify(root, &bytes, sig).ok()));
        if verified.is_none_or(|v| v.machine_id != by) {
            continue;
        }
        *settled = match outcome {
            "offered" => Some(Ok(())),
            "refused" => Some(Err(payload["reason"].as_str().unwrap_or("unknown").to_owned())),
            _ => continue,
        };
    }
    let mut summary = SentSummary { sent: sent.len(), ..Default::default() };
    for (_, settled) in sent.into_values() {
        match settled {
            None => summary.waiting += 1,
            Some(Ok(())) => summary.offered += 1,
            Some(Err(reason)) => *summary.refused.entry(reason).or_default() += 1,
        }
    }
    Ok(summary)
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
fn recorded_text(id: &str, target: &Target, cross: &CrossMachine) -> String {
    let pin = match target.pin {
        PinState::Confirmed => String::new(),
        PinState::Seen => " That machine's key is only seen, not confirmed here; the owner confirms it with `fgos identity pins`, and a receiver that requires confirmed keys drops mail from an unconfirmed machine.".to_owned(),
    };
    format!(
        "recorded {id} for {} on {}. It crosses machines: written to the project's shared log and pushed in the background, so it is recorded, not delivered. It reaches {} after that machine's next fetch, about every {} seconds while an fgOS process runs there and later when none does.{pin}",
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

/// Sends `body` to the session `to` names on another machine, when one
/// does; see the module's comment. `from` is the caller's full session id.
pub fn send(ctx: &Context<'_>, from: &WriterKey, to: &str, body: &str, reply_to: Option<&str>) -> Outcome {
    let Context { fgos_dir, record, limits, cross, wait, now } = *ctx;
    if !cross.enabled {
        return Outcome::NotRemote;
    }
    let (Some(main), Some(root)) = (fgos_dir.parent(), super::mailbox_identity::state_root()) else {
        return Outcome::NotRemote;
    };
    let target = match resolve(main, &root, from.as_str(), to) {
        Ok(Some(Ok(target))) => target,
        Ok(Some(Err(refusal))) if refusal.reason == "ambiguous" => {
            return Outcome::Refused(format!("not recorded: {}", refusal_line(&refusal)));
        }
        Ok(None) | Ok(Some(Err(_))) => return Outcome::NotRemote,
        Err(refusal) => return Outcome::Refused(format!("not recorded: {}", refusal_line(&refusal))),
    };
    let label = format!("{}@{}", target.handle, target.machine.id);
    let req = RemoteSend { from, body_bytes: body.len() as u64, max_body_bytes: WIRE_MAX_BODY_BYTES, to: &label };
    let id = match verbs::admit_remote(record, &req, wait, now, limits) {
        Ok(id) => id,
        Err(text) => return Outcome::Refused(text),
    };
    let appended = (|| {
        let machine = MachineRef::from(&machine_info(&root)?);
        // The writer key attributes the append; the event names the sender by its full session id,
        // which the receiver checks against the signer's machine.
        let session = current_session(&root, std::process::id(), Some(fgos_dir))?;
        let payload = sent_payload(&root, id.as_str(), &session.info.id, &machine, &target, body, reply_to)?;
        let log = StoreLogDoor
            .open_stream(main, from.as_str(), STREAM)?
            .ok_or_else(|| Refusal { reason: "event-store-unavailable", detail: "this clone has no Event Store".into(), candidates: Vec::new() })?;
        log.append(MESSAGE_SENT, payload)
    })();
    match appended {
        Ok(()) => {
            super::mailbox_sync::spawn(main, &Paths::new(fgos_dir), &cross.remote);
            Outcome::Recorded(recorded_text(id.as_str(), &target, cross))
        }
        Err(refusal) => Outcome::Refused(format!("not recorded: {}", refusal_line(&refusal))),
    }
}

#[cfg(test)]
mod tests {
    use super::{SENT_DOMAIN, SETTLED_DOMAIN, WIRE_MAX_BODY_BYTES};

    #[test]
    fn the_wire_cap_and_signing_domain_equal_the_remote_contract() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/mailbox/contracts/remote.v1.json");
        let contract: serde_json::Value = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
        let cap = contract["limits"]
            .as_array()
            .unwrap()
            .iter()
            .find(|limit| limit["key"] == "mailbox.remote.maxBodyBytes")
            .expect("the contract names the wire cap");
        assert_eq!(cap["default"], WIRE_MAX_BODY_BYTES);
        let domain = contract["types"].as_array().unwrap().iter().find(|t| t["type"] == "mailbox.message-sent").unwrap();
        assert_eq!(domain["signingDomain"], SENT_DOMAIN);
        let settled = contract["types"].as_array().unwrap().iter().find(|t| t["type"] == "mailbox.message-settled").unwrap();
        assert_eq!(settled["signingDomain"], SETTLED_DOMAIN);
    }
}
