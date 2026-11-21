//! `fgos migrate portfolio`: moves a project from the legacy portfolio shape (one `docs/backlog.md` table and
//! `docs/discussions/<slug>/` directories) to the portfolio data model: one file per backlog item under the
//! backlog item root, one id-named directory per discussion under the discussions root, a generated backlog
//! index, and active references rewritten to the new paths.
//!
//! The three roots come from the convention rules (`backlog-item`, `discussion`, `backlog-index`), never from
//! strings of their own. The run is idempotent: a row whose id (or recorded original id) already has a file, a
//! discussion whose slug already has a directory and a reference already rewritten are left alone, so a second run
//! changes nothing. The legacy backlog is replaced by a short pointer last, so an interrupted run is finished by
//! running it again: the slug-to-directory mapping and the frontmatter step are rebuilt each run from every
//! discussion directory that exists, not only those moved by this run.
//!
//! The legacy paths are built with `concat!` so that the reference rewrite, run over a checkout that contains
//! this very file, cannot rewrite the tool that is running it.
//!
//! The provider, the projector and the descriptor are complete here; the host registers the provider in
//! `main.rs` and the route table, which is why the module allows dead code until that registration lands.
#![allow(dead_code)]

use fgos_convention::packaged_rules;
use fgos_git::GitDriver;
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
    check_portfolio, format_backlog_item, generate_backlog_index, is_legacy_backlog_id,
    is_valid_discussion_id, parse_backlog_item, parse_discussion, slugify, split_frontmatter,
    BacklogItemFields, CheckOptions,
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
/// Repo-relative prefixes a reference rewrite never enters: plans are read by their own rule, history and archives
/// stay as written, and the generated render surfaces are rebuilt from their sources (`npm run build:skills`).
const SKIP_PREFIXES: &[&str] = &[
    "plans/",
    "docs/history/",
    "archive/",
    ".agents/",
    "plugins/",
    ".claude/skills/",
    ".claude/agents/",
    ".fgos/",
    ".gitnexus/",
    "node_modules/",
    "target/",
];
/// Files the rewrite leaves alone by name: the changelog records what was true when each entry was written.
const SKIP_FILES: &[&str] = &["CHANGELOG.md"];
/// Directory names the untracked-tree walk never enters.
const WALK_SKIP_DIRS: &[&str] = &[".git", "node_modules", "target", ".fgos", ".gitnexus"];
const MAX_REWRITE_BYTES: u64 = 4 * 1024 * 1024;
/// The legacy table's columns: ID, Story, CoS, Status, Feature.
const TABLE_COLUMNS: usize = 5;

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
    /// Discussions that were given (or, with a front block already there, merged into) portfolio frontmatter.
    pub frontmatter_added: usize,
    pub files_rewritten: Vec<String>,
    pub index_written: bool,
    pub pointer_written: bool,
    /// Legacy path of every migrated discussion and the path it has now.
    pub mapping: BTreeMap<String, String>,
    /// Every status the migration had to guess because the source named none: the original text stays in the item
    /// notes, and a discussion without a marker is read as open.
    pub guessed_statuses: Vec<String>,
    /// What the portfolio check still reports after the migration.
    pub check_errors: Vec<String>,
}

impl MigrateReport {
    pub fn changed(&self) -> bool {
        self.items_created > 0
            || self.discussions_moved > 0
            || self.frontmatter_added > 0
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
            "frontmatterAdded": self.frontmatter_added,
            "filesRewritten": self.files_rewritten,
            "indexWritten": self.index_written,
            "pointerWritten": self.pointer_written,
            "mapping": self.mapping,
            "guessedStatuses": self.guessed_statuses,
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
        index: format!(
            "{index_root}/{}",
            template.as_deref().unwrap_or("backlog.md")
        ),
    })
}

// ---- legacy backlog rows ----------------------------------------------------------------------------------------

