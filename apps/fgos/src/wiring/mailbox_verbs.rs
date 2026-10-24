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
use super::mailbox_identity::{
    address, handle_conflicts, is_alias, session_of, state_root, Addressed,
};
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, OperationId, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
};
use fgos_identity::cli_dirs::claude_config_dir;
use fgos_mailbox::adapters::version::VersionSources;
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::limits::{load, Loaded};
use fgos_mailbox::record::{Record, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{
    list_text, record_error_text, record_unavailable_text, role_holder_text, AliasRefusal, ListRow,
    Liveness, MessageId, Recipient, SendRequest, Timestamp, WriterKey,
};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::{SystemTime, UNIX_EPOCH};

/// The sub-verbs of `fgos mailbox`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["send", "inbox", "list", "status"];

pub const SEND_OPERATION_ID: &str = "mailbox.send";
pub const INBOX_OPERATION_ID: &str = "mailbox.inbox";
pub const INBOX_CLAIM_OPERATION_ID: &str = "mailbox.inbox.claim";
pub const LIST_OPERATION_ID: &str = "mailbox.list";
pub const STATUS_OPERATION_ID: &str = "mailbox.status";

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("mailbox"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const SEND_DESCRIPTOR: ProviderDescriptor = descriptor(
    SEND_OPERATION_ID,
    "mailbox.send.request",
    "mailbox.send.outcome",
);
pub const INBOX_DESCRIPTOR: ProviderDescriptor = descriptor(
    INBOX_OPERATION_ID,
    "mailbox.inbox.request",
    "mailbox.inbox.outcome",
);
pub const INBOX_CLAIM_DESCRIPTOR: ProviderDescriptor = descriptor(
    INBOX_CLAIM_OPERATION_ID,
    "mailbox.inbox.claim.request",
    "mailbox.inbox.claim.outcome",
);
pub const LIST_DESCRIPTOR: ProviderDescriptor = descriptor(
    LIST_OPERATION_ID,
    "mailbox.list.request",
    "mailbox.list.outcome",
);
pub const STATUS_DESCRIPTOR: ProviderDescriptor = descriptor(
    STATUS_OPERATION_ID,
    "mailbox.status.request",
    "mailbox.status.outcome",
);

/// One `fgos mailbox` invocation, as the projector parsed it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MailboxRequest {
    Send {
        to: String,
        wake: bool,
        reply_to: Option<String>,
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

/// `fgos mailbox send --to <name> [--wake] [--reply-to <id>] [--] <body>`,
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
            MailboxRequest::Send {
                to,
                wake,
                reply_to,
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

/// What a mailbox verb answers: the text it prints (unless it was written
/// already), the envelope data for `--json`, and the exit status.
#[derive(Debug, Clone, PartialEq)]
pub struct MailboxAnswer {
    pub text: String,
    pub data: Value,
    pub json: bool,
    pub exit: i32,
    /// The frames were written to stdout by the verb itself.
    pub already_written: bool,
    /// A line for stderr (an ignored config key, a usage error).
    pub warning: Option<String>,
}

/// Exit statuses (plan decision 2).
const EXIT_DONE: i32 = 0;
const EXIT_REFUSED: i32 = 1;
const EXIT_USAGE: i32 = 4;

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
        exit: EXIT_REFUSED,
        already_written: false,
        warning,
    }
}

/// The record directory and its limits, or the failed answer; opens no
/// record.
fn locate(json: bool) -> Result<(PathBuf, Loaded, Option<String>), Box<MailboxAnswer>> {
    let fgos_dir = record_dir(json)?;
    let loaded = super::mailbox_config::project_limits(&fgos_dir)
        .map_err(|f| failed(format!("mailbox config: {}", f.detail), json, None))?;
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
        exit: EXIT_DONE,
        already_written: false,
        warning,
    }
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
        data["config"] = Value::from(failure.reason.clone());
        text = format!("config: {} ({})\n{text}", failure.reason, failure.detail);
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
    MailboxAnswer {
        data,
        text,
        json,
        exit: if ok { EXIT_DONE } else { EXIT_REFUSED },
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

/// The caller's writer key: session identity's, attribution only.
fn caller(fgos_dir: &Path) -> Option<WriterKey> {
    WriterKey::new(
        fgos_identity::resolve_current(Some(fgos_dir))
            .id
            .to_string(),
    )
    .ok()
}

/// Runs one mailbox request.
pub fn answer(request: &MailboxRequest) -> MailboxAnswer {
    match request {
        MailboxRequest::Usage(cause) => MailboxAnswer {
            text: String::new(),
            data: json!({ "ok": false, "usage": cause }),
            json: false,
            exit: EXIT_USAGE,
            already_written: false,
            warning: Some(format!(
                "fgos: mailbox: {cause}. See \"fgos mailbox --help\"."
            )),
        },
        MailboxRequest::Send {
            to,
            wake,
            reply_to,
            body,
            json,
        } => {
            let (fgos_dir, record, loaded, warning) = match open(*json) {
                Ok(opened) => opened,
                Err(answer) => return *answer,
            };
            let Some(from) = caller(&fgos_dir) else {
                return failed(record_error_text("caller-unknown"), *json, warning);
            };
            let versions = VersionSources {
                claude_sessions: claude_config_dir(
                    std::env::var_os("HOME").as_deref(),
                    std::env::var_os("CLAUDE_CONFIG_DIR").as_deref(),
                )
                .map(|dir| dir.join("sessions")),
                codex_program: PathBuf::from("codex"),
                max_read_bytes: loaded.hook.hook.max_read_bytes,
            };
            let wait = Wait::Ms(loaded.hook.verbs.lock_wait_ms);
            let (recipient, role_holder) = if is_alias(to) {
                let heads = match verbs::heads(&fgos_dir, &loaded.limits) {
                    Ok(heads) => heads,
                    Err(text) => return failed(text, *json, warning),
                };
                match address(state_root().as_deref(), to, &heads) {
                    Addressed::Head { key, role_holder } => (Recipient::Key(key), role_holder),
                    Addressed::Refused(refusal) => (Recipient::Refused(refusal), None),
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
                dead_keys: Default::default(),
                stop_drains: TestedClis::embedded().stop_drains(),
            };
            let mut sent = verbs::send(&record, req, wait, now(), &loaded.limits, &versions);
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
                    EXIT_DONE
                } else {
                    EXIT_REFUSED
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
                    exit: EXIT_DONE,
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
                        EXIT_DONE
                    } else {
                        EXIT_REFUSED
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
