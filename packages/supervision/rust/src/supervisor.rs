//! The supervisor's read and drain verbs as library functions the host calls: `plans`,
//! `successor`, `queue`, `handled` and `done`.
use crate::{
    portfolio::{admissible, head_name, running_overlaps, Plan},
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
    /// Advice for ready plans: running plan directories and the ready plan's shared entries.
    pub overlaps: Vec<(String, Vec<String>)>,
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
    /// Live leads that count against `max_leads`: a lead whose plan waits outside is not here.
    pub leads_live: usize,
    /// Live leads of a plan that waits on the owner (see [`OpenQuestions`]); they hold no slot.
    pub leads_waiting: usize,
    pub max_leads: usize,
}

/// Whether the owner has an open question with this ref in the question store. A store that
/// cannot be read answers `false`: nothing is waiting.
pub trait OpenQuestions {
    fn has_open(&self, reference: &str) -> bool;
}

/// A plan waits outside when every phase not yet done has an open owner question, on the phase
/// (`plan:<dir>#phase-NN`) or on the whole plan (`plan:<dir>`).
fn waits_on_owner(p: &Plan, open: &dyn OpenQuestions) -> bool {
    let whole = open.has_open(&format!("plan:{}", p.dir));
    let mut pending = p.phases.iter().filter(|ph| ph.status != "done").peekable();
    pending.peek().is_some()
        && pending.all(|ph| {
            let n = ph
                .id
                .parse::<u32>()
                .map_or(ph.id.clone(), |n| format!("{n:02}"));
            whole || open.has_open(&format!("plan:{}#phase-{n}", p.dir))
        })
}

/// Count distinct lead roles, including Identity roles with no running plan. Only a known live
/// lead whose every running plan waits on the owner releases its slot; unknown never means free.
pub fn lead_counts(
    plans: &[Plan],
    roles: &[String],
    project_id: &str,
    holder: &dyn Fn(&str) -> Holder,
    questions: &dyn OpenQuestions,
) -> (usize, usize) {
    let mut roles = roles.to_vec();
    roles.extend(
        plans
            .iter()
            .filter(|p| p.status == "running")
            .filter_map(|p| p.lead.clone()),
    );
    roles.sort();
    roles.dedup();
    let (mut live, mut waiting) = (0, 0);
    for role in roles {
        match holder(&role) {
            Holder::Live { project_id: id } if id == project_id => {
                let owned: Vec<_> = plans
                    .iter()
                    .filter(|p| p.status == "running" && p.lead.as_ref() == Some(&role))
                    .collect();
                if !owned.is_empty() && owned.iter().all(|p| waits_on_owner(p, questions)) {
                    waiting += 1;
                } else {
                    live += 1;
                }
            }
            Holder::Unknown => live += 1,
            _ => {}
        }
    }
    (live, waiting)
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
    questions: &dyn OpenQuestions,
) -> PlansView {
    let open = admissible(plans, done_dirs);
    let (leads_live, leads_waiting) = lead_counts(plans, &[], project_id, holder, questions);
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
            PlanRow {
                dir: p.dir.clone(),
                status: p.status.clone(),
                priority: p.priority.clone(),
                admissible: open.iter().any(|a| a.dir == p.dir),
                overlaps: running_overlaps(p, plans),
                head_name: name,
                lead_live,
                lead_unnamed: running && p.lead.is_none(),
            }
        })
        .collect();
    PlansView {
        rows,
        leads_live,
        leads_waiting,
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
                if !r.overlaps.is_empty() {
                    v["overlaps"] = r
                        .overlaps
                        .iter()
                        .map(|(plan, paths)| serde_json::json!({"plan": plan, "paths": paths}))
                        .collect();
                }
                if let Some(live) = r.lead_live {
                    v["leadLive"] = live.into();
                }
                if r.lead_unnamed {
                    v["leadUnnamed"] = true.into();
                }
                v
            })
            .collect();
        serde_json::json!({"plans": rows, "leadsLive": self.leads_live, "leadsWaiting": self.leads_waiting, "maxLeads": self.max_leads})
    }
}

/// `done`'s answer.
pub fn done_json() -> serde_json::Value {
    serde_json::json!({"done": true})
}
