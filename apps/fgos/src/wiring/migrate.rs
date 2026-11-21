//! `fgos migrate portfolio`: moves a project from the legacy portfolio shape (one `docs/backlog.md` table and
//! `docs/discussions/<slug>/` directories) to the portfolio data model: one file per backlog item under the
//! backlog item root, one id-named directory per discussion under the discussions root, a generated backlog
//! index, and active references rewritten to the new paths.
//!
//! The three roots come from the convention rules (`backlog-item`, `discussion`, `backlog-index`), never from
//! strings of their own. The run is idempotent: a row whose id already has a file, a discussion whose slug already
//! has a directory and a reference already rewritten are left alone, so a second run changes nothing. The legacy
//! backlog is replaced by a short pointer last, so an interrupted run is finished by running it again.
//!
//! The legacy paths are built with `concat!` so that the reference rewrite, run over a checkout that contains
//! this very file, cannot rewrite the tool that is running it.
//!
//! The provider, the projector and the descriptor are complete here; the host registers the provider in
//! `main.rs` and the route table, which is why the module allows dead code until that registration lands.
#![allow(dead_code)]

use fgos_convention::packaged_rules;
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, OperationId, OperationProvider,
    OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle, ProviderOutcome,
    VerbAnswer,
};
use fgos_identity::mint::{random, RandomKind};
use serde_json::{json, Value};
use std::borrow::Cow;
use std::collections::{BTreeMap, BTreeSet};
use std::ffi::OsString;
use std::fs;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

use super::portfolio::{
    check_portfolio, format_backlog_item, generate_backlog_index, is_valid_backlog_id,
    parse_backlog_item, slugify, split_frontmatter, BacklogItemFields, CheckOptions,
};

pub const OPERATION_ID: &str = "migrate.portfolio";

/// The sub-commands `migrate` serves.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["portfolio"];

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("packaging"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("migrate.portfolio.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("migrate.portfolio.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

const LEGACY_BACKLOG: &str = concat!("docs/", "backlog.md");
const LEGACY_DISCUSSIONS: &str = concat!("docs/", "discussions");
/// Marks the pointer the legacy backlog is replaced by, so a second run knows it is already migrated.
const POINTER_MARKER: &str = "<!-- migrated-portfolio-pointer -->";
/// Directories a reference rewrite never enters: history and archives stay as written, and `plans` is read by its
/// own rule.
const SKIP_DIRS: &[&str] = &[
    ".git",
    ".fgos",
    ".gitnexus",
    "node_modules",
    "target",
    "archive",
    "plans",
];
const SKIP_PREFIXES: &[&str] = &["docs/history/"];
const MAX_REWRITE_BYTES: u64 = 4 * 1024 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum MigrateError {
    #[error("convention-rule-missing: no rule of kind '{0}'")]
    RuleMissing(String),
    #[error("row-invalid: {0}")]
    RowInvalid(String),
    #[error("io-error: {0}")]
    Io(String),
}

impl From<std::io::Error> for MigrateError {
    fn from(error: std::io::Error) -> Self {
        MigrateError::Io(error.to_string())
    }
}

/// One `fgos migrate portfolio` call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MigrateRequest {
    pub root: PathBuf,
    /// Describe what would change and write nothing.
    pub dry_run: bool,
}

/// Reads a call of `migrate portfolio` (`args[0]` is the verb) through the shared parser.
pub fn project_migrate_request(
    args: &[OsString],
    root: Result<PathBuf, String>,
) -> Result<MigrateRequest, String> {
    let positionals: Vec<String> = args
        .iter()
        .skip(1)
        .map(|a| a.to_string_lossy().into_owned())
        .filter(|a| !a.starts_with('-'))
        .collect();
    if positionals.first().map(String::as_str) != Some("portfolio") {
        return Err("bad-args: migrate takes the sub-command `portfolio`".to_owned());
    }
    Ok(MigrateRequest {
        root: root?,
        dry_run: args.iter().any(|a| a == "--dry-run"),
    })
}

/// What a run did (or, with `--dry-run`, would do).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct MigrateReport {
    pub dry_run: bool,
    pub rows_found: usize,
    pub items_created: usize,
    pub items_existing: usize,
    pub discussions_moved: usize,
    pub discussions_existing: usize,
    pub files_rewritten: Vec<String>,
    pub index_written: bool,
    pub pointer_written: bool,
    /// Legacy path of every moved discussion and the path it now has.
    pub mapping: BTreeMap<String, String>,
    /// Rows whose status cell was not a plain status word, by id: the original text kept in the item notes.
    pub check_errors: Vec<String>,
}

