//! `fgos mailbox send|inbox [--claim]|list [--long]|status`: the mailbox's
//! verbs as native operations (`mailbox.send`, `mailbox.inbox`,
//! `mailbox.inbox.claim`, `mailbox.list`, `mailbox.status`); `list` and
//! `status` read the record without its lock and create nothing,
//! thin wiring over the store's verbs. The record directory is the main
//! checkout's `.fgos` (`mailbox_root`); the caller is session identity's
//! writer (attribution only, spec §5.1). Every answer is the frame
//! contract's text; `--json` wraps it in the `fgos.v1` envelope.
//!
//! Straight-line: root, config and limits, then one or two `Record` holds
//! (a send to an Identity alias reads the record's heads in one more,
//! read-only hold first, `mailbox_identity`); this process takes the mailbox
//! lock with no other lock held, and reads Identity's directory outside it.
//!
//! `inbox --claim` writes its frames to stdout itself, through the store's
//! write-then-finish function, and finishes only after a successful flush;
//! the presenter then prints nothing more for it (with `--json`, only the
//! envelope, without the text).
use super::mailbox_body;
use super::mailbox_config::project_mailbox;
use super::mailbox_identity::{
    address, handle_conflicts, is_alias, session_of, state_root, Addressed,
};
use super::mailbox_remote;
use crate::exit_codes;
use fgos_host_runtime::{
    EventSink, HostInvocation, InvocationControl, OperationProvider, OperationRequest,
    ProviderDescriptor, ProviderError, ProviderOutcome,
};
use fgos_identity::cli_dirs::claude_config_dir;
use fgos_mailbox::adapters::version::VersionSources;
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::limits::{load, Loaded};
use fgos_mailbox::nudge::SystemNudge;
use fgos_mailbox::record::{Record, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{
    list_text, record_error_text, record_unavailable_text, role_holder_text, AliasRefusal, Kind,
    ListRow, Liveness, MessageId, Recipient, SendRequest, Timestamp, WriterKey,
};
use serde_json::{json, Value};
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::{SystemTime, UNIX_EPOCH};

pub use super::mailbox_surface::{
    MailboxAnswer, AVAILABLE_SUBCOMMANDS, INBOX_CLAIM_DESCRIPTOR, INBOX_CLAIM_OPERATION_ID,
    INBOX_DESCRIPTOR, INBOX_OPERATION_ID, LIST_DESCRIPTOR, LIST_OPERATION_ID, SEND_DESCRIPTOR,
    SEND_OPERATION_ID, STATUS_DESCRIPTOR, STATUS_OPERATION_ID,
};

/// One `fgos mailbox` invocation, as the projector parsed it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MailboxRequest {
    Send {
        to: String,
        wake: bool,
        reply_to: Option<String>,
        /// `--need-ack`: the sender wants to be told the message was taken in.
        need_ack: bool,
        /// `--reply-by`, in seconds; the key's default when `--need-ack` names none.
        reply_by_sec: Option<u64>,
        body: String,
        json: bool,
    },
    Inbox {
        claim: bool,
        json: bool,
    },
    List {
        long: bool,
        json: bool,
    },
    Status {
        json: bool,
    },
    /// The arguments do not form a request; the cause.
    Usage(String),
}

impl MailboxRequest {
    /// The operation this request runs.
    pub fn operation_id(&self) -> &'static str {
        match self {
            Self::Send { .. } | Self::Usage(_) => SEND_OPERATION_ID,
            Self::Inbox { claim: true, .. } => INBOX_CLAIM_OPERATION_ID,
            Self::Inbox { claim: false, .. } => INBOX_OPERATION_ID,
            Self::List { .. } => LIST_OPERATION_ID,
            Self::Status { .. } => STATUS_OPERATION_ID,
        }
    }
}

