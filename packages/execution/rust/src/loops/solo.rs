//! Solo: one producer seat, then the verify round when a verify command exists.

use super::verify::{verify_command_of, verify_seat_result};
use super::{outcome_of, seat_id, stepped, Command, LoopInput, LoopResult, RoleCall, Step};
use crate::seat_resolver::{resolve_seats, ResolveOptions, SeatResolutionError, VERIFY_SEAT};
use serde_json::Value;

enum State {
    Start,
    AwaitProducer,
    AwaitVerify,
    Finished,
}

pub struct Solo {
    seat: Value,
    unit: Value,
    cfg: Value,
    history: Vec<Value>,
    state: State,
    results: Vec<Value>,
}

impl Solo {
    pub(super) fn new(input: LoopInput) -> Result<Solo, SeatResolutionError> {
        let seats = resolve_seats(&ResolveOptions {
            loop_name: Some("solo".into()),
            params: Some(input.params.clone()),
            unit: input.unit.clone(),
            runner_config: input.cfg.clone(),
            ..Default::default()
        })?;
        Ok(Solo {
            seat: seats.into_iter().next().unwrap_or(Value::Null),
            unit: input.unit,
            cfg: input.cfg,
            history: input.history,
            state: State::Start,
            results: Vec::new(),
        })
    }

    pub(super) fn step(
        &mut self,
        answers: Option<Vec<Value>>,
    ) -> Result<Step, SeatResolutionError> {
        let producer_id = seat_id(&self.seat);
        match self.state {
            State::Start => {
                let existing = self
                    .history
                    .iter()
                    .find(|r| super::seat_is(r, &producer_id) && outcome_of(r) == "pass")
                    .cloned();
                match existing {
                    Some(result) => self.after_producer(result),
                    None => {
                        self.state = State::AwaitProducer;
                        Ok(Step::Dispatch(vec![Command::Role(Box::new(
                            RoleCall::new(&self.seat, self.unit.clone()),
                        ))]))
                    }
                }
            }
            State::AwaitProducer => {
                let result = stepped(answers, 1)?.remove(0);
                self.after_producer(result)
            }
            State::AwaitVerify => {
                let answer = stepped(answers, 1)?.remove(0);
                let result = verify_seat_result(Some(&answer), 1);
                Ok(self.finish_verified(result))
            }
            State::Finished => Err(SeatResolutionError::new(
                "the loop already ended",
                "loop-ended",
            )),
        }
    }

    fn after_producer(&mut self, result: Value) -> Result<Step, SeatResolutionError> {
        self.results.push(result.clone());
        if outcome_of(&result) != "pass" || verify_command_of(&self.unit, &self.cfg).is_none() {
            self.state = State::Finished;
            return Ok(Step::Done(LoopResult {
                outcome: outcome_of(&result).to_string(),
                rounds: Some(1),
                results: self.results.clone(),
                findings: None,
            }));
        }
        let existing = self
            .history
            .iter()
            .find(|h| {
                super::seat_is(h, VERIFY_SEAT) && super::round_is(h, 1) && outcome_of(h) == "pass"
            })
            .cloned();
        match existing {
            Some(verified) => Ok(self.finish_verified(verified)),
            None => {
                self.state = State::AwaitVerify;
                Ok(Step::Dispatch(vec![Command::Verify { round: 1 }]))
            }
        }
    }

    fn finish_verified(&mut self, verified: Value) -> Step {
        self.state = State::Finished;
        let findings =
            (outcome_of(&verified) == "findings").then(|| super::list_of(verified.get("findings")));
        self.results.push(verified.clone());
        Step::Done(LoopResult {
            outcome: outcome_of(&verified).to_string(),
            rounds: Some(1),
            results: self.results.clone(),
            findings,
        })
    }
}
