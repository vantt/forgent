//! Discussion measurement consumes only owner-written `unit.settled` observations.

use crate::contract::{Observation, ObserveRequest, UnitSummaryScanner, Window};
use crate::time::{parse_timestamp_millis, ParsedWindow};
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};

pub fn dispatch_discussions(
    req: &ObserveRequest,
    scanner: UnitSummaryScanner,
) -> Result<Value, String> {
    let mut window = Window::default();
    let mut by = "workflow".to_owned();
    let mut i = 0;
    while i < req.args.len() {
        let arg = &req.args[i];
        let (flag, inline) = arg.split_once('=').map_or((arg.as_str(), None), |(flag, value)| (flag, Some(value)));
        if !matches!(flag, "--since" | "--until" | "--by" | "--dir") {
            return Err(format!("unexpected argument for metrics discussions: {arg}"));
        }
        let value = if let Some(value) = inline {
            i += 1;
            value
        } else {
            let value = req.args.get(i + 1).filter(|value| !value.starts_with("--"))
                .ok_or_else(|| format!("missing value for {flag}"))?;
            i += 2;
            value.as_str()
        };
        if value.is_empty() {
            return Err(format!("missing value for {flag}"));
        }
        match flag {
            "--since" => window.since = Some(value.to_owned()),
            "--until" => window.until = Some(value.to_owned()),
            "--by" if matches!(value, "workflow" | "executor" | "persona") => by = value.to_owned(),
            "--by" => return Err(format!("invalid --by value \"{value}\". Allowed: workflow, executor, persona")),
            "--dir" => {}, // The native request already resolves the root.
            _ => unreachable!(),
        }
    }
    let parsed_window = ParsedWindow::parse(&window)?;
    let scan = scanner(&req.root, &window).map_err(|err| err.to_string())?;
    let mut output = compute_discussions(&scan.observations, &by, &window, &parsed_window);
    output["summaryDiagnosticsScope"] = json!("root-wide");
    output["summaryDirsSeen"] = json!(scan.summary_dirs_seen);
    output["summariesMissing"] = json!(scan.summaries_missing);
    output["summariesUnusable"] = json!(scan.summaries_unusable);
    output["summariesSkippedByReason"] = json!(scan.summaries_skipped_by_reason);
    output["summariesOutsideWindow"] = json!(scan.summaries_outside_window);
    Ok(output)
}

/// The writer's outcome for a finished unit whose outcome its records cannot establish.
const UNDETERMINED_OUTCOME: &str = "undetermined";
/// Agreement needs at least two valid votes; one vote cannot agree or split with anyone.
const MIN_VALID_VOTES: usize = 2;

/// Valid votes form a quorum when there are at least two of them and they are at least half
/// of the voting seats, rounded up. Missing and invalid votes stay in the denominator of the
/// agreement ratio, so without the relative bound two agreeing votes among five seats would
/// read as a split that no voter expressed.
fn has_quorum(valid: usize, voters: usize) -> bool {
    valid >= MIN_VALID_VOTES && valid * 2 >= voters
}

#[derive(Default)]
struct Totals {
    units: usize,
    units_passed: usize,
    units_undetermined: usize,
    seats: usize,
    seats_passed: usize,
    attempts: usize,
    inline_seats: usize,
    fallback_seats: usize,
    fallback_attempts: usize,
    durations: Vec<f64>,
}

impl Totals {
    fn unit(&mut self, unit: &Map<String, Value>) {
        self.units += 1;
        self.units_passed += usize::from(unit["outcome"] == "pass");
        self.units_undetermined += usize::from(unit["outcome"] == UNDETERMINED_OUTCOME);
        if let Some(duration) = duration_seconds(unit) {
            self.durations.push(duration);
        }
    }

    fn seat(&mut self, seat: &Value) {
        self.seats += 1;
        self.seats_passed += usize::from(seat["final"]["outcome"] == "pass");
        self.inline_seats += usize::from(seat["final"]["runId"].is_null());
        self.fallback_seats += usize::from(!seat["final"]["fallbackFrom"].is_null());
    }

