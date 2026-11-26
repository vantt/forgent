//! The rule unit: the frontmatter schema of `contracts/rule-unit.v1.json`, read from a parsed JSON value. Reading is
//! strict: an unknown key, a missing required field, a bare id where a wikilink is required, a `valid_to` on a rule
//! that is not replaced and a file stem that differs from the id are all refused as `rule-unit-invalid`.

use std::collections::BTreeMap;

use serde_json::{Map, Value};

use crate::refusal::{Refusal, RefusalCode};

/// The force of a rule; its order is the first key of the composition order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Kind {
    Law,
    Boundary,
    Procedure,
    Preference,
    HostAdapter,
}

impl Kind {
    pub const ALL: [Kind; 5] = [
        Kind::Law,
        Kind::Boundary,
        Kind::Procedure,
        Kind::Preference,
        Kind::HostAdapter,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Kind::Law => "law",
            Kind::Boundary => "boundary",
            Kind::Procedure => "procedure",
            Kind::Preference => "preference",
            Kind::HostAdapter => "host-adapter",
        }
    }

    pub fn parse(text: &str) -> Option<Kind> {
        Kind::ALL.into_iter().find(|k| k.as_str() == text)
    }

    /// Position in the composition order: laws, boundaries, procedures, preferences, host adapters last.
    pub fn rank(self) -> u8 {
        self as u8
    }
}

/// How a rule acts on the rules it names in `refines`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Mode {
    Append,
    Refine,
    Override,
    Forbid,
}

impl Mode {
    pub const ALL: [Mode; 4] = [Mode::Append, Mode::Refine, Mode::Override, Mode::Forbid];

    pub fn as_str(self) -> &'static str {
        match self {
            Mode::Append => "append",
            Mode::Refine => "refine",
            Mode::Override => "override",
            Mode::Forbid => "forbid",
        }
    }

    pub fn parse(text: &str) -> Option<Mode> {
        Mode::ALL.into_iter().find(|m| m.as_str() == text)
    }
}

/// How far a rule reaches; the breadth of the scope is the second key of the composition order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Scope {
    Repo,
    Platform,
    Component,
    Domain,
    Workspace,
    Project,
    Command,
    Skill,
    Host,
    Session,
}

impl Scope {
    pub const ALL: [Scope; 10] = [
        Scope::Repo,
        Scope::Platform,
        Scope::Component,
        Scope::Domain,
        Scope::Workspace,
        Scope::Project,
        Scope::Command,
        Scope::Skill,
        Scope::Host,
        Scope::Session,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Scope::Repo => "repo",
            Scope::Platform => "platform",
            Scope::Component => "component",
            Scope::Domain => "domain",
            Scope::Workspace => "workspace",
            Scope::Project => "project",
            Scope::Command => "command",
            Scope::Skill => "skill",
            Scope::Host => "host",
            Scope::Session => "session",
        }
    }

    pub fn parse(text: &str) -> Option<Scope> {
        Scope::ALL.into_iter().find(|s| s.as_str() == text)
    }

    /// The specificity a scope has when the unit does not say: broad to narrow.
    pub fn default_specificity(self) -> u32 {
        match self {
            Scope::Repo | Scope::Platform => 10,
            Scope::Component => 20,
            Scope::Domain => 30,
            Scope::Workspace | Scope::Project => 40,
            Scope::Command => 50,
            Scope::Skill => 60,
            Scope::Session => 70,
            Scope::Host => 80,
        }
    }
}

/// The lifecycle classes of the pkm pack, in the pack's own words.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Lifecycle {
    Draft,
    Rejected,
    Live,
    Deprecated,
    Replaced,
    Retracted,
}

impl Lifecycle {
    pub const ALL: [Lifecycle; 6] = [
        Lifecycle::Draft,
        Lifecycle::Rejected,
        Lifecycle::Live,
        Lifecycle::Deprecated,
        Lifecycle::Replaced,
        Lifecycle::Retracted,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Lifecycle::Draft => "draft",
            Lifecycle::Rejected => "rejected",
            Lifecycle::Live => "live",
            Lifecycle::Deprecated => "deprecated",
            Lifecycle::Replaced => "replaced",
            Lifecycle::Retracted => "retracted",
        }
    }

    pub fn parse(text: &str) -> Option<Lifecycle> {
        Lifecycle::ALL.into_iter().find(|l| l.as_str() == text)
    }
}

