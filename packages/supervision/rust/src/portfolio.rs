//! The portfolio reader: plan frontmatter and phase table only, pure over text (no filesystem, no
//! Work items). The vocabulary comes from `contracts/plan-vocabulary.v1.json`, the one source the
//! plan-contract script and the Node resolver read too.

use std::sync::OnceLock;

use fgos_yaml_doc::{parse, CommentLoss, Profile, Refusal, Segment, Value};

const VOCABULARY_JSON: &str = include_str!("../../contracts/plan-vocabulary.v1.json");

/// The shared plan vocabulary.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Vocabulary {
    pub statuses: Vec<String>,
    pub priorities: Vec<String>,
    pub table_columns: Vec<String>,
    pub head_name_max: usize,
    pub head_name_project_prefix: usize,
    pub head_name_hash_chars: usize,
}

/// The vocabulary embedded in this crate.
pub fn vocabulary() -> &'static Vocabulary {
    static VOCABULARY: OnceLock<Vocabulary> = OnceLock::new();
    VOCABULARY.get_or_init(|| {
        let json: serde_json::Value =
            serde_json::from_str(VOCABULARY_JSON).expect("plan-vocabulary.v1.json is valid JSON");
        let list = |key: &str| -> Vec<String> {
            json[key]
                .as_array()
                .expect("plan-vocabulary.v1.json lists are arrays")
                .iter()
                .map(|v| {
                    v.as_str()
                        .expect("vocabulary entries are strings")
                        .to_string()
                })
                .collect()
        };
        let number = |key: &str| -> usize {
            json["headName"][key]
                .as_u64()
                .expect("headName limits are numbers") as usize
        };
        Vocabulary {
            statuses: list("statuses"),
            priorities: list("priorities"),
            table_columns: list("tableColumns"),
            head_name_max: number("max"),
            head_name_project_prefix: number("projectPrefix"),
            head_name_hash_chars: number("hashChars"),
        }
    })
}

/// Why a plan text was not read.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum PlanRefusal {
    #[error("plan-frontmatter-missing: {0}")]
    FrontmatterMissing(String),
    #[error("plan-status-unknown: {0}")]
    StatusUnknown(String),
    #[error("plan-priority-unknown: {0}")]
    PriorityUnknown(String),
    #[error("plan-frontmatter-entry-invalid: {0}")]
    FrontmatterEntryInvalid(String),
    #[error("phase-table-missing: {0}")]
    TableMissing(String),
    #[error("phase-table-ambiguous: {0}")]
    TableAmbiguous(String),
    #[error("phase-table-empty: {0}")]
    TableEmpty(String),
    #[error("phase-table-column-missing: {0}")]
    ColumnMissing(String),
    #[error("phase-wave-invalid: {0}")]
    WaveInvalid(String),
    #[error("phase-id-duplicate: {0}")]
    IdDuplicate(String),
}

impl PlanRefusal {
    /// The stable refusal code.
    pub fn code(&self) -> &'static str {
        match self {
            PlanRefusal::FrontmatterMissing(_) => "plan-frontmatter-missing",
            PlanRefusal::StatusUnknown(_) => "plan-status-unknown",
            PlanRefusal::PriorityUnknown(_) => "plan-priority-unknown",
            PlanRefusal::FrontmatterEntryInvalid(_) => "plan-frontmatter-entry-invalid",
            PlanRefusal::TableMissing(_) => "phase-table-missing",
            PlanRefusal::TableAmbiguous(_) => "phase-table-ambiguous",
            PlanRefusal::TableEmpty(_) => "phase-table-empty",
            PlanRefusal::ColumnMissing(_) => "phase-table-column-missing",
            PlanRefusal::WaveInvalid(_) => "phase-wave-invalid",
            PlanRefusal::IdDuplicate(_) => "phase-id-duplicate",
        }
    }
}

/// Why widening a plan's footprint was refused.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum WidenRefusal {
    #[error("plan-frontmatter-missing: {0}")]
    FrontmatterMissing(String),
    #[error("plan-not-widenable: status is {0}")]
    NotWidenable(String),
    #[error("criterion-not-found: criterion {0} not found under Acceptance criteria")]
    CriterionNotFound(u32),
    #[error("phase-not-found: phase {0}")]
    PhaseNotFound(String),
    #[error("footprint-entry-invalid: {0}")]
    FootprintEntryInvalid(String),
    #[error("plan-reread-failed: {0}")]
    RereadFailed(String),
    #[error("{0}")]
    DocRefusal(Refusal),
}