/// `fgos mailbox send --to <name> [--wake] [--reply-to <id>] [--need-ack
/// [--reply-by <90s|30m|2h>]] [--] <body>`,
/// `fgos mailbox inbox [--claim]`, `fgos mailbox list [--long]`, `fgos
/// mailbox status`; `--json` on each, `--dir` accepted and ignored (the
/// record is always the main checkout's).
pub fn project_mailbox_request(args: &[OsString]) -> MailboxRequest {
    let text: Vec<String> = args
        .iter()
        .map(|a| a.to_string_lossy().into_owned())
        .collect();
    let sub = text.get(1).map(String::as_str);
    let mut to = None;
    let mut reply_to = None;
    let mut wake = false;
    let mut need_ack = false;
    let mut reply_by = None;
    let mut claim = false;
    let mut long = false;
    let mut json = false;
    let mut positional = Vec::new();
    let mut flags_done = false;
    let mut index = 2;
    while index < text.len() {
        let token = text[index].as_str();
        index += 1;
        if flags_done || !token.starts_with("--") {
            positional.push(token.to_string());
            continue;
        }
        let (name, inline) = match token.split_once('=') {
            Some((name, value)) => (name, Some(value.to_string())),
            None => (token, None),
        };
        let mut value = || -> Option<String> {
            inline.clone().or_else(|| {
                let next = text.get(index).cloned();
                index += 1;
                next
            })
        };
        match (sub, name) {
            (_, "--") => flags_done = true,
            (_, "--json") => json = true,
            (_, "--dir") => {
                value();
            }
            (Some("send"), "--to") => to = value(),
            (Some("send"), "--reply-to") => reply_to = value(),
            (Some("send"), "--wake") => wake = true,
            (Some("send"), "--need-ack") => need_ack = true,
            (Some("send"), "--reply-by") => reply_by = Some(value().unwrap_or_default()),
            (Some("inbox"), "--claim") => claim = true,
            (Some("list"), "--long") => long = true,
            (_, other) => return MailboxRequest::Usage(format!("unknown flag {other}")),
        }
    }
    match sub {
        Some("send") => {
            let Some(to) = to.filter(|t| !t.is_empty()) else {
                return MailboxRequest::Usage("send needs --to <name>".to_string());
            };
            let [body] = positional.as_slice() else {
                return MailboxRequest::Usage("send needs exactly one body; quote it".to_string());
            };
            let reply_by_sec = match reply_by {
                Some(_) if !need_ack => {
                    return MailboxRequest::Usage("--reply-by needs --need-ack".to_string())
                }
                Some(text) => match parse_duration_sec(&text) {
                    Some(secs) => Some(secs),
                    None => {
                        return MailboxRequest::Usage(format!(
                            "--reply-by wants a duration such as 90s, 30m or 2h, not \"{text}\""
                        ))
                    }
                },
                None => None,
            };
            MailboxRequest::Send {
                to,
                wake,
                reply_to,
                need_ack,
                reply_by_sec,
                body: body.clone(),
                json,
            }
        }
        Some("inbox") if positional.is_empty() => MailboxRequest::Inbox { claim, json },
        Some("inbox") => MailboxRequest::Usage("inbox takes no positional argument".to_string()),
        Some("list") if positional.is_empty() => MailboxRequest::List { long, json },
        Some("status") if positional.is_empty() => MailboxRequest::Status { json },
        Some(verb @ ("list" | "status")) => {
            MailboxRequest::Usage(format!("{verb} takes no positional argument"))
        }
        _ => MailboxRequest::Usage("mailbox needs send, inbox, list or status".to_string()),
    }
}

/// A duration of whole seconds, minutes or hours (`90s`, `30m`, `2h`); `None`
/// for anything else, zero or too large to count in seconds.
fn parse_duration_sec(text: &str) -> Option<u64> {
    let unit = text.chars().last()?;
    let per_unit: u64 = match unit {
        's' => 1,
        'm' => 60,
        'h' => 3600,
        _ => return None,
    };
    let digits = &text[..text.len() - 1];
    if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    digits
        .parse::<u64>()
        .ok()
        .and_then(|n| n.checked_mul(per_unit))
        .filter(|secs| *secs > 0)
}

