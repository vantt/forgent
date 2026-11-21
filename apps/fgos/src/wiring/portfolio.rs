//! Portfolio item contract, check and generated index (D-ADR0082, phase 2).
//!
//! Provides frontmatter schema validation, citation integrity checks, index generation,
//! and native item creation/editing for the portfolio data model.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use fgos_identity::mint::{random, RandomKind};
use fgos_yaml_doc::{emit, parse, Profile, Value};
use serde::{Deserialize, Serialize};
use serde_json::json;

pub const ITEM_STATUSES: &[&str] = &["proposed", "parked", "in-flight", "done", "dropped"];
pub const ITEM_PRIORITIES: &[&str] = &["P0", "P1", "P2", "P3"];
pub const ITEM_BODY_SECTIONS: &[&str] = &["Why", "Done when", "Notes"];

pub const DISCUSSION_STATUSES: &[&str] = &["open", "paused", "settled"];
pub const PLAN_STATUSES: &[&str] = &["draft", "ready", "running", "done", "withdrawn"];

/// Errors and refusals during portfolio operations.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum PortfolioRefusal {
    #[error("frontmatter-missing: {0}")]
    FrontmatterMissing(String),
    #[error("frontmatter-invalid: {0}")]
    FrontmatterInvalid(String),
    #[error("key-missing: {0}")]
    KeyMissing(String),
    #[error("id-invalid: {0}")]
    InvalidId(String),
    #[error("status-unknown: {0}")]
    StatusUnknown(String),
    #[error("priority-unknown: {0}")]
    PriorityUnknown(String),
    #[error("body-section-missing: {0}")]
    BodySectionMissing(String),
    #[error("item-not-found: {0}")]
    ItemNotFound(String),
    #[error("io-error: {0}")]
    IoError(String),
}

impl From<io::Error> for PortfolioRefusal {
    fn from(err: io::Error) -> Self {
        PortfolioRefusal::IoError(err.to_string())
    }
}

/// A parsed backlog item.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BacklogItem {
    pub id: String,
    pub title: String,
    pub status: String,
    pub priority: String,
    pub area: String,
    pub created: String,
    pub filename: String,
    pub rel_path: PathBuf,
    pub why: String,
    pub done_when: String,
    pub notes: String,
}

/// A parsed discussion.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Discussion {
    pub id: String,
    pub title: String,
    pub status: String,
    pub source: Vec<String>,
    pub created: String,
    pub dir: String,
    pub rel_path: PathBuf,
}

/// A plan reference for portfolio checks.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PlanRef {
    pub dir: String,
    pub title: String,
    pub status: String,
    pub source: Vec<String>,
    pub rel_path: PathBuf,
}

/// Report produced by portfolio check.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PortfolioReport {
    pub ok: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub items: Vec<BacklogItem>,
    pub discussions: Vec<Discussion>,
    pub plans: Vec<PlanRef>,
}

/// Options for portfolio check.
#[derive(Debug, Clone)]
pub struct CheckOptions {
    pub strict: bool,
    pub check_index: bool,
    pub new_files: Vec<PathBuf>,
}

impl Default for CheckOptions {
    fn default() -> Self {
        Self {
            strict: false,
            check_index: true,
            new_files: Vec::new(),
        }
    }
}

/// Request to create a new backlog item.
#[derive(Debug, Clone)]
pub struct CreateItemRequest {
    pub id: Option<String>,
    pub slug: Option<String>,
    pub title: String,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub area: Option<String>,
    pub created: Option<String>,
    pub why: Option<String>,
    pub done_when: Option<String>,
    pub notes: Option<String>,
}

/// Request to edit an existing backlog item.
#[derive(Debug, Clone)]
pub struct EditItemRequest {
    pub id: String,
    pub title: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub area: Option<String>,
    pub why: Option<String>,
    pub done_when: Option<String>,
    pub notes: Option<String>,
}

/// Result of creating or editing an item.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ItemResult {
    pub id: String,
    pub filename: String,
    pub rel_path: PathBuf,
    pub full_path: PathBuf,
    pub content: String,
}

