//! Renders the human ownership views from the model (`docs/platform/component-authority/spec.md` §5).
//!
//! Same generate-and-`--check` contract as `fgos decision-index`: computing a view never writes, a repeat write
//! over an unchanged model is byte-identical, and the check names every view that differs.
//!
//! Every view is one block between `<!-- generated:component-authority:<view> -->` and
//! `<!-- /generated:component-authority:<view> -->`. Text outside the markers belongs to the document's author
//! and is never touched. A view is drift when its block is missing (`required`) or when the block on disk
//! differs from the render.

use crate::model::{Component, DecisionKind, DoorPath, Model, ModelError};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fs;
use std::path::{Path, PathBuf};

const NOTE: &str = "<!-- rendered from packages/component-authority/model/ by `fgos authority render`; edit the model, never this block -->";

#[derive(Debug, thiserror::Error)]
pub enum RenderError {
    #[error(transparent)]
    Model(#[from] ModelError),
    #[error("{path}: {reason}")]
    Io { path: PathBuf, reason: String },
}

fn io_error(path: &Path, error: &std::io::Error) -> RenderError {
    RenderError::Io {
        path: path.to_path_buf(),
        reason: error.to_string(),
    }
}

pub fn start_marker(view: &str) -> String {
    format!("<!-- generated:component-authority:{view} -->")
}

pub fn end_marker(view: &str) -> String {
    format!("<!-- /generated:component-authority:{view} -->")
}

/// One view's rendered block, markers included.
pub fn render_block(view: &str, body: &str) -> String {
    format!("{}\n{body}\n{}", start_marker(view), end_marker(view))
}

fn cell(text: &str) -> String {
    text.replace('|', "\\|")
        .replace("\r\n", " ")
        .replace('\n', " ")
        .trim()
        .to_owned()
}

fn code(text: &str) -> String {
    format!("`{}`", cell(text))
}

fn non_empty(text: &str) -> Option<&str> {
    (!text.is_empty()).then_some(text)
}

/// `—` when there is nothing to show, else the backticked text.
fn code_or_dash(text: &str) -> String {
    non_empty(text).map_or_else(|| "—".to_owned(), code)
}

fn join_or_dash(items: Vec<String>, separator: &str) -> String {
    if items.is_empty() {
        "—".to_owned()
    } else {
        items.join(separator)
    }
}

fn area_under_docs_platform(path: &str) -> Option<&str> {
    let rest = path.strip_prefix("docs/platform/")?;
    let (area, _) = rest.split_once('/')?;
    non_empty(area)
}

/// The area directory a component belongs to, from its spec path, or `None` when its spec is elsewhere.
fn area_of(component: &Component) -> Option<&str> {
    area_under_docs_platform(&component.spec)
}

/// Number of door files whose declared `allowed` paths fall under one of the component's paths or sources.
fn door_count(component: &Component, model: &Model) -> usize {
    let prefixes: Vec<&String> = component.paths.iter().chain(&component.source).collect();
    model
        .doors
        .iter()
        .filter(|door| {
            door.allowed.iter().any(|entry| {
                let allowed = match entry {
                    DoorPath::Plain(path) => path,
                    DoorPath::Reasoned(reasoned) => &reasoned.path,
                };
                prefixes
                    .iter()
                    .any(|prefix| allowed.starts_with(prefix.as_str()))
            })
        })
        .count()
}

fn sorted_components(model: &Model) -> Vec<&Component> {
    let mut components: Vec<&Component> = model.components.iter().collect();
    components.sort_by(|a, b| a.id.cmp(&b.id));
    components
}

/// Components whose owner doc sits in `area`, or every component when `area` is `None`.
fn components_of_area<'a>(model: &'a Model, area: Option<&str>) -> Vec<&'a Component> {
    let all = sorted_components(model);
    match area {
        Some(area) => all
            .into_iter()
            .filter(|component| area_of(component) == Some(area))
            .collect(),
        None => all,
    }
}

fn parent_cell(component: &Component) -> String {
    component
        .parent
        .as_deref()
        .map_or_else(|| "—".to_owned(), code_or_dash)
}

fn joined_cells(items: &[String]) -> String {
    items
        .iter()
        .map(|item| cell(item))
        .collect::<Vec<_>>()
        .join("; ")
}

fn component_table_body(model: &Model) -> String {
    let mut lines = vec![
        format!("Ownership rows, one per component and subcomponent, sorted by id. {NOTE}"),
        String::new(),
        "| Component | Parent | Layer | Tier | Status | Owns | Must not own | Doors | Owner doc | Source links |".to_owned(),
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |".to_owned(),
    ];
    for component in sorted_components(model) {
        let source: Vec<String> = component.source.iter().map(|item| code(item)).collect();
        lines.push(format!(
            "| {} | {} | {} | {} | {} | {} | {} | {} | {} | {} |",
            code(&component.id),
            parent_cell(component),
            cell(&component.layer),
            component.tier,
            cell(&component.status),
            joined_cells(&component.owns),
            joined_cells(&component.must_not_own),
            door_count(component, model),
            code_or_dash(&component.spec),
            join_or_dash(source, ", "),
        ));
    }
    lines.join("\n")
}

