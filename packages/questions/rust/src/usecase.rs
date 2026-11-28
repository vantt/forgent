//! The verbs: `ask`, `answer`, `ack`, `cancel`, `list` and `show`. Each runs over the ports (the log and the
//! caller), refuses by name, and keeps the per-machine view `.fgos/cache/questions.json` current: after every
//! write and after every read of the stream.

use crate::caller::{Caller, CallerSource};
use crate::notifier::{Notifier, OwnerMailbox};
use crate::record::{
    Acked, AnswerPayload, Answered, Asked, Asker, Cancelled, DeliveryPending, QuestionOption,
    Recipient, ACKED, ANSWERED, ASKED, CANCELLED, DELIVERY_PENDING,
};
use crate::refcheck;
use crate::refusal::Refusal;
use crate::shape;
use crate::store::{fold, Fold, Question, QuestionLog, State};
use fgos_identity::text::iso_utc_now;
use fgos_identity::{random, RandomKind};
use serde_json::{json, Value};
use std::path::Path;

/// The view file under the cache directory.
pub const VIEW_FILE: &str = "questions.json";

/// The one owner. `by` of every answer.
const OWNER: &str = "owner";
const SECRETARY_ROLE: &str = "head:secretary";

/// What a verb returns. Once an event is in the store the verb is not failed: a later step that fails
/// (re-reading the stream, rewriting the view, the cancel of a superseded question) becomes `warning`,
/// so a caller never retries a write that already happened.
#[derive(Debug)]
pub struct Done<T> {
    pub value: T,
    pub warning: Option<String>,
}

/// Which questions `list` returns.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Which {
    Open,
    Answered,
    All,
}

#[derive(Debug)]
pub struct Listing {
    /// How many questions wait for the owner.
    pub needs_you: usize,
    pub questions: Vec<Question>,
}

/// One option as the owner reads it: the letter of its place on screen and the option itself.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ShownOption<'a> {
    /// `A` for the first option shown, `B` for the second, and so on.
    pub letter: char,
    pub option: &'a QuestionOption,
}

/// The options in the order the owner reads them: the recommended one first, then the rest as the asker wrote
/// them. This one order gives both the display and the letter the owner answers with, so the two cannot drift.
/// The contract allows at most four options; a longer list read from an older record wraps the letter.
pub fn shown_options(options: &[QuestionOption]) -> Vec<ShownOption<'_>> {
    let (recommended, rest): (Vec<_>, Vec<_>) = options
        .iter()
        .partition(|option| option.recommended == Some(true));
    recommended
        .into_iter()
        .chain(rest)
        .enumerate()
        .map(|(index, option)| ShownOption {
            letter: char::from(b'A' + (index % 26) as u8),
            option,
        })
        .collect()
}

/// A shown option's label: the option's own label, prefixed with its letter and a dot unless the label already
/// starts with that letter and a dot (askers write `B. Keeper's lead ...` by hand today), so it is never doubled.
pub fn shown_label(shown: &ShownOption<'_>) -> String {
    let label = shown.option.label.as_str();
    let prefix = format!("{}.", shown.letter);
    if label.starts_with(&prefix) {
        label.to_owned()
    } else {
        format!("{prefix} {label}")
    }
}

/// The option a `--option` value names: the option at the place on screen a single letter `A` to `D` names (in
/// either case), or an option whose label is exactly the value. The letter comes first because the display and
/// the answer command speak in letters, so a label that is itself one letter cannot shadow the place it names;
/// an exact label is the way to name an option whose label is longer. A letter past the last option names nothing.
pub fn resolve_option<'a>(
    options: &'a [QuestionOption],
    value: &str,
) -> Option<&'a QuestionOption> {
    let mut characters = value.trim().chars();
    let letter = characters.next()?.to_ascii_uppercase();
    if characters.next().is_none() && letter.is_ascii_uppercase() {
        if let Some(shown) = shown_options(options).get((letter as u8 - b'A') as usize) {
            return Some(shown.option);
        }
    }
    options.iter().find(|option| option.label == value)
}

/// The wiring of one call.
pub struct Questions<'a> {
    pub log: &'a dyn QuestionLog,
    pub caller: &'a dyn CallerSource,
    /// The caller's own checkout root: a ref is checked here.
    pub checkout: &'a Path,
    /// `.fgos/cache` of the project.
    pub cache_dir: &'a Path,
}

