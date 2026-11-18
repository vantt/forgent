//! Friction management for Observe: record, resolve, list, show, rank, classes.
//!
//! New friction is written as v2 records (`fgos.friction.recorded`, `fgos.friction.resolved`) through the record
//! write door. Reads cover those records and the old `friction` shards until the shards are migrated, so a store
//! that is not migrated still shows every record. A friction is settled by a later resolve of its subject (or, for a
//! resolve by signature, of its class); the settle rule is the same for both stores.

use crate::contract::{RecordSource, SourceError, Subject, Window};
use crate::query::{bucket_start, run, Agg, AggValue, Bucket, Query, QueryContext};
use crate::record::registry::{EmbeddedDeclaration, Registry};
use crate::record::store::{new_record_id, RecordDoor, WriteOutcome, RECORDS_STORE};
use crate::record::types::{
    AttrValue, Basis, Origin, Record, Redaction, SubjectRef, DETAIL_MAX_BYTES, RECORD_VERSION,
};
use crate::shard::{self, is_session_shard, StoredRecord, UnsafeShard};
use crate::store_lock::acquire_store_lock;
use crate::time::{now_iso, ParsedWindow};
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::path::Path;

/// The declaration of both friction kinds, for the composition root's embedded list.
pub const FRICTION_DECLARATION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fgos-observe-friction",
    json: include_str!("../friction-kinds.json"),
};

pub const RECORDED_KIND: &str = "fgos.friction.recorded";
pub const RESOLVED_KIND: &str = "fgos.friction.resolved";
const KIND_ATTR: &str = "fgos.friction.kind";
const LAYER_ATTR: &str = "fgos.friction.layer";
const CLASS_ATTR: &str = "fgos.friction.class";
const DISPOSITION_ATTR: &str = "fgos.friction.disposition";
const PRODUCER_ATTR: &str = "fgos.friction.producer";
const DOC_TYPE_ATTR: &str = "fgos.friction.doc_type";
const REASON_ATTR: &str = "fgos.friction.reason";
const ATTEMPTS_MEASURE: &str = "fgos.friction.attempts";

/// The component layers a friction names: the layers of the platform's parts, then the layers older records carry.
pub const PUBLISHED_LAYERS: &[&str] = &[
    "skill",
    "tool",
    "runner",
    "workflow",
    "git",
    "provider",
    "config",
    "docs",
    "state",
    "verification",
    "environment",
    "spec",
    "context",
    "task",
    "task-spec",
    "executor",
    "attestation",
];

pub const PUBLISHED_KINDS: &[&str] = &["bug", "instability", "missing", "awkward", "doc"];

pub const PUBLISHED_DISPOSITIONS: &[&str] = &["advisory", "blocked", "parked", "halted"];

pub const VALID_REASONS: &[&str] = &["answer", "done", "wontfix", "clarify-pass", "migrated"];

/// A resolve reason may also be `filed:<backlog-id>`: the friction became that backlog row.
const FILED_PREFIX: &str = "filed:";

pub const VALID_DOC_TYPES: &[&str] = &["tutorial", "how-to", "reference", "explanation"];

/// What a friction may point at besides its subject.
pub const REF_KINDS: &[&str] = &[
    "run", "session", "plan", "phase", "backlog", "executor", "case", "work",
];

const STORE: &str = "friction";
const DETAIL_REDACTION_REV: &str = "friction-detail-cap.v1";
const RECORD_ORIGIN: &str = "fgos friction record";
const LEGACY_ORIGIN: &str = "legacy-friction-shard";