/// Validates whether an id matches `p-<10 base32>`.
pub fn is_valid_backlog_id(id: &str) -> bool {
    id.starts_with("p-")
        && id.len() == 12
        && id[2..].chars().all(|c| matches!(c, 'a'..='z' | '2'..='7'))
}

/// Validates whether an id matches `ds-<10 base32>`.
pub fn is_valid_discussion_id(id: &str) -> bool {
    id.starts_with("ds-")
        && id.len() == 13
        && id[3..].chars().all(|c| matches!(c, 'a'..='z' | '2'..='7'))
}

/// Splits the leading `---` frontmatter block from body text.
pub fn split_frontmatter(text: &str) -> Option<(&str, &str)> {
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

/// Checks whether markdown body contains the required section headings.
pub fn check_body_sections(body: &str) -> Vec<&'static str> {
    let mut missing = Vec::new();
    let lines: Vec<&str> = body.lines().collect();
    let headings: Vec<&str> = lines
        .into_iter()
        .filter(|l| {
            let trimmed = l.trim_start();
            trimmed.starts_with('#')
        })
        .collect();

    for &section in ITEM_BODY_SECTIONS {
        let found = headings.iter().any(|h| {
            let s = h.trim_start_matches('#').trim();
            s.eq_ignore_ascii_case(section)
        });
        if !found {
            missing.push(section);
        }
    }
    missing
}

/// Parses a backlog item markdown file.
pub fn parse_backlog_item(rel_path: &Path, text: &str) -> Result<BacklogItem, PortfolioRefusal> {
    let path_str = rel_path.to_string_lossy().to_string();
    let (front, body) = split_frontmatter(text).ok_or_else(|| {
        PortfolioRefusal::FrontmatterMissing(format!("{path_str}: no frontmatter"))
    })?;

    let doc = parse(front.as_bytes(), Profile::Tool, &path_str)
        .map_err(|e| PortfolioRefusal::FrontmatterInvalid(format!("{path_str}: {e:?}")))?;

    let Value::Map(entries) = doc.value() else {
        return Err(PortfolioRefusal::FrontmatterInvalid(format!(
            "{path_str}: frontmatter is not a mapping"
        )));
    };

    let get = |key: &str| entries.iter().find(|(k, _)| k == key).map(|(_, v)| v);
    let scalar = |key: &str| match get(key) {
        Some(Value::Str(s)) => Some(s.clone()),
        Some(Value::Int(i)) => Some(i.to_string()),
        Some(Value::Float(f)) => Some(f.to_string()),
        Some(Value::Bool(b)) => Some(b.to_string()),
        _ => None,
    };

    let id = scalar("id").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'id'"))
    })?;
    if !is_valid_backlog_id(&id) {
        return Err(PortfolioRefusal::InvalidId(format!(
            "{path_str}: invalid backlog id '{id}'"
        )));
    }

    let title = scalar("title").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'title'"))
    })?;
    if title.trim().is_empty() {
        return Err(PortfolioRefusal::KeyMissing(format!(
            "{path_str}: title is empty"
        )));
    }

    let status = scalar("status").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'status'"))
    })?;
    if !ITEM_STATUSES.contains(&status.as_str()) {
        return Err(PortfolioRefusal::StatusUnknown(format!(
            "{path_str}: unknown status '{status}'"
        )));
    }

    let priority = scalar("priority").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'priority'"))
    })?;
    if !ITEM_PRIORITIES.contains(&priority.as_str()) {
        return Err(PortfolioRefusal::PriorityUnknown(format!(
            "{path_str}: unknown priority '{priority}'"
        )));
    }

    let area = scalar("area").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'area'"))
    })?;
    let created = scalar("created").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'created'"))
    })?;

    let missing = check_body_sections(body);
    if !missing.is_empty() {
        return Err(PortfolioRefusal::BodySectionMissing(format!(
            "{path_str}: missing required section(s): {}",
            missing.join(", ")
        )));
    }

    // Extract section texts
    let (mut why, mut done_when, mut notes) = (Vec::new(), Vec::new(), Vec::new());
    let mut current: Option<&mut Vec<String>> = None;
    for line in body.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with('#') {
            let h = trimmed.trim_start_matches('#').trim();
            if h.eq_ignore_ascii_case("why") {
                current = Some(&mut why);
                continue;
            } else if h.eq_ignore_ascii_case("done when") {
                current = Some(&mut done_when);
                continue;
            } else if h.eq_ignore_ascii_case("notes") {
                current = Some(&mut notes);
                continue;
            } else {
                current = None;
            }
        } else if let Some(target) = current.as_mut() {
            target.push(line.to_string());
        }
    }

    let filename = rel_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(BacklogItem {
        id,
        title,
        status,
        priority,
        area,
        created,
        filename,
        rel_path: rel_path.to_path_buf(),
        why: why.join("\n").trim().to_string(),
        done_when: done_when.join("\n").trim().to_string(),
        notes: notes.join("\n").trim().to_string(),
    })
}