impl MigrateReport {
    pub fn changed(&self) -> bool {
        self.items_created > 0
            || self.discussions_moved > 0
            || !self.files_rewritten.is_empty()
            || self.index_written
            || self.pointer_written
    }

    pub fn to_json(&self) -> Value {
        json!({
            "dryRun": self.dry_run,
            "changed": self.changed(),
            "rowsFound": self.rows_found,
            "itemsCreated": self.items_created,
            "itemsExisting": self.items_existing,
            "discussionsMoved": self.discussions_moved,
            "discussionsExisting": self.discussions_existing,
            "filesRewritten": self.files_rewritten,
            "indexWritten": self.index_written,
            "pointerWritten": self.pointer_written,
            "mapping": self.mapping,
            "checkErrors": self.check_errors,
        })
    }
}

// ---- convention roots -------------------------------------------------------------------------------------------

/// The first root of the convention rule of `kind`, without a trailing slash.
fn rule_root(kind: &str) -> Result<String, MigrateError> {
    packaged_rules()
        .by_kind(kind)
        .and_then(|rule| rule.roots.first())
        .map(|root| root.trim_end_matches('/').to_owned())
        .ok_or_else(|| MigrateError::RuleMissing(kind.to_owned()))
}

struct Roots {
    items: String,
    discussions: String,
    /// Directory of the index file (`plans`) and its name.
    index: String,
}

fn roots() -> Result<Roots, MigrateError> {
    let index_root = rule_root("backlog-index")?;
    let template = packaged_rules()
        .by_kind("backlog-index")
        .map(|rule| rule.template.clone())
        .ok_or_else(|| MigrateError::RuleMissing("backlog-index".into()))?;
    Ok(Roots {
        items: rule_root("backlog-item")?,
        discussions: rule_root("discussion")?,
        index: format!("{index_root}/{}", template.as_deref().unwrap_or("backlog.md")),
    })
}

// ---- legacy backlog rows ----------------------------------------------------------------------------------------

/// One row of the legacy table, as written.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LegacyRow {
    pub id: String,
    pub story: String,
    pub cos: String,
    pub status: String,
    pub feature: String,
}

/// Splits a table line into cells at every `|` that is not escaped as `\|`.
fn split_cells(line: &str) -> Vec<String> {
    let mut cells = Vec::new();
    let mut current = String::new();
    let mut chars = line.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' && chars.peek() == Some(&'|') {
            current.push('|');
            chars.next();
        } else if c == '|' {
            cells.push(std::mem::take(&mut current));
        } else {
            current.push(c);
        }
    }
    cells.push(current);
    cells
}