/// Prefix of every refusal caused by the caller's input (never by the store), so
/// a client can tell the two apart from the first line of the host's error.
pub fn invalid_input(message: impl std::fmt::Display) -> String {
    format!("friction-invalid-input: {message}")
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallerInfo {
    pub pid: u32,
    #[serde(rename = "sessionId", skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}

pub fn current_caller() -> CallerInfo {
    let identity = fgos_identity::resolve_current();
    let session_id = match identity.source {
        fgos_identity::Source::Env => Some(identity.id.to_string()),
        fgos_identity::Source::Pid | fgos_identity::Source::Unresolved => None,
    };
    CallerInfo {
        pid: std::process::id(),
        session_id,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrictionInput {
    pub subject: Subject,
    /// The friction kind (bug, instability, missing, awkward, doc); older callers leave it out.
    pub kind: Option<String>,
    /// Further subjects the friction points at.
    pub refs: Vec<SubjectRef>,
    pub layer: String,
    #[serde(rename = "errorClass")]
    pub error_class: String,
    pub disposition: String,
    pub detail: String,
    pub producer: String,
    pub attempts: Option<u32>,
    #[serde(rename = "docType")]
    pub doc_type: Option<String>,
}

fn one_of(value: &str, allowed: &[&str]) -> bool {
    allowed.contains(&value)
}

pub fn validate_record_input(input: &FrictionInput) -> Result<(), String> {
    if input.subject.id.trim().is_empty() {
        return Err(invalid_input("subject id must not be empty"));
    }
    if !one_of(&input.layer, PUBLISHED_LAYERS) {
        return Err(invalid_input(format!(
            "invalid layer \"{}\". Published layers: {}",
            input.layer,
            PUBLISHED_LAYERS.join(", ")
        )));
    }
    if let Some(kind) = &input.kind {
        if !one_of(kind, PUBLISHED_KINDS) {
            return Err(invalid_input(format!(
                "invalid kind \"{kind}\". Allowed kinds: {}",
                PUBLISHED_KINDS.join(", ")
            )));
        }
    }
    for reference in &input.refs {
        if !one_of(&reference.kind, REF_KINDS) || reference.id.trim().is_empty() {
            return Err(invalid_input(format!(
                "invalid ref \"{}:{}\". Expected <kind>:<id>, kind one of {}",
                reference.kind,
                reference.id,
                REF_KINDS.join(", ")
            )));
        }
    }
    if !one_of(&input.disposition, PUBLISHED_DISPOSITIONS) {
        return Err(invalid_input(format!(
            "invalid disposition \"{}\". Allowed dispositions: {}",
            input.disposition,
            PUBLISHED_DISPOSITIONS.join(", ")
        )));
    }
    if input.error_class.trim().is_empty() {
        return Err(invalid_input("errorClass must not be empty"));
    }
    if input.producer.trim().is_empty() {
        return Err(invalid_input("producer must not be empty"));
    }
    if let Some(dt) = &input.doc_type {
        if !one_of(dt, VALID_DOC_TYPES) {
            return Err(invalid_input(format!(
                "invalid docType \"{}\". Allowed docTypes: {}",
                dt,
                VALID_DOC_TYPES.join(", ")
            )));
        }
    }
    Ok(())
}

/// The backlog row a `filed:<id>` reason names.
fn filed_backlog(reason: &str) -> Option<&str> {
    reason
        .strip_prefix(FILED_PREFIX)
        .filter(|id| !id.is_empty())
}

pub fn validate_resolve_input(reason: &str, by: &str) -> Result<(), String> {
    if !one_of(reason, VALID_REASONS) && filed_backlog(reason).is_none() {
        return Err(invalid_input(format!(
            "invalid resolve reason \"{}\". Allowed reasons: {}, or {FILED_PREFIX}<backlog-id>",
            reason,
            VALID_REASONS.join(", ")
        )));
    }
    if by.trim().is_empty() {
        return Err(invalid_input("by must not be empty"));
    }
    Ok(())
}

/// What a resolve settles: every unsettled friction of one subject, or of one signature.
#[derive(Debug, Clone)]
pub enum ResolveTarget {
    Subject(Subject),
    Class(String),
}

/// A friction event with its stamp parsed once and the line it came from. Events of both stores are held in one
/// shape: `value` is the old shard form, so every reader and the settle rule see one thing.
#[derive(Clone)]
struct Event {
    value: Value,
    /// `None` only for a resolve whose stamp is free text (written by a past migration).
    millis: Option<i64>,
    /// The store the line came from; shard names are only unique inside one store.
    store: &'static str,
    shard: String,
    line: usize,
    /// The v2 record, for an event read from the record store.
    record: Option<Record>,
}

impl Event {
    fn kind(&self) -> &str {
        self.value.get("type").and_then(Value::as_str).unwrap_or("")
    }

    fn text(&self, name: &str) -> Option<&str> {
        self.value.get(name).and_then(Value::as_str)
    }

    fn subject(&self) -> (String, String) {
        let field = |name: &str| {
            self.value
                .get("subject")
                .and_then(|s| s.get(name))
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        };
        (field("kind"), field("id"))
    }

    /// The signature of a recorded friction; for a resolve, the signature it is limited to.
    fn class(&self) -> Option<&str> {
        if self.kind() == "friction-resolved" {
            self.text("class")
        } else {
            self.text("errorClass")
        }
    }

    /// The v2 form of a recorded friction: the stored record, or an old shard line projected onto it.
    fn projected(&self) -> Option<Record> {
        if let Some(record) = &self.record {
            return Some(record.clone());
        }
        if self.kind() != "friction-recorded" {
            return None;
        }
        let (kind, id) = self.subject();
        let mut attrs = BTreeMap::new();
        for (attr, field) in [
            (LAYER_ATTR, "layer"),
            (CLASS_ATTR, "errorClass"),
            (DISPOSITION_ATTR, "disposition"),
            (PRODUCER_ATTR, "producer"),
        ] {
            if let Some(value) = self.text(field) {
                attrs.insert(attr.to_owned(), AttrValue::Str(value.to_owned()));
            }
        }
        let mut measures = BTreeMap::new();
        if let Some(attempts) = self.value.get("attempts").and_then(Value::as_u64) {
            measures.insert(ATTEMPTS_MEASURE.to_owned(), attempts.into());
        }
        Some(Record {
            v: RECORD_VERSION,
            id: legacy_id(&self.shard, self.line),
            kind: RECORDED_KIND.to_owned(),
            ts: self.text("ts").unwrap_or_default().to_owned(),
            end_ts: None,
            subject: SubjectRef { kind, id },
            refs: Vec::new(),
            attrs,
            measures,
            basis: Basis::Reported,
            origin: Origin {
                source: LEGACY_ORIGIN.to_owned(),
                ..Origin::default()
            },
            detail: None,
            redaction: None,
        })
    }
}

/// The id a line of an old `friction` shard has as a v2 record, before and after migration.
fn legacy_id(shard: &str, line: usize) -> String {
    format!("legacy:{shard}:{line}")
}

/// The instant of a stamp. A trailing `~` (written by a past migration for a
/// resolve with no stamp of its own) means "just after" the stamp before it.
fn stamp_millis(ts: &str) -> Option<i64> {
    match ts.strip_suffix('~') {
        Some(base) => parse_rfc3339_millis(base).map(|millis| millis + 1),
        None => parse_rfc3339_millis(ts),
    }
}

/// Whether `resolve` settles `record` (same subject; a resolve by signature only the records of that signature).
/// A later instant settles; an equal instant settles only by file order inside one session-named shard
/// (`pid-<N>` shard names are not unique across machines); a resolve with no instant settles the records before
/// it in its own shard.
fn settles(resolve: &Event, record: &Event) -> bool {
    if resolve
        .text("class")
        .is_some_and(|c| record.class() != Some(c))
    {
        return false;
    }
    let earlier_line_of_same_shard = resolve.store == record.store
        && resolve.shard == record.shard
        && resolve.line > record.line;
    match (resolve.millis, record.millis) {
        (Some(resolved), Some(recorded)) if resolved != recorded => resolved > recorded,
        (Some(_), Some(_)) => earlier_line_of_same_shard && is_session_shard(&resolve.shard),
        _ => earlier_line_of_same_shard,
    }
}

fn is_settled(record: &Event, resolves: &[&Event]) -> bool {
    resolves.iter().any(|resolve| settles(resolve, record))
}

/// The recorded frictions no resolve settles, across subjects.
fn unsettled(events: &[Event]) -> Vec<&Event> {
    let mut resolves: HashMap<(String, String), Vec<&Event>> = HashMap::new();
    for event in events.iter().filter(|e| e.kind() == "friction-resolved") {
        resolves.entry(event.subject()).or_default().push(event);
    }
    events
        .iter()
        .filter(|event| event.kind() == "friction-recorded")
        .filter(|event| !event.subject().1.is_empty())
        .filter(|event| {
            let own = resolves.get(&event.subject());
            !is_settled(event, own.map(Vec::as_slice).unwrap_or(&[]))
        })
        .collect()
}

fn attr<'a>(record: &'a Record, name: &str) -> Option<&'a str> {
    match record.attrs.get(name) {
        Some(AttrValue::Str(value)) => Some(value),
        _ => None,
    }
}

fn subject_json(subject: &SubjectRef) -> Value {
    json!({ "kind": subject.kind, "id": subject.id })
}

/// A friction record in the old shard form.
fn old_form(record: &Record) -> Option<Value> {
    let text = |name: &str| attr(record, name).map_or(Value::Null, |v| json!(v));
    let refs: Vec<Value> = record.refs.iter().map(subject_json).collect();
    match record.kind.as_str() {
        RECORDED_KIND => Some(json!({
            "v": RECORD_VERSION,
            "type": "friction-recorded",
            "id": record.id,
            "ts": record.ts,
            "subject": subject_json(&record.subject),
            "refs": refs,
            "frictionKind": text(KIND_ATTR),
            "layer": text(LAYER_ATTR),
            "errorClass": text(CLASS_ATTR),
            "disposition": text(DISPOSITION_ATTR),
            "detail": record.detail.clone().unwrap_or_default(),
            "attempts": record.measures.get(ATTEMPTS_MEASURE),
            "docType": text(DOC_TYPE_ATTR),
            "producer": text(PRODUCER_ATTR),
        })),
        RESOLVED_KIND => Some(json!({
            "v": RECORD_VERSION,
            "type": "friction-resolved",
            "id": record.id,
            "ts": record.ts,
            "subject": subject_json(&record.subject),
            "refs": refs,
            "class": text(CLASS_ATTR),
            "reason": text(REASON_ATTR),
            "by": text(PRODUCER_ATTR),
        })),
        _ => None,
    }
}

/// Every usable friction event of both stores ordered by instant. A bad line, or a record whose stamp does not
/// parse, is named on stderr and skipped; an unreadable store is an error.
fn read_events(root: &Path) -> Result<Vec<Event>, String> {
    let mut events = Vec::new();
    for store in [STORE, RECORDS_STORE] {
        let read = shard::read_store(root, store, UnsafeShard::Fail).map_err(|e| e.to_string())?;
        let mut invalid = read.invalid;
        for StoredRecord { value, shard, line } in read.records {
            let (value, record) = if store == STORE {
                (value, None)
            } else {
                let is_friction = value
                    .get("kind")
                    .and_then(Value::as_str)
                    .is_some_and(|k| k == RECORDED_KIND || k == RESOLVED_KIND);
                if !is_friction {
                    continue;
                }
                match serde_json::from_value::<Record>(value)
                    .ok()
                    .and_then(|r| old_form(&r).map(|form| (form, r)))
                {
                    Some((form, record)) => (form, Some(record)),
                    None => {
                        invalid.push(shard::InvalidLine {
                            file: format!(".fgos/observe/{store}/{shard}.jsonl"),
                            line,
                            reason: "not a friction record".to_string(),
                        });
                        continue;
                    }
                }
            };
            let millis = value
                .get("ts")
                .and_then(Value::as_str)
                .and_then(stamp_millis);
            let is_resolve = value.get("type").and_then(Value::as_str) == Some("friction-resolved");
            if millis.is_none() && !is_resolve {
                invalid.push(shard::InvalidLine {
                    file: format!(".fgos/observe/{store}/{shard}.jsonl"),
                    line,
                    reason: "ts is not an RFC 3339 instant".to_string(),
                });
                continue;
            }
            events.push(Event {
                value,
                millis,
                store: if store == STORE { STORE } else { RECORDS_STORE },
                shard,
                line,
                record,
            });
        }
        shard::warn_skipped(store, &invalid);
    }
    // A migrated old line exists as a v2 record under its legacy id, and two writers may each have stored the same
    // v2 record: every friction counts once, the v2 record first.
    let mut seen = HashSet::new();
    events.retain(|event| match &event.record {
        Some(record) => seen.insert(record.id.clone()),
        None => true,
    });
    events.retain(|event| {
        event.record.is_some() || !seen.contains(&legacy_id(&event.shard, event.line))
    });
    events.sort_by_key(|event| event.millis);
    Ok(events)
}

fn friction_door(root: &Path) -> RecordDoor {
    RecordDoor::new(root.to_path_buf(), vec![FRICTION_DECLARATION], None)
}

fn origin() -> Origin {
    Origin {
        source: RECORD_ORIGIN.to_owned(),
        component: Some("observe".to_owned()),
        writer: current_caller().session_id,
        ..Origin::default()
    }
}

/// The detail as stored: trimmed and cut at the record's byte cap on a character boundary, stamped with the rule
/// that did it. An empty detail is no detail.
fn stamped_detail(detail: &str) -> (Option<String>, Option<Redaction>) {
    let mut text = detail.trim();
    if text.is_empty() {
        return (None, None);
    }
    if text.len() > DETAIL_MAX_BYTES {
        let mut end = DETAIL_MAX_BYTES;
        while !text.is_char_boundary(end) {
            end -= 1;
        }
        text = &text[..end];
    }
    (
        Some(text.to_owned()),
        Some(Redaction {
            rev: DETAIL_REDACTION_REV.to_owned(),
        }),
    )
}

fn text_attr(value: &str) -> AttrValue {
    AttrValue::Str(value.to_owned())
}

fn outcome_fields(outcome: &WriteOutcome) -> (&'static str, Option<&str>) {
    match outcome {
        WriteOutcome::Written => ("written", None),
        WriteOutcome::Duplicate => ("duplicate", None),
        WriteOutcome::Rejected(message) => ("rejected", Some(message)),
        WriteOutcome::Failed(message) => ("failed", Some(message)),
    }
}

fn landed(outcome: &WriteOutcome) -> bool {
    matches!(outcome, WriteOutcome::Written | WriteOutcome::Duplicate)
}

/// Lower-case letters and digits only, so `Verify_Miss` and `verify-miss` are one signature.
fn normalized(class: &str) -> String {
    class
        .chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect()
}

fn edit_distance(a: &str, b: &str) -> usize {
    let b: Vec<char> = b.chars().collect();
    let mut row: Vec<usize> = (0..=b.len()).collect();
    for (i, ca) in a.chars().enumerate() {
        let mut diagonal = row[0];
        row[0] = i + 1;
        for (j, cb) in b.iter().enumerate() {
            let above = row[j + 1];
            row[j + 1] = (diagonal + usize::from(ca != *cb))
                .min(above + 1)
                .min(row[j] + 1);
            diagonal = above;
        }
    }
    row[b.len()]
}

/// Whether two different signatures read as one thing: the same once spelling is ignored, or one letter apart in a
/// name of eight letters or more. Shorter names a letter apart are usually different words (`usage`, `image`).
fn close_signatures(a: &str, b: &str) -> bool {
    let (a, b) = (normalized(a), normalized(b));
    a == b || (a.chars().count().min(b.chars().count()) >= 8 && edit_distance(&a, &b) == 1)
}

/// The signature of every recorded friction, counted: the `fgos.friction.recorded` records of the records store and
/// the recorded lines of the old shards. Other kinds are skipped unread, and an unreadable store gives nothing.
fn recorded_signatures(root: &Path) -> BTreeMap<String, usize> {
    let mut counts: BTreeMap<String, usize> = BTreeMap::new();
    for store in [STORE, RECORDS_STORE] {
        let Ok(read) = shard::read_store(root, store, UnsafeShard::Report) else {
            continue;
        };
        for StoredRecord { value, .. } in read.records {
            let class = if store == STORE {
                (value.get("type").and_then(Value::as_str) == Some("friction-recorded"))
                    .then(|| {
                        value
                            .get("errorClass")
                            .and_then(Value::as_str)
                            .map(str::to_owned)
                    })
                    .flatten()
            } else if value.get("kind").and_then(Value::as_str) == Some(RECORDED_KIND) {
                serde_json::from_value::<Record>(value)
                    .ok()
                    .and_then(|record| attr(&record, CLASS_ATTR).map(str::to_owned))
            } else {
                None
            };
            if let Some(class) = class {
                *counts.entry(class).or_default() += 1;
            }
        }
    }
    counts
}

/// A warning for each existing signature close to `class` but not the same. The warning is advice, never a reason
/// to refuse the record.
fn close_signature_warnings(root: &Path, class: &str) -> Vec<String> {
    recorded_signatures(root)
        .into_iter()
        .filter(|(existing, _)| existing != class && close_signatures(existing, class))
        .map(|(existing, count)| {
            format!(
                "signature \"{class}\" is close to the existing signature \"{existing}\" ({count} recorded); \
                 reuse it unless they are different things"
            )
        })
        .collect()
}

/// Records a new friction event through the record write door. The door never fails the caller: a record it
/// refuses or cannot store is reported in the answer (`ok: false`), not as an error. A recorded signature close
/// to an existing one is named in `warnings` and on stderr.
pub fn record(root: &Path, input: FrictionInput) -> Result<Value, String> {
    validate_record_input(&input)?;
    let warnings = close_signature_warnings(root, &input.error_class);
    for warning in &warnings {
        eprintln!("fgos: warning: friction {warning}");
    }

    let (detail, redaction) = stamped_detail(&input.detail);
    let mut attrs = BTreeMap::from([
        (LAYER_ATTR.to_owned(), text_attr(&input.layer)),
        (CLASS_ATTR.to_owned(), text_attr(&input.error_class)),
        (DISPOSITION_ATTR.to_owned(), text_attr(&input.disposition)),
        (PRODUCER_ATTR.to_owned(), text_attr(&input.producer)),
    ]);
    if let Some(kind) = &input.kind {
        attrs.insert(KIND_ATTR.to_owned(), text_attr(kind));
    }
    if let Some(doc_type) = &input.doc_type {
        attrs.insert(DOC_TYPE_ATTR.to_owned(), text_attr(doc_type));
    }
    let mut measures = BTreeMap::new();
    if let Some(attempts) = input.attempts {
        measures.insert(ATTEMPTS_MEASURE.to_owned(), attempts.into());
    }
    let ts = now_iso();
    let id = new_record_id();
    let outcome = friction_door(root).write(Record {
        v: RECORD_VERSION,
        id: id.clone(),
        kind: RECORDED_KIND.to_owned(),
        ts: ts.clone(),
        end_ts: None,
        subject: SubjectRef {
            kind: input.subject.kind.as_str().to_owned(),
            id: input.subject.id.clone(),
        },
        refs: input.refs,
        attrs,
        measures,
        basis: Basis::Reported,
        origin: origin(),
        detail,
        redaction,
    });

    let (name, message) = outcome_fields(&outcome);
    let mut answer = json!({
        "ok": landed(&outcome),
        "id": id,
        "ts": ts,
        "subject": input.subject.to_string_repr(),
        "outcome": name,
        "warnings": warnings,
    });
    if let Some(message) = message {
        answer["message"] = json!(message);
    }
    Ok(answer)
}

/// What `migrate_to_records` did, in numbers.
#[derive(Default)]
struct MigrationCounts {
    recorded_in: usize,
    resolved_in: usize,
    other_lines: usize,
    unusable: Vec<String>,
}

fn utc_stamp(millis: i64) -> Result<String, String> {
    format_unix_millis_rfc3339(millis, 0).ok_or_else(|| "instant out of range".to_owned())
}

/// The v2 record of one old shard line, or why the line cannot become one.
fn migrated_record(event: &Value, shard: &str, line: usize) -> Result<Record, String> {
    let text = |name: &str| event.get(name).and_then(Value::as_str);
    let resolved = event.get("type").and_then(Value::as_str) == Some("friction-resolved");
    let subject = event.get("subject");
    let field = |name: &str| {
        subject
            .and_then(|s| s.get(name))
            .and_then(Value::as_str)
            .filter(|v| !v.is_empty())
            .map(str::to_owned)
    };
    let (Some(kind), Some(id)) = (field("kind"), field("id")) else {
        return Err("no subject".to_owned());
    };
    let millis = text("ts")
        .and_then(stamp_millis)
        .ok_or_else(|| "ts is not an RFC 3339 instant".to_owned())?;
    let ts = match text("ts") {
        Some(ts) if stamp_millis(ts) == Some(millis) && !ts.ends_with('~') => ts.to_owned(),
        _ => utc_stamp(millis)?,
    };
    let mut attrs = BTreeMap::new();
    let mut measures = BTreeMap::new();
    let mut detail = None;
    let mut redaction = None;
    let record_kind = if resolved {
        for (attr, field) in [
            (CLASS_ATTR, "class"),
            (PRODUCER_ATTR, "by"),
            (REASON_ATTR, "reason"),
        ] {
            if let Some(value) = text(field) {
                attrs.insert(attr.to_owned(), text_attr(value));
            }
        }
        RESOLVED_KIND
    } else {
        for (attr, field) in [
            (LAYER_ATTR, "layer"),
            (CLASS_ATTR, "errorClass"),
            (DISPOSITION_ATTR, "disposition"),
            (PRODUCER_ATTR, "producer"),
            (DOC_TYPE_ATTR, "docType"),
        ] {
            if let Some(value) = text(field) {
                attrs.insert(attr.to_owned(), text_attr(value));
            }
        }
        if let Some(attempts) = event.get("attempts").and_then(Value::as_u64) {
            measures.insert(ATTEMPTS_MEASURE.to_owned(), attempts.into());
        }
        (detail, redaction) = stamped_detail(text("detail").unwrap_or_default());
        RECORDED_KIND
    };
    Ok(Record {
        v: RECORD_VERSION,
        id: legacy_id(shard, line),
        kind: record_kind.to_owned(),
        ts,
        end_ts: None,
        subject: SubjectRef { kind, id },
        refs: Vec::new(),
        attrs,
        measures,
        basis: Basis::Reported,
        origin: Origin {
            source: LEGACY_ORIGIN.to_owned(),
            component: Some("observe".to_owned()),
            writer: current_caller().session_id,
            ..Origin::default()
        },
        detail,
        redaction,
    })
}

/// Number of friction records in the v2 store, and the ids already there (any kind: a legacy id is never reused).
fn stored_friction(root: &Path) -> Result<(HashSet<String>, usize), String> {
    let read =
        shard::read_store(root, RECORDS_STORE, UnsafeShard::Fail).map_err(|e| e.to_string())?;
    let mut ids = HashSet::new();
    let mut friction = 0;
    for stored in read.records {
        let Some(id) = stored.value.get("id").and_then(Value::as_str) else {
            continue;
        };
        if ids.insert(id.to_owned())
            && stored
                .value
                .get("kind")
                .and_then(Value::as_str)
                .is_some_and(|k| k == RECORDED_KIND || k == RESOLVED_KIND)
        {
            friction += 1;
        }
    }
    Ok((ids, friction))
}

/// The id an event has as a v2 record: its own, or for an old shard line its legacy id.
fn event_id(event: &Event) -> String {
    event
        .record
        .as_ref()
        .map_or_else(|| legacy_id(&event.shard, event.line), |r| r.id.clone())
}

fn unsettled_ids(events: &[Event]) -> BTreeSet<String> {
    unsettled(events).into_iter().map(event_id).collect()
}

/// The store as readers would see it once `written` is appended to this writer's record shard: each migrated old
/// line replaced by its record, at the end of that shard.
fn migrated_view(events: &[Event], written: &[&Record]) -> Vec<Event> {
    let writer = shard::writer_shard_name();
    let ids: HashSet<&str> = written.iter().map(|r| r.id.as_str()).collect();
    let last_line = events
        .iter()
        .filter(|e| e.store == RECORDS_STORE && e.shard == writer)
        .map(|e| e.line)
        .max()
        .unwrap_or(0);
    let kept = events
        .iter()
        .filter(|e| e.record.is_some() || !ids.contains(event_id(e).as_str()))
        .cloned();
    let appended = written.iter().enumerate().filter_map(|(i, record)| {
        Some(Event {
            value: old_form(record)?,
            millis: stamp_millis(&record.ts),
            store: RECORDS_STORE,
            shard: writer.clone(),
            line: last_line + i + 1,
            record: Some((*record).clone()),
        })
    });
    kept.chain(appended).collect()
}

/// Old friction shard lines the v2 record store does not hold yet under the id `migrate_to_records` gives them
/// (`legacy:<shard>:<line>`). Read-only: takes no lock and writes nothing; the doctor's migration pointer counts with
/// it so the id rule lives here only.
pub fn unmigrated_count(root: &Path) -> Result<usize, String> {
    let old = shard::read_store(root, STORE, UnsafeShard::Fail).map_err(|e| e.to_string())?;
    let lines: Vec<&StoredRecord> = old
        .records
        .iter()
        .filter(|stored| {
            matches!(
                stored.value.get("type").and_then(Value::as_str),
                Some("friction-recorded" | "friction-resolved")
            )
        })
        .collect();
    if lines.is_empty() {
        return Ok(0);
    }
    let (existing, _) = stored_friction(root)?;
    Ok(lines
        .iter()
        .filter(|stored| !existing.contains(&legacy_id(&stored.shard, stored.line)))
        .count())
}

/// Copies every old `friction` shard line into the v2 record store through the record door, each under its fixed
/// id `legacy:<shard>:<line>`. The whole run holds the observe lock, checks the ids of the whole record store (every
/// writer's shard) before writing, and appends once, so a second run, or a run from another writer, writes nothing
/// already there. Before writing it proves the settle rule gives the same unsettled frictions over the store as it
/// is and as it would be after the append; if not, it writes nothing and names the frictions that would change.
/// The old shards are not touched. A line that cannot become a valid record is counted and named, never silently
/// dropped.
pub fn migrate_to_records(root: &Path) -> Result<Value, String> {
    let lock = acquire_store_lock(root).map_err(|e| e.to_string())?;
    let door = friction_door(root);
    let (existing, before) = stored_friction(root)?;
    let old = shard::read_store(root, STORE, UnsafeShard::Fail).map_err(|e| e.to_string())?;

    let mut counts = MigrationCounts::default();
    let mut records = Vec::new();
    let mut places = Vec::new();
    let mut already = 0;
    for StoredRecord { value, shard, line } in &old.records {
        match value.get("type").and_then(Value::as_str).unwrap_or("") {
            "friction-recorded" => counts.recorded_in += 1,
            "friction-resolved" => counts.resolved_in += 1,
            _ => {
                counts.other_lines += 1;
                continue;
            }
        }
        let place = format!("{shard}:{line}");
        let record = match migrated_record(value, shard, *line) {
            Ok(record) => record,
            Err(reason) => {
                counts.unusable.push(format!("{place}: {reason}"));
                continue;
            }
        };
        if existing.contains(&record.id) {
            already += 1;
            continue;
        }
        records.push(record);
        places.push(place);
    }

    let admitted: Vec<&Record> = records.iter().filter(|r| door.admits(r).is_ok()).collect();
    if !admitted.is_empty() {
        let events = read_events(root)?;
        let (now, then) = (
            unsettled_ids(&events),
            unsettled_ids(&migrated_view(&events, &admitted)),
        );
        if now != then {
            return Ok(json!({
                "ok": false,
                "in": { "recorded": counts.recorded_in, "resolved": counts.resolved_in, "other": counts.other_lines },
                "written": 0,
                "alreadyMigrated": already,
                "unusable": counts.unusable,
                "settleChanged": {
                    "settledByMigration": now.difference(&then).collect::<Vec<_>>(),
                    "unsettledByMigration": then.difference(&now).collect::<Vec<_>>(),
                },
                "records": { "before": before, "after": before },
            }));
        }
    }

    let mut written = 0;
    for (outcome, place) in door.write_all_held(&lock, records).into_iter().zip(&places) {
        match outcome {
            WriteOutcome::Written => written += 1,
            WriteOutcome::Duplicate => already += 1,
            WriteOutcome::Rejected(e) => counts.unusable.push(format!("{place}: {e}")),
            WriteOutcome::Failed(e) => return Err(format!("{place}: {e}")),
        }
    }
    drop(lock);
    Ok(json!({
        "ok": counts.unusable.is_empty(),
        "in": { "recorded": counts.recorded_in, "resolved": counts.resolved_in, "other": counts.other_lines },
        "written": written,
        "alreadyMigrated": already,
        "unusable": counts.unusable,
        "records": { "before": before, "after": before + written },
    }))
}

/// Resolves friction: every unsettled friction of a subject, or of a signature. Each settled subject gets one
/// resolve record, so a resolve by signature never settles another signature on the same subject.
pub fn resolve(
    root: &Path,
    target: ResolveTarget,
    reason: &str,
    by: &str,
) -> Result<Value, String> {
    validate_resolve_input(reason, by)?;

    let (class, subjects) = match &target {
        ResolveTarget::Subject(subject) => (
            None,
            vec![SubjectRef {
                kind: subject.kind.as_str().to_owned(),
                id: subject.id.clone(),
            }],
        ),
        ResolveTarget::Class(class) => {
            if class.trim().is_empty() {
                return Err(invalid_input("class must not be empty"));
            }
            let events = read_events(root)?;
            let mut seen = BTreeSet::new();
            let subjects = unsettled(&events)
                .into_iter()
                .filter(|event| event.class() == Some(class.as_str()))
                .map(|event| event.subject())
                .filter(|key| seen.insert(key.clone()))
                .map(|(kind, id)| SubjectRef { kind, id })
                .collect();
            (Some(class.as_str()), subjects)
        }
    };

    let door = friction_door(root);
    let mut outcomes = Vec::new();
    let mut last_ts = None;
    for subject in subjects {
        let mut attrs = BTreeMap::from([
            (PRODUCER_ATTR.to_owned(), text_attr(by)),
            (REASON_ATTR.to_owned(), text_attr(reason)),
        ]);
        if let Some(class) = class {
            attrs.insert(CLASS_ATTR.to_owned(), text_attr(class));
        }
        let ts = now_iso();
        let id = new_record_id();
        let outcome = door.write(Record {
            v: RECORD_VERSION,
            id: id.clone(),
            kind: RESOLVED_KIND.to_owned(),
            ts: ts.clone(),
            end_ts: None,
            refs: filed_backlog(reason)
                .map(|backlog| {
                    vec![SubjectRef {
                        kind: "backlog".to_owned(),
                        id: backlog.to_owned(),
                    }]
                })
                .unwrap_or_default(),
            subject: subject.clone(),
            attrs,
            measures: BTreeMap::new(),
            basis: Basis::Reported,
            origin: origin(),
            detail: None,
            redaction: None,
        });
        let (name, message) = outcome_fields(&outcome);
        let mut entry = json!({ "id": id, "subject": format!("{}:{}", subject.kind, subject.id), "outcome": name });
        if let Some(message) = message {
            entry["message"] = json!(message);
        }
        last_ts = Some(ts);
        outcomes.push((landed(&outcome), entry));
    }

    let mut answer = json!({
        "ok": outcomes.iter().all(|(landed, _)| *landed),
        "reason": reason,
        "by": by,
        "resolved": outcomes.iter().filter(|(landed, _)| *landed).count(),
        "outcomes": outcomes.into_iter().map(|(_, entry)| entry).collect::<Vec<_>>(),
    });
    match &target {
        ResolveTarget::Subject(subject) => answer["subject"] = json!(subject.to_string_repr()),
        ResolveTarget::Class(class) => answer["class"] = json!(class),
    }
    if let Some(ts) = last_ts {
        answer["ts"] = json!(ts);
    }
    Ok(answer)
}

/// Lists friction events with optional filters.
pub fn list(
    root: &Path,
    kind_filter: Option<&str>,
    layer_filter: Option<&str>,
    since_filter: Option<&str>,
) -> Result<Value, String> {
    let since = since_filter
        .map(|since| {
            ParsedWindow::parse(&Window {
                since: Some(since.to_string()),
                until: None,
            })
        })
        .transpose()
        .map_err(invalid_input)?;
    let matches: Vec<Value> = read_events(root)?
        .into_iter()
        .filter(|event| event.kind() == "friction-recorded")
        .filter(|event| kind_filter.is_none_or(|k| event.subject().0 == k))
        .filter(|event| layer_filter.is_none_or(|l| event.text("layer") == Some(l)))
        .filter(|event| since.is_none_or(|w| w.contains(event.millis.unwrap_or(i64::MIN))))
        .map(|event| event.value)
        .collect();
    Ok(json!(matches))
}

/// Shows friction history and current status for a single subject.
pub fn show(root: &Path, subject_str: &str) -> Result<Value, String> {
    let subject = Subject::parse(subject_str).ok_or_else(|| {
        invalid_input(format!(
            "invalid subject \"{}\". Expected format kind:id",
            subject_str
        ))
    })?;
    let key = (subject.kind.as_str().to_string(), subject.id.clone());

    let events: Vec<Event> = read_events(root)?
        .into_iter()
        .filter(|event| event.subject() == key)
        .collect();
    let recorded: Vec<&Event> = events
        .iter()
        .filter(|e| e.kind() == "friction-recorded")
        .collect();
    let resolves: Vec<&Event> = events
        .iter()
        .filter(|e| e.kind() == "friction-resolved")
        .collect();
    let unsettled_count = recorded
        .iter()
        .filter(|rec| !is_settled(rec, &resolves))
        .count();

    Ok(json!({
        "subject": subject.to_string_repr(),
        "unsettled": unsettled_count,
        "totalRecorded": recorded.len(),
        "totalResolved": resolves.len(),
        "records": recorded.iter().map(|e| e.value.clone()).collect::<Vec<_>>()
    }))
}

/// The signatures of recorded friction: how many records each has, how many are unsettled, and the last one.
pub fn classes(root: &Path) -> Result<Value, String> {
    let events = read_events(root)?;
    let open: BTreeMap<&str, usize> =
        unsettled(&events)
            .into_iter()
            .fold(BTreeMap::new(), |mut counts, event| {
                if let Some(class) = event.class() {
                    *counts.entry(class).or_default() += 1;
                }
                counts
            });
    // (count, last instant) per class.
    let mut seen: BTreeMap<&str, (usize, Option<i64>)> = BTreeMap::new();
    for event in events.iter().filter(|e| e.kind() == "friction-recorded") {
        if let Some(class) = event.class() {
            let entry = seen.entry(class).or_default();
            entry.0 += 1;
            entry.1 = entry.1.max(event.millis);
        }
    }
    let mut rows: Vec<(&str, usize, Option<i64>)> = seen
        .into_iter()
        .map(|(class, (count, last))| (class, count, last))
        .collect();
    rows.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(b.0)));
    Ok(json!(rows
        .into_iter()
        .map(|(class, count, last)| json!({
            "class": class,
            "count": count,
            "unsettled": open.get(class).copied().unwrap_or(0),
            "lastSeen": last.and_then(|ms| format_unix_millis_rfc3339(ms, 0)),
        }))
        .collect::<Vec<_>>()))
}

