//! The portfolio reader: plan frontmatter and phase table only, pure over text (no filesystem, no
//! Work items). The vocabulary comes from `contracts/plan-vocabulary.v1.json`, the one source the
//! plan-contract script and the Node resolver read too.

use std::sync::OnceLock;

use fgos_yaml_doc::{parse, Profile, Value};

const VOCABULARY_JSON: &str = include_str!("../../contracts/plan-vocabulary.v1.json");

/// The shared plan vocabulary.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Vocabulary {
    pub statuses: Vec<String>,
    pub priorities: Vec<String>,
    pub table_columns: Vec<String>,
    pub head_name_max: usize,
    pub head_name_project_prefix: usize,
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
                .map(|v| v.as_str().expect("vocabulary entries are strings").to_string())
                .collect()
        };
        let number = |key: &str| -> usize {
            json["headName"][key].as_u64().expect("headName limits are numbers") as usize
        };
        Vocabulary {
            statuses: list("statuses"),
            priorities: list("priorities"),
            table_columns: list("tableColumns"),
            head_name_max: number("max"),
            head_name_project_prefix: number("projectPrefix"),
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
}

impl PlanRefusal {
    /// The stable refusal code.
    pub fn code(&self) -> &'static str {
        match self {
            PlanRefusal::FrontmatterMissing(_) => "plan-frontmatter-missing",
            PlanRefusal::StatusUnknown(_) => "plan-status-unknown",
            PlanRefusal::PriorityUnknown(_) => "plan-priority-unknown",
        }
    }
}

/// One row of a plan's phase table.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Phase {
    pub id: String,
    pub title: String,
    pub depends_on: Vec<String>,
    pub footprint: Vec<String>,
    pub wave: Option<u32>,
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
        return Err(PlanRefusal::FrontmatterMissing(format!("{dir}: frontmatter is not a mapping")));
    };
    let get = |key: &str| entries.iter().find(|(k, _)| k == key).map(|(_, v)| v);
    let scalar = |key: &str| match get(key) {
        Some(Value::Str(s)) => s.clone(),
        Some(Value::Int(i)) => i.to_string(),
        Some(Value::Float(f)) => f.to_string(),
        Some(Value::Bool(b)) => b.to_string(),
        _ => String::new(),
    };
    let list = |key: &str| match get(key) {
        Some(Value::Seq(items)) => items
            .iter()
            .filter_map(|v| match v {
                Value::Str(s) => Some(s.clone()),
                _ => None,
            })
            .collect(),
        _ => Vec::new(),
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
    Ok(Plan {
        dir: dir.to_string(),
        title: scalar("title"),
        status,
        priority,
        created: scalar("created"),
        blocked_by: list("blockedBy"),
        footprint: list("footprint"),
        source: list("source"),
        phases: read_phase_table(body),
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
    let rank = |p: &Plan| vocab.priorities.iter().position(|x| *x == p.priority).unwrap_or(usize::MAX);
    plans.sort_by(|a, b| {
        rank(a)
            .cmp(&rank(b))
            .then_with(|| a.created.cmp(&b.created))
            .then_with(|| a.dir.cmp(&b.dir))
    });
}

fn normalize(path: &str) -> String {
    let path = path.replace('\\', "/");
    let fixed = path.split('*').next().unwrap_or("");
    fixed.trim_end_matches('/').to_string()
}

/// Whether two footprint lists share a path: equal, or one inside the other; a glob counts as its
/// fixed prefix. The same rule as `overlaps` in `scripts/plan-contract-check.mjs`.
pub fn overlaps(a: &[String], b: &[String]) -> bool {
    a.iter().any(|x| {
        b.iter().any(|y| {
            let (nx, ny) = (normalize(x), normalize(y));
            nx.is_empty()
                || ny.is_empty()
                || nx == ny
                || nx.starts_with(&format!("{ny}/"))
                || ny.starts_with(&format!("{nx}/"))
        })
    })
}

/// Plans a supervisor may start now, in input order: status `ready`, every `blockedBy` plan in
/// `done_dirs`, and no footprint overlap with a `running` plan.
pub fn admissible<'a>(plans: &'a [Plan], done_dirs: &[String]) -> Vec<&'a Plan> {
    plans
        .iter()
        .filter(|p| p.status == "ready")
        .filter(|p| p.blocked_by.iter().all(|b| done_dirs.contains(b)))
        .filter(|p| {
            !plans
                .iter()
                .any(|r| r.status == "running" && overlaps(&p.footprint, &r.footprint))
        })
        .collect()
}

fn cut(text: &str, max: usize) -> &str {
    match text.char_indices().nth(max) {
        Some((at, _)) => &text[..at],
        None => text,
    }
}

/// The head name of a lead or planner: the project handle cut to the prefix limit (trailing `-`
/// trimmed), `-`, and the plan or discussion directory cut so the whole fits the name limit.
pub fn head_name(project_handle: &str, dir: &str) -> String {
    let vocab = vocabulary();
    let prefix = cut(project_handle, vocab.head_name_project_prefix).trim_end_matches('-');
    let room = vocab.head_name_max.saturating_sub(prefix.chars().count() + 1);
    format!("{prefix}-{}", cut(dir, room))
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

/// A cell without markdown links (`[text](url)` becomes `text`), backticks and asterisks.
fn plain(cell: &str) -> String {
    let mut out = String::new();
    let mut rest = cell;
    while let Some(open) = rest.find('[') {
        let after = &rest[open + 1..];
        match after.find("](").and_then(|close| {
            after[close + 2..].find(')').map(|end| (close, close + 2 + end))
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
    out.retain(|c| c != '`' && c != '*');
    out.trim().to_string()
}

fn id_list(cell: &str) -> Vec<String> {
    plain(cell)
        .split([',', ';'])
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && !matches!(s.to_lowercase().as_str(), "-" | "none" | "—" | "n/a"))
        .collect()
}

fn path_list(cell: &str) -> Vec<String> {
    cell.replace("<br>", ",")
        .replace("<br/>", ",")
        .replace("<br />", ",")
        .split(',')
        .map(plain)
        .filter(|s| !s.is_empty())
        .collect()
}

/// The rows of the first markdown table whose header names a footprint column.
fn read_phase_table(body: &str) -> Vec<Phase> {
    let lines: Vec<&str> = body.lines().collect();
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
        let header: Vec<String> = cells(lines[i])
            .iter()
            .map(|h| h.to_lowercase().chars().filter(|c| c.is_ascii_lowercase()).collect())
            .collect();
        if header.iter().any(|h| h == "footprint") {
            let at = |name: &str| header.iter().position(|h| h == name);
            let cell = |row: &[String], name: &str| {
                at(name).and_then(|n| row.get(n)).cloned().unwrap_or_default()
            };
            return lines[i + 1..j]
                .iter()
                .skip(1)
                .map(|l| cells(l))
                .map(|row| Phase {
                    id: plain(&cell(&row, "id")),
                    title: plain(&cell(&row, "title")),
                    depends_on: id_list(&cell(&row, "dependson")),
                    footprint: path_list(&cell(&row, "footprint")),
                    wave: plain(&cell(&row, "wave")).parse().ok(),
                    status: plain(&cell(&row, "status")).to_lowercase(),
                })
                .collect();
        }
        i = j;
    }
    Vec::new()
}