/// Parses a discussion markdown file.
pub fn parse_discussion(rel_path: &Path, text: &str) -> Result<Discussion, PortfolioRefusal> {
    let path_str = rel_path.to_string_lossy().to_string();
    let (front, _) = split_frontmatter(text).ok_or_else(|| {
        PortfolioRefusal::FrontmatterMissing(format!("{path_str}: no frontmatter"))
    })?;

    let doc = parse(front.as_bytes(), Profile::Tool, &path_str)
        .map_err(|e| PortfolioRefusal::FrontmatterInvalid(format!("{path_str}: {e:?}")))?;

    let Value::Map(entries) = doc.value() else {
        return Err(PortfolioRefusal::FrontmatterInvalid(format!(
            "{path_str}: frontmatter is not a mapping"
        )));
    };

    let get = |key: &str| entries.iter().find(|(k, _)| k == key).map(|(_, v)| v);
    let scalar = |key: &str| match get(key) {
        Some(Value::Str(s)) => Some(s.clone()),
        Some(Value::Int(i)) => Some(i.to_string()),
        Some(Value::Float(f)) => Some(f.to_string()),
        Some(Value::Bool(b)) => Some(b.to_string()),
        _ => None,
    };

    let id = scalar("id").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'id'"))
    })?;
    if !is_valid_discussion_id(&id) {
        return Err(PortfolioRefusal::InvalidId(format!(
            "{path_str}: invalid discussion id '{id}'"
        )));
    }

    let title = scalar("title").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'title'"))
    })?;
    let status = scalar("status").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'status'"))
    })?;
    if !DISCUSSION_STATUSES.contains(&status.as_str()) {
        return Err(PortfolioRefusal::StatusUnknown(format!(
            "{path_str}: unknown discussion status '{status}'"
        )));
    }

    let source = match get("source") {
        Some(Value::Seq(items)) => {
            let mut list = Vec::new();
            for item in items {
                match item {
                    Value::Str(s) => list.push(s.clone()),
                    _ => {
                        return Err(PortfolioRefusal::FrontmatterInvalid(format!(
                            "{path_str}: source entry is not a string"
                        )))
                    }
                }
            }
            list
        }
        _ => {
            return Err(PortfolioRefusal::KeyMissing(format!(
                "{path_str}: 'source' must be a sequence of backlog ids"
            )))
        }
    };

    let created = scalar("created").ok_or_else(|| {
        PortfolioRefusal::KeyMissing(format!("{path_str}: missing required key 'created'"))
    })?;

    let dir = rel_path
        .parent()
        .and_then(|p| p.file_name())
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(Discussion {
        id,
        title,
        status,
        source,
        created,
        dir,
        rel_path: rel_path.to_path_buf(),
    })
}

/// Converts a string title into a kebab-case slug.
pub fn slugify(title: &str) -> String {
    let mut slug = String::new();
    let mut last_dash = true;
    for c in title.chars() {
        if c.is_ascii_alphanumeric() {
            slug.push(c.to_ascii_lowercase());
            last_dash = false;
        } else if !last_dash {
            slug.push('-');
            last_dash = true;
        }
    }
    let trimmed = slug.trim_matches('-');
    if trimmed.is_empty() {
        "item".to_string()
    } else {
        trimmed.to_string()
    }
}