/// One row of the legacy backlog, as written: a table row, or a bullet of the done/declined section.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LegacyRow {
    pub id: String,
    pub story: String,
    pub cos: String,
    pub status: String,
    pub feature: String,
    /// The row is a `- [id] ...` bullet of the done/declined section, not a table row.
    pub from_bullet: bool,
    /// The status was not written in the source (a bullet with neither `done` nor `declined`).
    pub status_guessed: bool,
}

/// Splits a table line into cells at every `|` that is neither escaped as `\|` nor inside a backtick code span.
fn split_cells(line: &str) -> Vec<String> {
    let chars: Vec<char> = line.chars().collect();
    let mut cells = Vec::new();
    let mut current = String::new();
    let mut span: Option<usize> = None;
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c == '`' {
            let run = chars[i..].iter().take_while(|&&x| x == '`').count();
            match span {
                None => span = Some(run),
                Some(open) if open == run => span = None,
                Some(_) => {}
            }
            current.push_str(&"`".repeat(run));
            i += run;
        } else if c == '\\' && chars.get(i + 1) == Some(&'|') {
            current.push('|');
            i += 2;
        } else if c == '|' && span.is_none() {
            cells.push(std::mem::take(&mut current));
            i += 1;
        } else {
            current.push(c);
            i += 1;
        }
    }
    cells.push(current);
    cells
}

/// One table line: `None` for the header and the separator, an error for a row whose cell count is not the header's.
fn parse_table_line(
    line: &str,
    width: &mut Option<usize>,
) -> Result<Option<LegacyRow>, MigrateError> {
    let mut cells = split_cells(line);
    // `| a | b |` splits into an empty first and last cell.
    if cells.first().is_some_and(|c| c.trim().is_empty()) {
        cells.remove(0);
    }
    if cells.last().is_some_and(|c| c.trim().is_empty()) {
        cells.pop();
    }
    let first = cells.first().map(|c| c.trim()).unwrap_or_default();
    if first.eq_ignore_ascii_case("id") {
        if cells.len() != TABLE_COLUMNS {
            return Err(MigrateError::RowInvalid(format!(
                "the table header has {} columns, expected {TABLE_COLUMNS} (ID, Story, CoS, Status, Feature)",
                cells.len()
            )));
        }
        *width = Some(cells.len());
        return Ok(None);
    }
    if !first.is_empty() && first.chars().all(|c| matches!(c, '-' | ':' | ' ')) {
        return Ok(None);
    }
    let expected = width.unwrap_or(TABLE_COLUMNS);
    if first.is_empty() || cells.len() != expected {
        return Err(MigrateError::RowInvalid(format!(
            "row '{first}' has {} cells, the table header has {expected}",
            cells.len()
        )));
    }
    Ok(Some(LegacyRow {
        id: first.trim_matches('`').to_owned(),
        story: cells[1].trim().to_owned(),
        cos: cells[2].trim().to_owned(),
        status: cells[3].trim().to_owned(),
        feature: cells[4].trim().to_owned(),
        from_bullet: false,
        status_guessed: false,
    }))
}

fn is_bullet_start(line: &str) -> bool {
    ["- [", "* [", "+ ["].iter().any(|p| line.starts_with(p))
}

/// One `- [id] text — done: note` bullet of the done/declined section; `None` when the id is not a single token.
fn parse_bullet(line: &str) -> Option<LegacyRow> {
    let rest = line[1..].trim_start().strip_prefix('[')?;
    let end = rest.find(']')?;
    let id = rest[..end].trim();
    if id.is_empty() || id.contains(char::is_whitespace) {
        return None;
    }
    let text = rest[end + 1..].trim();
    let marker = ["done", "declined"]
        .iter()
        .filter_map(|word| {
            let pattern = format!(" — {word}");
            text.rfind(&pattern)
                .filter(|at| {
                    !text[at + pattern.len()..]
                        .chars()
                        .next()
                        .is_some_and(char::is_alphanumeric)
                })
                .map(|at| (at, *word, pattern.len()))
        })
        .max_by_key(|(at, _, _)| *at);
    let (story, status, cos, guessed) = match marker {
        Some((at, word, len)) => (
            text[..at].trim(),
            word,
            text[at + len..].trim_start_matches([':', ' ']).trim(),
            false,
        ),
        None => (text, "done", "", true),
    };
    Some(LegacyRow {
        id: id.trim_matches('`').to_owned(),
        story: story.to_owned(),
        cos: cos.to_owned(),
        status: status.to_owned(),
        feature: String::new(),
        from_bullet: true,
        status_guessed: guessed,
    })
}