/// Which of the three roots a unit file sits in, and so who holds authority over it.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Authority {
    /// `core/instructions/`: platform authority, owner `core`.
    Platform,
    /// `components/<component>/instructions/`.
    Component(String),
    /// `domains/<domain>/instructions/`.
    Domain(String),
}

impl Authority {
    /// Platform before component before domain: the third key of the composition order.
    pub fn rank(&self) -> u8 {
        match self {
            Authority::Platform => 0,
            Authority::Component(_) => 1,
            Authority::Domain(_) => 2,
        }
    }

    /// The owner id a unit under this root must declare.
    pub fn owner(&self) -> &str {
        match self {
            Authority::Platform => "core",
            Authority::Component(name) | Authority::Domain(name) => name,
        }
    }

    /// The root a repository path belongs to, or `None` for a path outside the three roots.
    pub fn of_source(source: &str) -> Option<Authority> {
        let parts: Vec<&str> = source.split('/').collect();
        match parts.as_slice() {
            ["core", "instructions", _, ..] => Some(Authority::Platform),
            ["components", name, "instructions", _, ..] if !name.is_empty() => {
                Some(Authority::Component((*name).to_string()))
            }
            ["domains", name, "instructions", _, ..] if !name.is_empty() => {
                Some(Authority::Domain((*name).to_string()))
            }
            _ => None,
        }
    }

    /// The scopes this authority may claim: a component or domain never claims the repo-wide scopes.
    pub fn may_claim(&self, scope: Scope) -> bool {
        match self {
            Authority::Platform => true,
            Authority::Component(_) => matches!(
                scope,
                Scope::Component
                    | Scope::Workspace
                    | Scope::Project
                    | Scope::Command
                    | Scope::Skill
                    | Scope::Host
                    | Scope::Session
            ),
            Authority::Domain(_) => matches!(
                scope,
                Scope::Domain
                    | Scope::Workspace
                    | Scope::Project
                    | Scope::Command
                    | Scope::Skill
                    | Scope::Host
                    | Scope::Session
            ),
        }
    }

    pub fn describe(&self) -> String {
        match self {
            Authority::Platform => "platform:core".to_string(),
            Authority::Component(name) => format!("component:{name}"),
            Authority::Domain(name) => format!("domain:{name}"),
        }
    }
}

/// The `when:` of a unit: a key to the values it accepts (any-of); several keys must all match; empty means always.
pub type When = BTreeMap<String, Vec<String>>;

/// The frontmatter of one rule unit. Edge fields hold bare ids; in the file they are wikilinks `"[[id]]"`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuleUnit {
    pub id: String,
    pub owner: String,
    pub kind: Kind,
    pub mode: Mode,
    pub scope: Scope,
    pub specificity: u32,
    pub title: String,
    pub description: Option<String>,
    pub lifecycle: Lifecycle,
    pub valid_from: String,
    pub valid_to: Option<String>,
    pub superseded_by: Option<String>,
    pub refines: Vec<String>,
    pub depends_on: Vec<String>,
    pub conflicts_with: Vec<String>,
    pub related: Vec<String>,
    pub when: When,
}

/// A unit with its body, the repository path of its file and the authority of the root it sits in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuleFile {
    pub unit: RuleUnit,
    pub body: String,
    pub source: String,
    pub authority: Authority,
}

const KNOWN_KEYS: [&str; 17] = [
    "id",
    "owner",
    "kind",
    "mode",
    "scope",
    "specificity",
    "title",
    "description",
    "lifecycle",
    "valid_from",
    "valid_to",
    "superseded_by",
    "refines",
    "depends_on",
    "conflicts_with",
    "related",
    "when",
];

/// The id pattern of the contract: lower-case words joined by single dashes.
pub fn is_rule_id(text: &str) -> bool {
    !text.is_empty()
        && text.split('-').all(|word| {
            !word.is_empty()
                && word
                    .bytes()
                    .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit())
        })
}

/// `YYYY-MM-DD` naming a real calendar day.
pub fn is_date(text: &str) -> bool {
    let b = text.as_bytes();
    if b.len() != 10 || b[4] != b'-' || b[7] != b'-' {
        return false;
    }
    let digits = |r: std::ops::Range<usize>| b[r].iter().all(u8::is_ascii_digit);
    if !(digits(0..4) && digits(5..7) && digits(8..10)) {
        return false;
    }
    let year: u32 = text[0..4].parse().unwrap_or(0);
    let month: u32 = text[5..7].parse().unwrap_or(0);
    let day: u32 = text[8..10].parse().unwrap_or(0);
    let leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    let last = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => return false,
    };
    (1..=last).contains(&day)
}

