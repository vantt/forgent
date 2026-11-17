//! The agent-definition listing: every persona a seat lookup can find, and what is wrong with or hidden about
//! each. The host reads the tier folders and hands their files over ([`TierFiles`], in lookup order: workspace,
//! each domain, core); this module judges them and reads no file. The vectors of
//! `packages/execution/contracts/agents.v1.json` are the one proof of the answers.
//!
//! A persona file is a short YAML sketch. The persona renderer reads only `description`, `persona.voice|style|
//! archetype` and `decision_boundary.can_decide|must_escalate`; any other key in those sections is not rendered,
//! and the warnings here are the only place that says so. A persona file never carries model taste: `tier` or
//! `prefer` in one is refused, and the refusal says where it goes.

use fgos_yaml_doc::{parse, Profile, Value};
use serde::Serialize;

const PERSONA_KEYS: [&str; 3] = ["voice", "style", "archetype"];
const BOUNDARY_KEYS: [&str; 2] = ["can_decide", "must_escalate"];
const QUOTE_HINT: &str = "; an unquoted \": \" inside the text makes YAML read a mapping, quote it";
/// What `hiddenBy` says for a shipped core persona the project's own `core/agents/` folder does not carry.
const MASKED_BY: &str = "core/agents/ of this project";

/// What the host found for one definition file.
#[derive(Debug, Clone)]
pub enum Content {
    Bytes(Vec<u8>),
    /// The file exists but cannot be read; the listing says so instead of dropping it.
    Unreadable,
}

/// One `<name>.yaml` file of a tier: `name` is the file name without `.yaml`, `rel` its project-relative path.
#[derive(Debug, Clone)]
pub struct AgentFile {
    pub name: String,
    pub rel: String,
    pub content: Content,
}

/// One tier's files, in the order the host's directory read gives them, plus the `.yml` paths it ignored.
#[derive(Debug, Clone)]
pub struct TierFiles {
    pub tier: String,
    /// The tier's folder label (`fgos/agents`, `domains/*/agents`, `core/agents`), named in duplicates.
    pub label: String,
    pub files: Vec<AgentFile>,
    pub ignored: Vec<String>,
}