/// The seconds an acknowledgement request waits: `--reply-by`, or the
/// `mailbox.ack.replyBySec` default, inside what the record can keep. The
/// floor is the in-flight lifetime (a shorter deadline fires before the
/// message can be offered twice); the ceiling is the header horizon (the
/// header must outlive its deadline). A reply names `--reply-to` to count
/// after the loop window, which the help says.
fn ack_deadline(requested: Option<u64>, limits: &fgos_mailbox_core::Limits) -> Result<u64, String> {
    let (min, max) = (limits.in_flight_ttl_sec, limits.header_horizon_sec());
    let secs = requested.unwrap_or(limits.ack.reply_by_sec);
    if (min..=max).contains(&secs) {
        return Ok(secs);
    }
    let source = if requested.is_some() {
        "--reply-by"
    } else {
        "mailbox.ack.replyBySec"
    };
    Err(format!(
        "{source} {secs}s is outside what a local acknowledgement can wait: {min}s to {max}s"
    ))
}

/// The refusal of `--need-ack` toward a recipient of another machine, from
/// whether `to` names one; `None` for a local recipient. When that could not
/// be told the refusal says so instead of claiming it is remote.
fn need_ack_remote_refusal(names_remote: Result<bool, String>, to: &str) -> Option<String> {
    match names_remote {
        Ok(false) => None,
        Ok(true) => Some(
            "not recorded: --need-ack is not across machines yet; that name is a session of another machine. Send it without --need-ack."
                .to_string(),
        ),
        Err(why) => Some(format!(
            "not recorded: could not tell whether {to} is on another machine ({why}); send without --need-ack or retry."
        )),
    }
}

fn usage_answer(cause: &str) -> MailboxAnswer {
    MailboxAnswer {
        text: String::new(),
        data: json!({ "ok": false, "usage": cause }),
        json: false,
        exit: exit_codes::validation(),
        already_written: false,
        warning: Some(format!(
            "fgos: mailbox: {cause}. See \"fgos mailbox --help\"."
        )),
    }
}

fn now() -> Timestamp {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| u64::try_from(d.as_millis()).unwrap_or(u64::MAX));
    Timestamp::from_millis(millis)
}

fn failed(text: String, json: bool, warning: Option<String>) -> MailboxAnswer {
    MailboxAnswer {
        data: json!({ "ok": false, "text": text }),
        text,
        json,
        exit: exit_codes::unexpected(),
        already_written: false,
        warning,
    }
}

/// The record directory and its limits, or the failed answer; opens no
/// record.
fn locate(json: bool) -> Result<(PathBuf, Loaded, Option<String>), Box<MailboxAnswer>> {
    let fgos_dir = record_dir(json)?;
    let loaded = super::mailbox_config::project_limits(&fgos_dir)
        .map_err(|f| failed(format!("mailbox config: {}", f.detail()), json, None))?;
    let warning = ignored_keys_warning(&loaded);
    Ok((fgos_dir, loaded, warning))
}

/// The warning naming unknown mailbox config keys, when there are any.
fn ignored_keys_warning(loaded: &Loaded) -> Option<String> {
    (!loaded.ignored_keys.is_empty()).then(|| {
        format!(
            "fgos: warning: ignored unknown mailbox config keys: {}",
            loaded.ignored_keys.join(", ")
        )
    })
}

/// The record directory of the caller's project, or the failed answer.
fn record_dir(json: bool) -> Result<PathBuf, Box<MailboxAnswer>> {
    let cwd = std::env::current_dir()
        .map_err(|_| failed(record_error_text("cwd-unreadable"), json, None))?;
    let fgos_dir = super::mailbox_root::mailbox_fgos_dir(
        std::env::var_os("CLAUDE_PROJECT_DIR").as_deref(),
        &cwd,
    )
    .map_err(|e| {
        let text = if e.is_permanent() {
            record_unavailable_text(e.code())
        } else {
            record_error_text(e.code())
        };
        failed(text, json, None)
    })?;
    Ok(fgos_dir)
}