/// Parses the legacy table. The id is the first cell and the status, feature and definition of done are the last
/// three, so a story that holds an unescaped `|` is still read whole.
pub fn parse_legacy_rows(text: &str) -> Result<Vec<LegacyRow>, MigrateError> {
    let mut rows = Vec::new();
    for line in text.lines().filter(|l| l.trim_start().starts_with('|')) {
        let mut cells = split_cells(line.trim());
        // `| a | b |` splits into an empty first and last cell.
        if cells.first().is_some_and(|c| c.trim().is_empty()) {
            cells.remove(0);
        }
        if cells.last().is_some_and(|c| c.trim().is_empty()) {
            cells.pop();
        }
        let first = cells.first().map(|c| c.trim()).unwrap_or_default();
        if first.eq_ignore_ascii_case("id") || first.chars().all(|c| matches!(c, '-' | ':' | ' ')) {
            continue;
        }
        if cells.len() < 5 {
            return Err(MigrateError::RowInvalid(format!(
                "row '{first}' has {} cells, expected 5",
                cells.len()
            )));
        }
        let n = cells.len();
        rows.push(LegacyRow {
            id: first.trim_matches('`').to_owned(),
            story: cells[1..n - 3].join(" | ").trim().to_owned(),
            cos: cells[n - 3].trim().to_owned(),
            status: cells[n - 2].trim().to_owned(),
            feature: cells[n - 1].trim().to_owned(),
        });
    }
    Ok(rows)
}

/// The bold lead of a story is its title; the rest is the why.
fn split_story(story: &str) -> (String, String) {
    if let Some(rest) = story.strip_prefix("**") {
        if let Some(end) = rest.find("**") {
            let title = rest[..end].trim().trim_end_matches('.').to_owned();
            let why = rest[end + 2..].trim().to_owned();
            if !title.is_empty() {
                return (title, why);
            }
        }
    }
    let flat = story.replace('\n', " ");
    let cut = flat
        .char_indices()
        .nth(100)
        .map_or(flat.len(), |(index, _)| index);
    let title = flat[..cut].trim().to_owned();
    (if title.is_empty() { "item".to_owned() } else { title }, story.to_owned())
}

/// Maps the free-text status cell to the status vocabulary by the earliest keyword; anything else is proposed.
/// `in-flight` is never produced: the check requires a citing plan or discussion for it, which a migrated row
/// cannot have yet. The original text stays in the item notes.
fn map_status(cell: &str) -> &'static str {
    let lower = cell.to_lowercase();
    const FAMILIES: &[(&str, &[&str])] = &[
        ("done", &["done", "shipped", "landed", "complete", "closed"]),
        (
            "dropped",
            &["drop", "withdrawn", "obsolete", "superseded", "rejected", "won't", "wontfix"],
        ),
        ("parked", &["park", "defer", "hold", "blocked", "waiting", "paused"]),
        ("proposed", &["proposed", "open", "todo", "new", "backlog"]),
    ];
    FAMILIES
        .iter()
        .filter_map(|(status, words)| {
            words
                .iter()
                .filter_map(|w| lower.find(w))
                .min()
                .map(|at| (at, *status))
        })
        .min()
        .map_or("proposed", |(_, status)| status)
}

/// `priority high|medium|low|P0..P3` named in the story, else P2.
fn map_priority(story: &str) -> &'static str {
    let lower = story.to_lowercase();
    let Some(at) = lower.find("priority") else {
        return "P2";
    };
    let tail: String = lower[at + "priority".len()..].chars().take(14).collect();
    let tail = tail.trim_start_matches([' ', ':', '=']);
    for (word, prio) in [
        ("p0", "P0"),
        ("p1", "P1"),
        ("p2", "P2"),
        ("p3", "P3"),
        ("critical", "P0"),
        ("urgent", "P0"),
        ("high", "P1"),
        ("medium", "P2"),
        ("low", "P3"),
    ] {
        if tail.starts_with(word) {
            return prio;
        }
    }
    "P2"
}

/// The first `YYYY-MM-DD` in `text`.
fn first_date(text: &str) -> Option<String> {
    let bytes = text.as_bytes();
    (0..bytes.len().saturating_sub(9)).find_map(|i| {
        let w = &bytes[i..i + 10];
        let ok = w.iter().enumerate().all(|(k, b)| match k {
            4 | 7 => *b == b'-',
            _ => b.is_ascii_digit(),
        });
        let boundary = i == 0 || !bytes[i - 1].is_ascii_digit();
        (ok && boundary && w.starts_with(b"20")).then(|| text[i..i + 10].to_owned())
    })
}

