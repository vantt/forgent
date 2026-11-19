//! Operation prompt templates: discovery over the three tiers, the bounded variable set, the renderer and the
//! provenance a rendered prompt carries.
//!
//! Tiers and precedence (project overrides domain, domain overrides core):
//! 1. project: `<cwd>/.fgos/prompt-templates/<templateId>.{md,txt}`
//! 2. domain: `<packageRoot>/domains/<domain>/prompt-templates/<templateId>.{md,txt}`
//! 3. core: `<packageRoot>/core/prompt-templates/<templateId>.{md,txt}`
//!
//! A template may name only the bounded variables below; anything else is refused by name (`template-invalid`).
//! Discovery reads the file system and nothing else: no write, no grant, no widening of authority.
//!
//! Golden vectors: `packages/execution/contracts/execution-contract/{templates,render}.json`.

use std::cmp::Ordering;
use std::fs;
use std::path::{Component, Path, PathBuf};

use fgos_execution::runner_config::fgos_dir_from_root;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use super::validate::PROTOCOL_OPERATION_STAMP_PREFIX;
use crate::assignment::js_space;
use crate::confinement::driver::js::{at, display, truthy};

/// Directory of the shipped core templates, under the package root.
pub const CORE_PROMPT_TEMPLATES_DIR: [&str; 2] = ["core", "prompt-templates"];
/// Directory name a tier keeps its templates in.
pub const DOMAIN_PROMPT_TEMPLATES_SEGMENT: &str = "prompt-templates";
/// The variables a template may name.
pub const BOUNDED_TEMPLATE_VARIABLES: [&str; 7] = [
    "objective",
    "contextRefs",
    "artifactRefs",
    "expectedOutputs",
    "role",
    "constraints",
    "evidenceContract",
];

const TEMPLATE_ID_RE_TEXT: &str = "/^[A-Za-z0-9._-]+$/";

/// Node's `TemplateResolutionError`: a typed code, the message (already carrying the `operation-prompt-templates`
/// prefix) and the details object.
#[derive(Debug, Clone, PartialEq)]
pub struct TemplateError {
    pub code: &'static str,
    pub message: String,
    pub details: Value,
}

impl TemplateError {
    fn new(code: &'static str, message: impl AsRef<str>, details: Value) -> Self {
        TemplateError {
            code,
            message: format!("operation-prompt-templates [{code}]: {}", message.as_ref()),
            details,
        }
    }

    /// `{ name, code, message, details }`, as the vectors state a thrown `TemplateResolutionError`.
    pub fn to_json(&self) -> Value {
        json!({
            "name": "TemplateResolutionError",
            "code": self.code,
            "message": self.message,
            "details": self.details,
        })
    }
}

impl std::fmt::Display for TemplateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for TemplateError {}

/// A template file that cannot be read. Node lets the raw file system error through here; Rust names it.
fn unreadable(path: &Path, cause: &std::io::Error) -> TemplateError {
    TemplateError::new(
        "template-unreadable",
        format!("cannot read \"{}\": {cause}", path.display()),
        json!({ "filePath": text(path) }),
    )
}

/// Where a lookup reads: the project (whose `.fgos` holds the project tier) and the payload (core and domains).
#[derive(Debug, Clone)]
pub struct Roots {
    pub cwd: PathBuf,
    pub package_root: PathBuf,
}

/// One discovered template.
#[derive(Debug, Clone, PartialEq)]
pub struct TemplateEntry {
    pub id: String,
    pub tier: String,
    pub source: String,
    pub file_path: String,
    pub relative_file_path: String,
    pub content: String,
    pub content_digest: String,
}

impl TemplateEntry {
    pub fn to_json(&self) -> Value {
        json!({
            "id": self.id,
            "tier": self.tier,
            "source": self.source,
            "filePath": self.file_path,
            "relativeFilePath": self.relative_file_path,
            "content": self.content,
            "contentDigest": self.content_digest,
        })
    }
}