    fn attempt(&mut self, attempt: &Value) {
        // Inline records are seats, not dispatch runs. Keep the run cross-check honest.
        if attempt["runId"].as_str().is_some() {
            self.attempts += 1;
            self.fallback_attempts += usize::from(!attempt["fallbackFrom"].is_null());
        }
    }

    fn output(mut self) -> Value {
        self.durations.sort_by(f64::total_cmp);
        let n = self.durations.len();
        let median = if n == 0 { None } else if n % 2 == 1 {
            Some(self.durations[n / 2])
        } else {
            Some((self.durations[n / 2 - 1] + self.durations[n / 2]) / 2.0)
        };
        // An undetermined unit is visible but neither passed nor failed, so it stays out of the rate.
        let determined = self.units - self.units_undetermined;
        json!({
            "unitRuns": self.units,
            "unitsPassed": self.units_passed,
            "unitsFailed": determined - self.units_passed,
            "unitsUndetermined": self.units_undetermined,
            "passRate": ratio(self.units_passed, determined),
            "seats": self.seats,
            "seatsPassed": self.seats_passed,
            "seatsFailed": self.seats - self.seats_passed,
            "seatPassRate": ratio(self.seats_passed, self.seats),
            "attempts": self.attempts,
            "inlineSeats": self.inline_seats,
            "fallbackSeats": self.fallback_seats,
            "fallbackAttempts": self.fallback_attempts,
            "fallbackRate": ratio(self.fallback_seats, self.seats),
            "medianDurationSec": median,
            "durationSamples": n,
        })
    }
}

fn ratio(numerator: usize, denominator: usize) -> Option<f64> {
    (denominator > 0).then(|| numerator as f64 / denominator as f64)
}

fn group_key(value: &Value, key: &str) -> String {
    value[key].as_str().unwrap_or("unknown").to_owned()
}


/// All final panelist seats (not synthesizers or fallback attempts) are voters.
/// Missing/invalid votes stay in the denominator and remain explicit counts:
/// the threshold is a passive signal, not proof that missing voters dissented.
/// Without a quorum of valid votes (see `has_quorum`) the unit is unmeasured and only the
/// counts are reported.
fn agreement(unit: &Map<String, Value>) -> Value {
    let mut stances = BTreeMap::<String, usize>::new();
    let mut missing = 0;
    let mut invalid = 0;
    let mut voters = 0;
    let options = unit["stanceOptions"].as_array();
    if let Some(seats) = unit["seats"].as_array() {
        for seat in seats.iter().filter(|seat| seat["kind"] == "panelist") {
            voters += 1;
            let stance = &seat["final"]["stance"];
            match stance["status"].as_str() {
                Some("valid") => {
                    let choice = stance["choice"].as_str();
                    if let Some(choice) = choice.filter(|choice| *choice == "other"
                        || options.is_some_and(|options| options.iter().any(|option| option.as_str() == Some(*choice)))) {
                        *stances.entry(choice.to_owned()).or_default() += 1;
                    } else {
                        invalid += 1;
                    }
                }
                Some("invalid") => invalid += 1,
                _ => missing += 1,
            }
        }
    }
    let valid: usize = stances.values().sum();
    let measured = options.is_some_and(|options| !options.is_empty()) && has_quorum(valid, voters);
    let largest = stances.values().copied().max().unwrap_or(0);
    json!({
        "measurement": if measured { "measured" } else { "unmeasured" },
        "stances": stances,
        "stancesValid": valid,
        "stancesMissing": missing,
        "stancesInvalid": invalid,
        "stanceSeats": voters,
        "agreement": if measured { ratio(largest, voters) } else { None },
        "genuineSplit": if measured { Some(largest * 3 < voters * 2) } else { None },
    })
}