fn owner_table_body(model: &Model) -> String {
    let mut lines = vec![
        format!("Component owners, one row per component and subcomponent, sorted by id. {NOTE}"),
        String::new(),
        "| Component | Parent | Role | Owner doc | Paths |".to_owned(),
        "| --- | --- | --- | --- | --- |".to_owned(),
    ];
    for component in sorted_components(model) {
        let paths: Vec<String> = component.paths.iter().map(|item| code(item)).collect();
        lines.push(format!(
            "| {} | {} | {} | {} | {} |",
            code(&component.id),
            parent_cell(component),
            cell(&component.meaning),
            code_or_dash(&component.spec),
            join_or_dash(paths, ", "),
        ));
    }
    lines.join("\n")
}

fn first_non_empty<'a>(candidates: &[Option<&'a str>]) -> Option<&'a str> {
    candidates
        .iter()
        .copied()
        .flatten()
        .find(|text| !text.is_empty())
}

fn unique_in_order(items: impl Iterator<Item = String>) -> Vec<String> {
    let mut seen = BTreeSet::new();
    items.filter(|item| seen.insert(item.clone())).collect()
}

fn is_printable_ascii(text: &str) -> bool {
    !text.is_empty() && text.chars().all(|ch| ('\x20'..='\x7e').contains(&ch))
}

/// The portal cell of one decision kind: its `readFirst` when set, else the first derived candidate that exists
/// in the repository, else the owner's spec, the narrative, or a dash.
fn holder_portal(
    kind: &DecisionKind,
    owner: Option<&Component>,
    narrative_area: Option<&str>,
    repo_root: &Path,
) -> String {
    if let Some(read_first) = kind.read_first.as_deref().map(str::trim) {
        if !read_first.is_empty() {
            return read_first.to_owned();
        }
    }
    let area = match owner {
        Some(owner) => area_of(owner),
        None => narrative_area,
    };
    let mut candidates: Vec<String> = Vec::new();
    if let Some(area) = area {
        candidates.push(format!("docs/platform/{area}/README.md"));
    }
    if let Some(spec) = owner.and_then(|owner| non_empty(&owner.spec)) {
        candidates.push(spec.to_owned());
    }
    if let Some(narrative) = non_empty(&kind.narrative) {
        candidates.push(narrative.to_owned());
    }
    candidates
        .into_iter()
        .find(|rel| {
            let file_part = rel.split('#').next().unwrap_or("");
            repo_root.join(file_part).exists()
        })
        .or_else(|| {
            first_non_empty(&[
                owner.map(|owner| owner.spec.as_str()),
                Some(kind.narrative.as_str()),
            ])
            .map(str::to_owned)
        })
        .unwrap_or_else(|| "—".to_owned())
}

/// The facts cell of one decision kind: its `facts` when set, else the owner's spec and its children's specs.
fn holder_facts(kind: &DecisionKind, owner: Option<&Component>, model: &Model) -> Vec<String> {
    let explicit = kind
        .facts
        .as_ref()
        .filter(|facts| !facts.is_null() && facts.as_str() != Some(""));
    if let Some(facts) = explicit {
        let list: Vec<&serde_json::Value> = match facts {
            serde_json::Value::Array(items) => items.iter().collect(),
            single => vec![single],
        };
        return unique_in_order(
            list.into_iter()
                .map(|item| match item {
                    serde_json::Value::String(text) => text.trim().to_owned(),
                    other => other.to_string().trim().to_owned(),
                })
                .filter(|text| !text.is_empty()),
        );
    }
    let owner_spec = owner.map(|owner| owner.spec.clone());
    let children = model
        .components
        .iter()
        .filter(|component| component.parent.as_deref() == Some(kind.owner.as_str()))
        .map(|component| component.spec.clone());
    unique_in_order(
        owner_spec
            .into_iter()
            .chain(children)
            .filter(|spec| !spec.is_empty()),
    )
}

/// The governance "Decision scope to holder table": the same four columns and the same scope-to-holder shape the
/// hand-written table carried, so every legacy scope alias survives and `fgos decision-index` keeps resolving
/// narratives from them. Optional `readFirst` / `facts` on a decision kind override the derived cells.
fn governance_holder_body(model: &Model, repo_root: &Path) -> String {
    let mut by_id: HashMap<&str, &Component> = HashMap::new();
    for component in &model.components {
        by_id.insert(component.id.as_str(), component);
    }
    let mut lines = vec![
        NOTE.to_owned(),
        String::new(),
        "| Scope (legacy alias retained) | Read first | Facts and RULs | Narrative home |"
            .to_owned(),
        "| --- | --- | --- | --- |".to_owned(),
    ];
    for kind in &model.decision_kinds {
        let owner = by_id.get(kind.owner.as_str()).copied();
        let narrative_area = area_under_docs_platform(&kind.narrative);
        let target = first_non_empty(&[
            narrative_area,
            Some(kind.owner.as_str()),
            Some(kind.id.as_str()),
        ])
        .unwrap_or("");
        // Prefer ASCII aliases as the left side (matches the hand-written table's English scopes).
        let ascii_aliases: Vec<&String> = kind
            .aliases
            .iter()
            .filter(|alias| is_printable_ascii(alias) && alias.as_str() != target)
            .collect();
        let scope_parts: Vec<String> = if ascii_aliases.is_empty() {
            vec![format!("{} → {target}", kind.id)]
        } else {
            ascii_aliases
                .iter()
                .map(|alias| format!("{alias} → {target}"))
                .collect()
        };
        let portal = holder_portal(kind, owner, narrative_area, repo_root);
        let facts: Vec<String> = holder_facts(kind, owner, model)
            .iter()
            .map(|fact| code(fact))
            .collect();
        lines.push(format!(
            "| {} | {} | {} | {} |",
            cell(&scope_parts.join("<br>")),
            if portal == "—" {
                portal
            } else {
                code(&portal)
            },
            join_or_dash(facts, "; "),
            code(&kind.narrative),
        ));
    }
    lines.join("\n")
}