impl WidenRefusal {
    /// The stable refusal code.
    pub fn code(&self) -> &'static str {
        match self {
            WidenRefusal::FrontmatterMissing(_) => "plan-frontmatter-missing",
            WidenRefusal::NotWidenable(_) => "plan-not-widenable",
            WidenRefusal::CriterionNotFound(_) => "criterion-not-found",
            WidenRefusal::PhaseNotFound(_) => "phase-not-found",
            WidenRefusal::FootprintEntryInvalid(_) => "footprint-entry-invalid",
            WidenRefusal::RereadFailed(_) => "plan-reread-failed",
            WidenRefusal::DocRefusal(r) => r.rule,
        }
    }
}

/// The outcome of widening a plan text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Widened {
    /// The edited text of `plan.md`, or `None` when neither copy changed.
    pub text: Option<String>,
    /// The paths added to either the frontmatter or the phase cell.
    pub added: Vec<String>,
    /// The paths that were already covered in frontmatter and listed in the phase cell.
    pub unchanged: Vec<String>,
    /// The first line of the acceptance criterion item.
    pub criterion_text: String,
}

/// One row of a plan's phase table.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Phase {
    pub id: String,
    pub title: String,
    pub depends_on: Vec<String>,
    pub footprint: Vec<String>,
    /// An integer from 1.
    pub wave: u32,
    pub status: String,
}

/// A plan as the supervisor sees it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Plan {
    pub dir: String,
    pub title: String,
    pub status: String,
    pub priority: String,
    pub created: String,
    pub blocked_by: Vec<String>,
    pub footprint: Vec<String>,
    pub source: Vec<String>,
    /// The Identity role of the lead running the plan (`lead` frontmatter key); `None` when the
    /// plan does not name one.
    pub lead: Option<String>,
    pub phases: Vec<Phase>,
}

fn is_ended(status: &str) -> bool {
    status == "done" || status == "withdrawn"
}

/// Reads one plan from the text of its `plan.md`. `dir` is the plan's directory name.
pub fn read_plan(dir: &str, text: &str) -> Result<Plan, PlanRefusal> {
    let (front, body) = split_frontmatter(text)
        .ok_or_else(|| PlanRefusal::FrontmatterMissing(format!("{dir}: no frontmatter block")))?;
    let doc = parse(front.as_bytes(), Profile::Tool, dir)
        .map_err(|e| PlanRefusal::FrontmatterMissing(format!("{dir}: {e:?}")))?;
    let Value::Map(entries) = doc.value() else {
        return Err(PlanRefusal::FrontmatterMissing(format!(
            "{dir}: frontmatter is not a mapping"
        )));
    };
    let get = |key: &str| entries.iter().find(|(k, _)| k == key).map(|(_, v)| v);
    let scalar = |key: &str| match get(key) {
        Some(Value::Str(s)) => s.clone(),
        Some(Value::Int(i)) => i.to_string(),
        Some(Value::Float(f)) => f.to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        _ => String::new(),
    };
    let list = |key: &str| -> Result<Vec<String>, PlanRefusal> {
        match get(key) {
            Some(Value::Seq(items)) => items
                .iter()
                .map(|v| match v {
                    Value::Str(s) => Ok(s.clone()),
                    _ => Err(PlanRefusal::FrontmatterEntryInvalid(format!(
                        "{dir}: {key} holds an entry that is not a string"
                    ))),
                })
                .collect(),
            None | Some(Value::Null) => Ok(Vec::new()),
            Some(_) => Err(PlanRefusal::FrontmatterEntryInvalid(format!(
                "{dir}: {key} is not a list"
            ))),
        }
    };
    let vocab = vocabulary();
    let status = scalar("status");
    if !vocab.statuses.contains(&status) {
        return Err(PlanRefusal::StatusUnknown(format!("{dir}: {status:?}")));
    }
    let priority = scalar("priority");
    if !vocab.priorities.contains(&priority) {
        return Err(PlanRefusal::PriorityUnknown(format!("{dir}: {priority:?}")));
    }
    let blocked_by = list("blockedBy")?;
    let footprint = list("footprint")?;
    let source = list("source")?;
    // A plan that has not been promoted (or has ended) carries no admission duty, so its table may
    // still be unwritten or dated; a ready or running plan is read strictly.
    let phases = if status == "ready" || status == "running" {
        read_phase_table(dir, body)?
    } else {
        match read_phase_table(dir, body) {
            Err(PlanRefusal::TableMissing(_)) => Vec::new(),
            other => other?,
        }
    };
    Ok(Plan {
        dir: dir.to_string(),
        title: scalar("title"),
        status,
        priority,
        created: scalar("created"),
        blocked_by,
        footprint,
        source,
        lead: Some(scalar("lead")).filter(|l| !l.is_empty()),
        phases,
    })
}