fn text(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

/// `sha256:<hex>` of the text's UTF-8 bytes.
pub fn sha256_digest(content: &str) -> String {
    format!("sha256:{}", hex(&Sha256::digest(content.as_bytes())))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// `/^sha256:[0-9a-f]{64}$/`.
fn is_sha256_digest(value: &str) -> bool {
    value.strip_prefix("sha256:").is_some_and(|hex| {
        hex.len() == 64
            && hex
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    })
}

// ---- paths -------------------------------------------------------------------------------------------------------

fn lexical(path: &Path) -> PathBuf {
    crate::confinement::driver::js::resolve_path(Path::new(""), path)
}

/// `path.relative(from, to)` for two absolute, normalised paths; empty when they are the same.
fn relative(from: &Path, to: &Path) -> String {
    let from: Vec<Component> = from.components().collect();
    let to: Vec<Component> = to.components().collect();
    let common = from.iter().zip(&to).take_while(|(a, b)| a == b).count();
    let mut parts: Vec<String> = Vec::new();
    for _ in common..from.len() {
        parts.push("..".to_string());
    }
    for part in &to[common..] {
        parts.push(part.as_os_str().to_string_lossy().into_owned());
    }
    parts.join(std::path::MAIN_SEPARATOR_STR)
}

fn real_or_resolved(path: &Path) -> PathBuf {
    if path.exists() {
        fs::canonicalize(path).unwrap_or_else(|_| lexical(path))
    } else {
        lexical(path)
    }
}

/// The path-escape guard: the target must resolve strictly inside the scan root.
fn assert_contained(root_dir: &Path, file_path: &Path) -> Result<(), TemplateError> {
    let root = real_or_resolved(root_dir);
    let target = real_or_resolved(file_path);
    let rel = relative(&root, &target);
    let escapes = rel.is_empty()
        || rel == ".."
        || rel.starts_with(&format!("..{}", std::path::MAIN_SEPARATOR))
        || Path::new(&rel).is_absolute();
    if escapes {
        return Err(TemplateError::new(
            "template-path-escape",
            format!(
                "template \"{}\" resolves outside its scan root \"{}\"",
                file_path.display(),
                root.display()
            ),
            json!({ "rootDir": text(root_dir), "filePath": text(file_path) }),
        ));
    }
    Ok(())
}

// ---- names -------------------------------------------------------------------------------------------------------

/// `/\.(md|txt)$/i`: the template file extension, when the name has one.
fn template_extension(file_name: &str) -> Option<usize> {
    let lower = file_name.to_ascii_lowercase();
    [".md", ".txt"]
        .iter()
        .find(|ext| lower.ends_with(*ext))
        .map(|ext| file_name.len() - ext.len())
}

/// The template id of a file name: its name without the extension.
pub fn template_id_from_file_name(file_name: &str) -> String {
    match template_extension(file_name) {
        Some(end) => file_name[..end].to_string(),
        None => file_name.to_string(),
    }
}

/// `/^[A-Za-z0-9._-]+$/`.
pub fn is_template_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'-'))
}

/// The primary collation weight of one character in the root locale: spaces, then punctuation in the order
/// `_ - , ; : ! ? . ' " ( ) [ ] { } @ * / \ & # % ` ^ + < = > | ~ $`, digits, letters (case folded), the rest by
/// code point.
fn primary_weight(c: char) -> (u8, u32) {
    const PUNCTUATION: &str = "_-,;:!?.'\"()[]{}@*/\\&#%`^+<=>|~$";
    if c.is_whitespace() {
        return (0, c as u32);
    }
    if let Some(at) = PUNCTUATION.find(c) {
        return (1, at as u32);
    }
    if c.is_ascii_digit() {
        return (2, c as u32);
    }
    if c.is_alphabetic() {
        let lower = c.to_lowercase().next().unwrap_or(c);
        return (3, lower as u32);
    }
    (4, c as u32)
}

/// `a.localeCompare(b)` for the names a template directory holds: compared without regard to case first, a
/// lower-case letter before its upper-case twin on a tie.
pub fn locale_compare(a: &str, b: &str) -> Ordering {
    let primary = a
        .chars()
        .map(primary_weight)
        .cmp(b.chars().map(primary_weight));
    primary
        .then_with(|| {
            a.chars()
                .zip(b.chars())
                .find(|(x, y)| x != y)
                .map_or(Ordering::Equal, |(x, y)| {
                    match (x.is_lowercase(), y.is_lowercase()) {
                        (true, false) => Ordering::Less,
                        (false, true) => Ordering::Greater,
                        _ => x.cmp(&y),
                    }
                })
        })
        .then_with(|| a.cmp(b))
}

