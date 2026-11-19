//! The supervisor's read and drain verbs as library functions the host calls: `plans`,
//! `successor`, `queue`, `handled` and `done`.
use crate::{
    portfolio::{admissible, head_name, Plan},
    queue::{QueueError, RaisedEvent},
    wake::{Drain, Holder},
};

/// One portfolio row as the supervisor sees it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlanRow {
    pub dir: String,
    pub status: String,
    pub priority: String,
    pub admissible: bool,
    pub head_name: String,
    /// For a `running` plan that names its lead: whether that role is held by a live session of
    /// this project. `false` is what the supervisor restarts; `None` also when Identity cannot say.
    pub lead_live: Option<bool>,
    /// A `running` plan that names no lead: held, never restarted.
    pub lead_unnamed: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlansView {
    pub rows: Vec<PlanRow>,
    pub leads_live: usize,
    pub max_leads: usize,
}

/// The portfolio rows in the order given (the caller orders them), with `holder` answering who
/// holds a role now and `project_id` this project's id. Lane freedom is not read here; `fgos
/// slots` owns it.
pub fn plans(
    plans: &[Plan],
    done_dirs: &[String],
    project_handle: &str,
    project_id: &str,
    holder: &dyn Fn(&str) -> Holder,
    max_leads: usize,
) -> PlansView {
    let open = admissible(plans, done_dirs);
    let mut leads_live = 0;
    let rows = plans
        .iter()
        .map(|p| {
            let name = head_name(project_handle, &p.dir);
            let running = p.status == "running";
            let lead_live = match (running, p.lead.as_deref()) {
                (true, Some(role)) => match holder(role) {
                    Holder::Live { project_id: id } => Some(id == project_id),
                    Holder::NotLive => Some(false),
                    Holder::Unknown => None,
                },
                _ => None,
            };
            if lead_live == Some(true) {
                leads_live += 1;
            }
            PlanRow {
                dir: p.dir.clone(),
                status: p.status.clone(),
                priority: p.priority.clone(),
                admissible: open.iter().any(|a| a.dir == p.dir),
                head_name: name,
                lead_live,
                lead_unnamed: running && p.lead.is_none(),
            }
        })
        .collect();
    PlansView {
        rows,
        leads_live,
        max_leads,
    }
}

/// The asker of an answered question, from the question store.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Asker {
    /// `head:<persona>-<name>`.
    pub role: String,
    pub persona: String,
}
pub trait Askers {
    fn asker(&self, question_id: &str) -> Option<Asker>;
}

/// The session the supervisor starts for an answered question: the asker's own persona and name,
/// so it runs under the asker's role (which lets it ack or cancel) and its opening names the
/// question.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Successor {
    pub persona: String,
    pub name: String,
    pub for_question: String,
}

pub fn successor(askers: &dyn Askers, event: &RaisedEvent) -> Option<Successor> {
    if event.kind != "question-answered" {
        return None;
    }
    let asker = askers.asker(&event.subject)?;
    let rest = asker.role.strip_prefix("head:")?;
    let name = rest
        .strip_prefix(asker.persona.as_str())?
        .strip_prefix('-')?;
    if name.is_empty() {
        return None;
    }
    Some(Successor {
        persona: asker.persona,
        name: name.to_owned(),
        for_question: event.subject.clone(),
    })
}

/// An unhandled event, with its successor when it is an answered question.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QueuedEvent {
    pub event: RaisedEvent,
    pub successor: Option<Successor>,
}

pub fn queue(queue: &dyn Drain, askers: &dyn Askers) -> Result<Vec<QueuedEvent>, QueueError> {
    Ok(queue
        .unhandled()?
        .into_iter()
        .map(|event| QueuedEvent {
            successor: successor(askers, &event),
            event,
        })
        .collect())
}

/// Close `ids` as handled by `by`; returns how many this call closed.
pub fn handled(queue: &dyn Drain, ids: &[String], by: &str) -> Result<usize, QueueError> {
    queue.mark_handled(ids, by)
}

/// `Ok` when the queue is empty (the request route then stops the caller); refuses
/// `events-unhandled` with the count otherwise.
pub fn done(queue: &dyn Drain) -> Result<(), QueueError> {
    let left = queue.unhandled()?.len();
    if left > 0 {
        return Err(QueueError {
            code: "events-unhandled",
            detail: format!("{left} unhandled"),
        });
    }
    Ok(())
}

impl QueuedEvent {
    /// The verb's JSON shape.
    pub fn to_json(&self) -> serde_json::Value {
        let e = &self.event;
        let mut v = serde_json::json!({
            "id": e.id, "kind": e.kind, "ref": e.subject, "ts": e.ts,
            "reason": e.reason, "nextCommand": e.next_command,
        });
        if let Some(s) = &self.successor {
            v["successor"] = serde_json::json!({
                "persona": s.persona, "name": s.name, "forQuestion": s.for_question,
            });
        }
        v
    }
}

impl PlansView {
    pub fn to_json(&self) -> serde_json::Value {
        let rows: Vec<_> = self
            .rows
            .iter()
            .map(|r| {
                let mut v = serde_json::json!({
                    "dir": r.dir, "status": r.status, "priority": r.priority,
                    "admissible": r.admissible, "headName": r.head_name,
                });
                if let Some(live) = r.lead_live {
                    v["leadLive"] = live.into();
                }
                if r.lead_unnamed {
                    v["leadUnnamed"] = true.into();
                }
                v
            })
            .collect();
        serde_json::json!({"plans": rows, "leadsLive": self.leads_live, "maxLeads": self.max_leads})
    }
}

/// `done`'s answer.
pub fn done_json() -> serde_json::Value {
    serde_json::json!({"done": true})
}
