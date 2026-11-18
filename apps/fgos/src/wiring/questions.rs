//! The host provider behind `fgos questions [list] [--all] [--answered]`, `show`, `ask`, `answer`, `ack` and
//! `cancel`. The crate `fgos-questions` owns every rule (shape, ref, who may answer or close, the fold); this module
//! wires its ports: the stream of owner questions in the Event Store (`StoreLogDoor::open_stream`), the caller from
//! Identity, and the Work layer's open gates and `fgos ask` items through the doctor bridge request `work-questions`.
//!
//! The list prints what waits for the owner first ("needs you: N"), then one line per question, then the Work
//! section. The Work section is fail-open: when the bridge fails the list says `work-sources: unavailable <reason>`
//! and still exits 0 with the store's questions. A refusal of the crate keeps its stable code
//! (`packages/questions/contracts/refusals.v1.json`) in the message and takes the exit status of the code's category.

use std::borrow::Cow;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::sync::OnceLock;

use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl,
    OperationDescriptor, OperationEffect, OperationId, OperationIdempotency, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
    StreamingMode, VerbAnswer,
};
use fgos_identity::shared::EntryLog;
use fgos_questions::caller::{CallerSource, IdentityCaller};
use fgos_questions::record::STREAM;
use fgos_questions::store::{LogOpener, LoggedEvent, Question, QuestionLog, State};
use fgos_questions::usecase::{Done, Questions, Which};
use fgos_questions::Refusal;
use serde_json::{json, Value};

pub const READ_OPERATION_ID: &str = "questions.read";
pub const WRITE_OPERATION_ID: &str = "questions.write";

/// The sub-commands of the verb. A call with none is `list`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["list", "show", "ask", "answer", "ack", "cancel"];
/// The sub-command a call without one runs.
pub const DEFAULT_SUBCOMMAND: &str = "list";

/// The write sub-commands: the ones the invocation doors count as writing the shared store.
pub const WRITE_SUBCOMMANDS: &[&str] = &["ask", "answer", "ack", "cancel"];

/// How many characters of a Work question the list shows; `--json` carries all of it.
const WORK_QUESTION_WIDTH: usize = 120;

const REFUSALS: &str = include_str!("../../../../packages/questions/contracts/refusals.v1.json");

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("questions"),
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

pub const READ_DESCRIPTOR: ProviderDescriptor = descriptor(
    READ_OPERATION_ID,
    "questions.read.request",
    "questions.read.outcome",
);
pub const WRITE_DESCRIPTOR: ProviderDescriptor = descriptor(
    WRITE_OPERATION_ID,
    "questions.write.request",
    "questions.write.outcome",
);

const fn catalog_entry(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
    effect: OperationEffect,
    idempotency: OperationIdempotency,
    policy: &'static str,
) -> OperationDescriptor {
    OperationDescriptor {
        operation_id: OperationId::from_static(id),
        owning_component_id: Cow::Borrowed("questions"),
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        effect,
        idempotency,
        authority_policy_id: Cow::Borrowed(policy),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    }
}

/// The operations this module serves, in the shape of the host catalog's entries.
pub const CATALOG_ENTRIES: [OperationDescriptor; 2] = [
    catalog_entry(
        READ_OPERATION_ID,
        "questions.read.request",
        "questions.read.outcome",
        OperationEffect::Read,
        OperationIdempotency::Safe,
        "questions.read",
    ),
    catalog_entry(
        WRITE_OPERATION_ID,
        "questions.write.request",
        "questions.write.outcome",
        OperationEffect::Write,
        OperationIdempotency::None,
        "questions.write",
    ),
];

/// The operation a call of `sub` runs.
pub fn operation_for(sub: &str) -> &'static str {
    if WRITE_SUBCOMMANDS.contains(&sub) {
        WRITE_OPERATION_ID
    } else {
        READ_OPERATION_ID
    }
}

/// What the caller asked of `fgos questions`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verb {
    List {
        which: WhichList,
    },
    Show {
        id: String,
    },
    Ask {
        reference: Option<String>,
        /// `--input <file>`; `None` with `--input -` reads the payload from stdin.
        input: Option<String>,
        migrated: bool,
        supersedes: Option<String>,
    },
    Answer {
        id: String,
        option: Option<String>,
        text: Option<String>,
        source: Option<String>,
    },
    Ack {
        id: String,
    },
    Cancel {
        id: String,
        reason: Option<String>,
    },
}

