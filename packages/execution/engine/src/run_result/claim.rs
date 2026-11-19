//! The worker's agent-result claim: its v2 shape, the instructions derived from that same shape, and who must
//! assess. A claim is untrusted input; this module creates no proof, evidence or Run Result.

use super::js::{js_json, non_empty_string, plain_object, str_of};
use super::vocabulary::ASSESSMENT_VERDICTS;
use serde_json::Value;

pub const AGENT_RESULT_CLAIM_CONTRACT_ID: &str = "agent-result-claim";
pub const AGENT_RESULT_CLAIM_CONTRACT_VERSION: u64 = 2;
pub const ALLOWED_AGENT_CLAIM_STATUSES: [&str; 4] = ["done", "blocked", "failed", "no-evidence"];
/// Bounds on the worker's friction list: the entries recorded per claim, and the length of kind, layer and errorClass.
pub const CLAIM_FRICTIONS_MAX: usize = 5;
pub const CLAIM_FRICTION_FIELD_MAX: usize = 80;
/// The field `assessment.verdict` of a claim, named in its instructions and its refusals.
pub const ASSESSMENT_VERDICT_PATH: &str = "assessment.verdict";

/// One field of the claim, with the words the worker is told.
pub struct ClaimFieldRule {
    pub path: &'static str,
    pub description: String,
}

/// The rules of every claim field, in the order the worker reads them.
pub fn claim_field_rules() -> Vec<ClaimFieldRule> {
    let rule = |path: &'static str, description: String| ClaimFieldRule { path, description };
    vec![
        rule("status", format!("exactly one of: {}", ALLOWED_AGENT_CLAIM_STATUSES.join(" | "))),
        rule("summary", "a required non-empty string".to_string()),
        rule("blocker", "a non-empty string when status is \"blocked\"".to_string()),
        rule("error", "a non-empty string or object when status is \"failed\"".to_string()),
        rule("evidenceRefs", "an array of non-empty strings if provided".to_string()),
        // A request, not a write: files outside the declared write scope the worker needed and left alone.
        // Never checked, so a claim that carries it is exactly as valid as one that does not.
        rule("needsWrites", "an array of repo-relative paths if provided: files outside your write scope you needed to write and did not".to_string()),
        // A side channel recorded after the outcome is settled; a malformed entry, or one past the limit, is
        // skipped there and never makes the claim invalid.
        rule(
            "frictions",
            format!(
                "an array of at most {CLAIM_FRICTIONS_MAX} entries if provided: each obstacle you met (a workaround, conflicting rules, a missing tool, a wrong or stale doc, a wait or retry) as {{\"kind\": bug|instability|missing|awkward|doc, \"layer\": <the layer it sits in>, \"errorClass\": <a short lowercase-hyphenated signature naming the kind of obstacle, the same one each time the same obstacle recurs>, \"detail\": <one or two sentences>}}; kind, layer and errorClass are single lines of at most {CLAIM_FRICTION_FIELD_MAX} characters that do not start with \"-\"; entries past the limit are dropped and recording never changes your result"
            ),
        ),
    ]
}

/// The report that goes with a claim: `result-<N>.json` pairs with `report-<N>.md` beside it (the agent protocol's names).
pub fn claim_report_path(claim_path: &str) -> String {
    let (dir, base) = match claim_path.rfind('/') {
        Some(at) => (&claim_path[..at], &claim_path[at + 1..]),
        None => ("", claim_path),
    };
    let round = base
        .strip_prefix("result-")
        .and_then(|rest| rest.strip_suffix(".json"))
        .filter(|digits| !digits.is_empty() && digits.bytes().all(|b| b.is_ascii_digit()))
        .unwrap_or("1");
    // `path.join(dirname, name)`: a bare name has dirname ".", which joins away.
    match (claim_path.rfind('/'), dir) {
        (None, _) => format!("report-{round}.md"),
        (Some(_), "") => format!("/report-{round}.md"),
        (Some(_), dir) => format!("{dir}/report-{round}.md"),
    }
}

/// What the claim's assignment says about who judges: the declared role, the operation and, for a seat of a unit
/// run, whether its posture is a verdict.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ClaimContext {
    pub role: Option<String>,
    pub operation: Option<String>,
    /// `Some` when the assignment names a posture; true when that posture is a verdict.
    pub posture_verdict: Option<bool>,
}

/// Whether the assignment's result is a checker's verdict. A seat of a unit run says so through its posture
/// (`tester` is a checker seat whose posture is not a verdict); an assignment that names no posture, such as a
/// domain operation's, is a verdict when its declared role is a checker role.
pub fn is_verdict_seat(context: &ClaimContext) -> bool {
    match context.posture_verdict {
        Some(verdict) => verdict,
        None => matches!(context.role.as_deref(), Some("reviewer" | "red-team")),
    }
}

pub fn is_assessment_required(context: &ClaimContext) -> bool {
    is_verdict_seat(context)
        || context
            .operation
            .as_deref()
            .is_some_and(|op| op.contains("recheck"))
}