/// The id inside a wikilink `"[[id]]"`; `None` for any other text (a bare id included).
pub fn link_target(text: &str) -> Option<&str> {
    let inner = text.strip_prefix("[[")?.strip_suffix("]]")?;
    is_rule_id(inner).then_some(inner)
}

fn stem_of(source: &str) -> &str {
    let name = source.rsplit('/').next().unwrap_or(source);
    name.strip_suffix(".md").unwrap_or(name)
}

fn invalid(source: &str, id: Option<&str>, message: impl Into<String>) -> Refusal {
    let refusal = Refusal::new(RefusalCode::UnitInvalid, message).with_source(source);
    match id {
        Some(id) => refusal.with_ids([id]),
        None => refusal,
    }
}

struct Reader<'a> {
    source: &'a str,
    map: &'a Map<String, Value>,
    id: Option<String>,
}

impl Reader<'_> {
    fn fail(&self, message: impl Into<String>) -> Refusal {
        invalid(self.source, self.id.as_deref(), message)
    }

    fn text(&self, key: &str) -> Result<Option<&str>, Refusal> {
        match self.map.get(key) {
            None => Ok(None),
            Some(Value::String(s)) => Ok(Some(s.as_str())),
            Some(_) => Err(self.fail(format!("\"{key}\" must be a string"))),
        }
    }

    fn required(&self, key: &str) -> Result<&str, Refusal> {
        self.text(key)?
            .ok_or_else(|| self.fail(format!("missing required field \"{key}\"")))
    }

    fn date(&self, key: &str) -> Result<Option<String>, Refusal> {
        match self.text(key)? {
            None => Ok(None),
            Some(d) if is_date(d) => Ok(Some(d.to_string())),
            Some(d) => Err(self.fail(format!("\"{key}\" is not a YYYY-MM-DD date: \"{d}\""))),
        }
    }

    fn link(&self, key: &str, raw: &Value) -> Result<String, Refusal> {
        raw.as_str()
            .and_then(link_target)
            .map(str::to_string)
            .ok_or_else(|| {
                self.fail(format!(
                    "\"{key}\" must hold wikilinks of the form \"[[rule-id]]\": a bare id makes no edge"
                ))
            })
    }

    fn links(&self, key: &str) -> Result<Vec<String>, Refusal> {
        match self.map.get(key) {
            None => Ok(Vec::new()),
            Some(Value::Array(items)) => items.iter().map(|v| self.link(key, v)).collect(),
            Some(_) => Err(self.fail(format!("\"{key}\" must be a list of \"[[rule-id]]\" links"))),
        }
    }

    fn when(&self) -> Result<When, Refusal> {
        let mut when = When::new();
        match self.map.get("when") {
            None => {}
            Some(Value::Object(entries)) => {
                for (key, values) in entries {
                    let Value::Array(values) = values else {
                        return Err(self.fail(format!("when.{key} must be a list of values")));
                    };
                    let mut out = Vec::with_capacity(values.len());
                    for v in values {
                        let Value::String(s) = v else {
                            return Err(self.fail(format!("when.{key} must hold strings")));
                        };
                        out.push(s.clone());
                    }
                    when.insert(key.clone(), out);
                }
            }
            Some(_) => return Err(self.fail("\"when\" must be a mapping of keys to lists")),
        }
        Ok(when)
    }
}

