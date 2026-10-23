//! What a sender and an `inbox` caller read (spec §5.3, §6.1, §6.2): the
//! delivery report of a recorded send, the text of a refused one, and the
//! read-only inbox listing, and the answer when the record itself failed.
//! Every sentence comes from the frame contract and is filled by the
//! frame's one filler; every value taken from the record goes through the
//! frame's header escape.
use crate::delivery::{AliasRefusal, MessageView, Refusal, SendOutcome};
use crate::envelope::Kind;
use crate::frame::{escape_handle, escape_header, fill, section};
use crate::ids::{Cli, ShortName, WriterKey};
use crate::limits::Limits;
use crate::registry::Liveness;
use crate::wake::WakeDrop;

/// What the sender learns of the recipient's CLI version (spec §4.1): a
/// version under `testedAgainst` adds nothing; an untested or unreadable
/// one adds its sentence after the tier sentence. The hook keeps draining
/// either way.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VersionClause {
    Tested,
    Untested(String),
    Unknown,
}

/// The answer to a recorded send: `recorded <id> for <name>`, when the
/// recipient will see it, what its CLI version means, and why its wake was
/// dropped, if it was. Every drained CLI is tier `turn` until a wake
/// channel exists (no push or pull tier yet, spec §6.2), so the sentence
/// says the next tool call, or also the end of its turn when the wake took
/// effect; for a CLI whose Stop takes no mail it says that an idle session
/// sees it only at its next tool call.
pub fn delivery_report(outcome: &SendOutcome, version: &VersionClause, limits: &Limits) -> String {
    let id = escape_header(outcome.id.as_str(), limits);
    let to = escape_header(outcome.to.as_str(), limits);
    let mut lines = vec![fill(
        section("report.recorded"),
        &[("id", &id), ("to", &to)],
    )];
    lines.push(
        section(if !outcome.to_stop_drains {
            "report.turn.no-stop"
        } else if outcome.effective_wake {
            "report.turn.wake"
        } else {
            "report.turn"
        })
        .to_string(),
    );
    match version {
        VersionClause::Tested => {}
        VersionClause::Untested(text) => lines.push(fill(
            section("report.untested-version"),
            &[("version", &escape_header(text, limits))],
        )),
        VersionClause::Unknown => lines.push(section("report.version-unknown").to_string()),
    }
    if let Some(dropped) = outcome.wake_dropped {
        lines.push(
            section(match dropped {
                WakeDrop::ExchangeQuota => "report.wake-dropped.exchange-quota",
                WakeDrop::LifetimeCap => "report.wake-dropped.lifetime-cap",
                WakeDrop::NoChannel => "report.wake-no-channel",
            })
            .to_string(),
        );
    }
    lines.join("\n")
}

/// The answer to a refused send, from one of five sections by kind of
/// refusal; a policy or loop refusal tells the sender not to retry.
pub fn refusal_text(refusal: &Refusal, limits: &Limits) -> String {
    let code = refusal.code();
    let limit = limit_text(refusal);
    let name = match refusal {
        Refusal::SessionBudget { .. }
        | Refusal::LifetimeCap { .. }
        | Refusal::TooDeep { .. }
        | Refusal::QueueFull { .. }
        | Refusal::SenderShareFull { .. } => "refusal.policy",
        Refusal::Loop { .. } => "refusal.loop",
        Refusal::TooLarge { .. } => "refusal.too-large",
        Refusal::UnknownName { .. } | Refusal::AmbiguousName { .. } | Refusal::Alias(_) => {
            "refusal.name"
        }
        Refusal::Group
        | Refusal::SelfSend
        | Refusal::ReplyToNotOffered
        | Refusal::SenderKeyTooLong { .. } => "refusal.argument",
    };
    let candidates = match refusal {
        Refusal::UnknownName { candidates } | Refusal::AmbiguousName { candidates } => {
            listed(candidates.iter().map(|c| c.as_str()), limits)
        }
        Refusal::Alias(
            AliasRefusal::Unknown { candidates, .. } | AliasRefusal::Ambiguous { candidates },
        ) => {
            let handles: Vec<String> = candidates
                .iter()
                .map(|c| {
                    format!(
                        "{} ({})",
                        escape_handle(&c.handle, limits),
                        escape_handle(&c.id, limits)
                    )
                })
                .collect();
            if handles.is_empty() {
                "none".to_string()
            } else {
                handles.join(", ")
            }
        }
        _ => String::new(),
    };
    let text = fill(
        section(name),
        &[
            ("code", code),
            ("limit", &limit),
            ("candidates", &candidates),
        ],
    );
    match refusal {
        Refusal::Alias(AliasRefusal::Ambiguous { .. }) => {
            format!("{text}\n{}", section("refusal.alias.ambiguous"))
        }
        _ => text,
    }
}

/// Candidates joined by a comma through the header escape, or `none`.
fn listed<'a>(names: impl Iterator<Item = &'a str>, limits: &Limits) -> String {
    let names: Vec<String> = names.map(|n| escape_header(n, limits)).collect();
    if names.is_empty() {
        "none".to_string()
    } else {
        names.join(", ")
    }
}