/// Which questions a list shows (the crate's `Which`, made comparable).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WhichList {
    Open,
    Answered,
    All,
}

impl Verb {
    pub fn sub(&self) -> &'static str {
        match self {
            Verb::List { .. } => "list",
            Verb::Show { .. } => "show",
            Verb::Ask { .. } => "ask",
            Verb::Answer { .. } => "answer",
            Verb::Ack { .. } => "ack",
            Verb::Cancel { .. } => "cancel",
        }
    }
}

/// One call. `root` is the project the doors resolved; it is the caller's checkout a ref is checked in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QuestionsRequest {
    pub root: PathBuf,
    pub verb: Verb,
    pub json: bool,
    /// The payload of `ask --input -`.
    pub stdin: Option<Vec<u8>>,
}

impl QuestionsRequest {
    pub fn operation_id(&self) -> &'static str {
        operation_for(self.verb.sub())
    }
}

// ---------------------------------------------------------------------------------------------
// The ports

/// The crate's log port over Identity's entry log (the one adapter of an Event Store stream).
struct StreamLog(Box<dyn EntryLog>);

fn passed(refusal: fgos_identity::Refusal) -> Refusal {
    Refusal::new(refusal.reason, refusal.detail)
}

impl QuestionLog for StreamLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), Refusal> {
        self.0.append(event_type, payload).map_err(passed)
    }

    fn read(&self) -> Result<Vec<LoggedEvent>, Refusal> {
        let (events, _) = self.0.read().map_err(passed)?;
        Ok(events
            .into_iter()
            .map(|event| LoggedEvent {
                event_type: event.event_type,
                payload: event.payload,
            })
            .collect())
    }
}

/// Opens the owner-question stream of the clone a directory is in, written as `writer`.
pub struct HostLogOpener {
    writer: String,
}

impl HostLogOpener {
    pub fn new(writer: impl Into<String>) -> Self {
        Self {
            writer: writer.into(),
        }
    }

    /// The opener of a reader: it appends nothing, so no session is its writer.
    pub fn reader() -> Self {
        Self::new("questions-reader")
    }
}

impl LogOpener for HostLogOpener {
    fn open(&self, dir: &Path) -> Result<Option<Box<dyn QuestionLog>>, Refusal> {
        let log = super::identity_log::StoreLogDoor
            .open_stream(dir, &self.writer, STREAM)
            .map_err(passed)?;
        Ok(log.map(|log| Box::new(StreamLog(log)) as Box<dyn QuestionLog>))
    }
}

// ---------------------------------------------------------------------------------------------
// Refusals

/// The exit category a refusal code carries in the contract; a code the contract does not list (an Event Store
/// pass-through such as `event-store-append-failed`) is an unexpected failure.
fn category_of(code: &str) -> &'static str {
    static CATEGORIES: OnceLock<Vec<(String, String)>> = OnceLock::new();
    let table = CATEGORIES.get_or_init(|| {
        let contract: Value = serde_json::from_str(REFUSALS).expect("refusals.v1.json is JSON");
        contract["refusals"]
            .as_array()
            .map(|all| {
                all.iter()
                    .filter_map(|r| {
                        Some((
                            r["code"].as_str()?.to_owned(),
                            r["category"].as_str()?.to_owned(),
                        ))
                    })
                    .collect()
            })
            .unwrap_or_default()
    });
    let category = table
        .iter()
        .find(|(known, _)| known == code)
        .map_or("unexpected", |(_, category)| category.as_str());
    match category {
        "precondition" => "precondition",
        "conflict" => "conflict",
        "validation" => "validation",
        "not-found" => "not-found",
        "corrupt-log" => "corrupt-log",
        "lock-timeout" => "lock-timeout",
        _ => "unexpected",
    }
}

fn refused(refusal: &Refusal) -> CategorisedRefusal {
    let category = category_of(&refusal.code);
    let message = format!("{} [{}]", refusal.detail, refusal.code);
    if category == "unexpected" {
        CategorisedRefusal::unexpected(message)
    } else {
        CategorisedRefusal::new(category, message)
    }
}