/// Formats a backlog item with YAML frontmatter.
pub fn format_backlog_item(
    id: &str,
    title: &str,
    status: &str,
    priority: &str,
    area: &str,
    created: &str,
    why: &str,
    done_when: &str,
    notes: &str,
) -> Result<String, PortfolioRefusal> {
    if !is_valid_backlog_id(id) {
        return Err(PortfolioRefusal::InvalidId(format!(
            "invalid backlog id '{id}'"
        )));
    }
    if !ITEM_STATUSES.contains(&status) {
        return Err(PortfolioRefusal::StatusUnknown(format!(
            "unknown status '{status}'"
        )));
    }
    if !ITEM_PRIORITIES.contains(&priority) {
        return Err(PortfolioRefusal::PriorityUnknown(format!(
            "unknown priority '{priority}'"
        )));
    }

    let meta_json = json!({
        "id": id,
        "title": title,
        "status": status,
        "priority": priority,
        "area": area,
        "created": created,
    });

    let doc_val = Value::from_json(&meta_json);
    let bytes = emit(&doc_val, Profile::Tool, "item.md")
        .map_err(|e| PortfolioRefusal::FrontmatterInvalid(format!("{e:?}")))?;
    let yaml_str = String::from_utf8(bytes)
        .map_err(|e| PortfolioRefusal::FrontmatterInvalid(format!("{e:?}")))?;

    let why_body = if why.trim().is_empty() {
        "..."
    } else {
        why.trim()
    };
    let done_body = if done_when.trim().is_empty() {
        "..."
    } else {
        done_when.trim()
    };
    let notes_body = if notes.trim().is_empty() {
        "..."
    } else {
        notes.trim()
    };

    const FENCE: &str = concat!("-", "-", "-");
    let formatted = format!(
        "{FENCE}\n{}{FENCE}\n\n# Why\n\n{}\n\n# Done when\n\n{}\n\n# Notes\n\n{}\n",
        yaml_str, why_body, done_body, notes_body
    );
    Ok(formatted)
}

/// Safely creates a new backlog item file.
pub fn create_item(
    repo_root: &Path,
    req: &CreateItemRequest,
) -> Result<ItemResult, PortfolioRefusal> {
    let id = match &req.id {
        Some(id) => id.clone(),
        None => random(RandomKind::Backlog)?,
    };

    let slug = match &req.slug {
        Some(s) => s.clone(),
        None => slugify(&req.title),
    };

    let filename = format!("{id}-{slug}.md");
    let rel_path = PathBuf::from("plans").join("backlog").join(&filename);
    let full_dir = repo_root.join("plans").join("backlog");
    let full_path = full_dir.join(&filename);

    fs::create_dir_all(&full_dir)?;
    if full_path.exists() {
        return Err(PortfolioRefusal::IoError(format!(
            "file already exists: {}",
            rel_path.display()
        )));
    }

    let status = req.status.as_deref().unwrap_or("proposed");
    let priority = req.priority.as_deref().unwrap_or("P2");
    let area = req.area.as_deref().unwrap_or("general");
    let created = req.created.as_deref().unwrap_or("2026-11-21");
    let why = req.why.as_deref().unwrap_or("...");
    let done_when = req.done_when.as_deref().unwrap_or("...");
    let notes = req.notes.as_deref().unwrap_or("...");

    let content = format_backlog_item(
        &id, &req.title, status, priority, area, created, why, done_when, notes,
    )?;

    let tmp_path = full_dir.join(format!(".tmp-{id}-{}.tmp", std::process::id()));
    fs::write(&tmp_path, &content)?;
    fs::rename(&tmp_path, &full_path)?;

    Ok(ItemResult {
        id,
        filename,
        rel_path,
        full_path,
        content,
    })
}