/// A refused plan needs admission judgement only when its frontmatter identifies it as ready.
/// Old, ended and unreadable documents carry no evidence of admission duty.
pub fn refused_ready_plan(text: &str) -> bool {
    let Some((front, _)) = split_frontmatter(text) else {
        return false;
    };
    let Ok(doc) = parse(front.as_bytes(), Profile::Tool, "plan.md") else {
        return false;
    };
    let Value::Map(entries) = doc.value() else {
        return false;
    };
    entries.iter().any(|(key, value)| {
        key == "status" && matches!(value, Value::Str(status) if status == "ready")
    })
}

/// The text between the opening `---` line and the next `---` line, and what follows.
fn split_frontmatter(text: &str) -> Option<(&str, &str)> {
    let text = text.strip_prefix('\u{FEFF}').unwrap_or(text);
    let mut lines = text.split_inclusive('\n');
    if lines.next()?.trim_end() != "---" {
        return None;
    }
    let start = text.find('\n')? + 1;
    let mut at = start;
    for line in lines {
        if line.trim_end() == "---" {
            return Some((&text[start..at], &text[at + line.len()..]));
        }
        at += line.len();
    }
    None
}

/// Orders plans by priority, then `created`, then directory name.
pub fn order(plans: &mut [Plan]) {
    let vocab = vocabulary();
    let rank = |p: &Plan| {
        vocab
            .priorities
            .iter()
            .position(|x| *x == p.priority)
            .unwrap_or(usize::MAX)
    };
    plans.sort_by(|a, b| {
        rank(a)
            .cmp(&rank(b))
            .then_with(|| a.created.cmp(&b.created))
            .then_with(|| a.dir.cmp(&b.dir))
    });
}

/// Why a plan's own footprint cannot be compared: `footprint-empty` when it names no path,
/// `footprint-entry-invalid` when an entry is not a repo-relative path or glob. `None` when the
/// footprint is comparable.
pub fn footprint_problem(plan: &Plan) -> Option<&'static str> {
    if plan.footprint.is_empty() {
        return Some("footprint-empty");
    }
    fgos_write_scope::canonicalize_all(&plan.footprint)
        .is_err()
        .then_some("footprint-entry-invalid")
}

/// A ready plan's overlaps with running plans, naming the ready plan's shared entries.
/// Uncomparable footprints yield no advice; overlap never holds admission.
pub fn running_overlaps(plan: &Plan, plans: &[Plan]) -> Vec<(String, Vec<String>)> {
    if plan.status != "ready" || footprint_problem(plan).is_some() {
        return Vec::new();
    }
    plan_overlaps(plan, plans, |r| r.status == "running")
}

/// An active (ready or running) plan's overlaps with every other active plan,
/// naming the shared entries.
pub fn active_overlaps(plan: &Plan, plans: &[Plan]) -> Vec<(String, Vec<String>)> {
    if (!is_active(&plan.status)) || footprint_problem(plan).is_some() {
        return Vec::new();
    }
    plan_overlaps(plan, plans, |r| is_active(&r.status))
}

fn is_active(status: &str) -> bool {
    status == "ready" || status == "running"
}

fn plan_overlaps(
    plan: &Plan,
    plans: &[Plan],
    filter: impl Fn(&Plan) -> bool,
) -> Vec<(String, Vec<String>)> {
    plans
        .iter()
        .filter(|r| r.dir != plan.dir && filter(r) && footprint_problem(r).is_none())
        .filter_map(|r| {
            let items = [plan, r].map(|p| fgos_write_scope::Item {
                id: p.dir.clone(),
                scopes: p.footprint.clone(),
            });
            fgos_write_scope::colliding_pairs(&items)
                .pairs
                .into_iter()
                .next()
                .map(|pair| (pair.b, pair.shared))
        })
        .collect()
}

