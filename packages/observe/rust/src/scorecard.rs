//! Scorecard computation for Observe (Phase F4).
//!
//! Pure computation functions: `compute_*(&[Observation], ...) -> Section`.
//! Test guarantees NO `std::fs` is used in this module.

use crate::case_journal::CaseWindow;
use crate::contract::Observation;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CaseSection {
    pub name: String,
    pub harness: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verdict: Option<String>,
    pub interventions_manual: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_min: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct RunStatusBuckets {
    pub total: u64,
    pub ok: u64,
    pub exec_failed: u64,
    pub verdict_fail: u64,
    pub inconclusive: u64,
    pub blocked: u64,
    pub policy_refused: u64,
    pub unclassified: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RunsSection {
    pub total: u64,
    pub unclassified_rate: f64,
    pub overall: RunStatusBuckets,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub by_executor: BTreeMap<String, RunStatusBuckets>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub by_adapter: BTreeMap<String, RunStatusBuckets>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub by_role: BTreeMap<String, RunStatusBuckets>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SessionsSection {
    pub estimate: bool,
    pub total_evaluated: u64,
    pub active_count: u64,
    pub assignments_p50: f64,
    pub assignments_p90: f64,
    pub duration_sec_p50: f64,
    pub duration_sec_p90: f64,
    pub first_pass_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct TokensSection {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_creation_input_tokens: u64,
    pub cache_read_input_tokens: u64,
    pub total_tokens: u64,
    pub session_count: u64,
    pub message_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct CommitsSection {
    pub count: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_at_open: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_at_close: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FaultsSection {
    pub total: u64,
    pub by_class: BTreeMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct PercentileStats {
    pub p50: f64,
    pub p90: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct MeanP90Stats {
    pub mean: f64,
    pub p90: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct WorkSection {
    pub total_evaluated: u64,
    pub add_to_delivered_hours: PercentileStats,
    pub doing_to_awaiting_approval_hours: PercentileStats,
    pub interventions_per_item: MeanP90Stats,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ComplexitySection {
    pub lines_of_code: LocBreakdown,
    pub protocols_used: u64,
    pub protocols_defined: u64,
    pub native_routes: usize,
    pub total_routes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct LocBreakdown {
    pub total: u64,
    pub runner: u64,
    pub packages: u64,
    pub apps: u64,
    pub herdr_plugin: u64,
    pub tests: u64,
    pub other: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Scorecard {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub case: Option<CaseSection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runs: Option<Value>, // Value::String("n/a") or RunsSection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sessions: Option<Value>, // Value::String("n/a") or SessionsSection
    pub tokens: TokensSection,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commits: Option<CommitsSection>,
    pub friction: Value, // "n/a (pre-F5)"
    pub complexity: ComplexitySection,
    pub work: Option<Value>, // Value::String("n/a") or WorkSection
    pub faults: FaultsSection,
    pub warnings: Vec<String>,
}
fn parse_iso_secs(s: &str) -> Option<i64> {
    // s is e.g. "2026-09-01T10:00:00.000Z" or "2026-09-01T10:00:00Z"
    if s.len() < 19 {
        return None;
    }
    let y: i64 = s.get(0..4)?.parse().ok()?;
    let m: i64 = s.get(5..7)?.parse().ok()?;
    let d: i64 = s.get(8..10)?.parse().ok()?;
    let hour: i64 = s.get(11..13)?.parse().ok()?;
    let min: i64 = s.get(14..16)?.parse().ok()?;
    let sec: i64 = s.get(17..19)?.parse().ok()?;

    // Howard Hinnant's inverse algorithm
    let y_adj = if m <= 2 { y - 1 } else { y };
    let m_adj = if m <= 2 { m + 9 } else { m - 3 };
    let era = (if y_adj >= 0 { y_adj } else { y_adj - 399 }) / 400;
    let yoe = (y_adj - era * 400) as u32;
    let doy = (153 * m_adj + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy as u32;
    let days = era * 146097 + doe as i64 - 719468;

    Some(days * 86400 + hour * 3600 + min * 60 + sec)
}

fn now_unix_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Compute case section from CaseWindow
pub fn compute_case(cw: &CaseWindow) -> (CaseSection, Vec<String>) {
    let mut warnings = Vec::new();
    let duration_min = if let (Some(until_str), since_str) = (&cw.until, &cw.since) {
        if let (Some(t0), Some(t1)) = (parse_iso_secs(since_str), parse_iso_secs(until_str)) {
            let diff_sec = (t1 - t0).max(0);
            let min = (diff_sec as f64) / 60.0;
            if min > 24.0 * 60.0 {
                warnings.push(format!("case \"{}\" was open for more than 24 hours ({:.1}h)", cw.name, min / 60.0));
            }
            Some(min)
        } else {
            None
        }
    } else {
        // Still open
        if let Some(t0) = parse_iso_secs(&cw.since) {
            let now = now_unix_secs();
            let min = ((now - t0).max(0) as f64) / 60.0;
            if min > 24.0 * 60.0 {
                warnings.push(format!("case \"{}\" currently open for more than 24 hours ({:.1}h)", cw.name, min / 60.0));
            }
            Some(min)
        } else {
            None
        }
    };

    (
        CaseSection {
            name: cw.name.clone(),
            harness: cw.harness.clone(),
            task: cw.task.clone(),
            verdict: cw.verdict.clone(),
            interventions_manual: cw.interventions.unwrap_or(0),
            duration_min,
        },
        warnings,
    )
}

/// Compute runs section (#4)
pub fn compute_runs(observations: &[Observation]) -> RunsSection {
    let mut overall = RunStatusBuckets::default();
    let mut by_executor: BTreeMap<String, RunStatusBuckets> = BTreeMap::new();
    let mut by_adapter: BTreeMap<String, RunStatusBuckets> = BTreeMap::new();
    let mut by_role: BTreeMap<String, RunStatusBuckets> = BTreeMap::new();

    for obs in observations {
        if obs.source != "run-result" || obs.kind != "run.settled" {
            continue;
        }
        let executor = obs.attrs.get("executor")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        let adapter = obs.attrs.get("adapter")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let role = obs.attrs.get("role")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let classification = obs.attrs.get("classification").and_then(|v| v.as_object());

        let category = obs.attrs.get("category").and_then(|v| v.as_str()).or_else(|| {
            classification
                .and_then(|c| c.get("outcome"))
                .and_then(|o| o.get("category"))
                .and_then(|s| s.as_str())
        });
        let verdict = classification
            .and_then(|c| c.get("assessment"))
            .and_then(|a| a.get("verdict"))
            .and_then(|v| v.as_str())
            .unwrap_or("");

        // Helper to update bucket based on category (single path)
        let classify = |b: &mut RunStatusBuckets| {
            b.total += 1;
            if let Some(cat) = category {
                match cat {
                    "ok" => b.ok += 1,
                    "infra" | "corrupt" => b.exec_failed += 1,
                    "policy" => b.policy_refused += 1,
                    "blocked" => b.blocked += 1,
                    "verdict" => {
                        if verdict == "inconclusive" {
                            b.inconclusive += 1;
                        } else {
                            b.verdict_fail += 1;
                        }
                    }
                    _ => b.unclassified += 1,
                }
            } else if let Some(cls) = classification {
                let exec_status = cls.get("execution")
                    .and_then(|e| e.get("status"))
                    .and_then(|s| s.as_str())
                    .unwrap_or("unknown");
                let policy_disp = cls.get("policy")
                    .and_then(|p| p.get("disposition"))
                    .and_then(|d| d.as_str())
                    .unwrap_or("allow");

                if exec_status != "completed" {
                    b.exec_failed += 1;
                } else if policy_disp == "refuse" {
                    b.policy_refused += 1;
                } else if policy_disp == "needs-input" {
                    b.exec_failed += 1;
                } else if verdict == "findings" {
                    b.verdict_fail += 1;
                } else if verdict == "blocked" {
                    b.blocked += 1;
                } else if verdict == "pass" || verdict == "not-applicable" {
                    b.ok += 1;
                } else if verdict == "inconclusive" {
                    b.inconclusive += 1;
                } else {
                    b.unclassified += 1;
                }
            } else {
                b.unclassified += 1;
            }
        };

        classify(&mut overall);
        classify(by_executor.entry(executor).or_default());
        if let Some(ad) = adapter {
            classify(by_adapter.entry(ad).or_default());
        }
        if let Some(ro) = role {
            classify(by_role.entry(ro).or_default());
        }
    }

    let unclassified_rate = if overall.total > 0 {
        (overall.unclassified as f64) / (overall.total as f64)
    } else {
        0.0
    };

    RunsSection {
        total: overall.total,
        unclassified_rate,
        overall,
        by_executor,
        by_adapter,
        by_role,
    }
}

fn percentile(mut vals: Vec<f64>, p: f64) -> f64 {
    if vals.is_empty() {
        return 0.0;
    }
    vals.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let idx = ((vals.len() as f64) * p / 100.0).ceil() as usize;
    if idx == 0 {
        vals[0]
    } else {
        vals[(idx - 1).min(vals.len() - 1)]
    }
}

/// Compute sessions section (#3, estimate: true)
pub fn compute_sessions(observations: &[Observation]) -> SessionsSection {
    // 1. Group observations by session id
    let mut session_obs: HashMap<String, Vec<&Observation>> = HashMap::new();
    for obs in observations {
        if obs.source == "coordination" && obs.subject.kind == crate::contract::SubjectKind::Session {
            session_obs.entry(obs.subject.id.clone()).or_default().push(obs);
        }
    }

    let mut total_evaluated = 0u64;
    let mut active_count = 0u64;
    let mut first_pass_count = 0u64;
    let mut assignments_counts = Vec::new();
    let mut durations_sec = Vec::new();

    for (_sess_id, events) in session_obs {
        let result_linked_events: Vec<&&Observation> = events
            .iter()
            .filter(|e| e.kind == "session.result_linked")
            .collect();

        if result_linked_events.is_empty() {
            // "Session có result-linked trong khung"
            continue;
        }

        total_evaluated += 1;

        // Check if session is active or terminal
        let terminal_event = events.iter().find(|e| e.kind == "session.closed");
        let is_active = terminal_event.is_none();
        if is_active {
            active_count += 1;
        }

        // Assignment count
        let asgn_count = events.iter().filter(|e| e.kind == "session.assignment").count() as f64;
        assignments_counts.push(asgn_count);

        // Duration: from first result-linked to last result-linked
        let mut rl_ts: Vec<i64> = result_linked_events
            .iter()
            .filter_map(|e| parse_iso_secs(&e.ts))
            .collect();
        rl_ts.sort_unstable();
        if let (Some(&first), Some(&last)) = (rl_ts.first(), rl_ts.last()) {
            let diff = (last - first).max(0) as f64;
            durations_sec.push(diff);
        }

        // firstPass = không có assignment của actor fixer và status completed hoặc partial
        let has_fixer = events.iter().any(|e| {
            e.kind == "session.assignment"
                && e.attrs.get("actorId").and_then(|v| v.as_str()) == Some("fixer")
        });

        let status = terminal_event.and_then(|e| e.attrs.get("status")).and_then(|v| v.as_str());
        let is_completed_or_partial = matches!(status, Some("completed") | Some("partial"));

        if !has_fixer && is_completed_or_partial {
            first_pass_count += 1;
        }
    }

    let assignments_p50 = percentile(assignments_counts.clone(), 50.0);
    let assignments_p90 = percentile(assignments_counts, 90.0);
    let duration_sec_p50 = percentile(durations_sec.clone(), 50.0);
    let duration_sec_p90 = percentile(durations_sec, 90.0);

    SessionsSection {
        estimate: true,
        total_evaluated,
        active_count,
        assignments_p50,
        assignments_p90,
        duration_sec_p50,
        duration_sec_p90,
        first_pass_count,
    }
}

/// Compute tokens section
pub fn compute_tokens(observations: &[Observation]) -> TokensSection {
    let mut sec = TokensSection::default();
    let mut sessions = std::collections::HashSet::new();

    for obs in observations {
        if obs.source == "claude-transcripts" && obs.kind == "llm.usage" {
            sec.message_count += 1;
            if let Some(s) = obs.attrs.get("sessionId").and_then(|v| v.as_str()) {
                sessions.insert(s.to_string());
            }

            if let Some(inp) = obs.attrs.get("input_tokens").or_else(|| obs.attrs.get("inputTokens")).and_then(|v| v.as_u64()) {
                sec.input_tokens += inp;
            }
            if let Some(out) = obs.attrs.get("output_tokens").or_else(|| obs.attrs.get("outputTokens")).and_then(|v| v.as_u64()) {
                sec.output_tokens += out;
            }
            if let Some(c_create) = obs.attrs.get("cache_creation").or_else(|| obs.attrs.get("cacheCreationInputTokens")).and_then(|v| v.as_u64()) {
                sec.cache_creation_input_tokens += c_create;
            }
            if let Some(c_read) = obs.attrs.get("cache_read").or_else(|| obs.attrs.get("cacheReadInputTokens")).and_then(|v| v.as_u64()) {
                sec.cache_read_input_tokens += c_read;
            }
        } else if obs.source == "run-result" && obs.kind == "run.settled" {
            // Token usage from RunResult for non-Claude executors
            if let Some(usage) = obs.attrs.get("usage").and_then(|v| v.as_object()) {
                let usage_source = usage.get("source").and_then(|v| v.as_str());
                if usage_source != Some("transcript") {
                    let inp = usage.get("inputTokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    let out = usage.get("outputTokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    let c_create = usage.get("cacheCreationTokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    let c_read = usage.get("cacheReadTokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    let tot = usage.get("totalTokens").and_then(|v| v.as_u64()).unwrap_or(0);

                    sec.input_tokens += inp;
                    sec.output_tokens += out;
                    sec.cache_creation_input_tokens += c_create;
                    sec.cache_read_input_tokens += c_read;

                    let part_sum = inp + out + c_create + c_read;
                    if tot > part_sum {
                        sec.input_tokens += tot - part_sum;
                    }
                    if inp > 0 || out > 0 || tot > 0 {
                        sec.message_count += 1;
                    }
                }
            }
        }
    }
    sec.session_count = sessions.len() as u64;
    sec.total_tokens = sec.input_tokens + sec.output_tokens + sec.cache_creation_input_tokens + sec.cache_read_input_tokens;
    sec
}

/// Compute faults section
pub fn compute_faults(observations: &[Observation]) -> FaultsSection {
    let mut total = 0u64;
    let mut by_class = BTreeMap::new();

    for obs in observations {
        if obs.source == "invocation-faults" && obs.kind == "host.fault" {
            total += 1;
            let fault_class = obs.attrs.get("faultClass")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();
            *by_class.entry(fault_class).or_insert(0) += 1;
        }
    }

    FaultsSection { total, by_class }
}

/// Compute work section (#1 and #2)
pub fn compute_work(
    observations: &[Observation],
    case_items: Option<&[String]>,
    window: &crate::contract::Window,
) -> WorkSection {
    // Group work observations by item ID
    let mut work_obs_map: HashMap<String, Vec<&Observation>> = HashMap::new();
    for obs in observations {
        if obs.source == "work" && obs.subject.kind == crate::contract::SubjectKind::Work {
            work_obs_map.entry(obs.subject.id.clone()).or_default().push(obs);
        }
    }

    let mut add_to_delivered_hours = Vec::new();
    let mut doing_to_approval_hours = Vec::new();
    let mut interventions_list = Vec::new();
    let mut evaluated_count = 0u64;

    let filter_items = case_items.map(|items| {
        items.iter().cloned().collect::<std::collections::HashSet<String>>()
    });

    for (id, obs_list) in &work_obs_map {
        let mut moves: Vec<&Observation> = Vec::new();
        let mut added_ts: Option<&str> = None;
        let mut asked_count = 0u64;
        let mut answered_count = 0u64;
        let mut gate_approved_count = 0u64;

        for obs in obs_list {
            match obs.kind.as_str() {
                "work.added" => {
                    if added_ts.is_none() || obs.ts.as_str() < added_ts.unwrap() {
                        added_ts = Some(&obs.ts);
                    }
                }
                "work.moved" => {
                    moves.push(obs);
                }
                "work.asked" => {
                    asked_count += 1;
                }
                "work.answered" => {
                    answered_count += 1;
                }
                "work.gate-approved" => {
                    gate_approved_count += 1;
                }
                _ => {}
            }
        }

        moves.sort_by(|a, b| a.ts.cmp(&b.ts));

        // Check if item qualifies:
        // If case_items is specified, item must be in case_items.
        // Otherwise, item must have -> delivered within window.
        let delivered_move = moves.iter().find(|m| {
            m.attrs.get("to").and_then(|v| v.as_str()) == Some("delivered")
        });

        let qualifies = if let Some(items_set) = &filter_items {
            items_set.contains(id)
        } else if let Some(dm) = delivered_move {
            let ts = dm.ts.as_str();
            let after_since = window.since.as_ref().map(|s| ts >= s.as_str()).unwrap_or(true);
            let before_until = window.until.as_ref().map(|u| ts <= u.as_str()).unwrap_or(true);
            after_since && before_until
        } else {
            false
        };

        if qualifies {
            evaluated_count += 1;

            // #1: add -> delivered
            if let Some(dm) = delivered_move {
                if let (Some(t_add), Some(t_del)) = (
                    added_ts.and_then(parse_iso_secs),
                    parse_iso_secs(&dm.ts),
                ) {
                    let diff_hours = ((t_del - t_add).max(0) as f64) / 3600.0;
                    add_to_delivered_hours.push(diff_hours);
                }
            }

            // #2: interventions count
            let total_interventions = asked_count + answered_count + gate_approved_count;
            interventions_list.push(total_interventions as f64);
        }

        // doing -> awaiting-approval
        for (i, m) in moves.iter().enumerate() {
            let from = m.attrs.get("from").and_then(|v| v.as_str());
            let to = m.attrs.get("to").and_then(|v| v.as_str());
            if from == Some("doing") && to == Some("awaiting-approval") {
                // Check window for this transition if not filtered by case_items
                let in_window = if filter_items.is_some() {
                    qualifies
                } else {
                    let ts = m.ts.as_str();
                    let after_since = window.since.as_ref().map(|s| ts >= s.as_str()).unwrap_or(true);
                    let before_until = window.until.as_ref().map(|u| ts <= u.as_str()).unwrap_or(true);
                    after_since && before_until
                };

                if in_window {
                    let prev_doing = moves[..i].iter().rev().find(|prev| {
                        prev.attrs.get("to").and_then(|v| v.as_str()) == Some("doing")
                    });
                    if let Some(pd) = prev_doing {
                        if let (Some(t_start), Some(t_end)) = (
                            parse_iso_secs(&pd.ts),
                            parse_iso_secs(&m.ts),
                        ) {
                            let diff_hours = ((t_end - t_start).max(0) as f64) / 3600.0;
                            doing_to_approval_hours.push(diff_hours);
                        }
                    }
                }
            }
        }
    }

    let add_del_p50 = percentile(add_to_delivered_hours.clone(), 50.0);
    let add_del_p90 = percentile(add_to_delivered_hours, 90.0);

    let doing_app_p50 = percentile(doing_to_approval_hours.clone(), 50.0);
    let doing_app_p90 = percentile(doing_to_approval_hours, 90.0);

    let mean_interventions = if !interventions_list.is_empty() {
        interventions_list.iter().sum::<f64>() / (interventions_list.len() as f64)
    } else {
        0.0
    };
    let p90_interventions = percentile(interventions_list, 90.0);

    WorkSection {
        total_evaluated: evaluated_count,
        add_to_delivered_hours: PercentileStats {
            p50: (add_del_p50 * 100.0).round() / 100.0,
            p90: (add_del_p90 * 100.0).round() / 100.0,
        },
        doing_to_awaiting_approval_hours: PercentileStats {
            p50: (doing_app_p50 * 100.0).round() / 100.0,
            p90: (doing_app_p90 * 100.0).round() / 100.0,
        },
        interventions_per_item: MeanP90Stats {
            mean: (mean_interventions * 100.0).round() / 100.0,
            p90: (p90_interventions * 100.0).round() / 100.0,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::contract::{Subject, SubjectKind};
    use serde_json::json;

    #[test]
    fn test_no_std_fs_in_scorecard_source() {
        let src = include_str!("scorecard.rs");
        // Split out the unit test section at mod tests
        let prod_src = match src.split_once("mod tests") {
            Some((before, _)) => before,
            None => src,
        };
        for line in prod_src.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("//") {
                continue;
            }
            assert!(
                !trimmed.contains("std::fs") && !trimmed.contains("use std::fs"),
                "scorecard.rs must not contain std::fs references: {}",
                line
            );
        }
    }

    #[test]
    fn test_compute_case() {
        let cw = CaseWindow {
            name: "test-case-1".to_string(),
            project: "forgentX".to_string(),
            harness: "fgos".to_string(),
            task: Some("Test task description".to_string()),
            since: "2026-09-01T10:00:00.000Z".to_string(),
            until: Some("2026-09-01T11:30:00.000Z".to_string()),
            head_at_open: Some("abc".to_string()),
            head_at_close: Some("def".to_string()),
            interventions: Some(3),
            verdict: Some("usable".to_string()),
            note: None,
            items: vec![],
            sessions: vec![],
            unit_runs: vec![],
        };

        let (sec, warnings) = compute_case(&cw);
        assert_eq!(sec.name, "test-case-1");
        assert_eq!(sec.harness, "fgos");
        assert_eq!(sec.task.as_deref(), Some("Test task description"));
        assert_eq!(sec.verdict.as_deref(), Some("usable"));
        assert_eq!(sec.interventions_manual, 3);
        assert_eq!(sec.duration_min, Some(90.0));
        assert!(warnings.is_empty());
    }

    #[test]
    fn test_compute_case_warning_over_24h() {
        let cw = CaseWindow {
            name: "long-case".to_string(),
            project: "forgentX".to_string(),
            harness: "fgos".to_string(),
            task: None,
            since: "2026-09-01T00:00:00.000Z".to_string(),
            until: Some("2026-09-02T02:00:00.000Z".to_string()), // 26h
            head_at_open: None,
            head_at_close: None,
            interventions: None,
            verdict: None,
            note: None,
            items: vec![],
            sessions: vec![],
            unit_runs: vec![],
        };

        let (sec, warnings) = compute_case(&cw);
        assert_eq!(sec.duration_min, Some(1560.0));
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("more than 24 hours"));
    }

    #[test]
    fn test_compute_runs() {
        let mut obs = Vec::new();
        // 1. Ok run (verdict: pass)
        obs.push(Observation {
            ts: "2026-09-01T00:00:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r1".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "claude",
                "adapter": "herdr-spawn",
                "role": "implementer",
                "classification": {
                    "execution": { "status": "completed" },
                    "assessment": { "verdict": "pass" },
                    "policy": { "disposition": "allow" }
                }
            })).unwrap(),
            source: "run-result",
        });

        // 2. Exec failed
        obs.push(Observation {
            ts: "2026-09-01T00:01:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r2".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "claude",
                "adapter": "herdr-spawn",
                "classification": {
                    "execution": { "status": "failed" },
                    "assessment": { "verdict": "findings" },
                    "policy": { "disposition": "allow" }
                }
            })).unwrap(),
            source: "run-result",
        });

        // 3. Verdict fail
        obs.push(Observation {
            ts: "2026-09-01T00:02:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r3".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "agy",
                "classification": {
                    "execution": { "status": "completed" },
                    "assessment": { "verdict": "findings" },
                    "policy": { "disposition": "allow" }
                }
            })).unwrap(),
            source: "run-result",
        });

        // 4. Policy refused
        obs.push(Observation {
            ts: "2026-09-01T00:03:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r4".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "agy",
                "classification": {
                    "execution": { "status": "completed" },
                    "assessment": { "verdict": "pass" },
                    "policy": { "disposition": "refuse" }
                }
            })).unwrap(),
            source: "run-result",
        });

        // 5. Inconclusive
        obs.push(Observation {
            ts: "2026-09-01T00:04:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r5".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "claude",
                "classification": {
                    "execution": { "status": "completed" },
                    "assessment": { "verdict": "inconclusive" },
                    "policy": { "disposition": "allow" }
                }
            })).unwrap(),
            source: "run-result",
        });

        // 6. Blocked
        obs.push(Observation {
            ts: "2026-09-01T00:05:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r6".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "claude",
                "classification": {
                    "execution": { "status": "completed" },
                    "assessment": { "verdict": "blocked" },
                    "policy": { "disposition": "allow" }
                }
            })).unwrap(),
            source: "run-result",
        });

        // 7. Unclassified (no classification)
        obs.push(Observation {
            ts: "2026-09-01T00:06:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Run, id: "r7".to_string() },
            kind: "run.settled".to_string(),
            attrs: serde_json::from_value(json!({
                "executor": "claude"
            })).unwrap(),
            source: "run-result",
        });

        let runs = compute_runs(&obs);
        assert_eq!(runs.total, 7);
        assert_eq!(runs.overall.ok, 1);
        assert_eq!(runs.overall.exec_failed, 1);
        assert_eq!(runs.overall.verdict_fail, 1);
        assert_eq!(runs.overall.policy_refused, 1);
        assert_eq!(runs.overall.inconclusive, 1);
        assert_eq!(runs.overall.blocked, 1);
        assert_eq!(runs.overall.unclassified, 1);
        assert!((runs.unclassified_rate - (1.0 / 7.0)).abs() < 1e-6);

        assert_eq!(runs.by_executor.get("claude").unwrap().total, 5);
        assert_eq!(runs.by_executor.get("agy").unwrap().total, 2);
    }

    #[test]
    fn test_compute_sessions() {
        let mut obs = Vec::new();
        // Session 1: completed, no fixer -> firstPass = true
        obs.push(Observation {
            ts: "2026-09-01T10:00:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s1".to_string() },
            kind: "session.opened".to_string(),
            attrs: Default::default(),
            source: "coordination",
        });
        obs.push(Observation {
            ts: "2026-09-01T10:05:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s1".to_string() },
            kind: "session.assignment".to_string(),
            attrs: serde_json::from_value(json!({ "actorId": "doer", "assignmentId": "a1" })).unwrap(),
            source: "coordination",
        });
        obs.push(Observation {
            ts: "2026-09-01T10:10:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s1".to_string() },
            kind: "session.result_linked".to_string(),
            attrs: Default::default(),
            source: "coordination",
        });
        obs.push(Observation {
            ts: "2026-09-01T10:20:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s1".to_string() },
            kind: "session.result_linked".to_string(),
            attrs: Default::default(),
            source: "coordination",
        });
        obs.push(Observation {
            ts: "2026-09-01T10:25:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s1".to_string() },
            kind: "session.closed".to_string(),
            attrs: serde_json::from_value(json!({ "status": "completed" })).unwrap(),
            source: "coordination",
        });

        // Session 2: active, has fixer -> firstPass = false
        obs.push(Observation {
            ts: "2026-09-01T11:00:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s2".to_string() },
            kind: "session.opened".to_string(),
            attrs: Default::default(),
            source: "coordination",
        });
        obs.push(Observation {
            ts: "2026-09-01T11:01:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s2".to_string() },
            kind: "session.assignment".to_string(),
            attrs: serde_json::from_value(json!({ "actorId": "fixer", "assignmentId": "a2" })).unwrap(),
            source: "coordination",
        });
        obs.push(Observation {
            ts: "2026-09-01T11:02:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s2".to_string() },
            kind: "session.result_linked".to_string(),
            attrs: Default::default(),
            source: "coordination",
        });

        // Session 3: no result-linked -> should be ignored
        obs.push(Observation {
            ts: "2026-09-01T12:00:00Z".to_string(),
            subject: Subject { kind: SubjectKind::Session, id: "s3".to_string() },
            kind: "session.opened".to_string(),
            attrs: Default::default(),
            source: "coordination",
        });

        let sec = compute_sessions(&obs);
        assert!(sec.estimate);
        assert_eq!(sec.total_evaluated, 2);
        assert_eq!(sec.active_count, 1);
        assert_eq!(sec.first_pass_count, 1);
        assert_eq!(sec.assignments_p50, 1.0);
        // duration for s1 is 10:20 - 10:10 = 10m = 600s; s2 is single result-linked so 0s
        assert_eq!(sec.duration_sec_p50, 0.0);
        assert_eq!(sec.duration_sec_p90, 600.0);
    }

    #[test]
    fn test_compute_tokens() {
        let obs = vec![
            Observation {
                ts: "2026-09-01T00:00:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Case, id: "c".to_string() },
                kind: "llm.usage".to_string(),
                attrs: serde_json::from_value(json!({
                    "sessionId": "sess-a",
                    "inputTokens": 100,
                    "outputTokens": 20,
                    "cacheCreationInputTokens": 10,
                    "cacheReadInputTokens": 5,
                })).unwrap(),
                source: "claude-transcripts",
            },
            Observation {
                ts: "2026-09-01T00:01:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Case, id: "c".to_string() },
                kind: "llm.usage".to_string(),
                attrs: serde_json::from_value(json!({
                    "sessionId": "sess-a",
                    "inputTokens": 200,
                    "outputTokens": 40,
                    "cacheCreationInputTokens": 0,
                    "cacheReadInputTokens": 0,
                })).unwrap(),
                source: "claude-transcripts",
            },
            Observation {
                ts: "2026-09-01T00:02:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Case, id: "c".to_string() },
                kind: "llm.usage".to_string(),
                attrs: serde_json::from_value(json!({
                    "sessionId": "sess-b",
                    "inputTokens": 50,
                    "outputTokens": 10,
                    "cacheCreationInputTokens": 0,
                    "cacheReadInputTokens": 0,
                })).unwrap(),
                source: "claude-transcripts",
            },
        ];

        let tokens = compute_tokens(&obs);
        assert_eq!(tokens.message_count, 3);
        assert_eq!(tokens.session_count, 2);
        assert_eq!(tokens.input_tokens, 350);
        assert_eq!(tokens.output_tokens, 70);
        assert_eq!(tokens.cache_creation_input_tokens, 10);
        assert_eq!(tokens.cache_read_input_tokens, 5);
        assert_eq!(tokens.total_tokens, 435);
    }

    #[test]
    fn test_compute_faults() {
        let obs = vec![
            Observation {
                ts: "2026-09-01T00:00:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Case, id: "h".to_string() },
                kind: "host.fault".to_string(),
                attrs: serde_json::from_value(json!({
                    "faultClass": "unknown-verb"
                })).unwrap(),
                source: "invocation-faults",
            },
            Observation {
                ts: "2026-09-01T00:01:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Case, id: "h".to_string() },
                kind: "host.fault".to_string(),
                attrs: serde_json::from_value(json!({
                    "faultClass": "unknown-verb"
                })).unwrap(),
                source: "invocation-faults",
            },
            Observation {
                ts: "2026-09-01T00:02:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Case, id: "h".to_string() },
                kind: "host.fault".to_string(),
                attrs: serde_json::from_value(json!({
                    "faultClass": "requires-existing-store"
                })).unwrap(),
                source: "invocation-faults",
            },
        ];

        let faults = compute_faults(&obs);
        assert_eq!(faults.total, 3);
        assert_eq!(*faults.by_class.get("unknown-verb").unwrap(), 2);
        assert_eq!(*faults.by_class.get("requires-existing-store").unwrap(), 1);
    }

    #[test]
    fn test_compute_work() {
        let obs = vec![
            Observation {
                ts: "2026-09-01T10:00:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.added".to_string(),
                attrs: serde_json::from_value(json!({})).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T10:05:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.moved".to_string(),
                attrs: serde_json::from_value(json!({ "from": "todo", "to": "awaiting-human" })).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T10:05:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.asked".to_string(),
                attrs: serde_json::from_value(json!({ "ask": "?" })).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T10:10:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.moved".to_string(),
                attrs: serde_json::from_value(json!({ "from": "awaiting-human", "to": "doing" })).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T10:10:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.answered".to_string(),
                attrs: serde_json::from_value(json!({ "answer": "!" })).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T10:20:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.gate-approved".to_string(),
                attrs: serde_json::from_value(json!({ "gate": "validateApprove" })).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T10:30:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.moved".to_string(),
                attrs: serde_json::from_value(json!({ "from": "doing", "to": "awaiting-approval" })).unwrap(),
                source: "work",
            },
            Observation {
                ts: "2026-09-01T11:00:00Z".to_string(),
                subject: Subject { kind: SubjectKind::Work, id: "tsk-1".to_string() },
                kind: "work.moved".to_string(),
                attrs: serde_json::from_value(json!({ "from": "awaiting-approval", "to": "delivered" })).unwrap(),
                source: "work",
            },
        ];

        let win = crate::contract::Window {
            since: Some("2026-09-01T00:00:00Z".to_string()),
            until: Some("2026-09-01T23:59:59Z".to_string()),
        };

        let work = compute_work(&obs, None, &win);
        assert_eq!(work.total_evaluated, 1);
        // add (10:00) -> delivered (11:00) = 1.0 hr
        assert_eq!(work.add_to_delivered_hours.p50, 1.0);
        // doing (10:10) -> awaiting-approval (10:30) = 20 mins = 0.33 hr
        assert_eq!(work.doing_to_awaiting_approval_hours.p50, 0.33);
        // interventions: asked(1) + answered(1) + gate-approved(1) = 3
        assert_eq!(work.interventions_per_item.mean, 3.0);
        assert_eq!(work.interventions_per_item.p90, 3.0);
    }
}