fn validation(message: impl Into<String>) -> CategorisedRefusal {
    CategorisedRefusal::new("validation", message)
}

// ---------------------------------------------------------------------------------------------
// Rendering

/// The age of an instant as one short word (`4m`, `3h`, `2d`); `?` for a stamp that is not RFC 3339.
fn age(asked_at: &str, now_ms: i64) -> String {
    let Some(then) = parse_rfc3339_millis(asked_at) else {
        return "?".to_owned();
    };
    let seconds = ((now_ms - then) / 1000).max(0);
    match seconds {
        s if s < 3600 => format!("{}m", s / 60),
        s if s < 86_400 => format!("{}h", s / 3600),
        s => format!("{}d", s / 86_400),
    }
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_millis() as i64)
}

fn recommended(question: &Question) -> Option<&str> {
    question
        .asked
        .parts
        .options
        .iter()
        .find(|option| option.recommended == Some(true))
        .map(|option| option.label.as_str())
}

/// The command that answers a store question: the recommended option when there is one.
fn answer_command(question: &Question) -> String {
    let id = &question.asked.id;
    match recommended(question) {
        Some(label) => format!("fgos questions answer {id} --option \"{label}\""),
        None => format!("fgos questions answer {id} --text \"<answer>\""),
    }
}

/// Questions in the order the owner should read them: by what they block, then the oldest first. A question
/// the store holds carries no plan priority, so the order has no such key.
fn ordered(mut questions: Vec<Question>) -> Vec<Question> {
    questions.sort_by(|a, b| {
        (&a.asked.blocks, &a.asked.asked_at, &a.asked.id).cmp(&(
            &b.asked.blocks,
            &b.asked.asked_at,
            &b.asked.id,
        ))
    });
    questions
}

fn state_word(state: State) -> &'static str {
    match state {
        State::Open => "open",
        State::Answered => "answered",
        State::Acked => "acked",
        State::Cancelled => "cancelled",
    }
}