/// Plans a supervisor may start now, in input order: status `ready`, every `blockedBy` plan in
/// `done_dirs`, and a footprint that can be compared. Overlaps are advice only; a plan with an
/// empty or invalid footprint is not admissible.
pub fn admissible<'a>(plans: &'a [Plan], done_dirs: &[String]) -> Vec<&'a Plan> {
    plans
        .iter()
        .filter(|p| p.status == "ready" && admission_hold(p, done_dirs).is_none())
        .collect()
}

/// The admission classifier shared by the read view and the wake door. An invalid footprint
/// needs judgement; an unmet dependency holds admission, but footprint overlap does not.
pub fn admission_hold(plan: &Plan, done_dirs: &[String]) -> Option<&'static str> {
    if !plan.blocked_by.iter().all(|b| done_dirs.contains(b)) {
        return Some("held-blocked");
    }
    footprint_problem(plan)
}

/// Edit only admission frontmatter through the YAML document door, preserving the phase table,
/// notes and all other fields. The adapter publishes these bytes through the paths land door.
pub fn admitted_text(text: &str, role: &str, base: &str) -> Result<String, String> {
    let (front, _) = split_frontmatter(text).ok_or("plan-frontmatter-missing")?;
    let mut doc = parse(front.as_bytes(), Profile::Tool, "plan.md").map_err(|e| e.to_string())?;
    for (key, value) in [("status", "running"), ("lead", role), ("base", base)] {
        doc.set(
            &[Segment::Key(key.to_owned())],
            Value::Str(value.to_owned()),
            CommentLoss::Refuse,
        )
        .map_err(|e| e.to_string())?;
    }
    let start = text.find('\n').ok_or("plan-frontmatter-missing")? + 1;
    let edited = String::from_utf8(doc.to_bytes()).map_err(|e| e.to_string())?;
    Ok(format!(
        "{}{}{}",
        &text[..start],
        edited,
        &text[start + front.len()..]
    ))
}

