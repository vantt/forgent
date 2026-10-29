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
use fgos_identity::pins::PinState;
use fgos_identity::shared::{self, MachineRef};
use fgos_identity::text::iso_utc_now;
use fgos_identity::{project, signing, Refusal};
use fgos_mailbox::record::{Paths, Record, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{Limits, RemoteSend, Timestamp, WriterKey};
use serde_json::{json, Value};
use std::path::Path;

/// The stream of cross-machine mail and the type of the event a send appends.
pub const STREAM: &str = "project:mailbox";
pub const MESSAGE_SENT: &str = "mailbox.message-sent";
/// Prefix of the signed bytes, so a mail signature is never valid for another purpose.
pub const SENT_DOMAIN: &str = "fgos-mailbox-message/1\n";
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
    use super::{SENT_DOMAIN, WIRE_MAX_BODY_BYTES};

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
    }
}