fn one_line(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn question_row(question: &Question, now: i64) -> Value {
    let asked = &question.asked;
    let mut row = json!({
        "id": asked.id,
        "state": state_word(question.state),
        "headline": asked.headline,
        "blocks": asked.blocks,
        "stage": asked.stage,
        "ref": asked.origin.value,
        "askedAt": asked.asked_at,
        "age": age(&asked.asked_at, now),
        "asker": { "handle": asked.asker.handle, "roles": asked.asker.roles },
        "recommended": recommended(question),
    });
    if question.state == State::Open {
        row["answerCommand"] = json!(answer_command(question));
    }
    row
}

fn question_line(question: &Question, now: i64) -> String {
    let asked = &question.asked;
    let mut line = format!(
        "{}  {}  [recommended: {}]  blocks: {}  age: {}",
        asked.id,
        one_line(&asked.headline),
        recommended(question).unwrap_or("none"),
        one_line(&asked.blocks),
        age(&asked.asked_at, now),
    );
    if question.state == State::Open {
        line.push_str(&format!("  answer: {}", answer_command(question)));
    } else {
        line.push_str(&format!("  ({})", state_word(question.state)));
    }
    line
}

fn show_text(question: &Question) -> String {
    let asked = &question.asked;
    let parts = &asked.parts;
    let mut out = vec![
        format!("{}  {}", asked.id, one_line(&asked.headline)),
        format!(
            "state: {}  stage: {}  ref: {}  blocks: {}",
            state_word(question.state),
            asked.stage,
            asked.origin.value,
            one_line(&asked.blocks)
        ),
        format!(
            "asked by {} ({}) at {}",
            asked.asker.handle,
            if asked.asker.roles.is_empty() {
                "no role".to_owned()
            } else {
                asked.asker.roles.join(", ")
            },
            asked.asked_at
        ),
        String::new(),
        format!("What is happening: {}", parts.what),
        format!("Cause: {}", parts.cause),
        "Options:".to_owned(),
    ];
    for option in &parts.options {
        let mark = if option.recommended == Some(true) {
            " (recommended)"
        } else {
            ""
        };
        out.push(format!(
            "  - {}{}: {}\n      gain: {}\n      harm: {}\n      cost: {}",
            option.label, mark, option.does, option.gain, option.harm, option.cost
        ));
    }
    out.push(format!("Recommendation: {}", parts.recommendation));
    out.push(format!(
        "Scope of the answer: allows {}; forbids {}",
        parts.scope.allows, parts.scope.forbids
    ));
    if let Some(answer) = &question.answer {
        out.push(String::new());
        out.push(format!(
            "Answered at {} by {}{}: option {}, text {}",
            answer.answered_at,
            answer.by,
            answer
                .via
                .as_ref()
                .map_or(String::new(), |via| format!(" via {via}")),
            answer.option.as_deref().unwrap_or("-"),
            answer.text.as_deref().unwrap_or("-"),
        ));
    }
    for conflict in &question.conflicts {
        out.push(format!(
            "Conflict: a later answer at {} by {} (option {}, text {}) lost to the first",
            conflict.answered_at,
            conflict.by,
            conflict.option.as_deref().unwrap_or("-"),
            conflict.text.as_deref().unwrap_or("-"),
        ));
    }
    if let Some(acked) = &question.acked {
        out.push(format!("Acknowledged at {} by {}", acked.at, acked.by));
    }
    if let Some(cancelled) = &question.cancelled {
        out.push(format!(
            "Cancelled at {} by {}: {}",
            cancelled.at, cancelled.by, cancelled.reason
        ));
    }
    out.join("\n")
}

// ---------------------------------------------------------------------------------------------
// The Work section

/// What the Work layer holds for the owner, or why it could not be read.
pub type WorkSection = Result<Value, String>;

/// Reads the Work section through the doctor bridge. The reason of a failure is one line.
pub fn read_work_section(root: &Path) -> WorkSection {
    super::doctor::bridge::NodeBridge::new()
        .work_questions(root)
        .map_err(|fault| one_line(&fault.message()))
}

fn work_count(section: &Value) -> usize {
    ["gates", "asks"]
        .iter()
        .map(|key| section[key].as_array().map_or(0, Vec::len))
        .sum()
}

/// The first `max` characters of `text`, marked when cut: a parked item's question is its whole five-part text.
fn clipped(text: &str, max: usize) -> String {
    if text.chars().count() <= max {
        return text.to_owned();
    }
    let head: String = text.chars().take(max).collect();
    format!("{head}...")
}

fn work_lines(section: &Value) -> Vec<String> {
    let mut lines = Vec::new();
    for key in ["gates", "asks"] {
        for item in section[key].as_array().into_iter().flatten() {
            let text = |field: &str| {
                let line = one_line(item[field].as_str().unwrap_or(""));
                if field == "question" {
                    clipped(&line, WORK_QUESTION_WIDTH)
                } else {
                    line
                }
            };
            let title = text("title");
            lines.push(format!(
                "{}  {}{}  answer: {}",
                text("ref"),
                if title.is_empty() {
                    String::new()
                } else {
                    format!("{title}: ")
                },
                text("question"),
                text("answerDoor"),
            ));
        }
    }
    lines
}

// ---------------------------------------------------------------------------------------------
// The verbs

/// What a call needs from the process: the Work section reader and the clock, so a test gives its own.
pub struct Environment<'a> {
    pub work: &'a dyn Fn(&Path) -> WorkSection,
    pub now_ms: i64,
}

fn warn(warning: Option<String>) {
    if let Some(warning) = warning {
        eprintln!("fgos: warning: {warning}");
    }
}

/// The input of `ask`: the file or stdin payload as JSON, with the flags that name a field applied on top.
fn ask_input(
    request: &QuestionsRequest,
    reference: &Option<String>,
    input: &Option<String>,
    migrated: bool,
    supersedes: &Option<String>,
) -> Result<Value, CategorisedRefusal> {
    let bytes = match input {
        Some(path) => std::fs::read(path)
            .map_err(|e| validation(format!("questions ask cannot read --input {path}: {e}")))?,
        None => request.stdin.clone().ok_or_else(|| {
            validation("questions ask needs --input <file|->, and stdin was empty")
        })?,
    };
    let mut value: Value = serde_json::from_slice(&bytes)
        .map_err(|e| validation(format!("questions ask: the input is not JSON ({e})")))?;
    let object = value
        .as_object_mut()
        .ok_or_else(|| validation("questions ask: the input is not a JSON object"))?;
    if let Some(reference) = reference {
        object.insert("ref".into(), json!(reference));
    }
    if migrated {
        object.insert("migrated".into(), json!(true));
    }
    if let Some(old) = supersedes {
        object.insert("supersedes".into(), json!(old));
    }
    object.entry("migrated").or_insert(json!(false));
    Ok(value)
}

