use serde::Deserialize;
use std::collections::{HashSet, VecDeque};
use std::sync::LazyLock;

const PACKAGED_RULES: &str = include_str!("../../contracts/convention.rules.v1.json");

#[derive(Debug, Clone, Deserialize)]
pub struct RuleSet {
    pub contract: String,
    #[serde(rename = "errorCodes")]
    pub error_codes: Vec<String>,
    pub rules: Vec<Rule>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rule {
    pub id: String,
    pub kind: String,
    pub shape: RuleShape,
    #[serde(default)]
    pub template: Option<String>,
    #[serde(default)]
    pub plan_root_template: Option<String>,
    #[serde(default)]
    pub glob: Option<String>,
    #[serde(default)]
    pub cardinality: Option<Cardinality>,
    pub roots: Vec<String>,
    pub scope: Vec<String>,
    pub posture: Posture,
    #[serde(default)]
    pub cutoff: Option<String>,
    #[serde(default)]
    pub compatibility: Vec<String>,
    #[serde(default)]
    pub canonical: bool,
    #[serde(default)]
    pub metadata_exempt: bool,
    #[serde(default)]
    pub generated: bool,
    #[serde(default)]
    pub required_metadata_fields: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuleShape {
    NameTemplate,
    PlacementGlob,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Cardinality {
    Singleton,
    Collection,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Posture {
    Block,
    Warn,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum RuleError {
    #[error("invalid-rule-json: {0}")]
    InvalidJson(String),
    #[error("invalid-rule-shape: rule '{0}' has an unsupported shape")]
    InvalidRuleShape(String),
    #[error("invalid-rule: {0}")]
    InvalidRule(String),
}

static RULES: LazyLock<RuleSet> =
    LazyLock::new(|| parse_rules(PACKAGED_RULES).expect("packaged convention rules must be valid"));

pub fn packaged_rules() -> &'static RuleSet {
    &RULES
}

pub fn parse_rules(input: &str) -> Result<RuleSet, RuleError> {
    let value: serde_json::Value =
        serde_json::from_str(input).map_err(|error| RuleError::InvalidJson(error.to_string()))?;
    if let Some(rules) = value.get("rules").and_then(serde_json::Value::as_array) {
        for (index, rule) in rules.iter().enumerate() {
            let shape = rule.get("shape").and_then(serde_json::Value::as_str);
            if !matches!(shape, Some("name-template" | "placement-glob")) {
                let id = rule
                    .get("id")
                    .and_then(serde_json::Value::as_str)
                    .map(str::to_owned)
                    .unwrap_or_else(|| index.to_string());
                return Err(RuleError::InvalidRuleShape(id));
            }
        }
    }
    let rules: RuleSet =
        serde_json::from_value(value).map_err(|error| RuleError::InvalidJson(error.to_string()))?;
    validate_rules(&rules)?;
    Ok(rules)
}

fn validate_rules(rules: &RuleSet) -> Result<(), RuleError> {
    if rules.contract != "convention.rules.v1" {
        return Err(RuleError::InvalidRule("unexpected contract id".into()));
    }
    let mut ids = HashSet::new();
    let mut kinds = HashSet::new();
    for rule in &rules.rules {
        if !ids.insert(rule.id.as_str()) {
            return Err(RuleError::InvalidRule(format!(
                "duplicate id '{}'",
                rule.id
            )));
        }
        if !kinds.insert(rule.kind.as_str()) {
            return Err(RuleError::InvalidRule(format!(
                "duplicate kind '{}'",
                rule.kind
            )));
        }
        match rule.shape {
            RuleShape::NameTemplate if rule.template.is_none() || rule.cardinality.is_some() => {
                return Err(RuleError::InvalidRule(format!(
                    "name-template rule '{}' has invalid fields",
                    rule.id
                )));
            }
            RuleShape::PlacementGlob if rule.glob.is_none() || rule.cardinality.is_none() => {
                return Err(RuleError::InvalidRule(format!(
                    "placement-glob rule '{}' has invalid fields",
                    rule.id
                )));
            }
            _ => {}
        }
    }
    let placement = rules
        .rules
        .iter()
        .filter(|rule| rule.shape == RuleShape::PlacementGlob)
        .collect::<Vec<_>>();
    for (index, left) in placement.iter().enumerate() {
        for right in &placement[index + 1..] {
            let left_glob = left.glob.as_deref().expect("validated placement rule");
            let right_glob = right.glob.as_deref().expect("validated placement rule");
            if glob_specificity(left_glob) == glob_specificity(right_glob)
                && globs_overlap(left_glob, right_glob)
            {
                return Err(RuleError::InvalidRule(format!(
                    "placement rules '{}' and '{}' overlap at equal specificity",
                    left.id, right.id
                )));
            }
        }
    }
    Ok(())
}

fn glob_specificity(glob: &str) -> Vec<u8> {
    glob.split('/')
        .map(|segment| match segment {
            "**" => 0,
            "*" => 1,
            value if value.starts_with('<') && value.ends_with('>') => 2,
            _ => 3,
        })
        .collect()
}

fn globs_overlap(left: &str, right: &str) -> bool {
    let left = left.split('/').collect::<Vec<_>>();
    let right = right.split('/').collect::<Vec<_>>();
    let mut pending = VecDeque::from([(0, 0)]);
    let mut visited = HashSet::new();
    while let Some((left_index, right_index)) = pending.pop_front() {
        if !visited.insert((left_index, right_index)) {
            continue;
        }
        if left_index == left.len() && right_index == right.len() {
            return true;
        }
        if left.get(left_index) == Some(&"**") {
            pending.push_back((left_index + 1, right_index));
        }
        if right.get(right_index) == Some(&"**") {
            pending.push_back((left_index, right_index + 1));
        }
        let (Some(left_segment), Some(right_segment)) =
            (left.get(left_index), right.get(right_index))
        else {
            continue;
        };
        if segments_can_match(left_segment, right_segment) {
            let next_left = left_index + usize::from(*left_segment != "**");
            let next_right = right_index + usize::from(*right_segment != "**");
            if (next_left, next_right) != (left_index, right_index) {
                pending.push_back((next_left, next_right));
            }
        }
    }
    false
}

fn segments_can_match(left: &str, right: &str) -> bool {
    is_wildcard(left) || is_wildcard(right) || left == right
}

fn is_wildcard(segment: &str) -> bool {
    matches!(segment, "*" | "**")
        || (segment.starts_with('<') && segment.ends_with('>') && segment.len() > 2)
}

impl RuleSet {
    pub fn by_kind(&self, kind: &str) -> Option<&Rule> {
        self.rules.iter().find(|rule| rule.kind == kind)
    }

    pub fn placement_rules(&self) -> impl Iterator<Item = &Rule> {
        self.rules
            .iter()
            .filter(|rule| rule.shape == RuleShape::PlacementGlob)
    }
}
