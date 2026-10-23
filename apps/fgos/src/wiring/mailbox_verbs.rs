//! `fgos mailbox send|inbox [--claim]`: the mailbox's verbs as native
//! operations (`mailbox.send`, `mailbox.inbox`, `mailbox.inbox.claim`),
//! thin wiring over the store's verbs. The record directory is the main
//! checkout's `.fgos` (`mailbox_root`); the caller is session identity's
//! writer (attribution only, spec §5.1). Every answer is the frame
//! contract's text; `--json` wraps it in the `fgos.v1` envelope.
//!
//! Straight-line: root, config and limits, then one or two `Record` holds;
//! this process takes the mailbox lock with no other lock held.
//!
//! `inbox --claim` writes its frames to stdout itself, through the store's
//! write-then-finish function, and finishes only after a successful flush;
//! the presenter then prints nothing more for it (with `--json`, only the
//! envelope, without the text).
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, OperationId, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
};
use fgos_identity::cli_dirs::claude_config_dir;
use fgos_mailbox::adapters::version::VersionSources;
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::limits::{load, read_project_config, Loaded};
use fgos_mailbox::record::{Record, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{
    record_error_text, record_unavailable_text, MessageId, SendRequest, Timestamp, WriterKey,
};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::{SystemTime, UNIX_EPOCH};

/// The sub-verbs of `fgos mailbox`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["send", "inbox"];

pub const SEND_OPERATION_ID: &str = "mailbox.send";
pub const INBOX_OPERATION_ID: &str = "mailbox.inbox";
pub const INBOX_CLAIM_OPERATION_ID: &str = "mailbox.inbox.claim";

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
        }
    }
}

/// `fgos mailbox send --to <name> [--wake] [--reply-to <id>] [--] <body>`,
/// `fgos mailbox inbox [--claim]`; `--json` on both, `--dir` accepted and
/// ignored (the record is always the main checkout's).
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
        _ => MailboxRequest::Usage("mailbox needs send or inbox".to_string()),
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

/// The record directory, its record and its limits, or the failed answer.
fn open(json: bool) -> Result<(PathBuf, Record, Loaded, Option<String>), Box<MailboxAnswer>> {
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
    let defaults = load(None).map_err(|e| failed(format!("mailbox config: {e}"), json, None))?;
    let config = read_project_config(&fgos_dir, defaults.hook.hook.max_read_bytes)
        .map_err(|e| failed(format!("mailbox config: {e}"), json, None))?;
    let loaded =
        load(config.as_ref()).map_err(|e| failed(format!("mailbox config: {e}"), json, None))?;
    let warning = (!loaded.ignored_keys.is_empty()).then(|| {
        format!(
            "fgos: warning: ignored unknown mailbox config keys: {}",
            loaded.ignored_keys.join(", ")
        )
    });
    let record = Record::open(&fgos_dir)
        .map_err(|e| failed(record_error_text(e.code()), json, warning.clone()))?;
    Ok((fgos_dir, record, loaded, warning))
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
            let req = SendRequest {
                from,
                to: to.clone(),
                body,
                wake: *wake,
                reply_to: reply_to.as_deref().map(MessageId::from_text),
                dead_keys: Default::default(),
                stop_drains: TestedClis::embedded().stop_drains(),
            };
            let sent = verbs::send(
                &record,
                req,
                Wait::Ms(loaded.hook.hook.lock_wait_ms),
                now(),
                &loaded.limits,
                &versions,
            );
            MailboxAnswer {
                data: json!({ "ok": sent.recorded, "recorded": sent.recorded, "text": sent.text }),
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
                Wait::Ms(loaded.hook.hook.lock_wait_ms),
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
            let mut stdout = std::io::stdout().lock();
            match verbs::inbox_claim(
                &record,
                &key,
                Wait::Ms(loaded.hook.hook.lock_wait_ms),
                &now,
                &loaded.limits,
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