/// One row per area. Specs not under `docs/platform/<area>/` land in `(cross-area)` instead of being dropped.
fn area_map_body(model: &Model) -> String {
    let mut lines = vec![
        format!("Area rows from the model: one row per area listing its top-level components. Specs outside docs/platform/<area>/ are listed under (cross-area). {NOTE}"),
        String::new(),
        "| Area | Components | What it owns | Owner doc |".to_owned(),
        "| --- | --- | --- | --- |".to_owned(),
    ];
    let mut by_area: BTreeMap<String, Vec<&Component>> = BTreeMap::new();
    for component in sorted_components(model) {
        if component
            .parent
            .as_deref()
            .is_some_and(|parent| !parent.is_empty())
        {
            continue;
        }
        let area = area_of(component).unwrap_or("(cross-area)").to_owned();
        by_area.entry(area).or_default().push(component);
    }
    for (area, components) in &by_area {
        let ids = components
            .iter()
            .map(|component| code(&component.id))
            .collect::<Vec<_>>()
            .join(", ");
        let meanings = join_or_dash(
            components
                .iter()
                .map(|component| cell(&component.meaning))
                .filter(|meaning| !meaning.is_empty())
                .collect(),
            "; ",
        );
        let specs = join_or_dash(
            unique_in_order(
                components
                    .iter()
                    .map(|component| component.spec.clone())
                    .filter(|spec| !spec.is_empty()),
            )
            .iter()
            .map(|spec| code(spec))
            .collect(),
            ", ",
        );
        lines.push(format!("| {} | {ids} | {meanings} | {specs} |", code(area)));
    }
    lines.join("\n")
}

fn shared_entities_body(model: &Model, area: Option<&str>) -> String {
    let scope = match area {
        Some(area) => format!("owned by {}", code(area)),
        None => "across every area".to_owned(),
    };
    let mut lines = vec![
        format!("Ownership rows {scope}: each thing a component declares it owns, with that component. {NOTE}"),
        String::new(),
        "| Entity | Owner | Owner doc |".to_owned(),
        "| --- | --- | --- |".to_owned(),
    ];
    for component in components_of_area(model, area) {
        for entity in &component.owns {
            lines.push(format!(
                "| {} | {} | {} |",
                cell(entity),
                code(&component.id),
                code_or_dash(&component.spec),
            ));
        }
    }
    lines.join("\n")
}

/// Architecture-map §6 component registry: one row per model component and subcomponent.
fn architecture_map_components_body(model: &Model) -> String {
    let mut lines = vec![
        format!("Component registry rows from the model, one per component and subcomponent, sorted by id. {NOTE}"),
        String::new(),
        "| Component | Parent | Layer | Tier | Status | Owns | Must not own | Owner doc |".to_owned(),
        "| --- | --- | --- | --- | --- | --- | --- | --- |".to_owned(),
    ];
    for component in sorted_components(model) {
        lines.push(format!(
            "| {} | {} | {} | {} | {} | {} | {} | {} |",
            code(&component.id),
            parent_cell(component),
            cell(&component.layer),
            component.tier,
            cell(&component.status),
            joined_cells(&component.owns),
            joined_cells(&component.must_not_own),
            code_or_dash(&component.spec),
        ));
    }
    lines.join("\n")
}

/// Boundary label of a contract row: the clause before the first ": ", else the full meaning.
fn contract_boundary(meaning: &str) -> &str {
    let meaning = meaning.trim();
    meaning.find(": ").map_or(meaning, |at| &meaning[..at])
}

/// Contract cell: the text after the first ": ", so the boundary is shown only once.
fn contract_meaning_cell(meaning: &str) -> &str {
    let meaning = meaning.trim();
    meaning
        .find(": ")
        .map_or(meaning, |at| meaning[at + 2..].trim())
}

/// Path cell: the model path as-is (backticked); an empty path stays an em dash.
fn contract_path_cell(path: Option<&str>) -> String {
    match path {
        Some(path) if !path.trim().is_empty() => code(path),
        _ => "—".to_owned(),
    }
}