// ---- validation --------------------------------------------------------------------------------------------------

/// The placeholders of `content` (`{name}`), in first-seen order and without repeats; one outside the bounded set is
/// refused with `template-invalid`.
pub fn validate_operation_prompt_template(
    raw: &Value,
    template_id: &str,
) -> Result<Vec<String>, TemplateError> {
    let Some(content) = raw.as_str() else {
        return Err(TemplateError::new(
            "template-invalid",
            format!("template content for \"{template_id}\" must be a string"),
            json!({}),
        ));
    };
    let bytes = content.as_bytes();
    let mut found: Vec<String> = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'{' {
            let mut j = i + 1;
            while j < bytes.len()
                && (bytes[j].is_ascii_alphanumeric() || bytes[j] == b'_' || bytes[j] == b'-')
            {
                j += 1;
            }
            if j > i + 1 && j < bytes.len() && bytes[j] == b'}' {
                let name = &content[i + 1..j];
                if !BOUNDED_TEMPLATE_VARIABLES.contains(&name) {
                    return Err(TemplateError::new(
                        "template-invalid",
                        format!(
                            "template \"{template_id}\" references forbidden or unknown variable \"{{{name}}}\". Only bounded variables are permitted: {}",
                            BOUNDED_TEMPLATE_VARIABLES.join(", ")
                        ),
                        json!({
                            "templateId": template_id,
                            "variable": name,
                            "allowed": BOUNDED_TEMPLATE_VARIABLES,
                        }),
                    ));
                }
                if !found.iter().any(|seen| seen == name) {
                    found.push(name.to_string());
                }
                i = j + 1;
                continue;
            }
        }
        i += 1;
    }
    Ok(found)
}

// ---- discovery ---------------------------------------------------------------------------------------------------

fn entries_of(dir: &Path) -> Result<Vec<String>, TemplateError> {
    let listing = fs::read_dir(dir).map_err(|e| unreadable(dir, &e))?;
    let mut names = Vec::new();
    for entry in listing {
        let entry = entry.map_err(|e| unreadable(dir, &e))?;
        names.push(entry.file_name().to_string_lossy().into_owned());
    }
    Ok(names)
}

/// One directory of template files; a duplicate id inside it is refused.
fn scan_tier(
    tier: &str,
    dir: &Path,
    source: &str,
    package_root: &Path,
) -> Result<Vec<TemplateEntry>, TemplateError> {
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut files: Vec<String> = entries_of(dir)?
        .into_iter()
        .filter(|name| template_extension(name).is_some())
        .collect();
    files.sort_by(|a, b| locale_compare(a, b));

    let mut seen: Vec<(String, String)> = Vec::new();
    let mut entries = Vec::new();
    for file_name in files {
        let file_path = dir.join(&file_name);
        assert_contained(dir, &file_path)?;

        let id = template_id_from_file_name(&file_name);
        if !is_template_id(&id) {
            return Err(TemplateError::new(
                "template-invalid",
                format!(
                    "template filename \"{file_name}\" produces invalid template id \"{id}\" (must match {TEMPLATE_ID_RE_TEXT})"
                ),
                json!({ "fileName": file_name, "templateId": id }),
            ));
        }
        if let Some((_, existing)) = seen.iter().find(|(seen_id, _)| *seen_id == id) {
            return Err(TemplateError::new(
                "template-ambiguous",
                format!(
                    "duplicate template id \"{id}\" within {source} ({file_name} conflicts with {existing})"
                ),
                json!({
                    "templateId": id, "tier": tier, "source": source,
                    "fileName": file_name, "existingFile": existing,
                }),
            ));
        }
        seen.push((id.clone(), file_name.clone()));

        let content = fs::read_to_string(&file_path).map_err(|e| unreadable(&file_path, &e))?;
        validate_operation_prompt_template(&Value::String(content.clone()), &id)?;
        let relative_file_path = match relative(package_root, &file_path) {
            rel if rel.is_empty() => text(&file_path),
            rel => rel,
        };
        entries.push(TemplateEntry {
            id,
            tier: tier.to_string(),
            source: source.to_string(),
            file_path: text(&file_path),
            relative_file_path,
            content_digest: sha256_digest(&content),
            content,
        });
    }
    Ok(entries)
}

