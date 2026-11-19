//! Reviewed: a producer-checker loop with an optional deterministic verify and a round limit. Each round the
//! producer works, then the checkers and the verify round run together and the round is judged: an error ends
//! the run, findings go on to the next round (or end the run at the last), nothing found passes.

use super::role_tasks::{role_unit, RoleAsk};
use super::verify::{has_verify_command, verify_seat_result};
use super::{
    ids_without, outcome_of, round_entry, round_is, seat_id, seat_is, stepped, Command, LoopInput,
    LoopResult, RoleCall, Step,
};
use crate::outcome::is_error_outcome;
use crate::seat_resolver::value::{get, truthy};
use crate::seat_resolver::{
    requires_distinct_families, resolve_seats, ResolveOptions, SeatResolutionError, VERIFY_SEAT,
};
use serde_json::{json, Value};

/// The round limit the caller resolved from `runner.loops.reviewed.maxRounds`. The loop keeps no number of its
/// own: a missing or unusable limit is a refusal by name, not a silent default.
fn max_rounds_of(params: &Value) -> Result<u64, SeatResolutionError> {
    match params.get("maxRounds").and_then(Value::as_u64) {
        Some(n) if n >= 1 => Ok(n),
        _ => Err(SeatResolutionError::plain(
            format!(
                "the reviewed loop needs params.maxRounds, an integer >= 1 from runner.loops.reviewed.maxRounds in the effective config, got {}",
                crate::seat_resolver::value::js_json(params.get("maxRounds"))
            ),
            "reviewed-max-rounds-missing",
        )),
    }
}

/// A producer, the writing seat, that claimed done but changed no files settles no-evidence and inconclusive,
/// which the history reads as an execution failure. Its work may already be committed, so the round goes on to
/// its checks; a crash, timeout or provider limit carries a failure and still stops it.
fn changed_nothing(result: &Value, producer_seat: &str) -> bool {
    let classification = get(result, "runResult").and_then(|r| get(r, "classification"));
    let Some(c) = classification else {
        return false;
    };
    seat_is(result, producer_seat)
        && outcome_of(result) == "execution-failure"
        && c.get("confidence").and_then(|v| v.get("level")) == Some(&json!("no-evidence"))
        && c.get("assessment").and_then(|v| v.get("verdict")) == Some(&json!("inconclusive"))
        && !c.get("failure").is_some_and(truthy)
}

/// An outcome that ends the round: an error outcome, except a producer that changed nothing.
fn ends_round(result: &Value, producer_seat: &str) -> bool {
    is_error_outcome(outcome_of(result)) && !changed_nothing(result, producer_seat)
}

/// The findings a result carries.
pub fn extract_findings(result: &Value) -> Vec<Value> {
    if result.is_null() {
        return Vec::new();
    }
    match result.get("findings") {
        Some(Value::Array(list)) if !list.is_empty() => return list.clone(),
        Some(Value::String(s)) => return vec![json!(s)],
        _ => {}
    }
    if let Some(f) = get(result, "finding").filter(|f| truthy(f)) {
        return vec![f.clone()];
    }
    if outcome_of(result) == "findings" {
        let seat = get(result, "seat")
            .filter(|s| truthy(s))
            .and_then(Value::as_str)
            .unwrap_or("checker");
        return vec![json!(format!("Seat {seat} reported findings"))];
    }
    Vec::new()
}

/// A round is final only once every seat it dispatches has a result (or its producer failed, so no checker was
/// dispatched). Until then, resume reuses the seats that passed and retries every other one.
fn round_settled_in_history(
    r: u64,
    prior: &[Value],
    producer: &str,
    checkers: &[String],
    has_verify: bool,
) -> bool {
    let Some(prod) = round_entry(prior, producer, r) else {
        return false;
    };
    if ends_round(prod, producer) {
        return true;
    }
    peers(checkers, has_verify)
        .iter()
        .all(|seat| round_entry(prior, seat, r).is_some())
}

fn peers(checkers: &[String], has_verify: bool) -> Vec<String> {
    let mut list = checkers.to_vec();
    if has_verify {
        list.push(VERIFY_SEAT.to_string());
    }
    list
}