impl RuleFile {
    /// Reads one unit file: `frontmatter` is the parsed YAML of the file, `body` the Markdown after it, `source` the
    /// repository path (it fixes the authority and, by its stem, the id).
    pub fn read(frontmatter: &Value, body: &str, source: &str) -> Result<RuleFile, Refusal> {
        let Value::Object(map) = frontmatter else {
            return Err(invalid(source, None, "the frontmatter must be a mapping"));
        };
        let authority = Authority::of_source(source).ok_or_else(|| {
            invalid(
                source,
                None,
                "the file is outside core/instructions, components/<c>/instructions and domains/<d>/instructions",
            )
        })?;
        let id_text = match map.get("id") {
            Some(Value::String(s)) => Some(s.clone()),
            _ => None,
        };
        let r = Reader {
            source,
            map,
            id: id_text.clone(),
        };
        for key in map.keys() {
            if !KNOWN_KEYS.contains(&key.as_str()) {
                return Err(r.fail(format!("unknown frontmatter key \"{key}\"")));
            }
        }
        let id = r.required("id")?;
        if !is_rule_id(id) {
            return Err(r.fail(format!(
                "\"id\" must be lower-case words joined by dashes: \"{id}\""
            )));
        }
        if stem_of(source) != id {
            return Err(r.fail(format!(
                "the file stem \"{}\" must equal the id: links resolve by file stem",
                stem_of(source)
            )));
        }
        let owner = r.required("owner")?;
        if owner != authority.owner() {
            return Err(r.fail(format!(
                "owner \"{owner}\" mismatches the owner \"{}\" of the root the file sits in",
                authority.owner()
            )));
        }
        let kind = Kind::parse(r.required("kind")?).ok_or_else(|| {
            r.fail("\"kind\" is not one of law, boundary, procedure, preference, host-adapter")
        })?;
        let mode = Mode::parse(r.required("mode")?)
            .ok_or_else(|| r.fail("\"mode\" is not one of append, refine, override, forbid"))?;
        let scope = Scope::parse(r.required("scope")?)
            .ok_or_else(|| r.fail("\"scope\" is not one of the ten scopes of the contract"))?;
        if !authority.may_claim(scope) {
            return Err(r.fail(format!(
                "authority {} cannot claim scope \"{}\"",
                authority.describe(),
                scope.as_str()
            )));
        }
        let specificity = match map.get("specificity") {
            Some(Value::Number(n)) => n
                .as_u64()
                .and_then(|n| u32::try_from(n).ok())
                .ok_or_else(|| r.fail("\"specificity\" must be a non-negative integer"))?,
            Some(_) => return Err(r.fail("\"specificity\" must be a non-negative integer")),
            None => return Err(r.fail("missing required field \"specificity\"")),
        };
        let title = r.required("title")?;
        if title.trim().is_empty() {
            return Err(r.fail("\"title\" must not be empty"));
        }
        let lifecycle = Lifecycle::parse(r.required("lifecycle")?).ok_or_else(|| {
            r.fail("\"lifecycle\" is not one of draft, rejected, live, deprecated, replaced, retracted")
        })?;
        // pkm drops a rule without valid_from from the set in force without a word.
        let valid_from = r
            .date("valid_from")?
            .ok_or_else(|| r.fail("missing required field \"valid_from\": a rule without it silently drops out of the set in force"))?;
        let valid_to = r.date("valid_to")?;
        let superseded_by = match map.get("superseded_by") {
            None => None,
            Some(Value::Array(_)) => {
                return Err(r.fail(
                    "\"superseded_by\" takes exactly one \"[[rule-id]]\" link: a rule is replaced by one rule",
                ))
            }
            Some(raw) => Some(r.link("superseded_by", raw)?),
        };
        // pkm ends any non-rejected rule whose valid_to has passed, whatever its lifecycle.
        if lifecycle != Lifecycle::Replaced {
            if valid_to.is_some() {
                return Err(r.fail("\"valid_to\" is allowed only with lifecycle replaced"));
            }
            if superseded_by.is_some() {
                return Err(r.fail("\"superseded_by\" is allowed only with lifecycle replaced"));
            }
        }
        if lifecycle == Lifecycle::Replaced && (superseded_by.is_none() || valid_to.is_none()) {
            return Err(Refusal::new(
                RefusalCode::ReplacementIncomplete,
                "a replaced rule needs both superseded_by and valid_to",
            )
            .with_ids([id])
            .with_source(source));
        }
        let description = r.text("description")?.map(str::to_string);
        let unit = RuleUnit {
            id: id.to_string(),
            owner: owner.to_string(),
            kind,
            mode,
            scope,
            specificity,
            title: title.to_string(),
            description,
            lifecycle,
            valid_from,
            valid_to,
            superseded_by,
            refines: r.links("refines")?,
            depends_on: r.links("depends_on")?,
            conflicts_with: r.links("conflicts_with")?,
            related: r.links("related")?,
            when: r.when()?,
        };
        Ok(RuleFile {
            unit,
            body: body.trim().to_string(),
            source: source.to_string(),
            authority,
        })
    }
}