/// Architecture-map §7 contract registry: one row per model contract, sorted by id.
fn architecture_map_contracts_body(model: &Model) -> String {
    let mut lines = vec![
        format!("Contract registry rows from the model, one per contract, sorted by id. {NOTE}"),
        String::new(),
        "| ID | Boundary | Contract | Provider | Consumers | Status | Path |".to_owned(),
        "| --- | --- | --- | --- | --- | --- | --- |".to_owned(),
    ];
    let mut contracts: Vec<_> = model.contracts.iter().collect();
    contracts.sort_by(|a, b| a.id.cmp(&b.id));
    for contract in contracts {
        let consumers: Vec<String> = contract
            .consumers
            .iter()
            .map(|consumer| cell(consumer))
            .filter(|consumer| !consumer.is_empty())
            .map(|consumer| code(&consumer))
            .collect();
        lines.push(format!(
            "| {} | {} | {} | {} | {} | {} | {} |",
            code(&contract.id),
            cell(contract_boundary(&contract.meaning)),
            cell(contract_meaning_cell(&contract.meaning)),
            code_or_dash(&contract.provider),
            join_or_dash(consumers, ", "),
            cell(&contract.status),
            contract_path_cell(contract.path.as_deref()),
        ));
    }
    lines.join("\n")
}

struct ViewDefinition {
    view: &'static str,
    file: &'static str,
    required: bool,
    body: String,
}

/// Every view this renderer owns. `required` means the block must already be in the file, so a view cannot
/// silently stop being generated. A missing block on a view that is not required is simply not rendered yet.
fn view_definitions(model: &Model, repo_root: &Path) -> Vec<ViewDefinition> {
    let def = |view, file, body| ViewDefinition {
        view,
        file,
        required: true,
        body,
    };
    let boundary = "docs/platform/component-boundary.md";
    let readme = "docs/platform/README.md";
    let governance = "docs/platform/governance.md";
    let overview = "docs/platform/system-overview/spec.md";
    let observe = "docs/platform/observe/spec.md";
    let workflow = "docs/platform/workflow/spec.md";
    let map = "docs/platform/architecture-map.md";
    vec![
        def("component-boundary", boundary, component_table_body(model)),
        def("readme-owner-table", readme, owner_table_body(model)),
        def(
            "governance-holder-table",
            governance,
            governance_holder_body(model, repo_root),
        ),
        def("system-overview-area-map", overview, area_map_body(model)),
        def(
            "system-overview-shared-entities",
            overview,
            shared_entities_body(model, None),
        ),
        def(
            "observe-shared-entities",
            observe,
            shared_entities_body(model, Some("observe")),
        ),
        def(
            "workflow-shared-entities",
            workflow,
            shared_entities_body(model, Some("workflow")),
        ),
        def(
            "architecture-map-components",
            map,
            architecture_map_components_body(model),
        ),
        def(
            "architecture-map-contracts",
            map,
            architecture_map_contracts_body(model),
        ),
    ]
}

/// Byte span of a view's block, markers included, or `None` when either marker is missing.
fn span_of(text: &str, view: &str) -> Option<(usize, usize)> {
    let start = start_marker(view);
    let end = end_marker(view);
    let from = text.find(&start)?;
    let to = from + text[from..].find(&end)?;
    Some((from, to + end.len()))
}

fn replace_span(text: &str, span: (usize, usize), block: &str) -> String {
    format!("{}{block}{}", &text[..span.0], &text[span.1..])
}

/// One view computed against the model, without writing.
#[derive(Debug, Clone)]
pub struct ComputedView {
    pub view: String,
    pub file: String,
    pub file_path: PathBuf,
    pub required: bool,
    pub block: String,
    /// `false` means the file has no block for the view.
    pub present: bool,
    pub previous: String,
    /// The file with every present block of that file applied.
    pub next: String,
    /// This view's own block differs from disk.
    pub changed: bool,
    /// The file as a whole differs from disk.
    pub file_changed: bool,
}

/// Every view computed against the model, without writing. File content is read once per file: every view that
/// shares a file carries the same fully-applied `previous`/`next` pair.
pub fn compute_views(repo_root: &Path) -> Result<Vec<ComputedView>, RenderError> {
    let model = Model::load(repo_root)?;
    let defs = view_definitions(&model, repo_root);

    let mut previous_by_file: BTreeMap<&str, String> = BTreeMap::new();
    for def in &defs {
        if previous_by_file.contains_key(def.file) {
            continue;
        }
        let path = repo_root.join(def.file);
        let previous = if path.exists() {
            fs::read_to_string(&path).map_err(|error| io_error(&path, &error))?
        } else {
            String::new()
        };
        previous_by_file.insert(def.file, previous);
    }

    let mut next_by_file = previous_by_file.clone();
    for def in &defs {
        let previous = &previous_by_file[def.file];
        if span_of(previous, def.view).is_none() {
            continue;
        }
        let block = render_block(def.view, &def.body);
        let next = next_by_file.get_mut(def.file).expect("file state exists");
        if let Some(span) = span_of(next, def.view) {
            *next = replace_span(next, span, &block);
        }
    }

    Ok(defs
        .iter()
        .map(|def| {
            let previous = previous_by_file[def.file].clone();
            let block = render_block(def.view, &def.body);
            let span = span_of(&previous, def.view);
            let single_next = span.map_or_else(
                || previous.clone(),
                |span| replace_span(&previous, span, &block),
            );
            let next = next_by_file[def.file].clone();
            ComputedView {
                view: def.view.to_owned(),
                file: def.file.to_owned(),
                file_path: repo_root.join(def.file),
                required: def.required,
                block,
                present: span.is_some(),
                changed: span.is_some() && single_next != previous,
                file_changed: next != previous,
                previous,
                next,
            }
        })
        .collect())
}