fn present(request: &QuestionsRequest, data: Value, text: String) -> VerbAnswer {
    VerbAnswer {
        data,
        exit: 0,
        text: (!request.json).then(|| format!("{text}\n")),
    }
}

/// Runs one call. Reads and writes are the crate's; this only shapes the answer.
pub fn answer(
    request: &QuestionsRequest,
    log: &dyn QuestionLog,
    caller: &dyn CallerSource,
    env: &Environment,
) -> Result<VerbAnswer, CategorisedRefusal> {
    let checkout = request.root.as_path();
    let cache_dir = checkout.join(".fgos").join("cache");
    let questions = Questions {
        log,
        caller,
        checkout,
        cache_dir: &cache_dir,
    };
    let pass = |r: Refusal| refused(&r);
    match &request.verb {
        Verb::List { which } => {
            let crate_which = match which {
                WhichList::Open => Which::Open,
                WhichList::Answered => Which::Answered,
                WhichList::All => Which::All,
            };
            let Done { value, warning } = questions.list(crate_which).map_err(pass)?;
            warn(warning);
            let work = if *which == WhichList::Answered {
                None
            } else {
                Some((env.work)(checkout))
            };
            let rows = ordered(value.questions);
            let waiting_in_work = match &work {
                Some(Ok(section)) => work_count(section),
                _ => 0,
            };
            let needs_you = value.needs_you + waiting_in_work;
            let mut data = json!({
                "needsYou": needs_you,
                "questions": rows.iter().map(|q| question_row(q, env.now_ms)).collect::<Vec<_>>(),
            });
            let mut text = vec![format!("needs you: {needs_you}")];
            text.extend(rows.iter().map(|q| question_line(q, env.now_ms)));
            match &work {
                Some(Ok(section)) => {
                    data["work"] = section.clone();
                    let lines = work_lines(section);
                    if !lines.is_empty() {
                        text.push(format!("work ({}):", lines.len()));
                        text.extend(lines.into_iter().map(|line| format!("  {line}")));
                    }
                }
                Some(Err(reason)) => {
                    data["work"] = json!({ "unavailable": reason });
                    text.push(format!("work-sources: unavailable {reason}"));
                }
                None => {}
            }
            Ok(present(request, data, text.join("\n")))
        }
        Verb::Show { id } => {
            let Done { value, warning } = questions.show(id).map_err(pass)?;
            warn(warning);
            let data = json!({ "question": value });
            Ok(present(request, data, show_text(&value)))
        }
        Verb::Ask {
            reference,
            input,
            migrated,
            supersedes,
        } => {
            let input = ask_input(request, reference, input, *migrated, supersedes)?;
            let Done { value, warning } = questions.ask(&input).map_err(pass)?;
            warn(warning);
            Ok(present(request, json!({ "id": value }), value))
        }
        Verb::Answer {
            id,
            option,
            text,
            source,
        } => {
            let Done { warning, .. } = questions
                .answer(id, option.as_deref(), text.as_deref(), source.as_deref())
                .map_err(pass)?;
            warn(warning);
            Ok(present(
                request,
                json!({ "id": id, "state": "answered" }),
                format!("answered {id}"),
            ))
        }
        Verb::Ack { id } => {
            let Done { warning, .. } = questions.ack(id).map_err(pass)?;
            warn(warning);
            Ok(present(
                request,
                json!({ "id": id, "state": "acked" }),
                format!("acked {id}"),
            ))
        }
        Verb::Cancel { id, reason } => {
            let Done { warning, .. } = questions
                .cancel(id, reason.as_deref().unwrap_or(""))
                .map_err(pass)?;
            warn(warning);
            Ok(present(
                request,
                json!({ "id": id, "state": "cancelled" }),
                format!("cancelled {id}"),
            ))
        }
    }
}

