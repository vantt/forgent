use crate::rules::{packaged_rules, Cardinality, Rule, RuleSet, RuleShape};
use fgos_host_runtime::civil_time::{
    days_from_civil, format_unix_millis_rfc3339, parse_rfc3339_millis,
};
use serde::Serialize;
use std::path::{Component, Path};

#[derive(Debug, Clone)]
pub struct NameInput<'a> {
    pub kind: &'a str,
    pub artifact_type: Option<&'a str>,
    pub slug: &'a str,
    pub at: Option<&'a str>,
    pub now_millis: i64,
    pub local_offset_seconds: i32,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct NameOutcome {
    pub kind: String,
    pub name: String,
    pub at: String,
    pub offset: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct PathOutcome {
    pub kind: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct CheckOutcome {
    pub checked: usize,
    pub violations: Vec<Violation>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct Violation {
    pub path: String,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ClassifyOutcome {
    pub kind: String,
    pub cardinality: Cardinality,
    pub scope: Vec<String>,
}

#[derive(Debug, Clone, thiserror::Error, PartialEq, Eq)]
pub enum ConventionError {
    #[error("invalid-kind: unsupported convention kind '{0}'")]
    InvalidKind(String),
    #[error("invalid-type: report type is empty or malformed")]
    InvalidType,
    #[error("invalid-slug: slug is empty after normalization")]
    InvalidSlug,
    #[error("invalid-at: expected an RFC3339 timestamp with an offset")]
    InvalidAt,
    #[error("invalid-plan-dir: expected YYMMDD-HHMM-slug")]
    InvalidPlanDir,
    #[error("unknown-kind: path does not match a placement rule")]
    UnknownKind,
    #[error("invalid-path: expected a repository-relative path without '..'")]
    InvalidPath,
    #[error("io-error: {0}")]
    Io(String),
}

pub fn convention_name(input: &NameInput<'_>) -> Result<NameOutcome, ConventionError> {
    convention_name_with_rules(packaged_rules(), input)
}

pub fn convention_name_with_rules(
    rules: &RuleSet,
    input: &NameInput<'_>,
) -> Result<NameOutcome, ConventionError> {
    let rule = rules
        .by_kind(input.kind)
        .filter(|rule| rule.shape == RuleShape::NameTemplate)
        .ok_or_else(|| ConventionError::InvalidKind(input.kind.to_owned()))?;
    let slug = normalize_slug(input.slug).ok_or(ConventionError::InvalidSlug)?;
    let artifact_type = match rule
        .template
        .as_deref()
        .unwrap_or_default()
        .contains("{type}")
    {
        true => Some(normalize_type(
            input.artifact_type.ok_or(ConventionError::InvalidType)?,
        )?),
        false => None,
    };
    let (at, offset, stamp) = resolve_time(input)?;
    let name = rule
        .template
        .as_deref()
        .ok_or_else(|| ConventionError::InvalidKind(input.kind.to_owned()))?
        .replace("{type}", artifact_type.as_deref().unwrap_or_default())
        .replace("{YYMMDD-HHMM}", &stamp)
        .replace("{slug}", &slug);
    Ok(NameOutcome {
        kind: rule.kind.clone(),
        name,
        at,
        offset,
    })
}

pub fn convention_path(
    input: &NameInput<'_>,
    plan: Option<&str>,
) -> Result<PathOutcome, ConventionError> {
    let rules = packaged_rules();
    let rule = rules
        .by_kind(input.kind)
        .filter(|rule| rule.shape == RuleShape::NameTemplate)
        .ok_or_else(|| ConventionError::InvalidKind(input.kind.to_owned()))?;
    let named = convention_name_with_rules(rules, input)?;
    let root = if let Some(plan_dir) = plan {
        if !valid_plan_dir(plan_dir) {
            return Err(ConventionError::InvalidPlanDir);
        }
        rule.plan_root_template
            .as_deref()
            .ok_or(ConventionError::InvalidPlanDir)?
            .replace("{plan}", plan_dir)
    } else {
        rule.roots
            .first()
            .cloned()
            .ok_or_else(|| ConventionError::InvalidKind(input.kind.to_owned()))?
    };
    Ok(PathOutcome {
        kind: rule.kind.clone(),
        path: format!("{root}{}", named.name),
    })
}

pub fn check_paths(paths: &[String]) -> Result<CheckOutcome, ConventionError> {
    check_paths_with_rules(packaged_rules(), paths)
}

pub fn check_paths_with_rules(
    rules: &RuleSet,
    paths: &[String],
) -> Result<CheckOutcome, ConventionError> {
    if paths.iter().any(|path| !valid_repo_path(path)) {
        return Err(ConventionError::InvalidPath);
    }
    let violations = paths
        .iter()
        .filter_map(|path| check_path(rules, path))
        .collect();
    Ok(CheckOutcome {
        checked: paths.len(),
        violations,
    })
}

pub fn check_all(root: &Path) -> Result<CheckOutcome, ConventionError> {
    let rules = packaged_rules();
    let mut paths = Vec::new();
    for rule in &rules.rules {
        if rule.shape != RuleShape::NameTemplate {
            continue;
        }
        for scope in &rule.scope {
            let Some(directory) = scope.strip_suffix("*.md") else {
                continue;
            };
            let Some(absolute) = scope_directory_without_symlinks(root, directory)? else {
                continue;
            };
            let entries = match std::fs::read_dir(&absolute) {
                Ok(entries) => entries,
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
                Err(error) => return Err(ConventionError::Io(error.to_string())),
            };
            for entry in entries {
                let entry = entry.map_err(|error| ConventionError::Io(error.to_string()))?;
                let file_type = entry
                    .file_type()
                    .map_err(|error| ConventionError::Io(error.to_string()))?;
                if file_type.is_file() && entry.path().extension().is_some_and(|ext| ext == "md") {
                    paths.push(format!(
                        "{directory}{}",
                        entry.file_name().to_string_lossy()
                    ));
                }
            }
        }
    }
    paths.sort();
    paths.dedup();
    check_paths_with_rules(rules, &paths)
}

fn scope_directory_without_symlinks(
    root: &Path,
    directory: &str,
) -> Result<Option<std::path::PathBuf>, ConventionError> {
    let mut current = root.to_path_buf();
    for component in Path::new(directory.trim_end_matches('/')).components() {
        let Component::Normal(segment) = component else {
            return Ok(None);
        };
        current.push(segment);
        match std::fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.is_dir() && !metadata.file_type().is_symlink() => {}
            Ok(_) => return Ok(None),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(ConventionError::Io(error.to_string())),
        }
    }
    Ok(Some(current))
}

pub fn classify(path: &str) -> Result<ClassifyOutcome, ConventionError> {
    classify_with_rules(packaged_rules(), path)
}

pub fn classify_with_rules(
    rules: &RuleSet,
    path: &str,
) -> Result<ClassifyOutcome, ConventionError> {
    if !valid_repo_path(path) {
        return Err(ConventionError::InvalidPath);
    }
    let mut matches = rules
        .placement_rules()
        .filter_map(|rule| {
            let glob = rule.glob.as_deref()?;
            glob_matches(glob, path).then_some((glob_specificity(glob), rule))
        })
        .collect::<Vec<_>>();
    matches.sort_by(|left, right| right.0.cmp(&left.0));
    let Some((_, rule)) = matches.first() else {
        return Err(ConventionError::UnknownKind);
    };
    Ok(ClassifyOutcome {
        kind: rule.kind.clone(),
        cardinality: rule.cardinality.expect("validated placement rule"),
        scope: rule.scope.clone(),
    })
}

fn resolve_time(input: &NameInput<'_>) -> Result<(String, String, String), ConventionError> {
    let (millis, offset_seconds) = if let Some(at) = input.at {
        (
            parse_rfc3339_millis(at).ok_or(ConventionError::InvalidAt)?,
            parse_offset(at)?,
        )
    } else {
        (input.now_millis, input.local_offset_seconds)
    };
    let at =
        format_unix_millis_rfc3339(millis, offset_seconds).ok_or(ConventionError::InvalidAt)?;
    let offset = format_offset(offset_seconds).ok_or(ConventionError::InvalidAt)?;
    let bytes = at.as_bytes();
    let stamp = format!(
        "{}{}{}{}{}{}-{}{}{}{}",
        bytes[2] as char,
        bytes[3] as char,
        bytes[5] as char,
        bytes[6] as char,
        bytes[8] as char,
        bytes[9] as char,
        bytes[11] as char,
        bytes[12] as char,
        bytes[14] as char,
        bytes[15] as char
    );
    Ok((at, offset, stamp))
}

fn parse_offset(at: &str) -> Result<i32, ConventionError> {
    if at.ends_with('Z') || at.ends_with('z') {
        return Ok(0);
    }
    let suffix = at
        .get(at.len().checked_sub(6).ok_or(ConventionError::InvalidAt)?..)
        .ok_or(ConventionError::InvalidAt)?;
    let bytes = suffix.as_bytes();
    if bytes.len() != 6 || !matches!(bytes[0], b'+' | b'-') || bytes[3] != b':' {
        return Err(ConventionError::InvalidAt);
    }
    let hours: i32 = suffix[1..3]
        .parse()
        .map_err(|_| ConventionError::InvalidAt)?;
    let minutes: i32 = suffix[4..6]
        .parse()
        .map_err(|_| ConventionError::InvalidAt)?;
    let seconds = hours * 3_600 + minutes * 60;
    Ok(if bytes[0] == b'-' { -seconds } else { seconds })
}

fn format_offset(offset_seconds: i32) -> Option<String> {
    if offset_seconds % 60 != 0 || offset_seconds.unsigned_abs() > 23 * 3_600 + 59 * 60 {
        return None;
    }
    let sign = if offset_seconds < 0 { '-' } else { '+' };
    let absolute = offset_seconds.unsigned_abs();
    Some(format!(
        "{sign}{:02}:{:02}",
        absolute / 3_600,
        absolute % 3_600 / 60
    ))
}

fn normalize_type(value: &str) -> Result<String, ConventionError> {
    let normalized = normalize_ascii(value);
    if normalized.is_empty() {
        Err(ConventionError::InvalidType)
    } else {
        Ok(normalized)
    }
}

pub fn normalize_slug(value: &str) -> Option<String> {
    let normalized = normalize_ascii(value);
    (!normalized.is_empty()).then_some(normalized)
}

fn normalize_ascii(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut separator = false;
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() {
            if separator && !output.is_empty() {
                output.push('-');
            }
            output.push((byte as char).to_ascii_lowercase());
            separator = false;
        } else {
            separator = true;
        }
    }
    output.trim_matches('-').to_owned()
}

fn valid_plan_dir(value: &str) -> bool {
    let Some((stamp, slug)) = value.split_once('-').and_then(|(date, rest)| {
        let (time, slug) = rest.split_once('-')?;
        Some((format!("{date}-{time}"), slug))
    }) else {
        return false;
    };
    valid_stamp(&stamp) && normalize_slug(slug).as_deref() == Some(slug)
}

fn check_path(rules: &RuleSet, path: &str) -> Option<Violation> {
    let file_name = path.rsplit('/').next().unwrap_or(path);
    let scoped = rules
        .rules
        .iter()
        .filter(|rule| rule.shape == RuleShape::NameTemplate)
        .filter(|rule| {
            rule.template
                .as_deref()
                .is_some_and(|template| template.ends_with(".md") == file_name.ends_with(".md"))
        })
        .flat_map(|rule| rule.roots.iter().map(move |root| (rule, root)))
        .filter(|(_, root)| path.starts_with(root.as_str()))
        .max_by_key(|(_, root)| root.len());
    if let Some((rule, root)) = scoped {
        return validate_scoped(rule, root, path, file_name);
    }
    if rules
        .rules
        .iter()
        .filter(|rule| rule.shape == RuleShape::NameTemplate)
        .any(|rule| accepted_plan_location(rule, path))
    {
        return None;
    }
    let report = rules.by_kind("report")?;
    if file_name.ends_with(".md") && looks_like_named_file(file_name) {
        return Some(violation(
            path,
            "wrong-location",
            &format!("recognized {} is outside an accepted location", report.kind),
        ));
    }
    None
}

fn accepted_plan_location(rule: &Rule, path: &str) -> bool {
    let Some(template) = rule.plan_root_template.as_deref() else {
        return false;
    };
    let Some((prefix, suffix)) = template.split_once("{plan}") else {
        return false;
    };
    let Some(rest) = path.strip_prefix(prefix) else {
        return false;
    };
    let Some((plan, remainder)) = rest.split_once(suffix) else {
        return false;
    };
    valid_plan_dir(plan) && !remainder.contains('/')
}

fn validate_scoped(rule: &Rule, root: &str, path: &str, file_name: &str) -> Option<Violation> {
    if path[root.len()..].contains('/') {
        return None;
    }
    let result = std::iter::once(match_template(
        rule.template.as_deref().expect("validated name rule"),
        file_name,
        false,
    ))
    .chain(
        rule.compatibility
            .iter()
            .map(|compatibility| match_compatibility(rule, compatibility, file_name)),
    )
    .max();
    match result {
        Some(TemplateMatch::Valid) => None,
        Some(TemplateMatch::InvalidTimestamp) => Some(violation(
            path,
            "invalid-timestamp",
            "timestamp is not a valid civil date and time",
        )),
        _ => Some(violation(
            path,
            "pattern-mismatch",
            "name does not match an accepted template",
        )),
    }
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum TemplateMatch {
    NoMatch,
    InvalidTimestamp,
    Valid,
}

fn match_template(template: &str, file_name: &str, allow_gh_type: bool) -> TemplateMatch {
    if template.contains("{YYMMDD-HHMM}") {
        match_short_timestamp_template(template, file_name, allow_gh_type)
    } else {
        TemplateMatch::NoMatch
    }
}

fn match_compatibility(rule: &Rule, compatibility: &str, file_name: &str) -> TemplateMatch {
    match compatibility {
        "suffix-report" => file_name
            .strip_suffix("-report.md")
            .map(|stem| format!("{stem}.md"))
            .map_or(TemplateMatch::NoMatch, |candidate| {
                match_template(
                    rule.template.as_deref().expect("validated name rule"),
                    &candidate,
                    false,
                )
            }),
        "type-GH-number" => match_template(
            rule.template.as_deref().expect("validated name rule"),
            file_name,
            true,
        ),
        "YYYY-MM-DD-slug" => match_legacy_date_name(file_name),
        _ => TemplateMatch::NoMatch,
    }
}

fn match_short_timestamp_template(
    template: &str,
    file_name: &str,
    allow_gh_type: bool,
) -> TemplateMatch {
    let Some((prefix_template, suffix_template)) = template.split_once("{YYMMDD-HHMM}") else {
        return TemplateMatch::NoMatch;
    };
    let mut matched_invalid_timestamp = false;
    for start in 0..=file_name.len().saturating_sub(11) {
        let Some(stamp) = short_timestamp_at(file_name, start) else {
            continue;
        };
        if template_prefix_matches(prefix_template, &file_name[..start], allow_gh_type)
            && template_slug_suffix_matches(suffix_template, &file_name[start + stamp.len()..])
        {
            if valid_stamp(stamp) {
                return TemplateMatch::Valid;
            }
            matched_invalid_timestamp = true;
        }
    }
    if matched_invalid_timestamp {
        TemplateMatch::InvalidTimestamp
    } else {
        TemplateMatch::NoMatch
    }
}

fn find_short_timestamp(file_name: &str) -> Option<(usize, &str)> {
    (0..=file_name.len().saturating_sub(11))
        .find_map(|start| short_timestamp_at(file_name, start).map(|stamp| (start, stamp)))
}

fn short_timestamp_at(file_name: &str, start: usize) -> Option<&str> {
    let candidate = file_name.get(start..start + 11)?;
    (candidate.as_bytes().get(6) == Some(&b'-')
        && candidate
            .bytes()
            .enumerate()
            .all(|(index, byte)| index == 6 || byte.is_ascii_digit()))
    .then_some(candidate)
}

fn template_prefix_matches(template: &str, value: &str, allow_gh_type: bool) -> bool {
    let Some((before, after)) = template.split_once("{type}") else {
        return template == value;
    };
    let Some(inner) = value
        .strip_prefix(before)
        .and_then(|value| value.strip_suffix(after))
    else {
        return false;
    };
    normalize_type(inner).ok().as_deref() == Some(inner)
        || (allow_gh_type
            && inner.strip_prefix("GH-").is_some_and(|number| {
                !number.is_empty() && number.bytes().all(|byte| byte.is_ascii_digit())
            }))
}

fn template_slug_suffix_matches(template: &str, value: &str) -> bool {
    let Some((before, after)) = template.split_once("{slug}") else {
        return template == value;
    };
    let Some(slug) = value
        .strip_prefix(before)
        .and_then(|value| value.strip_suffix(after))
    else {
        return false;
    };
    normalize_slug(slug).as_deref() == Some(slug)
}

fn match_legacy_date_name(file_name: &str) -> TemplateMatch {
    let Some(date) = file_name.get(..10) else {
        return TemplateMatch::NoMatch;
    };
    let Some(slug) = file_name
        .get(10..)
        .and_then(|suffix| suffix.strip_prefix('-'))
        .and_then(|suffix| suffix.strip_suffix(".md"))
    else {
        return TemplateMatch::NoMatch;
    };
    if date.as_bytes().get(4) != Some(&b'-')
        || date.as_bytes().get(7) != Some(&b'-')
        || normalize_slug(slug).as_deref() != Some(slug)
    {
        return TemplateMatch::NoMatch;
    }
    if days_from_civil(
        date[0..4].parse().unwrap_or_default(),
        date[5..7].parse().unwrap_or_default(),
        date[8..10].parse().unwrap_or_default(),
    )
    .is_some()
    {
        TemplateMatch::Valid
    } else {
        TemplateMatch::InvalidTimestamp
    }
}

fn valid_stamp(stamp: &str) -> bool {
    if stamp.len() != 11 || stamp.as_bytes()[6] != b'-' {
        return false;
    }
    let year = stamp[0..2].parse::<i64>().ok().map(|year| 2000 + year);
    let month = stamp[2..4].parse::<u32>().ok();
    let day = stamp[4..6].parse::<u32>().ok();
    let hour = stamp[7..9].parse::<u32>().ok();
    let minute = stamp[9..11].parse::<u32>().ok();
    matches!((year, month, day, hour, minute), (Some(y), Some(m), Some(d), Some(h), Some(min)) if days_from_civil(y, m, d).is_some() && h <= 23 && min <= 59)
}

fn looks_like_named_file(file_name: &str) -> bool {
    file_name.ends_with(".md") && find_short_timestamp(file_name).is_some()
}

fn valid_repo_path(value: &str) -> bool {
    if value.is_empty() || value.contains('\\') || Path::new(value).is_absolute() {
        return false;
    }
    Path::new(value)
        .components()
        .all(|component| matches!(component, Component::Normal(_)))
}

fn violation(path: &str, code: &str, message: &str) -> Violation {
    Violation {
        path: path.to_owned(),
        code: code.to_owned(),
        message: message.to_owned(),
    }
}

fn glob_matches(glob: &str, path: &str) -> bool {
    let pattern = glob.split('/').collect::<Vec<_>>();
    let segments = path.split('/').collect::<Vec<_>>();
    glob_segments_match(&pattern, &segments)
}

fn glob_segments_match(pattern: &[&str], segments: &[&str]) -> bool {
    match pattern.split_first() {
        None => segments.is_empty(),
        Some((&"**", rest)) => {
            glob_segments_match(rest, segments)
                || (!segments.is_empty() && glob_segments_match(pattern, &segments[1..]))
        }
        Some((head, rest)) if !segments.is_empty() && segment_matches(head, segments[0]) => {
            glob_segments_match(rest, &segments[1..])
        }
        _ => false,
    }
}

fn segment_matches(pattern: &str, segment: &str) -> bool {
    pattern == "*"
        || (pattern.starts_with('<') && pattern.ends_with('>') && !segment.is_empty())
        || pattern == segment
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