/// The domains of the payload: the directories directly under `<packageRoot>/domains`, sorted by name. A file or a
/// link is not a domain; an absent directory is an empty list.
fn domain_dirs(package_root: &Path) -> Result<Vec<(String, PathBuf)>, TemplateError> {
    let domains = package_root.join("domains");
    let listing = match fs::read_dir(&domains) {
        Ok(listing) => listing,
        Err(e) if matches!(e.kind(), std::io::ErrorKind::NotFound) => return Ok(Vec::new()),
        Err(e) if e.raw_os_error() == Some(20) => return Ok(Vec::new()),
        Err(e) => return Err(unreadable(&domains, &e)),
    };
    let mut names = Vec::new();
    for entry in listing {
        let entry = entry.map_err(|e| unreadable(&domains, &e))?;
        if entry.file_type().is_ok_and(|t| t.is_dir()) {
            names.push(entry.file_name().to_string_lossy().into_owned());
        }
    }
    names.sort_by(|a, b| locale_compare(a, b));
    Ok(names
        .into_iter()
        .map(|name| {
            let dir = domains.join(&name);
            (name, dir)
        })
        .collect())
}

fn project_dir(roots: &Roots) -> PathBuf {
    PathBuf::from(fgos_dir_from_root(&text(&roots.cwd))).join(DOMAIN_PROMPT_TEMPLATES_SEGMENT)
}

fn core_dir(roots: &Roots) -> PathBuf {
    CORE_PROMPT_TEMPLATES_DIR
        .iter()
        .fold(roots.package_root.clone(), |dir, part| dir.join(part))
}

/// The templates of the project tier alone (`.fgos/prompt-templates/`); the packaged tiers are not read.
pub fn discover_project_prompt_templates(
    roots: &Roots,
) -> Result<Vec<TemplateEntry>, TemplateError> {
    scan_tier(
        "project",
        &project_dir(roots),
        "project",
        &roots.package_root,
    )
}

/// Every template across the three tiers; project beats domain beats core.
pub fn discover_operation_prompt_templates(
    roots: &Roots,
) -> Result<Vec<TemplateEntry>, TemplateError> {
    let mut by_id: Vec<TemplateEntry> = Vec::new();
    let mut domain_of: Vec<(String, String)> = Vec::new();

    for entry in discover_project_prompt_templates(roots)? {
        by_id.push(entry);
    }
    for (name, dir) in domain_dirs(&roots.package_root)? {
        let entries = scan_tier(
            "domain",
            &dir.join(DOMAIN_PROMPT_TEMPLATES_SEGMENT),
            &format!("domain:{name}"),
            &roots.package_root,
        )?;
        for entry in entries {
            if let Some((_, first)) = domain_of.iter().find(|(id, _)| *id == entry.id) {
                if *first != name {
                    return Err(TemplateError::new(
                        "template-ambiguous",
                        format!(
                            "template id \"{}\" collides across domains \"{first}\" and \"{name}\"",
                            entry.id
                        ),
                        json!({ "templateId": entry.id, "domain1": first, "domain2": name }),
                    ));
                }
            }
            domain_of.retain(|(id, _)| *id != entry.id);
            domain_of.push((entry.id.clone(), name.clone()));
            if !by_id.iter().any(|e| e.id == entry.id) {
                by_id.push(entry);
            }
        }
    }
    for entry in scan_tier("core", &core_dir(roots), "core", &roots.package_root)? {
        if !by_id.iter().any(|e| e.id == entry.id) {
            by_id.push(entry);
        }
    }
    Ok(by_id)
}