/// Group unit reliability separately from all dispatched attempts and final seats.
/// A group counts each participating unit once; executor/persona groups can overlap.
fn compute_discussions(observations: &[Observation], by: &str, window: &Window, parsed_window: &ParsedWindow) -> Value {
    let mut units = observations.iter().filter_map(|observation| {
        if observation.source != "unit-summary" || observation.kind != "unit.settled" {
            return None;
        }
        let timestamp = parse_timestamp_millis(&observation.ts)?;
        parsed_window.contains(timestamp).then_some((timestamp, observation))
    }).collect::<Vec<_>>();
    units.sort_by(|(a_ts, a), (b_ts, b)| a_ts.cmp(b_ts).then_with(|| a.subject.id.cmp(&b.subject.id)));
    let mut seen = BTreeSet::new();
    let mut overall = Totals::default();
    let mut groups = BTreeMap::<String, Totals>::new();
    let mut individual = Vec::new();
    for (_, observation) in units {
        if !seen.insert(&observation.subject.id) {
            continue;
        }
        let unit = &observation.attrs;
        let workflow_key = unit["workflow"]["runId"].as_str().unwrap_or("unlinked").to_owned();
        let mut participating = BTreeSet::new();
        if by == "workflow" {
            participating.insert(workflow_key.clone());
        }
        let mut local = Totals::default();
        local.unit(unit);
        overall.unit(unit);
        if let Some(seats) = unit["seats"].as_array() {
            for seat in seats {
                local.seat(seat);
                overall.seat(seat);
                let key = if by == "workflow" { workflow_key.clone() } else { group_key(&seat["final"], by) };
                participating.insert(key.clone());
                groups.entry(key).or_default().seat(seat);
                if let Some(attempts) = seat["attempts"].as_array() {
                    for attempt in attempts {
                        local.attempt(attempt);
                        overall.attempt(attempt);
                        let key = if by == "workflow" { workflow_key.clone() } else { group_key(attempt, by) };
                        participating.insert(key.clone());
                        groups.entry(key).or_default().attempt(attempt);
                    }
                }
            }
        }
        for key in participating {
            groups.entry(key).or_default().unit(unit);
        }
        let mut output = local.output();
        for key in ["unitRunId", "workflow", "pattern", "capability", "outcome", "startedAt", "settledAt", "inline", "stanceOptions", "seats"] {
            // `seats` count remains numeric; owner-selected details get a distinct key.
            output[if key == "seats" { "seatDetails" } else { key }] = unit[key].clone();
        }
        if let Value::Object(measurement) = agreement(unit) {
            output.as_object_mut().expect("unit metrics object").extend(measurement);
        }
        individual.push(output);
    }
    json!({
        "by": by,
        "since": window.since,
        "until": window.until,
        "totals": overall.output(),
        "groups": groups.into_iter().map(|(key, totals)| (key, totals.output())).collect::<BTreeMap<_, _>>(),
        "units": individual,
    })
}