/// The caller of this process, as Identity knows it.
fn process_caller() -> IdentityCaller {
    IdentityCaller {
        state_root: fgos_holder_lock::state_root().0,
        pid: std::process::id(),
        pane: None,
    }
}

/// Opens the stream and runs the call in the real process: the writer of an append is the caller's session.
fn run(request: &QuestionsRequest) -> Result<VerbAnswer, CategorisedRefusal> {
    let caller = process_caller();
    let writer = if WRITE_SUBCOMMANDS.contains(&request.verb.sub()) {
        caller.caller().map_err(|r| refused(&r))?.session_id
    } else {
        String::new()
    };
    let opener = if writer.is_empty() {
        HostLogOpener::reader()
    } else {
        HostLogOpener::new(writer)
    };
    let log = opener
        .open(&request.root)
        .map_err(|r| refused(&r))?
        .ok_or_else(|| {
            refused(&Refusal::new(
                "event-store-no-repository",
                "there is no repository to hold the question store",
            ))
        })?;
    answer(
        request,
        log.as_ref(),
        &caller,
        &Environment {
            work: &read_work_section,
            now_ms: now_ms(),
        },
    )
}

/// The provider of the two operations.
pub struct QuestionsProvider {
    descriptor: ProviderDescriptor,
}

impl QuestionsProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for QuestionsProvider {
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
                .downcast_ref::<QuestionsRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not QuestionsRequest".into())
                })?;
            let output: Box<dyn std::any::Any + Send> = match run(request) {
                Ok(answer) => Box::new(answer),
                Err(refusal) => Box::new(refusal),
            };
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                output,
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_refusal_exits_with_the_category_its_code_has_in_the_contract() {
        for (code, exit) in [
            ("question-unknown", 4),
            ("question-already-answered", 3),
            ("answer-not-owner", 2),
            ("question-unclear", 4),
            ("event-store-lock-timeout", 7),
            ("event-store-append-failed", 1),
        ] {
            let refusal = refused(&Refusal::new(code, "why"));
            assert_eq!(refusal.exit_code(), exit, "{code}");
            assert_eq!(refusal.message, format!("why [{code}]"));
        }
    }

    #[test]
    fn a_long_work_question_is_cut_in_the_list_and_whole_in_the_data() {
        let long = "x".repeat(300);
        let section = json!({ "gates": [], "asks": [{ "ref": "work:t", "title": "T", "question": long, "answerDoor": "fgos answer t" }] });
        let lines = work_lines(&section);
        assert_eq!(lines.len(), 1);
        assert!(
            lines[0].contains(&format!("{}...", "x".repeat(WORK_QUESTION_WIDTH))),
            "{}",
            lines[0]
        );
        assert!(!lines[0].contains(&"x".repeat(WORK_QUESTION_WIDTH + 1)));
        assert!(lines[0].ends_with("answer: fgos answer t"));
    }

    #[test]
    fn an_age_is_the_largest_whole_unit() {
        let now = parse_rfc3339_millis("2026-11-19T12:00:00.000Z").unwrap();
        assert_eq!(age("2026-11-19T11:56:00.000Z", now), "4m");
        assert_eq!(age("2026-11-19T09:00:00.000Z", now), "3h");
        assert_eq!(age("2026-11-17T12:00:00.000Z", now), "2d");
        assert_eq!(age("not a stamp", now), "?");
    }

    #[test]
    fn the_catalog_entries_match_the_provider_descriptors() {
        for (entry, provider) in CATALOG_ENTRIES
            .iter()
            .zip([READ_DESCRIPTOR, WRITE_DESCRIPTOR])
        {
            assert_eq!(entry.operation_id, provider.operation_id);
            assert_eq!(entry.request_contract, provider.request_contract);
            assert_eq!(entry.outcome_contract, provider.outcome_contract);
        }
        assert_eq!(operation_for("list"), READ_OPERATION_ID);
        assert_eq!(operation_for("answer"), WRITE_OPERATION_ID);
    }
}