/// Render only claim instructions. Callers own artifact paths and surrounding prose.
pub fn render_agent_result_claim_instructions(context: &ClaimContext) -> String {
    let mut lines = vec![format!(
        "- \"contract\" may be omitted only for legacy claim input; for v2 use {{\"id\":\"{AGENT_RESULT_CLAIM_CONTRACT_ID}\",\"version\":{AGENT_RESULT_CLAIM_CONTRACT_VERSION}}}"
    )];
    lines.extend(
        claim_field_rules()
            .iter()
            .map(|field| format!("- \"{}\" must be {}", field.path, field.description)),
    );
    lines.push("- Nothing in this claim is proof; evidenceRefs remain untrusted until independently validated".to_string());
    if is_assessment_required(context) {
        lines.push(format!(
            "- \"{ASSESSMENT_VERDICT_PATH}\" is required for this assessment role and must be one of: {}",
            ASSESSMENT_VERDICTS.join(" | ")
        ));
    }
    lines.join("\n")
}

/// The answer of [`validate_agent_result_claim_contract`]: `reason` names the first rule a refused claim broke.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaimValidation {
    pub valid: bool,
    pub reason: Option<String>,
}

fn refuse(reason: String) -> ClaimValidation {
    ClaimValidation {
        valid: false,
        reason: Some(reason),
    }
}

/// Validate an untrusted claim. A missing `contract` is read as a legacy claim and checked only against the legacy
/// fields; it is never upgraded to a v2 claim or proof. A present contract must be exactly this v2 contract.
/// Unknown fields, including the optional passive `stance`, never change validity.
pub fn validate_agent_result_claim_contract(
    value: &Value,
    context: &ClaimContext,
) -> ClaimValidation {
    let Some(claim) = value.as_object() else {
        return refuse("agent-result.json must be a JSON object".to_string());
    };
    let legacy = !claim.contains_key("contract");
    if !legacy {
        let contract = claim.get("contract");
        let exact = plain_object(contract)
            && contract.and_then(|c| c.get("id")).and_then(Value::as_str)
                == Some(AGENT_RESULT_CLAIM_CONTRACT_ID)
            && contract
                .and_then(|c| c.get("version"))
                .and_then(Value::as_u64)
                == Some(AGENT_RESULT_CLAIM_CONTRACT_VERSION);
        if !exact {
            return refuse(format!(
                "agent-result.json contract must be {{id:\"{AGENT_RESULT_CLAIM_CONTRACT_ID}\",version:{AGENT_RESULT_CLAIM_CONTRACT_VERSION}}}"
            ));
        }
    }
    let rules = claim_field_rules();
    let description = |path: &str| {
        rules
            .iter()
            .find(|r| r.path == path)
            .map(|r| r.description.clone())
            .unwrap_or_default()
    };
    let status = str_of(claim.get("status"));
    if !status.is_some_and(|s| ALLOWED_AGENT_CLAIM_STATUSES.contains(&s)) {
        return refuse(format!(
            "agent-result.json status must be one of [{}]; got: {}",
            ALLOWED_AGENT_CLAIM_STATUSES.join(", "),
            js_json(claim.get("status"))
        ));
    }
    if !non_empty_string(claim.get("summary")) {
        return refuse(format!(
            "agent-result.json requires non-empty summary ({})",
            description("summary")
        ));
    }
    if status == Some("blocked") && !non_empty_string(claim.get("blocker")) {
        return refuse(format!(
            "agent-result.json with status \"blocked\" requires blocker: {}",
            description("blocker")
        ));
    }
    let error = claim.get("error");
    let valid_error = if legacy {
        non_empty_string(error)
    } else {
        non_empty_string(error) || plain_object(error)
    };
    if status == Some("failed") && !valid_error {
        return refuse(format!(
            "agent-result.json with status \"failed\" requires error: {}",
            description("error")
        ));
    }
    if let Some(refs) = claim.get("evidenceRefs") {
        let all_text = refs
            .as_array()
            .is_some_and(|items| items.iter().all(|r| non_empty_string(Some(r))));
        if !all_text {
            return refuse(format!(
                "agent-result.json evidenceRefs must be {}",
                description("evidenceRefs")
            ));
        }
    }
    if !legacy && is_assessment_required(context) {
        let verdict = claim
            .get("assessment")
            .filter(|a| plain_object(Some(a)))
            .and_then(|a| a.get("verdict"))
            .and_then(Value::as_str);
        if !verdict.is_some_and(|v| ASSESSMENT_VERDICTS.contains(&v)) {
            return refuse(format!(
                "agent-result.json for this assessment role requires {ASSESSMENT_VERDICT_PATH} one of [{}]",
                ASSESSMENT_VERDICTS.join(", ")
            ));
        }
    }
    ClaimValidation {
        valid: true,
        reason: None,
    }
}