/// The record directory, its record and its limits, or the failed answer.
fn open(json: bool) -> Result<(PathBuf, Record, Loaded, Option<String>), Box<MailboxAnswer>> {
    let (fgos_dir, loaded, warning) = locate(json)?;
    let record = Record::open(&fgos_dir)
        .map_err(|e| failed(record_error_text(e.code()), json, warning.clone()))?;
    Ok((fgos_dir, record, loaded, warning))
}

/// `list`: every head of the record not judged dead, with its handle
/// (derived through Identity), CLI, tier and liveness; `--long` adds the key.
fn list(long: bool, json: bool) -> MailboxAnswer {
    let (fgos_dir, loaded, warning) = match locate(json) {
        Ok(located) => located,
        Err(answer) => return *answer,
    };
    let heads = match verbs::heads(&fgos_dir, &loaded.limits) {
        Ok(heads) => heads,
        Err(text) => return failed(text, json, warning),
    };
    let root = state_root();
    let rows: Vec<ListRow> = heads
        .into_iter()
        .map(|head| ListRow {
            handle: root
                .as_deref()
                .and_then(|root| session_of(root, &head.key, &head.cli, Some(&head.head)))
                .map(|info| info.handle),
            tier: TestedClis::embedded().tier(&head.cli),
            name: head.name,
            key: head.key,
            cli: head.cli,
            liveness: head.liveness,
        })
        .collect();
    let data: Vec<Value> = rows
        .iter()
        .map(|row| {
            let mut entry = json!({
                "name": row.name.as_str(),
                "handle": row.handle,
                "cli": row.cli.as_str(),
                "tier": row.tier,
                "liveness": liveness_word(row.liveness),
            });
            if long {
                entry["key"] = Value::from(row.key.as_str());
            }
            entry
        })
        .collect();
    let text = list_text(&rows, long, &loaded.limits);
    MailboxAnswer {
        data: json!({ "ok": true, "heads": data, "text": text }),
        text,
        json,
        exit: exit_codes::ok(),
        already_written: false,
        warning,
    }
}

/// Pending incoming messages shown by `status`, before "and N more".
const INCOMING_SHOWN: usize = 5;

/// The messages pending for the calling session: how many, and for the
/// first few the sender, the age and whether it crossed machines. Read from
/// the snapshot without the lock through the same `MailboxState::inbox` that
/// `inbox` lists, so nothing is offered, claimed or written; no body is
/// read. `None` when nothing is pending, the caller has no address, or the
/// record cannot be read (the rest of the answer already says that).
fn incoming_summary(
    fgos_dir: &Path,
    limits: &fgos_mailbox_core::Limits,
    now: Timestamp,
) -> Option<(Value, String)> {
    let key = caller(fgos_dir)?;
    let existing = Record::read_existing(fgos_dir, limits).ok()??;
    let mail: Vec<_> = existing
        .state
        .inbox(&key)
        .into_iter()
        .filter(|item| item.kind == Kind::Message)
        .collect();
    if mail.is_empty() {
        return None;
    }
    let secs = now.as_millis() / 1000;
    let rows: Vec<(String, u64, bool)> = mail
        .iter()
        .map(|item| {
            let crossed = existing
                .state
                .message(&item.id)
                .is_some_and(|header| header.origin.is_some());
            let age = secs.saturating_sub(item.recorded_at.as_millis() / 1000);
            (item.from_label.clone(), age, crossed)
        })
        .collect();
    let shown: Vec<Value> = rows
        .iter()
        .take(INCOMING_SHOWN)
        .map(
            |(from, age, crossed)| json!({ "from": from, "ageSecs": age, "crossMachine": crossed }),
        )
        .collect();
    let mut line = format!(
        "incoming: {} pending for this session (not yet offered; `fgos mailbox inbox` lists them)",
        rows.len()
    );
    for (from, age, crossed) in rows.iter().take(INCOMING_SHOWN) {
        line.push_str(&format!(
            "\n  from {from}, {} ago{}",
            mailbox_remote::ago(*age),
            if *crossed {
                ", from another machine"
            } else {
                ""
            }
        ));
    }
    if rows.len() > INCOMING_SHOWN {
        line.push_str(&format!("\n  and {} more", rows.len() - INCOMING_SHOWN));
    }
    Some((json!({ "pending": rows.len(), "shown": shown }), line))
}