/// A shipped core persona, named so the listing can say a project's own `core/agents/` hides it.
#[derive(Debug, Clone)]
pub struct ShippedCore {
    pub name: String,
    pub rel: String,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Agent {
    pub name: String,
    pub tier: String,
    pub source: String,
    pub description: String,
    pub problems: Vec<String>,
    pub warnings: Vec<String>,
    pub shadows: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Masked {
    pub name: String,
    pub tier: String,
    pub source: String,
    pub hidden_by: String,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Duplicate {
    pub tier: String,
    pub label: String,
    pub name: String,
    pub files: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Listing {
    pub agents: Vec<Agent>,
    pub masked: Vec<Masked>,
    pub duplicates: Vec<Duplicate>,
    pub ignored: Vec<String>,
}

/// Every persona a seat lookup can find, in lookup order, plus what is hidden. The first tier holding a name
/// wins; a later file of that name (in a lower tier, or a second domain) is listed in its `shadows`.
///
/// `shipped_core` is `Some` only when the project carries its own `core/agents/` folder that is not the
/// install's: the installed core personas that folder lacks are then reported as masked.
pub fn list(tiers: &[TierFiles], shipped_core: Option<&[ShippedCore]>) -> Listing {
    let mut agents: Vec<Agent> = Vec::new();
    for tier in tiers {
        for file in &tier.files {
            if let Some(seen) = agents.iter_mut().find(|a| a.name == file.name) {
                seen.shadows.push(file.rel.clone());
                continue;
            }
            agents.push(read_agent(&tier.tier, file));
        }
    }
    let masked = shipped_core
        .unwrap_or_default()
        .iter()
        .filter(|core| !agents.iter().any(|a| a.name == core.name))
        .map(|core| Masked {
            name: core.name.clone(),
            tier: "core".to_string(),
            source: core.rel.clone(),
            hidden_by: MASKED_BY.to_string(),
        })
        .collect();
    Listing {
        agents,
        masked,
        duplicates: duplicates_of(tiers),
        ignored: tiers.iter().flat_map(|t| t.ignored.clone()).collect(),
    }
}

fn duplicates_of(tiers: &[TierFiles]) -> Vec<Duplicate> {
    let mut duplicates = Vec::new();
    for tier in tiers {
        let mut by_name: Vec<(&str, Vec<String>)> = Vec::new();
        for file in &tier.files {
            match by_name.iter_mut().find(|(name, _)| *name == file.name) {
                Some((_, rels)) => rels.push(file.rel.clone()),
                None => by_name.push((&file.name, vec![file.rel.clone()])),
            }
        }
        for (name, files) in by_name.into_iter().filter(|(_, rels)| rels.len() > 1) {
            duplicates.push(Duplicate {
                tier: tier.tier.clone(),
                label: tier.label.clone(),
                name: name.to_string(),
                files,
            });
        }
    }
    duplicates
}

fn read_agent(tier: &str, file: &AgentFile) -> Agent {
    let base = |description: String, problems: Vec<String>, warnings: Vec<String>| Agent {
        name: file.name.clone(),
        tier: tier.to_string(),
        source: file.rel.clone(),
        description,
        problems,
        warnings,
        shadows: Vec::new(),
    };
    let Content::Bytes(bytes) = &file.content else {
        return base(
            String::new(),
            vec!["cannot be read".to_string()],
            Vec::new(),
        );
    };
    let read = read_definition(bytes, &file.rel);
    let problems = shape_problem(&file.name, &read).into_iter().collect();
    let warnings = render_warnings(read.data.as_ref());
    base(fold_spaces(&read.description), problems, warnings)
}

/// A definition file read once: its mapping (`None` when it is not valid YAML or not a mapping), the parse
/// failure when there is one, the declared name and the description as text.
struct Definition {
    data: Option<Vec<(String, Value)>>,
    error: Option<String>,
    name: Option<String>,
    description: String,
}

fn read_definition(bytes: &[u8], file: &str) -> Definition {
    // A file is read as UTF-8 text, undecodable bytes replaced, as the Node door reads it.
    let text = String::from_utf8_lossy(bytes);
    let value = match parse(text.as_bytes(), Profile::Tool, file) {
        Ok(doc) => doc.value().clone(),
        Err(refusal) => {
            let at = match (refusal.line, refusal.column) {
                (Some(line), Some(column)) => format!(" (line {line}, column {column})"),
                _ => String::new(),
            };
            return Definition {
                data: None,
                error: Some(format!(
                    "cannot be parsed: {}{at}",
                    refusal.rule.replace('-', " ")
                )),
                name: None,
                description: String::new(),
            };
        }
    };
    let data = match value {
        Value::Map(pairs) => Some(pairs),
        _ => None,
    };
    let scalar = |key: &str| {
        data.as_deref()
            .and_then(|d| get(d, key))
            .and_then(scalar_text)
    };
    let name = scalar("name").map(|n| trim(&n)).filter(|n| !n.is_empty());
    let description = scalar("description").map(|d| trim(&d)).unwrap_or_default();
    Definition {
        data,
        error: None,
        name,
        description,
    }
}

fn shape_problem(name: &str, read: &Definition) -> Option<String> {
    if let Some(error) = &read.error {
        return Some(error.clone());
    }
    if read.name.as_deref() != Some(name) {
        let got = serde_json::to_string(&read.name).unwrap_or_default();
        return Some(format!("must declare name: {name} (got {got})"));
    }
    let data = read.data.as_deref().unwrap_or_default();
    if let Some(field) = ["tier", "prefer"]
        .into_iter()
        .find(|key| get(data, key).is_some())
    {
        return Some(format!(
            "persona-model-taste-not-allowed: \"{field}\" is a model choice and a persona does not make one; set it at runner.personas.<name> in the runner config"
        ));
    }
    if let Some(problem) = non_text_values(data).into_iter().next() {
        return Some(problem);
    }
    if read.description.is_empty() {
        return Some("must declare a non-empty description".to_string());
    }
    None
}

/// Values in the rendered sections that the renderer would silently drop because they are not text: a mapping
/// where text belongs (typically an unquoted ": " inside a list item or a value) or a list where one text belongs.
fn non_text_values(data: &[(String, Value)]) -> Vec<String> {
    let kind = |value: &Value| {
        if matches!(value, Value::Seq(_)) {
            "a list"
        } else {
            "a mapping"
        }
    };
    let mut problems = Vec::new();
    let mut single = |value: Option<&Value>, whence: String| {
        if let Some(value @ (Value::Seq(_) | Value::Map(_))) = value {
            problems.push(format!("{whence} is {}, not text{QUOTE_HINT}", kind(value)));
        }
    };
    single(get(data, "description"), "description".to_string());
    if let Some(Value::Map(persona)) = get(data, "persona") {
        for key in PERSONA_KEYS {
            single(get(persona, key), format!("persona.{key}"));
        }
    }
    if let Some(Value::Map(boundary)) = get(data, "decision_boundary") {
        for key in BOUNDARY_KEYS {
            let whence = format!("decision_boundary.{key}");
            match get(boundary, key) {
                None | Some(Value::Null) => {}
                Some(Value::Seq(items)) => {
                    for (index, item) in items.iter().enumerate() {
                        if matches!(item, Value::Seq(_) | Value::Map(_)) {
                            problems
                                .push(format!("{whence}[{index}] is {}{QUOTE_HINT}", kind(item)));
                        }
                    }
                }
                Some(Value::Map(_)) => {
                    problems.push(format!("{whence} is a mapping, not a list{QUOTE_HINT}"))
                }
                Some(_) => problems.push(format!("{whence} is text, not a list")),
            }
        }
    }
    problems
}

/// Keys in a definition that the renderer would silently drop, one sentence each.
fn render_warnings(data: Option<&Vec<(String, Value)>>) -> Vec<String> {
    let mut warnings = Vec::new();
    let sections: [(&str, &[&str]); 2] = [
        ("persona", &PERSONA_KEYS),
        ("decision_boundary", &BOUNDARY_KEYS),
    ];
    for (section, rendered) in sections {
        if let Some(Value::Map(pairs)) = data.and_then(|d| get(d, section)) {
            for key in own_key_order(pairs) {
                if !rendered.contains(&key) {
                    warnings.push(format!(
                        "{section}.{key} is not rendered (only {} are)",
                        rendered.join(", ")
                    ));
                }
            }
        }
    }
    warnings
}

/// The keys of a mapping in the order a JavaScript object lists them: array-index keys ascending first, then the
/// rest as written. The Node door hands the persona renderer objects, so this is the order its warnings follow.
fn own_key_order(pairs: &[(String, Value)]) -> Vec<&str> {
    let index_of = |key: &str| {
        let canonical = key == "0"
            || (!key.starts_with('0')
                && !key.is_empty()
                && key.bytes().all(|b| b.is_ascii_digit()));
        canonical
            .then(|| key.parse::<u64>().ok())
            .flatten()
            .filter(|n| *n < u64::from(u32::MAX))
    };
    let mut indexed: Vec<(u64, &str)> = pairs
        .iter()
        .filter_map(|(k, _)| index_of(k).map(|n| (n, k.as_str())))
        .collect();
    indexed.sort_by_key(|(n, _)| *n);
    let others = pairs
        .iter()
        .map(|(k, _)| k.as_str())
        .filter(|k| index_of(k).is_none());
    indexed.into_iter().map(|(_, k)| k).chain(others).collect()
}

fn get<'a>(pairs: &'a [(String, Value)], key: &str) -> Option<&'a Value> {
    pairs.iter().find(|(k, _)| k == key).map(|(_, v)| v)
}

/// The text of a scalar the way the Node door writes it (`String(value)`); `None` for null, a list or a mapping.
fn scalar_text(value: &Value) -> Option<String> {
    match value {
        Value::Str(s) => Some(s.clone()),
        Value::Bool(b) => Some(b.to_string()),
        Value::Int(i) => Some(i.to_string()),
        Value::Float(f) => Some(float_text(*f)),
        Value::Null | Value::Seq(_) | Value::Map(_) => None,
    }
}

/// `String(number)` of JavaScript for a float.
fn float_text(f: f64) -> String {
    if f.is_nan() {
        return "NaN".to_string();
    }
    if f.is_infinite() {
        return if f > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    if f == 0.0 {
        return "0".to_string();
    }
    let magnitude = f.abs();
    if (1e-6..1e21).contains(&magnitude) {
        return format!("{f}");
    }
    let text = format!("{f:e}");
    match text.split_once('e') {
        Some((mantissa, exponent)) if !exponent.starts_with('-') => {
            format!("{mantissa}e+{exponent}")
        }
        _ => text,
    }
}

/// The characters JavaScript's `\s` and `trim` treat as space: Rust's whitespace set, but U+FEFF is one and
/// U+0085 is not.
fn is_space(c: char) -> bool {
    c == '\u{FEFF}' || (c.is_whitespace() && c != '\u{85}')
}

fn trim(text: &str) -> String {
    text.trim_matches(is_space).to_string()
}

/// A description on one line: every run of whitespace is one space.
fn fold_spaces(text: &str) -> String {
    text.split(is_space)
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn file(name: &str, content: Content) -> AgentFile {
        AgentFile {
            name: name.to_string(),
            rel: format!("fgos/agents/{name}.yaml"),
            content,
        }
    }

    #[test]
    fn an_unreadable_file_is_listed_with_its_problem() {
        let tier = TierFiles {
            tier: "workspace".into(),
            label: "fgos/agents".into(),
            files: vec![file("a", Content::Unreadable)],
            ignored: vec![],
        };
        let listing = list(&[tier], None);
        assert_eq!(
            listing.agents[0].problems,
            vec!["cannot be read".to_string()]
        );
        assert_eq!(listing.agents[0].description, "");
    }

    #[test]
    fn floats_read_like_javascript_numbers() {
        assert_eq!(float_text(1.5), "1.5");
        assert_eq!(float_text(1.0), "1");
        assert_eq!(float_text(1e21), "1e+21");
        assert_eq!(float_text(1.5e-7), "1.5e-7");
        assert_eq!(float_text(-0.0), "0");
    }
}