struct Assessment {
    outcome: String,
    findings: Vec<Value>,
}

/// Shared by live and history execution and the history outcome.
fn assess_round(results: &[Value], producer: &str) -> Assessment {
    if let Some(error) = results.iter().find(|r| ends_round(r, producer)) {
        return Assessment {
            outcome: outcome_of(error).to_string(),
            findings: Vec::new(),
        };
    }
    let findings: Vec<Value> = results
        .iter()
        .filter(|r| {
            outcome_of(r) == "findings" || (seat_is(r, VERIFY_SEAT) && outcome_of(r) != "pass")
        })
        .flat_map(extract_findings)
        .collect();
    Assessment {
        outcome: if findings.is_empty() {
            "pass"
        } else {
            "findings"
        }
        .to_string(),
        findings,
    }
}

/// A terminal outcome read without dispatching or verifying. Incomplete history cannot establish completion and
/// stays unknown (`None`).
pub fn reviewed_history_outcome(
    unit: &Value,
    cfg: &Value,
    prior: &[Value],
    params: &Value,
    seats: &[Value],
) -> Result<Option<String>, SeatResolutionError> {
    let max_rounds = max_rounds_of(params)?;
    let producer = seats
        .iter()
        .find(|s| seat_is_role(s, "producer"))
        .map_or_else(|| "producer".to_string(), seat_id);
    let checkers: Vec<String> = seats
        .iter()
        .filter(|s| !seat_is_role(s, "producer"))
        .map(seat_id)
        .collect();
    let has_verify = has_verify_command(unit, cfg);
    for round in 1..=max_rounds {
        if !round_settled_in_history(round, prior, &producer, &checkers, has_verify) {
            return Ok(None);
        }
        let prod = round_entry(prior, &producer, round)
            .cloned()
            .unwrap_or(Value::Null);
        if ends_round(&prod, &producer) {
            return Ok(Some(outcome_of(&prod).to_string()));
        }
        let mut results = vec![prod];
        results.extend(
            peers(&checkers, has_verify)
                .iter()
                .filter_map(|s| round_entry(prior, s, round).cloned()),
        );
        let assessment = assess_round(&results, &producer);
        if assessment.outcome != "findings" || round == max_rounds {
            return Ok(Some(assessment.outcome));
        }
    }
    Ok(None)
}

fn seat_is_role(seat: &Value, role: &str) -> bool {
    seat.get("role").and_then(Value::as_str) == Some(role)
}

enum State {
    Start,
    AwaitProducer,
    AwaitPeers {
        reused: Vec<Value>,
        pending: usize,
        verify_pending: bool,
        reused_verify: Option<Value>,
    },
    Finished,
}

pub struct Reviewed {
    unit: Value,
    params: Value,
    history: Vec<Value>,
    launch_room: Option<u64>,
    max_rounds: u64,
    producer: Value,
    producer_id: String,
    checker_seats: Vec<Value>,
    checkers: Vec<String>,
    has_verify: bool,
    distinct_families: bool,
    all_results: Vec<Value>,
    all_findings: Vec<Value>,
    prior_findings: Vec<Value>,
    round: u64,
    current: Vec<Value>,
    state: State,
}

impl Reviewed {
    pub(super) fn new(input: LoopInput) -> Result<Reviewed, SeatResolutionError> {
        let max_rounds = max_rounds_of(&input.params)?;
        let seats = resolve_seats(&ResolveOptions {
            loop_name: Some("reviewed".into()),
            params: Some(input.params.clone()),
            unit: input.unit.clone(),
            runner_config: input.cfg.clone(),
            shipped_checkers_by_rigor: input.shipped_checkers_by_rigor.clone(),
            ..Default::default()
        })?;
        let producer = seats
            .iter()
            .find(|s| seat_is_role(s, "producer"))
            .cloned()
            .unwrap_or(Value::Null);
        let checker_seats: Vec<Value> = seats
            .iter()
            .filter(|s| !seat_is_role(s, "producer"))
            .cloned()
            .collect();
        let checkers: Vec<String> = checker_seats.iter().map(seat_id).collect();
        let has_verify = has_verify_command(&input.unit, &input.cfg);
        let distinct_families = requires_distinct_families(&input.unit, &input.cfg)?;
        Ok(Reviewed {
            producer_id: seat_id(&producer),
            producer,
            unit: input.unit,
            params: input.params,
            history: input.history,
            launch_room: input.launch_room,
            max_rounds,
            checker_seats,
            checkers,
            has_verify,
            distinct_families,
            all_results: Vec::new(),
            all_findings: Vec::new(),
            prior_findings: Vec::new(),
            round: 0,
            current: Vec::new(),
            state: State::Start,
        })
    }

