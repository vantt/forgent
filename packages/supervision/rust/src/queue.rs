//! The supervisor's event queue: Event Store truth on the `project` stream. The watcher raises an
//! event once, the supervisor drains it. Raised minus handled, folded across every machine's
//! mirror, is the queue; nothing is cached and nothing else touches the stream.
use fgos_event_store::{
    append::{append, AppendRequest, EventInput},
    cursor::Cursor,
    errors::ErrorCode,
    identity::StoreIdentity,
    layout::{Layout, StreamId},
    read::{read, ReadRequest},
    registry::Registry,
};
use fgos_git::{GitDriver, RepoHandle, ResolveRepo};
use fgos_identity::text::iso_utc_now;
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

const RAISED: &str = "supervision.event-raised";
const HANDLED: &str = "supervision.event-handled";
const STREAM: &str = "project";
const STALE: &str = "stale-view";
const MAX_ATTEMPTS: usize = 8;

/// A refusal with a fixed code (`event-unknown`, `store-unavailable`, `bad-event`) and its cause.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{code}: {detail}")]
pub struct QueueError {
    pub code: &'static str,
    pub detail: String,
}

fn unavailable(error: impl std::fmt::Debug) -> QueueError {
    QueueError {
        code: "store-unavailable",
        detail: format!("{error:?}"),
    }
}

/// One event a watcher raises. `id` is 16 hex characters the watcher derives from kind, subject
/// and the row's state-change instant, so the same row raised twice carries the same id.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RaisedEvent {
    pub id: String,
    pub kind: String,
    pub subject: String,
    pub ts: String,
    pub reason: String,
    pub next_command: String,
}

/// What `raise` did: appended a new event, or found the id already raised.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Raised {
    New,
    Duplicate,
}

impl RaisedEvent {
    fn validate(&self) -> Result<(), QueueError> {
        let bad = |detail: &str| QueueError {
            code: "bad-event",
            detail: detail.to_owned(),
        };
        if self.kind.is_empty() {
            return Err(bad("kind is empty"));
        }
        if self.subject.is_empty() {
            return Err(bad("ref is empty"));
        }
        if !valid_id(&self.id) {
            return Err(bad("id is not 16 lowercase hex characters"));
        }
        Ok(())
    }

    fn payload(&self) -> Value {
        json!({
            "id": self.id, "kind": self.kind, "ref": self.subject, "ts": self.ts,
            "reason": self.reason, "nextCommand": self.next_command,
        })
    }

    fn from_payload(payload: &Value) -> Option<Self> {
        let text = |key: &str| payload.get(key).and_then(Value::as_str).map(str::to_owned);
        Some(Self {
            id: text("id")?,
            kind: text("kind")?,
            subject: text("ref")?,
            ts: text("ts")?,
            reason: text("reason").unwrap_or_default(),
            next_command: text("nextCommand").unwrap_or_default(),
        })
    }
}

fn valid_id(id: &str) -> bool {
    id.len() == 16
        && id
            .bytes()
            .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
}

/// The folded stream: raised events (the first one wins its body) and the handled ids.
struct Folded {
    raised: BTreeMap<String, RaisedEvent>,
    handled: BTreeSet<String>,
    /// Positions already covered, this store's own included, for the append's stale check.
    cover: BTreeMap<String, u64>,
}

pub struct Queue {
    driver: GitDriver,
    repo: RepoHandle,
    layout: Layout,
    registry: Registry,
    machine: String,
    writer: String,
}

impl Queue {
    /// The queue of the clone whose Event Store `layout` names, written as `writer` from `machine`.
    pub fn open(layout: &Layout, machine: &str, writer: &str) -> Result<Queue, QueueError> {
        let (state, _) = fgos_holder_lock::state_root();
        let driver = GitDriver::new(&state).map_err(unavailable)?;
        let repo = match driver
            .resolve_repo(&layout.common_dir, &layout.common_dir)
            .map_err(unavailable)?
        {
            ResolveRepo::Repository(repo) => repo,
            ResolveRepo::NotARepository => return Err(unavailable("not a repository")),
        };
        Ok(Queue {
            driver,
            repo,
            layout: layout.clone(),
            registry: Registry::shipped().map_err(unavailable)?,
            machine: machine.to_owned(),
            writer: writer.to_owned(),
        })
    }

    /// Append `event` unless its id is already raised on any machine.
    pub fn raise(&self, event: RaisedEvent) -> Result<Raised, QueueError> {
        event.validate()?;
        self.retrying(|| {
            let (folded, origin) = self.fold()?;
            if folded.raised.contains_key(&event.id) {
                return Ok(Raised::Duplicate);
            }
            self.append(RAISED, event.payload(), folded.cover, &origin)?;
            Ok(Raised::New)
        })
    }

    /// Run `attempt` again, refolding, while the append refuses a stale own-stream position.
    fn retrying<T>(
        &self,
        mut attempt: impl FnMut() -> Result<T, QueueError>,
    ) -> Result<T, QueueError> {
        for _ in 0..MAX_ATTEMPTS {
            match attempt() {
                Err(e) if e.code == STALE => continue,
                other => return other,
            }
        }
        Err(unavailable("own stream kept changing: retry"))
    }