/// One template by id; project beats domain (the named one, else any) beats core.
pub fn load_operation_prompt_template(
    template_id: &str,
    domain: Option<&str>,
    roots: &Roots,
) -> Result<TemplateEntry, TemplateError> {
    if !is_template_id(template_id) {
        return Err(TemplateError::new(
            "template-invalid",
            format!("invalid template id \"{template_id}\""),
            json!({}),
        ));
    }
    let target_domain = domain.filter(|d| !d.is_empty());

    let project = project_dir(roots);
    if project.exists() {
        let found = scan_tier("project", &project, "project", &roots.package_root)?
            .into_iter()
            .find(|e| e.id == template_id);
        if let Some(found) = found {
            return Ok(found);
        }
    }

    if let Some(name) = target_domain {
        let dir = roots
            .package_root
            .join("domains")
            .join(name)
            .join(DOMAIN_PROMPT_TEMPLATES_SEGMENT);
        if dir.exists() {
            let found = scan_tier(
                "domain",
                &dir,
                &format!("domain:{name}"),
                &roots.package_root,
            )?
            .into_iter()
            .find(|e| e.id == template_id);
            if let Some(found) = found {
                return Ok(found);
            }
        }
    } else {
        let mut matched: Option<TemplateEntry> = None;
        for (name, dir) in domain_dirs(&roots.package_root)? {
            let dir = dir.join(DOMAIN_PROMPT_TEMPLATES_SEGMENT);
            if !dir.exists() {
                continue;
            }
            let found = scan_tier(
                "domain",
                &dir,
                &format!("domain:{name}"),
                &roots.package_root,
            )?
            .into_iter()
            .find(|e| e.id == template_id);
            if let Some(found) = found {
                if let Some(first) = &matched {
                    return Err(TemplateError::new(
                        "template-ambiguous",
                        format!(
                            "template id \"{template_id}\" collides across domains \"{}\" and \"{}\"",
                            first.source, found.source
                        ),
                        json!({
                            "templateId": template_id,
                            "source1": first.source, "source2": found.source,
                        }),
                    ));
                }
                matched = Some(found);
            }
        }
        if let Some(found) = matched {
            return Ok(found);
        }
    }

    let core = core_dir(roots);
    if core.exists() {
        let found = scan_tier("core", &core, "core", &roots.package_root)?
            .into_iter()
            .find(|e| e.id == template_id);
        if let Some(found) = found {
            return Ok(found);
        }
    }

    let mut details = Map::new();
    details.insert("templateId".into(), json!(template_id));
    details.insert("cwd".into(), json!(text(&roots.cwd)));
    if let Some(name) = domain {
        details.insert("domain".into(), json!(name));
    }
    Err(TemplateError::new(
        "template-not-found",
        format!(
            "no operation prompt template found for id \"{template_id}\" (searched project, domain, and core tiers)"
        ),
        Value::Object(details),
    ))
}

// ---- rendering ---------------------------------------------------------------------------------------------------