/// A view whose block differs from the tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Drift {
    pub view: String,
    pub file: String,
    pub reason: String,
}

/// Views whose block differs from the tree. Writes nothing.
pub fn check_views(repo_root: &Path) -> Result<Vec<Drift>, RenderError> {
    let mut drift = Vec::new();
    for view in compute_views(repo_root)? {
        if !view.present {
            if view.required {
                drift.push(Drift {
                    reason: format!("no {} block", start_marker(&view.view)),
                    view: view.view,
                    file: view.file,
                });
            }
            continue;
        }
        if view.changed {
            drift.push(Drift {
                view: view.view,
                file: view.file,
                reason: "block differs from the model".to_owned(),
            });
        }
    }
    Ok(drift)
}

/// A view name with the file it lives in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ViewRef {
    pub view: String,
    pub file: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct WriteReport {
    pub written: Vec<ViewRef>,
    pub skipped: Vec<ViewRef>,
}

/// Write mode: rewrite every present block in place, one write per file that changed.
pub fn write_views(repo_root: &Path) -> Result<WriteReport, RenderError> {
    let views = compute_views(repo_root)?;
    let mut report = WriteReport::default();
    let mut seen_files = BTreeSet::new();
    for view in &views {
        let view_ref = || ViewRef {
            view: view.view.clone(),
            file: view.file.clone(),
        };
        if !view.present {
            report.skipped.push(view_ref());
            continue;
        }
        if !seen_files.insert(view.file_path.clone()) || !view.file_changed {
            continue;
        }
        fs::write(&view.file_path, &view.next)
            .map_err(|error| io_error(&view.file_path, &error))?;
        for entry in &views {
            if entry.file_path == view.file_path && entry.present && entry.changed {
                report.written.push(ViewRef {
                    view: entry.view.clone(),
                    file: entry.file.clone(),
                });
            }
        }
    }
    Ok(report)
}

/// Parse a markdown table (header and rows) into cell rows. A separator row is dropped.
fn parse_table(markdown: &str) -> Vec<Vec<String>> {
    let mut rows = Vec::new();
    for line in markdown.split('\n') {
        if !line.starts_with('|') {
            continue;
        }
        let parts: Vec<&str> = line.split('|').collect();
        let cells: Vec<String> = parts[1..parts.len().saturating_sub(1).max(1)]
            .iter()
            .map(|part| part.trim().to_owned())
            .collect();
        if cells.is_empty() {
            continue;
        }
        let separator = cells.iter().all(|part| {
            let squeezed: String = part.chars().filter(|ch| !ch.is_whitespace()).collect();
            !squeezed.is_empty() && squeezed.chars().all(|ch| ch == '-')
        });
        if separator {
            continue;
        }
        rows.push(cells);
    }
    rows
}

/// The lines of `governance.md` under its holder-table heading, up to the next `## ` heading.
fn holder_section(governance: &str) -> String {
    let mut in_section = false;
    let mut lines: Vec<&str> = Vec::new();
    for line in governance.split('\n') {
        if in_section {
            if line.starts_with("## ") {
                break;
            }
            lines.push(line);
        } else if line.trim_end_matches('\r') == "## Decision scope to holder table" {
            in_section = true;
        }
    }
    lines.join("\n")
}