/// `status`: the record's verdict and the spec §9 signals, report-only. A
/// project config the mailbox cannot read fails the answer and is named in
/// it (`config`), while the record is still read under the contract's
/// defaults.
fn status(json: bool) -> MailboxAnswer {
    let fgos_dir = match record_dir(json) {
        Ok(dir) => dir,
        Err(answer) => return *answer,
    };
    let (loaded, config_failure) = match super::mailbox_config::project_limits(&fgos_dir) {
        Ok(loaded) => (loaded, None),
        Err(failure) => match load(None) {
            Ok(defaults) => (defaults, Some(failure)),
            Err(e) => return failed(format!("mailbox config: {e}"), json, None),
        },
    };
    let warning = ignored_keys_warning(&loaded);
    let answer = verbs::status(&fgos_dir, now(), &loaded.limits);
    let mut data = answer.json;
    let mut text = answer.text;
    let ok = answer.record_ok && config_failure.is_none();
    data["ok"] = Value::from(ok);
    if let Some(failure) = &config_failure {
        data["config"] = Value::from(failure.reason());
        text = format!(
            "config: {} ({})\n{text}",
            failure.reason(),
            failure.detail()
        );
    }
    // A head whose handle does not name it alone (Identity holds it for
    // another session, or another head derives it too) is named with the
    // full id that still reaches it.
    if data["record"] == "ok" {
        let conflicts = state_root()
            .zip(verbs::heads(&fgos_dir, &loaded.limits).ok())
            .map(|(root, heads)| handle_conflicts(&root, &heads))
            .unwrap_or_default();
        data["handleConflicts"] = conflicts
            .iter()
            .map(|c| json!({ "name": c.name, "handle": c.handle, "id": c.id, "other": c.other }))
            .collect();
        for c in &conflicts {
            text.push_str(&format!(
                "\nhandle not unique: {} {} is also {}; reach it by its full id {}",
                c.name, c.handle, c.other, c.id
            ));
        }
    }
    // Mail waiting for this session: counted and named from the same pending read `inbox` shows, never consumed.
    if data["record"] == "ok" {
        if let Some((incoming, line)) = incoming_summary(&fgos_dir, &loaded.limits, now()) {
            data["incoming"] = incoming;
            text.push_str(&format!("\n{line}"));
        }
    }
    // Mail that crosses machines: what this machine's recent sends came to, when the project turned it on.
    if let (Ok((_, cross)), Some(root), Some(main)) =
        (project_mailbox(&fgos_dir), state_root(), fgos_dir.parent())
    {
        if cross.enabled {
            let secs = now().as_millis() / 1000;
            match mailbox_remote::sent_summary(main, &root, secs) {
                Ok(summary) => {
                    data["crossMachine"] = json!({
                        "sent": summary.sent,
                        "offered": summary.offered,
                        "waiting": summary.waiting,
                        "refused": summary.refused,
                        "recent": summary.recent_json(),
                    });
                    text.push_str(&format!("\n{}", summary.text()));
                    for line in summary.recent_lines(secs) {
                        text.push_str(&format!("\n{line}"));
                    }
                }
                Err(why) => text.push_str(&format!("\ncross-machine: unavailable ({why})")),
            }
            let unconfirmed = mailbox_remote::unconfirmed_machines(&root);
            data["crossMachine"]["requireConfirmed"] = Value::from(cross.require_confirmed);
            data["crossMachine"]["acceptedPayloadVersions"] =
                json!(mailbox_remote::ACCEPTED_PAYLOAD_VERSIONS);
            text.push_str(&format!(
                "\ncross-machine: this machine takes mail payload versions {}",
                mailbox_remote::ACCEPTED_PAYLOAD_VERSIONS
                    .iter()
                    .map(u64::to_string)
                    .collect::<Vec<_>>()
                    .join(", ")
            ));
            data["crossMachine"]["takesAckRequests"] = Value::from(true);
            text.push_str("\ncross-machine: this machine takes acknowledgement requests");
            data["crossMachine"]["bodyRef"] = json!({ "on": cross.body_ref });
            if cross.body_ref {
                let kept = mailbox_remote::body_sent_times(main, &root)
                    .and_then(|sent| mailbox_body::held(main, &sent));
                match kept {
                    Ok(held) => {
                        data["crossMachine"]["bodyRef"] = json!({
                            "on": true,
                            "kept": held.count,
                            "unnamed": held.unnamed,
                            "oldestSentSecs": held.oldest_sent_secs,
                            "lifetimeSec": cross.body_lifetime_sec,
                        });
                        text.push_str(&format!("\n{}", held.text(secs, cross.body_lifetime_sec)));
                    }
                    Err(why) => text.push_str(&format!(
                        "\ncross-machine: mail bodies are kept in this machine's mail-body ref (mailbox.remote.bodyRef is on); unavailable ({why})"
                    )),
                }
            } else {
                text.push_str(
                    "\ncross-machine: mail bodies stay inside the signed event (mailbox.remote.bodyRef is off)",
                );
            }
            data["crossMachine"]["unconfirmedMachines"] = unconfirmed
                .iter()
                .map(|(id, _)| Value::from(id.as_str()))
                .collect();
            for (machine, fingerprint) in &unconfirmed {
                text.push_str(&format!(
                    "\ncross-machine: key of machine {machine} is seen, not confirmed ({fingerprint}); compare it with the fingerprint that machine reports, then `fgos identity pins --confirm {machine} --fingerprint <fingerprint>`{}",
                    if cross.require_confirmed { ", or its mail is refused" } else { "" }
                ));
            }
        }
    }
    MailboxAnswer {
        data,
        text,
        json,
        exit: if ok {
            exit_codes::ok()
        } else {
            exit_codes::unexpected()
        },
        already_written: false,
        warning,
    }
}

