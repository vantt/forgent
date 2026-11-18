//! The shape check of `ask --input`. Every limit is read from `questions-input.v1.json` (embedded), which is
//! the rule authority; characters are counted, not bytes. A violation names the field and the rule.

use crate::record::{Parts, QuestionOption, Scope};
use crate::refusal::Refusal;
use serde_json::Value;
use std::sync::OnceLock;

const CONTRACT: &str = include_str!("../../contracts/questions-input.v1.json");

/// The checked input of `ask`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AskInput {
    pub stage: String,
    pub reference: String,
    pub headline: String,
    pub blocks: String,
    pub migrated: bool,
    pub supersedes: Option<String>,
    pub parts: Parts,
}

struct Limits {
    stage_max: usize,
    headline_max: usize,
    what_max: usize,
    cause_max: usize,
    label_max: usize,
    options_max: usize,
    options_min_decided: usize,
    discovery_stages: Vec<String>,
}

fn limits() -> &'static Limits {
    static LIMITS: OnceLock<Limits> = OnceLock::new();
    LIMITS.get_or_init(|| {
        let contract: Value =
            serde_json::from_str(CONTRACT).expect("questions-input.v1.json is valid JSON");
        let props = &contract["properties"];
        let parts = &props["parts"]["properties"];
        let max = |v: &Value| v["maxLength"].as_u64().expect("maxLength in the contract") as usize;
        let options = &parts["options"];
        let discovery_stages = contract["if"]["not"]["anyOf"][0]["properties"]["stage"]["enum"]
            .as_array()
            .expect("the discovery stages in the contract")
            .iter()
            .filter_map(|v| v.as_str().map(str::to_owned))
            .collect();
        Limits {
            stage_max: max(&props["stage"]),
            headline_max: max(&props["headline"]),
            what_max: max(&parts["what"]),
            cause_max: max(&parts["cause"]),
            label_max: max(&options["items"]["properties"]["label"]),
            options_max: options["maxItems"].as_u64().expect("maxItems") as usize,
            options_min_decided: contract["$defs"]["decided"]["properties"]["parts"]["properties"]
                ["options"]["minItems"]
                .as_u64()
                .expect("minItems of a decision question")
                as usize,
            discovery_stages,
        }
    })
}

fn chars(text: &str) -> usize {
    text.chars().count()
}

/// A string field: absent is `None`; present but not text is a shape error.
fn text_of<'a>(object: &'a Value, key: &str, path: &str) -> Result<Option<&'a str>, Refusal> {
    match object.get(key) {
        None => Ok(None),
        Some(Value::String(text)) => Ok(Some(text)),
        Some(_) => Err(Refusal::incomplete(
            format!("{path}{key} is not text"),
            Vec::new(),
        )),
    }
}

/// A required, non-empty text: absent is `parts-incomplete`, empty is `question-unclear`.
fn required<'a>(
    object: &'a Value,
    key: &str,
    path: &str,
    missing: &mut Vec<String>,
) -> Result<Option<&'a str>, Refusal> {
    match text_of(object, key, path)? {
        None => {
            missing.push(format!("{path}{key}"));
            Ok(None)
        }
        Some("") => Err(Refusal::unclear(
            format!("{path}{key}"),
            "must not be empty",
        )),
        Some(text) => Ok(Some(text)),
    }
}

fn at_most(field: &str, text: &str, max: usize) -> Result<(), Refusal> {
    if chars(text) > max {
        return Err(Refusal::unclear(field, format!("at most {max} characters")));
    }
    Ok(())
}

fn deny_unknown(object: &Value, allowed: &[&str], path: &str) -> Result<(), Refusal> {
    let map = object
        .as_object()
        .ok_or_else(|| Refusal::incomplete(format!("{path} is not an object"), Vec::new()))?;
    for key in map.keys() {
        if !allowed.contains(&key.as_str()) {
            return Err(Refusal::incomplete(
                format!("{path}{key} is not a field of questions-input.v1.json"),
                Vec::new(),
            ));
        }
    }
    Ok(())
}

fn option_of(value: &Value, index: usize, limits: &Limits) -> Result<QuestionOption, Refusal> {
    let path = format!("parts.options[{index}].");
    deny_unknown(
        value,
        &["label", "does", "gain", "harm", "cost", "recommended"],
        &path,
    )?;
    let mut missing = Vec::new();
    let mut get = |key| required(value, key, &path, &mut missing);
    let (label, does, gain, harm, cost) = (
        get("label")?,
        get("does")?,
        get("gain")?,
        get("harm")?,
        get("cost")?,
    );
    if !missing.is_empty() {
        return Err(Refusal::incomplete(
            format!("option {index} lacks {}", missing.join(", ")),
            missing,
        ));
    }
    let label = label.unwrap_or_default();
    at_most(&format!("{path}label"), label, limits.label_max)?;
    let recommended = match value.get("recommended") {
        None => None,
        Some(Value::Bool(flag)) => Some(*flag),
        Some(_) => {
            return Err(Refusal::incomplete(
                format!("{path}recommended is not a boolean"),
                Vec::new(),
            ))
        }
    };
    let own = |text: Option<&str>| text.unwrap_or_default().to_owned();
    Ok(QuestionOption {
        label: label.to_owned(),
        does: own(does),
        gain: own(gain),
        harm: own(harm),
        cost: own(cost),
        recommended,
    })
}