fn duration_seconds(unit: &Map<String, Value>) -> Option<f64> {
    let start = parse_timestamp_millis(unit["startedAt"].as_str()?)?;
    let end = parse_timestamp_millis(unit["settledAt"].as_str()?)?;
    (end >= start).then_some((end - start) as f64 / 1000.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::contract::{Subject, SubjectKind};

    fn observation(id: &str, ts: &str) -> Observation {
        let Value::Object(attrs) = json!({
            "unitRunId": id, "workflow": null, "pattern": "panel", "capability": null,
            "outcome": "pass", "startedAt": null, "settledAt": ts,
            "inline": false, "stanceOptions": [], "seats": []
        }) else { unreachable!() };
        Observation {
            ts: ts.to_owned(), subject: Subject { kind: SubjectKind::Run, id: format!("unit-run:{id}") },
            kind: "unit.settled".into(), attrs, source: "unit-summary",
        }
    }

    /// A panel unit whose panelist seats voted `votes` (None = no vote), plus a synthesizer
    /// that never votes.
    fn panel(votes: &[Option<&str>]) -> Map<String, Value> {
        let mut seats: Vec<Value> = votes.iter().enumerate().map(|(i, vote)| json!({
            "role": format!("panelist-{}", i + 1), "kind": "panelist",
            "final": {"stance": match vote {
                Some(choice) => json!({"status": "valid", "choice": choice, "confidence": 0.8}),
                None => json!({"status": "missing"}),
            }},
        })).collect();
        seats.push(json!({"role": "synthesizer", "kind": "synthesizer", "final": {"stance": {"status": "missing"}}}));
        let Value::Object(unit) = json!({"stanceOptions": ["a", "b", "c"], "seats": seats}) else { unreachable!() };
        unit
    }

    #[test]
    fn agreement_is_measured_only_with_a_quorum_of_valid_votes() {
        let (a, b, c) = (Some("a"), Some("b"), Some("c"));
        // (votes, measured, agreement, genuineSplit)
        let cases: [(&[Option<&str>], bool, f64, bool); 7] = [
            (&[a, a, a], true, 1.0, false),
            (&[a, a, None], true, 2.0 / 3.0, false),
            (&[a, None, None], false, 0.0, false),
            (&[a, b, c], true, 1.0 / 3.0, true),
            (&[a, a, None, None, None], false, 0.0, false),
            (&[a, a, a, None, None], true, 3.0 / 5.0, true),
            (&[a, a, b, None, None], true, 2.0 / 5.0, true),
        ];
        for (votes, measured, expected_agreement, split) in cases {
            let row = agreement(&panel(votes));
            let valid = votes.iter().flatten().count();
            let context = format!("{votes:?}: {row}");
            // The counters are reported whether or not the unit is measured.
            assert_eq!(row["stanceSeats"], votes.len(), "{context}");
            assert_eq!(row["stancesValid"], valid, "{context}");
            assert_eq!(row["stancesMissing"], votes.len() - valid, "{context}");
            if measured {
                assert_eq!(row["measurement"], "measured", "{context}");
                assert_eq!(row["agreement"], expected_agreement, "{context}");
                assert_eq!(row["genuineSplit"], split, "{context}");
            } else {
                assert_eq!(row["measurement"], "unmeasured", "{context}");
                assert!(row["agreement"].is_null(), "{context}");
                assert!(row["genuineSplit"].is_null(), "{context}");
            }
        }
    }

    #[test]
    fn quorum_needs_two_valid_votes_and_half_the_voting_seats_rounded_up() {
        for (valid, voters, expected) in [
            (0, 0, false), (1, 1, false), (2, 2, true), (2, 3, true), (1, 3, false),
            (2, 4, true), (2, 5, false), (3, 5, true), (3, 7, false), (4, 7, true),
        ] {
            assert_eq!(has_quorum(valid, voters), expected, "{valid} valid of {voters} seats");
        }
    }

    #[test]
    fn aggregation_independently_applies_temporal_offset_boundaries() {
        // Already-read observations can include units outside the requested
        // window; the pure aggregation boundary must remain correct by itself.
        let observations = vec![
            observation("before", "2026-10-05T01:00:00+02:00"),
            observation("equal-positive", "2026-10-05T02:00:00+02:00"),
            observation("equal-negative", "2026-10-04T19:00:00-05:00"),
            observation("after", "2026-10-04T23:30:00-02:00"),
        ];
        let window = Window { since: Some("2026-10-05T00:00:00Z".into()), until: Some("2026-10-05T00:00:00.000Z".into()) };
        let parsed = ParsedWindow::parse(&window).unwrap();
        let report = compute_discussions(&observations, "workflow", &window, &parsed);
        assert_eq!(report["totals"]["unitRuns"], 2);
        assert!(report["units"].as_array().unwrap().iter().all(|unit| unit["unitRunId"].as_str().unwrap().starts_with("equal-")));
        let window = Window { since: Some("2026-10-05".into()), until: None };
        let report = compute_discussions(&observations, "workflow", &window, &ParsedWindow::parse(&window).unwrap());
        assert_eq!(report["totals"]["unitRuns"], 3);
        assert_eq!(report["units"].as_array().unwrap().last().unwrap()["unitRunId"], "after");
    }
}