/// Safely edits an existing backlog item file.
pub fn edit_item(repo_root: &Path, req: &EditItemRequest) -> Result<ItemResult, PortfolioRefusal> {
    let backlog_dir = repo_root.join("plans").join("backlog");
    if !backlog_dir.exists() {
        return Err(PortfolioRefusal::ItemNotFound(format!(
            "plans/backlog directory not found"
        )));
    }

    let entries = fs::read_dir(&backlog_dir)?;
    let mut target_file = None;
    for entry in entries {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name == format!("{}.md", req.id) || name.starts_with(&format!("{}-", req.id)) {
            target_file = Some(name);
            break;
        }
    }

    let filename = target_file
        .ok_or_else(|| PortfolioRefusal::ItemNotFound(format!("item '{}' not found", req.id)))?;

    let full_path = backlog_dir.join(&filename);
    let rel_path = PathBuf::from("plans").join("backlog").join(&filename);
    let existing_text = fs::read_to_string(&full_path)?;
    let parsed = parse_backlog_item(&rel_path, &existing_text)?;

    let title = req.title.as_deref().unwrap_or(&parsed.title);
    let status = req.status.as_deref().unwrap_or(&parsed.status);
    let priority = req.priority.as_deref().unwrap_or(&parsed.priority);
    let area = req.area.as_deref().unwrap_or(&parsed.area);
    let why = req.why.as_deref().unwrap_or(&parsed.why);
    let done_when = req.done_when.as_deref().unwrap_or(&parsed.done_when);
    let notes = req.notes.as_deref().unwrap_or(&parsed.notes);

    let content = format_backlog_item(
        &parsed.id,
        title,
        status,
        priority,
        area,
        &parsed.created,
        why,
        done_when,
        notes,
    )?;

    let tmp_path = backlog_dir.join(format!(
        ".tmp-edit-{}-{}.tmp",
        parsed.id,
        std::process::id()
    ));
    fs::write(&tmp_path, &content)?;
    fs::rename(&tmp_path, &full_path)?;

    Ok(ItemResult {
        id: parsed.id,
        filename,
        rel_path,
        full_path,
        content,
    })
}

/// Generates the markdown index for `plans/backlog.md`.
pub fn generate_backlog_index(
    items: &[BacklogItem],
    discussions: &[Discussion],
    plans: &[PlanRef],
) -> String {
    let mut sorted_items = items.to_vec();
    sorted_items.sort_by(|a, b| {
        let rank = |prio: &str| {
            ITEM_PRIORITIES
                .iter()
                .position(|p| *p == prio)
                .unwrap_or(usize::MAX)
        };
        let r_a = rank(&a.priority);
        let r_b = rank(&b.priority);
        if r_a != r_b {
            return r_a.cmp(&r_b);
        }
        if a.created != b.created {
            return a.created.cmp(&b.created);
        }
        a.id.cmp(&b.id)
    });

    let mut out = String::new();
    out.push_str("# Product Backlog\n\n");
    out.push_str("| ID | Title | Status | Priority | Area | Citing |\n");
    out.push_str("|---|---|---|---|---|---|\n");

    for item in sorted_items {
        let mut citing_discussions: Vec<String> = discussions
            .iter()
            .filter(|d| d.source.contains(&item.id))
            .map(|d| {
                format!(
                    "[{id}](discussions/{dir}/DISCUSSION.md) ({status})",
                    id = d.id,
                    dir = d.dir,
                    status = d.status
                )
            })
            .collect();
        citing_discussions.sort();

        let mut citing_plans: Vec<String> = plans
            .iter()
            .filter(|p| p.source.contains(&item.id))
            .map(|p| {
                format!(
                    "[{dir}]({dir}/plan.md) ({status})",
                    dir = p.dir,
                    status = p.status
                )
            })
            .collect();
        citing_plans.sort();

        let mut all_citing = citing_discussions;
        all_citing.extend(citing_plans);

        let citing_col = if all_citing.is_empty() {
            "-".to_string()
        } else {
            all_citing.join(", ")
        };

        let title_clean = item.title.replace('|', "\\|").replace('\n', " ");
        let area_clean = item.area.replace('|', "\\|").replace('\n', " ");

        out.push_str(&format!(
            "| [{id}](backlog/{file}) | {title} | {status} | {priority} | {area} | {citing} |\n",
            id = item.id,
            file = item.filename,
            title = title_clean.trim(),
            status = item.status,
            priority = item.priority,
            area = area_clean.trim(),
            citing = citing_col
        ));
    }

    out
}