fn today() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_secs());
    let days = (secs / 86_400) as i64;
    // Civil-from-days (Howard Hinnant).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if month <= 2 { year + 1 } else { year };
    format!("{year:04}-{month:02}-{day:02}")
}

fn short_slug(title: &str) -> String {
    let slug = slugify(title);
    if slug.len() <= 48 {
        return slug;
    }
    let cut = slug[..48].rfind('-').unwrap_or(48);
    slug[..cut].trim_matches('-').to_owned()
}

/// A section body must not start a heading of its own: that would split the item's three sections.
fn flatten_headings(text: &str) -> String {
    text.lines()
        .map(|l| {
            if l.trim_start().starts_with('#') {
                format!("\\{}", l.trim_start())
            } else {
                l.to_owned()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// The item file (name and content) of one row.
fn item_of_row(row: &LegacyRow, id: &str, created_fallback: &str) -> Result<(String, String), MigrateError> {
    let (title, why) = split_story(&row.story);
    let created = first_date(&row.story).unwrap_or_else(|| created_fallback.to_owned());
    let area = {
        let slug = slugify(&row.feature);
        if row.feature.trim().is_empty() || slug == "item" {
            "general".to_owned()
        } else {
            slug
        }
    };
    let mut notes = vec![format!("Migrated from the legacy backlog table. Original status: {}.", row.status)];
    if id != row.id {
        notes.push(format!("Original id: {}.", row.id));
    }
    let why = if why.trim().is_empty() { title.clone() } else { why };
    let content = format_backlog_item(&BacklogItemFields {
        id,
        title: &title,
        status: map_status(&row.status),
        priority: map_priority(&row.story),
        area: &area,
        created: &created,
        why: &flatten_headings(&why),
        done_when: &flatten_headings(&row.cos),
        notes: &notes.join(" "),
    })
    .map_err(|e| MigrateError::RowInvalid(format!("{}: {e}", row.id)))?;
    // The item must pass the contract before it is written.
    parse_backlog_item(Path::new(&format!("{id}.md")), &content)
        .map_err(|e| MigrateError::RowInvalid(format!("{}: {e}", row.id)))?;
    Ok((format!("{id}-{}.md", short_slug(&title)), content))
}

fn existing_item_ids(dir: &Path) -> BTreeSet<String> {
    let mut ids = BTreeSet::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            if let Some(stem) = name.strip_suffix(".md") {
                // The id is the filename up to the slug: `p-<10>`, `p-<8>`, `STR27`, `wf-...`.
                ids.insert(stem.to_owned());
            }
        }
    }
    ids
}

fn has_item_file(existing: &BTreeSet<String>, id: &str) -> bool {
    existing
        .iter()
        .any(|stem| stem == id || stem.strip_prefix(id).is_some_and(|rest| rest.starts_with('-')))
}

// ---- discussions ------------------------------------------------------------------------------------------------

fn slug_of_discussion_dir(name: &str) -> &str {
    if name.starts_with("ds-") && name.len() > 14 && name.as_bytes()[13] == b'-' {
        &name[14..]
    } else {
        name
    }
}

/// Maps a status word to the vocabulary the portfolio accepts (`open`, `paused`, `settled`); anything else is open.
fn status_word(word: &str) -> &'static str {
    let word = word.trim().trim_matches('"').to_lowercase();
    if word.starts_with("settled") {
        "settled"
    } else if word.starts_with("paused") || word.starts_with("parked") {
        "paused"
    } else {
        "open"
    }
}

/// The status of a legacy discussion: a `discussion: <word>` line, with or without a leading blockquote mark, or a
/// frontmatter-style `status: <word>` line, whichever comes first in the opening lines.
fn discussion_status(text: &str) -> &'static str {
    for line in text.lines().take(60) {
        let lower = line.trim().trim_start_matches('>').trim().to_lowercase();
        for prefix in ["discussion:", "status:"] {
            if let Some(rest) = lower.strip_prefix(prefix) {
                return status_word(rest);
            }
        }
    }
    "open"
}