fn liveness_word(liveness: Liveness) -> &'static str {
    match liveness {
        Liveness::Alive => "alive",
        Liveness::Dead => "dead",
        Liveness::Unknown => "unknown",
    }
}

/// An alias refusal's candidates as typed objects for `--json`.
fn typed_candidates(refusal: &AliasRefusal) -> Value {
    let (AliasRefusal::Unknown { candidates, .. } | AliasRefusal::Ambiguous { candidates }) =
        refusal;
    candidates
        .iter()
        .map(|c| {
            json!({
                "id": c.id,
                "handle": c.handle,
                "liveness": liveness_word(c.liveness),
            })
        })
        .collect()
}

/// Where the recipient's CLI version can be read on this machine; the one place the host builds it,
/// for a send here and for the sync child's wake of mail from another machine.
pub(crate) fn version_sources(max_read_bytes: u64) -> VersionSources {
    VersionSources {
        claude_sessions: claude_config_dir(
            std::env::var_os("HOME").as_deref(),
            std::env::var_os("CLAUDE_CONFIG_DIR").as_deref(),
        )
        .map(|dir| dir.join("sessions")),
        codex_program: PathBuf::from("codex"),
        max_read_bytes,
    }
}

/// The host's nudge, run with the program the version gate read.
pub(crate) fn system_nudge(versions: &VersionSources) -> SystemNudge {
    SystemNudge {
        codex_program: versions.codex_program.clone(),
        timeout: std::time::Duration::from_secs(5),
        claude_sessions: versions.claude_sessions.clone(),
        max_read_bytes: versions.max_read_bytes,
    }
}

/// The caller's writer key: session identity's, attribution only.
fn caller(fgos_dir: &Path) -> Option<WriterKey> {
    WriterKey::new(
        fgos_identity::resolve_current(Some(fgos_dir))
            .id
            .to_string(),
    )
    .ok()
}