/// The holder-view preview report: the generated table and a row-by-row diff against `governance.md`.
pub fn build_holder_view_preview(repo_root: &Path) -> Result<String, RenderError> {
    let model = Model::load(repo_root)?;
    let generated_body = governance_holder_body(&model, repo_root);
    let governance_path = repo_root
        .join("docs")
        .join("platform")
        .join("governance.md");
    let governance =
        fs::read_to_string(&governance_path).map_err(|error| io_error(&governance_path, &error))?;
    let current_rows: Vec<Vec<String>> = parse_table(&holder_section(&governance))
        .into_iter()
        .skip(1)
        .collect();
    let generated_rows: Vec<Vec<String>> =
        parse_table(&generated_body).into_iter().skip(1).collect();
    let by_scope = |rows: Vec<Vec<String>>| -> BTreeMap<String, Vec<String>> {
        rows.into_iter().map(|row| (row[0].clone(), row)).collect()
    };
    let current_by_scope = by_scope(current_rows);
    let generated_by_scope = by_scope(generated_rows);
    let all_scopes: BTreeSet<&String> = current_by_scope
        .keys()
        .chain(generated_by_scope.keys())
        .collect();
    let narrative = |row: &Vec<String>| row.get(3).cloned().unwrap_or_default();
    let mut diff_lines = vec![
        "| Scope | Status | Current narrative home | Generated narrative home | Notes |".to_owned(),
        "| --- | --- | --- | --- | --- |".to_owned(),
    ];
    for scope in all_scopes {
        match (current_by_scope.get(scope), generated_by_scope.get(scope)) {
            (None, Some(generated)) => diff_lines.push(format!(
                "| {} | added | — | {} | present only in the generated view |",
                cell(scope),
                cell(&narrative(generated)),
            )),
            (Some(current), None) => diff_lines.push(format!(
                "| {} | missing | {} | — | present only in the hand-written table |",
                cell(scope),
                cell(&narrative(current)),
            )),
            (Some(current), Some(generated)) => {
                let notes: Vec<String> = (0..4)
                    .filter(|&i| current.get(i) != generated.get(i))
                    .map(|i| format!("col{} differs", i + 1))
                    .collect();
                diff_lines.push(format!(
                    "| {} | {} | {} | {} | {} |",
                    cell(scope),
                    if notes.is_empty() { "same" } else { "changed" },
                    cell(&narrative(current)),
                    cell(&narrative(generated)),
                    if notes.is_empty() {
                        "—".to_owned()
                    } else {
                        notes.join("; ")
                    },
                ));
            }
            (None, None) => {}
        }
    }
    let mut out = vec![
        "# Holder view preview (component-authority)".to_owned(),
        String::new(),
        "DOCOS keeps the holder table shape (scope → holder file or directory) and wants this"
            .to_owned(),
        "generated view before the hand-written table in `docs/platform/governance.md` is replaced"
            .to_owned(),
        "(see `plans/261121-2109-component-authority/reports/docos-boundary-answer.md`)."
            .to_owned(),
        String::new(),
        "The render verb owns the `governance-holder-table` view with `required: true`, so"
            .to_owned(),
        "`fgos authority render --check` demands its markers once they are".to_owned(),
        "inserted and the block must match the model.".to_owned(),
        String::new(),
        "## Generated table".to_owned(),
        String::new(),
        generated_body,
        String::new(),
        "## Row-by-row diff against the hand-written table".to_owned(),
        String::new(),
    ];
    out.extend(diff_lines);
    out.push(String::new());
    Ok(out.join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::MODEL_DIR;

    const VIEW_FILES: [&str; 7] = [
        "docs/platform/component-boundary.md",
        "docs/platform/README.md",
        "docs/platform/governance.md",
        "docs/platform/system-overview/spec.md",
        "docs/platform/observe/spec.md",
        "docs/platform/workflow/spec.md",
        "docs/platform/architecture-map.md",
    ];

    fn put(root: &Path, rel: &str, text: &str) {
        let path = root.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text).unwrap();
    }

    fn read(root: &Path, rel: &str) -> String {
        fs::read_to_string(root.join(rel)).unwrap()
    }

    fn scratch(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-ca-render-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// A temporary repository holding a small model and every document with placeholder blocks.
    fn seed(name: &str) -> PathBuf {
        let root = scratch(name);
        let model = format!("{MODEL_DIR}/");
        put(
            &root,
            &format!("{model}layers.yaml"),
            "layers:\n  - kernel\nrules: []\ndomains: []\ntierNames:\n  \"0\": leaf\n",
        );
        put(
            &root,
            &format!("{model}components.yaml"),
            r#"- id: demo
  canonical: demo
  aliases: []
  meaning: demo component
  layer: kernel
  tier: 0
  paths:
    - packages/demo/
  owns:
    - demo thing
  mustNotOwn:
    - other thing
  spec: docs/platform/demo/spec.md
  source:
    - packages/demo/
  status: designed
- id: cross
  canonical: cross
  aliases: []
  meaning: cross-area component
  layer: kernel
  tier: 0
  paths:
    - packages/cross/
  owns:
    - cross thing
  mustNotOwn: []
  spec: docs/platform/component-boundary.md
  source:
    - packages/cross/
  status: live
"#,
        );
        put(&root, &format!("{model}decision-kinds.yaml"), "[]\n");
        put(
            &root,
            &format!("{model}contracts.yaml"),
            r#"- id: CTR-DEMO
  canonical: CTR-DEMO
  aliases: []
  meaning: "demo boundary ↔ other: detail that must not appear as boundary"
  provider: demo
  consumers:
    - cross
  path: packages/demo/contracts/demo.v1.json
  evidence: []
  status: live
- id: CTR-PLANNED
  canonical: CTR-PLANNED
  aliases: []
  meaning: "planned side ↔ other side: no file yet"
  provider: cross
  consumers: []
  evidence: []
  status: planned
- id: CTR-NAMED-MISSING
  canonical: CTR-NAMED-MISSING
  aliases: []
  meaning: "named missing ↔ side: path printed even if absent"
  provider: cross
  consumers: []
  path: packages/missing/contracts/x.v1.json
  evidence: []
  status: planned
"#,
        );
        put(
            &root,
            &format!("{model}doors/one.yaml"),
            "job: j\nkind: door\npatterns: []\nallowed:\n  - packages/demo/x\n",
        );
        put(&root, "packages/demo/contracts/demo.v1.json", "{}\n");
        let docs: [(&str, &[&str]); 7] = [
            (
                "docs/platform/component-boundary.md",
                &["component-boundary"],
            ),
            ("docs/platform/README.md", &["readme-owner-table"]),
            ("docs/platform/governance.md", &["governance-holder-table"]),
            (
                "docs/platform/system-overview/spec.md",
                &[
                    "system-overview-area-map",
                    "system-overview-shared-entities",
                ],
            ),
            (
                "docs/platform/observe/spec.md",
                &["observe-shared-entities"],
            ),
            (
                "docs/platform/workflow/spec.md",
                &["workflow-shared-entities"],
            ),
            (
                "docs/platform/architecture-map.md",
                &["architecture-map-components", "architecture-map-contracts"],
            ),
        ];
        for (rel, views) in docs {
            let body: Vec<String> = views
                .iter()
                .map(|view| format!("{}\nplaceholder\n{}", start_marker(view), end_marker(view)))
                .collect();
            put(&root, rel, &format!("# seed\n\n{}\n", body.join("\n\n")));
        }
        root
    }

    fn block_of(text: &str, view: &str) -> String {
        let (from, to) = span_of(text, view).expect("block present");
        text[from..to].to_owned()
    }

    #[test]
    fn a_hand_edited_generated_block_is_named_by_check() {
        let root = seed("hand-edit");
        write_views(&root).unwrap();
        assert!(check_views(&root).unwrap().is_empty());

        let path = "docs/platform/component-boundary.md";
        let before = read(&root, path);
        let start = format!("{}\n", start_marker("component-boundary"));
        let tampered = before.replace(&start, &format!("{start}HAND EDITED\n"));
        assert_ne!(tampered, before);
        put(&root, path, &tampered);

        let drift = check_views(&root).unwrap();
        assert!(
            drift.iter().any(|entry| entry.view == "component-boundary"),
            "{drift:?}"
        );
        // Check wrote nothing.
        assert_eq!(read(&root, path), tampered);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_required_view_whose_markers_are_removed_is_named_by_check() {
        let root = seed("markers-removed");
        write_views(&root).unwrap();
        put(
            &root,
            "docs/platform/README.md",
            "# seed\n\nno markers left\n",
        );
        let drift = check_views(&root).unwrap();
        assert!(
            drift.iter().any(|entry| entry.view == "readme-owner-table"
                && entry.reason.contains("readme-owner-table")
                && entry.reason.starts_with("no ")),
            "{drift:?}"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn writing_twice_is_byte_identical() {
        let root = seed("twice");
        write_views(&root).unwrap();
        let first: Vec<Vec<u8>> = VIEW_FILES
            .iter()
            .map(|rel| fs::read(root.join(rel)).unwrap())
            .collect();
        let again = write_views(&root).unwrap();
        assert!(again.written.is_empty(), "{again:?}");
        for (rel, before) in VIEW_FILES.iter().zip(first) {
            assert_eq!(
                fs::read(root.join(rel)).unwrap(),
                before,
                "{rel} changed on second write"
            );
        }
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn the_area_map_lists_cross_area_components_under_cross_area() {
        let root = seed("area-map");
        write_views(&root).unwrap();
        let text = read(&root, "docs/platform/system-overview/spec.md");
        assert!(text.contains("(cross-area)"), "{text}");
        assert!(text.contains("`cross`"), "{text}");
        assert!(text.contains("| Area | Components |"), "{text}");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn the_governance_holder_table_is_a_required_view_and_missing_markers_fail_check() {
        let root = seed("holder-required");
        let views = compute_views(&root).unwrap();
        let holder = views
            .iter()
            .find(|view| view.view == "governance-holder-table")
            .expect("governance-holder-table view must be defined");
        assert!(holder.required);

        write_views(&root).unwrap();
        assert!(check_views(&root).unwrap().is_empty());
        put(
            &root,
            "docs/platform/governance.md",
            "# seed\n\nno markers\n",
        );
        let drift = check_views(&root).unwrap();
        assert!(
            drift
                .iter()
                .any(|entry| entry.view == "governance-holder-table"
                    && entry.reason.contains("governance-holder-table")
                    && entry.reason.starts_with("no ")),
            "{drift:?}"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_holder_row_uses_the_read_first_and_facts_overrides_when_set() {
        let root = seed("holder-override");
        put(
            &root,
            &format!("{MODEL_DIR}/decision-kinds.yaml"),
            r#"- id: demo-kind
  canonical: "decision-kind:demo-kind"
  aliases:
    - demo-scope
  meaning: demo decisions
  owner: demo
  narrative: docs/platform/demo/decisions/
  readFirst: docs/platform/demo/contracts/special.md#anchor-one
  facts: docs/platform/demo/contracts/special.md#anchor-one
"#,
        );
        put(&root, "docs/platform/demo/decisions/.keep", "");
        put(
            &root,
            "docs/platform/demo/contracts/special.md",
            "# special\n",
        );
        put(&root, "docs/platform/demo/spec.md", "# demo\n");
        put(&root, "docs/platform/demo/README.md", "# demo readme\n");

        write_views(&root).unwrap();
        let block = block_of(
            &read(&root, "docs/platform/governance.md"),
            "governance-holder-table",
        );
        let row = "| demo-scope → demo | `docs/platform/demo/contracts/special.md#anchor-one` | `docs/platform/demo/contracts/special.md#anchor-one` | `docs/platform/demo/decisions/` |";
        assert!(block.contains(row), "{block}");
        assert!(!block.contains("docs/platform/demo/README.md"), "{block}");
        assert!(!block.contains("docs/platform/demo/spec.md"), "{block}");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_holder_row_without_overrides_derives_its_portal_and_facts() {
        let root = seed("holder-derived");
        put(
            &root,
            &format!("{MODEL_DIR}/decision-kinds.yaml"),
            r#"- id: demo-kind
  canonical: "decision-kind:demo-kind"
  aliases:
    - demo-scope
  meaning: demo decisions
  owner: demo
  narrative: docs/platform/demo/decisions/
"#,
        );
        put(&root, "docs/platform/demo/spec.md", "# demo\n");
        put(&root, "docs/platform/demo/README.md", "# demo readme\n");
        write_views(&root).unwrap();
        let block = block_of(
            &read(&root, "docs/platform/governance.md"),
            "governance-holder-table",
        );
        assert!(
            block.contains("| demo-scope → demo | `docs/platform/demo/README.md` | `docs/platform/demo/spec.md` | `docs/platform/demo/decisions/` |"),
            "{block}"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn the_model_loads_components_decision_kinds_contracts_and_door_files_for_rendering() {
        let root = seed("model-load");
        let model = Model::load(&root).unwrap();
        assert!(!model.components.is_empty());
        assert!(!model.contracts.is_empty());
        assert!(!model.doors.is_empty());
        // The component table counts the door whose allowed path sits under the component.
        write_views(&root).unwrap();
        let table = block_of(
            &read(&root, "docs/platform/component-boundary.md"),
            "component-boundary",
        );
        assert!(
            table.contains("| `demo` | — | kernel | 0 | designed | demo thing | other thing | 1 |"),
            "{table}"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn the_architecture_map_components_view_lists_component_rows_with_owns_columns() {
        let root = seed("map-components");
        write_views(&root).unwrap();
        let text = read(&root, "docs/platform/architecture-map.md");
        assert!(text.contains(&start_marker("architecture-map-components")));
        assert!(text.contains(&end_marker("architecture-map-components")));
        assert!(text.contains(
            "| Component | Parent | Layer | Tier | Status | Owns | Must not own | Owner doc |"
        ));
        assert!(text.contains("| `demo` |"));
        assert!(text.contains("demo thing"));
        assert!(text.contains("other thing"));
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn the_architecture_map_contracts_view_prints_id_boundary_contract_provider_consumers_status_and_path(
    ) {
        let root = seed("map-contracts");
        write_views(&root).unwrap();
        let body = block_of(
            &read(&root, "docs/platform/architecture-map.md"),
            "architecture-map-contracts",
        );
        assert!(
            body.contains("| ID | Boundary | Contract | Provider | Consumers | Status | Path |")
        );
        // Boundary before ": "; the Contract cell is only the text after it.
        assert!(
            body.contains("| `CTR-DEMO` | demo boundary ↔ other | detail that must not appear as boundary | `demo` | `cross` | live | `packages/demo/contracts/demo.v1.json` |"),
            "{body}"
        );
        // A planned row with no path prints an em dash.
        assert!(
            body.contains("| `CTR-PLANNED` | planned side ↔ other side | no file yet | `cross` | — | planned | — |"),
            "{body}"
        );
        // A named path prints as-is even when the file is absent.
        assert!(
            body.contains("| `CTR-NAMED-MISSING` | named missing ↔ side | path printed even if absent | `cross` | — | planned | `packages/missing/contracts/x.v1.json` |"),
            "{body}"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn every_view_carries_the_render_verb_note() {
        let root = seed("note");
        write_views(&root).unwrap();
        let text = read(&root, "docs/platform/component-boundary.md");
        assert!(
            text.contains("by `fgos authority render`; edit the model, never this block"),
            "{text}"
        );
        assert!(!text.contains("component-authority-render.mjs"), "{text}");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn text_outside_the_markers_is_never_touched() {
        let root = seed("outside");
        let path = "docs/platform/component-boundary.md";
        let seeded = read(&root, path);
        put(
            &root,
            path,
            &format!("author prose\n\n{seeded}\ntrailing prose\n"),
        );
        write_views(&root).unwrap();
        let text = read(&root, path);
        assert!(text.starts_with("author prose\n\n# seed"), "{text}");
        assert!(text.ends_with("trailing prose\n"), "{text}");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn the_holder_preview_reports_each_scope_against_the_hand_written_table() {
        let root = seed("preview");
        put(
            &root,
            &format!("{MODEL_DIR}/decision-kinds.yaml"),
            r#"- id: demo-kind
  canonical: "decision-kind:demo-kind"
  aliases:
    - demo-scope
  meaning: demo decisions
  owner: demo
  narrative: docs/platform/demo/decisions/
"#,
        );
        put(
            &root,
            "docs/platform/governance.md",
            "# gov\n\n## Decision scope to holder table\n\n| Scope | Read first | Facts | Narrative |\n| --- | --- | --- | --- |\n| old-scope → old | `a` | `b` | `docs/old/` |\n\n## Next\n",
        );
        let preview = build_holder_view_preview(&root).unwrap();
        assert!(
            preview.starts_with("# Holder view preview (component-authority)\n"),
            "{preview}"
        );
        assert!(
            preview.contains("| demo-scope → demo | added | — |"),
            "{preview}"
        );
        assert!(
            preview.contains("| old-scope → old | missing | `docs/old/` | — |"),
            "{preview}"
        );
        assert!(preview.ends_with("\n"), "{preview}");
        let _ = fs::remove_dir_all(&root);
    }
}