/// The unsettled records, handed to the query engine as the one source it reads.
struct UnsettledSource(Vec<Record>);

impl RecordSource for UnsettledSource {
    fn source_id(&self) -> &'static str {
        "fgos.friction.unsettled"
    }

    fn kinds(&self) -> &[&str] {
        &[RECORDED_KIND]
    }

    fn records(&self, _: &Path, _: &Window) -> Result<Vec<Record>, SourceError> {
        Ok(self.0.clone())
    }
}

/// A bucket word of `friction rank --bucket`.
pub fn parse_bucket(word: &str) -> Result<Bucket, String> {
    serde_json::from_value(json!(word)).map_err(|_| {
        invalid_input(format!(
            "invalid bucket \"{word}\". Allowed: hour, day, week"
        ))
    })
}

/// Ranks open friction by signature, most recorded first: each group has its count, the distinct subjects and refs
/// it touches, and when it was first and last seen. With a bucket there is one group per signature and bucket,
/// newest bucket first.
pub fn rank(root: &Path, limit: Option<usize>) -> Result<Value, String> {
    rank_by_bucket(root, limit, None)
}

pub fn rank_by_bucket(
    root: &Path,
    limit: Option<usize>,
    bucket: Option<Bucket>,
) -> Result<Value, String> {
    let events = read_events(root)?;
    let records: Vec<Record> = unsettled(&events)
        .into_iter()
        .filter_map(Event::projected)
        .collect();
    let registry = Registry::from_embedded(&[FRICTION_DECLARATION]).map_err(|e| e.to_string())?;
    let source = UnsettledSource(records.clone());
    let sources: [&dyn RecordSource; 1] = [&source];
    let now_millis = parse_rfc3339_millis(&now_iso()).unwrap_or_default();
    let query = Query {
        kind: vec![RECORDED_KIND.to_owned()],
        by: vec![CLASS_ATTR.to_owned()],
        bucket,
        agg: vec![Agg::Count, Agg::MaxTs],
        ..Query::default()
    };
    let result = run(
        &query,
        &QueryContext {
            registry: &registry,
            sources: &sources,
            root,
            now_millis,
            params: BTreeMap::new(),
        },
    )
    .map_err(|e| e.to_string())?;

    // The engine gives each group its count and newest instant. It has no aggregate for the oldest instant or for
    // distinct subjects and refs, so one pass over each group's members supplies firstSeen and distinctRefs.
    let mut groups = Vec::new();
    for row in result.rows {
        let Some(class) = row.group.get(CLASS_ATTR) else {
            continue;
        };
        let in_bucket = |record: &Record| -> bool {
            let Some(bucket) = bucket else { return true };
            let start = parse_rfc3339_millis(&record.ts)
                .and_then(|ms| format_unix_millis_rfc3339(bucket_start(ms, bucket), 0));
            start == row.bucket
        };
        let members: Vec<&Record> = records
            .iter()
            .filter(|record| attr(record, CLASS_ATTR) == Some(class.as_str()) && in_bucket(record))
            .collect();
        let mut refs = BTreeSet::new();
        for record in &members {
            refs.insert((record.subject.kind.as_str(), record.subject.id.as_str()));
            refs.extend(record.refs.iter().map(|r| (r.kind.as_str(), r.id.as_str())));
        }
        let first = members
            .iter()
            .filter_map(|record| parse_rfc3339_millis(&record.ts))
            .min();
        let last = match row.aggs.get("max:ts") {
            Some(Some(AggValue::Instant(ms))) => Some(*ms),
            _ => None,
        };
        let stamp = |ms: Option<i64>| ms.and_then(|ms| format_unix_millis_rfc3339(ms, 0));
        let mut group = json!({
            "class": class,
            "count": row.count,
            "distinctRefs": refs.len(),
            "firstSeen": stamp(first),
            "lastSeen": stamp(last),
        });
        if let Some(start) = &row.bucket {
            group["bucket"] = json!(start);
        }
        groups.push(group);
    }

    let text = |group: &Value, field: &str| group[field].as_str().unwrap_or("").to_owned();
    groups.sort_by(|a, b| {
        text(b, "bucket")
            .cmp(&text(a, "bucket"))
            .then_with(|| b["count"].as_u64().cmp(&a["count"].as_u64()))
            .then_with(|| text(b, "lastSeen").cmp(&text(a, "lastSeen")))
            .then_with(|| text(a, "class").cmp(&text(b, "class")))
    });
    if let Some(limit) = limit {
        groups.truncate(limit);
    }
    Ok(json!(groups))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_friction_record_resolve_lifecycle() {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let subj = Subject::parse("work:tsk-abc").unwrap();
        let input = FrictionInput {
            subject: subj.clone(),
            layer: "verification".to_string(),
            error_class: "verify-miss".to_string(),
            disposition: "blocked".to_string(),
            detail: "test detail".to_string(),
            producer: "runner.loop".to_string(),
            attempts: Some(1),
            doc_type: None,
            kind: None,
            refs: Vec::new(),
        };

        let rec_res = record(&tmp, input).unwrap();
        assert_eq!(rec_res["ok"], true);

        // List
        let list_res = list(&tmp, None, None, None).unwrap();
        let arr = list_res.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["subject"]["id"], "tsk-abc");

        // Rank before resolve
        let rank_res = rank(&tmp, None).unwrap();
        let rarr = rank_res.as_array().unwrap();
        assert_eq!(rarr.len(), 1);
        assert_eq!(rarr[0]["class"], "verify-miss");
        assert_eq!(rarr[0]["count"], 1);

        // Show before resolve
        let show_res = show(&tmp, "work:tsk-abc").unwrap();
        assert_eq!(show_res["unsettled"], 1);

        // Resolve
        let res_res = resolve(&tmp, ResolveTarget::Subject(subj.clone()), "done", "work").unwrap();
        assert_eq!(res_res["ok"], true);

        // Rank after resolve
        let rank_res_after = rank(&tmp, None).unwrap();
        assert_eq!(rank_res_after.as_array().unwrap().len(), 0);

        // Show after resolve
        let show_res_after = show(&tmp, "work:tsk-abc").unwrap();
        assert_eq!(show_res_after["unsettled"], 0);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_friction_validation_errors() {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-val-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        // Invalid layer
        let input = FrictionInput {
            subject: Subject::parse("work:tsk-bad").unwrap(),
            layer: "invalid-layer".to_string(),
            error_class: "err".to_string(),
            disposition: "advisory".to_string(),
            detail: "x".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: None,
            kind: None,
            refs: Vec::new(),
        };
        let refusal = record(&tmp, input).unwrap_err();
        assert!(
            refusal.starts_with("friction-invalid-input: invalid layer"),
            "{refusal}"
        );

        // Invalid docType
        let input_doctype = FrictionInput {
            subject: Subject::parse("work:tsk-bad").unwrap(),
            layer: "verification".to_string(),
            error_class: "err".to_string(),
            disposition: "advisory".to_string(),
            detail: "x".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: Some("nonexistent".to_string()),
            kind: None,
            refs: Vec::new(),
        };
        assert!(record(&tmp, input_doctype).is_err());

        // Invalid resolve reason
        assert!(resolve(
            &tmp,
            ResolveTarget::Subject(Subject::parse("work:tsk-bad").unwrap()),
            "bad-reason",
            "user"
        )
        .is_err());

        let _ = fs::remove_dir_all(&tmp);
    }

    fn temp_root(tag: &str) -> std::path::PathBuf {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(tmp.join(".fgos/observe/friction")).unwrap();
        fs::create_dir_all(tmp.join(".fgos/observe/records")).unwrap();
        tmp
    }

    fn friction_dir(root: &Path) -> std::path::PathBuf {
        root.join(".fgos/observe/friction")
    }

    fn recorded_line(id: &str, ts: &str) -> String {
        json!({
            "v": 1, "type": "friction-recorded", "ts": ts,
            "subject": { "kind": "work", "id": id },
            "layer": "verification", "errorClass": "verify-miss", "disposition": "blocked",
            "detail": "d", "attempts": 1, "docType": null, "producer": "test",
            "caller": { "pid": 1 }
        })
        .to_string()
    }

    fn resolved_line(id: &str, ts: &str) -> String {
        json!({
            "v": 1, "type": "friction-resolved", "ts": ts,
            "subject": { "kind": "work", "id": id },
            "reason": "done", "by": "test", "caller": { "pid": 1 }
        })
        .to_string()
    }

    fn fresh_input(id: &str) -> FrictionInput {
        FrictionInput {
            subject: Subject::parse(&format!("work:{id}")).unwrap(),
            layer: "verification".to_string(),
            error_class: "verify-miss".to_string(),
            disposition: "advisory".to_string(),
            detail: "fresh".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: None,
            kind: None,
            refs: Vec::new(),
        }
    }

    fn listed_ids(root: &Path) -> Vec<String> {
        list(root, None, None, None)
            .expect("friction list must succeed")
            .as_array()
            .unwrap()
            .iter()
            .map(|item| item["subject"]["id"].as_str().unwrap().to_string())
            .collect()
    }

    #[test]
    fn a_resolve_at_the_same_instant_or_later_settles_the_record_whatever_the_stamp_precision() {
        let tmp = temp_root("instants");
        let lines = [
            recorded_line("tsk-equal", "2026-10-01T10:00:00.000Z"),
            resolved_line("tsk-equal", "2026-10-01T10:00:00.000Z"),
            recorded_line("tsk-legacy-stamp", "2026-07-01T10:00:00Z"),
            resolved_line("tsk-legacy-stamp", "2026-07-01T10:00:00.500Z"),
        ];
        fs::write(
            friction_dir(&tmp).join("one-writer.jsonl"),
            format!("{}\n", lines.join("\n")),
        )
        .unwrap();

        for subject in ["work:tsk-equal", "work:tsk-legacy-stamp"] {
            assert_eq!(
                show(&tmp, subject).unwrap()["unsettled"],
                0,
                "{subject} stays unsettled"
            );
        }
        assert_eq!(
            rank(&tmp, None).unwrap(),
            json!([]),
            "rank still lists settled records"
        );
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_resolve_stamped_just_after_or_with_no_instant_settles_the_records_already_written_before_it(
    ) {
        let tmp = temp_root("legacy-stamps");
        let lines = [
            recorded_line("tsk-marker", "2026-07-01T10:00:00Z"),
            resolved_line("tsk-marker", "2026-07-01T10:00:00Z~"),
            recorded_line("tsk-free-text", "2026-07-01T10:00:00Z"),
            resolved_line("tsk-free-text", "sometime later"),
        ];
        fs::write(
            friction_dir(&tmp).join("one-writer.jsonl"),
            format!("{}\n", lines.join("\n")),
        )
        .unwrap();

        for id in ["tsk-marker", "tsk-free-text"] {
            assert_eq!(
                show(&tmp, &format!("work:{id}")).unwrap()["unsettled"],
                0,
                "{id} stays unsettled"
            );
        }
        assert_eq!(rank(&tmp, None).unwrap(), json!([]));
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn an_equal_instant_settles_in_a_session_shard_but_never_in_a_pid_shard() {
        let tmp = temp_root("pid-ties");
        let ts = "2026-10-01T10:00:00.000Z";
        for (shard, id) in [("pid-7", "tsk-pid"), ("session-a", "tsk-session")] {
            let lines = [recorded_line(id, ts), resolved_line(id, ts)];
            fs::write(
                friction_dir(&tmp).join(format!("{shard}.jsonl")),
                format!("{}\n", lines.join("\n")),
            )
            .unwrap();
        }
        assert_eq!(show(&tmp, "work:tsk-pid").unwrap()["unsettled"], 1);
        assert_eq!(show(&tmp, "work:tsk-session").unwrap()["unsettled"], 0);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_record_with_an_unparsable_stamp_is_skipped_by_every_reader() {
        let tmp = temp_root("bad-stamp");
        let lines = [
            recorded_line("tsk-good", "2026-10-01T10:00:00.000Z"),
            recorded_line("tsk-bad-stamp", "yesterday"),
        ];
        fs::write(
            friction_dir(&tmp).join("w.jsonl"),
            format!("{}\n", lines.join("\n")),
        )
        .unwrap();
        assert_eq!(listed_ids(&tmp), vec!["tsk-good".to_string()]);
        assert_eq!(
            show(&tmp, "work:tsk-bad-stamp").unwrap()["totalRecorded"],
            0
        );
        let _ = fs::remove_dir_all(&tmp);
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_writer_shard_is_refused_and_its_target_never_changes() {
        let tmp = temp_root("symlink");
        let external = temp_root("symlink-external");
        let target = external.join("outside.jsonl");
        let original = format!(
            "{}\n",
            recorded_line("tsk-outside", "2026-10-01T10:00:00.000Z")
        );
        fs::write(&target, &original).unwrap();
        std::os::unix::fs::symlink(
            &target,
            crate::shard::shard_path(&tmp, RECORDS_STORE).unwrap(),
        )
        .unwrap();

        assert_ne!(
            record(&tmp, fresh_input("tsk-new")).unwrap()["ok"],
            true,
            "record wrote through a symlinked shard"
        );
        assert_eq!(fs::read_to_string(&target).unwrap(), original);
        if let Ok(listed) = list(&tmp, None, None, None) {
            assert!(
                !listed.to_string().contains("tsk-outside"),
                "list read records through a symlinked shard"
            );
        }
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::remove_dir_all(&external);
    }

    fn input_of(id: &str, class: &str) -> FrictionInput {
        FrictionInput {
            error_class: class.to_string(),
            ..fresh_input(id)
        }
    }

    fn legacy_recorded(id: &str, class: &str, ts: &str) -> String {
        recorded_line(id, ts).replace("verify-miss", class)
    }

    fn stored_records(root: &Path) -> Vec<Value> {
        shard::read_store(root, RECORDS_STORE, UnsafeShard::Fail)
            .unwrap()
            .records
            .into_iter()
            .map(|stored| stored.value)
            .collect()
    }

    #[test]
    fn a_new_friction_is_a_v2_record_with_kind_layer_class_and_refs() {
        let tmp = temp_root("v2-attrs");
        let mut input = input_of("tsk-v2", "skill-misread");
        input.layer = "skill".to_string();
        input.kind = Some("awkward".to_string());
        input.attempts = Some(3);
        input.refs = vec![
            SubjectRef {
                kind: "plan".into(),
                id: "plans/x".into(),
            },
            SubjectRef {
                kind: "phase".into(),
                id: "12".into(),
            },
            SubjectRef {
                kind: "backlog".into(),
                id: "p-1".into(),
            },
        ];
        let answer = record(&tmp, input).unwrap();
        assert_eq!(answer["ok"], true, "{answer}");

        let stored = stored_records(&tmp);
        assert_eq!(stored.len(), 1);
        let line = &stored[0];
        assert_eq!(line["kind"], RECORDED_KIND);
        assert_eq!(line["subject"], json!({ "kind": "work", "id": "tsk-v2" }));
        assert_eq!(line["attrs"][KIND_ATTR], "awkward");
        assert_eq!(line["attrs"][LAYER_ATTR], "skill");
        assert_eq!(line["attrs"][CLASS_ATTR], "skill-misread");
        assert_eq!(line["attrs"][DISPOSITION_ATTR], "advisory");
        assert_eq!(line["attrs"][PRODUCER_ATTR], "test");
        assert_eq!(line["measures"][ATTEMPTS_MEASURE], 3);
        assert_eq!(
            line["refs"],
            json!([
                { "kind": "plan", "id": "plans/x" },
                { "kind": "phase", "id": "12" },
                { "kind": "backlog", "id": "p-1" }
            ])
        );
        assert_eq!(line["redaction"]["rev"], DETAIL_REDACTION_REV);
        assert!(
            fs::read_dir(friction_dir(&tmp)).unwrap().next().is_none(),
            "a new friction must not touch the old shards"
        );

        let mut bad_kind = input_of("tsk-v2", "x");
        bad_kind.kind = Some("meh".to_string());
        assert!(record(&tmp, bad_kind).unwrap_err().contains("invalid kind"));
        let mut bad_ref = input_of("tsk-v2", "x");
        bad_ref.refs = vec![SubjectRef {
            kind: "nope".into(),
            id: "1".into(),
        }];
        assert!(record(&tmp, bad_ref).unwrap_err().contains("invalid ref"));
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_resolve_by_class_settles_that_signature_only_and_names_the_backlog_row_it_became() {
        let tmp = temp_root("resolve-class");
        record(&tmp, input_of("tsk-a", "alpha-fault")).unwrap();
        record(&tmp, input_of("tsk-a", "beta-fault")).unwrap();
        record(&tmp, input_of("tsk-b", "alpha-fault")).unwrap();

        let answer = resolve(
            &tmp,
            ResolveTarget::Class("alpha-fault".to_string()),
            "filed:p-9",
            "test",
        )
        .unwrap();
        assert_eq!(answer["resolved"], 2, "{answer}");

        assert_eq!(show(&tmp, "work:tsk-a").unwrap()["unsettled"], 1);
        assert_eq!(show(&tmp, "work:tsk-b").unwrap()["unsettled"], 0);
        let open = rank(&tmp, None).unwrap();
        assert_eq!(open.as_array().unwrap().len(), 1);
        assert_eq!(open[0]["class"], "beta-fault");

        let resolved: Vec<Value> = stored_records(&tmp)
            .into_iter()
            .filter(|line| line["kind"] == RESOLVED_KIND)
            .collect();
        assert_eq!(resolved.len(), 2);
        assert!(resolved.iter().all(|line| line["refs"]
            == json!([{ "kind": "backlog", "id": "p-9" }])
            && line["attrs"][CLASS_ATTR] == "alpha-fault"));
        assert!(resolve(
            &tmp,
            ResolveTarget::Class("alpha-fault".to_string()),
            "filed:",
            "test"
        )
        .is_err());
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn rank_groups_by_signature_with_count_distinct_refs_and_first_and_last_seen_per_week() {
        let tmp = temp_root("rank-signature");
        // 2026-10-05 and 2026-10-06 are in one ISO week; 2026-10-13 is in the next.
        let lines = [
            legacy_recorded("tsk-a", "flaky-gate", "2026-10-05T10:00:00.000Z"),
            legacy_recorded("tsk-b", "flaky-gate", "2026-10-06T10:00:00.000Z"),
            legacy_recorded("tsk-a", "flaky-gate", "2026-10-13T10:00:00.000Z"),
            legacy_recorded("tsk-c", "other-fault", "2026-10-13T11:00:00.000Z"),
        ];
        fs::write(
            friction_dir(&tmp).join("one-writer.jsonl"),
            format!("{}\n", lines.join("\n")),
        )
        .unwrap();

        let all = rank(&tmp, None).unwrap();
        assert_eq!(all[0]["class"], "flaky-gate");
        assert_eq!(all[0]["count"], 3);
        assert_eq!(all[0]["distinctRefs"], 2);
        assert_eq!(all[0]["firstSeen"], "2026-10-05T10:00:00.000Z");
        assert_eq!(all[0]["lastSeen"], "2026-10-13T10:00:00.000Z");
        assert_eq!(all[1]["class"], "other-fault");

        let weekly = rank_by_bucket(&tmp, None, Some(Bucket::Week)).unwrap();
        let rows: Vec<(String, String, u64, u64)> = weekly
            .as_array()
            .unwrap()
            .iter()
            .map(|g| {
                (
                    g["bucket"].as_str().unwrap().to_string(),
                    g["class"].as_str().unwrap().to_string(),
                    g["count"].as_u64().unwrap(),
                    g["distinctRefs"].as_u64().unwrap(),
                )
            })
            .collect();
        assert_eq!(
            rows,
            vec![
                (
                    "2026-10-12T00:00:00.000Z".into(),
                    "other-fault".into(),
                    1,
                    1
                ),
                ("2026-10-12T00:00:00.000Z".into(), "flaky-gate".into(), 1, 1),
                ("2026-10-05T00:00:00.000Z".into(), "flaky-gate".into(), 2, 2),
            ]
        );
        assert_eq!(
            rank_by_bucket(&tmp, Some(1), None)
                .unwrap()
                .as_array()
                .unwrap()
                .len(),
            1
        );
        assert!(parse_bucket("month").is_err());
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_store_with_old_shards_and_new_records_lists_ranks_and_settles_both() {
        let tmp = temp_root("mixed");
        fs::write(
            friction_dir(&tmp).join("one-writer.jsonl"),
            format!(
                "{}\n",
                legacy_recorded("tsk-old", "shared-fault", "2026-10-01T10:00:00.000Z")
            ),
        )
        .unwrap();
        record(&tmp, input_of("tsk-new", "shared-fault")).unwrap();

        assert_eq!(
            listed_ids(&tmp),
            vec!["tsk-old".to_string(), "tsk-new".to_string()]
        );
        let ranked = rank(&tmp, None).unwrap();
        assert_eq!(ranked[0]["class"], "shared-fault");
        assert_eq!(ranked[0]["count"], 2);
        assert_eq!(ranked[0]["distinctRefs"], 2);
        assert_eq!(classes(&tmp).unwrap()[0]["unsettled"], 2);
        assert_eq!(show(&tmp, "work:tsk-old").unwrap()["unsettled"], 1);

        resolve(
            &tmp,
            ResolveTarget::Class("shared-fault".to_string()),
            "done",
            "test",
        )
        .unwrap();
        assert_eq!(rank(&tmp, None).unwrap(), json!([]));
        assert_eq!(show(&tmp, "work:tsk-old").unwrap()["unsettled"], 0);
        assert_eq!(classes(&tmp).unwrap()[0]["unsettled"], 0);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn recording_a_signature_close_to_an_existing_one_names_the_existing_one() {
        let tmp = temp_root("close-signature");
        assert_eq!(
            record(&tmp, input_of("tsk-1", "verify-miss")).unwrap()["warnings"],
            json!([])
        );
        let answer = record(&tmp, input_of("tsk-2", "Verify_Miss")).unwrap();
        let warnings = answer["warnings"].as_array().unwrap();
        assert_eq!(warnings.len(), 1, "{answer}");
        assert!(warnings[0].as_str().unwrap().contains("\"verify-miss\""));
        for id in ["tsk-3", "tsk-4"] {
            assert_eq!(
                record(&tmp, input_of(id, "state-corrupt")).unwrap()["warnings"],
                json!([]),
                "the same signature, or one far from every other, is not a close one"
            );
        }
        let answer = record(&tmp, input_of("tsk-5", "state-corupt")).unwrap();
        assert_eq!(
            answer["warnings"].as_array().unwrap().len(),
            1,
            "a long signature one letter off is a close one: {answer}"
        );
        for (first, second) in [("git-push", "git-pull"), ("usage", "image")] {
            record(&tmp, input_of("tsk-6", first)).unwrap();
            assert_eq!(
                record(&tmp, input_of("tsk-7", second)).unwrap()["warnings"],
                json!([]),
                "short signatures a few letters apart are different words: {first} / {second}"
            );
        }
        let _ = fs::remove_dir_all(&tmp);
    }

    fn old_store(tmp: &Path) {
        let lines = [
            legacy_recorded("tsk-a", "shared-fault", "2026-10-01T10:00:00.000Z"),
            legacy_recorded("tsk-b", "other-fault", "2026-10-01T11:00:00.000Z"),
            resolved_line("tsk-a", "2026-10-02T10:00:00.000Z"),
            json!({ "v": 1, "type": "migration", "ts": "2026-10-01T09:00:00.000Z" }).to_string(),
        ];
        fs::write(
            friction_dir(tmp).join("old-writer.jsonl"),
            format!("{}\n", lines.join("\n")),
        )
        .unwrap();
    }

    #[test]
    fn migrating_old_shards_twice_stores_every_line_once() {
        let tmp = temp_root("migrate-twice");
        old_store(&tmp);
        let first = migrate_to_records(&tmp).unwrap();
        assert_eq!(first["ok"], true, "{first}");
        assert_eq!(
            first["in"],
            json!({ "recorded": 2, "resolved": 1, "other": 1 })
        );
        assert_eq!(first["written"], 3);
        assert_eq!(first["records"], json!({ "before": 0, "after": 3 }));

        let second = migrate_to_records(&tmp).unwrap();
        assert_eq!(second["written"], 0, "{second}");
        assert_eq!(second["alreadyMigrated"], 3);
        assert_eq!(second["records"], json!({ "before": 3, "after": 3 }));
        assert_eq!(stored_records(&tmp).len(), 3);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_migrated_line_keeps_its_layer_class_subject_and_has_no_kind() {
        let tmp = temp_root("migrate-mapping");
        old_store(&tmp);
        migrate_to_records(&tmp).unwrap();
        let stored = stored_records(&tmp);
        let recorded = stored
            .iter()
            .find(|r| r["id"] == "legacy:old-writer:1")
            .expect("line 1 migrates under its legacy id");
        assert_eq!(recorded["kind"], RECORDED_KIND);
        assert_eq!(
            recorded["subject"],
            json!({ "kind": "work", "id": "tsk-a" })
        );
        assert_eq!(recorded["attrs"][LAYER_ATTR], "verification");
        assert_eq!(recorded["attrs"][CLASS_ATTR], "shared-fault");
        assert_eq!(recorded["attrs"][PRODUCER_ATTR], "test");
        assert_eq!(recorded["measures"][ATTEMPTS_MEASURE], 1);
        assert!(recorded["attrs"].get(KIND_ATTR).is_none());
        assert_eq!(recorded["ts"], "2026-10-01T10:00:00.000Z");
        let resolved = stored
            .iter()
            .find(|r| r["id"] == "legacy:old-writer:3")
            .expect("the resolve migrates too");
        assert_eq!(resolved["kind"], RESOLVED_KIND);
        assert_eq!(resolved["attrs"][REASON_ATTR], "done");
        let _ = fs::remove_dir_all(&tmp);
    }

    const MIGRATE_ROOT: &str = "FRICTION_TEST_MIGRATE_ROOT";
    const MIGRATE_REPORT: &str = "FRICTION_TEST_MIGRATE_REPORT";

    /// Child body: migrate the store at `MIGRATE_ROOT` as the writer named by `FGOS_SESSION_ID` and store the
    /// report at `MIGRATE_REPORT`. Does nothing in an ordinary run.
    #[test]
    fn migrate_child_entry() {
        let Ok(root) = std::env::var(MIGRATE_ROOT) else {
            return;
        };
        let report = migrate_to_records(Path::new(&root)).unwrap();
        fs::write(std::env::var(MIGRATE_REPORT).unwrap(), report.to_string()).unwrap();
    }

    /// Starts a migrate of `root` in a child process with the writer identity `writer`.
    fn migrate_as(root: &Path, writer: &str) -> (std::process::Child, std::path::PathBuf) {
        let report = root.join(format!("report-{writer}.json"));
        let child = std::process::Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "friction::tests::migrate_child_entry",
                "--test-threads",
                "1",
            ])
            .env("FGOS_SESSION_ID", writer)
            .env(MIGRATE_ROOT, root)
            .env(MIGRATE_REPORT, &report)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .spawn()
            .unwrap();
        (child, report)
    }

    fn finished(child: (std::process::Child, std::path::PathBuf)) -> Value {
        let (mut child, report) = child;
        assert!(child.wait().unwrap().success(), "migrate child failed");
        serde_json::from_slice(&fs::read(report).unwrap()).unwrap()
    }

    #[test]
    fn a_store_migrated_by_two_writers_or_half_migrated_counts_every_friction_once() {
        let tmp = temp_root("migrate-mixed");
        old_store(&tmp);
        // Two writers migrate at once: the lock lets one write every line and the other find them all there.
        let (a, b) = (
            migrate_as(&tmp, "migrate-writer-a"),
            migrate_as(&tmp, "migrate-writer-b"),
        );
        let mut reports = [finished(a), finished(b)];
        reports.sort_by_key(|r| r["written"].as_u64());
        assert_eq!(
            (reports[0]["written"].clone(), reports[1]["written"].clone()),
            (json!(0), json!(3)),
            "{reports:?}"
        );
        assert_eq!(reports[0]["alreadyMigrated"], 3);
        assert_eq!(reports[0]["records"], json!({ "before": 3, "after": 3 }));
        assert_eq!(stored_records(&tmp).len(), 3);

        let listed = list(&tmp, None, None, None).unwrap();
        assert_eq!(listed.as_array().unwrap().len(), 2, "{listed}");
        assert_eq!(classes(&tmp).unwrap().as_array().unwrap().len(), 2);
        assert_eq!(show(&tmp, "work:tsk-b").unwrap()["unsettled"], 1);
        assert_eq!(show(&tmp, "work:tsk-a").unwrap()["unsettled"], 0);
        let again = migrate_to_records(&tmp).unwrap();
        assert_eq!(again["written"], 0);
        assert_eq!(again["records"]["after"], 3, "{again}");

        // A half migrated store: the old shard still readable, one line already a record.
        let half = temp_root("migrate-half");
        old_store(&half);
        let one = temp_root("migrate-half-src");
        old_store(&one);
        migrate_to_records(&one).unwrap();
        fs::copy(
            fs::read_dir(one.join(".fgos/observe/records"))
                .unwrap()
                .filter_map(Result::ok)
                .find(|e| e.path().extension().is_some_and(|x| x == "jsonl"))
                .unwrap()
                .path(),
            half.join(".fgos/observe/records/other-writer.jsonl"),
        )
        .unwrap();
        assert_eq!(
            list(&half, None, None, None)
                .unwrap()
                .as_array()
                .unwrap()
                .len(),
            2
        );
        for dir in [&tmp, &half, &one] {
            let _ = fs::remove_dir_all(dir);
        }
    }

    #[test]
    fn a_migration_that_would_change_what_is_settled_writes_nothing_and_names_the_friction() {
        let tmp = temp_root("migrate-settle");
        let at = "2026-10-01T10:00:00.000Z";
        // In two session shards an equal instant does not settle; moved into one shard in order, it would.
        fs::write(
            friction_dir(&tmp).join("sess-a.jsonl"),
            format!("{}\n", recorded_line("tsk-x", at)),
        )
        .unwrap();
        fs::write(
            friction_dir(&tmp).join("sess-b.jsonl"),
            format!("{}\n", resolved_line("tsk-x", at)),
        )
        .unwrap();
        let report = finished(migrate_as(&tmp, "migrate-writer-settle"));
        assert_eq!(report["ok"], false, "{report}");
        assert_eq!(report["written"], 0);
        assert_eq!(
            report["settleChanged"],
            json!({ "settledByMigration": ["legacy:sess-a:1"], "unsettledByMigration": [] })
        );
        assert!(stored_records(&tmp).is_empty());
        assert_eq!(show(&tmp, "work:tsk-x").unwrap()["unsettled"], 1);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_migrate_that_leaves_a_line_behind_fails_the_command() {
        let tmp = temp_root("migrate-cli");
        old_store(&tmp);
        fs::write(
            friction_dir(&tmp).join("broken.jsonl"),
            format!("{}\n", recorded_line("tsk-c", "not a stamp")),
        )
        .unwrap();
        let err = crate::friction_cli::dispatch(&crate::contract::ObserveRequest {
            operation: "friction".into(),
            sub: "migrate".into(),
            args: vec!["--to-records".into()],
            root: tmp.clone(),
            stdin: None,
        })
        .unwrap_err();
        assert!(err.starts_with("friction-migrate-incomplete: "), "{err}");
        assert!(err.contains("broken:1"), "{err}");
        // The usable lines were still written once.
        assert_eq!(stored_records(&tmp).len(), 3);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn recording_and_migrating_never_write_the_old_shards() {
        let tmp = temp_root("no-v1-write");
        old_store(&tmp);
        let shard = friction_dir(&tmp).join("old-writer.jsonl");
        let before = fs::read(&shard).unwrap();
        record(&tmp, input_of("tsk-new", "fresh-fault")).unwrap();
        resolve(
            &tmp,
            ResolveTarget::Class("fresh-fault".into()),
            "done",
            "test",
        )
        .unwrap();
        migrate_to_records(&tmp).unwrap();
        assert_eq!(fs::read(&shard).unwrap(), before);
        assert_eq!(fs::read_dir(friction_dir(&tmp)).unwrap().count(), 1);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn migrate_needs_the_explicit_to_records_flag() {
        let err = crate::friction_cli::dispatch(&crate::contract::ObserveRequest {
            operation: "friction".into(),
            sub: "migrate".into(),
            args: Vec::new(),
            root: std::env::temp_dir(),
            stdin: None,
        })
        .unwrap_err();
        assert!(err.contains("--to-records"), "{err}");
    }
}