fn platform() -> Result<(), Refusal> {
    if cfg!(target_os = "linux") {
        Ok(())
    } else {
        Err(Refusal::new(
            "event-store-unsupported-platform",
            "the Event Store runs on Linux only, so questions are unavailable on this platform",
        ))
    }
}

fn unknown(id: &str) -> Refusal {
    Refusal::new("question-unknown", format!("no question has the id {id}"))
}

fn not_open(id: &str, verb: &str, state: State) -> Refusal {
    Refusal::new(
        "question-not-open",
        format!("{id} is {state:?}, which `{verb}` does not take").to_lowercase(),
    )
}

/// Who may close (ack or cancel) a question: the asker session; a session holding the same `head:` role; any
/// head session for a migrated question or one whose asker held no `head:` role.
fn may_close(caller: &Caller, question: &Question) -> bool {
    let asker = &question.asked.asker;
    if caller.session_id == asker.session_id {
        return true;
    }
    if asker
        .head_roles()
        .any(|role| caller.roles.iter().any(|own| own == role))
    {
        return true;
    }
    (question.asked.migrated || asker.head_roles().next().is_none()) && caller.is_head()
}

fn not_asker(id: &str) -> Refusal {
    Refusal::new(
        "not-asker",
        format!("only the asker, a session of the asker's head role or (for a migrated question) a head may close {id}"),
    )
}

/// Checks an answer and returns the label of the option it names, which is what the record keeps: the option's
/// own label, or the letter at that place on screen. A question with no options keeps a free-text option.
fn check_answer<'a>(
    question: &'a Question,
    option: Option<&'a str>,
    text: Option<&str>,
) -> Result<Option<&'a str>, Refusal> {
    let Some(value) = option else {
        if text.is_none() {
            return Err(Refusal::incomplete(
                "an answer needs option, text or both",
                vec!["option|text".into()],
            ));
        }
        return Ok(None);
    };
    let options = &question.asked.parts.options;
    if options.is_empty() {
        return Ok(Some(value));
    }
    resolve_option(options, value)
        .map(|chosen| Some(chosen.label.as_str()))
        .ok_or_else(|| {
            Refusal::unclear(
                "option",
                "must be the label of one of the options, or the letter A to D of its place on screen",
            )
        })
}

fn io_refusal(detail: impl Into<String>) -> Refusal {
    Refusal::new("event-store-io", detail)
}