/// Parses the legacy backlog: the table rows and the bullets of the done/declined section. Every line that looks
/// like an item is parsed or the whole parse is refused, so nothing is dropped before the legacy file becomes a
/// pointer. The table's column count comes from its header; a row that does not match is refused by name rather than
/// guessed, and so is a duplicate id.
pub fn parse_legacy_rows(text: &str) -> Result<Vec<LegacyRow>, MigrateError> {
    let mut rows: Vec<LegacyRow> = Vec::new();
    let mut seen = BTreeSet::new();
    let mut unparsed: Vec<String> = Vec::new();
    let mut width: Option<usize> = None;
    let mut after_bullet = false;
    for raw in text.lines() {
        let line = raw.trim();
        let indented = raw.starts_with([' ', '\t']);
        let row = if line.starts_with('|') {
            after_bullet = false;
            parse_table_line(line, &mut width)?
        } else if is_bullet_start(line) {
            after_bullet = true;
            let row = parse_bullet(line);
            if row.is_none() {
                unparsed.push(line.to_owned());
            }
            row
        } else {
            // A line indented under a bullet is part of that item: refuse it rather than drop it.
            if after_bullet && indented && !line.is_empty() {
                unparsed.push(line.to_owned());
            } else {
                after_bullet = false;
            }
            None
        };
        if let Some(row) = row {
            if !seen.insert(row.id.clone()) {
                return Err(MigrateError::RowInvalid(format!(
                    "duplicate-id: '{}' appears twice in the legacy backlog",
                    row.id
                )));
            }
            rows.push(row);
        }
    }
    if !unparsed.is_empty() {
        let shown: Vec<String> = unparsed
            .iter()
            .take(3)
            .map(|l| l.chars().take(80).collect())
            .collect();
        return Err(MigrateError::RowInvalid(format!(
            "unparsed-line: {} line(s) look like backlog items but were not read, first: {}",
            unparsed.len(),
            shown.join(" / ")
        )));
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
    (
        if title.is_empty() {
            "item".to_owned()
        } else {
            title
        },
        story.to_owned(),
    )
}

/// Maps the free-text status cell to the status vocabulary by the earliest keyword; `None` when no keyword is there.
/// `in-flight` is never produced: the check requires a citing plan or discussion for it, which a migrated row
/// cannot have yet. The original text stays in the item notes.
fn map_status_opt(cell: &str) -> Option<&'static str> {
    let lower = cell.to_lowercase();
    const FAMILIES: &[(&str, &[&str])] = &[
        ("done", &["done", "shipped", "landed", "complete", "closed"]),
        (
            "dropped",
            &[
                "drop",
                "declined",
                "withdrawn",
                "obsolete",
                "superseded",
                "rejected",
                "won't",
                "wontfix",
            ],
        ),
        (
            "parked",
            &["park", "defer", "hold", "blocked", "waiting", "paused"],
        ),
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
        .map(|(_, status)| status)
}

fn map_status(cell: &str) -> &'static str {
    map_status_opt(cell).unwrap_or("proposed")
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

/// The marker the item notes carry when the row's id had to be re-minted; a rerun finds the item by it.
const ORIGINAL_ID_MARKER: &str = "Original id: ";

/// The item file (name and content) of one row.
fn item_of_row(
    row: &LegacyRow,
    id: &str,
    created_fallback: &str,
) -> Result<(String, String), MigrateError> {
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
    let source = if row.from_bullet {
        "the done/declined section of the legacy backlog"
    } else {
        "the legacy backlog table"
    };
    let mut notes = vec![format!(
        "Migrated from {source}. Original status: {}.",
        row.status
    )];
    if id != row.id {
        notes.push(format!("{ORIGINAL_ID_MARKER}{}.", row.id));
    }
    let why = if why.trim().is_empty() {
        title.clone()
    } else {
        why
    };
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

/// The original ids recorded in the notes of items whose row id was re-minted.
fn original_ids(dir: &Path) -> BTreeSet<String> {
    let mut ids = BTreeSet::new();
    let Ok(entries) = fs::read_dir(dir) else {
        return ids;
    };
    for entry in entries.flatten() {
        let Ok(text) = fs::read_to_string(entry.path()) else {
            continue;
        };
        if let Some(at) = text.find(ORIGINAL_ID_MARKER) {
            let token: String = text[at + ORIGINAL_ID_MARKER.len()..]
                .chars()
                .take_while(|c| !c.is_whitespace())
                .collect();
            ids.insert(token.trim_end_matches('.').to_owned());
        }
    }
    ids
}

fn has_item_file(existing: &BTreeSet<String>, id: &str) -> bool {
    existing.iter().any(|stem| {
        stem == id
            || stem
                .strip_prefix(id)
                .is_some_and(|rest| rest.starts_with('-'))
    })
}

// ---- discussions ------------------------------------------------------------------------------------------------

/// The slug of a migrated discussion directory `ds-<10 base32>-<slug>`; `None` for any other name.
fn migrated_slug(name: &str) -> Option<&str> {
    let id = name.get(..13)?;
    (is_valid_discussion_id(id) && name.as_bytes().get(13) == Some(&b'-') && name.len() > 14)
        .then(|| &name[14..])
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
/// frontmatter-style `status: <word>` line, whichever comes first in the opening lines; `None` when it names none.
fn discussion_status(text: &str) -> Option<&'static str> {
    for line in text.lines().take(60) {
        let lower = line.trim().trim_start_matches('>').trim().to_lowercase();
        for prefix in ["discussion:", "status:"] {
            if let Some(rest) = lower.strip_prefix(prefix) {
                return Some(status_word(rest));
            }
        }
    }
    None
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

const FENCE: &str = concat!("-", "-", "-");

fn source_lines(source: &[String]) -> String {
    if source.is_empty() {
        "source: []".to_owned()
    } else {
        format!(
            "source:\n{}",
            source
                .iter()
                .map(|s| format!("  - {s}"))
                .collect::<Vec<_>>()
                .join("\n")
        )
    }
}

/// A top-level `key:` line of a front block: the key, or `None` for a continuation, comment or blank line.
fn front_key(line: &str) -> Option<&str> {
    if line.starts_with([' ', '\t', '#', '-']) {
        return None;
    }
    let (key, _) = line.split_once(':')?;
    (!key.is_empty()
        && key
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-'))
    .then_some(key)
}

/// The text of a discussion with portfolio frontmatter: the whole block when the file has none, else the existing
/// block with `id`, `title`, `status`, `source` and `created` merged in. An existing title and status are reused
/// and every other key is kept. `None` when the merge still would not pass the discussion contract.
fn with_portfolio_frontmatter(
    text: &str,
    dir_name: &str,
    id: &str,
    slug: &str,
    known_ids: &BTreeSet<String>,
    created_fallback: &str,
    guessed: &mut Vec<String>,
) -> Option<String> {
    let rel = Path::new(dir_name).join("DISCUSSION.md");
    let title = discussion_title(text, slug);
    let marker = discussion_status(text);
    let source = discussion_sources(text, known_ids);
    let Some((front, body)) = split_frontmatter(text) else {
        let status = marker.unwrap_or("open");
        if marker.is_none() {
            guessed.push(format!(
                "discussion {dir_name}: no status marker, read as open"
            ));
        }
        let created = first_date(text).unwrap_or_else(|| created_fallback.to_owned());
        let block = format!(
            "{FENCE}\nid: {id}\ntitle: {}\nstatus: {status}\n{}\ncreated: {created}\n{FENCE}\n\n",
            yaml_quote(&title),
            source_lines(&source)
        );
        return Some(format!("{block}{text}"));
    };

    let mut entries: Vec<(String, Vec<&str>)> = Vec::new();
    for line in front.lines() {
        if let Some(key) = front_key(line) {
            entries.push((key.to_owned(), vec![line]));
        } else if let Some(last) = entries.last_mut() {
            last.1.push(line);
        } else {
            entries.push((String::new(), vec![line]));
        }
    }
    let existing = |key: &str| entries.iter().find(|(k, _)| k == key).map(|(_, l)| l);
    let existing_status = existing("status")
        .and_then(|lines| lines[0].split_once(':'))
        .map(|(_, value)| status_word(value));
    let status = existing_status.or(marker).unwrap_or("open");
    let created = first_date(front)
        .or_else(|| first_date(text))
        .unwrap_or_else(|| created_fallback.to_owned());
    let others: Vec<&str> = entries
        .iter()
        .filter(|(k, _)| !matches!(k.as_str(), "id" | "title" | "status" | "source" | "created"))
        .flat_map(|(_, lines)| lines.iter().copied())
        .collect();

    let build = |reuse: bool| {
        let pick = |key: &str, generated: String| -> String {
            match existing(key).filter(|_| reuse) {
                Some(lines) => lines.join("\n"),
                None => generated,
            }
        };
        let mut block = vec![
            format!("id: {id}"),
            pick("title", format!("title: {}", yaml_quote(&title))),
            format!("status: {status}"),
            pick("source", source_lines(&source)),
            pick("created", format!("created: {created}")),
        ];
        block.extend(others.iter().map(|l| (*l).to_owned()));
        format!("{FENCE}\n{}\n{FENCE}\n{body}", block.join("\n"))
    };
    let accepted = [true, false]
        .into_iter()
        .map(build)
        .find(|candidate| parse_discussion(&rel, candidate).is_ok())?;
    if existing_status.is_none() && marker.is_none() {
        guessed.push(format!(
            "discussion {dir_name}: no status marker, read as open"
        ));
    }
    Some(accepted)
}

// ---- reference rewrite ------------------------------------------------------------------------------------------

/// The paths the index tracks when the project is a git checkout (it holds a `.git`); `None` for a project that
/// is not one. A checkout whose tracked files cannot be listed is an error, never a walk that would reach
/// untracked files.
fn checkout_tracked_files(root: &Path) -> Result<Option<Vec<String>>, MigrateError> {
    if !root.join(".git").exists() {
        return Ok(None);
    }
    tracked_files(root).map(Some)
}

/// The repo-relative paths of the files a rewrite may read: the tracked files when given, else a walk of the
/// tree that never enters a nested checkout (a directory with its own `.git`).
fn candidate_files(root: &Path, tracked: Option<Vec<String>>) -> Vec<String> {
    if let Some(paths) = tracked {
        return paths;
    }
    let mut out = Vec::new();
    walk(root, root, &mut out);
    out.sort();
    out
}

/// Every path the index tracks, through the git driver. `root` holds a `.git`, so it is the top level and
/// driver paths are already relative to it.
fn tracked_files(root: &Path) -> Result<Vec<String>, MigrateError> {
    let git_error = |e: &dyn std::fmt::Debug| MigrateError::Io(format!("git-driver: {e:?}"));
    let (driver, repo) = GitDriver::open_at(root)
        .map_err(|e| git_error(&e))?
        .ok_or_else(|| MigrateError::Io("git-driver: checkout not opened".into()))?;
    let mut out = Vec::new();
    let mut cursor = None;
    loop {
        let page = driver
            .tracked_paths(&repo, cursor, 4096)
            .map_err(|e| git_error(&e))?;
        out.extend(
            page.entries
                .iter()
                .map(|name| String::from_utf8_lossy(name).into_owned()),
        );
        if page.complete {
            return Ok(out);
        }
        cursor = page.next_cursor;
    }
}

fn walk(dir: &Path, root: &Path, out: &mut Vec<String>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        let Ok(kind) = entry.file_type() else {
            continue;
        };
        if kind.is_dir() {
            if WALK_SKIP_DIRS.contains(&name.as_str()) || path.join(".git").exists() {
                continue;
            }
            walk(&path, root, out);
        } else if kind.is_file() {
            if let Ok(rel) = path.strip_prefix(root) {
                out.push(rel.to_string_lossy().replace('\\', "/"));
            }
        }
    }
}

/// Whether the rewrite may touch the file: prose only, outside the generated renders, the changelog, plans, history
/// and archives, and outside the discussion roots (a moved discussion keeps the text it was written with).
fn rewritable(rel: &str, roots: &Roots) -> bool {
    rel.ends_with(".md")
        && rel != LEGACY_BACKLOG
        && rel != roots.index
        && !SKIP_FILES.contains(&rel)
        && !SKIP_PREFIXES.iter().any(|p| rel.starts_with(p))
        && !rel.starts_with(&format!("{LEGACY_DISCUSSIONS}/"))
        && !rel.starts_with(&format!("{}/", roots.discussions))
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

/// The relative path from the directory `from` (components) to the repo-relative path `to` (components).
fn relative_path(from: &[&str], to: &[&str]) -> String {
    let common = from.iter().zip(to).take_while(|(a, b)| a == b).count();
    let mut parts: Vec<&str> = vec![".."; from.len() - common];
    parts.extend(&to[common..]);
    parts.join("/")
}

fn is_path_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | '/')
}

/// Rewrites relative links that resolve to the legacy discussions root (`../../discussions/<slug>` from a file
/// under `docs/`) to the relative path of the migrated directory.
fn rewrite_relative_links(
    text: &str,
    file_rel: &str,
    new_dirs: &BTreeMap<String, String>,
) -> String {
    let parts: Vec<&str> = file_rel.split('/').collect();
    let dir = &parts[..parts.len() - 1];
    let legacy: Vec<&str> = LEGACY_DISCUSSIONS.split('/').collect();
    let legacy_parent = &legacy[..legacy.len() - 1];
    if !dir.starts_with(legacy_parent) {
        return text.to_owned();
    }
    let ups = dir.len() - legacy_parent.len();
    let marker = "discussions/";
    let mut out = String::with_capacity(text.len());
    let mut cursor = 0;
    let mut search = 0;
    while let Some(found) = text[search..].find(marker) {
        let at = search + found;
        search = at + marker.len();
        let Some(start) = at.checked_sub(ups * 3).filter(|s| *s >= cursor) else {
            continue;
        };
        if text[start..at] != "../".repeat(ups) {
            continue;
        }
        if text[..start].chars().next_back().is_some_and(is_path_char) {
            continue;
        }
        let tail = &text[search..];
        let hit = new_dirs
            .iter()
            .filter(|(slug, _)| {
                tail.starts_with(slug.as_str())
                    && !tail
                        .as_bytes()
                        .get(slug.len())
                        .is_some_and(|b| is_id_char(*b))
            })
            .max_by_key(|(slug, _)| slug.len());
        let Some((slug, new_dir)) = hit else {
            continue;
        };
        let target: Vec<&str> = new_dir.split('/').collect();
        out.push_str(&text[cursor..start]);
        out.push_str(&relative_path(dir, &target));
        cursor = search + slug.len();
        search = cursor;
    }
    out.push_str(&text[cursor..]);
    out
}

fn rewrite_text(
    text: &str,
    file_rel: &str,
    mapping: &BTreeMap<String, String>,
    new_dirs: &BTreeMap<String, String>,
    new_discussions: &str,
    new_index: &str,
) -> String {
    let mut text = text.to_owned();
    for (old, new) in mapping {
        text = replace_bounded(&text, old, new);
    }
    text = text.replace(LEGACY_DISCUSSIONS, new_discussions);
    text = text.replace(LEGACY_BACKLOG, new_index);
    rewrite_relative_links(&text, file_rel, new_dirs)
}

// ---- the migration ----------------------------------------------------------------------------------------------

/// Writes through a temporary file and a rename, keeping the permissions (the executable bit) of a file it replaces.
fn write_atomic(path: &Path, content: &str) -> Result<(), MigrateError> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension(format!("tmp-{}", std::process::id()));
    fs::write(&tmp, content)?;
    if let Ok(meta) = fs::metadata(path) {
        fs::set_permissions(&tmp, meta.permissions())?;
    }
    fs::rename(&tmp, path)?;
    Ok(())
}

fn pointer_text(index: &str) -> String {
    format!(
        "# Product Backlog\n\n{POINTER_MARKER}\n\nThe backlog moved: one file per item under `plans/backlog/`, indexed in [`{index}`](../{index}).\nThis file is a pointer only; add items with `fgos session write`, never here.\n"
    )
}

/// One discussion directory this run moves.
struct Moved {
    slug: String,
    new_name: String,
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
    // Read before any write, so a checkout the driver cannot list fails the run untouched.
    let tracked = checkout_tracked_files(root)?;
    let created_fallback = today();
    let mut report = MigrateReport {
        dry_run: request.dry_run,
        ..MigrateReport::default()
    };

    // 1. Backlog rows to item files. Every file is built and checked before the first one is written.
    let mut pending: Vec<(String, String)> = Vec::new();
    let legacy_text = fs::read_to_string(&legacy_backlog).ok();
    let pointer_present = legacy_text
        .as_deref()
        .is_some_and(|t| t.contains(POINTER_MARKER));
    if let Some(text) = legacy_text.as_deref().filter(|_| !pointer_present) {
        let rows = parse_legacy_rows(text)?;
        report.rows_found = rows.len();
        let mut existing = existing_item_ids(&items_dir);
        let originals = original_ids(&items_dir);
        for row in &rows {
            if has_item_file(&existing, &row.id) || originals.contains(&row.id) {
                report.items_existing += 1;
                continue;
            }
            let id = if is_legacy_backlog_id(&row.id) {
                row.id.clone()
            } else {
                random(RandomKind::Backlog)?
            };
            if row.status_guessed || map_status_opt(&row.status).is_none() {
                report.guessed_statuses.push(format!(
                    "backlog {}: status '{}' read as {}",
                    row.id,
                    row.status,
                    map_status(&row.status)
                ));
            }
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

    // 2. Discussions: move each legacy directory whole, then give every migrated DISCUSSION.md without portfolio
    // frontmatter its block. The slug-to-directory map holds every existing migrated directory, so a rerun after an
    // interruption rewrites to directories that exist.
    let mut by_slug: BTreeMap<String, String> = BTreeMap::new();
    if let Ok(entries) = fs::read_dir(&discussions_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            if entry.path().is_dir() {
                if let Some(slug) = migrated_slug(&name) {
                    by_slug.insert(slug.to_owned(), name);
                }
            }
        }
    }
    let mut moved: Vec<Moved> = Vec::new();
    if legacy_discussions.is_dir() {
        let mut dirs: Vec<_> = fs::read_dir(&legacy_discussions)?
            .flatten()
            .filter(|e| e.path().is_dir())
            .collect();
        dirs.sort_by_key(|e| e.file_name());
        for entry in dirs {
            let slug = entry.file_name().to_string_lossy().into_owned();
            if by_slug.contains_key(&slug) {
                report.discussions_existing += 1;
                continue;
            }
            let new_name = format!("{}-{slug}", random(RandomKind::Discussion)?);
            by_slug.insert(slug.clone(), new_name.clone());
            moved.push(Moved { slug, new_name });
        }
    }
    report.discussions_moved = moved.len();
    let moved_slugs: BTreeSet<&str> = moved.iter().map(|m| m.slug.as_str()).collect();
    let mut new_dirs: BTreeMap<String, String> = BTreeMap::new();
    for (slug, name) in &by_slug {
        let new_rel = format!("{}/{name}", roots.discussions);
        report
            .mapping
            .insert(format!("{LEGACY_DISCUSSIONS}/{slug}"), new_rel.clone());
        new_dirs.insert(slug.clone(), new_rel);
    }
    if apply {
        fs::create_dir_all(&discussions_dir).ok();
        for m in &moved {
            fs::rename(
                legacy_discussions.join(&m.slug),
                discussions_dir.join(&m.new_name),
            )?;
        }
        // The legacy root goes only when nothing is left in it.
        let _ = fs::remove_dir(&legacy_discussions);
    }

    let known_ids = known_item_ids(&existing_item_ids(&items_dir), &pending, &items_dir);
    for (slug, name) in &by_slug {
        let target = discussions_dir.join(name).join("DISCUSSION.md");
        // A dry run has moved nothing yet, so a directory this run would move is read where it still is.
        let read_from = if !apply && moved_slugs.contains(slug.as_str()) {
            legacy_discussions.join(slug).join("DISCUSSION.md")
        } else {
            target.clone()
        };
        let Ok(text) = fs::read_to_string(&read_from) else {
            continue;
        };
        let rel = Path::new(&roots.discussions)
            .join(name)
            .join("DISCUSSION.md");
        if parse_discussion(&rel, &text).is_ok() {
            continue;
        }
        let merged = with_portfolio_frontmatter(
            &text,
            name,
            &name[..13],
            slug,
            &known_ids,
            &created_fallback,
            &mut report.guessed_statuses,
        );
        match merged {
            Some(new_text) => {
                report.frontmatter_added += 1;
                if apply {
                    write_atomic(&target, &new_text)?;
                }
            }
            None => report.check_errors.push(format!(
                "frontmatter-unfixable: {}/{name}/DISCUSSION.md",
                roots.discussions
            )),
        }
    }

    // 3. Active references: tracked prose only.
    for rel in candidate_files(root, tracked) {
        if !rewritable(&rel, &roots) {
            continue;
        }
        let path = root.join(&rel);
        if !fs::symlink_metadata(&path)
            .is_ok_and(|m| m.file_type().is_file() && m.len() <= MAX_REWRITE_BYTES)
        {
            continue;
        }
        let Ok(text) = fs::read_to_string(&path) else {
            continue;
        };
        let rewritten = rewrite_text(
            &text,
            &rel,
            &report.mapping,
            &new_dirs,
            &roots.discussions,
            &roots.index,
        );
        if rewritten != text {
            if apply {
                write_atomic(&path, &rewritten)?;
            }
            report.files_rewritten.push(rel);
        }
    }

    // 4. The generated index. A dry run cannot read what it has not written, so it reports the write whenever the
    // run creates or changes something the index lists, or the index is not there yet.
    let index_path = root.join(&roots.index);
    if apply && (report.items_created > 0 || report.discussions_moved > 0 || items_dir.is_dir()) {
        let checked = check_portfolio(
            root,
            &CheckOptions {
                check_index: false,
                ..CheckOptions::default()
            },
        )
        .map_err(|e| MigrateError::Io(e.to_string()))?;
        report.check_errors.extend(checked.errors.iter().cloned());
        let index = generate_backlog_index(&checked.items, &checked.discussions, &checked.plans);
        if fs::read_to_string(&index_path).ok().as_deref() != Some(index.as_str()) {
            write_atomic(&index_path, &index)?;
            report.index_written = true;
        }
    } else if !apply {
        report.index_written = report.items_created > 0
            || report.discussions_moved > 0
            || report.frontmatter_added > 0
            || (items_dir.is_dir() && !index_path.exists());
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
fn known_item_ids(
    stems: &BTreeSet<String>,
    pending: &[(String, String)],
    dir: &Path,
) -> BTreeSet<String> {
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
        Self {
            descriptor: DESCRIPTOR,
        }
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
                Box::new(VerbAnswer {
                    exit,
                    text: None,
                    data,
                }),
            ))
        })
    }
}