/// Runs the portfolio contract check against a repo root directory.
pub fn check_portfolio(
    repo_root: &Path,
    options: &CheckOptions,
) -> Result<PortfolioReport, PortfolioRefusal> {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let backlog_dir = repo_root.join("plans").join("backlog");
    let discussions_dir = repo_root.join("plans").join("discussions");
    let plans_root = repo_root.join("plans");

    let mut items = Vec::new();
    let mut discussions = Vec::new();
    let mut plans = Vec::new();

    // 1. Read backlog items
    if backlog_dir.exists() {
        for entry in fs::read_dir(&backlog_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) != Some("md") {
                continue;
            }
            let rel = path.strip_prefix(repo_root).unwrap_or(&path);
            let text = fs::read_to_string(&path)?;
            match parse_backlog_item(rel, &text) {
                Ok(item) => items.push(item),
                Err(e) => errors.push(format!("{}: {}", rel.display(), e)),
            }
        }
    }

    // 2. Read discussions
    if discussions_dir.exists() {
        for entry in fs::read_dir(&discussions_dir)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let disc_file = path.join("DISCUSSION.md");
            if !disc_file.exists() {
                continue;
            }
            let rel = disc_file.strip_prefix(repo_root).unwrap_or(&disc_file);
            let text = fs::read_to_string(&disc_file)?;
            match parse_discussion(rel, &text) {
                Ok(disc) => discussions.push(disc),
                Err(e) => errors.push(format!("{}: {}", rel.display(), e)),
            }
        }
    }

    // 3. Read plans
    if plans_root.exists() {
        for entry in fs::read_dir(&plans_root)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let dir_name = entry.file_name().to_string_lossy().to_string();
            if dir_name == "backlog" || dir_name == "discussions" {
                continue;
            }
            let plan_file = path.join("plan.md");
            if !plan_file.exists() {
                continue;
            }
            let rel = plan_file.strip_prefix(repo_root).unwrap_or(&plan_file);
            let text = fs::read_to_string(&plan_file)?;
            if let Some((front, _)) = split_frontmatter(&text) {
                let doc = parse(front.as_bytes(), Profile::Tool, &dir_name);
                if let Ok(doc) = doc {
                    if let Value::Map(entries) = doc.value() {
                        let get =
                            |k: &str| entries.iter().find(|(key, _)| key == k).map(|(_, v)| v);
                        let title = match get("title") {
                            Some(Value::Str(s)) => s.clone(),
                            _ => dir_name.clone(),
                        };
                        let status = match get("status") {
                            Some(Value::Str(s)) => s.clone(),
                            _ => "draft".to_string(),
                        };
                        if !PLAN_STATUSES.contains(&status.as_str()) {
                            errors.push(format!(
                                "{}: unknown plan status '{}'",
                                rel.display(),
                                status
                            ));
                        }
                        let mut source = Vec::new();
                        if let Some(Value::Seq(items)) = get("source") {
                            for item in items {
                                if let Value::Str(s) = item {
                                    source.push(s.clone());
                                }
                            }
                        }
                        plans.push(PlanRef {
                            dir: dir_name,
                            title,
                            status,
                            source,
                            rel_path: rel.to_path_buf(),
                        });
                    }
                }
            }
        }
    }

    // 4. Citation integrity: referenced ids must exist
    let item_ids: std::collections::HashSet<&str> = items.iter().map(|it| it.id.as_str()).collect();
    let disc_ids: std::collections::HashSet<&str> =
        discussions.iter().map(|d| d.id.as_str()).collect();

    for d in &discussions {
        for src in &d.source {
            if src.starts_with("p-") {
                if !item_ids.contains(src.as_str()) {
                    errors.push(format!(
                        "unknown-source: discussion {} cites non-existent backlog item '{}'",
                        d.id, src
                    ));
                }
            } else {
                errors.push(format!(
                    "invalid-source: discussion {} source '{}' must start with p-",
                    d.id, src
                ));
            }
        }
    }

    for p in &plans {
        for src in &p.source {
            if src.starts_with("p-") {
                if !item_ids.contains(src.as_str()) {
                    errors.push(format!(
                        "unknown-source: plan {} cites non-existent backlog item '{}'",
                        p.dir, src
                    ));
                }
            } else if src.starts_with("ds-") {
                if !disc_ids.contains(src.as_str()) {
                    errors.push(format!(
                        "unknown-source: plan {} cites non-existent discussion '{}'",
                        p.dir, src
                    ));
                }
            }
        }
    }

    // 5. In-flight items must have citing discussion or plan
    for it in &items {
        if it.status == "in-flight" {
            let citing_d = discussions.iter().any(|d| d.source.contains(&it.id));
            let citing_p = plans.iter().any(|p| p.source.contains(&it.id));
            if !citing_d && !citing_p {
                errors.push(format!(
                    "in-flight-uncited: backlog item '{}' is 'in-flight' but has no citing discussion or plan",
                    it.id
                ));
            }
        }
    }

    // 6. New discussion or plan must cite at least one backlog item
    for d in &discussions {
        let has_backlog = d.source.iter().any(|s| s.starts_with("p-"));
        if !has_backlog {
            let is_new = options.strict || options.new_files.contains(&d.rel_path);
            let msg = format!(
                "missing-backlog-source: discussion '{}' does not cite any backlog item",
                d.id
            );
            if is_new {
                errors.push(msg);
            } else {
                warnings.push(msg);
            }
        }
    }

    for p in &plans {
        let has_backlog = p.source.iter().any(|s| s.starts_with("p-"));
        if !has_backlog {
            let is_new = options.strict || options.new_files.contains(&p.rel_path);
            let msg = format!(
                "missing-backlog-source: plan '{}' does not cite any backlog item",
                p.dir
            );
            if is_new {
                errors.push(msg);
            } else {
                warnings.push(msg);
            }
        }
    }

    // 7. Drift detection
    for it in &items {
        let citing_plans: Vec<&PlanRef> =
            plans.iter().filter(|p| p.source.contains(&it.id)).collect();
        let citing_discs: Vec<&Discussion> = discussions
            .iter()
            .filter(|d| d.source.contains(&it.id))
            .collect();

        if it.status == "done" {
            for p in &citing_plans {
                if p.status == "running" {
                    errors.push(format!(
                        "drift-done-item-plan-running: backlog item '{}' is 'done' but citing plan '{}' is 'running'",
                        it.id, p.dir
                    ));
                }
            }
        }

        if it.status == "in-flight" {
            if !citing_plans.is_empty()
                && citing_plans
                    .iter()
                    .all(|p| p.status == "done" || p.status == "withdrawn")
            {
                let has_active_disc = citing_discs
                    .iter()
                    .any(|d| d.status == "open" || d.status == "paused");
                if !has_active_disc {
                    errors.push(format!(
                        "drift-in-flight-plans-ended: backlog item '{}' is 'in-flight' but all citing plans are ended and no open discussion cites it",
                        it.id
                    ));
                }
            }
        }
    }

    // 8. Index drift check
    if options.check_index {
        let index_path = plans_root.join("backlog.md");
        if !items.is_empty() || index_path.exists() {
            let expected = generate_backlog_index(&items, &discussions, &plans);
            if !index_path.exists() {
                errors.push("index-missing: plans/backlog.md does not exist".to_string());
            } else {
                let actual = fs::read_to_string(&index_path)?;
                if actual.trim() != expected.trim() {
                    errors.push(
                        "index-drift: plans/backlog.md does not match freshly generated index"
                            .to_string(),
                    );
                }
            }
        }
    }

    let ok = errors.is_empty();
    Ok(PortfolioReport {
        ok,
        errors,
        warnings,
        items,
        discussions,
        plans,
    })
}