/// Widens a plan's footprint by one or more paths for a numbered acceptance criterion.
/// Edits both the frontmatter footprint (through the YAML document door) and the phase
/// row's footprint cell, keeping every other byte of `plan.md`.
pub fn widened_text<S: AsRef<str>>(
    text: &str,
    phase_id: &str,
    paths: &[S],
    criterion: u32,
) -> Result<Widened, WidenRefusal> {
    let (front, body) = split_frontmatter(text)
        .ok_or_else(|| WidenRefusal::FrontmatterMissing("no frontmatter block".to_owned()))?;
    let mut doc = parse(front.as_bytes(), Profile::Tool, "plan.md")
        .map_err(|e| WidenRefusal::FrontmatterMissing(format!("{e:?}")))?;
    let Value::Map(entries) = doc.value() else {
        return Err(WidenRefusal::FrontmatterMissing(
            "frontmatter is not a mapping".to_owned(),
        ));
    };
    let get = |key: &str| entries.iter().find(|(k, _)| k == key).map(|(_, v)| v);
    let status = match get("status") {
        Some(Value::Str(s)) => s.as_str(),
        _ => "",
    };
    if status != "ready" && status != "running" {
        return Err(WidenRefusal::NotWidenable(status.to_owned()));
    }

    let criterion_text = find_acceptance_criterion(body, criterion)?;

    let phases = read_phase_table("plan.md", body)
        .map_err(|e| WidenRefusal::RereadFailed(format!("{phase_id}: {e}")))?;
    let phase = phases
        .iter()
        .find(|p| p.id == phase_id)
        .ok_or_else(|| WidenRefusal::PhaseNotFound(phase_id.to_owned()))?;
    if phase.status == "done" || phase.status == "withdrawn" {
        return Err(WidenRefusal::PhaseNotFound(format!(
            "{phase_id} is {}",
            phase.status
        )));
    }

    let mut canon_paths: Vec<String> = Vec::new();
    for p_ref in paths {
        let p = p_ref.as_ref();
        if p.starts_with('-') || p.is_empty() {
            return Err(WidenRefusal::FootprintEntryInvalid(p.to_owned()));
        }
        let canon = fgos_write_scope::canonicalize(p)
            .map_err(|e| WidenRefusal::FootprintEntryInvalid(format!("{p}: {e}")))?;
        if canon.starts_with('-') || canon.is_empty() {
            return Err(WidenRefusal::FootprintEntryInvalid(canon));
        }
        canon_paths.push(canon);
    }

    let current_footprint: Vec<String> = match get("footprint") {
        Some(Value::Seq(items)) => items
            .iter()
            .filter_map(|v| match v {
                Value::Str(s) => Some(s.clone()),
                _ => None,
            })
            .collect(),
        _ => Vec::new(),
    };

    let mut updated_footprint = current_footprint.clone();
    let mut frontmatter_added: Vec<String> = Vec::new();
    for canon in &canon_paths {
        let covered = fgos_write_scope::matches(canon.as_bytes(), &updated_footprint)
            .map_err(|e| WidenRefusal::FootprintEntryInvalid(e.to_string()))?;
        if !covered {
            updated_footprint.push(canon.clone());
            frontmatter_added.push(canon.clone());
        }
    }

    let mut canon_phase_footprint: Vec<String> = Vec::new();
    for existing in &phase.footprint {
        let canon = fgos_write_scope::canonicalize(existing)
            .map_err(|e| WidenRefusal::FootprintEntryInvalid(format!("{existing}: {e}")))?;
        canon_phase_footprint.push(canon);
    }

    let mut phase_added: Vec<String> = Vec::new();
    for canon in &canon_paths {
        if !canon_phase_footprint
            .iter()
            .any(|existing| existing == canon)
        {
            if !phase_added.contains(canon) {
                phase_added.push(canon.clone());
            }
        }
    }

    let mut added: Vec<String> = Vec::new();
    let mut unchanged: Vec<String> = Vec::new();
    for canon in &canon_paths {
        if frontmatter_added.contains(canon) || phase_added.contains(canon) {
            if !added.contains(canon) {
                added.push(canon.clone());
            }
        } else if !unchanged.contains(canon) {
            unchanged.push(canon.clone());
        }
    }

    let frontmatter_changed = !frontmatter_added.is_empty();
    let phase_cell_changed = !phase_added.is_empty();

    if !frontmatter_changed && !phase_cell_changed {
        return Ok(Widened {
            text: None,
            added,
            unchanged,
            criterion_text,
        });
    }

    if frontmatter_changed {
        let seq = Value::Seq(
            updated_footprint
                .iter()
                .map(|s| Value::Str(s.clone()))
                .collect(),
        );
        doc.set(
            &[Segment::Key("footprint".to_owned())],
            seq,
            CommentLoss::Refuse,
        )
        .map_err(WidenRefusal::DocRefusal)?;
    }

    let (new_body, _) = if phase_cell_changed {
        update_phase_cell(body, phase_id, &phase_added)?
    } else {
        (body.to_string(), false)
    };

    let new_front_text = if frontmatter_changed {
        String::from_utf8(doc.to_bytes()).map_err(|e| WidenRefusal::RereadFailed(e.to_string()))?
    } else {
        front.to_string()
    };

    let start = text
        .find('\n')
        .ok_or_else(|| WidenRefusal::FrontmatterMissing("no newline".to_owned()))?
        + 1;
    let closing_line_len = text[start + front.len()..]
        .find('\n')
        .map(|idx| idx + 1)
        .unwrap_or(3);
    let closing = &text[start + front.len()..start + front.len() + closing_line_len];
    let full_text = format!(
        "{}{}{}{}",
        &text[..start],
        new_front_text,
        closing,
        new_body
    );

    read_phase_table("plan.md", &new_body)
        .map_err(|e| WidenRefusal::RereadFailed(format!("{phase_id}: {e}")))?;
    read_plan("plan.md", &full_text)
        .map_err(|e| WidenRefusal::RereadFailed(format!("{phase_id}: {e}")))?;

    Ok(Widened {
        text: Some(full_text),
        added,
        unchanged,
        criterion_text,
    })
}