/// Checks `input` against `questions-input.v1.json`. `parts-incomplete` for an absent required part or a
/// value of the wrong type; `question-unclear` naming the field and the rule for a measurable rule broken.
pub fn check(input: &Value) -> Result<AskInput, Refusal> {
    let limits = limits();
    deny_unknown(
        input,
        &[
            "stage",
            "ref",
            "headline",
            "blocks",
            "migrated",
            "supersedes",
            "parts",
        ],
        "",
    )?;
    let mut missing = Vec::new();
    let stage = required(input, "stage", "", &mut missing)?;
    let reference = required(input, "ref", "", &mut missing)?;
    let headline = required(input, "headline", "", &mut missing)?;
    let blocks = match text_of(input, "blocks", "")? {
        None | Some("") => return Err(Refusal::unclear("blocks", "must be present")),
        Some(text) => text,
    };
    let parts = input.get("parts");
    if parts.is_none() {
        missing.push("parts".into());
    }
    let parts_value = parts.unwrap_or(&Value::Null);
    let (what, cause, allows, forbids);
    if parts.is_some() {
        deny_unknown(
            parts_value,
            &["what", "cause", "options", "recommendation", "scope"],
            "parts.",
        )?;
        what = required(parts_value, "what", "parts.", &mut missing)?;
        cause = required(parts_value, "cause", "parts.", &mut missing)?;
        let scope = parts_value.get("scope");
        match scope {
            None => {
                missing.push("parts.scope".into());
                (allows, forbids) = (None, None);
            }
            Some(scope) => {
                deny_unknown(scope, &["allows", "forbids"], "parts.scope.")?;
                allows = required(scope, "allows", "parts.scope.", &mut missing)?;
                forbids = required(scope, "forbids", "parts.scope.", &mut missing)?;
            }
        }
    } else {
        (what, cause, allows, forbids) = (None, None, None, None);
    }
    let migrated = match input.get("migrated") {
        None => false,
        Some(Value::Bool(flag)) => *flag,
        Some(_) => {
            return Err(Refusal::incomplete("migrated is not a boolean", Vec::new()));
        }
    };
    let supersedes = match text_of(input, "supersedes", "")? {
        None => None,
        Some(id) if valid_id(id) => Some(id.to_owned()),
        Some(_) => return Err(Refusal::unclear("supersedes", "a question id (q-...)")),
    };
    let exempt = migrated
        || stage.is_some_and(|s| limits.discovery_stages.iter().any(|d| d == s))
        || (stage == Some("shaping") && reference.is_some_and(|r| r.starts_with("discussion:")));
    let options_value = parts_value.get("options");
    let recommendation = text_of(parts_value, "recommendation", "parts.")?;
    if parts.is_some() && !exempt {
        if options_value.is_none() {
            missing.push("parts.options".into());
        }
        if recommendation.is_none() {
            missing.push("parts.recommendation".into());
        }
    }
    if !missing.is_empty() {
        return Err(Refusal::incomplete(
            format!("required parts are absent: {}", missing.join(", ")),
            missing,
        ));
    }
    let (stage, reference, headline) = (
        stage.unwrap_or_default(),
        reference.unwrap_or_default(),
        headline.unwrap_or_default(),
    );
    at_most("stage", stage, limits.stage_max)?;
    at_most("headline", headline, limits.headline_max)?;
    if headline.contains(['\r', '\n']) {
        return Err(Refusal::unclear("headline", "one line"));
    }
    let (what, cause) = (what.unwrap_or_default(), cause.unwrap_or_default());
    at_most("parts.what", what, limits.what_max)?;
    at_most("parts.cause", cause, limits.cause_max)?;
    let mut options = Vec::new();
    if let Some(list) = options_value {
        let list = list
            .as_array()
            .ok_or_else(|| Refusal::incomplete("parts.options is not a list", Vec::new()))?;
        if list.len() > limits.options_max {
            return Err(Refusal::unclear(
                "parts.options",
                format!("at most {} options", limits.options_max),
            ));
        }
        for (index, item) in list.iter().enumerate() {
            options.push(option_of(item, index, limits)?);
        }
    }
    if !exempt {
        if options.len() < limits.options_min_decided {
            return Err(Refusal::unclear(
                "parts.options",
                format!(
                    "{}-{} options",
                    limits.options_min_decided, limits.options_max
                ),
            ));
        }
        if options
            .iter()
            .filter(|o| o.recommended == Some(true))
            .count()
            != 1
        {
            return Err(Refusal::unclear(
                "parts.options",
                "exactly one option recommended",
            ));
        }
        if recommendation == Some("") {
            return Err(Refusal::unclear(
                "parts.recommendation",
                "must not be empty",
            ));
        }
    }
    Ok(AskInput {
        stage: stage.to_owned(),
        reference: reference.to_owned(),
        headline: headline.to_owned(),
        blocks: blocks.to_owned(),
        migrated,
        supersedes,
        parts: Parts {
            what: what.to_owned(),
            cause: cause.to_owned(),
            options,
            recommendation: recommendation.unwrap_or_default().to_owned(),
            scope: Scope {
                allows: allows.unwrap_or_default().to_owned(),
                forbids: forbids.unwrap_or_default().to_owned(),
            },
        },
    })
}

/// `q-` and lowercase letters or digits, as `question-event-payloads.v1.json` says.
pub fn valid_id(id: &str) -> bool {
    id.strip_prefix("q-").is_some_and(|rest| {
        !rest.is_empty()
            && rest
                .chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
    })
}