/// The line a send to a role alias adds: who holds the role now.
pub fn role_holder_text(role: &str, handle: &str, limits: &Limits) -> String {
    fill(
        section("report.role-holder"),
        &[
            ("role", &escape_handle(role, limits)),
            ("handle", &escape_handle(handle, limits)),
        ],
    )
}

/// The answer when the record itself failed, so a hold changed nothing: a
/// `send` that was not recorded, an `inbox` that could not be read. `code`
/// is the record error's own fixed word (`lock-busy`, `snapshot-newer`, …).
pub fn record_error_text(code: &str) -> String {
    fill(section("record.error"), &[("code", code)])
}

/// The answer for a place that has no mailbox record and will not get one
/// by trying again (no repository, no `.fgos`, a checkout the main-checkout
/// read does not support), from the frame contract.
pub fn record_unavailable_text(code: &str) -> String {
    fill(section("record.unavailable"), &[("code", code)])
}

/// A refusal's own fields as `name=value` pairs in field order; empty for
/// a refusal with no number.
fn limit_text(refusal: &Refusal) -> String {
    let pairs: Vec<(&str, String)> = match refusal {
        Refusal::TooLarge { max_bytes } => vec![("max_bytes", max_bytes.to_string())],
        Refusal::SessionBudget { budget, window_sec } => vec![
            ("budget", budget.to_string()),
            ("window_sec", window_sec.to_string()),
        ],
        Refusal::LifetimeCap { cap } | Refusal::QueueFull { cap } => {
            vec![("cap", cap.to_string())]
        }
        Refusal::TooDeep { max_depth } => vec![("max_depth", max_depth.to_string())],
        Refusal::Loop {
            max_per_window,
            window_sec,
        } => vec![
            ("max_per_window", max_per_window.to_string()),
            ("window_sec", window_sec.to_string()),
        ],
        Refusal::SenderShareFull { per_sender } => vec![("per_sender", per_sender.to_string())],
        Refusal::SenderKeyTooLong { max_chars } => vec![("max_chars", max_chars.to_string())],
        Refusal::Group
        | Refusal::UnknownName { .. }
        | Refusal::AmbiguousName { .. }
        | Refusal::SelfSend
        | Refusal::ReplyToNotOffered
        | Refusal::Alias(_) => Vec::new(),
    };
    pairs
        .iter()
        .map(|(name, value)| format!("{name}={value}"))
        .collect::<Vec<_>>()
        .join(" ")
}

/// One head as `list` shows it: plain data the store and the wiring
/// gathered (the handle derived by the wiring, the tier from the adapters
/// contract, the liveness from the store's judgement).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ListRow {
    pub name: ShortName,
    pub key: WriterKey,
    pub cli: Cli,
    pub handle: Option<String>,
    pub tier: &'static str,
    pub liveness: Liveness,
}

/// The `list` answer: one line per head in the given order, with its key
/// when `long`, or the empty line.
pub fn list_text(rows: &[ListRow], long: bool, limits: &Limits) -> String {
    if rows.is_empty() {
        return section("list.empty").to_string();
    }
    rows.iter()
        .map(|row| {
            let name = escape_header(row.name.as_str(), limits);
            let handle = row
                .handle
                .as_deref()
                .map_or_else(|| "unknown".to_string(), |h| escape_handle(h, limits));
            let agent = escape_header(row.cli.as_str(), limits);
            let key = escape_header(row.key.as_str(), limits);
            let liveness = match row.liveness {
                Liveness::Alive => "alive",
                Liveness::Dead => "dead",
                Liveness::Unknown => "unknown",
            };
            fill(
                section(if long { "list.line.long" } else { "list.line" }),
                &[
                    ("name", &name),
                    ("handle", &handle),
                    ("agent", &agent),
                    ("tier", row.tier),
                    ("liveness", liveness),
                    ("key", &key),
                ],
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// The read-only inbox listing: one line per pending item, oldest mail
/// first then notices (the order `MailboxState::inbox` returns), or the
/// empty line; `None` when the caller has no address.
pub fn inbox_text(items: Option<&[MessageView]>, limits: &Limits) -> String {
    let Some(items) = items else {
        return section("inbox.no-address").to_string();
    };
    if items.is_empty() {
        return section("inbox.empty").to_string();
    }
    items
        .iter()
        .map(|item| {
            let id = escape_header(item.id.as_str(), limits);
            let from = escape_header(&item.from_label, limits);
            let offers = item.offers.to_string();
            let kind = match item.kind {
                Kind::Message => "message",
                Kind::Notice => "notice",
            };
            let state = if item.in_flight {
                "in-flight"
            } else {
                "recorded"
            };
            fill(
                section("inbox.line"),
                &[
                    ("id", &id),
                    ("kind", kind),
                    ("from_label", &from),
                    ("state", state),
                    ("offers", &offers),
                ],
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}