    fn finish(&mut self, outcome: &str, rounds: u64, findings: Option<Vec<Value>>) -> Step {
        self.state = State::Finished;
        Step::Done(LoopResult {
            outcome: outcome.to_string(),
            rounds: Some(rounds),
            results: self.all_results.clone(),
            findings: Some(findings.unwrap_or_else(|| self.all_findings.clone())),
        })
    }

    /// What a round's assessment decides: an error ends the run; findings go on to the next round, or end the
    /// run at the last one; nothing found passes. `None` to go on.
    fn conclude_round(&mut self, assessment: Assessment, r: u64) -> Option<Step> {
        if is_error_outcome(&assessment.outcome) {
            return Some(self.finish(&assessment.outcome, r, None));
        }
        if assessment.findings.is_empty() {
            return Some(self.finish("pass", r, Some(Vec::new())));
        }
        self.all_findings
            .extend(assessment.findings.iter().cloned());
        if r >= self.max_rounds {
            return Some(self.finish("findings", r, None));
        }
        self.prior_findings = assessment.findings;
        None
    }

    pub(super) fn step(
        &mut self,
        answers: Option<Vec<Value>>,
    ) -> Result<Step, SeatResolutionError> {
        match std::mem::replace(&mut self.state, State::Finished) {
            State::Start => self.next_round(),
            State::AwaitProducer => {
                let produced = stepped(answers, 1)?.remove(0);
                self.after_producer(produced)
            }
            State::AwaitPeers {
                reused,
                pending,
                verify_pending,
                reused_verify,
            } => {
                let mut answers = stepped(answers, pending + usize::from(verify_pending))?;
                let verify_answer = verify_pending.then(|| answers.pop()).flatten();
                let dispatched_verify =
                    verify_answer.map(|a| verify_seat_result(Some(&a), self.round));
                let mut round_results = reused;
                round_results.extend(answers);
                round_results.extend(reused_verify.into_iter().chain(dispatched_verify));
                for result in round_results {
                    self.current.push(result.clone());
                    self.all_results.push(result);
                }
                let assessment = assess_round(&self.current, &self.producer_id);
                match self.conclude_round(assessment, self.round) {
                    Some(done) => Ok(done),
                    None => self.next_round(),
                }
            }
            State::Finished => Err(SeatResolutionError::new(
                "the loop already ended",
                "loop-ended",
            )),
        }
    }