fn format_item_list(items: &[Value]) -> String {
    if items.is_empty() {
        return "- (none)".to_string();
    }
    items
        .iter()
        .map(|item| format!("- {}", display(Some(item))))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Engine-reserved constraints (`protocol-operation:*`) never reach the model prompt.
fn format_constraints(constraints: &[Value]) -> String {
    let kept: Vec<String> = constraints
        .iter()
        .filter_map(Value::as_str)
        .filter(|c| !c.starts_with(PROTOCOL_OPERATION_STAMP_PREFIX))
        .map(|c| format!("- {c}"))
        .collect();
    if kept.is_empty() {
        "- (none)".to_string()
    } else {
        kept.join("\n")
    }
}

/// `String.prototype.replaceAll(pattern, replacement)` with a string pattern: the replacement's `$$`, `$&`, `` $` ``
/// and `$'` are expanded, any other `$` stays.
fn replace_all(haystack: &str, pattern: &str, replacement: &str) -> String {
    let mut out = String::with_capacity(haystack.len());
    let mut last = 0;
    for (start, matched) in haystack.match_indices(pattern) {
        out.push_str(&haystack[last..start]);
        let mut chars = replacement.chars().peekable();
        while let Some(c) = chars.next() {
            if c != '$' {
                out.push(c);
                continue;
            }
            match chars.peek() {
                Some('$') => {
                    chars.next();
                    out.push('$');
                }
                Some('&') => {
                    chars.next();
                    out.push_str(matched);
                }
                Some('`') => {
                    chars.next();
                    out.push_str(&haystack[..start]);
                }
                Some('\'') => {
                    chars.next();
                    out.push_str(&haystack[start + matched.len()..]);
                }
                _ => out.push('$'),
            }
        }
        last = start + matched.len();
    }
    out.push_str(&haystack[last..]);
    out
}

/// `value ?? fallback` read as text: absent and `null` take the fallback.
fn text_or(value: Option<&Value>, fallback: &str) -> String {
    match value {
        None | Some(Value::Null) => fallback.to_string(),
        some => display(some),
    }
}

/// A list variable: an array is formatted, anything else (present) prints as it is.
fn list_text(value: Option<&Value>, format: fn(&[Value]) -> String, fallback: &str) -> String {
    match value {
        Some(Value::Array(items)) => format(items),
        other => text_or(other, fallback),
    }
}

/// Renders a template with the bounded variables.
pub fn render_operation_prompt_template(
    template: &Value,
    variables: &Value,
) -> Result<String, TemplateError> {
    validate_operation_prompt_template(template, "")?;
    let content = template.as_str().unwrap_or_default();
    let get = |key: &str| variables.as_object().and_then(|o| o.get(key));

    let objective = text_or(get("objective"), "");
    let role = text_or(get("role"), "");
    let context_refs = list_text(get("contextRefs"), format_item_list, "- (none)");
    let artifact_refs = match get("artifactRefs") {
        Some(Value::Array(items)) => format_item_list(items),
        Some(Value::Null) | None => context_refs.clone(),
        other => display(other),
    };
    let expected_outputs = list_text(get("expectedOutputs"), format_item_list, "- (none)");
    let constraints = list_text(get("constraints"), format_constraints, "- (none)");
    let evidence_fallback = at(variables, &["evidence", "required"])
        .filter(|v| !v.is_null())
        .map_or_else(|| "reported".to_string(), |v| display(Some(v)));
    let evidence_contract = text_or(get("evidenceContract"), &evidence_fallback);

    let mut rendered = content.to_string();
    for (placeholder, value) in [
        ("{objective}", &objective),
        ("{role}", &role),
        ("{contextRefs}", &context_refs),
        ("{artifactRefs}", &artifact_refs),
        ("{expectedOutputs}", &expected_outputs),
        ("{constraints}", &constraints),
        ("{evidenceContract}", &evidence_contract),
    ] {
        rendered = replace_all(&rendered, placeholder, value);
    }
    Ok(rendered)
}

// ---- resolve and render ------------------------------------------------------------------------------------------

/// What `resolve_and_render_operation_prompt` reads besides the target.
#[derive(Debug, Clone)]
pub struct ResolveOptions {
    pub roots: Roots,
    pub domain: Option<String>,
    /// The variables of a template-id call (`options.variables`).
    pub variables: Option<Value>,
    /// The assignment of a template-id call when no variables were given (`options.assignment`).
    pub assignment: Option<Value>,
    /// A pinned template snapshot (`options.templateProvenance ?? options.pinnedTemplate`).
    pub pinned_template: Option<Value>,
}

fn mismatch(message: impl AsRef<str>, details: Value) -> TemplateError {
    TemplateError::new("template-provenance-mismatch", message, details)
}

fn non_blank(value: &Value) -> bool {
    value
        .as_str()
        .is_some_and(|s| !s.trim_matches(js_space).is_empty())
}

/// A template taken from a pinned snapshot instead of the disk, once its integrity is checked.
struct Pinned {
    id: String,
    tier: String,
    source: String,
    file_path: Value,
    content: String,
    content_digest: String,
    rendered_digest: String,
}

fn check_pinned(pinned: &Value, template_id: &Option<Value>) -> Result<Pinned, TemplateError> {
    let details = || json!({ "pinnedTemplate": pinned });
    let Some(object) = pinned.as_object() else {
        return Err(mismatch(
            "pinned template provenance must be a non-null object",
            details(),
        ));
    };
    let snapshot = object.get("templateSnapshot").filter(|s| non_blank(s));
    let Some(snapshot) = snapshot.and_then(Value::as_str) else {
        return Err(mismatch(
            "pinned template provenance contains missing or non-string templateSnapshot",
            details(),
        ));
    };
    let Some(id) = object
        .get("id")
        .filter(|v| non_blank(v))
        .and_then(Value::as_str)
    else {
        return Err(mismatch(
            "pinned template provenance missing non-empty id",
            details(),
        ));
    };
    if let Some(wanted) = template_id.as_ref().filter(|v| truthy(Some(v))) {
        if object.get("id") != Some(wanted) {
            return Err(mismatch(
                format!(
                    "pinned template id \"{id}\" does not match contractTemplate \"{}\"",
                    display(Some(wanted))
                ),
                json!({ "pinnedId": id, "templateId": wanted }),
            ));
        }
    }
    for (key, label) in [("tier", "tier"), ("source", "source")] {
        if object.get(key).is_some_and(|v| !non_blank(v)) {
            return Err(mismatch(
                format!("pinned template {label} must be a non-empty string when present"),
                details(),
            ));
        }
    }
    if let Some(path) = object.get("filePath") {
        if !path.is_null() && !non_blank(path) {
            return Err(mismatch(
                "pinned template filePath must be a string or null when present",
                details(),
            ));
        }
    }

    let actual = sha256_digest(snapshot);
    let content_digest = object.get("contentDigest").filter(|v| truthy(Some(v)));
    let Some(content_digest) = content_digest.and_then(Value::as_str) else {
        return Err(mismatch(
            "pinned template provenance missing required contentDigest",
            details(),
        ));
    };
    if !is_sha256_digest(content_digest) {
        return Err(mismatch(
            format!("pinned template contentDigest is malformed: \"{content_digest}\""),
            json!({ "contentDigest": content_digest }),
        ));
    }
    if content_digest != actual {
        return Err(mismatch(
            format!(
                "pinned template contentDigest mismatch: expected \"{actual}\", got \"{content_digest}\""
            ),
            json!({ "expectedContentDigest": actual, "actualContentDigest": content_digest }),
        ));
    }

    let rendered = object
        .get("renderedPromptDigest")
        .filter(|v| truthy(Some(v)));
    let Some(rendered) = rendered.and_then(Value::as_str) else {
        return Err(mismatch(
            "pinned template provenance missing required renderedPromptDigest",
            details(),
        ));
    };
    if !is_sha256_digest(rendered) {
        return Err(mismatch(
            format!("pinned template renderedPromptDigest is malformed: \"{rendered}\""),
            json!({ "renderedPromptDigest": rendered }),
        ));
    }

    validate_operation_prompt_template(&Value::String(snapshot.to_string()), id)?;
    let text_of = |key: &str, fallback: &str| {
        object
            .get(key)
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .unwrap_or(fallback)
            .to_string()
    };
    Ok(Pinned {
        id: id.to_string(),
        tier: text_of("tier", "pinned"),
        source: text_of("source", "pinned"),
        file_path: object
            .get("filePath")
            .filter(|v| truthy(Some(v)))
            .cloned()
            .unwrap_or(Value::Null),
        content: snapshot.to_string(),
        content_digest: actual,
        rendered_digest: rendered.to_string(),
    })
}

/// Resolves the template an assignment (or a bare template id) names, renders it, and returns
/// `{ renderedBody, templateProvenance }`.
///
/// An assignment that carries a pinned template snapshot renders from the snapshot, so a retry or a replay never
/// depends on the disk copy. The snapshot is checked end to end (its shape, the digest of its text, the digest of
/// the prompt it rendered) and any corruption refuses with `template-provenance-mismatch`.
pub fn resolve_and_render_operation_prompt(
    first: &Value,
    options: &ResolveOptions,
) -> Result<Value, TemplateError> {
    let empty = json!({});
    let (mut template_id, target): (Option<Value>, &Value) = match first {
        Value::String(id) => {
            let given = [&options.variables, &options.assignment]
                .into_iter()
                .flatten()
                .find(|v| truthy(Some(v)));
            (Some(Value::String(id.clone())), given.unwrap_or(&empty))
        }
        Value::Object(_) | Value::Array(_) => (
            first
                .get("contractTemplate")
                .filter(|v| !v.is_null())
                .cloned(),
            first,
        ),
        _ => {
            return Err(TemplateError::new(
                "template-invalid",
                "assignment object or templateId string is required",
                json!({}),
            ))
        }
    };

    let pinned_source = at(target, &["provenance", "template"])
        .filter(|v| !v.is_null())
        .or(options.pinned_template.as_ref().filter(|v| !v.is_null()));

    let (entry_id, tier, source, file_path, content, content_digest, pinned) = match pinned_source {
        Some(pinned) => {
            let checked = check_pinned(pinned, &template_id)?;
            template_id = Some(Value::String(checked.id.clone()));
            (
                checked.id.clone(),
                checked.tier.clone(),
                checked.source.clone(),
                checked.file_path.clone(),
                checked.content.clone(),
                checked.content_digest.clone(),
                Some(checked),
            )
        }
        None => {
            let Some(id) = template_id
                .as_ref()
                .and_then(Value::as_str)
                .filter(|s| !s.is_empty())
            else {
                return Err(TemplateError::new(
                    "template-invalid",
                    "assignment does not declare valid contractTemplate string",
                    json!({}),
                ));
            };
            let domain = options
                .domain
                .as_deref()
                .filter(|d| !d.is_empty())
                .or_else(|| target.get("domain").and_then(Value::as_str));
            let entry = load_operation_prompt_template(id, domain, &options.roots)?;
            (
                entry.id,
                entry.tier,
                entry.source,
                json!(entry.relative_file_path),
                entry.content,
                entry.content_digest,
                None,
            )
        }
    };

    let get = |key: &str| target.get(key).filter(|v| !v.is_null());
    let constraints = at(target, &["provenance", "inline", "contract", "constraints"])
        .filter(|v| !v.is_null())
        .or_else(|| at(target, &["provenance", "contract", "constraints"]).filter(|v| !v.is_null()))
        .or_else(|| at(target, &["contract", "constraints"]).filter(|v| !v.is_null()))
        .or_else(|| get("constraints"))
        .cloned()
        .unwrap_or_else(|| json!([]));
    let or_empty_list = |value: Option<&Value>| value.cloned().unwrap_or_else(|| json!([]));
    let mut variables = Map::new();
    variables.insert(
        "objective".into(),
        get("objective").cloned().unwrap_or(json!("")),
    );
    variables.insert("role".into(), get("role").cloned().unwrap_or(json!("")));
    variables.insert(
        "contextRefs".into(),
        or_empty_list(get("contextRefs").or_else(|| get("artifactRefs"))),
    );
    variables.insert(
        "artifactRefs".into(),
        or_empty_list(get("artifactRefs").or_else(|| get("contextRefs"))),
    );
    variables.insert(
        "expectedOutputs".into(),
        or_empty_list(get("expectedOutputs")),
    );
    variables.insert("constraints".into(), constraints);
    variables.insert(
        "evidenceContract".into(),
        get("evidenceContract")
            .or_else(|| at(target, &["evidence", "required"]).filter(|v| !v.is_null()))
            .cloned()
            .unwrap_or(json!("reported")),
    );

    let rendered_body = render_operation_prompt_template(
        &Value::String(content.clone()),
        &Value::Object(variables),
    )?;
    let rendered_digest = sha256_digest(&rendered_body);
    if let Some(pinned) = &pinned {
        if pinned.rendered_digest != rendered_digest {
            return Err(mismatch(
                format!(
                    "rendered prompt digest mismatch for pinned template \"{entry_id}\": expected \"{}\", computed \"{rendered_digest}\"",
                    pinned.rendered_digest
                ),
                json!({
                    "expectedRenderedPromptDigest": pinned.rendered_digest,
                    "computedRenderedPromptDigest": rendered_digest,
                }),
            ));
        }
    }
    let _ = template_id;

    Ok(json!({
        "renderedBody": rendered_body,
        "templateProvenance": {
            "id": entry_id,
            "tier": tier,
            "source": source,
            "filePath": file_path,
            "contentDigest": content_digest,
            "renderedPromptDigest": rendered_digest,
            "templateSnapshot": content,
        },
    }))
}