    /// Raised and not handled, ordered by `ts` then `id`.
    pub fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError> {
        let (folded, _) = self.fold()?;
        Ok(open_events(&folded))
    }

    pub fn unhandled_count(&self) -> Result<usize, QueueError> {
        Ok(self.unhandled()?.len())
    }

    /// Close `ids`. Already handled ids are skipped; an id never raised refuses `event-unknown`
    /// and nothing is written. Returns how many ids this call closed.
    pub fn mark_handled(&self, ids: &[String], by: &str) -> Result<usize, QueueError> {
        self.retrying(|| {
            let (folded, origin) = self.fold()?;
            let mut closing = BTreeSet::new();
            for id in ids {
                if !folded.raised.contains_key(id) {
                    return Err(QueueError {
                        code: "event-unknown",
                        detail: format!("no event raised with id {id}"),
                    });
                }
                if !folded.handled.contains(id) {
                    closing.insert(id.clone());
                }
            }
            let mut cover = folded.cover;
            let mut origin = origin;
            for id in &closing {
                let (next, own) =
                    self.append(HANDLED, json!({"id": id, "by": by}), cover, &origin)?;
                cover = next;
                origin = own;
            }
            Ok(closing.len())
        })
    }

    fn stream() -> Result<StreamId, QueueError> {
        StreamId::parse(STREAM).map_err(unavailable)
    }

    /// Append one event; returns the cover and the store id for the next append of the same call.
    /// A stale own-stream position is refused with `stale-view` so the caller refolds.
    fn append(
        &self,
        event_type: &str,
        payload: Value,
        cover: BTreeMap<String, u64>,
        origin: &str,
    ) -> Result<(BTreeMap<String, u64>, String), QueueError> {
        let result = append(
            &self.layout,
            &self.registry,
            AppendRequest {
                stream: &Self::stream()?,
                events: &[EventInput {
                    event_type: event_type.to_owned(),
                    schema_version: 1,
                    payload,
                    ts: iso_utc_now(),
                }],
                cursor: &cover,
                writer: &self.writer,
                machine: &self.machine,
                held_ranks: &[],
            },
        )
        .map_err(|e| {
            if e.code == ErrorCode::StaleCursor {
                QueueError {
                    code: STALE,
                    detail: e.detail,
                }
            } else {
                unavailable(e)
            }
        })?;
        // The store minted its identity on the first append when it had none.
        let own = if origin.is_empty() {
            result.ack.origin.clone()
        } else {
            origin.to_owned()
        };
        let mut next = cover;
        next.insert(format!("{own}:{STREAM}"), result.ack.last_seq);
        Ok((next, own))
    }

    fn fold(&self) -> Result<(Folded, String), QueueError> {
        let origin = match std::fs::symlink_metadata(self.layout.store()) {
            Ok(_) => {
                StoreIdentity::open(&self.layout, &self.machine)
                    .map_err(unavailable)?
                    .store_id
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
            Err(e) => return Err(unavailable(e)),
        };
        let stream = Self::stream()?;
        let result = read(
            &self.driver,
            &self.repo,
            ReadRequest {
                machine: &self.machine,
                layout: &self.layout,
                origin: &origin,
                streams: std::slice::from_ref(&stream),
                cursor: &Cursor::default(),
                folded: &[],
                project: true,
            },
        )
        .map_err(unavailable)?;
        if let Some(skipped) = result.skipped_mirrors.first() {
            return Err(unavailable(format!(
                "mirror {} skipped ({}): run `fgos events sync` and retry",
                skipped.ref_name, skipped.code
            )));
        }
        if !result.deferred.is_empty() || !result.missing.is_empty() {
            return Err(unavailable(
                "incomplete history: run `fgos events sync` and retry",
            ));
        }
        let mut raised = BTreeMap::new();
        let mut handled = BTreeSet::new();
        for envelope in result.sequence.iter().filter(|e| e.stream == STREAM) {
            match envelope.event_type.as_str() {
                RAISED => {
                    if let Some(event) = RaisedEvent::from_payload(&envelope.payload) {
                        raised.entry(event.id.clone()).or_insert(event);
                    }
                }
                HANDLED => {
                    if let Some(id) = envelope.payload.get("id").and_then(Value::as_str) {
                        handled.insert(id.to_owned());
                    }
                }
                _ => {}
            }
        }
        let cover: BTreeMap<String, u64> = result.cursor.cover.into_iter().collect();
        Ok((
            Folded {
                raised,
                handled,
                cover,
            },
            origin,
        ))
    }
}

fn open_events(folded: &Folded) -> Vec<RaisedEvent> {
    let mut open: Vec<RaisedEvent> = folded
        .raised
        .values()
        .filter(|e| !folded.handled.contains(&e.id))
        .cloned()
        .collect();
    open.sort_by(|a, b| (&a.ts, &a.id).cmp(&(&b.ts, &b.id)));
    open
}