impl Questions<'_> {
    fn read(&self) -> Result<Fold, Refusal> {
        Ok(fold(&self.log.read()?))
    }

    /// Rewrites the view with a durable replace.
    fn refresh_view(&self, fold: &Fold) -> Option<String> {
        let view = json!({
            "v": 1,
            "questions": fold.questions().collect::<Vec<_>>(),
        });
        let bytes = match serde_json::to_vec(&view) {
            Ok(bytes) => bytes,
            Err(e) => return Some(format!("{VIEW_FILE}: {e}")),
        };
        let write = std::fs::create_dir_all(self.cache_dir)
            .map_err(|e| e.to_string())
            .and_then(|()| {
                fgos_durable_file::replace_durably(self.cache_dir, VIEW_FILE, &bytes)
                    .map(|_| ())
                    .map_err(|e| e.to_string())
            });
        write.err().map(|e| format!("{VIEW_FILE}: {e}"))
    }

    /// Re-reads the stream after a write so the view carries it. Never fails: the write is done.
    fn finish<T>(&self, value: T) -> Result<Done<T>, Refusal> {
        self.finish_with(value, None)
    }

    fn finish_with<T>(&self, value: T, earlier: Option<String>) -> Result<Done<T>, Refusal> {
        let later = match self.read() {
            Ok(fold) => self.refresh_view(&fold),
            Err(refusal) => Some(format!(
                "{VIEW_FILE} not refreshed: {}: {}",
                refusal.code, refusal.detail
            )),
        };
        let warning = match (earlier, later) {
            (Some(a), Some(b)) => Some(format!("{a}; {b}")),
            (a, b) => a.or(b),
        };
        Ok(Done { value, warning })
    }

    fn append<P: serde::Serialize>(&self, event_type: &str, payload: &P) -> Result<(), Refusal> {
        let payload =
            serde_json::to_value(payload).map_err(|e| io_refusal(format!("event payload: {e}")))?;
        self.log.append(event_type, payload)
    }

    /// Checks the input and the ref, fills the asker, mints the id and appends `questions.asked`; with
    /// `supersedes`, cancels the old question with reason `superseded:<new id>`. Returns the new id.
    pub fn ask(&self, input: &Value) -> Result<Done<String>, Refusal> {
        self.ask_with_notifier(input, &OwnerMailbox)
    }

    /// Uses the registered outbound channel adapter. Delivery failures never undo
    /// or fail a durable ask: the pending record and warning expose them instead.
    pub fn ask_with_notifier(
        &self,
        input: &Value,
        notifier: &dyn Notifier,
    ) -> Result<Done<String>, Refusal> {
        platform()?;
        let caller = self.caller.caller()?;
        let checked = shape::check(input)?;
        let origin = refcheck::check(self.checkout, &checked.reference)?;
        let fold = self.read()?;
        if let Some(old) = &checked.supersedes {
            let question = fold.get(old).ok_or_else(|| unknown(old))?;
            if !matches!(question.state, State::Open | State::Answered) {
                return Err(not_open(old, "supersede", question.state));
            }
            if !may_close(&caller, question) {
                return Err(not_asker(old));
            }
        }
        let id = random(RandomKind::Question)
            .map_err(|e| io_refusal(format!("minting a question id: {e}")))?;
        let now = iso_utc_now();
        let asked = Asked {
            id: id.clone(),
            to: checked.to,
            asked_at: now.clone(),
            asker: Asker {
                session_id: caller.session_id.clone(),
                handle: caller.handle.clone(),
                roles: caller.roles.clone(),
                persona: caller.persona.clone(),
                pane: caller.pane.clone(),
                machine: caller.machine.clone(),
            },
            stage: checked.stage,
            origin,
            headline: checked.headline,
            blocks: checked.blocks,
            parts: checked.parts,
            migrated: checked.migrated,
            supersedes: checked.supersedes.clone(),
        };
        self.append(ASKED, &asked)?;
        let mut earlier = notifier.deliver(&asked).err().map(|refusal| {
            let pending = DeliveryPending {
                id: id.clone(),
                reason: refusal.code.clone(),
                at: now.clone(),
            };
            match self.append(DELIVERY_PENDING, &pending) {
                Ok(()) => format!(
                    "{id} delivery pending: {}: {}",
                    refusal.code, refusal.detail
                ),
                Err(error) => format!(
                    "{id} delivery pending: {}; pending record not written: {error}",
                    refusal.code
                ),
            }
        });
        // The new question is written; a refused cancel leaves the old one open and is reported, not
        // failed, so a retry does not ask twice.
        if let Some(old) = checked.supersedes {
            let cancel = self.append(
                CANCELLED,
                &Cancelled {
                    id: old.clone(),
                    by: caller.handle,
                    reason: format!("superseded:{id}"),
                    at: now,
                },
            );
            if let Err(refusal) = cancel {
                let warning = format!(
                    "{old} is still open, its cancel was refused: {}: {}; run cancel on it",
                    refusal.code, refusal.detail
                );
                earlier = Some(match earlier {
                    Some(delivery) => format!("{delivery}; {warning}"),
                    None => warning,
                });
            }
        }
        self.finish_with(id, earlier)
    }

    /// Appends `questions.answered` once. Only the owner answers: an agent CLI among the caller's process
    /// ancestors refuses, except the secretary head through its socket (`source` `secretary`). `source`
    /// is the route and is kept as `via`; one other than `secretary` and `gateway:<caller>` gives no
    /// exemption.
    pub fn answer(
        &self,
        id: &str,
        option: Option<&str>,
        text: Option<&str>,
        source: Option<&str>,
    ) -> Result<Done<()>, Refusal> {
        platform()?;
        let caller = self.caller.caller()?;
        let owner = match source {
            Some("secretary") => caller
                .roles
                .iter()
                .any(|role| role.starts_with(SECRETARY_ROLE)),
            Some(route) if route.starts_with("gateway:") => !caller.is_agent,
            _ => !caller.is_agent,
        };
        if !owner {
            return Err(Refusal::new(
                "answer-not-owner",
                "only the owner answers a question: an agent CLI is among this caller's process ancestors",
            ));
        }
        let (option, text) = (
            option.filter(|s| !s.is_empty()),
            text.filter(|s| !s.is_empty()),
        );
        let fold = self.read()?;
        let question = fold.get(id).ok_or_else(|| unknown(id))?;
        match question.state {
            State::Open => {}
            State::Answered | State::Acked => {
                return Err(Refusal::new(
                    "question-already-answered",
                    format!("{id} already has an answer"),
                ))
            }
            State::Cancelled => return Err(not_open(id, "answer", question.state)),
        }
        let option = check_answer(question, option, text)?;
        self.append(
            ANSWERED,
            &Answered {
                id: id.to_owned(),
                option: option.map(str::to_owned),
                text: text.map(str::to_owned),
                by: OWNER.to_owned(),
                via: source.map(str::to_owned),
                answered_at: iso_utc_now(),
                answerer: None,
                channel: None,
                untrusted: false,
            },
        )?;
        self.finish(())
    }

    /// Accepts an attestation from a trusted channel adapter, not raw webhook
    /// identity claims. Signature checking is the gateway adapter's responsibility.
    /// Content stays untrusted even when the answerer's identity was verified.
    pub fn answer_external(
        &self,
        id: &str,
        answerer: &Recipient,
        payload: &AnswerPayload,
        channel: &str,
    ) -> Result<Done<()>, Refusal> {
        platform()?;
        let fold = self.read()?;
        let question = fold.get(id).ok_or_else(|| unknown(id))?;
        if question.state != State::Open {
            return Err(not_open(id, "answer_external", question.state));
        }
        if question.asked.to.as_ref() != Some(answerer) {
            return Err(Refusal::new(
                "answerer-mismatch",
                "the channel's attested answerer is not this question's recipient",
            ));
        }
        if channel.trim().is_empty() {
            return Err(Refusal::incomplete(
                "an external answer needs a channel",
                vec!["channel".into()],
            ));
        }
        let option = payload.option.as_deref().filter(|s| !s.is_empty());
        let text = payload.text.as_deref().filter(|s| !s.is_empty());
        let option = check_answer(question, option, text)?;
        self.append(
            ANSWERED,
            &Answered {
                id: id.to_owned(),
                option: option.map(str::to_owned),
                text: text.map(str::to_owned),
                by: answerer.reference().to_owned(),
                via: None,
                answered_at: iso_utc_now(),
                answerer: Some(answerer.clone()),
                channel: Some(channel.to_owned()),
                untrusted: true,
            },
        )?;
        self.finish(())
    }

    /// Appends `questions.acked`: the asker confirms it received the answer.
    pub fn ack(&self, id: &str) -> Result<Done<()>, Refusal> {
        platform()?;
        let caller = self.caller.caller()?;
        let fold = self.read()?;
        let question = fold.get(id).ok_or_else(|| unknown(id))?;
        if !may_close(&caller, question) {
            return Err(not_asker(id));
        }
        if question.state != State::Answered {
            return Err(not_open(id, "ack", question.state));
        }
        self.append(
            ACKED,
            &Acked {
                id: id.to_owned(),
                by: caller.handle,
                at: iso_utc_now(),
            },
        )?;
        self.finish(())
    }

    /// Appends `questions.cancelled` for a question that is open or answered.
    pub fn cancel(&self, id: &str, reason: &str) -> Result<Done<()>, Refusal> {
        platform()?;
        let caller = self.caller.caller()?;
        if reason.trim().is_empty() {
            return Err(Refusal::incomplete(
                "a cancel needs --reason",
                vec!["reason".into()],
            ));
        }
        let fold = self.read()?;
        let question = fold.get(id).ok_or_else(|| unknown(id))?;
        if !may_close(&caller, question) {
            return Err(not_asker(id));
        }
        if !matches!(question.state, State::Open | State::Answered) {
            return Err(not_open(id, "cancel", question.state));
        }
        self.append(
            CANCELLED,
            &Cancelled {
                id: id.to_owned(),
                by: caller.handle,
                reason: reason.to_owned(),
                at: iso_utc_now(),
            },
        )?;
        self.finish(())
    }

    /// The questions of `which`, with how many wait for the owner.
    pub fn list(&self, which: Which) -> Result<Done<Listing>, Refusal> {
        platform()?;
        let fold = self.read()?;
        let needs_you = fold
            .questions()
            .filter(|q| q.state == State::Open && q.asked.to.is_none())
            .count();
        let questions = fold
            .questions()
            .filter(|q| match which {
                Which::Open => q.state == State::Open,
                Which::Answered => q.state == State::Answered,
                Which::All => true,
            })
            .cloned()
            .collect();
        Ok(Done {
            warning: self.refresh_view(&fold),
            value: Listing {
                needs_you,
                questions,
            },
        })
    }

    /// One question with its conflicts.
    pub fn show(&self, id: &str) -> Result<Done<Question>, Refusal> {
        platform()?;
        let fold = self.read()?;
        let question = fold.get(id).ok_or_else(|| unknown(id))?.clone();
        Ok(Done {
            warning: self.refresh_view(&fold),
            value: question,
        })
    }
}