fn discussion_title(text: &str, slug: &str) -> String {
    text.lines()
        .find_map(|l| l.strip_prefix("# "))
        .map(|t| t.trim().to_owned())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| slug.to_owned())
}

/// Backlog ids that exist and are named in the opening lines of the discussion.
fn discussion_sources(text: &str, ids: &BTreeSet<String>) -> Vec<String> {
    let head: String = text.lines().take(40).collect::<Vec<_>>().join("\n");
    let bytes = head.as_bytes();
    ids.iter()
        .filter(|id| {
            head.match_indices(id.as_str()).any(|(at, _)| {
                let before = at == 0 || !is_id_char(bytes[at - 1]);
                let end = at + id.len();
                let after = end >= bytes.len() || !is_id_char(bytes[end]);
                before && after
            })
        })
        .cloned()
        .collect()
}

fn is_id_char(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'-' || b == b'_'
}

fn yaml_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn discussion_frontmatter(id: &str, title: &str, status: &str, source: &[String], created: &str) -> String {
    let fence = concat!("-", "-", "-");
    let source_line = if source.is_empty() {
        "source: []".to_owned()
    } else {
        format!(
            "source:\n{}",
            source.iter().map(|s| format!("  - {s}")).collect::<Vec<_>>().join("\n")
        )
    };
    format!(
        "{fence}\nid: {id}\ntitle: {}\nstatus: {status}\n{source_line}\ncreated: {created}\n{fence}\n\n",
        yaml_quote(title)
    )
}

// ---- reference rewrite ------------------------------------------------------------------------------------------

fn walk(dir: &Path, root: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        let Ok(kind) = entry.file_type() else { continue };
        let rel = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().replace('\\', "/");
        if kind.is_dir() {
            let top_level_skip = dir == root && SKIP_DIRS.contains(&name.as_str());
            if top_level_skip
                || matches!(name.as_str(), ".git" | "node_modules" | "target")
                || SKIP_PREFIXES.iter().any(|p| format!("{rel}/").starts_with(p))
            {
                continue;
            }
            walk(&path, root, out);
        } else if kind.is_file() {
            out.push(path);
        }
    }
}

/// Replaces `from` followed by a non-slug character (so `a` never matches inside `a-b`).
fn replace_bounded(text: &str, from: &str, to: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(at) = rest.find(from) {
        let end = at + from.len();
        let next = rest.as_bytes().get(end).copied();
        out.push_str(&rest[..at]);
        if next.is_some_and(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_') {
            out.push_str(from);
        } else {
            out.push_str(to);
        }
        rest = &rest[end..];
    }
    out.push_str(rest);
    out
}

fn rewrite_text(text: &str, mapping: &BTreeMap<String, String>, new_discussions: &str, new_index: &str) -> String {
    let mut text = text.to_owned();
    for (old, new) in mapping {
        text = replace_bounded(&text, old, new);
    }
    text = text.replace(LEGACY_DISCUSSIONS, new_discussions);
    text.replace(LEGACY_BACKLOG, new_index)
}

// ---- the migration ----------------------------------------------------------------------------------------------

fn write_atomic(path: &Path, content: &str) -> Result<(), MigrateError> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension(format!("tmp-{}", std::process::id()));
    fs::write(&tmp, content)?;
    fs::rename(&tmp, path)?;
    Ok(())
}

fn pointer_text(index: &str) -> String {
    format!(
        "# Product Backlog\n\n{POINTER_MARKER}\n\nThe backlog moved: one file per item under `plans/backlog/`, indexed in [`{index}`](../{index}).\nThis file is a pointer only; add items with `fgos session write`, never here.\n"
    )
}