    fn next_round(&mut self) -> Result<Step, SeatResolutionError> {
        loop {
            self.round += 1;
            let r = self.round;
            if r > self.max_rounds {
                let outcome = if self.all_findings.is_empty() {
                    "pass"
                } else {
                    "findings"
                };
                return Ok(self.finish(outcome, self.max_rounds, None));
            }
            if round_settled_in_history(
                r,
                &self.history,
                &self.producer_id,
                &self.checkers,
                self.has_verify,
            ) {
                let produced = round_entry(&self.history, &self.producer_id, r)
                    .cloned()
                    .unwrap_or(Value::Null);
                self.all_results.push(produced.clone());
                if ends_round(&produced, &self.producer_id) {
                    return Ok(self.finish(outcome_of(&produced).to_string().as_str(), r, None));
                }
                let mut round_results = vec![produced];
                for seat in peers(&self.checkers, self.has_verify) {
                    let hist = round_entry(&self.history, &seat, r)
                        .cloned()
                        .unwrap_or(Value::Null);
                    self.all_results.push(hist.clone());
                    round_results.push(hist);
                }
                let assessment = assess_round(&round_results, &self.producer_id);
                if let Some(done) = self.conclude_round(assessment, r) {
                    return Ok(done);
                }
                continue;
            }
            // A round that cannot launch its seats under the Unit's seat-launch ceiling does not start: the run
            // ends at the last evaluation it has, which found something (or the loop would not be here).
            if r > 1
                && self
                    .launch_room
                    .is_some_and(|room| ((1 + self.checkers.len()) as u64) > room)
            {
                return Ok(self.finish("findings", r - 1, None));
            }
            // The round is live (partially or not in history). Producer first: a recorded pass, or a producer
            // that changed nothing, is reused.
            self.current.clear();
            let existing = self
                .history
                .iter()
                .find(|h| {
                    seat_is(h, &self.producer_id)
                        && round_is(h, r)
                        && (outcome_of(h) == "pass" || changed_nothing(h, &self.producer_id))
                })
                .cloned();
            if let Some(produced) = existing {
                return self.after_producer(produced);
            }
            // Round 1 is the unit as given; a later round also lists what the checks found, so the producer
            // knows what to fix.
            let findings = if r > 1 {
                self.prior_findings.clone()
            } else {
                Vec::new()
            };
            let ask = RoleAsk::new(&self.producer_id, &self.params)
                .kind("producer")
                .findings(&findings);
            let mut call = RoleCall::new(&self.producer, role_unit(&self.unit, &ask));
            call.round = Some(r);
            self.state = State::AwaitProducer;
            return Ok(Step::Dispatch(vec![Command::Role(Box::new(call))]));
        }
    }

    fn after_producer(&mut self, produced: Value) -> Result<Step, SeatResolutionError> {
        let r = self.round;
        self.current = vec![produced.clone()];
        self.all_results.push(produced.clone());
        if ends_round(&produced, &self.producer_id) {
            return Ok(self.finish(outcome_of(&produced).to_string().as_str(), r, None));
        }
        // Checkers and verification run together, and every peer is drained before the round is judged.
        let mut reused = Vec::new();
        let mut pending_seats = Vec::new();
        for seat in &self.checker_seats {
            let id = seat_id(seat);
            let existing = self
                .history
                .iter()
                .find(|h| seat_is(h, &id) && round_is(h, r) && outcome_of(h) == "pass")
                .cloned();
            match existing {
                Some(e) => reused.push(e),
                None => pending_seats.push(seat.clone()),
            }
        }
        let reused_verify = self
            .has_verify
            .then(|| {
                self.history
                    .iter()
                    .find(|h| seat_is(h, VERIFY_SEAT) && round_is(h, r) && outcome_of(h) == "pass")
                    .cloned()
            })
            .flatten();
        let verify_pending = self.has_verify && reused_verify.is_none();
        let mut commands: Vec<Command> = pending_seats
            .iter()
            .map(|seat| {
                let id = seat_id(seat);
                let ask = RoleAsk::new(&id, &self.params);
                let mut call = RoleCall::new(seat, role_unit(&self.unit, &ask));
                // Told to check rather than to do the work, and handed the producer's account of this round.
                call.independent_of = Some(if self.distinct_families {
                    let mut ids = vec![self.producer_id.clone()];
                    ids.extend(ids_without(&self.checkers, &id));
                    ids
                } else {
                    vec![self.producer_id.clone()]
                });
                call.round = Some(r);
                call.inputs = Some(vec![produced.clone()]);
                call.batch = Some(pending_seats.len());
                Command::Role(Box::new(call))
            })
            .collect();
        if verify_pending {
            commands.push(Command::Verify { round: r });
        }
        let pending = pending_seats.len();
        if commands.is_empty() {
            let mut round_results = reused;
            round_results.extend(reused_verify);
            for result in round_results {
                self.current.push(result.clone());
                self.all_results.push(result);
            }
            let assessment = assess_round(&self.current, &self.producer_id);
            return match self.conclude_round(assessment, r) {
                Some(done) => Ok(done),
                None => self.next_round(),
            };
        }
        self.state = State::AwaitPeers {
            reused,
            pending,
            verify_pending,
            reused_verify,
        };
        Ok(Step::Dispatch(commands))
    }
}