fn find_acceptance_criterion(body: &str, criterion: u32) -> Result<String, WidenRefusal> {
    let mut in_criteria = false;
    let mut criteria_heading_level = 0;
    let mut found_item = false;
    let marker_dot = format!("{criterion}.");
    let marker_paren = format!("{criterion})");

    for line in body.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('#') {
            let level = trimmed.chars().take_while(|c| *c == '#').count();
            let heading_text = trimmed[level..].trim().to_lowercase();
            if heading_text.starts_with("acceptance criteria") {
                in_criteria = true;
                criteria_heading_level = level;
                continue;
            } else if in_criteria && level <= criteria_heading_level {
                break;
            }
        }
        if in_criteria {
            if found_item {
                let content = trimmed;
                if !content.is_empty() && !content.starts_with('#') {
                    return Ok(content.to_string());
                }
            } else {
                let item_line = line.trim_start();
                if let Some(rest) = item_line
                    .strip_prefix(&marker_dot)
                    .or_else(|| item_line.strip_prefix(&marker_paren))
                {
                    let first_line = rest.trim();
                    if !first_line.is_empty() {
                        return Ok(first_line.to_string());
                    }
                    found_item = true;
                }
            }
        }
    }
    Err(WidenRefusal::CriterionNotFound(criterion))
}

fn update_phase_cell(
    body: &str,
    phase_id: &str,
    to_add: &[String],
) -> Result<(String, bool), WidenRefusal> {
    if to_add.is_empty() {
        return Ok((body.to_string(), false));
    }
    let raw_lines: Vec<&str> = body.split_inclusive('\n').collect();

    let mut tables: Vec<(usize, usize)> = Vec::new();
    let mut i = 0;
    while i < raw_lines.len() {
        if !raw_lines[i].trim_start().starts_with('|') {
            i += 1;
            continue;
        }
        let mut j = i;
        while j < raw_lines.len() && raw_lines[j].trim_start().starts_with('|') {
            j += 1;
        }
        if header_of(raw_lines[i]).iter().any(|h| h == "footprint") {
            tables.push((i, j));
        }
        i = j;
    }
    let (i, j) = match tables.as_slice() {
        [one] => *one,
        _ => {
            return Err(WidenRefusal::RereadFailed(format!(
                "{phase_id}: table missing or ambiguous"
            )))
        }
    };
    let header = header_of(raw_lines[i]);
    let footprint_col = header
        .iter()
        .position(|h| h == "footprint")
        .ok_or_else(|| WidenRefusal::RereadFailed("column footprint missing".to_owned()))?;
    let id_col = header
        .iter()
        .position(|h| h == "id")
        .ok_or_else(|| WidenRefusal::RereadFailed("column id missing".to_owned()))?;

    let mut target_row_idx = None;
    for row_idx in (i + 2)..j {
        let row_cells = cells(raw_lines[row_idx]);
        if let Some(id_cell) = row_cells.get(id_col) {
            if plain(id_cell) == phase_id {
                target_row_idx = Some(row_idx);
                break;
            }
        }
    }

    let Some(row_idx) = target_row_idx else {
        return Err(WidenRefusal::PhaseNotFound(phase_id.to_owned()));
    };

    let line = raw_lines[row_idx];
    let mut pipes = Vec::new();
    let mut chars = line.char_indices().peekable();
    while let Some((idx, c)) = chars.next() {
        if c == '\\'
            && chars
                .peek()
                .map(|(_, next_c)| *next_c == '|')
                .unwrap_or(false)
        {
            chars.next();
        } else if c == '|' {
            pipes.push(idx);
        }
    }

    if pipes.len() <= footprint_col + 1 {
        return Err(WidenRefusal::RereadFailed(format!(
            "{phase_id}: invalid table row formatting"
        )));
    }

    let cell_start = pipes[footprint_col] + 1;
    let cell_end = pipes[footprint_col + 1];
    let cell_raw = &line[cell_start..cell_end];
    let cell_trimmed = cell_raw.trim();

    let backticked_add: Vec<String> = to_add.iter().map(|p| format!("`{p}`")).collect();
    let add_str = backticked_add.join(", ");

    let new_cell = if cell_trimmed.is_empty()
        || cell_trimmed == "-"
        || cell_trimmed == "—"
        || cell_trimmed.eq_ignore_ascii_case("none")
        || cell_trimmed.eq_ignore_ascii_case("n/a")
    {
        format!(" {add_str} ")
    } else {
        let trimmed_end = cell_raw.trim_end();
        format!("{trimmed_end}, {add_str} ")
    };

    let new_line = format!("{}{}{}", &line[..cell_start], new_cell, &line[cell_end..]);
    let mut result = String::new();
    for (idx, l) in raw_lines.iter().enumerate() {
        if idx == row_idx {
            result.push_str(&new_line);
        } else {
            result.push_str(l);
        }
    }
    Ok((result, true))
}