/// Runs the migration over the project at `request.root`.
pub fn migrate_portfolio(request: &MigrateRequest) -> Result<MigrateReport, MigrateError> {
    let root = &request.root;
    let roots = roots()?;
    let items_dir = root.join(&roots.items);
    let discussions_dir = root.join(&roots.discussions);
    let legacy_backlog = root.join(LEGACY_BACKLOG);
    let legacy_discussions = root.join(LEGACY_DISCUSSIONS);
    let apply = !request.dry_run;
    let created_fallback = today();
    let mut report = MigrateReport {
        dry_run: request.dry_run,
        ..MigrateReport::default()
    };

    // 1. Backlog rows to item files. Every file is built and checked before the first one is written.
    let mut pending: Vec<(String, String)> = Vec::new();
    let legacy_text = fs::read_to_string(&legacy_backlog).ok();
    let pointer_present = legacy_text.as_deref().is_some_and(|t| t.contains(POINTER_MARKER));
    if let Some(text) = legacy_text.as_deref().filter(|_| !pointer_present) {
        let rows = parse_legacy_rows(text)?;
        report.rows_found = rows.len();
        let mut existing = existing_item_ids(&items_dir);
        let mut seen = BTreeSet::new();
        for row in &rows {
            let known = has_item_file(&existing, &row.id);
            if known || !seen.insert(row.id.clone()) {
                report.items_existing += 1;
                continue;
            }
            let id = if is_valid_backlog_id(&row.id) {
                row.id.clone()
            } else {
                random(RandomKind::Backlog)?
            };
            let (name, content) = item_of_row(row, &id, &created_fallback)?;
            existing.insert(name.trim_end_matches(".md").to_owned());
            pending.push((name, content));
        }
    }
    report.items_created = pending.len();
    if apply {
        for (name, content) in &pending {
            write_atomic(&items_dir.join(name), content)?;
        }
    }

    // 2. Discussions: move each directory whole and give DISCUSSION.md its frontmatter.
    let known_ids = known_item_ids(&existing_item_ids(&items_dir), &pending, &items_dir);
    let mut moved: Vec<(String, String, String, String)> = Vec::new();
    if legacy_discussions.is_dir() {
        let existing_slugs: BTreeSet<String> = fs::read_dir(&discussions_dir)
            .into_iter()
            .flatten()
            .flatten()
            .map(|e| slug_of_discussion_dir(&e.file_name().to_string_lossy()).to_owned())
            .collect();
        let mut dirs: Vec<_> = fs::read_dir(&legacy_discussions)?
            .flatten()
            .filter(|e| e.path().is_dir())
            .collect();
        dirs.sort_by_key(|e| e.file_name());
        for entry in dirs {
            let slug = entry.file_name().to_string_lossy().into_owned();
            if existing_slugs.contains(&slug) {
                report.discussions_existing += 1;
                continue;
            }
            let id = random(RandomKind::Discussion)?;
            let new_name = format!("{id}-{slug}");
            let new_rel = format!("{}/{new_name}", roots.discussions);
            let old_rel = format!("{LEGACY_DISCUSSIONS}/{slug}");
            report.mapping.insert(old_rel.clone(), new_rel.clone());
            moved.push((slug, id, new_name, old_rel));
        }
    }
    report.discussions_moved = moved.len();
    if apply {
        for (slug, id, new_name, _old_rel) in &moved {
            let from = legacy_discussions.join(slug);
            let to = discussions_dir.join(new_name);
            fs::create_dir_all(&discussions_dir)?;
            fs::rename(&from, &to)?;
            let file = to.join("DISCUSSION.md");
            if let Ok(text) = fs::read_to_string(&file) {
                if split_frontmatter(&text).is_none() {
                    let front = discussion_frontmatter(
                        id,
                        &discussion_title(&text, slug),
                        discussion_status(&text),
                        &discussion_sources(&text, &known_ids),
                        &first_date(&text).unwrap_or_else(|| created_fallback.clone()),
                    );
                    write_atomic(&file, &format!("{front}{text}"))?;
                }
            }
        }
        // The legacy root goes only when nothing is left in it.
        let _ = fs::remove_dir(&legacy_discussions);
    }

    // 3. Active references.
    let mut files = Vec::new();
    walk(root, root, &mut files);
    files.sort();
    for path in files {
        let rel = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().replace('\\', "/");
        if rel == LEGACY_BACKLOG || rel == roots.index {
            continue;
        }
        if !fs::metadata(&path).is_ok_and(|m| m.len() <= MAX_REWRITE_BYTES) {
            continue;
        }
        let Ok(text) = fs::read_to_string(&path) else { continue };
        if !text.contains(LEGACY_DISCUSSIONS) && !text.contains(LEGACY_BACKLOG) {
            continue;
        }
        let rewritten = rewrite_text(&text, &report.mapping, &roots.discussions, &roots.index);
        if rewritten != text {
            if apply {
                write_atomic(&path, &rewritten)?;
            }
            report.files_rewritten.push(rel);
        }
    }

    // 4. The generated index.
    if apply && (report.items_created > 0 || report.discussions_moved > 0 || items_dir.is_dir()) {
        let checked = check_portfolio(root, &CheckOptions { check_index: false, ..CheckOptions::default() })
            .map_err(|e| MigrateError::Io(e.to_string()))?;
        report.check_errors = checked.errors.clone();
        let index = generate_backlog_index(&checked.items, &checked.discussions, &checked.plans);
        let index_path = root.join(&roots.index);
        if fs::read_to_string(&index_path).ok().as_deref() != Some(index.as_str()) {
            write_atomic(&index_path, &index)?;
            report.index_written = true;
        }
    }

    // 5. The legacy backlog becomes a pointer, last, so an interrupted run is finished by running it again.
    if legacy_text.is_some() && !pointer_present {
        if apply {
            write_atomic(&legacy_backlog, &pointer_text(&roots.index))?;
        }
        report.pointer_written = true;
    }
    Ok(report)
}

