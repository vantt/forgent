//! Debate: two sides argue from opposite assumptions and an independent judge rules.
//!
//! Round 1 runs both sides blind and in parallel. Round 2 (on unless `params.rebuttal` is false) hands each
//! side only the other side's round-1 argument to answer. The judge then reads every argument and rules. A
//! different provider family per side is a soft preference (`preferIndependentOf`); the judge's family differing
//! from both sides is a hard rule (`independentOf`), so a pool that cannot seat such a judge ends the run with
//! Seat Binding's named independence refusal. Seats are read-only: arguments and a ruling, never writes.

use super::role_tasks::{role_unit, RoleAsk};
use super::{
    ids_without, outcome_of, round_is, seat_id, seat_is, stepped, Command, LoopInput, LoopResult,
    RoleCall, Step, DEFAULT_REBUTTAL,
};
use crate::outcome::is_error_outcome;
use crate::seat_resolver::{resolve_seats, ResolveOptions, SeatResolutionError};
use serde_json::Value;

/// The task each side is given, by its position in the declared order.
const SIDE_KINDS: [&str; 2] = ["thesis", "antithesis"];

enum State {
    Start,
    AwaitSides {
        round: u64,
        reused: Vec<Option<Value>>,
    },
    AwaitJudge,
    Finished,
}

pub struct Debate {
    sides: Vec<Value>,
    judge: Value,
    rounds: Vec<u64>,
    unit: Value,
    params: Value,
    history: Vec<Value>,
    results: Vec<Value>,
    state: State,
}

impl Debate {
    pub(super) fn new(input: LoopInput) -> Result<Debate, SeatResolutionError> {
        let seats = resolve_seats(&ResolveOptions {
            loop_name: Some("debate".into()),
            params: Some(input.params.clone()),
            unit: input.unit.clone(),
            runner_config: input.cfg.clone(),
            ..Default::default()
        })?;
        let role = |wanted: &str| {
            seats
                .iter()
                .filter(move |s| s.get("role").and_then(Value::as_str) == Some(wanted))
                .cloned()
                .collect::<Vec<_>>()
        };
        let rebuttal = input
            .params
            .get("rebuttal")
            .filter(|v| !v.is_null())
            .map_or(DEFAULT_REBUTTAL, crate::seat_resolver::value::truthy);
        Ok(Debate {
            sides: role("producer"),
            judge: role("judge").into_iter().next().unwrap_or(Value::Null),
            rounds: if rebuttal { vec![1, 2] } else { vec![1] },
            unit: input.unit,
            params: input.params,
            history: input.history,
            results: Vec::new(),
            state: State::Start,
        })
    }

    pub(super) fn step(
        &mut self,
        answers: Option<Vec<Value>>,
    ) -> Result<Step, SeatResolutionError> {
        match std::mem::replace(&mut self.state, State::Finished) {
            State::Start => self.run_round(1),
            State::AwaitSides { round, reused } => {
                let mut answered =
                    stepped(answers, reused.iter().filter(|r| r.is_none()).count())?.into_iter();
                let results = reused
                    .into_iter()
                    .map(|r| r.or_else(|| answered.next()).unwrap_or(Value::Null))
                    .collect();
                self.round_done(round, results)
            }
            State::AwaitJudge => {
                let ruling = stepped(answers, 1)?.remove(0);
                Ok(self.finish(ruling))
            }
            State::Finished => Err(SeatResolutionError::new(
                "the loop already ended",
                "loop-ended",
            )),
        }
    }

    /// One round of both sides in parallel. Every seat of a settled-and-passed earlier attempt is reused; the
    /// first listed side is bound first, so the other prefers a family it did not get.
    fn run_round(&mut self, round: u64) -> Result<Step, SeatResolutionError> {
        let reused: Vec<Option<Value>> = self
            .sides
            .iter()
            .map(|side| {
                let id = seat_id(side);
                self.history
                    .iter()
                    .find(|h| seat_is(h, &id) && round_is(h, round) && outcome_of(h) == "pass")
                    .cloned()
            })
            .collect();
        let pending = reused.iter().filter(|r| r.is_none()).count();
        let ids: Vec<String> = self.sides.iter().map(seat_id).collect();
        let mut commands = Vec::new();
        for (index, side) in self.sides.iter().enumerate() {
            if reused[index].is_some() {
                continue;
            }
            let id = seat_id(side);
            let kind = SIDE_KINDS[index.min(1)];
            // Round 1: the argument from the side's own assumptions, blind to the other side. Round 2: only
            // the other side's round-1 argument is handed over, to be answered.
            let (ask_seat, ask_kind) = if round == 1 {
                (id.clone(), kind.to_string())
            } else {
                (format!("{id}-rebuttal"), format!("{kind}-rebuttal"))
            };
            let ask = RoleAsk::new(&ask_seat, &self.params).kind(&ask_kind);
            let mut call = RoleCall::new(side, role_unit(&self.unit, &ask));
            call.round = Some(round);
            call.prefer_independent_of = Some(ids_without(&ids, &id));
            call.batch = Some(pending);
            if round != 1 {
                let other = self
                    .sides
                    .iter()
                    .map(seat_id)
                    .find(|s| *s != id)
                    .unwrap_or_default();
                let found = self
                    .results
                    .iter()
                    .find(|r| seat_is(r, &other) && round_is(r, 1))
                    .cloned();
                call.inputs = Some(vec![found.unwrap_or(Value::Null)]);
            }
            commands.push(Command::Role(Box::new(call)));
        }
        if commands.is_empty() {
            let results = reused.into_iter().flatten().collect();
            return self.round_done(round, results);
        }
        self.state = State::AwaitSides { round, reused };
        Ok(Step::Dispatch(commands))
    }

    fn round_done(&mut self, round: u64, results: Vec<Value>) -> Result<Step, SeatResolutionError> {
        self.results.extend(results.iter().cloned());
        if let Some(error) = results.iter().find(|r| is_error_outcome(outcome_of(r))) {
            return Ok(Step::Done(LoopResult {
                outcome: outcome_of(error).to_string(),
                rounds: Some(round),
                results: self.results.clone(),
                findings: None,
            }));
        }
        if let Some(next) = self.rounds.iter().copied().find(|r| *r > round) {
            return self.run_round(next);
        }
        // The judge reads both sides and their rebuttals and must differ in provider family from both, so a
        // pool that cannot seat one is refused by name, never ruled by a same-family judge.
        let judge_id = seat_id(&self.judge);
        if let Some(existing) = self
            .history
            .iter()
            .find(|h| seat_is(h, &judge_id) && outcome_of(h) == "pass")
            .cloned()
        {
            return Ok(self.finish(existing));
        }
        let ask = RoleAsk::new(&judge_id, &self.params).kind("judge");
        let mut call = RoleCall::new(&self.judge, role_unit(&self.unit, &ask));
        call.independent_of = Some(self.sides.iter().map(seat_id).collect());
        call.inputs = Some(self.results.clone());
        self.state = State::AwaitJudge;
        Ok(Step::Dispatch(vec![Command::Role(Box::new(call))]))
    }

    fn finish(&mut self, ruling: Value) -> Step {
        self.state = State::Finished;
        let outcome = outcome_of(&ruling).to_string();
        self.results.push(ruling);
        Step::Done(LoopResult {
            outcome,
            rounds: Some(self.rounds.len() as u64),
            results: self.results.clone(),
            findings: None,
        })
    }
}