fn cut(text: &str, max: usize) -> &str {
    match text.char_indices().nth(max) {
        Some((at, _)) => &text[..at],
        None => text,
    }
}

/// A short stable tag of `text`: the low `chars` hex digits of its FNV-1a 32-bit hash. The Node resolver
/// (`head-plan.mjs`) computes the same tag, so a name resolves back to the plan that wrote it.
pub fn name_tag(text: &str, chars: usize) -> String {
    let hash = text.bytes().fold(0x811c_9dc5_u32, |h, b| {
        (h ^ u32::from(b)).wrapping_mul(0x0100_0193)
    });
    let hex = format!("{hash:08x}");
    hex[hex.len() - chars.min(hex.len())..].to_string()
}

/// The head name of a lead or planner: the project handle cut to the prefix limit (trailing `-`
/// trimmed), `-`, and the plan or discussion directory. A directory that fits the name limit is
/// kept whole; a longer one is cut short enough to leave room for `-` and its tag, so two
/// directories that share their first characters still get different names.
pub fn head_name(project_handle: &str, dir: &str) -> String {
    let vocab = vocabulary();
    let prefix = cut(project_handle, vocab.head_name_project_prefix).trim_end_matches('-');
    let room = vocab
        .head_name_max
        .saturating_sub(prefix.chars().count() + 1);
    if dir.chars().count() <= room {
        return format!("{prefix}-{dir}");
    }
    let tag = name_tag(dir, vocab.head_name_hash_chars);
    let keep = room.saturating_sub(tag.chars().count() + 1);
    format!("{prefix}-{}-{tag}", cut(dir, keep).trim_end_matches('-'))
}

/// The name of the project's supervisor head: the project handle cut to the name limit.
pub fn supervisor_name(project_handle: &str) -> String {
    cut(project_handle, vocabulary().head_name_max).to_string()
}

/// Pairs of plan directories, neither `done` nor `withdrawn`, whose head names are equal or one a
/// prefix of the other, so a name could not be resolved back to one plan.
pub fn collisions(plans: &[Plan], project_handle: &str) -> Vec<(String, String)> {
    let live: Vec<(&Plan, String)> = plans
        .iter()
        .filter(|p| !is_ended(&p.status))
        .map(|p| (p, head_name(project_handle, &p.dir)))
        .collect();
    let mut found = Vec::new();
    for (i, (a, na)) in live.iter().enumerate() {
        for (b, nb) in &live[i + 1..] {
            if na.starts_with(nb.as_str()) || nb.starts_with(na.as_str()) {
                found.push((a.dir.clone(), b.dir.clone()));
            }
        }
    }
    found
}

// ---- phase table -------------------------------------------------------------------------------

fn cells(line: &str) -> Vec<String> {
    let line = line.trim();
    let line = line.strip_prefix('|').unwrap_or(line);
    let line = line.strip_suffix('|').unwrap_or(line);
    let mut out = Vec::new();
    let mut cell = String::new();
    let mut chars = line.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' && chars.peek() == Some(&'|') {
            cell.push('\\');
            cell.push('|');
            chars.next();
        } else if c == '|' {
            out.push(cell.trim().to_string());
            cell.clear();
        } else {
            cell.push(c);
        }
    }
    out.push(cell.trim().to_string());
    out
}

/// One footprint entry with only whole-entry markdown unwrapped: backticks around the whole entry,
/// or a link whose text is the whole entry. Characters inside a code span are never touched.
fn unwrap_entry(entry: &str) -> String {
    let mut s = entry.trim();
    loop {
        if s.len() >= 2
            && s.starts_with('`')
            && s.ends_with('`')
            && !s[1..s.len() - 1].contains('`')
        {
            return s[1..s.len() - 1].trim().to_string();
        }
        let link = s.strip_prefix('[').and_then(|r| {
            let close = r.find("](")?;
            let url = r[close + 2..].strip_suffix(')')?;
            (!r[..close].contains('[') && !url.contains(')')).then(|| &r[..close])
        });
        match link {
            Some(text) => s = text.trim(),
            None => return s.to_string(),
        }
    }
}

