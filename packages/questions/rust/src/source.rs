//! The Observe record source: the fold of the stream projected into `fgos.question.*` records, one per
//! event, so `fgos metrics query` and the definitions read question events that have synced across machines
//! from the one store, without a second write.

use crate::record::{Answered, Asked, Event, OBSERVE_KINDS};
use crate::store::{LogOpener, LoggedEvent};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use fgos_observe::contract::{RecordSource, SourceError, Window};
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::time::ParsedWindow;
use std::collections::BTreeMap;
use std::path::Path;

pub const SOURCE_ID: &str = "fgos.questions.events";
const KINDS: &[&str] = &[
    "fgos.question.asked",
    "fgos.question.answered",
    "fgos.question.acked",
    "fgos.question.cancelled",
];

pub struct QuestionSource {
    opener: Box<dyn LogOpener>,
}

impl QuestionSource {
    pub fn new(opener: Box<dyn LogOpener>) -> Self {
        Self { opener }
    }
}

fn text(value: &str) -> AttrValue {
    AttrValue::Str(value.to_owned())
}

fn asker_attrs(attrs: &mut BTreeMap<String, AttrValue>, asked: &Asked) {
    let asker = &asked.asker;
    attrs.insert(
        "fgos.question.asker.session".into(),
        text(&asker.session_id),
    );
    attrs.insert("fgos.question.asker.handle".into(), text(&asker.handle));
    // The role attr is the head role when the asker held one, else the first role.
    if let Some(role) = asker.head_roles().next().or(asker.roles.first()) {
        attrs.insert("fgos.question.asker.role".into(), text(role));
    }
    if let Some(persona) = &asker.persona {
        attrs.insert("fgos.question.asker.persona".into(), text(persona));
    }
    if let Some(pane) = &asker.pane {
        attrs.insert("fgos.question.asker.pane".into(), text(pane));
    }
    attrs.insert("fgos.question.asker.machine".into(), text(&asker.machine));
}

fn record(id: &str, kind: &'static str, ts: &str, attrs: BTreeMap<String, AttrValue>) -> Record {
    Record {
        v: RECORD_VERSION,
        id: format!("{id}:{}", kind.rsplit('.').next().unwrap_or(kind)),
        kind: kind.to_owned(),
        ts: ts.to_owned(),
        end_ts: None,
        subject: SubjectRef {
            kind: "question".into(),
            id: id.to_owned(),
        },
        refs: Vec::new(),
        attrs,
        measures: BTreeMap::new(),
        basis: Basis::Reported,
        origin: Origin {
            source: SOURCE_ID.into(),
            component: Some("questions".into()),
            ..Origin::default()
        },
        detail: None,
        redaction: None,
    }
}

fn answered_record(asked: &Asked, answered: &Answered) -> Record {
    let mut attrs = BTreeMap::new();
    attrs.insert("fgos.question.origin_ref".into(), text(&asked.origin.value));
    asker_attrs(&mut attrs, asked);
    attrs.insert(
        "fgos.question.answered_at".into(),
        text(&answered.answered_at),
    );
    attrs.insert("fgos.question.by".into(), text(&answered.by));
    if let Some(via) = &answered.via {
        attrs.insert("fgos.question.via".into(), text(via));
    }
    record(
        &answered.id,
        "fgos.question.answered",
        &answered.answered_at,
        attrs,
    )
}

/// One record per event, in the store's order. An answer, ack or cancel of a question the stream does
/// not (yet) hold an ask for projects without the asker attrs only for ack and cancel; an answer needs the ask.
pub fn project(events: &[LoggedEvent]) -> Vec<Record> {
    let mut asked_by_id: BTreeMap<String, Asked> = BTreeMap::new();
    let mut out = Vec::new();
    for logged in events {
        let Some(event) = Event::parse(&logged.event_type, &logged.payload) else {
            continue;
        };
        match event {
            Event::Asked(asked) => {
                let mut attrs = BTreeMap::new();
                attrs.insert("fgos.question.stage".into(), text(&asked.stage));
                attrs.insert("fgos.question.origin_ref".into(), text(&asked.origin.value));
                asker_attrs(&mut attrs, &asked);
                attrs.insert(
                    "fgos.question.migrated".into(),
                    AttrValue::Bool(asked.migrated),
                );
                out.push(record(
                    &asked.id,
                    "fgos.question.asked",
                    &asked.asked_at,
                    attrs,
                ));
                asked_by_id.entry(asked.id.clone()).or_insert(*asked);
            }
            Event::Answered(answered) => {
                if let Some(asked) = asked_by_id.get(&answered.id) {
                    out.push(answered_record(asked, &answered));
                }
            }
            Event::Acked(acked) => {
                let mut attrs = BTreeMap::new();
                attrs.insert("fgos.question.by".into(), text(&acked.by));
                out.push(record(&acked.id, "fgos.question.acked", &acked.at, attrs));
            }
            Event::Cancelled(cancelled) => {
                let mut attrs = BTreeMap::new();
                attrs.insert("fgos.question.by".into(), text(&cancelled.by));
                attrs.insert("fgos.question.reason".into(), text(&cancelled.reason));
                out.push(record(
                    &cancelled.id,
                    "fgos.question.cancelled",
                    &cancelled.at,
                    attrs,
                ));
            }
        }
    }
    out
}

impl RecordSource for QuestionSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &'static [&'static str] {
        KINDS
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let failed = |message: String| SourceError::ReadFailed {
            source_id: SOURCE_ID,
            message,
        };
        let window = ParsedWindow::parse(w).map_err(failed)?;
        let log = match self.opener.open(root).map_err(|r| failed(r.to_string()))? {
            Some(log) => log,
            None => return Ok(Vec::new()),
        };
        let events = log.read().map_err(|r| failed(r.to_string()))?;
        Ok(project(&events)
            .into_iter()
            .filter(|r| parse_rfc3339_millis(&r.ts).is_some_and(|ms| window.contains(ms)))
            .collect())
    }
}

/// The kinds and attrs this source declares to Observe.
pub fn declaration() -> &'static str {
    OBSERVE_KINDS
}