/// The answer to a send that went (or was refused) on the cross-machine path.
fn remote_answer(
    recorded: bool,
    text: String,
    json: bool,
    warning: Option<String>,
) -> MailboxAnswer {
    MailboxAnswer {
        data: json!({ "ok": recorded, "recorded": recorded, "crossMachine": true, "text": text }),
        text,
        json,
        exit: if recorded {
            exit_codes::ok()
        } else {
            exit_codes::unexpected()
        },
        already_written: false,
        warning,
    }
}

/// Runs one mailbox request.
pub fn answer(request: &MailboxRequest) -> MailboxAnswer {
    match request {
        MailboxRequest::Usage(cause) => usage_answer(cause),
        MailboxRequest::Send {
            to,
            wake,
            reply_to,
            need_ack,
            reply_by_sec,
            body,
            json,
        } => {
            let (fgos_dir, record, loaded, warning) = match open(*json) {
                Ok(opened) => opened,
                Err(answer) => return *answer,
            };
            let need_ack = if *need_ack {
                match ack_deadline(*reply_by_sec, &loaded.limits) {
                    Ok(secs) => Some(secs),
                    Err(cause) => return usage_answer(&cause),
                }
            } else {
                None
            };
            let Some(from) = caller(&fgos_dir) else {
                return failed(record_error_text("caller-unknown"), *json, warning);
            };
            let versions = version_sources(loaded.hook.hook.max_read_bytes);
            let wait = Wait::Ms(loaded.hook.verbs.lock_wait_ms);
            let (recipient, role_holder) = if is_alias(to) {
                let heads = match verbs::heads(&fgos_dir, &loaded.limits) {
                    Ok(heads) => heads,
                    Err(text) => return failed(text, *json, warning),
                };
                match address(state_root().as_deref(), to, &heads) {
                    Addressed::Head { key, role_holder } => (Recipient::Key(key), role_holder),
                    Addressed::Refused(refusal) => {
                        // No head of this record answers: a session of another
                        // machine may, when mail crosses machines here.
                        if let Ok((_, cross)) = project_mailbox(&fgos_dir) {
                            let ctx = mailbox_remote::Context {
                                fgos_dir: &fgos_dir,
                                record: &record,
                                limits: &loaded.limits,
                                cross: &cross,
                                wait,
                                now: now(),
                            };
                            if need_ack.is_some() {
                                if let Some(text) = need_ack_remote_refusal(
                                    mailbox_remote::names_remote_head(&ctx, &from, to),
                                    to,
                                ) {
                                    return remote_answer(false, text, *json, warning);
                                }
                            }
                            match mailbox_remote::send(
                                &ctx,
                                &from,
                                to,
                                body,
                                reply_to.as_deref(),
                                *wake,
                            ) {
                                mailbox_remote::Outcome::NotRemote => {}
                                mailbox_remote::Outcome::Recorded(text) => {
                                    return remote_answer(true, text, *json, warning)
                                }
                                mailbox_remote::Outcome::Refused(text) => {
                                    return remote_answer(false, text, *json, warning)
                                }
                            }
                        }
                        (Recipient::Refused(refusal), None)
                    }
                }
            } else {
                (Recipient::Name(to.clone()), None)
            };
            let candidates = match &recipient {
                Recipient::Refused(refusal) => Some(typed_candidates(refusal)),
                Recipient::Name(_) | Recipient::Key(_) => None,
            };
            let req = SendRequest {
                from,
                to: recipient,
                body,
                wake: *wake,
                reply_to: reply_to.as_deref().map(MessageId::from_text),
                need_ack,
                dead_keys: Default::default(),
                stop_drains: TestedClis::embedded().stop_drains(),
                nudge_clis: TestedClis::embedded().nudge_clis(),
            };
            let nudge = system_nudge(&versions);
            let mut sent =
                verbs::send(&record, req, wait, now(), &loaded.limits, &versions, &nudge);
            if let (true, Some((role, handle))) = (sent.recorded, role_holder) {
                sent.text = format!(
                    "{}\n{}",
                    sent.text,
                    role_holder_text(&role, &handle, &loaded.limits)
                );
            }
            let mut data =
                json!({ "ok": sent.recorded, "recorded": sent.recorded, "text": sent.text });
            if let Some(candidates) = candidates {
                data["candidates"] = candidates;
            }
            MailboxAnswer {
                data,
                text: sent.text,
                json: *json,
                exit: if sent.recorded {
                    exit_codes::ok()
                } else {
                    exit_codes::unexpected()
                },
                already_written: false,
                warning,
            }
        }
        MailboxRequest::List { long, json } => list(*long, *json),
        MailboxRequest::Status { json } => status(*json),
        MailboxRequest::Inbox { claim: false, json } => {
            let (fgos_dir, record, loaded, warning) = match open(*json) {
                Ok(opened) => opened,
                Err(answer) => return *answer,
            };
            let Some(key) = caller(&fgos_dir) else {
                return failed(record_error_text("caller-unknown"), *json, warning);
            };
            match verbs::inbox(
                &record,
                &key,
                Wait::Ms(loaded.hook.verbs.lock_wait_ms),
                now(),
                &loaded.limits,
            ) {
                Ok(text) => MailboxAnswer {
                    data: json!({ "ok": true, "text": text }),
                    text,
                    json: *json,
                    exit: exit_codes::ok(),
                    already_written: false,
                    warning,
                },
                Err(text) => failed(text, *json, warning),
            }
        }
        MailboxRequest::Inbox { claim: true, json } => {
            let (fgos_dir, record, loaded, warning) = match open(*json) {
                Ok(opened) => opened,
                Err(answer) => return *answer,
            };
            let Some(key) = caller(&fgos_dir) else {
                return failed(record_error_text("caller-unknown"), *json, warning);
            };
            let root = state_root();
            let handle_of =
                |key: &WriterKey,
                 cli: &fgos_mailbox_core::Cli,
                 head: Option<&fgos_process::facts::Record>| {
                    session_of(root.as_deref()?, key, cli, head).map(|info| info.handle)
                };
            let mut stdout = std::io::stdout().lock();
            match verbs::inbox_claim(
                &record,
                &key,
                Wait::Ms(loaded.hook.verbs.lock_wait_ms),
                &now,
                &loaded.limits,
                &handle_of,
                &mut stdout,
            ) {
                Ok(done) => MailboxAnswer {
                    data: json!({
                        "ok": done.written,
                        "claimed": done.claimed.iter().map(MessageId::as_str).collect::<Vec<_>>(),
                        "written": done.written,
                        "finished": done.finished,
                    }),
                    text: String::new(),
                    json: *json,
                    exit: if done.written {
                        exit_codes::ok()
                    } else {
                        exit_codes::unexpected()
                    },
                    already_written: true,
                    warning,
                },
                Err(text) => failed(text, *json, warning),
            }
        }
    }
}

/// The provider of one of the three mailbox operations.
pub struct MailboxProvider {
    descriptor: ProviderDescriptor,
}

impl MailboxProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for MailboxProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request
                .input
                .downcast_ref::<MailboxRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not MailboxRequest".into())
                })?;
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                Box::new(answer(request)),
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::need_ack_remote_refusal;

    #[test]
    fn a_need_ack_refusal_names_another_machine_only_when_it_is_known() {
        assert_eq!(need_ack_remote_refusal(Ok(false), "x"), None);
        let known = need_ack_remote_refusal(Ok(true), "x").unwrap();
        assert!(known.contains("not across machines yet"), "{known}");
        let unknown = need_ack_remote_refusal(Err("log-unreadable: boom".into()), "x").unwrap();
        assert!(
            unknown
                .contains("could not tell whether x is on another machine (log-unreadable: boom)")
                && !unknown.contains("session of another machine"),
            "{unknown}"
        );
    }
}