/// A cell without markdown links (`[text](url)` becomes `text`) and backticks; every `*` stays.
fn keep_stars(cell: &str) -> String {
    let mut out = String::new();
    let mut rest = cell;
    while let Some(open) = rest.find('[') {
        let after = &rest[open + 1..];
        match after.find("](").and_then(|close| {
            after[close + 2..]
                .find(')')
                .map(|end| (close, close + 2 + end))
        }) {
            Some((close, end)) if !after[..close].contains('[') => {
                out.push_str(&rest[..open]);
                out.push_str(&after[..close]);
                rest = &after[end + 1..];
            }
            _ => {
                out.push_str(&rest[..=open]);
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out.retain(|c| c != '`');
    out.trim().to_string()
}

/// A cell without markdown links, backticks and asterisks.
fn plain(cell: &str) -> String {
    let mut out = keep_stars(cell);
    out.retain(|c| c != '*');
    out.trim().to_string()
}

fn id_list(cell: &str) -> Vec<String> {
    plain(cell)
        .split([',', ';'])
        .map(|s| s.trim().to_string())
        .filter(|s| {
            !s.is_empty() && !matches!(s.to_lowercase().as_str(), "-" | "none" | "—" | "n/a")
        })
        .collect()
}

fn path_list(cell: &str) -> Vec<String> {
    cell.replace("<br>", ",")
        .replace("<br/>", ",")
        .replace("<br />", ",")
        .split(',')
        .map(unwrap_entry)
        .filter(|s| !s.is_empty())
        .collect()
}

/// The rows of the one markdown table whose header names a footprint column; anything but exactly
/// one such table, with every column and a sound row, is refused by name.
fn read_phase_table(dir: &str, body: &str) -> Result<Vec<Phase>, PlanRefusal> {
    let lines: Vec<&str> = body.lines().collect();
    let mut tables: Vec<(usize, usize)> = Vec::new();
    let mut i = 0;
    while i < lines.len() {
        if !lines[i].trim_start().starts_with('|') {
            i += 1;
            continue;
        }
        let mut j = i;
        while j < lines.len() && lines[j].trim_start().starts_with('|') {
            j += 1;
        }
        if header_of(lines[i]).iter().any(|h| h == "footprint") {
            tables.push((i, j));
        }
        i = j;
    }
    let (i, j) = match tables.as_slice() {
        [] => {
            return Err(PlanRefusal::TableMissing(format!(
                "{dir}: no table has a footprint column"
            )))
        }
        [one] => *one,
        more => {
            return Err(PlanRefusal::TableAmbiguous(format!(
                "{dir}: {} tables have a footprint column",
                more.len()
            )))
        }
    };
    let header = header_of(lines[i]);
    if let Some(name) = vocabulary()
        .table_columns
        .iter()
        .find(|c| !header.contains(c))
    {
        return Err(PlanRefusal::ColumnMissing(format!("{dir}: column {name}")));
    }
    let rows: Vec<Vec<String>> = lines[i + 1..j].iter().skip(1).map(|l| cells(l)).collect();
    if rows.is_empty() {
        return Err(PlanRefusal::TableEmpty(format!(
            "{dir}: the table has no rows"
        )));
    }
    let at = |name: &str| header.iter().position(|h| h == name);
    let cell = |row: &[String], name: &str| {
        at(name)
            .and_then(|n| row.get(n))
            .cloned()
            .unwrap_or_default()
    };
    let mut phases: Vec<Phase> = Vec::new();
    for row in &rows {
        let id = plain(&cell(row, "id"));
        if phases.iter().any(|p| p.id == id) {
            return Err(PlanRefusal::IdDuplicate(format!("{dir}: phase {id:?}")));
        }
        let wave_text = plain(&cell(row, "wave"));
        let wave = match wave_text.parse::<u32>() {
            Ok(w) if w >= 1 => w,
            _ => {
                return Err(PlanRefusal::WaveInvalid(format!(
                    "{dir}: phase {id:?} wave {wave_text:?}"
                )))
            }
        };
        phases.push(Phase {
            id,
            title: plain(&cell(row, "title")),
            depends_on: id_list(&cell(row, "dependson")),
            footprint: path_list(&cell(row, "footprint")),
            wave,
            status: plain(&cell(row, "status")).to_lowercase(),
        });
    }
    Ok(phases)
}

fn header_of(line: &str) -> Vec<String> {
    cells(line)
        .iter()
        .map(|h| {
            h.to_lowercase()
                .chars()
                .filter(|c| c.is_ascii_lowercase())
                .collect()
        })
        .collect()
}