/// The backlog ids of the item files: `p-<10>`, `p-<8>`, `STR27`, `wf-...` taken from the file names.
fn known_item_ids(stems: &BTreeSet<String>, pending: &[(String, String)], dir: &Path) -> BTreeSet<String> {
    let mut ids = BTreeSet::new();
    for stem in stems {
        ids.insert(id_of_stem(stem, dir));
    }
    for (name, content) in pending {
        if let Ok(item) = parse_backlog_item(Path::new(name), content) {
            ids.insert(item.id);
        }
    }
    ids
}

/// The id of an item file stem: read from its frontmatter when the file exists, else the stem itself.
fn id_of_stem(stem: &str, dir: &Path) -> String {
    let path = dir.join(format!("{stem}.md"));
    fs::read_to_string(&path)
        .ok()
        .and_then(|text| parse_backlog_item(Path::new(&format!("{stem}.md")), &text).ok())
        .map_or_else(|| stem.to_owned(), |item| item.id)
}

// ---- provider ---------------------------------------------------------------------------------------------------

pub struct MigrateProvider {
    descriptor: ProviderDescriptor,
}

impl MigrateProvider {
    pub fn new() -> Self {
        Self { descriptor: DESCRIPTOR }
    }
}

impl Default for MigrateProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for MigrateProvider {
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
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let request = request
                .input
                .downcast_ref::<MigrateRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not MigrateRequest".into())
                })?
                .clone();
            let served = tokio::task::spawn_blocking(move || migrate_portfolio(&request))
                .await
                .map_err(|error| ProviderError::ProviderFailed(error.to_string()))?;
            let (exit, data) = match served {
                Ok(report) => (i32::from(!report.check_errors.is_empty()), report.to_json()),
                Err(error) => (1, json!({ "error": error.to_string() })),
            };
            Ok(ProviderOutcome::completed(
                DESCRIPTOR.outcome_contract.clone(),
                Box::new(VerbAnswer { exit, text: None, data }),
            ))
        })
    }
}
